-- Sub-sistemas: la subdivisión de un SISTEMA que el área reporta aparte.
--
-- El gráfico "SISTEMAS" del balance abre tres ramas y suma el resto a su
-- sistema. Esas tres no salían del catálogo porque dos de ellas —Costa Oeste y
-- Costa Este— pertenecen al mismo sistema (Ulé-Amuay) y a la misma región
-- (Occidente), así que ni `sistema_id` ni `region_id` las separan.
--
-- Cuelga de SISTEMA y no de REGION por eso mismo. Decisión #78.
CREATE TABLE "sub_sistemas" (
    "id" SERIAL NOT NULL,
    "sistema_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "sub_sistemas_pkey" PRIMARY KEY ("id")
);

-- Único dentro de su sistema y no a nivel nacional: dos sistemas distintos
-- podrían tener una rama con el mismo nombre genérico.
CREATE UNIQUE INDEX "sub_sistemas_sistema_id_nombre_key" ON "sub_sistemas"("sistema_id", "nombre");

ALTER TABLE "sub_sistemas" ADD CONSTRAINT "sub_sistemas_sistema_id_fkey"
    FOREIGN KEY ("sistema_id") REFERENCES "sistemas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Nullable a propósito: no todo sistema está subdividido. Nulo significa "este
-- cliente cuelga directo de su sistema", y es el caso de la mayoría.
ALTER TABLE "clientes" ADD COLUMN "sub_sistema_id" INTEGER;

ALTER TABLE "clientes" ADD CONSTRAINT "clientes_sub_sistema_id_fkey"
    FOREIGN KEY ("sub_sistema_id") REFERENCES "sub_sistemas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
