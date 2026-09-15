"use client";

import type {
  BalanceNacionDto,
  FilaBalanceDiarioDto,
  HistorialEntryDto,
  FilaFuenteDiariaDto,
  LecturaBalanceDto,
  LecturaFuenteDto,
  Paginated,
  QuemaNacionalDiaDto,
  QuemaNacionalDto,
  TipoCorte,
  UsuarioSesionDto,
} from "@sicog/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "./api";

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
    mutationFn: ({ clienteId, lecturaId, volumenMmpced }) =>
      lecturaId === null
        ? api<LecturaBalanceDto>("/despacho/lecturas-balance", {
            metodo: "POST",
            cuerpo: { clienteId, fecha, volumenMmpced },
          })
        : api<LecturaBalanceDto>(`/despacho/lecturas-balance/${lecturaId}`, {
            metodo: "PATCH",
            cuerpo: { volumenMmpced },
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
    { fuenteId: number; lecturaId: string | null; volumenMmpced: number }
  >({
    mutationFn: ({ fuenteId, lecturaId, volumenMmpced }) =>
      lecturaId === null
        ? api<LecturaFuenteDto>("/despacho/lecturas-fuente", {
            metodo: "POST",
            cuerpo: { fuenteId, fecha, volumenMmpced },
          })
        : api<LecturaFuenteDto>(`/despacho/lecturas-fuente/${lecturaId}`, {
            metodo: "PATCH",
            cuerpo: { volumenMmpced },
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
  return useMutation<QuemaNacionalDto, ApiError, { quemaId: string | null; mmpced: number }>({
    mutationFn: ({ quemaId, mmpced }) =>
      quemaId === null
        ? api<QuemaNacionalDto>("/despacho/quema-nacional", {
            metodo: "POST",
            cuerpo: { fecha, mmpced },
          })
        : api<QuemaNacionalDto>(`/despacho/quema-nacional/${quemaId}`, {
            metodo: "PATCH",
            cuerpo: { mmpced },
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
