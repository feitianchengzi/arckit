#!/usr/bin/env python3
"""
generate_page_design.py — 页面设计覆盖规则生成

基于 MASTER.md 和页面 brief，生成 pages/{page-name}.md 覆盖规则文件。

用法:
  python3 generate_page_design.py --page-name "landing" --master-path ./design-system/MyApp/MASTER.md --brief "产品介绍页，突出核心功能和定价"
"""

import argparse
import re
from datetime import datetime
from pathlib import Path


PAGE_TEMPLATE = """# {page_name} 页面设计 — Override

> 生成时间: {date}
> 基于 MASTER: {master_path}
> ⚠️ 本文件规则优先于 MASTER.md

---

## 页面职责

{brief}

---

## 布局

{layout}

---

## 覆盖规则

### 配色覆盖

{color_overrides}

### 字体覆盖

{font_overrides}

### 间距覆盖

{spacing_overrides}

---

## Signature 元素

{signature}

---

## 交互规格

| 元素 | 交互 | 动效 |
|------|------|------|
| {element_1} | {interaction_1} | {animation_1} |

---

## 反模式

- ❌ {antipattern_1}
"""

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="页面设计覆盖规则生成")
    parser.add_argument("--page-name", required=True, help="页面名称")
    parser.add_argument("--master-path", required=True, help="MASTER.md 路径")
    parser.add_argument("--brief", required=True, help="页面职责描述")
    parser.add_argument("--output-dir", default="", help="输出目录（默认: MASTER 同级 pages/）")
    args = parser.parse_args()

    master_path = Path(args.master_path)
    now = datetime.now(get_local_tz()).strftime("%Y-%m-%d")
    U = "⚠️ [待补充]"

    content = PAGE_TEMPLATE.format(
        page_name=args.page_name, date=now,
        master_path=str(master_path), brief=args.brief,
        layout=U, color_overrides=U, font_overrides=U,
        spacing_overrides=U, signature=U,
        element_1=U, interaction_1=U, animation_1=U,
        antipattern_1="本页面禁止的特定设计做法",
    )

    if args.output_dir:
        output_dir = Path(args.output_dir)
    else:
        output_dir = master_path.parent / "pages"

    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{args.page_name}.md"
    output_path.write_text(content, encoding="utf-8")

    print(f"✅ 页面设计已生成: {output_path}")
