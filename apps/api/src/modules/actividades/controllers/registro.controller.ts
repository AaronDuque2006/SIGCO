import type { Request, Response } from "express";
import { z } from "zod";
import {
  bigIntIdParamSchema,
  createActividadRegistroSchema,
  listActividadRegistrosQuerySchema,
  paginationQuerySchema,
  updateActividadRegistroSchema,
} from "@sicog/shared-validators";
import { usuarioActual } from "../../../shared/auth.middleware.js";
import { parseOrThrow, singlePage } from "../../../shared/http.js";
import { registroActividadService as servicio } from "../services/registro.service.js";

export async function listar(req: Request, res: Response): Promise<void> {
  const filtros = parseOrThrow(listActividadRegistrosQuerySchema, req.query);
  res.json(await servicio.listar(filtros));
}

export async function obtener(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  res.json(await servicio.obtener(BigInt(id)));
}

export async function crear(req: Request, res: Response): Promise<void> {
  const datos = parseOrThrow(createActividadRegistroSchema, req.body);
  res.status(201).json(await servicio.crear(usuarioActual(req).id, datos));
}

export async function actualizar(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  const datos = parseOrThrow(updateActividadRegistroSchema, req.body);
  res.json(await servicio.actualizar(usuarioActual(req).id, BigInt(id), datos));
}

export async function listarHistorial(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  const { page, pageSize } = parseOrThrow(paginationQuerySchema, req.query);
  res.json(await servicio.obtenerHistorial(BigInt(id), page, pageSize));
}

const responsablesQuerySchema = z.object({
  departamentoId: z.coerce.number().int().positive(),
});

export async function responsables(req: Request, res: Response): Promise<void> {
  const { departamentoId } = parseOrThrow(responsablesQuerySchema, req.query);
  res.json(singlePage(await servicio.responsables(departamentoId)));
}
