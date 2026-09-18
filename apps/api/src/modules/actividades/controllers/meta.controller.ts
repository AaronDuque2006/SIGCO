import type { Request, Response } from "express";
import {
  anioParamSchema,
  bigIntIdParamSchema,
  listMetasQuerySchema,
  participacionQuerySchema,
  planVsRealQuerySchema,
  reemplazarMetasSchema,
  updateMetaSchema,
} from "@sicog/shared-validators";
import { parseOrThrow } from "../../../shared/http.js";
import { metaActividadService as servicio } from "../services/meta.service.js";

export async function matriz(req: Request, res: Response): Promise<void> {
  const { anio, departamentoId } = parseOrThrow(listMetasQuerySchema, req.query);
  res.json(await servicio.matriz(anio, departamentoId));
}

export async function reemplazarAnio(req: Request, res: Response): Promise<void> {
  const { anio } = parseOrThrow(anioParamSchema, req.params);
  const datos = parseOrThrow(reemplazarMetasSchema, req.body);
  res.json(await servicio.reemplazarAnio(anio, datos));
}

export async function actualizarCelda(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  const datos = parseOrThrow(updateMetaSchema, req.body);
  res.json(await servicio.actualizarCelda(BigInt(id), datos));
}

export async function planVsReal(req: Request, res: Response): Promise<void> {
  const { anio, departamentoId } = parseOrThrow(planVsRealQuerySchema, req.query);
  res.json(await servicio.planVsReal(anio, departamentoId));
}

export async function participacion(req: Request, res: Response): Promise<void> {
  const { anio, mes, departamentoId } = parseOrThrow(participacionQuerySchema, req.query);
  res.json(await servicio.participacion(anio, mes, departamentoId));
}
