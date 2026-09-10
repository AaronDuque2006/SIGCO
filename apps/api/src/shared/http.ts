import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ApiErrorBody, Paginated, PaginationMeta } from "@sicog/shared-types";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { AppError, ValidationError } from "./errors.js";

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

// Validación en el borde: de acá para adentro Service y Repository confían en los tipos.
export function parseOrThrow<T extends ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError("Datos inválidos", result.error.flatten());
  }
  return result.data;
}

export function paginate<T>(data: T[], totalItems: number, page: number, pageSize: number): Paginated<T> {
  const meta: PaginationMeta = {
    page,
    pageSize,
    totalItems,
    totalPages: pageSize > 0 ? Math.ceil(totalItems / pageSize) : 1,
  };
  return { data, pagination: meta };
}

// Una sola página con todo: la forma de la respuesta no cambia según se haya
// pedido paginación o no (ver sección 11.1 de CONTEXTO_PROYECTO.md).
export function singlePage<T>(data: T[]): Paginated<T> {
  return paginate(data, data.length, 1, data.length || 1);
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    const body: ApiErrorBody = {
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    };
    res.status(err.status).json(body);
    return;
  }

  if (err instanceof ZodError) {
    const body: ApiErrorBody = {
      error: { code: "VALIDATION_ERROR", message: "Datos inválidos", details: err.flatten() },
    };
    res.status(422).json(body);
    return;
  }

  // Nunca exponer el detalle interno al cliente: se registra del lado del servidor.
  console.error("Error no controlado:", err);
  const body: ApiErrorBody = {
    error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" },
  };
  res.status(500).json(body);
}

export function notFoundHandler(_req: Request, res: Response): void {
  const body: ApiErrorBody = { error: { code: "NOT_FOUND", message: "Ruta no encontrada" } };
  res.status(404).json(body);
}
