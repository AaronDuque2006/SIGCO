# 2026-09-17 (3) — Actividades: la auditoría contra la premisa

Arranca el módulo grande. No se escribió una línea de API: la sesión se fue en
auditar el workbook real y en descubrir que el contexto del proyecto describía
mal el archivo en dos puntos.

## El bloqueante que nadie había visto

`GERENCIA_REQUIRIENTE` estaba sembrada en **cero filas**, y
`ActividadRegistro.gerenciaRequirienteId` es un FK **obligatorio**. Es decir que
el modelo estaba cerrado y migrado desde hacía semanas, y con la base tal como
estaba **no se podía registrar ni una sola actividad**. El schema compilaba, las
migraciones aplicaban, y el módulo era inutilizable.

Aparece sólo al mirar la base, no al leer el schema.

## Lo que el workbook dijo, y que no era lo que el contexto decía

La §5 describía `ACTIVIDADES MDC FINAL V4.xls` como "bitácora + plan/real + %
derivados". Los "% derivados" **no son de cumplimiento**: no hay una sola
división en las hojas de plan. Los únicos porcentajes que existen son de
*participación sobre el total del mes*, y encima esa hoja **no está enlazada** —
los números están tecleados a mano y lista 12 actividades contra 32 de la hoja
de plan. Es una tercera lista que alguien mantiene aparte y que puede discrepar
de las otras dos sin que nadie se entere.

También quedó corregido que `hh` es el **total de horas-hombre de la fila**, no
por persona: no existe ninguna columna de cantidad de gente en ninguna hoja, así
que el dato ya viene colapsado en origen. El modelo no pierde nada, pero tampoco
va a poder reconstruir personas × horas si algún día se pide.

Y `cantidad` son **repeticiones de la misma actividad**, no unidades del
producto. Lo dice el encabezado del propio Excel.

## Dos reglas que nadie habría adivinado

**La actividad se imputa al mes en que terminó.** La columna `MES` difiere del
mes de `DESDE` en 2 de 176 filas, y en las dos coincide con el de `HASTA`
(31/01→02/02 se imputa a febrero). O sea que el REAL agrupa por `fechaHasta`.
Agrupar por `fechaDesde` habría dado números distintos de los que el área
maneja, y el error habría aparecido recién cuando alguien cuadrara un informe.

**El estatus no filtra el REAL.** Las filas `EN PROCESO` suman igual que las
`FINALIZADO`: el REAL mide esfuerzo incurrido, no trabajo terminado.

Las dos salieron de leer fórmulas, no valores. Es la tercera vez en este
proyecto que esa regla cambia una decisión.

## La respuesta del owner destrabó el catálogo de estatus

Preguntado quién puede registrar, el owner contestó: **todos menos los
analistas; a ellos su supervisor les asigna las tareas**. Y confirmó que el
analista después *completa* lo suyo — mueve el estatus y carga las horas.

Eso le dio sentido a algo que llevaba meses en el ERD sin tenerlo: el catálogo
`RECIBIDO → EN PROCESO → FINALIZADO` de la decisión #29. **`RECIBIDO` no aparece
ni una vez en el trimestre auditado**, y ahora se entiende por qué: el Excel no
tiene flujo de asignación, así que nadie lo usaba. En SICOG es el estado de una
tarea asignada y todavía no empezada.

El Ingeniero quedó del lado de los que registran libremente aunque la decisión
#23 lo ponga en el mismo nivel que el Analista: la regla apunta al **puesto**,
no al rango, así que no reabre esa decisión.

## Un número que yo mismo di mal

Le dije al owner "32 productos" y él aprobó sembrar los 32. La hoja tiene 32
**filas**, pero sólo **25 productos distintos**: siete son repeticiones dentro
de la propia hoja. Corregido en el §14 antes de sembrar.

De los 25 se sembraron 24: se descartó la segunda variante de `GUARDIA`, que es
el mismo texto con 29 espacios consecutivos en lugar de la barra separadora.

## Y el bug que explicaba por qué el catálogo estaba corto

`seedInsumoProductoServicio` **cortaba temprano** si ya existía un insumo. No era
que la primera lectura hubiera fallado: re-correr el seed nunca traía nada
nuevo, así que cualquier ampliación futura se iba a perder igual. Ahora es
aditivo como el resto del seed, y se verificó corriéndolo dos veces seguidas.

## Estado al cierre

| | antes | ahora |
|---|---|---|
| Insumos | 9 | 10 |
| Productos/servicio | 18 | 24 |
| Gerencias requirientes | **0** | 16 |

Más el contrato completo en la §14 y los schemas/DTOs compilando.
`ProductoServicio.descripcionActividad` dejó de estar sin usar.

## Queda pendiente

- **La API**: no existe `apps/api/src/modules/actividades/`. Repository →
  Service → Controller para catálogos, `/registros` y `/metas`, más los dos
  reportes del §14.4.
- **Las pantallas**, detrás del card de Mantenimiento del hub.
- **Cómo se carga el plan anual** (grilla entera contra celda por celda): el
  owner lo dejó para cuando se vea la pantalla, y el contrato expone los dos
  endpoints para no forzarlo antes.
- **Los dos huecos del §14.7**, que son cambios a un modelo cerrado y se
  proponen antes de tocarlos: `ACTIVIDAD_REGISTRO` **no tiene tabla de
  historial** —corregir horas no deja rastro, y esas horas alimentan
  indicadores— y **no se guarda quién asignó** una tarea, porque el modelo tiene
  un solo `usuarioId` que es el responsable.
- Los otros tres departamentos siguen sin catálogo, y no hay planilla de donde
  sacarlo: se cargan desde el ABM cuando cada Supervisor los tenga.
