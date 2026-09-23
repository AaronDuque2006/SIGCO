-- AlterTable
ALTER TABLE "lecturas_balance" ADD COLUMN     "editado_en" TIMESTAMP(3),
ADD COLUMN     "editado_por_id" INTEGER;

-- AlterTable
ALTER TABLE "quemas_nacional" ADD COLUMN     "editado_en" TIMESTAMP(3),
ADD COLUMN     "editado_por_id" INTEGER;

-- AddForeignKey
ALTER TABLE "lecturas_balance" ADD CONSTRAINT "lecturas_balance_editado_por_id_fkey" FOREIGN KEY ("editado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quemas_nacional" ADD CONSTRAINT "quemas_nacional_editado_por_id_fkey" FOREIGN KEY ("editado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

