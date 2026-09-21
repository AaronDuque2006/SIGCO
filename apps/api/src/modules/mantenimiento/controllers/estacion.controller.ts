import type { Request, Response } from "express";
import {
  createCausaFallaSchema,
  createEstacionSchema,
  idParamSchema,
  listAreasQuerySchema,
  listEstacionesQuerySchema,
  putInstrumentosSchema,
  updateCausaFallaSchema,
  updateEstacionSchema,
} from "@sicog/shared-validators";
import { paginate, parseOrThrow, singlePage } from "../../../shared/http.js";
import { estacionService as servicio } from "../services/estacion.service.js";

export async function listarEstaciones(req: Request, res: Response): Promise<void> {
  const filtros = parseOrThrow(listEstacionesQuerySchema, req.query);
  const { items, total } = await servicio.listar(filtros);
  res.json(paginate(items, total, filtros.page, filtros.pageSize));
}

export async function obtenerEstacion(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params);
  res.json(await servicio.obtener(id));
}

export async function crearEstacion(req: Request, res: Response): Promise<void> {
  const datos = parseOrThrow(createEstacionSchema, req.body);
  res.status(201).json(await servicio.crear(datos));
}

export async function actualizarEstacion(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const datos = parseOrThrow(updateEstacionSchema, req.body);
  res.json(await servicio.actualizar(id, datos));
}

export async function reemplazarInstrumentos(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const { instrumentos } = parseOrThrow(putInstrumentosSchema, req.body);
  res.json(await servicio.reemplazarInstrumentos(id, instrumentos));
}

export async function listarAreas(req: Request, res: Response): Promise<void> {
  const { regionId } = parseOrThrow(listAreasQuerySchema, req.query);
  res.json(singlePage(await servicio.listarAreas(regionId)));
}

export async function listarTiposInstrumento(_req: Request, res: Response): Promise<void> {
  res.json(singlePage(await servicio.listarTiposInstrumento()));
}

export async function listarCausas(_req: Request, res: Response): Promise<void> {
  res.json(singlePage(await servicio.listarCausas()));
}

export async function crearCausa(req: Request, res: Response): Promise<void> {
  const { nombre } = parseOrThrow(createCausaFallaSchema, req.body);
  res.status(201).json(await servicio.crearCausa(nombre));
}

export async function actualizarCausa(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const datos = parseOrThrow(updateCausaFallaSchema, req.body);
  res.json(await servicio.actualizarCausa(id, datos));
}
