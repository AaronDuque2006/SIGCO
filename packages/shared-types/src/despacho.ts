// Representación en el cable (decidido aquí una sola vez, aplica a todo el módulo):
// - `id` de tablas BigInt viaja como string: JSON no tiene BigInt.
// - `volumenMmpced`/`mmpced` (Decimal(14,4) en BD) viaja como number. Los
//   volúmenes nacionales rondan los 1.800 MMPCED, muy por debajo del límite de
//   precisión de un double; y las agregaciones de los reportes se calculan en
//   SQL (numeric exacto), así que el number es solo el transporte de un
//   resultado ya exacto, nunca el acumulador.
// - `fecha` es el día operativo en formato YYYY-MM-DD, sin hora ni zona.
// - timestamps (`modificadoEn`, `inicio`, `fin`) viajan como ISO 8601.

export type TipoCorte = "PUNTUAL" | "CIERRE_PROMEDIO";

export interface SistemaDto {
  id: number;
  nombre: string;
}

export interface RegionOperativaDto {
  id: number;
  nombre: string;
}

export interface SectorClienteDto {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface ClienteDto {
  id: number;
  nombre: string;
  region: RegionOperativaDto;
  sistema: SistemaDto;
  sector: SectorClienteDto;
}

export interface FuenteDto {
  id: number;
  nombre: string;
  sistema: SistemaDto;
}

export interface LecturaBalanceDto {
  id: string;
  clienteId: number;
  fecha: string;
  tipoCorte: TipoCorte;
  volumenMmpced: number;
  usuarioId: number;
}

export interface LecturaFuenteDto {
  id: string;
  fuenteId: number;
  fecha: string;
  volumenMmpced: number;
  usuarioId: number;
}

export interface QuemaNacionalDto {
  id: string;
  fecha: string;
  tipoCorte: TipoCorte;
  mmpced: number;
  usuarioId: number;
}

export interface HistorialEntryDto {
  id: string;
  valorAnterior: number;
  usuarioId: number;
  modificadoEn: string;
}

// La grilla diaria: una fila por cliente/fuente, exista o no la lectura.
// `lectura` es null sólo para un cliente creado después de que el job de
// cierre abriera el día (decisiones #42/#43); en operación normal viene llena.
//
// La grilla se devuelve siempre envuelta en `Paginated<T>`, se pidan o no
// `page`/`pageSize`: sin ellos viene todo el filtro en una sola página. La
// forma de la respuesta no cambia según los parámetros — el consumidor lee
// `pagination.totalPages` y ya, sin ramificar por tipo.
export interface FilaBalanceDiarioDto {
  cliente: ClienteDto;
  lectura: LecturaBalanceDto | null;
}

export interface FilaFuenteDiariaDto {
  fuente: FuenteDto;
  lectura: LecturaFuenteDto | null;
}

export interface NovedadOperativaDto {
  id: string;
  cliente: ClienteDto | null;
  fuente: FuenteDto | null;
  tipo: string;
  impacto: string;
  inicio: string;
  fin: string | null;
  causa: string;
  mmpcedAfectados: number;
  usuarioId: number;
}

export interface ContactoDto {
  id: number;
  cliente: ClienteDto | null;
  fuente: FuenteDto | null;
  nombreOperador: string;
  telefono: string;
}

// Reportes query-calculados (decisiones #15 y #37): no tienen tabla propia.
export type CondicionBalance = "EMPAQUE" | "DESEMPAQUE";

export interface BalanceNacionDto {
  fecha: string;
  tipoCorte: TipoCorte;
  recibidoMmpced: number;
  transportadoMmpced: number;
  variacionMmpced: number;
  condicion: CondicionBalance;
}

export interface ConsumoPorSectorDto {
  sector: SectorClienteDto;
  totalMmpced: number;
}

export interface ConsumoPorRegionDto {
  region: RegionOperativaDto;
  sectores: ConsumoPorSectorDto[];
  totalMmpced: number;
}

export interface ConsumoPorSectoresDto {
  fecha: string;
  tipoCorte: TipoCorte;
  nacional: ConsumoPorSectorDto[];
  porRegion: ConsumoPorRegionDto[];
  totalMmpced: number;
}
