#!/usr/bin/env python3
"""
extract_from_model.py — 从领域模型提取编码结构

读取 model Skill 产出的领域模型文档，提取聚合/实体/值对象/领域事件/领域服务，
生成建议的目录结构和代码骨架。

用法:
  python3 extract_from_model.py --model-file domain-model.md --language typescript
  python3 extract_from_model.py --model-file domain-model.json --language python
"""

import argparse
import json
import re
import sys
from pathlib import Path


LANGUAGE_TEMPLATES = {
    "typescript": {
        "aggregate": "export class {Name} {{\n  constructor(private data: {Name}Props) {{}}\n}}\n",
        "entity": "export class {Name} {{\n  constructor(private data: {Name}Props) {{}}\n}}\n",
        "value_object": "export class {Name} {{\n  readonly #value: {Name}Props;\n  constructor(value: {Name}Props) {{ this.#value = Object.freeze(value); }}\n}}\n",
        "event": "export class {Name} {{\n  constructor(public readonly data: {Name}Payload) {{}}\n}}\n",
        "service": "export class {Name}Service {{\n  execute(): void {{}}\n}}\n",
        "ext": ".ts",
    },
    "python": {
        "aggregate": "class {Name}:\n    def __init__(self, **kwargs):\n        pass\n",
        "entity": "class {Name}:\n    def __init__(self, **kwargs):\n        pass\n",
        "value_object": "from dataclasses import dataclass\n\n@dataclass(frozen=True)\nclass {Name}:\n    pass\n",
        "event": "from dataclasses import dataclass\n\n@dataclass(frozen=True)\nclass {Name}:\n    pass\n",
        "service": "class {Name}Service:\n    def execute(self) -> None:\n        pass\n",
        "ext": ".py",
    },
}


def extract_from_markdown(content: str) -> dict:
    """从 Markdown 提取领域模型结构"""
    result = {"aggregates": [], "entities": [], "value_objects": [], "events": [], "services": []}

    # 提取聚合
    for m in re.finditer(r'(?:聚合根?|Aggregate)[：:]\s*(\w+)', content, re.IGNORECASE):
        result["aggregates"].append(m.group(1))

    # 提取实体
    for m in re.finditer(r'(?:实体|Entity)[：:]\s*(\w+)', content, re.IGNORECASE):
        result["entities"].append(m.group(1))

    # 提取值对象
    for m in re.finditer(r'(?:值对象|Value\s*Object)[：:]\s*(\w+)', content, re.IGNORECASE):
        result["value_objects"].append(m.group(1))

    # 提取领域事件
    for m in re.finditer(r'(?:领域事件|Domain\s*Event)[：:]\s*(\w+)', content, re.IGNORECASE):
        result["events"].append(m.group(1))

    # 提取领域服务
    for m in re.finditer(r'(?:领域服务|Domain\s*Service)[：:]\s*(\w+)', content, re.IGNORECASE):
        result["services"].append(m.group(1))

    return result


def extract_from_json(content: str) -> dict:
    """从 JSON 提取领域模型结构"""
    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        print(f"错误：JSON解析失败: {e}", file=sys.stderr)
        return {"aggregates": [], "entities": [], "value_objects": [], "events": [], "services": []}
    result = {"aggregates": [], "entities": [], "value_objects": [], "events": [], "services": []}

    for ctx in data.get("contexts", data.get("boundedContexts", [data])):
        for agg in ctx.get("aggregates", []):
            name = agg.get("name", agg) if isinstance(agg, dict) else agg
            result["aggregates"].append(name)
            if isinstance(agg, dict):
                for e in agg.get("entities", []):
                    result["entities"].append(e.get("name", e) if isinstance(e, dict) else e)
                for vo in agg.get("valueObjects", agg.get("value_objects", [])):
                    result["value_objects"].append(vo.get("name", vo) if isinstance(vo, dict) else vo)
                for ev in agg.get("events", agg.get("domainEvents", [])):
                    result["events"].append(ev.get("name", ev) if isinstance(ev, dict) else ev)
                for svc in agg.get("services", agg.get("domainServices", [])):
                    result["services"].append(svc.get("name", svc) if isinstance(svc, dict) else svc)

    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="从领域模型提取编码结构")
    parser.add_argument("--model-file", required=True, help="领域模型文件路径")
    parser.add_argument("--language", default="typescript", choices=["typescript", "python"])
    args = parser.parse_args()

    try:
        content = Path(args.model_file).read_text(encoding="utf-8")
    except FileNotFoundError:
        print(f"错误：文件不存在: {args.model_file}", file=sys.stderr)
        sys.exit(1)
    if args.model_file.endswith(".json"):
        model = extract_from_json(content)
    else:
        model = extract_from_markdown(content)

    lang = LANGUAGE_TEMPLATES[args.language]
    ext = lang["ext"]

    # 生成目录结构建议
    structure = {"directories": [], "files": []}

    for agg_name in model["aggregates"]:
        agg_dir = f"src/{agg_name.lower()}"
        structure["directories"].append(agg_dir)
        structure["files"].append({"path": f"{agg_dir}/{agg_name}{ext}", "type": "aggregate", "content": lang["aggregate"].format(Name=agg_name)})
        for e in model["entities"]:
            structure["files"].append({"path": f"{agg_dir}/entities/{e}{ext}", "type": "entity", "content": lang["entity"].format(Name=e)})
        for vo in model["value_objects"]:
            structure["files"].append({"path": f"{agg_dir}/value-objects/{vo}{ext}", "type": "value_object", "content": lang["value_object"].format(Name=vo)})
        for ev in model["events"]:
            structure["files"].append({"path": f"{agg_dir}/events/{ev}{ext}", "type": "event", "content": lang["event"].format(Name=ev)})
        for svc in model["services"]:
            structure["files"].append({"path": f"{agg_dir}/services/{svc}.service{ext}", "type": "service", "content": lang["service"].format(Name=svc)})

    output = {"model": model, "language": args.language, "structure": structure}
    print(json.dumps(output, ensure_ascii=False, indent=2))
