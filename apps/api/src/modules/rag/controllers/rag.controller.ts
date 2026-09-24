import type { Request, Response } from "express";
import type { EventoConsultaRag } from "@sicog/shared-types";
import {
  bigIntIdParamSchema,
  consultaRagSchema,
  documentoRagIdSchema,
  listarValoracionesRagQuerySchema,
  valoracionRagSchema,
} from "@sicog/shared-validators";
import { usuarioActual } from "../../../shared/auth.middleware.js";
import { ValidationError } from "../../../shared/errors.js";
import { parseOrThrow } from "../../../shared/http.js";
import { consultaRagService } from "../services/consulta-rag.service.js";
import { documentoRagService } from "../services/documento-rag.service.js";

// ── Documentos (sólo superadmin, decisión #101) ──────────────────────────────

// El archivo llega como cuerpo binario, no multipart: un solo archivo por
// petición y sin dependencia nueva. El nombre viaja en un encabezado,
// codificado porque los nombres reales llevan tildes.
export const subir = async (req: Request, res: Response): Promise<void> => {
  if (!Buffer.isBuffer(req.body)) {
    throw new ValidationError("Se esperaba el archivo como application/octet-stream");
  }
  let nombre: string;
  try {
    nombre = decodeURIComponent(String(req.header("X-Nombre-Archivo") ?? ""));
  } catch {
    throw new ValidationError("Nombre de archivo mal codificado");
  }
  res.status(201).json(await documentoRagService.subir(req.body, nombre, usuarioActual(req).id));
};

export const listar = async (_req: Request, res: Response): Promise<void> => {
  res.json(await documentoRagService.listar());
};

export const eliminar = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(documentoRagIdSchema, req.params);
  await documentoRagService.eliminar(id);
  res.status(204).end();
};

export const reprocesar = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(documentoRagIdSchema, req.params);
  res.json(await documentoRagService.reprocesar(id));
};

// ── Consultas (cualquier usuario autenticado) ────────────────────────────────

/**
 * Responde en NDJSON, un evento por línea, a medida que el modelo escribe
 * (§16.5). Si el navegador corta, se aborta también la generación en Ollama:
 * no tiene sentido seguir ocupando la CPU para nadie.
 */
export const consultar = async (req: Request, res: Response): Promise<void> => {
  const { pregunta } = parseOrThrow(consultaRagSchema, req.body);
  const control = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) control.abort();
  });

  res.status(200);
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders();

  const enviar = (evento: EventoConsultaRag): void => {
    res.write(`${JSON.stringify(evento)}\n`);
  };

  try {
    for await (const evento of consultaRagService.responder(pregunta, usuarioActual(req).id, control.signal)) {
      if (control.signal.aborted) break;
      enviar(evento);
    }
  } catch (err) {
    // Los encabezados ya salieron con 200: el error va como un evento más.
    if (!control.signal.aborted) {
      console.error("[rag] Falló la consulta:", err);
      enviar({ tipo: "error", mensaje: "El asistente no está disponible en este momento. Intente de nuevo más tarde." });
    }
  }
  res.end();
};

// ── Valoraciones ("¿le sirvió?") ─────────────────────────────────────────────

export const valorar = async (req: Request, res: Response): Promise<void> => {
  const { id } = parseOrThrow(bigIntIdParamSchema, req.params);
  const input = parseOrThrow(valoracionRagSchema, req.body);
  await consultaRagService.valorar(BigInt(id), usuarioActual(req).id, input);
  res.status(204).end();
};

export const listarValoraciones = async (req: Request, res: Response): Promise<void> => {
  const { util } = parseOrThrow(listarValoracionesRagQuerySchema, req.query);
  res.json(await consultaRagService.listarValoraciones(util));
};
