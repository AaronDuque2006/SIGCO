"use client";

import type {
  CatalogosUsuarioDto,
  Paginated,
  UsuarioConPasswordTemporalDto,
  UsuarioDto,
} from "@sicog/shared-types";
import type { ActualizarUsuarioInput, CrearUsuarioInput } from "@sicog/shared-validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "./api";

export interface FiltroUsuarios {
  page: number;
  busqueda: string;
  soloBloqueados: boolean;
}

const claveLista = (f: FiltroUsuarios) =>
  ["usuarios", f.page, f.busqueda, f.soloBloqueados] as const;

export function useCatalogosUsuario() {
  return useQuery<CatalogosUsuarioDto, ApiError>({
    queryKey: ["usuarios", "catalogos"],
    queryFn: () => api<CatalogosUsuarioDto>("/usuarios/catalogos"),
    // El organigrama no cambia durante una sesión de trabajo.
    staleTime: Infinity,
  });
}

export function useListaUsuarios(filtro: FiltroUsuarios) {
  return useQuery<Paginated<UsuarioDto>, ApiError>({
    queryKey: claveLista(filtro),
    queryFn: () => {
      const p = new URLSearchParams({ page: String(filtro.page) });
      if (filtro.busqueda !== "") p.set("busqueda", filtro.busqueda);
      if (filtro.soloBloqueados) p.set("soloBloqueados", "true");
      return api<Paginated<UsuarioDto>>(`/usuarios?${p.toString()}`);
    },
  });
}

/** Invalida todo el listado: cualquier cambio puede mover a alguien de página
 *  o cambiar su estado, y son unas pocas decenas de filas. */
function useRefrescarUsuarios() {
  const cliente = useQueryClient();
  return () => cliente.invalidateQueries({ queryKey: ["usuarios"] });
}

export function useCrearUsuario() {
  const refrescar = useRefrescarUsuarios();
  return useMutation<UsuarioConPasswordTemporalDto, ApiError, CrearUsuarioInput>({
    mutationFn: (datos) =>
      api<UsuarioConPasswordTemporalDto>("/usuarios", { metodo: "POST", cuerpo: datos }),
    onSuccess: refrescar,
  });
}

export function useActualizarUsuario() {
  const refrescar = useRefrescarUsuarios();
  return useMutation<UsuarioDto, ApiError, { id: number; datos: ActualizarUsuarioInput }>({
    mutationFn: ({ id, datos }) =>
      api<UsuarioDto>(`/usuarios/${id}`, { metodo: "PATCH", cuerpo: datos }),
    onSuccess: refrescar,
  });
}

export function useEstablecerBloqueo() {
  const refrescar = useRefrescarUsuarios();
  return useMutation<UsuarioDto, ApiError, { id: number; bloqueado: boolean }>({
    mutationFn: ({ id, bloqueado }) =>
      api<UsuarioDto>(`/usuarios/${id}/bloqueo`, { metodo: "PUT", cuerpo: { bloqueado } }),
    onSuccess: refrescar,
  });
}

export function useReiniciarPassword() {
  const refrescar = useRefrescarUsuarios();
  return useMutation<UsuarioConPasswordTemporalDto, ApiError, number>({
    mutationFn: (id) =>
      api<UsuarioConPasswordTemporalDto>(`/usuarios/${id}/password-temporal`, { metodo: "POST" }),
    onSuccess: refrescar,
  });
}
