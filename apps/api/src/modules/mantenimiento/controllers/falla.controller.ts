import type { Request, Response } from "express";
import {
  bigIntIdParamSchema,
  createFallaSchema,
  disponibilidadQuerySchema,
  listFallasQuerySchema,
  paginationQuerySchema,
  resolverFallaSchema,
  serieDisponibilidadQuerySchema,
  updateFallaSchema,
} from "@sicog/shared-validators";
import { paginate, parseOrThrow } from "../../../shared/http.js";
import { usuarioActual } from "../../../shared/auth.middleware.js";
import { fallaService as servicio } from "../services/falla.service.js";

export async function listarFallas(req: Request, res: Response): Promise<void> {
  const filtros = parseOrThrow(listFallasQuerySchema, req.query);
  const { items, total } = await servicio.listar(filtros);
  res.json(paginate(items, total, filtros.page, filtros.pageSize));
}

export async function obtenerFalla(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  res.json(await servicio.obtener(BigInt(id)));
}

export async function crearFalla(req: Request, res: Response): Promise<void> {
  const datos = parseOrThrow(createFallaSchema, req.body);
  res.status(201).json(await servicio.crear({ ...datos, usuarioId: usuarioActual(req).id }));
}

export async function actualizarFalla(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  const datos = parseOrThrow(updateFallaSchema, req.body);
  res.json(await servicio.actualizar(BigInt(id), datos, usuarioActual(req).id));
}

export async function resolverFalla(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  const datos = parseOrThrow(resolverFallaSchema, req.body);
  res.json(await servicio.resolver(BigInt(id), datos, usuarioActual(req).id));
}

export async function listarHistorialFalla(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  const { page, pageSize } = parseOrThrow(paginationQuerySchema, req.query);
  res.json(await servicio.obtenerHistorial(BigInt(id), page, pageSize));
}

export async function disponibilidad(req: Request, res: Response): Promise<void> {
  const { fecha } = parseOrThrow(disponibilidadQuerySchema, req.query);
  res.json(await servicio.disponibilidad(fecha));
}

export async function serieDisponibilidad(req: Request, res: Response): Promise<void> {
  const { anio } = parseOrThrow(serieDisponibilidadQuerySchema, req.query);
  res.json(await servicio.serie(anio));
}
