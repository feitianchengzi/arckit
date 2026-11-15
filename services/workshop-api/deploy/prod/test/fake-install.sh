#!/usr/bin/env bash

set -u
printf 'install %s\n' "$*" >> "$FAKE_DOCKER_LOG"
target=${!#}
mkdir -p -- "$target"
exit 0
