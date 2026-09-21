# 2026-09-21 — Telemetría, y una decisión cerrada que no resistió el archivo

La sesión arrancó con "vamos con los pendientes" y el primero de la lista era
telemetría de Mantenimiento: modelada y cerrada desde el principio, sin API ni
pantallas, atenuada en su menú. Parecía una implementación directa sobre un
modelo ya decidido. No lo fue.

## Lo primero que apareció: el dominio no tenía datos

`AREA_MTTO`, `ESTACION`, `TIPO_INSTRUMENTO` y `ESTACION_INSTRUMENTO` estaban en
el schema desde la migración inicial y **ninguno tenía seed**. El módulo se
podía construir entero y no habría tenido ni una estación sobre la cual
reportar. Es exactamente el hueco que el §14.5 encontró con
`GERENCIA_REQUIRIENTE` —FK obligatorio, cero filas— y el mismo tipo de cosa que
sólo se ve yendo al archivo antes de escribir código.

Así que antes de tocar nada se auditaron los dos archivos fuente, que es como
se trabajó en el §14 y por lo mismo.

## Lo segundo: la decisión #28 leyó la hoja equivocada

`INVENTARIO ESTACIONES.xls` resultó sólido y sin sorpresas: 251 filas, 247
estaciones reales, 6 regiones que calzan con las sembradas, 20 áreas
operacionales que no existían en ninguna parte, los 3 tipos de enlace exactos
que el schema ya anticipaba, y 16 columnas de instrumento con sus cantidades.

`DISPON_SISUGAS_Semana_35.xls` fue otra cosa. La decisión #28 había leído su
hoja `REPORTE SEMANAL` y deducido —bien— que el estatus real tiene cuatro
dimensiones independientes. El problema es que esa hoja **tiene 10 estaciones
de 251**, y está rotulada como las que "ameritan poca inversión y pueden ser
reactivadas con esfuerzo propio". Es una lista aparte, para otra cosa.

Lo que el área publica cada semana sale de otras dos hojas, y tiene otra forma:
`ESTACIONES OPERATIVA` lista las 47 que comunican, y `OBSERVACION` las **201**
en falla, cada una con su causa, su fecha de inicio y su observación. Los
números cierran solos: 201 + 47 = 248, que es el total de la propia hoja, y el
reparto por causa —hurto 139, eléctrico 27, comunicación 20, esperando reporte
10, control local 5— suma 201 exacto.

Y el dato que decidió todo: **las fechas de inicio arrancan en 2009**. Son
interrupciones que llevan años abiertas, que el área anota una sola vez cuando
empiezan. Sostener eso con una fila por estación y semana obligaba a escribir
248 filas semanales repitiendo el mismo dato para siempre.

Como la #28 era una decisión cerrada, no se cambió por cuenta propia: se llevó
al owner como diff conceptual, con los números que la sostienen. Eligió
rehacer.

## Lo que se construyó

- **Decisión #87**: `FALLA_ESTACION` + `CAUSA_FALLA` en lugar de
  `REPORTE_TELEMETRIA_ESTACION` + `ESTADO_TELEMETRIA`. Con un índice único
  parcial escrito a mano (`WHERE resuelta_en IS NULL`) para que una estación
  tenga a lo sumo una falla abierta — que es lo que hace que "operativa o en
  falla" tenga una sola respuesta. No había ni una fila que migrar.
- **Decisión #88**: `tipo_red` pasa a opcional. Tres estaciones del inventario
  no están marcadas ni T ni D, y las tres están en falla, o sea que cuentan en
  el total. Clasificarlas a ojo movía un indicador publicado.
- **Decisión #89**: el inventario entra al seed generado desde el workbook; las
  201 fallas entran por un script aparte, porque son datos operativos y no
  catálogo. Acá los datos de demostración **sí son reales**, al revés que en
  Despacho (#86): esto es estado de infraestructura, no volúmenes entregados a
  clientes.
- **El contrato §15**, la API entera (Repository → Service → Controller) y las
  tres pantallas: Disponibilidad, Estaciones y Bitácora de fallas.

## Cómo se verificó

38 comprobaciones de comportamiento contra la base real — catálogos, filtros,
los dos niveles de RBAC, las reglas de la bitácora (una sola falla abierta, no
empieza en el futuro, no se resuelve antes de empezar, no se resuelve dos
veces) y los dos reportes. Las 38 en verde.

Después, las tres pantallas en un navegador: se abrió una falla sobre
ALTAGRACIA y el tablero pasó solo de 49 disponibles a 48, de 19,8% a 19,4%, de
28 a 27 en transporte, y Centro de 6/45 a 5/46. La cadena de invalidación
funciona de punta a punta. Esa falla de prueba se borró después.

## Lo que el tablero reproduce, y lo que no

Centro-Occidente, Occidente y Este-Oriente salen **idénticas** al cuadro
publicado. El corte de transporte da 28, igual que el archivo — y eso confirmó
de paso que el corte T/D del indicador se resuelve contra el inventario y no
contra las marcas de la hoja semanal, que trae las dos columnas marcadas en 46
de 47 filas.

Las otras tres regiones quedan a una estación de distancia, y vale la pena
entender por qué: **las dos planillas derivaron entre sí**. El reporte semanal
nombra 4 nodos que el inventario no tiene (`LQU`, `JMV`, `IAL`, `REZ`) y cuenta
248 estaciones contra las 247 del inventario deduplicado. No es un error de
carga. Es dos planillas que nadie concilia, que es precisamente el problema que
el sistema existe para eliminar.

## Lo que queda anotado

`FALLA_ESTACION` no tiene tabla de historial, así que corregir la fecha de
inicio cambia el tiempo de caída sin dejar rastro. Es el **mismo hueco** que el
§14.7 ya tenía anotado para Actividades, y conviene decidirlos juntos: la
decisión #3 se tomó para Despacho y nadie la extendió a los otros dos módulos.

Y hay dos preguntas que sólo contesta alguien del área: qué son los 4 nodos
huérfanos, y de qué tipo de red son las 3 estaciones sin clasificar.

## Post scríptum: las pantallas estrenaban estilo

Al revisar, el owner marcó que **los filtros de Telemetría no se veían como los
de Despacho**. Tenía razón, y el diagnóstico era peor que el síntoma: yo había
escrito los controles a mano —`<select>` e `<input>` nativos con clases
Tailwind sueltas— en vez de usar los primitivos de `@/components/ui`. El
encabezado de `select.tsx` dice, con todas las letras, que ese componente
existe *porque* las mismas clases ya se habían copiado en tres archivos y
habían empezado a divergir. Hice exactamente eso otra vez.

Revisando a fondo apareció que la deriva no eran sólo los filtros:

- Controles con `h-9 rounded-md border-border bg-input` en vez del
  `h-8 rounded-lg border-input bg-transparent` de la casa.
- Etiquetas como `<span>` propio en vez de `<Label htmlFor>`, y filtros en
  `flex` donde la pantalla análoga usa una grilla.
- Botones de paginación, de alta y de acción escritos a mano en vez de
  `<Button variant="outline">`.
- Encabezados de tabla sin la constante `TH`, y con `bg-panel-raised`, que en
  el resto del sistema es un estado de hover y no un fondo de encabezado.
- Errores en un `<p role="alert">` en vez de `<Alert variant="destructive">`.
- **La sub-navegación debajo del título**, cuando en Actividades va arriba; y
  el botón de alta arriba de los filtros, cuando allá va abajo.
- Un histograma de barras hecho a mano, con `rounded-full`, que el sistema
  reserva **sólo** para los puntos de leyenda de las gráficas.

Ese último se resolvió reusando `GraficaBarras`, que era el componente
correcto y estaba a un import de distancia. Lo único que lo impedía es que
formateaba con `formatearVolumen`: para conteos de estaciones eso escribe
"139,00", que le atribuye al número una precisión que no tiene. Se le agregó un
`formatear` opcional que por omisión mantiene el comportamiento de Despacho, y
un `vacio` para el texto de "sin datos", que también era de Despacho.

La lección no es nueva —la crítica de diseño del 2026-09-17 ya había concluido
que el mayor problema del sistema era la deriva entre pantallas, y el propio
`layout.tsx` de Mantenimiento lo dice— pero conviene dejarla escrita donde se
tropezó: **antes de escribir un control, mirar cómo lo escribe la pantalla
equivalente que ya existe.**

## Segundo post scríptum: "Resolver hoy" parecía no hacer nada

El owner reportó que al resolver una falla el catálogo no se actualizaba. La
base decía otra cosa —las fallas resueltas estaban bien escritas— así que el
problema no era de escritura ni de caché del frontend, sino **de la definición
de qué falla cubre una fecha**:

```
OR: [{ resueltaEn: null }, { resueltaEn: { gte: alDia } }]
```

Con `gte`, una falla resuelta **con fecha de hoy seguía cubriendo hoy**. La fila
desaparecía de la bitácora (que filtra por `resuelta_en IS NULL`) pero la
estación seguía "en falla" en el inventario y en el indicador hasta el día
siguiente. Desde afuera, el botón no hacía nada.

El arreglo es `gt`: la falla cubre `[desde, resuelta_en)`. **El día del regreso
es un día de servicio, no de interrupción.** `diasCaida` en cambio sigue
contando inclusive, porque responde otra pregunta —cuánto estuvo caída, no si
hoy lo está—, así que una falla que empezó y terminó el mismo día duró un día.

Quedó como regla escrita en la decisión #87 y con una prueba de regresión que
recorre el ciclo entero: abrir una falla hoy, ver bajar el conteo, resolverla
hoy y ver el conteo volver **el mismo día**.

De paso apareció un choque latente en el filtro de estaciones: `estado`,
`causaFallaId` y el rango nuevo escribían todos la clave `fallas` en el mismo
literal, así que el último tapaba a los anteriores en silencio. Ahora van en un
`AND`.

## Los filtros que faltaban

- **Estaciones** ganó un rango `desde`/`hasta` que acota **cuándo empezó la
  falla abierta** — "qué se cayó desde el 5 de agosto y sigue así". Como una
  estación operativa no tiene fecha que comparar, usar el rango implica pedir
  las que están en falla, y la pantalla lo dice en una línea con un atajo para
  quitarlo.
- **La bitácora** pasó de un filtro a seis: estación (nodo o nombre), área,
  causa, tipo de red y el rango, además de la casilla de sólo abiertas. Su
  rango filtra por **solapamiento**, no por contención: una falla de 2018 que
  sigue abierta aparece al pedir 2026, porque sigue siendo parte de lo que pasa
  hoy.

Son dos preguntas distintas sobre el mismo dato —el estado actual del
inventario y la historia de las interrupciones— y por eso los rangos no se
unificaron. Queda anotado en el §15.

## Tercer post scríptum: el formulario de alta no se explicaba

El owner reportó que al resolver una falla la estación "no le salía" en el
formulario para anotar una nueva. Había tres cosas encima, y sólo una era un
error de datos:

1. **Escribió `CCR` y el nodo real es `CRR`.** La lista salía vacía
   *correctamente*, pero el formulario **no decía nada**: ni "sin coincidencias"
   ni cuántas opciones había. Una pantalla que no distingue "no hay resultados"
   de "está rota" es una pantalla rota.
2. **El desplegable pedía `pageSize: 50` y hay 56 operativas.** Aun sin buscar,
   seis quedaban afuera en silencio. Ahora recorre las páginas con
   `todasLasPaginas`, que existía justo para esto.
3. **Eran dos controles para una sola decisión**: una caja de búsqueda y, debajo,
   un desplegable que se alimentaba de ella.

Quedó un solo `<select>` con las 56, que además rotula cuántas son
("Elegir entre 56…") y explica debajo por qué la lista no las trae todas. El
`<select>` nativo ya busca escribiendo — es exactamente la razón por la que
`select.tsx` es nativo a propósito, y la caja de búsqueda estaba reimplementando
peor algo que el navegador ya hacía.
