-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "entrega_directa" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "lecturas_fuente" ADD COLUMN     "desvio" DECIMAL(14,4);

-- AlterTable
ALTER TABLE "lecturas_fuente_historial" ADD COLUMN     "desvio_ant" DECIMAL(14,4);


-- Decisión #107: el catálogo FUENTE pasa a ser el de la hoja GUIA WEB, que es
-- la que alimenta el balance (PROMEDIO!C17:G27), y no el desglose de la hoja
-- FUENTES. Salen las 21 fuentes que el balance del workbook no suma. Las
-- cuatro que faltaban (Tonoro, Anaco, Gas seco Soto, Producción Occidente)
-- las inserta el seed, que es quien conoce los sistemas.
--
-- Con sus lecturas y su historial (el historial cae por el ON DELETE CASCADE)
-- y sus contactos, que son de borrado físico (decisión #73). Una novedad
-- operativa que apunte a alguna de estas fuentes **frena la migración** a
-- propósito: es un dato histórico y no se borra en silencio.
CREATE TEMP TABLE fuentes_que_salen AS
  SELECT id FROM "fuentes" WHERE "nombre" IN (
    'RECAT SJ',
    'SJB FI FII',
    'Santa Bárbara Tren A y B',
    'Santa Bárbara Tren C',
    'Jusepín',
    'Soto',
    'Aguasay 5A',
    'Bajo Guanipa',
    'ETSJ',
    'Zapato Viejo',
    'Corredor Jusepín-Criogénico',
    'El Tablazo LGN1',
    'El Tablazo LGN2',
    'C. Petroquímico',
    'Planta Fertilizante',
    'Comb. Trans. a Pequiven',
    'Hacia La Paz Gas E&P',
    'Hacia Ramón Laguna',
    'Hacia La Pica-Ule Amuay',
    'Hacia La Pica-Retorno a Prod.',
    'PAGMI'
  );

DELETE FROM "lecturas_fuente" WHERE "fuente_id" IN (SELECT id FROM fuentes_que_salen);
DELETE FROM "contactos" WHERE "fuente_id" IN (SELECT id FROM fuentes_que_salen);
DELETE FROM "fuentes" WHERE id IN (SELECT id FROM fuentes_que_salen);
DROP TABLE fuentes_que_salen;

-- Las 4 entregas directas (PROMEDIO!F25 = CEN-ORI!E56+E115+E51+E62). Mismo
-- criterio que PROCESA_GAS en la migración 20260923095251: por nombre exacto
-- del seed, que también las marca en una base nueva.
UPDATE "clientes" SET "entrega_directa" = true WHERE "nombre" IN (
  'CEMENTOS CERRO AZUL',
  'P.E. SAN DIEGO DE CABRUTICA',
  'LA TOSCANA SAN VICENTE',
  'P.E. TERMO BARRANCA'
);
