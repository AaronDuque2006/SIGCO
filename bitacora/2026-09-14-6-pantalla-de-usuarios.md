# 2026-09-14 (6) — La pantalla que saca al superadmin de `curl`

El backend de gestión de usuarios estaba entero y verificado desde la segunda
tanda del día, pero no había forma de usarlo sin armar peticiones a mano. Esta
sesión le pone pantalla. Decisión #61.

## Un hueco que apareció en el primer minuto

El §13 no tenía endpoint para listar puestos ni departamentos. Sin eso, el
formulario de alta no puede armar sus desplegables — y crear un usuario exige
`puestoId`.

La salida fácil era cablear los cinco puestos y los cuatro departamentos en el
frontend, como ya se había hecho con los dominios del hub. Se descartó: ahí lo
cableado son **nombres**, que son estables y además son la clave contra la que
se compara `departamentosQueEdita`; acá habría que cablear **ids**, que dependen
del orden del seed y en una base nueva podrían ser otros.

Quedó como `GET /api/usuarios/catalogos`, dentro del módulo de usuarios y no en
un módulo de catálogos transversal: son dos listas de cinco y cuatro filas cuyo
único consumidor hoy es esta pantalla, y viviendo acá heredan su misma puerta,
que es sólo el superadmin. Detalle de Express que costó recordar: la ruta va
**antes** que `/:id`, porque si no la captura ésa y responde 422 por un id que
no es número.

## La pantalla

Listado paginado con búsqueda y filtro de bloqueados, alta, bloquear y
desbloquear, y reinicio de contraseña.

Dos decisiones de interfaz que salen de reglas ya cerradas:

- **La contraseña temporal no se muestra en un aviso que se desvanece.** Existe
  en claro una sola vez y no hay forma de volver a consultarla (decisión #54),
  así que el bloque se queda hasta que la persona diga "ya la anoté". Un toast
  de tres segundos sobre un dato irrecuperable sería una trampa.
- **El botón de bloquear está deshabilitado en la propia fila.** Es la regla del
  §13.2 que, junto con no poder quitarse el superadmin a uno mismo, hace
  imposible dejar al sistema sin ningún superadmin activo. El backend la hace
  cumplir igual; la pantalla evita ofrecer algo que va a fallar.

El acceso vive en la cabecera y sólo se le muestra a quien es superadmin. La
puerta real sigue siendo el 403 de `requireSuperadmin`, que además deja registro
en `LOG_INTENTO_NO_AUTORIZADO`.

## Verificado

Los seis caminos contra la base real: catálogos, alta con su temporal de un solo
uso, listado con búsqueda, bloqueo, filtro de sólo bloqueados y reinicio de
contraseña. Se borraron las cuentas de prueba; la cuenta real no se tocó.

## Queda pendiente

1. **Editar un usuario desde la pantalla.** El `PATCH` del §13 existe y está
   verificado —puesto, departamento, supervisor, superadmin— pero la pantalla
   todavía no lo expone. Es lo primero que le falta.
2. Abrir la pantalla y mirarla.
3. Lo de siempre: resto de las rebanadas de Despacho, API de Mantenimiento, y la
   lista real de contraseñas filtradas (§13.3).
