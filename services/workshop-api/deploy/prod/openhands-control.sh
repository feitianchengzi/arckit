#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ENV_FILE=${ENV_FILE:-.env.workshop.production}
BASE_COMPOSE=${BASE_COMPOSE:-docker-compose.prod.yml}
OPENHANDS_COMPOSE=${OPENHANDS_COMPOSE:-docker-compose.openhands.yml}
command_name=${1:-preflight}

[[ -f $ENV_FILE && -f $BASE_COMPOSE && -f $OPENHANDS_COMPOSE ]] || {
  echo "Missing production env or compose file in $SCRIPT_DIR" >&2
  exit 1
}

# shellcheck disable=SC1090
source "$ENV_FILE"

compose=(docker compose --env-file "$ENV_FILE" -f "$BASE_COMPOSE" -f "$OPENHANDS_COMPOSE")
repo_path=${CUSTOMER_REPOS_PATH:-/opt/todo/customer-repos}
shared_gid=${OH_SHARED_GID:-2000}
minimum_available_mb=${OPENHANDS_MIN_AVAILABLE_MB:-1536}
minimum_swap_mb=${OPENHANDS_MIN_SWAP_MB:-2048}

validate_secret() {
  local name=$1 value=${!1:-}
  [[ ${#value} -ge 32 && $value != REPLACE_* ]] || {
    echo "$name must be a stable secret of at least 32 characters" >&2
    exit 1
  }
}

preflight() {
  [[ $repo_path =~ ^/[a-zA-Z0-9._/-]+$ ]] || { echo "CUSTOMER_REPOS_PATH must be a safe absolute path" >&2; exit 1; }
  [[ $shared_gid =~ ^[1-9][0-9]*$ ]] || { echo "OH_SHARED_GID must be a positive numeric group id" >&2; exit 1; }
  [[ ${OPENHANDS_IMAGE:-} == *@sha256:* ]] || {
    echo "OPENHANDS_IMAGE must be pinned by sha256 digest; latest tags are not allowed" >&2
    exit 1
  }
  validate_secret OH_SESSION_API_KEYS_0
  validate_secret OH_SECRET_KEY
  validate_secret OPENHANDS_CONFIG_ENCRYPTION_KEY
  if [[ -z ${LLM_API_KEY:-} || ${LLM_API_KEY:-} == REPLACE_* ]]; then
    echo "Warning: server LLM_API_KEY is not configured. Requests stay on the local fallback until an owner/admin saves a project key in Feedback Console." >&2
  fi
  [[ ${OH_REPO_ROOT:-} == /workspace/customer-repos ]] || {
    echo "OH_REPO_ROOT must be /workspace/customer-repos" >&2
    exit 1
  }
  [[ ${OH_WORKSPACE_DIR:-} == /workspace/customer-repos ]] || {
    echo "OH_WORKSPACE_DIR must be /workspace/customer-repos" >&2
    exit 1
  }

  local available_mb swap_mb
  available_mb=$(awk '/MemAvailable:/ {print int(($2 + 1023) / 1024)}' /proc/meminfo)
  swap_mb=$(awk '/SwapTotal:/ {print int(($2 + 1023) / 1024)}' /proc/meminfo)
  ((available_mb >= minimum_available_mb)) || {
    echo "Insufficient available memory: ${available_mb}MiB < ${minimum_available_mb}MiB" >&2
    exit 1
  }
  ((swap_mb >= minimum_swap_mb)) || {
    echo "Insufficient swap safety margin: ${swap_mb}MiB < ${minimum_swap_mb}MiB" >&2
    exit 1
  }

  install -d -o root -g "$shared_gid" -m 2770 "$repo_path"
  "${compose[@]}" config --quiet
  echo "OpenHands preflight passed: available=${available_mb}MiB swap=${swap_mb}MiB repos=$repo_path"
}

wait_healthy() {
  local attempt status
  for ((attempt = 1; attempt <= 30; attempt += 1)); do
    status=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' openhands-agent 2>/dev/null || true)
    [[ $status == healthy ]] && return 0
    [[ $status == unhealthy ]] && break
    sleep 5
  done
  docker logs --tail 80 openhands-agent >&2 || true
  return 1
}

case $command_name in
  preflight)
    preflight
    ;;
  start)
    preflight
    if ! docker image inspect "$OPENHANDS_IMAGE" >/dev/null 2>&1; then
      "${compose[@]}" pull openhands-agent
    fi
    "${compose[@]}" up -d openhands-agent
    wait_healthy
    echo "OpenHands is healthy on the internal workshop network"
    ;;
  status)
    "${compose[@]}" ps openhands-agent
    docker stats --no-stream openhands-agent 2>/dev/null || true
    ;;
  logs)
    "${compose[@]}" logs --tail 120 openhands-agent
    ;;
  stop)
    "${compose[@]}" stop openhands-agent
    ;;
  *)
    echo "Usage: $0 {preflight|start|status|logs|stop}" >&2
    exit 2
    ;;
esac
