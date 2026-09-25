# 2026-09-25 (2) — El logo y el nombre completo del sistema

Decisiones #109 y #110. Sesión corta y muy iterativa: el owner trajo el sello
del área y lo fue ajustando sobre lo que veía.

## De la imagen al SVG

El owner trajo una imagen del sello "Despacho Central de Gas / Supervisión y
Control de Gas" y pidió algo similar en SVG para el sistema. Se le hicieron
dos preguntas antes de dibujar: el texto del anillo (eligió el nombre del
sistema, porque SICOG cubre los cuatro departamentos) y dónde se usa (eligió
sello completo en el login y una versión chica para encabezado y pestaña).

El contorno de Venezuela salió de coordenadas aproximadas de costa y fronteras,
proyectadas al dibujo. La primera versión chica, con dos líneas bajo la llama,
se leía como una fogata a 20 px; la red pasó a salir hacia los costados, como
en el sello original.

## Lo que pidió el owner en cada vuelta

1. **Los colores de la aplicación** en lugar del naranja: todo pasó a tokens
   del tema, así que el logo cambia solo con claro/oscuro.
2. **Animación en las líneas**: primero fueron líneas punteadas en movimiento;
   el owner pidió **pulsos**, así que quedó un punto de luz con halo que sale
   del nodo central por cada línea y sigue por el tramo exterior, con el nodo
   latiendo.
3. **Mapa más grande**, y después **centrado**: al agrandarlo chocaba con los
   aros, porque se había centrado por su rectángulo y no por su forma. Ahora el
   tamaño se calcula para que ningún punto del contorno pase de r=159.
4. **"SICOG" más adentro**, **sin el título repetido** debajo del sello en el
   login, y **la llama animada** (parpadea desde la base).
5. **La Guayana Esequiba** en el mapa.

La animación vive sólo en el login: la marca del encabezado queda quieta,
porque está en pantalla toda la guardia y `DESIGN.md` pide que nada se mueva
sin motivo. Todo se apaga con `prefers-reduced-motion`.

## El nombre completo (#109)

El owner aclaró que el nombre es **"Sistema de Información para la Gerencia de
Control Operacional de Gas"**; la decisión #33 decía "Sistema de Control
Operacional de Gas". La sigla no cambia (SI + COG). En el sello no entra
legible: de tres opciones, el owner eligió "Gerencia de Control Operacional de
Gas" para el arco de abajo, que es lo que la sigla no dice. El nombre completo
va en los textos accesibles, la descripción de la app, el pie del PDF y los
documentos.

## Queda pendiente

- `.impeccable/design.json` (el sidecar de `DESIGN.md`) no se regeneró: el hook
  de diseño avisa que quedó más viejo que `DESIGN.md`. Se actualiza con
  `/impeccable document` cuando se quiera.
