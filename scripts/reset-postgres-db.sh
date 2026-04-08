#!/usr/bin/env bash
# Drop and recreate the local Postgres database used by Vela (docker-compose.infra.yml).
# Usage: from repo root, with the postgres container running:
#   ./scripts/reset-postgres-db.sh
# Optional: run migrations after:
#   ./scripts/reset-postgres-db.sh && pnpm migration:run

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="${ROOT}/docker-compose.infra.yml"
CONTAINER="${VELA_POSTGRES_CONTAINER:-vela-postgres}"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "Container \"$CONTAINER\" is not running. Start infra first:"
  echo "  docker compose -f docker-compose.infra.yml up -d postgres"
  exit 1
fi

echo "Dropping and recreating database \"vela\" in $CONTAINER ..."
docker exec -i "$CONTAINER" psql -U vela -d postgres -v ON_ERROR_STOP=1 <<'SQL'
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'vela' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS vela WITH (FORCE);
CREATE DATABASE vela OWNER vela;
SQL

echo "Done. Run: pnpm migration:run"
