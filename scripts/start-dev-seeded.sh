#!/usr/bin/env bash
set -euo pipefail

choose_port() {
  local primary="$1"
  local fallback="$2"

  if lsof -iTCP:"${primary}" -sTCP:LISTEN >/dev/null 2>&1; then
    if lsof -iTCP:"${fallback}" -sTCP:LISTEN >/dev/null 2>&1; then
      echo ""
    else
      echo "${fallback}"
    fi
  else
    echo "${primary}"
  fi
}

FRONTEND_PORT="$(choose_port 7001 7002)"
BACKEND_PORT="$(choose_port 7003 7004)"
POSTGRES_PORT="$(choose_port 7005 7006)"
REDIS_PORT="$(choose_port 7007 7008)"

if [[ -z "${FRONTEND_PORT}" || -z "${BACKEND_PORT}" || -z "${POSTGRES_PORT}" || -z "${REDIS_PORT}" ]]; then
  echo "Error: no hay puertos disponibles en los rangos 7001-7008 requeridos."
  exit 1
fi

echo "Puertos seleccionados:"
echo "- Frontend: ${FRONTEND_PORT}"
echo "- Backend:  ${BACKEND_PORT}"
echo "- Postgres: ${POSTGRES_PORT}"
echo "- Redis:    ${REDIS_PORT}"

export FRONTEND_PORT BACKEND_PORT POSTGRES_PORT REDIS_PORT

docker compose -f docker-compose.dev.yml up -d --build postgres redis
docker compose -f docker-compose.dev.yml run --rm backend npm run prisma:migrate:deploy

if ! docker compose -f docker-compose.dev.yml run --rm backend npm run prisma:seed; then
  echo "Seed fallo con el esquema actual. Intentando sincronizar esquema (db push) y repetir seed..."
  docker compose -f docker-compose.dev.yml run --rm backend npm run prisma:push
  docker compose -f docker-compose.dev.yml run --rm backend npm run prisma:seed
fi

docker compose -f docker-compose.dev.yml up -d backend frontend

echo "Listo."
echo "- Frontend: http://localhost:${FRONTEND_PORT}"
echo "- Backend:  http://localhost:${BACKEND_PORT}/api"
echo "- Health:   http://localhost:${BACKEND_PORT}/api/health"
