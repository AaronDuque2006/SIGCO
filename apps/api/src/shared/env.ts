import { z } from "zod";

// Se valida al arrancar: es preferible que el proceso no levante a que levante
// con un secreto vacío y firme tokens que cualquiera puede falsificar.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
  CIERRE_DIARIO_TZ: z.string().default("America/Caracas"),

  // Fase 2 — RAG (CONTEXTO_PROYECTO.md §16). Ollama corre sólo en la red
  // interna del stack, nunca con puerto publicado (§16.8).
  RAG_HABILITADO: z.enum(["true", "false"]).default("true").transform((v) => v === "true"),
  OLLAMA_URL: z.string().url().default("http://localhost:11434"),
  RAG_MODELO_CHAT: z.string().default("qwen2.5:7b"),
  // Fijo por la medición del 2026-09-24: cambiarlo exige migrar la dimensión
  // de chunks_rag.embedding (768) y reindexar todo.
  RAG_MODELO_EMBEDDING: z.literal("nomic-embed-text").default("nomic-embed-text"),
  // Donde quedan los archivos originales subidos. Entra en el respaldo.
  RAG_DIR_ARCHIVOS: z.string().default("datos-rag"),
  RAG_TAMANO_MAXIMO_MB: z.coerce.number().int().positive().default(50),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Configuración inválida:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
