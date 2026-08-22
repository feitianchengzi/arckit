#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_SCRIPT="$SCRIPT_DIR/remote-deploy.sh"
FIXTURE="$SCRIPT_DIR/test/fake-docker.sh"
TEST_DIR=$(mktemp -d "${TMPDIR:-/tmp}/workshop-remote-deploy.XXXXXX")

cleanup() { rm -rf -- "$TEST_DIR"; }
trap cleanup EXIT

mkdir -p "$TEST_DIR/bin"
cp "$FIXTURE" "$TEST_DIR/bin/docker"
chmod +x "$TEST_DIR/bin/docker"

prepare_files() {
  : > "$TEST_DIR/app.env"
  : > "$TEST_DIR/compose.yml"
  : > "$TEST_DIR/image.tar"
  : > "$TEST_DIR/docker.log"
}

run_deploy() {
  (
    cd "$TEST_DIR"
    PATH="$TEST_DIR/bin:$PATH" \
      FAKE_DOCKER_LOG="$TEST_DIR/docker.log" \
      DEPLOY_COMPOSE_COMMAND=plugin \
      DEPLOY_HEALTH_ATTEMPTS=2 \
      DEPLOY_HEALTH_INTERVAL_SECONDS=0 \
      "$@" bash "$REMOTE_SCRIPT" app.env compose.yml image.tar todo-service latest todo-service
  )
}

line_number() {
  grep -nF "$1" "$TEST_DIR/docker.log" | head -n 1 | cut -d: -f1
}

prepare_files
run_deploy env
load_line=$(line_number 'load -i image.tar')
migrate_line=$(line_number 'run --rm --env-file app.env todo-service:latest ./todo migrate')
down_line=$(line_number 'compose --env-file app.env -f compose.yml down')
up_line=$(line_number 'compose --env-file app.env -f compose.yml up -d')
[[ $load_line -lt $migrate_line && $migrate_line -lt $down_line && $down_line -lt $up_line ]]

prepare_files
if run_deploy env FAKE_MIGRATION_FAIL=1; then
  echo 'migration failure unexpectedly succeeded' >&2
  exit 1
fi
if grep -Fq 'compose --env-file app.env -f compose.yml down' "$TEST_DIR/docker.log"; then
  echo 'service was stopped after a failed pre-cutover migration' >&2
  exit 1
fi

prepare_files
if run_deploy env FAKE_HEALTH_FAIL=1; then
  echo 'unhealthy candidate unexpectedly succeeded' >&2
  exit 1
fi
grep -Fq 'tag todo-service:rollback todo-service:latest' "$TEST_DIR/docker.log"
[[ $(grep -Fc 'compose --env-file app.env -f compose.yml up -d' "$TEST_DIR/docker.log") -eq 2 ]]

prepare_files
if run_deploy env FAKE_HEALTH_FAIL=1 FAKE_ROLLBACK_HEALTH_MISSING=1 FAKE_LEGACY_HTTP_FAILURES=1 2>"$TEST_DIR/legacy-rollback.err"; then
  echo 'unhealthy candidate unexpectedly succeeded' >&2
  exit 1
fi
[[ $(grep -Fc 'exec todo-service sh -c' "$TEST_DIR/docker.log") -eq 2 ]]
if grep -Fq 'manual intervention is required' "$TEST_DIR/legacy-rollback.err"; then
  echo 'healthy legacy rollback incorrectly requested manual intervention' >&2
  exit 1
fi

echo 'remote deployment ordering and rollback tests passed'
