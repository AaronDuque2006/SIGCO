# 2026-09-14 (4) — Aflojar las contraseñas sin abrir la puerta

El owner probó el frontend y funcionó. Con eso llegó el primer pedido que viene
de los usuarios reales y no del diseño: las contraseñas son demasiado difíciles
y la gente se va a fastidiar de usar la aplicación. Decisión #58, que ajusta la
#52 y la #54.

## El pedido, y por qué se aceptó sólo la mitad

Eran tres cosas: temporal igual a nombre de usuario más el año, cambio forzado,
y mínimo de 6 alfanuméricos. La segunda y la tercera se tomaron; la primera no.

**El mínimo de 6 alfanuméricos se aceptó.** Con el rate limiting del login —5
intentos fallidos cada 15 minutos— recorrer el espacio de 6 alfanuméricos contra
el servidor no es viable. El problema real a 6 caracteres no es la fuerza bruta
sino las contraseñas obvias, y para eso ya existe la lista de bloqueo.

**La temporal derivada del nombre de usuario se rechazó**, y no por purismo. Las
cuentas se crean días antes de que su dueño entre por primera vez, y el nombre
de usuario es público: aparece en novedades, registros y grillas. En esa ventana
cualquiera puede deducir la contraseña, entrar antes que el titular, cambiarla y
quedarse con la cuenta — y como el cambio forzado sí se cumple, el dueño después
no puede entrar y el robo queda registrado a nombre de él. No hace falta un
atacante; alcanza un compañero curioso.

Lo que sí resolvía el problema de fondo era que la temporal fuera **corta**, no
que fuera **deducible**. Quedó en `palabra-1234` —`carro-8602`, `viento-7050`—
en vez de los `EFKjK-Abjag-krEN9` de antes. Se dicta en dos segundos.

## Lo que se movió en la dirección contraria

**La lista de bloqueo se amplió, no se recortó.** Es la consecuencia menos
obvia del cambio: a 12 caracteres la longitud era la que defendía la cuenta y la
lista era un complemento; a 6 caracteres se invierte, y la lista pasa a ser lo
único que para `gas123`, `planta1` o `turno1`.

Por eso entró el vocabulario del dominio que la #52 había dejado afuera **a
propósito** (`gas`, `despacho`, `planta`, `turno`, `anaco`…). El motivo de
entonces era que esas palabras aparecen dentro de frases largas legítimas; con
un mínimo de 6 eso dejó de aplicar, porque una contraseña de 6 caracteres no es
una frase. Como la comparación es contra el esqueleto completo y no por
subcadena, "el gas fluye por el sistema" sigue pasando.

También se bajó de 5 a 4 el piso de caracteres distintos: con 6 de mínimo,
exigir 5 distintos rechazaba cosas razonables como `mama12` y la regla pasaba de
atajar basura a estorbar.

## El número que conviene no perder de vista

La temporal tiene ahora ~20 bits de entropía contra los ~87 de antes. Alcanza
por tres razones que **se sostienen juntas**: vence a las 72 h, hay que cambiarla
en el primer ingreso, y el login admite 5 intentos fallidos cada 15 minutos. Son
unos 1.400 intentos en toda la ventana de vigencia contra 960.000 combinaciones:
una posibilidad en 700 contra una cuenta concreta.

Si alguna vez se quita el rate limiting del login, este número deja de alcanzar.
Quedó anotado en la decisión #58 y en el propio código.

## Verificado

Las 16 reglas contra el validador y el recorrido completo contra la base real:
alta con la temporal nueva, ingreso, rechazo de `gas123` y de una sin número,
aceptación de `perro9`, y reingreso con ella.

**Las contraseñas existentes siguen valiendo**: el login no valida formato a
propósito (§12.2), así que nadie tiene que cambiar la suya por este ajuste. La
cuenta real que ya existía no se tocó.

## Queda pendiente

1. **Cargar una lista real de contraseñas filtradas.** Era un pendiente menor y
   dejó de serlo: ahora es la defensa principal del login.
2. Balance Diario, la primera pantalla operativa.
