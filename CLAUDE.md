# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This directory (`SICOG`) is the home of the real monorepo for **SICOG** (Sistema de Control Operacional de Gas), a system for PDVSA Gas's Gerencia de Control Operacional. **No code has been written here yet** — the directory currently contains only planning documents. The full accumulated design context (business rules, confirmed decisions, ERD, stack, open items) lives in `CONTEXTO_PROYECTO.md` in this same directory — **read it before doing any design or implementation work**, since it is long and encodes many already-settled decisions that must not be silently re-litigated.

A separate, unrelated repo at `../SIGCO-GAS-Prototipo-v1` holds an earlier throwaway React/Vite/Tailwind visual prototype (`control-operacional-prototipo.jsx`, 8 views, no backend). It predates several design decisions (telemetry redesign, Actividades module, department/hierarchy model) and has not been updated to match. Treat it as reference only unless the user asks to update or port from it.

## Working rules (from the project owner — do not deviate without asking)

- **Ask before assuming.** Never fill a gap in an unconfirmed business rule with a guess — surface the question instead. Numbered "Decisiones clave confirmadas" in `CONTEXTO_PROYECTO.md` are closed; anything not listed there is open and needs confirmation.
- **Prefer simplicity over over-design.** A more complex model was reverted once already (an over-elaborated `ESTACION` that pulled in Mantenimiento-only concerns like UTM/telemetry into the Despacho domain).
- **Never mix domains** (Despacho, Mantenimiento, Calidad de Gas, Análisis Operacional), even though they share one database. Only genuinely cross-cutting catalogs (`USUARIO`, `REGION_MTTO` reused by Actividades) are shared by reference — never duplicated per domain.
- **Propose changes to confirmed models explicitly** (as a conceptual diff) rather than silently overwriting a decision that's already closed.
- **ER diagrams always in Mermaid** (`erDiagram`).
- **Never reproduce sensitive personal data** (cédula, birth date, address, clothing sizes) from source files like `PERSONAL.csv` in the data model, code, or chat output.
- **Security is priority one** in every architecture decision (see the Security section of `CONTEXTO_PROYECTO.md` §3 for the concrete baseline: bcrypt cost 12, short-lived JWT access token + DB-backed refresh token, backend-enforced RBAC, rate-limited login, manual-only account unlock, etc.). JWT secret rotation is intentionally deferred to post-launch — don't implement it prematurely.

## Architecture (planned, not yet materialized)

- **Monorepo**: pnpm workspaces, `apps/web` (Next.js App Router + shadcn/ui + TanStack Table/Query), `apps/api` (Express), `packages/db` (Prisma schema), `packages/shared-types`, `packages/shared-validators` (zod schemas shared between frontend and backend).
- **Layering in the API**: Controller → Service → Repository (not "pure" MVC). Prisma is isolated exclusively inside the Repository layer — Services and Controllers never import it directly. Services depend on Repository interfaces (e.g. `IUsuarioRepository`), not concrete Prisma calls, so aggregate/raw-SQL queries (e.g. "Balance Nación") live inside a Repository via parameterized `$queryRaw`, never string concatenation.
- **Database**: PostgreSQL, database name `ctrl_operacional_gas`, with `pgvector` enabled from the initial schema (reserved for a future Phase 2 RAG feature — do not add an Ollama container or RAG code until that phase explicitly starts).
- **Domains** (same DB, no functional relation to each other in operational data): Despacho, Mantenimiento, and the cross-cutting Actividades/Horas-Hombre module are fully designed and closed. Calidad de Gas and Análisis Operacional are not yet designed — no source spreadsheet exists for either.
- **Deployment**: single Coolify docker-compose stack (`web`, `api`, `postgres`).
- Full ERD, confirmed catalogs (systems, regions, departments/positions hierarchy, telemetry dimensions, activity statuses, etc.), and the complete list of open items are in `CONTEXTO_PROYECTO.md` — that file is the source of truth, not a summary to skim past.
