import { PrismaClientKnownRequestError } from "@sicog/db";
import { ConflictError, NotFoundError } from "./errors.js";

/**
 * Traduce los códigos de Prisma a errores del dominio, para que el Service no
 * los conozca.
 *
 * - `P2002`, índice único violado → `CONFLICT`. Se intenta escribir y se
 *   traduce la violación, en lugar de consultar antes: un `SELECT` seguido de
 *   un `INSERT` es una carrera, no una garantía — dos peticiones simultáneas
 *   con el mismo nombre pasarían las dos. El índice único **es** el mecanismo
 *   (migraciones `20260915140000` y `20260918120000`).
 * - `P2003`, una clave foránea que no existe → `NOT_FOUND`. Pedir un producto
 *   de un insumo inexistente es un 404, no un 500.
 * - `P2025`, la fila a actualizar no existe → `NOT_FOUND`. Cubre el hueco
 *   entre el chequeo de existencia del Service y el `UPDATE`: si alguien borró
 *   la fila en el medio, sale un 404 y no un 500.
 *
 * Vive en `shared/` y no dentro de un módulo porque es infraestructura de
 * persistencia, no regla de negocio: Despacho y Actividades la necesitan
 * igual, y que un módulo importara del otro sería mezclarlos.
 */
export function traducirEscritura(
  err: unknown,
  mensajes: { repetido: string; noExiste: string },
): unknown {
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === "P2002") return new ConflictError(mensajes.repetido);
    if (err.code === "P2003") return new NotFoundError(mensajes.noExiste);
    if (err.code === "P2025") return new NotFoundError(mensajes.noExiste);
  }
  return err;
}
