import type { Request, Response } from "express";
import {
  createContactoSchema,
  idParamSchema,
  listContactosQuerySchema,
  updateContactoSchema,
} from "@sicog/shared-validators";
import { parseOrThrow } from "../../../shared/http.js";
import { contactoService } from "../services/contacto.service.js";

export const listar = async (req: Request, res: Response): Promise<void> => {
  const query = parseOrThrow(listContactosQuerySchema, req.query);
  res.json(await contactoService.listar(query));
};

export const obtener = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  res.json(await contactoService.obtener(id));
};

export const crear = async (req: Request, res: Response): Promise<void> => {
  const input = parseOrThrow(createContactoSchema, req.body);
  res.status(201).json(await contactoService.crear(input));
};

export const actualizar = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const input = parseOrThrow(updateContactoSchema, req.body);
  res.json(await contactoService.actualizar(id, input));
};

// 204 sin cuerpo: no queda nada que devolver.
export const eliminar = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  await contactoService.eliminar(id);
  res.status(204).end();
};
