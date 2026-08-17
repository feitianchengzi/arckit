#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/cleanup-bucket-root.py"

if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: python3 not found"
  exit 1
fi

if ! python3 -c "import oss2, dotenv" >/dev/null 2>&1; then
  echo "Installing python dependencies: oss2 python-dotenv"
  pip3 install oss2 python-dotenv
fi

chmod +x "$PYTHON_SCRIPT"
PYTHONWARNINGS="ignore:urllib3 v2 only supports OpenSSL 1.1.1+" python3 "$PYTHON_SCRIPT" "$@"
