#!/usr/bin/env python3
"""
generate_decision_doc.py — 决策文档生成

根据选定的决策工具和用户逐章节填写的内容，生成结构化决策文档。
支持三套工具：第一性原理拆解、产品价值评估、苏格拉底追问。

用法:
  python3 generate_decision_doc.py --tool first-principles --topic "AI助手赛道" --output decision.md
  python3 generate_decision_doc.py --tool value-assessment --topic "直播带货" --answers-json answers.json
  python3 generate_decision_doc.py --tool socratic --topic "微服务拆分方案" --interactive
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional


def get_local_tz():
    return datetime.now().astimezone().tzinfo


# ─── 第一性原理文档模板 ────────────────────────────────────

FIRST_PRINCIPLES_TEMPLATE = """# {topic} — 第一性原理拆解

> 生成时间: {date}
> 决策工具: 第一性原理拆解

---

## 〇、原始问题

{section_0}

---

## 一、拆解到最底层

### 连续追问 5 个"为什么"

| 层级 | 为什么 | 答案 |
|------|--------|------|
| 1 | 为什么需要解决这个问题？ | {why_1} |
| 2 | 为什么这个原因成立？ | {why_2} |
| 3 | 为什么这个前提存在？ | {why_3} |
| 4 | 为什么这个约束不可绕过？ | {why_4} |
| 5 | 最底层的事实是什么？ | {why_5} |

### 基本材料清单

| 材料 | 现状 | 可用程度 |
|------|------|---------|
| 人力 | {material_people} | |
| 技术 | {material_tech} | |
| 数据 | {material_data} | |
| 渠道 | {material_channel} | |
| 资金 | {material_capital} | |

---

## 二、重新定义问题

### 硬约束（必须满足）

{hard_constraints}

### 软约束（行业惯例，可挑战）

{soft_constraints}

### 重新表述

{reframe}

---

## 三、从零重构方案

| 方案 | 核心思路 | 粗估成本 | 适用条件 |
|------|---------|---------|---------|
| A | {plan_a_idea} | {plan_a_cost} | {plan_a_condition} |
| B | {plan_b_idea} | {plan_b_cost} | {plan_b_condition} |
| C | {plan_c_idea} | {plan_c_cost} | {plan_c_condition} |

---

## 四、挑战行业假设

| 行业惯例 | 为什么大家都这么做？ | 这个假设还成立吗？ | 如果不成立？ |
|---------|-------------------|-------------------|-------------|
| {assumption_1} | {assumption_1_why} | {assumption_1_valid} | {assumption_1_if_not} |
| {assumption_2} | {assumption_2_why} | {assumption_2_valid} | {assumption_2_if_not} |

---

## 五、关键假设验证

| 方案 | 最关键假设 | 关键验证方式 | 预计耗时 |
|------|-----------|----------------|---------|
| A | {validate_a_hypothesis} | {validate_a_method} | {validate_a_time} |
| B | {validate_b_hypothesis} | {validate_b_method} | {validate_b_time} |

---

## 六、对比矩阵

| 维度 | 方案 A | 方案 B | 方案 C |
|------|--------|--------|--------|
| 可行性 | | | |
| 成本 | | | |
| 风险 | | | |
| 可逆性 | | | |
| 长期价值 | | | |

---

## 七、壁垒评估

{moat}

---

## 八、输出建议

{recommendation}

---

## 假设脆弱度评估

| 假设 | 脆弱度 | 如果不成立 | 应对 |
|------|--------|-----------|------|
| {hypothesis_1} | {hypothesis_1_fragility} | {hypothesis_1_if_not} | {hypothesis_1_response} |
"""

VALUE_ASSESSMENT_TEMPLATE = """# {topic} — 产品价值评估

> 生成时间: {date}
> 决策工具: 产品价值评估

---

## 一、基本信息

| 字段 | 内容 |
|------|------|
| 产品/功能名称 | {topic} |
| 评估日期 | {date} |
| 评估人 | {evaluator} |

---

## 二、核心假设句式

为 **{target_user}** 在 **{scenario}** 下解决 **{problem}**，
相比 **{existing_solution}**，
通过 **{core_method}**，
实现 **{value}**。

---

## 三、六维拆解

### 1. 用户维度

| 项目 | 评估 |
|------|------|
| 目标用户 | {target_user} |
| 用户规模 | {user_scale} |
| 聚焦度 | {user_focus} |

### 2. 场景维度

| 项目 | 评估 |
|------|------|
| 核心场景 | {scenario} |
| 场景频率 | {scenario_frequency} |
| 场景价值 | {scenario_value} |

### 3. 痛点维度

| 项目 | 评估 |
|------|------|
| 核心痛点 | {problem} |
| 痛点强度 (1-5) | {pain_intensity} |
| 当前解决满意度 | {current_satisfaction} |

### 4. 现有方案维度

| 项目 | 评估 |
|------|------|
| 现有方案 | {existing_solution} |
| 现有方案不足 | {existing_gap} |
| 替代成本 | {switch_cost} |

### 5. 核心方法维度

| 项目 | 评估 |
|------|------|
| 核心方法 | {core_method} |
| 技术可行性 | {tech_feasibility} |
| 差异化程度 | {differentiation} |

### 6. 预期价值维度

| 项目 | 评估 |
|------|------|
| 用户价值 | {user_value} |
| 商业价值 | {business_value} |
| 战略价值 | {strategic_value} |

---

## 四、商业验证

| 指标 | 当前值 | 目标值 | 来源 |
|------|--------|--------|------|
| {metric_1_name} | {metric_1_current} | {metric_1_target} | {metric_1_source} |
| {metric_2_name} | {metric_2_current} | {metric_2_target} | {metric_2_source} |

---

## 五、综合评估

| 维度 | 权重 | 得分 (1-5) | 加权分 |
|------|------|-----------|--------|
| 用户需求强度 | 25% | {score_user} | |
| 场景价值 | 20% | {score_scenario} | |
| 痛点强度 | 20% | {score_pain} | |
| 方案差异性 | 15% | {score_diff} | |
| 可行性 | 10% | {score_feasibility} | |
| 商业回报 | 10% | {score_business} | |
| **总分** | | | **{total_score}** |

### 建议

{recommendation}

---

## 假设脆弱度评估

| 假设 | 脆弱度 | 如果不成立 | 应对 |
|------|--------|-----------|------|
| {hypothesis_1} | {hypothesis_1_fragility} | {hypothesis_1_if_not} | {hypothesis_1_response} |
"""

SOCRATIC_TEMPLATE = """# {topic} — 苏格拉底追问

> 生成时间: {date}
> 决策工具: 苏格拉底追问

---

## 命题

{proposition}

---

## 一、澄清概念

| 关键词 | 定义 | 事实还是判断？ |
|--------|------|---------------|
| {concept_1} | {concept_1_def} | {concept_1_type} |
| {concept_2} | {concept_2_def} | {concept_2_type} |

---

## 二、探查假设（最关键）

| # | 隐含假设 | 为什么可以这样默认？ | 脆弱度 (1-5) |
|---|---------|-------------------|-------------|
| 1 | {assumption_1} | {assumption_1_why} | {assumption_1_fragility} |
| 2 | {assumption_2} | {assumption_2_why} | {assumption_2_fragility} |
| 3 | {assumption_3} | {assumption_3_why} | {assumption_3_fragility} |

---

## 三、审视证据

| 论点 | 逻辑链条 | 必然成立？ | 反面证据 |
|------|---------|-----------|---------|
| {argument_1} | {argument_1_chain} | {argument_1_necessary} | {argument_1_counter} |
| {argument_2} | {argument_2_chain} | {argument_2_necessary} | {argument_2_counter} |

---

## 四、替代观点

| 视角 | 观点 | 合理性 |
|------|------|--------|
| 支持者 | {pro_support} | |
| 反对者 | {con_opposition} | |
| 中间立场 | {middle_ground} | |

---

## 五、检验后果

| 如果按此逻辑推演 | 产生的后果 | 可接受？ | 不可逆？ |
|----------------|-----------|---------|---------|
| {consequence_1} | {consequence_1_result} | {consequence_1_acceptable} | {consequence_1_irreversible} |
| {consequence_2} | {consequence_2_result} | {consequence_2_acceptable} | {consequence_2_irreversible} |

---

## 六、反诘问题（最容易被跳过，但最重要）

| # | 问题 | 意义 |
|---|------|------|
| 1 | {meta_question_1} | {meta_question_1_meaning} |
| 2 | {meta_question_2} | {meta_question_2_meaning} |

---

## 七、综合评估

| 项目 | 结论 |
|------|------|
| 命题状态 | {verdict} |
| 主要风险 | {main_risk} |
| 修正建议 | {fix_suggestion} |

---

## 假设脆弱度评估

| 假设 | 脆弱度 | 如果不成立 | 应对 |
|------|--------|-----------|------|
| {assumption_1} | {assumption_1_fragility} | {assumption_1_if_not} | {assumption_1_response} |
"""

TEMPLATES = {
    "first-principles": FIRST_PRINCIPLES_TEMPLATE,
    "value-assessment": VALUE_ASSESSMENT_TEMPLATE,
    "socratic": SOCRATIC_TEMPLATE,
}


def _fill_placeholders(template: str, answers: Dict[str, str], topic: str, date: str) -> str:
    """用答案填充模板占位符，未填写的保留为 ⚠️ [待补充]"""
    U = "⚠️ [待补充]"
    result = template.format(
        topic=topic, date=date,
        **{k: answers.get(k, U) for k in _extract_placeholders(template)}
    )
    # 清理 KeyError：替换未匹配的 {xxx}
    import re
    result = re.sub(r'\{(\w+)\}', U, result)
    return result


def _extract_placeholders(template: str):
    """提取模板中所有占位符名称"""
    import re
    return set(re.findall(r'\{(\w+)\}', template))


def generate_decision_doc(tool: str, topic: str, answers: Dict[str, str] = None,
                          output_path: Optional[str] = None) -> str:
    """
    生成决策文档

    Args:
        tool: 工具类型 (first-principles|value-assessment|socratic)
        topic: 决策主题
        answers: 已填写的答案字典
        output_path: 输出文件路径

    Returns:
        str: 生成的 Markdown 文档
    """
    if tool not in TEMPLATES:
        print(f"错误：未知工具类型: {tool}，可选: {list(TEMPLATES.keys())}", file=sys.stderr)
        sys.exit(1)

    answers = answers or {}
    now = datetime.now(get_local_tz()).strftime("%Y-%m-%d")

    doc = _fill_placeholders(TEMPLATES[tool], answers, topic, now)

    if output_path:
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        Path(output_path).write_text(doc, encoding="utf-8")

    return doc


# ─── CLI 入口 ─────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="决策文档生成")
    parser.add_argument("--tool", required=True,
                        choices=["first-principles", "value-assessment", "socratic"],
                        help="决策工具类型")
    parser.add_argument("--topic", required=True, help="决策主题")
    parser.add_argument("--answers-json", default="",
                        help="答案 JSON 文件（键值对，键对应模板占位符）")
    parser.add_argument("--output", default="",
                        help="输出文件路径（默认 stdout）")
    args = parser.parse_args()

    answers = {}
    if args.answers_json:
        try:
            answers = json.loads(Path(args.answers_json).read_text(encoding="utf-8"))
        except Exception as e:
            print(f"⚠️ 无法读取答案文件: {e}，将使用空答案生成", file=sys.stderr)

    doc = generate_decision_doc(args.tool, args.topic, answers, args.output or None)

    if args.output:
        print(f"✅ 决策文档已生成: {args.output}")
    else:
        print(doc)
