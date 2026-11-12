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
sdk_contract=${VITE_SDK_CONTRACT:-v2}
supported_contracts=${VITE_SDK_SUPPORTED_CONTRACTS:-v1,v2}
release_channel=${SDK_RELEASE_CHANNEL:-}
policy_file=${SDK_RELEASE_POLICY_FILE:-$PROJECT_DIR/config/sdk-release-policy.json}

if [[ -z $release_channel ]]; then
  echo "SDK_RELEASE_CHANNEL is required for managed release builds" >&2
  exit 2
fi

parent_origins=$(python3 "$SCRIPT_DIR/sdk_release.py" policy-origins \
  --channel "$release_channel" \
  --policy-file "$policy_file")

if [[ ! $sdk_contract =~ ^v[1-9][0-9]*$ ]]; then
  echo "Unsupported VITE_SDK_CONTRACT: $sdk_contract" >&2
  exit 2
fi

echo "Building immutable Feedback SDK release $version"
echo "base: $public_base"
echo "build_id: $build_id"
echo "source_commit: ${source_commit:-unknown}"
echo "product_contract: $sdk_contract"
echo "supported_contracts: $supported_contracts"
echo "release_channel: $release_channel"
echo "parent_origins: $parent_origins"

cd "$PROJECT_DIR"
NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1024}" \
VITE_PUBLIC_BASE="$public_base" \
VITE_SDK_VERSION="$version" \
VITE_BUILD_ID="$build_id" \
VITE_SDK_CONTRACT="$sdk_contract" \
VITE_SDK_SUPPORTED_CONTRACTS="$supported_contracts" \
VITE_SDK_PARENT_ORIGINS="$parent_origins" \
npm run build:check

python3 "$SCRIPT_DIR/sdk_release.py" validate-dist \
  --version "$version" \
  --dist-dir "$PROJECT_DIR/dist" \
  --compatible-contracts "$supported_contracts" \
  --source-commit "$source_commit" \
  --parent-origins "$parent_origins"

echo "Release build ready: $PROJECT_DIR/dist"
