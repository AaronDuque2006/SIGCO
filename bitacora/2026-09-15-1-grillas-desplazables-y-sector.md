# 2026-09-15 (1) — Las grillas scrollean solas, y aparece el sector

El owner abrió las pantallas y pidió dos cosas concretas: que la grilla de
clientes muestre el **sector económico**, y que la tabla tenga **su propio
scroll** para que las métricas de arriba se vean siempre. Decisión #64.

## El sector ya estaba

No hubo que tocar el backend ni el contrato: `ClienteDto` ya trae `sector`, y
el repositorio ya lo seleccionaba junto con región y sistema. Sólo faltaba
pintar la columna. Los 111 clientes tienen sector asignado —36 "Otros", 31
"Eléctrico", 20 "Petrolero", 13 "Siderúrgico", 6 "Petroquímico", 5 "Cemento"—;
"Empresa Mixta" está en el catálogo pero todavía sin clientes.

La grilla de fuentes **no** lleva sector, y no es un olvido: `FUENTE` no tiene
esa columna. El sector es una propiedad de quien consume el gas, no del punto
que lo entrega.

## El scroll, y la sombra que reemplaza al borde

El contenedor de la tabla pasó a `max-h-[65vh] overflow-auto`, así que scrollea
en los dos ejes y las tarjetas de balance y los filtros quedan quietos arriba.
El encabezado es `sticky top-0`, porque una tabla de 111 filas sin encabezado
fijo obliga a subir para recordar qué columna es cuál.

Ahí apareció un detalle que vale anotar para no "arreglarlo" después: la línea
bajo el encabezado es una sombra interior y no un `border-b`. Con
`border-collapse`, el borde de una celda `sticky` no viaja con ella — se queda
dibujado en su posición original y desaparece apenas se scrollea.

## Una cáscara compartida en vez de copiar y pegar

Al llevar lo mismo a fuentes, la parte con truco iba a quedar duplicada. Se
extrajo a `components/tabla-desplazable.tsx` (`TablaDesplazable` más la clase
`TH`), siguiendo el precedente que ya existía con `CeldaVolumen`, que también
es común a las dos grillas. Las explicaciones quedan en un solo lugar, y las
tablas que faltan —quema, novedades, contactos, reportes— arrancan con esto
resuelto.

## Queda pendiente

1. **`65vh` es un número elegido a ojo.** Funciona en un monitor de escritorio;
   habría que mirarlo en la pantalla real de la sala de control.
2. `eslint` falla con `react-hooks/set-state-in-effect` en `celda-volumen.tsx`.
   Es previo a este trabajo y no se tocó acá, pero está pendiente.
