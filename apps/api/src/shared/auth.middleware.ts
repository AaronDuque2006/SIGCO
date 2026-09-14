import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { autorizacionRepository } from "../modules/auth/repositories/autorizacion.repository.js";
import { sesionRepository } from "../modules/auth/repositories/sesion.repository.js";
import { env } from "./env.js";
import { ForbiddenError, UnauthorizedError } from "./errors.js";

export interface UsuarioAutenticado {
  id: number;
  nombre: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}

const payloadSchema = (value: unknown): UsuarioAutenticado | null => {
  if (typeof value !== "object" || value === null) return null;
  const { sub, nombre } = value as Record<string, unknown>;
  const id = Number(sub);
  if (!Number.isInteger(id) || id <= 0 || typeof nombre !== "string") return null;
  return { id, nombre };
};

// El access token viaja en una cookie httpOnly (así JavaScript nunca lo toca).
// Se acepta además el header Authorization porque es lo práctico para pruebas
// y para clientes que no son un navegador.
function extraerToken(req: Request): string | null {
  const cookie = (req.cookies as Record<string, unknown> | undefined)?.["sicog_access"];
  if (typeof cookie === "string" && cookie.length > 0) return cookie;
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
}

// Momento de emisión del token, en milisegundos. El `iat` estándar viene en
// segundos enteros y esa granularidad no alcanza acá: cambiar la contraseña
// sella la revocación y emite el token nuevo dentro del mismo segundo, así
// que comparar por segundo mataría la sesión que se acaba de entregar. Por eso
// se firma además `iatMs`; `iat` queda de respaldo para tokens ya emitidos.
const emitidoEnMs = (value: unknown): number | null => {
  if (typeof value !== "object" || value === null) return null;
  const { iatMs, iat } = value as Record<string, unknown>;
  if (typeof iatMs === "number") return iatMs;
  return typeof iat === "number" ? iat * 1000 : null;
};

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = extraerToken(req);
  if (!token) {
    next(new UnauthorizedError());
    return;
  }

  let usuario: UsuarioAutenticado;
  let emitido: number | null;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const leido = payloadSchema(payload);
    if (!leido) {
      next(new UnauthorizedError("Token con contenido inválido"));
      return;
    }
    usuario = leido;
    emitido = emitidoEnMs(payload);
  } catch {
    // No distinguir "expirado" de "inválido" hacia afuera, ni loguear el token.
    next(new UnauthorizedError("Token inválido o expirado"));
    return;
  }

  // Revocar el refresh no alcanza: el access token ya emitido no se puede
  // retirar. Se compara contra el sello del usuario y se responde igual que
  // ante un token vencido, para no revelar que la sesión fue revocada.
  try {
    const sello = await autorizacionRepository.sesionesInvalidasAntesDe(usuario.id);
    if (sello !== null && (emitido === null || emitido < sello.getTime())) {
      next(new UnauthorizedError("Token inválido o expirado"));
      return;
    }
  } catch (err) {
    next(err);
    return;
  }

  req.usuario = usuario;
  next();
};

// La autorización se resuelve siempre contra la BD, nunca contra el token
// (decisión #22: consultar cualquier departamento, editar sólo el propio).
export const requireDepartamento =
  (nombreDepartamento: string) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.usuario) {
      next(new UnauthorizedError());
      return;
    }
    try {
      const permitido = await autorizacionRepository.puedeEditarDepartamento(
        req.usuario.id,
        nombreDepartamento,
      );
      if (permitido) {
        next();
        return;
      }
      // Auditoría de seguridad (§3): queda registro de quién intentó qué.
      await sesionRepository.registrarIntentoNoAutorizado({
        usuarioId: req.usuario.id,
        ruta: `${req.method} ${req.originalUrl}`,
        motivo: `No pertenece a ${nombreDepartamento} ni lo cubre`,
        ip: req.ip ?? "desconocida",
      });
      next(new ForbiddenError(`No puede editar ${nombreDepartamento}`));
    } catch (err) {
      next(err);
    }
  };

// Gestión de usuarios: exclusiva del superadmin, sin auto-registro
// (decisión #11). Mismo criterio que requireDepartamento — se resuelve contra
// la BD y deja registro del 403 en LOG_INTENTO_NO_AUTORIZADO.
export const requireSuperadmin = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.usuario) {
    next(new UnauthorizedError());
    return;
  }
  try {
    if (await autorizacionRepository.esSuperadmin(req.usuario.id)) {
      next();
      return;
    }
    await sesionRepository.registrarIntentoNoAutorizado({
      usuarioId: req.usuario.id,
      ruta: `${req.method} ${req.originalUrl}`,
      motivo: "No es superadmin",
      ip: req.ip ?? "desconocida",
    });
    next(new ForbiddenError("Sólo el superadmin puede administrar usuarios"));
  } catch (err) {
    next(err);
  }
};

// Mientras la persona siga con la contraseña temporal, su sesión no puede
// hacer nada salvo cambiarla (decisión #54). Se verifica acá y no sólo en el
// frontend porque `UsuarioSesionDto.debeCambiarPassword` es una pista para la
// UI, no una defensa. No se monta sobre /api/auth: cambiar la contraseña y
// consultar la sesión tienen que seguir funcionando en ese estado.
export const requirePasswordVigente = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.usuario) {
    next(new UnauthorizedError());
    return;
  }
  try {
    const estado = await autorizacionRepository.estadoPassword(req.usuario.id);
    if (!estado) {
      next(new UnauthorizedError());
      return;
    }
    // La vigencia se revisa en cada petición, no sólo al iniciar sesión: si
    // sólo se mirara en el login, entrar un minuto antes del vencimiento
    // dejaría una sesión válida por los 7 días del refresh.
    if (estado.expiraEn !== null && estado.expiraEn.getTime() <= Date.now()) {
      next(new ForbiddenError("La contraseña temporal venció. Solicite un reinicio al administrador."));
      return;
    }
    if (estado.debeCambiar) {
      next(new ForbiddenError("Debe cambiar su contraseña temporal antes de usar el sistema."));
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
};

export function usuarioActual(req: Request): UsuarioAutenticado {
  if (!req.usuario) throw new UnauthorizedError();
  return req.usuario;
}
