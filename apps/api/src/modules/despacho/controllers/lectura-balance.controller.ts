import type { Request, Response } from "express";
import {
  bigIntIdParamSchema,
  createLecturaBalanceSchema,
  listLecturasBalanceQuerySchema,
  editarHistorialSchema,
  editarValorVigenteSchema,
  paginationQuerySchema,
  updateLecturaBalanceSchema,
} from "@sicog/shared-validators";
import { z } from "zod";
import { usuarioActual } from "../../../shared/auth.middleware.js";
import { parseOrThrow } from "../../../shared/http.js";
import { lecturaBalanceService } from "../services/lectura-balance.service.js";

const historialParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "id inválido"),
  historialId: z.string().regex(/^\d+$/, "id inválido"),
});

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
  const { volumenMmpced, horaLectura } = parseOrThrow(updateLecturaBalanceSchema, req.body);
  res.json(
    await lecturaBalanceService.corregir(
      BigInt(id),
      volumenMmpced,
      horaLectura,
      usuarioActual(req).id,
    ),
  );
};

export const listarHistorial = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  const { page, pageSize } = parseOrThrow(paginationQuerySchema, req.query);
  res.json(await lecturaBalanceService.obtenerHistorial(BigInt(id), page, pageSize));
};

export const editarHistorial = async (req: Request, res: Response): Promise<void> => {
  const { historialId } = parseOrThrow(historialParamSchema, req.params);
  const { valorAnterior } = parseOrThrow(editarHistorialSchema, req.body);
  await lecturaBalanceService.editarHistorial(BigInt(historialId), valorAnterior, usuarioActual(req).id);
  res.status(204).send();
};

// Pisa el valor vigente en el lugar, sin registrar corrección — el `PATCH` de
// arriba es el camino auditado, éste es el arreglo de un número mal tecleado.
export const editarValorVigente = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  const { valor } = parseOrThrow(editarValorVigenteSchema, req.body);
  await lecturaBalanceService.editarValorVigente(BigInt(id), valor, usuarioActual(req).id);
  res.status(204).send();
};
