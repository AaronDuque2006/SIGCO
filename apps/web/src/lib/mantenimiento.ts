"use client";

import type {
  AreaMttoDto,
  CausaFallaDto,
  DisponibilidadDto,
  EstacionDetalleDto,
  EstacionDto,
  FallaEstacionDto,
  FallaHistorialEntryDto,
  Paginated,
  SerieDisponibilidadDto,
} from "@sicog/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, todasLasPaginas } from "./api";

/** Mismo criterio que Actividades: la puerta real es el 403 del backend, esto
 *  sólo evita ofrecer un control que va a rebotar. */
export const DEPARTAMENTO_MANTENIMIENTO = "Mantenimiento";

export interface FiltrosEstaciones {
  page: number;
  regionId?: number;
  areaId?: number;
  tipoRed?: "TRANSPORTE" | "DISTRIBUCION";
  estado?: "OPERATIVA" | "EN_FALLA";
  causaFallaId?: number;
  /** Filtran por solapamiento con el período, no por cuándo empezó la falla. */
  desde?: string;
  hasta?: string;
  q?: string;
}

const query = (params: Record<string, string | number | undefined>): string => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
};

// ---------------------------------------------------------------------------
// Catálogos
// ---------------------------------------------------------------------------

export const useAreas = () =>
  useQuery({
    queryKey: ["mtto", "areas"],
    queryFn: () => todasLasPaginas<AreaMttoDto>("/mantenimiento/areas"),
    staleTime: 5 * 60_000,
  });

export const useCausasFalla = () =>
  useQuery({
    queryKey: ["mtto", "causas"],
    queryFn: () => todasLasPaginas<CausaFallaDto>("/mantenimiento/causas-falla"),
    staleTime: 5 * 60_000,
  });

// ---------------------------------------------------------------------------
// Estaciones
// ---------------------------------------------------------------------------

export const useEstaciones = (filtros: FiltrosEstaciones) =>
  useQuery({
    queryKey: ["mtto", "estaciones", filtros],
    queryFn: () =>
      api<Paginated<EstacionDto>>(`/mantenimiento/estaciones${query({ ...filtros, pageSize: 50 })}`),
    placeholderData: (previa) => previa,
  });

/**
 * Todas las estaciones que hoy están operativas, sin paginar.
 *
 * Es la lista a la que se le puede anotar una falla: una estación que ya tiene
 * una abierta no admite otra, y el backend la rechaza con un 409. Recorre las
 * páginas porque son del orden de medio centenar y el listado topa en 100 por
 * página — pedirlas de a una página dejaba afuera a las últimas **sin avisar**,
 * que fue justo lo que pasó.
 */
export const useEstacionesOperativas = () =>
  useQuery({
    queryKey: ["mtto", "estaciones", "operativas"],
    queryFn: () => todasLasPaginas<EstacionDto>("/mantenimiento/estaciones?estado=OPERATIVA"),
  });

export const useEstacion = (id: number | null) =>
  useQuery({
    queryKey: ["mtto", "estacion", id],
    queryFn: () => api<EstacionDetalleDto>(`/mantenimiento/estaciones/${id}`),
    enabled: id !== null,
  });

/**
 * Alta de una estación. Supervisor+ de Mantenimiento (§15.2) — el backend es
 * quien lo exige de verdad; acá sólo se invalida lo que cambia con el
 * inventario: el listado y el tablero de disponibilidad, que cuenta
 * estaciones.
 */
export const useCrearEstacion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: {
      nodo: string;
      nombre: string;
      areaId: number;
      tipoEnlaceCom: string;
      tipoRed: "TRANSPORTE" | "DISTRIBUCION" | null;
    }) => api<EstacionDetalleDto>("/mantenimiento/estaciones", { metodo: "POST", cuerpo: datos }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["mtto", "estaciones"] });
      void qc.invalidateQueries({ queryKey: ["mtto", "disponibilidad"] });
    },
  });
};

export const useActualizarEstacion = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: {
      nombre?: string;
      areaId?: number;
      tipoEnlaceCom?: string;
      tipoRed?: "TRANSPORTE" | "DISTRIBUCION" | null;
    }) =>
      api<EstacionDetalleDto>(`/mantenimiento/estaciones/${id}`, { metodo: "PATCH", cuerpo: datos }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["mtto", "estaciones"] });
      void qc.invalidateQueries({ queryKey: ["mtto", "estacion", id] });
      void qc.invalidateQueries({ queryKey: ["mtto", "disponibilidad"] });
    },
  });
};

// ---------------------------------------------------------------------------
// Bitácora de fallas
// ---------------------------------------------------------------------------

export interface FiltrosFallas {
  page: number;
  estacionId?: number;
  regionId?: number;
  areaId?: number;
  causaFallaId?: number;
  tipoRed?: "TRANSPORTE" | "DISTRIBUCION";
  soloAbiertas?: boolean;
  /** Solapamiento, no contención: una falla abierta en 2018 aparece al pedir
   *  2026. Es lo que hace útil el rango sobre una bitácora de años. */
  desde?: string;
  hasta?: string;
  q?: string;
}

export const useFallas = (filtros: FiltrosFallas) =>
  useQuery({
    queryKey: ["mtto", "fallas", filtros],
    queryFn: () =>
      api<Paginated<FallaEstacionDto>>(
        `/mantenimiento/fallas${query({
          ...filtros,
          soloAbiertas: filtros.soloAbiertas ? "true" : undefined,
          pageSize: 50,
        })}`,
      ),
    placeholderData: (previa) => previa,
  });

/** Todas las fallas del filtro, no sólo la página visible: para exportarlas.
 *  Es una petición por cada 100 fallas y se hace al tocar el botón, no antes. */
export const todasLasFallas = (filtros: FiltrosFallas) =>
  todasLasPaginas<FallaEstacionDto>(
    // `page` fuera: la pone `todasLasPaginas` en cada vuelta.
    `/mantenimiento/fallas${query({ ...filtros, page: undefined, soloAbiertas: filtros.soloAbiertas ? "true" : undefined })}`,
  );

/** Todo lo que cambia el estado de una estación invalida también el tablero y
 *  el inventario: son la misma verdad mirada de tres formas. */
const useInvalidarTodo = () => {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["mtto", "fallas"] });
    void qc.invalidateQueries({ queryKey: ["mtto", "estaciones"] });
    void qc.invalidateQueries({ queryKey: ["mtto", "estacion"] });
    void qc.invalidateQueries({ queryKey: ["mtto", "disponibilidad"] });
    void qc.invalidateQueries({ queryKey: ["mtto", "serie"] });
  };
};

export const useAbrirFalla = () => {
  const invalidar = useInvalidarTodo();
  return useMutation({
    mutationFn: (datos: {
      estacionId: number;
      causaFallaId: number;
      desde: string;
      observacion: string | null;
    }) => api<FallaEstacionDto>("/mantenimiento/fallas", { metodo: "POST", cuerpo: datos }),
    onSuccess: invalidar,
  });
};

export const useResolverFalla = () => {
  const invalidar = useInvalidarTodo();
  return useMutation({
    mutationFn: ({ id, resueltaEn }: { id: string; resueltaEn: string }) =>
      api<FallaEstacionDto>(`/mantenimiento/fallas/${id}/resolver`, {
        metodo: "PUT",
        cuerpo: { resueltaEn },
      }),
    onSuccess: invalidar,
  });
};

/**
 * El historial de correcciones de una falla (§15.5): la foto de `causaFalla`,
 * `desde` y `observacion` justo antes de cada PATCH. `enabled` sólo cuando la
 * fila está desplegada, mismo criterio que `useHistorialLectura` en Despacho.
 */
export function useHistorialFalla(fallaId: string | null, abierto: boolean) {
  return useQuery<Paginated<FallaHistorialEntryDto>>({
    queryKey: ["mtto", "historial-falla", fallaId],
    queryFn: () =>
      api<Paginated<FallaHistorialEntryDto>>(`/mantenimiento/fallas/${fallaId}/historial`),
    enabled: abierto && fallaId !== null,
  });
}

// ---------------------------------------------------------------------------
// Reportes
// ---------------------------------------------------------------------------

export const useDisponibilidad = (fecha?: string) =>
  useQuery({
    queryKey: ["mtto", "disponibilidad", fecha ?? "hoy"],
    queryFn: () => api<DisponibilidadDto>(`/mantenimiento/reportes/disponibilidad${query({ fecha })}`),
  });

export const useSerieDisponibilidad = (anio: number) =>
  useQuery({
    queryKey: ["mtto", "serie", anio],
    queryFn: () =>
      api<SerieDisponibilidadDto>(`/mantenimiento/reportes/serie-disponibilidad?anio=${anio}`),
  });

/** Un porcentaje que puede no existir: sin denominador la pantalla lo dice, no
 *  inventa un cero (mismo criterio que el REAL/PLAN de Actividades). */
export const formatearPorcentaje = (v: number | null): string =>
  v === null ? "sin datos" : `${v.toFixed(1)}%`;

export const formatearFecha = (f: string): string => f.split("-").reverse().join("/");

/** Los días de caída son el dato de gestión, no la fecha suelta: en el reporte
 *  real hay estaciones con más de diez años abajo. */
export const formatearDiasCaida = (dias: number): string => {
  if (dias < 60) return `${dias} día${dias === 1 ? "" : "s"}`;
  const anios = Math.floor(dias / 365);
  if (anios >= 1) return `${anios} año${anios === 1 ? "" : "s"}`;
  return `${Math.floor(dias / 30)} meses`;
};
