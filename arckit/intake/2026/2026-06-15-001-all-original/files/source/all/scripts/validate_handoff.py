#!/usr/bin/env python3
"""
validate_handoff.py — 全链路衔接检测（建议模式）

检测 README.md 定义的全部 11 个衔接点的增强状态，
对每个衔接点执行文件存在性检查 + 内容契约检测，
输出全链路增强建议（不阻断，仅提示质量影响）。

用法:
  python3 validate_handoff.py --output-dir ./output
  python3 validate_handoff.py --output-dir ./output --json
  python3 validate_handoff.py --output-dir ./output --skill build  # 仅检查单个Skill的上游
"""

import argparse
import json
import sys
from pathlib import Path

# 复用 check_prerequisite 的契约校验逻辑
sys.path.insert(0, str(Path(__file__).parent))
from check_prerequisite import check_prerequisite, PREREQUISITES

# README 定义的衔接明细（顺序与 README.md 一致）
HANDOFF_CHAIN = [
    {"from": "insight",  "to": "decide",  "deliverable": "竞品报告",   "check": "报告包含结论段"},
    {"from": "decide",   "to": "prd-gen", "deliverable": "决策文档",   "check": "决策结论明确（做/不做）"},
    {"from": "prd-gen",  "to": "design",  "deliverable": "PRD文档",    "check": "PRD包含验收标准"},
    {"from": "design",   "to": "arch",    "deliverable": "设计系统",   "check": "设计系统包含组件规格"},
    {"from": "arch",     "to": "model",   "deliverable": "ADR",        "check": "ADR包含上下文划分"},
    {"from": "model",    "to": "build",   "deliverable": "领域模型",   "check": "模型通过quick校验"},
    {"from": "build",    "to": "verify",  "deliverable": "源代码",     "check": "测试文件存在"},
    {"from": "verify",   "to": "review",  "deliverable": "测试报告",   "check": "报告标记通过"},
    {"from": "review",   "to": "ship",    "deliverable": "审查报告",   "check": "无Critical问题"},
    {"from": "ship",     "to": "operate", "deliverable": "发布记录",   "check": "发布成功确认"},
    {"from": "operate",  "to": "insight", "deliverable": "运营数据",   "check": "数据包含用户反馈"},
]


def validate_chain(output_dir: str) -> dict:
    """检测全链路衔接增强状态（建议模式，不阻断）"""
    results = []
    enhanced_count = 0

    for handoff in HANDOFF_CHAIN:
        downstream = handoff["to"]
        # 调用 check_prerequisite 检测下游 Skill 的上游增强项
        prereq_result = check_prerequisite(downstream, output_dir)

        # 找到对应衔接点的结果
        matched = None
        for r in prereq_result.get("results", []):
            if r["upstream_skill"] == handoff["from"]:
                matched = r
                break

        if matched:
            ok = matched["found"] and matched.get("content_ok", True)
            if ok:
                status = "✅ 增强"
                enhanced_count += 1
            elif matched["found"]:
                status = "⚠️ 存在但契约不通过"
            else:
                status = "⚠️ 缺失（降级运行）"
        else:
            ok = False
            status = "⚠️ 未定义衔接关系"

        results.append({
            "handoff": f"{handoff['from']}→{handoff['to']}",
            "from": handoff["from"],
            "to": handoff["to"],
            "deliverable": handoff["deliverable"],
            "check": handoff["check"],
            "ok": ok,
            "status": status,
            "detail": matched,
        })

    # 质量等级判定
    total = len(results)
    if enhanced_count == total:
        quality_level = "完整"
    elif enhanced_count > 0:
        quality_level = "部分"
    else:
        quality_level = "空"

    return {
        "ok": True,  # 永远 True，衔接是增强不是阻断
        "quality_level": quality_level,
        "chain": results,
        "verdict": f"✅ 全链路增强完整" if quality_level == "完整"
                   else f"⚠️ 可独立运行（{enhanced_count}/{total}项增强可用，{total - enhanced_count}项降级运行）",
        "total": total,
        "enhanced": enhanced_count,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="全链路衔接检测（建议模式）")
    parser.add_argument("--output-dir", default=".", help="交付物目录")
    parser.add_argument("--skill", default="", help="仅检查单个Skill的上游（可选）")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    if args.skill:
        # 单 Skill 模式
        result = check_prerequisite(args.skill, args.output_dir)
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
    else:
        # 全链路模式
        result = validate_chain(args.output_dir)
        if args.json:
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            print("🔗 全链路衔接检测（建议模式）")
            print(f"   {result['verdict']}")
            print(f"   质量等级: {result['quality_level']}  增强: {result['enhanced']}/{result['total']}")
            print("")
            for r in result["chain"]:
                print(f"   {r['status']}  {r['handoff']}: {r['deliverable']} → {r['check']}")
                if r.get("detail") and r["detail"].get("content_note"):
                    print(f"          📋 {r['detail']['content_note']}")
                if r.get("detail") and r["detail"].get("fallback") and "缺失" in r["status"]:
                    print(f"          🔧 降级: {r['detail']['fallback']}")
