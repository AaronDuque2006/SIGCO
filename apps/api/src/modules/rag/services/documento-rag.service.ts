import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DocumentoRagDto } from "@sicog/shared-types";
import { env } from "../../../shared/env.js";
import { NotFoundError, ValidationError } from "../../../shared/errors.js";
import {
  documentoRagRepository,
  type DocumentoRagFila,
  type IDocumentoRagRepository,
  type TipoArchivoRag,
} from "../repositories/documento-rag.repository.js";
import { rutaAbsoluta } from "./ingesta.service.js";

// Se valida la extensión **y** la firma real del archivo (§16.8): renombrar un
// ejecutable a .pptx no lo convierte en una presentación.
const FIRMA_ZIP = [0x50, 0x4b, 0x03, 0x04];
const FORMATOS: Record<string, { tipo: TipoArchivoRag; firma: number[] }> = {
  ".pptx": { tipo: "PPTX", firma: FIRMA_ZIP },
  ".docx": { tipo: "DOCX", firma: FIRMA_ZIP },
};
// PDF y XLSX están en el modelo (§16.6) pero todavía no tienen parser: se
// rechazan al subir en vez de aceptarlos y dejarlos en ERROR.
const PENDIENTES_DE_SOPORTE = [".pdf", ".xlsx", ".xls", ".xlsm"];

const aDto = (d: DocumentoRagFila): DocumentoRagDto => ({
  id: d.id,
  nombre: d.nombre,
  tipoArchivo: d.tipoArchivo,
  tamanoBytes: d.tamanoBytes,
  estado: d.estado,
  errorDetalle: d.errorDetalle,
  subidoPor: d.usuario.nombre,
  subidoEn: d.subidoEn.toISOString(),
  procesadoEn: d.procesadoEn?.toISOString() ?? null,
  chunks: d.chunks,
  imagenesSinDescripcion: d.imagenesSinDescripcion,
});

/** El nombre que ve la gente; nunca se usa para armar una ruta en disco. */
function limpiarNombre(nombre: string): string {
  const base = path.basename(nombre.replace(/\\/g, "/"));
  // eslint-disable-next-line no-control-regex
  return base.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 200);
}

export class DocumentoRagService {
  constructor(private readonly documentos: IDocumentoRagRepository) {}

  async subir(datos: Buffer, nombreOriginal: string, usuarioId: number): Promise<DocumentoRagDto> {
    const nombre = limpiarNombre(nombreOriginal);
    const extension = path.extname(nombre).toLowerCase();
    if (!nombre || !extension) throw new ValidationError("Falta el nombre del archivo");
    if (PENDIENTES_DE_SOPORTE.includes(extension)) {
      throw new ValidationError(`Los archivos ${extension} todavía no se pueden procesar. Por ahora: .pptx y .docx`);
    }
    const formato = FORMATOS[extension];
    if (!formato) throw new ValidationError("Formato no admitido. Por ahora: .pptx y .docx");
    if (!datos.length) throw new ValidationError("El archivo está vacío");
    if (!formato.firma.every((b, i) => datos[i] === b)) {
      throw new ValidationError(`El contenido no corresponde a un archivo ${extension}`);
    }

    // En disco, el archivo se llama por su hash: el nombre que manda el
    // navegador nunca toca el sistema de archivos.
    const hash = createHash("sha256").update(datos).digest("hex");
    const rutaRelativa = `${hash}${extension}`;
    await mkdir(path.resolve(env.RAG_DIR_ARCHIVOS), { recursive: true });
    // Escribir primero: si la fila existiera antes que el archivo, el worker
    // podría tomarla y no encontrarlo. Si el hash ya estaba (409), el archivo
    // es idéntico y pertenece al documento existente, así que queda.
    await writeFile(rutaAbsoluta(rutaRelativa), datos);
    const { id } = await this.documentos.crear({
      nombre,
      tipoArchivo: formato.tipo,
      rutaOriginal: rutaRelativa,
      hashSha256: hash,
      tamanoBytes: datos.length,
      usuarioId,
    });
    return this.obtener(id);
  }

  async listar(): Promise<DocumentoRagDto[]> {
    return (await this.documentos.listar()).map(aDto);
  }

  async obtener(id: number): Promise<DocumentoRagDto> {
    const doc = await this.documentos.findById(id);
    if (!doc) throw new NotFoundError("Documento inexistente");
    return aDto(doc);
  }

  async eliminar(id: number): Promise<void> {
    const doc = await this.documentos.findById(id);
    if (!doc) throw new NotFoundError("Documento inexistente");
    await this.documentos.eliminar(id);
    await rm(rutaAbsoluta(doc.rutaOriginal), { force: true });
  }

  async reprocesar(id: number): Promise<DocumentoRagDto> {
    const doc = await this.documentos.findById(id);
    if (!doc) throw new NotFoundError("Documento inexistente");
    if (doc.estado === "PROCESANDO") throw new ValidationError("El documento se está procesando ahora");
    await this.documentos.marcarPendiente(id);
    return this.obtener(id);
  }
}

export const documentoRagService = new DocumentoRagService(documentoRagRepository);
