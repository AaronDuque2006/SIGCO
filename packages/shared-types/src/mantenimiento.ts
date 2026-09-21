import type { OpcionCatalogoDto } from "./usuarios.js";

export type TipoEnlaceCom = "IP PDVSA" | "SATELITAL" | "SERIAL PDVSA";

/** `null` en las estaciones que el inventario no clasifica: cuentan en el total
 *  de la disponibilidad pero no suman ni a transporte ni a distribución. */
export type TipoRedEstacion = "TRANSPORTE" | "DISTRIBUCION" | null;

/** Derivado de la bitácora, nunca almacenado. */
export type EstadoEstacion = "OPERATIVA" | "EN_FALLA";

// ===========================================================================
// Inventario
// ===========================================================================

export interface AreaMttoDto {
  id: number;
  nombre: string;
  region: OpcionCatalogoDto;
  totalEstaciones: number;
}

export interface TipoInstrumentoDto {
  id: number;
  nombre: string;
}

export interface InstrumentoEstacionDto {
  tipoInstrumento: TipoInstrumentoDto;
  cantidad: number;
}

export interface CausaFallaDto {
  id: number;
  nombre: string;
  activo: boolean;
}

/** La falla abierta de una estación, embebida donde hace falta saber por qué
 *  está caída sin pedir la bitácora entera. */
export interface FallaAbiertaDto {
  id: string;
  causaFalla: CausaFallaDto;
  desde: string;
  diasCaida: number;
  observacion: string | null;
}

export interface EstacionDto {
  id: number;
  nodo: string;
  nombre: string;
  area: OpcionCatalogoDto;
  region: OpcionCatalogoDto;
  tipoEnlaceCom: TipoEnlaceCom;
  tipoRed: TipoRedEstacion;
  estado: EstadoEstacion;
  fallaAbierta: FallaAbiertaDto | null;
}

export interface EstacionDetalleDto extends EstacionDto {
  instrumentos: InstrumentoEstacionDto[];
  totalInstrumentos: number;
}

// ===========================================================================
// Bitácora de fallas
// ===========================================================================

export interface FallaEstacionDto {
  id: string;
  estacion: {
    id: number;
    nodo: string;
    nombre: string;
    area: OpcionCatalogoDto;
    region: OpcionCatalogoDto;
    tipoRed: TipoRedEstacion;
  };
  causaFalla: CausaFallaDto;
  desde: string;
  resueltaEn: string | null;
  /** Días que lleva (o llevó) caída. En el reporte real hay fallas de más de
   *  diez años, así que el número es el dato de gestión, no la fecha suelta. */
  diasCaida: number;
  observacion: string | null;
  registradaPor: OpcionCatalogoDto;
  /** Quien la resolvió, distinto de quien la abrió (§15.5). `null` mientras
   *  sigue abierta, y también en fallas resueltas antes de que existiera esta
   *  columna. */
  resueltaPor: OpcionCatalogoDto | null;
  /** Cuántas veces se corrigió `causaFalla`/`desde`/`observacion` — el largo
   *  del historial. Mismo criterio que `FilaBalanceDiarioDto.correcciones`. */
  correcciones: number;
}

/** Una entrada del historial de correcciones de una falla: la foto de los tres
 *  campos corregibles justo antes del PATCH que los cambió. */
export interface FallaHistorialEntryDto {
  id: string;
  causaFallaIdAnt: number;
  desdeAnt: string;
  observacionAnt: string | null;
  usuarioId: number;
  usuarioNombre: string;
  modificadoEn: string;
}

// ===========================================================================
// Reportes
// ===========================================================================

/** Una fila del cuadro de disponibilidad, sea por región o por área. */
export interface DisponibilidadFilaDto {
  id: number;
  nombre: string;
  total: number;
  disponibles: number;
  enFalla: number;
  /** `disponibles / total`, o `null` cuando el grupo no tiene estaciones: sin
   *  denominador no hay porcentaje que inventar. */
  porcentajeDisponible: number | null;
}

export interface CausaConteoDto {
  causaFalla: CausaFallaDto;
  cantidad: number;
}

export interface DisponibilidadDto {
  fecha: string;
  total: number;
  disponibles: number;
  enFalla: number;
  porcentajeDisponible: number | null;
  /** El corte que el área publica cada semana. Las estaciones sin clasificar
   *  van aparte para que transporte + distribución + sinClasificar = total. */
  porTipoRed: {
    transporte: number;
    distribucion: number;
    sinClasificar: number;
  };
  porRegion: DisponibilidadFilaDto[];
  porArea: DisponibilidadFilaDto[];
  porCausa: CausaConteoDto[];
}

export interface SemanaDisponibilidadDto {
  semana: number;
  /** Lunes de esa semana ISO, que es la fecha sobre la que se evalúa. */
  fecha: string;
  transporte: number;
  distribucion: number;
  total: number;
  porcentajeDisponible: number | null;
}

export interface SerieDisponibilidadDto {
  anio: string;
  /** La meta con la que el archivo compara la serie. Es constante en las 52
   *  semanas del reporte real, así que viaja como número y no como catálogo. */
  metaPorcentaje: number;
  totalEstaciones: number;
  semanas: SemanaDisponibilidadDto[];
}
