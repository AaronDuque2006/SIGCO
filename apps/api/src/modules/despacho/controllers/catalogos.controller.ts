import type { Request, Response } from "express";
import {
  createSectorClienteSchema,
  idParamSchema,
  updateSectorClienteSchema,
} from "@sicog/shared-validators";
import { parseOrThrow } from "../../../shared/http.js";
import { catalogosService } from "../services/catalogos.service.js";

export const listarSistemas = async (_req: Request, res: Response): Promise<void> => {
  res.json(await catalogosService.listarSistemas());
};

export const listarRegiones = async (_req: Request, res: Response): Promise<void> => {
  res.json(await catalogosService.listarRegiones());
};

export const listarSectores = async (_req: Request, res: Response): Promise<void> => {
  res.json(await catalogosService.listarSectores());
};

export const crearSector = async (req: Request, res: Response): Promise<void> => {
  const { nombre } = parseOrThrow(createSectorClienteSchema, req.body);
  res.status(201).json(await catalogosService.crearSector(nombre));
};

export const actualizarSector = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const datos = parseOrThrow(updateSectorClienteSchema, req.body);
  res.json(await catalogosService.actualizarSector(id, datos));
};
