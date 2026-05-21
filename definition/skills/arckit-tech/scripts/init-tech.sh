#!/usr/bin/env bash
# 初始化 Tech 目录 — 创建 INDEX、CONVENTIONS、_shared/models、_shared/contracts、_archive、_spikes
# 用法: bash scripts/init-tech.sh <project-name> [tech-dir]
# 示例: bash scripts/init-tech.sh "MyApp" arckit/tech
set -euo pipefail

PROJECT_NAME="${1:?用法: $0 <project-name> [tech-dir]}"
TECH_DIR="${2:-arckit/tech}"
DATE=$(date +%Y-%m-%d)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSETS="$(dirname "$SCRIPT_DIR")/assets"

if [ -f "$TECH_DIR/INDEX.md" ] && [ -f "$TECH_DIR/CONVENTIONS.md" ]; then
    echo "⚠️  $TECH_DIR 已存在 INDEX.md 与 CONVENTIONS.md，跳过"
    exit 0
fi

mkdir -p "$TECH_DIR/_shared/models" "$TECH_DIR/_shared/contracts" "$TECH_DIR/_archive" "$TECH_DIR/_spikes"

copy_and_replace() {
    local src="$1" dst="$2"
    cp "$src" "$dst"
    if [[ "$OSTYPE" == darwin* ]]; then
        sed -i '' -e "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" -e "s|{{DATE}}|$DATE|g" "$dst"
    else
        sed -i -e "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" -e "s|{{DATE}}|$DATE|g" "$dst"
    fi
}

[ ! -f "$TECH_DIR/INDEX.md" ]       && copy_and_replace "$ASSETS/index-template.md"       "$TECH_DIR/INDEX.md"
[ ! -f "$TECH_DIR/CONVENTIONS.md" ] && copy_and_replace "$ASSETS/conventions-template.md" "$TECH_DIR/CONVENTIONS.md"

echo "✅ Tech 初始化完成: $TECH_DIR/"
echo "   - INDEX.md"
echo "   - CONVENTIONS.md"
echo "   - _shared/models/"
echo "   - _shared/contracts/"
echo "   - _archive/ _spikes/"
echo ""
echo "下一步: 新建领域/方案/模型/契约 — 见 SKILL 操作入口与 scripts/"
