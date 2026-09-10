import type { NextFunction, Request, RequestHandler, Response } from "express";
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

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = extraerToken(req);
  if (!token) {
    next(new UnauthorizedError());
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const usuario = payloadSchema(payload);
    if (!usuario) {
      next(new UnauthorizedError("Token con contenido inválido"));
      return;
    }
    req.usuario = usuario;
    next();
  } catch {
    // No distinguir "expirado" de "inválido" hacia afuera, ni loguear el token.
    next(new UnauthorizedError("Token inválido o expirado"));
  }
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

export function usuarioActual(req: Request): UsuarioAutenticado {
  if (!req.usuario) throw new UnauthorizedError();
  return req.usuario;
}
