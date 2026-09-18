"use client";

import type {
  ActividadRegistroDto,
  GerenciaRequirienteDto,
  InsumoDto,
  MatrizMetasDto,
  OpcionCatalogoDto,
  Paginated,
  ParticipacionDto,
  PlanVsRealDto,
  ProductoServicioDto,
  RegionMttoDto,
  ResponsableDto,
  UsuarioSesionDto,
} from "@sicog/shared-types";
import type {
  CreateActividadRegistroInput,
  ReemplazarMetasInput,
  UpdateActividadRegistroInput,
} from "@sicog/shared-validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "./api";

/**
 * El nombre del departamento es la clave que se compara contra
 * `departamentosQueEdita`, así que tiene que coincidir carácter por carácter
 * con la fila sembrada (decisiones #22 y #59).
 *
 * Hoy el módulo sólo tiene catálogo levantado para Mantenimiento; los otros
 * tres departamentos comparten la estructura y no tienen planilla de origen.
 */
export const DEPARTAMENTO_MANTENIMIENTO = "Mantenimiento";
export const DEPARTAMENTO_DESPACHO = "Despacho";

export const puedeEditarDepartamento = (
  sesion: UsuarioSesionDto | null,
  departamento: string,
): boolean => sesion?.departamentosQueEdita.includes(departamento) === true;

/** Sólo Supervisor hacia arriba gobierna los catálogos (decisión #31) y carga
 *  el plan anual (decisión #30). La puerta real es el 403 del backend. */
export const esSupervisorOSuperior = (sesion: UsuarioSesionDto | null): boolean =>
  sesion !== null && ["Gerente", "Superintendente", "Supervisor"].includes(sesion.puesto);

/** El único puesto que no crea registros: recibe asignaciones (decisión #83). */
export const puedeCrearRegistros = (sesion: UsuarioSesionDto | null): boolean =>
  sesion !== null && sesion.puesto !== "Analista";

// ---------------------------------------------------------------------------
// Catálogos
// ---------------------------------------------------------------------------

/**
 * El id del departamento, que los endpoints piden como número.
 *
 * Sale de su propio catálogo y **no de los insumos**, que es de donde salía
 * antes: un departamento sin catálogo cargado —que es el caso de Despacho, y
 * el de los otros dos— no tiene ni un insumo del que deducirlo, así que la
 * pantalla entera se quedaba sin id y sin datos.
 */
export function useDepartamentoId(nombre: string) {
  const deptos = useQuery<OpcionCatalogoDto[], ApiError>({
    queryKey: ["actividades", "departamentos"],
    queryFn: () => lista<OpcionCatalogoDto>("/actividades/departamentos"),
    staleTime: Infinity,
  });
  return deptos.data?.find((d) => d.nombre === nombre)?.id ?? null;
}

const lista = <T,>(ruta: string) => api<Paginated<T>>(ruta).then((r) => r.data);

export function useInsumos(departamentoId?: number) {
  return useQuery<InsumoDto[], ApiError>({
    queryKey: ["actividades", "insumos", departamentoId ?? null],
    queryFn: () =>
      lista<InsumoDto>(
        `/actividades/insumos${departamentoId === undefined ? "" : `?departamentoId=${departamentoId}`}`,
      ),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductosServicio(departamentoId?: number) {
  return useQuery<ProductoServicioDto[], ApiError>({
    queryKey: ["actividades", "productos", departamentoId ?? null],
    queryFn: () =>
      lista<ProductoServicioDto>(
        `/actividades/productos-servicio${departamentoId === undefined ? "" : `?departamentoId=${departamentoId}`}`,
      ),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGerencias(departamentoId?: number) {
  return useQuery<GerenciaRequirienteDto[], ApiError>({
    queryKey: ["actividades", "gerencias", departamentoId ?? null],
    queryFn: () =>
      lista<GerenciaRequirienteDto>(
        `/actividades/gerencias-requirientes${departamentoId === undefined ? "" : `?departamentoId=${departamentoId}`}`,
      ),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRegionesMtto() {
  return useQuery<RegionMttoDto[], ApiError>({
    queryKey: ["actividades", "regiones"],
    queryFn: () => lista<RegionMttoDto>("/actividades/regiones-mtto"),
    staleTime: Infinity,
  });
}

/**
 * A nombre de quién se puede registrar.
 *
 * No sale de `/api/usuarios`, que es exclusivo del superadmin (decisión #11):
 * un Supervisor tiene que poder asignarle trabajo a su gente sin serlo.
 */
export function useResponsables(departamentoId?: number) {
  return useQuery<ResponsableDto[], ApiError>({
    queryKey: ["actividades", "responsables", departamentoId ?? null],
    queryFn: () => lista<ResponsableDto>(`/actividades/registros/responsables?departamentoId=${departamentoId!}`),
    enabled: departamentoId !== undefined,
    staleTime: 5 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Registros
// ---------------------------------------------------------------------------

export interface FiltrosRegistros {
  page: number;
  departamentoId?: number;
  usuarioId?: number;
  cadena?: boolean;
  desde?: string;
  hasta?: string;
  insumoId?: number;
  productoServicioId?: number;
  gerenciaRequirienteId?: number;
  estatus?: string;
  q?: string;
}

const consulta = (f: FiltrosRegistros): string => {
  const p = new URLSearchParams({ page: String(f.page), pageSize: "20" });
  if (f.departamentoId !== undefined) p.set("departamentoId", String(f.departamentoId));
  if (f.usuarioId !== undefined) p.set("usuarioId", String(f.usuarioId));
  if (f.cadena === true) p.set("cadena", "true");
  if (f.desde) p.set("desde", f.desde);
  if (f.hasta) p.set("hasta", f.hasta);
  if (f.insumoId !== undefined) p.set("insumoId", String(f.insumoId));
  if (f.productoServicioId !== undefined)
    p.set("productoServicioId", String(f.productoServicioId));
  if (f.gerenciaRequirienteId !== undefined)
    p.set("gerenciaRequirienteId", String(f.gerenciaRequirienteId));
  if (f.estatus) p.set("estatus", f.estatus);
  if (f.q) p.set("q", f.q);
  return p.toString();
};

export function useRegistros(filtros: FiltrosRegistros) {
  return useQuery<Paginated<ActividadRegistroDto>, ApiError>({
    queryKey: ["actividades", "registros", filtros],
    queryFn: () => api<Paginated<ActividadRegistroDto>>(`/actividades/registros?${consulta(filtros)}`),
  });
}

function useRefrescarRegistros() {
  const cliente = useQueryClient();
  return () => cliente.invalidateQueries({ queryKey: ["actividades"] });
}

/**
 * El alta exige `Idempotency-Key` (decisión #82).
 *
 * **La clave se genera una vez por intento del usuario y se reusa en el
 * reintento**, que es todo el punto: una clave nueva por cada envío sería una
 * clave por intento, y cada reintento volvería a crear la fila. Por eso la
 * genera quien arma el formulario y viaja como parte de la mutación, no acá
 * adentro.
 */
export function useCrearRegistro() {
  const refrescar = useRefrescarRegistros();
  return useMutation<
    ActividadRegistroDto,
    ApiError,
    { datos: CreateActividadRegistroInput; claveIdempotencia: string }
  >({
    mutationFn: ({ datos, claveIdempotencia }) =>
      api<ActividadRegistroDto>("/actividades/registros", {
        metodo: "POST",
        cuerpo: datos,
        cabeceras: { "Idempotency-Key": claveIdempotencia },
      }),
    onSuccess: refrescar,
  });
}

export function useActualizarRegistro() {
  const refrescar = useRefrescarRegistros();
  return useMutation<
    ActividadRegistroDto,
    ApiError,
    { id: string; datos: UpdateActividadRegistroInput }
  >({
    mutationFn: ({ id, datos }) =>
      api<ActividadRegistroDto>(`/actividades/registros/${id}`, { metodo: "PATCH", cuerpo: datos }),
    onSuccess: refrescar,
  });
}

// ---------------------------------------------------------------------------
// Plan anual y reportes
// ---------------------------------------------------------------------------

export function useMatrizMetas(anio: number, departamentoId?: number) {
  return useQuery<MatrizMetasDto, ApiError>({
    queryKey: ["actividades", "metas", anio, departamentoId ?? null],
    queryFn: () =>
      api<MatrizMetasDto>(
        `/actividades/metas?anio=${anio}${departamentoId === undefined ? "" : `&departamentoId=${departamentoId}`}`,
      ),
    enabled: departamentoId !== undefined,
  });
}

export function useReemplazarMetas(anio: number) {
  const cliente = useQueryClient();
  return useMutation<MatrizMetasDto, ApiError, ReemplazarMetasInput>({
    mutationFn: (datos) =>
      api<MatrizMetasDto>(`/actividades/metas/${anio}`, { metodo: "PUT", cuerpo: datos }),
    onSuccess: () => cliente.invalidateQueries({ queryKey: ["actividades"] }),
  });
}

export function usePlanVsReal(anio: number, departamentoId?: number) {
  return useQuery<PlanVsRealDto, ApiError>({
    queryKey: ["actividades", "plan-vs-real", anio, departamentoId ?? null],
    queryFn: () =>
      api<PlanVsRealDto>(
        `/actividades/reportes/plan-vs-real?anio=${anio}${departamentoId === undefined ? "" : `&departamentoId=${departamentoId}`}`,
      ),
    enabled: departamentoId !== undefined,
  });
}

export function useParticipacion(anio: number, mes: number, departamentoId?: number) {
  return useQuery<ParticipacionDto, ApiError>({
    queryKey: ["actividades", "participacion", anio, mes, departamentoId ?? null],
    queryFn: () =>
      api<ParticipacionDto>(
        `/actividades/reportes/participacion?anio=${anio}&mes=${mes}${departamentoId === undefined ? "" : `&departamentoId=${departamentoId}`}`,
      ),
    enabled: departamentoId !== undefined,
  });
}

// ---------------------------------------------------------------------------
// Formato
// ---------------------------------------------------------------------------

export const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;

/** Horas-hombre: dos decimales, y `null` cuando la tarea está asignada y sin
 *  ejecutar. El guion dice "todavía no"; un cero diría "tomó cero horas". */
export const formatearHh = (v: number | null): string =>
  v === null ? "—" : v.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** El cumplimiento viaja `null` cuando no hay meta con qué comparar. */
export const formatearPorcentaje = (v: number | null): string =>
  v === null ? "sin meta" : `${v.toLocaleString("es-VE", { maximumFractionDigits: 1 })}%`;
