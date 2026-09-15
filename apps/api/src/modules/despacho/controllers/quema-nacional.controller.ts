import type { Request, Response } from "express";
import {
  bigIntIdParamSchema,
  createQuemaNacionalSchema,
  getQuemaNacionalQuerySchema,
  paginationQuerySchema,
  updateQuemaNacionalSchema,
} from "@sicog/shared-validators";
import { usuarioActual } from "../../../shared/auth.middleware.js";
import { parseOrThrow } from "../../../shared/http.js";
import { quemaNacionalService } from "../services/quema-nacional.service.js";

export const obtenerDelDia = async (req: Request, res: Response): Promise<void> => {
  const { fecha, tipoCorte } = parseOrThrow(getQuemaNacionalQuerySchema, req.query);
  res.json(await quemaNacionalService.obtenerDelDia(fecha, tipoCorte));
};

export const registrar = async (req: Request, res: Response): Promise<void> => {
  const input = parseOrThrow(createQuemaNacionalSchema, req.body);
  const quema = await quemaNacionalService.registrar(input, usuarioActual(req).id);
  res.status(201).json(quema);
};

export const corregir = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  const { mmpced } = parseOrThrow(updateQuemaNacionalSchema, req.body);
  res.json(await quemaNacionalService.corregir(BigInt(id), mmpced, usuarioActual(req).id));
};

export const listarHistorial = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  const { page, pageSize } = parseOrThrow(paginationQuerySchema, req.query);
  res.json(await quemaNacionalService.obtenerHistorial(BigInt(id), page, pageSize));
};
