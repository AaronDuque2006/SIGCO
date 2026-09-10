import { z } from "zod";

// Se valida al arrancar: es preferible que el proceso no levante a que levante
// con un secreto vacío y firme tokens que cualquiera puede falsificar.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
  CIERRE_DIARIO_TZ: z.string().default("America/Caracas"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Configuración inválida:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
