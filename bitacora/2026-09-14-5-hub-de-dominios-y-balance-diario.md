# 2026-09-14 (5) — El hub de dominios y la primera pantalla operativa

Dos pantallas: el hub al que se llega después de autenticarse, y Balance
Diario, la primera que sirve para el trabajo real de la gerencia. Decisiones
#59 y #60.

## El hub, y por qué la idea del owner encajaba sola

El owner la trajo pensada: después de entrar, cuatro cards con los cuatro
dominios, y los que no existen todavía en gris diciendo "En desarrollo".

Al construirla apareció que no era sólo una idea de navegación. Los cuatro
dominios **son** los cuatro departamentos del catálogo (decisión #23), y la
decisión #22 ya decía que cualquiera puede consultar cualquier departamento
pero editar sólo el suyo. O sea que el hub es la traducción visual de una regla
que ya estaba cerrada, y por eso se muestran los cuatro a todo el mundo:
esconder lo que alguien no puede editar contradiría la #22. Cada card dice si la
persona entra a cargar datos o sólo a mirarlos, leyendo `departamentosQueEdita`
de la sesión.

Se apartó del pedido en un punto: Mantenimiento también quedó en gris. Está
diseñado y cerrado, pero no tiene ni API ni pantallas, así que su card no
llevaría a ningún lado. Un card que se puede tocar y no lleva a nada útil miente
sobre el estado del sistema.

## Balance Diario

La grilla trae el día entero sin paginar —una fila por cliente, con su lectura o
`null`— porque el trabajo real es digitar el día de corrido. Teniendo las 111
filas cargadas, filtrar por sistema o buscar por nombre se hace en el navegador:
instantáneo y sin una petición por tecla. El desplegable de sistemas se arma con
los que **aparecen en las filas** (4 de los 7 tienen clientes), así que no
ofrece filtros que devuelven vacío.

Se guarda al salir del campo o con Enter, sin botón por fila: son cien clientes
seguidos y un botón por fila obligaría a sacar la mano del teclado cien veces.
`Escape` descarta. La celda no distingue entre crear y corregir porque desde la
pantalla es la misma acción — escribir el volumen de un cliente —; por debajo
sale un `POST` o un `PATCH` según la fila tuviera valor, y el backend deja la
fila de historial cuando corresponde.

Con corte `CIERRE_PROMEDIO` sólo se pueden corregir filas existentes: esas las
escribe únicamente el job de medianoche (decisión #42). La pantalla lo explica y
deshabilita las celdas vacías, en vez de dejar que el backend conteste un error
que nadie esperaba.

## Verificado

Contra la base real: la grilla devuelve las 111 filas con sus 4 sistemas; crear
una lectura, corregirla, y que la corrección quede en el historial y se refleje
en la grilla. Y la regla que sostiene toda la interfaz: alguien de Mantenimiento
**consulta** la grilla de Despacho (200) pero **no puede editarla** (403). Se
borraron las filas de prueba.

**Sin verificar: el aspecto y el uso real de las pantallas.** No hay control de
navegador en esta sesión; lo que se comprobó es que las rutas sirven, que la
guardia de sesión muestra el estado de carga, y que el contenido está en el
bundle. Hay que abrirlas.

## Abierto

- **Cuántos decimales mostrar** en la columna de volumen. Hoy entre 2 y 4 (la
  columna es `Decimal(14,4)`), pero la convención del área no se preguntó. Es
  justo el tipo de detalle que sólo aparece con la pantalla en uso, que era el
  argumento para hacer el frontend antes que el resto de Despacho.
- El endpoint de catálogos del §11 todavía no existe, así que los cuatro
  dominios viven como constante en el frontend.

## Queda pendiente

1. Abrir las dos pantallas y mirarlas.
2. Resto de las rebanadas de Despacho (§11) y la pantalla de gestión de usuarios.
3. Cargar una lista real de contraseñas filtradas (§13.3), que subió de
   prioridad con la decisión #58.
