# 2026-09-17 (1) — Edición de usuarios: el endpoint estaba desde el principio

La entrada del 14 de septiembre que construyó la pantalla de usuarios cerró
anotando que faltaba exponer la edición, "que en el backend ya existe". Tres
días después seguía igual: `PATCH /api/usuarios/:id` estaba en el §13 desde que
se escribió el contrato, verificado end to end, y ninguna pantalla lo llamaba.

Era el pendiente más chico que quedaba, y por eso se hizo primero.

## Lo que no era sólo UI

El plan decía "falta el formulario". Al mirar los cuatro campos que el `PATCH`
acepta —puesto, departamento, supervisor, `esSuperadmin`— apareció que uno de
ellos no era cosmético.

El formulario de alta manda `supervisorId: null` fijo. Siempre lo hizo. Así que
la **cadena de supervisión no se podía poblar por ningún camino**: el contrato
la aceptaba desde el §13, la base tenía la columna, y no existía una sola
pantalla capaz de escribirla. Estaba vacía porque nadie podía llenarla.

Eso importa más adelante que ahora. La decisión #25 dice que un superior ve
toda la cadena hacia abajo, y ese recorrido es del módulo de Actividades, que
todavía no existe. Pero el día que exista, iba a encontrarse la cadena vacía sin
una razón visible.

## Dónde vive el formulario

No hay componente de diálogo en el proyecto — `components/ui/` tiene cuatro
archivos: alert, button, input, label. Un modal habría sido una pieza nueva.

El precedente ya estaba resuelto en la decisión #69: el historial de
correcciones se despliega **desde la propia fila**. La edición hace lo mismo.
Una fila abierta a la vez, porque dos formularios sobre la misma tabla compiten
por el mismo espacio y no hay razón para editar a dos personas al mismo tiempo.

## El botón apagado no es un detalle de estilo

`actualizarUsuarioSchema` es `.partial()` con un `refine` que rechaza el objeto
vacío. Verificado contra la API:

```
PATCH /api/usuarios/3  {}
→ 422  "No hay nada que actualizar."
```

Si el formulario mandara los cuatro campos siempre, eso nunca pasaría — pero
dejaría escrituras que no cambian nada. Y si mandara sólo lo cambiado sin
mirar, alguien que abre el formulario y le da a guardar sin tocar nada se
comería ese `422` sin entender por qué.

La salida fue la misma que la decisión #60 usó con las celdas de
`CIERRE_PROMEDIO`: la pantalla se adelanta y apaga el control, en vez de dejar
que el backend contesté un error que nadie esperaba.

## Los ciclos se quedan en el backend

`useCandidatosSupervisor` saca de la lista a la propia persona y nada más. La
tentación era filtrar también a quienes ya están por debajo en la cadena, para
que el desplegable no ofreciera una opción inválida.

No se hizo, y es deliberado: recorrer la cadena en el navegador sería mover una
decisión de validez al frontend, que es exactamente lo que la decisión #57
prohíbe. El backend ya la recorre y contesta:

```
PATCH /api/usuarios/2  {"supervisorId":3}   ← 3 ya depende de 2
→ 422  "Esa asignación crearía un ciclo en la cadena de supervisión."
```

## La arruga: el DTO trae nombres, no ids

Para que los desplegables arranquen en el valor actual hay que saber **qué id**
tiene el puesto de la persona. `UsuarioDto` expone `puesto: string` y
`departamento: string | null` — texto, no ids.

Se resolvió buscando el nombre en el catálogo. Funciona porque los dos
catálogos tienen nombres distintos entre sí, que es el mismo supuesto del que ya
depende el hub para decidir quién edita qué (decisión #59).

Queda anotado como abierto en la decisión #80: si conviene que el DTO exponga
además `puestoId`/`departamentoId`, es un cambio al contrato del §13 y no se
hizo por lo bajo.

## Un movimiento de archivo que era higiene de dominios

El desplegable de supervisor necesita todos los usuarios, y el listado pagina a
100. El idiom de recorrer las páginas ya existía — lo escribió la decisión #72
para el desplegable de origen de novedades — pero vivía como función privada
dentro de `lib/despacho.ts`.

Importarlo desde `lib/usuarios.ts` habría sido hacer que el módulo de usuarios
dependa del de Despacho. Se mudó a `lib/api.ts`, que es donde vive `api()` y no
pertenece a ningún dominio.

## Verificación

Sin herramientas de navegador en esta sesión, así que la API se ejercitó con
`curl` contra el servidor corriendo, con un superadmin desechable creado para
eso y borrado al terminar (la cuenta real, `aaron`, no se tocó).

| caso | resultado |
|---|---|
| `PATCH` parcial (puesto + departamento) | 200 |
| `PATCH` sólo supervisor | 200 |
| quitarse el propio superadmin | 409 |
| puesto que exige departamento, sin departamento | 422 |
| ciclo en la cadena | 422 |
| autorreferencia como supervisor | 422 |
| cuerpo vacío | 422 |

La pantalla la revisó el owner en el navegador y confirmó que anda.

## Queda pendiente

- **Mejoras de UI** con `DESIGN.md` como vara — es lo que sigue inmediatamente.
- **Contrato y API de Mantenimiento/Actividades**, el trabajo grande, después de
  la UI.
- Decidir si `UsuarioDto` expone los ids de puesto y departamento (decisión #80).
- Sigue sin resolverse lo de **un solo superadmin sin recuperación técnica**.
- El sistema **todavía no se desplegó**.
