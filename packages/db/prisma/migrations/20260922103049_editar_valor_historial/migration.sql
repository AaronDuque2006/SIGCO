-- AlterTable
ALTER TABLE "lecturas_balance_historial" DROP COLUMN "es_error",
ADD COLUMN     "editado_en" TIMESTAMP(3),
ADD COLUMN     "editado_por_id" INTEGER;

-- AlterTable
ALTER TABLE "quemas_nacional_historial" DROP COLUMN "es_error",
ADD COLUMN     "editado_en" TIMESTAMP(3),
ADD COLUMN     "editado_por_id" INTEGER;

-- AddForeignKey
ALTER TABLE "lecturas_balance_historial" ADD CONSTRAINT "lecturas_balance_historial_editado_por_id_fkey" FOREIGN KEY ("editado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quemas_nacional_historial" ADD CONSTRAINT "quemas_nacional_historial_editado_por_id_fkey" FOREIGN KEY ("editado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

