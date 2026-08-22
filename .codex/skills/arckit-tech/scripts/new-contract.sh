#!/usr/bin/env bash
# 新建 API 契约 — 在 _shared/contracts/ 创建 YAML（路径即标识，无 ID）
# 用法: bash scripts/new-contract.sh <endpoint-name> [tech-dir]
# 示例: bash scripts/new-contract.sh auth-login arckit/tech
# 注意: endpoint-name 建议 kebab-case（如 auth-login、get-user）
set -euo pipefail

ENDPOINT_NAME="${1:?用法: $0 <endpoint-name> [tech-dir]}"
TECH_DIR="${2:-arckit/tech}"
DATE=$(date +%Y-%m-%d)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSETS="$(dirname "$SCRIPT_DIR")/assets"

INDEX_FILE="$TECH_DIR/INDEX.md"
CONTRACTS_DIR="$TECH_DIR/_shared/contracts"
CONTRACT_FILE="$CONTRACTS_DIR/${ENDPOINT_NAME}.yaml"

if [ ! -f "$INDEX_FILE" ]; then
    echo "❌ 未找到 $INDEX_FILE — 请先运行 init-tech.sh"
    exit 1
fi
if [ -f "$CONTRACT_FILE" ]; then
    echo "❌ 文件 $CONTRACT_FILE 已存在"
    exit 1
fi

mkdir -p "$CONTRACTS_DIR"
CONTRACT_PATH="_shared/contracts/${ENDPOINT_NAME}.yaml"
cp "$ASSETS/contract-template.yaml" "$CONTRACT_FILE"
if [[ "$OSTYPE" == darwin* ]]; then
    sed -i '' -e "s|{{ENDPOINT_NAME}}|$ENDPOINT_NAME|g" -e "s|{{CONTRACT_PATH}}|$CONTRACT_PATH|g" -e "s|{{DATE}}|$DATE|g" "$CONTRACT_FILE"
else
    sed -i -e "s|{{ENDPOINT_NAME}}|$ENDPOINT_NAME|g" -e "s|{{CONTRACT_PATH}}|$CONTRACT_PATH|g" -e "s|{{DATE}}|$DATE|g" "$CONTRACT_FILE"
fi

echo "✅ API 契约创建完成: $CONTRACT_FILE"
echo ""
echo "下一步: 编辑 $CONTRACT_FILE 完善 endpoint/request/responses；更新 $INDEX_FILE _shared/contracts 部分；更新 _map/RELATIONS.md、feature-matrix.md"
