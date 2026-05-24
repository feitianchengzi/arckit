---
name: arckit-pending
description: Manage unresolved project-level discussion items in a target project's arckit/pending workspace. Use when the user wants to add, list, read, update, delete, archive, revive, or promote pending issues, discussion threads, deferred thoughts, open questions, or not-yet-decided project context captured during agent collaboration.
---

# Arckit Pending

Use this skill to maintain unresolved project context that came up during agent collaboration but is not ready to become a formal spec, interaction document, technical solution, iteration task, or implementation change.

## Scope

The managed artifacts live in the target project's Arckit workspace:

```text
<project-root>/arckit/pending/
```

## When To Use

Use this skill when the user wants to preserve or manage something like:

- A thought that appeared during an agent conversation but is not decided.
- A project-specific open question that should be revisited later.
- A possible improvement, risk, or direction that is not yet a requirement.
- A discussion branch that should be parked without polluting formal docs.
- A pending item that may later be promoted into `arckit/spec/`, `arckit/interaction/`, `arckit/visual/`, `arckit/tech/`, iteration planning, or implementation work.

Do not treat pending items as committed backlog tasks. They are unresolved project context until explicitly promoted or closed.

## Directory Shape

Create the workspace if missing:

```text
arckit/pending/
  INDEX.md
  items/
    YYYY-MM-DD-short-slug.md
  archive/
    YYYY-MM-DD-short-slug.md
```

Keep active items in `items/`. Move closed, rejected, merged, or stale items to `archive/` unless the user explicitly asks to delete them.

## Item Format

Each item is a Markdown file. Use the structure below so future agents can recover the discussion state without treating the item as committed work:

```markdown
# Short Pending Item Title

## Status

- State: parked
- Type: workflow
- Source: agent conversation
- Created: YYYY-MM-DD
- Updated: YYYY-MM-DD
- Decision: record only; do not execute yet

## Background

Why this pending item exists.

## Pending Item

The unresolved thought, question, direction, possibility, or discussion branch.

## Current Judgment

Current assessment, including why it is not being executed yet.

## Revisit When

- Condition 1
- Condition 2

## Related Areas

- `path/or/module`

## Notes

- Later discussion updates.

## Outcome

Filled when promoted, merged, or closed.
```

Valid `State` values:

- `open`: still unresolved.
- `parked`: recorded for later, with no current action.
- `watching`: relevant signals should be watched before deciding.
- `candidate`: may become committed work if conditions are met.
- `promoted`: moved into a formal artifact or task.
- `merged`: combined into another pending item.
- `closed`: intentionally dropped.

Use `Type` to keep different pending items searchable. Prefer one of:

- `product`
- `workflow`
- `tool`
- `agent`
- `technical`
- `content`
- `operation`

Use `Decision` for the current judgment, not the lifecycle state. For example: `record only; do not execute yet`, `wait for repeated manual usage`, or `promote after workflow stabilizes`.

## Index Format

Maintain `arckit/pending/INDEX.md` as the navigation surface:

```markdown
# Pending

Project-level unresolved items captured during agent collaboration.

| Item | State | Type | Updated | Summary | Revisit When |
|---|---|---|---:|---|---|
| [Short Pending Item Title](items/YYYY-MM-DD-short-slug.md) | parked | workflow | YYYY-MM-DD | One-sentence summary. | Revisit condition. |

## Archived

| Item | State | Type | Updated | Outcome |
|---|---|---|---:|---|
| [Closed Item](archive/YYYY-MM-DD-closed-item.md) | closed | workflow | YYYY-MM-DD | One-sentence outcome. |
```

## Workflow

1. Locate the target project root. Prefer the user's current project root; if ambiguous, ask a short clarification before writing.
2. Ensure `arckit/pending/INDEX.md`, `items/`, and `archive/` exist.
3. For add operations, create one focused item per unresolved topic. Preserve raw user wording where it matters, then add a concise structured summary.
4. For list or query operations, read `INDEX.md` first, then open only the relevant item files.
5. For update operations, edit the item file, refresh `Updated`, and keep `INDEX.md` in sync.
6. For delete requests, clarify whether the user means hard delete or archive when the item contains meaningful project context. If they clearly ask for hard delete, remove the file and index row.
7. For archive, close, merge, or promote operations, move the item to `archive/` or update its state, then record the decision or target artifact in `Decision` and `Outcome`.

## Promotion Rules

Promote a pending item only when the user asks or the conversation has clearly turned it into a committed artifact:

- Product behavior or requirement: move into `arckit/spec/`.
- Interaction flow or wireframe concern: move into `arckit/interaction/`.
- Visual system or UI style concern: move into `arckit/visual/`.
- Technical architecture or data contract: move into `arckit/tech/`.
- Execution timing or priority: move into iteration planning.
- Implementation detail: handle through the relevant engineering workflow.

When promoting, leave a short trace in the pending item before archiving:

```markdown
## Outcome

Promoted to `../spec/path/to/file.md` on YYYY-MM-DD.
```

## Output Contract

When reporting changes, include:

- `path`: the pending index or item path touched.
- `summary`: one sentence describing what changed.
- `state`: current item state.
- `revisit_when`: the next expected revisit condition, if any.
