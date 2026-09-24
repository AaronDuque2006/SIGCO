# 2026-09-24 — Arranca la Fase 2: el asistente de consulta

El owner dio la orden de arrancar ("vamos con el rag") y la fase quedó
construida en el día: ingesta, búsqueda, asistente y pantalla de documentos.
Decisiones #103-#106; el detalle vive en `CONTEXTO_PROYECTO.md` §16.

## Tres decisiones antes de escribir código

Se le preguntaron tres cosas al owner. Pidió la recomendación para el worker
y se eligió **Node dentro de `apps/api`** (#103): el corpus conocido son pptx,
que es XML en un zip, y un contenedor Python sólo se justifica si llegan PDFs
escaneados. Eligió **medir antes de fijar el modelo de embeddings**, que era
la decisión más difícil de revertir. Y eligió que el asistente sea **una
entrada propia en el hub** y no un quinto departamento (#104).

## Lo que corrigió la medición

Al extraer el Manual DAO apareció que el §16.4 estaba mal: no eran "95 slides
narrativas" sino casi todo **tablas** (unas 85 slides, 1.799 filas), 11
esquemas y apenas 4 slides de texto. Eso reorientó el troceo entero.

La comparación de embeddings (30 preguntas, prototipo en Python) dejó
`nomic-embed-text` con búsqueda híbrida como ganador frente a `bge-m3`: igual o
mejor, 2,7 veces más rápido y un cuarto de la RAM (#105). Los fallos mostraron
dos arreglos concretos: `unaccent` ("Güiria" no encontraba "Guiria") y expandir
`GDTO 30"` a "gasoducto 30 pulgadas".

Al pasar el prototipo a SQL real, la búsqueda **empeoró** (MRR 0,88 → 0,66). La
causa: `ts_rank_cd` de Postgres no pondera por rareza, así que "gasoducto" pesaba
lo mismo que "Cardón". Se escribió BM25 en la propia consulta y quedó en
**0,93-0,94, con las 30 preguntas dentro de las 5 primeras**.

## Lo que corrigió la primera respuesta

La primera consulta de punta a punta tardó **4 minutos** y encima contestó "no
lo encuentro" teniendo la slide correcta. Medido contra Ollama: 6.400 tokens de
prompt a 26 tokens/s. El formato "encabezado: valor" repetía encabezados largos
en cada fila. Se probó mandarle al modelo la tabla compacta y bajó el tiempo,
pero en las tablas anchas el modelo **leía el año vecino** (Cardón 2021 → el
valor de 2020). Se volvió al formato largo con 2 filas por chunk, presupuesto
de 4.000 caracteres de contexto y máximo 2 chunks por slide.

Se midió Qwen 3b: el doble de rápido, pero **0 de 3** leyendo la fila de
Cardón. Queda el 7b (#106), con una regla explícita en el prompt para leer por
encabezado exacto (6 de 6). También se descartó el umbral de similitud para
"no lo encuentro": una receta de arepas puntúa 0,60 y la peor pregunta del
manual 0,61.

## Un bug que apareció probando

Editar un archivo con la API en modo watch la reinició a mitad del manual, y
el documento quedó en PROCESANDO — con el umbral de 30 minutos, trabado media
hora. Como el stack corre una sola API, la primera pasada después de arrancar
ahora rescata todo lo que esté en PROCESANDO.

## Estado

Verificado contra la base real y Ollama local: rechazos de subida (analista
403, extensión falsa, PDF, repetido 409), procesamiento del Manual DAO (803
chunks en ~3 minutos), las 5 novedades de demostración indexadas solas, y
consultas por la pantalla con citas que despliegan la fila exacta. Las filas de
auditoría de las pruebas se borraron; **el Manual DAO quedó cargado**, porque es
el corpus real.

## Queda pendiente

- Preguntas reales del área para el set de evaluación (las 30 actuales las
  redactó Claude y comparten vocabulario con el manual).
- Si ~1 minuto por respuesta alcanza para el área.
- Descripción de los 11 esquemas, y conservarlas al reprocesar.
- Parsers de PDF y XLSX.
- El contenedor `ollama` en el compose de despliegue.

## Post scríptum: la pregunta de la EPA

El owner preguntó "Explica qué es la EPA y por qué es tan importante para el
sistema" y el asistente contestó mal. Dos causas de búsqueda, corregidas: las
tablas de nomenclatura se leían con las primeras filas como encabezado (la de
"Estación Principal Anaco = EPA" quedaba ilegible), y la sigla sola casi no
pesaba — la definición salía 25ª. Ahora las siglas de estación se expanden con
el nombre que trae el propio corpus, y sale 1ª-2ª. Y un límite que no es de
código: el manual no dice por qué la EPA es importante; eso vive en los
esquemas sin describir, y el modelo lo rellena con una deducción.

