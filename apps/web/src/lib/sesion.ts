"use client";

import type { UsuarioSesionDto } from "@sicog/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "./api";

export const CLAVE_SESION = ["sesion"] as const;

/**
 * La sesión no se puede leer de las cookies —son httpOnly a propósito— así que
 * la única fuente de verdad es el backend. Un 401 acá no es un error a mostrar:
 * significa "no hay sesión", y es el estado normal antes de iniciarla.
 */
export function useSesion() {
  const consulta = useQuery<UsuarioSesionDto, ApiError>({
    queryKey: CLAVE_SESION,
    queryFn: () => api<UsuarioSesionDto>("/auth/sesion"),
  });

  const sinSesion = consulta.error?.status === 401;
  return {
    sesion: consulta.data ?? null,
    cargando: consulta.isPending,
    sinSesion,
    error: sinSesion ? null : consulta.error,
  };
}

export function useLogin() {
  const cliente = useQueryClient();
  return useMutation<UsuarioSesionDto, ApiError, { nombre: string; password: string }>({
    mutationFn: (datos) =>
      api<UsuarioSesionDto>("/auth/login", {
        metodo: "POST",
        cuerpo: datos,
        reintentar: false,
      }),
    onSuccess: (sesion) => cliente.setQueryData(CLAVE_SESION, sesion),
  });
}

export function useCambiarPassword() {
  const cliente = useQueryClient();
  return useMutation<
    UsuarioSesionDto,
    ApiError,
    { passwordActual: string; passwordNueva: string }
  >({
    mutationFn: (datos) =>
      api<UsuarioSesionDto>("/auth/password", { metodo: "PUT", cuerpo: datos }),
    // El backend cierra todas las sesiones y emite cookies nuevas, así que la
    // respuesta es la sesión ya vigente: se escribe en la caché sin recargar.
    onSuccess: (sesion) => cliente.setQueryData(CLAVE_SESION, sesion),
  });
}

export function useLogout() {
  const cliente = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationFn: () => api<void>("/auth/logout", { metodo: "POST", reintentar: false }),
    // Se limpia toda la caché y no sólo la sesión: cualquier dato operativo que
    // haya quedado cargado es de la persona que se está yendo.
    onSettled: () => cliente.clear(),
  });
}
