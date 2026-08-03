# Add Runtime Login and Workshop Todo Synchronization

Case: CASE-20260802-001
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-02T09:23:46.203Z

## User Intent

参考 ../../hoewo/workshop-desktop 的现有实现调研并为 Arckit Runtime Desktop 增加登录能力，以及与和通待办服务器同步当前用户项目和待办的能力。

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260802-001",
  "title": "Add Runtime Login and Workshop Todo Synchronization",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-02T08:44:14.173Z",
  "updated_at": "2026-08-02T09:23:46.203Z",
  "user_intent": "参考 ../../hoewo/workshop-desktop 的现有实现调研并为 Arckit Runtime Desktop 增加登录能力，以及与和通待办服务器同步当前用户项目和待办的能力。",
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
      "reason": "Runtime Desktop now supports Workshop verification-code login, renewable account sessions, immediate current-user project/task synchronization, expired-session read-only behavior, and confirmed logout cleanup.",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "runtime/arckit-runtime/src/task-source-adapter.mjs",
        "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
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
      "reason": "The settings overlay implements logged-out, verification cooldown, authenticated, refreshing, expired, error, and confirmed active-task logout paths while returning successful login to the synchronized Command Center.",
      "evidence": [
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/authentication.html",
        "runtime/arckit-runtime/desktop/renderer/index.html",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
      ],
      "next_transition": ""
    },
    "visual_expectation": {
      "applicability": "required",
      "maturity": "formalized",
      "target_maturity": "formalized",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "The account panel reuses the established Runtime Desktop tokens and provides distinct logged-out, authenticated, refreshing, expired, feedback, and advanced-settings treatments.",
      "evidence": [
        "arckit/visual/_library/brief.md",
        "arckit/visual/_library/component-catalog.yaml",
        "arckit/visual/_library/style-preview.html",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "runtime/arckit-runtime/desktop/renderer/index.html"
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
      "reason": "A long-lived main-process Workshop service now owns private credentials, endpoint normalization, single-flight refresh, one-time 401 retry, bounded fan-out, session-generation race protection, coordinator cleanup, and bounded authentication IPC.",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "runtime/arckit-runtime/src/task-source-adapter.mjs",
        "runtime/arckit-runtime/desktop/main.mjs",
        "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/desktop/preload.cjs"
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
      "reason": "The authenticated Workshop service, private store migration, coordinator session lifecycle, bounded IPC, account UI, documentation, and regression tests are implemented within runtime/arckit-runtime.",
      "evidence": [
        "runtime/arckit-runtime/src/task-source-adapter.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/desktop/main.mjs",
        "runtime/arckit-runtime/desktop/preload.cjs",
        "runtime/arckit-runtime/desktop/renderer/index.html",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "runtime/arckit-runtime/README.md"
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
      "reason": "The complete Runtime check passes with 67 tests and one explicitly opt-in Electron geometry test skipped; focused tests cover login payloads, private credential projection, pre-expiry single-flight refresh, one-time 401 retry, logout, stale in-flight response invalidation, project/task sync, and bounded renderer IPC. Visual YAML and diff integrity checks also pass.",
      "evidence": [
        "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/desktop-store.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "runtime/arckit-runtime/package.json",
        "arckit/visual/_library/component-catalog.yaml"
      ],
      "next_transition": ""
    }
  },
  "content_revision": 7,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-08-02T08:44:14.173Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
    "reviewed_content_revision": 7,
    "dimensions": {
      "correctness": "clean",
      "completeness": "clean",
      "minimality": "clean"
    },
    "findings": [
      {
        "id": "REVIEW-20260802-001-auth-action-locking",
        "kind": "error",
        "statement": "The Renderer used one shared authentication busy flag, so sending a verification code, submitting login, or logging out disabled unrelated authentication actions instead of projecting the independently defined in-progress states; transient form errors also lost their error tone when the auth type changed.",
        "responsibility": "agent",
        "affected_facets": [
          "interaction_expectation",
          "implementation_state",
          "verification_state"
        ],
        "artifact_refs": [
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "arckit/interaction/automation-workspace/interaction.md"
        ],
        "evidence": [
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "arckit/interaction/automation-workspace/interaction.md"
        ],
        "status": "resolved",
        "resolution_reason": "Renderer now tracks verification, login, and logout progress independently, preserves form feedback state across re-renders, and reports save/sync outcomes according to authentication and source status; static regression assertions cover all three independent flags.",
        "resolution_evidence": [
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
        "content_revision": 6,
        "dimensions": {
          "correctness": "findings",
          "completeness": "clean",
          "minimality": "clean"
        },
        "finding_ids": [
          "REVIEW-20260802-001-auth-action-locking"
        ],
        "evidence": [
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/desktop/renderer/index.html",
          "arckit/interaction/automation-workspace/interaction.md",
          "runtime/arckit-runtime/test/desktop-renderer.test.mjs"
        ],
        "occurred_at": "2026-08-02T09:22:28.493Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
        "reviewer": "agent",
        "outcome": "clean",
        "content_revision": 7,
        "dimensions": {
          "correctness": "clean",
          "completeness": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "runtime/arckit-runtime/src/task-source-adapter.mjs",
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
          "runtime/arckit-runtime/desktop/main.mjs",
          "runtime/arckit-runtime/desktop/preload.cjs",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
          "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/tech/arckit-runtime/solution.md"
        ],
        "occurred_at": "2026-08-02T09:23:46.203Z"
      }
    ],
    "evidence": [
      "runtime/arckit-runtime/desktop/renderer/renderer.js",
      "runtime/arckit-runtime/desktop/renderer/index.html",
      "arckit/interaction/automation-workspace/interaction.md",
      "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
      "runtime/arckit-runtime/src/task-source-adapter.mjs",
      "runtime/arckit-runtime/src/automation-coordinator.mjs",
      "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
      "runtime/arckit-runtime/desktop/main.mjs",
      "runtime/arckit-runtime/desktop/preload.cjs",
      "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
      "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
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
      "goal": "Formalize the Workshop login and current-user project/task synchronization behavior from stable implementation evidence.",
      "outcome": "completed",
      "planned_transition": "Product expectation becomes required and formalized; alignment remains diverged until Runtime implements login and session-backed synchronization.",
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
              "reason": "The stable product specification now defines NebulaAuth verification-code login, token refresh and invalidation, current-user project/task synchronization, logout cleanup, and renderer credential isolation; Runtime still exposes only manually configured bearer/header credentials.",
              "next_transition": "Implement the formalized login and authenticated synchronization behavior, then reconcile product alignment."
            },
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "runtime/arckit-runtime/src/task-source-adapter.mjs",
              "runtime/arckit-runtime/src/desktop/desktop-store.mjs"
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
        "runtime/arckit-runtime/src/task-source-adapter.mjs",
        "runtime/arckit-runtime/src/desktop/desktop-store.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T08:48:13.292Z"
    },
    {
      "round": 2,
      "goal": "Define the bounded Workshop account and session interaction inside the Automation Workspace settings surface.",
      "outcome": "completed",
      "planned_transition": "Interaction expectation becomes required and formalized; alignment remains diverged until the renderer and main-process flows implement the defined states.",
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
              "reason": "The interaction source and gray wireframe now define logged-out verification-code entry, cooldown, authenticated summary, session expiration recovery, logout effects, and return-to-sync behavior; the current Desktop settings still exposes manual credentials.",
              "next_transition": "Implement the account settings states and bounded login/logout IPC, then reconcile interaction alignment."
            },
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/authentication.html",
              "runtime/arckit-runtime/desktop/renderer/index.html"
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
        "arckit/interaction/automation-workspace/authentication.html",
        "arckit/interaction/INDEX.md",
        "arckit/interaction/_map/feature-matrix.md",
        "arckit/interaction/_map/RELATIONS.md",
        "runtime/arckit-runtime/desktop/renderer/index.html"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T08:51:16.337Z"
    },
    {
      "round": 3,
      "goal": "Extend the existing Runtime Desktop visual system with bounded Workshop account and session states.",
      "outcome": "completed",
      "planned_transition": "Visual expectation becomes required and formalized without introducing a new brand direction; alignment remains diverged until the renderer adopts AccountPanel states.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "visual_expectation",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "diverged",
              "target_alignment": "aligned",
              "resolution": "unresolved",
              "reason": "The existing control-console visual strategy now covers Workshop account status and the component catalog defines logged-out, verification, authenticated, refreshing, expired, and logout states without exposing credentials; the current renderer has no such AccountPanel.",
              "next_transition": "Implement AccountPanel using the existing tokens and reconcile visual alignment."
            },
            "evidence": [
              "arckit/visual/_library/brief.md",
              "arckit/visual/_library/component-catalog.yaml",
              "arckit/visual/_library/style-preview.html",
              "runtime/arckit-runtime/desktop/renderer/styles.css"
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
        "arckit/visual/_library/brief.md",
        "arckit/visual/_library/component-catalog.yaml",
        "arckit/visual/_library/style-preview.html",
        "arckit/visual/INDEX.md",
        "arckit/visual/_map/feature-matrix.md",
        "runtime/arckit-runtime/desktop/renderer/styles.css"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T08:53:38.792Z"
    },
    {
      "round": 4,
      "goal": "Formalize the main-process Workshop authenticated service, token lifecycle, private store, coordinator, and bounded IPC architecture.",
      "outcome": "completed",
      "planned_transition": "Technical expectation becomes required and formalized; alignment remains diverged until the Runtime implements the service and contracts.",
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
              "reason": "The Runtime solution now defines a long-lived main-process Workshop service, verification-code endpoints, token normalization, pre-expiry refresh, single-flight concurrency, one-time 401 retry, private settings, coordinator logout cleanup, and bounded auth IPC; the current adapter is static and has no login lifecycle.",
              "next_transition": "Implement the authenticated Workshop service and its store, coordinator, IPC, and renderer integrations, then reconcile technical alignment."
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "runtime/arckit-runtime/src/task-source-adapter.mjs",
              "runtime/arckit-runtime/desktop/main.mjs",
              "runtime/arckit-runtime/src/desktop/desktop-store.mjs"
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
        "arckit/tech/INDEX.md",
        "runtime/arckit-runtime/src/task-source-adapter.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
        "runtime/arckit-runtime/desktop/main.mjs",
        "runtime/arckit-runtime/desktop/preload.cjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T08:55:47.894Z"
    },
    {
      "round": 5,
      "goal": "Implement Workshop verification-code authentication and current-user project/task synchronization across the main process, coordinator, bounded IPC, and account settings surface.",
      "outcome": "completed",
      "planned_transition": "Product, interaction, visual, technical, and implementation facets become aligned and resolved; verification remains for an independent transition.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "product_expectation",
            "set": {
              "alignment": "aligned",
              "resolution": "resolved",
              "reason": "Runtime Desktop now supports Workshop verification-code login, renewable account sessions, immediate current-user project/task synchronization, expired-session read-only behavior, and confirmed logout cleanup.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/src/task-source-adapter.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ]
          },
          {
            "facet": "interaction_expectation",
            "set": {
              "alignment": "aligned",
              "resolution": "resolved",
              "reason": "The settings overlay implements logged-out, verification cooldown, authenticated, refreshing, expired, error, and confirmed active-task logout paths while returning successful login to the synchronized Command Center.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/desktop/renderer/index.html",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/authentication.html"
            ]
          },
          {
            "facet": "visual_expectation",
            "set": {
              "alignment": "aligned",
              "resolution": "resolved",
              "reason": "The account panel reuses the established Runtime Desktop tokens and provides distinct logged-out, authenticated, refreshing, expired, feedback, and advanced-settings treatments.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/desktop/renderer/styles.css",
              "runtime/arckit-runtime/desktop/renderer/index.html",
              "arckit/visual/_library/component-catalog.yaml",
              "arckit/visual/_library/style-preview.html"
            ]
          },
          {
            "facet": "technical_expectation",
            "set": {
              "alignment": "aligned",
              "resolution": "resolved",
              "reason": "A long-lived main-process Workshop service now owns private credentials, endpoint normalization, single-flight refresh, one-time 401 retry, bounded fan-out, session-generation race protection, coordinator cleanup, and bounded authentication IPC.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/src/task-source-adapter.mjs",
              "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/desktop/main.mjs",
              "runtime/arckit-runtime/desktop/preload.cjs",
              "arckit/tech/arckit-runtime/solution.md"
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
              "reason": "The authenticated Workshop service, private store migration, coordinator session lifecycle, bounded IPC, account UI, documentation, and regression tests are implemented within runtime/arckit-runtime.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/src/task-source-adapter.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/desktop/main.mjs",
              "runtime/arckit-runtime/desktop/preload.cjs",
              "runtime/arckit-runtime/desktop/renderer/index.html",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/desktop/renderer/styles.css",
              "runtime/arckit-runtime/README.md"
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
        "runtime/arckit-runtime/src/task-source-adapter.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/desktop/main.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T09:19:38.752Z"
    },
    {
      "round": 6,
      "goal": "Verify the authenticated Workshop integration, account projection, synchronization lifecycle, concurrency boundaries, and renderer IPC contract.",
      "outcome": "completed",
      "planned_transition": "Verification becomes required, confirmed, aligned, and resolved; the Case becomes ready for an independent completion review.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "verification_state",
            "set": {
              "applicability": "required",
              "maturity": "confirmed",
              "target_maturity": "confirmed",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "The complete Runtime check passes with 67 tests and one explicitly opt-in Electron geometry test skipped; focused tests cover login payloads, private credential projection, pre-expiry single-flight refresh, one-time 401 retry, logout, stale in-flight response invalidation, project/task sync, and bounded renderer IPC. Visual YAML and diff integrity checks also pass.",
              "next_transition": ""
            },
            "evidence": [
              "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
              "runtime/arckit-runtime/test/desktop-store.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
              "runtime/arckit-runtime/package.json",
              "arckit/visual/_library/component-catalog.yaml"
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
        "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/desktop-store.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "runtime/arckit-runtime/package.json",
        "arckit/visual/_library/component-catalog.yaml"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T09:20:11.807Z"
    },
    {
      "round": 7,
      "goal": "Review content revision 6 for correctness, completeness, and minimality.",
      "outcome": "partial",
      "planned_transition": "Record the interaction-state locking finding and route it to an agent repair transition.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": {
          "outcome": "findings",
          "reviewer": "agent",
          "reviewed_content_revision": 6,
          "dimensions": {
            "correctness": "findings",
            "completeness": "clean",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "REVIEW-20260802-001-auth-action-locking",
              "kind": "error",
              "statement": "The Renderer used one shared authentication busy flag, so sending a verification code, submitting login, or logging out disabled unrelated authentication actions instead of projecting the independently defined in-progress states; transient form errors also lost their error tone when the auth type changed.",
              "responsibility": "agent",
              "affected_facets": [
                "interaction_expectation",
                "implementation_state",
                "verification_state"
              ],
              "artifact_refs": [
                "runtime/arckit-runtime/desktop/renderer/renderer.js",
                "arckit/interaction/automation-workspace/interaction.md"
              ],
              "evidence": [
                "runtime/arckit-runtime/desktop/renderer/renderer.js",
                "arckit/interaction/automation-workspace/interaction.md"
              ]
            }
          ],
          "evidence": [
            "runtime/arckit-runtime/desktop/renderer/renderer.js",
            "runtime/arckit-runtime/desktop/renderer/index.html",
            "arckit/interaction/automation-workspace/interaction.md",
            "runtime/arckit-runtime/test/desktop-renderer.test.mjs"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "arckit/interaction/automation-workspace/interaction.md",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T09:22:28.493Z"
    },
    {
      "round": 8,
      "goal": "Repair independent authentication progress states and durable inline feedback.",
      "outcome": "completed",
      "planned_transition": "Resolve the review finding, increment the content revision, and return the Case to review-ready.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [
          {
            "id": "REVIEW-20260802-001-auth-action-locking",
            "resolution": "resolved",
            "reason": "Renderer now tracks verification, login, and logout progress independently, preserves form feedback state across re-renders, and reports save/sync outcomes according to authentication and source status; static regression assertions cover all three independent flags.",
            "evidence": [
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs"
            ]
          }
        ],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "runtime/arckit-runtime/test/desktop-store.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T09:23:04.551Z"
    },
    {
      "round": 9,
      "goal": "Review the repaired content revision 7 for correctness, completeness, and minimality.",
      "outcome": "completed",
      "planned_transition": "Record a clean review for all three dimensions and resolve the Case.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": {
          "outcome": "clean",
          "reviewer": "agent",
          "reviewed_content_revision": 7,
          "dimensions": {
            "correctness": "clean",
            "completeness": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "runtime/arckit-runtime/src/task-source-adapter.mjs",
            "runtime/arckit-runtime/src/automation-coordinator.mjs",
            "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
            "runtime/arckit-runtime/desktop/main.mjs",
            "runtime/arckit-runtime/desktop/preload.cjs",
            "runtime/arckit-runtime/desktop/renderer/renderer.js",
            "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
            "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
            "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/tech/arckit-runtime/solution.md"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/package.json",
        "runtime/arckit-runtime/test/task-source-adapter.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/desktop-store.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "arckit/visual/_library/component-catalog.yaml"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-02T09:23:46.203Z"
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
          "case:CASE-20260802-001"
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
    "updated_at": "2026-08-02T09:23:46.203Z"
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
