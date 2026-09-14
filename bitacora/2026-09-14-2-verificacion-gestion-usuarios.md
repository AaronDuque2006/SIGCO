# 2026-09-14 (2) — Verificar la gestión de usuarios, y lo que apareció al hacerlo

La sesión anterior dejó la gestión de usuarios escrita pero sin verificar: no
había `node` en la máquina, así que no se pudo correr ni la migración ni el
typecheck ni una sola petición. Esta sesión hace esa verificación. El contrato
sigue siendo el del `CONTEXTO_PROYECTO.md` §13.

## Dos cosas que el estado registrado tenía mal

- **Faltaban dos migraciones, no una.** El §10 decía que sólo quedaba pendiente
  `20260914120000_gestion_usuarios`, pero `20260910150000_check_exactamente_uno`
  tampoco se había aplicado nunca. Se aplicaron con `migrate deploy` y no con
  `migrate dev` a propósito: `migrate dev` detecta drift y puede ofrecer un
  reset, que se habría llevado los 111 clientes sembrados. Las dos son
  puramente aditivas.
- **`shared-validators` no compilaba.** `TextEncoder` no está tipado con
  `lib: ["ES2022"]`, que es todo lo que ese paquete carga. Se resolvió contando
  los bytes UTF-8 a mano en vez de agregar `"DOM"` al `lib`: el paquete lo
  importan la API y el frontend por igual, y meterle `document` y `window`
  habría sido exactamente la asimetría que el código ya evitaba al descartar
  `Buffer`. La función se contrastó contra `Buffer.byteLength` en diez casos,
  incluidos acentos y emojis, porque es la que guarda el tope de bcrypt.

## Lo que quedó verificado contra la base real

El arranque en frío (crea, se niega a correr dos veces, rechaza nombres
inválidos, temporal a 72 h exactas); el cambio forzado de contraseña; las cinco
reglas del §13.2; el bloqueo; el registro del 403 en `LOG_INTENTO_NO_AUTORIZADO`;
el vencimiento de la temporal; y las diez reglas de contraseña, incluido el
borde de 72 bytes con caracteres multibyte. Las filas de prueba se borraron.

## El hueco que apareció en el camino

Una de las pruebas falló: tras reiniciar la contraseña, la sesión anterior
seguía respondiendo 200. Investigado, resultó ser más grande de lo que parecía.

**Revocar el refresh no invalida el access token.** Es un JWT sin estado: una
vez emitido, la API no puede retirarlo. El §13.1 prometía que reiniciar la
contraseña "revoca todas las sesiones" y el comentario del código era todavía
más explícito —"dejar vivas las sesiones abiertas haría inútil el reinicio"—,
pero se revocaba sólo la renovación.

El escenario se reprodujo entero: un tercero entra con la contraseña robada, la
víctima la cambia justamente por eso, y el access token del tercero **siguió
leyendo datos de Despacho con normalidad**. En el reinicio hecho por el
superadmin la exposición era menor, pero por casualidad: `debe_cambiar_password`
queda en `true` y `requirePasswordVigente` frena casi todo. En el cambio
voluntario no había nada que lo frenara.

El bloqueo no tenía el problema porque `bloqueado` se consulta contra la base en
cada middleware. La revocación no tenía equivalente, y ahora lo tiene.

## Cómo se cerró (decisión #56)

`USUARIO.sesiones_invalidas_antes_de` guarda el instante de la última
revocación; `requireAuth` rechaza todo token emitido antes de esa marca. Se
sella dentro de `establecerPassword` del repositorio, que es el único punto por
el que pasan tanto el reinicio del superadmin como el cambio propio.

El owner eligió esto sobre acortar el TTL del token (encoge la ventana, no la
cierra) y sobre aceptar el comportamiento y corregir el texto. El argumento que
decidió: la API ya consultaba la base en casi toda ruta protegida, así que el
ahorro de viaje que justifica un JWT sin estado no se estaba cobrando.

Dos detalles que costaron pensarlos:

- **El token lleva un `iatMs` propio.** El `iat` estándar tiene precisión de
  segundos, y cambiar la contraseña sella la revocación y emite el par nuevo
  dentro del mismo segundo: comparando por segundo, la sesión recién entregada
  se mataba a sí misma.
- **El rechazo es indistinguible de un token vencido** hacia afuera, para no
  revelar que la sesión fue revocada.

Se verificó las dos direcciones: el token del intruso pasó de 200 a 401, y la
sesión de quien cambia su propia contraseña sigue viva sin interrupción.

## Queda pendiente

Lo mismo que antes, ya sin el punto de verificación: el frontend con las tres
pantallas que tienen backend (login, cambio forzado, Balance Diario), el resto
de las rebanadas de Despacho, la API de Mantenimiento/Actividades y la pantalla
de gestión de usuarios. Ver `CONTEXTO_PROYECTO.md` §10.
