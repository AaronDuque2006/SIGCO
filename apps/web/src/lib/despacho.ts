"use client";

import type {
  FilaBalanceDiarioDto,
  LecturaBalanceDto,
  Paginated,
  TipoCorte,
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
    onSuccess: () => cliente.invalidateQueries({ queryKey: claveGrilla(fecha, tipoCorte) }),
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

export const formatearVolumen = (v: number): string =>
  v.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
