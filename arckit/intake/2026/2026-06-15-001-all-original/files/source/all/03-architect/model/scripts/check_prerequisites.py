#!/usr/bin/env python3
"""
check_prerequisites.py — DDD 建模前置步骤检查

铁律：没有战略设计就不能做战术建模。
检查前置步骤的交付物是否存在且通过校验。

用法:
  python3 check_prerequisites.py --step event-storming --output-dir ./output
  python3 check_prerequisites.py --step tactical --output-dir ./output --aggregate-count 8
"""

import argparse
import json
import sys
from pathlib import Path


STEP_PREREQUISITES = {
    "strategy": {
        "label": "战略设计",
        "requires": [],
        "description": "第一步，无前置要求",
    },
    "event-storming": {
        "label": "事件风暴",
        "requires": ["strategy"],
        "files": ["*context-map*", "*strategy*"],
        "description": "需要战略设计产出（上下文映射图）",
    },
    "tactical": {
        "label": "战术建模",
        "requires": ["strategy", "event-storming"],
        "files": ["*context-map*", "*event-storming*"],
        "description": "需要战略设计+事件风暴产出",
    },
}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DDD 建模前置步骤检查")
    parser.add_argument("--step", required=True, choices=["strategy", "event-storming", "tactical"])
    parser.add_argument("--output-dir", required=True, help="产出目录")
    parser.add_argument("--aggregate-count", type=int, default=0, help="系统聚合数量（<5可跳过战略设计）")
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    step_info = STEP_PREREQUISITES[args.step]

    # 特殊规则：<5个聚合可跳过战略设计
    if args.step == "event-storming" and args.aggregate_count > 0 and args.aggregate_count < 5:
        print(json.dumps({
            "ok": True, "step": args.step,
            "verdict": "✅ 跳过战略设计（系统<5个聚合，可直接做事件风暴）",
            "skipped_prerequisites": ["strategy"],
        }, ensure_ascii=False))
        sys.exit(0)

    # 检查前置交付物
    missing = []
    found = []
    for prereq in step_info["requires"]:
        prereq_info = STEP_PREREQUISITES[prereq]
        prereq_files = prereq_info.get("files", [f"*{prereq}*"])
        has_output = False
        if output_dir.exists():
            for pattern in prereq_files:
                if list(output_dir.glob(pattern)):
                    has_output = True
                    break
        if has_output:
            found.append(prereq)
        else:
            missing.append(prereq)

    ok = len(missing) == 0
    result = {
        "ok": ok,
        "step": args.step,
        "step_label": step_info["label"],
        "found_prerequisites": found,
        "missing_prerequisites": missing,
    }

    if ok:
        result["verdict"] = f"✅ 前置检查通过，可以执行 {step_info['label']}"
    else:
        result["verdict"] = f"❌ 前置检查不通过：缺少 {', '.join(missing)} 产出，请先执行对应步骤"

    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(0 if ok else 1)
