-- Decisión #107: el sistema de dos de las fuentes nuevas se había inferido de
-- la fuente vieja que reemplazaban, y el Manual DAO dice otra cosa. Las dos
-- se reciben en el sistema Anaco - Puerto Ordaz:
--   - Directo a ventas en Anaco ("ATA" en GUIA WEB): el esquema de la slide 23
--     pone ATA en la Estación Principal Anaco, y la slide 27 lista "Anaco"
--     como fuente recibida en EPA.
--   - Gas seco (Soto) ("SOT-EPA" en GUIA WEB): la slide 27 lista "Norte de
--     Monagas" recibido en la estación Soto, y la slide 24 ubica Soto (SOT) y
--     EPA en ese sistema.
-- En una base nueva estas fuentes todavía no existen y el UPDATE no toca
-- nada: el seed ya las crea con el sistema correcto.
UPDATE "fuentes"
SET "sistema_id" = (SELECT id FROM "sistemas" WHERE "nombre" = 'Anaco - Puerto Ordaz')
WHERE "nombre" IN ('Directo a ventas en Anaco', 'Gas seco (Soto)');
