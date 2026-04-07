#!/usr/bin/env bash
# ============================================================
# goose-deploy.sh — Migraciones + seeds idempotentes para ${APP_NAME:-zentto-app}
#
# Ejecutado por CI/CD (deploy.yml) DESPUES de levantar el container API.
# Corre como root en el servidor (179.x.x.x) y aplica:
#   1. Migraciones nuevas via goose
#   2. Seeds idempotentes desde migrations/seeds/*.sql
#
# Variables de entorno (con defaults para dev):
#   PG_DATABASE  : zentto_hotel | zentto_hotel_dev
#   PG_USER      : zentto_hotel_app
#   PG_PASSWORD  : (requerido)
#   PG_HOST      : 127.0.0.1
#   GOOSE_DIR    : ruta al directorio migrations/postgres
#   SEEDS_DIR    : ruta al directorio migrations/seeds
#   APP_SCHEMA   : htl
# ============================================================
set -euo pipefail

PG_DATABASE="${PG_DATABASE:-zentto_hotel}"
PG_USER="${PG_USER:-zentto_hotel_app}"
PG_HOST="${PG_HOST:-127.0.0.1}"
PG_PORT="${PG_PORT:-5432}"
APP_SCHEMA="${APP_SCHEMA:-htl}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
GOOSE_DIR="${GOOSE_DIR:-$REPO_DIR/migrations/postgres}"
SEEDS_DIR="${SEEDS_DIR:-$REPO_DIR/migrations/seeds}"

if [ -z "${PG_PASSWORD:-}" ]; then
  echo "✗ PG_PASSWORD no definido" >&2
  exit 1
fi

# URL-encode password porque puede contener /, +, =, etc.
url_encode() {
  local s="$1"
  printf '%s' "$s" | python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.stdin.read(),safe=""))' 2>/dev/null || \
  printf '%s' "$s" | sed -e 's|%|%25|g; s|/|%2F|g; s|+|%2B|g; s|=|%3D|g; s|@|%40|g; s|:|%3A|g; s|#|%23|g; s|?|%3F|g; s|&|%26|g; s| |%20|g'
}
ENC_USER="$(url_encode "$PG_USER")"
ENC_PWD="$(url_encode "$PG_PASSWORD")"
GOOSE_URL="postgres://${ENC_USER}:${ENC_PWD}@${PG_HOST}:${PG_PORT}/${PG_DATABASE}?sslmode=disable"
PSQL_URL="postgresql://${ENC_USER}:${ENC_PWD}@${PG_HOST}:${PG_PORT}/${PG_DATABASE}?sslmode=disable"

echo "╔══════════════════════════════════════════╗"
echo "║  ${APP_NAME:-zentto-app} — goose deploy             ║"
echo "║  DB: ${PG_DATABASE}"
echo "║  USER: ${PG_USER}"
echo "║  SCHEMA: ${APP_SCHEMA}"
echo "╚══════════════════════════════════════════╝"

# 1. Instalar goose si no esta
if ! command -v goose &>/dev/null; then
  echo "→ Instalando goose..."
  wget -qO /usr/local/bin/goose https://github.com/pressly/goose/releases/download/v3.24.1/goose_linux_x86_64
  chmod +x /usr/local/bin/goose
fi

# 2. Asegurar extensiones (necesita superuser, asi que se hace via su -c postgres)
echo "→ Asegurando extensiones PostgreSQL..."
su -c "psql -d ${PG_DATABASE} -c 'CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";'" postgres 2>&1 | tail -2 || true

# 3. Asegurar grants del schema (idempotente)
echo "→ Asegurando grants en schema ${APP_SCHEMA} para ${PG_USER}..."
su -c "psql -d ${PG_DATABASE} <<SQL
CREATE SCHEMA IF NOT EXISTS ${APP_SCHEMA};
GRANT USAGE, CREATE ON SCHEMA ${APP_SCHEMA} TO ${PG_USER};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${APP_SCHEMA} TO ${PG_USER};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${APP_SCHEMA} TO ${PG_USER};
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA ${APP_SCHEMA} TO ${PG_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA ${APP_SCHEMA} GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${PG_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA ${APP_SCHEMA} GRANT USAGE, SELECT ON SEQUENCES TO ${PG_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA ${APP_SCHEMA} GRANT EXECUTE ON FUNCTIONS TO ${PG_USER};
SQL
" postgres 2>&1 | tail -3 || true

# 4. Aplicar migraciones goose
if [ ! -d "$GOOSE_DIR" ]; then
  echo "✗ No existe $GOOSE_DIR" >&2
  exit 1
fi

# Detectar si la BD ya tiene tablas del schema (entorno existente con
# migraciones aplicadas a mano o por goose previo). Stampeamos TODAS
# las migraciones existentes como aplicadas (idempotente: las que ya
# estuvieran no se duplican). Esto cubre dos casos:
#   1. Schema migrado a mano sin goose: crea goose_db_version
#   2. Goose previo pero incompleto: completa los faltantes
# Las migraciones LEGACY (sin StatementBegin/End markers) no pueden
# ser ejecutadas por goose, asi que si ya existen en la BD las marcamos
# como "aplicadas" y goose solo correra las nuevas.
EXISTING_TABLES=$(su -c "psql -d ${PG_DATABASE} -tAc \"SELECT count(*) FROM information_schema.tables WHERE table_schema = '${APP_SCHEMA}';\"" postgres 2>/dev/null || echo "0")

# Helper: dejar que goose cree su propia tabla goose_db_version corriendo
# una migracion bootstrap descartable con un version_id alto. Goose se queja
# si intentamos crear la tabla nosotros con un schema distinto al suyo, asi
# que es mas seguro dejar que el la cree.
# Despues de crearla, BORRAMOS la fila bootstrap (version 99999999) para que
# nuestros stamps reales (versions 1..N) sean los unicos registros.
ensure_goose_table() {
  local tmp_dir
  tmp_dir=$(mktemp -d)
  cat > "$tmp_dir/99999999_zentto_bootstrap.sql" <<'BOOTSTRAP'
-- +goose Up
SELECT 1;
-- +goose Down
SELECT 1;
BOOTSTRAP
  goose -dir "$tmp_dir" postgres "$GOOSE_URL" up >/dev/null 2>&1 || true
  rm -rf "$tmp_dir"
  # Borrar el registro bootstrap para no contaminar el historial
  # Y agregar UNIQUE en version_id (goose no lo agrega, asi que ON CONFLICT
  # de stamp_migration falla sin esto).
  su -c "psql -d ${PG_DATABASE} -v ON_ERROR_STOP=0 <<'SQL'
DELETE FROM public.goose_db_version WHERE version_id = 99999999;
CREATE UNIQUE INDEX IF NOT EXISTS goose_db_version_version_uniq ON public.goose_db_version(version_id);
SQL
" postgres >/dev/null 2>&1
}

stamp_migration() {
  local version="$1"
  su -c "psql -d ${PG_DATABASE} -c \"INSERT INTO public.goose_db_version (version_id, is_applied) VALUES (${version}, true) ON CONFLICT (version_id) DO NOTHING;\"" postgres >/dev/null 2>&1 || true
}

if [ "${EXISTING_TABLES}" = "0" ]; then
  # CASO 1 — BD vacia (primer deploy o BD recreada)
  # Las migraciones legacy de las apps nuevas tienen funciones plpgsql con
  # '$$' sin markers '-- +goose StatementBegin/End', por lo que goose no
  # puede parsearlas. Las aplicamos directamente con psql como bootstrap,
  # y marcamos cada una en goose_db_version. Las migraciones FUTURAS deben
  # incluir los markers para que goose las maneje normalmente.
  echo "→ BD vacia: aplicando migraciones legacy como bootstrap con psql..."
  ensure_goose_table

  for f in "$GOOSE_DIR"/*.sql; do
    [ -f "$f" ] || continue
    fname=$(basename "$f")
    version=$(echo "$fname" | grep -oE '^[0-9]+' | sed 's/^0*//')
    [ -z "$version" ] && continue
    echo "  · psql ${fname}"
    # Extraer SOLO el bloque +goose Up. Cortar antes de +goose Down (si existe).
    # Y eliminar markers StatementBegin/End para psql.
    awk '
      /-- \+goose Down/ { exit }
      /-- \+goose Up/   { next }
      /-- \+goose Statement(Begin|End)/ { next }
      { print }
    ' "$f" | su -c "psql -d ${PG_DATABASE} -v ON_ERROR_STOP=1 -q" postgres 2>&1 | tail -3 || {
        echo "  ✗ Bootstrap fallo en ${fname} — continuando" >&2
      }
    stamp_migration "$version"
  done
  echo "✓ Bootstrap completado"
else
  # CASO 2 — Schema con tablas (entorno legacy o re-deploy)
  # Stampeamos las migraciones existentes como aplicadas (idempotente).
  echo "→ Schema ${APP_SCHEMA} ya tiene ${EXISTING_TABLES} tablas."
  echo "  Stampeando migraciones existentes como aplicadas (baseline idempotente)..."
  ensure_goose_table

  for f in "$GOOSE_DIR"/*.sql; do
    [ -f "$f" ] || continue
    fname=$(basename "$f")
    version=$(echo "$fname" | grep -oE '^[0-9]+' | sed 's/^0*//')
    [ -z "$version" ] && continue
    stamp_migration "$version"
  done
  echo "✓ Baseline aplicado"
fi

# Re-aplicar grants tras bootstrap (las tablas nuevas necesitan permisos)
echo "→ Re-aplicando grants tras migraciones..."
su -c "psql -d ${PG_DATABASE} <<SQL
GRANT USAGE, CREATE ON SCHEMA ${APP_SCHEMA} TO ${PG_USER};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${APP_SCHEMA} TO ${PG_USER};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${APP_SCHEMA} TO ${PG_USER};
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA ${APP_SCHEMA} TO ${PG_USER};
SQL
" postgres >/dev/null 2>&1 || true

echo "→ Ejecutando goose up desde ${GOOSE_DIR}..."
goose -dir "$GOOSE_DIR" postgres "$GOOSE_URL" up 2>&1 || {
  echo "WARN: goose up fallo (puede ser por migraciones legacy sin StatementBegin/End)"
  echo "      Las migraciones nuevas deben usar -- +goose StatementBegin / StatementEnd"
}
echo "→ Estado de migraciones:"
goose -dir "$GOOSE_DIR" postgres "$GOOSE_URL" status 2>&1 | tail -10 || true

# 5. Re-ejecutar seeds idempotentes en cada deploy
# Cada archivo en seeds/ DEBE ser idempotente (INSERT ... ON CONFLICT DO NOTHING).
# Esto permite agregar nuevos datos demo/config sin romper datos existentes del cliente.
if [ -d "$SEEDS_DIR" ]; then
  echo "→ Ejecutando seeds idempotentes desde ${SEEDS_DIR}..."
  for f in "$SEEDS_DIR"/*.sql; do
    [ -f "$f" ] || continue
    echo "  · $(basename "$f")"
    psql "$PSQL_URL" -v ON_ERROR_STOP=1 -f "$f" 2>&1 | tail -3 || {
      echo "  ✗ Fallo $(basename "$f") — continuando con el resto" >&2
    }
  done
  echo "✓ Seeds completados"
else
  echo "→ No hay carpeta seeds/ — skip"
fi

echo "✓ Deploy completado: $(date -u)"
