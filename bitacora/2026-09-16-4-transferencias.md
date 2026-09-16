# 2026-09-16 (4) — Transferencias: el Excel contaba 90 y SICOG decía 82

Último bloqueante conocido para retirar el workbook. La decisión #46 había
sacado del catálogo `CLIENTE` las filas que no son clientes —los aportes a EYP
y la transferencia ICO-NURGAS— y eso estaba bien. Lo que no estaba bien era
dejarlas afuera del todo.

## La discrepancia era medible, no teórica

El workbook las lleva **dentro** del bloque de clientes y las cuenta en su
`TOTAL VENTAS`:

```
Bloque COSTA ESTE
  CAMC COMBUSTIBLE INTERNO                     19
  CLIENTES INDUSTRIALES K00                    30
  APORTE A EYP K04+600 (LA PICA)                8   ← excluido
  PETROZAMORA / PUNTA GORDA / LAGUNIGAS / SIZUCA  33
  ─────────────────────────────────────────────────
  TOTAL del Excel (D149)                       90
  lo que SICOG reportaba                       82
```

Y ese `D149` viaja hasta el transportado del Balance Nación
(`C43` → `C45` → `E14`). O sea que la cifra que el área mira todos los días
estaba **8 MMPCED corta**, y nadie lo habría notado hasta cuadrar contra el
Excel.

`TRANSFERENCIA ICO-NURGAS` vale 0 hoy, así que no aportaba a la diferencia —
pero la habría aportado el día que no valga 0.

## El signo es el dato

El owner eligió replicar el workbook: `FUENTES!Q31` es un valor **con signo**, y
el signo dice en qué sentido fue el gas. Positivo es ICO→NURGAS, negativo
NURGAS→ICO.

Eso obligó a abrir una puerta que el sistema tenía cerrada en todos lados: el
volumen negativo. La regla quedó acotada de la única forma que es defendible —
**sólo un punto bidireccional lo admite**, y quien lo hace cumplir es el
Service, no el schema del borde. El schema acepta signo porque no puede saber de
qué punto se trata; el Service sí lo sabe. Un aporte a EYP en negativo sería
gas volviendo de otra división, no una dirección contraria.

Se verificó en los dos caminos: crear un aporte negativo y corregir uno a
negativo dan los dos `422` con el nombre del punto en el mensaje.

## Lo que el signo rompió sin que nadie lo pidiera

Con transferencias en la suma, **una agrupación puede dar negativo**. La
gráfica de barras no sabía de eso: calculaba `valor / maximo * 100` y luego
`Math.max(proporcion, 1)`, así que un −12,5 se dibujaba como una barra del 1%.
Eso dice "casi nada entregado" cuando lo que hubo fue entrada neta.

Ahora la escala se mide en valor absoluto y un total negativo **no dibuja
barra**: el número con su signo lo cuenta bien y la barra se calla. Apareció
probando, no revisando — el caso salió en los datos de prueba antes de que
existiera en los reales.

## Lo que salió gratis

El promedio del cierre no necesitó caso especial. Se calcula en `Decimal` como
todos los demás, así que un punto que fue en un sentido media jornada y en el
otro la otra promedia su signo solo. Verificado con `(6+10)/2 → 8` sobre un
aporte, y con el bidireccional conservando su −12,5.

Y las fechas pendientes del job sumaron una tercera tabla, por el mismo motivo
que la decisión #77: un día con sólo transferencias también se cierra.

## Dónde se digitan

Dentro de **Balance Diario**, en un bloque propio al final. Es donde el workbook
las tiene y donde el analista ya está; son cinco filas más, no un desvío a otra
pantalla. Pero en su propio bloque rotulado y no mezcladas entre los 111: no
son clientes, y la pantalla lo dice.

## Queda pendiente

1. **Ya no hay bloqueante conocido para retirar el Excel.** Lo que queda es de
   otra naturaleza: edición de usuarios en la pantalla del superadmin, los
   subtotales que la decisión #60 dejó abiertos, y el módulo de Mantenimiento.
2. Por qué `C45` del workbook **excluye** `C37` (ENTREGA ICO MORÓN) de su total
   sigue sin explicación. SICOG lo suma, que es lo coherente con el resto.
3. La pantalla no se abrió en un navegador: compila y sirve `200`.
