# 2026-09-15 (7) — Los reportes, leyendo las gráficas del workbook

El owner pidió "lo más importante": los reportes y las gráficas, y señaló las
hojas `EJECUTIVO PUNTUAL` y `PROMEDIO` del workbook real. Se abrió el `.xlsm`
descomprimiéndolo y leyendo `xl/charts/*.xml` contra `xl/worksheets/*`.

## Ocho gráficas que son cuatro

Cada hoja tiene cuatro, y son **las mismas**, cambiando sólo el corte. En SICOG
van una sola vez con el selector de corte arriba, igual que Balance Diario.

| # | Tipo en el Excel | Qué muestra | Celdas |
|---|---|---|---|
| 1 | Línea | Recibido vs transportado, 7 días + promedio | `B89:D96` |
| 2 | Dona | Consumo por sectores | `A48:F49` |
| 3 | Barras 3D | Entregado por región | `J31:K34` ← `L52:L74` |
| 4 | Barras 3D | Entregado por "SISTEMAS" | `A36:C44` |

Dos ya estaban contratadas: la #2 es `ConsumoPorSectoresDto.nacional` y la #3 es
`porRegion[].totalMmpced`, del `/reportes/consumo-por-sectores` de §11.2. El
desglose `L52:L74` del Excel calza exacto con `porRegion[].sectores`.

## Lo que cambió una decisión cerrada

`E14` (TRANSPORTADO) `= C45 = SUM(C36,C38,C39,C40,C41,C42,C43,C44) + G49`, y
`G49 = FUENTES!I29`, rotulado **"QUEMA PUNTUAL"**. O sea, el workbook **sí suma
la quema** al transportado. La decisión #62, confirmada hace un día, decía lo
contrario.

Como hoy `G49` vale 0, en la práctica nadie lo habría notado hasta que se
cargara quema de verdad. El owner confirmó que manda el Excel: es la decisión
#74, y `BalanceNacionDto` gana `quemaMmpced` para poder desglosarlo.

La quema **no** entra en el consumo por sectores: en el workbook `QUEMA TYD`
vive en `G48/G49`, pegada al bloque pero **fuera del rango de la gráfica**. No
es consumo de ningún sector.

## Tres detalles que el Excel enseña y conviene respetar

- **Son 6 sectores, no 7.** `Empresa Mixta` no aparece, coherente con tener 0
  clientes desde la decisión #47.
- **El desglose por región es disperso, no una matriz.** CENTRO lista 3
  sectores y CEN-OCC lista 6. Rellenar con ceros inventaría filas que el área
  no ve.
- **El total nacional por sector es la suma del desglose regional**
  (`A49 = L52+L63+L70`). Se calcula igual acá, para que los dos números no
  puedan discrepar.

## El gráfico de línea se teclea a mano en el Excel

`B89:D95` no tiene fórmulas: cada día alguien copia el recibido y el
transportado a esa tabla. Acá se calcula de lo guardado, con
`GET /reportes/serie-balance?hasta&dias&tipoCorte` — nuevo en el contrato.
`dias` por defecto 7, la ventana del workbook; mínimo 2 y tope 90.

Los días sin datos **vienen en cero y no se omiten**: saltarlos haría que dos
puntos separados por una semana se vieran contiguos.

## Las gráficas, con la skill `dataviz`

Se escribieron en **SVG a mano, sin librería**. Son tres formas simples y un
paquete de gráficos costaría más memoria que escribirlas, en una máquina que ya
viene justa; además el SVG hereda los tokens del tema sin puente de
configuración.

**La paleta se validó con el script, no a ojo.** Azul `#3b82f6` y ámbar
`#d97706` separan ΔE 30,2 en protanopía y 28,7 en tritanopía sobre la
superficie `#101828`. Hallazgo: el ámbar del tema (`--chart-3`, `#f2b84b`) y el
verde (`--chart-2`, `#34d399`) **quedaban fuera de la banda de luminosidad** del
modo oscuro — demasiado claros sobre fondo oscuro. Se usó el ámbar oscurecido.

**Barras horizontales en vez de la dona y del 3D.** En una dona hay que comparar
ángulos, y el 3D distorsiona la altura con la perspectiva. Van ordenadas por
magnitud con el porcentaje como rótulo. El dato es idéntico: **si el área
prefiere la dona porque es lo que reconoce, es cambiar una función**.

Un solo tono para las barras: el largo ya codifica la magnitud, y pintarlas de
colores distintos sugeriría una identidad que no existe. Las dos series de la
línea sí son categóricas y llevan leyenda siempre.

## Queda pendiente

1. **La cuarta gráfica no se construyó.** Sus 9 categorías no son el catálogo
   `SISTEMA`: ANACO- CCS/BQTO, ENTREGA ICO(MORÓN), ANACO- JOSE/PTO. CRUZ,
   ANACO- PTO. ORDAZ, ENTREGAS DIRECTAS ORI., NOR ORIENTAL, COSTA OESTE, COSTA
   ESTE y ULE AMUAY. Sólo cuatro coinciden con un sistema sembrado; las otras
   salen de sumar bloques de filas de `CEN-ORI`. **Falta que el área explique
   qué agrupación es ésa.**
2. Relacionado: **`C45` excluye `C37` (ENTREGA ICO MORÓN)** del total entregado
   aunque la fila esté en la lista. Sin explicación conocida.
3. La pantalla no se abrió en un navegador.
