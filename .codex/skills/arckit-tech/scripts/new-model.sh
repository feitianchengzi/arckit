#!/usr/bin/env bash
# 新建数据模型 — 在 _shared/models/ 创建 YAML（路径即标识，无 ID）
# 用法: bash scripts/new-model.sh <entity-name> [tech-dir]
# 示例: bash scripts/new-model.sh User arckit/tech
# 注意: entity-name 建议 PascalCase（如 User、OrderItem）
set -euo pipefail

ENTITY="${1:?用法: $0 <entity-name> [tech-dir]}"
TECH_DIR="${2:-arckit/tech}"
DATE=$(date +%Y-%m-%d)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSETS="$(dirname "$SCRIPT_DIR")/assets"

INDEX_FILE="$TECH_DIR/INDEX.md"
MODELS_DIR="$TECH_DIR/_shared/models"
MODEL_FILE="$MODELS_DIR/${ENTITY}.yaml"

if [ ! -f "$INDEX_FILE" ]; then
    echo "❌ 未找到 $INDEX_FILE — 请先运行 init-tech.sh"
    exit 1
fi
if [ -f "$MODEL_FILE" ]; then
    echo "❌ 文件 $MODEL_FILE 已存在"
    exit 1
fi

mkdir -p "$MODELS_DIR"
cp "$ASSETS/model-template.yaml" "$MODEL_FILE"
if [[ "$OSTYPE" == darwin* ]]; then
    sed -i '' -e "s|{{ENTITY}}|$ENTITY|g" -e "s|{{MODEL_PATH}}|_shared/models/${ENTITY}.yaml|g" -e "s|{{DATE}}|$DATE|g" "$MODEL_FILE"
else
    sed -i -e "s|{{ENTITY}}|$ENTITY|g" -e "s|{{MODEL_PATH}}|_shared/models/${ENTITY}.yaml|g" -e "s|{{DATE}}|$DATE|g" "$MODEL_FILE"
fi

echo "✅ 数据模型创建完成: $MODEL_FILE"
echo ""
echo "下一步: 编辑 $MODEL_FILE 完善字段；更新 $INDEX_FILE _shared/models 部分；更新 _map/RELATIONS.md、feature-matrix.md"
