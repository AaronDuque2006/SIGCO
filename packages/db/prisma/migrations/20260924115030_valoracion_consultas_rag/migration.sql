-- Valoración de las respuestas del asistente ("¿le sirvió?") y la respuesta
-- misma, para poder revisar las que no sirvieron.
--
-- Ojo al regenerar migraciones: `prisma migrate diff` propone borrar los
-- índices HNSW y GIN de chunks_rag porque no están en schema.prisma (se
-- escribieron a mano en 20260924082123_modulo_rag). Hay que sacar esos
-- DROP INDEX del diff antes de aplicarlo.

-- AlterTable
ALTER TABLE "consultas_rag" ADD COLUMN     "comentario" TEXT,
ADD COLUMN     "respuesta" TEXT,
ADD COLUMN     "util" BOOLEAN,
ADD COLUMN     "valorada_en" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "consultas_rag_util_idx" ON "consultas_rag"("util");
