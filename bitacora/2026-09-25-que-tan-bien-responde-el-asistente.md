# 2026-09-24/25 — Qué tan bien responde el asistente

Continuación de `2026-09-24-arranca-el-rag.md`. El owner empezó a usar el
asistente de verdad, y cada pregunta que falló destapó algo. Decisión #108; el
detalle técnico vive en `CONTEXTO_PROYECTO.md` §16.

## Las preguntas reales que fallaron

- **"Explica qué es la EPA y por qué es tan importante"**: la definición quedaba
  25ª en la búsqueda. Dos causas: las tablas de nomenclatura se leían con sus
  primeras filas como encabezado, y una sigla sola casi no pesa. Ahora las
  siglas de estación se expanden con el nombre que trae el propio corpus. El
  "por qué es importante" no está en el manual (vive en los esquemas sin
  describir): el modelo lo deduce, y eso quedó escrito como límite.
- **"Consumo promedio de ERP Pele El Ojo"**: la fila era la única con ese nombre
  y salía 1ª por palabras, pero la búsqueda por significado no distingue nombres
  propios y la fusión la dejaba 13ª. Ahora el top 2 de cada búsqueda entra
  siempre. El owner preguntó si convenía dejar el pptx por Excel: no, la tabla
  estaba bien leída y en Excel habría dado el mismo texto.
- **El primer docx real** (`Manual contingencia 2024.docx`, subido por el owner)
  no usa estilos de título: sus 221 chunks quedaban sin sección. Ahora un
  párrafo corto en negrita cuenta como título.

## Cómo se mide

A pedido del owner: planilla Excel de preguntas para que la llene el área,
`evaluar-rag --respuestas` que califica solo el dato clave, la cita y el "no lo
encuentro", y el "¿Le sirvió?" en cada respuesta con su bandeja para el
superadmin. Con dos manuales que repiten la misma data, la cita se califica por
contenido y no por slide. "Mis consultas" (#108): 30 días visibles, nada se
borra en la base.

## Lo que dio la medición

La búsqueda está bien: 33 de 33 con la fuente correcta entre las 5 primeras. El
límite es el modelo: Qwen2.5 7B acierta el dato en ~70-80% de las preguntas,
rechaza siempre las fuera de tema, y cuando falla casi siempre es por leer la
fila o la columna de al lado. Se probaron dos salidas y ninguna mejoró:
1 fila por chunk (igual de preciso, búsqueda peor) y Qwen3 8B (20-21 de 29
contra 23, más memoria: Ollama murió por `oom-kill` dos veces en la laptop).
Se quedó Qwen2.5 7B y se borraron los modelos de prueba.

Lo que sí se hizo, porque el ~25% de error no va a desaparecer con este
hardware: **mostrar de qué fila y columna sale cada cifra** debajo de la fuente,
sin desplegarla. En una respuesta equivocada se lee "VDC: 5,94" en lugar del
consumo, y el error queda a la vista.

## Errores míos del camino

- Una migración generada con `prisma migrate diff` borró los índices HNSW y
  GIN escritos a mano; se aplicó sin revisar. Se recrearon y quedó la
  advertencia en `CLAUDE.md` y el §16.6.
- Un `git stash` para comparar el lint dejó la API corriendo sin las rutas del
  asistente ("Ruta no encontrada" en la pantalla del owner).
- El owner trabajaba en paralelo en otra sesión: las dos numeraron una #107. La
  del asistente pasó a #108, y los commits pasaron a incluir sólo los bloques
  propios de los archivos compartidos.

## Queda pendiente

- Preguntas reales del área para la planilla (las 36 actuales son casi todas
  de Claude).
- Los datos del servidor: modelo de procesador y si tiene AVX2 (§16.10).
- Describir los 11 esquemas del Manual DAO; parsers de PDF y XLSX; el
  contenedor `ollama` en el compose.
