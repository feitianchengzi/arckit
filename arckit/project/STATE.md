# Arckit Skill Repository Project State

Status: active
Revision: 112
Updated: 2026-08-18T19:09:17.283Z
Canonical Record: state.record.json

## Project Intent

治理 Arckit skill 体系，使其同时支撑 Codex 类人机协作和自动化平台的软件开发接力协议。

## Current Focus

Replace ArcOrbit internal Electron-as-Node process launches with an explicit Runtime host architecture that does not depend on ELECTRON_RUN_AS_NODE.

## Active Work

- Active cases: 0
- Project gaps: 4
- GAP-agent-scenario-evaluation: Validate dynamic gap selection in isolated real software scenarios.
- GAP-runtime-resilience-and-adapters: Strengthen Runtime timeout, transcript compaction and required adapter boundaries.
- GAP-security-real-project-validation: Validate security boundaries in a real permission-bearing project.
- GAP-cross-record-audit: Accept strict Project, Iteration and Case cross-record auditing in real use.

## Software Definition

Arckit is a state-driven software-development protocol and optional supervised Runtime. Project State owns explicit software-definition decisions; one Agent advances facts and dynamic gaps through trusted atomic ledger transitions.

| Decision Area | Status | Revision | Current Decision | Project Gaps |
| --- | --- | ---: | --- | --- |
| product_intent_and_scope | settled | 3 | Arckit is the repository-owned development protocol and skill system; ArcOrbit is its supervised Desktop/Runtime product and is expanding into a local-project-anchored, multi-product software-development platform for people who coordinate organization, product, member, todo, AI execution, and feedback work without relying on the Todo or Feedback web clients for daily operation. | - |
| product_capabilities | settled | 9 | ArcOrbit preserves Setup Readiness, supervised one-thread-per-todo automation, trusted ledger transitions, intervention/recovery and acceptance feedback while providing Desktop composition of Workshop organizations, organization and project membership, personal and organization projects, seven-state todos, ordinary user feedback, local Product Workspaces and a persistent multi-product Workset. Organization governance is complete for the current service boundary through overview, member/project management, truthful role visibility, join-by-code and project-bound one-shot invitations. | GAP-agent-scenario-evaluation |
| runtime_surfaces | settled | 4 | The software comprises repository-owned Arckit skills and Node.js ledger CLIs plus ArcOrbit, an Electron platform Desktop with Setup Readiness, skill provisioning, a main-process Platform Coordinator, restricted Workshop Platform Adapter, Automation Coordinator, Runtime supervisor, Codex adapter, and packaged trusted capability resources. Workshop web clients remain available administration and source surfaces but are not required for ArcOrbit daily work. | - |
| experience_and_interaction | settled | 16 | ArcOrbit realizes simultaneous multi-product Today, Work, Automation and Feedback through a persistent Workset and a shared top product-set observation scope. Every ADVANCE page can switch between the complete product set and one member product and can open product-set management; this scope never changes execution eligibility. Work owns the seven todo-status filters, Automation owns the acceptance-feedback-only filter, and primary navigation has no TASK STATUS group. Platform governance remains in a Workset-independent Organization center. Users choose an organization or Personal Projects scope, then use Overview, Members and Projects; the overview exposes the visible member-by-project relationship, ordinary members see participating projects, owner/admin see the organization-wide project scope, member details do not imply targeted invitations, and project owner/admin create explicitly one-shot project-bound invitations. Project binding can add a local project in place and continue binding. The global sidebar footer exposes only a user-avatar account entry, with no standalone add-project, local Runtime or task-source entries; the preserved account page uses the Workshop current-user platform display name. | - |
| visual_language | settled | 2 | Visual requirements apply to the Desktop workspace and follow its durable visual specification; CLI and ledger surfaces remain text-native. | - |
| identity_and_access | settled | 2 | Authentication is required only for configured execution/task sources; authorization remains bounded by user approval, workspace scope, sandbox and trusted entrypoints. Runtime sessions use a server-backed rolling seven-day inactivity window: successful verification login, successful startup session restoration/refresh, or successful token refresh renews the window through rotated server credentials; only more than seven days without such activity, missing or expired credentials, explicit logout, or explicit server rejection/revocation requires login again. | - |
| data_and_state | settled | 7 | Canonical development state remains in Project/Iteration/Case ledgers and Workshop remains source of truth for account, organization, project, membership, task, attachment, and ordinary-feedback records. ArcOrbit owns Product Workspace bindings from a Workshop Project to a local repository, persistent multi-product workset preferences, Runtime execution/session/thread state, intervention/recovery state, and first-class acceptance-feedback records outside the target repository. | GAP-cross-record-audit |
| external_integrations | settled | 3 | ArcOrbit integrates with Codex app-server/CLI and Workshop through explicit main-process adapters; trusted ledger entrypoints remain repository-owned. Workshop authentication preserves server-rotated credentials and the rolling seven-day inactivity contract. The Automation adapter remains executor-scoped, while the separate Platform Adapter reads organization, project, membership, full project task and Feedback V1 domains. Feedback V2 remains disabled until a separately trusted adapter proves capability; missing conditional update, member authorization and task-history service contracts are surfaced as weak consistency or unavailable actions rather than invented behavior. | GAP-runtime-resilience-and-adapters |
| feedback_and_support | settled | 4 | Operational feedback uses the persistent Agent conversation, Runtime activity/events, diagnostics and task-source synchronization. Recovery feedback continues an interrupted active execution on its task session/thread; acceptance feedback from completed or accepted review creates an independent persisted work item, keeps the source todo terminal, reuses its session/thread and exposes issue progress and solution evidence. No separate public support portal is currently required. | - |
| commercialization_and_entitlement | settled | 1 | Arckit currently has no payment, subscription, trial, quota or commercial feature-entitlement model. | - |
| technical_foundation | settled | 19 | Arckit uses repository-owned Markdown/JSON state and Node.js ESM ledger CLIs; ArcOrbit is its Electron Desktop/Runtime host. The policy-neutral Runtime Kernel, persistent one-thread-per-todo model and trusted capabilities remain unchanged. Platform composition uses Desktop Store v10, a main-process Platform Coordinator, restricted Workshop Platform Adapter and typed preload IPC. ArcOrbit consumes existing Workshop services without requiring backend changes: organization-scoped request context supplies known project organization identity, current-member is_external marks external participation, remote Workshop records remain authoritative, and Renderer receives neither credentials nor generic request access. Packaged ArcOrbit no longer reinterprets its Electron executable as Node: Electron main launches the Runtime with utilityProcess, typed parent-port controls preserve steer/interrupt semantics, trusted ledger orchestration calls manifest-resolved module APIs in process, standalone Codex remains an external executable, and packaging disables the RunAsNode/Node-options/CLI-inspect fuses while enforcing ASAR integrity. | - |
| security_privacy_compliance | settled | 1 | Secrets stay outside canonical project state; Runtime enforces login/configured-source boundaries, workspace authorization, sandbox/approval rules and trusted deterministic writes. | GAP-security-real-project-validation |
| quality_and_validation | settled | 2 | Protocol changes require schema/script validation, cross-record audits, Runtime automated tests, projection checks, direct-Codex no-Case recovery evidence, stale-token checks, read/write/read ordering checks, and risk-proportionate real execution evidence. | GAP-agent-scenario-evaluation, GAP-cross-record-audit |
| delivery_and_distribution | settled | 5 | Arckit skills are sourced from the repository and synchronized to supported Codex targets through governed availability-aware installation. Governed ArcOrbit installers are produced only by manually dispatched GitHub workflows against an existing tf/*, beta/* or appstore/* release-intent tag, bundle locked trusted resources, the Arckit skill payload and an exact ArcForge provider artifact, and support macOS arm64/x64, Windows x64 and Linux x64 with explicit signing and draft-release choices. A repository-local validation entrypoint may build current-host unsigned artifacts only when provider, ArcOrbit metadata, repository identity and workflow are explicitly labeled local; those artifacts carry no release authorization and are never published by governed workflows. | - |
| observability_and_operation | settled | 5 | Runtime persists lifecycle, activity, messages and timing outside the target project, supports restart reconciliation and exposes opaque Run refs. It separately projects ledger candidate catalogs, Agent selection traces, accepted round closeouts and post-commit fresh-read receipts, and also presents ordinary todo state separately from acceptance-feedback queue counts, item status, current Run/Case, progress, evidence and blocking responsibility alongside one active execution. | GAP-runtime-resilience-and-adapters |

## Software Invariants

- product-expectations-remain-recoverable: Every materially affected product expectation is accurate, unambiguous, and durably recoverable.
- interaction-expectations-remain-recoverable: Every materially affected interaction expectation is coherent, complete enough to recover its decisions and states, and durably recoverable.
- visual-language-remains-consistent: Every materially affected visual expectation remains intentional, internally consistent, and durably recoverable.
- technical-decisions-remain-explainable: Every materially affected technical decision remains coherent, explainable, and durably recoverable, including its rationale and affected relationships.
- accepted-facts-are-realized: The accepted software state realizes every materially relevant accepted fact and upheld Project decision and invariant.
- material-risks-have-credible-evidence: Every material risk claim accepted in the Case is supported by credible, repeatable, and proportionate evidence.

## Read For Precision

- state.record.json
- arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.record.json
