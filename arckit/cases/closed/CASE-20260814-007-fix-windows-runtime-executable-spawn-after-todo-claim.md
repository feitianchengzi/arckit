# Fix Windows runtime executable spawn after todo claim

Case: CASE-20260814-007
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-14T14:23:15.863Z

## User Intent

Diagnose and fix the Windows Desktop failure that raises ENOENT while spawning the installed arckit-runtime executable after a user claims a todo.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260814-007",
  "title": "Fix Windows runtime executable spawn after todo claim",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-14T14:12:03.563Z",
  "updated_at": "2026-08-14T14:23:15.863Z",
  "user_intent": "Diagnose and fix the Windows Desktop failure that raises ENOENT while spawning the installed arckit-runtime executable after a user claims a todo.",
  "expected_outcome": "A packaged Windows installation can locate and launch the runtime executable after a todo is claimed, with regression evidence covering the installed-path contract.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-WIN-SPAWN-001",
      "revision": 1,
      "status": "accepted",
      "statement": "On Windows, claiming a todo currently fails with spawn C:\\Users\\Liuzhongyuan\\AppData\\Local\\Programs\\arckit-runtime\\arckit-runtime.exe ENOENT.",
      "basis": "The user supplied the exact failure from an installed Windows environment.",
      "evidence": [
        "user report: spawn C:\\Users\\Liuzhongyuan\\AppData\\Local\\Programs\\arckit-runtime\\arckit-runtime.exe ENOENT"
      ]
    },
    {
      "id": "FACT-WIN-SPAWN-002",
      "revision": 1,
      "status": "accepted",
      "statement": "In a packaged Desktop, runtimeRoot resolves inside resources/app.asar and is passed as cwd when spawning process.execPath for Runtime children; the operating system cannot use that virtual archive path as a working directory, so Windows reports spawn arckit-runtime.exe ENOENT even though the executable name and install path are correct.",
      "basis": "The package config, Desktop path construction, both spawn call sites, recent packaged-node change, and deterministic child-process cwd behavior form a complete trace matching the trigger, timing, command path, and error.",
      "evidence": [
        "runtime/arckit-runtime/scripts/build-package-config.mjs",
        "runtime/arckit-runtime/desktop/main.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "git commit 1ceb9c170d0efd9b8891ffbe4677133080d64db3",
        "arckit/tech/arckit-runtime/installer-supply-chain.md:233"
      ]
    },
    {
      "id": "FACT-WIN-SPAWN-003",
      "revision": 1,
      "status": "accepted",
      "statement": "Packaged Desktop construction now supplies process.resourcesPath as runtimeCwd, while development keeps runtimeRoot; Runtime child and background ledger spawns use runtimeCwd, preserve the app.asar script argument, and are covered by focused packaged-layout assertions plus the complete Runtime check.",
      "basis": "The implementation diff, focused regression, complete automated check, and synchronized technical contract directly establish the repaired launch boundary.",
      "evidence": [
        "runtime/arckit-runtime/desktop/main.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "arckit/tech/arckit-runtime/installer-supply-chain.md:233",
        "npm --prefix runtime/arckit-runtime run check: 184 tests, 183 passed, 1 skipped, 0 failed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-WIN-SPAWN-DELIVERY",
      "fact_id": "FACT-WIN-SPAWN-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "delivery_and_distribution",
        "revision": 3
      },
      "effect": "upheld",
      "reason": "The delivered packaged launch path now separates the valid installed executable and ASAR script argument from the real OS working directory.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/desktop/main.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs"
      ]
    },
    {
      "id": "IMPACT-WIN-SPAWN-REALIZATION",
      "fact_id": "FACT-WIN-SPAWN-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The implementation now realizes the packaged embedded-Node launch contract and the focused regression exercises the previously missing ASAR cwd distinction.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "npm --prefix runtime/arckit-runtime run check: 0 failed"
      ]
    },
    {
      "id": "IMPACT-WIN-SPAWN-TECH",
      "fact_id": "FACT-WIN-SPAWN-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "technical-decisions-remain-explainable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The authoritative installer supply-chain solution now states the executable argument and real cwd responsibilities explicitly and matches implementation.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arckit-runtime/installer-supply-chain.md:233",
        "runtime/arckit-runtime/desktop/main.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-WIN-SPAWN-DIAGNOSE",
      "status": "resolved",
      "goal": "Establish the root cause and exact repair boundary for the installed Windows runtime executable ENOENT.",
      "reason": "The reported missing path could originate from packaging layout, install naming, executable discovery, or launch-path construction; a safe fix depends on distinguishing these causes.",
      "derived_from": [
        "case_intent",
        "FACT-WIN-SPAWN-001"
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
        "Traceable code and packaging evidence that identifies the expected installed executable location, the actual packaged location, and the failing path-construction boundary."
      ],
      "resolution": {
        "id": "GAP-WIN-SPAWN-DIAGNOSE",
        "status": "resolved",
        "outcome": "The failure is caused by using the packaged app.asar virtual runtime root as the operating-system child-process working directory, not by an incorrectly named executable.",
        "reason": "The package names the Windows executable arckit-runtime.exe and the Desktop uses process.execPath, while both Runtime child launch sites pass the ASAR-derived runtimeRoot as cwd; the first real child launch after claiming a todo therefore fails at OS process creation.",
        "evidence": [
          "runtime/arckit-runtime/scripts/build-package-config.mjs",
          "runtime/arckit-runtime/desktop/main.mjs",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs:55",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs:657",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs:945",
          "node child_process reproduction: an existing executable fails before launch when cwd is an ASAR-shaped non-directory path"
        ],
        "occurred_at": "2026-08-14T14:17:46.274Z"
      }
    },
    {
      "id": "GAP-WIN-SPAWN-REPAIR",
      "status": "resolved",
      "goal": "Make packaged Desktop Runtime child launches use an operating-system-valid working directory while continuing to execute the packaged app.asar Runtime entrypoint, with regression evidence for the packaged Windows contract.",
      "reason": "FACT-WIN-SPAWN-002 establishes that executable reuse is valid but the ASAR-derived cwd is not; implementation, tests, and the durable packaged-node boundary must agree on a real cwd.",
      "derived_from": [
        "FACT-WIN-SPAWN-002",
        "GAP-WIN-SPAWN-DIAGNOSE"
      ],
      "blocked_by": [
        "GAP-WIN-SPAWN-DIAGNOSE"
      ],
      "priority_basis": {
        "blocking": "high",
        "risk": "high",
        "user_impact": "high",
        "verifiability": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Focused regression tests that distinguish the executable path from the child-process cwd and cover packaged app.asar layout.",
        "Relevant Runtime automated tests pass.",
        "The durable packaged embedded-Node contract records the valid cwd boundary."
      ],
      "resolution": {
        "id": "GAP-WIN-SPAWN-REPAIR",
        "status": "resolved",
        "outcome": "Packaged Desktop Runtime children retain the app.asar script argument but launch from the real Electron resourcesPath working directory, with focused and full-suite regression coverage.",
        "reason": "Desktop main injects runtimeCwd from process.resourcesPath when packaged, both Runtime child launch sites use that value, tests assert the executable/script/cwd separation, and the technical contract records the same boundary.",
        "evidence": [
          "runtime/arckit-runtime/desktop/main.mjs",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
          "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
          "arckit/tech/arckit-runtime/installer-supply-chain.md:233",
          "npm --prefix runtime/arckit-runtime run check: 184 tests, 183 passed, 1 environment-gated skip, 0 failed",
          "node --test runtime/arckit-runtime/test/desktop-renderer.test.mjs runtime/arckit-runtime/test/desktop-run-manager.test.mjs: 19 passed"
        ],
        "occurred_at": "2026-08-14T14:21:51.600Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-08-14T14:12:03.563Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 2,
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
        "content_revision": 2,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "git diff --check",
          "git diff -- runtime/arckit-runtime/desktop/main.mjs runtime/arckit-runtime/src/desktop-run-manager.mjs runtime/arckit-runtime/test/desktop-run-manager.test.mjs runtime/arckit-runtime/test/desktop-renderer.test.mjs arckit/tech/arckit-runtime/installer-supply-chain.md",
          "node --test runtime/arckit-runtime/test/desktop-renderer.test.mjs runtime/arckit-runtime/test/desktop-run-manager.test.mjs: 19 passed",
          "npm --prefix runtime/arckit-runtime run check: 184 tests, 183 passed, 1 environment-gated skip, 0 failed",
          "project-state audit: ok",
          "development-case audit: review_ready with no ordinary obligations",
          "temporary diagnostic marker search: no CASE-007 marker or logging residue"
        ],
        "occurred_at": "2026-08-14T14:23:15.863Z"
      }
    ],
    "evidence": [
      "git diff --check",
      "git diff -- runtime/arckit-runtime/desktop/main.mjs runtime/arckit-runtime/src/desktop-run-manager.mjs runtime/arckit-runtime/test/desktop-run-manager.test.mjs runtime/arckit-runtime/test/desktop-renderer.test.mjs arckit/tech/arckit-runtime/installer-supply-chain.md",
      "node --test runtime/arckit-runtime/test/desktop-renderer.test.mjs runtime/arckit-runtime/test/desktop-run-manager.test.mjs: 19 passed",
      "npm --prefix runtime/arckit-runtime run check: 184 tests, 183 passed, 1 environment-gated skip, 0 failed",
      "project-state audit: ok",
      "development-case audit: review_ready with no ordinary obligations",
      "temporary diagnostic marker search: no CASE-007 marker or logging residue"
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
      "goal": "Trace the packaged Desktop launch path and establish the exact boundary that produces Windows ENOENT.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The Windows spawn diagnosis is the only ready Case Gap and directly blocks the primary claimed-todo execution journey; the Project-level governance candidates do not establish the prerequisite root cause.",
        "snapshot_token": "fba539ca71dcd6f0da0d630d1dbd1e2469dff090fd3305f46dd68fa4f049e9a4",
        "selected_ref": "case-gap:CASE-20260814-007:GAP-WIN-SPAWN-DIAGNOSE",
        "comparison_summary": "Selected the user-blocking ready Windows diagnosis; deferred cross-record audit, Runtime resilience, and scenario evaluation; excluded the unrelated security validation candidate from this Case.",
        "fresh_discovery_summary": "Before execution, no additional fresh candidate could be safely completed without first establishing why the packaged child process fails to start.",
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
            "reason": "Scenario evaluation is important but does not unblock the concrete installed Windows failure."
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
            "reason": "The broad resilience candidate is less specific and cannot substitute for root-cause evidence for this installed-path failure."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "The observed ENOENT path does not involve permission-bearing resources, credentials, or security boundaries."
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
            "reason": "Cross-record auditing remains a Project obligation but does not restore Windows task execution."
          },
          {
            "ref": "case-gap:CASE-20260814-007:GAP-WIN-SPAWN-DIAGNOSE",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the only ready Case Gap and its root-cause result is a prerequisite for a bounded repair."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-WIN-SPAWN-DIAGNOSE",
        "responsibility": "agent",
        "goal": "Establish the root cause and exact repair boundary for the installed Windows runtime executable ENOENT.",
        "reason": "The reported missing path could originate from packaging layout, install naming, executable discovery, or launch-path construction; a safe fix depends on distinguishing these causes.",
        "derived_from": [
          "case_intent",
          "FACT-WIN-SPAWN-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "high",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Traceable code and packaging evidence that identifies the expected installed executable location, the actual packaged location, and the failing path-construction boundary."
        ]
      },
      "planned_transition": {
        "goal": "Trace the packaged Desktop launch path and establish the exact boundary that produces Windows ENOENT.",
        "expected_state_change": "Accept a root-cause fact, close the diagnosis Gap, and expose one evidence-bounded repair Gap without executing that downstream repair."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-WIN-SPAWN-DIAGNOSE",
          "status": "resolved",
          "outcome": "The failure is caused by using the packaged app.asar virtual runtime root as the operating-system child-process working directory, not by an incorrectly named executable.",
          "reason": "The package names the Windows executable arckit-runtime.exe and the Desktop uses process.execPath, while both Runtime child launch sites pass the ASAR-derived runtimeRoot as cwd; the first real child launch after claiming a todo therefore fails at OS process creation.",
          "evidence": [
            "runtime/arckit-runtime/scripts/build-package-config.mjs",
            "runtime/arckit-runtime/desktop/main.mjs",
            "runtime/arckit-runtime/src/desktop-run-manager.mjs:55",
            "runtime/arckit-runtime/src/desktop-run-manager.mjs:657",
            "runtime/arckit-runtime/src/desktop-run-manager.mjs:945",
            "node child_process reproduction: an existing executable fails before launch when cwd is an ASAR-shaped non-directory path"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-WIN-SPAWN-002",
            "revision": 1,
            "status": "accepted",
            "statement": "In a packaged Desktop, runtimeRoot resolves inside resources/app.asar and is passed as cwd when spawning process.execPath for Runtime children; the operating system cannot use that virtual archive path as a working directory, so Windows reports spawn arckit-runtime.exe ENOENT even though the executable name and install path are correct.",
            "basis": "The package config, Desktop path construction, both spawn call sites, recent packaged-node change, and deterministic child-process cwd behavior form a complete trace matching the trigger, timing, command path, and error.",
            "evidence": [
              "runtime/arckit-runtime/scripts/build-package-config.mjs",
              "runtime/arckit-runtime/desktop/main.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "git commit 1ceb9c170d0efd9b8891ffbe4677133080d64db3",
              "arckit/tech/arckit-runtime/installer-supply-chain.md:233"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-WIN-SPAWN-TECH",
            "fact_id": "FACT-WIN-SPAWN-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "technical-decisions-remain-explainable",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The packaged embedded-Node contract describes executable reuse but does not establish an OS-valid cwd boundary for scripts stored in app.asar.",
            "gap_ids": [
              "GAP-WIN-SPAWN-REPAIR"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md:233",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-WIN-SPAWN-DELIVERY",
            "fact_id": "FACT-WIN-SPAWN-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "delivery_and_distribution",
              "revision": 3
            },
            "effect": "threatened",
            "reason": "The packaged Windows executable is correctly named, but the delivered Desktop cannot start its Runtime child because the launch cwd is an ASAR virtual path.",
            "gap_ids": [
              "GAP-WIN-SPAWN-REPAIR"
            ],
            "evidence": [
              "runtime/arckit-runtime/scripts/build-package-config.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "user report: packaged Windows spawn returns ENOENT"
            ]
          },
          {
            "id": "IMPACT-WIN-SPAWN-REALIZATION",
            "fact_id": "FACT-WIN-SPAWN-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The accepted packaged Runtime execution behavior is not realized until child launches use a real working directory and are regression-tested.",
            "gap_ids": [
              "GAP-WIN-SPAWN-REPAIR"
            ],
            "evidence": [
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "user report: claiming a todo fails before Runtime execution"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-WIN-SPAWN-REPAIR",
            "status": "open",
            "goal": "Make packaged Desktop Runtime child launches use an operating-system-valid working directory while continuing to execute the packaged app.asar Runtime entrypoint, with regression evidence for the packaged Windows contract.",
            "reason": "FACT-WIN-SPAWN-002 establishes that executable reuse is valid but the ASAR-derived cwd is not; implementation, tests, and the durable packaged-node boundary must agree on a real cwd.",
            "derived_from": [
              "FACT-WIN-SPAWN-002",
              "GAP-WIN-SPAWN-DIAGNOSE"
            ],
            "blocked_by": [
              "GAP-WIN-SPAWN-DIAGNOSE"
            ],
            "priority_basis": {
              "blocking": "high",
              "risk": "high",
              "user_impact": "high",
              "verifiability": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Focused regression tests that distinguish the executable path from the child-process cwd and cover packaged app.asar layout.",
              "Relevant Runtime automated tests pass.",
              "The durable packaged embedded-Node contract records the valid cwd boundary."
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
        "software_definition_changes": [],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 63,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The expected Windows installer and Runtime execution capability remains explicit and is not redefined by this implementation diagnosis.",
            "fact_refs": [
              "FACT-WIN-SPAWN-001",
              "FACT-WIN-SPAWN-002"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The claim-to-execution journey and failure feedback semantics remain durably specified; the diagnosis exposes a realization defect rather than an ambiguous interaction decision.",
            "fact_refs": [
              "FACT-WIN-SPAWN-001"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/automation-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The child-process launch failure and ASAR cwd boundary do not establish or alter any visual-language or presentation rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "threatened",
            "reason": "The embedded-Node decision lacks the real operating-system cwd boundary required for packaged ASAR execution.",
            "fact_refs": [
              "FACT-WIN-SPAWN-002"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md:233",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs"
            ],
            "gap_refs": [
              "GAP-WIN-SPAWN-REPAIR"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The installed Windows Desktop still fails before the Runtime child begins, so the accepted execution contract is not yet realized.",
            "fact_refs": [
              "FACT-WIN-SPAWN-001",
              "FACT-WIN-SPAWN-002"
            ],
            "evidence": [
              "user report: claiming a todo produces spawn arckit-runtime.exe ENOENT",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs"
            ],
            "gap_refs": [
              "GAP-WIN-SPAWN-REPAIR"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Existing tests mock spawn and distribution smoke omits a real packaged Runtime child launch, leaving cross-platform launch regression risk uncontrolled until focused evidence is added.",
            "fact_refs": [
              "FACT-WIN-SPAWN-002"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs"
            ],
            "gap_refs": [
              "GAP-WIN-SPAWN-REPAIR"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/scripts/build-package-config.mjs",
        "runtime/arckit-runtime/desktop/main.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
        "arckit/tech/arckit-runtime/installer-supply-chain.md:233",
        "git commit 1ceb9c170d0efd9b8891ffbe4677133080d64db3"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T14:17:46.274Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Establish an OS-valid cwd for packaged Runtime children while preserving the ASAR script path and embedded Electron Node host.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The accepted diagnosis makes the Windows packaged cwd repair ready and directly user-blocking; unrelated Project and concurrent Case work remains isolated.",
        "snapshot_token": "e2676d3b2b0e233eebca176fd1b7f409db949947665981848640e633783b0929",
        "selected_ref": "case-gap:CASE-20260814-007:GAP-WIN-SPAWN-REPAIR",
        "comparison_summary": "Selected CASE-007 repair; deferred the concurrent CASE-008 diagnosis and Project-level governance candidates; excluded security validation from this Case.",
        "fresh_discovery_summary": "No separate fresh prerequisite emerged; code, tests, and the durable technical contract all prove the same already-bounded packaged child-launch result.",
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
            "reason": "Scenario evaluation remains important but is less direct than restoring the reported Windows task execution."
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
            "reason": "The broad Runtime resilience scope is not needed to accept this exact packaged cwd repair."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "The selected repair does not involve credentials, permissions, or controlled resources."
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
            "reason": "Cross-record audit does not unblock the concrete Windows launch defect."
          },
          {
            "ref": "case-gap:CASE-20260814-007:GAP-WIN-SPAWN-REPAIR",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": "high",
              "verifiability": "high"
            },
            "reason": "The prerequisite diagnosis is accepted and the repair boundary is now fully determined and testable."
          },
          {
            "ref": "case-gap:CASE-20260814-008:GAP-SHARED-INSTALL-DIAGNOSE",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "This is an independently active Case and must not expand the current user-requested repair scope."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-WIN-SPAWN-REPAIR",
        "responsibility": "agent",
        "goal": "Make packaged Desktop Runtime child launches use an operating-system-valid working directory while continuing to execute the packaged app.asar Runtime entrypoint, with regression evidence for the packaged Windows contract.",
        "reason": "FACT-WIN-SPAWN-002 establishes that executable reuse is valid but the ASAR-derived cwd is not; implementation, tests, and the durable packaged-node boundary must agree on a real cwd.",
        "derived_from": [
          "FACT-WIN-SPAWN-002",
          "GAP-WIN-SPAWN-DIAGNOSE"
        ],
        "blocked_by": [
          "GAP-WIN-SPAWN-DIAGNOSE"
        ],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": "high",
          "verifiability": "high"
        },
        "evidence_required": [
          "Focused regression tests that distinguish the executable path from the child-process cwd and cover packaged app.asar layout.",
          "Relevant Runtime automated tests pass.",
          "The durable packaged embedded-Node contract records the valid cwd boundary."
        ]
      },
      "planned_transition": {
        "goal": "Establish an OS-valid cwd for packaged Runtime children while preserving the ASAR script path and embedded Electron Node host.",
        "expected_state_change": "The packaged Desktop launch boundary, regression evidence, and durable technical contract agree; the repair Gap and its threatened impacts become satisfied."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-WIN-SPAWN-REPAIR",
          "status": "resolved",
          "outcome": "Packaged Desktop Runtime children retain the app.asar script argument but launch from the real Electron resourcesPath working directory, with focused and full-suite regression coverage.",
          "reason": "Desktop main injects runtimeCwd from process.resourcesPath when packaged, both Runtime child launch sites use that value, tests assert the executable/script/cwd separation, and the technical contract records the same boundary.",
          "evidence": [
            "runtime/arckit-runtime/desktop/main.mjs",
            "runtime/arckit-runtime/src/desktop-run-manager.mjs",
            "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
            "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
            "arckit/tech/arckit-runtime/installer-supply-chain.md:233",
            "npm --prefix runtime/arckit-runtime run check: 184 tests, 183 passed, 1 environment-gated skip, 0 failed",
            "node --test runtime/arckit-runtime/test/desktop-renderer.test.mjs runtime/arckit-runtime/test/desktop-run-manager.test.mjs: 19 passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-WIN-SPAWN-003",
            "revision": 1,
            "status": "accepted",
            "statement": "Packaged Desktop construction now supplies process.resourcesPath as runtimeCwd, while development keeps runtimeRoot; Runtime child and background ledger spawns use runtimeCwd, preserve the app.asar script argument, and are covered by focused packaged-layout assertions plus the complete Runtime check.",
            "basis": "The implementation diff, focused regression, complete automated check, and synchronized technical contract directly establish the repaired launch boundary.",
            "evidence": [
              "runtime/arckit-runtime/desktop/main.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
              "arckit/tech/arckit-runtime/installer-supply-chain.md:233",
              "npm --prefix runtime/arckit-runtime run check: 184 tests, 183 passed, 1 skipped, 0 failed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-WIN-SPAWN-DELIVERY",
            "fact_id": "FACT-WIN-SPAWN-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "delivery_and_distribution",
              "revision": 3
            },
            "effect": "upheld",
            "reason": "The delivered packaged launch path now separates the valid installed executable and ASAR script argument from the real OS working directory.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/desktop/main.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs"
            ]
          },
          {
            "id": "IMPACT-WIN-SPAWN-REALIZATION",
            "fact_id": "FACT-WIN-SPAWN-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The implementation now realizes the packaged embedded-Node launch contract and the focused regression exercises the previously missing ASAR cwd distinction.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "npm --prefix runtime/arckit-runtime run check: 0 failed"
            ]
          },
          {
            "id": "IMPACT-WIN-SPAWN-TECH",
            "fact_id": "FACT-WIN-SPAWN-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "technical-decisions-remain-explainable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The authoritative installer supply-chain solution now states the executable argument and real cwd responsibilities explicitly and matches implementation.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md:233",
              "runtime/arckit-runtime/desktop/main.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs"
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
        "evidence": []
      },
      "invariant_assessment": {
        "project_revision": 63,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The expected packaged Windows task execution capability remains explicit and the repair preserves its product meaning.",
            "fact_refs": [
              "FACT-WIN-SPAWN-001",
              "FACT-WIN-SPAWN-003"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Claim-to-execution and failure feedback semantics remain coherent; the repaired process boundary requires no interaction contract change.",
            "fact_refs": [
              "FACT-WIN-SPAWN-003"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/automation-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The packaged child-process working directory does not establish or alter visual presentation rules.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The installer supply-chain contract and implementation now explicitly separate the ASAR script argument from the physical resourcesPath cwd.",
            "fact_refs": [
              "FACT-WIN-SPAWN-002",
              "FACT-WIN-SPAWN-003"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md:233",
              "runtime/arckit-runtime/desktop/main.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Both packaged Runtime launch sites now use the injected real cwd while preserving embedded Electron Node and ASAR script execution.",
            "fact_refs": [
              "FACT-WIN-SPAWN-003"
            ],
            "evidence": [
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "npm --prefix runtime/arckit-runtime run check: 0 failed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Focused packaged-layout assertions, the main-process injection assertion, syntax checks, diff checks, and the complete Runtime suite provide repeatable evidence for the bounded cwd regression risk.",
            "fact_refs": [
              "FACT-WIN-SPAWN-003"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
              "npm --prefix runtime/arckit-runtime run check: 184 tests, 183 passed, 1 environment-gated skip, 0 failed",
              "git diff --check"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/desktop/main.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "arckit/tech/arckit-runtime/installer-supply-chain.md:233",
        "npm --prefix runtime/arckit-runtime run check: 184 tests, 183 passed, 1 environment-gated skip, 0 failed",
        "node --test runtime/arckit-runtime/test/desktop-renderer.test.mjs runtime/arckit-runtime/test/desktop-run-manager.test.mjs: 19 passed",
        "git diff --check"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T14:21:51.600Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review CASE-007 content revision 2 across correctness, problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "CASE-007 has no ordinary gaps, questions, handoffs, or threatened impacts; its derived completion review is the only remaining obligation before resolution.",
        "snapshot_token": "90c17f20448d1e2043aefe4ac23fbdaf1f50242a9c2a840ff60731c3c5b70780",
        "selected_ref": "case-gap:CASE-20260814-007:CASE-20260814-007:completion-review:1",
        "comparison_summary": "Selected CASE-007 completion review; deferred the independent CASE-008 diagnosis and Project governance candidates; excluded security validation from this Case.",
        "fresh_discovery_summary": "Final diff, audit, and validation evidence exposed no separate ready ordinary Gap; the bounded implementation is ready for the five-dimension review.",
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
            "reason": "Project-wide scenario evaluation is independent of closing this completed bounded Case."
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
            "reason": "The broader Runtime resilience scope is not a finding in this implementation review."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "No security boundary is implicated by this Case or its final diff."
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
            "reason": "Project cross-record audit remains independent and does not block the current clean implementation review."
          },
          {
            "ref": "case-gap:CASE-20260814-007:CASE-20260814-007:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "All content obligations are closed and the current content revision requires its terminal semantic review."
          },
          {
            "ref": "case-gap:CASE-20260814-008:GAP-SHARED-INSTALL-DIAGNOSE",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "The concurrently active shared-resource Case is unrelated and remains isolated."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260814-007:completion-review:1",
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
        "goal": "Review CASE-007 content revision 2 across correctness, problem resolution, verification credibility, regression risk, and minimality.",
        "expected_state_change": "Record a clean completion review for the unchanged current content revision and resolve the Case."
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
          "reviewed_content_revision": 2,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "git diff --check",
            "git diff -- runtime/arckit-runtime/desktop/main.mjs runtime/arckit-runtime/src/desktop-run-manager.mjs runtime/arckit-runtime/test/desktop-run-manager.test.mjs runtime/arckit-runtime/test/desktop-renderer.test.mjs arckit/tech/arckit-runtime/installer-supply-chain.md",
            "node --test runtime/arckit-runtime/test/desktop-renderer.test.mjs runtime/arckit-runtime/test/desktop-run-manager.test.mjs: 19 passed",
            "npm --prefix runtime/arckit-runtime run check: 184 tests, 183 passed, 1 environment-gated skip, 0 failed",
            "project-state audit: ok",
            "development-case audit: review_ready with no ordinary obligations",
            "temporary diagnostic marker search: no CASE-007 marker or logging residue"
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
        "project_revision": 63,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Review confirms the repaired packaged task execution remains consistent with the durable product capability and scope.",
            "fact_refs": [
              "FACT-WIN-SPAWN-003"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Review finds no interaction ambiguity or changed state semantics in the claim-to-execution journey.",
            "fact_refs": [
              "FACT-WIN-SPAWN-003"
            ],
            "evidence": [
              "arckit/interaction/task-browser/interaction.md",
              "arckit/interaction/automation-workspace/interaction.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Review confirms the final diff has no visual or presentation behavior changes.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Review confirms the physical cwd and ASAR executable-argument boundary is explicit, coherent, and aligned across code and technical evidence.",
            "fact_refs": [
              "FACT-WIN-SPAWN-002",
              "FACT-WIN-SPAWN-003"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md:233",
              "runtime/arckit-runtime/desktop/main.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Review confirms both Runtime child launch sites consume the real runtimeCwd and the packaged main process supplies resourcesPath.",
            "fact_refs": [
              "FACT-WIN-SPAWN-003"
            ],
            "evidence": [
              "runtime/arckit-runtime/desktop/main.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Review confirms the prior regression hole is covered by focused source and packaged-layout assertions plus the complete Runtime suite, with no residual debug instrumentation.",
            "fact_refs": [
              "FACT-WIN-SPAWN-003"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
              "npm --prefix runtime/arckit-runtime run check: 184 tests, 183 passed, 1 environment-gated skip, 0 failed",
              "git diff --check"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "git diff --check",
        "runtime/arckit-runtime/desktop/main.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "arckit/tech/arckit-runtime/installer-supply-chain.md:233",
        "npm --prefix runtime/arckit-runtime run check: 184 tests, 183 passed, 1 environment-gated skip, 0 failed",
        "project-state audit: ok"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T14:23:15.863Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-WIN-SPAWN-DIAGNOSE",
      "GAP-WIN-SPAWN-REPAIR"
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
    "updated_at": "2026-08-14T14:23:15.863Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
