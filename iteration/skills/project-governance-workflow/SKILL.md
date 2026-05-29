---
name: project-governance-workflow
description: Govern project validation and execution loops for small teams and AI collaboration. Use when Codex needs to route ideas, requirements, notes, feedback, specialist analysis, or existing project docs into Backlog, Goal, scope boundary, Iteration, Task, Review, Decision, Roadmap, current/reference/archive/index structures, or Project Plan artifacts; when planning the shortest path to a usable version; when preventing planning docs from growing into one unreadable file; when designing or repairing folder hierarchy and document ownership for long-running projects; when clarifying how Goals relate to Iterations and Tasks; or when routing domain modeling, product definition, or interaction validation back into project execution.
---

# Project Governance Workflow

Use this skill as the project governance layer: keep focus, scope, evidence, decisions, specialist handoffs, and roadmap changes connected.

The core model is:

```text
Backlog + Review + Decision + Roadmap -> Goal Intake
Goal -> Goal Scope
Iteration -> Task allocation across one or more Goals
Task -> goal_id + iteration_id
Iteration Review -> Goal Progress Review -> Decision -> Roadmap adjustment
Roadmap -> sequencing across accepted Goals, proposed Goal candidates, deferred Backlog, and Decisions
```

## Operating Rules

- Use this skill as the project control layer: decide focus, scope, task evidence, review outcomes, decisions, and roadmap impact.
- Treat `Backlog` as raw material, not executable work.
- Convert high-value Backlog into `Goal` before making tasks.
- When the user proposes a Goal, run Goal Intake before accepting it: compare against active Goals, Backlog, recent Reviews, Goal Progress, open Decisions, accepted Decisions, constraints, and the current Roadmap.
- Do not create or accept a Goal from user wording alone. If historical evidence is insufficient or conflicts with the proposed Goal, keep it as `goal_candidate` or `proposed_goal` and state what user confirmation or evidence is needed.
- Keep `Goal` outcome-oriented and larger than one execution slice: it should explain why now, expected outcome, success criteria, non-goals, and remaining uncertainty.
- Do not force `Goal` and `Iteration` into a one-to-one relationship. A Goal can span multiple Iterations; one Iteration can include Tasks from multiple Goals.
- Treat `Iteration` as a time box and execution path. It selects work, not the full meaning of the Goal.
- Use `Task` as the join point between Goal and Iteration. Require every `Task` to include both `goal_id` and `iteration_id`.
- If a proposed Goal is really a small implementation slice, page pass, refactor, or one-off task group, make it an Iteration theme or Task cluster instead of a new Goal.
- When an Iteration mixes Goals, record `primary_goal_id`, `supporting_goal_ids`, and `reason_for_mix`.
- Require every Task to have `done_when` and `evidence`.
- Use `Review` to decide continue, adjust, or pause.
- Review Iterations for execution evidence; review Goals for accumulated progress across Iterations.
- Write `Decision` when scope changes, risks are accepted, important work is postponed, or Roadmap changes.
- Treat `Roadmap` as a sequencing layer, not as a larger Goal. It orders accepted Goals, proposed Goal candidates, deferred Backlog, and Decision outcomes into `now`, `next`, `later`, and `not_now`.
- Roadmap items must carry `source` and `status`. Use `accepted` only when the user confirmed it or an accepted Decision already exists; otherwise use `proposed`, `deferred`, or `rejected_or_out_of_scope`.
- When asked to recommend the next Goal, use Backlog, Reviews, Goal Progress, Decisions, Roadmap, constraints, and recent evidence. Return recommendation rationale, alternatives, uncertainty, and `required_user_decision` instead of silently changing the active Goal.
- Prefer a multi-document structure when a single plan file grows beyond easy scanning, covers multiple iterations, or mixes history with next-step execution.
- In multi-document projects, keep an index file short and edit the narrowest relevant document first.
- Govern document growth by information lifetime and edit frequency: entry, active core, workflow ledgers, reference library, indexes, and archive should not do the same job.
- Keep entry and active-core files short. They should point to source files, not copy historical evidence or long specialist analysis.
- Route durable domain/product/interaction/architecture material into reference documents; route execution evidence and governance state into workflow ledgers.
- After Review, move completed material out of active views into the relevant iteration shard or cold archive while preserving IDs and links from indexes or source ledgers.
- When a specialist skill returns `pvw_handoff`, translate it into the narrowest needed Backlog, Goal, Scope, Task, Review, Decision, Roadmap, or document-map update.

## Language And Field Names

- When creating or updating user-facing documents, use the user's system language for prose, headings, labels, summaries, and explanations.
- On macOS, when the language is not already clear, check the first preferred language with `defaults read -g AppleLanguages`.
- Treat `zh-Hans` or `zh-Hans-CN` as Simplified Chinese.
- Keep structured field names, IDs, file names, code symbols, YAML keys, JSON keys, and workflow tokens in English, such as `goal_id`, `iteration_id`, `done_when`, `evidence`, `pvw_handoff`, `backlog_candidates`, and `decision_candidates`.

## Mode Router

Use this skill directly when the work is about planning, sequencing, scope, task evidence, reviews, decisions, roadmap changes, or document maintenance.

Use a specialist skill first when the main uncertainty is deeper than planning:

| Need | Use | Return to this skill as |
| --- | --- | --- |
| Entities, formulas, states, invariants, business vocabulary, policy boundaries | `$domain-modeling` | Decision candidates, capability impacts, scope risks, task candidates |
| Capabilities, user stories, non-capabilities, requirement drift, promotion rules | `$product-definition` | Capability updates, backlog candidates, scope boundaries, decision candidates |
| User feedback, page hierarchy, information priority, prototype walkthroughs, interaction risks | `$interaction-validation` | Review evidence, backlog candidates, task candidates, decision candidates |
| Code changes, tests, browser checks, release readiness | normal implementation workflow | Task evidence, Review result, Roadmap adjustment |

Specialist outputs should not become parallel project plans. Fold their `pvw_handoff` back into the workflow documents.

## Workflow

1. Gather context from the project, user notes, docs, issue lists, roadmap, or codebase. If a document map or index exists, read that first, then load only the relevant artifact files.
   - If the docs already sprawl across many files, first classify files by layer: entry, active core, workflow ledger, reference, index, archive, or unrelated project docs.
   - If the user asks about document growth, folder structure, or maintainability, produce a structure audit before adding new content.
2. Extract Backlog items and classify them as Idea, Risk, Question, Feature, Bug, Research, Validation, Task Seed, or Decision Candidate.
3. Run Goal Intake when the user sets or changes a Goal: calibrate the proposed Goal against historical Backlog, Review, Goal Progress, Decision, constraint, and Roadmap evidence before accepting or revising it.
4. Merge related Backlog items and choose, update, or recommend the highest-leverage active Goal or Goals. Avoid creating a new Goal just because a new Iteration starts.
5. Define the Goal scope boundary:
   - `must_have`: required for validating core value
   - `nice_to_have`: useful but not blocking
   - `non_goals`: explicitly out of scope for this stage
   - `risk_controls`: safety, rollback, validation, or data protection needs
6. Plan the next Iteration as an execution slice with theme, review date, selected scope, excluded scope, success criteria, `primary_goal_id`, optional `supporting_goal_ids`, and `reason_for_mix`.
7. Select 3-5 Tasks for the next Iteration from one or more active Goals when possible. Keep tasks small enough to verify.
8. Produce an Iteration Review from task evidence, then update Goal Progress for each affected Goal.
9. Capture Decisions and update Roadmap as `now / next / later / not_now`, marking each item with `source` and `status`.

## Specialist Handoff

When receiving specialist output, use this mapping:

```yaml
pvw_handoff:
  validated_insight: review evidence, context, or plan rationale
  backlog_candidates: backlog.md
  decision_candidates: decisions.md
  capability_updates: reference/product or capability docs, then scope or task references
  scope_impact: scopes.md
  task_candidates: tasks.md only after Goal and Iteration are clear
  review_evidence: reviews.md
  roadmap_impact: roadmap.md
  open_questions: backlog.md as Question or decisions.md as Decision Candidate
```

Do not copy the whole specialist artifact into every project file. Place each item in its home document and link to the source artifact.

## Document And Output Routing

Keep `SKILL.md` focused on deciding the next governance move. Load references only when the task needs their detail:

- For standard project flow, templates, checklists, prompt snippets, or a reusable workflow document, read `references/workflow.md`.
- For document growth, folder hierarchy, archive/index design, scalable layout, retrieval rules, or database-vs-Markdown questions, read `references/multi-document-planning.md`.
- For exact YAML/Markdown output shapes, Goal Intake, next Goal recommendation, Roadmap drafts, or structure audits, read `references/output-patterns.md`.

Default document rule: edit the narrowest source document. Keep entry and active-core files short; put history in workflow shards, durable analysis in `reference/`, navigation in `indexes/`, and superseded material in `archive/`.

Default growth rule: keep Markdown as the human-readable source of truth. Use generated JSON, SQLite, or search indexes only as derived views unless the user explicitly wants workflow data to live in a database.

## Reference

Read `references/workflow.md` when the user asks for the full reusable workflow, templates, checklists, prompt snippets, or a project-specific workflow document.

Read `references/multi-document-planning.md` when the user asks to split a project plan, maintain a multi-document planning set, migrate from one large plan file, control document growth, design folder hierarchy, archive old iterations, or decide where a Backlog, Goal, Iteration, Task, Review, Decision, Roadmap, reference, index, or archive artifact belongs.

Read `references/output-patterns.md` when the user asks for exact output templates, structured YAML, Goal Intake, next Goal recommendation, Roadmap draft, Review format, or structure audit format.
