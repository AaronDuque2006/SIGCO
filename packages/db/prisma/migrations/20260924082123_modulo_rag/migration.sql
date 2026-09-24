-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateEnum
CREATE TYPE "TipoArchivoRag" AS ENUM ('PPTX', 'DOCX', 'PDF', 'XLSX');

-- CreateEnum
CREATE TYPE "EstadoDocumentoRag" AS ENUM ('PENDIENTE', 'PROCESANDO', 'LISTO', 'ERROR');

-- CreateEnum
CREATE TYPE "TipoChunkRag" AS ENUM ('TEXTO', 'TABLA', 'IMAGEN', 'NOVEDAD');

-- CreateTable
CREATE TABLE "documentos_rag" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo_archivo" "TipoArchivoRag" NOT NULL,
    "ruta_original" TEXT NOT NULL,
    "hash_sha256" TEXT NOT NULL,
    "tamano_bytes" INTEGER NOT NULL,
    "estado" "EstadoDocumentoRag" NOT NULL DEFAULT 'PENDIENTE',
    "tomado_en" TIMESTAMP(3),
    "error_detalle" TEXT,
    "usuario_id" INTEGER NOT NULL,
    "subido_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "procesado_en" TIMESTAMP(3),

    CONSTRAINT "documentos_rag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chunks_rag" (
    "id" BIGSERIAL NOT NULL,
    "documento_id" INTEGER,
    "novedad_id" BIGINT,
    "origen_desde" INTEGER,
    "origen_hasta" INTEGER,
    "seccion" TEXT,
    "tipo" "TipoChunkRag" NOT NULL,
    "contenido" TEXT NOT NULL,
    "embedding" vector(768),
    "modelo_embedding" TEXT NOT NULL,
    "contenido_busqueda" tsvector,
    "hash_contenido" TEXT,
    "imagen_ref" TEXT,
    "indexado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chunks_rag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas_rag" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "pregunta" TEXT NOT NULL,
    "chunk_ids" BIGINT[],
    "duracion_ms" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultas_rag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "documentos_rag_hash_sha256_key" ON "documentos_rag"("hash_sha256");

-- CreateIndex
CREATE INDEX "documentos_rag_estado_idx" ON "documentos_rag"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "chunks_rag_novedad_id_key" ON "chunks_rag"("novedad_id");

-- CreateIndex
CREATE INDEX "chunks_rag_documento_id_idx" ON "chunks_rag"("documento_id");

-- CreateIndex
CREATE INDEX "consultas_rag_creado_en_idx" ON "consultas_rag"("creado_en");

-- AddForeignKey
ALTER TABLE "documentos_rag" ADD CONSTRAINT "documentos_rag_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chunks_rag" ADD CONSTRAINT "chunks_rag_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "documentos_rag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chunks_rag" ADD CONSTRAINT "chunks_rag_novedad_id_fkey" FOREIGN KEY ("novedad_id") REFERENCES "novedades_operativa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas_rag" ADD CONSTRAINT "consultas_rag_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ===== Escrito a mano: lo que schema.prisma no sabe declarar =====

-- Búsqueda por palabras en español que ignora tildes: "Güiria" encuentra
-- "Guiria" (la medición del 2026-09-24 perdió esa pregunta sin unaccent).
CREATE TEXT SEARCH CONFIGURATION sicog_es (COPY = spanish);
ALTER TEXT SEARCH CONFIGURATION sicog_es
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, spanish_stem;

-- Exactamente un origen por chunk: documento o novedad (decisión #102).
ALTER TABLE "chunks_rag" ADD CONSTRAINT "chunks_rag_un_origen"
  CHECK (("documento_id" IS NULL) <> ("novedad_id" IS NULL));

-- Similitud coseno (los embeddings se comparan normalizados).
CREATE INDEX "chunks_rag_embedding_hnsw" ON "chunks_rag"
  USING hnsw ("embedding" vector_cosine_ops);

CREATE INDEX "chunks_rag_contenido_busqueda_gin" ON "chunks_rag"
  USING gin ("contenido_busqueda");
