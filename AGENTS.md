# Arckit Skill Repository

This repository stores reusable skills for AI-agent-assisted software development.
Top-level directories represent lifecycle stages. Each stage can contain multiple
agent capability types over time. Reusable skills must live under that stage's
`skills/` directory.

## Directory Map

- `idea/`: opportunity discovery, idea collection, idea analysis, user feedback synthesis, and early problem framing.
- `iteration/`: project iteration management, milestone planning, version rhythm, prioritization, and execution cadence.
- `definition/`: project definition artifacts, including product specifications, interaction design, visual design, and technical solutions.
- `memory/`: agent memory entry points and repository context navigation, such as maintaining `AGENTS.md`, `CLAUDE.md`, project indexes, and context maps.
- `engineering/`: implementation-focused capabilities, including platform development, frontend/backend practices, authentication integration, and concrete coding workflows.
- `quality/`: validation-focused capabilities, including code review, testing strategy, regression checks, acceptance checks, and release readiness review.
- `delivery/`: deployment, release, runtime environment, operations, monitoring, and incident handling.

## Placement Rules

Use the skill's primary purpose to choose a directory:

- If it helps decide whether an idea is worth pursuing, place it under `idea/skills/`.
- If it manages when and how work moves forward, place it under `iteration/skills/`.
- If it defines what the project is, how it behaves, how it looks, or how it is technically shaped, place it under `definition/skills/`.
- If it helps agents understand and reuse project context across sessions, place it under `memory/skills/`.
- If it tells agents how to implement something, place it under `engineering/skills/`.
- If it checks whether implementation is correct and reliable, place it under `quality/skills/`.
- If it helps ship, deploy, operate, or recover the system, place it under `delivery/skills/`.

When a skill could fit multiple directories, choose the one closest to the action the agent performs.
For example, an authentication architecture note belongs in `definition/skills/`, but a step-by-step gateway login implementation skill belongs in `engineering/skills/`.

## Current Skill Placement

- Project iteration management: `iteration/skills/`
- Idea collection and analysis: `idea/skills/`
- Product specification: `definition/skills/`
- Interaction: `definition/skills/`
- Visual: `definition/skills/`
- Technical solution: `definition/skills/`
- iOS SwiftUI development: `engineering/skills/`
- Nebula Gateway frontend login and backend authentication: `engineering/skills/`
- Server deployment: `delivery/skills/`

## Skill Folder Convention

Each skill should be a self-contained folder under a stage's `skills/` directory with a required `SKILL.md`.
Use lowercase kebab-case names, such as `product-spec` or `ios-swiftui-development`.

Keep `SKILL.md` focused on the core workflow. Put detailed references, scripts, templates, or assets inside the skill folder only when they directly support that skill.
