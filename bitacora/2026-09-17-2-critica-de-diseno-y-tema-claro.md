# 2026-09-17 (2) — La crítica de diseño, y el tema claro que estaba prohibido

Sesión larga y en tres tiempos: un dossier para el trabajo de grado, una
crítica de diseño formal sobre `apps/web` con sus arreglos, y la reapertura de
una decisión cerrada.

## `CONTEXTO_TEG.md`

El proyecto además es el trabajo de grado del owner, y le estaban pidiendo
propuesta y título. Se escribió un dossier **autocontenido** para pegar en una
conversación de Claude en la web: problema, solución, dominio, reglas de
negocio, arquitectura, seguridad, metodología realmente empleada, datos
cuantitativos, y —lo importante— una lista explícita de **vacíos que no se
deben inventar** (universidad, carrera, normativa de citación, tutor, fechas) y
las restricciones de confidencialidad que aplican igual al documento académico.

## La Fase 2 entró a `PRODUCT.md`

El RAG estaba en el stack (`pgvector` desde la primera migración, Ollama
previsto) y **en ninguna parte de `PRODUCT.md`**. El owner lo confirmó como
capacidad futura comprometida, no como idea suelta. Quedó escrita también la
distinción que el trabajo futuro no debe borrar: los datos operacionales son
SQL, el RAG aporta sobre el corpus **no estructurado** — manuales,
procedimientos, y sobre todo el histórico de novedades.

De paso se cerraron dos facts abiertos: las novedades **se corrigen, no se
borran**, y los subtotales de Balance Diario **siguen sin decidirse** a
propósito, porque es de esas cosas que sólo aparecen con la pantalla en uso.

## La crítica: 27/40

Dos evaluaciones aisladas en paralelo —revisión de diseño y detector
determinista— sintetizadas en un informe. Sin navegador en la sesión, así que
todo lo que depende de render quedó **sin comprobar, no limpio**.

El veredicto que importa: el sistema **está authored para este producto**, no es
un admin genérico con el switch en dark. Pero *"este código piensa mejor de lo
que se ve"* — el criterio está escrito en `DESIGN.md` y se aplicaba desigual.

Los dos análisis **convergieron por caminos opuestos** sobre la misma raíz: la
revisión encontró la deriva tipográfica *por arriba* (un `text-2xl` rompiendo el
techo declarado, dos escalas de tarjeta) y el detector la encontró *por abajo*
(tres tamaños entre pasos de la rampa). La rampa estaba documentada y no estaba
impuesta.

### Lo que se arregló

- **Enter baja a la celda siguiente.** Era el hallazgo grande: `PRODUCT.md` dice
  que el trabajo central es digitar el día de corrido y `DESIGN.md` justifica el
  guardado al salir del campo para no sacar la mano del teclado — y después de
  cada Enter el foco caía al `body`. Ciento once veces. Peor: `disabled` durante
  el guardado **le robaba el foco una segunda vez** a quien digita por teclado.
  Ahora el orden sale del DOM, así que sigue al filtro solo, y si lo tecleado no
  sirve el foco no se mueve.
- **Acuse de guardado.** El sistema tenía una regla explícita para el rechazo y
  ninguna para la aceptación: desde el teclado, una celda guardada y una cuyo
  POST falló en silencio se veían igual. Es la simétrica de la Regla del Rechazo
  Audible.
- **La cascada dejó de ser invisible.** Corregir un día cerrado recalcula ese
  cierre y se arrastra a los días heredados (#44 y #45), y la pantalla no lo
  decía. Nadie puede consentir algo que no se le dijo.
- **La tarjeta de Condición afirmaba un estado falso mientras cargaba**
  —"Salió más gas del que entró"— porque el pie no estaba protegido por la
  guarda de `undefined`. Se resolvió por construcción: las tarjetas reciben el
  dato ya cargado y no pueden renderizarse sin él.
- **Deriva del sistema visual**: nacieron `ui/select.tsx` (el mismo puñado de
  clases estaba copiado en cuatro archivos), `TarjetaCifra` y `CONTENEDOR`.
- **Un solo ancho de contenedor**, que el owner señaló mirando la pantalla real:
  sobraban 370px de margen a cada lado y, peor, la columna Sistema quedaba tan
  angosta que los nombres partían en dos líneas — el margen que no se usaba **se
  pagaba en filas que no se veían**.
- Historial en Transferencias (el backend lo escribía desde el primer día y
  ninguna pantalla lo miraba), zona horaria de Caracas en todas las marcas de
  tiempo, y una sola paleta en `:root`.

### Lo que el owner corrigió de mis decisiones

Dos veces, y las dos con razón:

1. **Empacado en verde y Desempacado en rojo.** Yo los había puesto en el acento
   azul razonando que el desempaque es frecuente y no una alarma. El owner: es
   la condición operativa que el área quiere ver de lejos, y que ocurra seguido
   no la vuelve neutra. Anotado en `DESIGN.md` con la alternativa descartada,
   para que no se vuelva a neutralizar.
2. **La mini gráfica va dentro de la tarjeta, no como banda.** La construí a
   ancho completo y se llevaba ~130px de alto. *"Esa gráfica quita demasiada
   visibilidad para la carga de datos."* Correcto: en una pantalla de digitación
   el alto es de la grilla. Pasó a ser una curva de 22px dentro de la tarjeta de
   Variación, con la banda **borrada entera** en vez de dejada sin usar.

## El tema claro reabre la decisión #57

Estaba cerrado en contra y registrado en tres lugares, incluido un *Don't*
explícito que decía "no introducir un modo claro sin volver a discutir la
decisión". Se discutió: se usa de día, la preferencia es personal, y **los PDF
de gráficas y datos se leen mejor en blanco**.

Lo que costó de verdad no fue el toggle:

- **La paleta clara se midió, no se copió de shadcn.** 17,46:1 el texto
  principal, 6,06:1 el atenuado. El fondo no es blanco puro: un blanco pleno a
  pantalla completa deslumbra en una jornada larga, que es el mismo problema que
  el oscuro resuelve por el otro lado.
- **Los siete tonos de sector se revalidaron enteros**, porque una comprobación
  hecha contra `#101828` no dice nada sobre blanco. En claro los siete superan
  5:1 como marca —mejor que en oscuro, donde el magenta se quedaba en 2,94— y el
  peor par adyacente separa ΔE 8,8.
- **El validador ahora existe.** `DESIGN.md` mandaba "validar con el script" y
  ese script era una herramienta suelta de otra sesión que nunca se commiteó.
  Se escribió `scripts/validar-paleta.mjs` y se verificó contra las cifras que
  las decisiones #75 y #76 ya tenían documentadas: reproduce 15,08:1 y 5,63:1
  exactos, y confirma que el orden de la paleta mantiene los pares que colisionan
  fuera de la adyacencia.
- **Sin parpadeo**, con el script en línea en el `<head>` que es el patrón
  documentado de esta versión de Next.

## Un error que no era del código

Apareció un error de hidratación en el navegador del owner: `cz-shortcut-listen`
en el `<body>`. Lo pone **ColorZilla**, una extensión. Se resolvió con
`suppressHydrationWarning` en el `<body>`, que es superficial y no puede tapar
una diferencia real porque esos atributos son constantes.

## Queda pendiente

- **El módulo de Mantenimiento/Actividades**, que es lo que sigue.
- **Pegar una columna desde Excel** en la grilla: es la carencia que más le duele
  al usuario experto —vienen de un workbook donde pegaban la columna entera— y
  es la única recomendación de la crítica que **no se implementó**, porque es
  funcionalidad nueva y necesita confirmación del área sobre formato y sobre qué
  pasa si lo pegado no calza con el filtro.
- El `65vh` de la grilla pasó a `calc(100dvh-12rem)` medido contra la pantalla
  real, así que ese punto abierto de `DESIGN.md` se cierra.
- `.impeccable/design.json` quedó desactualizado respecto de `DESIGN.md`, que se
  tocó tres veces. Se refresca con `/impeccable document`.
- Sigue sin resolverse **un solo superadmin sin recuperación técnica**, y el
  sistema **todavía no se desplegó**.
