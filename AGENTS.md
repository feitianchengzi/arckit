# Arckit Skill Repository

This repository stores reusable skills for AI-agent-assisted software development.
Top-level directories can represent lifecycle stages or horizontal capability domains. Each directory can contain multiple
agent capability types over time. Reusable skills must live under that directory's
`skills/` directory.

## Arckit Scope

Arckit is a software-development agent collaboration and handoff protocol layer. It should help humans,
Codex-like single agents, and multi-agent automation platforms work from the same project facts, case state,
bounded worker packets, handoffs, and repository context.

Skills in this repository should primarily improve agent reliability in real software projects: context recovery,
fact-source governance, handoff quality, implementation boundaries, diagnosis, and safe continuation after a human
or another agent takes over. Capabilities whose core output depends on human aesthetic judgment, business priority,
organizational approval, or release authorization may be supported as analysis, evidence, pending context, or an
external-adapter handoff, but should not become silent final-decision skills in this repository.

## Arckit Architecture

Arckit is organized around the product axis that `Project State` 通过 `Case` 和 `Loop` 被持续推进。Project State is the recoverable software-project object; Case carries an explicit project-state advancement context; Loop is the bounded runtime cycle that produces evidence, handoffs, and verifiable state impact.

Desktop owns product/runtime control architecture; Codex-like coding agents own semantic reasoning, workspace execution, evidence collection, and structured claims; skills are installed agent capability packages that provide reusable protocols, methods, scripts, and artifact maintenance rules at the bottom layer.

Runtime kernel must preserve this product axis while staying policy-neutral: do not seed fixed initial gaps, route modes, worker roles, skill names, capability-selection heuristics, or ledger writeback dimension inferences; those choices must come from agent analysis or an explicit policy layer. Runtime invokes semantic Controller behavior through the manifest-declared `using-arckit` Agent skill trigger and invokes deterministic ledger behavior through trusted entrypoints declared by `arckit-development-ledger`; do not duplicate either skill's workflow inside Runtime.

## Directory Map

- `entry/`: project conversation control, skill routing, loop composition, and the development ledger that advances Project State through Case and Loop.
- `idea/`: opportunity discovery, idea collection, idea analysis, user feedback synthesis, and early problem framing.
- `thinking/`: cross-lifecycle process thinking capabilities, including reasoning, decision analysis, structured analysis, draft generation, candidate comparison, critique, and handoff preparation.
- `iteration/`: project iteration management, milestone planning, version rhythm, prioritization, and execution cadence.
- `definition/`: project definition artifacts, including product specifications, interaction design, visual design, and technical solutions.
- `memory/`: agent memory entry points and repository context navigation, such as maintaining `AGENTS.md`, `CLAUDE.md`, project indexes, and context maps.
- `media/`: media production and operations capabilities, including video production, social media operations, publishing workflows, and cross-platform adaptation.
- `engineering/`: technology-agnostic engineering workflows, including debugging, regression diagnosis, implementation coordination, refactoring strategy, and code-level investigation patterns.
- `quality/`: validation-focused capabilities, including code review, testing strategy, regression checks, acceptance checks, real-scenario evaluation, and release readiness review.
- `delivery/`: deployment, release, runtime environment, operations, monitoring, and incident handling.

## Placement Rules

Use the skill's primary purpose to choose a directory:

- If it controls project conversation rounds, routes across lifecycle skills, or maintains the ledger that drives the core Project State/Case/Loop entry, place it under `entry/skills/`.
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

Skills may reference each other as soft collaborators, but should not require hidden skill-to-skill runtime imports. A product or artifact skill can say that it may use the output of a method skill, but it must still describe its own inputs, outputs, and maintenance workflow. Prefer the relationship "upstream analysis output -> downstream artifact maintenance" over hidden automatic invocation. Explicit Runtime-to-skill invocation is allowed only through a capability manifest: use an Agent skill trigger for semantic work or a trusted in-skill entrypoint for deterministic script work.

For example, an authentication architecture note belongs in `definition/skills/`, a step-by-step gateway login implementation skill belongs in `arckit-code`, and a general debugging or regression-diagnosis workflow belongs in `engineering/skills/`.

## Current Skill Placement

- Project conversation Controller: `entry/skills/using-arckit/`
- Development ledger and continuous Project State/Case/Loop state: `entry/skills/arckit-development-ledger/`
- Product specification: `definition/skills/arckit-spec/`
- Interaction: `definition/skills/arckit-interaction/`
- Visual: `definition/skills/arckit-visual/`
- Technical solution: `definition/skills/arckit-tech/`
- General debug diagnosis and implementation troubleshooting: `engineering/skills/arckit-debug-diagnosis/`
- Runtime capability selection: `runtime/arckit-runtime/config/capability-policy.json`, restricted to the seven retained skills above and split into mutually exclusive Controller, Runtime, and Worker execution planes. `using-arckit` is Controller-only and is invoked with its manifest-declared Agent skill trigger; `arckit-development-ledger` is Runtime-only and is invoked through its trusted in-skill entrypoints; only the other five skills may enter Worker `allowed_skills`.
- Technology-stack-specific coding skills: maintained in `arckit-code`, not this repository.

Directories not listed above are reserved capability domains and currently contain no retained Arckit skills. Do not restore a removed skill reference as a dependency; unresolved work stays in the active case or is handed to an external adapter.

## Skill Folder Convention

Each skill should be a self-contained folder under a top-level directory's `skills/` directory with a required `SKILL.md`.
Use lowercase kebab-case names, such as `arckit-spec` or `arckit-debug-diagnosis`.

Keep `SKILL.md` focused on the core workflow. Put detailed references, scripts, templates, or assets inside the skill folder only when they directly support that skill.
