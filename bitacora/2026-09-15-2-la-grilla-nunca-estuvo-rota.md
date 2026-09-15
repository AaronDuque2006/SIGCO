# 2026-09-15 (2) — La grilla nunca estuvo rota: no había quién escribiera

El owner pidió seguir con los endpoints que faltaban y, de paso, dijo que
"falta la funcionalidad de cargar los valores en las tablas". Al preguntar,
resultaron ser dos cosas: faltaban las pantallas nuevas **y** las grillas
existentes no le guardaban. Lo segundo era lo urgente.

## No era un bug. Era que nadie podía escribir

La única cuenta de la base era `aaron`: superadmin, puesto `Analista`,
**departamento `(ninguno)`**. La cadena completa, verificada contra el Postgres
local:

| Capa | Qué pasa |
|---|---|
| `crear-superadmin.ts:72` | crea la cuenta con `departamentoId: null` — decisión #21 |
| `auth.service.ts:54` | `departamentosQueEdita` queda en `[]` |
| `despacho/page.tsx` | `puedeEditar = false` |
| `celda-volumen.tsx` | pinta un `<span>`, **no un `<input>`** |
| `despacho.routes.ts` | y aun saltándose la UI, `soloDespacho` responde `403` |

O sea: el sistema hacía exactamente lo que las decisiones #21 y #22 dicen. El
superadmin administra cuentas, no digita gas. Lo reproduje con dos cuentas
desechables: con una de Despacho el `POST` da `201` y el `PATCH` deja su fila
de historial; con una sin departamento el `GET` da `200` y el `POST` da `403`
con su fila en `LOG_INTENTO_NO_AUTORIZADO`.

Se confirmó no tocar la regla. La salida es crear cuentas de Despacho desde
`/usuarios`, que ya estaba hecho.

## El defecto real era de la pantalla

Las celdas quedaban apagadas **en silencio**. Cien filas con "—" y ninguna
pista son indistinguibles de una pantalla rota — que fue justo la conclusión a
la que llegó el owner, razonablemente. Apareció `AvisoSoloConsulta`, que nombra
la cuenta y distingue los dos casos: sin departamento, o de otro departamento.
Es cortesía; el 403 lo sigue resolviendo el backend contra la base.

## Dos decimales, y por qué sólo al mostrar

Confirmado por el owner, cierra el punto abierto de la decisión #60. Se
redondea **sólo al mostrar**: la columna sigue en `Decimal(14,4)` porque el job
de cierre promedia con cuatro posiciones —`(480+500+512,25)/3 → 497,4167`— y
truncarla acumularía error en cada cierre.

Y la celda editable **no** usa el formateo: si el input arrancara redondeado,
pasar por una fila de `CIERRE_PROMEDIO` y salir guardaría `497,42` sobre
`497,4167` sin que nadie teclee nada.

De paso se arregló el único error del `eslint`, un `setState` dentro de un
`useEffect` en `celda-volumen.tsx` que costaba un render de más por celda y por
refresco.

## Queda pendiente

1. **El owner tuvo que rescatar su propia contraseña.** No pudo entrar —tres
   intentos fallidos en `LOG_LOGIN`— y no existe recuperación técnica para el
   único superadmin (§12.3, a propósito). Se resolvió con un script desechable
   que reescribe el hash sin borrar la cuenta ni su auditoría, y se borró al
   usarlo. **El pendiente de tener al menos dos superadmins dejó de ser
   teórico**: esta vez salvó tener acceso a la máquina y a la base.
2. Nadie miró la franja de modo consulta en un navegador.
