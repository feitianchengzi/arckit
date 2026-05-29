# Multi-Document Planning

Use this reference when a project plan has outgrown one file or the user asks to split, reorganize, or maintain planning docs across files.

## Table Of Contents

- [When To Split](#when-to-split)
- [Folder Layers](#folder-layers)
- [Recommended Layout](#recommended-layout)
- [Granularity Rules](#granularity-rules)
- [Hierarchical Retrieval](#hierarchical-retrieval)
- [Context Hygiene](#context-hygiene)
- [Artifact Homes](#artifact-homes)
- [Migration Steps](#migration-steps)
- [Growth Triggers](#growth-triggers)
- [Growth Steps](#growth-steps)
- [Update Routing](#update-routing)
- [Quality Checks](#quality-checks)

## When To Split

Split a single plan file when one or more are true:

- The file is hard to scan or regularly exceeds a few hundred lines.
- Several iterations or MVP stages are mixed together.
- Tasks, decisions, reviews, and roadmap changes are all edited in the same place.
- Users ask for clearer document ownership or easier continuation by future agents.

Keep one file when the project is still small, short-lived, or mostly a one-off planning note.

## Folder Layers

Organize by information lifetime and edit frequency before choosing file names:

| Layer | Typical files | What belongs here | What does not belong here |
| --- | --- | --- | --- |
| Entry | `docs/project-plan.md`, optional `docs/project/README.md` | Short current focus, document map, editing rules. | Full history, task evidence, long analysis. |
| Active core | `docs/project/current.md` | Active Goals, current/next Iteration, active task order, open gates, current Roadmap summary. | Completed iterations, old reviews, full task bodies, historical roadmap states. |
| Workflow ledgers | `backlog.md` or `workflow/backlog/*`, `plans.md` or `workflow/goals/*`, `scopes.md` or `workflow/scopes/*`, `iterations.md` or `workflow/iterations/*`, `decisions.md` or `workflow/decisions/*`, `roadmap.md` or `workflow/roadmap/*` | Source of truth for governance objects and evidence. | Durable domain/product/architecture essays. |
| Reference library | `reference/domain/`, `reference/product/`, `reference/interaction/`, `reference/architecture/`, `reference/data/`, `reference/prototypes/` | Long-lived specialist knowledge that informs the workflow. | Active task status, decision candidates without routing. |
| Indexes | `indexes/id-registry.md`, `indexes/active-task-index.md`, `indexes/decision-index.md`, `indexes/document-map.md` | Navigation, lookup, cross-file pointers. | Original decisions, task evidence, requirements text. |
| Archive | `archive/superseded/`, `archive/exports/`, optional cold-storage folders | Superseded plans, generated exports, old snapshots, cold material that is no longer part of normal retrieval. | Active work, unresolved decisions, or canonical iteration shards. |

## Recommended Layout

Use the standard layout when the planning set is multi-document but still easy to scan:

```text
docs/project-plan.md
docs/project/current.md
docs/project/context.md
docs/project/backlog.md
docs/project/plans.md
docs/project/scopes.md
docs/project/iterations.md
docs/project/tasks.md
docs/project/reviews.md
docs/project/decisions.md
docs/project/roadmap.md
docs/project/reference/
docs/project/archive/
docs/project/indexes/
```

`docs/project-plan.md` should stay short. It should explain the current focus, link to the artifact files, and describe the editing rule. `current.md` is optional but useful once the standard artifact files become long; keep only active Goals, current/next Iteration, active Tasks, open Decisions, and current Roadmap there.

Use the canonical scalable layout when `docs/project/` has become crowded, reference docs are numerous, workflow ledgers are too long to maintain comfortably, or the user asks for unlimited growth and hierarchical retrieval:

```text
docs/project-plan.md
docs/project/
  README.md
  current.md
  workflow/
    backlog/
      index.md
      open.md
      deferred/YYYY-QN.md
      closed/YYYY-QN.md
    goals/
      index.md
      G-012.md
    scopes/
      index.md
      G-012.md
    iterations/
      index.md
      I-012/
        plan.md
        tasks.md
        review.md
        evidence.md
    decisions/
      index.md
      open.md
      2026/
        D-047.md
    roadmap/
      current.md
      history/2026-Q2.md
  reference/
    domain/
    product/
    interaction/
    architecture/
    data/
    prototypes/
  indexes/
    id-registry.md
    active-task-index.md
    decision-index.md
    document-map.md
    retrieval-guide.md
  archive/
    superseded/
    exports/
```

Do not migrate an existing flat layout just for aesthetics. If links already depend on root-level files, first add `reference/README.md`, `indexes/id-registry.md`, and `archive/README.md`; then move only the areas whose current location is causing real lookup or edit problems.

In the scalable layout, every growing concern has a shard key:

| Concern | Shard key | Active view |
| --- | --- | --- |
| Backlog | status + quarter | `workflow/backlog/open.md` |
| Goal | `G-*` | `workflow/goals/index.md` and `current.md` |
| Scope | `G-*` or `I-*` | `workflow/scopes/index.md` and `current.md` |
| Iteration plan, Goal mix, tasks, review, evidence | `I-*` | `workflow/iterations/index.md` and `current.md` |
| Decision | year + `D-*` | `workflow/decisions/open.md` |
| Roadmap | current sequencing plus quarter history | `workflow/roadmap/current.md` |
| Reference | area + topic | `reference/<area>/README.md` |

## Granularity Rules

Do not make every ID its own file. File boundaries should reduce retrieval and editing cost; too many tiny files create a different maintenance problem.

Use these defaults:

| Artifact | Default | Create separate file when | Avoid separate file when |
| --- | --- | --- | --- |
| Backlog item `B-*` | Keep in `workflow/backlog/open.md`, `deferred/YYYY-QN.md`, or `closed/YYYY-QN.md`. | It is a large research brief, a risk investigation, a customer/source note, or an epic that will be cited many times before promotion. | It is a short raw idea, duplicate, question, task seed, or low-context note. |
| Goal `G-*` | One file per active/substantial Goal in scalable layout. | It has success criteria, non-goals, scope impact, or spans multiple iterations. | It is only a small planning note or already closed with no future retrieval value. |
| Scope | One file per `G-*`; occasionally per `I-*`. | The boundary includes material tradeoffs, risk controls, or non-goals that other files cite. | It only restates the current iteration plan. |
| Iteration `I-*` | One folder per iteration with `plan.md`, `tasks.md`, `review.md`, and optional `evidence.md`. | Use this by default for recurring execution because it caps task and review growth. `plan.md` should include `primary_goal_id`, optional `supporting_goal_ids`, and `reason_for_mix`. | The project is still a one-off plan with no repeated iterations. |
| Task `T-*` | Keep tasks together in the iteration `tasks.md`. | A task is a mini-spec, research packet, or evidence bundle too large for the task list; link it from `tasks.md`. | It is a normal executable item with `done_when` and short evidence. |
| Decision `D-*` | One file per accepted decision; candidates stay in `open.md`. | The decision changes scope, accepts risk, postpones important work, changes formulas/policy, or affects Roadmap. | It is only an unresolved candidate or minor note. |
| Review | Keep in the iteration folder. | Evidence is large enough to need `evidence.md` or attachments. | It is only a short closeout. |
| Reference topic | One file per stable topic under `reference/<area>/`. | The topic has durable value and will be cited by multiple workflow items. | It is temporary execution evidence or an unresolved decision. |

The cautious default for Backlog is collection-first, not file-per-item. Promote a Backlog item into a Goal, Decision, Reference topic, or Iteration task before giving it a durable standalone home.

## Hierarchical Retrieval

Use this read order so future agents do not scan the whole planning tree:

1. Entry: read `docs/project-plan.md` or `docs/project/README.md`.
2. Active state: read `docs/project/current.md`.
3. Index lookup: read `indexes/retrieval-guide.md`, `indexes/id-registry.md`, or `indexes/active-task-index.md`.
4. Source shard: read the exact workflow shard, such as `workflow/iterations/I-012/tasks.md`, `workflow/goals/G-012.md`, or `workflow/decisions/2026/D-047.md`.
5. Reference support: read only linked `reference/<area>/<topic>.md` files.
6. Cold history: search `archive/` only when active files point there or the user asks for historical context.

Create `indexes/retrieval-guide.md` when the project has enough files that this route is not obvious. It should list common questions and where to look, for example:

| Question | Start here | Then read |
| --- | --- | --- |
| What should I do next? | `current.md` | `workflow/iterations/<current>/tasks.md` |
| Why was this scope chosen? | `workflow/scopes/<goal>.md` | linked decisions |
| What changed after a review? | `workflow/iterations/<id>/review.md` | `workflow/roadmap/current.md` |
| Where is this ID? | `indexes/id-registry.md` | source shard |

## Context Hygiene

Document growth is acceptable only if default context stays bounded. The risk is not that old files exist; the risk is reading old plans, raw backlog, superseded decisions, and historical reviews into a current execution task without status boundaries.

Use these controls:

- Default read set: entry file, `current.md`, relevant index, and exact workflow shard.
- Non-default read set: full backlog, review history, decision history, reference library, and archive.
- Read archive only for historical questions, provenance checks, or when an active source links there.
- Label historical material before using it: `active`, `open`, `deferred`, `closed`, `superseded`, or `reference`.
- Promote any still-current consequence from long history into a live source: `current.md`, current Scope, accepted Decision, or current Roadmap.
- Never infer current direction by averaging old and new plans. If source status conflicts, prefer active core and live source shards; cite uncertainty when status is unclear.

Common contamination patterns:

| Contamination | Prevention |
| --- | --- |
| Raw Backlog becomes executable work | Require Goal and Iteration before Task. |
| Goal becomes an Iteration wrapper | Keep Goal outcome-oriented; use Iteration theme or Task cluster for one execution slice. |
| Iteration silently mixes several Goals | Require `primary_goal_id`, `supporting_goal_ids`, and `reason_for_mix`. |
| User-proposed Goal bypasses history | Run Goal Intake against Backlog, Review, Goal Progress, Decision, constraints, and Roadmap before accepting it. |
| Roadmap becomes a bigger Goal | Keep Roadmap as sequencing over Goals, Goal candidates, deferred Backlog, and Decisions; do not split tasks from Roadmap directly. |
| AI-generated Roadmap looks committed | Require `source` and `status`; use `proposed` unless user confirmation or an accepted Decision exists. |
| Superseded plan looks current | Keep superseded files under archive and label them in indexes. |
| Old Review noise hides current next step | Keep `current.md` short and route next action through the active iteration shard. |
| Reference prose becomes a shadow plan | Route only governance consequences into Backlog, Scope, Decision, Task, Review, or Roadmap. |
| Duplicate summaries conflict | Prefer the source shard over summary/index text. |

## Artifact Homes

Use these homes unless the repository already has a clear convention:

| Artifact | Home document | Notes |
| --- | --- | --- |
| Current context | `context.md` or `workflow/context.md` | Stable project background and planning assumptions. |
| Backlog | `backlog.md` or `workflow/backlog/open.md` plus status/quarter shards | Raw material only; do not treat every backlog item as executable. |
| Project plan and goals | `plans.md` or `workflow/goals/G-*.md` | Objectives, focus, constraints, non-goals, `G-*`. |
| Scope boundary | `scopes.md` or `workflow/scopes/G-*.md` | `must_have`, `nice_to_have`, `non_goals`, `risk_controls`. |
| Iteration | `iterations.md` or `workflow/iterations/I-*/plan.md` | `I-*`, `primary_goal_id`, optional `supporting_goal_ids`, `reason_for_mix`, selected scope, excluded scope, success criteria. |
| Task | `tasks.md` or `workflow/iterations/I-*/tasks.md` | `T-*`, `goal_id`, `iteration_id`, `done_when`, `evidence`. |
| Review | `reviews.md` or `workflow/iterations/I-*/review.md` | Templates and completed iteration reviews; update affected Goal progress in `workflow/goals/G-*.md` or the Goal ledger. |
| Evidence | `tasks.md` / `reviews.md` or `workflow/iterations/I-*/evidence.md` | Verification output, browser checks, user review evidence, screenshots, links. |
| Decision | `decisions.md` or `workflow/decisions/YYYY/D-*.md` plus `open.md` for candidates | `D-*` logs and `DC-*` decision candidates. |
| Roadmap | `roadmap.md` or `workflow/roadmap/current.md` plus `history/YYYY-QN.md` | Sequencing layer with `now`, `next`, `later`, `not_now`; each item should carry `item_type`, `source`, `status`, and `rationale`. Keep historical roadmap states outside the active view. |

Domain model docs, scenario notes, architecture notes, and product specs can stay outside this planning set. Link them from the index or from the artifact that uses them.

Use subfolders once the project has durable specialist artifacts:

| Folder | Contents | Rule |
| --- | --- | --- |
| `reference/` | Domain models, capability catalogs, user stories, formulas, interaction architecture, architecture notes, data-shape specs, prototype specs. | Reference docs can be long, but they should feed Decisions, Backlog, Scope, and Tasks instead of replacing them. |
| `archive/` | Superseded plans, generated exports, cold snapshots, and exceptional historical material not served by normal shards. | Preserve IDs and link from the active artifact or index. Do not use archive as a dumping ground for unresolved work. |
| `indexes/` | ID registry, decision index, capability map, active task index. | Indexes are navigation aids, not the source of truth. |

## Migration Steps

1. Read the current plan and list its top-level headings.
2. Classify each section as entry, active core, workflow ledger, reference, index, archive, or out of scope.
3. Choose the target document map and create the folder if needed.
4. Move each top-level section into its artifact home.
5. Replace the old large file with a short index and links.
6. Preserve all existing IDs and status values.
7. Verify that every old top-level section appears in a new file or is intentionally retired.
8. Run a lightweight link/heading check with `rg` or an equivalent search.

For high-growth migration, work in this order:

1. Shorten the entry file first.
2. Add or refresh `current.md`.
3. Separate workflow ledgers from reference documents.
4. Add indexes for IDs and active work.
5. Start writing new iteration material to `workflow/iterations/I-*/` so task and review evidence is naturally bounded.
6. Shard decisions, backlog, and roadmap when those ledgers become difficult to scan.
7. Move file paths last, because path churn is expensive and can break historical links.

## Growth Triggers

Treat these as signals to restructure:

- The entry file explains history instead of just where to start.
- `current.md` contains completed task evidence or old review narrative.
- A workflow ledger is mostly completed history and only a small part is active.
- A reference doc combines several independent topics such as domain rules, page IA, data structure, and prototype notes.
- The project folder root contains many long-lived specialist docs and users cannot tell which are active workflow files.
- Future agents must scan many files before knowing active Goals, current Iteration, and next task.
- The same ID family appears in several files without an index explaining the source of truth.
- Searching for one active task returns too many closed historical matches.

Do not overreact to line count alone. A long reference document can be acceptable if it has one clear topic and stable ownership. A shorter file can still be harmful if it mixes active decisions, task evidence, and future ideas.

## Growth Steps

When the multi-document set becomes large:

1. Create or update `current.md` with active Goals, current/next Iteration, active Tasks, open Decisions, and current Roadmap.
2. Create `workflow/iterations/I-*/` for each new iteration and put the iteration plan, task list, review, and evidence there.
3. Keep any old flat `tasks.md`, `reviews.md`, and `iterations.md` as compatibility maps until link churn is acceptable, then migrate old sections gradually.
4. Create `workflow/decisions/open.md` for decision candidates and `workflow/decisions/YYYY/D-*.md` for accepted decisions.
5. Keep `workflow/backlog/open.md` limited to active raw material; move deferred or closed items into quarter shards.
6. Move durable domain, product, interaction, architecture, data-shape, formula, or prototype artifacts into `reference/<area>/` unless the repository already has a clear home for them.
7. Add `indexes/id-registry.md` when cross-file lookup by `B-*`, `G-*`, `I-*`, `T-*`, `D-*`, `DC-*`, `CAP-*`, or `US-*` becomes slow.
8. Add `indexes/retrieval-guide.md` when future agents need a deterministic read order.
9. Use generated JSON, SQLite, or search indexes only as derived views unless the user explicitly wants workflow data to live in a database.

Recommended bounded source shapes:

```text
docs/project/workflow/iterations/I-012/plan.md
docs/project/workflow/iterations/I-012/tasks.md
docs/project/workflow/iterations/I-012/review.md
docs/project/workflow/iterations/I-012/evidence.md
docs/project/workflow/decisions/2026/D-047.md
docs/project/workflow/backlog/deferred/2026-Q2.md
docs/project/archive/superseded/2026-05-23-old-roadmap.md
```

For smaller projects, the flat layout is enough. When migrating to the scalable layout, preserve IDs in headings or frontmatter so `rg "T-095"` still finds the item after it moves.

## Update Routing

- New idea or risk: update `backlog.md` in the standard layout, or `workflow/backlog/open.md` in the scalable layout.
- New user-proposed goal: first run Goal Intake against Backlog, Review, Goal Progress, Decision, constraints, and Roadmap. If accepted or revised, update `plans.md`, or create/update `workflow/goals/G-*.md`; otherwise keep it as a Goal Candidate or Backlog item.
- Changed scope boundary: update `scopes.md`, or create/update `workflow/scopes/G-*.md`; add a decision if the change is material.
- New iteration: update `iterations.md`, or create `workflow/iterations/I-*/plan.md` with `primary_goal_id`, optional `supporting_goal_ids`, and `reason_for_mix`.
- New implementation task: update `tasks.md`, or add it to `workflow/iterations/I-*/tasks.md`.
- Completed task evidence: update the task source and evidence source; update `reviews.md` or `workflow/iterations/I-*/review.md` only during iteration review.
- Accepted risk, postponed work, formula/policy change, or roadmap change: update `decisions.md`, or create `workflow/decisions/YYYY/D-*.md`.
- Sequencing change: update `roadmap.md`, or `workflow/roadmap/current.md` with `now`, `next`, `later`, `not_now`, `source`, and `status`; move old roadmap state to `workflow/roadmap/history/YYYY-QN.md` when useful. If the change alters an accepted direction, add or update a Decision.
- Specialist handoff: route each `pvw_handoff` field to its artifact home instead of copying the whole analysis into every file.
- Historical evidence: keep it in the relevant iteration shard or archive it after the Review unless it is still active evidence for an open Task or Decision.
- New long-lived domain/product/interaction/architecture analysis: create or update `reference/<area>/<topic>.md`, then route only the governance consequence into Backlog, Scope, Decision, Task, Review, or Roadmap.
- New index request: update `indexes/` only with pointers and status summaries; keep original rationale in source files.
- Existing flat layout with many root files: prefer a document map and new subfolders for future material before moving old files.

## Quality Checks

Before finishing, check:

- The index links to every artifact document.
- `current.md`, if present, contains only active or next-step material.
- Each task has `goal_id`, `iteration_id`, `done_when`, and `evidence`.
- Iterations that mix Goals explain `primary_goal_id`, `supporting_goal_ids`, and `reason_for_mix`.
- Goals are not just single-iteration task wrappers.
- User-proposed Goals have been calibrated against historical workflow evidence before becoming active.
- Roadmap is a sequencing layer, not a second Goal ledger.
- Generated roadmap items are marked `proposed` unless there is user confirmation or an accepted Decision.
- Backlog items are not mixed into executable tasks without a goal.
- Decisions record why a direction changed, not only what changed.
- No artifact is duplicated in two homes.
- Archived IDs remain searchable from an index or from the active artifact that references them.
- Entry and active-core files are short enough to answer "where do I start?" and "what do I do next?" without scanning history.
- Reference files have clear topical ownership and do not become shadow task trackers.
- A future agent can find active Goals, current Iteration, next active task, and open decisions from the entry file plus `current.md`.
