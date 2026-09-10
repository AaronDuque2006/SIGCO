import { z } from "zod";

// Los query params llegan siempre como string, por eso `coerce` acá y no en los bodies.
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const fechaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD");

export const tipoCorteSchema = z.enum(["PUNTUAL", "CIERRE_PROMEDIO"]);

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Tablas con PK BigInt: el id viaja como string porque JSON no tiene BigInt.
export const bigIntIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "id inválido"),
});

// Decimal(14,4) en BD. No admite negativos: un volumen de gas entregado no
// puede serlo, y "Desvío" se modela como una FUENTE aparte (decisión #5), no
// como un número negativo.
export const volumenMmpcedSchema = z
  .number()
  .finite()
  .nonnegative()
  .max(9_999_999_999);

export const busquedaSchema = z.string().trim().min(1).max(100);

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
