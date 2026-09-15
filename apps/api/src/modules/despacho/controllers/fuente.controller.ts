import type { Request, Response } from "express";
import {
  createFuenteSchema,
  idParamSchema,
  listFuentesQuerySchema,
  updateFuenteSchema,
} from "@sicog/shared-validators";
import { parseOrThrow } from "../../../shared/http.js";
import { fuenteService } from "../services/fuente.service.js";

export const listar = async (req: Request, res: Response): Promise<void> => {
  const query = parseOrThrow(listFuentesQuerySchema, req.query);
  res.json(await fuenteService.listar(query));
};

export const obtener = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  res.json(await fuenteService.obtener(id));
};

export const crear = async (req: Request, res: Response): Promise<void> => {
  const input = parseOrThrow(createFuenteSchema, req.body);
  res.status(201).json(await fuenteService.crear(input));
};

export const actualizar = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const input = parseOrThrow(updateFuenteSchema, req.body);
  res.json(await fuenteService.actualizar(id, input));
};
