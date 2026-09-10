# 2026-09-10 — De Supabase a Docker, seed real completo, y el primer módulo de la API

Sesión larga. Se pasó de "hay un `schema.prisma` escrito pero nada corriendo"
a "hay base de datos migrada y sembrada con los catálogos reales, y el primer
módulo de la API funcionando end to end". En el camino aparecieron 14
decisiones nuevas (#35 a #48), varias de ellas corrigiendo decisiones que ya
estaban dadas por cerradas.

## Lo que se hizo

### 1. Correcciones al modelo antes de migrar

- **Decisión #35**: se quitaron los campos `estado`/`estadoAnt` de
  `LecturaBalance`/`LecturaFuente` y sus historiales. No existían en ninguna
  hoja real del Excel — eran una suposición previa sin evidencia.
- **Decisión #36**: `CLIENTE.tipo_sector` dejó de ser un `String` libre y pasó
  a ser el catálogo editable `SECTOR_CLIENTE`, al descubrir que tiene una lista
  real de valores de negocio (los 6 sectores económicos + Empresa Mixta).
- **Decisión #37**: el reporte "Consumo por Sectores" quedó confirmado en el
  alcance de Despacho, como query-calculado (igual que "Balance Nación").

### 2. Dos pendientes viejos cerrados leyendo fórmulas, no valores

La técnica que destrabó los dos: abrir el `.xlsm` leyendo **las fórmulas
activas**, no sólo los valores mostrados.

- **Decisión #38** — "Quema Puntual" vs "Quema TyD": resultaron ser **el mismo
  dato**. `EJECUTIVO PUNTUAL!G31` y `PROMEDIO!G49` apuntan ambas a
  `=FUENTES!I29`, la celda justo debajo de la etiqueta "QUEMA PUNTUAL". La
  duda venía de que aparecen con nombres distintos en hojas distintas.
- **Decisión #39** — granularidad de `FUENTE`: el catálogo real es mucho más
  fino de lo asumido (plantas por tren, Jusepín, y 15 fuentes de "Directo a
  Ventas"/"Gas manejado desde El Tablazo"). Corrige la afirmación
  "consistente, sin gaps" que la sección 5 traía de una auditoría anterior.

### 3. Se abandonó Supabase (decisión #40)

Esto costó varias vueltas y vale la pena dejar el diagnóstico escrito:

1. El host directo de Supabase (`db.<ref>.supabase.co`) resuelve **sólo a
   IPv6**, y la red de desarrollo no tiene salida IPv6.
2. Se cambió al Session Pooler, que sí resuelve IPv4 — y siguió fallando.
3. El `nc` al puerto decía "succeeded", pero mandar el primer paquete del
   protocolo Postgres no obtenía respuesta nunca. **La causa era una VPN
   activa en la máquina**: dejaba pasar el handshake TCP y descartaba el
   tráfico de la aplicación. Falló igual por WiFi y por datos móviles, que fue
   lo que finalmente descartó al ISP y apuntó a algo local.
4. Con la VPN apagada conectó — y apareció el último obstáculo: Supabase
   preinstala 4 extensiones (`pgcrypto`, `uuid-ossp`, `pg_stat_statements`,
   `supabase_vault`) en un esquema que `prisma migrate reset` no toca, así que
   el drift en la primera migración reaparecía sin solución limpia.

Ante eso el owner decidió cortar por lo sano: **Postgres local en Docker**
(`pgvector/pgvector:pg16`), que además acerca desarrollo al patrón de
producción (contenedor propio) en vez de depender de un servicio gestionado.

### 4. Migraciones y seed

- Migración inicial `20260910144045_init` aplicada.
- Migración `20260910150000_check_exactamente_uno` con los `CHECK` de
  "exactamente uno de cliente/fuente" que Prisma no sabe declarar (§9.4 #7,
  pendiente desde el diseño original).
- Seed de catálogos: regiones, `SECTOR_CLIENTE`, departamentos, puestos,
  `ESTADO_TELEMETRIA` y el catálogo de Actividades de Mantenimiento, todo
  sacado de los archivos fuente reales con los typos corregidos.

### 5. El catálogo `SISTEMA` estaba mal: son 7, no 9 (decisión #16 corregida)

El owner lo señaló y aportó el **`Manual DAO.pptx`** ("Guía de Información
Sistemas de Transporte de Gas 2023"). El manual confirma 7 sistemas, e
incluye uno que no estaba contemplado: **Jusepín - Criogénico**. Los 9
nombres anteriores mezclaban agrupaciones de reporte del Excel con el
catálogo oficial de sistemas de transporte, que es otra cosa.

Con la nomenclatura de estaciones del manual se resolvió además el
`sistema_id` de casi todas las fuentes (decisión #41), sin adivinar.

### 6. Contrato de la API de Despacho (sección 11 del contexto)

Diseñado contract-first con la skill `api-and-interface-design`: schemas zod
de entrada en `packages/shared-validators`, DTOs de salida en
`packages/shared-types`, formato único de error, y decisiones explícitas sobre
representación en el cable (BigInt como string, Decimal como number, fechas
`YYYY-MM-DD` sin zona).

Dos reglas de negocio quedaron **imposibles de violar desde el borde**: el
`POST` de lecturas no acepta `tipoCorte` (sólo el job escribe cierres), y
novedades/contactos exigen exactamente uno de cliente/fuente, espejando el
`CHECK` de la base.

Sobre paginación hubo un desacuerdo productivo: el owner pidió paginar la
grilla diaria; se argumentó que para digitar un día completo la paginación es
la herramienta equivocada (rompe los subtotales y el flujo) y que lo correcto
es filtrar por sistema, como ya hace el Excel. Se terminó implementando
**ambas**: filtros como mecanismo principal y paginación opcional, para no
encerrar al frontend.

### 7. Primer módulo: `LECTURA_BALANCE` end to end

Repository → Service → Controller → rutas, con Prisma confinado al
repositorio. Verificado con **28 checks contra la API y la BD reales**
(401/403/404/409/422, el constraint único, el orden del historial, round-trip
de fechas sin corrimiento de zona).

Esa verificación encontró un bug que el typecheck jamás habría visto:
`apps/api` no cargaba el `.env` de la raíz, así que la API se negaba a
arrancar. El fail-closed de `env.ts` hizo exactamente su trabajo.

### 8. Job de cierre diario (decisiones #42 a #45)

Corre a las 00:05 en la zona operativa **y al arrancar el proceso**, y cada
corrida reconcilia todos los días pendientes en vez de sólo ayer — así una
caída a medianoche no deja un día sin cerrar para siempre. Es idempotente y
la recuperación se corta a 31 días avisando por log, en vez de rellenar meses
de valores inventados en silencio.

Escribirlo obligó a decidir dos reglas que ninguna decisión previa cubría:

- **#44**: una corrección tardía **recalcula** el cierre ya emitido, y el
  recálculo queda auditado en el historial del propio cierre.
- **#45**: esa corrección además **se arrastra** a los días siguientes que
  sigan siendo copias intactas del carry-forward, y se detiene en el primero
  que un analista fijó a mano. Sin esto, un valor equivocado quedaba propagado
  en silencio por toda la cadena heredada.

La #45 apareció porque un test falló: la aserción que se había escrito
asumía una regla que nadie había confirmado. Se preguntó en vez de "arreglar"
el test para que pasara.

### 9. Los clientes reales (decisiones #46 a #48)

- **111 clientes** cargados, con **región y sector sacados de las fórmulas**
  de "Consumo por Sectores" — que referencian celda por celda a cada cliente —
  en vez de inferirlos por el nombre. 94 de las 111 filas vienen así.
- **Decisión #47**: las Empresas Mixtas resultaron ser **`FUENTE` y `CLIENTE`
  a la vez**, corrigiendo la decisión #20. La evidencia fue numérica: Petro
  Monagas *aporta* 60.61 pero *consume* 12. El manual lo confirma — la slide
  27 se titula "Puntos De Recepción De Gas — FUENTES QUE APORTAN GAS AL
  SISTEMA" y las lista.
- **Decisión #48**: las presiones de estaciones **quedan fuera del alcance**.
  Al buscar las celdas exactas para responder una pregunta del owner se
  descubrió que no se digitan: son 11 celdas alimentadas por el complemento de
  **AspenTech InfoPlus.21** vía `ATGetTimeVal`. Y como los analistas ya las
  miran directo del SCADA, replicarlas no aporta nada. De paso corrigió un
  matiz de la sección 1 del contexto, que afirmaba que la carga es 100%
  manual.

## Cosas que se corrigieron sobre la marcha

- Se dijo "117 clientes" y se usó ese número para argumentar sobre
  paginación. Estaba mal contado: incluía subtotales. El número real es 111.
- Se afirmó que las presiones "estaban vacías ese día". Falso: eran fórmulas
  de InfoPlus21 que no se podían evaluar sin el complemento.
- El seed no era ampliable (se saltaba un catálogo entero si ya tenía filas).
  Se hizo aditivo. Al hacerlo apareció que el Excel trae **homónimos
  legítimos** (`ALCASA` en dos regiones, una bolsa `OTROS` por sistema), así
  que la clave de comparación no puede ser sólo el nombre.

## Queda pendiente

- **Endpoint de login**: hoy sólo existe la *verificación* de JWT
  (`requireAuth`) y el RBAC contra la BD. Falta lo que emite los tokens, el
  refresh contra `SESION_REFRESH` y el bloqueo de cuenta. Mientras tanto, para
  probar hay que firmar tokens a mano. **Es lo próximo.**
- **Resto de las rebanadas de Despacho**: `LECTURA_FUENTE`, `QUEMA_NACIONAL`,
  `NOVEDAD_OPERATIVA`, `CONTACTO` y los dos reportes. El contrato ya está
  escrito (sección 11), falta implementarlos.
- **Contrato y API de Mantenimiento y Actividades.**
- **`ESTADO_TELEMETRIA`**: dos valores se infirieron por simetría porque el
  reporte fuente sólo lista estaciones con problemas. Revisar con el
  Supervisor de Mantenimiento (§9.4 #9).
- **Nombre del 7º sistema**: el manual se contradice entre "Transcaribeño"
  (índice) y "Transoceánico" (diapositivas). Se sembró como Transcaribeño.
- **Sector `Empresa Mixta`** quedó con 0 clientes tras la decisión #47;
  corresponde desactivarlo si no se le encuentra uso.
- **Aportes y transferencias entre sistemas** (`APORTE A EYP`,
  `TRANSFERENCIA ICO-NURGAS`) quedaron fuera del catálogo `CLIENTE` por
  decisión, pero no se decidió si el sistema necesita modelarlos de otra forma.
- **Prototipo visual** y **Dominios C/D** siguen igual que antes: sin tocar y
  sin diseñar, respectivamente.

Ver `CONTEXTO_PROYECTO.md` §9, §10 y §11 para el detalle vigente — esta
entrada es el relato de la sesión, no la lista maestra.
