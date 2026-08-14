# Arckit Skill Repository Project State

Status: active
Revision: 49
Updated: 2026-08-14T04:03:58.247Z
Canonical Record: state.record.json

## Project Intent

治理 Arckit skill 体系，使其同时支撑 Codex 类人机协作和自动化平台的软件开发接力协议。

## Current Focus

基于代码、跨平台进程启动语义、可重复契约测试和可交付给 Windows 用户的诊断证据，确定 Runtime loop 失败的真实边界；随后仅修改证据指向的 Runtime、ledger entrypoint 或 skill 文件。

## Active Work

- Active cases: 0
- Project gaps: 5
- GAP-agent-scenario-evaluation: Validate dynamic gap selection in isolated real software scenarios.
- GAP-runtime-resilience-and-adapters: Strengthen Runtime timeout, transcript compaction and required adapter boundaries.
- GAP-security-real-project-validation: Validate security boundaries in a real permission-bearing project.
- GAP-delivery-governance: Complete application-target synchronization, drift verification and release acceptance.
- GAP-cross-record-audit: Accept strict Project, Iteration and Case cross-record auditing in real use.

## Software Definition

Arckit is a state-driven software-development protocol and optional supervised Runtime. Project State owns explicit software-definition decisions; one Agent advances facts and dynamic gaps through trusted atomic ledger transitions.

| Decision Area | Status | Revision | Current Decision | Project Gaps |
| --- | --- | ---: | --- | --- |
| product_intent_and_scope | settled | 1 | Arckit is a repository-owned software-development handoff protocol and Runtime that lets one Agent and automation hosts advance durable Project/Case state safely. | - |
| product_capabilities | settled | 5 | Arckit provides Project/Iteration/Case ledgers, fresh-fact-driven invariant-guided dynamic Case Gap discovery, strict single-Gap Rounds, trusted atomic transitions, maintained development skills, and an optional supervised Runtime/Desktop with separate ordinary-todo and acceptance-feedback work lanes that continue a source task conversation through new Runs and Cases. | GAP-agent-scenario-evaluation |
| runtime_surfaces | settled | 1 | The software comprises repository-owned skills and Node.js ledger CLIs plus an optional Electron Desktop, Runtime supervisor, and Codex adapter. | - |
| experience_and_interaction | settled | 7 | Users observe persisted candidate comparison, accepted round closeout and verified fresh-read in one persistent Agent conversation. Runtime recovery accepts direct feedback on the same task session/thread, and renewable login restoration remains silent across transient refresh failure. Automation Overview separately presents ordinary todos and acceptance feedback; completed and accepted task Inspectors show all linked issues and progress and allow new feedback without mutating old results. | - |
| visual_language | settled | 2 | Visual requirements apply to the Desktop workspace and follow its durable visual specification; CLI and ledger surfaces remain text-native. | - |
| identity_and_access | settled | 2 | Authentication is required only for configured execution/task sources; authorization remains bounded by user approval, workspace scope, sandbox and trusted entrypoints. Runtime sessions use a server-backed rolling seven-day inactivity window: successful verification login, successful startup session restoration/refresh, or successful token refresh renews the window through rotated server credentials; only more than seven days without such activity, missing or expired credentials, explicit logout, or explicit server rejection/revocation requires login again. | - |
| data_and_state | settled | 6 | Canonical project data is Project v5, Iteration v3 and Case v5 in arckit/; normal Loop mutation uses Case Transition v8 bound to Ledger Snapshot v1, persists complete invariant assessment, produces Round Closeout v2 and requires verified post-commit fresh-read. Runtime run/session/thread and first-class acceptance-feedback records stay outside the target project; each feedback item references immutable source completion facts and starts a new canonical Case. | GAP-cross-record-audit |
| external_integrations | settled | 2 | The Runtime integrates with Codex app-server/CLI and optional task sources through explicit adapters; trusted ledger entrypoints remain repository-owned. Workshop authentication renewal uses auth-server/v1/public/refresh_token: Runtime sends the current refresh token, atomically accepts server-rotated credentials and expiry values, never locally extends signed credentials, retries transient transport/service failures without clearing a recoverable session, and treats only explicit invalid/revoked responses or local inactivity/expiry boundaries as reauthentication conditions. | GAP-runtime-resilience-and-adapters |
| feedback_and_support | settled | 4 | Operational feedback uses the persistent Agent conversation, Runtime activity/events, diagnostics and task-source synchronization. Recovery feedback continues an interrupted active execution on its task session/thread; acceptance feedback from completed or accepted review creates an independent persisted work item, keeps the source todo terminal, reuses its session/thread and exposes issue progress and solution evidence. No separate public support portal is currently required. | - |
| commercialization_and_entitlement | settled | 1 | Arckit currently has no payment, subscription, trial, quota or commercial feature-entitlement model. | - |
| technical_foundation | settled | 10 | Arckit uses repository-owned Markdown/JSON state, Node.js ESM Ledger and Runtime scripts, an Electron Desktop host, Project v5, Case v5, Transition v8, Snapshot v1, Closeout v2 and Iteration v3. Trusted candidate selection separates stable identity/freshness from Agent-authored semantics. Desktop persists ordinary todo and acceptance-feedback lanes separately, reuses one persistent Agent thread per source todo, starts a new Run and Case per feedback item, and uses deterministic arbitration plus workspace/thread leases. | GAP-runtime-resilience-and-adapters |
| security_privacy_compliance | settled | 1 | Secrets stay outside canonical project state; Runtime enforces login/configured-source boundaries, workspace authorization, sandbox/approval rules and trusted deterministic writes. | GAP-security-real-project-validation |
| quality_and_validation | settled | 2 | Protocol changes require schema/script validation, cross-record audits, Runtime automated tests, projection checks, direct-Codex no-Case recovery evidence, stale-token checks, read/write/read ordering checks, and risk-proportionate real execution evidence. | GAP-agent-scenario-evaluation, GAP-cross-record-audit |
| delivery_and_distribution | settled | 2 | Maintained skills are sourced from entry/skills and synchronized to supported application targets through governed installation; Runtime/Desktop are built and checked from runtime/arckit-runtime. Windows is a supported Runtime/Desktop execution target, so executable or command-shim launch, working directories, trusted entrypoint paths and argument boundaries must use platform-safe semantics; native Windows confirmation remains required release evidence. | - |
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
