#!/usr/bin/env python3
"""
generate_plan.py — 编排计划生成器（orchestrate 的执行前规划）

把"研发全链路"拆成可执行的 stages 计划。关键：只生成计划，不执行
（胶水层非运行时）。执行由 Agent 按 orchestrate/SKILL.md 串联各 Skill 完成。

纪律（orchestrate 铁律）：
  - 编排是便利层非耦合层：计划里引用的 Skill 若缺失，对应 stage 标记降级，不阻断
  - 每个 Skill 仍可独立运行：计划只是"建议顺序 + 依赖标注"

三种模式：
  --mode full   全链路 insight → ... → operate
  --mode sub    子链 --from insight --to arch
  --mode none   不编排（退化为单 Skill 路由提示）

用法：
  python3 generate_plan.py --mode full
  python3 generate_plan.py --mode sub --from prd-gen --to build
  python3 generate_plan.py --mode full --json
"""

import argparse
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
STAGE_DIRS = ["01-pm", "02-design", "03-architect", "04-engineer", "05-lead", "06-sre"]

# 全链路顺序（与 README 衔接图一致）
FULL_CHAIN = [
    "insight", "decide", "prd-gen", "design", "arch", "model",
    "build", "verify", "review", "ship", "operate",
]

# 每个 Skill 的直接上游（增强项，缺失则该 Skill 降级运行）
DEPS = {
    "insight": ["operate"],   # 闭环：运营数据反馈洞察
    "decide": ["insight"],
    "prd-gen": ["decide"],
    "design": ["prd-gen"],
    "arch": ["design"],
    "model": ["arch"],
    "build": ["model", "arch", "design"],
    "verify": ["build"],
    "review": ["verify"],
    "ship": ["review"],
    "operate": ["ship"],
}


def skill_exists(name: str) -> bool:
    """检查 Skill 目录是否存在（决定该站是正常还是降级）。"""
    for stage in STAGE_DIRS:
        if (REPO / stage / name / "SKILL.md").exists():
            return True
    return False


def build_plan(chain: list) -> list:
    """根据链路生成 stages 计划。"""
    stages = []
    for i, skill in enumerate(chain, 1):
        deps = [d for d in DEPS.get(skill, []) if d in chain]
        exists = skill_exists(skill)
        stages.append({
            "stage": i,
            "skill": skill,
            "depends_on": deps,
            "skill_exists": exists,
            "status": "ok" if exists else "⚠️ Skill 目录缺失，降级（用户手动指定）",
        })
    return stages


def render(plan: list, mode: str, chain: list) -> str:
    lines = [f"# 编排计划（mode={mode}）", ""]
    lines.append("> 纪律：编排是便利层非耦合层。计划引用的 Skill 缺失则降级，不阻断。")
    lines.append("> 每个 Skill 仍可独立运行；本计划只是建议顺序 + 依赖标注。")
    lines.append("")
    lines.append(f"链路：{' → '.join(chain)}")
    lines.append("")
    lines.append("| Stage | Skill | 依赖(增强) | 状态 |")
    lines.append("|-------|-------|-----------|------|")
    for s in plan:
        deps = ", ".join(s["depends_on"]) if s["depends_on"] else "—"
        lines.append(f"| {s['stage']} | {s['skill']} | {deps} | {s['status']} |")
    lines.append("")
    lines.append("## 执行原则")
    lines.append("- 每站作为独立子 Agent 运行（独立 context），主 Agent 只传交付物摘要，避免上下文腐化")
    lines.append("- 任一 Skill 无上游时走该 Skill 自己的降级（向用户澄清），不阻断整条链")
    lines.append("- `build` 节点内部会路由到 build-fe / build-be（可并行）")
    lines.append("- 子 Agent 编排不可用时，降级为主 Agent 顺序执行，仍遵守隔离纪律")
    return "\n".join(lines)


def _cli():
    parser = argparse.ArgumentParser(description="编排计划生成器（不执行，只规划）")
    parser.add_argument("--mode", choices=["full", "sub", "none"], default="full", help="编排模式")
    parser.add_argument("--from", dest="from_skill", default="", help="子链起点（mode=sub）")
    parser.add_argument("--to", dest="to_skill", default="", help="子链终点（mode=sub）")
    parser.add_argument("--json", action="store_true", help="输出 JSON 而非 Markdown")
    args = parser.parse_args()

    if args.mode == "none":
        msg = {
            "mode": "none",
            "note": "不编排。每个 Skill 都可独立运行，按需直接调用单个 Skill。",
        }
        if args.json:
            print(json.dumps(msg, ensure_ascii=False, indent=2))
        else:
            print("不编排（mode=none）。每个 Skill 都可独立运行，按需直接调用单个 Skill。")
        return

    chain = list(FULL_CHAIN)

    if args.mode == "sub":
        if not (args.from_skill and args.to_skill):
            parser.error("mode=sub 需要 --from 和 --to")
        for s in (args.from_skill, args.to_skill):
            if s not in FULL_CHAIN:
                parser.error(f"未知 Skill: {s}（可选: {', '.join(FULL_CHAIN)}）")
        i, j = chain.index(args.from_skill), chain.index(args.to_skill)
        if i > j:
            parser.error("--from 必须在 --to 之前（按全链路顺序）")
        chain = chain[i:j + 1]

    plan = build_plan(chain)
    if args.json:
        print(json.dumps({"mode": args.mode, "chain": chain, "stages": plan}, ensure_ascii=False, indent=2))
    else:
        print(render(plan, args.mode, chain))


if __name__ == "__main__":
    _cli()
