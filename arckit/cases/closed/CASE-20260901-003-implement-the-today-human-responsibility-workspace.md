# Implement the Today human responsibility workspace

Case: CASE-20260901-003
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-09-01T19:27:40.512Z

## User Intent

Implement the confirmed Today interaction target in ArcOrbit Desktop using the real navigation, multi-project setup, cross-source human responsibility actions, state continuity, and source-backed recovery behavior.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260901-003",
  "title": "Implement the Today human responsibility workspace",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-09-01T18:30:21.729Z",
  "updated_at": "2026-09-01T19:27:40.512Z",
  "user_intent": "Implement the confirmed Today interaction target in ArcOrbit Desktop using the real navigation, multi-project setup, cross-source human responsibility actions, state continuity, and source-backed recovery behavior.",
  "expected_outcome": "ArcOrbit Desktop Today fully realizes the accepted interaction source, with behavior and regression tests proving newcomer setup, multi-project continuity, direct human actions, transient completion feedback, and no routine-work or completed-history clutter.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-20260901-003-001",
      "revision": 1,
      "status": "accepted",
      "statement": "The repository contains a confirmed Today interaction source and projections that define a two-mode human responsibility workspace, reuse the existing three navigation groups, treat project participation as a current-user current-device choice, and remove completed items after immediate source confirmation.",
      "basis": "The user approved the interaction corrections and explicitly authorized full implementation with a state-driven Loop.",
      "evidence": [
        "Current user request, 2026-09-02",
        "arckit/interaction/today-workspace/interaction.md",
        "arckit/interaction/today-workspace/default.html",
        "arckit/interaction/today-workspace/readiness-details.html",
        "arckit/interaction/today-workspace/action-details.html",
        "arckit/interaction/today-workspace/action-continuity.html"
      ]
    },
    {
      "id": "FACT-20260901-003-002",
      "revision": 1,
      "status": "accepted",
      "statement": "The current ArcOrbit Today renderer is an older dashboard: it presents a unique next step, routine open-work metrics and cards, and a read-only attention list; it has no persistent two-mode workspace, project and responsibility rails, selected-item operator, or source-backed action continuity.",
      "basis": "Direct inspection of the live Desktop markup and renderer implementation.",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/index.html:163",
        "runtime/arcorbit/desktop/renderer/renderer.js:1701",
        "runtime/arcorbit/desktop/renderer/renderer.js:1758"
      ]
    },
    {
      "id": "FACT-20260901-003-003",
      "revision": 1,
      "status": "accepted",
      "statement": "The existing ArcOrbit platform already exposes reusable source actions for local project participation and binding, Work task mutations, Automation external-dependency and recovery handling, and Feedback partial-link recovery; project participation is persisted in the Desktop Store as a current-device boolean map and the coordinator does not enforce an owner/admin role boundary on that local preference.",
      "basis": "Direct inspection of the renderer APIs, coordinators, Desktop Store, and existing behavior tests.",
      "evidence": [
        "runtime/arcorbit/src/desktop/desktop-store.mjs:665",
        "runtime/arcorbit/src/automation-coordinator.mjs:261",
        "runtime/arcorbit/desktop/renderer/renderer.js:2463",
        "runtime/arcorbit/desktop/renderer/renderer.js:3771",
        "runtime/arcorbit/desktop/renderer/renderer.js:3986",
        "runtime/arcorbit/test/platform-coordinator.test.mjs:486"
      ]
    },
    {
      "id": "FACT-20260901-003-004",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit now has a pure Today workspace projection that models exactly four project Automation prerequisites, stable multi-project configuration blockers, typed current-user responsibilities from Chat, Automation, Work and Feedback, project-scope filtering, minimal non-human status, source deduplication, and selection fallback without routine work or completed history.",
      "basis": "Implemented module and eight passing behavior tests, including repair of aggregate identity stability discovered by the first test run.",
      "evidence": [
        "runtime/arcorbit/src/desktop/today-workspace.mjs",
        "runtime/arcorbit/test/today-workspace.test.mjs",
        "Verification: node --test runtime/arcorbit/test/today-workspace.test.mjs; 8 passed"
      ]
    },
    {
      "id": "FACT-20260901-003-005",
      "revision": 1,
      "status": "accepted",
      "statement": "The live ArcOrbit Desktop Today surface now uses the existing application navigation and a real three-column project rail, two-mode responsibility rail, and selected-item operator. It consumes the pure projection, owns Today project scope independently from Workset scope, preserves valid selection and per-item drafts across renders, shows only minimal automatic status, and collapses the project rail at narrower desktop widths.",
      "basis": "Implemented Desktop markup, renderer and styles with updated structural regression assertions.",
      "evidence": [
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "Verification: 71 focused and Desktop renderer tests passed"
      ]
    },
    {
      "id": "FACT-20260901-003-006",
      "revision": 1,
      "status": "accepted",
      "statement": "Today now directly executes typed Chat approval decisions across sessions; Automation intervention, external-dependency and recovery actions; Work review, acceptance, acceptance-issue and blocked-state actions; Feedback partial-link recovery; and project binding, Setup, participation and source-retry actions. It locks only the submitted item, preserves drafts and selection on error, requires source refresh before success, briefly shows the confirmed source result, then removes the responsibility and selects the next valid item.",
      "basis": "Implemented source projections, renderer action dispatcher, continuity feedback and focused/static behavior coverage over existing typed IPC capabilities.",
      "evidence": [
        "runtime/arcorbit/src/chat-coordinator.mjs",
        "runtime/arcorbit/src/desktop/today-workspace.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/chat-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: 85 tests passed"
      ]
    },
    {
      "id": "FACT-20260901-003-007",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Today now implements the continuous newcomer and multi-project configuration journey: a new store starts with no Today projects; an in-place Sheet can create one personal project, add multiple accessible projects, or join by project or organization invitation; each selected project independently advances through access, local repository binding, project Setup readiness, and current-user current-device Automation participation; ready projects leave the configuration list and expose only a handoff to Work. Today project scope, mode, valid selection, and bounded per-responsibility drafts persist across restart, while a human responsibility from an unselected project remains visible so Workset or local scope cannot hide required intervention.",
      "basis": "Implemented the Desktop Store migration, typed platform IPC, all-project Today task projection, in-place acquisition Sheet, persistent continuity state, per-project setup cache, and ready-to-Work handoff with focused tests.",
      "evidence": [
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/src/desktop/today-workspace.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/today-workspace.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: 104 focused tests passed"
      ]
    },
    {
      "id": "FACT-20260901-003-008",
      "revision": 1,
      "status": "accepted",
      "statement": "The implemented Today workspace now passes the complete non-Electron ArcOrbit regression suite and direct Electron desktop verification. The repair cycle eliminated undersized Today text, confined configuration counts and ready handoff to the explicit Today project scope, kept project Setup checks and confirmed write/recovery inside Today instead of reopening the startup gate, added source-specific operator evidence, and promoted cross-project Work replacement partial success into a directly actionable Today responsibility.",
      "basis": "Full regression, direct Electron fixtures and targeted repair reruns against the accepted Today interaction source.",
      "evidence": [
        "Verification: 588 non-Electron tests; 564 passed, 24 skipped, 0 failed",
        "Direct Electron fixture: 3 Today columns at 1440px and 2 columns at 1100px",
        "Direct Electron fixture: 0 visible text, control-size, checkbox-target or selectable-row violations",
        "Direct Electron task-replacement fixture: source-delete recovery passed with no renderer errors",
        "runtime/arcorbit/src/desktop/today-workspace.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-20260901-003-001",
      "fact_id": "FACT-20260901-003-007",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 64
      },
      "effect": "upheld",
      "reason": "The real Today workspace now realizes the complete in-place newcomer path, multi-project continuity, local participation and Work-only handoff.",
      "gap_ids": [],
      "evidence": [
        "arckit/interaction/today-workspace/interaction.md",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/desktop-renderer.test.mjs"
      ]
    },
    {
      "id": "IMPACT-20260901-003-002",
      "fact_id": "FACT-20260901-003-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 42
      },
      "effect": "upheld",
      "reason": "The capability statement now matches the local current-device participation boundary while remote governance remains role-controlled.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs"
      ]
    },
    {
      "id": "IMPACT-20260901-003-003",
      "fact_id": "FACT-20260901-003-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 47
      },
      "effect": "upheld",
      "reason": "The target can be implemented through the existing Electron renderer, Platform Coordinator, Automation coordinator, and Desktop Store boundaries.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-20260901-003-001",
      "status": "resolved",
      "goal": "Establish the actual ArcOrbit Today implementation gaps and an executable acceptance boundary against the confirmed interaction source.",
      "reason": "The interaction target is accepted, but the current renderer, coordinator, state ownership, action surfaces, and tests have not yet been compared as one implementation baseline; downstream implementation scope depends on that accepted comparison.",
      "derived_from": [
        "FACT-20260901-003-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "Defines the exact downstream implementation objects and acceptance evidence",
        "user_impact": "Prevents partial implementation of the primary Today entry",
        "uncertainty": "Current code has an older Today guidance surface whose overlap is not yet accepted"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Current renderer/coordinator/state/test evidence mapped to every accepted Today responsibility",
        "Explicit implementation gaps with bounded acceptance requirements",
        "Relevant Project software decision and invariant assessment"
      ],
      "resolution": {
        "id": "GAP-20260901-003-001",
        "status": "resolved",
        "outcome": "Accepted an executable implementation baseline and five dependency-ordered downstream gaps.",
        "reason": "The current implementation, reusable source actions, ownership conflict, and verification boundary are now directly evidenced and bounded.",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/index.html:163",
          "runtime/arcorbit/desktop/renderer/renderer.js:1701",
          "runtime/arcorbit/src/desktop/today-guidance.mjs",
          "runtime/arcorbit/test/today-guidance.test.mjs"
        ],
        "occurred_at": "2026-09-01T18:34:19.157Z"
      }
    },
    {
      "id": "GAP-20260901-003-002",
      "status": "resolved",
      "goal": "Implement a tested Today projection that derives only project-configuration blockers and explicit current-user intervention items from all relevant source states.",
      "reason": "The UI needs one stable source of truth for its two modes, multi-project counts, selection continuity, and exclusion of routine work and completed history.",
      "derived_from": [
        "FACT-20260901-003-001",
        "FACT-20260901-003-002",
        "FACT-20260901-003-003"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "user_impact": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Pure projection implementation",
        "Behavior tests for configuration, intervention, filtering, ordering, and multi-project state"
      ],
      "resolution": {
        "id": "GAP-20260901-003-002",
        "status": "resolved",
        "outcome": "Implemented and verified the canonical Today projection.",
        "reason": "The projection meets the bounded configuration, intervention, filtering, ordering, non-human summary, and continuity acceptance requirements.",
        "evidence": [
          "runtime/arcorbit/src/desktop/today-workspace.mjs",
          "runtime/arcorbit/test/today-workspace.test.mjs",
          "8 focused tests passed"
        ],
        "occurred_at": "2026-09-01T18:38:52.152Z"
      }
    },
    {
      "id": "GAP-20260901-003-003",
      "status": "resolved",
      "goal": "Replace the old Today dashboard with the real desktop two-mode, three-column workspace and responsive selected-item operator.",
      "reason": "The accepted interaction must be realized in the actual Desktop chrome rather than as an isolated illustrative card.",
      "derived_from": [
        "FACT-20260901-003-002"
      ],
      "blocked_by": [
        "GAP-20260901-003-002"
      ],
      "priority_basis": {
        "blocking": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Updated Desktop markup, renderer, and styles",
        "Stable selection across refresh and multi-project changes"
      ],
      "resolution": {
        "id": "GAP-20260901-003-003",
        "status": "resolved",
        "outcome": "Replaced the old Today dashboard with the real two-mode three-column Desktop workspace.",
        "reason": "Markup, renderer state, project and responsibility selection, operator context, draft preservation, minimal non-human summary, and responsive layout are implemented and regression-checked.",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/index.html",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css",
          "71 tests passed"
        ],
        "occurred_at": "2026-09-01T18:44:32.724Z"
      }
    },
    {
      "id": "GAP-20260901-003-004",
      "status": "resolved",
      "goal": "Wire Today operator actions directly to their source capabilities with drafts, pending state, source confirmation, errors, and bounded handoff continuity.",
      "reason": "Today only solves human intervention when each surfaced item can actually be completed in place and safely disappears after source confirmation.",
      "derived_from": [
        "FACT-20260901-003-001",
        "FACT-20260901-003-003"
      ],
      "blocked_by": [
        "GAP-20260901-003-003"
      ],
      "priority_basis": {
        "blocking": "high",
        "user_impact": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Direct actions for supported Work, Automation, Feedback, Chat, and project setup sources",
        "Behavior evidence for success, partial success, stale items, and retry"
      ],
      "resolution": {
        "id": "GAP-20260901-003-004",
        "status": "resolved",
        "outcome": "Wired supported Today responsibilities to typed source actions with source-confirmed continuity.",
        "reason": "Chat, Automation, Work, Feedback and project setup actions execute in Today; item-scoped pending, retained errors/drafts, fresh confirmation, transient result and adjacent fallback are implemented.",
        "evidence": [
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/chat-coordinator.mjs",
          "runtime/arcorbit/test/chat-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "85 tests passed"
        ],
        "occurred_at": "2026-09-01T18:50:01.439Z"
      }
    },
    {
      "id": "GAP-20260901-003-005",
      "status": "resolved",
      "goal": "Complete the newcomer and multi-project configuration journey through add/select, local binding, setup checks, local participation, and handoff to Work task creation.",
      "reason": "The user requires a continuous first-use journey and realistic parallel-project states without turning Today into routine work management.",
      "derived_from": [
        "FACT-20260901-003-001",
        "FACT-20260901-003-003"
      ],
      "blocked_by": [
        "GAP-20260901-003-003"
      ],
      "priority_basis": {
        "blocking": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "End-to-end newcomer state progression",
        "Multi-project configuration and handoff behavior tests"
      ],
      "resolution": {
        "id": "GAP-20260901-003-005",
        "status": "resolved",
        "outcome": "Implemented the complete newcomer and multi-project configuration journey inside the real Today workspace.",
        "reason": "Today now owns a durable project range, all three acquisition sources, parallel prerequisites, current-device participation, restart continuity, and a Work-only ready handoff.",
        "evidence": [
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/src/desktop/today-workspace.mjs",
          "runtime/arcorbit/desktop/main.mjs",
          "runtime/arcorbit/desktop/preload.cjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/test/today-workspace.test.mjs",
          "runtime/arcorbit/test/desktop-store.test.mjs",
          "runtime/arcorbit/test/platform-coordinator.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "Verification: 104 focused tests passed"
        ],
        "occurred_at": "2026-09-01T19:02:46.559Z"
      }
    },
    {
      "id": "GAP-20260901-003-006",
      "status": "resolved",
      "goal": "Run focused and regression verification, repair findings, and prove the full accepted Today interaction against the real Desktop implementation.",
      "reason": "The cross-source workspace changes high-traffic renderer behavior and requires credible behavior and regression evidence before completion review.",
      "derived_from": [
        "FACT-20260901-003-001",
        "FACT-20260901-003-002",
        "FACT-20260901-003-003"
      ],
      "blocked_by": [
        "GAP-20260901-003-002",
        "GAP-20260901-003-003",
        "GAP-20260901-003-004",
        "GAP-20260901-003-005"
      ],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Focused Today tests",
        "Relevant Desktop regression suite",
        "Static or GUI interaction evidence proportionate to changed behavior"
      ],
      "resolution": {
        "id": "GAP-20260901-003-006",
        "status": "resolved",
        "outcome": "Verified the complete Today workspace and repaired every material finding discovered by regression and real Electron inspection.",
        "reason": "All 588 non-Electron tests completed with 564 passing and 24 intentionally skipped; both sandbox-blocked Electron wrappers were executed directly and passed; the GUI audit found no undersized visible text or control-target violations and confirmed the three-column and narrow two-column layouts.",
        "evidence": [
          "Verification: 588 non-Electron tests; 564 passed, 24 skipped, 0 failed",
          "runtime/arcorbit/test/experience-realization-electron.test.mjs",
          "Direct Electron fixture: experience-realization-electron.mjs passed with 0 visual/control violations",
          "Direct Electron fixture: task-replacement-sheet-electron.mjs passed with preserved drafts, retry recovery and no renderer errors",
          "runtime/arcorbit/test/today-workspace.test.mjs",
          "runtime/arcorbit/test/desktop-renderer.test.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/desktop/renderer/styles.css"
        ],
        "occurred_at": "2026-09-01T19:24:45.210Z"
      }
    }
  ],
  "content_revision": 6,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 20,
      "source": "User explicitly requested state-driven continuation until complete on 2026-09-02.",
      "snapshotted_at": "2026-09-01T18:30:21.729Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 6,
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
        "outcome": "clean",
        "content_revision": 6,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "arckit/interaction/today-workspace/interaction.md",
          "runtime/arcorbit/src/desktop/today-workspace.mjs",
          "runtime/arcorbit/desktop/renderer/renderer.js",
          "runtime/arcorbit/src/platform-coordinator.mjs",
          "runtime/arcorbit/src/desktop/desktop-store.mjs",
          "Verification rerun: 588 non-Electron tests; 564 passed, 24 skipped, 0 failed",
          "Direct Electron Today layout fixture passed with 0 visual/control violations",
          "Direct Electron task replacement recovery fixture passed with no renderer errors",
          "git diff --check passed"
        ],
        "occurred_at": "2026-09-01T19:27:40.512Z"
      }
    ],
    "evidence": [
      "arckit/interaction/today-workspace/interaction.md",
      "runtime/arcorbit/src/desktop/today-workspace.mjs",
      "runtime/arcorbit/desktop/renderer/renderer.js",
      "runtime/arcorbit/src/platform-coordinator.mjs",
      "runtime/arcorbit/src/desktop/desktop-store.mjs",
      "Verification rerun: 588 non-Electron tests; 564 passed, 24 skipped, 0 failed",
      "Direct Electron Today layout fixture passed with 0 visual/control violations",
      "Direct Electron task replacement recovery fixture passed with no renderer errors",
      "git diff --check passed"
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
      "goal": "Accept one implementation baseline and derive bounded downstream gaps without changing application behavior.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The accepted Today target cannot be implemented coherently until the old dashboard, reusable source actions, state ownership, and verification boundary are compared as one baseline.",
        "snapshot_token": "470844f06b98b788d51be6ff452f05c20b587f3c84181aa6a2ffa5f9611b4341",
        "selected_ref": "case-gap:CASE-20260901-003:GAP-20260901-003-001",
        "comparison_summary": "The Today baseline gap directly blocks this requested implementation. The four Project gaps concern broader protocol, resilience, security, and audit work and are deferred.",
        "fresh_discovery_summary": "No fresher standalone gap supersedes the persisted Today baseline obligation.",
        "considered": [
          {
            "ref": "case-gap:CASE-20260901-003:GAP-20260901-003-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "reason": "It establishes the exact implementation and acceptance boundary for the user's active request.",
            "priority_basis": {
              "blocking": "high",
              "user_impact": "high",
              "uncertainty": "high"
            }
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "It is broader protocol evaluation and does not establish the Today implementation baseline.",
            "priority_basis": {
              "risk": "high",
              "relevance": "low"
            }
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "It is not on the critical path for the renderer-owned Today workspace.",
            "priority_basis": {
              "risk": "high",
              "relevance": "low"
            }
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "It requires a separate real permission-bearing project and is outside this implementation scope.",
            "priority_basis": {
              "risk": "high",
              "relevance": "low"
            }
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "The current round uses the trusted transition but does not attempt the broader cross-record audit project gap.",
            "priority_basis": {
              "risk": "high",
              "relevance": "medium"
            }
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260901-003-001",
        "responsibility": "agent",
        "goal": "Establish the actual ArcOrbit Today implementation gaps and an executable acceptance boundary against the confirmed interaction source.",
        "reason": "The interaction target is accepted, but the current renderer, coordinator, state ownership, action surfaces, and tests have not yet been compared as one implementation baseline; downstream implementation scope depends on that accepted comparison.",
        "derived_from": [
          "FACT-20260901-003-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "Defines the exact downstream implementation objects and acceptance evidence",
          "uncertainty": "Current code has an older Today guidance surface whose overlap is not yet accepted",
          "risk": "",
          "user_impact": "Prevents partial implementation of the primary Today entry"
        },
        "evidence_required": [
          "Current renderer/coordinator/state/test evidence mapped to every accepted Today responsibility",
          "Explicit implementation gaps with bounded acceptance requirements",
          "Relevant Project software decision and invariant assessment"
        ]
      },
      "planned_transition": {
        "goal": "Accept one implementation baseline and derive bounded downstream gaps without changing application behavior.",
        "expected_state_change": "The baseline gap resolves, code facts become accepted, and implementation, action-continuity, onboarding, and verification gaps become ready in dependency order."
      },
      "accepted_state_delta": {
        "facts_added": [
          {
            "id": "FACT-20260901-003-002",
            "revision": 1,
            "status": "accepted",
            "statement": "The current ArcOrbit Today renderer is an older dashboard: it presents a unique next step, routine open-work metrics and cards, and a read-only attention list; it has no persistent two-mode workspace, project and responsibility rails, selected-item operator, or source-backed action continuity.",
            "basis": "Direct inspection of the live Desktop markup and renderer implementation.",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html:163",
              "runtime/arcorbit/desktop/renderer/renderer.js:1701",
              "runtime/arcorbit/desktop/renderer/renderer.js:1758"
            ]
          },
          {
            "id": "FACT-20260901-003-003",
            "revision": 1,
            "status": "accepted",
            "statement": "The existing ArcOrbit platform already exposes reusable source actions for local project participation and binding, Work task mutations, Automation external-dependency and recovery handling, and Feedback partial-link recovery; project participation is persisted in the Desktop Store as a current-device boolean map and the coordinator does not enforce an owner/admin role boundary on that local preference.",
            "basis": "Direct inspection of the renderer APIs, coordinators, Desktop Store, and existing behavior tests.",
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs:665",
              "runtime/arcorbit/src/automation-coordinator.mjs:261",
              "runtime/arcorbit/desktop/renderer/renderer.js:2463",
              "runtime/arcorbit/desktop/renderer/renderer.js:3771",
              "runtime/arcorbit/desktop/renderer/renderer.js:3986",
              "runtime/arcorbit/test/platform-coordinator.test.mjs:486"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-20260901-003-001",
            "fact_id": "FACT-20260901-003-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 63
            },
            "effect": "threatened",
            "reason": "The accepted Today interaction is durable, but the actual Desktop still realizes the superseded dashboard interaction.",
            "gap_ids": [
              "GAP-20260901-003-002",
              "GAP-20260901-003-003",
              "GAP-20260901-003-004",
              "GAP-20260901-003-005"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js:1701"
            ]
          },
          {
            "id": "IMPACT-20260901-003-002",
            "fact_id": "FACT-20260901-003-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 41
            },
            "effect": "threatened",
            "reason": "The durable decision still describes project participation as remote governance while the implemented automation participation fact is a local current-device preference; Today must use the implemented ownership boundary consistently.",
            "gap_ids": [
              "GAP-20260901-003-002",
              "GAP-20260901-003-005"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs:665",
              "runtime/arcorbit/src/automation-coordinator.mjs:261"
            ]
          },
          {
            "id": "IMPACT-20260901-003-003",
            "fact_id": "FACT-20260901-003-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 47
            },
            "effect": "upheld",
            "reason": "The target can be implemented through the existing Electron renderer, Platform Coordinator, Automation coordinator, and Desktop Store boundaries.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs"
            ]
          }
        ],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-20260901-003-002",
            "status": "open",
            "goal": "Implement a tested Today projection that derives only project-configuration blockers and explicit current-user intervention items from all relevant source states.",
            "reason": "The UI needs one stable source of truth for its two modes, multi-project counts, selection continuity, and exclusion of routine work and completed history.",
            "derived_from": [
              "FACT-20260901-003-001",
              "FACT-20260901-003-002",
              "FACT-20260901-003-003"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high",
              "user_impact": "high",
              "risk": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Pure projection implementation",
              "Behavior tests for configuration, intervention, filtering, ordering, and multi-project state"
            ],
            "resolution": null
          },
          {
            "id": "GAP-20260901-003-003",
            "status": "open",
            "goal": "Replace the old Today dashboard with the real desktop two-mode, three-column workspace and responsive selected-item operator.",
            "reason": "The accepted interaction must be realized in the actual Desktop chrome rather than as an isolated illustrative card.",
            "derived_from": [
              "FACT-20260901-003-002"
            ],
            "blocked_by": [
              "GAP-20260901-003-002"
            ],
            "priority_basis": {
              "blocking": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Updated Desktop markup, renderer, and styles",
              "Stable selection across refresh and multi-project changes"
            ],
            "resolution": null
          },
          {
            "id": "GAP-20260901-003-004",
            "status": "open",
            "goal": "Wire Today operator actions directly to their source capabilities with drafts, pending state, source confirmation, errors, and bounded handoff continuity.",
            "reason": "Today only solves human intervention when each surfaced item can actually be completed in place and safely disappears after source confirmation.",
            "derived_from": [
              "FACT-20260901-003-001",
              "FACT-20260901-003-003"
            ],
            "blocked_by": [
              "GAP-20260901-003-003"
            ],
            "priority_basis": {
              "blocking": "high",
              "user_impact": "high",
              "risk": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Direct actions for supported Work, Automation, Feedback, Chat, and project setup sources",
              "Behavior evidence for success, partial success, stale items, and retry"
            ],
            "resolution": null
          },
          {
            "id": "GAP-20260901-003-005",
            "status": "open",
            "goal": "Complete the newcomer and multi-project configuration journey through add/select, local binding, setup checks, local participation, and handoff to Work task creation.",
            "reason": "The user requires a continuous first-use journey and realistic parallel-project states without turning Today into routine work management.",
            "derived_from": [
              "FACT-20260901-003-001",
              "FACT-20260901-003-003"
            ],
            "blocked_by": [
              "GAP-20260901-003-003"
            ],
            "priority_basis": {
              "blocking": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "End-to-end newcomer state progression",
              "Multi-project configuration and handoff behavior tests"
            ],
            "resolution": null
          },
          {
            "id": "GAP-20260901-003-006",
            "status": "open",
            "goal": "Run focused and regression verification, repair findings, and prove the full accepted Today interaction against the real Desktop implementation.",
            "reason": "The cross-source workspace changes high-traffic renderer behavior and requires credible behavior and regression evidence before completion review.",
            "derived_from": [
              "FACT-20260901-003-001",
              "FACT-20260901-003-002",
              "FACT-20260901-003-003"
            ],
            "blocked_by": [
              "GAP-20260901-003-002",
              "GAP-20260901-003-003",
              "GAP-20260901-003-004",
              "GAP-20260901-003-005"
            ],
            "priority_basis": {
              "blocking": "high",
              "risk": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Focused Today tests",
              "Relevant Desktop regression suite",
              "Static or GUI interaction evidence proportionate to changed behavior"
            ],
            "resolution": null
          }
        ],
        "gaps_cancelled": [],
        "resolved_gap": {
          "id": "GAP-20260901-003-001",
          "status": "resolved",
          "outcome": "Accepted an executable implementation baseline and five dependency-ordered downstream gaps.",
          "reason": "The current implementation, reusable source actions, ownership conflict, and verification boundary are now directly evidenced and bounded.",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/index.html:163",
            "runtime/arcorbit/desktop/renderer/renderer.js:1701",
            "runtime/arcorbit/src/desktop/today-guidance.mjs",
            "runtime/arcorbit/test/today-guidance.test.mjs"
          ]
        },
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "completion_review_result": null,
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 334,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "The accepted Today capability boundary is recoverable but not yet realized, and the durable participation wording conflicts with the implemented local preference.",
            "fact_refs": [
              "FACT-20260901-003-001",
              "FACT-20260901-003-002",
              "FACT-20260901-003-003"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "runtime/arcorbit/src/desktop/desktop-store.mjs:665"
            ],
            "gap_refs": [
              "GAP-20260901-003-002",
              "GAP-20260901-003-005"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The confirmed interaction source durably covers first use, multi-project states, direct action states, continuity, filtering, and completion disappearance.",
            "fact_refs": [
              "FACT-20260901-003-001"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "arckit/interaction/today-workspace/action-continuity.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "The accepted projections reuse the real Desktop navigation and existing neutral workspace language without introducing a separate theme.",
            "fact_refs": [
              "FACT-20260901-003-001"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/default.html",
              "arckit/interaction/wireframe-style.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The implementation can stay within the existing renderer, coordinator, Desktop Store, and typed source-action boundaries.",
            "fact_refs": [
              "FACT-20260901-003-003"
            ],
            "evidence": [
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/desktop/desktop-store.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The live Today renderer still realizes the old dashboard rather than the accepted human-responsibility workspace.",
            "fact_refs": [
              "FACT-20260901-003-001",
              "FACT-20260901-003-002"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:1701"
            ],
            "gap_refs": [
              "GAP-20260901-003-002",
              "GAP-20260901-003-003",
              "GAP-20260901-003-004",
              "GAP-20260901-003-005"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Cross-source mutations and high-traffic renderer changes do not yet have focused implementation evidence for the new workspace.",
            "fact_refs": [
              "FACT-20260901-003-002",
              "FACT-20260901-003-003"
            ],
            "evidence": [
              "runtime/arcorbit/test/today-guidance.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ],
            "gap_refs": [
              "GAP-20260901-003-006"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/interaction/today-workspace/interaction.md",
        "runtime/arcorbit/desktop/renderer/index.html:163",
        "runtime/arcorbit/desktop/renderer/renderer.js:1701",
        "runtime/arcorbit/src/desktop/today-guidance.mjs",
        "runtime/arcorbit/src/desktop/desktop-store.mjs:665",
        "runtime/arcorbit/src/automation-coordinator.mjs:261",
        "runtime/arcorbit/test/today-guidance.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-01T18:34:19.157Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Implement and verify the pure Today workspace projection.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The projection is the only ready Case gap and is the dependency for every renderer and action gap.",
        "snapshot_token": "b65a28d4579830c725172235fbf6e92ed54625a7000220aff72104ae31868007",
        "selected_ref": "case-gap:CASE-20260901-003:GAP-20260901-003-002",
        "comparison_summary": "The Today projection is selected; the four downstream Today gaps are dependency-blocked and the four unrelated Project gaps are deferred.",
        "fresh_discovery_summary": "Implementation exposed and repaired one unstable aggregate-id defect inside the selected projection gap; no separate fresh gap remains.",
        "considered": [
          {
            "ref": "case-gap:CASE-20260901-003:GAP-20260901-003-002",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "reason": "It is the sole ready dependency for the requested implementation.",
            "priority_basis": {
              "blocking": "high",
              "user_impact": "high"
            }
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate broader protocol work.",
            "priority_basis": {
              "relevance": "low"
            }
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Runtime resilience work.",
            "priority_basis": {
              "relevance": "low"
            }
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Requires a separate permission-bearing project.",
            "priority_basis": {
              "relevance": "low"
            }
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Project-wide audit obligation.",
            "priority_basis": {
              "relevance": "medium"
            }
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260901-003-002",
        "responsibility": "agent",
        "goal": "Implement a tested Today projection that derives only project-configuration blockers and explicit current-user intervention items from all relevant source states.",
        "reason": "The UI needs one stable source of truth for its two modes, multi-project counts, selection continuity, and exclusion of routine work and completed history.",
        "derived_from": [
          "FACT-20260901-003-001",
          "FACT-20260901-003-002",
          "FACT-20260901-003-003"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Pure projection implementation",
          "Behavior tests for configuration, intervention, filtering, ordering, and multi-project state"
        ]
      },
      "planned_transition": {
        "goal": "Implement and verify the pure Today workspace projection.",
        "expected_state_change": "The projection gap resolves and the real renderer gap becomes ready."
      },
      "accepted_state_delta": {
        "facts_added": [
          {
            "id": "FACT-20260901-003-004",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit now has a pure Today workspace projection that models exactly four project Automation prerequisites, stable multi-project configuration blockers, typed current-user responsibilities from Chat, Automation, Work and Feedback, project-scope filtering, minimal non-human status, source deduplication, and selection fallback without routine work or completed history.",
            "basis": "Implemented module and eight passing behavior tests, including repair of aggregate identity stability discovered by the first test run.",
            "evidence": [
              "runtime/arcorbit/src/desktop/today-workspace.mjs",
              "runtime/arcorbit/test/today-workspace.test.mjs",
              "Verification: node --test runtime/arcorbit/test/today-workspace.test.mjs; 8 passed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_gap": {
          "id": "GAP-20260901-003-002",
          "status": "resolved",
          "outcome": "Implemented and verified the canonical Today projection.",
          "reason": "The projection meets the bounded configuration, intervention, filtering, ordering, non-human summary, and continuity acceptance requirements.",
          "evidence": [
            "runtime/arcorbit/src/desktop/today-workspace.mjs",
            "runtime/arcorbit/test/today-workspace.test.mjs",
            "8 focused tests passed"
          ]
        },
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "completion_review_result": null,
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 334,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "The pure projection is realized, but the durable participation wording and full newcomer behavior remain unresolved.",
            "fact_refs": [
              "FACT-20260901-003-003",
              "FACT-20260901-003-004"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/today-workspace.mjs"
            ],
            "gap_refs": [
              "GAP-20260901-003-005"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The interaction source and tested projection preserve the two modes, filtering, continuity, and exclusion rules.",
            "fact_refs": [
              "FACT-20260901-003-001",
              "FACT-20260901-003-004"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "runtime/arcorbit/test/today-workspace.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "This round adds no visual behavior and preserves the accepted visual source for the next renderer gap.",
            "fact_refs": [
              "FACT-20260901-003-001"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/default.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "A side-effect-free projection separates derivation from source mutations inside the existing Desktop boundary.",
            "fact_refs": [
              "FACT-20260901-003-004"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/today-workspace.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The data model is realized but the live renderer and source actions still use the old Today surface.",
            "fact_refs": [
              "FACT-20260901-003-002",
              "FACT-20260901-003-004"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js:1701"
            ],
            "gap_refs": [
              "GAP-20260901-003-003",
              "GAP-20260901-003-004",
              "GAP-20260901-003-005"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Projection risks have focused tests, while integrated renderer and mutation risks still await regression evidence.",
            "fact_refs": [
              "FACT-20260901-003-004"
            ],
            "evidence": [
              "8 focused tests passed"
            ],
            "gap_refs": [
              "GAP-20260901-003-006"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/desktop/today-workspace.mjs",
        "runtime/arcorbit/test/today-workspace.test.mjs",
        "8 focused tests passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-01T18:38:52.152Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Replace the live Today dashboard with the accepted workspace using the tested projection.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The real Desktop layout is the only ready Today gap after the projection closeout.",
        "snapshot_token": "f981cdb0705a68036b2a5e8721cede71685c63bb8b106609a8586f53448378ba",
        "selected_ref": "case-gap:CASE-20260901-003:GAP-20260901-003-003",
        "comparison_summary": "The renderer gap is selected; source actions and onboarding remain dependency-blocked, verification remains blocked, and Project gaps are deferred.",
        "fresh_discovery_summary": "The updated renderer tests exposed two stale assertions for the removed dashboard; they were updated to assert the accepted workspace contract.",
        "considered": [
          {
            "ref": "case-gap:CASE-20260901-003:GAP-20260901-003-003",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "reason": "It is the sole ready implementation dependency.",
            "priority_basis": {
              "blocking": "high",
              "user_impact": "high"
            }
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate protocol evaluation.",
            "priority_basis": {
              "relevance": "low"
            }
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Runtime resilience work.",
            "priority_basis": {
              "relevance": "low"
            }
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate permission-bearing validation.",
            "priority_basis": {
              "relevance": "low"
            }
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate cross-record obligation.",
            "priority_basis": {
              "relevance": "medium"
            }
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260901-003-003",
        "responsibility": "agent",
        "goal": "Replace the old Today dashboard with the real desktop two-mode, three-column workspace and responsive selected-item operator.",
        "reason": "The accepted interaction must be realized in the actual Desktop chrome rather than as an isolated illustrative card.",
        "derived_from": [
          "FACT-20260901-003-002"
        ],
        "blocked_by": [
          "GAP-20260901-003-002"
        ],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "",
          "user_impact": "high"
        },
        "evidence_required": [
          "Updated Desktop markup, renderer, and styles",
          "Stable selection across refresh and multi-project changes"
        ]
      },
      "planned_transition": {
        "goal": "Replace the live Today dashboard with the accepted workspace using the tested projection.",
        "expected_state_change": "The renderer gap resolves and direct actions plus newcomer configuration become ready in parallel."
      },
      "accepted_state_delta": {
        "facts_added": [
          {
            "id": "FACT-20260901-003-005",
            "revision": 1,
            "status": "accepted",
            "statement": "The live ArcOrbit Desktop Today surface now uses the existing application navigation and a real three-column project rail, two-mode responsibility rail, and selected-item operator. It consumes the pure projection, owns Today project scope independently from Workset scope, preserves valid selection and per-item drafts across renders, shows only minimal automatic status, and collapses the project rail at narrower desktop widths.",
            "basis": "Implemented Desktop markup, renderer and styles with updated structural regression assertions.",
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css",
              "Verification: 71 focused and Desktop renderer tests passed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260901-003-001",
            "fact_id": "FACT-20260901-003-005",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 63
            },
            "effect": "threatened",
            "reason": "The accepted workspace layout is now realized, while direct source operations and the complete newcomer journey remain open.",
            "gap_ids": [
              "GAP-20260901-003-004",
              "GAP-20260901-003-005"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css"
            ]
          }
        ],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_gap": {
          "id": "GAP-20260901-003-003",
          "status": "resolved",
          "outcome": "Replaced the old Today dashboard with the real two-mode three-column Desktop workspace.",
          "reason": "Markup, renderer state, project and responsibility selection, operator context, draft preservation, minimal non-human summary, and responsive layout are implemented and regression-checked.",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/index.html",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/styles.css",
            "71 tests passed"
          ]
        },
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "completion_review_result": null,
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 334,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "The workspace is realized but source operations and participation wording remain open.",
            "fact_refs": [
              "FACT-20260901-003-003",
              "FACT-20260901-003-005"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": [
              "GAP-20260901-003-004",
              "GAP-20260901-003-005"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The durable interaction and live workspace now agree on navigation, modes, rails, context, selection and responsive priority.",
            "fact_refs": [
              "FACT-20260901-003-001",
              "FACT-20260901-003-005"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/index.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "Today reuses existing neutral surfaces, tokens, controls, focus behavior and main application chrome.",
            "fact_refs": [
              "FACT-20260901-003-005"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/styles.css",
              "runtime/arcorbit/desktop/renderer/index.html"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The renderer consumes a pure projection and keeps view-only selection and drafts in renderer state without creating a second business state machine.",
            "fact_refs": [
              "FACT-20260901-003-004",
              "FACT-20260901-003-005"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/today-workspace.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The accepted workspace layout is realized, but its buttons do not yet execute all source-backed actions and first-use paths.",
            "fact_refs": [
              "FACT-20260901-003-001",
              "FACT-20260901-003-005"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": [
              "GAP-20260901-003-004",
              "GAP-20260901-003-005"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Structural renderer evidence is green; mutation and broader regression evidence remain pending.",
            "fact_refs": [
              "FACT-20260901-003-005"
            ],
            "evidence": [
              "71 focused and renderer tests passed"
            ],
            "gap_refs": [
              "GAP-20260901-003-006"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/desktop/renderer/index.html",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "71 tests passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-01T18:44:32.724Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Connect every supported Today responsibility to its existing typed source action and preserve continuity through source confirmation or failure.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Direct source operations carry the higher mutation risk and unlock a reusable confirmation framework for the remaining newcomer gap.",
        "snapshot_token": "4d112829ec5ff47c94113b771d55bbb0dae1db99ffc674e7780f6e27bd08bdc5",
        "selected_ref": "case-gap:CASE-20260901-003:GAP-20260901-003-004",
        "comparison_summary": "Direct actions are selected over the also-ready newcomer gap because they are the core Today outcome and highest-risk cross-source boundary; Project gaps remain outside this Case focus.",
        "fresh_discovery_summary": "Implementation required a cross-session pending-approval projection and project identity on Feedback partial-link recoveries; both were completed within the selected gap.",
        "considered": [
          {
            "ref": "case-gap:CASE-20260901-003:GAP-20260901-003-004",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "reason": "Highest-risk core user outcome: complete explicit responsibilities in place.",
            "priority_basis": {
              "risk": "high",
              "user_impact": "high"
            }
          },
          {
            "ref": "case-gap:CASE-20260901-003:GAP-20260901-003-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "reason": "Newcomer orchestration can reuse the source-action lifecycle established here.",
            "priority_basis": {
              "dependency": "action lifecycle",
              "user_impact": "high"
            }
          },
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate protocol evaluation.",
            "priority_basis": {
              "relevance": "low"
            }
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate Runtime resilience work.",
            "priority_basis": {
              "relevance": "low"
            }
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate permission-bearing validation.",
            "priority_basis": {
              "relevance": "low"
            }
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "reason": "Separate cross-record obligation.",
            "priority_basis": {
              "relevance": "medium"
            }
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260901-003-004",
        "responsibility": "agent",
        "goal": "Wire Today operator actions directly to their source capabilities with drafts, pending state, source confirmation, errors, and bounded handoff continuity.",
        "reason": "Today only solves human intervention when each surfaced item can actually be completed in place and safely disappears after source confirmation.",
        "derived_from": [
          "FACT-20260901-003-001",
          "FACT-20260901-003-003"
        ],
        "blocked_by": [
          "GAP-20260901-003-003"
        ],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Direct actions for supported Work, Automation, Feedback, Chat, and project setup sources",
          "Behavior evidence for success, partial success, stale items, and retry"
        ]
      },
      "planned_transition": {
        "goal": "Connect every supported Today responsibility to its existing typed source action and preserve continuity through source confirmation or failure.",
        "expected_state_change": "The direct-action gap resolves, leaving newcomer orchestration as the only implementation gap."
      },
      "accepted_state_delta": {
        "facts_added": [
          {
            "id": "FACT-20260901-003-006",
            "revision": 1,
            "status": "accepted",
            "statement": "Today now directly executes typed Chat approval decisions across sessions; Automation intervention, external-dependency and recovery actions; Work review, acceptance, acceptance-issue and blocked-state actions; Feedback partial-link recovery; and project binding, Setup, participation and source-retry actions. It locks only the submitted item, preserves drafts and selection on error, requires source refresh before success, briefly shows the confirmed source result, then removes the responsibility and selects the next valid item.",
            "basis": "Implemented source projections, renderer action dispatcher, continuity feedback and focused/static behavior coverage over existing typed IPC capabilities.",
            "evidence": [
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "runtime/arcorbit/src/desktop/today-workspace.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/chat-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: 85 tests passed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260901-003-001",
            "fact_id": "FACT-20260901-003-006",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 63
            },
            "effect": "threatened",
            "reason": "The real workspace and direct source operations are realized; the complete newcomer and add-project journey remains open.",
            "gap_ids": [
              "GAP-20260901-003-005"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/src/chat-coordinator.mjs"
            ]
          }
        ],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_gap": {
          "id": "GAP-20260901-003-004",
          "status": "resolved",
          "outcome": "Wired supported Today responsibilities to typed source actions with source-confirmed continuity.",
          "reason": "Chat, Automation, Work, Feedback and project setup actions execute in Today; item-scoped pending, retained errors/drafts, fresh confirmation, transient result and adjacent fallback are implemented.",
          "evidence": [
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/src/chat-coordinator.mjs",
            "runtime/arcorbit/test/chat-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "85 tests passed"
          ]
        },
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "completion_review_result": null,
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 334,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "Direct responsibility completion is realized; newcomer project acquisition and durable participation wording remain open.",
            "fact_refs": [
              "FACT-20260901-003-003",
              "FACT-20260901-003-006"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": [
              "GAP-20260901-003-005"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Typed actions, drafts, current-item locking, source confirmation, error retention and adjacent selection match the durable interaction source.",
            "fact_refs": [
              "FACT-20260901-003-001",
              "FACT-20260901-003-006"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "Pending, success and error feedback reuse the established Desktop control and status language.",
            "fact_refs": [
              "FACT-20260901-003-006"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/styles.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Today delegates mutations to existing typed Chat, Automation, Platform and Setup capabilities and creates no second business state owner.",
            "fact_refs": [
              "FACT-20260901-003-003",
              "FACT-20260901-003-006"
            ],
            "evidence": [
              "runtime/arcorbit/src/chat-coordinator.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The core workspace and direct actions are realized; the full first-use acquisition and Work handoff remain incomplete.",
            "fact_refs": [
              "FACT-20260901-003-001",
              "FACT-20260901-003-006"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": [
              "GAP-20260901-003-005"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Relevant source and renderer suites pass, while full regression and GUI evidence remain pending.",
            "fact_refs": [
              "FACT-20260901-003-006"
            ],
            "evidence": [
              "85 tests passed"
            ],
            "gap_refs": [
              "GAP-20260901-003-006"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/chat-coordinator.mjs",
        "runtime/arcorbit/src/desktop/today-workspace.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "85 tests passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-01T18:50:01.439Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Realize the continuous first-use and multi-project Today configuration journey without routine-work management.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "This is the only ready Agent-owned Case gap that directly blocks the accepted Today journey; verification depends on it and Project gaps require separate Case scope.",
        "snapshot_token": "7675697160bb88984a9a31d6f932925de6bd1867f0f41a00645b4324b7b3b81f",
        "selected_ref": "case-gap:CASE-20260901-003:GAP-20260901-003-005",
        "comparison_summary": "Selected the high-impact ready Today gap over four repository-level gaps; the latter are outside this bounded Case. The remaining Today verification gap is still dependency-blocked.",
        "fresh_discovery_summary": "No additional unpersisted obligation was found; full regression and GUI-proportionate verification remain in GAP-20260901-003-006.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "Requires isolated scenario-evaluation scope and is not a prerequisite for the Today newcomer journey."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Requires a dedicated Runtime resilience Case and does not block bounded Today implementation."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Requires a real permission-bearing project and separate authorization-sensitive evidence."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "Requires its own cross-record audit Case; this transition still uses the trusted atomic ledger boundary."
          },
          {
            "ref": "case-gap:CASE-20260901-003:GAP-20260901-003-005",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "user_impact": "high"
            },
            "reason": "Completes first-use acquisition, multi-project independence, local participation, restart continuity, and the Work handoff."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260901-003-005",
        "responsibility": "agent",
        "goal": "Complete the newcomer and multi-project configuration journey through add/select, local binding, setup checks, local participation, and handoff to Work task creation.",
        "reason": "The user requires a continuous first-use journey and realistic parallel-project states without turning Today into routine work management.",
        "derived_from": [
          "FACT-20260901-003-001",
          "FACT-20260901-003-003"
        ],
        "blocked_by": [
          "GAP-20260901-003-003"
        ],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "",
          "user_impact": "high"
        },
        "evidence_required": [
          "End-to-end newcomer state progression",
          "Multi-project configuration and handoff behavior tests"
        ]
      },
      "planned_transition": {
        "goal": "Realize the continuous first-use and multi-project Today configuration journey without routine-work management.",
        "expected_state_change": "The newcomer configuration Gap is resolved with durable project scope, three-source acquisition, independent project readiness, restart continuity and a Work-only handoff.",
        "actions": [
          "Persist Today project scope and continuity",
          "Implement three-source in-place project acquisition",
          "Keep required human intervention visible outside local scope",
          "Verify migration, projection, IPC and renderer behavior"
        ],
        "success_criteria": [
          "Empty first-use state",
          "Independent multi-project setup",
          "Local participation",
          "Restart continuity",
          "Work-only handoff"
        ]
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260901-003-005",
          "status": "resolved",
          "outcome": "Implemented the complete newcomer and multi-project configuration journey inside the real Today workspace.",
          "reason": "Today now owns a durable project range, all three acquisition sources, parallel prerequisites, current-device participation, restart continuity, and a Work-only ready handoff.",
          "evidence": [
            "runtime/arcorbit/src/desktop/desktop-store.mjs",
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/src/desktop/today-workspace.mjs",
            "runtime/arcorbit/desktop/main.mjs",
            "runtime/arcorbit/desktop/preload.cjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/test/today-workspace.test.mjs",
            "runtime/arcorbit/test/desktop-store.test.mjs",
            "runtime/arcorbit/test/platform-coordinator.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "Verification: 104 focused tests passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260901-003-007",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Today now implements the continuous newcomer and multi-project configuration journey: a new store starts with no Today projects; an in-place Sheet can create one personal project, add multiple accessible projects, or join by project or organization invitation; each selected project independently advances through access, local repository binding, project Setup readiness, and current-user current-device Automation participation; ready projects leave the configuration list and expose only a handoff to Work. Today project scope, mode, valid selection, and bounded per-responsibility drafts persist across restart, while a human responsibility from an unselected project remains visible so Workset or local scope cannot hide required intervention.",
            "basis": "Implemented the Desktop Store migration, typed platform IPC, all-project Today task projection, in-place acquisition Sheet, persistent continuity state, per-project setup cache, and ready-to-Work handoff with focused tests.",
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/src/desktop/today-workspace.mjs",
              "runtime/arcorbit/desktop/main.mjs",
              "runtime/arcorbit/desktop/preload.cjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/today-workspace.test.mjs",
              "runtime/arcorbit/test/desktop-store.test.mjs",
              "runtime/arcorbit/test/platform-coordinator.test.mjs",
              "runtime/arcorbit/test/desktop-renderer.test.mjs",
              "Verification: 104 focused tests passed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-20260901-003-001",
            "fact_id": "FACT-20260901-003-007",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 64
            },
            "effect": "upheld",
            "reason": "The real Today workspace now realizes the complete in-place newcomer path, multi-project continuity, local participation and Work-only handoff.",
            "gap_ids": [],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/test/desktop-renderer.test.mjs"
            ]
          },
          {
            "id": "IMPACT-20260901-003-002",
            "fact_id": "FACT-20260901-003-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 42
            },
            "effect": "upheld",
            "reason": "The capability statement now matches the local current-device participation boundary while remote governance remains role-controlled.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs"
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
        "software_definition_changes": [
          {
            "area_ref": "product_capabilities",
            "observed_revision": 41,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保留既有 Desktop、Runtime、Chat、Automation、Feedback 与 Work 能力和边界。Work 是 Workshop 待办同步与本地 Task Projection 的唯一客户端所有者；新建和编辑 Sheet 提供完整七状态，编辑 Sheet 是异常纠偏兜底，Inspector 按当前状态提供有限下一步动作。Work Inspector 默认更宽，支持可访问拖拽调宽与跨应用重启恢复，并使用内容、紧凑属性、协作和验收语义分区。Work 编辑待办允许把内容复制到当前产品集内另一个可写产品，并在目标创建获 Workshop 确认后删除源 Task。目标 Task 获得新身份，仅复制正文、状态、优先级及目标产品内重新选择的关联字段，不继承评论、附件、Run、session、thread、Gate 或验收问题。Work 负责两阶段 mutation 和部分成功恢复；Automation 只消费服务器确认后的本地状态。Setup Readiness 在应用冷启动时 fresh-check Desktop Store 中全部已关联本地项目相对于内置 payload 的 skill drift；新增或改变本地项目关联及用户主动重试会再次检查。项目集、具体项目、Workset 等纯查看切换、解除关联和 task start 不重新扫描 skills，task start 只消费已验证缓存并 fail closed。trusted Case binding 的既有能力和边界保持不变。Setup Readiness 对同名项目 skill、loader、共享资源和用户按需 catalog 冲突保留 typed diagnostic；当 provider 证明安全目标与唯一内置来源时，用户可逐项选择“备份并使用当前应用包覆盖所选同名 skill”，未选和无关内容保持不变。Feedback 中已忽略且未关联待办的反馈可恢复为待处理，恢复只在服务端确认 pending 后生效。Today、Work、Automation 与 Organization 必须从同一可访问 Project Catalog 得到项目身份；项目存在、项目绑定、同步就绪和执行资格彼此独立，项目详情同步失败不得使项目消失。任何能够访问 Project Catalog 中项目的当前成员，无论 owner、admin 或 member，均可在自己的设备选择、变更或解除该项目的本地工作区绑定；该绑定只更新 Desktop 本地 Workspace Control；Automation project participation 同样是当前用户当前设备的本地执行范围选择，但二者彼此独立，且都不等同于项目事实编辑、邀请或成员管理等远端治理授权。Codex Setup 维护完整 installation inventory 与唯一 active binding，按 execution scope 和 owner 证明选择既有安装、生成安装建议、检查更新并在 mutation 后复验实际 executable；更新查询失败不把健康 Codex 降级为未安装。 Today 是跨项目人工责任工作台，只承载新人项目配置与 Chat、Automation、Work、Feedback 已明确交给当前用户且可直接操作的责任；不展示普通工作、下一工作、完成历史或完整自动进度。Today 项目范围是当前设备上的独立持久偏好，不受 Workset 裁剪，但任何未选择项目的明确人工责任仍必须显现；项目 ready 后只引导到 Work 新建待办。",
              "reason": "Today 的产品边界和 participation 所有权已经由交互源及真实 Desktop 实现共同确立，需要从长期能力定义中消除管理员等待和 Workset 裁剪的歧义。",
              "evidence": [
                "Current operator input, 2026-08-30",
                "arckit/spec/agentic-software-development/arcorbit-organization-management.md",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/src/desktop/today-guidance.mjs",
                "Current operator input, 2026-09-02",
                "arckit/interaction/today-workspace/interaction.md",
                "runtime/arcorbit/src/desktop/today-workspace.mjs",
                "runtime/arcorbit/src/desktop/desktop-store.mjs"
              ],
              "confidence": "high",
              "resume_condition": "当 Today 人工责任收录边界、当前设备项目范围、Project Catalog 可访问性或远端治理授权模型改变时重审。"
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "Align durable capability ownership and scope with the realized Today behavior.",
            "evidence": [
              "FACT-20260901-003-003",
              "FACT-20260901-003-007",
              "arckit/interaction/today-workspace/interaction.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 63,
            "set_decision": {
              "status": "settled",
              "statement": "ArcOrbit 保持既有 Personal、Product Lifecycle、Organization 导航与 Work、Automation、Feedback、Chat 等交互语义。Work 新建和编辑 Sheet 保留完整七状态，编辑 Sheet 承担异常纠偏；右侧 Inspector 按当前状态显示有限下一步动作。Work Inspector 首次使用 440px，用户可通过 12px 可访问分隔条在 360–640px 保存范围内拖拽、键盘调整或双击复位，偏好跨任务、项目、Workset 和应用重启恢复。布局为任务树保留至少 420px，窗口临时收窄只改变有效宽度且不覆盖保存值。Inspector 以单一内部滚动区组织身份动作、内容、紧凑属性、协作和按状态出现的验收分区，宽度变化不丢失选择、滚动、草稿或附件状态。验收问题条目的问题原文与进展文本在 Inspector 当前可用宽度内完整折行且不横向越界，状态徽标保持清晰可见。Work 已完成列表按新完成在上、历史完成在下排列；标记首项为已验收后选择下一条较旧待办，标记其他位置后选择相邻较新待办，树补全项不参与目标计算，且选择只在服务器确认成功后切换。验收请求期间允许浏览其他任务；若用户在服务器确认前产生较新的选择，成功回调保留该选择而不执行旧任务的自动相邻切换。Work 新建待办 Sheet 在执行人控件下根据执行人与状态原位解释 Automation 资格。跨产品替换、主窗口和 Case 绑定恢复的既有交互保持不变。应用冷启动检查全部关联本地项目；新增或改变本地关联及用户主动重试再次检查。项目集全部、具体项目、Workset 或其它纯查看切换只改变业务投影，不进入 Setup；解除关联和 task start 不重新扫描 skills。task start 缓存断言失败时返回 Setup，等待用户主动重新检查。Setup 冲突页逐项显示稳定 code、skill、目标类型与路径及双方 digest；兜底覆盖默认全不选，支持逐项或全选可恢复项，独立确认 recovery root 与 fresh assessment digest，并反馈备份、替换、回滚和残留状态。Feedback 已忽略且未关联待办的详情显示“恢复为待处理”；动作无需二次确认，提交期间锁定自身，只有服务端确认 pending 后更新状态，失败时保持 ignored、筛选、选择和滚动位置。受支持旧版本覆盖安装后，Automation 先恢复 Catalog 项目行并保留 Workset、绑定和项目授权，再逐项目显示正在恢复、同步异常或可执行；用户无需退出登录、清缓存或重新添加项目。Automation 顶层责任只区分可自行继续与需要人工介入；external、recovery、configuration 与 CLI 保留为原因或处理场所，任何必须由操作者动作触发的下一步都显示 Human。external dependency 创建 attention，并通过“已处理，重新检查”恢复同一 task session/thread。Workset Feedback V2 沟通记录在首次选择和 fresh notification snapshot 标记当前反馈有未读回复时自动重新拉取消息；页面级、详情级和沟通记录的手动刷新均同时刷新反馈事实、通知与当前会话。消息成功加载后才标记已读；失败时保留旧消息和重试入口；刷新不得丢失回复草稿、附件选择或 Inspector 滚动上下文。Today 使用既有主导航中的 Personal 入口和项目栏、责任栏、操作台三栏桌面工作区，仅提供“需要你处理”和“项目配置”两个模式。首次使用在 Today 内以 Sheet 新建个人项目、一次选择多个可访问项目或使用邀请加入；各项目独立推进访问、本地目录、项目 Setup 与当前用户当前设备的 Automation participation，任一 ready 后只引导到 Work。Today 不显示下一工作、普通待办、已处理历史或完整自动进度；非人工状态只有可工作、推进中、自动恢复和未知来源的最小摘要。项目栏不受 Workset 裁剪，未选择项目的明确人工责任仍强制显现。提交只锁定当前责任项，来源确认后短暂显示结果再移除；失败保留草稿和选择，项目范围、模式、选择与草稿跨应用重启恢复。Chat、Organization、Today、Work 与 Automation 对缺失本地目录的可访问项目均向当前用户提供“选择本地目录”；本地目录绑定和 Automation participation 都是当前用户当前设备可直接完成的选择，只有项目事实编辑、邀请和成员管理等远端治理动作才按 owner/admin 角色显示 handoff 或管理操作。",
              "reason": "完整 Today 交互已经从确认稿落实到真实 Desktop，需要长期交互定义明确新人连续路径、多项目并行、直接人工操作、状态连续性与本地 participation 所有权。",
              "evidence": [
                "Current operator input, 2026-08-30",
                "arckit/interaction/today-workspace/interaction.md",
                "arckit/interaction/chat-workspace/interaction.md",
                "arckit/interaction/automation-workspace/interaction.md",
                "arckit/interaction/task-browser/interaction.md",
                "arckit/interaction/platform-workspace/interaction.md",
                "Current operator input, 2026-09-02",
                "arckit/interaction/today-workspace/readiness-details.html",
                "arckit/interaction/today-workspace/action-details.html",
                "arckit/interaction/today-workspace/action-continuity.html",
                "runtime/arcorbit/desktop/renderer/renderer.js"
              ],
              "confidence": "high",
              "resume_condition": "当 Today 的责任来源、项目配置完成口径、直接动作恢复语义或主导航结构改变时重审。"
            },
            "gap_refs": [],
            "reason": "Record the complete accepted newcomer, multi-project and direct-action interaction journey.",
            "evidence": [
              "FACT-20260901-003-001",
              "FACT-20260901-003-007",
              "arckit/interaction/today-workspace/interaction.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "FACT-20260901-003-003",
          "FACT-20260901-003-007",
          "arckit/interaction/today-workspace/interaction.md",
          "runtime/arcorbit/desktop/renderer/renderer.js"
        ]
      },
      "invariant_assessment": {
        "project_revision": 334,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The stable Today boundary, local project scope, four prerequisites, participation ownership and Work-only handoff are explicit in durable product evidence.",
            "fact_refs": [
              "FACT-20260901-003-003",
              "FACT-20260901-003-007"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "arckit/project/state.record.json"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The newcomer path, parallel states, in-place sources, restart continuity and Work handoff match the interaction source.",
            "fact_refs": [
              "FACT-20260901-003-001",
              "FACT-20260901-003-007"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "The flow reuses established Sheet, field, checkbox, button, banner and three-column Desktop language without another navigation group.",
            "fact_refs": [
              "FACT-20260901-003-007"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/index.html",
              "runtime/arcorbit/desktop/renderer/styles.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Today remains a projection over typed source capabilities; only bounded local scope and continuity preferences were added to Desktop Store and typed IPC.",
            "fact_refs": [
              "FACT-20260901-003-003",
              "FACT-20260901-003-007"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/desktop-store.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The real Desktop realizes the newcomer and multi-project behavior claimed by the accepted Today target.",
            "fact_refs": [
              "FACT-20260901-003-001",
              "FACT-20260901-003-007"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/today-workspace.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "104 focused tests passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Focused suites pass, while the persisted verification Gap still requires full regression and GUI-proportionate evidence.",
            "fact_refs": [
              "FACT-20260901-003-007"
            ],
            "evidence": [
              "104 focused tests passed"
            ],
            "gap_refs": [
              "GAP-20260901-003-006"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/desktop/desktop-store.mjs",
        "runtime/arcorbit/src/platform-coordinator.mjs",
        "runtime/arcorbit/src/desktop/today-workspace.mjs",
        "runtime/arcorbit/desktop/main.mjs",
        "runtime/arcorbit/desktop/preload.cjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/test/today-workspace.test.mjs",
        "runtime/arcorbit/test/desktop-store.test.mjs",
        "runtime/arcorbit/test/platform-coordinator.test.mjs",
        "runtime/arcorbit/test/desktop-renderer.test.mjs",
        "Verification: 104 focused tests passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-01T19:02:46.559Z"
    },
    {
      "round": 6,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Verify the complete Today workspace, repair discovered interaction gaps, and establish credible completion evidence.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The only ready Agent-owned obligation in this Today Case is full regression and GUI-proportionate verification; all implementation gaps are already resolved and the repository-level gaps require separate Case scope.",
        "snapshot_token": "b1aa76bf21a09be9b18a1419ebc64bad7cf681d42daf1ed92feb037f6932035c",
        "selected_ref": "case-gap:CASE-20260901-003:GAP-20260901-003-006",
        "comparison_summary": "Selected the final Today verification gap over four unrelated Project gaps. Verification also exercised and repaired setup presentation, Today-scope accounting, source context, partial-success recovery, visual sizing and responsive layout.",
        "fresh_discovery_summary": "No additional unpersisted Today obligation remains after the repair-and-rerun cycle; completion review must still run as a separate Loop candidate.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "This broader scenario-evaluation obligation requires a separate Case and does not block the bounded Today verification."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Runtime resilience work is outside the Today renderer and projection verification boundary."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "This requires a separate real permission-bearing project and is not part of the local Today implementation proof."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "The transition uses the trusted ledger boundary, while the broader cross-record audit remains separate Project work."
          },
          {
            "ref": "case-gap:CASE-20260901-003:GAP-20260901-003-006",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "risk": "high"
            },
            "reason": "It is the final implementation-scoped obligation and directly gates credible completion review."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-20260901-003-006",
        "responsibility": "agent",
        "goal": "Run focused and regression verification, repair findings, and prove the full accepted Today interaction against the real Desktop implementation.",
        "reason": "The cross-source workspace changes high-traffic renderer behavior and requires credible behavior and regression evidence before completion review.",
        "derived_from": [
          "FACT-20260901-003-001",
          "FACT-20260901-003-002",
          "FACT-20260901-003-003"
        ],
        "blocked_by": [
          "GAP-20260901-003-002",
          "GAP-20260901-003-003",
          "GAP-20260901-003-004",
          "GAP-20260901-003-005"
        ],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "Focused Today tests",
          "Relevant Desktop regression suite",
          "Static or GUI interaction evidence proportionate to changed behavior"
        ]
      },
      "planned_transition": {
        "goal": "Verify the complete Today workspace, repair discovered interaction gaps, and establish credible completion evidence.",
        "expected_state_change": "The final ordinary Case gap resolves with full non-GUI regression, direct Electron GUI evidence and repaired findings; a separate completion review becomes ready.",
        "actions": [
          "Run focused and repository regression suites",
          "Exercise real Electron layouts and recovery sheets",
          "Repair findings and rerun all affected evidence"
        ],
        "success_criteria": [
          "No non-GUI regression failures",
          "Real desktop three-column and responsive behavior",
          "Direct source and setup recovery remain bounded",
          "No unresolved Today acceptance gap"
        ]
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-20260901-003-006",
          "status": "resolved",
          "outcome": "Verified the complete Today workspace and repaired every material finding discovered by regression and real Electron inspection.",
          "reason": "All 588 non-Electron tests completed with 564 passing and 24 intentionally skipped; both sandbox-blocked Electron wrappers were executed directly and passed; the GUI audit found no undersized visible text or control-target violations and confirmed the three-column and narrow two-column layouts.",
          "evidence": [
            "Verification: 588 non-Electron tests; 564 passed, 24 skipped, 0 failed",
            "runtime/arcorbit/test/experience-realization-electron.test.mjs",
            "Direct Electron fixture: experience-realization-electron.mjs passed with 0 visual/control violations",
            "Direct Electron fixture: task-replacement-sheet-electron.mjs passed with preserved drafts, retry recovery and no renderer errors",
            "runtime/arcorbit/test/today-workspace.test.mjs",
            "runtime/arcorbit/test/desktop-renderer.test.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/desktop/renderer/styles.css"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-20260901-003-008",
            "revision": 1,
            "status": "accepted",
            "statement": "The implemented Today workspace now passes the complete non-Electron ArcOrbit regression suite and direct Electron desktop verification. The repair cycle eliminated undersized Today text, confined configuration counts and ready handoff to the explicit Today project scope, kept project Setup checks and confirmed write/recovery inside Today instead of reopening the startup gate, added source-specific operator evidence, and promoted cross-project Work replacement partial success into a directly actionable Today responsibility.",
            "basis": "Full regression, direct Electron fixtures and targeted repair reruns against the accepted Today interaction source.",
            "evidence": [
              "Verification: 588 non-Electron tests; 564 passed, 24 skipped, 0 failed",
              "Direct Electron fixture: 3 Today columns at 1440px and 2 columns at 1100px",
              "Direct Electron fixture: 0 visible text, control-size, checkbox-target or selectable-row violations",
              "Direct Electron task-replacement fixture: source-delete recovery passed with no renderer errors",
              "runtime/arcorbit/src/desktop/today-workspace.mjs",
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "runtime/arcorbit/desktop/renderer/styles.css"
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
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 335,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The final implementation and tests preserve the bounded Today capability: newcomer setup plus explicit human responsibility, with routine work excluded.",
            "fact_refs": [
              "FACT-20260901-003-007",
              "FACT-20260901-003-008"
            ],
            "evidence": [
              "arckit/project/state.record.json",
              "runtime/arcorbit/src/desktop/today-workspace.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Newcomer, multi-project, setup, cross-source operator and continuity behaviors are traceable from the interaction source to implementation and direct GUI evidence.",
            "fact_refs": [
              "FACT-20260901-003-001",
              "FACT-20260901-003-008"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "Direct Electron inspection confirms the existing application navigation, three-pane desktop proportions, responsive collapse, readable text and valid control targets.",
            "fact_refs": [
              "FACT-20260901-003-008"
            ],
            "evidence": [
              "runtime/arcorbit/test/fixtures/experience-realization-electron.mjs",
              "runtime/arcorbit/desktop/renderer/styles.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Today remains a pure projection plus typed source actions, bounded IPC and persisted local preferences; direct Setup operations reuse the existing trusted main-process capabilities.",
            "fact_refs": [
              "FACT-20260901-003-003",
              "FACT-20260901-003-008"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/today-workspace.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Focused, full-regression and real Electron evidence jointly demonstrate the accepted interaction in the live Desktop implementation.",
            "fact_refs": [
              "FACT-20260901-003-001",
              "FACT-20260901-003-007",
              "FACT-20260901-003-008"
            ],
            "evidence": [
              "Verification: 588 non-Electron tests with 0 failures",
              "Direct Electron Today and recovery fixtures passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Renderer regression, source-action recovery, restart state, multi-project projection and desktop layout risks now have passing automated or direct Electron evidence.",
            "fact_refs": [
              "FACT-20260901-003-008"
            ],
            "evidence": [
              "Verification: 588 non-Electron tests; 564 passed, 24 skipped",
              "Direct Electron fixtures passed with no renderer errors"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/desktop/today-workspace.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "runtime/arcorbit/desktop/renderer/styles.css",
        "runtime/arcorbit/test/today-workspace.test.mjs",
        "runtime/arcorbit/test/experience-realization-electron.test.mjs",
        "runtime/arcorbit/test/fixtures/task-replacement-sheet-electron.mjs",
        "Verification: 588 non-Electron tests; 564 passed, 24 skipped, 0 failed",
        "Direct Electron GUI and recovery fixtures passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-01T19:24:45.210Z"
    },
    {
      "round": 7,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Perform the final five-dimension semantic completion review for the implemented Today workspace.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Today gaps and impacts are closed. A fresh five-dimension audit found no more important ordinary work, so the derived completion review is the only ready Agent-owned obligation in this Case.",
        "snapshot_token": "8d84a9192212d3cc53cfc2c0fe561bf1c988321cdeea8e40353b6f6a8f007778",
        "selected_ref": "case-gap:CASE-20260901-003:CASE-20260901-003:completion-review:1",
        "comparison_summary": "Selected the Today completion review over four unrelated Project gaps. The review compared the original goal, accepted interaction, implementation diff, regression evidence and direct Electron behavior.",
        "fresh_discovery_summary": "No correctness, omission, excess, credibility or regression finding remains; no fresh ordinary gap supersedes the completion review.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "uncertainty": "high",
              "risk": "high"
            },
            "reason": "This is broader Project-level scenario evaluation and not a finding in the completed Today implementation."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Runtime resilience remains separate Project work and did not produce a Today completion finding."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Real permission-bearing validation requires separate scope and authority; Today continues to reuse bounded existing capabilities."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "The broader ledger audit remains separate Project work and is not a defect in this Case result."
          },
          {
            "ref": "case-gap:CASE-20260901-003:CASE-20260901-003:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the only remaining obligation for the user's requested state-driven implementation Loop."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260901-003:completion-review:1",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:6"
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
        "goal": "Perform the final five-dimension semantic completion review for the implemented Today workspace.",
        "expected_state_change": "A clean review binds content revision 6 and closes the Today implementation Case.",
        "actions": [
          "Audit accepted facts against implementation",
          "Audit problem closure and source responsibility boundaries",
          "Audit verification credibility, regressions and minimality"
        ],
        "success_criteria": [
          "All five review dimensions are clean",
          "No finding requires another ordinary gap",
          "The deterministic Case audit resolves"
        ]
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
        "completion_review_result": {
          "outcome": "clean",
          "reviewer": "agent",
          "reviewed_content_revision": 6,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "arckit/interaction/today-workspace/interaction.md",
            "runtime/arcorbit/src/desktop/today-workspace.mjs",
            "runtime/arcorbit/desktop/renderer/renderer.js",
            "runtime/arcorbit/src/platform-coordinator.mjs",
            "runtime/arcorbit/src/desktop/desktop-store.mjs",
            "Verification rerun: 588 non-Electron tests; 564 passed, 24 skipped, 0 failed",
            "Direct Electron Today layout fixture passed with 0 visual/control violations",
            "Direct Electron task replacement recovery fixture passed with no renderer errors",
            "git diff --check passed"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "project_state_delta": {
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 335,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The completed implementation preserves the accepted product boundary and explicit current-user responsibility rule without adding routine-work scope.",
            "fact_refs": [
              "FACT-20260901-003-007",
              "FACT-20260901-003-008"
            ],
            "evidence": [
              "arckit/project/state.record.json",
              "runtime/arcorbit/src/desktop/today-workspace.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The accepted newcomer, multi-project, direct-operation and continuity expectations remain explicit and traceable to the live renderer.",
            "fact_refs": [
              "FACT-20260901-003-001",
              "FACT-20260901-003-008"
            ],
            "evidence": [
              "arckit/interaction/today-workspace/interaction.md",
              "runtime/arcorbit/desktop/renderer/renderer.js"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "upheld",
            "reason": "The final visual audit confirms established navigation, readable typography, valid controls and responsive desktop panes.",
            "fact_refs": [
              "FACT-20260901-003-008"
            ],
            "evidence": [
              "runtime/arcorbit/test/fixtures/experience-realization-electron.mjs",
              "runtime/arcorbit/desktop/renderer/styles.css"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The implementation remains a bounded projection over existing typed source capabilities with explicit local persistence and no duplicate business state machine.",
            "fact_refs": [
              "FACT-20260901-003-003",
              "FACT-20260901-003-008"
            ],
            "evidence": [
              "runtime/arcorbit/src/desktop/today-workspace.mjs",
              "runtime/arcorbit/src/platform-coordinator.mjs",
              "runtime/arcorbit/desktop/preload.cjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The clean review found the accepted Today facts realized across projection, live UI, persistence, direct actions and source-confirmed removal.",
            "fact_refs": [
              "FACT-20260901-003-001",
              "FACT-20260901-003-007",
              "FACT-20260901-003-008"
            ],
            "evidence": [
              "runtime/arcorbit/desktop/renderer/renderer.js",
              "Verification: 588 non-Electron tests and direct Electron fixtures passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The latest full regression rerun, targeted responsibility tests and direct Electron fixtures cover the material state, action, recovery and layout risks.",
            "fact_refs": [
              "FACT-20260901-003-008"
            ],
            "evidence": [
              "Verification rerun: 588 non-Electron tests; 564 passed, 24 skipped, 0 failed",
              "Direct Electron fixtures passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "Completion review of content revision 6",
        "arckit/interaction/today-workspace/interaction.md",
        "runtime/arcorbit/src/desktop/today-workspace.mjs",
        "runtime/arcorbit/desktop/renderer/renderer.js",
        "Verification rerun: 588 non-Electron tests; 564 passed, 24 skipped, 0 failed",
        "Direct Electron GUI and recovery fixtures passed",
        "git diff --check passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-09-01T19:27:40.512Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-20260901-003-001",
      "GAP-20260901-003-002",
      "GAP-20260901-003-003",
      "GAP-20260901-003-004",
      "GAP-20260901-003-005",
      "GAP-20260901-003-006"
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
    "updated_at": "2026-09-01T19:27:40.512Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
