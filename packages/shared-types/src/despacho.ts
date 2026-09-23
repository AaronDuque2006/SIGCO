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
  /** Plantas que procesan gas (San Joaquín, Santa Bárbara, Jusepín, El
   *  Tablazo LGN1/LGN2). Decide si la pantalla de lecturas ofrece el campo
   *  "Procesado" para esta fuente. */
  procesaGas: boolean;
}

/**
 * Punto por el que el gas sale del sistema sin ser consumo de un cliente: un
 * aporte a otra división o una transferencia a otro sistema (decisión #79).
 */
export interface PuntoTransferenciaDto {
  id: number;
  nombre: string;
  /** A dónde va: `EYP`, `NURGAS`. */
  destino: string;
  /** Cuando es `true`, `mmpced` admite signo: positivo en el sentido que
   *  nombra el punto, negativo en el contrario. */
  bidireccional: boolean;
  sistema: SistemaDto;
  subSistema: { id: number; nombre: string } | null;
}

export interface LecturaTransferenciaDto {
  id: string;
  puntoId: number;
  fecha: string;
  tipoCorte: TipoCorte;
  /** **Puede ser negativo** en un punto bidireccional. */
  mmpced: number;
  usuarioId: number;
}

/** Una fila del bloque de transferencias, exista o no la lectura. */
export interface FilaTransferenciaDto {
  punto: PuntoTransferenciaDto;
  lectura: LecturaTransferenciaDto | null;
  /** Ver `FilaBalanceDiarioDto.correcciones`. */
  correcciones: number;
}

export interface LecturaBalanceDto {
  id: string;
  clienteId: number;
  fecha: string;
  tipoCorte: TipoCorte;
  volumenMmpced: number;
  /** Hora real de la lectura en planta (HH:MM), no la de digitación. `null` si no se cargó. */
  horaLectura: string | null;
  usuarioId: number;
  /** Quién fijó este valor. Mismo criterio que `HistorialEntryDto.usuarioNombre`. */
  usuarioNombre: string;
  /**
   * Quién corrigió el valor vigente **en el lugar** y cuándo, desde la
   * cuadrícula del historial. Ese camino pisa el número sin bajar el viejo al
   * historial —para que un mal tecleado no entre en la media del
   * `CIERRE_PROMEDIO`— así que esto es el único rastro que deja. `null` si
   * nadie lo retocó así.
   */
  editadoPor: string | null;
  editadoEn: string | null;
}

export interface LecturaFuenteDto {
  id: string;
  fuenteId: number;
  fecha: string;
  volumenMmpced: number;
  horaLectura: string | null;
  /**
   * Lo que la planta procesó ese corte — sólo para fuentes con
   * `FuenteDto.procesaGas`. **No entra en el balance**: el recibido sigue
   * siendo `volumenMmpced` (decisiones #62/#74). `null` en las fuentes que
   * no procesan, y en las que procesan hasta que se carga.
   */
  procesado: number | null;
  usuarioId: number;
  usuarioNombre: string;
}

export interface QuemaNacionalDto {
  id: string;
  fecha: string;
  tipoCorte: TipoCorte;
  mmpced: number;
  horaLectura: string | null;
  usuarioId: number;
  usuarioNombre: string;
  /** Ver `LecturaBalanceDto.editadoPor`. */
  editadoPor: string | null;
  editadoEn: string | null;
}

export interface HistorialEntryDto {
  id: string;
  valorAnterior: number;
  /** Hora que tenía la lectura antes de esta corrección. `null` si no tenía. */
  horaAnterior: string | null;
  /**
   * Quién corrigió este valor del historial después, y cuándo. Un valor del
   * historial se puede editar (amplía la decisión #3): editarlo **pisa** el
   * número que el analista había tecleado, así que esto es el único rastro
   * que queda de que la fila fue retocada. `null` en las que nadie tocó, y
   * siempre `null` en los recursos que no admiten la edición (fuentes y
   * transferencias, que no tienen `CIERRE_PROMEDIO` al que afectar).
   */
  editadoPor: string | null;
  editadoEn: string | null;
  /** El "procesado" que tenía antes de esta corrección. Sólo tiene sentido en
   *  `lecturas-fuente`; `null` en el resto de los recursos. */
  procesadoAnterior: number | null;
  usuarioId: number;
  /**
   * Nombre de quien hizo el cambio. El `usuarioId` solo no le dice nada a
   * quien mira: la pregunta que el historial contesta es "quién tocó esto".
   */
  usuarioNombre: string;
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
  /**
   * Cuántas veces se corrigió el valor de ese día — el largo del historial.
   *
   * Va en la fila de la grilla y no en `LecturaBalanceDto` a propósito: el DTO
   * de la lectura también lo devuelven el `POST` y el `PATCH`, que tendrían que
   * contar en cada escritura para llenarlo. Acá la grilla ya hace una consulta
   * por día, y el conteo viaja con ella.
   *
   * Existe para que la pantalla marque **sólo** las filas corregidas: un
   * indicador en las 111 sería ruido. `0` en una fila sin lectura.
   */
  correcciones: number;
  /**
   * El volumen que la corrección más reciente reemplazó, para que la grilla
   * muestre si el valor subió o bajó respecto de la última vez. `null` cuando
   * la lectura nunca se corrigió (o no existe): ahí no hay contra qué
   * compararla, y la flecha no se dibuja.
   *
   * Va en la fila y no en `LecturaBalanceDto` por el mismo motivo que
   * `correcciones`: el `POST` y el `PATCH` devuelven ese DTO y tendrían que
   * buscarlo en cada escritura.
   */
  valorAnterior: number | null;
}

export interface FilaFuenteDiariaDto {
  fuente: FuenteDto;
  lectura: LecturaFuenteDto | null;
  /** Ver `FilaBalanceDiarioDto.correcciones`. */
  correcciones: number;
}

/**
 * La quema del día, exista o no la fila.
 *
 * Mismo envoltorio que `FilaBalanceDiarioDto`: el consumidor pide un día y un
 * corte y siempre recibe la misma forma, con `quema: null` cuando todavía no
 * se digitó. Un `404` para un día sin quema obligaría a la pantalla a tratar
 * un error como si fuera el estado normal de la mañana.
 */
export interface QuemaNacionalDiaDto {
  fecha: string;
  tipoCorte: TipoCorte;
  quema: QuemaNacionalDto | null;
}

export interface NovedadOperativaDto {
  id: string;
  // Exactamente uno de los dos viene lleno: lo exige el schema zod en el borde
  // y el CHECK de la base (migración 20260910150000).
  cliente: ClienteDto | null;
  fuente: FuenteDto | null;
  tipo: string;
  impacto: string;
  inicio: string;
  fin: string | null;
  causa: string;
  mmpcedAfectados: number;
  usuarioId: number;
  /** Quién la registró. Mismo criterio que `HistorialEntryDto` (decisión #69). */
  usuarioNombre: string;
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
  /** Incluye la quema nacional y las transferencias del corte
   *  (decisiones #74 y #79). */
  transportadoMmpced: number;
  /** Cuánto del transportado es quema, para poder desglosarlo en pantalla. */
  quemaMmpced: number;
  /** Cuánto del transportado son transferencias fuera del sistema (#79). */
  transferenciasMmpced: number;
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

/**
 * Lo entregado por agrupación de entrega — la cuarta gráfica del workbook.
 *
 * La agrupación es **el sub-sistema del cliente cuando tiene uno, y su sistema
 * cuando no** (decisión #78). Así Costa Oeste y Costa Este salen como barras
 * propias aunque compartan sistema y región, y el resto de los clientes de
 * Ulé-Amuay se suman en una barra del sistema.
 */
export interface EntregaPorAgrupacionDto {
  /** Lo que va en el eje: el nombre del sub-sistema, o el del sistema. */
  nombre: string;
  sistema: SistemaDto;
  /** `null` cuando el sistema no está subdividido, o cuando estos clientes
   *  cuelgan directo de él. */
  subSistema: { id: number; nombre: string } | null;
  totalMmpced: number;
}

export interface ConsumoPorSectoresDto {
  fecha: string;
  tipoCorte: TipoCorte;
  /**
   * Total por sector en todo el país — la dona del workbook.
   *
   * Es la suma de `porRegion[].sectores`, igual que en el Excel
   * (`A49 = L52+L63+L70`). **No incluye la quema nacional**: en el workbook
   * `QUEMA TYD` vive en `G48/G49`, pegada al bloque pero fuera del rango de la
   * gráfica, porque no es consumo de ningún sector.
   */
  nacional: ConsumoPorSectorDto[];
  /**
   * El desglose región × sector. Es **disperso**: cada región trae sólo los
   * sectores que tuvieron consumo (en el workbook CENTRO tiene 3 y CEN-OCC
   * tiene 6), no una matriz rellena de ceros.
   */
  porRegion: ConsumoPorRegionDto[];
  /** Lo entregado por sub-sistema o sistema (decisión #78). Mismo total que
   *  `nacional` y `porRegion`: son tres cortes del mismo día. */
  porAgrupacion: EntregaPorAgrupacionDto[];
  totalMmpced: number;
}

/** Un día de la serie: lo mismo que muestra el gráfico de línea del workbook. */
export interface PuntoSerieBalanceDto {
  fecha: string;
  recibidoMmpced: number;
  transportadoMmpced: number;
}

/**
 * La serie de recibido vs transportado de los últimos N días, con sus
 * promedios — el gráfico de línea de `EJECUTIVO PUNTUAL!B89:D96`.
 *
 * En el workbook esos siete valores se teclean a mano cada día; acá se
 * calculan de lo que ya está guardado.
 */
export interface SerieBalanceDto {
  desde: string;
  hasta: string;
  tipoCorte: TipoCorte;
  /** Un punto por día del rango, incluidos los días sin datos, en ceros. */
  dias: PuntoSerieBalanceDto[];
  promedioRecibidoMmpced: number;
  promedioTransportadoMmpced: number;
}
