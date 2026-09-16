-- Transferencias: el gas que sale del sistema sin ser consumo de un cliente.
--
-- El workbook las lleva como filas dentro del bloque de clientes y las cuenta
-- en su TOTAL VENTAS; la decisión #46 las sacó del catálogo CLIENTE con razón,
-- porque no son clientes. Pero excluirlas del todo dejaba el transportado
-- 8 MMPCED corto contra el Excel (bloque COSTA ESTE: 90 en el workbook, 82 en
-- SICOG). Decisión #79.
--
-- `mmpced` admite negativos cuando el punto es bidireccional, que es cómo el
-- workbook resuelve la dirección de ICO-NURGAS (FUENTES!Q31).
-- CreateTable
CREATE TABLE "puntos_transferencia" (
    "id" SERIAL NOT NULL,
    "sistema_id" INTEGER NOT NULL,
    "sub_sistema_id" INTEGER,
    "nombre" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "bidireccional" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "puntos_transferencia_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "lecturas_transferencia" (
    "id" BIGSERIAL NOT NULL,
    "punto_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo_corte" "tipo_corte" NOT NULL,
    "mmpced" DECIMAL(14,4) NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    CONSTRAINT "lecturas_transferencia_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "lecturas_transferencia_historial" (
    "id" BIGSERIAL NOT NULL,
    "lectura_id" BIGINT NOT NULL,
    "mmpced_ant" DECIMAL(14,4) NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "modificado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lecturas_transferencia_historial_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "puntos_transferencia_sistema_id_nombre_key" ON "puntos_transferencia"("sistema_id", "nombre");
-- CreateIndex
CREATE INDEX "lecturas_transferencia_fecha_idx" ON "lecturas_transferencia"("fecha");
-- CreateIndex
CREATE UNIQUE INDEX "lecturas_transferencia_punto_id_fecha_tipo_corte_key" ON "lecturas_transferencia"("punto_id", "fecha", "tipo_corte");
-- AddForeignKey
ALTER TABLE "puntos_transferencia" ADD CONSTRAINT "puntos_transferencia_sistema_id_fkey" FOREIGN KEY ("sistema_id") REFERENCES "sistemas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "puntos_transferencia" ADD CONSTRAINT "puntos_transferencia_sub_sistema_id_fkey" FOREIGN KEY ("sub_sistema_id") REFERENCES "sub_sistemas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "lecturas_transferencia" ADD CONSTRAINT "lecturas_transferencia_punto_id_fkey" FOREIGN KEY ("punto_id") REFERENCES "puntos_transferencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "lecturas_transferencia" ADD CONSTRAINT "lecturas_transferencia_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "lecturas_transferencia_historial" ADD CONSTRAINT "lecturas_transferencia_historial_lectura_id_fkey" FOREIGN KEY ("lectura_id") REFERENCES "lecturas_transferencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "lecturas_transferencia_historial" ADD CONSTRAINT "lecturas_transferencia_historial_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
