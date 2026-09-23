import type { Request, Response } from "express";
import { reporteQuerySchema, serieBalanceQuerySchema } from "@sicog/shared-validators";
import { COOKIE_ACCESS } from "../../auth/controllers/auth.controller.js";
import { UnauthorizedError } from "../../../shared/errors.js";
import { parseOrThrow } from "../../../shared/http.js";
import { generarReportePdf } from "../services/reportes-pdf.service.js";
import { reportesService } from "../services/reportes.service.js";

export const consumoPorSectores = async (req: Request, res: Response): Promise<void> => {
  const { fecha, tipoCorte } = parseOrThrow(reporteQuerySchema, req.query);
  res.json(await reportesService.consumoPorSectores(fecha, tipoCorte));
};

export const serieBalance = async (req: Request, res: Response): Promise<void> => {
  const { hasta, dias, tipoCorte } = parseOrThrow(serieBalanceQuerySchema, req.query);
  res.json(await reportesService.serieBalance(hasta, dias, tipoCorte));
};

// `requireAuth` ya corrió (se monta para todo `despacho.routes.ts`), así que
// la cookie existe y es válida; se relee cruda acá porque es lo que hay que
// reenviarle a Puppeteer, no el usuario ya decodificado.
export const exportarPdf = async (req: Request, res: Response): Promise<void> => {
  const { fecha, tipoCorte } = parseOrThrow(reporteQuerySchema, req.query);
  const accessToken = (req.cookies as Record<string, unknown> | undefined)?.[COOKIE_ACCESS];
  if (typeof accessToken !== "string" || accessToken.length === 0) {
    throw new UnauthorizedError();
  }

  const pdf = await generarReportePdf(fecha, tipoCorte, accessToken);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="reporte-despacho-${fecha}-${tipoCorte.toLowerCase()}.pdf"`,
  );
  res.send(pdf);
};
