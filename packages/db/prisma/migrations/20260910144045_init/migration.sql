-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "tipo_corte" AS ENUM ('PUNTUAL', 'CIERRE_PROMEDIO');

-- CreateEnum
CREATE TYPE "tipo_red" AS ENUM ('T', 'D');

-- CreateEnum
CREATE TYPE "dimension_telemetria" AS ENUM ('COMUNICACION', 'ELECTRICO', 'INSTRUMENTACION', 'CASETA');

-- CreateTable
CREATE TABLE "regiones_operativa" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "regiones_operativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sistemas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "sistemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "region_id" INTEGER NOT NULL,
    "sistema_id" INTEGER NOT NULL,
    "sector_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sectores_cliente" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sectores_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuentes" (
    "id" SERIAL NOT NULL,
    "sistema_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "fuentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecturas_balance" (
    "id" BIGSERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo_corte" "tipo_corte" NOT NULL,
    "volumen_mmpced" DECIMAL(14,4) NOT NULL,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "lecturas_balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecturas_balance_historial" (
    "id" BIGSERIAL NOT NULL,
    "lectura_id" BIGINT NOT NULL,
    "volumen_mmpced_ant" DECIMAL(14,4) NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "modificado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecturas_balance_historial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecturas_fuente" (
    "id" BIGSERIAL NOT NULL,
    "fuente_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "volumen_mmpced" DECIMAL(14,4) NOT NULL,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "lecturas_fuente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecturas_fuente_historial" (
    "id" BIGSERIAL NOT NULL,
    "lectura_fuente_id" BIGINT NOT NULL,
    "volumen_mmpced_ant" DECIMAL(14,4) NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "modificado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecturas_fuente_historial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quemas_nacional" (
    "id" BIGSERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo_corte" "tipo_corte" NOT NULL,
    "mmpced" DECIMAL(14,4) NOT NULL,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "quemas_nacional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quemas_nacional_historial" (
    "id" BIGSERIAL NOT NULL,
    "quema_nacional_id" BIGINT NOT NULL,
    "mmpced_ant" DECIMAL(14,4) NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "modificado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quemas_nacional_historial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "novedades_operativa" (
    "id" BIGSERIAL NOT NULL,
    "cliente_id" INTEGER,
    "fuente_id" INTEGER,
    "tipo" TEXT NOT NULL,
    "impacto" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3),
    "causa" TEXT NOT NULL,
    "mmpced_afectados" DECIMAL(14,4) NOT NULL,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "novedades_operativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contactos" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER,
    "fuente_id" INTEGER,
    "nombre_operador" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,

    CONSTRAINT "contactos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regiones_mtto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "regiones_mtto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas_mtto" (
    "id" SERIAL NOT NULL,
    "region_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "areas_mtto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estaciones" (
    "id" SERIAL NOT NULL,
    "area_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "nodo" TEXT NOT NULL,
    "tipo_enlace_com" TEXT NOT NULL,
    "tipo_red" "tipo_red" NOT NULL,

    CONSTRAINT "estaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_instrumento" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "tipos_instrumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estaciones_instrumento" (
    "id" SERIAL NOT NULL,
    "estacion_id" INTEGER NOT NULL,
    "tipo_instrumento_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "estaciones_instrumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estados_telemetria" (
    "id" SERIAL NOT NULL,
    "dimension" "dimension_telemetria" NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "estados_telemetria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reportes_telemetria_estacion" (
    "id" BIGSERIAL NOT NULL,
    "estacion_id" INTEGER NOT NULL,
    "fecha_reporte" DATE NOT NULL,
    "estado_comunicacion_id" INTEGER NOT NULL,
    "estado_electrico_id" INTEGER NOT NULL,
    "estado_instrumentacion_id" INTEGER NOT NULL,
    "estado_caseta_id" INTEGER NOT NULL,
    "detalle_medicion" TEXT,
    "observacion" TEXT,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "reportes_telemetria_estacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departamentos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puestos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "puestos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "puesto_id" INTEGER NOT NULL,
    "departamento_id" INTEGER,
    "supervisor_id" INTEGER,
    "bloqueado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "superintendencias_departamento" (
    "id" SERIAL NOT NULL,
    "superintendente_id" INTEGER NOT NULL,
    "departamento_id" INTEGER NOT NULL,

    CONSTRAINT "superintendencias_departamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insumos" (
    "id" SERIAL NOT NULL,
    "departamento_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "insumos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos_servicio" (
    "id" SERIAL NOT NULL,
    "insumo_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion_actividad" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "productos_servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gerencias_requiriente" (
    "id" SERIAL NOT NULL,
    "departamento_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "gerencias_requiriente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades_registro" (
    "id" BIGSERIAL NOT NULL,
    "producto_servicio_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "region_id" INTEGER,
    "fecha_desde" DATE NOT NULL,
    "fecha_hasta" DATE NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "hh" DECIMAL(10,2) NOT NULL,
    "gerencia_requiriente_id" INTEGER NOT NULL,
    "estatus" TEXT NOT NULL,
    "detalle" TEXT,

    CONSTRAINT "actividades_registro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades_meta" (
    "id" BIGSERIAL NOT NULL,
    "producto_servicio_id" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "cantidad_meta" INTEGER NOT NULL,
    "hh_meta" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "actividades_meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones_refresh" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revocado_en" TIMESTAMP(3),
    "ip" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "sesiones_refresh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_login" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" INTEGER,
    "nombre" TEXT NOT NULL,
    "exitoso" BOOLEAN NOT NULL,
    "ip" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_login_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_intento_no_autorizado" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "ruta" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_intento_no_autorizado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lecturas_balance_fecha_idx" ON "lecturas_balance"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "lecturas_balance_cliente_id_fecha_tipo_corte_key" ON "lecturas_balance"("cliente_id", "fecha", "tipo_corte");

-- CreateIndex
CREATE INDEX "lecturas_fuente_fecha_idx" ON "lecturas_fuente"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "lecturas_fuente_fuente_id_fecha_key" ON "lecturas_fuente"("fuente_id", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "quemas_nacional_fecha_tipo_corte_key" ON "quemas_nacional"("fecha", "tipo_corte");

-- CreateIndex
CREATE UNIQUE INDEX "estaciones_nodo_key" ON "estaciones"("nodo");

-- CreateIndex
CREATE UNIQUE INDEX "reportes_telemetria_estacion_estacion_id_fecha_reporte_key" ON "reportes_telemetria_estacion"("estacion_id", "fecha_reporte");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_nombre_key" ON "usuarios"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "superintendencias_departamento_superintendente_id_departame_key" ON "superintendencias_departamento"("superintendente_id", "departamento_id");

-- CreateIndex
CREATE INDEX "actividades_registro_fecha_desde_fecha_hasta_idx" ON "actividades_registro"("fecha_desde", "fecha_hasta");

-- CreateIndex
CREATE UNIQUE INDEX "actividades_meta_producto_servicio_id_anio_mes_key" ON "actividades_meta"("producto_servicio_id", "anio", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_refresh_token_hash_key" ON "sesiones_refresh"("token_hash");

-- CreateIndex
CREATE INDEX "sesiones_refresh_usuario_id_idx" ON "sesiones_refresh"("usuario_id");

-- CreateIndex
CREATE INDEX "logs_login_creado_en_idx" ON "logs_login"("creado_en");

-- CreateIndex
CREATE INDEX "logs_intento_no_autorizado_creado_en_idx" ON "logs_intento_no_autorizado"("creado_en");

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regiones_operativa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_sistema_id_fkey" FOREIGN KEY ("sistema_id") REFERENCES "sistemas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectores_cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuentes" ADD CONSTRAINT "fuentes_sistema_id_fkey" FOREIGN KEY ("sistema_id") REFERENCES "sistemas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturas_balance" ADD CONSTRAINT "lecturas_balance_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturas_balance" ADD CONSTRAINT "lecturas_balance_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturas_balance_historial" ADD CONSTRAINT "lecturas_balance_historial_lectura_id_fkey" FOREIGN KEY ("lectura_id") REFERENCES "lecturas_balance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturas_balance_historial" ADD CONSTRAINT "lecturas_balance_historial_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturas_fuente" ADD CONSTRAINT "lecturas_fuente_fuente_id_fkey" FOREIGN KEY ("fuente_id") REFERENCES "fuentes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturas_fuente" ADD CONSTRAINT "lecturas_fuente_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturas_fuente_historial" ADD CONSTRAINT "lecturas_fuente_historial_lectura_fuente_id_fkey" FOREIGN KEY ("lectura_fuente_id") REFERENCES "lecturas_fuente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturas_fuente_historial" ADD CONSTRAINT "lecturas_fuente_historial_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quemas_nacional" ADD CONSTRAINT "quemas_nacional_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quemas_nacional_historial" ADD CONSTRAINT "quemas_nacional_historial_quema_nacional_id_fkey" FOREIGN KEY ("quema_nacional_id") REFERENCES "quemas_nacional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quemas_nacional_historial" ADD CONSTRAINT "quemas_nacional_historial_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novedades_operativa" ADD CONSTRAINT "novedades_operativa_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novedades_operativa" ADD CONSTRAINT "novedades_operativa_fuente_id_fkey" FOREIGN KEY ("fuente_id") REFERENCES "fuentes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novedades_operativa" ADD CONSTRAINT "novedades_operativa_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contactos" ADD CONSTRAINT "contactos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contactos" ADD CONSTRAINT "contactos_fuente_id_fkey" FOREIGN KEY ("fuente_id") REFERENCES "fuentes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas_mtto" ADD CONSTRAINT "areas_mtto_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regiones_mtto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estaciones" ADD CONSTRAINT "estaciones_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas_mtto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estaciones_instrumento" ADD CONSTRAINT "estaciones_instrumento_estacion_id_fkey" FOREIGN KEY ("estacion_id") REFERENCES "estaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estaciones_instrumento" ADD CONSTRAINT "estaciones_instrumento_tipo_instrumento_id_fkey" FOREIGN KEY ("tipo_instrumento_id") REFERENCES "tipos_instrumento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_telemetria_estacion" ADD CONSTRAINT "reportes_telemetria_estacion_estacion_id_fkey" FOREIGN KEY ("estacion_id") REFERENCES "estaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_telemetria_estacion" ADD CONSTRAINT "reportes_telemetria_estacion_estado_comunicacion_id_fkey" FOREIGN KEY ("estado_comunicacion_id") REFERENCES "estados_telemetria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_telemetria_estacion" ADD CONSTRAINT "reportes_telemetria_estacion_estado_electrico_id_fkey" FOREIGN KEY ("estado_electrico_id") REFERENCES "estados_telemetria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_telemetria_estacion" ADD CONSTRAINT "reportes_telemetria_estacion_estado_instrumentacion_id_fkey" FOREIGN KEY ("estado_instrumentacion_id") REFERENCES "estados_telemetria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_telemetria_estacion" ADD CONSTRAINT "reportes_telemetria_estacion_estado_caseta_id_fkey" FOREIGN KEY ("estado_caseta_id") REFERENCES "estados_telemetria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_telemetria_estacion" ADD CONSTRAINT "reportes_telemetria_estacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_puesto_id_fkey" FOREIGN KEY ("puesto_id") REFERENCES "puestos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "superintendencias_departamento" ADD CONSTRAINT "superintendencias_departamento_superintendente_id_fkey" FOREIGN KEY ("superintendente_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "superintendencias_departamento" ADD CONSTRAINT "superintendencias_departamento_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insumos" ADD CONSTRAINT "insumos_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_servicio" ADD CONSTRAINT "productos_servicio_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gerencias_requiriente" ADD CONSTRAINT "gerencias_requiriente_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades_registro" ADD CONSTRAINT "actividades_registro_producto_servicio_id_fkey" FOREIGN KEY ("producto_servicio_id") REFERENCES "productos_servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades_registro" ADD CONSTRAINT "actividades_registro_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades_registro" ADD CONSTRAINT "actividades_registro_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regiones_mtto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades_registro" ADD CONSTRAINT "actividades_registro_gerencia_requiriente_id_fkey" FOREIGN KEY ("gerencia_requiriente_id") REFERENCES "gerencias_requiriente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades_meta" ADD CONSTRAINT "actividades_meta_producto_servicio_id_fkey" FOREIGN KEY ("producto_servicio_id") REFERENCES "productos_servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_refresh" ADD CONSTRAINT "sesiones_refresh_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_login" ADD CONSTRAINT "logs_login_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_intento_no_autorizado" ADD CONSTRAINT "logs_intento_no_autorizado_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
