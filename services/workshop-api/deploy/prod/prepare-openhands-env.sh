#!/usr/bin/env bash

# Add safe OpenHands defaults and generate local secrets without printing them.
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE=${1:-$SCRIPT_DIR/.env.workshop.production}

[[ -f $ENV_FILE ]] || { echo "Missing production env: $ENV_FILE" >&2; exit 1; }
umask 077
chmod 600 "$ENV_FILE"

has_key() {
  grep -q "^$1=" "$ENV_FILE"
}

append_value() {
  local key=$1 value=$2
  if ! has_key "$key"; then
    printf '\n%s=%s\n' "$key" "$value" >> "$ENV_FILE"
    echo "configured $key"
  fi
}

append_secret() {
  local key=$1
  if ! has_key "$key"; then
    append_value "$key" "$(openssl rand -base64 48 | tr -d '\n')"
  fi
}

append_value OPENHANDS_ENABLED false
append_value OPENHANDS_IMAGE 'ghcr.io/openhands/agent-server:1.54.0-python@sha256:082368832a7e48087b64da38c7b2cf2442dd7621fde69f8d06ed52283ff136f8'
append_secret OH_SESSION_API_KEYS_0
append_secret OH_SECRET_KEY
append_secret OPENHANDS_CONFIG_ENCRYPTION_KEY
append_value LLM_BASE_URL https://api.deepseek.com
append_value LLM_MODEL deepseek/deepseek-chat
append_value CUSTOMER_REPOS_PATH /opt/todo/customer-repos
append_value OH_REPO_ROOT /workspace/customer-repos
append_value OH_WORKSPACE_DIR /workspace/customer-repos
append_value OH_SHARED_GID 2000
append_value WORKSHOP_CPU_LIMIT 0.5
append_value WORKSHOP_MEMORY_LIMIT 384M
append_value OPENHANDS_CPU_LIMIT 1.0
append_value OPENHANDS_MEMORY_LIMIT 1536M
append_value OPENHANDS_MIN_AVAILABLE_MB 1536
append_value OPENHANDS_MIN_SWAP_MB 2048
append_value LOCAL_BUILD_MODE host
append_value LOCAL_BUILD_GOMAXPROCS 2
append_value LOCAL_BUILD_PARALLELISM 2
append_value LOCAL_BUILD_MEMORY_LIMIT 768MiB

echo "OpenHands defaults prepared in $ENV_FILE; secrets were not printed."
echo "LLM_API_KEY is optional during staged deployment. Add it before setting OPENHANDS_ENABLED=true."
