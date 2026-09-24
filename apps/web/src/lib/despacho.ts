"use client";

import type {
  BalanceNacionDto,
  ClienteDto,
  ConsumoPorSectoresDto,
  ContactoDto,
  FilaBalanceDiarioDto,
  FilaTransferenciaDto,
  FuenteDto,
  HistorialEntryDto,
  LecturaTransferenciaDto,
  NovedadOperativaDto,
  FilaFuenteDiariaDto,
  LecturaBalanceDto,
  LecturaFuenteDto,
  Paginated,
  QuemaNacionalDiaDto,
  QuemaNacionalDto,
  SerieBalanceDto,
  TipoCorte,
  UsuarioSesionDto,
} from "@sicog/shared-types";
import type {
  CreateContactoInput,
  CreateNovedadInput,
  UpdateContactoInput,
  UpdateNovedadInput,
} from "@sicog/shared-validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, BASE, todasLasPaginas } from "./api";

export const claveGrilla = (fecha: string, tipoCorte: TipoCorte) =>
  ["balance", fecha, tipoCorte] as const;

/**
 * La grilla del día viene **sin paginar**: el endpoint devuelve una fila por
 * cliente —con su lectura o `null`— porque el trabajo real es digitar el día
 * entero de corrido. Por eso los filtros de esta pantalla se aplican en el
 * navegador sobre lo ya cargado, en vez de volver al servidor por cada cambio.
 */
export function useGrillaBalance(fecha: string, tipoCorte: TipoCorte) {
  return useQuery<Paginated<FilaBalanceDiarioDto>, ApiError>({
    queryKey: claveGrilla(fecha, tipoCorte),
    queryFn: () =>
      api<Paginated<FilaBalanceDiarioDto>>(
        `/despacho/lecturas-balance?fecha=${fecha}&tipoCorte=${tipoCorte}`,
      ),
  });
}

interface GuardarInput {
  clienteId: number;
  lecturaId: string | null;
  volumenMmpced: number;
  /** Hora real de la lectura en planta, `HH:MM`. `undefined` en el `PATCH`
   *  significa "no tocarla"; `null` la borra. */
  horaLectura?: string | null;
}

/**
 * Un solo hook para las dos operaciones, porque desde la pantalla son la misma
 * acción: escribir el volumen de un cliente. Si la fila no tenía lectura se
 * crea (`POST`); si ya tenía, se corrige (`PATCH`) y el backend deja la fila de
 * historial correspondiente (decisión #3).
 *
 * `CIERRE_PROMEDIO` no se puede crear por la API —lo escribe únicamente el job
 * de cierre (decisión #42)—, pero sí corregir. La pantalla lo refleja
 * habilitando sólo las celdas que ya tienen valor cuando el corte es de cierre.
 */
export function useGuardarLectura(fecha: string, tipoCorte: TipoCorte) {
  const cliente = useQueryClient();
  return useMutation<LecturaBalanceDto, ApiError, GuardarInput>({
    mutationFn: ({ clienteId, lecturaId, volumenMmpced, horaLectura }) =>
      lecturaId === null
        ? api<LecturaBalanceDto>("/despacho/lecturas-balance", {
            metodo: "POST",
            cuerpo: { clienteId, fecha, volumenMmpced, horaLectura },
          })
        : api<LecturaBalanceDto>(`/despacho/lecturas-balance/${lecturaId}`, {
            metodo: "PATCH",
            cuerpo: { volumenMmpced, horaLectura },
          }),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: claveGrilla(fecha, tipoCorte) });
      // El transportado del balance sale de estas lecturas.
      void cliente.invalidateQueries({ queryKey: ["balance-nacion", fecha] });
    },
  });
}

/** Fecha de hoy en la zona de quien usa el sistema, no en UTC: el operador
 *  quiere "hoy acá", y la API trabaja con `YYYY-MM-DD` sin zona horaria. */
export function hoy(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/**
 * Dos decimales fijos, confirmado por el owner (cierra el punto abierto de la
 * decisión #60).
 *
 * Se redondea **sólo al mostrar**: la columna sigue siendo `Decimal(14,4)`
 * porque el job de cierre promedia con cuatro posiciones —`(480+500+512,25)/3`
 * es `497,4167`— y truncarla a dos acumularía error en cada cierre. Es lo que
 * hace el Excel: muestra dos y guarda la división completa.
 *
 * Por el mismo motivo la celda editable **no** usa esto: ver `CeldaVolumen`.
 */
export const formatearVolumen = (v: number): string =>
  v.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * El día operativo es el de Venezuela, también al mostrar una marca de tiempo.
 *
 * `toLocaleString` sin `timeZone` resuelve en la zona **del navegador**, así que
 * la misma corrección se leía con hora distinta según dónde estuviera la
 * máquina, y en un equipo mal configurado podía caer en otro día. Es el mismo
 * desfase que ya había corrido las novedades de las 22:00 al día siguiente
 * (decisión #72), y la zona sale de la misma constante que usa el job de cierre.
 */
export const ZONA_OPERATIVA = "America/Caracas";

export const fechaHora = (iso: string): string =>
  new Date(iso).toLocaleString("es-VE", {
    timeZone: ZONA_OPERATIVA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * El nombre del departamento es la clave que se compara contra
 * `departamentosQueEdita`, así que tiene que coincidir carácter por carácter
 * con la fila sembrada de `DEPARTAMENTO` (decisiones #22 y #59).
 */
export const DEPARTAMENTO_DESPACHO = "Despacho";

/** Sólo decide qué habilitar en pantalla. La autorización real la resuelve el
 *  backend contra la base en cada petición, nunca el navegador. */
export const puedeEditarDespacho = (sesion: UsuarioSesionDto | null): boolean =>
  sesion?.departamentosQueEdita.includes(DEPARTAMENTO_DESPACHO) === true;

// ---------------------------------------------------------------------------
// Fuentes y balance nación
// ---------------------------------------------------------------------------

export const claveGrillaFuentes = (fecha: string) => ["fuentes", fecha] as const;

/** Las fuentes no tienen tipo de corte: el modelo guarda una lectura por
 *  fuente y por día (decisión #34 no aplica acá). */
export function useGrillaFuentes(fecha: string) {
  return useQuery<Paginated<FilaFuenteDiariaDto>, ApiError>({
    queryKey: claveGrillaFuentes(fecha),
    queryFn: () =>
      api<Paginated<FilaFuenteDiariaDto>>(`/despacho/lecturas-fuente?fecha=${fecha}`),
  });
}

export function useGuardarLecturaFuente(fecha: string) {
  const cliente = useQueryClient();
  return useMutation<
    LecturaFuenteDto,
    ApiError,
    {
      fuenteId: number;
      lecturaId: string | null;
      volumenMmpced: number;
      horaLectura?: string | null;
      /** Sólo para fuentes con `procesaGas`. No afecta el balance. */
      procesado?: number | null;
      /** Sólo para fuentes con `procesaGas`. Sí suma al recibido (#107). */
      desvio?: number | null;
    }
  >({
    mutationFn: ({ fuenteId, lecturaId, volumenMmpced, horaLectura, procesado, desvio }) =>
      lecturaId === null
        ? api<LecturaFuenteDto>("/despacho/lecturas-fuente", {
            metodo: "POST",
            cuerpo: { fuenteId, fecha, volumenMmpced, horaLectura, procesado, desvio },
          })
        : api<LecturaFuenteDto>(`/despacho/lecturas-fuente/${lecturaId}`, {
            metodo: "PATCH",
            cuerpo: { volumenMmpced, horaLectura, procesado, desvio },
          }),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: claveGrillaFuentes(fecha) });
      // El recibido del balance sale de las fuentes, así que las tarjetas
      // quedan desactualizadas apenas se toca una.
      void cliente.invalidateQueries({ queryKey: ["balance-nacion", fecha] });
    },
  });
}

export function useBalanceNacion(fecha: string, tipoCorte: TipoCorte) {
  return useQuery<BalanceNacionDto, ApiError>({
    queryKey: ["balance-nacion", fecha, tipoCorte],
    queryFn: () =>
      api<BalanceNacionDto>(
        `/despacho/reportes/balance-nacion?fecha=${fecha}&tipoCorte=${tipoCorte}`,
      ),
  });
}

// ---------------------------------------------------------------------------
// Quema nacional
// ---------------------------------------------------------------------------

export const claveQuema = (fecha: string, tipoCorte: TipoCorte) =>
  ["quema", fecha, tipoCorte] as const;

/**
 * Una sola cifra por día y por corte, no una grilla.
 *
 * El endpoint devuelve siempre la misma forma, con `quema: null` cuando el día
 * todavía no se digitó: un 404 obligaría a esta pantalla a tratar un error
 * como el estado normal de la mañana.
 */
export function useQuemaDelDia(fecha: string, tipoCorte: TipoCorte) {
  return useQuery<QuemaNacionalDiaDto, ApiError>({
    queryKey: claveQuema(fecha, tipoCorte),
    queryFn: () =>
      api<QuemaNacionalDiaDto>(
        `/despacho/quema-nacional?fecha=${fecha}&tipoCorte=${tipoCorte}`,
      ),
  });
}

/**
 * Un solo hook para crear y corregir, igual que en las dos grillas: desde la
 * pantalla es la misma acción —escribir la quema del día— y lo que decide es
 * si la fila ya existía.
 *
 * No invalida `balance-nacion`: la quema nacional no entra ni en el recibido
 * ni en el transportado (decisión #62), así que las tarjetas no cambian.
 */
export function useGuardarQuema(fecha: string, tipoCorte: TipoCorte) {
  const cliente = useQueryClient();
  return useMutation<
    QuemaNacionalDto,
    ApiError,
    { quemaId: string | null; mmpced: number; horaLectura?: string | null }
  >({
    mutationFn: ({ quemaId, mmpced, horaLectura }) =>
      quemaId === null
        ? api<QuemaNacionalDto>("/despacho/quema-nacional", {
            metodo: "POST",
            cuerpo: { fecha, mmpced, horaLectura },
          })
        : api<QuemaNacionalDto>(`/despacho/quema-nacional/${quemaId}`, {
            metodo: "PATCH",
            cuerpo: { mmpced, horaLectura },
          }),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: claveQuema(fecha, tipoCorte) });
      void cliente.invalidateQueries({ queryKey: ["quema-historial"] });
    },
  });
}

/** El historial de correcciones del día. A diferencia de las grillas, acá se
 *  muestra en pantalla: es una sola cifra y su recorrido cabe al lado. */
export function useHistorialQuema(quemaId: string | null) {
  return useQuery<Paginated<HistorialEntryDto>, ApiError>({
    queryKey: ["quema-historial", quemaId],
    queryFn: () =>
      api<Paginated<HistorialEntryDto>>(`/despacho/quema-nacional/${quemaId}/historial`),
    enabled: quemaId !== null,
  });
}

// ---------------------------------------------------------------------------
// Historial de correcciones de una lectura
// ---------------------------------------------------------------------------

/** Las dos grillas comparten endpoint salvo por el segmento de la ruta. */
export type RecursoLectura = "lecturas-balance" | "lecturas-fuente" | "transferencias";

/**
 * El historial de una lectura concreta.
 *
 * `enabled` sólo cuando hay id y la fila está desplegada: son 111 filas y
 * pedir el historial de todas al cargar la grilla sería una tormenta de
 * peticiones para algo que casi nunca se mira.
 */
export function useHistorialLectura(
  recurso: RecursoLectura,
  lecturaId: string | null,
  abierto: boolean,
) {
  return useQuery<Paginated<HistorialEntryDto>, ApiError>({
    queryKey: ["historial", recurso, lecturaId],
    queryFn: () =>
      api<Paginated<HistorialEntryDto>>(`/despacho/${recurso}/${lecturaId}/historial`),
    enabled: abierto && lecturaId !== null,
  });
}

/**
 * Corrige un valor ya guardado en el historial (decisión pendiente de
 * numerar): pisa el número original y deja como rastro quién lo editó.
 *
 * Sólo existe para `lecturas-balance` y `quema-nacional`: son los dos únicos
 * recursos cuyo `CIERRE_PROMEDIO` depende de esos valores (decisión #34). En
 * `lecturas-fuente` y `transferencias` editar el historial no cambiaría
 * ningún cálculo, así que ahí es de sólo lectura.
 *
 * Si el día ya estaba cerrado, el backend recalcula el promedio de inmediato
 * — acá alcanza con invalidar la grilla (los dos cortes, de ahí el prefijo
 * sin `tipoCorte`) para que la pantalla muestre el cierre nuevo.
 */
export function useEditarHistorial(
  recurso: "lecturas-balance" | "quema-nacional",
  lecturaId: string | null,
  fecha: string,
) {
  const cliente = useQueryClient();
  // `historialId: null` es la fila vigente, que tiene su propia ruta: pisa el
  // valor de la lectura en vez del de una corrección vieja.
  return useMutation<void, ApiError, { historialId: string | null; valor: number }>({
    mutationFn: ({ historialId, valor }) =>
      historialId === null
        ? api<void>(`/despacho/${recurso}/${lecturaId}/valor`, {
            metodo: "PATCH",
            cuerpo: { valor },
          })
        : api<void>(`/despacho/${recurso}/${lecturaId}/historial/${historialId}`, {
            metodo: "PATCH",
            cuerpo: { valorAnterior: valor },
          }),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ["historial", recurso, lecturaId] });
      void cliente.invalidateQueries({ queryKey: ["quema-historial", lecturaId] });
      void cliente.invalidateQueries({ queryKey: ["balance", fecha] });
      void cliente.invalidateQueries({ queryKey: ["quema", fecha] });
    },
  });
}

// ---------------------------------------------------------------------------
// Novedades operativas
// ---------------------------------------------------------------------------

export interface FiltrosNovedades {
  desde: string;
  hasta: string;
  clienteId: number | null;
  fuenteId: number | null;
  page: number;
}

const queryNovedades = (f: FiltrosNovedades): string => {
  const p = new URLSearchParams({ page: String(f.page), pageSize: "20" });
  if (f.desde) p.set("desde", f.desde);
  if (f.hasta) p.set("hasta", f.hasta);
  if (f.clienteId !== null) p.set("clienteId", String(f.clienteId));
  if (f.fuenteId !== null) p.set("fuenteId", String(f.fuenteId));
  return p.toString();
};

/**
 * Primera lista del frontend con paginación de verdad.
 *
 * Las grillas diarias traen el día entero a propósito (decisión #60) porque se
 * digitan de corrido; las novedades crecen sin techo y se consultan, así que
 * van paginadas como manda §11.1.
 */
export function useNovedades(filtros: FiltrosNovedades) {
  return useQuery<Paginated<NovedadOperativaDto>, ApiError>({
    queryKey: ["novedades", filtros],
    queryFn: () => api<Paginated<NovedadOperativaDto>>(`/despacho/novedades?${queryNovedades(filtros)}`),
  });
}

/** Los `tipo` ya usados, para sugerirlos. La lista cerrada sigue abierta (§9.2 #4). */
export function useTiposNovedad() {
  return useQuery<Paginated<string>, ApiError>({
    queryKey: ["novedades-tipos"],
    queryFn: () => api<Paginated<string>>("/despacho/novedades/tipos"),
  });
}

const invalidarNovedades = (cliente: ReturnType<typeof useQueryClient>) => {
  void cliente.invalidateQueries({ queryKey: ["novedades"] });
  // Un tipo nuevo tecleado a mano pasa a estar disponible como sugerencia.
  void cliente.invalidateQueries({ queryKey: ["novedades-tipos"] });
};

export function useCrearNovedad() {
  const cliente = useQueryClient();
  return useMutation<NovedadOperativaDto, ApiError, CreateNovedadInput>({
    mutationFn: (cuerpo) =>
      api<NovedadOperativaDto>("/despacho/novedades", { metodo: "POST", cuerpo }),
    onSuccess: () => invalidarNovedades(cliente),
  });
}

export function useActualizarNovedad(id: string) {
  const cliente = useQueryClient();
  return useMutation<NovedadOperativaDto, ApiError, UpdateNovedadInput>({
    mutationFn: (cuerpo) =>
      api<NovedadOperativaDto>(`/despacho/novedades/${id}`, { metodo: "PATCH", cuerpo }),
    onSuccess: () => invalidarNovedades(cliente),
  });
}

/** El catálogo completo, para el desplegable de origen: `/clientes` pagina a
 *  100 como máximo (§11.1) y hay 111. */
export function useTodosLosClientes() {
  return useQuery<ClienteDto[], ApiError>({
    queryKey: ["clientes-todos"],
    queryFn: () => todasLasPaginas<ClienteDto>("/despacho/clientes"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTodasLasFuentes() {
  return useQuery<FuenteDto[], ApiError>({
    queryKey: ["fuentes-todas"],
    queryFn: () => todasLasPaginas<FuenteDto>("/despacho/fuentes"),
    staleTime: 5 * 60 * 1000,
  });
}

// --- Fechas con hora, sólo para las novedades -------------------------------
// `inicio` y `fin` son timestamps, no el día operativo de las lecturas, así
// que viajan en ISO 8601 y se editan con <input type="datetime-local">, que
// habla en hora local sin zona. Estas dos hacen la traducción.

/** ISO 8601 → el `YYYY-MM-DDTHH:mm` local que espera `datetime-local`. */
export function isoALocal(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** `YYYY-MM-DDTHH:mm` local → ISO 8601 en UTC. */
export const localAIso = (local: string): string => new Date(local).toISOString();

// ---------------------------------------------------------------------------
// Contactos — directorio telefónico
// ---------------------------------------------------------------------------

export interface FiltrosContactos {
  q: string;
  clienteId: number | null;
  fuenteId: number | null;
  page: number;
}

const queryContactos = (f: FiltrosContactos): string => {
  const p = new URLSearchParams({ page: String(f.page), pageSize: "20" });
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.clienteId !== null) p.set("clienteId", String(f.clienteId));
  if (f.fuenteId !== null) p.set("fuenteId", String(f.fuenteId));
  return p.toString();
};

export function useContactos(filtros: FiltrosContactos) {
  return useQuery<Paginated<ContactoDto>, ApiError>({
    queryKey: ["contactos", filtros],
    queryFn: () => api<Paginated<ContactoDto>>(`/despacho/contactos?${queryContactos(filtros)}`),
  });
}

const invalidarContactos = (cliente: ReturnType<typeof useQueryClient>) => {
  void cliente.invalidateQueries({ queryKey: ["contactos"] });
};

export function useCrearContacto() {
  const cliente = useQueryClient();
  return useMutation<ContactoDto, ApiError, CreateContactoInput>({
    mutationFn: (cuerpo) => api<ContactoDto>("/despacho/contactos", { metodo: "POST", cuerpo }),
    onSuccess: () => invalidarContactos(cliente),
  });
}

export function useActualizarContacto(id: number) {
  const cliente = useQueryClient();
  return useMutation<ContactoDto, ApiError, UpdateContactoInput>({
    mutationFn: (cuerpo) =>
      api<ContactoDto>(`/despacho/contactos/${id}`, { metodo: "PATCH", cuerpo }),
    onSuccess: () => invalidarContactos(cliente),
  });
}

/** Borrado físico, el único del módulo: la fila desaparece y no vuelve. */
export function useEliminarContacto() {
  const cliente = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: (id) => api<void>(`/despacho/contactos/${id}`, { metodo: "DELETE" }),
    onSuccess: () => invalidarContactos(cliente),
  });
}

// ---------------------------------------------------------------------------
// Reportes y gráficas
// ---------------------------------------------------------------------------

export function useConsumoPorSectores(fecha: string, tipoCorte: TipoCorte) {
  return useQuery<ConsumoPorSectoresDto, ApiError>({
    queryKey: ["consumo-sectores", fecha, tipoCorte],
    queryFn: () =>
      api<ConsumoPorSectoresDto>(
        `/despacho/reportes/consumo-por-sectores?fecha=${fecha}&tipoCorte=${tipoCorte}`,
      ),
  });
}

/** La serie del gráfico de línea. `dias` por defecto 7, la ventana del workbook. */
export function useSerieBalance(hasta: string, dias: number, tipoCorte: TipoCorte) {
  return useQuery<SerieBalanceDto, ApiError>({
    queryKey: ["serie-balance", hasta, dias, tipoCorte],
    queryFn: () =>
      api<SerieBalanceDto>(
        `/despacho/reportes/serie-balance?hasta=${hasta}&dias=${dias}&tipoCorte=${tipoCorte}`,
      ),
  });
}

/**
 * La URL de descarga del PDF del reporte.
 *
 * Un `<a href download>` y no un `fetch`: es una navegación normal del
 * navegador, así que las cookies de sesión viajan solas (mismo origen que
 * `api()`, `credentials: "include"` no hace falta acá) y el navegador muestra
 * su propio progreso de descarga en vez de tener que armar uno con un blob.
 */
export const urlExportarPdfReportes = (fecha: string, tipoCorte: TipoCorte): string =>
  `${BASE}/api/despacho/reportes/pdf?fecha=${fecha}&tipoCorte=${tipoCorte}`;

// ---------------------------------------------------------------------------
// Transferencias — el gas que sale del sistema sin ser consumo de un cliente
// ---------------------------------------------------------------------------

export const claveTransferencias = (fecha: string, tipoCorte: TipoCorte) =>
  ["transferencias", fecha, tipoCorte] as const;

/** Cinco puntos: la grilla viene entera, como la del día. */
export function useGrillaTransferencias(fecha: string, tipoCorte: TipoCorte) {
  return useQuery<Paginated<FilaTransferenciaDto>, ApiError>({
    queryKey: claveTransferencias(fecha, tipoCorte),
    queryFn: () =>
      api<Paginated<FilaTransferenciaDto>>(
        `/despacho/transferencias?fecha=${fecha}&tipoCorte=${tipoCorte}`,
      ),
  });
}

/**
 * Un solo hook para crear y corregir, igual que en las demás grillas.
 *
 * Invalida además el Balance Nación: las transferencias entran en el
 * transportado (decisión #79), así que las tarjetas quedan desactualizadas
 * apenas se toca una.
 */
export function useGuardarTransferencia(fecha: string, tipoCorte: TipoCorte) {
  const cliente = useQueryClient();
  return useMutation<
    LecturaTransferenciaDto,
    ApiError,
    { puntoId: number; lecturaId: string | null; mmpced: number }
  >({
    mutationFn: ({ puntoId, lecturaId, mmpced }) =>
      lecturaId === null
        ? api<LecturaTransferenciaDto>("/despacho/transferencias", {
            metodo: "POST",
            cuerpo: { puntoId, fecha, mmpced },
          })
        : api<LecturaTransferenciaDto>(`/despacho/transferencias/${lecturaId}`, {
            metodo: "PATCH",
            cuerpo: { mmpced },
          }),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: claveTransferencias(fecha, tipoCorte) });
      void cliente.invalidateQueries({ queryKey: ["balance-nacion", fecha] });
      void cliente.invalidateQueries({ queryKey: ["consumo-sectores", fecha] });
    },
  });
}
