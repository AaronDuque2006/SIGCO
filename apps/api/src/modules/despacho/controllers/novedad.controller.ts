import type { Request, Response } from "express";
import {
  bigIntIdParamSchema,
  createNovedadSchema,
  listNovedadesQuerySchema,
  updateNovedadSchema,
} from "@sicog/shared-validators";
import { usuarioActual } from "../../../shared/auth.middleware.js";
import { parseOrThrow } from "../../../shared/http.js";
import { novedadService } from "../services/novedad.service.js";

export const listar = async (req: Request, res: Response): Promise<void> => {
  const query = parseOrThrow(listNovedadesQuerySchema, req.query);
  res.json(await novedadService.listar(query));
};

export const listarTipos = async (_req: Request, res: Response): Promise<void> => {
  res.json(await novedadService.listarTipos());
};

export const obtener = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  res.json(await novedadService.obtener(BigInt(id)));
};

export const crear = async (req: Request, res: Response): Promise<void> => {
  const input = parseOrThrow(createNovedadSchema, req.body);
  res.status(201).json(await novedadService.crear(input, usuarioActual(req).id));
};

export const actualizar = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  const input = parseOrThrow(updateNovedadSchema, req.body);
  res.json(await novedadService.actualizar(BigInt(id), input, usuarioActual(req).id));
};
