# Arckit Skill Repository

This repository stores reusable skills for AI-agent-assisted software development.
Top-level directories can represent lifecycle stages or horizontal capability domains. Each directory can contain multiple
agent capability types over time. Reusable skills must live under that directory's
`skills/` directory.

## Arckit Scope

Arckit is a software-development agent collaboration and handoff protocol layer. It should help humans,
Codex-like single agents, and automation platforms work from the same project facts, Case state,
bounded gaps, handoffs, and repository context.

Skills in this repository should primarily improve agent reliability in real software projects: context recovery,
fact-source governance, handoff quality, implementation boundaries, diagnosis, and safe continuation after a human
or another agent takes over. Capabilities whose core output depends on human aesthetic judgment, business priority,
organizational approval, or release authorization may be supported as analysis, evidence, pending context, or an
external-adapter handoff, but should not become silent final-decision skills in this repository.

## Arckit Architecture

Arckit is organized around the product axis that `Project State` 通过 `Case` 和 `Loop` 被持续推进。Project State is the recoverable software-project object; Case carries an explicit project-state advancement context; Loop is the bounded runtime cycle that produces evidence, handoffs, and verifiable state impact.

Desktop owns product/runtime control architecture; Codex-like coding agents own semantic reasoning, native skill selection, workspace execution, evidence collection, self-review, and structured claims; skills are installed agent capability packages that provide reusable protocols, methods, scripts, and artifact maintenance rules at the bottom layer. Runtime replaces the human automation around a Codex conversation, not the coherent Agent capability inside it.

Runtime kernel must preserve this product axis while staying policy-neutral: do not seed fixed initial gaps, route modes, worker roles, skill names, capability-selection heuristics, predictive path scopes, or ledger writeback dimension inferences; those choices come from the Codex Agent's semantic analysis. Each automated todo owns one persistent Codex thread from its first turn through serial Case gaps, validation, repair, context compaction, and Git closeout. Runtime persists the opaque thread id before the first turn, resumes that same thread after process restart, and compacts it between gaps when the latest request reaches 80% of the model context window. Runtime never creates separate Controller, Worker, Review, validation, repair, or commit threads. It invokes semantic behavior through the manifest-declared natural `$using-arckit` trigger and deterministic ledger behavior through trusted entrypoints declared by `arckit-development-ledger`; do not duplicate either skill's workflow inside Runtime.

## Directory Map

- `entry/`: project conversation control, skill routing, loop composition, and the development ledger that advances Project State through Case and Loop.
- `idea/`: opportunity discovery, idea collection, idea analysis, user feedback synthesis, and early problem framing.
- `thinking/`: cross-lifecycle process thinking capabilities, including reasoning, decision analysis, structured analysis, draft generation, candidate comparison, critique, and handoff preparation.
- `iteration/`: project iteration management, milestone planning, version rhythm, prioritization, and execution cadence.
- `definition/`: project definition artifacts, including product specifications, interaction design, visual design, and technical solutions.
- `memory/`: agent memory entry points and repository context navigation, such as maintaining `AGENTS.md`, `CLAUDE.md`, project indexes, and context maps.
- `media/`: media production and operations capabilities, including video production, social media operations, publishing workflows, and cross-platform adaptation.
- `engineering/`: technology-agnostic engineering workflows, including debugging, regression diagnosis, implementation coordination, refactoring strategy, and code-level investigation patterns.
- `code/`: language-, framework-, platform-, SDK-, and infrastructure-specific coding and integration workflows.
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
- If it tells agents how to code or integrate a specific language, framework, platform, SDK, cloud service, or stack, place it under `code/skills/`.
- If it checks whether implementation is correct and reliable, or maintains evaluation scenarios for validating product plans and agent workflows, place it under `quality/skills/`.
- If it helps ship, deploy, operate, or recover the system, place it under `delivery/skills/`.

When a skill could fit multiple directories, choose the one closest to the action the agent performs. Prefer horizontal capability directories for reusable methods that are intentionally used across lifecycle stages.

## Skill Composition Rules

Skills may reference each other as soft collaborators, but should not require hidden skill-to-skill runtime imports. A product or artifact skill can say that it may use the output of a method skill, but it must still describe its own inputs, outputs, and maintenance workflow. Prefer the relationship "upstream analysis output -> downstream artifact maintenance" over hidden automatic invocation. Explicit Runtime-to-skill invocation is allowed only through a capability manifest: use an Agent skill trigger for semantic work or a trusted in-skill entrypoint for deterministic script work.

For example, an authentication architecture note belongs in `definition/skills/`, a step-by-step gateway login implementation skill belongs in `code/skills/`, and a general debugging or regression-diagnosis workflow belongs in `engineering/skills/`.

## Current Skill Placement

- Project conversation Controller: `entry/skills/using-arckit/`
- Development ledger and continuous Project State/Case/Loop state: `entry/skills/arckit-development-ledger/`
- Explicit manual pending-context maintenance: `memory/skills/arckit-pending/`
- Product specification: `definition/skills/arckit-spec/`
- Interaction: `definition/skills/arckit-interaction/`
- Visual: `definition/skills/arckit-visual/`
- Technical solution: `definition/skills/arckit-tech/`
- General debug diagnosis and implementation troubleshooting: `engineering/skills/arckit-debug-diagnosis/`
- SwiftUI and Apple client coding practice: `code/skills/arckit-code-swiftui/`
- Feedback platform integration: `code/skills/arckit-feedback-platform-integration/`
- Alibaba Cloud OSS controlled image access: `code/skills/oss-controlled-image-access/`
- Runtime capability binding: `runtime/arckit-runtime/config/capability-policy.json`, which manages only the `using-arckit` Agent entry and `arckit-development-ledger` trusted Runtime entrypoints. Definition, diagnosis, code, quality, and user-installed skills remain available through Codex native skill discovery inside the coherent Agent thread; Runtime does not maintain a Worker registry.

The three `code/skills/` capabilities are distributed from this repository and may be selected natively by the Codex Agent; Runtime does not add them to an `allowed_skills` list or pre-associate them with a gap.

Directories not listed above are reserved capability domains and currently contain no retained Arckit skills. Do not restore a removed skill reference as a dependency. Automated Loop work keeps unresolved context in the active case or hands it to an external adapter; `arckit-pending` is a user-on-demand, explicitly invoked manual workspace and is not a Runtime dependency.

## Skill Folder Convention

Each skill should be a self-contained folder under a top-level directory's `skills/` directory with a required `SKILL.md`.
Use lowercase kebab-case names, such as `arckit-spec` or `arckit-debug-diagnosis`.

Keep `SKILL.md` focused on the core workflow. Put detailed references, scripts, templates, or assets inside the skill folder only when they directly support that skill.
