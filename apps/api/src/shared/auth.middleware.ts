import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { autorizacionRepository } from "../modules/auth/repositories/autorizacion.repository.js";
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

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new UnauthorizedError());
    return;
  }

  try {
    const payload = jwt.verify(header.slice("Bearer ".length), env.JWT_SECRET);
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
      next(permitido ? undefined : new ForbiddenError(`No puede editar ${nombreDepartamento}`));
    } catch (err) {
      next(err);
    }
  };

export function usuarioActual(req: Request): UsuarioAutenticado {
  if (!req.usuario) throw new UnauthorizedError();
  return req.usuario;
}
