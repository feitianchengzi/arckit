# Unify Automation intervention conversation with Chat

Case: CASE-20260823-004
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-23T15:51:56.156Z

## User Intent

Optimize the Automation task human-intervention page so its message-list conversation and browsing experience directly reuse Chat, while preserving automation execution capabilities in side panels and exposing a complete execution overview.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260823-004",
  "title": "Unify Automation intervention conversation with Chat",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-23T15:18:40.005Z",
  "updated_at": "2026-08-23T15:51:56.156Z",
  "user_intent": "Optimize the Automation task human-intervention page so its message-list conversation and browsing experience directly reuse Chat, while preserving automation execution capabilities in side panels and exposing a complete execution overview.",
  "expected_outcome": "Automation human intervention uses the same conversation surface as Chat; automation controls remain fully available in left/right panels; elapsed execution time, total gap rounds, and per-gap work are visible outside the transcript; implementation and regression evidence are complete.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-AUTOMATION-INTERVENTION-UX-REQUEST",
      "revision": 1,
      "status": "accepted",
      "statement": "The Automation task human-intervention page must directly reuse Chat message-list conversation and browsing behavior, preserve all automation execution capabilities by relocating them into the left and right panels, and show complete elapsed execution time, total gap-round count, and per-gap work outside the message list.",
      "basis": "Explicit operator request received 2026-08-23.",
      "evidence": [
        "Current operator input, 2026-08-23"
      ]
    },
    {
      "id": "FACT-CURRENT-AUTOMATION-CONVERSATION-DIVERGENCE",
      "revision": 1,
      "status": "accepted",
      "statement": "Chat and Automation currently use separate message renderers, DOM classes, scroll-follow state, and event bindings; Run Activity exposes timestamps and round events but has no durable session-wide per-gap aggregate.",
      "basis": "Direct inspection of the shipped Renderer and Run Activity projector.",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/src/projection/run-event-projector.mjs"
      ]
    },
    {
      "id": "FACT-AUTOMATION-CONVERSATION-CONTRACT",
      "revision": 1,
      "status": "accepted",
      "statement": "Chat and Automation must render common conversation items through one Conversation Surface implementation; Automation-only loop, round, ledger, evidence, recovery, and control information belongs in side panels, whose execution overview shows full wall-clock time, total gap rounds, and each gap goal, work, and result from structured Runtime data across the task session.",
      "basis": "Explicit operator requirement plus synchronized specification, interaction, visual-applicability, and technical decisions.",
      "evidence": [
        "Current operator input, 2026-08-23",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/intervention-workbench.html",
        "arckit/visual/_library/brief.md",
        "arckit/visual/_library/component-catalog.yaml",
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    },
    {
      "id": "FACT-AUTOMATION-CONVERSATION-SURFACE-IMPLEMENTED",
      "revision": 1,
      "status": "accepted",
      "statement": "The shipped Renderer now creates the Chat and Automation message lists from one Conversation Surface module with shared Markdown, code-copy, link, approval, and scroll-follow behavior; Automation-only loop and structured messages render in the right panel, controls and mode are panel-owned, Run Activity retains uncapped structured gap_rounds, and the task-session overview aggregates complete elapsed time, Run count, gap-round count, and each gap goal, work summary, and outcome across Runs with legacy fallback.",
      "basis": "Direct implementation inspection plus complete Runtime and Electron layout regression results.",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/src/desktop/transcript-presentation.mjs",
        "runtime/arcorbit/src/desktop/automation-execution-summary.mjs",
        "runtime/arcorbit/src/projection/run-event-projector.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/automation-execution-summary.test.mjs",
        "runtime/arcorbit/test/token-usage-projector.test.mjs",
        "npm run check: 333 passed, 4 skipped, 0 failed",
        "npm run test:layout: 1 passed, 0 failed"
      ]
    },
    {
      "id": "FACT-AUTOMATION-CONVERSATION-COPY-RECOVERY",
      "revision": 1,
      "status": "accepted",
      "statement": "Conversation Surface code-copy is executed through the same consumer-supplied runAction boundary for Chat and Automation; clipboard rejection keeps the button unchanged and reaches toast handling, while success updates and resets the shared button state.",
      "basis": "Direct code inspection and explicit rejected/successful clipboard unit paths.",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-AUTOMATION-INTERVENTION-EXPERIENCE",
      "fact_id": "FACT-AUTOMATION-INTERVENTION-UX-REQUEST",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 34
      },
      "effect": "upheld",
      "reason": "Both workspaces now instantiate the same Conversation Surface and Automation information and controls are placed in the side panels.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/desktop-renderer.test.mjs"
      ]
    },
    {
      "id": "IMPACT-AUTOMATION-INTERVENTION-PRODUCT",
      "fact_id": "FACT-AUTOMATION-CONVERSATION-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 22
      },
      "effect": "upheld",
      "reason": "The complete execution overview and existing Automation gate, ledger, recovery, Git, token, evidence, and intervention capabilities are present.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/desktop/automation-execution-summary.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/automation-execution-summary.test.mjs"
      ]
    },
    {
      "id": "IMPACT-AUTOMATION-INTERVENTION-REALIZATION",
      "fact_id": "FACT-AUTOMATION-CONVERSATION-CONTRACT",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Direct code and DOM evidence realizes the accepted shared-surface, panel, timing, and gap-overview contract.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/src/desktop/transcript-presentation.mjs",
        "runtime/arcorbit/src/desktop/automation-execution-summary.mjs",
        "runtime/arcorbit/src/projection/run-event-projector.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/automation-execution-summary.test.mjs",
        "runtime/arcorbit/test/token-usage-projector.test.mjs"
      ]
    },
    {
      "id": "IMPACT-AUTOMATION-INTERVENTION-RISK",
      "fact_id": "FACT-CURRENT-AUTOMATION-CONVERSATION-DIVERGENCE",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Unit, Renderer contract, full Runtime, and Electron layout regressions credibly cover shared reuse, structured summaries, legacy fallback, and Automation no-regression.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/automation-execution-summary.test.mjs",
        "runtime/arcorbit/test/token-usage-projector.test.mjs",
        "npm run check: 333 passed, 4 skipped, 0 failed",
        "npm run test:layout: 1 passed, 0 failed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-ESTABLISH-AUTOMATION-INTERVENTION-CONTRACT",
      "status": "resolved",
      "goal": "Establish the current-state evidence and durable product, interaction, visual-applicability, and technical contract for reusing Chat in Automation intervention without losing automation capabilities.",
      "reason": "The existing Chat and Automation implementation boundaries, automation-only controls, and available run/gap summary data must be established before the implementation target and verification boundary are safe to choose.",
      "derived_from": [
        "case_intent",
        "FACT-AUTOMATION-INTERVENTION-UX-REQUEST"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "high",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Current Chat and Automation intervention UI/component/data-flow evidence.",
        "Durable product and interaction behavior covering direct shared conversation reuse, panel-owned automation capabilities, and complete execution overview.",
        "Technical boundary and visual-applicability evidence sufficient to define the implementation and regression scope."
      ],
      "resolution": {
        "id": "GAP-ESTABLISH-AUTOMATION-INTERVENTION-CONTRACT",
        "status": "resolved",
        "outcome": "The existing divergence and target shared Conversation Surface, side-panel ownership, structured timing, and per-gap overview are now durably specified.",
        "reason": "Source inspection and synchronized definition artifacts establish a testable implementation boundary without reducing Automation capabilities.",
        "evidence": [
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/automation-workspace/intervention-workbench.html",
          "arckit/visual/_library/brief.md",
          "arckit/visual/_library/component-catalog.yaml",
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/src/projection/run-event-projector.mjs"
        ],
        "occurred_at": "2026-08-23T15:33:49.414Z"
      }
    },
    {
      "id": "GAP-IMPLEMENT-AUTOMATION-CONVERSATION-SURFACE",
      "status": "resolved",
      "goal": "Implement one shared Conversation Surface used by Chat and Automation intervention, relocate Automation-only information and controls to side panels, and add complete structured execution timing and per-gap summaries without capability regression.",
      "reason": "The durable contract is accepted but the current Renderer and Run Activity projection still diverge.",
      "derived_from": [
        "FACT-AUTOMATION-INTERVENTION-UX-REQUEST",
        "FACT-CURRENT-AUTOMATION-CONVERSATION-DIVERGENCE",
        "FACT-AUTOMATION-CONVERSATION-CONTRACT"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Both Chat and Automation message lists instantiate the same Conversation Surface renderer and browsing behavior.",
        "Automation-only loop, structured result, gate, ledger, evidence, and recovery capabilities remain available from the left or right panel.",
        "Structured Activity and panel tests prove full elapsed time, total gap-round count, per-gap work/result, legacy compatibility, and no Automation regression."
      ],
      "resolution": {
        "id": "GAP-IMPLEMENT-AUTOMATION-CONVERSATION-SURFACE",
        "status": "resolved",
        "outcome": "Chat and Automation now instantiate one Conversation Surface; Automation-specific events and controls are panel-owned; structured cross-Run timing and every-gap summaries are implemented and fully regression-tested.",
        "reason": "The shared module, structured projection, aggregation, panel UI, and complete test suite satisfy every evidence requirement without reducing existing Automation controls or evidence.",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/src/desktop/transcript-presentation.mjs",
          "runtime/arcorbit/src/desktop/automation-execution-summary.mjs",
          "runtime/arcorbit/src/projection/run-event-projector.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/automation-execution-summary.test.mjs",
          "runtime/arcorbit/test/token-usage-projector.test.mjs",
          "npm run check: 333 passed, 4 skipped, 0 failed",
          "npm run test:layout: 1 passed, 0 failed",
          "component-catalog.yaml parsed successfully",
          "git diff --check"
        ],
        "occurred_at": "2026-08-23T15:46:43.661Z"
      }
    },
    {
      "id": "CASE-20260823-004:review-finding:COPY-ERROR-HANDLING",
      "status": "resolved",
      "goal": "Resolve review finding: Conversation Surface code-copy awaits clipboard.writeText inside an async DOM listener without routing rejection through the existing runAction/toast boundary, regressing Chat error recovery when clipboard access fails.",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:2"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "Direct review of the shared code-copy listener against the previous Chat runAction-wrapped implementation."
      ],
      "resolution": {
        "id": "CASE-20260823-004:review-finding:COPY-ERROR-HANDLING",
        "status": "resolved",
        "outcome": "Both Conversation Surface consumers now route code-copy through runAction; success feedback occurs only after clipboard write, and rejection is handed to the shared toast boundary without an unhandled promise.",
        "reason": "The component owns the copy operation while the consumer supplies the common action boundary, preserving direct reuse and Chat recovery behavior.",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "npm run check: 334 passed, 4 skipped, 0 failed",
          "git diff --check"
        ],
        "occurred_at": "2026-08-23T15:50:52.402Z"
      }
    }
  ],
  "content_revision": 3,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "User-authorized automatic state-driven loop, 2026-08-23",
      "snapshotted_at": "2026-08-23T15:18:40.005Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
    "reviewed_content_revision": 3,
    "dimensions": {
      "implementation_correctness": "clean",
      "problem_resolution": "clean",
      "verification_credibility": "clean",
      "regression_risk": "clean",
      "minimality": "clean"
    },
    "findings": [],
    "cycles": [
      {
        "cycle": 1,
        "autonomous_cycle": 1,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 2,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "COPY-ERROR-HANDLING"
        ],
        "evidence": [
          "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/desktop/automation-execution-summary.mjs",
          "runtime/arcorbit/src/projection/run-event-projector.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/automation-execution-summary.test.mjs",
          "runtime/arcorbit/test/token-usage-projector.test.mjs",
          "npm run check: 333 passed, 4 skipped, 0 failed",
          "npm run test:layout: 1 passed, 0 failed"
        ],
        "occurred_at": "2026-08-23T15:48:34.145Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
        "reviewer": "agent",
        "outcome": "clean",
        "content_revision": 3,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/src/desktop/transcript-presentation.mjs",
          "runtime/arcorbit/src/desktop/automation-execution-summary.mjs",
          "runtime/arcorbit/src/projection/run-event-projector.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/automation-execution-summary.test.mjs",
          "runtime/arcorbit/test/token-usage-projector.test.mjs",
          "npm run check: 334 passed, 4 skipped, 0 failed",
          "npm run test:layout: 1 passed, 0 failed",
          "component-catalog.yaml parsed successfully",
          "git diff --check"
        ],
        "occurred_at": "2026-08-23T15:51:56.156Z"
      }
    ],
    "evidence": [
      "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/src/desktop/automation-execution-summary.mjs",
      "runtime/arcorbit/src/projection/run-event-projector.mjs",
      "runtime/arcorbit/test/desktop-renderer.test.mjs",
      "runtime/arcorbit/test/automation-execution-summary.test.mjs",
      "runtime/arcorbit/test/token-usage-projector.test.mjs",
      "npm run check: 333 passed, 4 skipped, 0 failed",
      "npm run test:layout: 1 passed, 0 failed",
      "runtime/arcorbit/desktop/renderer/index.html",
      "runtime/arcorbit/desktop/renderer/styles.css",
      "runtime/arcorbit/src/desktop/transcript-presentation.mjs",
      "npm run check: 334 passed, 4 skipped, 0 failed",
      "component-catalog.yaml parsed successfully",
      "git diff --check"
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
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Establish the durable Automation intervention contract and a bounded implementation gap.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The contract gap blocks a safe implementation and has the highest direct user impact in this Case.",
        "snapshot_token": "74e84e9182388307cf54aba24e222aeda196d39014d1dc7a7fd3db82b67d38d6",
        "selected_ref": "case-gap:CASE-20260823-004:GAP-ESTABLISH-AUTOMATION-INTERVENTION-CONTRACT",
        "comparison_summary": "All four Project gaps require separate Cases and are unrelated to this intervention request; the Case contract gap is ready and directly blocks implementation.",
        "fresh_discovery_summary": "Source inspection produced evidence within the selected contract gap; no separate fresh gap outranked it.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            },
            "reason": "Scenario evaluation is unrelated and requires its own Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            },
            "reason": "Runtime resilience is broader than this UI contract and requires its own Case."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            },
            "reason": "Security validation is unrelated and requires its own Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            },
            "reason": "Cross-record auditing is unrelated and requires its own Case."
          },
          {
            "ref": "case-gap:CASE-20260823-004:GAP-ESTABLISH-AUTOMATION-INTERVENTION-CONTRACT",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It establishes the exact shared-surface, panel ownership, execution-summary, and regression boundaries needed before code changes."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-ESTABLISH-AUTOMATION-INTERVENTION-CONTRACT",
        "responsibility": "agent",
        "goal": "Establish the current-state evidence and durable product, interaction, visual-applicability, and technical contract for reusing Chat in Automation intervention without losing automation capabilities.",
        "reason": "The existing Chat and Automation implementation boundaries, automation-only controls, and available run/gap summary data must be established before the implementation target and verification boundary are safe to choose.",
        "derived_from": [
          "case_intent",
          "FACT-AUTOMATION-INTERVENTION-UX-REQUEST"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "high",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Current Chat and Automation intervention UI/component/data-flow evidence.",
          "Durable product and interaction behavior covering direct shared conversation reuse, panel-owned automation capabilities, and complete execution overview.",
          "Technical boundary and visual-applicability evidence sufficient to define the implementation and regression scope."
        ]
      },
      "planned_transition": {
        "goal": "Establish the durable Automation intervention contract and a bounded implementation gap.",
        "expected_state_change": "Synchronize product, interaction, visual, and technical expectations; resolve the contract gap; open one implementation gap."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-ESTABLISH-AUTOMATION-INTERVENTION-CONTRACT",
          "status": "resolved",
          "outcome": "The existing divergence and target shared Conversation Surface, side-panel ownership, structured timing, and per-gap overview are now durably specified.",
          "reason": "Source inspection and synchronized definition artifacts establish a testable implementation boundary without reducing Automation capabilities.",
          "evidence": [
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/interaction/automation-workspace/intervention-workbench.html",
            "arckit/visual/_library/brief.md",
            "arckit/visual/_library/component-catalog.yaml",
            "arckit/tech/arcorbit/desktop-execution-solution.md",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/src/projection/run-event-projector.mjs"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-CURRENT-AUTOMATION-CONVERSATION-DIVERGENCE",
            "revision": 1,
            "status": "accepted",
            "statement": "Chat and Automation currently use separate message renderers, DOM classes, scroll-follow state, and event bindings; Run Activity exposes timestamps and round events but has no durable session-wide per-gap aggregate.",
            "basis": "Direct inspection of the shipped Renderer and Run Activity projector.",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/src/projection/run-event-projector.mjs"
            ]
          },
          {
            "id": "FACT-AUTOMATION-CONVERSATION-CONTRACT",
            "revision": 1,
            "status": "accepted",
            "statement": "Chat and Automation must render common conversation items through one Conversation Surface implementation; Automation-only loop, round, ledger, evidence, recovery, and control information belongs in side panels, whose execution overview shows full wall-clock time, total gap rounds, and each gap goal, work, and result from structured Runtime data across the task session.",
            "basis": "Explicit operator requirement plus synchronized specification, interaction, visual-applicability, and technical decisions.",
            "evidence": [
              "Current operator input, 2026-08-23",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/intervention-workbench.html",
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/component-catalog.yaml",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-AUTOMATION-INTERVENTION-PRODUCT",
            "fact_id": "FACT-AUTOMATION-CONVERSATION-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 22
            },
            "effect": "threatened",
            "reason": "The capability is accepted in product definition but is not yet realized in the shipped Renderer and structured Activity projection.",
            "gap_ids": [
              "GAP-IMPLEMENT-AUTOMATION-CONVERSATION-SURFACE"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/intervention-workbench.html",
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/component-catalog.yaml",
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ]
          },
          {
            "id": "IMPACT-AUTOMATION-INTERVENTION-REALIZATION",
            "fact_id": "FACT-AUTOMATION-CONVERSATION-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The accepted shared-surface and execution-overview facts still require implementation.",
            "gap_ids": [
              "GAP-IMPLEMENT-AUTOMATION-CONVERSATION-SURFACE"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/projection/run-event-projector.mjs"
            ]
          },
          {
            "id": "IMPACT-AUTOMATION-INTERVENTION-RISK",
            "fact_id": "FACT-CURRENT-AUTOMATION-CONVERSATION-DIVERGENCE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Direct reuse and no-regression claims need repeatable cross-surface and structured-summary tests.",
            "gap_ids": [
              "GAP-IMPLEMENT-AUTOMATION-CONVERSATION-SURFACE"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/src/projection/run-event-projector.mjs"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-AUTOMATION-INTERVENTION-EXPERIENCE",
            "fact_id": "FACT-AUTOMATION-INTERVENTION-UX-REQUEST",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 34
            },
            "effect": "threatened",
            "reason": "The synchronized interaction decision now mandates one shared Conversation Surface and side-panel execution overview, while implementation remains separate.",
            "gap_ids": [
              "GAP-IMPLEMENT-AUTOMATION-CONVERSATION-SURFACE"
            ],
            "evidence": [
              "Current operator input, 2026-08-23",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/intervention-workbench.html"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-IMPLEMENT-AUTOMATION-CONVERSATION-SURFACE",
            "status": "open",
            "goal": "Implement one shared Conversation Surface used by Chat and Automation intervention, relocate Automation-only information and controls to side panels, and add complete structured execution timing and per-gap summaries without capability regression.",
            "reason": "The durable contract is accepted but the current Renderer and Run Activity projection still diverge.",
            "derived_from": [
              "FACT-AUTOMATION-INTERVENTION-UX-REQUEST",
              "FACT-CURRENT-AUTOMATION-CONVERSATION-DIVERGENCE",
              "FACT-AUTOMATION-CONVERSATION-CONTRACT"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Both Chat and Automation message lists instantiate the same Conversation Surface renderer and browsing behavior.",
              "Automation-only loop, structured result, gate, ledger, evidence, and recovery capabilities remain available from the left or right panel.",
              "Structured Activity and panel tests prove full elapsed time, total gap-round count, per-gap work/result, legacy compatibility, and no Automation regression."
            ],
            "resolution": null
          }
        ],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [
          {
            "area_ref": "product_capabilities",
            "observed_revision": 21,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留 Setup Readiness、受监督的一待办一 thread Automation、trusted ledger transition、介入/恢复、验收反馈、Workshop 平台组合、Work 日常管理与产品反馈能力。Personal / Chat 升级为绑定本地 Product Workspace 的真实 Codex 自由对话，支持持久会话、固定 thread、流式消息、工具与审批状态、停止、失败/重启恢复、重命名和安全删除；Chat 不创建或转换 Idea、Work、Task、Case、ledger 或 Automation Run。Idea、Release、Operations 和 Engineering 继续作为 planning-only 工作空间。既有 Workshop realtime、Work、Feedback、Organization、Domain Profile、Automation human Gate 和分发边界保持不变。Work 使用弹出式多维筛选与单行无按钮列表，完整动作归于 Inspector；评论图片随时间线默认加载，点击后进入具备缩放、适配、实际大小、旋转、平移、重置和另存为的独立窗口。Feedback 使用单行列表，并默认逐项目探测 Workshop 双向会话能力，真实不可用时回退 V1。 Automation 人工介入的消息列表直接复用 Chat Conversation Surface；Automation 的 gap/round、ledger、证据、恢复和执行控制能力保持完整并归入左右面板，执行总览提供完整墙钟时间、累计 gap 轮数及逐 gap 的目标、工作和结果。",
              "reason": "The operator requires Chat-equivalent conversation quality without reducing Automation execution capability, plus a complete side-panel execution overview.",
              "evidence": [
                "Current operator input, 2026-08-23",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when shared Conversation Surface scope or Automation execution-summary semantics change."
            },
            "gap_refs": [],
            "reason": "Record the newly accepted product capability boundary.",
            "evidence": [
              "Current operator input, 2026-08-23",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 33,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持 Personal、Product Lifecycle、Organization 三组导航和既有 Work、Automation、Feedback、Organization、Setup、账户及产品反馈语义。Personal / Chat 使用会话列表、独立 transcript 和 Composer：首条非空消息才创建会话；会话固定绑定一个本地 Product Workspace 和 Codex thread；支持选择、重命名、删除、跨页面后台运行和重启恢复。消息以稳定 item 流式更新，支持 Markdown、代码复制、折叠非空 reasoning、单行工具状态、用户审批和智能自动滚动。starting、running、waiting approval 状态均可停止；interrupt 保留部分回答，继续操作会在同一 thread 启动新 turn。删除活动会话先等待 interrupt 终态，失败时不部分删除。没有可用本地工作区时允许保留草稿但禁止发送，并提供配置恢复入口。Chat 不调用 state-driven Runtime，不转换其他对象；Automation task thread、human Gate、Composer 与执行控制保持独立，但人工介入中间消息区直接复用 Chat Conversation Surface。Idea、Release、Operations 和 Engineering 继续呈现计划交互。Chat 返回页面时先用缓存会话和 transcript 立即切换，再后台刷新并显示同步或失败状态；Work 横排筛选使用弹出菜单且列表单行无按钮，评论图片自动加载且在独立窗口完成常用查看操作，单图失败不阻塞时间线；Feedback 列表单行，详情承载完整会话和动作。 Automation 左栏承载任务、项目、边界、当前选择和介入控制；右栏承载完整执行墙钟时间、累计 gap 轮数、逐 gap 目标/工作/结果，以及 Run、token、Gate、ledger、Git、证据和结构化结果。Automation 专属 loop/round/ledger 事件不进入中间对话流。",
              "reason": "The synchronized interaction source establishes direct shared conversation behavior and complete panel-owned Automation context.",
              "evidence": [
                "Current operator input, 2026-08-23",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/interaction/automation-workspace/intervention-workbench.html"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when Chat conversation behavior or Automation panel information architecture changes."
            },
            "gap_refs": [],
            "reason": "Synchronize the accepted cross-workspace interaction contract.",
            "evidence": [
              "Current operator input, 2026-08-23",
              "arckit/interaction/automation-workspace/interaction.md"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 28,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit 继续使用 repository-owned Markdown/JSON state 与 Node.js ESM ledger CLI；ArcOrbit 继续作为 Electron Desktop/Runtime host，并保留 policy-neutral Runtime Kernel、persistent one-thread-per-todo、Platform Coordinator、restricted Workshop adapters、utilityProcess Runtime、trusted in-process ledger entrypoints、project-only skill provisioning、Feedback SDK WebContents 和现代/旧版 realtime 协议边界。真实 Chat 的 accepted architecture 在 main process 增加独立 ChatCoordinator 和 kind=chat Store ownership，并从现有 Codex adapter 中抽取可复用 Conversation 层：app-server client、persistent thread start/resume、turn start/interrupt、通用事件 projector、token usage 和异步 approval provider。State-driven Runtime 只在该基础层之上保留 using-arckit、Agent Loop schema、fresh ledger snapshot、Gap Loop、Automation lease 和 closeout 语义，Chat 不复用这些语义。每个活动 Chat session 拥有与其固定项目根对应的 adapter owner；不同 Chat session 和 Automation owner 不共享活动 turn 或 lease。typed Chat IPC 只提供 snapshot/create/select/rename/delete/send/interrupt/approvalDecision；select 只持久化经 main process 验证的 Chat session 选择，不改变 draft、thread 或 session updated_at。Renderer 不能提供任意 cwd、thread id、Codex method、文件权限或 shell command。 Chat 与 Automation Renderer 共享单一 Conversation Surface 模块和 scroll-follow/event-binding 行为，消费者仅提供规范化消息、Composer policy 与回调；Automation 专属类型由左右面板消费。Run Activity 以结构化 gap_rounds 持久化 round selection/closeout/work summary，任务级执行总览跨 transcript Runs 聚合，不解析被截断的消息文本。",
              "reason": "A single rendering implementation and structured run projection are required for direct reuse and complete task-session overview.",
              "evidence": [
                "arckit/tech/arcorbit/desktop-execution-solution.md",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/src/projection/run-event-projector.mjs"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when conversation rendering ownership or Run Activity round-summary schema changes."
            },
            "gap_refs": [],
            "reason": "Record the shared rendering and structured projection boundary.",
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "area_ref": "quality_and_validation",
            "observed_revision": 6,
            "set_decision": {
              "status": "settled",
              "statement": "既有协议、Runtime、realtime、Work 和安全验证义务保持不变。真实 Chat 还必须以 adapter、Store、Coordinator、typed main/preload IPC、Renderer 和真实 app-server smoke 的跨层证据证明：首条消息幂等创建 session/thread；连续 turn resume 同一 thread；不同 Chat/Automation owner 隔离；稳定 item streaming、Markdown、reasoning/tool 投影和智能滚动正确；starting/running/waiting approval 均可 interrupt；部分输出和重启恢复不重复请求；活动删除先 interrupt 且无部分删除；审批异步并 fail closed；Renderer 无法覆盖 cwd/thread/method/command；Chat 不触发 using-arckit、ledger、Workshop mutation、Automation lease 或 human Gate。 Automation 介入还必须证明 Chat 与 Automation 使用同一 Conversation Surface 实现和一致的 Markdown、reasoning、tool、approval/error、复制、外链与智能滚动行为；结构化跨 Run 汇总必须覆盖完整墙钟时间、累计 gap 轮数、逐 gap 目标/工作/结果、进行中和旧 Activity 兼容，并回归 Gate、恢复、ledger、Git、证据和执行控制未降级。",
              "reason": "The reuse and no-regression claims require direct cross-surface and structured-summary evidence.",
              "evidence": [
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "arckit/tech/arcorbit/desktop-execution-solution.md"
              ],
              "confidence": "high",
              "resume_condition": "Revisit when Conversation Surface message types or Automation execution-summary fields change."
            },
            "gap_refs": [],
            "reason": "Extend validation to cover direct reuse and complete execution overview.",
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": {
          "current_focus": "Implement and verify Chat-shared Automation intervention conversation plus full side-panel execution overview without Automation capability regression."
        },
        "evidence": [
          "Current operator input, 2026-08-23",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/automation-workspace/intervention-workbench.html",
          "arckit/visual/_library/brief.md",
          "arckit/visual/_library/component-catalog.yaml",
          "arckit/tech/arcorbit/desktop-execution-solution.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 190,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Product behavior and acceptance meaning are synchronized in durable specifications.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Shared conversation behavior, panel ownership, state, timing, and gap-list semantics are durably recoverable.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/intervention-workbench.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "The shared Conversation Surface and execution overview reuse the existing visual language and component catalog.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-CONTRACT"
            ],
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/component-catalog.yaml"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Renderer ownership, structured gap projection, aggregation, and compatibility boundaries are documented.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-CONTRACT",
              "FACT-CURRENT-AUTOMATION-CONVERSATION-DIVERGENCE"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The accepted contract is not yet implemented in the current separate Renderer paths.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-CONTRACT",
              "FACT-CURRENT-AUTOMATION-CONVERSATION-DIVERGENCE"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/projection/run-event-projector.mjs"
            ],
            "gap_refs": [
              "GAP-IMPLEMENT-AUTOMATION-CONVERSATION-SURFACE"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Direct reuse and Automation no-regression still require repeatable implementation tests.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-CONTRACT",
              "FACT-CURRENT-AUTOMATION-CONVERSATION-DIVERGENCE"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": [
              "GAP-IMPLEMENT-AUTOMATION-CONVERSATION-SURFACE"
            ]
          }
        ]
      },
      "evidence": [
        "Current operator input, 2026-08-23",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/spec/agentic-software-development/arcorbit-planned-workspaces.md",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/intervention-workbench.html",
        "arckit/visual/_library/brief.md",
        "arckit/visual/_library/component-catalog.yaml",
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/src/projection/run-event-projector.mjs",
        "git diff --check"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-23T15:33:49.414Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Realize and verify the accepted shared conversation and Automation execution-overview contract.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The implementation gap is the only ready Case gap and directly realizes the accepted user-facing contract.",
        "snapshot_token": "3b545cc39a368e193431df8cedb835bf777e514c9970b7332df5784552a70621",
        "selected_ref": "case-gap:CASE-20260823-004:GAP-IMPLEMENT-AUTOMATION-CONVERSATION-SURFACE",
        "comparison_summary": "All four Project gaps require separate Cases and are unrelated; after the concurrent Work Case closed, this implementation gap is the only ready Case candidate.",
        "fresh_discovery_summary": "Implementation and complete regression verification found no separate defect or higher-priority fresh gap.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            },
            "reason": "Unrelated scenario evaluation requires a separate Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            },
            "reason": "Broader Runtime resilience requires a separate Case."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            },
            "reason": "Security validation requires a permission-bearing project and separate Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low",
              "user_impact": "low"
            },
            "reason": "Cross-record auditing is unrelated and requires a separate Case."
          },
          {
            "ref": "case-gap:CASE-20260823-004:GAP-IMPLEMENT-AUTOMATION-CONVERSATION-SURFACE",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the direct realization obligation and all required implementation and verification work is complete."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-IMPLEMENT-AUTOMATION-CONVERSATION-SURFACE",
        "responsibility": "agent",
        "goal": "Implement one shared Conversation Surface used by Chat and Automation intervention, relocate Automation-only information and controls to side panels, and add complete structured execution timing and per-gap summaries without capability regression.",
        "reason": "The durable contract is accepted but the current Renderer and Run Activity projection still diverge.",
        "derived_from": [
          "FACT-AUTOMATION-INTERVENTION-UX-REQUEST",
          "FACT-CURRENT-AUTOMATION-CONVERSATION-DIVERGENCE",
          "FACT-AUTOMATION-CONVERSATION-CONTRACT"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Both Chat and Automation message lists instantiate the same Conversation Surface renderer and browsing behavior.",
          "Automation-only loop, structured result, gate, ledger, evidence, and recovery capabilities remain available from the left or right panel.",
          "Structured Activity and panel tests prove full elapsed time, total gap-round count, per-gap work/result, legacy compatibility, and no Automation regression."
        ]
      },
      "planned_transition": {
        "goal": "Realize and verify the accepted shared conversation and Automation execution-overview contract.",
        "expected_state_change": "Resolve the implementation gap, accept direct realization evidence, uphold all four threatened impacts, and enter completion review."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-IMPLEMENT-AUTOMATION-CONVERSATION-SURFACE",
          "status": "resolved",
          "outcome": "Chat and Automation now instantiate one Conversation Surface; Automation-specific events and controls are panel-owned; structured cross-Run timing and every-gap summaries are implemented and fully regression-tested.",
          "reason": "The shared module, structured projection, aggregation, panel UI, and complete test suite satisfy every evidence requirement without reducing existing Automation controls or evidence.",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/src/desktop/transcript-presentation.mjs",
            "runtime/arcorbit/src/desktop/automation-execution-summary.mjs",
            "runtime/arcorbit/src/projection/run-event-projector.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/automation-execution-summary.test.mjs",
            "runtime/arcorbit/test/token-usage-projector.test.mjs",
            "npm run check: 333 passed, 4 skipped, 0 failed",
            "npm run test:layout: 1 passed, 0 failed",
            "component-catalog.yaml parsed successfully",
            "git diff --check"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-AUTOMATION-CONVERSATION-SURFACE-IMPLEMENTED",
            "revision": 1,
            "status": "accepted",
            "statement": "The shipped Renderer now creates the Chat and Automation message lists from one Conversation Surface module with shared Markdown, code-copy, link, approval, and scroll-follow behavior; Automation-only loop and structured messages render in the right panel, controls and mode are panel-owned, Run Activity retains uncapped structured gap_rounds, and the task-session overview aggregates complete elapsed time, Run count, gap-round count, and each gap goal, work summary, and outcome across Runs with legacy fallback.",
            "basis": "Direct implementation inspection plus complete Runtime and Electron layout regression results.",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/src/desktop/transcript-presentation.mjs",
              "runtime/arcorbit/src/desktop/automation-execution-summary.mjs",
              "runtime/arcorbit/src/projection/run-event-projector.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/automation-execution-summary.test.mjs",
              "runtime/arcorbit/test/token-usage-projector.test.mjs",
              "npm run check: 333 passed, 4 skipped, 0 failed",
              "npm run test:layout: 1 passed, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-AUTOMATION-INTERVENTION-EXPERIENCE",
            "fact_id": "FACT-AUTOMATION-INTERVENTION-UX-REQUEST",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 34
            },
            "effect": "upheld",
            "reason": "Both workspaces now instantiate the same Conversation Surface and Automation information and controls are placed in the side panels.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ]
          },
          {
            "id": "IMPACT-AUTOMATION-INTERVENTION-PRODUCT",
            "fact_id": "FACT-AUTOMATION-CONVERSATION-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 22
            },
            "effect": "upheld",
            "reason": "The complete execution overview and existing Automation gate, ledger, recovery, Git, token, evidence, and intervention capabilities are present.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/desktop/automation-execution-summary.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/automation-execution-summary.test.mjs"
            ]
          },
          {
            "id": "IMPACT-AUTOMATION-INTERVENTION-REALIZATION",
            "fact_id": "FACT-AUTOMATION-CONVERSATION-CONTRACT",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Direct code and DOM evidence realizes the accepted shared-surface, panel, timing, and gap-overview contract.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/src/desktop/transcript-presentation.mjs",
              "runtime/arcorbit/src/desktop/automation-execution-summary.mjs",
              "runtime/arcorbit/src/projection/run-event-projector.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/automation-execution-summary.test.mjs",
              "runtime/arcorbit/test/token-usage-projector.test.mjs"
            ]
          },
          {
            "id": "IMPACT-AUTOMATION-INTERVENTION-RISK",
            "fact_id": "FACT-CURRENT-AUTOMATION-CONVERSATION-DIVERGENCE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Unit, Renderer contract, full Runtime, and Electron layout regressions credibly cover shared reuse, structured summaries, legacy fallback, and Automation no-regression.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/automation-execution-summary.test.mjs",
              "runtime/arcorbit/test/token-usage-projector.test.mjs",
              "npm run check: 333 passed, 4 skipped, 0 failed",
              "npm run test:layout: 1 passed, 0 failed"
            ]
          }
        ],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/src/desktop/transcript-presentation.mjs",
          "runtime/arcorbit/src/desktop/automation-execution-summary.mjs",
          "runtime/arcorbit/src/projection/run-event-projector.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/automation-execution-summary.test.mjs",
          "runtime/arcorbit/test/token-usage-projector.test.mjs"
        ]
      },
      "invariant_assessment": {
        "project_revision": 192,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The implemented capability matches the synchronized product contract.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-CONTRACT",
              "FACT-AUTOMATION-CONVERSATION-SURFACE-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The shared message behavior and side-panel information architecture match the durable interaction source.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-CONTRACT",
              "FACT-AUTOMATION-CONVERSATION-SURFACE-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "runtime/arcorbit/desktop/renderer/index.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "Both consumers share the same conversation classes and the execution overview uses the accepted component language.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-CONTRACT",
              "FACT-AUTOMATION-CONVERSATION-SURFACE-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/visual/_library/component-catalog.yaml",
              "runtime/arcorbit/desktop/renderer/styles.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Shared rendering ownership and structured uncapped gap projection directly realize the technical solution.",
            "fact_refs": [
              "FACT-CURRENT-AUTOMATION-CONVERSATION-DIVERGENCE",
              "FACT-AUTOMATION-CONVERSATION-CONTRACT",
              "FACT-AUTOMATION-CONVERSATION-SURFACE-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "runtime/arcorbit/src/projection/run-event-projector.mjs",
              "runtime/arcorbit/src/desktop/automation-execution-summary.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Direct implementation and regression evidence realizes all materially relevant accepted facts.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-CONTRACT",
              "FACT-AUTOMATION-CONVERSATION-SURFACE-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/src/desktop/transcript-presentation.mjs",
              "runtime/arcorbit/src/desktop/automation-execution-summary.mjs",
              "runtime/arcorbit/src/projection/run-event-projector.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/automation-execution-summary.test.mjs",
              "runtime/arcorbit/test/token-usage-projector.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Complete Runtime, targeted projection, Renderer contract, and Electron layout tests cover the material regression claims.",
            "fact_refs": [
              "FACT-CURRENT-AUTOMATION-CONVERSATION-DIVERGENCE",
              "FACT-AUTOMATION-CONVERSATION-SURFACE-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/automation-execution-summary.test.mjs",
              "runtime/arcorbit/test/token-usage-projector.test.mjs",
              "npm run check: 333 passed, 4 skipped, 0 failed",
              "npm run test:layout: 1 passed, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/src/desktop/transcript-presentation.mjs",
        "runtime/arcorbit/src/desktop/automation-execution-summary.mjs",
        "runtime/arcorbit/src/projection/run-event-projector.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/automation-execution-summary.test.mjs",
        "runtime/arcorbit/test/token-usage-projector.test.mjs",
        "npm run check: 333 passed, 4 skipped, 0 failed",
        "npm run test:layout: 1 passed, 0 failed",
        "component-catalog.yaml parsed successfully",
        "git diff --check"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-23T15:46:43.661Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Independently review content revision 2 without repairing findings in the same round.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Completion review is the only ready Case obligation after all ordinary gaps and impacts closed.",
        "snapshot_token": "7116e88c11a282d6dac7a02d7b0384e2f7c5c80577355fc9b63d103487879ea6",
        "selected_ref": "case-gap:CASE-20260823-004:CASE-20260823-004:completion-review:1",
        "comparison_summary": "All four Project gaps require separate Cases; the Case completion review is the only ready and blocking candidate.",
        "fresh_discovery_summary": "Review inspection found one error-path regression, which is recorded as a review finding rather than a same-round fresh implementation gap.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low"
            },
            "reason": "Unrelated and requires a separate Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low"
            },
            "reason": "Broader Runtime work requires a separate Case."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low"
            },
            "reason": "Requires a separate permission-bearing Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low"
            },
            "reason": "Unrelated and requires a separate Case."
          },
          {
            "ref": "case-gap:CASE-20260823-004:CASE-20260823-004:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Independent review is required before the Case can resolve."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260823-004:completion-review:1",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:2"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "review evidence for all five completion dimensions"
        ]
      },
      "planned_transition": {
        "goal": "Independently review content revision 2 without repairing findings in the same round.",
        "expected_state_change": "Record one clipboard error-handling finding and open its ordinary repair gap."
      },
      "accepted_state_delta": {
        "resolved_gap": null,
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "review_budget_extension": null,
        "completion_review_result": {
          "outcome": "findings",
          "reviewer": "agent",
          "reviewed_content_revision": 2,
          "dimensions": {
            "implementation_correctness": "findings",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "COPY-ERROR-HANDLING",
              "kind": "error",
              "statement": "Conversation Surface code-copy awaits clipboard.writeText inside an async DOM listener without routing rejection through the existing runAction/toast boundary, regressing Chat error recovery when clipboard access fails.",
              "responsibility": "agent",
              "artifact_refs": [
                "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
                "runtime/arcorbit/desktop/renderer/renderer.js"
              ],
              "evidence": [
                "Direct review of the shared code-copy listener against the previous Chat runAction-wrapped implementation.",
                "runtime/arcorbit/desktop/renderer/conversation-surface.mjs"
              ]
            }
          ],
          "evidence": [
            "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/src/desktop/automation-execution-summary.mjs",
            "runtime/arcorbit/src/projection/run-event-projector.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/automation-execution-summary.test.mjs",
            "runtime/arcorbit/test/token-usage-projector.test.mjs",
            "npm run check: 333 passed, 4 skipped, 0 failed",
            "npm run test:layout: 1 passed, 0 failed"
          ]
        }
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "runtime/arcorbit/desktop/renderer/conversation-surface.mjs"
        ]
      },
      "invariant_assessment": {
        "project_revision": 192,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The product contract remains accurate and recoverable.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-CONTRACT"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The interaction source remains complete; the finding concerns implementation error recovery.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-CONTRACT"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "No visual-language inconsistency was found.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-SURFACE-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/styles.css",
              "npm run test:layout: 1 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The shared renderer and structured projection boundaries remain coherent.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-SURFACE-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "runtime/arcorbit/src/projection/run-event-projector.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The common copy capability lacks the accepted recoverable error boundary.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-SURFACE-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs"
            ],
            "gap_refs": [
              "CASE-20260823-004:review-finding:COPY-ERROR-HANDLING"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Clipboard failure behavior needs a repeatable rejection-path test.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-SURFACE-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs"
            ],
            "gap_refs": [
              "CASE-20260823-004:review-finding:COPY-ERROR-HANDLING"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/desktop/automation-execution-summary.mjs",
        "runtime/arcorbit/src/projection/run-event-projector.mjs",
        "npm run check: 333 passed, 4 skipped, 0 failed",
        "npm run test:layout: 1 passed, 0 failed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-23T15:48:34.145Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Restore the shared code-copy error boundary and add rejection-path evidence.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The review finding is the only ready Case gap and blocks a clean completion review.",
        "snapshot_token": "9aed32a3dbc4f50b18d6826050c06915b8f0ceb9142d5532ee0d1c8070a0eb5c",
        "selected_ref": "case-gap:CASE-20260823-004:CASE-20260823-004:review-finding:COPY-ERROR-HANDLING",
        "comparison_summary": "All four Project gaps require separate Cases; the clipboard recovery finding is the only ready Case candidate.",
        "fresh_discovery_summary": "The bounded repair and its rejection/success tests exposed no separate fresh gap.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low"
            },
            "reason": "Unrelated and requires a separate Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low"
            },
            "reason": "Broader Runtime work requires a separate Case."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low"
            },
            "reason": "Requires a separate permission-bearing Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low"
            },
            "reason": "Unrelated and requires a separate Case."
          },
          {
            "ref": "case-gap:CASE-20260823-004:CASE-20260823-004:review-finding:COPY-ERROR-HANDLING",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "risk": "high"
            },
            "reason": "The shared copy action now has a complete implementation and repeatable error-path evidence."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260823-004:review-finding:COPY-ERROR-HANDLING",
        "responsibility": "agent",
        "goal": "Resolve review finding: Conversation Surface code-copy awaits clipboard.writeText inside an async DOM listener without routing rejection through the existing runAction/toast boundary, regressing Chat error recovery when clipboard access fails.",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:2"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "Direct review of the shared code-copy listener against the previous Chat runAction-wrapped implementation."
        ]
      },
      "planned_transition": {
        "goal": "Restore the shared code-copy error boundary and add rejection-path evidence.",
        "expected_state_change": "Resolve the review finding, accept the repaired behavior, and reopen completion review for content revision 3."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260823-004:review-finding:COPY-ERROR-HANDLING",
          "status": "resolved",
          "outcome": "Both Conversation Surface consumers now route code-copy through runAction; success feedback occurs only after clipboard write, and rejection is handed to the shared toast boundary without an unhandled promise.",
          "reason": "The component owns the copy operation while the consumer supplies the common action boundary, preserving direct reuse and Chat recovery behavior.",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "npm run check: 334 passed, 4 skipped, 0 failed",
            "git diff --check"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-AUTOMATION-CONVERSATION-COPY-RECOVERY",
            "revision": 1,
            "status": "accepted",
            "statement": "Conversation Surface code-copy is executed through the same consumer-supplied runAction boundary for Chat and Automation; clipboard rejection keeps the button unchanged and reaches toast handling, while success updates and resets the shared button state.",
            "basis": "Direct code inspection and explicit rejected/successful clipboard unit paths.",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [
          "COPY-ERROR-HANDLING"
        ],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs"
        ]
      },
      "invariant_assessment": {
        "project_revision": 192,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Product behavior remains accurate and implemented.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-CONTRACT",
              "FACT-AUTOMATION-CONVERSATION-COPY-RECOVERY"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The shared copy and error-recovery behavior now matches the accepted interaction contract.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-CONTRACT",
              "FACT-AUTOMATION-CONVERSATION-COPY-RECOVERY"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "The repair changes no visual contract and preserves shared button feedback.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-COPY-RECOVERY"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "runtime/arcorbit/desktop/renderer/styles.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The consumer-supplied action boundary preserves single-component rendering with app-owned recovery.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-SURFACE-IMPLEMENTED",
              "FACT-AUTOMATION-CONVERSATION-COPY-RECOVERY"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Direct code and tests realize the copy success and rejection contract.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-COPY-RECOVERY"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Explicit rejection and success tests plus the full suite control the clipboard regression risk.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-COPY-RECOVERY"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "npm run check: 334 passed, 4 skipped, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "npm run check: 334 passed, 4 skipped, 0 failed",
        "git diff --check"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-23T15:50:52.402Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Independently review repaired content revision 3 across all five completion dimensions.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The second completion review is the only ready Case obligation after the review finding was repaired.",
        "snapshot_token": "ef3bcbcd31906ac5bb34d5473853d731c7baab7fd4787d46875232179ae831b9",
        "selected_ref": "case-gap:CASE-20260823-004:CASE-20260823-004:completion-review:2",
        "comparison_summary": "All four Project gaps require separate Cases; completion review of content revision 3 is the sole ready candidate.",
        "fresh_discovery_summary": "Independent re-review of the repair and the complete implementation found no new error, omission, or excess.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low"
            },
            "reason": "Unrelated and requires a separate Case."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low"
            },
            "reason": "Broader Runtime work requires a separate Case."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low"
            },
            "reason": "Requires a separate permission-bearing Case."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "low"
            },
            "reason": "Unrelated and requires a separate Case."
          },
          {
            "ref": "case-gap:CASE-20260823-004:CASE-20260823-004:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "A clean review is the final Case obligation."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260823-004:completion-review:2",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:3"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "review evidence for all five completion dimensions"
        ]
      },
      "planned_transition": {
        "goal": "Independently review repaired content revision 3 across all five completion dimensions.",
        "expected_state_change": "Accept a clean completion review and close the resolved Case."
      },
      "accepted_state_delta": {
        "resolved_gap": null,
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "review_budget_extension": null,
        "completion_review_result": {
          "outcome": "clean",
          "reviewer": "agent",
          "reviewed_content_revision": 3,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "runtime/arcorbit/src/desktop/transcript-presentation.mjs",
            "runtime/arcorbit/src/desktop/automation-execution-summary.mjs",
            "runtime/arcorbit/src/projection/run-event-projector.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/test/automation-execution-summary.test.mjs",
            "runtime/arcorbit/test/token-usage-projector.test.mjs",
            "npm run check: 334 passed, 4 skipped, 0 failed",
            "npm run test:layout: 1 passed, 0 failed",
            "component-catalog.yaml parsed successfully",
            "git diff --check"
          ]
        }
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "runtime/arcorbit/src/desktop/transcript-presentation.mjs",
          "runtime/arcorbit/src/desktop/automation-execution-summary.mjs",
          "runtime/arcorbit/src/projection/run-event-projector.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/test/automation-execution-summary.test.mjs",
          "runtime/arcorbit/test/token-usage-projector.test.mjs",
          "npm run check: 334 passed, 4 skipped, 0 failed",
          "npm run test:layout: 1 passed, 0 failed",
          "component-catalog.yaml parsed successfully",
          "git diff --check"
        ]
      },
      "invariant_assessment": {
        "project_revision": 192,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Product requirements and the shipped capability are aligned.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-CONTRACT",
              "FACT-AUTOMATION-CONVERSATION-SURFACE-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Shared conversation behavior, panel ownership, timing, gap detail, and recovery are coherent.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-CONTRACT",
              "FACT-AUTOMATION-CONVERSATION-SURFACE-IMPLEMENTED",
              "FACT-AUTOMATION-CONVERSATION-COPY-RECOVERY"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "runtime/arcorbit/desktop/renderer/index.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "The shared surface and execution overview use the accepted visual system and pass layout validation.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-SURFACE-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/visual/_library/component-catalog.yaml",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "npm run test:layout: 1 passed, 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Single renderer ownership, panel-only Automation projection, uncapped gap_rounds, and cross-Run aggregation are direct and bounded.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-SURFACE-IMPLEMENTED",
              "FACT-AUTOMATION-CONVERSATION-COPY-RECOVERY"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "runtime/arcorbit/src/projection/run-event-projector.mjs",
              "runtime/arcorbit/src/desktop/automation-execution-summary.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Direct code and test evidence realizes every accepted Case fact, including clipboard recovery.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-SURFACE-IMPLEMENTED",
              "FACT-AUTOMATION-CONVERSATION-COPY-RECOVERY"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/src/desktop/transcript-presentation.mjs",
              "runtime/arcorbit/src/desktop/automation-execution-summary.mjs",
              "runtime/arcorbit/src/projection/run-event-projector.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/automation-execution-summary.test.mjs",
              "runtime/arcorbit/test/token-usage-projector.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Full and targeted regression evidence covers shared behavior, summary completeness, legacy fallback, control retention, layout, and error recovery.",
            "fact_refs": [
              "FACT-AUTOMATION-CONVERSATION-SURFACE-IMPLEMENTED",
              "FACT-AUTOMATION-CONVERSATION-COPY-RECOVERY"
            ],
            "evidence": [
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "runtime/arcorbit/test/automation-execution-summary.test.mjs",
              "runtime/arcorbit/test/token-usage-projector.test.mjs",
              "npm run check: 334 passed, 4 skipped, 0 failed",
              "npm run test:layout: 1 passed, 0 failed",
              "component-catalog.yaml parsed successfully",
              "git diff --check"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/conversation-surface.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/src/desktop/transcript-presentation.mjs",
        "runtime/arcorbit/src/desktop/automation-execution-summary.mjs",
        "runtime/arcorbit/src/projection/run-event-projector.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "runtime/arcorbit/test/automation-execution-summary.test.mjs",
        "runtime/arcorbit/test/token-usage-projector.test.mjs",
        "npm run check: 334 passed, 4 skipped, 0 failed",
        "npm run test:layout: 1 passed, 0 failed",
        "component-catalog.yaml parsed successfully",
        "git diff --check"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-23T15:51:56.156Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-ESTABLISH-AUTOMATION-INTERVENTION-CONTRACT",
      "GAP-IMPLEMENT-AUTOMATION-CONVERSATION-SURFACE",
      "CASE-20260823-004:review-finding:COPY-ERROR-HANDLING"
    ],
    "remaining": [],
    "blocked": [],
    "reason": "All dynamic gaps and state impacts are closed and the current implementation passed completion review.",
    "candidate_gaps": [],
    "loop_handoff": {
      "version": "loop-handoff/v2",
      "status": "done",
      "next_responsibility": "none",
      "agent_continuation_available": false,
      "human_decision_required": false,
      "trigger_mode": "none",
      "responsibility_reason": "The current Case revision passed completion review.",
      "next_prompt": "",
      "human_gate": {
        "required": false,
        "reason": "",
        "decision_needed": ""
      }
    },
    "updated_at": "2026-08-23T15:51:56.156Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
