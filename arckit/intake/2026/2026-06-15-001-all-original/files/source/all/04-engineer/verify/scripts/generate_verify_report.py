#!/usr/bin/env python3
"""
generate_verify_report.py — 验证报告生成

将测试结果、截图、性能数据组装为结构化验证报告。
对应 SKILL.md Step3 输出格式。

用法:
  python3 generate_verify_report.py --scope "用户注册流程" --test-results results.json --evidence-dir ./evidence
"""

import argparse
import json
from datetime import datetime
from pathlib import Path


def get_local_tz():
    return datetime.now().astimezone().tzinfo


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="验证报告生成")
    parser.add_argument("--scope", required=True, help="验证范围描述")
    parser.add_argument("--test-results", default="", help="测试结果 JSON 文件")
    parser.add_argument("--evidence-dir", default="", help="证据目录")
    parser.add_argument("--output", default="", help="输出文件路径")
    args = parser.parse_args()

    now = datetime.now(get_local_tz()).strftime("%Y-%m-%d %H:%M")

    # 读取测试结果
    test_data = {}
    if args.test_results:
        try:
            test_data = json.loads(Path(args.test_results).read_text(encoding="utf-8"))
        except Exception:
            pass

    passed = test_data.get("passed", 0)
    failed = test_data.get("failed", 0)
    skipped = test_data.get("skipped", 0)
    total = passed + failed + skipped

    if failed == 0:
        conclusion = "✅ 通过"
    elif failed <= 2:
        conclusion = "⚠️ 有条件通过"
    else:
        conclusion = "❌ 不通过"

    # 证据文件列表
    evidence_files = []
    if args.evidence_dir:
        ev_dir = Path(args.evidence_dir)
        if ev_dir.exists():
            evidence_files = [str(f.relative_to(ev_dir)) for f in ev_dir.rglob("*") if f.is_file()]

    report = f"""# 验证报告

## 摘要
- 验证范围: {args.scope}
- 通过/失败/跳过: {passed}/{failed}/{skipped}
- 结论: {conclusion}

## 详细结果

### 功能验证
| 测试用例 | 结果 | 证据 |
|---------|------|------|
| (来自测试结果) | | |

### 问题清单
| # | 严重级别 | 描述 | 复现步骤 |
|---|---------|------|---------|
| (待补充) | | | |

## 验证证据
- 截图: {', '.join(evidence_files) if evidence_files else '(无)'}
- 测试日志: {args.test_results or '(无)'}
- 时间: {now}
"""

    if args.output:
        Path(args.output).write_text(report, encoding="utf-8")
        print(f"✅ 验证报告已生成: {args.output}")
    else:
        print(report)
