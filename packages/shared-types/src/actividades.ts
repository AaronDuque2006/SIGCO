import type { OpcionCatalogoDto } from "./usuarios.js";

/** Los tres estados de una actividad (decisión #29). */
export type EstatusActividad = "RECIBIDO" | "EN PROCESO" | "FINALIZADO";

// ===========================================================================
// Catálogos
// ===========================================================================

export interface InsumoDto {
  id: number;
  departamento: OpcionCatalogoDto;
  nombre: string;
  activo: boolean;
}

export interface ProductoServicioDto {
  id: number;
  insumo: InsumoDto;
  nombre: string;
  descripcionActividad: string | null;
  activo: boolean;
}

export interface GerenciaRequirienteDto {
  id: number;
  departamento: OpcionCatalogoDto;
  nombre: string;
  activo: boolean;
}

/**
 * A nombre de quién se puede registrar una actividad.
 *
 * Es una lista propia del módulo y no `/api/usuarios`, que es exclusivo del
 * superadmin (decisión #11): un Supervisor tiene que poder asignarle trabajo a
 * su gente sin serlo. Expone lo mismo que la bitácora ya muestra en cada fila.
 */
export interface ResponsableDto {
  id: number;
  nombre: string;
  puesto: string;
}

/** Las 6 de Mantenimiento, reutilizadas por este módulo (decisión #19). */
export interface RegionMttoDto {
  id: number;
  nombre: string;
}

// ===========================================================================
// ACTIVIDAD_REGISTRO
// ===========================================================================

export interface ActividadRegistroDto {
  /** `BigInt` en la base; viaja como string porque JSON no tiene BigInt. */
  id: string;
  productoServicio: ProductoServicioDto;
  gerenciaRequiriente: GerenciaRequirienteDto;
  /** `null` = alcance nacional, que en el workbook es el caso más común. */
  region: RegionMttoDto | null;
  /** El responsable de la actividad, no necesariamente quien la registró. */
  usuario: { id: number; nombre: string; puesto: string };
  fechaDesde: string;
  fechaHasta: string;
  cantidad: number;
  /** `null` mientras la tarea esté asignada y sin ejecutar. */
  hh: number | null;
  estatus: EstatusActividad;
  detalle: string | null;
}

// ===========================================================================
// ACTIVIDAD_META — el plan anual
// ===========================================================================

export interface CeldaMetaDto {
  id: string;
  mes: number;
  cantidadMeta: number;
  hhMeta: number;
}

/**
 * Una fila de la matriz del plan: un producto/servicio con sus doce meses.
 *
 * Los meses sin fila **no se rellenan en cero**: un mes sin plan y un mes
 * planificado en cero son cosas distintas, y el reporte de cumplimiento
 * necesita distinguirlos para no inventar un incumplimiento donde nunca hubo
 * meta.
 */
export interface FilaMetaDto {
  productoServicio: ProductoServicioDto;
  meses: CeldaMetaDto[];
}

export interface MatrizMetasDto {
  anio: number;
  filas: FilaMetaDto[];
}

// ===========================================================================
// Reportes
// ===========================================================================

/**
 * Un mes de un producto/servicio, con plan y real enfrentados.
 *
 * **El cumplimiento es nuevo de SICOG**: el workbook no lo calcula en ninguna
 * parte — no hay una sola división en sus hojas de plan. Viaja `null` cuando la
 * meta es cero o no existe, y la pantalla escribe "sin meta": inventar un 100%
 * o un infinito sería peor que decir que no hay con qué comparar.
 */
export interface MesPlanVsRealDto {
  mes: number;
  cantidadMeta: number | null;
  hhMeta: number | null;
  cantidadReal: number;
  hhReal: number;
  /** Porcentaje, no fracción: 87.5 es 87,5%. */
  cumplimientoCantidad: number | null;
  cumplimientoHh: number | null;
}

export interface FilaPlanVsRealDto {
  productoServicio: ProductoServicioDto;
  meses: MesPlanVsRealDto[];
  /** Los doce meses sumados, para la columna de total que el workbook tiene. */
  cantidadMetaAnual: number;
  hhMetaAnual: number;
  cantidadRealAnual: number;
  hhRealAnual: number;
}

export interface PlanVsRealDto {
  anio: number;
  filas: FilaPlanVsRealDto[];
}

/**
 * Cuánto pesa cada actividad sobre el total del mes.
 *
 * Es el **único** porcentaje que el workbook sí tiene (`D6/$D$18`), pero ahí
 * está tecleado a mano en una hoja que no está enlazada y que lista 12
 * actividades contra 32 de la hoja de plan. Acá se calcula.
 */
export interface FilaParticipacionDto {
  productoServicio: ProductoServicioDto;
  cantidad: number;
  hh: number;
  /** Porcentaje sobre el total del mes. */
  participacionCantidad: number;
  participacionHh: number;
}

export interface ParticipacionDto {
  anio: number;
  mes: number;
  totalCantidad: number;
  totalHh: number;
  filas: FilaParticipacionDto[];
}
