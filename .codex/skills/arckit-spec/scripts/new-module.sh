#!/usr/bin/env bash
# 新建功能模块 — 创建模块目录
# 用法: bash scripts/new-module.sh <module-name> [spec-dir]
# 示例: bash scripts/new-module.sh user-management arckit/spec
set -euo pipefail

MODULE_NAME="${1:?用法: $0 <module-name> [spec-dir]}"
SPEC_DIR="${2:-arckit/spec}"

INDEX_FILE="$SPEC_DIR/INDEX.md"
MODULE_DIR="$SPEC_DIR/$MODULE_NAME"

if [ ! -f "$INDEX_FILE" ]; then
    echo "❌ 未找到 $INDEX_FILE — 请先运行 init-spec.sh"
    exit 1
fi
if [ -d "$MODULE_DIR" ]; then
    echo "❌ 目录 $MODULE_DIR 已存在"
    exit 1
fi

mkdir -p "$MODULE_DIR"

echo "✅ 模块创建完成: $MODULE_DIR/"
echo ""
echo "下一步:"
echo "  1. 更新 $INDEX_FILE 添加 $MODULE_NAME/ 条目"
echo "  2. 新建功能: bash scripts/new-feature.sh $MODULE_NAME <feature-name> [spec-dir]"
