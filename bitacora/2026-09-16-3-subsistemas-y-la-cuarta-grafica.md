# 2026-09-16 (3) — Sub-sistemas: la cuarta gráfica, y cómo el Excel contestó la pregunta

La cuarta gráfica del workbook llevaba dos sesiones bloqueada porque sus 9
categorías no salían del catálogo `SISTEMA`. Se destrabó en tres pasos, y el
tercero lo contestó el propio Excel.

## Primero fueron sub-regiones, después no

El owner dijo "creo que son como regiones", después "son sub regiones", y
finalmente **"no son subregiones, son subsistemas, perdón"**. La corrección
encaja mejor con la evidencia: cada una cuelga de **un solo sistema**, y dos
cuelgan del mismo (Ulé-Amuay). Si fueran sub-regiones, Costa Oeste y Costa
Este tendrían que separarse por región — y las dos están en Occidente.

Ese es exactamente el motivo por el que ni `sistema_id` ni `region_id` podían
producir esa apertura.

## "No estoy seguro, qué dice el Excel"

La pregunta abierta era si los sub-sistemas eran tres o había más. El manual no
da un catálogo único: la diapositiva 57 enumera **14 sub-sistemas de un solo
sistema** (tramos entre estaciones, `GUACARA MORÓN`, `ALTAGRACIA ARICHUNA`), y
la de Ulé-Amuay ni usa el término.

La respuesta estaba en el workbook. `CEN-ORI` tiene **9 bloques**, todos
homogéneos por sistema. Pero lo decisivo fue mirar qué hace el gráfico con
ellos:

```
ANACO- CCS / BQTO  = D82 + D123   ← junta dos bloques
ULE AMUAY          = D157 + D162  ← junta dos bloques
NOR ORIENTAL       = D37          ← lo deja separado
COSTA OESTE        = D134         ← lo deja separado
COSTA ESTE         = D149         ← lo deja separado
```

**El gráfico suma los bloques de vuelta a su sistema salvo tres.** Y sembrar
esos tres, con la regla "por sub-sistema cuando existe, por sistema cuando no",
da exactamente las 7 barras que el gráfico dibuja a partir de clientes.

Sembrar los otros seis bloques habría creado catálogo al que nada apunta. Los
14 del manual, tampoco: son un nivel más fino que ninguna salida usa.

## La regla vive en el SQL

El `GROUP BY` lleva sistema y sub-sistema, y el `LEFT JOIN` deja `NULL` en la
segunda columna. Cada sistema produce una fila por rama con consumo, más una
con `NULL` que junta a los que cuelgan directo. Eso **es** la regla, sin
ramificar en JavaScript. El Service sólo elige el nombre del eje, así que el
gráfico no conoce la decisión #78.

Verificado con una lectura por rama: Ulé-Amuay produce tres barras —sus dos
ramas más el resto—, igual que el Excel, y la suma de las barras cuadra con el
total del reporte.

## Detalles que quedaron dichos

- **`@@unique(sistemaId, nombre)` y no `nombre` solo**: dos sistemas distintos
  podrían tener una rama con el mismo nombre genérico.
- **`subsistema_id` nullable**: 92 de los 111 clientes cuelgan directo de su
  sistema. Nulo significa eso, no "falta el dato".
- **Los 4 `APORTE A EYP …` del bloque COSTA ESTE no se asignan**: la decisión
  #46 ya los había sacado del catálogo `CLIENTE` por ser transferencias entre
  sistemas. De los 23 nombres del bloque quedan 19 clientes.
- **El seed sigue siendo aditivo**: sólo asigna clientes que todavía no
  apuntan a ninguna rama, así que volver a correrlo no pisa una reasignación
  hecha a mano. Segunda corrida: 0 cambios.

## Queda pendiente

1. **Las 2 categorías que faltan de la gráfica** —`ENTREGAS DIRECTAS ORI.` e
   `ICO (MORÓN)`— no son consumo de clientes sino flujos de gasoducto. El owner
   confirmó que ICO es "una transferencia de un sistema a otro, un tren de
   regulación". `FUENTES!Q31` es un valor **con signo** y el signo codifica la
   dirección; se modelarían con origen y destino, sin signo. Es el mismo
   pendiente que la decisión #46 dejó abierto con `APORTE A EYP`.
2. La skill de UI.
