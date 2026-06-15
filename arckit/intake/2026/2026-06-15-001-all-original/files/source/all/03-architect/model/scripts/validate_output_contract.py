#!/usr/bin/env python3
"""
validate_output_contract.py — 领域模型输出契约校验

验证领域模型产出是否符合下游 build Skill 的输入格式要求。
确保：聚合根有明确标识、实体和值对象区分正确、领域事件命名规范。

用法:
  python3 validate_output_contract.py --model-file domain-model.md
  python3 validate_output_contract.py --model-file domain-model.json
"""

import argparse
import json
import re
import sys
from pathlib import Path


def validate_markdown(content: str) -> dict:
    """校验 Markdown 格式的领域模型"""
    errors = []
    warnings = []

    # 检查聚合根
    aggregates = re.findall(r'(?:聚合根?|Aggregate)[：:]\s*(.+)', content, re.IGNORECASE)
    if not aggregates:
        errors.append({"check": "aggregate_root", "message": "未发现聚合根定义"})

    # 检查领域事件命名（应该是过去时态）
    events = re.findall(r'(?:事件|Event)[：:]\s*(.+)', content, re.IGNORECASE)
    past_tense_suffixes = ("ed", "Completed", "Created", "Updated", "Deleted", "Cancelled",
                           "Placed", "Paid", "Shipped", "Registered", "Submitted")
    for event in events:
        name = event.strip().split()[0] if event.strip() else ""
        if name and not any(name.endswith(s) or name.endswith(s.lower()) for s in past_tense_suffixes):
            is_chinese_past = any(name.endswith(c) for c in ["已完成", "已创建", "已支付", "已取消"])
            if not is_chinese_past:
                warnings.append({"check": "event_naming", "message": f"事件 '{name}' 可能不是过去时态命名"})

    # 检查值对象不可变性
    value_objects = re.findall(r'(?:值对象|Value\s*Object)[：:]\s*(.+)', content, re.IGNORECASE)
    if value_objects and "不可变" not in content and "immutable" not in content.lower():
        warnings.append({"check": "value_object_immutability", "message": "值对象未标注不可变性约束"})

    return {"errors": errors, "warnings": warnings}


def validate_json(content: str) -> dict:
    """校验 JSON 格式的领域模型"""
    errors = []
    warnings = []

    try:
        data = json.loads(content)
    except Exception as e:
        return {"errors": [{"check": "json_parse", "message": f"JSON 解析失败: {e}"}], "warnings": []}

    aggregates = data.get("aggregates", data.get("contexts", []))
    if not aggregates:
        errors.append({"check": "aggregates", "message": "JSON 中未发现 aggregates 或 contexts 字段"})

    return {"errors": errors, "warnings": warnings}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="领域模型输出契约校验")
    parser.add_argument("--model-file", required=True, help="领域模型文件路径")
    args = parser.parse_args()

    path = Path(args.model_file)
    try:
        content = path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"❌ 无法读取文件: {e}", file=sys.stderr)
        sys.exit(1)

    if path.suffix == ".json":
        result = validate_json(content)
    else:
        result = validate_markdown(content)

    ok = len(result["errors"]) == 0
    result["ok"] = ok
    result["summary"] = f"{'✅ 通过' if ok else '❌ 不通过'}: {len(result['errors'])} 错误, {len(result['warnings'])} 警告"

    print(json.dumps(result, ensure_ascii=False, indent=2))
