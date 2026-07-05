# AGENTS.md Long-Term Context Skill

## Status

- State: promoted
- Type: agent
- Source: agent conversation
- Created: 2026-05-26
- Updated: 2026-07-05
- Decision: promoted to `memory/skills/arckit-agent-context/`

## Background

The discussion explored whether Arckit should include a memory-stage skill that maintains durable project context in `AGENTS.md`. The intended use case is not raw chat logging, but a controlled project-entry context layer for future agents.

The proposed skill would complement existing Arckit document-domain skills:

- Product facts belong in `arckit/spec/`.
- Interaction facts belong in `arckit/interaction/`.
- Visual facts belong in `arckit/visual/`.
- Technical facts belong in `arckit/tech/`.
- Unresolved context belongs in `arckit/pending/`.
- Stable cross-session agent guidance, repository navigation, durable constraints, and context-routing rules belong in `AGENTS.md`.

## Pending Item

Create a memory-stage skill, tentatively named `arckit-agent-context`, that detects durable project context in user prompts and persists it to the right long-term surface.

The key requirement is that the skill should handle prompts that contain both:

- durable context, such as "以后", "默认", "始终", "不要再", "这个项目约定", "记住", "沉淀", "下次", "长期", or "所有后续";
- an immediate command, such as editing code, creating a document, or running a workflow.

When both are present, the desired behavior is:

1. classify the durable context;
2. persist it first to `AGENTS.md` or route it to the proper Arckit document domain;
3. continue executing the immediate command;
4. report both the persisted context and the completed immediate work.

## Current Judgment

This appears useful as a context-governance skill rather than a general memory system. Existing public ideas are adjacent but not an exact fit:

- AGENTS.md memory tools tend to focus on maintaining or optimizing `AGENTS.md`.
- broader memory systems may store daily logs, topic notes, scratchpads, or agent run history.
- the Arckit need is narrower: high-signal durable context capture plus routing across the existing Arckit document hierarchy.

The skill should avoid automatically storing temporary instructions, one-off task constraints, raw chat transcripts, implementation details already discoverable from code, or unresolved ideas that belong in pending.

## Revisit When

- The user asks to implement the `arckit-agent-context` skill.
- Memory-stage skill boundaries are being refined.
- AGENTS.md maintenance rules need to become explicit and reusable.
- Prompt-level durable context capture proves repeatedly useful in real agent sessions.

## Related Areas

- `AGENTS.md`
- `memory/skills/`
- `memory/skills/arckit-pending/`
- `definition/skills/arckit-spec/`
- `definition/skills/arckit-tech/`
- `definition/skills/arckit-interaction/`
- `definition/skills/arckit-visual/`

## Notes

- AGENTS.md should remain a project startup and routing surface, not a full knowledge base.
- The proposed skill should keep AGENTS.md short, stable, link-driven, and high signal.
- Candidate AGENTS.md sections discussed: Project Snapshot, Repository Map, Arckit Document Entry Points, Agent Operating Rules, Build/Test/Run Commands, Durable Decisions, Known Constraints, and Context Routing.
- Public research found adjacent concepts such as AGENTS.md memory maintenance, general long-term memory systems, and agent context systems, but no exact ready-made match for Arckit's desired prompt-interception and document-routing behavior.

## Outcome

Promoted on 2026-07-05 as `memory/skills/arckit-agent-context/`. The active skill now owns durable context classification, AGENTS.md governance, and routing to Arckit fact sources, pending, or workflow memory.
