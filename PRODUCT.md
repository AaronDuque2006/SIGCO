# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Analistas, ingenieros, supervisores, superintendentes y el gerente de la
**Gerencia de Control Operacional de PDVSA Gas**, repartidos en cuatro
departamentos: Despacho, Mantenimiento, Calidad de Gas y Análisis Operacional.

**La situación de uso es una sala de control, por turnos rotativos incluida la
guardia nocturna, sobre monitores fijos de escritorio y con la pantalla
encendida todo el día.** No es una herramienta que se abre y se cierra: es la
que está puesta mientras dura el turno.

El trabajo central de un analista de Despacho es **digitar el día de corrido**:
recorrer los 111 clientes y las 14 fuentes cargando volúmenes, corregir lo que
cambió, y consultar el balance resultante. Todo lo demás del sistema existe
alrededor de eso.

La jerarquía de puestos —Gerente, Superintendente, Supervisor, Ingeniero,
Analista— no es decorativa: su orden determina qué puede editar cada quien.

## Product Purpose

Reemplazar el workbook de Excel (`NUEVO BALANCE ACTUALIZADO.xlsm`) que hoy es el
registro operacional del despacho de gas, y pasar a ser **la única fuente**.

**El reemplazo es total: el Excel se retira.** Eso fija el listón de la
adopción — SICOG tiene que cubrir todo lo que el workbook hace hoy *antes* del
cambio, no después. Cada cosa que el Excel hace y SICOG no es un bloqueante de
la transición, no una mejora pendiente.

Éxito es que el turno entre, digite el día en SICOG, y nadie necesite abrir el
Excel para nada.

## Positioning

Lo que ninguna herramienta genérica de planillas o BI puede copiar con verdad es
que **las reglas de operación reales están codificadas y hechas cumplir**, no
descritas en un instructivo:

- La mecánica de los dos cortes (`PUNTUAL` digitado, `CIERRE_PROMEDIO` derivado
  por un job de medianoche como media del historial del día).
- El arrastre de un día al siguiente cuando nadie digitó.
- El historial obligatorio de correcciones, porque cualquier analista puede
  corregir cualquier registro y tiene que quedar rastro de quién.
- La autorización resuelta contra la base en cada petición, no contra el token.

Un Excel compartido no puede impedir que dos personas se pisen, ni decir quién
cambió un número, ni recalcular un cierre. Ahí está la diferencia.

## Operating Context

- **El día operativo es el de Venezuela**, no el del reloj del servidor. El job
  de cierre corre a las 00:05 en `America/Caracas`, y los filtros con hora usan
  esa zona. Una novedad de las 22:00 pertenece a su día local, no al siguiente.
- **Dos cortes por día.** El `PUNTUAL` se digita y se corrige durante la
  jornada; el `CIERRE_PROMEDIO` lo calcula el job de medianoche.
- **Cuatro dominios, cuatro departamentos.** Se consulta cualquiera, se edita
  sólo el propio. Hoy sólo Despacho está construido; los otros tres aparecen
  como "En desarrollo".
- **Vocabulario del área**, que la interfaz usa sin traducir: MMPCED, corte
  puntual, cierre promedio, fuente, cliente, sistema, sub-sistema, quema
  nacional, empaque / desempaque, novedad operativa.
- **Despliegue previsto**: un solo stack de docker-compose en Coolify (web, api,
  postgres). Todavía no ocurrió.

## Capabilities and Constraints

**Construido y verificado contra la base real:** autenticación con sesiones
rotativas, gestión de usuarios, y el módulo Despacho completo — balance diario
por cliente, lecturas de fuentes, quema nacional, novedades operativas,
contactos, catálogos, ABM de clientes y fuentes, el reporte Balance Nación, el
de consumo por sectores, la serie de recibido contra transportado, y el job de
cierre diario.

**Construido el 2026-09-18 — Actividades y Horas-Hombre**, el módulo
transversal: bitácora con flujo de asignación (el supervisor asigna, quien
ejecuta completa), plan anual, y los dos reportes. Va como **una sección por
departamento** (decisión #84). Hoy sólo Mantenimiento tiene catálogo sembrado,
porque es el único con planilla de origen; en los otros tres lo carga el
Supervisor desde el ABM.

**No construido:** la telemetría y las estaciones de Mantenimiento, que están
modeladas y cerradas desde el principio. Calidad de Gas y Análisis Operacional
**ni siquiera están diseñados**: no existe la planilla ni la especificación de
origen.

**Fase 2 — asistente de consulta con RAG local. Construido el 2026-09-24**
(`CONTEXTO_PROYECTO.md` §16, decisiones #100-#108), todavía sin desplegar. El
superadmin sube manuales (.pptx, .docx); las novedades operativas entran solas;
cualquier usuario pregunta en `/asistente` y recibe la respuesta con la fuente
de cada dato y la fila exacta de donde sale cada cifra. **Precisión medida**:
acierta el dato en ~70-80% de las preguntas técnicas y rechaza siempre las
fuera de tema; se equivoca sobre todo leyendo el valor de la fila o columna de
al lado en tablas, por eso la verificación de la fuente es parte del diseño y no
un adorno. Corre en CPU con un modelo de 7B y tarda ~1 minuto por respuesta; un
modelo más preciso exigiría otro hardware. El modelo corre **local, no contra un
servicio en la nube**, por tres razones que se sostienen juntas: el corpus son
documentos internos de PDVSA y no puede salir del perímetro de la empresa; la
sala de control opera 24 horas y un asistente que muere con el enlace a internet
no sirve ahí; y el almacén vectorial es la misma Postgres que ya existe, sin un
segundo motor que sincronizar.

Distinción de alcance que el trabajo futuro **no debe borrar**: los datos
operacionales son estructurados y numéricos, y preguntarles algo es una consulta
SQL, no recuperación semántica. El RAG aporta sobre el corpus **no
estructurado** — el manual oficial de sistemas de transporte, los
procedimientos, y sobre todo el histórico de novedades operativas, que crece
todos los días y hoy no es consultable más allá de filtrar por fecha y origen.
**Sus casos de uso concretos siguen sin confirmar** con el área, igual que el
control de acceso sobre lo que el asistente recupera. Cómo se evalúa ya existe
(`evaluar-rag` y el "¿Le sirvió?"), pero el set de preguntas lo redactó Claude:
falta el del área.

**Ya no queda un bloqueante conocido para retirar el Excel.** El último eran
las transferencias fuera del sistema (`ICO Morón`, `APORTE A EYP`), modeladas
el 2026-09-16 (decisión #79). Antes de eso SICOG reportaba 8 MMPCED de menos en
el transportado, porque el workbook las cuenta y el sistema las ignoraba.

**Restricciones técnicas confirmadas:**

- **Dos temas, con el oscuro de predeterminado.** El oscuro responde a la sala
  de control, donde la pantalla no se apaga en doce horas, y sigue siendo lo que
  se sirve si nadie elige. El claro se agregó el 2026-09-17 a pedido del owner
  —se usa de día, la preferencia es personal, y los PDF de gráficas y datos se
  leen mejor en blanco— y la elección vive en el navegador de cada equipo, no en
  la cuenta: depende del monitor y de la luz que le da, no de quién se sienta.
- Identidad visual actual: la paleta del prototipo cargada como tokens de
  shadcn/ui sobre Tailwind, en Next.js App Router.
- Una sola base PostgreSQL para los cuatro dominios, **sin mezclarlos**: sólo
  los catálogos genuinamente transversales se comparten por referencia.
- ~~La máquina de desarrollo se queda sin memoria~~ **Resuelto el 2026-09-16**:
  el owner pasó a un equipo con más capacidad. La anterior tenía 3,6 GiB de RAM
  y 512 MiB de swap, y con los dos servidores levantados compilar una página
  pasaba de segundos a minutos. Si algo vuelve a ir lento, medir antes de
  culpar al disco: el aviso de Next sobre "slow filesystem" apuntaba al lugar
  equivocado.

**Una novedad operativa mal cargada se corrige, no se borra.** Confirmado el
2026-09-17. El dominio es auditable y el modelo no tiene campo de baja, así que
la corrección es el único camino y eso es deliberado, no una funcionalidad que
falte. El único recurso de Despacho con borrado físico sigue siendo `CONTACTO`:
un teléfono viejo no es un dato operativo histórico, es ruido en una lista que
se consulta con apuro.

**Facts de producto todavía sin decidir:** si la grilla de Balance Diario
necesita subtotales por sistema o región. Es justo el tipo de detalle que sólo
aparece con la pantalla en uso real, así que se deja abierto a propósito en vez
de resolverlo por anticipado.

## Brand Commitments

**Ninguno formal, confirmado explícitamente.** No hay manual de marca de PDVSA
Gas que respetar, no hay obligación de usar el logo institucional, y no existe
ningún asset de marca en el repositorio — los únicos SVG son los que dejó
`create-next-app`. La identidad visual actual es una decisión del proyecto, no
una herencia corporativa, y puede cambiarse.

Futuro trabajo **no debe inventar** un manual de marca, colores corporativos ni
un logo que nadie entregó.

## Evidence on Hand

Real y disponible, en `archivos-fuente/` (gitignored, nunca se commitea):

- `NUEVO BALANCE ACTUALIZADO.xlsm` — el workbook operativo que se reemplaza.
  Sus **fórmulas** son la autoridad sobre las reglas, más que sus valores.
- `Manual DAO.pptx` — el manual oficial de los sistemas de transporte: los 7
  sistemas, sus estaciones, sus sub-sistemas y sus puntos de entrega.
- `ACTIVIDADES MDC FINAL V4.xls`, `DISPON_SISUGAS_Semana_35.xls`,
  `INVENTARIO ESTACIONES.xls`, `ESTACIONES TyD.csv`.

En la base, sembrados y reales: 7 sistemas, 14 fuentes, 111 clientes, 4
regiones, 7 sectores, 3 sub-sistemas, 4 departamentos, 5 puestos.

**Ausencias que no se deben rellenar inventando:** no hay planilla ni
especificación de Calidad de Gas ni de Análisis Operacional; no hay logo ni
manual de marca; no hay testimonios, métricas de adopción ni casos de uso
documentados.

## Product Principles

1. **Nunca rellenar una regla de negocio no confirmada con una suposición.** Las
   decisiones cerradas viven numeradas en `CONTEXTO_PROYECTO.md`; lo que no está
   ahí está abierto y se pregunta.
2. **Agotar las fuentes antes de preguntar.** Las respuestas suelen estar en el
   workbook o en el Manual DAO. Leer las **fórmulas**, no sólo los valores: dos
   veces eso cambió una decisión ya cerrada.
3. **No mezclar dominios.** Comparten base de datos y nada más.
4. **La seguridad es prioridad uno** en cada decisión de arquitectura, no una
   consideración entre otras.
5. **Cambio aditivo: modificar antes que borrar.** Cuando algo se puede resolver
   agregando o cambiando en lugar de quitando, se agrega.

## Accessibility & Inclusion

No hay una norma formal establecida ni un requisito regulatorio conocido, y no
se debe inventar uno.

Lo que sí es exigencia real, derivada de la sala de control por turnos:

- **Legibilidad sostenida durante una guardia completa**, incluida la nocturna,
  sobre una pantalla que no se apaga. El tema oscuro fijo responde a eso.
- **Contraste verificado**, no supuesto: los tokens actuales dan 15,08:1 para el
  texto principal y 5,63:1 para el atenuado sobre la superficie de tarjeta, los
  dos por encima de WCAG AA.
- **Digitación por teclado sin sacar la mano**: la grilla guarda al salir del
  campo o con Enter y descarta con Escape, porque son cien filas seguidas.
- **Ningún rechazo silencioso**: si el sistema descarta lo que alguien tecleó,
  lo dice. Un fallo mudo en una grilla de cien filas se descubre al final del
  día, o nunca.
