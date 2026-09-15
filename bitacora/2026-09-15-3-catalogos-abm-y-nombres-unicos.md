# 2026-09-15 (3) — Catálogos, ABM de clientes y fuentes, y un constraint que faltaba

Fase 1 del plan: los endpoints que las pantallas siguientes necesitan para
armar sus desplegables. Sin pantalla propia — novedades y contactos tienen que
dejar elegir un cliente *o* una fuente como origen, y sin estas listas el
formulario no se puede armar. Es el mismo hueco que apareció con `/usuarios` y
se cerró con `GET /api/usuarios/catalogos` (decisión #61).

Nada requirió diseñar contrato: los schemas zod y los DTOs ya estaban escritos
desde la sesión del contrato de §11. Era implementación siguiendo la plantilla
de `lectura-fuente`.

## El hueco: el schema no garantizaba nombres únicos

Los `@@unique` que existían eran todos de lecturas. Nada impedía dos clientes
llamados "PEQUIVEN", y la grilla diaria es una fila por cliente: dos filas
idénticas no se podrían distinguir al digitar. El plan prometía un `409` en el
`POST` duplicado que sencillamente **no existía**.

Los datos reales ya cumplían —111 clientes, 31 fuentes y 7 sectores, todos con
nombres distintos—, así que la migración `20260915140000` entró sin conflicto.

El constraint va en la base y **no** como chequeo en el Service: entre un
`SELECT` y un `INSERT` hay una carrera, y dos peticiones simultáneas con el
mismo nombre pasarían las dos. El índice único *es* el mecanismo; el Repository
traduce el `P2002` a `CONFLICT`, igual que ya hacía con las lecturas.

En sectores el constraint cubre también las filas desactivadas: reusar el
nombre de un sector dado de baja haría ambiguos los reportes históricos, que es
justo lo que el soft-delete existe para evitar.

## `requireSupervisor`, la única pieza de autorización nueva

La decisión #31 pide "Supervisor+ de Despacho" para editar el catálogo de
sectores, y sólo existían `requireDepartamento` y `requireSuperadmin`.

El rango sale del **`id` del puesto**, no de su nombre: la decisión #23 fija
que el id sigue el organigrama (Gerente 1 … Analista 5), el mismo invariante
del que ya dependía el listado de §13 para ordenarlos. El id de "Supervisor" se
consulta contra la base en vez de cablear un `3`, y si esa fila faltara no pasa
nadie.

**Las dos condiciones se exigen encadenadas**, `soloDespacho` y después
`requireSupervisor`: sin la primera, un supervisor de Mantenimiento podría
editar el catálogo de este dominio. Los dos motivos de 403 quedan distinguidos
en `LOG_INTENTO_NO_AUTORIZADO`.

## Detalles que valen para las rebanadas que faltan

- **`GET /sectores-cliente` devuelve también los desactivados**, con su bandera
  `activo`. Los reportes históricos los nombran — es para eso que existe el
  soft-delete. Quien arma un desplegable filtra; quien pinta un reporte no.
- **Los listados van alfabéticos**, a diferencia de la grilla diaria que agrupa
  por sistema: son dos vistas del mismo catálogo, una se busca y la otra se
  recorre.
- **La FK inexistente se traduce desde el `P2003`** en vez de verificar las tres
  claves antes: serían tres viajes a la base en el camino feliz, y seguirían
  siendo una carrera si el catálogo cambiara en el medio.

## Queda pendiente

Nada de esta fase. Todo verificado contra la base real y las filas de prueba
borradas.
