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

- [x] Migración `20260915140000_nombres_unicos_catalogos` (decisión #66) — el
      schema no garantizaba nombres únicos y el plan prometía un 409 que no existía
- [x] `GET /sistemas` (7), `/regiones` (4), `/sectores-cliente` (7), sin paginar
- [x] `requireSupervisor` por id de puesto (decisión #67)
      *Verificado*: Analista → `403` "No es Supervisor ni superior"; Supervisor → `201`
- [x] `POST`/`PATCH /sectores-cliente` — duplicado `409`, soft-delete `activo:false`
- [x] `GET/POST/PATCH /clientes` — 111 en 6 páginas, `q=pequiven` insensible a
      mayúsculas, duplicado `409`, FK inexistente `404`, `PATCH` vacío `422`
- [x] `GET/POST/PATCH /fuentes` — 31 fuentes, mismos casos de error
- [x] Cuenta sin Despacho: `GET` `200`, los tres `POST` `403` + auditoría
- [x] Filas y usuarios de prueba borrados; base intacta (111/31/7/7/4)
- [ ] **CHECKPOINT**

## Fase 2 — Quema nacional (API + pantalla)

- [x] Repository + Service + Controller + rutas
      *Verificado*: día vacío → `quema: null` con `200` (no `404`); `POST` `201`;
      repetido `409`; negativo `422`; fecha inválida `422`; historial de id
      inexistente `404`
- [x] `PATCH` con historial en una sola transacción
      *Verificado*: 12 → 18 → 24 deja historial `[18, 12]`
- [x] Pantalla `/despacho/quema` + entrada en `VISTAS`
      *Pendiente de mirada humana: compila y sirve 200, nadie la abrió*
- [x] Job de cierre: `(12+18)/2 → CIERRE_PROMEDIO 15`, igual que §11.4
- [x] **Hallazgo**: el job sólo cierra la quema de días con lecturas de clientes
      (anotado en §11.5)
- [ ] **CHECKPOINT**

## Fase 3 — Novedades operativas (API + pantalla)

- [x] Repository + Service + Controller + rutas (sin DELETE)
      *Verificado*: los dos orígenes → `422`; ninguno → `422`; `fin` < `inicio`
      → `422`; id inexistente → `404`; sin Despacho `GET` `200` y `POST`/`PATCH`
      `403`
- [x] `PATCH` que no deja mover el origen, y que valida el rango contra el
      estado resultante (zod no puede: el schema es parcial)
- [x] Filtro de fechas por día de Venezuela
      *Verificado*: `2026-09-16T02:00Z` cae bajo el 2026-09-15
- [x] `GET /novedades/tipos` para el `<datalist>`, antes de `/:id` en el router
- [x] Pantalla `/despacho/novedades` + entrada en `VISTAS`
      *Pendiente de mirada humana: compila y sirve 200*
- [x] Filas y usuarios de prueba borrados
- [ ] **CHECKPOINT**

## Fase 4 — Contactos (API + pantalla)

- [x] Repository + Service + Controller + rutas (con DELETE físico)
      *Verificado*: `DELETE` `204`, volver a pedirlo `404`, borrarlo otra vez
      `404`; sin Despacho `403`
- [x] `q` agregado al contrato: busca operador, teléfono y nombre del origen
      *Verificado*: `q=pequiven`, `q=jose` y `q=9998877` encuentran cada uno el suyo
- [x] Pantalla `/despacho/contactos` + entrada en `VISTAS`, con confirmación
      en la fila antes de borrar
      *Pendiente de mirada humana: compila y sirve 200*
- [x] Filas y usuarios de prueba borrados
- [ ] **CHECKPOINT**

## Fase 5 — Consumo por sectores (API + pantalla)

- [x] `GET /reportes/consumo-por-sectores` con `$queryRaw` parametrizado
      *Verificado*: 100,5 total = las 6 lecturas del owner; + 12 de quema = 112,5
      de transportado en Balance Nación
- [x] `GET /reportes/serie-balance` (nuevo en el contrato) para el gráfico de línea
      *Verificado*: 7 días con los vacíos en cero; `dias=1` y `dias=91` → `422`
- [x] Balance Nación: la quema entra en el transportado (decisión #74)
- [x] Paleta validada con el script del skill `dataviz` — el ámbar y el verde del
      tema quedaban fuera de la banda de luminosidad en oscuro
- [x] Pantalla `/despacho/reportes` con 3 de las 4 gráficas + entrada en `VISTAS`
      *Pendiente de mirada humana: compila y sirve 200*
- [ ] **Cuarta gráfica** (por "SISTEMAS") — bloqueada: falta saber qué son esas
      9 categorías del workbook
- [ ] **CHECKPOINT final**

## Cierre

- [ ] `CONTEXTO_PROYECTO.md`: decisiones nuevas en §6, §9/§10 al día
      (§10 todavía dice "Estado al 2026-09-14")
- [ ] Entrada en `bitacora/`
- [ ] `pnpm --filter api run typecheck` y `pnpm --filter web run typecheck` en verde
