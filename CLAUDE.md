# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This directory (`SICOG`) is the home of the real monorepo for **SICOG** (Sistema de Control Operacional de Gas), a system for PDVSA Gas's Gerencia de Control Operacional. The full accumulated design context (business rules, confirmed decisions, ERD, stack, open items) lives in `CONTEXTO_PROYECTO.md` in this same directory — **read it before doing any design or implementation work**, since it is long and encodes many already-settled decisions that must not be silently re-litigated. The narrative session-by-session history lives in `bitacora/`.

**What exists today** (see `CONTEXTO_PROYECTO.md` §9/§10 for the authoritative state):

- Monorepo scaffolded and installing cleanly; local Postgres via `docker compose up -d` (`pgvector/pgvector:pg16`, database `ctrl_operacional_gas`).
- `packages/db`: full `schema.prisma` for the closed domains, two applied migrations, and a seed with the real catalogs — 7 systems, 31 sources, 111 clients, regions, sectors, departments, positions, telemetry states, and Mantenimiento's activity catalog. The seed is **additive and idempotent**: re-running it inserts only what is missing.
- `packages/shared-validators` (zod inputs) and `packages/shared-types` (output DTOs) hold the **API contracts** — Despacho in `CONTEXTO_PROYECTO.md` §11, `auth` in §12.
- `apps/api`: the full `auth` module (login, rotating refresh with reuse detection, logout, current session, rate limiting, audit logging — see §12), DB-backed RBAC, the `LECTURA_BALANCE` slice end to end (Repository → Service → Controller → routes), and the daily closing job.
- `apps/web`: scaffolded with the confirmed stack, but no application screens yet.

**Not built yet**: user management — logging in works but there is no way to create a user except by SQL, so **nobody can actually get in yet**; this is the first thing to do. Also missing: the remaining Despacho slices (`LECTURA_FUENTE`, `QUEMA_NACIONAL`, `NOVEDAD_OPERATIVA`, `CONTACTO`, and the two reports), the Mantenimiento/Actividades API, and every screen in `apps/web`.

A separate, unrelated repo at `../SIGCO-GAS-Prototipo-v1` holds an earlier throwaway React/Vite/Tailwind visual prototype (`control-operacional-prototipo.jsx`, 8 views, no backend). It predates several design decisions (telemetry redesign, Actividades module, department/hierarchy model) and has not been updated to match. Treat it as reference only unless the user asks to update or port from it.

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
- **Database**: PostgreSQL, database name `ctrl_operacional_gas`, with `pgvector` enabled from the initial schema (reserved for a future Phase 2 RAG feature — do not add an Ollama container or RAG code until that phase explicitly starts).
- **Domains** (same DB, no functional relation to each other in operational data): Despacho, Mantenimiento, and the cross-cutting Actividades/Horas-Hombre module are fully designed and closed. Calidad de Gas and Análisis Operacional are not yet designed — no source spreadsheet exists for either.
- **Deployment**: single Coolify docker-compose stack (`web`, `api`, `postgres`).
- Full ERD, confirmed catalogs (systems, regions, departments/positions hierarchy, telemetry dimensions, activity statuses, etc.), the API contract, and the complete list of open items are in `CONTEXTO_PROYECTO.md` — that file is the source of truth, not a summary to skim past.

## Conventions worth knowing before you write code

- **Validate only at the boundary.** Controllers parse with the shared zod schemas; Services and Repositories trust the types. Every error response has the same shape: `{ error: { code, message, details? } }`.
- **Wire representation** (decided once for the whole API): `BigInt` ids travel as strings, `Decimal` as `number`, dates as `YYYY-MM-DD` with no timezone, timestamps as ISO 8601. Date columns are anchored to UTC via `fechaToDate`/`dateToFecha` so a date never shifts by server timezone.
- **Security fails closed.** `apps/api/src/shared/env.ts` validates config with zod and refuses to boot without a 32+ character `JWT_SECRET`. RBAC is resolved against the database, never from the token's contents.
- **Never commit `.env`** (gitignored) or anything in `archivos-fuente/` (the real PDVSA spreadsheets, also gitignored).
- **`packages/db/prisma/clientes.seed.ts` is generated** by `packages/db/prisma/tools/generar-clientes.js` from the workbook — edit the generator, not the output.
- **Verify against the running system, not just the type checker.** The local Postgres is reachable and seeded; the established practice in this repo is to exercise new endpoints and jobs end to end against it, then clean up any test rows.

## Commands

```bash
docker compose up -d                              # Postgres local
pnpm --filter @sicog/db migrate:dev               # migraciones
pnpm --filter @sicog/db run seed                  # catálogos (aditivo, idempotente)
pnpm --filter api run dev                         # API en :4000
pnpm --filter <paquete> run typecheck             # tsc --noEmit
```
