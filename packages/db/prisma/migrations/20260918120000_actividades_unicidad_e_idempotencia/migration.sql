-- CreateTable
CREATE TABLE "claves_idempotencia" (
    "id" BIGSERIAL NOT NULL,
    "clave" TEXT NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "huella_peticion" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "estado_http" INTEGER,
    "respuesta" JSONB,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claves_idempotencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "claves_idempotencia_expira_en_idx" ON "claves_idempotencia"("expira_en");

-- CreateIndex
CREATE UNIQUE INDEX "claves_idempotencia_clave_usuario_id_key" ON "claves_idempotencia"("clave", "usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "gerencias_requiriente_departamento_id_nombre_key" ON "gerencias_requiriente"("departamento_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "insumos_departamento_id_nombre_key" ON "insumos"("departamento_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "productos_servicio_insumo_id_nombre_key" ON "productos_servicio"("insumo_id", "nombre");

-- AddForeignKey
ALTER TABLE "claves_idempotencia" ADD CONSTRAINT "claves_idempotencia_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

