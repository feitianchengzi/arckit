#!/usr/bin/env python3
"""
generate_review_report.py — 代码审查报告生成

将 diff 分析结果组装为 C/I/M 分级的结构化审查报告。
对应 SKILL.md Step4 输出格式。

用法:
  python3 generate_review_report.py --diff-file diff.patch --prd-file prd.md
  cat diff.patch | python3 generate_review_report.py --stdin
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="代码审查报告生成")
    parser.add_argument("--diff-file", default="", help="Diff 文件路径")
    parser.add_argument("--prd-file", default="", help="PRD 文件路径（规格合规检查用）")
    parser.add_argument("--findings-json", default="", help="发现列表 JSON")
    parser.add_argument("--stdin", action="store_true", help="从 stdin 读取 diff")
    parser.add_argument("--output", default="", help="输出文件路径")
    args = parser.parse_args()

    # 读取 diff
    diff_content = ""
    if args.stdin:
        diff_content = sys.stdin.read()
    elif args.diff_file:
        try:
            diff_content = Path(args.diff_file).read_text(encoding="utf-8")
        except Exception:
            pass

    # 读取发现列表
    findings = []
    if args.findings_json:
        try:
            findings = json.loads(Path(args.findings_json).read_text(encoding="utf-8"))
        except Exception:
            pass

    # 统计变更文件
    changed_files = []
    for line in diff_content.split("\n"):
        if line.startswith("+++ b/") or line.startswith("--- a/"):
            f = line.split("/", 2)[-1] if "/" in line else ""
            if f and f not in changed_files:
                changed_files.append(f)

    # 按级别分类
    critical = [f for f in findings if f.get("level") == "critical"]
    important = [f for f in findings if f.get("level") == "important"]
    minor = [f for f in findings if f.get("level") == "minor"]

    if not critical:
        if not important:
            conclusion = "✅ 可合并"
        else:
            conclusion = "⚠️ 修复 Important 后可合并"
    else:
        conclusion = "❌ 需修复后重审"

    now = datetime.now(get_local_tz()).strftime("%Y-%m-%d %H:%M")
    report = f"""# 代码审查报告

## 摘要
- 审查范围: {', '.join(changed_files[:10])}{'...' if len(changed_files) > 10 else ''}
- Critical: {len(critical)} | Important: {len(important)} | Minor: {len(minor)}
- 结论: {conclusion}

## 阶段1: 规格合规
| 检查项 | 结果 | 说明 |
|--------|------|------|
| 功能完整性 | ⚠️ [待确认] | 对照PRD逐项确认 |
| 验收标准 | ⚠️ [待确认] | 每条AC是否有对应测试 |

## 阶段2: 代码质量

### 🔴 Critical
| # | 文件:行号 | 问题 | 修复建议 |
|---|----------|------|---------|
"""

    for idx, c in enumerate(critical, 1):
        report += f"| {idx} | {c.get('file', '')}:{c.get('line', '')} | {c.get('message', '')} | {c.get('suggestion', '')} |\n"

    if not critical:
        report += "| - | - | 无 | - |\n"

    report += f"""
### 🟡 Important
| # | 文件:行号 | 问题 | 修复建议 |
|---|----------|------|---------|
"""
    for idx, i in enumerate(important, 1):
        report += f"| {idx} | {i.get('file', '')}:{i.get('line', '')} | {i.get('message', '')} | {i.get('suggestion', '')} |\n"

    if not important:
        report += "| - | - | 无 | - |\n"

    report += f"""
### 🟢 Minor
| # | 文件:行号 | 问题 | 修复建议 |
|---|----------|------|---------|
"""
    for idx, m in enumerate(minor, 1):
        report += f"| {idx} | {m.get('file', '')}:{m.get('line', '')} | {m.get('message', '')} | {m.get('suggestion', '')} |\n"

    if not minor:
        report += "| - | - | 无 | - |\n"

    if args.output:
        Path(args.output).write_text(report, encoding="utf-8")
        print(f"✅ 审查报告已生成: {args.output}")
    else:
        print(report)
