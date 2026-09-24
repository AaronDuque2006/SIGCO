import { z } from "zod";

// Fase 2 — RAG (CONTEXTO_PROYECTO.md §16).

export const consultaRagSchema = z.object({
  pregunta: z.string().trim().min(3, "La pregunta es muy corta").max(1000, "La pregunta es muy larga"),
});
export type ConsultaRagInput = z.infer<typeof consultaRagSchema>;

export const documentoRagIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const valoracionRagSchema = z.object({
  util: z.boolean(),
  comentario: z.string().trim().max(500, "El comentario es muy largo").nullish(),
});
export type ValoracionRagInput = z.infer<typeof valoracionRagSchema>;

export const listarValoracionesRagQuerySchema = z.object({
  util: z.enum(["true", "false"]).optional().transform((v) => (v === undefined ? undefined : v === "true")),
});
