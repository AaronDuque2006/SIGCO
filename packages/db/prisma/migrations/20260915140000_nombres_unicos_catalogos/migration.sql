-- Nombres únicos en los catálogos de Despacho.
--
-- Hasta acá nada impedía dos clientes llamados igual, y la grilla diaria es
-- una fila por cliente: dos filas idénticas no se podrían distinguir al
-- digitar. Los datos reales ya cumplían (111 clientes, 31 fuentes y 7 sectores,
-- todos con nombres distintos), así que el índice entra sin conflicto.
--
-- Va en la base y no como chequeo en el Service a propósito: entre un SELECT y
-- un INSERT hay una carrera, y dos peticiones simultáneas pasarían las dos. El
-- constraint es el mecanismo; el Repository traduce el P2002 a CONFLICT.
CREATE UNIQUE INDEX "clientes_nombre_key" ON "clientes"("nombre");

CREATE UNIQUE INDEX "fuentes_nombre_key" ON "fuentes"("nombre");

-- El de sectores cubre también las filas desactivadas: reusar el nombre de un
-- sector dado de baja haría ambiguos los reportes históricos, que es
-- justamente lo que el soft-delete de la decisión #31 existe para evitar.
CREATE UNIQUE INDEX "sectores_cliente_nombre_key" ON "sectores_cliente"("nombre");
