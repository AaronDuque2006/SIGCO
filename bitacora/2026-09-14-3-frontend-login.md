# 2026-09-14 (3) — Las primeras pantallas: entrar al sistema

Hasta acá el sistema se podía usar sólo con `curl`. Esta sesión construye las
dos pantallas que abren la puerta: `/login` y `/cambiar-password`. Decisión #57.

## Por qué el frontend antes de terminar Despacho

La recomendación venía anotada en el §10 desde dos sesiones atrás sin que nadie
la confirmara. El owner la confirmó acá. El argumento original: la pantalla real
revela cosas del contrato que desde el backend no se ven, y corregirlas ahora es
más barato que con seis módulos construidos encima.

Se le sumó uno que no existía antes: todo el módulo `auth` se había verificado
con `curl`, nunca desde un navegador. Las cookies `httpOnly` + `sameSite: strict`
y el ciclo de refresh son justo el tipo de cosa que funciona en `curl` y falla
en un cliente real.

## La identidad visual

El owner eligió tomar la paleta y la tipografía del prototipo visual —fondo
`#0a0f1a`, acento azul, Inter y monoespaciada para números— pero **no** sus
componentes. Van cargadas como tokens de shadcn en `globals.css`, así que quien
ya vio el prototipo reconoce el sistema sin que el código arrastre los estilos
inline de algo que nació descartable. La aplicación es oscura fija: es un
sistema de sala de control.

Se descartó portar el prototipo tal cual (abandona shadcn/ui, que es decisión de
stack ya cerrada) y usar el tema por defecto de shadcn (tira a la basura el
trabajo visual que ya existía).

## Dos cosas que aparecieron al construir

- **El build de Next no resolvía los paquetes compartidos.** Sus imports
  internos llevan la extensión `.js` que exige NodeNext; `tsc` y `tsx` la
  resuelven al `.ts` correspondiente, el bundler de Next no. Se resolvió
  compilando `shared-types` y `shared-validators` a `dist`. Se descartó quitar
  las extensiones —rompe el typecheck de la API— y bajar el frontend a webpack.
  Para que nadie trabaje contra un contrato viejo sin notarlo, `dev`, `build` y
  `typecheck` de las dos apps compilan los contratos primero.
- **`apps/web` era una raíz de workspace propia.** `create-next-app` había
  dejado ahí un `pnpm-workspace.yaml` con dos `allowBuilds`, y eso hacía que
  desde esa carpeta pnpm no viera ninguno de los paquetes del monorepo. Se
  eliminó y su único ajuste que faltaba se movió a la raíz.

## Qué quedó verificado y qué no

Verificado: el build de producción, el typecheck de los cinco paquetes, las tres
rutas sirviendo 200, la paleta aplicada en el CSS compilado, el preflight de
CORS desde `http://localhost:3000`, y el login cruzado devolviendo las dos
cookies con `HttpOnly; SameSite=Strict`.

**Sin verificar: el recorrido dentro del navegador.** No había control de
navegador disponible en esta sesión, así que el envío de los formularios, los
redirecciones de la guardia y la renovación automática del token a los 15
minutos **no se ejercitaron**. Es lo primero que hay que hacer con las pantallas
abiertas.

## Queda pendiente

1. ~~**Probar el recorrido en un navegador**~~ **Hecho por el owner**: crear el
   superadmin, entrar y el cambio forzado funcionan contra un cliente real.
   Falta sólo dejar una pestaña quieta 15 minutos para ver la renovación
   automática del token, que no se ejercitó.
2. **Balance Diario**, la primera pantalla operativa.
3. Resto de las rebanadas de Despacho, la API de Mantenimiento/Actividades y la
   pantalla de gestión de usuarios. Ver `CONTEXTO_PROYECTO.md` §10.
