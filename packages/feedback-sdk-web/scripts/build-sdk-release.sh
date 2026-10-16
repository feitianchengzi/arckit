#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

version=${1:-}
if [[ ! $version =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$ ]]; then
  echo "Usage: $0 <semantic-version>" >&2
  exit 2
fi

build_id=${VITE_BUILD_ID:-$(date -u +%Y%m%d%H%M%S)}
source_commit=${SOURCE_COMMIT:-$(git -C "$PROJECT_DIR" rev-parse HEAD 2>/dev/null || true)}
public_base="/sdk-releases/$version"

echo "Building immutable Feedback SDK release $version"
echo "base: $public_base"
echo "build_id: $build_id"
echo "source_commit: ${source_commit:-unknown}"

cd "$PROJECT_DIR"
NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1024}" \
VITE_PUBLIC_BASE="$public_base" \
VITE_SDK_VERSION="$version" \
VITE_BUILD_ID="$build_id" \
npm run build:check

echo "Release build ready: $PROJECT_DIR/dist"
