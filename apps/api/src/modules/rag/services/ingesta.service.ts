import { readFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../../../shared/env.js";
import type { ChunkCandidato } from "../parsers/comun.js";
import { parsearDocx } from "../parsers/docx.parser.js";
import { parsearPptx } from "../parsers/pptx.parser.js";
import {
  chunkRagRepository,
  type IChunkRagRepository,
  type NovedadParaIndexar,
} from "../repositories/chunk-rag.repository.js";
import {
  documentoRagRepository,
  type ChunkParaGuardar,
  type DocumentoTomado,
  type IDocumentoRagRepository,
} from "../repositories/documento-rag.repository.js";
import { modeloLenguaje, type IModeloLenguaje } from "./ollama.client.js";
import { paraIndexar } from "./texto-indexado.js";

// Un documento que lleva más que esto en PROCESANDO es de un worker que murió
// a mitad (§16.7 paso 2). El Manual DAO entero tarda unos 3 minutos.
const MINUTOS_TRABADO = 30;
const LOTE_NOVEDADES = 32;

// §16.8: un documento con datos personales no entra al corpus. Tres cédulas
// alcanzan para sospechar de un listado de personal; una sola puede ser un
// contacto en un procedimiento.
const CEDULA = /\b[VEve]-?\s?\d{1,2}\.?\d{3}\.?\d{3}\b/g;
const MAX_CEDULAS = 3;

/** Ollama caído o sin responder: se reintenta solo, no es culpa del documento. */
const esFallaDeConexion = (err: unknown): boolean =>
  err instanceof TypeError && /fetch failed/i.test(err.message);

export const rutaAbsoluta = (rutaRelativa: string): string =>
  path.resolve(env.RAG_DIR_ARCHIVOS, rutaRelativa);

function parsear(doc: DocumentoTomado, datos: Uint8Array): ChunkCandidato[] {
  const nombre = doc.nombre.replace(/\.[^.]+$/, "");
  switch (doc.tipoArchivo) {
    case "PPTX":
      return parsearPptx(datos, nombre);
    case "DOCX":
      return parsearDocx(datos, nombre);
    default:
      throw new Error(`El formato ${doc.tipoArchivo} todavía no se procesa`);
  }
}

const formatoFecha = new Intl.DateTimeFormat("es-VE", {
  timeZone: env.CIERRE_DIARIO_TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Una novedad es corta: un chunk por novedad, con todo lo que la ubica. */
export function textoDeNovedad(n: NovedadParaIndexar): string {
  return [
    `Novedad operativa — ${n.tipo} — ${n.origenTipo} ${n.origenNombre} (sistema ${n.sistema})`,
    `Inicio: ${formatoFecha.format(n.inicio)}. Fin: ${n.fin ? formatoFecha.format(n.fin) : "sin cerrar"}.`,
    `Impacto: ${n.impacto}`,
    `Causa: ${n.causa}`,
    `Volumen afectado: ${n.mmpcedAfectados} MMPCED`,
  ].join("\n");
}

export class IngestaService {
  private corriendo = false;
  private primeraPasada = true;

  constructor(
    private readonly documentos: IDocumentoRagRepository,
    private readonly chunks: IChunkRagRepository,
    private readonly modelo: IModeloLenguaje,
  ) {}

  /**
   * Una pasada del worker: rescata trabados, procesa todos los documentos
   * pendientes y pone al día las novedades. Si la pasada anterior sigue
   * corriendo, no hace nada: nunca hay dos en paralelo en el mismo proceso.
   */
  async ejecutarPasada(): Promise<void> {
    if (this.corriendo) return;
    this.corriendo = true;
    try {
      // Al arrancar, todo lo que está en PROCESANDO es de un proceso que murió
      // (un reinicio o un despliegue a mitad): el stack corre una sola API.
      // Si algún día hay varias réplicas, esto tiene que volver al umbral.
      await this.documentos.rescatarTrabados(this.primeraPasada ? 0 : MINUTOS_TRABADO);
      this.primeraPasada = false;
      let doc: DocumentoTomado | null;
      while ((doc = await this.documentos.tomarSiguiente())) {
        const seguir = await this.procesarDocumento(doc);
        if (!seguir) return;
      }
      await this.indexarNovedades();
    } finally {
      this.corriendo = false;
    }
  }

  /** Devuelve false si Ollama no responde: no tiene sentido seguir la pasada. */
  private async procesarDocumento(doc: DocumentoTomado): Promise<boolean> {
    const inicio = Date.now();
    try {
      const datos = new Uint8Array(await readFile(rutaAbsoluta(doc.rutaOriginal)));
      const candidatos = parsear(doc, datos);
      if (!candidatos.length) {
        throw new Error("No se encontró texto en el documento (¿es un escaneo?)");
      }

      const cedulas = candidatos.reduce((s, c) => s + (c.contenido.match(CEDULA)?.length ?? 0), 0);
      if (cedulas >= MAX_CEDULAS) {
        throw new Error(
          `El documento parece contener datos personales (${cedulas} números de cédula). No se indexa.`,
        );
      }

      const indexables = candidatos.filter((c) => c.contenido);
      const vectores = await this.modelo.embeber(indexables.map((c) => paraIndexar(c.contenido)), "documento");
      const porCandidato = new Map(indexables.map((c, i) => [c, vectores[i]!]));

      const chunks: ChunkParaGuardar[] = candidatos.map((c) => ({
        ...c,
        textoIndexado: c.contenido ? paraIndexar(c.contenido) : "",
        embedding: porCandidato.get(c) ?? null,
      }));
      await this.documentos.reemplazarChunks(doc.id, chunks, env.RAG_MODELO_EMBEDDING);
      console.log(`[rag] "${doc.nombre}": ${chunks.length} chunks en ${Math.round((Date.now() - inicio) / 1000)}s`);
      return true;
    } catch (err) {
      if (esFallaDeConexion(err)) {
        console.error(`[rag] Ollama no responde en ${env.OLLAMA_URL}; "${doc.nombre}" queda pendiente`);
        await this.documentos.marcarPendiente(doc.id);
        return false;
      }
      console.error(`[rag] Falló "${doc.nombre}":`, err);
      await this.documentos.marcarError(doc.id, err instanceof Error ? err.message : String(err));
      return true;
    }
  }

  private async indexarNovedades(): Promise<void> {
    try {
      let lote: NovedadParaIndexar[];
      while ((lote = await this.chunks.novedadesPendientes(env.RAG_MODELO_EMBEDDING, LOTE_NOVEDADES)).length) {
        const textos = lote.map(textoDeNovedad);
        const vectores = await this.modelo.embeber(textos.map(paraIndexar), "documento");
        await this.chunks.guardarChunksNovedad(
          lote.map((n, i) => ({
            novedadId: n.id,
            contenido: textos[i]!,
            textoIndexado: paraIndexar(textos[i]!),
            embedding: vectores[i]!,
            hash: n.hash,
          })),
          env.RAG_MODELO_EMBEDDING,
        );
        console.log(`[rag] ${lote.length} novedades indexadas`);
      }
    } catch (err) {
      // Se reintenta en la próxima pasada.
      if (esFallaDeConexion(err)) console.error(`[rag] Ollama no responde; novedades quedan para la próxima pasada`);
      else console.error("[rag] Falló la indexación de novedades:", err);
    }
  }
}

export const ingestaService = new IngestaService(documentoRagRepository, chunkRagRepository, modeloLenguaje);
