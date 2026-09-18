import type { Request, Response } from "express";
import {
  createGerenciaRequirienteSchema,
  createInsumoSchema,
  createProductoServicioSchema,
  listCatalogoActividadesQuerySchema,
  updateGerenciaRequirienteSchema,
  updateInsumoSchema,
  updateProductoServicioSchema,
} from "@sicog/shared-validators";
import { idParamSchema } from "@sicog/shared-validators";
import { parseOrThrow, singlePage } from "../../../shared/http.js";
import { catalogoActividadesService as servicio } from "../services/catalogo.service.js";

// Los catálogos no se paginan —son decenas de filas, no miles— pero la
// respuesta viaja envuelta igual: la forma no cambia según el endpoint.

export async function listarInsumos(req: Request, res: Response): Promise<void> {
  const { departamentoId } = parseOrThrow(listCatalogoActividadesQuerySchema, req.query);
  res.json(singlePage(await servicio.listarInsumos(departamentoId)));
}

export async function crearInsumo(req: Request, res: Response): Promise<void> {
  const datos = parseOrThrow(createInsumoSchema, req.body);
  res.status(201).json(await servicio.crearInsumo(datos));
}

export async function actualizarInsumo(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const datos = parseOrThrow(updateInsumoSchema, req.body);
  res.json(await servicio.actualizarInsumo(id, datos));
}

export async function listarProductos(req: Request, res: Response): Promise<void> {
  const filtros = parseOrThrow(listCatalogoActividadesQuerySchema, req.query);
  res.json(singlePage(await servicio.listarProductos(filtros)));
}

export async function crearProducto(req: Request, res: Response): Promise<void> {
  const datos = parseOrThrow(createProductoServicioSchema, req.body);
  res.status(201).json(await servicio.crearProducto(datos));
}

export async function actualizarProducto(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const datos = parseOrThrow(updateProductoServicioSchema, req.body);
  res.json(await servicio.actualizarProducto(id, datos));
}

export async function listarGerencias(req: Request, res: Response): Promise<void> {
  const { departamentoId } = parseOrThrow(listCatalogoActividadesQuerySchema, req.query);
  res.json(singlePage(await servicio.listarGerencias(departamentoId)));
}

export async function crearGerencia(req: Request, res: Response): Promise<void> {
  const datos = parseOrThrow(createGerenciaRequirienteSchema, req.body);
  res.status(201).json(await servicio.crearGerencia(datos));
}

export async function actualizarGerencia(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const datos = parseOrThrow(updateGerenciaRequirienteSchema, req.body);
  res.json(await servicio.actualizarGerencia(id, datos));
}

export async function listarRegiones(_req: Request, res: Response): Promise<void> {
  res.json(singlePage(await servicio.listarRegiones()));
}
