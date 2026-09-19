#!/usr/bin/env bash
# 新建可操作原型骨架；不覆盖已有页面，不自动认定视觉或业务事实。
# 用法: new-page-design.sh <page-name> <view-name> <platform> [interaction-dir]
set -euo pipefail
PAGE_NAME="${1:?缺少 page-name}"
VIEW_NAME="${2:?缺少 view-name}"
PLATFORM="${3:?缺少 platform}"
INTERACTION_DIR="${4:-arckit/interaction}"
case "$PAGE_NAME" in ''|*[!a-z0-9-]*|-*|*-) echo 'page-name 必须是 lowercase-kebab-case 页面名' >&2; exit 1;; esac
if [[ "$PAGE_NAME" == *--* ]]; then echo 'page-name 不允许连续连字符' >&2; exit 1; fi
case "$PLATFORM" in iOS|iPad|macOS|Web|Desktop) ;; *) echo 'platform: iOS | iPad | macOS | Web | Desktop' >&2; exit 1;; esac
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSETS="$(dirname "$SCRIPT_DIR")/assets"
# Python 只负责字面替换和文件复制，避免名称被 sed 当作表达式。
python3 - "$ASSETS" "$INTERACTION_DIR" "$PAGE_NAME" "$VIEW_NAME" "$PLATFORM" <<'PYTHON'
from pathlib import Path
from datetime import date
import html, shutil, sys
assets, root = map(Path, sys.argv[1:3])
name, view, platform = sys.argv[3:]
page = root / name
if page.exists():
    raise SystemExit(f'页面已存在，未修改: {page}')
page.mkdir(parents=True)
for source, target in [('index-template.md','INDEX.md'), ('conventions-template.md','CONVENTIONS.md'), ('wireframe-style.css','wireframe-style.css')]:
    if not (root / target).exists(): shutil.copyfile(assets / source, root / target)
values = {'PAGE_NAME': name.replace('-', ' ').title(), 'VIEW_NAME': view, 'PLATFORM': platform,
          'DATE': date.today().isoformat(), 'WIREFRAME_CSS_HREF': '../wireframe-style.css'}
for source, target in [('wireframe-page-template.html','default.html'), ('interaction-template.md','interaction.md'), ('prototype.js','prototype.js'), ('prototype.css','prototype.css')]:
    text = (assets / source).read_text()
    for key, value in values.items():
        text = text.replace('{{' + key + '}}', html.escape(value) if target.endswith('.html') else value)
    (page / target).write_text(text)
print(f'已创建原型骨架: {page}/default.html')
print('下一步：确认策略及视觉依据，替换示例行为，验证连续路径和恢复，更新说明及索引。')
print('可直接打开 default.html；需要服务时从 interaction 根启动本地静态服务器。')
PYTHON
