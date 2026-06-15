#!/usr/bin/env python3
"""
事件风暴输出质量校验脚本

用途：校验事件风暴产出物的质量，检查命名规范、时序逻辑、完整性等维度，生成校验报告。

参数：
  --input   待校验文件路径（Markdown 或 JSON）（必需）
  --mode    校验模式：quick（快速规则检查）或 deep（深度检查，当前降级为 quick）
  --output  校验报告输出路径（必需）
  --json    同时输出 JSON 格式详细结果

输出：
  - Markdown 校验报告（含错误/警告/通过项及改进建议）
  - 可选 JSON 详细结果文件

退出码：
  0 - 通过
  1 - 未通过（存在错误项）
"""

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

def _get_local_tz():
    """获取系统本地时区，不硬编码任何特定时区"""
    return datetime.now().astimezone().tzinfo

# 常见错误的命令式命名（应该是过去时）
COMMAND_PATTERNS = [
    r"^(Place|Create|Update|Delete|Send|Process|Cancel|Confirm|Ship|Deliver)",
    r"(Order|Payment|Item|User)$",  # 仅名词，缺少动作
]

# 技术实现细节关键词（应避免）
TECH_KEYWORDS = ["Insert", "Update", "Delete", "Record", "Table", "Database", "Save", "Load"]

# 过于泛化的命名
VAGUE_NAMES = ["StatusChanged", "DataUpdated", "ProcessCompleted", "ActionTaken"]


def parse_markdown(file_path):
    """解析 Markdown 格式的事件风暴输出"""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"错误：文件不存在: {file_path}", file=sys.stderr)
        return {"business_process": "", "goal": "", "events": [], "commands": [], "actors": [], "aggregates": [], "_error": f"文件不存在: {file_path}"}
    
    data = {
        "business_process": "",
        "goal": "",
        "events": [],
        "commands": [],
        "actors": [],
        "aggregates": []
    }
    
    # 提取业务流程名（标题）
    title_match = re.search(r"^#\s+(.+?)\s*-\s*事件风暴", content, re.MULTILINE)
    if title_match:
        data["business_process"] = title_match.group(1).strip()
    
    # 提取事件清单表格
    table_match = re.search(r"\|\s*序号\s*\|.*?\n\|[-|]+\n((?:\|.*?\n)+)", content, re.DOTALL)
    if table_match:
        rows = table_match.group(1).strip().split("\n")
        for row in rows:
            cols = [c.strip() for c in row.split("|")[1:-1]]  # 去掉首尾空列
            if len(cols) >= 5:
                data["events"].append(cols[1])
                data["commands"].append(cols[2])
                data["actors"].append(cols[3])
                data["aggregates"].append(cols[4])
    
    return data


def parse_json(file_path):
    """解析 JSON 格式的事件风暴输出"""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"错误：文件不存在: {file_path}", file=sys.stderr)
        return {"events": [], "commands": [], "actors": [], "aggregates": [], "_error": f"文件不存在: {file_path}"}
    except json.JSONDecodeError as e:
        print(f"错误：JSON解析失败: {e}", file=sys.stderr)
        return {"events": [], "commands": [], "actors": [], "aggregates": [], "_error": f"JSON解析失败: {e}"}


def check_naming(events):
    """检查事件命名规范"""
    issues = []
    
    for event in events:
        if not event:
            continue
        
        # 检查是否是命令式命名
        for pattern in COMMAND_PATTERNS:
            if re.search(pattern, event):
                issues.append({
                    "type": "error",
                    "event": event,
                    "rule": "命名规范",
                    "message": f"使用了命令式命名，应改为过去时（如：PlaceOrder → OrderPlaced）"
                })
                break
        
        # 检查是否包含技术实现细节
        for keyword in TECH_KEYWORDS:
            if keyword in event:
                issues.append({
                    "type": "warning",
                    "event": event,
                    "rule": "业务语言",
                    "message": f"包含技术实现细节「{keyword}」，建议使用业务术语"
                })
                break
        
        # 检查是否过于泛化
        if event in VAGUE_NAMES:
            issues.append({
                "type": "warning",
                "event": event,
                "rule": "清晰性",
                "message": "命名过于泛化，建议使用具体的业务事件名"
            })
        
        # 检查是否有过去时后缀（简单规则：以 ed/d 结尾）
        if not re.search(r"(ed|d|Received|Confirmed|Cancelled|Shipped|Placed)$", event):
            issues.append({
                "type": "warning",
                "event": event,
                "rule": "过去时",
                "message": "可能不是过去时，请确认（如：Order → OrderPlaced）",
                "note": "可能误报，请人工确认"
            })
    
    return issues


def check_sequence_logic(events, commands, actors):
    """检查时序逻辑（简单版本：检查是否有终止状态）"""
    issues = []
    
    if not events:
        issues.append({
            "type": "error",
            "rule": "完整性",
            "message": "未识别到任何事件"
        })
        return issues
    
    # 检查是否有结束事件
    end_keywords = ["Completed", "Delivered", "Finished", "Closed", "Cancelled"]
    has_end = any(any(kw in event for kw in end_keywords) for event in events)
    
    if not has_end:
        issues.append({
            "type": "warning",
            "rule": "时序逻辑",
            "message": "流程缺少明确的结束事件（如 OrderCompleted）"
        })
    
    # 检查是否有孤立事件（无命令触发）
    for i, event in enumerate(events):
        if i < len(commands) and not commands[i]:
            issues.append({
                "type": "warning",
                "event": event,
                "rule": "时序逻辑",
                "message": "事件缺少触发命令"
            })
    
    return issues


def check_completeness(events, aggregates):
    """检查完整性"""
    issues = []
    
    # 检查是否有异常分支事件
    error_keywords = ["Failed", "Error", "Insufficient", "Timeout", "Rejected"]
    has_error_events = any(any(kw in event for kw in error_keywords) for event in events)
    
    if not has_error_events:
        issues.append({
            "type": "warning",
            "rule": "完整性",
            "message": "缺少异常分支事件（如 PaymentFailed, InventoryInsufficient）"
        })
    
    # 检查是否识别了聚合
    non_empty_aggregates = [a for a in aggregates if a]
    if len(non_empty_aggregates) < len(events) * 0.5:
        issues.append({
            "type": "warning",
            "rule": "完整性",
            "message": f"仅 {len(non_empty_aggregates)}/{len(events)} 个事件映射到了聚合，建议补充"
        })
    
    return issues


def generate_report(data, issues, mode, output_path):
    """生成校验报告"""
    now = datetime.now(_get_local_tz())
    date_str = now.strftime("%Y-%m-%d %H:%M")
    
    error_count = len([i for i in issues if i.get("type") == "error"])
    warning_count = len([i for i in issues if i.get("type") == "warning"])
    
    if error_count == 0 and warning_count == 0:
        status = "✅ **通过**"
        status_emoji = "✅"
    elif error_count == 0:
        status = f"⚠️ **通过（{warning_count} 个警告）**"
        status_emoji = "⚠️"
    else:
        status = f"❌ **未通过**（{error_count} 个错误，{warning_count} 个警告）"
        status_emoji = "❌"
    
    report = f"""# 事件风暴校验报告

**业务流程**: {data.get('business_process', '未知')}  
**校验时间**: {date_str}  
**校验模式**: {mode}  
**事件数量**: {len(data.get('events', []))}  

---

## 总体结果

{status}

---

## 详细检查项

"""
    
    if issues:
        # 按规则分类
        by_rule = {}
        for issue in issues:
            rule = issue.get("rule", "其他")
            by_rule.setdefault(rule, []).append(issue)
        
        for rule, rule_issues in by_rule.items():
            report += f"### {rule}\n\n"
            for issue in rule_issues:
                event_str = f"**{issue['event']}**" if "event" in issue else "（全局）"
                note_str = f" *({issue['note']})*" if "note" in issue else ""
                icon = "❌" if issue["type"] == "error" else "⚠️"
                report += f"{icon} {event_str}: {issue['message']}{note_str}\n\n"
    else:
        report += "✅ 所有检查项均通过，未发现问题。\n\n"
    
    report += """---

## 改进建议

"""
    
    if error_count > 0:
        report += "❗ **必须修复**：上述错误项会影响后续建模，请优先处理。\n\n"
    
    if warning_count > 0:
        report += "💡 **建议改进**：警告项不影响使用，但改进后输出质量更高。\n\n"
    
    if error_count == 0 and warning_count == 0:
        report += "✅ 输出质量良好，可以进入下一阶段（聚合设计或 PRD 生成）。\n\n"
    
    report += f"""---

*由 event-storming-validator v1.0 生成（{mode} 模式）*
"""
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(report)
    
    return {
        "status": "pass" if error_count == 0 else "fail",
        "errors": error_count,
        "warnings": warning_count,
        "output_file": output_path
    }


def main():
    parser = argparse.ArgumentParser(description="事件风暴输出质量校验")
    parser.add_argument("--input", required=True, help="待校验文件路径（Markdown 或 JSON）")
    parser.add_argument("--mode", default="quick", choices=["quick", "deep"], help="校验模式")
    parser.add_argument("--output", required=True, help="校验报告输出路径")
    parser.add_argument("--json", action="store_true", help="同时输出 JSON 格式结果")
    
    args = parser.parse_args()
    
    # 解析输入
    input_path = Path(args.input)
    if not input_path.exists():
        print(json.dumps({"error": f"文件不存在: {args.input}"}, ensure_ascii=False))
        return 1
    
    if input_path.suffix == ".json":
        data = parse_json(args.input)
    else:
        data = parse_markdown(args.input)
    
    # 运行检查
    issues = []
    issues.extend(check_naming(data.get("events", [])))
    issues.extend(check_sequence_logic(
        data.get("events", []),
        data.get("commands", []),
        data.get("actors", [])
    ))
    issues.extend(check_completeness(data.get("events", []), data.get("aggregates", [])))
    
    # 生成报告
    result = generate_report(data, issues, args.mode, args.output)
    
    # 输出 JSON 结果
    print(json.dumps(result, ensure_ascii=False))
    
    # 可选：输出详细 JSON
    if args.json:
        json_output = args.output.replace(".md", ".json")
        with open(json_output, "w", encoding="utf-8") as f:
            json.dump({
                "result": result,
                "issues": issues,
                "data": data
            }, f, ensure_ascii=False, indent=2)
    
    return 0 if result["status"] == "pass" else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
