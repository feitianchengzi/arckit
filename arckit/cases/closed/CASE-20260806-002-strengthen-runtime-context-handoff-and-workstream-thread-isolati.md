# Strengthen Runtime context handoff and workstream thread isolation

Case: CASE-20260806-002
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-06T18:56:06.750Z

## User Intent

在保持 Case 与语义 Worker 类型隔离的基础上，增加可恢复的显式 context digest、条件式 workstream thread 分流与 Case 级 Controller planning/review 边界，使跨线程、跨轮和进程重启后的待办理解依赖 canonical facts 与结构化 handoff，而不是隐藏对话历史；补充上下文漂移可观测性，不增加硬 Token 或总轮次限制。

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260806-002",
  "title": "Strengthen Runtime context handoff and workstream thread isolation",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-06T18:38:19.830Z",
  "updated_at": "2026-08-06T18:56:06.750Z",
  "user_intent": "在保持 Case 与语义 Worker 类型隔离的基础上，增加可恢复的显式 context digest、条件式 workstream thread 分流与 Case 级 Controller planning/review 边界，使跨线程、跨轮和进程重启后的待办理解依赖 canonical facts 与结构化 handoff，而不是隐藏对话历史；补充上下文漂移可观测性，不增加硬 Token 或总轮次限制。",
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
      "reason": "The Runtime now implements the specified todo/Case context boundary: per-todo Desktop sessions, explicit bounded canonical Worker context, Case/type/workstream thread identity, separate Controller planning and review lanes, soft context-drift warnings, and no hard Token or total-round ceiling.",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/schemas/controller-plan.schema.json",
        "runtime/arckit-runtime/schemas/worker-packet.schema.json",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
        "runtime/arckit-runtime/test/context-boundary.test.mjs"
      ],
      "next_transition": ""
    },
    "interaction_expectation": {
      "applicability": "not_required",
      "maturity": "unknown",
      "target_maturity": "unknown",
      "alignment": "unknown",
      "target_alignment": "unknown",
      "resolution": "resolved",
      "reason": "The optimization reuses the existing Workbench usage-warning presentation and does not add a new operator action, state, navigation path, or interaction contract.",
      "evidence": [
        "arckit/interaction/automation-workspace/interaction.md",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md"
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
      "reason": "The change adds structured metadata and an existing soft-warning entry only; it introduces no token, layout primitive, component appearance, theme, or aesthetic decision.",
      "evidence": [
        "arckit/visual/_library/design-tokens.yaml",
        "arckit/visual/_library/component-catalog.yaml",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
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
      "reason": "Controller plan and Worker packet schemas now carry explicit workstream and context digest contracts; the orchestrator derives bounded canonical context and composes separate thread keys; projection records scope signatures and warns softly on drift; focused and full tests verify the contract.",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/schemas/controller-plan.schema.json",
        "runtime/arckit-runtime/schemas/worker-packet.schema.json",
        "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs"
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
      "reason": "Runtime now requires Controller-declared workstream ids, derives a bounded context digest from the fresh selected Case, separates project planning from Case review threads, scopes Worker reuse by Case/type/workstream, and projects non-blocking context scope drift without imposing Token or round limits.",
      "evidence": [
        "runtime/arckit-runtime/schemas/controller-plan.schema.json",
        "runtime/arckit-runtime/schemas/worker-packet.schema.json",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "entry/skills/using-arckit/references/worker-packet-and-report.md"
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
      "reason": "Focused thread, packet, context-boundary, projection, and renderer regressions pass, and the complete Runtime check passes 140 tests with 1 environment-gated layout test skipped and no failures. Codex structured-output schema preflight also passes.",
      "evidence": [
        "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
        "runtime/arckit-runtime/test/context-boundary.test.mjs",
        "runtime/arckit-runtime/test/capability-registry.test.mjs",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "runtime/arckit-runtime/package.json"
      ],
      "next_transition": ""
    }
  },
  "content_revision": 8,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "runtime/arckit-runtime/config/case-policy.json and explicit user authorization on 2026-08-07",
      "snapshotted_at": "2026-08-06T18:38:19.830Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 8,
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
        "content_revision": 8,
        "dimensions": {
          "correctness": "clean",
          "completeness": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "runtime/arckit-runtime/src/agent-orchestrator.mjs",
          "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
          "runtime/arckit-runtime/schemas/controller-plan.schema.json",
          "runtime/arckit-runtime/schemas/worker-packet.schema.json",
          "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
          "runtime/arckit-runtime/test/context-boundary.test.mjs",
          "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
          "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/tech/arckit-runtime/solution.md"
        ],
        "occurred_at": "2026-08-06T18:56:06.750Z"
      }
    ],
    "evidence": [
      "runtime/arckit-runtime/src/agent-orchestrator.mjs",
      "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
      "runtime/arckit-runtime/schemas/controller-plan.schema.json",
      "runtime/arckit-runtime/schemas/worker-packet.schema.json",
      "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
      "runtime/arckit-runtime/test/context-boundary.test.mjs",
      "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
      "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
      "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
      "arckit/tech/arckit-runtime/solution.md"
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
      "goal": "Formalize recoverable Worker context and conditional workstream thread behavior.",
      "outcome": "completed",
      "planned_transition": "product_expectation receives an evidence-backed applicability decision and advances as far as current facts support.",
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
              "reason": "The stable Runtime workspace specification now requires bounded context digests, Case/type/workstream thread identity, separate project planning and Case review threads, and soft scope-drift observation. Current code still keys Workers only by Case and type, reuses one global Controller thread, and does not construct the digest."
            },
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/schemas/controller-plan.schema.json",
              "runtime/arckit-runtime/schemas/worker-packet.schema.json"
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
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/schemas/controller-plan.schema.json",
        "runtime/arckit-runtime/schemas/worker-packet.schema.json"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-06T18:43:31.044Z"
    },
    {
      "round": 2,
      "goal": "Determine whether new interaction facts are required.",
      "outcome": "completed",
      "planned_transition": "interaction_expectation receives an evidence-backed applicability decision and advances as far as current facts support.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "interaction_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "The optimization reuses the existing Workbench usage-warning presentation and does not add a new operator action, state, navigation path, or interaction contract."
            },
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "arckit/tech/arckit-runtime/desktop-execution-solution.md"
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
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-06T18:43:32.898Z"
    },
    {
      "round": 3,
      "goal": "Determine whether new visual facts are required.",
      "outcome": "completed",
      "planned_transition": "visual_expectation receives an evidence-backed applicability decision and advances as far as current facts support.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "visual_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "The change adds structured metadata and an existing soft-warning entry only; it introduces no token, layout primitive, component appearance, theme, or aesthetic decision."
            },
            "evidence": [
              "arckit/visual/_library/design-tokens.yaml",
              "arckit/visual/_library/component-catalog.yaml",
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
        "arckit/visual/_library/design-tokens.yaml",
        "arckit/visual/_library/component-catalog.yaml",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-06T18:43:34.742Z"
    },
    {
      "round": 4,
      "goal": "Formalize context digest, workstream routing, Controller thread boundaries, and drift telemetry.",
      "outcome": "completed",
      "planned_transition": "technical_expectation receives an evidence-backed applicability decision and advances as far as current facts support.",
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
              "reason": "The adopted technical solution defines a bounded digest derived from fresh canonical Case facts, explicit Controller-owned workstream ids, separate project-planning and Case-review threads, ephemeral restart recovery, and non-blocking scope-signature drift telemetry. The current schemas and orchestrator do not yet implement these contracts."
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "arckit/tech/arckit-runtime/desktop-execution-solution.md",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "runtime/arckit-runtime/schemas/controller-plan.schema.json",
              "runtime/arckit-runtime/schemas/worker-packet.schema.json"
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
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/schemas/controller-plan.schema.json",
        "runtime/arckit-runtime/schemas/worker-packet.schema.json"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-06T18:43:36.571Z"
    },
    {
      "round": 5,
      "goal": "Implement canonical context handoff, semantic workstream isolation, Controller thread boundaries, and non-blocking context drift observability.",
      "outcome": "completed",
      "planned_transition": "implementation_state becomes required, formalized, aligned, and resolved with source evidence.",
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
              "reason": "Runtime now requires Controller-declared workstream ids, derives a bounded context digest from the fresh selected Case, separates project planning from Case review threads, scopes Worker reuse by Case/type/workstream, and projects non-blocking context scope drift without imposing Token or round limits."
            },
            "evidence": [
              "runtime/arckit-runtime/schemas/controller-plan.schema.json",
              "runtime/arckit-runtime/schemas/worker-packet.schema.json",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "entry/skills/using-arckit/references/worker-packet-and-report.md"
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
        "runtime/arckit-runtime/schemas/controller-plan.schema.json",
        "runtime/arckit-runtime/schemas/worker-packet.schema.json",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "entry/skills/using-arckit/references/worker-packet-and-report.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-06T18:54:11.504Z"
    },
    {
      "round": 6,
      "goal": "Verify thread isolation, context digest boundaries, schema compatibility, drift projection, and Desktop observability.",
      "outcome": "completed",
      "planned_transition": "verification_state becomes required, formalized, aligned, and resolved after focused and full Runtime checks.",
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
              "reason": "Focused thread, packet, context-boundary, projection, and renderer regressions pass, and the complete Runtime check passes 140 tests with 1 environment-gated layout test skipped and no failures. Codex structured-output schema preflight also passes."
            },
            "evidence": [
              "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
              "runtime/arckit-runtime/test/context-boundary.test.mjs",
              "runtime/arckit-runtime/test/capability-registry.test.mjs",
              "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
              "runtime/arckit-runtime/package.json"
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
        "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
        "runtime/arckit-runtime/test/context-boundary.test.mjs",
        "runtime/arckit-runtime/test/capability-registry.test.mjs",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "runtime/arckit-runtime/package.json"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-06T18:54:47.597Z"
    },
    {
      "round": 7,
      "goal": "Reconcile the implemented Runtime behavior with the stable automation workspace specification.",
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
              "reason": "The Runtime now implements the specified todo/Case context boundary: per-todo Desktop sessions, explicit bounded canonical Worker context, Case/type/workstream thread identity, separate Controller planning and review lanes, soft context-drift warnings, and no hard Token or total-round ceiling."
            },
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
              "runtime/arckit-runtime/test/context-boundary.test.mjs"
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
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
        "runtime/arckit-runtime/test/context-boundary.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-06T18:55:03.252Z"
    },
    {
      "round": 8,
      "goal": "Reconcile Runtime schemas, orchestration, projection, and tests with the adopted technical context-governance design.",
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
              "reason": "Controller plan and Worker packet schemas now carry explicit workstream and context digest contracts; the orchestrator derives bounded canonical context and composes separate thread keys; projection records scope signatures and warns softly on drift; focused and full tests verify the contract."
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "arckit/tech/arckit-runtime/desktop-execution-solution.md",
              "runtime/arckit-runtime/schemas/controller-plan.schema.json",
              "runtime/arckit-runtime/schemas/worker-packet.schema.json",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
              "runtime/arckit-runtime/test/token-usage-projector.test.mjs"
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
        "runtime/arckit-runtime/schemas/controller-plan.schema.json",
        "runtime/arckit-runtime/schemas/worker-packet.schema.json",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-06T18:55:19.859Z"
    },
    {
      "round": 9,
      "goal": "Review the complete Case result for correctness, completeness, and minimality.",
      "outcome": "completed",
      "planned_transition": "Record a clean completion review for content_revision=8 and resolve the Case.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": {
          "outcome": "clean",
          "reviewer": "agent",
          "reviewed_content_revision": 8,
          "dimensions": {
            "correctness": "clean",
            "completeness": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "runtime/arckit-runtime/src/agent-orchestrator.mjs",
            "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
            "runtime/arckit-runtime/schemas/controller-plan.schema.json",
            "runtime/arckit-runtime/schemas/worker-packet.schema.json",
            "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
            "runtime/arckit-runtime/test/context-boundary.test.mjs",
            "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
            "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/tech/arckit-runtime/solution.md"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/schemas/controller-plan.schema.json",
        "runtime/arckit-runtime/schemas/worker-packet.schema.json",
        "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
        "runtime/arckit-runtime/test/context-boundary.test.mjs",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/tech/arckit-runtime/solution.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-06T18:56:06.750Z"
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
          "case:CASE-20260806-002"
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
    "updated_at": "2026-08-06T18:56:06.750Z"
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
