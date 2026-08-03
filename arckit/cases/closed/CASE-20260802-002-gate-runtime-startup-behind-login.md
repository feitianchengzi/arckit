# Gate Runtime Startup Behind Login

Case: CASE-20260802-002
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-02T09:58:28.604Z

## User Intent

未登录时，Runtime Desktop 启动后先展示登录页面；登录成功后进入 Automation Command Center。

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260802-002",
  "title": "Gate Runtime Startup Behind Login",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-02T09:41:52.701Z",
  "updated_at": "2026-08-02T09:58:28.604Z",
  "user_intent": "未登录时，Runtime Desktop 启动后先展示登录页面；登录成功后进入 Automation Command Center。",
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
      "reason": "The product specification now requires startup authentication recovery, a standalone non-dismissible Login for logged-out sessions, direct Command Center entry for authenticated sessions, and return to Login after logout; Runtime implements the same behavior.",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
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
      "reason": "A dedicated Login interaction source and four-state gray wireframe define session restore, logged-out input, verification feedback, failure recovery, and the no-close/no-skip boundary; the Automation Workspace account subview now only owns authenticated and expired-session states, matching Runtime routing.",
      "evidence": [
        "arckit/interaction/login/interaction.md",
        "arckit/interaction/login/default.html",
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/authentication.html",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
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
      "reason": "The request changes startup navigation and disclosure, not the established visual direction, tokens, theme, or component language; the Login gate reuses the existing AccountPanel, brand mark, controls, and Runtime Desktop palette.",
      "evidence": [
        "runtime/arckit-runtime/desktop/renderer/index.html",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "arckit/visual/_library/component-catalog.yaml"
      ],
      "next_transition": ""
    },
    "technical_expectation": {
      "applicability": "not_required",
      "maturity": "unknown",
      "target_maturity": "unknown",
      "alignment": "unknown",
      "target_alignment": "unknown",
      "resolution": "resolved",
      "reason": "The existing main-process Workshop authentication service and bounded IPC remain unchanged; this adjustment is a renderer routing and presentation change with no new API, persistence, data model, security boundary, or architectural decision.",
      "evidence": [
        "runtime/arckit-runtime/desktop/main.mjs",
        "runtime/arckit-runtime/desktop/preload.cjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
      ],
      "next_transition": ""
    },
    "implementation_state": {
      "applicability": "required",
      "maturity": "confirmed",
      "target_maturity": "confirmed",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "Renderer startup keeps the workspace hidden until authentication is known, projects logged-out status as an opaque Login gate, prevents close, Escape, and overlay-click bypass, releases the gate after login, and restores it after logout.",
      "evidence": [
        "runtime/arckit-runtime/desktop/renderer/index.html",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css"
      ],
      "next_transition": ""
    },
    "verification_state": {
      "applicability": "required",
      "maturity": "confirmed",
      "target_maturity": "confirmed",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "The complete Runtime check passes 67 tests with one explicitly opt-in Electron geometry test skipped; renderer regression assertions cover startup hiding, logged-out routing, non-dismissible gate behavior, forced close after authentication, logout routing, and gate styling. Interaction wireframes have complete state structures, shared classes, and no embedded color or script.",
      "evidence": [
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "runtime/arckit-runtime/package.json",
        "arckit/interaction/login/default.html",
        "arckit/interaction/automation-workspace/authentication.html"
      ],
      "next_transition": ""
    }
  },
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-08-02T09:41:52.701Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
    "reviewed_content_revision": 2,
    "dimensions": {
      "correctness": "clean",
      "completeness": "clean",
      "minimality": "clean"
    },
    "findings": [
      {
        "id": "REVIEW-20260802-002-login-recovery-surface",
        "kind": "omission",
        "statement": "The renderer hides the workspace during initial authentication but projects only a blank background until status resolves, and the full-page Login surface retains dialog semantics; this diverges from the defined visible session-restoration state and standalone-page boundary.",
        "responsibility": "agent",
        "affected_facets": [
          "interaction_expectation",
          "implementation_state",
          "verification_state"
        ],
        "artifact_refs": [
          "runtime/arckit-runtime/desktop/renderer/index.html",
          "runtime/arckit-runtime/desktop/renderer/styles.css",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "arckit/interaction/login/interaction.md"
        ],
        "evidence": [
          "runtime/arckit-runtime/desktop/renderer/index.html",
          "runtime/arckit-runtime/desktop/renderer/styles.css",
          "arckit/interaction/login/interaction.md"
        ],
        "status": "resolved",
        "resolution_reason": "A dedicated status surface now displays product identity, recovery copy, and progress before authentication resolves; the shared account surface removes dialog and aria-modal semantics in Login mode and restores them only for authenticated settings.",
        "resolution_evidence": [
          "runtime/arckit-runtime/desktop/renderer/index.html",
          "runtime/arckit-runtime/desktop/renderer/styles.css",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/test/desktop-renderer.test.mjs"
        ],
        "discovered_in_cycle": 1
      }
    ],
    "cycles": [
      {
        "cycle": 1,
        "autonomous_cycle": 1,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 1,
        "dimensions": {
          "correctness": "findings",
          "completeness": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "REVIEW-20260802-002-login-recovery-surface"
        ],
        "evidence": [
          "runtime/arckit-runtime/desktop/renderer/index.html",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/desktop/renderer/styles.css",
          "arckit/interaction/login/interaction.md"
        ],
        "occurred_at": "2026-08-02T09:55:05.371Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
        "reviewer": "agent",
        "outcome": "clean",
        "content_revision": 2,
        "dimensions": {
          "correctness": "clean",
          "completeness": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/interaction/login/interaction.md",
          "arckit/interaction/login/default.html",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/interaction/automation-workspace/authentication.html",
          "runtime/arckit-runtime/desktop/renderer/index.html",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/desktop/renderer/styles.css",
          "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
          "runtime/arckit-runtime/package.json"
        ],
        "occurred_at": "2026-08-02T09:58:28.604Z"
      }
    ],
    "evidence": [
      "runtime/arckit-runtime/desktop/renderer/index.html",
      "runtime/arckit-runtime/desktop/renderer/renderer.js",
      "runtime/arckit-runtime/desktop/renderer/styles.css",
      "arckit/interaction/login/interaction.md",
      "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
      "arckit/interaction/login/default.html",
      "arckit/interaction/automation-workspace/interaction.md",
      "arckit/interaction/automation-workspace/authentication.html",
      "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
      "runtime/arckit-runtime/package.json"
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
      "goal": "Formalize and implement an unskippable startup Login gate while preserving authenticated and expired-session routes.",
      "outcome": "completed",
      "planned_transition": "Product and interaction facts become formalized and aligned; implementation and verification become confirmed; visual and technical expectations are resolved as not requiring new stable artifacts.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "product_expectation",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "The product specification now requires startup authentication recovery, a standalone non-dismissible Login for logged-out sessions, direct Command Center entry for authenticated sessions, and return to Login after logout; Runtime implements the same behavior.",
              "next_transition": ""
            },
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "runtime/arckit-runtime/desktop/renderer/renderer.js"
            ]
          },
          {
            "facet": "interaction_expectation",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "A dedicated Login interaction source and four-state gray wireframe define session restore, logged-out input, verification feedback, failure recovery, and the no-close/no-skip boundary; the Automation Workspace account subview now only owns authenticated and expired-session states, matching Runtime routing.",
              "next_transition": ""
            },
            "evidence": [
              "arckit/interaction/login/interaction.md",
              "arckit/interaction/login/default.html",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/authentication.html",
              "runtime/arckit-runtime/desktop/renderer/renderer.js"
            ]
          },
          {
            "facet": "visual_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "The request changes startup navigation and disclosure, not the established visual direction, tokens, theme, or component language; the Login gate reuses the existing AccountPanel, brand mark, controls, and Runtime Desktop palette.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/desktop/renderer/index.html",
              "runtime/arckit-runtime/desktop/renderer/styles.css",
              "arckit/visual/_library/component-catalog.yaml"
            ]
          },
          {
            "facet": "technical_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "The existing main-process Workshop authentication service and bounded IPC remain unchanged; this adjustment is a renderer routing and presentation change with no new API, persistence, data model, security boundary, or architectural decision.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/desktop/main.mjs",
              "runtime/arckit-runtime/desktop/preload.cjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js"
            ]
          },
          {
            "facet": "implementation_state",
            "set": {
              "applicability": "required",
              "maturity": "confirmed",
              "target_maturity": "confirmed",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "Renderer startup keeps the workspace hidden until authentication is known, projects logged-out status as an opaque Login gate, prevents close, Escape, and overlay-click bypass, releases the gate after login, and restores it after logout.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/desktop/renderer/index.html",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/desktop/renderer/styles.css"
            ]
          },
          {
            "facet": "verification_state",
            "set": {
              "applicability": "required",
              "maturity": "confirmed",
              "target_maturity": "confirmed",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "The complete Runtime check passes 67 tests with one explicitly opt-in Electron geometry test skipped; renderer regression assertions cover startup hiding, logged-out routing, non-dismissible gate behavior, forced close after authentication, logout routing, and gate styling. Interaction wireframes have complete state structures, shared classes, and no embedded color or script.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
              "runtime/arckit-runtime/package.json",
              "arckit/interaction/login/default.html",
              "arckit/interaction/automation-workspace/authentication.html"
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
        "arckit/interaction/login/interaction.md",
        "arckit/interaction/login/default.html",
        "runtime/arckit-runtime/desktop/renderer/index.html",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T09:54:17.715Z"
    },
    {
      "round": 2,
      "goal": "Review content revision 1 for correctness, completeness, and minimality.",
      "outcome": "partial",
      "planned_transition": "Record the startup-recovery projection and page-semantics omission for repair.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "review_budget_extension": null,
        "completion_review_result": {
          "outcome": "findings",
          "reviewer": "agent",
          "reviewed_content_revision": 1,
          "dimensions": {
            "correctness": "findings",
            "completeness": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "REVIEW-20260802-002-login-recovery-surface",
              "kind": "omission",
              "statement": "The renderer hides the workspace during initial authentication but projects only a blank background until status resolves, and the full-page Login surface retains dialog semantics; this diverges from the defined visible session-restoration state and standalone-page boundary.",
              "responsibility": "agent",
              "affected_facets": [
                "interaction_expectation",
                "implementation_state",
                "verification_state"
              ],
              "artifact_refs": [
                "runtime/arckit-runtime/desktop/renderer/index.html",
                "runtime/arckit-runtime/desktop/renderer/styles.css",
                "runtime/arckit-runtime/desktop/renderer/renderer.js",
                "arckit/interaction/login/interaction.md"
              ],
              "evidence": [
                "runtime/arckit-runtime/desktop/renderer/index.html",
                "runtime/arckit-runtime/desktop/renderer/styles.css",
                "arckit/interaction/login/interaction.md"
              ]
            }
          ],
          "evidence": [
            "runtime/arckit-runtime/desktop/renderer/index.html",
            "runtime/arckit-runtime/desktop/renderer/renderer.js",
            "runtime/arckit-runtime/desktop/renderer/styles.css",
            "arckit/interaction/login/interaction.md"
          ]
        }
      },
      "evidence": [
        "runtime/arckit-runtime/desktop/renderer/index.html",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "arckit/interaction/login/interaction.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T09:55:05.371Z"
    },
    {
      "round": 3,
      "goal": "Repair the visible session-restoration projection and standalone Login semantics.",
      "outcome": "completed",
      "planned_transition": "Resolve the review finding and return the Case to review-ready on a new content revision.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [
          {
            "id": "REVIEW-20260802-002-login-recovery-surface",
            "resolution": "resolved",
            "reason": "A dedicated status surface now displays product identity, recovery copy, and progress before authentication resolves; the shared account surface removes dialog and aria-modal semantics in Login mode and restores them only for authenticated settings.",
            "evidence": [
              "runtime/arckit-runtime/desktop/renderer/index.html",
              "runtime/arckit-runtime/desktop/renderer/styles.css",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs"
            ]
          }
        ],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/desktop/renderer/index.html",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T09:57:06.487Z"
    },
    {
      "round": 4,
      "goal": "Review repaired content revision 2 for correctness, completeness, and minimality.",
      "outcome": "completed",
      "planned_transition": "Record a clean three-dimensional review and resolve the Case.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "review_budget_extension": null,
        "completion_review_result": {
          "outcome": "clean",
          "reviewer": "agent",
          "reviewed_content_revision": 2,
          "dimensions": {
            "correctness": "clean",
            "completeness": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/interaction/login/interaction.md",
            "arckit/interaction/login/default.html",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/interaction/automation-workspace/authentication.html",
            "runtime/arckit-runtime/desktop/renderer/index.html",
            "runtime/arckit-runtime/desktop/renderer/renderer.js",
            "runtime/arckit-runtime/desktop/renderer/styles.css",
            "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
            "runtime/arckit-runtime/package.json"
          ]
        }
      },
      "evidence": [
        "runtime/arckit-runtime/package.json",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "arckit/interaction/login/default.html",
        "arckit/interaction/automation-workspace/authentication.html",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T09:58:28.604Z"
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
          "case:CASE-20260802-002"
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
    "updated_at": "2026-08-02T09:58:28.604Z"
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
