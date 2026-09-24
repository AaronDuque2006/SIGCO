"use client";

import type { DocumentoRagDto, EventoConsultaRag, ValoracionRagDto } from "@sicog/shared-types";
import type { ValoracionRagInput } from "@sicog/shared-validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiRespuesta, ApiError } from "./api";

// Fase 2 — asistente de consulta (CONTEXTO_PROYECTO.md §16).

const CLAVE = ["rag", "documentos"] as const;

const enCurso = (d: DocumentoRagDto) => d.estado === "PENDIENTE" || d.estado === "PROCESANDO";

export function useDocumentosRag() {
  return useQuery<DocumentoRagDto[], ApiError>({
    queryKey: CLAVE,
    queryFn: () => api<DocumentoRagDto[]>("/rag/documentos"),
    // Mientras haya algo en cola se pregunta cada 5 segundos: procesar el
    // Manual DAO tarda unos 3 minutos y el estado lo cambia el worker, no esta
    // pantalla.
    refetchInterval: (q) => (q.state.data?.some(enCurso) ? 5000 : false),
  });
}

function useRefrescar() {
  const cliente = useQueryClient();
  return () => cliente.invalidateQueries({ queryKey: CLAVE });
}

export function useSubirDocumento() {
  const refrescar = useRefrescar();
  return useMutation<DocumentoRagDto, ApiError, File>({
    mutationFn: (archivo) =>
      api<DocumentoRagDto>("/rag/documentos", {
        metodo: "POST",
        binario: archivo,
        // Codificado: los nombres reales llevan tildes y un encabezado HTTP
        // sólo admite ASCII.
        cabeceras: { "X-Nombre-Archivo": encodeURIComponent(archivo.name) },
      }),
    onSuccess: refrescar,
  });
}

export function useEliminarDocumento() {
  const refrescar = useRefrescar();
  return useMutation<void, ApiError, number>({
    mutationFn: (id) => api<void>(`/rag/documentos/${id}`, { metodo: "DELETE" }),
    onSuccess: refrescar,
  });
}

export function useReprocesarDocumento() {
  const refrescar = useRefrescar();
  return useMutation<DocumentoRagDto, ApiError, number>({
    mutationFn: (id) => api<DocumentoRagDto>(`/rag/documentos/${id}/reprocesar`, { metodo: "POST" }),
    onSuccess: refrescar,
  });
}

/** "¿Le sirvió?" sobre una respuesta propia. */
export function useValorarRespuesta() {
  const cliente = useQueryClient();
  return useMutation<void, ApiError, { id: string; valoracion: ValoracionRagInput }>({
    mutationFn: ({ id, valoracion }) =>
      api<void>(`/rag/consultas/${id}/valoracion`, { metodo: "PUT", cuerpo: valoracion }),
    onSuccess: () => cliente.invalidateQueries({ queryKey: ["rag", "valoraciones"] }),
  });
}

/** Las respuestas marcadas como no útiles, para que el superadmin las revise. */
export function useRespuestasNoUtiles() {
  return useQuery<ValoracionRagDto[], ApiError>({
    queryKey: ["rag", "valoraciones", "no-utiles"],
    queryFn: () => api<ValoracionRagDto[]>("/rag/valoraciones?util=false"),
  });
}

/**
 * Hace la pregunta y va entregando los eventos a medida que llegan: primero
 * las fuentes, después la respuesta de a pedazos. Una línea NDJSON puede
 * quedar partida entre dos lecturas, así que se acumula hasta el salto.
 */
export async function consultarAsistente(
  pregunta: string,
  senal: AbortSignal,
  alRecibir: (evento: EventoConsultaRag) => void,
): Promise<void> {
  const res = await apiRespuesta("/rag/consultas", { metodo: "POST", cuerpo: { pregunta }, senal });
  if (!res.body) throw new ApiError("NETWORK_ERROR", "El servidor no devolvió respuesta.", res.status);

  const lector = res.body.getReader();
  const decoder = new TextDecoder();
  let pendiente = "";
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    pendiente += decoder.decode(value, { stream: true });
    const lineas = pendiente.split("\n");
    pendiente = lineas.pop() ?? "";
    for (const linea of lineas) {
      if (linea.trim()) alRecibir(JSON.parse(linea) as EventoConsultaRag);
    }
  }
  if (pendiente.trim()) alRecibir(JSON.parse(pendiente) as EventoConsultaRag);
}
