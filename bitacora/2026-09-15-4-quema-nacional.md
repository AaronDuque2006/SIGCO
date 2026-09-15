# 2026-09-15 (4) — Quema nacional, y un hueco del job de cierre

Fase 2: una sola cifra por fecha y corte, con su pantalla. El job de cierre ya
la contemplaba desde antes (§11.4), así que no hubo que tocar el scheduler.

## La forma de la respuesta

`GET /quema-nacional` **no responde `404` para un día vacío**: devuelve
`QuemaNacionalDiaDto` con `quema: null`, el mismo envoltorio que ya usa
`FilaBalanceDiarioDto` con su `lectura`. Un `404` obligaría a la pantalla a
tratar un error como el estado normal de la mañana.

## Una regla que estuve a punto de inventar

Escribí un `403` para impedir corregir un `CIERRE_PROMEDIO`, razonando que el
job lo iba a pisar igual en la próxima corrida. Al revisar
`lectura-balance.service.ts` resultó que **el balance sí lo permite** — la
decisión #60 lo dice explícitamente y la pantalla lo refleja. El §11.2 pide
"mismo trato que `LECTURA_BALANCE`", así que estaba inventando una regla más
estricta para esta tabla. Se sacó.

Lo que sí **no** hay acá es propagación a los días siguientes: el carry-forward
de las decisiones #43 y #45 es de las lecturas por cliente, y la quema nacional
es un dato aislado de su día.

## El hallazgo: el job no cierra la quema de días sin clientes

`cerrarQuema(fecha)` se llama únicamente desde `cerrarDia(fecha)`, y las fechas
pendientes salen de `LECTURA_BALANCE` (`fechasConPuntualHasta`). **Un día con
quema digitada pero sin ninguna lectura de cliente nunca recibe su
`CIERRE_PROMEDIO`.**

Verificado en la práctica: con la quema cargada y sin lecturas, el job devolvió
`diasCerrados: []`; al agregar una lectura de cliente, cerró y calculó
`(12+18)/2 → 15`, que es la aritmética que §11.4 ya documentaba.

En operación normal no muerde —todo día operativo tiene lecturas— pero **queda
abierto** si las fechas pendientes deberían salir de la unión de ambas tablas.
Se anotó en §11.5 en vez de cambiarlo, porque toca el contrato del job, que ya
está cerrado.

## La pantalla

Sin tabla ni filtros de sistema: lo único que se elige es el día y el corte. El
historial de correcciones **sí se muestra**, a diferencia de las grillas — ahí
quedaría escondido porque serían cien historiales, acá es una sola cifra y su
recorrido cabe al lado, que es justo lo que se quiere ver cuando el número
cambió tres veces en la mañana.

## Queda pendiente

Nadie abrió la pantalla en un navegador.
