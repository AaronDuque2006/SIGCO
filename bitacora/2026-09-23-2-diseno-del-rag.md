# 2026-09-23 (2) — Diseño de la Fase 2: el módulo RAG

Sesión de diseño, sin código. Decisiones #100, #101 y #102; el diseño completo
quedó en `CONTEXTO_PROYECTO.md` §16.

## El planteamiento del owner y la revisión

El owner trajo un diseño propio del módulo RAG: Ollama con Qwen2.5 7b (3b si la
RAM no alcanza), pgvector en la misma base, cola de ingesta en Postgres sin
Redis, y —lo más valioso— **clasificar cada slide o página en TEXTO, TABLA o
IMAGEN antes de trocear**, con evidencia medida sobre `Manual_DAO.pptx` (95
narrativas, 11 esquemáticas, 4 mixtas). Las slides esquemáticas son el diagrama
de la red de gasoductos: su texto crudo no significa nada sin la posición de
las etiquetas.

La revisión sumó, sobre todo: búsqueda híbrida (vector + full-text en español)
en vez de palabras clave sólo para diagramas; medir el modelo de embeddings
antes de fijarlo, porque `nomic-embed-text` es mayormente inglés y además exige
prefijos; descripciones de los ~15 diagramas escritas por una persona del área
en vez de un modelo de visión en CPU; reclamo de trabajos trabados en la cola;
reemplazo transaccional de chunks al resubir; límites contra zip bombs;
registro de consultas; y un set de 20-30 preguntas reales para evaluar.

## Lo que decidió el owner

- **#100**: los Excel operativos quedan fuera — sus datos ya están en SICOG y el
  RAG contestaría con cifras viejas. Pero el owner aclaró que `.xlsx` sigue
  entrando para planillas que **no** replican datos del sistema. El criterio es
  el contenido, no la extensión.
- **#101**: sólo el superadmin sube documentos. Se le señaló que choca con la
  decisión #31 y que hay un solo superadmin sin recuperación; el owner lo
  mantuvo porque quiere que una sola persona controle qué entra a la
  aplicación. Quedó escrito como excepción explícita a la #31, con el riesgo
  aceptado.
- **#102**: el histórico de `NOVEDAD_OPERATIVA` entra desde la primera
  versión, como segundo origen de chunks sin archivo. `CHUNK_RAG` referencia a
  la novedad y no al revés, así la tabla de Despacho no se toca.

## Queda pendiente

- Si la Fase 2 entra en el trabajo de grado, y los casos de uso concretos con el área.
- Técnicos, midiendo: RAM de la VM, modelo de embeddings y dimensión, worker en
  Node o Python, heurística de PDF, prompt de sistema, set de evaluación.
- Sigue la regla: ni contenedor de Ollama ni código de RAG hasta que la fase arranque.
