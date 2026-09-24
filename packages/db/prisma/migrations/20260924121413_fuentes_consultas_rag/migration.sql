-- Copia de las fuentes de cada consulta, para el historial "Mis consultas"
-- (decisión #108). Sin los DROP INDEX de chunks_rag que propone
-- `prisma migrate diff`: esos índices se escribieron a mano (ver §16.6).

-- AlterTable
ALTER TABLE "consultas_rag" ADD COLUMN     "fuentes" JSONB;
