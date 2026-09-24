import { prisma } from "../../../shared/prisma-client.js";
import { vectorSql, type TipoChunkRag } from "./documento-rag.repository.js";

export interface ChunkRecuperado {
  id: bigint;
  tipo: TipoChunkRag;
  contenido: string;
  seccion: string | null;
  origenDesde: number | null;
  documentoId: number | null;
  documentoNombre: string | null;
  novedadId: bigint | null;
  /** Similitud coseno con la pregunta; null si sólo lo encontró el full-text. */
  similitud: number | null;
  /** Si lo encontró la búsqueda por palabras. */
  coincidePalabras: boolean;
}

export interface NovedadParaIndexar {
  id: bigint;
  tipo: string;
  impacto: string;
  causa: string;
  inicio: Date;
  fin: Date | null;
  mmpcedAfectados: number;
  origenNombre: string;
  origenTipo: "Cliente" | "Fuente";
  sistema: string;
  hash: string;
}

export interface ChunkNovedadParaGuardar {
  novedadId: bigint;
  contenido: string;
  textoIndexado: string;
  embedding: number[];
  hash: string;
}

export interface IChunkRagRepository {
  buscar(embedding: number[], texto: string, cantidad: number): Promise<ChunkRecuperado[]>;
  novedadesPendientes(modelo: string, limite: number): Promise<NovedadParaIndexar[]>;
  guardarChunksNovedad(chunks: ChunkNovedadParaGuardar[], modelo: string): Promise<void>;
  /** Contenido de los chunks de tablas de nomenclatura (código de estación → nombre). */
  tablasDeNomenclatura(): Promise<string[]>;
  /** Las palabras que la búsqueda en español descarta ("con", "la", "de"…). */
  esPalabraVacia(palabras: string[]): Promise<Set<string>>;
}

// Cuántos candidatos trae cada búsqueda antes de combinarlas. Más que los que
// se usan: un chunk que queda 15° en una y 2° en la otra tiene que poder ganar.
const CANDIDATOS = 40;
// Constante estándar de Reciprocal Rank Fusion.
const RRF_K = 60;
const ASEGURADOS_POR_BUSQUEDA = 2;
// Parámetros estándar de BM25.
const BM25_K1 = 1.2;
const BM25_B = 0.75;

export class PrismaChunkRagRepository implements IChunkRagRepository {
  async buscar(embedding: number[], texto: string, cantidad: number): Promise<ChunkRecuperado[]> {
    const v = vectorSql(embedding);
    // Búsqueda híbrida (§16.5), combinada por posición (RRF), no por puntaje:
    // la similitud coseno y el BM25 no están en la misma escala.
    //
    // Por palabras va BM25 y no ts_rank_cd: ts_rank_cd no pondera por rareza,
    // así que "gasoducto" o "sistema" pesan lo mismo que "Cardón". Medido el
    // 2026-09-24 con las 30 preguntas sobre el Manual DAO: la híbrida pasó de
    // MRR 0,66 con ts_rank_cd a 0,94 con BM25 (30/30 dentro de los 5 primeros).
    // La rareza (df) de cada palabra de la pregunta se cuenta en el momento
    // contra el índice GIN; los términos van con OR, no con AND.
    const filas = await prisma.$queryRaw<
      {
        id: bigint;
        tipo: TipoChunkRag;
        contenido: string;
        seccion: string | null;
        origen_desde: number | null;
        documento_id: number | null;
        documento_nombre: string | null;
        novedad_id: bigint | null;
        similitud: number | null;
        coincide_palabras: boolean;
      }[]
    >`
      WITH terminos AS (
        SELECT DISTINCT unnest(tsvector_to_array(to_tsvector('sicog_es', ${texto}))) AS lexema
      ),
      corpus AS (
        SELECT count(*)::float8 AS n, coalesce(avg(length(contenido_busqueda)), 1)::float8 AS largo_medio
        FROM chunks_rag
        WHERE contenido_busqueda IS NOT NULL AND embedding IS NOT NULL
      ),
      rareza AS (
        SELECT t.lexema,
               ln(1 + (corpus.n - df.n + 0.5) / (df.n + 0.5)) AS idf
        FROM terminos t
        CROSS JOIN corpus
        CROSS JOIN LATERAL (
          SELECT count(*)::float8 AS n FROM chunks_rag c
          WHERE c.contenido_busqueda @@ quote_literal(t.lexema)::tsquery
        ) df
        WHERE df.n > 0
      ),
      por_vector AS (
        SELECT id,
               row_number() OVER (ORDER BY embedding <=> ${v}::vector) AS rango,
               1 - (embedding <=> ${v}::vector) AS similitud
        FROM chunks_rag
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${v}::vector
        LIMIT ${CANDIDATOS}
      ),
      bm25 AS (
        SELECT c.id,
               sum(r.idf * (tf.n * (${BM25_K1}::float8 + 1)) /
                   (tf.n + ${BM25_K1}::float8 * (1 - ${BM25_B}::float8 + ${BM25_B}::float8 * length(c.contenido_busqueda) / corpus.largo_medio))) AS puntaje
        FROM chunks_rag c
        CROSS JOIN corpus
        CROSS JOIN LATERAL unnest(c.contenido_busqueda) AS u(lexema, posiciones, pesos)
        JOIN rareza r ON r.lexema = u.lexema
        CROSS JOIN LATERAL (SELECT coalesce(array_length(u.posiciones, 1), 1)::float8 AS n) tf
        WHERE c.embedding IS NOT NULL
          AND c.contenido_busqueda @@ (SELECT string_agg(quote_literal(lexema), ' | ')::tsquery FROM rareza)
        GROUP BY c.id
      ),
      por_palabras AS (
        SELECT id, row_number() OVER (ORDER BY puntaje DESC) AS rango
        FROM bm25
        ORDER BY puntaje DESC
        LIMIT ${CANDIDATOS}
      ),
      combinados AS (
        SELECT coalesce(v.id, p.id) AS id,
               coalesce(1.0 / (${RRF_K} + v.rango), 0) + coalesce(1.0 / (${RRF_K} + p.rango), 0) AS puntaje,
               v.similitud,
               p.id IS NOT NULL AS coincide_palabras,
               -- Los mejores de cada búsqueda entran siempre, antes que el
               -- resto. Sin esto, RRF premia lo que sale "más o menos bien"
               -- en las dos: a "consumo promedio de ERP Pele El Ojo" la única
               -- fila con ese nombre salía 1ª por palabras, fuera del top por
               -- significado (no distingue nombres propios), y terminaba 13ª.
               least(coalesce(v.rango, 999), coalesce(p.rango, 999)) <= ${ASEGURADOS_POR_BUSQUEDA} AS asegurado
        FROM por_vector v
        FULL OUTER JOIN por_palabras p ON p.id = v.id
      )
      SELECT c.id, c.tipo, c.contenido, c.seccion, c.origen_desde, c.documento_id,
             d.nombre AS documento_nombre, c.novedad_id,
             comb.similitud::float8 AS similitud, comb.coincide_palabras
      FROM combinados comb
      JOIN chunks_rag c ON c.id = comb.id
      LEFT JOIN documentos_rag d ON d.id = c.documento_id
      ORDER BY comb.asegurado DESC, comb.puntaje DESC
      LIMIT ${cantidad}`;

    return filas.map((f) => ({
      id: f.id,
      tipo: f.tipo,
      contenido: f.contenido,
      seccion: f.seccion,
      origenDesde: f.origen_desde,
      documentoId: f.documento_id,
      documentoNombre: f.documento_nombre,
      novedadId: f.novedad_id,
      similitud: f.similitud,
      coincidePalabras: f.coincide_palabras,
    }));
  }

  async novedadesPendientes(modelo: string, limite: number): Promise<NovedadParaIndexar[]> {
    // Sin tocar la tabla de Despacho (decisión #102): una novedad está
    // pendiente si no tiene chunk, si su contenido cambió desde que se indexó
    // (el hash no coincide) o si se indexó con otro modelo.
    const filas = await prisma.$queryRaw<
      {
        id: bigint;
        tipo: string;
        impacto: string;
        causa: string;
        inicio: Date;
        fin: Date | null;
        mmpced: number;
        origen_nombre: string;
        origen_tipo: "Cliente" | "Fuente";
        sistema: string;
        hash: string;
      }[]
    >`
      SELECT n.*
      FROM (
        SELECT n.id, n.tipo, n.impacto, n.causa, n.inicio, n.fin,
               n.mmpced_afectados::float8 AS mmpced,
               coalesce(c.nombre, f.nombre) AS origen_nombre,
               CASE WHEN c.id IS NOT NULL THEN 'Cliente' ELSE 'Fuente' END AS origen_tipo,
               s.nombre AS sistema,
               md5(concat_ws('|', n.tipo, n.impacto, n.causa, n.inicio, n.fin,
                             n.mmpced_afectados, c.nombre, f.nombre, s.nombre)) AS hash
        FROM novedades_operativa n
        LEFT JOIN clientes c ON c.id = n.cliente_id
        LEFT JOIN fuentes f ON f.id = n.fuente_id
        JOIN sistemas s ON s.id = coalesce(c.sistema_id, f.sistema_id)
      ) n
      LEFT JOIN chunks_rag ch ON ch.novedad_id = n.id
      WHERE ch.id IS NULL
         OR ch.hash_contenido IS DISTINCT FROM n.hash
         OR ch.modelo_embedding <> ${modelo}
      ORDER BY n.id
      LIMIT ${limite}`;

    return filas.map((f) => ({
      id: f.id,
      tipo: f.tipo,
      impacto: f.impacto,
      causa: f.causa,
      inicio: f.inicio,
      fin: f.fin,
      mmpcedAfectados: f.mmpced,
      origenNombre: f.origen_nombre,
      origenTipo: f.origen_tipo,
      sistema: f.sistema,
      hash: f.hash,
    }));
  }

  async tablasDeNomenclatura(): Promise<string[]> {
    const filas = await prisma.$queryRaw<{ contenido: string }[]>`
      SELECT contenido FROM chunks_rag
      WHERE tipo = 'TABLA' AND contenido ~* 'nomenclatura[^:]*:'`;
    return filas.map((f) => f.contenido);
  }

  async esPalabraVacia(palabras: string[]): Promise<Set<string>> {
    if (!palabras.length) return new Set();
    const filas = await prisma.$queryRaw<{ p: string }[]>`
      SELECT p FROM unnest(${palabras}::text[]) AS p
      WHERE to_tsvector('sicog_es', p) = ''::tsvector`;
    return new Set(filas.map((f) => f.p));
  }

  async guardarChunksNovedad(chunks: ChunkNovedadParaGuardar[], modelo: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const c of chunks) {
        await tx.$executeRaw`
          INSERT INTO chunks_rag
            (novedad_id, tipo, contenido, embedding, modelo_embedding, contenido_busqueda, hash_contenido)
          VALUES
            (${c.novedadId}, 'NOVEDAD', ${c.contenido}, ${vectorSql(c.embedding)}::vector, ${modelo},
             to_tsvector('sicog_es', ${c.textoIndexado}), ${c.hash})
          ON CONFLICT (novedad_id) DO UPDATE SET
            contenido = EXCLUDED.contenido,
            embedding = EXCLUDED.embedding,
            modelo_embedding = EXCLUDED.modelo_embedding,
            contenido_busqueda = EXCLUDED.contenido_busqueda,
            hash_contenido = EXCLUDED.hash_contenido,
            indexado_en = now() AT TIME ZONE 'UTC'`;
      }
    });
  }
}

export const chunkRagRepository: IChunkRagRepository = new PrismaChunkRagRepository();
