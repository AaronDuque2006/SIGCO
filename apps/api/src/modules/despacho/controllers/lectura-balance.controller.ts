import type { Request, Response } from "express";
import {
  bigIntIdParamSchema,
  createLecturaBalanceSchema,
  listLecturasBalanceQuerySchema,
  paginationQuerySchema,
  updateLecturaBalanceSchema,
} from "@sicog/shared-validators";
import { usuarioActual } from "../../../shared/auth.middleware.js";
import { parseOrThrow } from "../../../shared/http.js";
import { lecturaBalanceService } from "../services/lectura-balance.service.js";

export const listarGrilla = async (req: Request, res: Response): Promise<void> => {
  const query = parseOrThrow(listLecturasBalanceQuerySchema, req.query);
  res.json(await lecturaBalanceService.obtenerGrilla(query));
};

export const registrar = async (req: Request, res: Response): Promise<void> => {
  const input = parseOrThrow(createLecturaBalanceSchema, req.body);
  const lectura = await lecturaBalanceService.registrar(input, usuarioActual(req).id);
  res.status(201).json(lectura);
};

export const corregir = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  const { volumenMmpced } = parseOrThrow(updateLecturaBalanceSchema, req.body);
  res.json(await lecturaBalanceService.corregir(BigInt(id), volumenMmpced, usuarioActual(req).id));
};

export const listarHistorial = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  const { page, pageSize } = parseOrThrow(paginationQuerySchema, req.query);
  res.json(await lecturaBalanceService.obtenerHistorial(BigInt(id), page, pageSize));
};
