---
name: SICOG
description: Sala de control operacional de gas, en tema oscuro fijo, para guardias de doce horas.
colors:
  guardia-fondo: "#0a0f1a"
  guardia-superficie: "#101828"
  guardia-elevada: "#141f30"
  tinta: "#e7edf6"
  tinta-tenue: "#8492a8"
  tinta-sobre-acento: "#f8faff"
  azul-senal: "#3b82f6"
  azul-senal-profundo: "#1d4ed8"
  filete: "#22304a"
  estado-ok: "#34d399"
  estado-alerta: "#f2b84b"
  estado-critico: "#f2545b"
  serie-recibido: "#3b82f6"
  serie-transportado: "#d97706"
  sector-1-cian: "#0891b2"
  sector-2-rosa: "#e11d48"
  sector-3-ambar: "#d97706"
  sector-4-azul: "#3b82f6"
  sector-5-verde: "#059669"
  sector-6-purpura: "#9333ea"
  sector-7-magenta: "#be185d"
typography:
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.4"
    letterSpacing: "-0.01em"
  section:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.4"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.5"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1.3"
  numeric:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    fontFeature: "tabular-nums"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  full: "9999px"
spacing:
  celda-y: "0.375rem"
  control-x: "0.625rem"
  gap: "0.75rem"
  seccion: "1rem"
  bloque: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.azul-senal}"
    textColor: "{colors.tinta-sobre-acento}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  button-outline:
    backgroundColor: "{colors.guardia-elevada}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  button-destructive:
    backgroundColor: "{colors.estado-critico}"
    textColor: "{colors.estado-critico}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    rounded: "{rounded.lg}"
    padding: "0.25rem 0.625rem"
    height: "2rem"
  card:
    backgroundColor: "{colors.guardia-superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.lg}"
    padding: "1rem"
  celda-volumen:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    typography: "{typography.numeric}"
    rounded: "{rounded.md}"
    padding: "0.125rem 0.5rem"
    width: "7rem"
---

# Design System: SICOG

## Overview

**Creative North Star: "La Mesa de Guardia"**

El instrumento se subordina a la guardia. Alguien va a tener esta pantalla
encendida doce horas, de madrugada, tecleando ciento once volúmenes de corrido;
el sistema existe para que eso se pueda hacer sin cansar y sin equivocarse. Nada
compite con los números, nada parpadea sin motivo, nada pide atención que no se
ganó.

De ahí sale todo lo demás. El tema es oscuro y **fijo**, sin modo claro: no es
una preferencia estética sino la condición de una sala que no apaga la pantalla.
La densidad es alta —controles de 32px, celdas de seis píxeles de alto— porque
la altura de pantalla le pertenece a la grilla, no al respiro. El color es casi
inexistente: un solo azul con identidad, tres colores reservados para estado, y
el resto es tinta sobre tres tonos de azul-negro.

La anti-referencia confirmada es **el Excel que reemplaza**. Se sustituye el
workbook, no se lo imita en HTML: nada de rejillas de celdas por todas partes,
bordes en cada fila ni rellenos de color usados como semáforo. Lo que el Excel
hace por costumbre, acá se hace por decisión o no se hace.

**Key Characteristics:**

- Oscuro fijo, sin modo claro, por la sala de control
- Un único acento con identidad; el resto del color es estado
- Cifras siempre monoespaciadas y de ancho tabular
- Profundidad por tono y filete de un píxel, no por sombra
- Escala tipográfica corta: no existe un rol *display*
- Ningún rechazo silencioso: si el sistema descarta lo tecleado, lo dice

## Colors

Una paleta casi monocroma de azul-negro, con un solo color que carga identidad y
tres reservados para estado.

### Primary

- **Azul Señal** (`#3b82f6`): el único color con identidad del sistema. Marca lo
  accionable y lo enfocado — botón primario, anillo de foco, borde de campo
  activo — y en las gráficas es la serie *recibido* y el tono único de todas las
  barras. Aparece poco, y siempre quiere decir algo.
- **Azul Señal Profundo** (`#1d4ed8`): la versión asentada, para superficies de
  acento que no son el control principal.

### Secondary

- **Ámbar de Serie** (`#d97706`): existe por una sola razón — es la segunda serie
  del gráfico de línea, el *transportado*. Separa del Azul Señal ΔE 30,2 en
  protanopía y 28,7 en tritanopía sobre la superficie de tarjeta. **No es un
  color de interfaz**: fuera de las gráficas no se usa.

### Neutral

- **Guardia Nocturna** — la familia de tres superficies que nombra para qué
  existe: que una pantalla encendida de madrugada no queme la vista.
  - **Fondo** (`#0a0f1a`): el suelo de la página.
  - **Superficie** (`#101828`): tarjetas, menú lateral, encabezado de tabla.
  - **Elevada** (`#141f30`): lo que se apoya encima — popover, campo apagado,
    botón secundario.
- **Tinta** (`#e7edf6`): el texto principal. 15,08:1 contra la superficie.
- **Tinta Tenue** (`#8492a8`): rótulos, descripciones, metadatos. 5,63:1 contra
  la superficie, por encima de AA y verificado, no supuesto.
- **Filete** (`#22304a`): bordes y separadores, en **color plano**.

### Tertiary

Los siete tonos categóricos de la dona de sectores, en el orden exacto en que
fueron validados: cian `#0891b2`, rosa `#e11d48`, ámbar `#d97706`, azul
`#3b82f6`, verde `#059669`, púrpura `#9333ea`, magenta `#be185d`.

### Estado

Reservados, nunca reutilizables como serie ni como decoración: **Ok**
(`#34d399`), **Alerta** (`#f2b84b`), **Crítico** (`#f2545b`). Cada uno tiene su
variante translúcida al 12% para fondos de aviso.

### Named Rules

**La Regla del Único Acento.** El Azul Señal es el único color que significa
"identidad". Los tres de estado significan estado y nada más: un verde no puede
convertirse en "la serie 2" porque hacía falta un color.

**La Regla de la Paleta Validada.** Ninguna paleta de gráficas se elige a ojo. Se
valida con el script contra la superficie real (`#101828`), y **el orden de la
lista es parte del resultado**: verde y rosa quedan separados porque colisionan
en deuteranopía (ΔE 5,8), y lo mismo cian con verde. Reordenar la lista invalida
la comprobación. En un anillo, además, el último color toca al primero — ese par
se comprueba aparte, porque el validador trata la lista como lineal.

**La Regla del Filete Plano.** Los bordes van en color plano (`#22304a`), no en
blanco translúcido. Sobre un fondo tan oscuro, el translúcido que trae shadcn
por defecto casi no se ve.

## Typography

**Body Font:** Inter (con `system-ui`, `sans-serif`)
**Numeric Font:** Geist Mono (con `ui-monospace`, `monospace`)

**Character:** Neutral a propósito. La personalidad no vive en la letra sino en
la precisión: Inter no opina, y Geist Mono existe para que las columnas de
volúmenes se puedan comparar de un vistazo.

### Hierarchy

- **Title** (600, `1.25rem`, `tracking-tight`): el nombre de la vista, una vez
  por pantalla. Es el techo de la escala.
- **Section** (500, `0.875rem`): encabezado de bloque dentro de una vista.
- **Body** (400, `0.875rem`): el texto corrido, siempre en Tinta Tenue cuando es
  descripción y en Tinta cuando es contenido.
- **Label** (500, `0.75rem`, Tinta Tenue): rótulos de tarjeta, encabezados de
  columna, metadatos.
- **Numeric** (400, `0.875rem`, Geist Mono, `tabular-nums`): todo volumen, todo
  conteo, todo porcentaje.

### Named Rules

**La Regla de la Escala Corta.** **No existe un rol *display*.** El título de
vista es el techo, y de ahí al cuerpo hay un solo escalón. La jerarquía no puede
costar la altura de pantalla que necesitan las grillas. Si un título necesita
más peso, se lo da el semibold, no el tamaño.

**La Regla de la Cifra Monoespaciada.** Todo número que alguien vaya a comparar
contra otro en una columna va en Geist Mono con `tabular-nums`. Una tipografía
proporcional desalinea los dígitos y obliga a leer en vez de barrer.

**La Regla del Encabezado Único.** El encabezado de vista vive en un solo
componente (`EncabezadoVista`). La escala se desalineó una vez precisamente
porque cada pantalla escribía su propio `<h1>`; que viva en un lugar es la
regla, no un detalle de implementación.

## Layout

Contenedor centrado con tope de ancho —`max-w-6xl` en las vistas de Despacho,
`max-w-5xl` en el hub y en usuarios— sobre un `p-4` uniforme. Dentro, el ritmo
vertical es de tres pasos: `gap-3` entre controles hermanos, `mt-4` entre
bloques de una sección, `mt-6` antes de una tabla o de un resultado.

El menú lateral de dominio mide 14rem en escritorio y **deja de ser lateral por
debajo de `md`**: pasa a ser una fila que se desplaza en horizontal, porque un
panel fijo a la izquierda se comería el ancho que la grilla necesita.

Las barras de filtro son rejillas que colapsan por escalones declarados
(`sm:grid-cols-2 lg:grid-cols-3`, `lg:grid-cols-5` cuando hay cinco filtros), no
cálculos de porcentaje sobre flexbox.

La densidad es de cabina: controles de `2rem` (32px) de alto, `0.625rem` de
padding horizontal, celdas de tabla con `0.375rem` de padding vertical.

### Named Rules

**La Regla de la Grilla que Scrollea Sola.** La tabla es lo único que puede
desbordar, y scrollea dentro de sí misma en los dos ejes (`max-h-[65vh]`), con
el encabezado fijo. Lo de arriba —tarjetas de balance, filtros— se queda quieto
mientras se recorren cien filas. *El `65vh` sigue siendo un número elegido a ojo
y está pendiente de medirse contra el monitor real de la sala.*

## Elevation & Depth

**Estado actual, no doctrina.** El sistema es plano: la profundidad se construye
apilando tres tonos de la familia Guardia Nocturna (`#0a0f1a` → `#101828` →
`#141f30`) y separando con filetes de un píxel. La única sombra real del sistema
es la del tooltip de las gráficas (`shadow-lg`), y el encabezado fijo de tabla
usa una sombra **interior** que no es decorativa: con `border-collapse`, el borde
de una celda `sticky` no viaja con ella, así que la línea inferior tiene que
dibujarse como `inset`.

Esto no salió de una decisión consciente sino de ir construyendo, y **queda
abierto a revisión**. Lo que sí es invariante es la mecánica del encabezado
`sticky`: si alguien la cambia por un `border-b`, la línea desaparece al
scrollear.

## Shapes

Radio base `0.625rem` (10px), del que derivan `sm` (6px) y `md` (8px). La regla
de reparto es simple y se sigue en todas las pantallas:

- **`lg` (10px)** — todo control y todo contenedor: botón, campo, `select`,
  tarjeta, aviso, contenedor de tabla.
- **`md` (8px)** — controles diminutos embebidos en una fila, como la celda de
  volumen y el botón de historial.
- **`sm` (6px)** — la pista de las barras horizontales.
- **`full`** — sólo los puntos de leyenda de las gráficas.

Sin biselado, sin esquinas mixtas dentro de un mismo bloque, sin recorte. Los
extremos de las barras de datos llevan 4px de radio anclados a la línea base.

## Components

Los controles son **precisos y callados**: chicos, sin relleno de más, nítidos al
foco, y no celebran nada. Herramienta de trabajo.

### Buttons

- **Shape:** esquina suave (`0.625rem`), altura `2rem`, padding horizontal
  `0.625rem`, icono opcional a la izquierda a `14–16px`.
- **Primary:** Azul Señal sobre tinta casi blanca. Una sola acción primaria por
  pantalla; el resto son `outline` o `ghost`.
- **Outline:** la acción habitual — filete, fondo de superficie elevada al 30%.
- **Ghost:** la acción secundaria de una fila, cuando no debe competir en forma
  con la habitual.
- **Destructive:** fondo Crítico al 10–20% con texto Crítico. **Va en la
  confirmación, no en el disparador.**
- **Hover / Focus:** el foco marca borde `ring` más un anillo de 3px al 50%. Al
  presionar, el botón se hunde un píxel (`translate-y-px`).

### Inputs / Fields

- **Style:** fondo transparente, filete de un píxel, altura `2rem`, radio `lg`.
  La etiqueta va **encima**, nunca dentro como placeholder.
- **Focus:** el borde pasa a Azul Señal y aparece un anillo de 3px al 50%.
- **Error:** `aria-invalid` lleva el borde a Crítico con su anillo al 20%, y el
  mensaje va **debajo** del campo o al lado de la celda.
- **Disabled:** opacidad al 50% y fondo de campo, nunca sólo un gris de texto.

### Cards / Containers

- **Corner:** `0.625rem`. **Background:** Superficie (`#101828`). **Border:**
  filete de un píxel. **Padding:** `1rem`. **Sin sombra.**
- Se usan cuando la elevación comunica jerarquía real. Para agrupar sin
  jerarquía alcanza un `border-b` o el espacio.

### Navigation

Menú lateral de vistas, una entrada por vista, con icono a la izquierda y dos
líneas de texto: nombre en Section y descripción en Label. La activa se marca
con `aria-current="page"`, fondo elevado y filete; las demás sólo revelan el
filete al pasar por encima. **Una vista sin construir no es un control**: va
atenuada al 55% y fuera del recorrido del teclado.

### Celda de Volumen *(signature)*

El componente donde vive el trabajo real. Es un campo de `7rem` de ancho, en
cifra monoespaciada alineada a la derecha, que **guarda al salir del campo o con
Enter y descarta con Escape** — sin botón por fila, porque digitar el día son
cien clientes seguidos y un botón por fila obliga a sacar la mano del teclado
cien veces.

Acepta la coma decimal, porque es lo que la gente teclea acá. Cuando no se puede
editar no se apaga: se convierte en texto, y la pantalla explica aparte por qué.

### Gráficas *(signature)*

SVG escrito a mano, sin librería. Trazo de 2px, marcadores de 4px de radio con
anillo del color de la superficie donde las marcas se pisan, rejilla y ejes en
Tinta Tenue, y separación de 2px del color de superficie entre porciones
contiguas. Leyenda siempre presente cuando hay dos o más series, con nombre y
cifra: la identidad nunca queda sólo en el color.

### Named Rules

**La Regla del Rechazo Audible.** Si el sistema descarta lo que alguien tecleó,
lo dice. Un campo que se queda con texto inválido y no guarda nada es, desde el
teclado, indistinguible de uno que guardó. La celda de volumen rechaza con
motivo —no es un número, no puede ser negativo, máximo 4 decimales— y el aviso
desaparece apenas se empieza a corregir.

**La Regla del Peso Invertido.** En una confirmación destructiva, el estilo
marcado va en **confirmar** y el normal en **cancelar**. Quien llegó ahí puede
haber llegado de más: la salida tiene que ser la fácil, y la irreversible la que
se ve.

**La Regla del Icono con Trabajo.** Un icono se pone donde distingue algo que la
palabra sola no distingue rápido: la entrada de menú, la acción de fila, el
indicador de historial. No se ponen en estados vacíos, de carga, de error ni en
encabezados de sección. Todos van `aria-hidden`: la etiqueta de al lado ya lo
dice.

## Do's and Don'ts

### Do:

- **Do** poner toda cifra comparable en Geist Mono con `tabular-nums`.
- **Do** validar cualquier paleta de gráficas nueva con el script antes de usarla,
  y **respetar el orden** que pasó la comprobación.
- **Do** decir por qué una grilla quedó de sólo lectura. Cien filas con "—" y
  ningún aviso son indistinguibles de una pantalla rota.
- **Do** usar `min-h-[100dvh]` para alto completo, nunca `h-screen`.
- **Do** dar a cada pantalla sus tres estados: cargando, vacío y error. El estado
  de carga espera a que lleguen todas las consultas de la vista, para que el
  layout no salte tres veces.
- **Do** usar el rojo, el ámbar y el verde **sólo** para estado.

### Don't:

- **Don't** imitar el Excel: nada de rejilla de celdas por todas partes, borde en
  cada fila de una lista larga, ni relleno de color usado como semáforo.
- **Don't** agregar un rol tipográfico por encima del título de vista.
- **Don't** usar los tokens `--chart-2` a `--chart-5`. Existen en `globals.css`
  pero **ninguna gráfica los usa**: el verde (`#34d399`) y el ámbar (`#f2b84b`)
  quedaron fuera de la banda de luminosidad del modo oscuro. La paleta viva es la
  de `components/graficas.tsx`, y esa divergencia es deliberada.
- **Don't** meter una segunda familia de iconos. La del proyecto es Tabler, con
  trazo `1.75` en línea y `2` en marcas sueltas.
- **Don't** poner sombra decorativa. Si hace falta profundidad, se apila tono.
- **Don't** usar el borde translúcido de shadcn sobre estas superficies.
- **Don't** introducir un modo claro sin volver a discutir la decisión: el oscuro
  fijo responde a la sala de control, no a un gusto.
