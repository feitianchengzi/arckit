#!/usr/bin/env python3
"""
route_tool.py — 决策场景识别与工具路由

根据用户描述的问题，自动判断应使用哪套决策工具：
  - first-principles: 全新领域/战略转型/打破僵局
  - value-assessment: 需求评审/立项决策/多方案选择
  - socratic: 方案评审/风险识别/逻辑拷问

用法:
  python3 route_tool.py --problem-description "竞品都在做AI助手，我们要不要跟？"
  python3 route_tool.py --problem-description "这个系统该用微服务还是单体" --json
"""

import argparse
import json
import re
import sys
from typing import Dict, List, Tuple


# ─── 场景关键词映射 ────────────────────────────────────────

TOOL_RULES = {
    "first-principles": {
        "label": "第一性原理拆解",
        "keywords": [
            # 全新领域
            "全新", "从零", "新领域", "新赛道", "新市场", "探索", "蓝海",
            # 战略转型
            "转型", "转型期", "战略", "变革", "重构方向", "转型决策",
            # "竞品都在做"
            "竞品都在", "大家都在做", "行业惯例", "跟随", "跟风", "要不要跟",
            # 打破僵局
            "僵局", "死胡同", "瓶颈", "走不通", "卡住了", "突破",
            # 模糊问题
            "不知道从哪开始", "没有方向", "该怎么想",
        ],
        "reason_template": "这个场景适合用【第一性原理拆解】，因为{reason}。",
        "reasons": {
            "new_domain": "需要从零构建认知，避免惯性思维",
            "follow_competition": "需要拆解跟随的隐含假设，避免盲目跟风",
            "stuck": "需要打破现有思维框架，重新审视问题本质",
            "vague": "问题定义不清晰，需要先拆解到最底层",
        },
    },
    "value-assessment": {
        "label": "产品价值评估",
        "keywords": [
            # 需求评审
            "评审", "需求评审", "PRD评审", "功能评审",
            # 立项决策
            "立项", "做不做", "值不值得", "值得做", "优先级",
            # 多方案选择
            "选哪个", "哪个更好", "方案选择", "技术选型", "对比", "A还是B",
            # 定量判断
            "ROI", "投入产出", "成本", "收益", "商业价值",
        ],
        "reason_template": "这个场景适合用【产品价值评估】，因为{reason}。",
        "reasons": {
            "evaluation": "需要定量判断价值，而非凭感觉决策",
            "multi_choice": "有多个候选方案，需要横向对比",
            "business": "涉及商业价值和投入产出比",
        },
    },
    "socratic": {
        "label": "苏格拉底追问",
        "keywords": [
            # 方案评审
            "方案评审", "方案有问题", "这个方案", "方案风险",
            # 风险识别
            "风险", "隐患", "漏洞", "问题", "缺陷",
            # 逻辑拷问
            "拷问", "质疑", "挑战", "反驳", "验证",
            # 僵局/否决
            "否决", "反复被否", "团队分歧", "不同意",
            # 具体方案
            "这个设计", "这个架构", "这个实现",
        ],
        "reason_template": "这个场景适合用【苏格拉底追问】，因为{reason}。",
        "reasons": {
            "review": "有具体方案需要验证，需要拷问逻辑漏洞",
            "risk": "需要识别风险和隐患",
            "disagreement": "团队存在分歧，需要通过追问达成共识",
        },
    },
}


# ─── 组合模式 ─────────────────────────────────────────────

COMBO_PATTERNS = {
    "complete_rigorous": {
        "pattern": ["重大", "关键决策", "影响深远", "不可逆"],
        "flow": "first-principles → value-assessment → socratic",
        "duration": "2-3天",
        "description": "完整严谨：第一性原理拆解(2-3天) → 产品价值评估(1-2天) → 苏格拉底追问(半天)",
    },
    "quick_validate": {
        "pattern": ["常规", "日常", "快速", "简单"],
        "flow": "value-assessment → socratic",
        "duration": "1天内",
        "description": "快速验证：产品价值评估 → 苏格拉底追问",
    },
    "deep_challenge": {
        "pattern": ["僵局", "分歧", "推翻", "重来"],
        "flow": "socratic → first-principles",
        "duration": "1-2天",
        "description": "深度质疑：苏格拉底追问 → 第一性原理",
    },
}


def route(problem_description: str) -> Dict:
    """
    根据问题描述，路由到最合适的决策工具

    Args:
        problem_description: 问题描述

    Returns:
        dict: {"tool": str, "label": str, "reason": str, "confidence": float,
               "combo": str|None, "combo_description": str|None}
    """
    text = problem_description.lower()

    # 计算每个工具的匹配分数
    scores: Dict[str, Tuple[float, str]] = {}
    for tool_id, rule in TOOL_RULES.items():
        match_count = 0
        matched_reason_key = None
        for kw in rule["keywords"]:
            if kw in text:
                match_count += 1

        # 计算置信度
        if match_count == 0:
            scores[tool_id] = (0.0, "")
            continue

        confidence = min(0.95, 0.3 + match_count * 0.15)

        # 推断原因
        reasons = rule["reasons"]
        reason_key = list(reasons.keys())[0]
        if tool_id == "first-principles":
            if any(k in text for k in ["竞品都在", "大家都在", "跟风", "跟随", "要不要跟"]):
                reason_key = "follow_competition"
            elif any(k in text for k in ["僵局", "死胡同", "瓶颈", "走不通"]):
                reason_key = "stuck"
            elif any(k in text for k in ["全新", "从零", "新领域"]):
                reason_key = "new_domain"
            else:
                reason_key = "vague"
        elif tool_id == "value-assessment":
            if any(k in text for k in ["选哪个", "哪个更好", "A还是B", "对比"]):
                reason_key = "multi_choice"
            elif any(k in text for k in ["ROI", "商业", "收益"]):
                reason_key = "business"
            else:
                reason_key = "evaluation"
        elif tool_id == "socratic":
            if any(k in text for k in ["风险", "隐患", "漏洞"]):
                reason_key = "risk"
            elif any(k in text for k in ["分歧", "否决", "不同意"]):
                reason_key = "disagreement"
            else:
                reason_key = "review"

        scores[tool_id] = (confidence, reason_key)

    # 选择最高分工具
    best_tool = max(scores.keys(), key=lambda k: scores[k][0])
    best_score, best_reason_key = scores[best_tool]

    # 如果所有分数都为0（无关键词匹配），默认路由到第一性原理
    if best_score == 0.0:
        best_tool = "first-principles"
        best_reason_key = "vague"
        best_score = 0.4

    rule = TOOL_RULES[best_tool]
    reason_text = rule["reasons"].get(best_reason_key, "需要系统化分析")
    reason = rule["reason_template"].format(reason=reason_text)

    # 检查是否需要组合模式
    combo = None
    combo_description = None
    for combo_id, combo_rule in COMBO_PATTERNS.items():
        if any(p in text for p in combo_rule["pattern"]):
            combo = combo_rule["flow"]
            combo_description = combo_rule["description"]
            break

    return {
        "tool": best_tool,
        "label": rule["label"],
        "reason": reason,
        "confidence": round(best_score, 2),
        "combo": combo,
        "combo_description": combo_description,
    }


# ─── CLI 入口 ─────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="决策场景识别与工具路由")
    parser.add_argument("--problem-description", required=True, help="问题描述")
    parser.add_argument("--json", action="store_true", help="输出 JSON 格式")
    args = parser.parse_args()

    result = route(args.problem_description)

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"🎯 推荐工具: {result['label']}")
        print(f"📌 工具标识: {result['tool']}")
        print(f"💡 原因: {result['reason']}")
        print(f"📊 置信度: {result['confidence']}")
        if result.get("combo"):
            print(f"🔗 组合模式: {result['combo']}")
            print(f"   {result['combo_description']}")
        print()
        print("要开始吗？或者你想换其他工具？")
