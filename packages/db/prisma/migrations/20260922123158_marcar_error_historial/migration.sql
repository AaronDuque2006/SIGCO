-- AlterTable
ALTER TABLE "lecturas_balance_historial" ADD COLUMN     "es_error" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "quemas_nacional_historial" ADD COLUMN     "es_error" BOOLEAN NOT NULL DEFAULT false;
