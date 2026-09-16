import type { Request, Response } from "express";
import {
  bigIntIdParamSchema,
  createTransferenciaSchema,
  listTransferenciasQuerySchema,
  paginationQuerySchema,
  updateTransferenciaSchema,
} from "@sicog/shared-validators";
import { usuarioActual } from "../../../shared/auth.middleware.js";
import { parseOrThrow } from "../../../shared/http.js";
import { transferenciaService } from "../services/transferencia.service.js";

export const listarGrilla = async (req: Request, res: Response): Promise<void> => {
  const { fecha, tipoCorte } = parseOrThrow(listTransferenciasQuerySchema, req.query);
  res.json(await transferenciaService.obtenerGrilla(fecha, tipoCorte));
};

export const registrar = async (req: Request, res: Response): Promise<void> => {
  const input = parseOrThrow(createTransferenciaSchema, req.body);
  res.status(201).json(await transferenciaService.registrar(input, usuarioActual(req).id));
};

export const corregir = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  const { mmpced } = parseOrThrow(updateTransferenciaSchema, req.body);
  res.json(await transferenciaService.corregir(BigInt(id), mmpced, usuarioActual(req).id));
};

export const listarHistorial = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  const { page, pageSize } = parseOrThrow(paginationQuerySchema, req.query);
  res.json(await transferenciaService.obtenerHistorial(BigInt(id), page, pageSize));
};
