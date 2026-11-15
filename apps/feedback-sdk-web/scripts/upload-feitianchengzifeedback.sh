#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_SCRIPT="$SCRIPT_DIR/deploy-feedback-sdk.sh"

echo "[deprecated] use deploy-feedback-sdk.sh"
chmod +x "$TARGET_SCRIPT"
"$TARGET_SCRIPT"
