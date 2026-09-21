-- DropForeignKey
ALTER TABLE "reportes_telemetria_estacion" DROP CONSTRAINT "reportes_telemetria_estacion_estacion_id_fkey";

-- DropForeignKey
ALTER TABLE "reportes_telemetria_estacion" DROP CONSTRAINT "reportes_telemetria_estacion_estado_caseta_id_fkey";

-- DropForeignKey
ALTER TABLE "reportes_telemetria_estacion" DROP CONSTRAINT "reportes_telemetria_estacion_estado_comunicacion_id_fkey";

-- DropForeignKey
ALTER TABLE "reportes_telemetria_estacion" DROP CONSTRAINT "reportes_telemetria_estacion_estado_electrico_id_fkey";

-- DropForeignKey
ALTER TABLE "reportes_telemetria_estacion" DROP CONSTRAINT "reportes_telemetria_estacion_estado_instrumentacion_id_fkey";

-- DropForeignKey
ALTER TABLE "reportes_telemetria_estacion" DROP CONSTRAINT "reportes_telemetria_estacion_usuario_id_fkey";

-- AlterTable
ALTER TABLE "estaciones" ALTER COLUMN "tipo_red" DROP NOT NULL;

-- DropTable
DROP TABLE "estados_telemetria";

-- DropTable
DROP TABLE "reportes_telemetria_estacion";

-- DropEnum
DROP TYPE "dimension_telemetria";

-- CreateTable
CREATE TABLE "causas_falla" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "causas_falla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fallas_estacion" (
    "id" BIGSERIAL NOT NULL,
    "estacion_id" INTEGER NOT NULL,
    "causa_falla_id" INTEGER NOT NULL,
    "desde" DATE NOT NULL,
    "resuelta_en" DATE,
    "observacion" TEXT,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "fallas_estacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "causas_falla_nombre_key" ON "causas_falla"("nombre");

-- CreateIndex
CREATE INDEX "fallas_estacion_estacion_id_desde_idx" ON "fallas_estacion"("estacion_id", "desde");

-- CreateIndex
CREATE INDEX "fallas_estacion_desde_idx" ON "fallas_estacion"("desde");

-- CreateIndex
CREATE INDEX "fallas_estacion_resuelta_en_idx" ON "fallas_estacion"("resuelta_en");

-- AddForeignKey
ALTER TABLE "fallas_estacion" ADD CONSTRAINT "fallas_estacion_estacion_id_fkey" FOREIGN KEY ("estacion_id") REFERENCES "estaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fallas_estacion" ADD CONSTRAINT "fallas_estacion_causa_falla_id_fkey" FOREIGN KEY ("causa_falla_id") REFERENCES "causas_falla"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fallas_estacion" ADD CONSTRAINT "fallas_estacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Escritas a mano: Prisma no expresa ni un índice único parcial ni un CHECK
-- arbitrario de forma declarativa (mismo caso que 20260910150000).

-- Una estación tiene a lo sumo UNA falla abierta a la vez. Es lo que hace que
-- "operativa o en falla" sea una pregunta con una sola respuesta, y lo que
-- permite calcular la disponibilidad de cualquier fecha sin ambigüedad.
CREATE UNIQUE INDEX "fallas_estacion_una_abierta_por_estacion"
  ON "fallas_estacion" ("estacion_id")
  WHERE "resuelta_en" IS NULL;

-- Una falla no puede resolverse antes de empezar.
ALTER TABLE "fallas_estacion"
  ADD CONSTRAINT "fallas_estacion_resuelta_despues_de_desde"
  CHECK ("resuelta_en" IS NULL OR "resuelta_en" >= "desde");
