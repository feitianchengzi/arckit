#!/usr/bin/env python3
"""
Generate an Arckit role orchestration plan.

This script only creates a suggested plan. It does not execute skills, create
project artifacts, or imply that every stage is required. Coding implementation
is represented as an external handoff because concrete coding skills live in
arckit-code, not this repository.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[4]

SKILL_PATHS = {
    "arckit-market-research": "idea/skills/arckit-market-research/SKILL.md",
    "arckit-decision-framework": "thinking/skills/arckit-decision-framework/SKILL.md",
    "arckit-draft-spec": "thinking/skills/arckit-draft-spec/SKILL.md",
    "arckit-spec": "definition/skills/arckit-spec/SKILL.md",
    "arckit-explore-product-design": "thinking/skills/arckit-explore-product-design/SKILL.md",
    "arckit-interaction": "definition/skills/arckit-interaction/SKILL.md",
    "arckit-visual": "definition/skills/arckit-visual/SKILL.md",
    "arckit-architecture-decision": "thinking/skills/arckit-architecture-decision/SKILL.md",
    "arckit-domain-modeling": "thinking/skills/arckit-domain-modeling/SKILL.md",
    "arckit-tech": "definition/skills/arckit-tech/SKILL.md",
    "arckit-project-governance-workflow": "iteration/skills/arckit-project-governance-workflow/SKILL.md",
    "arckit-verify-implementation": "quality/skills/arckit-verify-implementation/SKILL.md",
    "arckit-code-review": "quality/skills/arckit-code-review/SKILL.md",
    "arckit-release-readiness": "delivery/skills/arckit-release-readiness/SKILL.md",
    "arckit-runtime-operations": "delivery/skills/arckit-runtime-operations/SKILL.md",
}

EXTERNAL_STAGES = {
    "external-code-implementation": {
        "role": "Engineer",
        "note": "Use ordinary coding workflow or a matching arckit-code skill. This repository does not provide concrete coding skills.",
    }
}

ROLE_BY_STAGE = {
    "arckit-market-research": "Research",
    "arckit-decision-framework": "Decision",
    "arckit-draft-spec": "Product",
    "arckit-spec": "Product Definition",
    "arckit-explore-product-design": "Product Design",
    "arckit-interaction": "Interaction",
    "arckit-visual": "Visual",
    "arckit-architecture-decision": "Architecture",
    "arckit-domain-modeling": "Domain Modeling",
    "arckit-tech": "Technical Definition",
    "arckit-project-governance-workflow": "Governance",
    "external-code-implementation": "Engineer",
    "arckit-verify-implementation": "Quality",
    "arckit-code-review": "Review",
    "arckit-release-readiness": "Delivery",
    "arckit-runtime-operations": "Operations",
}

FULL_CHAIN = [
    "arckit-market-research",
    "arckit-decision-framework",
    "arckit-draft-spec",
    "arckit-spec",
    "arckit-explore-product-design",
    "arckit-interaction",
    "arckit-visual",
    "arckit-architecture-decision",
    "arckit-domain-modeling",
    "arckit-tech",
    "arckit-project-governance-workflow",
    "external-code-implementation",
    "arckit-verify-implementation",
    "arckit-code-review",
    "arckit-release-readiness",
    "arckit-runtime-operations",
]

DEPS = {
    "arckit-decision-framework": ["arckit-market-research"],
    "arckit-draft-spec": ["arckit-decision-framework"],
    "arckit-spec": ["arckit-draft-spec"],
    "arckit-explore-product-design": ["arckit-spec"],
    "arckit-interaction": ["arckit-explore-product-design"],
    "arckit-visual": ["arckit-explore-product-design"],
    "arckit-architecture-decision": ["arckit-spec", "arckit-interaction", "arckit-visual"],
    "arckit-domain-modeling": ["arckit-architecture-decision"],
    "arckit-tech": ["arckit-architecture-decision", "arckit-domain-modeling"],
    "arckit-project-governance-workflow": ["arckit-spec", "arckit-tech"],
    "external-code-implementation": ["arckit-project-governance-workflow", "arckit-tech"],
    "arckit-verify-implementation": ["external-code-implementation"],
    "arckit-code-review": ["external-code-implementation"],
    "arckit-release-readiness": ["arckit-verify-implementation", "arckit-code-review"],
    "arckit-runtime-operations": ["arckit-release-readiness"],
}

OUTPUT_BY_STAGE = {
    "arckit-market-research": "market_research_handoff",
    "arckit-decision-framework": "decision_handoff",
    "arckit-draft-spec": "spec_draft_handoff",
    "arckit-spec": "document_scope",
    "arckit-explore-product-design": "design_exploration_handoff",
    "arckit-interaction": "document_scope",
    "arckit-visual": "document_scope",
    "arckit-architecture-decision": "architecture_decision_handoff",
    "arckit-domain-modeling": "domain_modeling_handoff",
    "arckit-tech": "document_scope",
    "arckit-project-governance-workflow": "governance_updates",
    "external-code-implementation": "implementation_changes",
    "arckit-verify-implementation": "verification_handoff",
    "arckit-code-review": "code_review_handoff",
    "arckit-release-readiness": "release_readiness_handoff",
    "arckit-runtime-operations": "runtime_operations_handoff",
}


def stage_status(stage: str) -> tuple[str, str]:
    if stage in EXTERNAL_STAGES:
        return "external", EXTERNAL_STAGES[stage]["note"]
    path = SKILL_PATHS.get(stage)
    if path and (REPO_ROOT / path).exists():
        return "available", path
    return "missing", path or "unknown skill path"


def build_plan(chain: list[str]) -> list[dict[str, object]]:
    stages = []
    for index, stage in enumerate(chain, 1):
        status, note = stage_status(stage)
        deps = [dep for dep in DEPS.get(stage, []) if dep in chain]
        stages.append(
            {
                "stage": index,
                "role": ROLE_BY_STAGE.get(stage, "Unknown"),
                "skill": stage,
                "depends_on": deps,
                "output": OUTPUT_BY_STAGE.get(stage, ""),
                "status": status,
                "note": note,
            }
        )
    return stages


def render_markdown(plan: list[dict[str, object]], mode: str, chain: list[str]) -> str:
    lines = [f"# Arckit Role Orchestration Plan (mode={mode})", ""]
    lines.append("This plan is advisory. Use only the stages that match the user's explicit scope.")
    lines.append("Role orchestration must be explicitly requested and does not replace result skills.")
    lines.append("")
    lines.append(f"Chain: {' -> '.join(chain)}")
    lines.append("")
    lines.append("| Stage | Role | Skill | Depends on | Output | Status |")
    lines.append("| --- | --- | --- | --- | --- | --- |")
    for item in plan:
        deps = ", ".join(item["depends_on"]) if item["depends_on"] else "-"
        lines.append(
            f"| {item['stage']} | {item['role']} | {item['skill']} | {deps} | {item['output']} | {item['status']} |"
        )
    lines.append("")
    lines.append("## Notes")
    lines.append("- Process skills produce handoff outputs; result skills decide whether and how to persist facts.")
    lines.append("- Concrete implementation belongs to ordinary coding workflow or arckit-code skills.")
    lines.append("- Missing or external stages do not block the plan; ask the user before executing any stage.")
    return "\n".join(lines)


def parse_chain(args: argparse.Namespace) -> list[str]:
    if args.mode == "none":
        return []

    chain = list(FULL_CHAIN)
    if args.mode == "sub":
        if not (args.from_stage and args.to_stage):
            raise SystemExit("mode=sub requires --from and --to")
        for stage in (args.from_stage, args.to_stage):
            if stage not in FULL_CHAIN:
                raise SystemExit(f"Unknown stage: {stage}. Available: {', '.join(FULL_CHAIN)}")
        start = chain.index(args.from_stage)
        end = chain.index(args.to_stage)
        if start > end:
            raise SystemExit("--from must appear before --to in the Arckit chain")
        chain = chain[start : end + 1]
    return chain


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate an Arckit role orchestration plan")
    parser.add_argument("--mode", choices=["full", "sub", "none"], default="full")
    parser.add_argument("--from", dest="from_stage", default="", help="Sub-chain start stage")
    parser.add_argument("--to", dest="to_stage", default="", help="Sub-chain end stage")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    args = parser.parse_args()

    if args.mode == "none":
        payload = {
            "mode": "none",
            "note": "No orchestration. Route directly to the smallest matching skill.",
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2) if args.json else payload["note"])
        return

    chain = parse_chain(args)
    plan = build_plan(chain)
    payload = {"mode": args.mode, "chain": chain, "stages": plan}
    print(json.dumps(payload, ensure_ascii=False, indent=2) if args.json else render_markdown(plan, args.mode, chain))


if __name__ == "__main__":
    main()
