import type { Request, Response } from "express";
import { reporteQuerySchema, serieBalanceQuerySchema } from "@sicog/shared-validators";
import { parseOrThrow } from "../../../shared/http.js";
import { reportesService } from "../services/reportes.service.js";

export const consumoPorSectores = async (req: Request, res: Response): Promise<void> => {
  const { fecha, tipoCorte } = parseOrThrow(reporteQuerySchema, req.query);
  res.json(await reportesService.consumoPorSectores(fecha, tipoCorte));
};

export const serieBalance = async (req: Request, res: Response): Promise<void> => {
  const { hasta, dias, tipoCorte } = parseOrThrow(serieBalanceQuerySchema, req.query);
  res.json(await reportesService.serieBalance(hasta, dias, tipoCorte));
};
