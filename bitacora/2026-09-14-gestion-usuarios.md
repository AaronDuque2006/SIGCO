# 2026-09-14 — Gestión de usuarios: el módulo que abre la puerta

Hasta acá el login funcionaba pero no había a quién dejar entrar: los usuarios
sólo se podían crear escribiendo SQL y un hash bcrypt a mano. Esta sesión
cierra eso. Detalle completo del contrato en `CONTEXTO_PROYECTO.md` §13.

## Lo que el owner decidió

Las tres preguntas de arranque, todas con la recomendación del asistente:

- **Mínimo 12 caracteres**, sin reglas de composición.
- **Contraseña temporal con 72 horas de vigencia**.
- **La temporal la genera el sistema**, no la escribe el superadmin.

El owner ya traía la idea del flujo —contraseña por defecto, el usuario la
cambia, el superadmin la reinicia si se olvida— y quedó tal cual, con tres
matices que se agregaron: la genera el sistema (si la eligiera el superadmin a
mano, en la práctica todas las cuentas arrancarían con la misma y esa sería la
llave maestra), el cambio se fuerza en vez de sugerirse, y la temporal vence.

## Dos huecos del modelo que aparecieron antes de escribir código

Los dos se consultaron en vez de rellenarse con una suposición.

- **"Superadmin" no existía en el modelo de datos.** El catálogo `PUESTO` tiene
  5 filas y ninguna es Superadmin, pero las decisiones #11, #21 y #31 lo dan
  por existente. Se resolvió con `USUARIO.es_superadmin`, un rol de sistema
  **ortogonal al cargo** (decisión #53). El argumento que decidió: la #31
  contrapone explícitamente al superadmin contra la jerarquía de negocio
  ("nunca Superadmin — no conoce el dominio") y la #23 define el organigrama
  completo sin mencionarlo. Meterlo como un puesto más obligaría a que quien
  administra cuentas no pueda tener además un cargo real.
- **No había forma de crear el primer superadmin.** Huevo y gallina: la gestión
  es exclusiva del superadmin y no hay auto-registro. Se resolvió con un
  comando de arranque único (decisión #55) que se niega a correr si ya existe
  uno. Se descartó sembrarlo desde el seed con credenciales de `.env`: deja una
  contraseña real escrita en un archivo de configuración.

## Un hueco de seguridad que apareció de paso

**`loginSchema` aceptaba contraseñas de hasta 200 caracteres, pero bcrypt sólo
mira los primeros 72 bytes** y descarta el resto en silencio. O sea, dos
contraseñas que difirieran después del byte 72 eran, para el sistema, la misma
contraseña. Quedó cerrado con el tope de 72 bytes de la decisión #52.

## Por qué las reglas de contraseña son las que son

Se siguió NIST SP 800-63B, que es lo contrario de lo acostumbrado: longitud
alta y lista de bloqueo, **sin** exigir mayúscula/número/símbolo. Esas reglas
empujan a `Pdvsa2026!` —que las cumple las cuatro y está en el primer millar de
cualquier diccionario— y de paso rechazan frases largas que sí son fuertes.
Tampoco hay expiración periódica: forzar el cambio cada 90 días produce
`Gas2026-1`, `Gas2026-2`.

La lista de bloqueo deja afuera a propósito palabras genéricas del español como
"gas" o "despacho": aparecen de forma natural en frases largas y legítimas.

## Queda pendiente — arrancar por acá la próxima sesión

1. **Verificar todo esto.** Se escribió completo pero **no se pudo verificar**:
   `node` no estaba disponible en el entorno del asistente (sólo el binario de
   `pnpm`, que igual necesita node para correr `tsc`, `prisma` y `tsx`), y
   `docker compose` daba permiso denegado sobre el socket. Falta correr la
   migración `20260914120000_gestion_usuarios`, el typecheck de los cuatro
   paquetes tocados, y las pruebas end to end contra la API y la BD real —que
   es la práctica establecida del repo, no un extra.
2. **Frontend.** Ahora son **tres** pantallas las que ya tienen backend: login,
   **cambio de contraseña forzado** y Balance Diario. La segunda dejó de ser
   opcional: sin ella nadie pasa del primer ingreso.
3. **Resto de las rebanadas de Despacho** y la API de Mantenimiento/Actividades
   (§11 ya escrito para la primera).
4. **Pantalla de gestión de usuarios** para el superadmin.

Ver `CONTEXTO_PROYECTO.md` §10 para la lista vigente y §13 para el contrato.
