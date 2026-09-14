# 2026-09-14 (7) — Las tarjetas del balance, y la rebanada que hacía falta para calcularlas

El owner abrió las pantallas, dijo que lo hecho se ve bien, y pidió dos cosas:
las otras rebanadas de Despacho, y unas tarjetas arriba de la grilla con el
volumen manejado, el recibido, el entregado y si el sistema está empacado o
desempacado. Decisión #62.

## Las dos cosas resultaron ser la misma

Esas tarjetas son el reporte **Balance Nación** del §11, que estaba
especificado desde hacía tiempo —el DTO ya tenía `recibidoMmpced`,
`transportadoMmpced`, `variacionMmpced` y `condicion`— pero no construido. Y no
se podía construir, porque `recibido` sale de las lecturas de fuentes, que era
justo una de las rebanadas que faltaban. Pedido y pendiente eran el mismo
camino.

## Una pregunta abierta que contestó el Excel en vez del área

El §11.5 dejaba anotado que no estaba confirmado qué muestra el balance cuando
la variación es exactamente 0, ni si había un umbral de tolerancia en vez de un
corte en cero. En vez de preguntar, se leyó la fórmula del workbook real
(`EJECUTIVO PUNTUAL!G14`):

```
=IF(F14>0,"EMPAQUE","DESEMPAQUE")     con  F14 = D14 - E14
```

Corte estricto en cero, sin tolerancia, y el cero exacto cae en `DESEMPAQUE` por
la rama else. Los dos valores del tipo son exhaustivos. Queda anotado que eso
último sale de cómo está escrita la fórmula y no parece una decisión pensada:
vale confirmarlo, pero mientras tanto el sistema replica el Excel.

El `.xlsm` se leyó descomprimiéndolo como zip y mirando el XML de la hoja, sin
agregarle la dependencia `xlsx` al proyecto sólo para esta consulta.

## Lo que sí hubo que preguntar

Qué entra en cada término no estaba en ningún lado, y un número mal calculado en
una tarjeta es peor que no mostrarla. El owner confirmó: `recibido` son las
fuentes, `transportado` son los clientes, y **la quema nacional no entra en
ninguno de los dos** — sale del sistema, pero no se le entrega a nadie.

También descartó la tarjeta de "volumen total manejado": sería la misma cifra
que `recibido`, así que duplicarla era ruido. Quedaron cuatro tarjetas.

## Lo construido

- **Rebanada `LECTURA_FUENTE` completa** (Repository → Service → Controller →
  rutas) y su pantalla. Sin selector de corte, porque el modelo guarda una
  lectura por fuente y por día. Y **sin carry-forward**: el job de cierre no
  toca las fuentes, así que corregir una no se propaga a los días siguientes
  como sí pasa en balance (decisión #45).
- **`GET /reportes/balance-nacion`**, query-calculado. Usa `aggregate` de Prisma
  y no `$queryRaw`, apartándose de la nota del §11.3: son dos sumas simples
  sobre una tabla cada una, y el `$queryRaw` parametrizado se reserva para los
  reportes que sí agrupan y cruzan.
- **Las cuatro tarjetas** arriba de Balance Diario, que se recalculan solas al
  tocar cualquiera de las dos grillas.
- La celda editable de volumen se sacó a un componente común en vez de
  duplicarla para fuentes.

## Verificado

Contra la base real: la grilla de las 31 fuentes, crear y corregir una lectura
con su historial, y el balance moviéndose con los datos — 100 recibido contra 60
entregado da EMPAQUE, contra 140 da DESEMPAQUE, y con los dos en 100 da la
variación exactamente 0, que cae en DESEMPAQUE como manda la fórmula. Se
borraron las filas de prueba; la cuenta real no se tocó.

**Sin verificar en navegador**, como siempre en estas sesiones.

## Queda pendiente de Despacho

`QUEMA_NACIONAL`, `NOVEDAD_OPERATIVA`, `CONTACTO`, los endpoints de catálogos y
el reporte de Consumo por Sectores. Y editar usuarios desde la pantalla, que
sigue del pendiente anterior.
