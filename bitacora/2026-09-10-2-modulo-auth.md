# 2026-09-10 (2) — Módulo `auth`: login, refresh rotativo y auditoría

Segundo bloque del mismo día. Cierra la pieza que impedía que alguien usara el
sistema: hasta acá existía sólo la *verificación* de JWT, así que para probar
cualquier endpoint había que firmar tokens a mano.

Diseñado contract-first con la skill `api-and-interface-design`, igual que
Despacho. Detalle completo en `CONTEXTO_PROYECTO.md` §12.

## Tres decisiones que la sección 3 dejaba abiertas

La sección 3 tenía definido el grueso (bcrypt 12, access 15 min, refresh 7
días en cookie, rate limiting, desbloqueo manual), pero no cubría tres cosas
que cambian el contrato. Se preguntaron antes de escribir código:

- **#49 — Ningún token viaja en el cuerpo ni lo ve JavaScript.** El access
  token también va en cookie `httpOnly`, no sólo el refresh. Un XSS no puede
  robarlos, y `sameSite: strict` corta el CSRF sin token anti-CSRF aparte.
  Costo: hubo que tocar `requireAuth`, que sólo leía el header. Se conservó
  el `Authorization: Bearer` para pruebas y clientes que no son navegador.
- **#50 — El refresh rota en cada uso y el reuso se trata como robo.** Si
  llega un refresh ya revocado se revocan *todas* las sesiones del usuario.
  El `@unique` de `token_hash` y la columna `revocado_en` ya estaban en el
  schema justo para esto.
- **#51 — Los intentos fallidos NO bloquean la cuenta.** Sólo rate limiting;
  `bloqueado` queda como acción manual del superadmin. Bloquear por intentos
  fallidos habilitaría una denegación de servicio trivial: cualquiera que
  conozca un nombre de usuario podría dejar afuera a esa persona.

## Decisiones tomadas sin preguntar (consecuencia directa de las anteriores)

- **No se filtra qué usuarios existen, por ninguno de los dos canales.**
  Mismo mensaje y mismo 401 para "no existe" y "contraseña incorrecta", y
  **siempre** corre un `bcrypt.compare` —contra un hash señuelo si el usuario
  no existe— para que tampoco se distingan por el tiempo de respuesta. Que la
  cuenta está bloqueada se informa sólo *después* de acertar la contraseña.
- **Bloquear a alguien le corta el acceso de inmediato**: el refresh verifica
  `bloqueado` y revoca sus sesiones, en vez de dejarlo adentro hasta 7 días.
- **El refresh se guarda con SHA-256, no bcrypt**: es aleatorio de 256 bits,
  no un secreto elegido por una persona, así que bcrypt sólo agregaría
  latencia sin encarecer ningún ataque real.

## Dos huecos que aparecieron de paso

- **`LOG_INTENTO_NO_AUTORIZADO` no se estaba escribiendo nunca.** La sección 3
  lo pedía desde el diseño original y la tabla existía vacía. Ahora
  `requireDepartamento` registra cada 403 con ruta y motivo.
- **`trust proxy` no estaba activado.** Detrás de Coolify, `req.ip` habría
  sido siempre la del proxy: el rate limiting por IP y el log de logins
  quedaban inservibles sin que nada fallara de forma visible.

## Verificación

24 checks end to end contra la API corriendo y la BD real: flags de las
cookies, ausencia de tokens en el cuerpo, rotación, detección de reuso
cerrando todas las sesiones, logout invalidando el refresh, las filas de
auditoría y el 429 del rate limiting. Datos de prueba creados y borrados.

## Queda pendiente — arrancar por acá la próxima sesión

1. **Gestión de usuarios.** Es lo único que hoy separa al sistema de que
   alguien lo use: el login funciona pero no hay a quién dejar entrar, porque
   sólo se pueden crear usuarios por SQL. Por la decisión #11 es exclusiva del
   superadmin y no hay auto-registro. Va con una decisión pendiente: **no hay
   regla de complejidad de contraseña definida** — el login a propósito no
   valida formato, pero al *crear* una contraseña hará falta una.
2. **Frontend con las dos pantallas que ya tienen backend** (login y Balance
   Diario). La recomendación fue saltar acá antes de terminar las rebanadas
   restantes de Despacho: la pantalla real va a enseñar cosas del contrato que
   desde el backend no se ven —si el filtro por sistema alcanza, si los
   subtotales hacen falta en la grilla, si `OTROS (PUERTO ORDAZ)` se lee
   bien— y corregirlas ahora es mucho más barato que con seis módulos
   construidos sobre las mismas suposiciones. **El owner no confirmó este
   orden todavía.**
3. **Resto de las rebanadas de Despacho**: `LECTURA_FUENTE`,
   `QUEMA_NACIONAL`, `NOVEDAD_OPERATIVA`, `CONTACTO`, catálogos y los dos
   reportes. El contrato ya está escrito (§11), falta implementarlos.
4. **Limpieza de sesiones vencidas**: las filas de `SESION_REFRESH` expiradas
   o revocadas se acumulan sin límite. Podría ir en el mismo job del cierre.

Ver `CONTEXTO_PROYECTO.md` §10 para la lista vigente y §12 para el contrato
de auth.
