# 2026-09-16 (2) — El cierre mira las dos tablas, pero el arrastre sigue mirando una

El owner dio el visto bueno para arreglar el hueco del job que había quedado
anotado en §11.5: la quema de un día sin lecturas de clientes nunca recibía su
`CIERRE_PROMEDIO`.

## El arreglo, y la trampa que tiene al lado

Lo obvio era hacer que las fechas pendientes salieran de la unión de
`LECTURA_BALANCE` y `QUEMA_NACIONAL`. Eso es correcto — pero el job usa **dos**
consultas sobre la misma tabla, y sólo una debía cambiar:

| Consulta | Pregunta que responde | ¿Cambia? |
|---|---|---|
| `fechasConPuntualHasta` → `fechasConDatosHasta` | qué días hay que cerrar | **sí**, ahora la unión |
| `ultimaFechaConPuntual` | desde dónde hay que arrastrar | **no**, sólo clientes |

La segunda es el ancla del carry-forward (decisión #43), que copia lecturas *de
clientes* al día siguiente. Si una quema suelta adelantara esa fecha, la cadena
arrancaría después y **los días intermedios se quedarían sin sus copias**.

Ejemplo concreto: última lectura de cliente el 10, quema suelta el 14, hoy el
16. Con la unión el ancla sería el 14 y los días 11 al 14 nunca recibirían las
lecturas arrastradas. Una regresión silenciosa: nadie ve un error, simplemente
faltan filas.

Queda dicho en el comentario de las dos funciones, porque leerlas juntas invita
a "unificarlas".

## Un detalle de reporte que se veía raro

`cerrarDia` devolvía sus contadores sólo de las lecturas de clientes, así que un
día que **sólo** tenía quema se cerraba de verdad pero salía del resumen como si
no hubiera pasado nada: el log decía `diasCerrados: []`. Ahora `cerrarQuema`
devuelve qué hizo y su conteo suma al del día.

## Verificación

Contra la base real, sobre fechas de agosto que no chocan con los datos del
owner:

- **Caso del arreglo**: día con sólo quema (12, con un 18 en historial) →
  `diasCerrados: ['2026-08-02']` y `CIERRE_PROMEDIO 15`. Antes no cerraba.
- **Idempotencia**: segunda corrida → `diasCerrados: []`, sin filas de historial
  nuevas.
- **La regresión, descartada explícitamente**: con una quema suelta en una fecha
  posterior a la última lectura de clientes, `ultimaFechaConPuntual` no se
  movió. La otra consulta sí la ve.

Un susto en el camino: al contar las lecturas aparecieron 18 donde había
contado 6. No era contaminación — son las 6 del owner, más sus 6
`CIERRE_PROMEDIO` y 6 de carry-forward al día siguiente, que escribió el job al
arrancar la API. El sistema haciendo su trabajo.

## Queda pendiente

1. Las 9 categorías de la cuarta gráfica: el owner cree que son como regiones,
   va a preguntar.
2. La skill de UI.
