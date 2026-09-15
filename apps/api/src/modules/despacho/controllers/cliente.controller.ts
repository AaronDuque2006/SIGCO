import type { Request, Response } from "express";
import {
  createClienteSchema,
  idParamSchema,
  listClientesQuerySchema,
  updateClienteSchema,
} from "@sicog/shared-validators";
import { parseOrThrow } from "../../../shared/http.js";
import { clienteService } from "../services/cliente.service.js";

export const listar = async (req: Request, res: Response): Promise<void> => {
  const query = parseOrThrow(listClientesQuerySchema, req.query);
  res.json(await clienteService.listar(query));
};

export const obtener = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  res.json(await clienteService.obtener(id));
};

export const crear = async (req: Request, res: Response): Promise<void> => {
  const input = parseOrThrow(createClienteSchema, req.body);
  res.status(201).json(await clienteService.crear(input));
};

export const actualizar = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const input = parseOrThrow(updateClienteSchema, req.body);
  res.json(await clienteService.actualizar(id, input));
};
