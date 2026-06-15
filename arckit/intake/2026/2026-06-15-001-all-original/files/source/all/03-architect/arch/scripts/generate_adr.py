#!/usr/bin/env python3
"""
generate_adr.py — ADR（架构决策记录）文档生成

根据决策标题、上下文和候选方案，生成标准 ADR 文档。
铁律：没有权衡分析就不能选技术。

用法:
  python3 generate_adr.py --title "使用Next.js作为前端框架" --context "需要SSR和静态生成能力" --options-json options.json
  python3 generate_adr.py --title "数据库选型" --context "需要支持高并发读写" --num 003
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path


ADR_TEMPLATE = """# ADR-{num}: {title}

## 状态

提议 | 已接受 | 已废弃 | 已替代

## 上下文

{context}

## 决策

{decision}

## 可选方案

{options}

## 权衡分析

| 维度 | {option_names} |
|------|{option_separators} |
| 开发效率 | |
| 运行性能 | |
| 团队适配 | |
| 长期维护 | |
| 社区生态 | |
| 可替代性 | |

## 结论

{conclusion}

## 后果

### 正面

- {positive_1}

### 负面

- {negative_1}

### 风险

- {risk_1}

---

> 铁律提醒：每个技术选型必须回答——选它的好处是什么、代价是什么、在什么条件下它会是错误选择。
"""

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ADR 文档生成")
    parser.add_argument("--title", required=True, help="决策标题")
    parser.add_argument("--context", required=True, help="决策上下文")
    parser.add_argument("--decision", default="", help="决策结论")
    parser.add_argument("--options-json", default="", help="候选方案 JSON 文件")
    parser.add_argument("--num", default="001", help="ADR 编号")
    parser.add_argument("--output-dir", default=".", help="输出目录")
    args = parser.parse_args()

    # 解析候选方案
    options = []
    if args.options_json:
        try:
            raw = Path(args.options_json).read_text(encoding="utf-8")
            options = json.loads(raw)
        except Exception:
            options = []
    if not options:
        options = [
            {"name": "方案A", "advantages": "⚠️ [待补充]", "disadvantages": "⚠️ [待补充]"},
            {"name": "方案B", "advantages": "⚠️ [待补充]", "disadvantages": "⚠️ [待补充]"},
        ]

    # 构建方案部分
    options_md = ""
    for opt in options:
        name = opt.get("name", "未命名方案")
        adv = opt.get("advantages", "⚠️ [待补充]")
        dis = opt.get("disadvantages", "⚠️ [待补充]")
        scene = opt.get("applicable", "⚠️ [待补充]")
        options_md += f"### {name}\n- **优势**: {adv}\n- **代价**: {dis}\n- **适用场景**: {scene}\n\n"

    option_names = " | ".join(o.get("name", "方案") for o in options)
    option_seps = " | ".join(["--------"] * len(options))

    U = "⚠️ [待补充]"
    doc = ADR_TEMPLATE.format(
        num=args.num, title=args.title, context=args.context,
        decision=args.decision or U, options=options_md,
        option_names=option_names, option_separators=option_seps,
        conclusion=U, positive_1=U, negative_1=U, risk_1=U,
    )

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    filename = f"ADR-{args.num}_{args.title.replace(' ', '_')[:50]}.md"
    output_path = output_dir / filename
    output_path.write_text(doc, encoding="utf-8")
    print(f"✅ ADR 已生成: {output_path}")
