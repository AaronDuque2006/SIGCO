# 2026-09-16 (5) — Cierre de sesión y traspaso a la máquina nueva

El owner pasó a un equipo con más capacidad. Esta entrada existe para que
retomar en la máquina nueva no dependa de releer el historial.

## Dónde quedó el proyecto

**Despacho está completo y no queda bloqueante conocido para retirar el Excel.**
La decisión #79 cerró el último: las transferencias fuera del sistema estaban
contadas en el workbook y ausentes en SICOG, y eso dejaba el transportado 8
MMPCED corto.

Lo construido y verificado contra la base real: `auth`, gestión de usuarios,
balance diario, lecturas de fuentes, quema nacional, novedades, contactos,
catálogos, ABM de clientes y fuentes, transferencias, los tres reportes, las
cuatro gráficas del workbook y el job de cierre.

Dos documentos nuevos en la raíz, que son la entrada para lo que sigue:
**`PRODUCT.md`** (verdad de producto) y **`DESIGN.md`** más su sidecar
(el sistema visual, con diez reglas nombradas).

## Lo que la máquina vieja enseñó, y ya no aplica

Tenía 3,6 GiB de RAM y 512 MiB de swap. Con la API y el web levantados los dos
se agotaban, y compilar una página pasaba de 8 segundos a más de 4 minutos.

Lo que vale conservar no es el número sino el método: **el aviso de Next sobre
"slow filesystem" apuntaba al lugar equivocado.** El disco era un ext4 local con
192 GB libres; lo que estaba agotado era la memoria. Si algo vuelve a ir lento,
medir antes de culpar al disco.

## Para arrancar en la nueva

El bloque **"Arrancar en una máquina nueva"** quedó escrito en `CLAUDE.md`, con
el clon, el `.env`, el `docker compose`, las migraciones, el seed, el
superadmin y `scripts/dev.sh`.

Dos cosas **no viajan en el clon** y hay que traerlas aparte:

- **`archivos-fuente/`** — el workbook, el Manual DAO y las planillas reales.
  Está gitignored a propósito. Sin eso el sistema corre igual, pero no se puede
  verificar una regla contra su fuente, que es como se trabaja acá.
- **`.env`** — sólo viaja `.env.example`, que documenta cada variable. El
  `JWT_SECRET` se genera propio por ambiente; la API no arranca con menos de 32
  caracteres.

Y una decisión que quedó para el owner: **las skills instaladas**
(`.claude/skills/`, `.claude/agents/`, `.agents/`, `.codex/`) siguen sin
versionar. Si tienen que estar en la máquina nueva, hay que commitearlas o
reinstalarlas allá. `.claude/settings.local.json` sí se agregó al `.gitignore`:
es de la máquina, no del proyecto.

## Por dónde seguir

1. **Edición de usuarios** en la pantalla del superadmin — el backend ya la
   expone, la UI no. Lo más chico y concreto que queda, y estaba acordado.
2. **Mejoras de UI**, ahora con `DESIGN.md` como vara.
3. **Contrato + API de Mantenimiento y Actividades** — el trabajo grande.
4. **Abrir el bloque de transferencias en un navegador**: es lo único de
   Despacho que nadie miró.

## Queda pendiente

- Las dos preguntas que sólo se contestan usando el sistema: si hacen falta
  subtotales por sistema o región en Balance Diario (#60), y si las novedades
  mal cargadas se borran o sólo se corrigen (§11.5).
- Por qué `C45` del workbook excluye `C37` (ENTREGA ICO MORÓN) de su total.
  SICOG lo suma, que es lo coherente con el resto.
- Calidad de Gas y Análisis Operacional siguen sin diseñar: **no existe la
  planilla de origen de ninguno de los dos**.
