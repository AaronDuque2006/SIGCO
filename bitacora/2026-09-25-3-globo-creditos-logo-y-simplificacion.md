# 2026-09-25 (3) — Globo, créditos, logo de PDVSA, inventario y una poda

Decisiones #111 a #116. Sesión larga de la tarde, casi toda de pedidos
cortos del owner revisados en el navegador, más una auditoría de
sobreingeniería al final.

## Preguntas que no cambiaron nada

- **¿El RAG usa LangChain?** No: está escrito a mano (fflate para los zip,
  `fetch` a Ollama, BM25 y pgvector en SQL). Se explicó por qué no se
  necesita —el límite de precisión es el modelo 7B leyendo tablas, no el
  pegamento— y el owner decidió **no cambiar nada**.
- **PDF en el asistente**: el owner lo pidió y quedó **pendiente**, porque
  todavía no tiene muestras reales. Lo que se sabe (digitales y escaneados,
  con planos) y el plan propuesto están en el pendiente #12 del §16.10.

## El globo del hub (#111)

Venezuela sobre una esfera inclinada en la esquina inferior derecha del hub,
con la red de los siete sistemas y un pulso de luz que sale de Anaco por
cada ruta — el mismo "gas fluyendo" del sello del login. Proyección
ortográfica calculada en el componente, sin dependencias, con el contorno del
sello pasado a longitud/latitud.

Tres correcciones del owner en el camino:

1. "El mapa más grande" — **lo entendí mal y agrandé el globo**. Lo que quería
   era el país: ahora se dibuja 1,6 veces sobre la misma esfera.
2. "Que gire muy lento" — primero giró todo (oscilando, para que el país no se
   saliera); aclaró que quería que girara **el fondo con el mapa quieto**; se
   hizo girar sólo los meridianos… y lo descartó: **el globo quedó quieto**.
3. Lo único que se mueve son los pulsos.

Extiende la #85: el hub no tiene cifras, así que admite movimiento; las
pantallas de trabajo siguen sin él.

## "Acerca de SICOG" (#112)

Última entrada del menú de Despacho y de Mantenimiento, la misma página en
los dos: sello, nombre completo, para qué sirve, versión y año, la mención de
que se elaboró durante las **pasantías del autor en la Gerencia de Control
Operacional de PDVSA Gas**, y los créditos con correo y teléfono del owner
(él eligió qué publicar). El subtítulo de la entrada del menú se quitó a su
pedido.

Dos cosas quedaron **a confirmar**: el owner escribió su segundo apellido
"Romeor" y se puso **"Romero"**, suponiendo un error de tipeo; y no quedó
claro si la versión ("0.1.0 · 2026") debía quedarse en la página.

## El logo de PDVSA Gas (#113) y la fuente de "SICOG" (#114)

El logo se pasó a SVG desde el EPS institucional (Ghostscript en modo seguro
+ `pdftocairo`) y se ubicó en el encabezado, el login, "Acerca de" y la
cabecera del PDF de Reportes. Empezó en rojo oficial en los lugares sin
cifras y en tinta tenue en el encabezado; **el owner lo cambió a la tinta de
los botones en toda la pantalla**: la tenue se leía como deshabilitado, y el
azul significa "se puede tocar". El rojo quedó sólo en el PDF, que se imprime
en blanco.

"SICOG" en el encabezado pasó a una fuente gruesa para que pegue con el logo.
Archivo negra y ancha **no le gustó**; se armó una página con diez opciones al
lado del logo y **eligió Rubik 800**. Se usa sólo en esa palabra.

## Mantenimiento: exportar por región, filtros y el inventario (#115, #116)

- **La bitácora de fallas exporta a Excel**: una hoja Resumen y una por cada
  una de las seis regiones (aunque quede vacía), con todas las páginas del
  filtro de la pantalla. `exportarExcel` pasó a apoyarse en
  `exportarLibroExcel`, que admite varias hojas. El botón terminó igual al de
  las vistas de Despacho (primero lo había inventado distinto — el owner lo
  notó).
- **Filtro de Región** en la bitácora y en Estaciones, que acota el de Área.
  Cuando lo agregué también cambié el Excel para que sacara sólo la región
  filtrada; **el owner lo pidió sólo para consultar** y el Excel volvió a
  como estaba.
- **Crear una estación no ofrecía el inventario de instrumentos**, aunque el
  `INVENTARIO ESTACIONES.xls` trae una columna de cantidad por cada uno de
  los 16 tipos. Ahora el alta los pide en el orden de esas columnas y los
  guarda **en la misma escritura anidada** que la estación; la edición del
  detalle suma el mismo bloque con el `PUT` que ya existía.

Al verificar el alta contra la base, mi primer script de prueba importó mal
el cliente de Prisma y **dejó una estación "ZZPRUEBA" sin borrar**; se borró a
mano (no tenía fallas) y la base volvió a 247 estaciones. También hubo que
forzar un reinicio del API: `tsx watch` no vigila el `dist/` de los contratos,
así que podía seguir corriendo con el esquema viejo, que habría descartado
los instrumentos en silencio.

## La poda (ponytail)

Una auditoría de sobreingeniería encontró seis recortes, aplicados uno por
commit: se fueron `@tanstack/react-table` (nunca se usó), `dotenv` y
`dotenv-cli` del API (ahora `tsx --env-file`, nativo de Node 22), 20 alias de
tipo sin uso en los validadores y `lib/utils.ts`; y quedó **un solo `hoy()`**
en `lib/fechas.ts`. Ese último corrigió un bug de paso: las dos copias de
Telemetría usaban `toISOString()`, que en Venezuela da el día siguiente desde
las 20:00.

Las interfaces de repositorio con una sola implementación **no se tocaron**:
son la arquitectura que fija `CLAUDE.md`, no un descuido.

Al probar el arranque del API con el `.env` nativo, **un `pkill` demasiado
amplio tiró el servidor de desarrollo del owner** (`dev.sh` baja los dos
procesos si muere uno). Se volvió a levantar y después, a su pedido, se cerró.

## Instalar sin internet

El owner quiere probar el sistema en máquinas **Windows sin internet**. Se
recomendó una **VM Linux (VirtualBox) preparada completa donde haya red** y
llevada como `.ova`: todo lo que se descarga al instalar (dependencias,
fuentes de `next/font`, motor de Prisma, Chromium de Puppeteer, la imagen de
Postgres) viaja adentro, y los binarios nativos no cambian de sistema
operativo. Instalarlo directo en Windows exigiría rehacer `node_modules` allá
y pgvector o Docker Desktop con WSL2, sin red.

Preguntó si era seguro preparar la VM en el wifi del despacho. Respuesta: la
VM **no está aislada mientras está conectada**; usar red NAT y no "puente",
no levantar los servicios conectado (el compose publica Postgres en 5432 con
`postgres/postgres`), token de GitHub de sólo lectura y borrado al terminar,
desconectar la red y tomar una instantánea — y consultar antes con la
gerencia de sistemas si se puede conectar una VM a la red de PDVSA.

## Queda pendiente

- **Instalación sin internet**: escribir `scripts/preparar-vm.sh` (el owner
  todavía no dijo que sí) y decidir si la prueba lleva el asistente, que
  necesita ~10 GB de RAM. Ver §10.
- Confirmar el apellido ("Romero" vs "Romeor") y si la versión queda en
  "Acerca de SICOG".
- `pnpm start` del API todavía **no carga el `.env`**; nunca se usó.
- `CONTEXTO_TEG.md` sigue diciendo que el frontend usa TanStack Table: es el
  documento del trabajo de grado y lo corrige el owner.
- Nada de esto está pusheado.
