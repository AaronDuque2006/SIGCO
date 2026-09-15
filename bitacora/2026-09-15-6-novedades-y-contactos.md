# 2026-09-15 (6) — Novedades y contactos: la guardia nocturna y el único DELETE

Fases 3 y 4, las dos últimas rebanadas de datos de Despacho.

## Novedades: el filtro de fechas casi sale mal

`inicio` es un **timestamp**, no un `@db.Date` como las lecturas. Filtrar
`desde`/`hasta` por medianoche UTC corría el corte cuatro horas: una novedad de
las 22:00 en Venezuela es `02:00 UTC del día siguiente` y aparecía en el día
equivocado. **Y la guardia nocturna es justo cuando pasan las cosas.**

La zona sale de `CIERRE_DIARIO_TZ`, la misma del job de cierre, y el desfase se
calcula con `Intl` en vez de cablear `-04:00`. Verificado con el caso exacto:
una novedad a las `2026-09-16T02:00Z` aparece bajo el **2026-09-15** y no bajo
el 16.

## Un hueco en la validación del PATCH

`updateNovedadSchema` es parcial, así que mandando **sólo** `fin` zod se queda
sin el `inicio` con el que compararlo y su `refine` no corre: editar el fin para
ponerlo antes del propio inicio **pasaba el borde**. Se valida en el Service
contra el estado resultante, igual que §13.2 hace con el departamento de un
usuario.

## El `tipo`, que sigue sin catálogo

La lista cerrada sigue abierta (§9.2 #4) y el único valor conocido es "Corrida
de Pig". En vez de inventar un catálogo, la pantalla ofrece **lo que el área ya
escribió**: `GET /novedades/tipos` devuelve los valores distintos y el campo es
libre con un `<datalist>`. Cuando la lista se cierre, se reemplaza por catálogo
editable como se hizo con Actividades y Telemetría.

Ojo con el orden: esa ruta va **antes** que `/novedades/:id`, que si no se la
traga — el mismo tropiezo que §13.1 documenta con `/usuarios/catalogos`.

## Contactos: el único borrado físico del módulo

Un teléfono viejo no es un dato operativo histórico que haya que conservar, es
ruido en una lista que se consulta con apuro. Nada cuelga de `CONTACTO`, así
que borrar no deja huérfanos.

En la pantalla **se confirma en la propia fila**, no con un `confirm()` del
navegador: el aviso vive en la fila que va a desaparecer y dice cuál es. Es la
única acción de Despacho que no se puede deshacer.

## Al contrato le faltaba una pieza

`listContactosQuerySchema` sólo tenía `clienteId` y `fuenteId`. **Un directorio
se busca, no se recorre.** Se agregó `q`, que mira el nombre del operador, el
teléfono —para la búsqueda inversa, "¿de quién es este número?"— y el nombre del
cliente o la fuente, que es como se lo piensa: se busca "el teléfono de
PEQUIVEN", no el de un operador por su apellido.

## Dos decisiones de pantalla que se repiten en las dos

- **Un solo desplegable de origen, no dos.** Filtrar por cliente *y* fuente a la
  vez no devolvería nada nunca, porque exactamente uno está lleno.
- **Al editar, el origen se muestra deshabilitado en vez de desaparecer.** No se
  puede mover —sería otro registro, no una corrección— pero quien edita tiene
  que seguir viendo de qué es la fila.

Novedades trajo además la **primera lista del frontend con paginación real** (20
por página; cambiar un filtro vuelve a la página 1) y el primer desplegable que
**recorre las páginas de `/clientes` hasta completar**: el listado pagina a 100
como máximo y hay 111.

## Queda pendiente

Ninguna de las dos pantallas se abrió en un navegador.
