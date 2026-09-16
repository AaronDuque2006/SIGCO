# 2026-09-16 (1) — La dona, y por qué siete colores no pasan todos los pares

El owner revisó todas las vistas y confirmó que **la funcionalidad anda bien**.
Anunció una skill de UI para mejorar el aspecto, que todavía no llegó. Lo que
sí pidió ya: que el consumo por sectores sea una **dona**, que es la forma que
el área lee en el workbook, y que se prefiera modificar antes que borrar.

## La dona vuelve, las barras se quedan donde sirven

En la sesión anterior había cambiado la dona del workbook por barras
horizontales, argumentando que comparar ángulos es más difícil que comparar
largos — y lo dejé anotado como reversible. El owner prefiere la dona. Se
cambió sólo la gráfica de sectores; **las barras siguen en el entregado por
región**, que no es una participación sobre un total sino una comparación de
magnitudes.

## Siete colores es donde la paleta se pone difícil

Una dona de seis o siete porciones necesita una paleta categórica, no el par
azul/ámbar que ya estaba validado. Ahí apareció lo interesante: **seis tonos
que sobrevivan la comparación de *todos* los pares no es alcanzable en fondo
oscuro.** Las colisiones son sistemáticas:

- **verde ↔ rosa**: ΔE 5,8 en deuteranopía (el clásico rojo-verde)
- **azul ↔ púrpura**: ΔE 5,3 en deuteranopía
- **cian ↔ verde**: ΔE 11,8 incluso a color pleno, bajo el piso de 15

La salida no fue elegir mejor sino **ordenar**: la paleta pasa los checks de
pares adyacentes si los que colisionan nunca quedan juntos. El orden final
—cian, rosa, ámbar, azul, verde, púrpura, magenta— **no es decorativo, es el
que se validó**, y reordenarlo invalida la comprobación. Queda dicho en el
comentario del código, que si no alguien lo "ordena alfabéticamente" y rompe
algo invisible.

Detalle que el validador no mira: **en una dona el último color toca al
primero**. Es una lista circular y el script la trata como lineal, así que ese
par se comprobó aparte (púrpura ↔ cian, ΔE 13,6 en deuteranopía).

Y como el peor par adyacente cae en la banda de 6-8, la skill exige
codificación secundaria: cada porción lleva **nombre, cifra y porcentaje** en
la leyenda. La identidad nunca queda sólo en el color.

## Dos decisiones que hacen la dona comparable entre días

- **El color sigue al sector, no a su tamaño** (`sector.id`). Filtrar un día con
  menos sectores no repinta los que quedan.
- **Las porciones van en el orden del catálogo, no por magnitud.** Así un sector
  está siempre en el mismo lugar del anillo: comparar dos días muestra
  porciones que cambian de tamaño, no de posición.
- **El agujero lleva el total.** En una dona el centro es espacio
  desperdiciado, y la cifra que se busca primero es la suma.

## Un tropiezo del compilador de React

El cálculo de los ángulos acumulaba en una variable dentro de un `.map`, y la
regla `react-hooks/immutability` lo rechaza: no se puede reasignar durante el
render. Se reescribió derivando cada ángulo de la suma de lo que va antes.
Es O(n²) sobre siete porciones como mucho, y queda puro.

## Queda pendiente

1. **Las 9 categorías de la cuarta gráfica**: el owner cree que **son como
   regiones**, pero va a preguntar antes de confirmarlo. Sigue bloqueada.
2. ~~El job no cierra la quema de los días sin lecturas de clientes~~ **Hecho
   en la misma sesión** — ver la entrada siguiente.
3. La skill de UI que el owner va a pasar.
