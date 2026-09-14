import type { Request, Response } from "express";
import {
  bigIntIdParamSchema,
  createLecturaFuenteSchema,
  listLecturasFuenteQuerySchema,
  paginationQuerySchema,
  updateLecturaFuenteSchema,
} from "@sicog/shared-validators";
import { usuarioActual } from "../../../shared/auth.middleware.js";
import { parseOrThrow } from "../../../shared/http.js";
import { lecturaFuenteService } from "../services/lectura-fuente.service.js";

export const listarGrilla = async (req: Request, res: Response): Promise<void> => {
  const query = parseOrThrow(listLecturasFuenteQuerySchema, req.query);
  res.json(await lecturaFuenteService.obtenerGrilla(query));
};

export const registrar = async (req: Request, res: Response): Promise<void> => {
  const input = parseOrThrow(createLecturaFuenteSchema, req.body);
  const lectura = await lecturaFuenteService.registrar(input, usuarioActual(req).id);
  res.status(201).json(lectura);
};

export const corregir = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  const { volumenMmpced } = parseOrThrow(updateLecturaFuenteSchema, req.body);
  res.json(await lecturaFuenteService.corregir(BigInt(id), volumenMmpced, usuarioActual(req).id));
};

export const listarHistorial = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  const { page, pageSize } = parseOrThrow(paginationQuerySchema, req.query);
  res.json(await lecturaFuenteService.obtenerHistorial(BigInt(id), page, pageSize));
};
