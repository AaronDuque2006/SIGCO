# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This directory (`SICOG`) is the home of the real monorepo for **SICOG** (Sistema de Control Operacional de Gas), a system for PDVSA Gas's Gerencia de Control Operacional. The full accumulated design context (business rules, confirmed decisions, ERD, stack, open items) lives in `CONTEXTO_PROYECTO.md` in this same directory — **read it before doing any design or implementation work**, since it is long and encodes many already-settled decisions that must not be silently re-litigated. The narrative session-by-session history lives in `bitacora/`.

**What exists today** (see `CONTEXTO_PROYECTO.md` §9/§10 for the authoritative state):

- Monorepo scaffolded and installing cleanly; local Postgres via `docker compose up -d` (`pgvector/pgvector:pg16`, database `ctrl_operacional_gas`).
- `packages/db`: full `schema.prisma` for the closed domains, seven migrations (all applied), and a seed with the real catalogs — 7 systems, 31 sources, 111 clients, regions, sectors, departments, positions, telemetry states, and Mantenimiento's activity catalog (10 insumos, 24 products, 16 requesting gerencias). The seed is **additive and idempotent**: re-running it inserts only what is missing. One caveat worth knowing: `seedInsumoProductoServicio` used to bail out early if any insumo existed, which is why that catalog silently stayed short for weeks — it is additive now, like the rest.
- `packages/shared-validators` (zod inputs) and `packages/shared-types` (output DTOs) hold the **API contracts** — Despacho in `CONTEXTO_PROYECTO.md` §11, `auth` in §12, user management in §13, Actividades in §14.
- `apps/api`: the full `auth` module (login, rotating refresh with reuse detection, logout, current session, rate limiting, audit logging — see §12), user management (§13), and **the whole Despacho domain** (§11): `LECTURA_BALANCE`, `LECTURA_FUENTE`, `QUEMA_NACIONAL`, `NOVEDAD_OPERATIVA`, `CONTACTO`, the transfers out of the system (decision #79), the catalog endpoints and the `clientes`/`fuentes` ABM, the `consumo-por-sectores` and `serie-balance` reports, a PDF export of the report (`GET /reportes/pdf`, decision #96 — Puppeteer, so `apps/api` now needs Chromium available; not yet accounted for in a deployment Dockerfile), and the daily closing job. `LECTURA_BALANCE`, `LECTURA_FUENTE`, and `QUEMA_NACIONAL` also carry an optional real-world `horaLectura` (decision #90), and both the vigente value and any historial row can be edited in place with an `editadoPor`/`editadoEn` trace — this **widens decision #3** (the historial is no longer strictly immutable; decisions #94/#95). RBAC is resolved against the database on every request, never against the token (`requireDepartamento`, `requireSuperadmin`, `requireSupervisor` — decision #67). All of it is **verified end to end against the real database**.
- `apps/web`: ten screens — `/login`, `/cambiar-password`, `/` (the four-domain hub, decision #59), `/usuarios` (#61, with the edit form of #80) and the six Despacho views behind their side menu (#63): Balance Diario (#60), Lecturas de fuentes (#62), Quema nacional (#68), Novedades (#72), Contactos (#73) and Reportes y gráficas (#75, with the workbook's four charts — the "Recibido vs transportado" one changed on 2026-09-22 from a multi-day line to a single-day bar, hidden entirely in PUNTUAL, decision #97). The visual identity is the prototype's control-room palette loaded as shadcn tokens; **dark is the default and a light theme exists** since decision #81, chosen per browser and persisted in `localStorage`. Balance Diario, Lecturas de fuentes and Quema nacional edit volumen+hora in a single per-row form (decision #91, after trying and discarding a popover) and their historial is a grid with an editable value and a variación arrow on the vigente row in Balance Diario (decisions #92/#93/#94/#95). Reportes has a server-rendered PDF export via a dedicated `/imprimir/reportes` print route (decision #96; the PDVSA letterhead template is still pending from the owner). Balance Diario and Lecturas de fuentes also export their grid to `.xlsx` client-side with `xlsx`/SheetJS, chosen over CSV because real names carry accents/ñ (decision #99). The header shows a home icon next to "SICOG" only while inside a department (`/despacho` or `/mantenimiento`), linking to the hub. **The owner reviewed every view in a real browser** — the ten screens on 2026-09-16, and the transfers block plus the user edit form (#80) on 2026-09-17 — and confirmed the functionality in all of them.
- `apps/api` + `apps/web`, **Actividades/Horas-Hombre** (§14): catalogues with their ABM, `/registros` with idempotency and the assignment flow, `/metas` with a transactional yearly load, and the two reports. The screens are **one section per department** (decision #84) — Mantenimiento and Despacho have it; Despacho's catalogue starts empty and its Supervisor loads it. Two rules from the workbook audit change numbers and are easy to break: an activity counts in **the month it ended**, and the status does **not** filter the REAL total except for `RECIBIDO` (§14.4 and decision #83).
- `apps/api/src/scripts/sembrar-demo.ts`: a week of **plausible, not real** Despacho data for showing the system (decision #86). `--limpiar` removes it. It runs the real closing job rather than writing `CIERRE_PROMEDIO` by hand.
- `PRODUCT.md` (durable product truth) and `DESIGN.md` plus its sidecar `.impeccable/design.json` (the incumbent visual system, ten named rules) are the entry point for any product or interface work — read the relevant one before redesigning a screen.

**Getting in**: `pnpm --filter api run crear-superadmin <nombre>` creates the first superadmin (decision #55); from there the superadmin creates the rest through `/api/usuarios`. New accounts get a system-generated 72-hour temporary password in `palabra-1234` form and must change it before they can do anything else (decisions #54 and #58). Passwords are minimum 6 characters with at least one letter and one digit, plus a blocklist (decision #58 relaxed the original 12-character NIST rule at the owner's request).

**Deployment has still not happened.** If the presentation turns into the area actually using this, it stops being optional.

**Phase 2 — the RAG assistant is built** (2026-09-24, `CONTEXTO_PROYECTO.md` §16, decisions #100-#106): `apps/api/src/modules/rag/` ingests `.pptx`/`.docx` uploaded by the superadmin and indexes every `NOVEDAD_OPERATIVA` automatically; `/asistente` answers with cited sources, `/asistente/documentos` is superadmin-only. It needs **Ollama running locally** with `qwen2.5:7b` and `nomic-embed-text` (`OLLAMA_URL`, default `http://localhost:11434`); without it the API still boots and the worker just logs and retries. Three things are easy to break: the search is **hybrid with BM25 written in SQL**, not `ts_rank_cd` (MRR 0.66 → 0.93, decision #105); table rows reach the model as `encabezado: valor`, never as a compact table (the 7b misread columns, #106); and changing the embedding model means migrating `vector(768)` and reindexing everything. Measure any retrieval change with `pnpm --filter api run evaluar-rag` before and after. **Not deployed**: the `ollama` container is not in any compose yet.

**Not built**: Análisis Operacional and Calidad de Gas remain undesigned because **no source spreadsheet exists for either**.

Mantenimiento's telemetry **is built** (2026-09-21, `CONTEXTO_PROYECTO.md` §15) — but read decision **#87** before touching it, because it replaced the closed decision #28. The audit found that #28 had modelled the wrong sheet: `REPORTE SEMANAL` covers 10 stations of 251 and is a side list, while the area's real weekly work is a **failure log** — one row per outage, with a start date going back to 2009, which the area writes once when the outage begins. So `REPORTE_TELEMETRIA_ESTACION`/`ESTADO_TELEMETRIA` are gone and `FALLA_ESTACION`/`CAUSA_FALLA` replaced them. A station's state is **derived**, never stored: it has at most one open failure, enforced by a hand-written partial unique index (`WHERE resuelta_en IS NULL`), and availability at any date is a query over that range. The inventory is seeded (decision #89: 20 areas, 16 instrument types, 247 stations, 4,518 instruments, generated by `tools/generar-estaciones.js`); the 201 real failures load with `pnpm --filter api run sembrar-fallas-mtto`, which leaves the system showing the real 19.8% availability against a 95% target. Unlike Despacho's demo data (#86), **these figures are real** — infrastructure state, not delivered volumes.

**Two things worth knowing before touching security**: passwords were deliberately relaxed (decision #58), so the blocklist and the login rate limiting are now the two real defenses — do not weaken either without saying so. And there is currently **one superadmin**, with no technical recovery if it loses access (by design, §12.3).

A separate, unrelated repo at `../SIGCO-GAS-Prototipo-v1` holds an earlier throwaway React/Vite/Tailwind visual prototype (`control-operacional-prototipo.jsx`, 8 views, no backend). It predates several design decisions (telemetry redesign, Actividades module, department/hierarchy model) and has not been updated to match. Its **palette and typography were adopted** for the real frontend (loaded as shadcn tokens in `apps/web/src/app/globals.css`), but its components were not: treat the code as reference only unless the user asks to port from it.

## Working rules (from the project owner — do not deviate without asking)

- **Ask before assuming.** Never fill a gap in an unconfirmed business rule with a guess — surface the question instead. Numbered "Decisiones clave confirmadas" in `CONTEXTO_PROYECTO.md` are closed; anything not listed there is open and needs confirmation.
- **Prefer simplicity over over-design.** A more complex model was reverted once already (an over-elaborated `ESTACION` that pulled in Mantenimiento-only concerns like UTM/telemetry into the Despacho domain).
- **Never mix domains** (Despacho, Mantenimiento, Calidad de Gas, Análisis Operacional), even though they share one database. Only genuinely cross-cutting catalogs (`USUARIO`, `REGION_MTTO` reused by Actividades) are shared by reference — never duplicated per domain.
- **Propose changes to confirmed models explicitly** (as a conceptual diff) rather than silently overwriting a decision that's already closed.
- **ER diagrams always in Mermaid** (`erDiagram`).
- **Never reproduce sensitive personal data** (cédula, birth date, address, clothing sizes) from source files like `PERSONAL.csv` in the data model, code, or chat output.
- **Security is priority one** in every architecture decision (see the Security section of `CONTEXTO_PROYECTO.md` §3 for the concrete baseline: bcrypt cost 12, short-lived JWT access token + DB-backed refresh token, backend-enforced RBAC, rate-limited login, manual-only account unlock, etc.). JWT secret rotation is intentionally deferred to post-launch — don't implement it prematurely.

## Architecture

- **Monorepo**: pnpm workspaces, `apps/web` (Next.js App Router + shadcn/ui + TanStack Table/Query), `apps/api` (Express), `packages/db` (Prisma schema + seed), `packages/shared-types`, `packages/shared-validators` (zod schemas shared between frontend and backend).
- **Layering in the API**: Controller → Service → Repository (not "pure" MVC). Prisma is isolated exclusively inside the Repository layer — Services and Controllers never import it directly, and they import it through `@sicog/db` rather than `@prisma/client`. Services depend on Repository interfaces (e.g. `ILecturaBalanceRepository`), not concrete Prisma calls, so aggregate/raw-SQL queries (e.g. "Balance Nación") live inside a Repository via parameterized `$queryRaw`, never string concatenation. The Repository also translates Prisma error codes into domain errors (`P2002` → `ConflictError`) so upper layers never see them.
- **Database**: PostgreSQL, database name `ctrl_operacional_gas`, with `pgvector` enabled from the initial schema — now used by the Phase 2 RAG module (§16). The full-text search uses a hand-made configuration `sicog_es` (Spanish + `unaccent`), created in the `modulo_rag` migration.
- **Domains** (same DB, no functional relation to each other in operational data): Despacho, Mantenimiento, and the cross-cutting Actividades/Horas-Hombre module are fully designed and closed. Calidad de Gas and Análisis Operacional are not yet designed — no source spreadsheet exists for either.
- **Deployment**: single Coolify docker-compose stack (`web`, `api`, `postgres`).
- Full ERD, confirmed catalogs (systems, regions, departments/positions hierarchy, telemetry dimensions, activity statuses, etc.), the API contract, and the complete list of open items are in `CONTEXTO_PROYECTO.md` — that file is the source of truth, not a summary to skim past.

## Conventions worth knowing before you write code

- **Validate only at the boundary.** Controllers parse with the shared zod schemas; Services and Repositories trust the types. Every error response has the same shape: `{ error: { code, message, details? } }`.
- **Wire representation** (decided once for the whole API): `BigInt` ids travel as strings, `Decimal` as `number`, dates as `YYYY-MM-DD` with no timezone, timestamps as ISO 8601. Date columns are anchored to UTC via `fechaToDate`/`dateToFecha` so a date never shifts by server timezone.
- **Security fails closed.** `apps/api/src/shared/env.ts` validates config with zod and refuses to boot without a 32+ character `JWT_SECRET`. RBAC is resolved against the database, never from the token's contents.
- **Never commit `.env`** (gitignored) or anything in `archivos-fuente/` (the real PDVSA spreadsheets, also gitignored).
- **`packages/db/prisma/clientes.seed.ts` is generated** by `packages/db/prisma/tools/generar-clientes.js` from the workbook — edit the generator, not the output.
- **Verify against the running system, not just the type checker.** The local Postgres is reachable and seeded; the established practice in this repo is to exercise new endpoints and jobs end to end against it, then clean up any test rows. **There is a real superadmin account in the database (`aaron`) — never delete it, and create your own throwaway users for testing.**
- **The shared contracts are built, not read from source.** `shared-types` and `shared-validators` compile to `dist`, because Next's bundler cannot resolve the `.js` extensions that NodeNext requires (decision #57). The `dev`, `build` and `typecheck` scripts of both apps run `pnpm run contratos` first, so editing a contract and running either app picks it up — but a bare `tsc` will not.
- **The frontend guard is convenience, not defense.** `GuardiaSesion` routes people by session state, but the rule it mirrors is enforced by the API's 403. Never move an authorization decision into the browser.
- **Four domains, four departments.** The hub's domain names must match the seeded `DEPARTAMENTO` rows character for character: that string is the key compared against `departamentosQueEdita` to decide who can edit (decisions #22 and #59).

## Commands

### Arrancar en una máquina nueva

```bash
git clone <repo> && cd SICOG
cp .env.example .env          # y generar un JWT_SECRET propio (mín. 32 caracteres)
pnpm install                  # pnpm 11.24, Node 22
docker compose up -d          # Postgres con pgvector, base ctrl_operacional_gas
pnpm --filter @sicog/db migrate:dev
pnpm --filter @sicog/db run seed
pnpm --filter api run crear-superadmin <nombre>   # imprime la temporal UNA vez
./scripts/dev.sh              # API en :4000 y web en :3000, con la salida etiquetada
```

`crear-superadmin` compila los contratos antes de correr, igual que `dev`,
`build` y `typecheck`: importa `@sicog/shared-validators` desde `dist`, que en
un clon recién instalado todavía no existe.

Falta en el clon y hay que traerlo aparte: **`archivos-fuente/`** (gitignored —
el workbook, el Manual DAO y las planillas reales) y **`.env`**. Sin
`archivos-fuente/` el sistema corre igual; lo que no se puede es verificar una
regla contra su fuente, que es como se trabaja acá.

### Comandos del día a día

```bash
docker compose up -d                              # Postgres local
pnpm --filter @sicog/db migrate:dev               # migraciones
pnpm --filter @sicog/db run seed                  # catálogos (aditivo, idempotente)
pnpm --filter api run dev                         # API en :4000
pnpm --filter <paquete> run typecheck             # tsc --noEmit

pnpm --filter api run sembrar-demo                # semana de demostración de Despacho
pnpm --filter api run sembrar-demo -- --limpiar   # y cómo deshacerla

pnpm --filter api run sembrar-fallas-mtto         # las 201 fallas reales de Mantenimiento
pnpm --filter api run sembrar-fallas-mtto -- --limpiar

ollama pull qwen2.5:7b && ollama pull nomic-embed-text   # asistente (Fase 2)
pnpm --filter api run evaluar-rag                 # recuperación contra archivos-fuente/rag/preguntas.json
```

Los dos generadores de `packages/db/prisma/tools/` (`generar-clientes.js` y
`generar-estaciones.js`, más `generar-fallas.js`) leen de `archivos-fuente/` y
**requieren el paquete `xlsx`, que no es dependencia del repo**: se instala
aparte cuando hay que regenerar un catálogo. Los `.seed.ts` que producen sí
están commiteados, así que un clon normal no los necesita.

`sembrar-demo` **borra los datos operativos de Despacho antes de escribir**, usa
cifras plausibles y no reales (decision #86), y corre el job de cierre real en
vez de escribir `CIERRE_PROMEDIO` a mano. Su generador va con semilla fija, así
que repetirlo da exactamente los mismos números.
