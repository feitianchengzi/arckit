#!/usr/bin/env bash
# 新建页面设计 — 从模板复制并替换占位符（路径即标识，无 ID）
# 用法: bash scripts/new-page-design.sh <page-name> <view-name> <platform> [interaction-dir]
# 示例: bash scripts/new-page-design.sh favorites-list FavoritesView iOS
#        bash scripts/new-page-design.sh main-dashboard MainDashboard macOS arckit/interaction
# platform: iOS | iPad | macOS
set -euo pipefail

PAGE_NAME="${1:?用法: $0 <page-name> <view-name> <platform> [interaction-dir]}"
VIEW_NAME="${2:?缺少参数: view-name}"
PLATFORM="${3:?缺少参数: platform (iOS|iPad|macOS)}"
INTERACTION_DIR="${4:-arckit/interaction}"
DATE=$(date +%Y-%m-%d)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSETS="$(dirname "$SCRIPT_DIR")/assets"

INDEX_FILE="$INTERACTION_DIR/INDEX.md"
CONVENTIONS_FILE="$INTERACTION_DIR/CONVENTIONS.md"
STYLE_FILE="$INTERACTION_DIR/wireframe-style.css"
PAGE_DIR="$INTERACTION_DIR/$PAGE_NAME"

# ── interaction 根目录自举 ──
mkdir -p "$INTERACTION_DIR"
[ ! -f "$INDEX_FILE" ] && cp "$ASSETS/index-template.md" "$INDEX_FILE"
[ ! -f "$CONVENTIONS_FILE" ] && cp "$ASSETS/conventions-template.md" "$CONVENTIONS_FILE"
[ ! -f "$STYLE_FILE" ] && cp "$ASSETS/wireframe-style.css" "$STYLE_FILE"

# ── 前置检查 ──
if [ -d "$PAGE_DIR" ]; then
    echo "❌ 目录 $PAGE_DIR 已存在"
    exit 1
fi

# ── 页面标题（kebab → Title Case） ──
PAGE_TITLE=$(echo "$PAGE_NAME" | tr '-' ' ' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)}1')

# ── 创建目录 ──
mkdir -p "$PAGE_DIR"

# ── 相对路径：default.html 在 INTERACTION_DIR/PAGE_NAME/ 下，需回退到 interaction 根取 wireframe-style.css ──
# PAGE_NAME 可为 "arckit-intro"（1 层）或 "auth-flow/login"（2 层），层数 = path 段数
DEPTH=$(echo "$PAGE_NAME" | awk -F'/' '{print NF}')
[ "${DEPTH:-0}" -lt 1 ] && DEPTH=1
RELATIVE_PREFIX=$(printf '../%.0s' $(seq 1 "$DEPTH"))
css_href="${RELATIVE_PREFIX}wireframe-style.css"

# ── 占位符替换函数 ──
copy_and_replace() {
    local src="$1" dst="$2"
    cp "$src" "$dst"
    local css_href="$css_href"
    if [[ "$OSTYPE" == darwin* ]]; then
        sed -i '' \
            -e "s|{{PAGE_NAME}}|$PAGE_TITLE|g" \
            -e "s|{{VIEW_NAME}}|$VIEW_NAME|g" \
            -e "s|{{PLATFORM}}|$PLATFORM|g" \
            -e "s|{{DATE}}|$DATE|g" \
            -e "s|{{WIREFRAME_CSS_HREF}}|$css_href|g" \
            "$dst"
    else
        sed -i \
            -e "s|{{PAGE_NAME}}|$PAGE_TITLE|g" \
            -e "s|{{VIEW_NAME}}|$VIEW_NAME|g" \
            -e "s|{{PLATFORM}}|$PLATFORM|g" \
            -e "s|{{DATE}}|$DATE|g" \
            -e "s|{{WIREFRAME_CSS_HREF}}|$css_href|g" \
            "$dst"
    fi
}

# ── 从模板复制 ──
copy_and_replace "$ASSETS/wireframe-page-template.html"  "$PAGE_DIR/default.html"
copy_and_replace "$ASSETS/interaction-template.md"       "$PAGE_DIR/interaction.md"

echo "✅ 页面设计创建完成: $PAGE_DIR/"
echo "   - default.html"
echo "   - interaction.md"
echo ""
echo "下一步:"
echo "  1. 编辑 interaction.md 填写交互策略（核心任务、主路径、状态流、反馈与恢复）"
echo "  2. 编辑 default.html 填充各状态的 UI 内容，确保线框投影交互策略"
echo "  3. 补齐 interaction.md 的规范章节，并做投影一致性自查"
echo "  4. 更新 $INDEX_FILE 添加 $PAGE_NAME 条目（含行数）"
echo "  5. 更新 arckit/_map/RELATIONS.md 和 feature-matrix.md"
