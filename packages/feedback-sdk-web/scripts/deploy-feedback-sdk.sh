#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/deploy-feedback-sdk.py"

echo "== feedback-sdk-web deploy =="
echo "project: $PROJECT_DIR"

if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: python3 not found"
  exit 1
fi

if ! python3 -c "import oss2, dotenv" >/dev/null 2>&1; then
  echo "Installing python dependencies: oss2 python-dotenv"
  pip3 install oss2 python-dotenv
fi

echo "Building app..."
(
  cd "$PROJECT_DIR"
  npm run build
)

if [ ! -f "$PROJECT_DIR/dist/index.html" ]; then
  echo "ERROR: missing build output $PROJECT_DIR/dist/index.html"
  exit 1
fi

chmod +x "$PYTHON_SCRIPT"
PYTHONWARNINGS="ignore:urllib3 v2 only supports OpenSSL 1.1.1+" python3 "$PYTHON_SCRIPT"
