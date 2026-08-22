#!/usr/bin/env bash

set -Eeuo pipefail

usage() {
  echo "Usage: $0 <env-file> <compose-file> <image-tar> <image-name> <image-tag> [container-name]" >&2
}

[[ $# -ge 5 && $# -le 6 ]] || { usage; exit 2; }

env_file=$1
compose_file=$2
image_tar=$3
image_name=$4
image_tag=$5
container_name=${6:-todo-service}
health_attempts=${DEPLOY_HEALTH_ATTEMPTS:-24}
health_interval=${DEPLOY_HEALTH_INTERVAL_SECONDS:-5}

for file in "$env_file" "$compose_file" "$image_tar"; do
  [[ $file != */* && -f $file ]] || { echo "Invalid or missing deployment file: $file" >&2; exit 2; }
done
[[ $image_name =~ ^[a-zA-Z0-9._/-]+$ ]] || { echo "Invalid image name" >&2; exit 2; }
[[ $image_tag =~ ^[a-zA-Z0-9._-]+$ ]] || { echo "Invalid image tag" >&2; exit 2; }
[[ $container_name =~ ^[a-zA-Z0-9._-]+$ ]] || { echo "Invalid container name" >&2; exit 2; }
[[ $health_attempts =~ ^[1-9][0-9]*$ ]] || { echo "Invalid health attempt count" >&2; exit 2; }
[[ $health_interval =~ ^[0-9]+$ ]] || { echo "Invalid health interval" >&2; exit 2; }

if [[ ${DEPLOY_COMPOSE_COMMAND:-} == plugin ]]; then
  compose=(docker compose)
elif [[ ${DEPLOY_COMPOSE_COMMAND:-} == standalone ]]; then
  compose=(docker-compose)
elif command -v docker-compose >/dev/null 2>&1; then
  compose=(docker-compose)
elif docker compose version >/dev/null 2>&1; then
  compose=(docker compose)
else
  echo "docker compose is required" >&2
  exit 1
fi

full_image="${image_name}:${image_tag}"
rollback_image="${image_name}:rollback"
old_image_id=$(docker inspect --format '{{.Image}}' "$container_name" 2>/dev/null || true)
cutover_started=false

cleanup() {
  rm -f -- "$image_tar"
}
trap cleanup EXIT

compose_run() {
  IMAGE_NAME=$image_name IMAGE_TAG=$image_tag "${compose[@]}" --env-file "$env_file" -f "$compose_file" "$@"
}

wait_until_healthy() {
  local attempt status
  for ((attempt = 1; attempt <= health_attempts; attempt += 1)); do
    status=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "$container_name" 2>/dev/null || true)
    if [[ $status == healthy ]]; then
      return 0
    fi
    if [[ $status == unhealthy ]]; then
      docker logs --tail 30 "$container_name" >&2 || true
      return 1
    fi
    if [[ $status == missing ]] && docker exec "$container_name" sh -c \
      'wget -q -O /dev/null "http://127.0.0.1:${PORT:-8081}/${SERVICE_NAME:-workshop}/v1/public/health"' >/dev/null 2>&1; then
      return 0
    fi
    sleep "$health_interval"
  done
  docker logs --tail 30 "$container_name" >&2 || true
  return 1
}

rollback() {
  echo "Deployment failed after cutover; restoring the previous service image." >&2
  compose_run down >/dev/null 2>&1 || true
  if [[ -n $old_image_id ]]; then
    docker tag "$rollback_image" "$full_image"
    compose_run up -d
    wait_until_healthy || echo "Previous image restart did not become healthy; manual intervention is required." >&2
  fi
}

on_error() {
  local exit_code=$?
  if [[ $cutover_started == true ]]; then
    trap - ERR
    set +e
    rollback
  fi
  exit "$exit_code"
}
trap on_error ERR

if [[ -n $old_image_id ]]; then
  docker tag "$old_image_id" "$rollback_image"
fi

echo "Loading candidate image $full_image"
docker load -i "$image_tar"

echo "Applying idempotent database migration before service cutover"
docker run --rm --env-file "$env_file" "$full_image" ./todo migrate

echo "Switching service container"
cutover_started=true
compose_run down >/dev/null 2>&1 || true
compose_run up -d

if ! wait_until_healthy; then
  cutover_started=false
  rollback
  exit 1
fi

cutover_started=false
echo "Deployment healthy: $full_image"
