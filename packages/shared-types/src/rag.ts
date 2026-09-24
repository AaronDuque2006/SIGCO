// Fase 2 — RAG (CONTEXTO_PROYECTO.md §16).

export type EstadoDocumentoRag = "PENDIENTE" | "PROCESANDO" | "LISTO" | "ERROR";
export type TipoArchivoRag = "PPTX" | "DOCX" | "PDF" | "XLSX";

export interface DocumentoRagDto {
  id: number;
  nombre: string;
  tipoArchivo: TipoArchivoRag;
  tamanoBytes: number;
  estado: EstadoDocumentoRag;
  errorDetalle: string | null;
  subidoPor: string;
  subidoEn: string;
  procesadoEn: string | null;
  chunks: number;
  /** Esquemas sin descripción: no se recuperan hasta que alguien la escriba. */
  imagenesSinDescripcion: number;
}

/** Un fragmento que se le pasó al modelo, para citarlo en la respuesta. */
export interface FuenteRagDto {
  /** El número con que el modelo lo cita: [1], [2]… */
  n: number;
  tipo: "TEXTO" | "TABLA" | "IMAGEN" | "NOVEDAD";
  /** Nombre del documento; null si es una novedad. */
  documento: string | null;
  /** Slide o página; null en docx y novedades. */
  origen: number | null;
  seccion: string | null;
  novedadId: string | null;
  contenido: string;
}

/**
 * La respuesta de `POST /api/rag/consultas` llega de a pedazos, un JSON por
 * línea (NDJSON), para que se vea mientras el modelo la escribe.
 */
export type EventoConsultaRag =
  /** El id con que se puede valorar la respuesta ("¿le sirvió?"). */
  | { tipo: "consulta"; id: string }
  | { tipo: "espera"; posicion: number }
  | { tipo: "fuentes"; fuentes: FuenteRagDto[] }
  | { tipo: "texto"; texto: string }
  | { tipo: "fin" }
  | { tipo: "error"; mensaje: string };

/** Una respuesta valorada, para que el superadmin revise las que no sirvieron. */
export interface ValoracionRagDto {
  id: string;
  usuario: string;
  pregunta: string;
  respuesta: string | null;
  util: boolean;
  comentario: string | null;
  creadoEn: string;
  valoradaEn: string;
}

/**
 * Una consulta propia del historial "Mis consultas" (decisión #108): las de
 * los últimos 30 días, con las fuentes tal como se mostraron entonces.
 */
export interface ConsultaPropiaRagDto {
  id: string;
  pregunta: string;
  /** Null si se cortó antes de que el asistente escribiera. */
  respuesta: string | null;
  /**
   * Hecha antes de que se guardaran respuesta y fuentes (2026-09-24): la
   * respuesta existió pero no quedó registrada.
   */
  anteriorAlHistorial: boolean;
  fuentes: FuenteRagDto[];
  creadoEn: string;
  duracionMs: number | null;
  util: boolean | null;
}
