#!/usr/bin/env bash
# 新建方案 — 从模板复制并替换占位符（路径即标识，无 ID）
# 用法: bash scripts/new-solution.sh <domain-name> <solution-name> [tech-dir]
# 示例: bash scripts/new-solution.sh user-management auth-solution arckit/tech
set -euo pipefail

DOMAIN_NAME="${1:?用法: $0 <domain-name> <solution-name> [tech-dir]}"
SOLUTION_NAME="${2:?缺少参数: solution-name}"
TECH_DIR="${3:-arckit/tech}"
DATE=$(date +%Y-%m-%d)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSETS="$(dirname "$SCRIPT_DIR")/assets"

INDEX_FILE="$TECH_DIR/INDEX.md"
SOLUTION_FILE="$TECH_DIR/$DOMAIN_NAME/${SOLUTION_NAME}.md"

if [ ! -f "$INDEX_FILE" ]; then
    echo "❌ 未找到 $INDEX_FILE — 请先运行 init-tech.sh"
    exit 1
fi
if [ ! -d "$TECH_DIR/$DOMAIN_NAME" ]; then
    echo "❌ 领域目录 $TECH_DIR/$DOMAIN_NAME 不存在 — 请先运行 new-domain.sh"
    exit 1
fi
if [ -f "$SOLUTION_FILE" ]; then
    echo "❌ 文件 $SOLUTION_FILE 已存在"
    exit 1
fi

SOLUTION_TITLE=$(echo "$SOLUTION_NAME" | tr '-' ' ' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)}1')
SOLUTION_PATH="$DOMAIN_NAME/${SOLUTION_NAME}.md"

cp "$ASSETS/solution-template.md" "$SOLUTION_FILE"
if [[ "$OSTYPE" == darwin* ]]; then
    sed -i '' \
        -e "s|{{DOMAIN_NAME}}|$DOMAIN_NAME|g" \
        -e "s|{{SOLUTION_NAME}}|$SOLUTION_NAME|g" \
        -e "s|{{SOLUTION_TITLE}}|$SOLUTION_TITLE|g" \
        -e "s|{{SOLUTION_PATH}}|$SOLUTION_PATH|g" \
        -e "s|{{DATE}}|$DATE|g" \
        "$SOLUTION_FILE"
else
    sed -i \
        -e "s|{{DOMAIN_NAME}}|$DOMAIN_NAME|g" \
        -e "s|{{SOLUTION_NAME}}|$SOLUTION_NAME|g" \
        -e "s|{{SOLUTION_TITLE}}|$SOLUTION_TITLE|g" \
        -e "s|{{SOLUTION_PATH}}|$SOLUTION_PATH|g" \
        -e "s|{{DATE}}|$DATE|g" \
        "$SOLUTION_FILE"
fi

echo "✅ 方案创建完成: $SOLUTION_FILE"
echo ""
echo "下一步: 编辑 ${SOLUTION_FILE}; 更新 ${INDEX_FILE} 添加 ${SOLUTION_PATH} 条目（含行数）; 更新 _map/RELATIONS.md、feature-matrix.md"
