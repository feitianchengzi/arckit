# Arckit Skill Repository Project State

Status: active
Revision: 3
Updated: 2026-08-10T14:56:53.200Z
Canonical Record: state.record.json

## Project Intent

治理 Arckit skill 体系，使其同时支撑 Codex 类人机协作和自动化平台的软件开发接力协议。

## Current Focus

Validate dynamic gap selection in isolated real software scenarios.

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
| product_capabilities | settled | 1 | Arckit provides Project/Iteration/Case ledgers, dynamic Gap selection, trusted atomic transitions, maintained development skills, and an optional supervised Runtime/Desktop. | GAP-agent-scenario-evaluation |
| runtime_surfaces | settled | 1 | The software comprises repository-owned skills and Node.js ledger CLIs plus an optional Electron Desktop, Runtime supervisor, and Codex adapter. | - |
| experience_and_interaction | settled | 1 | Users can invoke using-arckit conversationally; Desktop users select a project/todo, observe one persistent Agent conversation, steer it, and recover persisted runs. | - |
| visual_language | settled | 1 | Visual requirements apply to the Desktop workspace and follow its durable visual specification; CLI and ledger surfaces remain text-native. | - |
| identity_and_access | settled | 1 | Authentication is required only for configured execution/task sources; authorization remains bounded by user approval, workspace scope, sandbox and trusted entrypoints. | - |
| data_and_state | settled | 1 | Canonical project data is Project v5, Iteration v3 and Case v5 in arckit/; Runtime run/session/thread records live outside the target project and only opaque refs enter the ledger. | GAP-cross-record-audit |
| external_integrations | settled | 1 | The Runtime integrates with Codex app-server/CLI and optional task sources through explicit adapters; trusted ledger entrypoints remain repository-owned. | GAP-runtime-resilience-and-adapters |
| feedback_and_support | settled | 1 | Operational feedback is provided through the persistent Agent conversation, Runtime activity/events, diagnostics and task-source synchronization; no separate public support portal is currently required. | - |
| commercialization_and_entitlement | settled | 1 | Arckit currently has no payment, subscription, trial, quota or commercial feature-entitlement model. | - |
| technical_foundation | settled | 2 | Arckit uses repository-owned Markdown/JSON state, Node.js ESM ledger and Runtime scripts, an Electron desktop host, Project State v5, Case/Transition v5, and Iteration v3 with trusted atomic transitions. | GAP-runtime-resilience-and-adapters |
| security_privacy_compliance | settled | 1 | Secrets stay outside canonical project state; Runtime enforces login/configured-source boundaries, workspace authorization, sandbox/approval rules and trusted deterministic writes. | GAP-security-real-project-validation |
| quality_and_validation | settled | 1 | Protocol changes require schema/script validation, cross-record audits, Runtime automated tests, projection checks and risk-proportionate real execution evidence. | GAP-agent-scenario-evaluation, GAP-cross-record-audit |
| delivery_and_distribution | settled | 1 | Maintained skills are sourced from entry/skills, synchronized to supported application targets through governed installation, and Runtime/Desktop are built and checked from runtime/arckit-runtime. | GAP-delivery-governance |
| observability_and_operation | settled | 1 | Runtime persists lifecycle, activity, messages and timing outside the target project, supports restart reconciliation, and exposes opaque run refs for canonical traceability. | GAP-runtime-resilience-and-adapters |

## Software Invariants

- observable-behavior-has-durable-expectation: The relevant product expectation is accurate, unambiguous, and durably recoverable.
- changed-interactions-remain-recoverable: The changed interaction expectation is coherent and durably recoverable.
- changed-visual-language-remains-consistent: The changed visual expectation remains consistent with the project visual language and is durably recoverable.
- changed-contracts-remain-explainable: The resulting technical contract is coherent, explainable, and durably recoverable.
- accepted-facts-are-realized: The implementation realizes all relevant accepted facts and upheld project decisions and invariants.
- material-risks-have-credible-evidence: Material correctness and regression risks are covered by credible, repeatable verification evidence.

## Read For Precision

- state.record.json
- arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.record.json
