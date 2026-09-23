import type { Request, Response } from "express";
import {
  bigIntIdParamSchema,
  createQuemaNacionalSchema,
  getQuemaNacionalQuerySchema,
  editarHistorialSchema,
  editarValorVigenteSchema,
  paginationQuerySchema,
  updateQuemaNacionalSchema,
} from "@sicog/shared-validators";
import { z } from "zod";
import { usuarioActual } from "../../../shared/auth.middleware.js";
import { parseOrThrow } from "../../../shared/http.js";
import { quemaNacionalService } from "../services/quema-nacional.service.js";

const historialParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "id inválido"),
  historialId: z.string().regex(/^\d+$/, "id inválido"),
});

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
  const { mmpced, horaLectura } = parseOrThrow(updateQuemaNacionalSchema, req.body);
  res.json(
    await quemaNacionalService.corregir(BigInt(id), mmpced, horaLectura, usuarioActual(req).id),
  );
};

export const listarHistorial = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  const { page, pageSize } = parseOrThrow(paginationQuerySchema, req.query);
  res.json(await quemaNacionalService.obtenerHistorial(BigInt(id), page, pageSize));
};

export const editarHistorial = async (req: Request, res: Response): Promise<void> => {
  const { historialId } = parseOrThrow(historialParamSchema, req.params);
  const { valorAnterior } = parseOrThrow(editarHistorialSchema, req.body);
  await quemaNacionalService.editarHistorial(BigInt(historialId), valorAnterior, usuarioActual(req).id);
  res.status(204).send();
};

// Pisa el valor vigente en el lugar, sin registrar corrección — el `PATCH` de
// arriba es el camino auditado, éste es el arreglo de un número mal tecleado.
export const editarValorVigente = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  const { valor } = parseOrThrow(editarValorVigenteSchema, req.body);
  await quemaNacionalService.editarValorVigente(BigInt(id), valor, usuarioActual(req).id);
  res.status(204).send();
};
