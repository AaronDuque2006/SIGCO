import type { Request, Response } from "express";
import { reporteQuerySchema } from "@sicog/shared-validators";
import { parseOrThrow } from "../../../shared/http.js";
import { balanceNacionService } from "../services/balance-nacion.service.js";

export const balanceNacion = async (req: Request, res: Response): Promise<void> => {
  const { fecha, tipoCorte } = parseOrThrow(reporteQuerySchema, req.query);
  res.json(await balanceNacionService.obtener(fecha, tipoCorte));
};
