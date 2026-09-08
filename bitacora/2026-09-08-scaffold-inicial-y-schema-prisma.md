# 2026-09-08 — Scaffold inicial, stack de `apps/web`, `schema.prisma` y `git init`

## Punto de partida

La sesión anterior había dejado el scaffold del monorepo creado (estructura
de `apps/`, `packages/`, configs raíz) pero el `pnpm install` se quedó a
mitad de camino porque la máquina se congeló y hubo que reiniciarla. No
existía `pnpm-lock.yaml` ni `node_modules` en ningún workspace.

## Qué se hizo

1. **Instalación de dependencias.** `pnpm install` corrió limpio (519
   paquetes), pero terminó con `exit code 1` porque pnpm 11 bloquea por
   defecto los scripts de build de dependencias nativas. Se corrió
   `pnpm approve-builds --all` (aprueba Prisma, `bcrypt`, `esbuild`,
   `unrs-resolver` — todas dependencias ya declaradas y esperadas) y quedó
   verificado con `pnpm install --frozen-lockfile`.

2. **Auditoría de dependencias faltantes.** Comparado contra el stack
   confirmado (`CONTEXTO_PROYECTO.md` §3): `apps/api` y `packages/db` ya
   estaban completos; a `apps/web` le faltaba todo el lado de UI/datos.

3. **`apps/web`: shadcn/ui + stack de datos.**
   - `shadcn@latest init -d --no-monorepo` (preset por defecto `base-nova`,
     que usa **Base UI** en vez de Radix) — generó `components.json`,
     `src/components/ui/button.tsx`, `src/lib/utils.ts`, tema en
     `globals.css`.
   - Agregado `@tanstack/react-table`, `@tanstack/react-query`,
     `react-hook-form`, `@hookform/resolvers`, `zod`.
   - `zod` se instaló primero en v4; se bajó a `^3.24.1` para que coincida
     con la versión que ya usan `apps/api` y `packages/shared-validators`
     (los schemas de zod se comparten entre frontend y backend, no pueden
     tener majors distintos).
   - Se agregó el script `typecheck` que le faltaba a `apps/web/package.json`.
   - Se probó el dev server en el navegador (curl a `localhost:3000`,
     HTTP 200) antes de dar el cambio por bueno.

4. **`schema.prisma` completo.** Se modeló todo lo que el ERD de
   `CONTEXTO_PROYECTO.md` §7 tiene cerrado: Dominio A (Despacho), Dominio B
   (Mantenimiento), Dominio E (Actividades/Horas-Hombre) y Autorización.
   Además se agregaron explícitamente 3 tablas de seguridad que estaban
   confirmadas en prosa en §3 pero nunca dibujadas en el ERD:
   `SesionRefresh`, `LogLogin`, `LogIntentoNoAutorizado` — ya reflejadas
   también en el ERD Mermaid del `.md`.

   Convenciones de implementación acordadas con el owner del proyecto:
   - Modelos Prisma: PascalCase singular (`Usuario`, `LecturaBalance`).
   - Tablas físicas: snake_case, primera palabra en plural (`usuarios`,
     `lecturas_balance`).
   - Campos `string` del ERD → `String` sin longitud fija; `enum` del ERD →
     enum nativo de Postgres.
   - `NOVEDAD_OPERATIVA.tipo` se dejó como `String` simple (no enum ni
     catálogo) porque esa lista todavía no está cerrada (§9.2 #4).
   - Pendiente real, no resuelto: los `CHECK` "exactamente uno de
     cliente_id/fuente_id" (`NovedadOperativa`, `Contacto`) no se pueden
     declarar en `schema.prisma` — hay que agregarlos a mano al SQL de la
     primera migración.

5. **Conexión a Supabase (BD de desarrollo).** Se configuró el
   `datasource` de Prisma y `packages/db` usa `dotenv-cli` para leer un
   único `.env` en la raíz del monorepo. Primero se configuró con pooler
   de pgbouncer (patrón típico Prisma+Supabase), pero se simplificó a una
   sola conexión directa (puerto 5432) para `DATABASE_URL` y `DIRECT_URL`
   porque `apps/api` es un servidor Express de proceso persistente (no
   serverless) con ~10 usuarios simultáneos — Prisma maneja su propio pool
   sin necesidad de pgbouncer. `.env` está creado con la estructura
   correcta pero **con un placeholder en vez de la contraseña real**
   (ver "Queda pendiente").

6. **Corrección de una decisión ya cerrada (decisión #2 → #34).** El
   owner del proyecto aclaró que `CIERRE_PROMEDIO` no es una segunda
   lectura digitada aparte: `PUNTUAL` se puede corregir varias veces al
   día (el patrón `*_HISTORIAL` que ya existía cubre esto sin cambios) y,
   al cumplirse 24 horas, `CIERRE_PROMEDIO` es la **media aritmética
   simple** de todos los valores que tuvo `PUNTUAL` ese día, y **se
   guarda como fila propia** (no es query-calculado, porque alimenta el
   informe formal de cierre). Confirmado que aplica igual a
   `QUEMA_NACIONAL`, que no tenía historial propio — se agregó
   `QuemaNacionalHistorial`. La decisión #2 quedó tachada en
   `CONTEXTO_PROYECTO.md` con un puntero explícito a la nueva decisión
   #34 (nunca se sobrescribió en silencio).

7. **Bug de scaffold encontrado y arreglado.** Al generar el cliente de
   Prisma real, `apps/api/src/shared/prisma-client.ts` dejó de
   typechequear (`TS2742`, tipo inferido no "nombreable" por los symlinks
   de pnpm en el monorepo). Se arregló anotando el tipo explícitamente:
   `export const prisma: PrismaClient = new PrismaClient();`.

8. **`git init` + 9 commits progresivos.** No había repo git. Se
   inicializó, se renombró la rama por defecto a `main`, se configuró
   identidad **local** al repo (`user.name`/`user.email`, sin tocar la
   config global — el owner del proyecto no especificó una identidad
   propia), se borró un `pnpm-lock.yaml` duplicado que había quedado
   dentro de `apps/web` (de cuando `create-next-app` lo generó como
   proyecto standalone antes de integrarlo al workspace), y se hicieron 9
   commits con Conventional Commits agrupados por área (docs → scaffold
   del workspace → `packages/db` → `apps/api` → `apps/web` → config de
   skills de Claude Code → modelado de dominios en Prisma → corrección
   #34 → simplificación de la conexión a Supabase).

## Queda pendiente

- **Contraseña real de Supabase.** `.env` (raíz, gitignored) tiene la
  estructura correcta pero la contraseña sigue en placeholder
  (`REEMPLAZAR-CONTRASENA`) — hay que completarla antes de poder migrar.
- **Correr la migración inicial**: `pnpm --filter @sicog/db migrate:dev`.
  Antes de aplicarla, agregar a mano al SQL generado los `CHECK`
  "exactamente uno de cliente_id/fuente_id" en `NovedadOperativa` y
  `Contacto` (Prisma no los soporta declarativamente).
- **Seed data real**: 9 sistemas, 4 regiones de Despacho, 6 regiones de
  Mantenimiento, catálogos de `INSUMO`/`PRODUCTO_SERVICIO` de
  Mantenimiento, valores iniciales de `ESTADO_TELEMETRIA` (detalle en
  `CONTEXTO_PROYECTO.md` §9.4 #9).
- **Diseño de endpoints/rutas de la API por módulo** — todavía no
  retomado (`CONTEXTO_PROYECTO.md` §10).
- **Dominios C (Calidad de Gas) y D (Análisis Operacional)** siguen sin
  diseñar — falta el Excel/especificación de cada uno (§9.1).
- **Catálogo `INSUMO`/`PRODUCTO_SERVICIO` de Actividades** solo está
  levantado para Mantenimiento; falta el de Despacho, Calidad de Gas y
  Análisis Operacional (§9.2 #3).
- **Lista cerrada de `NOVEDAD_OPERATIVA.tipo`** sigue abierta — hoy es un
  `String` libre en el schema a propósito (§9.2 #4).
- **Prototipo visual** (`../SIGCO-GAS-Prototipo-v1`) sigue sin reflejar el
  rediseño de telemetría, el módulo de Actividades ni la jerarquía de
  departamentos (§8).
- **Rotación de secreto JWT**: pospuesta a propósito hasta producción
  estable, no es un pendiente urgente (§9.4 #13).

Ver `CONTEXTO_PROYECTO.md` §9 y §10 para el detalle completo y actualizado
de pendientes — esta sección es un resumen al cierre de esta sesión, no la
lista maestra.
