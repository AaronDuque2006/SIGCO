# 2026-09-14 (8) — El menú lateral, y la cáscara que dejó de repetirse

El owner abrió las pantallas nuevas, dijo que están decentes, y pidió una cosa:
como el sistema es un tablero, las vistas de Despacho deberían vivir en un menú
lateral en vez de estar colgadas de enlaces sueltos en cada encabezado.
Decisión #63.

## Dos menús, dos preguntas distintas

Lo que importa de esta estructura, y por lo que no se hizo un solo menú global:
el hub contesta **en qué dominio estoy** (decisión #59) y el menú lateral
contesta **qué miro dentro de él**. Mezclarlos borraría la distinción que la
decisión #22 hace entre consultar cualquier departamento y editar el propio —
un menú único con las vistas de los cuatro dominios sugeriría que todas están al
mismo alcance, cuando no lo están.

## El efecto secundario que valió más que el pedido

Poner el menú obligó a mover la cáscara —guardia de sesión, encabezado, menú— a
`app/despacho/layout.tsx`. Hasta ahora cada pantalla repetía las tres cosas y se
colgaba sus propios enlaces de navegación, que había que acordarse de actualizar
en las dos al agregar una tercera.

Ahora agregar una vista es agregar una fila a `VISTAS` y su `page.tsx`. De paso
las dos pantallas existentes quedaron bastante más cortas: sólo su contenido.

## Detalles que no son cosméticos

- **El orden del menú es el del trabajo diario**, no alfabético: primero lo
  entregado a clientes, después lo recibido de las fuentes, y al final el
  resultado.
- **En pantalla angosta el menú deja de ser lateral** y pasa a ser una fila que
  se desplaza. Un panel fijo a la izquierda se comería el ancho que la grilla
  necesita, que es lo que esas pantallas vinieron a mostrar.
- **La vista de reportes se muestra atenuada y fuera del recorrido del teclado**,
  igual que los dominios sin construir del hub: no existe todavía, así que no es
  un control y no se anuncia como accionable.

## Queda pendiente

1. **La vista de reportes y gráficas**, que es el tercer punto del menú y no
   existe. Falta definir con el owner qué significa exactamente: qué se grafica,
   y si "generación de reportes" incluye exportar a un archivo o es sólo verlos
   en pantalla. También hay que elegir librería de gráficos, que el proyecto
   todavía no tiene.
2. Resto de Despacho: `QUEMA_NACIONAL`, `NOVEDAD_OPERATIVA`, `CONTACTO`, los
   endpoints de catálogos y el reporte de Consumo por Sectores.
3. Editar usuarios desde la pantalla.
