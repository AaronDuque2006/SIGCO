import { prisma } from "../../../shared/prisma-client.js";

export interface UsuarioAuth {
  id: number;
  nombre: string;
  passwordHash: string;
  bloqueado: boolean;
  puesto: string;
  departamento: string | null;
  departamentosCubiertos: string[];
}

export interface SesionEncontrada {
  id: bigint;
  usuarioId: number;
  expiraEn: Date;
  revocadoEn: Date | null;
}

export interface ISesionRepository {
  buscarUsuarioPorNombre(nombre: string): Promise<UsuarioAuth | null>;
  buscarUsuarioPorId(id: number): Promise<UsuarioAuth | null>;
  crearSesion(input: {
    usuarioId: number;
    tokenHash: string;
    expiraEn: Date;
    ip: string | null;
    userAgent: string | null;
  }): Promise<void>;
  buscarSesionPorHash(tokenHash: string): Promise<SesionEncontrada | null>;
  revocarSesion(id: bigint): Promise<void>;
  revocarTodasLasSesiones(usuarioId: number): Promise<number>;
  registrarLogin(input: {
    usuarioId: number | null;
    nombre: string;
    exitoso: boolean;
    ip: string;
  }): Promise<void>;
  registrarIntentoNoAutorizado(input: {
    usuarioId: number;
    ruta: string;
    motivo: string;
    ip: string;
  }): Promise<void>;
}

const seleccionUsuario = {
  id: true,
  nombre: true,
  passwordHash: true,
  bloqueado: true,
  puesto: { select: { nombre: true } },
  departamento: { select: { nombre: true } },
  superintendencias: { select: { departamento: { select: { nombre: true } } } },
};

type FilaUsuario = {
  id: number;
  nombre: string;
  passwordHash: string;
  bloqueado: boolean;
  puesto: { nombre: string };
  departamento: { nombre: string } | null;
  superintendencias: { departamento: { nombre: string } }[];
};

const aUsuarioAuth = (u: FilaUsuario): UsuarioAuth => ({
  id: u.id,
  nombre: u.nombre,
  passwordHash: u.passwordHash,
  bloqueado: u.bloqueado,
  puesto: u.puesto.nombre,
  departamento: u.departamento?.nombre ?? null,
  departamentosCubiertos: u.superintendencias.map((s) => s.departamento.nombre),
});

export class PrismaSesionRepository implements ISesionRepository {
  async buscarUsuarioPorNombre(nombre: string): Promise<UsuarioAuth | null> {
    const u = await prisma.usuario.findUnique({ where: { nombre }, select: seleccionUsuario });
    return u ? aUsuarioAuth(u) : null;
  }

  async buscarUsuarioPorId(id: number): Promise<UsuarioAuth | null> {
    const u = await prisma.usuario.findUnique({ where: { id }, select: seleccionUsuario });
    return u ? aUsuarioAuth(u) : null;
  }

  async crearSesion(input: {
    usuarioId: number;
    tokenHash: string;
    expiraEn: Date;
    ip: string | null;
    userAgent: string | null;
  }): Promise<void> {
    await prisma.sesionRefresh.create({ data: input });
  }

  async buscarSesionPorHash(tokenHash: string): Promise<SesionEncontrada | null> {
    return prisma.sesionRefresh.findUnique({
      where: { tokenHash },
      select: { id: true, usuarioId: true, expiraEn: true, revocadoEn: true },
    });
  }

  async revocarSesion(id: bigint): Promise<void> {
    await prisma.sesionRefresh.update({ where: { id }, data: { revocadoEn: new Date() } });
  }

  // Se usa ante un reuso de refresh token: si un token ya revocado vuelve a
  // aparecer, se asume robo y se cierran todas las sesiones del usuario.
  async revocarTodasLasSesiones(usuarioId: number): Promise<number> {
    const { count } = await prisma.sesionRefresh.updateMany({
      where: { usuarioId, revocadoEn: null },
      data: { revocadoEn: new Date() },
    });
    return count;
  }

  async registrarLogin(input: {
    usuarioId: number | null;
    nombre: string;
    exitoso: boolean;
    ip: string;
  }): Promise<void> {
    await prisma.logLogin.create({ data: input });
  }

  async registrarIntentoNoAutorizado(input: {
    usuarioId: number;
    ruta: string;
    motivo: string;
    ip: string;
  }): Promise<void> {
    await prisma.logIntentoNoAutorizado.create({ data: input });
  }
}

export const sesionRepository = new PrismaSesionRepository();
