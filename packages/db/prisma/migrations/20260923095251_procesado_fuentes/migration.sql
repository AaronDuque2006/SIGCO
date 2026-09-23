-- AlterTable
ALTER TABLE "fuentes" ADD COLUMN     "procesa_gas" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "lecturas_fuente" ADD COLUMN     "procesado" DECIMAL(14,4);

-- AlterTable
ALTER TABLE "lecturas_fuente_historial" ADD COLUMN     "procesado_ant" DECIMAL(14,4);


-- Marca las plantas que procesan gas (decisión pendiente de numerar): San
-- Joaquín, Santa Bárbara, Jusepín y El Tablazo LGN1/LGN2 — los mismos nombres
-- exactos del seed real (packages/db/prisma/seed.ts). El resto de las 31
-- fuentes son entregas directas o empresas mixtas: no procesan nada.
UPDATE "fuentes" SET "procesa_gas" = true WHERE "nombre" IN (
  'San Joaquín Tren A y B',
  'San Joaquín Tren C',
  'Santa Bárbara Tren A y B',
  'Santa Bárbara Tren C',
  'Jusepín',
  'El Tablazo LGN1',
  'El Tablazo LGN2'
);
