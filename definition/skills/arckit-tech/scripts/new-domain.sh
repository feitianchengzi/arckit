#!/usr/bin/env bash
# 新建技术领域 — 创建领域目录
# 用法: bash scripts/new-domain.sh <domain-name> [tech-dir]
# 示例: bash scripts/new-domain.sh user-management arckit/tech
set -euo pipefail

DOMAIN_NAME="${1:?用法: $0 <domain-name> [tech-dir]}"
TECH_DIR="${2:-arckit/tech}"

INDEX_FILE="$TECH_DIR/INDEX.md"
DOMAIN_DIR="$TECH_DIR/$DOMAIN_NAME"

if [ ! -f "$INDEX_FILE" ]; then
    echo "❌ 未找到 $INDEX_FILE — 请先运行 init-tech.sh"
    exit 1
fi
if [ -d "$DOMAIN_DIR" ]; then
    echo "❌ 目录 $DOMAIN_DIR 已存在"
    exit 1
fi

mkdir -p "$DOMAIN_DIR"

echo "✅ 领域创建完成: $DOMAIN_DIR/"
echo ""
echo "下一步: 更新 $INDEX_FILE 添加 $DOMAIN_NAME/ 条目；新建方案: bash scripts/new-solution.sh $DOMAIN_NAME <solution-name> [tech-dir]"
