#!/usr/bin/env bash
# 初始化 Spec 目录 — 创建 INDEX、GLOSSARY、CONVENTIONS、_archive
# 用法: bash scripts/init-spec.sh <project-name> [spec-dir]
# 示例: bash scripts/init-spec.sh "MyApp" arckit/spec
set -euo pipefail

PROJECT_NAME="${1:?用法: $0 <project-name> [spec-dir]}"
SPEC_DIR="${2:-arckit/spec}"
DATE=$(date +%Y-%m-%d)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSETS="$(dirname "$SCRIPT_DIR")/assets"

# ── 检查 ──
if [ -f "$SPEC_DIR/INDEX.md" ] && [ -f "$SPEC_DIR/GLOSSARY.md" ]; then
    echo "⚠️  $SPEC_DIR 已存在 INDEX.md 与 GLOSSARY.md，跳过（避免覆盖）"
    exit 0
fi

# ── 创建目录 ──
mkdir -p "$SPEC_DIR"
mkdir -p "$SPEC_DIR/_archive"

# ── 占位符替换函数 ──
copy_and_replace() {
    local src="$1" dst="$2"
    cp "$src" "$dst"
    if [[ "$OSTYPE" == darwin* ]]; then
        sed -i '' -e "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" -e "s|{{DATE}}|$DATE|g" "$dst"
    else
        sed -i -e "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" -e "s|{{DATE}}|$DATE|g" "$dst"
    fi
}

# ── 从模板复制 ──
[ ! -f "$SPEC_DIR/INDEX.md" ]       && copy_and_replace "$ASSETS/index-template.md"       "$SPEC_DIR/INDEX.md"
[ ! -f "$SPEC_DIR/GLOSSARY.md" ]     && copy_and_replace "$ASSETS/glossary-template.md"   "$SPEC_DIR/GLOSSARY.md"
[ ! -f "$SPEC_DIR/CONVENTIONS.md" ]  && copy_and_replace "$ASSETS/conventions-template.md" "$SPEC_DIR/CONVENTIONS.md"

echo "✅ Spec 初始化完成: $SPEC_DIR/"
echo "   - INDEX.md"
echo "   - GLOSSARY.md"
echo "   - CONVENTIONS.md"
echo "   - _archive/"
echo ""
echo "下一步:"
echo "  1. 编辑 INDEX.md 按树形添加模块与功能条目"
echo "  2. 新建模块: bash scripts/new-module.sh <module-name> [spec-dir]"
echo "  3. 新建功能: bash scripts/new-feature.sh <module-name> <feature-name> [spec-dir]"
