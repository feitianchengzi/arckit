#!/usr/bin/env python3
"""
debug_report.py — 调试报告生成

将问题现象、根因分析、证据链、修复方案组装为结构化调试报告。
对应 SKILL.md 模式A 四阶段流程的输出。

用法:
  python3 debug_report.py --issue "500错误频发" --evidence-dir ./evidence
"""

import argparse
import json
from datetime import datetime
from pathlib import Path


def get_local_tz():
    return datetime.now().astimezone().tzinfo


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="调试报告生成")
    parser.add_argument("--issue", required=True, help="问题描述")
    parser.add_argument("--root-cause", default="", help="根因")
    parser.add_argument("--fix", default="", help="修复方案")
    parser.add_argument("--evidence-dir", default="", help="证据目录")
    parser.add_argument("--output", default="", help="输出文件路径")
    args = parser.parse_args()

    now = datetime.now(get_local_tz()).strftime("%Y-%m-%d %H:%M")
    U = "⚠️ [待补充]"

    # 证据文件
    evidence_files = []
    if args.evidence_dir:
        ev_dir = Path(args.evidence_dir)
        if ev_dir.exists():
            for f in sorted(ev_dir.rglob("*")):
                if f.is_file():
                    evidence_files.append(str(f.relative_to(ev_dir)))

    report = f"""# 调试报告

## 问题
{args.issue}

## 根因
{args.root_cause or U}

## 证据链
"""

    if evidence_files:
        for idx, ef in enumerate(evidence_files, 1):
            report += f"{idx}. 证据: `{ef}`\n"
    else:
        report += "⚠️ 暂无证据文件\n"

    report += f"""
## 修复方案
{args.fix or U}

## 验证
- [ ] 修复后测试通过
- [ ] 无回归
- [ ] 根因已消除（不是症状被掩盖）

## 修复尝试记录
| # | 尝试 | 结果 | 结论 |
|---|------|------|------|
| 1 | | | |

> ⚠️ 如果3次修复失败，必须停止并质疑架构：是否设计层面有问题？

---
> 生成时间: {now}
"""

    if args.output:
        Path(args.output).write_text(report, encoding="utf-8")
        print(f"✅ 调试报告已生成: {args.output}")
    else:
        print(report)
