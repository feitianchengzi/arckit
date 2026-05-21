#!/usr/bin/env bash
# 新建功能规格 — 从模板复制并替换占位符（路径即标识，无 ID）
# 用法: bash scripts/new-feature.sh <module-name> <feature-name> [spec-dir]
# 示例: bash scripts/new-feature.sh user-management authentication arckit/spec
set -euo pipefail

MODULE_NAME="${1:?用法: $0 <module-name> <feature-name> [spec-dir]}"
FEATURE_NAME="${2:?缺少参数: feature-name}"
SPEC_DIR="${3:-arckit/spec}"
DATE=$(date +%Y-%m-%d)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSETS="$(dirname "$SCRIPT_DIR")/assets"

INDEX_FILE="$SPEC_DIR/INDEX.md"
FEATURE_FILE="$SPEC_DIR/$MODULE_NAME/${FEATURE_NAME}.md"

# ── 前置检查 ──
if [ ! -f "$INDEX_FILE" ]; then
    echo "❌ 未找到 $INDEX_FILE — 请先运行 init-spec.sh"
    exit 1
fi
if [ ! -d "$SPEC_DIR/$MODULE_NAME" ]; then
    echo "❌ 模块目录 $SPEC_DIR/$MODULE_NAME 不存在 — 请先运行 new-module.sh"
    exit 1
fi
if [ -f "$FEATURE_FILE" ]; then
    echo "❌ 文件 $FEATURE_FILE 已存在"
    exit 1
fi

# ── 功能标题（kebab → Title Case） ──
FEATURE_TITLE=$(echo "$FEATURE_NAME" | tr '-' ' ' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)}1')

# ── 复制并替换占位符 ──
cp "$ASSETS/feature-template.md" "$FEATURE_FILE"
if [[ "$OSTYPE" == darwin* ]]; then
    sed -i '' \
        -e "s|{{MODULE_NAME}}|$MODULE_NAME|g" \
        -e "s|{{FEATURE_NAME}}|$FEATURE_NAME|g" \
        -e "s|{{FEATURE_TITLE}}|$FEATURE_TITLE|g" \
        -e "s|{{FEATURE_PATH}}|$MODULE_NAME/${FEATURE_NAME}.md|g" \
        -e "s|{{DATE}}|$DATE|g" \
        "$FEATURE_FILE"
else
    sed -i \
        -e "s|{{MODULE_NAME}}|$MODULE_NAME|g" \
        -e "s|{{FEATURE_NAME}}|$FEATURE_NAME|g" \
        -e "s|{{FEATURE_TITLE}}|$FEATURE_TITLE|g" \
        -e "s|{{FEATURE_PATH}}|$MODULE_NAME/${FEATURE_NAME}.md|g" \
        -e "s|{{DATE}}|$DATE|g" \
        "$FEATURE_FILE"
fi

echo "✅ 功能规格创建完成: $FEATURE_FILE"
echo ""
echo "下一步:"
echo "  1. 编辑 $FEATURE_FILE 填写功能描述与用户场景"
echo "  2. 更新 $INDEX_FILE 添加 $MODULE_NAME/${FEATURE_NAME}.md 条目（含行数如 (50行)）"
echo "  3. 更新 arckit/_map/feature-matrix.md、RELATIONS.md"
