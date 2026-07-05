# Arckit Skill Repository

This repository stores reusable skills for AI-agent-assisted software development.
Top-level directories can represent lifecycle stages or horizontal capability domains. Each directory can contain multiple
agent capability types over time. Reusable skills must live under that directory's
`skills/` directory.

## Arckit Scope

Arckit is a software-development agent collaboration and handoff protocol layer. It should help humans,
Codex-like single agents, and multi-agent automation platforms work from the same project facts, case state,
handoffs, pending items, workflow memory, and agent startup context.

Skills in this repository should primarily improve agent reliability in real software projects: context recovery,
fact-source governance, handoff quality, implementation boundaries, diagnosis, and safe continuation after a human
or another agent takes over. Capabilities whose core output depends on human aesthetic judgment, business priority,
organizational approval, or release authorization may be supported as analysis, evidence, pending context, or an
external-adapter handoff, but should not become silent final-decision skills in this repository.

## Directory Map

- `entry/`: cross-lifecycle entry points, skill routing, workflow composition, and scenario-to-skill orchestration.
- `idea/`: opportunity discovery, idea collection, idea analysis, user feedback synthesis, and early problem framing.
- `thinking/`: cross-lifecycle process thinking capabilities, including reasoning, decision frameworks, structured analysis, draft generation, candidate comparison, critique, and handoff preparation.
- `iteration/`: project iteration management, milestone planning, version rhythm, prioritization, and execution cadence.
- `definition/`: project definition artifacts, including product specifications, interaction design, visual design, and technical solutions.
- `memory/`: agent memory entry points and repository context navigation, such as maintaining `AGENTS.md`, `CLAUDE.md`, project indexes, and context maps.
- `media/`: media production and operations capabilities, including video production, social media operations, publishing workflows, and cross-platform adaptation.
- `engineering/`: technology-agnostic engineering workflows, including debugging, regression diagnosis, implementation coordination, refactoring strategy, and code-level investigation patterns.
- `quality/`: validation-focused capabilities, including code review, testing strategy, regression checks, acceptance checks, real-scenario evaluation, and release readiness review.
- `delivery/`: deployment, release, runtime environment, operations, monitoring, and incident handling.

## Placement Rules

Use the skill's primary purpose to choose a directory:

- If it is the top-level entry point that routes user scenarios across multiple lifecycle skills, place it under `entry/skills/`.
- If it helps decide whether an idea is worth pursuing, place it under `idea/skills/`.
- If it provides reusable process capabilities such as reasoning, decision analysis, critique, draft generation, candidate comparison, or handoff preparation across multiple lifecycle stages, place it under `thinking/skills/`.
- If it manages when and how work moves forward, place it under `iteration/skills/`.
- If it defines what the project is, how it behaves, how it looks, or how it is technically shaped, place it under `definition/skills/`.
- If it helps agents understand and reuse project context across sessions, place it under `memory/skills/`.
- If it supports media production, video creation, social media operations, publishing, or platform adaptation, place it under `media/skills/`.
- If it guides technology-agnostic engineering diagnosis, implementation coordination, refactoring strategy, or code-level investigation, place it under `engineering/skills/`.
- If it tells agents how to code in a specific language, framework, platform, or stack, do not place it in this repository; maintain it in `arckit-code`.
- If it checks whether implementation is correct and reliable, or maintains evaluation scenarios for validating product plans and agent workflows, place it under `quality/skills/`.
- If it helps ship, deploy, operate, or recover the system, place it under `delivery/skills/`.

When a skill could fit multiple directories, choose the one closest to the action the agent performs. Prefer horizontal capability directories for reusable methods that are intentionally used across lifecycle stages.

## Skill Composition Rules

Skills may reference each other as soft collaborators, but should not require runtime skill imports. A product or artifact skill can say that it may use the output of a method skill, but it must still describe its own inputs, outputs, and maintenance workflow. Prefer the relationship "upstream analysis output -> downstream artifact maintenance" over hidden automatic invocation.

For example, an authentication architecture note belongs in `definition/skills/`, a step-by-step gateway login implementation skill belongs in `arckit-code`, and a general debugging or regression-diagnosis workflow belongs in `engineering/skills/`.

## Current Skill Placement

- Arckit entry routing and workflow composition: `entry/skills/`
- Project iteration management: `iteration/skills/`
- Product-level development work item discovery: `iteration/skills/`
- Workshop Desktop execution bridge: `iteration/skills/`
- Cross-lifecycle process thinking, decision frameworks, draft generation, and handoff preparation: `thinking/skills/`
- Idea collection and analysis: `idea/skills/`
- Product specification: `definition/skills/`
- Interaction: `definition/skills/`
- Visual: `definition/skills/`
- Technical solution: `definition/skills/`
- Development ledger and project continuous state: `memory/skills/`
- Agent startup context and AGENTS.md governance: `memory/skills/`
- Project input intake: `memory/skills/`
- Project pending context management: `memory/skills/`
- Media production, video, and social operations: `media/skills/`
- General debug diagnosis and implementation troubleshooting: `engineering/skills/`
- Implementation handoff and refactor strategy: `engineering/skills/`
- Real software development scenario evaluation: `quality/skills/`
- Technology-stack-specific coding skills: maintained in `arckit-code`, not this repository.
- Server deployment: `delivery/skills/`

## Skill Folder Convention

Each skill should be a self-contained folder under a top-level directory's `skills/` directory with a required `SKILL.md`.
Use lowercase kebab-case names, such as `arckit-spec` or `arckit-debug-diagnosis`.

Keep `SKILL.md` focused on the core workflow. Put detailed references, scripts, templates, or assets inside the skill folder only when they directly support that skill.
