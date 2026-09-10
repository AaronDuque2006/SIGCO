import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { UsuarioSesionDto } from "@sicog/shared-types";
import { env } from "../../../shared/env.js";
import { ForbiddenError, UnauthorizedError } from "../../../shared/errors.js";
import {
  sesionRepository,
  type ISesionRepository,
  type UsuarioAuth,
} from "../repositories/sesion.repository.js";

export const ACCESS_TTL_SEGUNDOS = 15 * 60;
export const REFRESH_TTL_SEGUNDOS = 7 * 24 * 60 * 60;

// Hash de descarte con el mismo costo que los reales. Se compara contra él
// cuando el usuario no existe, para que un atacante no distinga "no existe"
// de "contraseña equivocada" por el tiempo que tarda la respuesta.
const HASH_SEÑUELO = bcrypt.hashSync("usuario-inexistente", 12);

// El refresh es un token aleatorio de alta entropía, no una contraseña: se
// guarda con SHA-256, no con bcrypt. bcrypt existe para hacer lento el ataque
// por diccionario contra secretos que las personas eligen; acá no aplica y
// sólo costaría latencia en cada refresh.
const hashRefresh = (token: string): string => createHash("sha256").update(token).digest("hex");

export interface ParDeTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiraEn: Date;
}

export interface ResultadoSesion {
  usuario: UsuarioSesionDto;
  tokens: ParDeTokens;
}

export interface DatosPeticion {
  ip: string;
  userAgent: string | null;
}

const aDto = (u: UsuarioAuth): UsuarioSesionDto => ({
  id: u.id,
  nombre: u.nombre,
  puesto: u.puesto,
  departamento: u.departamento,
  departamentosQueEdita:
    u.puesto === "Gerente"
      ? ["Despacho", "Mantenimiento", "Análisis Operacional", "Calidad de Gas"]
      : [...new Set([u.departamento, ...u.departamentosCubiertos].filter((d): d is string => !!d))],
});

export class AuthService {
  constructor(private readonly repo: ISesionRepository) {}

  async login(nombre: string, password: string, pedido: DatosPeticion): Promise<ResultadoSesion> {
    const usuario = await this.repo.buscarUsuarioPorNombre(nombre);

    // Siempre se ejecuta un bcrypt.compare, exista el usuario o no.
    const correcta = await bcrypt.compare(password, usuario?.passwordHash ?? HASH_SEÑUELO);

    if (!usuario || !correcta) {
      await this.repo.registrarLogin({
        usuarioId: usuario?.id ?? null,
        nombre,
        exitoso: false,
        ip: pedido.ip,
      });
      // Mismo mensaje en ambos casos: decir "ese usuario no existe" le
      // regalaría a un atacante la lista de nombres válidos.
      throw new UnauthorizedError("Usuario o contraseña inválidos");
    }

    // Recién acá se revela que la cuenta está bloqueada: quien no tiene la
    // contraseña no puede usar este mensaje para averiguar si el usuario existe.
    if (usuario.bloqueado) {
      await this.repo.registrarLogin({ usuarioId: usuario.id, nombre, exitoso: false, ip: pedido.ip });
      throw new ForbiddenError("Cuenta bloqueada. Contacte al administrador del sistema.");
    }

    await this.repo.registrarLogin({ usuarioId: usuario.id, nombre, exitoso: true, ip: pedido.ip });
    return { usuario: aDto(usuario), tokens: await this.emitirTokens(usuario, pedido) };
  }

  // Rotación con detección de reuso: cada refresh emite un par nuevo y revoca
  // el anterior. Si aparece un refresh ya revocado, se asume que fue robado y
  // se cierran todas las sesiones del usuario.
  async refrescar(refreshToken: string, pedido: DatosPeticion): Promise<ResultadoSesion> {
    const sesion = await this.repo.buscarSesionPorHash(hashRefresh(refreshToken));
    if (!sesion) throw new UnauthorizedError("Sesión inválida");

    if (sesion.revocadoEn !== null) {
      const cerradas = await this.repo.revocarTodasLasSesiones(sesion.usuarioId);
      console.warn(
        `[auth] Reuso de refresh token del usuario ${sesion.usuarioId} desde ${pedido.ip}: ${cerradas} sesiones cerradas`,
      );
      throw new UnauthorizedError("Sesión inválida");
    }

    if (sesion.expiraEn.getTime() <= Date.now()) {
      await this.repo.revocarSesion(sesion.id);
      throw new UnauthorizedError("Sesión expirada");
    }

    const usuario = await this.repo.buscarUsuarioPorId(sesion.usuarioId);
    if (!usuario) throw new UnauthorizedError("Sesión inválida");
    // Bloquear a alguien debe cortarle el acceso sin esperar a que expire.
    if (usuario.bloqueado) {
      await this.repo.revocarTodasLasSesiones(usuario.id);
      throw new ForbiddenError("Cuenta bloqueada. Contacte al administrador del sistema.");
    }

    await this.repo.revocarSesion(sesion.id);
    return { usuario: aDto(usuario), tokens: await this.emitirTokens(usuario, pedido) };
  }

  async cerrarSesion(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    const sesion = await this.repo.buscarSesionPorHash(hashRefresh(refreshToken));
    if (sesion && sesion.revocadoEn === null) await this.repo.revocarSesion(sesion.id);
  }

  async sesionActual(usuarioId: number): Promise<UsuarioSesionDto> {
    const usuario = await this.repo.buscarUsuarioPorId(usuarioId);
    if (!usuario || usuario.bloqueado) throw new UnauthorizedError();
    return aDto(usuario);
  }

  private async emitirTokens(usuario: UsuarioAuth, pedido: DatosPeticion): Promise<ParDeTokens> {
    const accessToken = jwt.sign({ sub: String(usuario.id), nombre: usuario.nombre }, env.JWT_SECRET, {
      expiresIn: ACCESS_TTL_SEGUNDOS,
    });
    const refreshToken = randomBytes(32).toString("base64url");
    const refreshExpiraEn = new Date(Date.now() + REFRESH_TTL_SEGUNDOS * 1000);

    await this.repo.crearSesion({
      usuarioId: usuario.id,
      tokenHash: hashRefresh(refreshToken),
      expiraEn: refreshExpiraEn,
      ip: pedido.ip,
      userAgent: pedido.userAgent,
    });

    return { accessToken, refreshToken, refreshExpiraEn };
  }
}

export const authService = new AuthService(sesionRepository);
