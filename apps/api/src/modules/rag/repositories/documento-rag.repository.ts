import { Prisma } from "@sicog/db";
import { prisma } from "../../../shared/prisma-client.js";
import { traducirEscritura } from "../../../shared/prisma-errores.js";

export type TipoArchivoRag = "PPTX" | "DOCX" | "PDF" | "XLSX";
export type EstadoDocumentoRag = "PENDIENTE" | "PROCESANDO" | "LISTO" | "ERROR";
export type TipoChunkRag = "TEXTO" | "TABLA" | "IMAGEN" | "NOVEDAD";

export interface DocumentoRagFila {
  id: number;
  nombre: string;
  tipoArchivo: TipoArchivoRag;
  rutaOriginal: string;
  tamanoBytes: number;
  estado: EstadoDocumentoRag;
  errorDetalle: string | null;
  subidoEn: Date;
  procesadoEn: Date | null;
  usuario: { nombre: string };
  chunks: number;
  /** Esquemas que todavía no tienen descripción y por eso no se recuperan. */
  imagenesSinDescripcion: number;
}

export interface DocumentoTomado {
  id: number;
  nombre: string;
  tipoArchivo: TipoArchivoRag;
  rutaOriginal: string;
}

export interface ChunkParaGuardar {
  tipo: TipoChunkRag;
  origenDesde: number | null;
  origenHasta: number | null;
  seccion: string | null;
  contenido: string;
  /** Lo que se indexa: el contenido con las abreviaturas expandidas. */
  textoIndexado: string;
  /** Null en los esquemas sin descripción: quedan fuera de la búsqueda. */
  embedding: number[] | null;
}

export interface NuevoDocumentoRag {
  nombre: string;
  tipoArchivo: TipoArchivoRag;
  rutaOriginal: string;
  hashSha256: string;
  tamanoBytes: number;
  usuarioId: number;
}

export interface IDocumentoRagRepository {
  crear(input: NuevoDocumentoRag): Promise<{ id: number }>;
  listar(): Promise<DocumentoRagFila[]>;
  findById(id: number): Promise<DocumentoRagFila | null>;
  eliminar(id: number): Promise<void>;
  marcarPendiente(id: number): Promise<void>;
  /** Devuelve a PENDIENTE los que llevan más de `minutos` en PROCESANDO. */
  rescatarTrabados(minutos: number): Promise<number>;
  tomarSiguiente(): Promise<DocumentoTomado | null>;
  marcarError(id: number, detalle: string): Promise<void>;
  reemplazarChunks(id: number, chunks: ChunkParaGuardar[], modelo: string): Promise<void>;
}

export const vectorSql = (v: number[]): string => `[${v.join(",")}]`;

const CAMPOS = {
  id: true,
  nombre: true,
  tipoArchivo: true,
  rutaOriginal: true,
  tamanoBytes: true,
  estado: true,
  errorDetalle: true,
  subidoEn: true,
  procesadoEn: true,
  usuario: { select: { nombre: true } },
} as const;

export class PrismaDocumentoRagRepository implements IDocumentoRagRepository {
  async crear(input: NuevoDocumentoRag): Promise<{ id: number }> {
    try {
      return await prisma.documentoRag.create({ data: input, select: { id: true } });
    } catch (err) {
      throw traducirEscritura(err, {
        repetido: "Ese archivo ya está cargado en el corpus",
        noExiste: "Usuario inexistente",
      });
    }
  }

  private async conConteos<T extends { id: number }>(filas: T[]): Promise<(T & { chunks: number; imagenesSinDescripcion: number })[]> {
    if (!filas.length) return [];
    const conteos = await prisma.$queryRaw<{ documento_id: number; total: bigint; sin_desc: bigint }[]>`
      SELECT documento_id,
             count(*) AS total,
             count(*) FILTER (WHERE tipo = 'IMAGEN' AND embedding IS NULL) AS sin_desc
      FROM chunks_rag
      WHERE documento_id IN (${Prisma.join(filas.map((f) => f.id))})
      GROUP BY documento_id`;
    const porId = new Map(conteos.map((c) => [c.documento_id, c]));
    return filas.map((f) => ({
      ...f,
      chunks: Number(porId.get(f.id)?.total ?? 0),
      imagenesSinDescripcion: Number(porId.get(f.id)?.sin_desc ?? 0),
    }));
  }

  async listar(): Promise<DocumentoRagFila[]> {
    const filas = await prisma.documentoRag.findMany({ select: CAMPOS, orderBy: { subidoEn: "desc" } });
    return this.conConteos(filas);
  }

  async findById(id: number): Promise<DocumentoRagFila | null> {
    const fila = await prisma.documentoRag.findUnique({ where: { id }, select: CAMPOS });
    return fila ? ((await this.conConteos([fila]))[0] ?? null) : null;
  }

  async eliminar(id: number): Promise<void> {
    // Los chunks se van por el ON DELETE CASCADE.
    try {
      await prisma.documentoRag.delete({ where: { id } });
    } catch (err) {
      throw traducirEscritura(err, { repetido: "", noExiste: "Documento inexistente" });
    }
  }

  async marcarPendiente(id: number): Promise<void> {
    await prisma.documentoRag.update({
      where: { id },
      data: { estado: "PENDIENTE", tomadoEn: null, errorDetalle: null },
    });
  }

  async rescatarTrabados(minutos: number): Promise<number> {
    return prisma.$executeRaw`
      UPDATE documentos_rag
      SET estado = 'PENDIENTE', tomado_en = NULL
      WHERE estado = 'PROCESANDO'
        AND tomado_en < (now() AT TIME ZONE 'UTC') - make_interval(mins => ${minutos}::int)`;
  }

  async tomarSiguiente(): Promise<DocumentoTomado | null> {
    // SKIP LOCKED: si algún día corren dos workers, no toman el mismo.
    const filas = await prisma.$queryRaw<
      { id: number; nombre: string; tipo_archivo: TipoArchivoRag; ruta_original: string }[]
    >`
      UPDATE documentos_rag
      SET estado = 'PROCESANDO', tomado_en = now() AT TIME ZONE 'UTC'
      WHERE id = (
        SELECT id FROM documentos_rag
        WHERE estado = 'PENDIENTE'
        ORDER BY subido_en
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING id, nombre, tipo_archivo, ruta_original`;
    const f = filas[0];
    return f ? { id: f.id, nombre: f.nombre, tipoArchivo: f.tipo_archivo, rutaOriginal: f.ruta_original } : null;
  }

  async marcarError(id: number, detalle: string): Promise<void> {
    await prisma.documentoRag.update({
      where: { id },
      data: { estado: "ERROR", errorDetalle: detalle.slice(0, 1000), tomadoEn: null },
    });
  }

  async reemplazarChunks(id: number, chunks: ChunkParaGuardar[], modelo: string): Promise<void> {
    // En una transacción (§16.7 paso 5): resubir o reprocesar no duplica, y
    // una búsqueda en el medio ve el corpus viejo entero o el nuevo entero.
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`DELETE FROM chunks_rag WHERE documento_id = ${id}`;
        for (const c of chunks) {
          const vector = c.embedding ? vectorSql(c.embedding) : null;
          await tx.$executeRaw`
            INSERT INTO chunks_rag
              (documento_id, origen_desde, origen_hasta, seccion, tipo, contenido,
               embedding, modelo_embedding, contenido_busqueda)
            VALUES
              (${id}, ${c.origenDesde}, ${c.origenHasta}, ${c.seccion}, ${c.tipo}::"TipoChunkRag", ${c.contenido},
               ${vector}::vector, ${modelo},
               CASE WHEN ${c.textoIndexado} = '' THEN NULL ELSE to_tsvector('sicog_es', ${c.textoIndexado}) END)`;
        }
        await tx.documentoRag.update({
          where: { id },
          data: { estado: "LISTO", procesadoEn: new Date(), tomadoEn: null, errorDetalle: null },
        });
      },
      { timeout: 120_000 },
    );
  }
}

export const documentoRagRepository: IDocumentoRagRepository = new PrismaDocumentoRagRepository();
