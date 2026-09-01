#!/usr/bin/env bash

set -u
printf '%s\n' "$*" >> "$FAKE_DOCKER_LOG"

case ${1:-} in
  compose)
    exit 0
    ;;
  inspect)
    if [[ ${3:-} == *'.Image'* ]]; then
      printf 'sha256:old\n'
    elif [[ ${3:-} == *'.State.Health'* ]]; then
      if [[ ${FAKE_ROLLBACK_HEALTH_MISSING:-0} == 1 ]] && grep -Fq 'tag todo-service:rollback todo-service:latest' "$FAKE_DOCKER_LOG"; then
        printf 'missing\n'
      elif [[ ${FAKE_HEALTH_FAIL:-0} == 1 ]] && ! grep -Fq 'tag todo-service:rollback todo-service:latest' "$FAKE_DOCKER_LOG"; then
        printf 'unhealthy\n'
      else
        printf 'healthy\n'
      fi
    fi
    exit 0
    ;;
  exec)
    [[ ${FAKE_LEGACY_HTTP_FAIL:-0} != 1 ]]
    attempts=$(grep -Fc 'exec todo-service sh -c' "$FAKE_DOCKER_LOG")
    [[ $attempts -gt ${FAKE_LEGACY_HTTP_FAILURES:-0} ]]
    exit
    ;;
  run)
    [[ ${FAKE_MIGRATION_FAIL:-0} != 1 ]]
    exit
    ;;
  load|tag|logs)
    exit 0
    ;;
esac

echo "unexpected fake docker command: $*" >&2
exit 1
