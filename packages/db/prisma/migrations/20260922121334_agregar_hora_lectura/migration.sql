-- AlterTable
ALTER TABLE "lecturas_balance" ADD COLUMN     "hora_lectura" TIME;

-- AlterTable
ALTER TABLE "lecturas_balance_historial" ADD COLUMN     "hora_lectura_ant" TIME;

-- AlterTable
ALTER TABLE "lecturas_fuente" ADD COLUMN     "hora_lectura" TIME;

-- AlterTable
ALTER TABLE "lecturas_fuente_historial" ADD COLUMN     "hora_lectura_ant" TIME;

-- AlterTable
ALTER TABLE "quemas_nacional" ADD COLUMN     "hora_lectura" TIME;

-- AlterTable
ALTER TABLE "quemas_nacional_historial" ADD COLUMN     "hora_lectura_ant" TIME;
