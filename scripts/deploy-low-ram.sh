#!/usr/bin/env sh
set -eu

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
SERVICE_NAME="${SERVICE_NAME:-react-crm}"

if docker compose version >/dev/null 2>&1; then
  compose() { docker compose "$@"; }
elif command -v docker-compose >/dev/null 2>&1; then
  compose() { docker-compose "$@"; }
else
  echo "Docker Compose is not available." >&2
  exit 1
fi

export DOCKER_BUILDKIT="${DOCKER_BUILDKIT:-1}"
export COMPOSE_DOCKER_CLI_BUILD="${COMPOSE_DOCKER_CLI_BUILD:-1}"

if [ -r /proc/meminfo ]; then
  mem_total_kb="$(awk '/MemTotal/ { print $2 }' /proc/meminfo)"
  swap_total_kb="$(awk '/SwapTotal/ { print $2 }' /proc/meminfo)"
  total_mb=$(( (mem_total_kb + swap_total_kb) / 1024 ))

  if [ "$total_mb" -lt 4096 ]; then
    echo "Warning: RAM + swap is about ${total_mb} MB. Add swap if the build is still killed." >&2
  fi
fi

echo "Stopping ${SERVICE_NAME} to free RAM before build..."
compose -f "$COMPOSE_FILE" down --remove-orphans

echo "Building ${SERVICE_NAME} in low-memory mode..."
if compose -f "$COMPOSE_FILE" build "$SERVICE_NAME"; then
  echo "Starting ${SERVICE_NAME}..."
  compose -f "$COMPOSE_FILE" up -d "$SERVICE_NAME"
  echo "Deployment finished."
else
  echo "Build failed. Trying to start the previous image again..." >&2
  compose -f "$COMPOSE_FILE" up -d "$SERVICE_NAME" || true
  exit 1
fi

docker image prune -f >/dev/null 2>&1 || true
