-- AlterTable
ALTER TABLE "fallas_estacion" ADD COLUMN     "usuario_resolvio_id" INTEGER;

-- CreateTable
CREATE TABLE "fallas_estacion_historial" (
    "id" BIGSERIAL NOT NULL,
    "falla_id" BIGINT NOT NULL,
    "causa_falla_id_ant" INTEGER NOT NULL,
    "desde_ant" DATE NOT NULL,
    "observacion_ant" TEXT,
    "usuario_id" INTEGER NOT NULL,
    "modificado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fallas_estacion_historial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades_registro_historial" (
    "id" BIGSERIAL NOT NULL,
    "registro_id" BIGINT NOT NULL,
    "producto_servicio_id_ant" INTEGER NOT NULL,
    "gerencia_requiriente_id_ant" INTEGER NOT NULL,
    "region_id_ant" INTEGER,
    "usuario_id_ant" INTEGER NOT NULL,
    "fecha_desde_ant" DATE NOT NULL,
    "fecha_hasta_ant" DATE NOT NULL,
    "cantidad_ant" INTEGER NOT NULL,
    "hh_ant" DECIMAL(10,2),
    "estatus_ant" TEXT NOT NULL,
    "detalle_ant" TEXT,
    "usuario_id" INTEGER NOT NULL,
    "modificado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actividades_registro_historial_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fallas_estacion" ADD CONSTRAINT "fallas_estacion_usuario_resolvio_id_fkey" FOREIGN KEY ("usuario_resolvio_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fallas_estacion_historial" ADD CONSTRAINT "fallas_estacion_historial_falla_id_fkey" FOREIGN KEY ("falla_id") REFERENCES "fallas_estacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fallas_estacion_historial" ADD CONSTRAINT "fallas_estacion_historial_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades_registro_historial" ADD CONSTRAINT "actividades_registro_historial_registro_id_fkey" FOREIGN KEY ("registro_id") REFERENCES "actividades_registro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades_registro_historial" ADD CONSTRAINT "actividades_registro_historial_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
