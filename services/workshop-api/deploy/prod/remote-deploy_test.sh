#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_SCRIPT="$SCRIPT_DIR/remote-deploy.sh"
FIXTURE="$SCRIPT_DIR/test/fake-docker.sh"
INSTALL_FIXTURE="$SCRIPT_DIR/test/fake-install.sh"
TEST_DIR=$(mktemp -d "${TMPDIR:-/tmp}/workshop-remote-deploy.XXXXXX")

cleanup() { rm -rf -- "$TEST_DIR"; }
trap cleanup EXIT

mkdir -p "$TEST_DIR/bin"
cp "$FIXTURE" "$TEST_DIR/bin/docker"
cp "$INSTALL_FIXTURE" "$TEST_DIR/bin/install"
chmod +x "$TEST_DIR/bin/docker" "$TEST_DIR/bin/install"

prepare_files() {
  printf 'DEPLOY_BACKUP_DIR=%s/backups\nCUSTOMER_REPOS_PATH=%s/customer-repos\n' "$TEST_DIR" "$TEST_DIR" > "$TEST_DIR/app.env"
  rm -rf -- "$TEST_DIR/backups" "$TEST_DIR/customer-repos"
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
backup_line=$(line_number 'pg_dump --format=custom')
migrate_line=$(line_number 'run --rm --env-file app.env todo-service:latest ./todo migrate')
up_line=$(line_number 'compose --env-file app.env -f compose.yml up -d --no-deps --force-recreate todo-service')
[[ $load_line -lt $backup_line && $backup_line -lt $migrate_line && $migrate_line -lt $up_line ]]

prepare_files
if run_deploy env FAKE_BACKUP_FAIL=1; then
  echo 'backup failure unexpectedly succeeded' >&2
  exit 1
fi
if grep -Fq 'run --rm --env-file app.env todo-service:latest ./todo migrate' "$TEST_DIR/docker.log"; then
  echo 'migration ran after a failed backup' >&2
  exit 1
fi

prepare_files
if run_deploy env FAKE_MIGRATION_FAIL=1; then
  echo 'migration failure unexpectedly succeeded' >&2
  exit 1
fi
if grep -Fq 'compose --env-file app.env -f compose.yml up -d --no-deps --force-recreate todo-service' "$TEST_DIR/docker.log"; then
  echo 'service was stopped after a failed pre-cutover migration' >&2
  exit 1
fi

prepare_files
if run_deploy env FAKE_HEALTH_FAIL=1; then
  echo 'unhealthy candidate unexpectedly succeeded' >&2
  exit 1
fi
grep -Fq 'tag todo-service:rollback todo-service:latest' "$TEST_DIR/docker.log"
[[ $(grep -Fc 'compose --env-file app.env -f compose.yml up -d --no-deps --force-recreate todo-service' "$TEST_DIR/docker.log") -eq 2 ]]

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
