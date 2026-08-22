#!/usr/bin/env bash
# 初始化 Design System — 创建 _library/ 目录结构，从模板复制基础文件
# 用法: bash scripts/init-design-system.sh <project-name> [visual-dir]
# 示例: bash scripts/init-design-system.sh "MyApp" arckit/visual
set -euo pipefail

PROJECT_NAME="${1:?用法: $0 <project-name> [visual-dir]}"
VISUAL_DIR="${2:-arckit/visual}"
DATE=$(date +%Y-%m-%d)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSETS="$(dirname "$SCRIPT_DIR")/assets"

# ── 检查 ──
if [ -f "$VISUAL_DIR/_library/brief.md" ]; then
    echo "⚠️  $VISUAL_DIR/_library/brief.md 已存在，跳过（避免覆盖）"
    exit 0
fi

# ── 创建目录 ──
mkdir -p "$VISUAL_DIR/_library"
mkdir -p "$VISUAL_DIR/themes"
mkdir -p "$VISUAL_DIR/_archive"

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
copy_and_replace "$ASSETS/brief-template.md"              "$VISUAL_DIR/_library/brief.md"
copy_and_replace "$ASSETS/design-tokens-template.yaml"    "$VISUAL_DIR/_library/design-tokens.yaml"
copy_and_replace "$ASSETS/component-catalog-template.yaml" "$VISUAL_DIR/_library/component-catalog.yaml"
copy_and_replace "$ASSETS/style-preview-template.html"    "$VISUAL_DIR/_library/style-preview.html"
cp "$ASSETS/preview-server.py" "$VISUAL_DIR/_library/preview-server.py"
chmod +x "$VISUAL_DIR/_library/preview-server.py"

[ ! -f "$VISUAL_DIR/INDEX.md" ]       && cp "$ASSETS/index-template.md"       "$VISUAL_DIR/INDEX.md"
[ ! -f "$VISUAL_DIR/CONVENTIONS.md" ] && cp "$ASSETS/conventions-template.md"  "$VISUAL_DIR/CONVENTIONS.md"

echo "✅ Design System 初始化完成: $VISUAL_DIR/_library/"
echo "   - brief.md"
echo "   - design-tokens.yaml"
echo "   - component-catalog.yaml"
echo "   - style-preview.html"
echo "   - preview-server.py (预览服务器)"
echo "   - INDEX.md"
echo "   - CONVENTIONS.md"
echo ""
echo "下一步:"
echo "  1. 编辑 brief.md 填写品牌方向与视觉策略"
echo "  2. 根据视觉策略调整 design-tokens.yaml 与 component-catalog.yaml"
echo "  3. 运行预览服务器打开 style-preview.html 审查视觉投影："
echo "     cd $VISUAL_DIR/_library && python3 preview-server.py"
echo "     （服务器自动选择可用端口并打开浏览器）"
