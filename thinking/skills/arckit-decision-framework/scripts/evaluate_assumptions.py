#!/usr/bin/env python3
"""
evaluate_assumptions.py — 假设脆弱度评估

对决策文档中列出的假设进行系统化脆弱度评估。
铁律要求：每个推荐必须说明基于什么假设、假设的脆弱度如何、如果假设不成立会怎样。

用法:
  python3 evaluate_assumptions.py --assumptions-json assumptions.json
  python3 evaluate_assumptions.py --assumptions '["用户愿意付费","市场足够大","技术可行"]'
  python3 evaluate_assumptions.py --decision-doc decision.md
"""

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List


def get_local_tz():
    return datetime.now().astimezone().tzinfo


# ─── 脆弱度评估维度 ────────────────────────────────────────

DIMENSIONS = {
    "evidence": {
        "label": "证据强度",
        "description": "有多少数据/事实支撑这个假设？",
        "scores": {
            1: "纯猜测，无任何数据支撑",
            2: "有少量间接证据",
            3: "有一定数据支撑但不充分",
            4: "有较强数据支撑",
            5: "有充分的一手数据验证",
        },
    },
    "reversibility": {
        "label": "可逆性",
        "description": "如果假设不成立，能多快修正？",
        "scores": {
            1: "完全不可逆，一旦错误损失巨大",
            2: "很难逆转，修正成本极高",
            3: "可以修正但成本较高",
            4: "可以修正，成本可控",
            5: "随时可以调整，几乎无成本",
        },
    },
    "sensitivity": {
        "label": "敏感度",
        "description": "假设不成立时，对整体方案的影响有多大？",
        "scores": {
            1: "方案完全崩溃",
            2: "方案大部分失效",
            3: "方案需要重大调整",
            4: "方案需要局部调整",
            5: "对方案影响很小",
        },
    },
    "volatility": {
        "label": "变动性",
        "description": "这个假设在外部环境变化时有多容易失效？",
        "scores": {
            1: "极度容易失效（如依赖政策/潮流）",
            2: "较容易失效",
            3: "可能失效",
            4: "不太容易失效",
            5: "非常稳定（如物理/经济规律）",
        },
    },
}


def evaluate_assumption(assumption: str, scores: Dict[str, int] = None) -> Dict:
    """
    评估单个假设的脆弱度

    Args:
        assumption: 假设描述
        scores: 各维度评分 (1-5)，未提供则标记为待评估

    Returns:
        dict: 评估结果
    """
    scores = scores or {}
    result = {
        "assumption": assumption,
        "dimensions": {},
    }

    total = 0
    count = 0
    for dim_id, dim in DIMENSIONS.items():
        score = scores.get(dim_id, 0)
        dim_result = {
            "label": dim["label"],
            "score": score,
            "description": dim["description"],
        }
        if score > 0:
            dim_result["interpretation"] = dim["scores"].get(score, "")
            total += score
            count += 1
        else:
            dim_result["interpretation"] = "⚠️ 待评估"
        result["dimensions"][dim_id] = dim_result

    # 综合脆弱度（分数越低越脆弱）
    if count > 0:
        avg = total / count
        result["fragility_score"] = round(avg, 1)
        if avg <= 2:
            result["fragility_level"] = "极度脆弱"
            result["action"] = "必须先验证才能继续，不可跳过"
        elif avg <= 3:
            result["fragility_level"] = "脆弱"
            result["action"] = "建议先做高信号验证"
        elif avg <= 3.5:
            result["fragility_level"] = "中等"
            result["action"] = "可以继续，但需准备应对方案"
        else:
            result["fragility_level"] = "稳健"
            result["action"] = "假设较可靠，可以基于此继续"
    else:
        result["fragility_score"] = 0
        result["fragility_level"] = "⚠️ 待评估"
        result["action"] = "需要先完成各维度评分"

    return result


def extract_assumptions_from_doc(doc_path: str) -> List[str]:
    """从决策文档中提取假设"""
    try:
        content = Path(doc_path).read_text(encoding="utf-8")
    except Exception:
        return []

    # 查找假设相关章节
    assumptions = []
    in_section = False
    for line in content.split("\n"):
        if re.search(r'假设|assumption', line, re.IGNORECASE):
            in_section = True
            continue
        if in_section and line.startswith("##"):
            break
        if in_section and "|" in line:
            # 表格行，提取第一列内容
            cells = [c.strip() for c in line.split("|") if c.strip()]
            if cells and cells[0] not in ["假设", "#", "隐含假设"]:
                assumptions.append(cells[0])

    return assumptions


# ─── CLI 入口 ─────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="假设脆弱度评估")
    parser.add_argument("--assumptions-json", default="",
                        help='假设列表 JSON 文件（格式: [{"assumption": "...", "scores": {...}}]）')
    parser.add_argument("--assumptions", default="",
                        help="假设列表，JSON 数组格式（如 '[\"假设1\", \"假设2\"]'）")
    parser.add_argument("--decision-doc", default="",
                        help="决策文档路径（自动提取假设）")
    parser.add_argument("--output", default="", help="输出文件路径")
    args = parser.parse_args()

    # 收集假设
    assumption_list = []

    if args.assumptions_json:
        try:
            data = json.loads(Path(args.assumptions_json).read_text(encoding="utf-8"))
            assumption_list = data if isinstance(data, list) else [data]
        except Exception as e:
            print(f"⚠️ 无法读取假设文件: {e}", file=sys.stderr)

    if args.assumptions:
        try:
            raw = json.loads(args.assumptions)
            for item in raw:
                if isinstance(item, str):
                    assumption_list.append({"assumption": item})
                elif isinstance(item, dict):
                    assumption_list.append(item)
        except Exception as e:
            print(f"⚠️ 无法解析假设列表: {e}", file=sys.stderr)

    if args.decision_doc:
        extracted = extract_assumptions_from_doc(args.decision_doc)
        for a in extracted:
            assumption_list.append({"assumption": a})

    if not assumption_list:
        print("❌ 未提供任何假设。请使用 --assumptions 或 --assumptions-json 或 --decision-doc", file=sys.stderr)
        sys.exit(1)

    # 评估
    results = []
    for item in assumption_list:
        assumption = item.get("assumption", str(item)) if isinstance(item, dict) else str(item)
        scores = item.get("scores", {}) if isinstance(item, dict) else {}
        results.append(evaluate_assumption(assumption, scores))

    # 输出
    now = datetime.now(get_local_tz()).strftime("%Y-%m-%d %H:%M")
    output = {
        "evaluated_at": now,
        "assumption_count": len(results),
        "results": results,
        "summary": {
            "extremely_fragile": sum(1 for r in results if r.get("fragility_level") == "极度脆弱"),
            "fragile": sum(1 for r in results if r.get("fragility_level") == "脆弱"),
            "moderate": sum(1 for r in results if r.get("fragility_level") == "中等"),
            "robust": sum(1 for r in results if r.get("fragility_level") == "稳健"),
            "pending": sum(1 for r in results if "⚠️" in r.get("fragility_level", "")),
        },
    }

    output_json = json.dumps(output, ensure_ascii=False, indent=2)

    if args.output:
        Path(args.output).write_text(output_json, encoding="utf-8")
        print(f"✅ 评估结果已保存到: {args.output}")
    else:
        print(output_json)
