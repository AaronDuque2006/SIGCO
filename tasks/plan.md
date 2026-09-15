# Plan — Endpoints faltantes de Despacho, 2 decimales y carga de valores

Artefacto de trabajo, no fuente de verdad. Lo confirmado se muda a
`CONTEXTO_PROYECTO.md` (§6 decisiones, §9/§10 pendientes) y lo narrativo a
`bitacora/`. Se borra cuando `todo.md` queda sin casillas abiertas.

Punto de partida: commit `769f887`, árbol limpio.

---

## 1. Por qué no se pueden cargar valores hoy (causa raíz confirmada)

**No es un bug de la grilla. Es que no existe ningún usuario que pueda editar
Despacho.**

La única cuenta de la base es `aaron`: superadmin, puesto `Analista`,
**departamento `(ninguno)`**, sin superintendencias. Verificado contra el
Postgres local.

La cadena completa:

| Capa | Qué pasa |
|---|---|
| `crear-superadmin.ts:72` | crea la cuenta con `departamentoId: null` — decisión #21, el superadmin no pertenece a ningún departamento |
| `auth.service.ts:54` | `departamentosQueEdita` = `[]` (no es Gerente, no tiene departamento, no cubre nada) |
| `despacho/page.tsx:46` | `puedeEditar = false` |
| `celda-volumen.tsx:37` | `if (!editable)` → pinta un `<span>`, **no un `<input>`** |
| `despacho.routes.ts:23` | y aun saltándose la UI, `soloDespacho` responde `403` |

O sea: **el sistema está funcionando como se decidió** (#21 + #22: se consulta
cualquier departamento, se edita sólo el propio). Lo que falta es una cuenta
operativa de Despacho — el superadmin administra usuarios, no digita gas.

Hay **dos defectos reales** alrededor de esto, y son de UI, no de regla:

1. **La pantalla no dice por qué no se puede escribir.** Las celdas quedan de
   sólo lectura en silencio. Quien lo ve concluye, razonablemente, que la
   funcionalidad no está hecha. Falta un aviso explícito de modo consulta.
2. **La grilla vacía en modo consulta es indistinguible de una grilla rota**:
   111 filas con `—` y ninguna pista.

### Lo que NO voy a hacer sin que lo confirmes

Darle al superadmin permiso de editar Despacho. Contradice las decisiones #21 y
#22 y borra la separación entre administrar el sistema y operarlo. La salida
correcta es crear usuarios de Despacho desde `/usuarios`, que ya está hecho.

---

## 2. Estado de los contratos: ya están escritos

Nada de esto requiere diseñar contrato nuevo. Está todo en
`packages/shared-validators/src/despacho.ts` y `packages/shared-types/src/despacho.ts`,
y las rutas están tabuladas en `CONTEXTO_PROYECTO.md` §11.2.

| Recurso | Validadores zod | DTOs | Repo/Service/Controller | Pantalla |
|---|---|---|---|---|
| `lecturas-balance` | ✅ | ✅ | ✅ | ✅ |
| `lecturas-fuente` | ✅ | ✅ | ✅ | ✅ |
| `reportes/balance-nacion` | ✅ | ✅ | ✅ | ✅ (tarjetas) |
| `sistemas` / `regiones` / `sectores-cliente` | ✅ | ✅ | ❌ | ❌ |
| `clientes` | ✅ | ✅ | ❌ | ❌ |
| `fuentes` | ✅ | ✅ | ❌ | ❌ |
| `quema-nacional` | ✅ | ✅ | ❌ | ❌ |
| `novedades` | ✅ | ✅ | ❌ | ❌ |
| `contactos` | ✅ | ✅ | ❌ | ❌ |
| `reportes/consumo-por-sectores` | ✅ | ✅ | ❌ | ❌ |

El trabajo es implementación siguiendo el patrón ya establecido por
`lectura-fuente` (Repository → Service → Controller → ruta), que es la plantilla
más corta y más nueva: 145 + 107 + 34 líneas.

---

## 3. Grafo de dependencias

```
Fase 0 ── desbloquear digitación ──┐
         (usuario + aviso + 2 dec) │   independiente de todo lo demás
                                   │
Fase 1 ── catálogos + clientes + fuentes (API) ──┐
         sistemas, regiones, sectores            │  las pantallas de
         CRUD de clientes y fuentes              │  novedades y contactos
                                                 │  necesitan estas listas
                                                 │  para sus desplegables
         ┌───────────────────────────────────────┘
         │
         ├── Fase 2 ── quema-nacional (API + pantalla)   [sólo depende de Fase 0]
         ├── Fase 3 ── novedades (API + pantalla)        [depende de Fase 1]
         ├── Fase 4 ── contactos (API + pantalla)        [depende de Fase 1]
         └── Fase 5 ── consumo-por-sectores (API + pantalla)  [depende de Fase 1]
```

Las fases 2 a 5 son independientes entre sí. La 2 no espera a la 1: la quema
nacional es una sola cifra por día, no referencia clientes ni fuentes.

Cada fase es una **rebanada vertical**: base → repositorio → servicio →
controlador → ruta → hook → pantalla → entrada de menú, verificada de punta a
punta contra la base real antes de pasar a la siguiente. Nada de "primero todos
los repositorios, después todos los servicios".

---

## 4. Decisiones que necesito que confirmes antes de empezar

### 4.1 Los 2 decimales: ¿sólo al mostrar, o también al guardar?

Dijiste 2 decimales. Hay dos formas y no son la misma:

- **(A) Sólo al mostrar** — `formatearVolumen` pasa de `min 2 / max 4` a
  `min 2 / max 2`. La columna sigue siendo `Decimal(14,4)` y el job de cierre
  sigue promediando con 4 posiciones. Ves `497,42` y la base guarda `497,4167`.
- **(B) También al guardar** — la columna pasa a `Decimal(14,2)`, con migración.
  El promedio del cierre pierde precisión: `(480+500+512,25)/3` deja de ser
  `497,4167` y pasa a `497,42`, y el error se acumula.

**Recomiendo (A).** Es lo que hace el Excel: la celda muestra 2 decimales y
guarda la división completa. (B) es irreversible y degrada el cierre diario.

### 4.2 `tipo` de novedad: hoy es texto libre

`NOVEDAD_OPERATIVA.tipo` es un `String` simple y su lista cerrada sigue abierta
(§9.2 #4): el único valor conocido es "Corrida de Pig". Para no inventarme un
catálogo, la pantalla llevaría un campo de texto con sugerencias de los valores
ya usados (`<datalist>`). Cuando el área cierre la lista, se migra a catálogo
editable igual que Actividades y Telemetría. **¿Vale así, o preferís esperar a
tener la lista antes de construir la pantalla?**

### 4.3 Borrado de novedades

§11.5 lo deja abierto: no hay endpoint de borrado y el modelo no tiene `activo`.
Si un analista carga una novedad mal, hoy sólo puede corregirla. **¿Alcanza con
corregir, o hace falta borrar?** Por ahora no construyo borrado.

---

## 5. Fases

### Fase 0 — Desbloquear la digitación · 2 decimales

Lo más chico que convierte "no se puede cargar nada" en "se puede cargar".

1. Crear un usuario de Despacho de prueba vía la API (no tocar `aaron`), y
   verificar que con esa cuenta las celdas se vuelven editables y el `POST`
   entra. Los usuarios reales los creás vos desde `/usuarios`.
2. Aviso de modo consulta en Balance Diario y Fuentes: cuando
   `puedeEditar === false`, una franja que diga de qué departamento es la cuenta
   y que por eso la grilla es de sólo lectura.
3. `formatearVolumen` a 2 decimales fijos (opción A de §4.1).
4. De paso, el `eslint` roto: `react-hooks/set-state-in-effect` en
   `celda-volumen.tsx:34`. Es el único error del lint y lo deja en verde.

**Verificación**: iniciar sesión con la cuenta de Despacho en el navegador,
escribir un volumen, recargar y ver que quedó; entrar con `aaron` y ver la
franja de consulta. `pnpm --filter web run lint` en verde. Borrar el usuario de
prueba al terminar.

**CHECKPOINT** — que el owner cargue un valor real antes de seguir.

---

### Fase 1 — Catálogos, clientes y fuentes (API)

Sin pantalla propia: son las listas que consumen las fases siguientes. La grilla
de Balance Diario hoy arma su desplegable de sistemas desde las filas cargadas
justamente porque este endpoint no existe (comentario en `despacho/page.tsx:25`);
esa parte no se toca — la decisión #60 dice que se filtra en el navegador.

- `GET /sistemas`, `GET /regiones`, `GET /sectores-cliente` — sin paginar.
- `POST /sectores-cliente`, `PATCH /sectores-cliente/:id` — Supervisor+ de
  Despacho (decisión #31), soft-delete con `{ activo: false }`, sin DELETE.
- `GET/POST/PATCH /clientes` y `/clientes/:id` — paginado, filtros
  `sistemaId`/`regionId`/`sectorId`/`q`.
- `GET/POST/PATCH /fuentes` y `/fuentes/:id` — paginado, filtros `sistemaId`/`q`.

Hace falta un `requireSupervisor`-equivalente para `sectores-cliente`: hoy sólo
existen `requireDepartamento` y `requireSuperadmin`. Es la única pieza de
autorización nueva de todo el plan.

**Verificación**: cada ruta contra la base real — los 7 sistemas, las 4 regiones,
los 7 sectores, los 111 clientes paginados y filtrados, las 31 fuentes. Un
`POST` de cliente duplicado devuelve `409`. Un `PATCH` de sector como Analista
devuelve `403` y deja fila en `LOG_INTENTO_NO_AUTORIZADO`. Limpiar las filas de
prueba.

**CHECKPOINT**

---

### Fase 2 — Quema nacional (API + pantalla)

Una sola cifra por fecha y corte. Mismo trato que `LECTURA_BALANCE`
(decisión #14): el `POST` **sólo crea `PUNTUAL`** —`createQuemaNacionalSchema`
no acepta `tipoCorte`—, el `PATCH` escribe historial en la misma transacción, y
el `CIERRE_PROMEDIO` lo calcula el job de medianoche.

- `GET /quema-nacional?fecha&tipoCorte`, `POST`, `PATCH /:id`,
  `GET /:id/historial` (paginado).
- Pantalla `/despacho/quema`: la cifra del día, editable con la misma mecánica
  de `CeldaVolumen`, más el historial de correcciones del día visible.
- Entrada en `VISTAS` del menú lateral.

Ojo: el job de cierre diario ya contempla la quema (`(12+18)/2 → 15` está
verificado en §11.4), así que esto no toca el scheduler.

**Verificación**: cargar la quema del día, corregirla dos veces, ver las dos
filas de historial, correr el job y ver el `CIERRE_PROMEDIO` calculado.

**CHECKPOINT**

---

### Fase 3 — Novedades operativas (API + pantalla)

- `GET /novedades` paginado con filtros `desde`/`hasta`/`clienteId`/`fuenteId`;
  `POST`, `GET /:id`, `PATCH /:id`. El `PATCH` **no** deja cambiar el origen
  (cliente ↔ fuente) — `updateNovedadSchema` ya lo omite. Sin DELETE (§4.3).
- El "exactamente uno de cliente/fuente" ya está en zod y como `CHECK` en la
  base (migración `20260910150000`); el borde falla con mensaje útil.
- Pantalla `/despacho/novedades`: lista paginada con filtro de fechas y
  formulario de alta. El origen es un selector cliente/fuente que cambia el
  desplegable (de ahí la dependencia con la Fase 1). `tipo` según §4.2.
- Entrada en `VISTAS`.

**Verificación**: alta con cliente, alta con fuente, alta con los dos → `422` con
el mensaje de exactamente-uno, alta con `fin` anterior a `inicio` → `422`,
filtro por rango de fechas.

**CHECKPOINT**

---

### Fase 4 — Contactos (API + pantalla)

El único recurso con borrado físico: es un directorio telefónico, no dato
operativo histórico.

- `GET /contactos` paginado, `POST`, `PATCH /:id`, `DELETE /:id`.
- Pantalla `/despacho/contactos`: directorio buscable, alta, edición en línea y
  borrado con confirmación.
- Entrada en `VISTAS`.

**Verificación**: alta, edición, borrado, y que el borrado sea físico (la fila
desaparece de la base).

**CHECKPOINT**

---

### Fase 5 — Reporte de consumo por sectores (API + pantalla)

- `GET /reportes/consumo-por-sectores?fecha&tipoCorte` — query-calculado
  (decisión #37), `$queryRaw` parametrizado dentro del Repository, igual que
  Balance Nación. Devuelve totales por sector y por región.
- Pantalla `/despacho/reportes/consumo`: las dos tablas, sector y región, con
  el porcentaje sobre el total.
- Entrada en `VISTAS`.

**Verificación**: los totales del reporte cuadran con la suma de la grilla de
Balance Diario del mismo día y corte.

**CHECKPOINT final** — actualizar `CONTEXTO_PROYECTO.md` §9/§10 y escribir la
entrada de `bitacora/`.

---

## 6. Riesgos

- **El `65vh` de las grillas** (pendiente de la entrada del 2026-09-15) se
  hereda en cada pantalla nueva. Si hay que cambiarlo, ahora se cambia en un
  solo lugar (`TablaDesplazable`); conviene decidirlo antes de la Fase 5.
- **Las fases 3 y 4 introducen formularios**, que hasta ahora sólo existían en
  login, cambio de contraseña y alta de usuario. Vale mirar cómo resolvió esos
  la pantalla de `/usuarios` antes de inventar un patrón nuevo.
- **`novedades` y `contactos` son las primeras listas realmente paginadas** del
  frontend. Balance Diario y Fuentes traen el día entero a propósito
  (decisión #60); acá no aplica y hace falta control de paginación.
