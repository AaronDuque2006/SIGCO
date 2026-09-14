# Bitácora de sesiones — SICOG

Registro cronológico de qué se hizo en cada sesión de trabajo (con o sin
Claude Code) y qué quedó pendiente al cerrarla. El objetivo es que retomar
el proyecto — en esta máquina, otra, o con otra persona — no dependa de
releer todo el historial de chat: bastan `CLAUDE.md`, `CONTEXTO_PROYECTO.md`
y la última entrada de esta carpeta.

## Qué va acá vs. qué va en `CONTEXTO_PROYECTO.md`

- **`CONTEXTO_PROYECTO.md`** es la fuente de verdad del **estado actual**:
  decisiones de negocio confirmadas, ERD vigente, stack, pendientes abiertos.
  Se edita en el lugar — cuando algo cambia, ese archivo se actualiza para
  reflejar el estado *de hoy*, no un histórico de cómo llegamos ahí.
- **Esta carpeta** es el **histórico narrativo**: qué se hizo sesión a
  sesión, en qué orden, y por qué. No se edita retroactivamente — cada
  entrada es un snapshot del momento en que se escribió.

Si hay conflicto entre lo que dice una entrada vieja de la bitácora y
`CONTEXTO_PROYECTO.md`, **gana `CONTEXTO_PROYECTO.md` siempre**.

## Convención

- Un archivo por sesión (o por bloque de trabajo con identidad propia
  dentro de una misma sesión larga): `AAAA-MM-DD-slug-descriptivo.md`.
- Si hay más de una entrada el mismo día, agregar un sufijo numérico:
  `AAAA-MM-DD-2-slug.md`.
- Cada entrada cierra con una sección **"Queda pendiente"** apuntando a la
  próxima acción concreta y, cuando aplique, a la sección de
  `CONTEXTO_PROYECTO.md` (§9/§10) donde vive el detalle completo.

## Índice

- [`2026-09-08-scaffold-inicial-y-schema-prisma.md`](./2026-09-08-scaffold-inicial-y-schema-prisma.md) — recuperación del `pnpm install`, stack de `apps/web` (shadcn/ui + TanStack + react-hook-form), `schema.prisma` completo de los dominios cerrados, conexión a Supabase, corrección de la mecánica PUNTUAL/CIERRE_PROMEDIO (decisión #34), `git init` + primeros 9 commits.
- [`2026-09-10-migracion-seed-y-primer-modulo-de-api.md`](./2026-09-10-migracion-seed-y-primer-modulo-de-api.md) — se abandonó Supabase por Postgres en Docker (#40), migraciones aplicadas, seed real completo (7 sistemas, 31 fuentes, 111 clientes), corrección del catálogo `SISTEMA` con el Manual DAO (#16), contrato de la API de Despacho, rebanada `LECTURA_BALANCE` end to end, job de cierre diario (#42-#45), y las Empresas Mixtas como fuente *y* cliente (#47). Decisiones #35 a #48.
- [`2026-09-10-2-modulo-auth.md`](./2026-09-10-2-modulo-auth.md) — módulo `auth` completo: login, refresh con rotación y detección de reuso, logout, sesión actual, rate limiting y auditoría. Decisiones #49 a #51. Aparecieron dos huecos de la sección 3 que nunca se habían implementado: el registro de intentos no autorizados y `trust proxy`.
- [`2026-09-14-gestion-usuarios.md`](./2026-09-14-gestion-usuarios.md) — gestión de usuarios completa: reglas de contraseña (NIST, sin reglas de composición), contraseña temporal generada por el sistema con cambio forzado, superadmin como rol ortogonal al cargo, y el comando de arranque del primer superadmin. Decisiones #52 a #55. Apareció un hueco de seguridad: `loginSchema` aceptaba 200 caracteres cuando bcrypt trunca en 72 bytes. Escrito sin verificar (no había `node` en el entorno); verificado en la entrada siguiente.
- [`2026-09-14-2-verificacion-gestion-usuarios.md`](./2026-09-14-2-verificacion-gestion-usuarios.md) — verificación end to end de la gestión de usuarios contra la base real. Aparecieron dos migraciones sin aplicar en vez de una y un error de compilación en `shared-validators`. Y un hueco mayor: revocar las sesiones no invalidaba los access token ya emitidos, así que cambiar la contraseña por sospecha de robo dejaba viva la sesión ajena hasta 15 minutos. Cerrado con el sello `USUARIO.sesiones_invalidas_antes_de` (decisión #56).
