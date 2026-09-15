#!/usr/bin/env bash
#
# Arranca el entorno local completo —Postgres, la API y el web— en una sola
# terminal, con la salida de los tres etiquetada. Ctrl+C baja la API y el web.
#
#   ./scripts/dev.sh              arranca todo
#   ./scripts/dev.sh --bajar-db   además detiene Postgres al salir
#
set -euo pipefail

# Job control: cada proceso en segundo plano queda como líder de su propio
# grupo, que es la única forma de matarle el árbol entero al salir. `pnpm` no
# es el proceso que escucha el puerto —cuelga de él `tsx watch`, y de ese, node—
# así que matar sólo el PID de pnpm dejaría el puerto ocupado por un huérfano.
set -m

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

BAJAR_DB=0
for arg in "$@"; do
  case "$arg" in
    --bajar-db) BAJAR_DB=1 ;;
    -h|--help) sed -n '3,8p' "${BASH_SOURCE[0]}" | sed 's/^# \?//'; exit 0 ;;
    *) echo "Opción desconocida: $arg (probá --help)" >&2; exit 2 ;;
  esac
done

# ── Presentación ──────────────────────────────────────────────────────────────

if [[ -t 1 ]]; then
  ROJO=$'\033[31m'; VERDE=$'\033[32m'; AMARILLO=$'\033[33m'
  AZUL=$'\033[34m'; CIAN=$'\033[36m'; GRIS=$'\033[90m'; FIN=$'\033[0m'
else
  ROJO=""; VERDE=""; AMARILLO=""; AZUL=""; CIAN=""; GRIS=""; FIN=""
fi

paso()  { printf '%s▸%s %s\n' "$AZUL" "$FIN" "$1"; }
ok()    { printf '%s✓%s %s\n' "$VERDE" "$FIN" "$1"; }
aviso() { printf '%s!%s %s\n' "$AMARILLO" "$FIN" "$1"; }
error() { printf '%s✗%s %s\n' "$ROJO" "$FIN" "$1" >&2; }

# ── Configuración ─────────────────────────────────────────────────────────────

[[ -f .env ]] || { error "No hay .env en $RAIZ. Copialo de .env.example y completalo."; exit 1; }

# Los puertos salen del .env y no se repiten acá: si alguien cambia PORT, el
# script sigue esperando al puerto correcto.
leer_env() { grep -E "^$1=" .env | head -1 | cut -d= -f2- | tr -d '"'\'' ' ; }
PUERTO_API="$(leer_env PORT)"
PUERTO_WEB="$(leer_env WEB_ORIGIN | sed -E 's#.*:([0-9]+)/?$#\1#')"
: "${PUERTO_API:=4000}"
: "${PUERTO_WEB:=3000}"

puerto_ocupado() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }

for par in "API:$PUERTO_API" "web:$PUERTO_WEB"; do
  if puerto_ocupado "${par#*:}"; then
    error "El puerto ${par#*:} (${par%%:*}) ya está ocupado."
    error "Puede ser una corrida anterior que quedó viva: lsof -i :${par#*:}"
    exit 1
  fi
done

# ── Limpieza ──────────────────────────────────────────────────────────────────

PIDS=()

limpiar() {
  trap - INT TERM EXIT
  printf '\n'
  paso "Bajando procesos…"
  for pid in "${PIDS[@]:-}"; do
    [[ -n "$pid" ]] && kill -TERM -- "-$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  if (( BAJAR_DB )); then
    $DOCKER compose stop postgres >/dev/null 2>&1 || true
    ok "Postgres detenido."
  else
    printf '%s  Postgres sigue arriba (--bajar-db para detenerlo también).%s\n' "$GRIS" "$FIN"
  fi
  ok "Listo."
}
trap limpiar INT TERM EXIT

# ── Espera ────────────────────────────────────────────────────────────────────

# esperar <descripción> <segundos máximos> <comando…>
esperar() {
  local que="$1" limite="$2"; shift 2
  local i=0
  until "$@" >/dev/null 2>&1; do
    i=$((i + 1))  # no `(( i++ ))`: con i=0 devuelve estado 1 y `set -e` corta
    if (( i > limite )); then
      error "$que no respondió en ${limite}s."
      return 1
    fi
    sleep 1
  done
}

# ── 1. Postgres ───────────────────────────────────────────────────────────────

# En esta máquina docker viene del snap: el socket es root:root y no hay grupo
# `docker`, así que `docker compose` sólo anda con sudo. Se resuelve una vez acá
# en vez de quedar cableado, para que el script siga sirviendo en una máquina
# donde el usuario sí esté en el grupo.
DOCKER=""
resolver_docker() {
  if docker compose version >/dev/null 2>&1; then
    DOCKER="docker"
  elif sudo -n docker compose version >/dev/null 2>&1; then
    DOCKER="sudo docker"
  elif command -v docker >/dev/null 2>&1; then
    aviso "docker necesita sudo (socket root:root, sin grupo docker). Te va a pedir la contraseña."
    DOCKER="sudo docker"
  else
    error "No hay docker instalado y Postgres no está escuchando en :5432."
    exit 1
  fi
}

if puerto_ocupado 5432; then
  # El contenedor tiene `restart: unless-stopped`, así que después de un
  # reinicio de la máquina ya está arriba. Si el puerto contesta lleva rato
  # sirviendo y no hay nada que esperar ni que pedirle a docker.
  ok "Postgres ya estaba arriba en :5432"
else
  resolver_docker
  paso "Levantando Postgres…"
  $DOCKER compose up -d postgres >/dev/null
  # `compose up -d` vuelve cuando el contenedor arrancó, no cuando la base
  # acepta conexiones: sin este pg_isready la API puede quedarse sin base.
  esperar "Postgres" 60 $DOCKER compose exec -T postgres \
    pg_isready -U postgres -d ctrl_operacional_gas -q
  ok "Postgres acepta conexiones en :5432"
fi

# Si se va a detener Postgres al salir, conviene resolver docker ahora y no en
# medio del Ctrl+C, cuando un pedido de contraseña llega a destiempo.
if (( BAJAR_DB )) && [[ -z "$DOCKER" ]]; then resolver_docker; fi

# ── 2. Contratos ──────────────────────────────────────────────────────────────

# shared-types y shared-validators se compilan una sola vez acá, antes de
# arrancar nada. No es sólo por velocidad: los scripts `dev` de la API y del web
# corren cada uno `pnpm -w run contratos`, así que arrancarlos a la vez pondría
# dos `tsc` escribiendo el mismo `dist/`. Esa carrera es también la razón por la
# que abajo se espera a que la API esté arriba antes de arrancar el web.
paso "Compilando contratos compartidos…"
pnpm -w run contratos >/dev/null
ok "Contratos al día."

# ── 3. API y web ──────────────────────────────────────────────────────────────

# Cada proceso escribe con su etiqueta. `sed -u` para que no se atasque la
# salida en el búfer y las líneas aparezcan cuando ocurren, no de a bloques.
arrancar() {
  local etiqueta="$1" color="$2"; shift 2
  "$@" > >(sed -u "s/^/${color}[${etiqueta}]${FIN} /") 2>&1 &
  PIDS+=("$!")
}

paso "Arrancando la API…"
arrancar "api" "$CIAN" pnpm --filter api dev
esperar "La API" 90 curl -fsS "http://127.0.0.1:${PUERTO_API}/health"
ok "API en http://localhost:${PUERTO_API}"

paso "Arrancando el web…"
arrancar "web" "$VERDE" pnpm --filter web dev
esperar "El web" 90 bash -c "exec 3<>/dev/tcp/127.0.0.1/${PUERTO_WEB}"
ok "Web en http://localhost:${PUERTO_WEB}"

printf '\n%s  Todo arriba. Ctrl+C para bajar la API y el web.%s\n\n' "$GRIS" "$FIN"

# Si uno de los dos se cae solo, el script baja el otro en vez de dejar medio
# entorno andando.
wait -n
aviso "Uno de los procesos terminó por su cuenta."
