import type {
  DisponibilidadDto,
  FallaEstacionDto,
  FallaHistorialEntryDto,
  Paginated,
  SerieDisponibilidadDto,
} from "@sicog/shared-types";
import type { ListFallasQuery } from "@sicog/shared-validators";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors.js";
import { fechaToDate } from "../../../shared/fechas.js";
import { paginate } from "../../../shared/http.js";
import { fallaRepository as repo } from "../repositories/falla.repository.js";
import { hoyUtc } from "../mantenimiento.fechas.js";

/**
 * Una falla no puede empezar en el futuro. Hacia atrás no hay tope a propósito:
 * en el reporte real hay interrupciones abiertas desde 2011, y son las que
 * explican por qué la disponibilidad está en 19% contra una meta de 95%.
 */
const exigirNoFutura = (fecha: string, campo: string): Date => {
  const valor = fechaToDate(fecha);
  if (valor > hoyUtc()) throw new ValidationError(`${campo} no puede ser una fecha futura`);
  return valor;
};

export const fallaService = {
  listar: (filtros: ListFallasQuery): Promise<{ items: FallaEstacionDto[]; total: number }> =>
    repo.listar(filtros),

  async obtener(id: bigint): Promise<FallaEstacionDto> {
    const falla = await repo.obtener(id);
    if (!falla) throw new NotFoundError("No existe la falla");
    return falla;
  },

  crear: (datos: {
    estacionId: number;
    causaFallaId: number;
    desde: string;
    observacion: string | null;
    usuarioId: number;
  }): Promise<FallaEstacionDto> =>
    repo.crear({ ...datos, desde: exigirNoFutura(datos.desde, "La fecha de inicio") }),

  async actualizar(
    id: bigint,
    datos: { causaFallaId?: number; desde?: string; observacion?: string | null },
    usuarioId: number,
  ): Promise<FallaEstacionDto> {
    const actual = await repo.obtener(id);
    if (!actual) throw new NotFoundError("No existe la falla");

    const { desde: desdeTexto, ...resto } = datos;
    const desde = desdeTexto ? exigirNoFutura(desdeTexto, "La fecha de inicio") : undefined;
    // El CHECK de la base lo impide igual; acá se explica en vez de traducir un
    // error de constraint.
    if (desde && actual.resueltaEn && desde > fechaToDate(actual.resueltaEn)) {
      throw new ValidationError("La falla no puede empezar después de la fecha en que se resolvió");
    }
    return repo.actualizar(id, { ...resto, ...(desde ? { desde } : {}) }, usuarioId);
  },

  async resolver(
    id: bigint,
    datos: { resueltaEn: string; observacion?: string | null },
    usuarioId: number,
  ): Promise<FallaEstacionDto> {
    const actual = await repo.obtener(id);
    if (!actual) throw new NotFoundError("No existe la falla");
    if (actual.resueltaEn) throw new ConflictError("Esa falla ya está resuelta");

    const resueltaEn = exigirNoFutura(datos.resueltaEn, "La fecha de resolución");
    if (resueltaEn < fechaToDate(actual.desde)) {
      throw new ValidationError("La falla no puede resolverse antes de haber empezado");
    }
    return repo.resolver(id, { ...datos, resueltaEn }, usuarioId);
  },

  disponibilidad: (fecha?: string): Promise<DisponibilidadDto> =>
    repo.disponibilidad(fecha ? fechaToDate(fecha) : hoyUtc()),

  serie: (anio: number): Promise<SerieDisponibilidadDto> => repo.serie(anio),

  async obtenerHistorial(
    id: bigint,
    page: number,
    pageSize: number,
  ): Promise<Paginated<FallaHistorialEntryDto>> {
    const actual = await repo.obtener(id);
    if (!actual) throw new NotFoundError("No existe la falla");
    const [filas, totalItems] = await Promise.all([
      repo.listHistorial(id, (page - 1) * pageSize, pageSize),
      repo.countHistorial(id),
    ]);
    return paginate(filas, totalItems, page, pageSize);
  },
};
