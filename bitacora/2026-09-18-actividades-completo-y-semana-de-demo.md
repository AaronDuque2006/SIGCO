# 2026-09-18 — Actividades de punta a punta, y una semana para mostrarlo

El contrato §14 estaba escrito desde ayer. Hoy se construyó entero: API,
pantallas, y una semana de datos para la presentación.

## La skill encontró dos huecos antes de escribir una línea

El owner pidió usar `api-and-interface-design` para la API. Su lista de
verificación, corrida **contra el §14 ya escrito**, encontró dos cosas: el
contrato estaba bien, la base no lo sostenía.

**Los tres catálogos no tenían unicidad de nombre.** Es el mismo hueco que la
decisión #66 cerró en Despacho, con su mismo razonamiento textual: entre un
`SELECT` y un `INSERT` hay una carrera. Único **por departamento** y no
nacional, porque acá el catálogo es de cada departamento (decisión #9) — que
Calidad de Gas no pudiera tener un insumo "Administrativo" porque Mantenimiento
ya lo tiene sería mezclar dominios que comparten tabla.

**`POST /registros` no era seguro de reintentar.** En Despacho **todos** los
`POST` chocan contra un `@@unique` del propio dato, y por eso el §11.1 pudo
decidir explícitamente que no hacía falta `Idempotency-Key`. `ACTIVIDAD_REGISTRO`
no tiene clave natural —dos asignaciones idénticas de la misma tarea a la misma
persona son legítimas— y sus horas alimentan indicadores: un doble clic o un
reintento tras un timeout creaba dos filas de horas idénticas. Nació
`CLAVE_IDEMPOTENCIA` (decisión #82), reclamada con el único y no con un `SELECT`
previo.

## La colisión que apareció al implementar

El §14.4 dice que el REAL **no filtra por estatus** — leído de las fórmulas del
workbook. Pero esa regla salió de un archivo donde **`RECIBIDO` no aparece ni
una vez**, porque el Excel no tiene flujo de asignación.

Con el flujo que el owner confirmó, una tarea recién asignada habría sumado su
`cantidad` al mes en que se estima que termina, y el reporte habría afirmado que
se hizo trabajo que nadie empezó. `RECIBIDO` quedó como la única excepción, y
`hh` pasó a ser nullable: `null` dice "todavía no se sabe", un cero afirmaría
que la tarea tomó cero horas (decisión #83).

## Las pantallas, y un recorte que estaba mal

Se construyeron primero sólo bajo Mantenimiento. El owner entró como analista de
Despacho, buscó sus actividades desde Despacho, y no las encontró.

Tenía razón: la decisión #9 siempre dijo "un botón/sección **por
departamento**". El recorte —"el catálogo de Despacho está vacío, sería una
pantalla en blanco"— era defendible pero equivocado, y el owner confirmó que la
estructura es la misma y que el catálogo lo carga el Supervisor.

Eso destapó un bug que el catálogo vacío iba a provocar sí o sí:
`useDepartamentoId` deducía el id del departamento **a partir de sus insumos**,
así que un departamento sin catálogo resolvía a `null` y la pantalla entera se
quedaba sin datos.

Las cuatro vistas entraron como **una** entrada de menú con sub-navegación
adentro (decisión #84): con cuatro, el menú de Despacho quedaba en diez, y la
crítica de anteayer ya había marcado que sus seis estaban por encima de lo que
alguien sostiene de un vistazo.

## Dos cosas que el owner corrigió

**El flujo de asignación no se podía usar.** El formulario siempre ponía como
responsable a quien lo abría, así que las actividades de los analistas no podían
existir. Faltaba además una pieza de backend: `/api/usuarios` es exclusivo del
superadmin (decisión #11), de modo que un supervisor no podía ni listar a su
gente. Nació `GET /registros/responsables`.

**"Sólo los míos" y "Mi equipo" no se entendían.** Que el owner preguntara qué
significaban *era* el hallazgo: una opción de filtro que hay que explicar no
funciona. Pasaron a "A mi nombre" y "De mi gente". Y al revisarlo apareció que
**ninguna cuenta tiene supervisor asignado**, así que "De mi gente" devuelve hoy
lo mismo que "A mi nombre" — no falla ni avisa, simplemente no tiene datos sobre
los que operar.

## Un bug que su pregunta destapó

Preguntó quién carga el plan anual. Al verificarlo: la pantalla habilitaba las
celdas a **cualquiera que no fuera Analista** —o sea también a un Ingeniero—
mientras el backend exige Supervisor+ (decisión #30). Un ingeniero habría
llenado los doce meses de los 24 productos y recién al guardar se habría comido
un 403, con todo el trabajo perdido.

## Fondo animado en la puerta

Pedido del owner: el `CursorGrid` de React Bits en login y cambio de contraseña.
Es una excepción explícita al principio de `DESIGN.md` de que nada parpadea sin
motivo — esas dos **son la puerta, no el instrumento** (decisión #85), y el
componente lo dice en su encabezado para que nadie lo lleve a una grilla.

Tres cambios sobre el original: escucha en `window` para poder vivir detrás del
formulario sin bloquearlo, lee el color de `--primary` y lo relee al cambiar de
tema, y no dibuja nada con `prefers-reduced-motion`.

Cuando pidió "una sombra" para que la retícula no se viera sobre el formulario,
la respuesta no fue un `box-shadow` —`DESIGN.md` lo prohíbe, y además habría
dejado la retícula visible igual— sino darle superficie a la tarjeta, que es
apilar tono. Después se agregó la penumbra de 110px alrededor, para que el fondo
no se corte seco contra el borde.

También se agregó **ver la contraseña**, campo por campo. Importa porque la
temporal la genera el sistema y se transcribe de un papel, y el error vuelve
como "credenciales inválidas", que no distingue un tipeo de una contraseña
ajena.

## La semana de demostración

Cifras **plausibles, no reales**, por decisión del owner (#86). Dos errores que
los propios números destaparon:

- La primera corrida dio **~5.000 MMPCED** de total nacional, casi el triple del
  orden real. Cualquiera que conozca la operación lo nota en la primera mirada.
- **Seis de siete días daban desempacado**, porque el recibido apuntaba sólo a
  la suma de clientes cuando el transportado incluye quema y transferencias.
  Quedaba corto por construcción: tarjeta de condición que nunca cambia y
  gráfica plana.

Corregidos los dos, la semana quedó en ~1.800 MMPCED con cuatro días empacados y
tres desempacados. Los `CIERRE_PROMEDIO` no los escribe el script: corre el
**job real**, que es el único que puede escribirlos.

## Queda pendiente

- **Telemetría y estaciones de Mantenimiento**: modeladas y cerradas desde el
  principio, sin API ni pantallas. Es lo único que le falta a ese dominio.
- **El despliegue**, que sigue sin ocurrir. Si la presentación deriva en uso
  real, deja de ser opcional.
- **Los dos huecos del §14.7**, que pesan más ahora que el flujo de asignación
  está construido: `ACTIVIDAD_REGISTRO` no tiene tabla de historial —un
  supervisor corrige las horas de un analista y no queda rastro— y no se guarda
  quién asignó una tarea.
- **La cadena de supervisión sigue vacía**: sin ella, "De mi gente" no sirve y
  la decisión #25 no tiene datos.
- Calidad de Gas y Análisis Operacional, sin planilla de origen.
