#!/usr/bin/env python3
"""
extract_from_arch.py — 从架构文档提取技术栈和编码规范

读取 arch Skill 产出的 ADR 和架构文档，提取技术选型、编码规范、模块边界。

用法:
  python3 extract_from_arch.py --adr-dir ./adr/
"""

import argparse
import json
import re
from pathlib import Path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="从架构文档提取技术栈和编码规范")
    parser.add_argument("--adr-dir", required=True, help="ADR 目录")
    args = parser.parse_args()

    adr_dir = Path(args.adr_dir)
    result = {"tech_stack": [], "coding_standards": [], "module_boundaries": [], "adr_summary": []}

    for f in sorted(adr_dir.glob("ADR-*.md")):
        try:
            content = f.read_text(encoding="utf-8")
        except Exception:
            continue

        # 提取标题
        title_match = re.search(r'# ADR-\d+:\s*(.+)', content)
        title = title_match.group(1).strip() if title_match else f.stem

        # 提取状态
        status = "提议"
        for line in content.split("\n"):
            if line.strip() in ["提议", "已接受", "已废弃", "已替代"]:
                status = line.strip()
                break

        # 提取决策
        decision = ""
        in_decision = False
        for line in content.split("\n"):
            if "## 决策" in line:
                in_decision = True
                continue
            if in_decision and line.startswith("##"):
                break
            if in_decision and line.strip():
                decision = line.strip()
                break

        result["adr_summary"].append({"file": f.name, "title": title, "status": status, "decision": decision})

        # 如果已接受，提取到技术栈
        if status == "已接受" and decision:
            result["tech_stack"].append({"adr": title, "decision": decision})

    print(json.dumps(result, ensure_ascii=False, indent=2))
