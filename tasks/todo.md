# Tareas — Endpoints faltantes de Despacho

Detalle y justificación en [`plan.md`](./plan.md). Cada tarea se verifica contra
la base real antes de marcarse, y las filas de prueba se limpian al terminar.

## Confirmado por el owner (2026-09-15)

- [x] **§4.1** 2 decimales **sólo al mostrar**; la columna sigue en `Decimal(14,4)`
- [x] **§4.2** `tipo` de novedad: texto libre con sugerencias de los valores ya usados
- [x] **§4.3** Novedades sin borrado: alcanza con corregir
- [x] **§1** El superadmin **no** digita Despacho — se mantienen las decisiones #21 y #22

---

## Fase 0 — Desbloquear la digitación · 2 decimales

- [x] Usuario de prueba de Despacho: `departamentosQueEdita` trae `"Despacho"`,
      `POST` 201, repetido 409, `PATCH` 200 con su fila de historial.
      Cuenta sin departamento: `GET` 200 y `POST` 403 + fila en
      `LOG_INTENTO_NO_AUTORIZADO`. **Causa raíz confirmada.**
- [x] `AvisoSoloConsulta` en `/despacho` y `/despacho/fuentes`
      *Pendiente de mirada humana: nadie lo vio todavía en un navegador*
- [x] `formatearVolumen` → 2 decimales fijos; el input sigue con el valor crudo
      para no redondear un `CIERRE_PROMEDIO` al pasar por la celda
- [x] `react-hooks/set-state-in-effect` arreglado — `lint` en verde
- [x] Usuarios y filas de prueba borrados; queda sólo `aaron`, catálogos intactos
- [ ] **CHECKPOINT** — crear una cuenta de Despacho desde `/usuarios` y cargar un
      valor real

## Fase 1 — Catálogos, clientes y fuentes (API)

- [ ] `GET /sistemas`, `/regiones`, `/sectores-cliente` (sin paginar)
      *Verifica*: 7 sistemas, 4 regiones, 7 sectores
- [ ] `requireSupervisor` para `sectores-cliente` (decisión #31)
      *Verifica*: `PATCH` como Analista → `403` + fila en `LOG_INTENTO_NO_AUTORIZADO`
- [ ] `POST /sectores-cliente`, `PATCH /sectores-cliente/:id` (soft-delete, sin DELETE)
- [ ] `GET/POST/PATCH /clientes`, `/clientes/:id` — paginado, 4 filtros
      *Verifica*: 111 clientes; filtro por sistema y por `q`; duplicado → `409`
- [ ] `GET/POST/PATCH /fuentes`, `/fuentes/:id` — paginado, 2 filtros
      *Verifica*: 31 fuentes
- [ ] **CHECKPOINT**

## Fase 2 — Quema nacional (API + pantalla)

- [ ] Repository + Service + Controller + rutas (`GET`, `POST`, `PATCH`, historial)
      *Verifica*: `POST` sólo crea `PUNTUAL`; repetido → `409`
- [ ] `PATCH` con historial en una sola transacción
      *Verifica*: dos correcciones → dos filas de historial
- [ ] Pantalla `/despacho/quema` + entrada en `VISTAS`
      *Verifica*: cargar, corregir, ver el historial del día
- [ ] Correr el job de cierre y ver el `CIERRE_PROMEDIO`
- [ ] **CHECKPOINT**

## Fase 3 — Novedades operativas (API + pantalla)

- [ ] Repository + Service + Controller + rutas (sin DELETE)
      *Verifica*: cliente **y** fuente juntos → `422`; ninguno → `422`;
      `fin` < `inicio` → `422`
- [ ] `PATCH` que no deja mover el origen cliente ↔ fuente
- [ ] Pantalla `/despacho/novedades`: lista paginada, filtro de fechas, alta
      *Verifica*: alta con cliente y alta con fuente
- [ ] Entrada en `VISTAS`
- [ ] **CHECKPOINT**

## Fase 4 — Contactos (API + pantalla)

- [ ] Repository + Service + Controller + rutas (con DELETE físico)
      *Verifica*: la fila desaparece de la base
- [ ] Pantalla `/despacho/contactos`: directorio buscable, alta, edición, borrado
      con confirmación
- [ ] Entrada en `VISTAS`
- [ ] **CHECKPOINT**

## Fase 5 — Consumo por sectores (API + pantalla)

- [ ] `GET /reportes/consumo-por-sectores` con `$queryRaw` parametrizado
      *Verifica*: los totales cuadran con la grilla de Balance Diario del mismo
      día y corte
- [ ] Pantalla `/despacho/reportes/consumo` + entrada en `VISTAS`
- [ ] **CHECKPOINT final**

## Cierre

- [ ] `CONTEXTO_PROYECTO.md`: decisiones nuevas en §6, §9/§10 al día
      (§10 todavía dice "Estado al 2026-09-14")
- [ ] Entrada en `bitacora/`
- [ ] `pnpm --filter api run typecheck` y `pnpm --filter web run typecheck` en verde
