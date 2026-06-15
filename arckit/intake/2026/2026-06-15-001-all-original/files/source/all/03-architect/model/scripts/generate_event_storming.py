#!/usr/bin/env python3
"""事件风暴输出生成脚本"""

import argparse
import json
from datetime import datetime, timezone, timedelta

def _get_local_tz():
    """获取系统本地时区，不硬编码任何特定时区"""
    return datetime.now().astimezone().tzinfo

def generate_event_table(events, commands, actors, aggregates):
    """生成事件清单表格"""
    lines = ["| 序号 | 事件 | 触发命令 | 触发角色 | 影响聚合 |"]
    lines.append("|------|------|---------|---------|---------|")
    
    for i, event in enumerate(events, 1):
        command = commands[i-1] if i <= len(commands) else ""
        actor = actors[i-1] if i <= len(actors) else ""
        aggregate = aggregates[i-1] if i <= len(aggregates) else ""
        lines.append(f"| {i} | {event} | {command} | {actor} | {aggregate} |")
    
    return "\n".join(lines)


def generate_mermaid_sequence(events, commands, actors):
    """生成 Mermaid 时序图"""
    lines = ["```mermaid", "sequenceDiagram"]
    
    # 声明参与者
    unique_actors = list(dict.fromkeys(actors))  # 去重保持顺序
    for actor in unique_actors:
        if actor:
            lines.append(f"    participant {actor}")
    
    lines.append("    participant System")
    lines.append("")
    
    # 生成交互序列
    for i, event in enumerate(events):
        command = commands[i] if i < len(commands) else ""
        actor = actors[i] if i < len(actors) else "System"
        
        if command:
            lines.append(f"    {actor}->>System: {command}")
        lines.append(f"    System->>System: {event}")
    
    lines.append("```")
    return "\n".join(lines)


def generate_document(args):
    """生成完整的事件风暴文档"""
    now = datetime.now(_get_local_tz())
    date_str = now.strftime("%Y-%m-%d %H:%M")
    
    events = [e.strip() for e in args.events.split(",") if e.strip()]
    commands = [c.strip() for c in args.commands.split(",") if c.strip()] if args.commands else []
    actors = [a.strip() for a in args.actors.split(",") if a.strip()] if args.actors else []
    aggregates = [a.strip() for a in args.aggregates.split(",") if a.strip()] if args.aggregates else []
    
    # 补齐列表长度
    while len(commands) < len(events):
        commands.append("")
    while len(actors) < len(events):
        actors.append("")
    while len(aggregates) < len(events):
        aggregates.append("")
    
    doc = f"""# {args.business_process} - 事件风暴结果

**生成时间**: {date_str}

---

## 1. 业务目标

{args.goal or "（待补充）"}

---

## 2. 领域事件清单

{generate_event_table(events, commands, actors, aggregates)}

---

## 3. 事件流时序图

{generate_mermaid_sequence(events, commands, actors)}

---

## 4. 识别的聚合（初步）

"""
    
    unique_aggregates = list(dict.fromkeys([a for a in aggregates if a]))
    if unique_aggregates:
        for agg in unique_aggregates:
            doc += f"- **{agg}**\n"
    else:
        doc += "（未识别）\n"
    
    doc += """
---

## 5. 待澄清问题

（在事件风暴过程中记录的疑问和待确认事项）

---

## 下一步建议

1. 用 **event-storming-validator** 校验输出质量
2. 用 **ddd-modeling** skill 设计聚合（将事件映射到聚合根）
3. 用 **prd-gen** 生成技术 PRD

---

*本文档由 event-storming skill 自动生成*
"""
    
    return doc


def main():
    parser = argparse.ArgumentParser(description="生成事件风暴输出文档")
    parser.add_argument("--business-process", required=True, help="业务流程名称")
    parser.add_argument("--events", required=True, help="事件列表（逗号分隔）")
    parser.add_argument("--commands", default="", help="命令列表（逗号分隔，可选）")
    parser.add_argument("--actors", default="", help="角色列表（逗号分隔，可选）")
    parser.add_argument("--aggregates", default="", help="聚合列表（逗号分隔，可选）")
    parser.add_argument("--goal", default="", help="业务目标描述（可选）")
    parser.add_argument("--output", required=True, help="输出文件路径")
    parser.add_argument("--json", action="store_true", help="同时输出 JSON 格式")
    
    args = parser.parse_args()
    
    # 生成 Markdown 文档
    doc = generate_document(args)
    
    with open(args.output, "w", encoding="utf-8") as f:
        f.write(doc)
    
    print(json.dumps({
        "status": "ok",
        "output_file": args.output,
        "events_count": len([e for e in args.events.split(",") if e.strip()])
    }, ensure_ascii=False))
    
    # 可选：输出 JSON 格式（供其他工具解析）
    if args.json:
        json_output = args.output.replace(".md", ".json")
        data = {
            "business_process": args.business_process,
            "goal": args.goal,
            "events": [e.strip() for e in args.events.split(",") if e.strip()],
            "commands": [c.strip() for c in args.commands.split(",") if c.strip()] if args.commands else [],
            "actors": [a.strip() for a in args.actors.split(",") if a.strip()] if args.actors else [],
            "aggregates": [a.strip() for a in args.aggregates.split(",") if a.strip()] if args.aggregates else [],
            "generated_at": datetime.now(_get_local_tz()).isoformat()
        }
        with open(json_output, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"JSON output: {json_output}", file=sys.stderr)


if __name__ == "__main__":
    import sys
    main()
