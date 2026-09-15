# 2026-09-15 (5) — El historial que nadie podía ver, el sector, y la celda muda

Tres pedidos del owner en un mismo mensaje, que resultaron ser tres cosas de
naturaleza distinta.

## "¿En qué parte se verían los cambios hechos en los valores?"

En ninguna. Los endpoints existían y funcionaban —`GET
/lecturas-balance/:id/historial` y su gemelo de fuentes— y **ninguna pantalla
los usaba**. La decisión #3 hace obligatorio el historial precisamente porque
cualquier analista puede corregir cualquier registro: se guardaba quién cambió
qué y cuándo, y no había forma de mirarlo.

Se eligió **por fila** y no una pantalla de auditoría del día. Contesta la
pregunta donde aparece —estás viendo un número que no cuadra y querés saber
quién lo tocó— y usa lo que ya existe. Una vista del día completo necesita un
endpoint nuevo y, sobre todo, saber quién la usaría y con qué filtros; eso no
está confirmado y construirla ahora sería adivinar el flujo de trabajo.

Hicieron falta dos cosas para que sirviera de verdad:

- **`correcciones` en la fila de la grilla.** El indicador aparece **sólo** en
  las filas corregidas; en las 111 sería ruido. Va en la fila y no en
  `LecturaBalanceDto` porque ese DTO también lo devuelven el `POST` y el
  `PATCH`, que tendrían que contar en cada escritura para llenarlo; la grilla ya
  hace una consulta por día y el conteo viaja con ella.
- **`usuarioNombre` en `HistorialEntryDto`.** Devolvía `usuarioId: 29`, que no
  le dice nada a quien mira, y "quién tocó esto" es justo lo que el historial
  contesta. Arregló de paso la pantalla de quema, que tenía el mismo problema.

El historial se pide **al desplegar la fila**, no al cargar la grilla: pedir
111 historiales para algo que casi nunca se mira sería una tormenta de
peticiones.

## Los 7 sistemas del Manual DAO, que sólo se ven 4

No es un error: el desplegable se arma con los sistemas **presentes en las
filas** (decisión #60), y sólo 4 de los 7 tienen clientes.

| Sistema | Clientes | Fuentes |
|---|---|---|
| Anaco - Caracas - Barquisimeto - Río Seco | 46 | 2 |
| Anaco - José - Puerto La Cruz - Sinorgas | 26 | 5 |
| Anaco - Puerto Ordaz | 21 | 5 |
| Ulé - Amuay | 18 | 10 |
| Jusepín - Criogénico | **0** | 9 |
| La Toscana - San Vicente | **0** | **0** |
| Transcaribeño | **0** | **0** |

Se ofreció mostrar los 7 marcando los vacíos, y **el owner eligió dejarlo como
está**. Por consistencia el filtro de sector nuevo hace lo mismo, así que se
ven 6 de 7 — `Empresa Mixta` tiene 0 clientes desde la decisión #47.

Vale anotarlo para no confundirse después: **Jusepín - Criogénico aparece en el
desplegable de fuentes y no en el de clientes**, porque tiene 9 fuentes y
ningún cliente. Es el catálogo real, no un dato faltante.

## La celda que descartaba lo tecleado en silencio

El pedido fue "si no es un número no lo toma, sería bueno que lo indicara".
Resultó peor: `confirmar()` tenía **tres** salidas mudas —vaciar la celda, no
ser un número, y ser negativo—. Las tres dejaban el texto puesto y no hacían
nada, que digitando cien filas seguidas es **indistinguible de haber
guardado**.

La regla se sacó a `evaluarCelda(texto, valor)`, pura y fuera del componente:
es la que decide si un día se digita o se pierde, así que tiene que poder
ejercitarse sin navegador. **16 casos, 16 correctos** — coma decimal, espacios,
`1.2.3`, `Infinity`, el cero, el límite exacto de 4 decimales, y vaciar una
celda que tenía valor.

Se agregaron dos rechazos que son el mismo problema: el negativo (que se
adelanta al `422` del backend) y el **tope de 4 decimales**, porque la columna
es `Decimal(14,4)` y Postgres redondeaba de más sin decir nada.

## Queda pendiente

Nada de esto lo vio nadie en un navegador.
