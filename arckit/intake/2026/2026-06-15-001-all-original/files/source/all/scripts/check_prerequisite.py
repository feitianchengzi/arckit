#!/usr/bin/env python3
"""
check_prerequisite.py — 增强检测脚本（独立优先版）

检测上游 Skill 的交付物是否存在且内容满足增强条件。
所有 Skill 均可独立运行，上游交付物缺失时不阻断，仅输出质量影响提示。
衔接关系：有则增强，无则降级。

用法:
  python3 check_prerequisite.py --skill build --upstream-dir ./output
  python3 check_prerequisite.py --skill verify --upstream-dir ./output --json
"""

import argparse
import glob
import json
import sys
from pathlib import Path


# ─── 衔接关系定义（独立优先：有则增强，无则降级） ────────────

PREREQUISITES = {
    "insight": {
        "upstream": [
            {"skill": "operate", "deliverable": "*运营数据*", "check": "数据包含用户反馈",
             "quality_impact": "缺少运营数据时，洞察仅基于外部采集，无用户反馈维度",
             "fallback": "询问用户\"是否有现有用户反馈/客诉数据可提供？\""},
        ],
    },
    "decide": {
        "upstream": [
            {"skill": "insight", "deliverable": "*洞察报告*", "check": "报告包含结论段",
             "quality_impact": "缺少洞察报告时，决策缺乏市场数据支撑",
             "fallback": "向用户澄清\"决策所需的市场数据从何而来？\"若无法提供则标注假设"},
        ],
    },
    "prd-gen": {
        "upstream": [
            {"skill": "decide", "deliverable": "*决策*", "check": "决策结论明确（做/不做）",
             "quality_impact": "缺少决策文档时，PRD缺乏方向性约束",
             "fallback": "向用户澄清\"PRD的方向和优先级是否已明确？\""},
        ],
    },
    "design": {
        "upstream": [
            {"skill": "prd-gen", "deliverable": "*PRD*", "check": "PRD包含验收标准",
             "quality_impact": "缺少PRD时，设计缺乏验收标准约束",
             "fallback": "向用户澄清\"验收标准是什么？交互规格有哪些要求？\""},
        ],
    },
    "arch": {
        "upstream": [
            {"skill": "design", "deliverable": "*设计系统*或*MASTER.md*", "check": "设计系统包含组件规格",
             "quality_impact": "缺少设计系统时，架构缺乏组件规格约束",
             "fallback": "向用户澄清\"技术约束有哪些？（性能/交互/组件规格）\""},
        ],
    },
    "model": {
        "upstream": [
            {"skill": "arch", "deliverable": "*ADR*或*架构文档*", "check": "ADR包含上下文划分",
             "quality_impact": "缺少ADR时，领域建模缺乏系统边界约束",
             "fallback": "向用户澄清\"核心业务流程是什么？子域有哪些？业务边界在哪里？\""},
        ],
    },
    "build": {
        "upstream": [
            {"skill": "model", "deliverable": "*领域模型*", "check": "模型通过quick校验",
             "quality_impact": "缺少领域模型时，编码结构可能偏离DDD规范",
             "fallback": "向用户澄清\"技术栈是什么？项目结构怎么组织？\""},
            {"skill": "arch", "deliverable": "*ADR*", "check": "ADR已接受",
             "quality_impact": "缺少ADR时，技术选型可能不一致",
             "fallback": "向用户澄清\"编码规范有哪些？lint/format配置？\""},
        ],
    },
    "verify": {
        "upstream": [
            {"skill": "build", "deliverable": "*源代码*或*测试文件*", "check": "测试文件存在",
             "quality_impact": "缺少build产出时，验证范围不明确",
             "fallback": "向用户澄清\"待验证的代码路径？验收标准？\""},
        ],
    },
    "review": {
        "upstream": [
            {"skill": "verify", "deliverable": "*验证报告*", "check": "报告标记通过",
             "quality_impact": "缺少验证报告时，审查缺乏验证依据",
             "fallback": "向用户澄清\"审查范围？哪些文件/PR？\""},
            {"skill": "build", "deliverable": "*代码变更*", "check": "diff存在",
             "quality_impact": "缺少代码变更时，审查范围不明确",
             "fallback": "向用户澄清\"审查范围？git diff还是PR？\""},
        ],
    },
    "ship": {
        "upstream": [
            {"skill": "review", "deliverable": "*审查报告*", "check": "无Critical问题",
             "quality_impact": "缺少审查报告时，发布质量未经代码审查确认",
             "fallback": "向用户澄清\"代码是否已通过审查？若无，请确认风险后决定是否继续\""},
            {"skill": "verify", "deliverable": "*验证报告*", "check": "报告标记通过",
             "quality_impact": "缺少验证报告时，发布质量未经功能验证确认",
             "fallback": "向用户澄清\"功能是否已通过验证？若无，请确认风险后决定是否继续\""},
        ],
    },
    "operate": {
        "upstream": [
            {"skill": "ship", "deliverable": "*发布记录*", "check": "发布成功确认",
             "quality_impact": "缺少发布记录时，监控缺乏发布基线对比",
             "fallback": "向用户澄清\"监控目标？健康检查URL？日志路径？\""},
        ],
    },
}


# ─── 内容契约校验函数（验证交付物内容满足下游输入要求） ────────

def _check_insight_to_decide(content: str) -> bool:
    """洞察报告 → 决策：报告包含结论段"""
    return "结论" in content or "洞察" in content or "发现" in content

def _check_decide_to_prdgen(content: str) -> bool:
    """决策文档 → PRD：决策结论明确（做/不做）"""
    return any(kw in content for kw in ["做", "不做", "通过", "推荐", "选择"])

def _check_prdgen_to_design(content: str) -> bool:
    """PRD → 设计：PRD包含验收标准"""
    return "验收标准" in content or "AC" in content or "验收" in content

def _check_design_to_arch(content: str) -> bool:
    """设计系统 → 架构：设计系统包含组件规格"""
    return any(kw in content for kw in ["组件", "设计系统", "MASTER", "规格", "component"])

def _check_arch_to_model(content: str) -> bool:
    """ADR → 模型：ADR包含上下文划分"""
    return any(kw in content for kw in ["上下文", "限界", "Context", "子域"])

def _check_model_to_build(content: str) -> bool:
    """领域模型 → 编码：模型包含聚合定义"""
    return "聚合" in content or "aggregate" in content.lower()

def _check_build_to_verify(content: str) -> bool:
    """源代码 → 验证：测试文件存在"""
    return "test" in content.lower() or "测试" in content or "spec" in content.lower()

def _check_verify_to_review(content: str) -> bool:
    """验证报告 → 审查：报告标记通过"""
    return "通过" in content or "PASS" in content or "✅" in content

def _check_review_to_ship(content: str) -> bool:
    """审查报告 → 发布：无Critical问题"""
    # 检查是否有Critical级别的错误
    has_critical = "Critical" in content or "❌" in content.split("\n")[0] if "\n" in content else False
    return not has_critical

def _check_ship_to_operate(content: str) -> bool:
    """发布记录 → 运营：发布成功确认"""
    return any(kw in content for kw in ["发布成功", "deployed", "完成", "✅"])

def _check_operate_to_insight(content: str) -> bool:
    """运营数据 → 洞察：数据包含用户反馈"""
    return any(kw in content for kw in ["用户", "反馈", "行为", "转化"])


# 衔接点 → 契约校验函数 映射
CONTENT_CHECKS = {
    ("insight", "decide"): _check_insight_to_decide,
    ("decide", "prd-gen"): _check_decide_to_prdgen,
    ("prd-gen", "design"): _check_prdgen_to_design,
    ("design", "arch"): _check_design_to_arch,
    ("arch", "model"): _check_arch_to_model,
    ("model", "build"): _check_model_to_build,
    ("build", "verify"): _check_build_to_verify,
    ("verify", "review"): _check_verify_to_review,
    ("review", "ship"): _check_review_to_ship,
    ("ship", "operate"): _check_ship_to_operate,
    ("operate", "insight"): _check_operate_to_insight,
}


def _read_file_content(filepath: str) -> str:
    """安全读取文件内容，失败返回空字符串"""
    try:
        return Path(filepath).read_text(encoding="utf-8", errors="replace")
    except Exception:
        return ""


# ─── 增强提取：从上游交付物提取结构化增强数据 ──────────────

# 每个衔接点定义：从交付物中提取哪些字段，增强下游的哪个步骤
ENHANCEMENT_SPECS = {
    ("operate", "insight"): {
        "extract": ["用户反馈", "行为数据", "转化指标"],
        "inject_to": "Step 2 多渠道采集",
        "effect": "洞察包含用户反馈维度，形成闭环",
    },
    ("insight", "decide"): {
        "extract": ["关键发现", "信号列表", "结论段"],
        "inject_to": "Step 1 决策输入",
        "effect": "决策有市场数据支撑，减少假设",
    },
    ("decide", "prd-gen"): {
        "extract": ["决策结论(做/不做)", "优先级", "约束条件"],
        "inject_to": "Step 2 收集前置输入",
        "effect": "PRD有方向性约束，减少需求歧义",
    },
    ("prd-gen", "design"): {
        "extract": ["验收标准", "功能列表", "交互需求"],
        "inject_to": "Step 1 设计brief",
        "effect": "设计有验收标准约束，减少设计偏差",
    },
    ("design", "arch"): {
        "extract": ["组件规格", "技术栈偏好", "交互模式"],
        "inject_to": "Step 1 约束清单",
        "effect": "架构约束包含组件规格，减少技术冲突",
    },
    ("arch", "model"): {
        "extract": ["上下文划分", "技术选型", "系统边界"],
        "inject_to": "Step 1 战略设计",
        "effect": "领域模型有系统边界约束，减少边界模糊",
    },
    ("model", "build"): {
        "extract": ["聚合根", "实体", "值对象", "领域事件", "不变量"],
        "inject_to": "编码结构提取",
        "effect": "代码结构遵循DDD规范，减少架构偏离",
    },
    ("arch", "build"): {
        "extract": ["技术栈", "编码规范", "模块边界", "接口契约"],
        "inject_to": "编码结构提取",
        "effect": "技术选型一致，减少规范冲突",
    },
    ("build", "verify"): {
        "extract": ["测试清单", "代码路径", "测试框架"],
        "inject_to": "Step 1 验证范围",
        "effect": "验证范围完整，减少遗漏",
    },
    ("verify", "review"): {
        "extract": ["验证通过状态", "问题清单", "覆盖范围"],
        "inject_to": "Step 1 审查范围",
        "effect": "审查有验证依据，减少重复验证",
    },
    ("build", "review"): {
        "extract": ["代码变更diff", "变更文件列表"],
        "inject_to": "Step 1 审查范围",
        "effect": "审查范围精确，减少审查遗漏",
    },
    ("review", "ship"): {
        "extract": ["Critical问题数", "Important问题数", "审查结论"],
        "inject_to": "Step 1 门禁检查",
        "effect": "发布有质量门禁，减少上线风险",
    },
    ("verify", "ship"): {
        "extract": ["验证通过状态", "验证覆盖范围"],
        "inject_to": "Step 1 门禁检查",
        "effect": "发布有功能验证依据，减少上线风险",
    },
    ("ship", "operate"): {
        "extract": ["版本号", "发布时间", "变更范围"],
        "inject_to": "模式B 健康监控",
        "effect": "监控有发布基线，快速定位发布问题",
    },
}


def detect_enhancement(skill_name: str, upstream_dir: str) -> dict:
    """检测并提取上游增强数据（Step 0 增强注入的核心函数）

    返回结构化增强数据，供 Skill 工作流注入使用。
    无上游交付物时返回空增强，不阻断。
    """
    if skill_name not in PREREQUISITES:
        return {"skill": skill_name, "enhancements": [], "summary": "无上游定义"}

    upstream_path = Path(upstream_dir) if upstream_dir else Path(".")
    enhancements = []

    for prereq in PREREQUISITES[skill_name]["upstream"]:
        upstream_skill = prereq["skill"]
        deliverable_pattern = prereq["deliverable"]
        key = (upstream_skill, skill_name)
        spec = ENHANCEMENT_SPECS.get(key, {})

        # 搜索交付物文件
        found_files = []
        if upstream_path.exists():
            pattern = str(upstream_path / "**" / deliverable_pattern)
            found_files = glob.glob(pattern, recursive=True)
        if not found_files and upstream_path.exists():
            found_files = list(upstream_path.rglob(f"*{upstream_skill}*"))

        found = len(found_files) > 0

        # 内容契约校验
        content_ok = True
        if found_files:
            content = _read_file_content(found_files[0])
            cc = _check_content(upstream_skill, skill_name, content)
            content_ok = cc["content_ok"]

        enhancements.append({
            "from": upstream_skill,
            "found": found,
            "content_ok": content_ok,
            "available": found and content_ok,
            "extract_fields": spec.get("extract", []),
            "inject_to": spec.get("inject_to", ""),
            "effect": spec.get("effect", ""),
            "fallback": prereq.get("fallback", ""),
            "files": [str(f) for f in found_files[:3]] if found_files else [],
        })

    available_count = sum(1 for e in enhancements if e["available"])
    total_count = len(enhancements)

    if total_count == 0:
        summary = "无上游增强定义"
    elif available_count == total_count:
        summary = f"✅ 全部增强可用（{available_count}/{total_count}）"
    elif available_count > 0:
        summary = f"⚠️ 部分增强可用（{available_count}/{total_count}），其余降级运行"
    else:
        summary = f"⚠️ 无增强可用（0/{total_count}），全部降级运行"

    return {
        "skill": skill_name,
        "enhancements": enhancements,
        "summary": summary,
        "available_count": available_count,
        "total_count": total_count,
    }


def _check_content(upstream_skill: str, downstream_skill: str, content: str) -> dict:
    """对交付物内容执行契约校验"""
    key = (upstream_skill, downstream_skill)
    checker = CONTENT_CHECKS.get(key)
    if not checker:
        return {"content_ok": True, "content_note": "无定义契约校验，跳过"}
    try:
        ok = checker(content)
        return {
            "content_ok": ok,
            "content_note": "契约校验通过" if ok else "契约校验失败：内容不满足下游输入要求",
        }
    except Exception as e:
        return {"content_ok": False, "content_note": f"契约校验异常: {e}"}


def check_prerequisite(skill_name: str, upstream_dir: str) -> dict:
    """检测指定 Skill 的上游增强项（不阻断，仅提示质量影响）"""
    if skill_name not in PREREQUISITES:
        return {"ok": True, "skill": skill_name, "note": "未知 Skill，跳过增强检测",
                "quality_warnings": []}

    prereqs = PREREQUISITES[skill_name]
    upstream_path = Path(upstream_dir) if upstream_dir else Path(".")

    results = []
    quality_warnings = []

    for prereq in prereqs["upstream"]:
        upstream_skill = prereq["skill"]
        deliverable_pattern = prereq["deliverable"]
        check_desc = prereq["check"]
        quality_impact = prereq.get("quality_impact", "")
        fallback = prereq.get("fallback", "")

        # 搜索交付物文件
        found_files = []
        if upstream_path.exists():
            pattern = str(upstream_path / "**" / deliverable_pattern)
            found_files = glob.glob(pattern, recursive=True)

        if not found_files and upstream_path.exists():
            found_files = list(upstream_path.rglob(f"*{upstream_skill}*"))

        found = len(found_files) > 0

        # 内容契约校验
        content_ok = True
        content_note = ""
        if found_files:
            content = _read_file_content(found_files[0])
            cc = _check_content(upstream_skill, skill_name, content)
            content_ok = cc["content_ok"]
            content_note = cc["content_note"]

        # 状态判定（全部为非阻断）
        if not found:
            status = "⚠️ 缺失（降级运行）"
            if quality_impact:
                quality_warnings.append(f"[{upstream_skill}→{skill_name}] {quality_impact}")
        elif not content_ok:
            status = "⚠️ 存在但契约不通过（降级运行）"
            if quality_impact:
                quality_warnings.append(f"[{upstream_skill}→{skill_name}] 契约不通过：{quality_impact}")
        else:
            status = "✅ 增强"

        results.append({
            "upstream_skill": upstream_skill,
            "deliverable": deliverable_pattern,
            "check": check_desc,
            "found": found,
            "found_files": [str(f) for f in found_files[:5]],
            "content_ok": content_ok,
            "content_note": content_note,
            "quality_impact": quality_impact,
            "fallback": fallback,
            "status": status,
        })

    # 汇总（永远 ok=True，Skill始终可独立运行）
    if not prereqs["upstream"]:
        verdict = "✅ 无上游增强要求"
    elif not quality_warnings:
        verdict = "✅ 增强检测通过（所有上游交付物可用）"
    else:
        verdict = f"⚠️ 可独立运行（{len(quality_warnings)}项增强缺失，将降级运行）"

    return {
        "ok": True,
        "skill": skill_name,
        "results": results,
        "verdict": verdict,
        "quality_warnings": quality_warnings,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="增强检测（独立优先，有则增强无则降级）")
    parser.add_argument("--skill", required=True, help="当前 Skill 名称")
    parser.add_argument("--upstream-dir", default=".", help="上游交付物目录")
    parser.add_argument("--detect-enhancement", action="store_true",
                        help="输出结构化增强数据（提取字段/注入位置/增强效果）")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    if args.detect_enhancement:
        # Step 0 增强注入模式
        result = detect_enhancement(args.skill, args.upstream_dir)
        if args.json:
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            print(f"🔗 Step 0 增强注入: {args.skill}")
            print(f"   {result['summary']}")
            print("")
            for e in result["enhancements"]:
                if e["available"]:
                    print(f"   ✅ {e['from']} → 提取: {', '.join(e['extract_fields'])}")
                    print(f"      注入: {e['inject_to']}")
                    print(f"      效果: {e['effect']}")
                    for f in e["files"]:
                        print(f"      📄 {f}")
                else:
                    print(f"   ⚠️ {e['from']} 不可用，降级运行")
                    print(f"      降级: {e['fallback']}")
    else:
        result = check_prerequisite(args.skill, args.upstream_dir)

        if args.json:
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            print(f"🔍 增强检测: {args.skill}")
            print(f"   {result['verdict']}")
            for r in result.get("results", []):
                print(f"   {r['status']} | {r['upstream_skill']}: {r['check']}")
                if r.get("content_note"):
                    print(f"     📋 {r['content_note']}")
                if r.get("fallback") and "缺失" in r["status"]:
                    print(f"     🔧 降级方式: {r['fallback']}")
                if r.get("found_files"):
                    for f in r["found_files"][:3]:
                        print(f"     📄 {f}")
            if result.get("quality_warnings"):
                print("")
                print("   ⚠️ 质量影响:")
                for w in result["quality_warnings"]:
                    print(f"     - {w}")
