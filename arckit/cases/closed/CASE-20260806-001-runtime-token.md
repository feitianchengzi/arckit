# 优化 Runtime 会话隔离、执行效率与 Token 可观测性

Case: CASE-20260806-001
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-06T18:09:56.302Z

## User Intent

修复 Desktop 自动待办共享历史对话、同一构建重复并发、Worker 跨语义阶段复用 thread、Controller Review 报告引用脆弱等问题；建立按 Run/round/turn/lane 归因的 token 用量监控、上下文增长观察和软异常提示，通过合理上下文与等待机制降低浪费，不增加硬 token 总上限或硬总轮次限制。

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260806-001",
  "title": "优化 Runtime 会话隔离、执行效率与 Token 可观测性",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-06T17:34:53.466Z",
  "updated_at": "2026-08-06T18:09:56.302Z",
  "user_intent": "修复 Desktop 自动待办共享历史对话、同一构建重复并发、Worker 跨语义阶段复用 thread、Controller Review 报告引用脆弱等问题；建立按 Run/round/turn/lane 归因的 token 用量监控、上下文增长观察和软异常提示，通过合理上下文与等待机制降低浪费，不增加硬 token 总上限或硬总轮次限制。",
  "expected_outcome": "",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facets": {
    "product_expectation": {
      "applicability": "required",
      "maturity": "formalized",
      "target_maturity": "formalized",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "The implementation now satisfies the formalized product rules: every newly claimed todo receives a dedicated Desktop task session; Runtime context is intentionally reused only within a Case and semantic worker type; equivalent concurrent commands are suppressed; and token usage is governed through transparent composition, historical baselines, and soft warnings rather than hard totals.",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs"
      ],
      "next_transition": ""
    },
    "interaction_expectation": {
      "applicability": "required",
      "maturity": "formalized",
      "target_maturity": "formalized",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "The Desktop Workbench now binds displayed messages to the active todo and its dedicated session, exposes the task session identity, shows logical total, cached and uncached input, output, reasoning, context pressure, timing, historical median comparison, and non-blocking warning explanations.",
      "evidence": [
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/intervention-workbench.html",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs"
      ],
      "next_transition": ""
    },
    "visual_expectation": {
      "applicability": "not_required",
      "maturity": "unknown",
      "target_maturity": "unknown",
      "alignment": "unknown",
      "target_alignment": "unknown",
      "resolution": "resolved",
      "reason": "The optimization adds task ownership labels, token rows, and soft-anomaly content within existing Inspector, badge, summary, and evidence patterns; it changes information and behavior but does not require new visual tokens, themes, layout primitives, or aesthetic decisions.",
      "evidence": [
        "arckit/interaction/automation-workspace/intervention-workbench.html",
        "arckit/visual/_library/component-catalog.yaml",
        "arckit/visual/_library/design-tokens.yaml"
      ],
      "next_transition": ""
    },
    "technical_expectation": {
      "applicability": "required",
      "maturity": "formalized",
      "target_maturity": "formalized",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "The code follows the adopted boundaries: Coordinator owns task-session lifecycle and recent baselines, DesktopRunManager persists task ownership, AgentOrchestrator owns semantic thread keys, the Codex adapter owns approval-time single-flight, the projector owns token and timing derivation, and the renderer remains a projection consumer.",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs"
      ],
      "next_transition": ""
    },
    "implementation_state": {
      "applicability": "required",
      "maturity": "formalized",
      "target_maturity": "formalized",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "Runtime now creates a dedicated Desktop session per todo, isolates Codex worker threads by Case and semantic worker type, suppresses equivalent concurrent command approvals, robustly resolves Controller report references, and projects deduplicated token composition, timing, baselines, and non-blocking warnings without hard token or total-round limits.",
      "evidence": [
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
      ],
      "next_transition": ""
    },
    "verification_state": {
      "applicability": "required",
      "maturity": "formalized",
      "target_maturity": "formalized",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "The full Runtime check suite validates session isolation, Case-and-worker-type thread identity, exact active-command suppression, deduplicated cumulative token snapshots and turn deltas, context-pressure soft warnings, timing projection, historical median baselines, and the Desktop presentation. The suite completed with 137 passes, zero failures, and one conditional layout skip.",
      "evidence": [
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
        "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "verification:npm-run-check:138-tests-137-pass-0-fail-1-conditional-skip"
      ],
      "next_transition": ""
    }
  },
  "content_revision": 9,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "operator-authorized runtime optimization case, 2026-08-07",
      "snapshotted_at": "2026-08-06T17:34:53.466Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 9,
    "dimensions": {
      "correctness": "clean",
      "completeness": "clean",
      "minimality": "clean"
    },
    "findings": [],
    "cycles": [
      {
        "cycle": 1,
        "autonomous_cycle": 1,
        "reviewer": "agent",
        "outcome": "clean",
        "content_revision": 9,
        "dimensions": {
          "correctness": "clean",
          "completeness": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/spec/INDEX.md",
          "arckit/spec/_map/feature-matrix.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/automation-workspace/intervention-workbench.html",
          "arckit/interaction/INDEX.md",
          "arckit/interaction/_map/feature-matrix.md",
          "arckit/tech/arckit-runtime/solution.md",
          "arckit/tech/arckit-runtime/desktop-execution-solution.md",
          "runtime/arckit-runtime/README.md",
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
          "runtime/arckit-runtime/src/agent-orchestrator.mjs",
          "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
          "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
          "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
          "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
          "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
          "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
          "runtime/arckit-runtime/test/capability-registry.test.mjs",
          "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
          "verification:npm-run-check:138-tests-137-pass-0-fail-1-conditional-skip",
          "verification:git-diff-check-clean",
          "verification:project-state-audit-ok"
        ],
        "occurred_at": "2026-08-06T18:09:56.302Z"
      }
    ],
    "evidence": [
      "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
      "arckit/spec/INDEX.md",
      "arckit/spec/_map/feature-matrix.md",
      "arckit/interaction/automation-workspace/interaction.md",
      "arckit/interaction/automation-workspace/intervention-workbench.html",
      "arckit/interaction/INDEX.md",
      "arckit/interaction/_map/feature-matrix.md",
      "arckit/tech/arckit-runtime/solution.md",
      "arckit/tech/arckit-runtime/desktop-execution-solution.md",
      "runtime/arckit-runtime/README.md",
      "runtime/arckit-runtime/src/automation-coordinator.mjs",
      "runtime/arckit-runtime/src/desktop-run-manager.mjs",
      "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
      "runtime/arckit-runtime/src/agent-orchestrator.mjs",
      "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
      "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
      "runtime/arckit-runtime/desktop/renderer/renderer.js",
      "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
      "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
      "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
      "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
      "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
      "runtime/arckit-runtime/test/capability-registry.test.mjs",
      "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
      "verification:npm-run-check:138-tests-137-pass-0-fail-1-conditional-skip",
      "verification:git-diff-check-clean",
      "verification:project-state-audit-ok"
    ],
    "escalation": null,
    "human_authorizations": []
  },
  "open_questions": [],
  "decisions": [],
  "pending_handoffs": [],
  "process_notes": [],
  "rounds": [
    {
      "round": 1,
      "goal": "Formalize Runtime task isolation, execution deduplication, and token soft-governance behavior.",
      "outcome": "completed",
      "planned_transition": "product_expectation becomes required/formalized with explicit acceptance rules; alignment remains diverged until implementation is updated.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "product_expectation",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "diverged",
              "target_alignment": "aligned",
              "resolution": "unresolved",
              "reason": "The operator explicitly requires per-task conversation isolation, efficient token use, usage monitoring, and soft anomaly governance without hard token or total-round limits; the stable product spec now defines these behaviors, while the current Desktop and Runtime implementations do not yet satisfy them."
            },
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/spec/INDEX.md",
        "arckit/spec/_map/feature-matrix.md",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-06T17:37:36.182Z"
    },
    {
      "round": 2,
      "goal": "Formalize task-scoped Workbench transcripts and non-blocking token observability interactions.",
      "outcome": "completed",
      "planned_transition": "interaction_expectation becomes required and formalized; alignment remains diverged until Desktop implementation is updated.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "interaction_expectation",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "diverged",
              "target_alignment": "aligned",
              "resolution": "unresolved",
              "reason": "The Workbench must isolate transcripts by remote task session and expose deduplicated token composition plus explainable soft anomalies without automatic stopping; the interaction facts and wireframe now formalize this behavior, while the Desktop implementation does not yet project it."
            },
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/intervention-workbench.html",
              "runtime/arckit-runtime/desktop/renderer/renderer.js"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/intervention-workbench.html",
        "arckit/interaction/INDEX.md",
        "arckit/interaction/_map/feature-matrix.md",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-06T17:42:53.329Z"
    },
    {
      "round": 3,
      "goal": "Decide whether the Runtime optimization requires new visual facts.",
      "outcome": "completed",
      "planned_transition": "visual_expectation becomes not_required and resolved because existing Workbench components and semantic states cover the change.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "visual_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "The optimization adds task ownership labels, token rows, and soft-anomaly content within existing Inspector, badge, summary, and evidence patterns; it changes information and behavior but does not require new visual tokens, themes, layout primitives, or aesthetic decisions."
            },
            "evidence": [
              "arckit/interaction/automation-workspace/intervention-workbench.html",
              "arckit/visual/_library/component-catalog.yaml",
              "arckit/visual/_library/design-tokens.yaml"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/interaction/automation-workspace/intervention-workbench.html",
        "arckit/visual/_library/component-catalog.yaml",
        "arckit/visual/_library/design-tokens.yaml"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-06T17:43:39.878Z"
    },
    {
      "round": 4,
      "goal": "Formalize Runtime task-session ownership, semantic thread boundaries, token aggregation, command single-flight, and soft anomaly contracts.",
      "outcome": "completed",
      "planned_transition": "technical_expectation becomes required and formalized; alignment remains diverged until Runtime and Desktop code are updated.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "technical_expectation",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "diverged",
              "target_alignment": "aligned",
              "resolution": "unresolved",
              "reason": "The optimization crosses Desktop persistence, Coordinator lifecycle, Codex adapter context, event projection, and Renderer boundaries. The adopted technical solution defines per-task sessions, worker-type thread keys, exact command single-flight, deduplicated thread/turn token accounting, and non-blocking warnings; current code still uses the default project session, builder-wide thread reuse, and no usage projection."
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "arckit/tech/arckit-runtime/desktop-execution-solution.md",
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md",
        "arckit/tech/INDEX.md",
        "arckit/interaction/_map/RELATIONS.md",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-06T17:50:30.843Z"
    },
    {
      "round": 5,
      "goal": "Implement task-scoped sessions, semantic thread boundaries, command single-flight, and non-blocking token and timing observability.",
      "outcome": "completed",
      "planned_transition": "implementation_state becomes required, formalized, aligned, and resolved with code evidence.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "implementation_state",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "Runtime now creates a dedicated Desktop session per todo, isolates Codex worker threads by Case and semantic worker type, suppresses equivalent concurrent command approvals, robustly resolves Controller report references, and projects deduplicated token composition, timing, baselines, and non-blocking warnings without hard token or total-round limits."
            },
            "evidence": [
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-06T18:07:47.206Z"
    },
    {
      "round": 6,
      "goal": "Verify task isolation, semantic thread separation, duplicate-command suppression, token accounting, timing projection, baselines, and renderer output.",
      "outcome": "completed",
      "planned_transition": "verification_state becomes required, formalized, aligned, and resolved with full-suite evidence.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "verification_state",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "The full Runtime check suite validates session isolation, Case-and-worker-type thread identity, exact active-command suppression, deduplicated cumulative token snapshots and turn deltas, context-pressure soft warnings, timing projection, historical median baselines, and the Desktop presentation. The suite completed with 137 passes, zero failures, and one conditional layout skip."
            },
            "evidence": [
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
              "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
              "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
              "verification:npm-run-check:138-tests-137-pass-0-fail-1-conditional-skip"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
        "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "verification:npm-run-check:138-tests-137-pass-0-fail-1-conditional-skip"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-06T18:08:29.375Z"
    },
    {
      "round": 7,
      "goal": "Reconcile the implemented Runtime behavior with the formalized product acceptance rules.",
      "outcome": "completed",
      "planned_transition": "product_expectation advances from diverged/unresolved to aligned/resolved.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "product_expectation",
            "set": {
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "The implementation now satisfies the formalized product rules: every newly claimed todo receives a dedicated Desktop task session; Runtime context is intentionally reused only within a Case and semantic worker type; equivalent concurrent commands are suppressed; and token usage is governed through transparent composition, historical baselines, and soft warnings rather than hard totals."
            },
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-06T18:09:18.415Z"
    },
    {
      "round": 8,
      "goal": "Reconcile the implemented Workbench with task-scoped transcript and usage-observation interactions.",
      "outcome": "completed",
      "planned_transition": "interaction_expectation advances from diverged/unresolved to aligned/resolved.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "interaction_expectation",
            "set": {
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "The Desktop Workbench now binds displayed messages to the active todo and its dedicated session, exposes the task session identity, shows logical total, cached and uncached input, output, reasoning, context pressure, timing, historical median comparison, and non-blocking warning explanations."
            },
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/intervention-workbench.html",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/intervention-workbench.html",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-06T18:09:20.056Z"
    },
    {
      "round": 9,
      "goal": "Reconcile the implementation with the adopted Runtime and Desktop execution architecture.",
      "outcome": "completed",
      "planned_transition": "technical_expectation advances from diverged/unresolved to aligned/resolved.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "technical_expectation",
            "set": {
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "The code follows the adopted boundaries: Coordinator owns task-session lifecycle and recent baselines, DesktopRunManager persists task ownership, AgentOrchestrator owns semantic thread keys, the Codex adapter owns approval-time single-flight, the projector owns token and timing derivation, and the renderer remains a projection consumer."
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "arckit/tech/arckit-runtime/desktop-execution-solution.md",
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-06T18:09:21.746Z"
    },
    {
      "round": 10,
      "goal": "Review the complete Runtime optimization for correctness, completeness, and minimality.",
      "outcome": "completed",
      "planned_transition": "completion_review becomes clean for content_revision=9 and the Case resolves.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": {
          "outcome": "clean",
          "reviewer": "agent",
          "reviewed_content_revision": 9,
          "dimensions": {
            "correctness": "clean",
            "completeness": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/spec/INDEX.md",
            "arckit/spec/_map/feature-matrix.md",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/interaction/automation-workspace/intervention-workbench.html",
            "arckit/interaction/INDEX.md",
            "arckit/interaction/_map/feature-matrix.md",
            "arckit/tech/arckit-runtime/solution.md",
            "arckit/tech/arckit-runtime/desktop-execution-solution.md",
            "runtime/arckit-runtime/README.md",
            "runtime/arckit-runtime/src/automation-coordinator.mjs",
            "runtime/arckit-runtime/src/desktop-run-manager.mjs",
            "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
            "runtime/arckit-runtime/src/agent-orchestrator.mjs",
            "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
            "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
            "runtime/arckit-runtime/desktop/renderer/renderer.js",
            "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
            "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
            "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
            "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
            "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
            "runtime/arckit-runtime/test/capability-registry.test.mjs",
            "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
            "verification:npm-run-check:138-tests-137-pass-0-fail-1-conditional-skip",
            "verification:git-diff-check-clean",
            "verification:project-state-audit-ok"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/spec/INDEX.md",
        "arckit/spec/_map/feature-matrix.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/intervention-workbench.html",
        "arckit/interaction/INDEX.md",
        "arckit/interaction/_map/feature-matrix.md",
        "arckit/tech/arckit-runtime/solution.md",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md",
        "runtime/arckit-runtime/README.md",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
        "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
        "runtime/arckit-runtime/test/capability-registry.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "verification:npm-run-check:138-tests-137-pass-0-fail-1-conditional-skip",
        "verification:git-diff-check-clean",
        "verification:project-state-audit-ok"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-06T18:09:56.302Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "base_ready": true,
    "satisfied": [
      "product_expectation",
      "interaction_expectation",
      "visual_expectation",
      "technical_expectation",
      "implementation_state",
      "verification_state",
      "completion_review"
    ],
    "remaining": [],
    "blocked": [],
    "reason": "All Case content is complete and the current content revision has a clean completion review.",
    "candidate_gaps": [],
    "loop_handoff": {
      "version": "loop-handoff/v2",
      "status": "done",
      "next_responsibility": "none",
      "agent_continuation_available": false,
      "human_decision_required": false,
      "trigger_mode": "none",
      "responsibility_reason": "The Case State has no unresolved content gap and the current content revision has a clean completion review.",
      "next_prompt": "",
      "agent_instruction": {
        "goal": "",
        "required_context_refs": [
          "arckit/project/state.record.json",
          "case:CASE-20260806-001"
        ],
        "required_actions": [],
        "required_checks": [
          "case_transition evidence",
          "derived case_resolution"
        ],
        "stop_condition": "Stop after applying one evidence-backed Case transition or producing a human/external handoff."
      },
      "human_gate": {
        "required": false,
        "reason": "",
        "decision_needed": ""
      },
      "progress_guard": {
        "expected_state_change": "",
        "actual_state_change": "",
        "no_progress_limit": 2,
        "max_auto_rounds": 3
      }
    },
    "updated_at": "2026-08-06T18:09:56.302Z"
  },
  "project_impact_candidate": {
    "status": "none",
    "changes": [],
    "evidence": []
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
