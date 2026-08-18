# Fix nested trusted-ledger launches opening ArcOrbit windows

Case: CASE-20260818-007
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-18T18:25:06.050Z

## User Intent

Diagnose and fix the newly observed one-shot ArcOrbit window opened by a nested trusted ledger subprocess during task execution.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260818-007",
  "title": "Fix nested trusted-ledger launches opening ArcOrbit windows",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-18T18:17:45.534Z",
  "updated_at": "2026-08-18T18:25:06.050Z",
  "user_intent": "Diagnose and fix the newly observed one-shot ArcOrbit window opened by a nested trusted ledger subprocess during task execution.",
  "expected_outcome": "Every Runtime-owned trusted ledger subprocess remains in Node mode at every nesting depth and task execution never creates an unintended Desktop window.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-UNEXPECTED-SECOND-WINDOW-REPORT",
      "revision": 1,
      "status": "accepted",
      "statement": "A newly built ArcOrbit opened one unexpected additional application window while task 1139 was creating its Case.",
      "basis": "Direct user report plus the live run identity RUN-20260818-181111015Z establish the incident symptom.",
      "evidence": [
        "User report received 2026-08-19",
        "arckit-runtime://runs/RUN-20260818-181111015Z"
      ]
    },
    {
      "id": "FACT-NESTED-TRUSTED-NODE-MODE-LOST",
      "revision": 1,
      "status": "accepted",
      "statement": "During RUN-20260818-181111015Z, the Node-mode Runtime process 20707 imported the trusted case-control entrypoint, whose runScript used process.execPath without restoring ELECTRON_RUN_AS_NODE; its development-case.mjs child 21446 therefore entered Electron Desktop mode, lacked the flag in its observed environment, created GPU/utility/Renderer children 21447-21449, and opened the single unexpected window.",
      "basis": "The live parent/child process tree, exact Case-control arguments, child environment, open app.asar resources, run messages, installed-bundle source strings, and repository call chain agree on trigger, identity, location, state, and timing. This is a nested trusted-entrypoint defect distinct from the repaired top-level Runtime launcher.",
      "evidence": [
        "arckit-runtime://runs/RUN-20260818-181111015Z",
        "Live process tree 2026-08-19: 20688 Desktop -> 20707 Runtime -> 21446 development-case.mjs -> 21447-21449 GPU/utility/Renderer",
        "Live process environment 2026-08-19: PID 21446 lacked ELECTRON_RUN_AS_NODE and loaded app.asar/Electron Framework",
        "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs:135",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs:471",
        "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs:490",
        "runtime/arcorbit/src/ledger-writer.mjs"
      ]
    },
    {
      "id": "FACT-NESTED-TRUSTED-BOUNDARY-REPAIRED",
      "revision": 1,
      "status": "accepted",
      "statement": "All three nested trusted-ledger process.execPath launchers now use a shared self-contained environment helper that restores ELECTRON_RUN_AS_NODE=1 only when hosted by Electron; standalone Node preserves its environment, and a packaged case-control write completes without creating a Desktop helper tree.",
      "basis": "Source audit, targeted tests, full suite, package construction, and a packaged Electron case-control execution after explicit outer-environment sanitization all agree.",
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/trusted-node-subprocess.mjs",
        "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
        "runtime/arcorbit/test/runtime-process-environment.test.mjs",
        "Focused nested ledger checks: 37 passed, 0 failed",
        "npm --prefix runtime/arcorbit run check: 214 tests, 212 passed, 2 environment-gated skipped, 0 failed",
        "Local unsigned macOS x64 package build 20260818182107: succeeded",
        "Packaged-host case-control regression 2026-08-19: outer Electron environment flag removed, Case creation written=true, nested child completed, no release Desktop/GPU/Renderer process remained"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-INTERACTION-NESTED-WINDOW",
      "fact_id": "FACT-NESTED-TRUSTED-NODE-MODE-LOST",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "interaction-expectations-remain-recoverable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Task execution no longer creates an unintended Desktop window during trusted Case creation.",
      "gap_ids": [],
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/trusted-node-subprocess.mjs",
        "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
        "runtime/arcorbit/test/runtime-process-environment.test.mjs",
        "Focused nested ledger checks: 37 passed, 0 failed",
        "npm --prefix runtime/arcorbit run check: 214 tests, 212 passed, 2 environment-gated skipped, 0 failed",
        "Local unsigned macOS x64 package build 20260818182107: succeeded",
        "Packaged-host case-control regression 2026-08-19: outer Electron environment flag removed, Case creation written=true, nested child completed, no release Desktop/GPU/Renderer process remained"
      ]
    },
    {
      "id": "IMPACT-TECH-NESTED-NODE-BOUNDARY",
      "fact_id": "FACT-NESTED-TRUSTED-NODE-MODE-LOST",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 18
      },
      "effect": "upheld",
      "reason": "The Desktop/Runtime/trusted capability boundary is explicit at both top-level and nested Node subprocess depths.",
      "gap_ids": [],
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/trusted-node-subprocess.mjs",
        "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
        "runtime/arcorbit/test/runtime-process-environment.test.mjs",
        "Focused nested ledger checks: 37 passed, 0 failed",
        "npm --prefix runtime/arcorbit run check: 214 tests, 212 passed, 2 environment-gated skipped, 0 failed",
        "Local unsigned macOS x64 package build 20260818182107: succeeded",
        "Packaged-host case-control regression 2026-08-19: outer Electron environment flag removed, Case creation written=true, nested child completed, no release Desktop/GPU/Renderer process remained"
      ]
    },
    {
      "id": "IMPACT-REALIZATION-NESTED-WINDOW",
      "fact_id": "FACT-NESTED-TRUSTED-NODE-MODE-LOST",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "A packaged Electron host completes the formerly failing nested Case-control write with no second Desktop tree.",
      "gap_ids": [],
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/trusted-node-subprocess.mjs",
        "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
        "runtime/arcorbit/test/runtime-process-environment.test.mjs",
        "Focused nested ledger checks: 37 passed, 0 failed",
        "npm --prefix runtime/arcorbit run check: 214 tests, 212 passed, 2 environment-gated skipped, 0 failed",
        "Local unsigned macOS x64 package build 20260818182107: succeeded",
        "Packaged-host case-control regression 2026-08-19: outer Electron environment flag removed, Case creation written=true, nested child completed, no release Desktop/GPU/Renderer process remained"
      ]
    },
    {
      "id": "IMPACT-RISK-NESTED-WINDOW",
      "fact_id": "FACT-NESTED-TRUSTED-NODE-MODE-LOST",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Unit, full-suite, distribution, and real packaged-host evidence now cover the nested launch path.",
      "gap_ids": [],
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/trusted-node-subprocess.mjs",
        "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
        "runtime/arcorbit/test/runtime-process-environment.test.mjs",
        "Focused nested ledger checks: 37 passed, 0 failed",
        "npm --prefix runtime/arcorbit run check: 214 tests, 212 passed, 2 environment-gated skipped, 0 failed",
        "Local unsigned macOS x64 package build 20260818182107: succeeded",
        "Packaged-host case-control regression 2026-08-19: outer Electron environment flag removed, Case creation written=true, nested child completed, no release Desktop/GPU/Renderer process remained"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-DIAGNOSE-NESTED-TRUSTED-LAUNCH",
      "status": "resolved",
      "goal": "Establish the exact nested trusted-ledger launch path, executable environment, child process tree, timing, and distinction from the previously fixed top-level Runtime launcher.",
      "reason": "The new symptom is one additional window during Case creation, so the precise nested boundary must be accepted before selecting a repair.",
      "derived_from": [
        "case_intent",
        "FACT-UNEXPECTED-SECOND-WINDOW-REPORT"
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
        "Live process-tree and environment evidence matching task/run identity, nested script arguments, Desktop helpers, timestamp, and source call chain."
      ],
      "resolution": {
        "id": "GAP-DIAGNOSE-NESTED-TRUSTED-LAUNCH",
        "status": "resolved",
        "outcome": "The additional window is conclusively traced to nested trusted ledger scripts reusing the Electron executable after Runtime environment sanitization.",
        "reason": "PID 21446 exactly matched the selected task/run and development-case command, lacked ELECTRON_RUN_AS_NODE, loaded Electron Desktop resources, and created GPU/Renderer children at the user-observed timestamp.",
        "evidence": [
          "arckit-runtime://runs/RUN-20260818-181111015Z",
          "Live process tree 2026-08-19: 20688 Desktop -> 20707 Runtime -> 21446 development-case.mjs -> 21447-21449 GPU/utility/Renderer",
          "Live process environment 2026-08-19: PID 21446 lacked ELECTRON_RUN_AS_NODE and loaded app.asar/Electron Framework",
          "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs:135",
          "entry/skills/arckit-development-ledger/scripts/case-transition.mjs:471",
          "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs:490",
          "runtime/arcorbit/src/ledger-writer.mjs"
        ],
        "occurred_at": "2026-08-18T18:19:03.533Z"
      }
    },
    {
      "id": "GAP-FIX-NESTED-TRUSTED-NODE-BOUNDARY",
      "status": "resolved",
      "goal": "Make every nested trusted-ledger script launch explicitly retain Node mode under Electron while remaining portable under standalone Node, and prove real packaged case-control/transition/compatibility paths create no Desktop helper tree.",
      "reason": "The accepted diagnosis shows three trusted ledger spawnSync(process.execPath) boundaries inherit the globally sanitized Runtime environment and can therefore enter Desktop mode.",
      "derived_from": [
        "FACT-UNEXPECTED-SECOND-WINDOW-REPORT",
        "FACT-NESTED-TRUSTED-NODE-MODE-LOST"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "uncertainty": "low",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Regression tests covering nested case-control, case-transition, and compatibility subprocess environments under Electron and standalone Node.",
        "Full ledger and ArcOrbit checks.",
        "A packaged-host case-control path that completes without Desktop/GPU/Renderer descendants."
      ],
      "resolution": {
        "id": "GAP-FIX-NESTED-TRUSTED-NODE-BOUNDARY",
        "status": "resolved",
        "outcome": "Nested trusted ledger subprocesses explicitly regain embedded Node mode and packaged Case creation no longer opens another ArcOrbit window.",
        "reason": "One shared helper covers all three process.execPath sites; all checks pass and the exact packaged Case-control path now completes without a Desktop/GPU/Renderer process tree.",
        "evidence": [
          "entry/skills/arckit-development-ledger/scripts/trusted-node-subprocess.mjs",
          "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
          "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
          "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
          "runtime/arcorbit/test/runtime-process-environment.test.mjs",
          "Focused nested ledger checks: 37 passed, 0 failed",
          "npm --prefix runtime/arcorbit run check: 214 tests, 212 passed, 2 environment-gated skipped, 0 failed",
          "Local unsigned macOS x64 package build 20260818182107: succeeded",
          "Packaged-host case-control regression 2026-08-19: outer Electron environment flag removed, Case creation written=true, nested child completed, no release Desktop/GPU/Renderer process remained"
        ],
        "occurred_at": "2026-08-18T18:24:29.703Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "$using-arckit user-invoked autonomous Case policy",
      "snapshotted_at": "2026-08-18T18:17:45.534Z"
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
          "git diff --check: clean on 2026-08-19",
          "entry/skills/arckit-development-ledger/scripts/trusted-node-subprocess.mjs",
          "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
          "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
          "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
          "runtime/arcorbit/test/runtime-process-environment.test.mjs",
          "Focused nested ledger checks: 37 passed, 0 failed",
          "npm --prefix runtime/arcorbit run check: 214 tests, 212 passed, 2 environment-gated skipped, 0 failed",
          "Unsigned macOS x64 package 20260818182107: succeeded",
          "Packaged-host case-control regression: written=true after outer flag sanitization; no release Desktop/GPU/Renderer process remained",
          "Temporary packaged regression project removed; no ARC_DEBUG marker or temporary log instrumentation remains"
        ],
        "occurred_at": "2026-08-18T18:25:06.050Z"
      }
    ],
    "evidence": [
      "git diff --check: clean on 2026-08-19",
      "entry/skills/arckit-development-ledger/scripts/trusted-node-subprocess.mjs",
      "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
      "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
      "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
      "runtime/arcorbit/test/runtime-process-environment.test.mjs",
      "Focused nested ledger checks: 37 passed, 0 failed",
      "npm --prefix runtime/arcorbit run check: 214 tests, 212 passed, 2 environment-gated skipped, 0 failed",
      "Unsigned macOS x64 package 20260818182107: succeeded",
      "Packaged-host case-control regression: written=true after outer flag sanitization; no release Desktop/GPU/Renderer process remained",
      "Temporary packaged regression project removed; no ARC_DEBUG marker or temporary log instrumentation remains"
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
      "goal": "Accept the fully matched nested trusted-ledger launch cause from the preserved live process, environment, run, package, and source evidence.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The incident diagnosis is the only ready Case gap and has the highest blocking, information-gain, and user-impact value.",
        "snapshot_token": "74937a9fc3844c51c2bf1aa22e86e1a810016a2817a0fd85da48b557e9003c38",
        "selected_ref": "case-gap:CASE-20260818-007:GAP-DIAGNOSE-NESTED-TRUSTED-LAUNCH",
        "comparison_summary": "Compared all four unrelated Project gaps with the incident diagnosis; only the Case diagnosis is ready and directly blocks repair of the live window regression.",
        "fresh_discovery_summary": "Live evidence identified a downstream repair obligation across three nested trusted subprocess launch sites; it is recorded for the next post-closeout snapshot.",
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
            "reason": "This Project obligation requires a separate Case and is unrelated to the live nested Electron launch."
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
            "reason": "This Project obligation requires a separate Case and is unrelated to the live nested Electron launch."
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
            "reason": "This Project obligation requires a separate Case and is unrelated to the live nested Electron launch."
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
            "reason": "This Project obligation requires a separate Case and is unrelated to the live nested Electron launch."
          },
          {
            "ref": "case-gap:CASE-20260818-007:GAP-DIAGNOSE-NESTED-TRUSTED-LAUNCH",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "The live user-impacting incident has complete process and environment evidence and blocks safe repair."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-DIAGNOSE-NESTED-TRUSTED-LAUNCH",
        "responsibility": "agent",
        "goal": "Establish the exact nested trusted-ledger launch path, executable environment, child process tree, timing, and distinction from the previously fixed top-level Runtime launcher.",
        "reason": "The new symptom is one additional window during Case creation, so the precise nested boundary must be accepted before selecting a repair.",
        "derived_from": [
          "case_intent",
          "FACT-UNEXPECTED-SECOND-WINDOW-REPORT"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "high",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Live process-tree and environment evidence matching task/run identity, nested script arguments, Desktop helpers, timestamp, and source call chain."
        ]
      },
      "planned_transition": {
        "goal": "Accept the fully matched nested trusted-ledger launch cause from the preserved live process, environment, run, package, and source evidence.",
        "expected_state_change": "Resolve the diagnosis gap, accept the nested Node-mode-loss fact, register threatened impacts, and expose one repair gap without implementing it in this round."
      },
      "accepted_state_delta": {
        "facts_added": [
          {
            "id": "FACT-NESTED-TRUSTED-NODE-MODE-LOST",
            "revision": 1,
            "status": "accepted",
            "statement": "During RUN-20260818-181111015Z, the Node-mode Runtime process 20707 imported the trusted case-control entrypoint, whose runScript used process.execPath without restoring ELECTRON_RUN_AS_NODE; its development-case.mjs child 21446 therefore entered Electron Desktop mode, lacked the flag in its observed environment, created GPU/utility/Renderer children 21447-21449, and opened the single unexpected window.",
            "basis": "The live parent/child process tree, exact Case-control arguments, child environment, open app.asar resources, run messages, installed-bundle source strings, and repository call chain agree on trigger, identity, location, state, and timing. This is a nested trusted-entrypoint defect distinct from the repaired top-level Runtime launcher.",
            "evidence": [
              "arckit-runtime://runs/RUN-20260818-181111015Z",
              "Live process tree 2026-08-19: 20688 Desktop -> 20707 Runtime -> 21446 development-case.mjs -> 21447-21449 GPU/utility/Renderer",
              "Live process environment 2026-08-19: PID 21446 lacked ELECTRON_RUN_AS_NODE and loaded app.asar/Electron Framework",
              "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs:135",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs:471",
              "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs:490",
              "runtime/arcorbit/src/ledger-writer.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-INTERACTION-NESTED-WINDOW",
            "fact_id": "FACT-NESTED-TRUSTED-NODE-MODE-LOST",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "interaction-expectations-remain-recoverable",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The established task-execution interaction is violated by an unintended Desktop window during trusted Case creation.",
            "gap_ids": [
              "GAP-FIX-NESTED-TRUSTED-NODE-BOUNDARY"
            ],
            "evidence": [
              "arckit-runtime://runs/RUN-20260818-181111015Z",
              "Live process tree 2026-08-19: 20688 Desktop -> 20707 Runtime -> 21446 development-case.mjs -> 21447-21449 GPU/utility/Renderer",
              "Live process environment 2026-08-19: PID 21446 lacked ELECTRON_RUN_AS_NODE and loaded app.asar/Electron Framework",
              "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs:135",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs:471",
              "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs:490",
              "runtime/arcorbit/src/ledger-writer.mjs"
            ]
          },
          {
            "id": "IMPACT-TECH-NESTED-NODE-BOUNDARY",
            "fact_id": "FACT-NESTED-TRUSTED-NODE-MODE-LOST",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 18
            },
            "effect": "threatened",
            "reason": "The documented Desktop/Runtime/trusted-capability host boundary is incomplete at nested trusted subprocesses.",
            "gap_ids": [
              "GAP-FIX-NESTED-TRUSTED-NODE-BOUNDARY"
            ],
            "evidence": [
              "arckit-runtime://runs/RUN-20260818-181111015Z",
              "Live process tree 2026-08-19: 20688 Desktop -> 20707 Runtime -> 21446 development-case.mjs -> 21447-21449 GPU/utility/Renderer",
              "Live process environment 2026-08-19: PID 21446 lacked ELECTRON_RUN_AS_NODE and loaded app.asar/Electron Framework",
              "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs:135",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs:471",
              "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs:490",
              "runtime/arcorbit/src/ledger-writer.mjs"
            ]
          },
          {
            "id": "IMPACT-REALIZATION-NESTED-WINDOW",
            "fact_id": "FACT-NESTED-TRUSTED-NODE-MODE-LOST",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Packaged task execution still creates an unintended Desktop process at nested ledger depth.",
            "gap_ids": [
              "GAP-FIX-NESTED-TRUSTED-NODE-BOUNDARY"
            ],
            "evidence": [
              "arckit-runtime://runs/RUN-20260818-181111015Z",
              "Live process tree 2026-08-19: 20688 Desktop -> 20707 Runtime -> 21446 development-case.mjs -> 21447-21449 GPU/utility/Renderer",
              "Live process environment 2026-08-19: PID 21446 lacked ELECTRON_RUN_AS_NODE and loaded app.asar/Electron Framework",
              "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs:135",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs:471",
              "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs:490",
              "runtime/arcorbit/src/ledger-writer.mjs"
            ]
          },
          {
            "id": "IMPACT-RISK-NESTED-WINDOW",
            "fact_id": "FACT-NESTED-TRUSTED-NODE-MODE-LOST",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Previous packaged-host verification did not exercise nested trusted subprocess creation and therefore did not control this regression path.",
            "gap_ids": [
              "GAP-FIX-NESTED-TRUSTED-NODE-BOUNDARY"
            ],
            "evidence": [
              "arckit-runtime://runs/RUN-20260818-181111015Z",
              "Live process tree 2026-08-19: 20688 Desktop -> 20707 Runtime -> 21446 development-case.mjs -> 21447-21449 GPU/utility/Renderer",
              "Live process environment 2026-08-19: PID 21446 lacked ELECTRON_RUN_AS_NODE and loaded app.asar/Electron Framework",
              "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs:135",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs:471",
              "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs:490",
              "runtime/arcorbit/src/ledger-writer.mjs"
            ]
          }
        ],
        "impacts_updated": [],
        "gaps_added": [
          {
            "id": "GAP-FIX-NESTED-TRUSTED-NODE-BOUNDARY",
            "status": "open",
            "goal": "Make every nested trusted-ledger script launch explicitly retain Node mode under Electron while remaining portable under standalone Node, and prove real packaged case-control/transition/compatibility paths create no Desktop helper tree.",
            "reason": "The accepted diagnosis shows three trusted ledger spawnSync(process.execPath) boundaries inherit the globally sanitized Runtime environment and can therefore enter Desktop mode.",
            "derived_from": [
              "FACT-UNEXPECTED-SECOND-WINDOW-REPORT",
              "FACT-NESTED-TRUSTED-NODE-MODE-LOST"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Regression tests covering nested case-control, case-transition, and compatibility subprocess environments under Electron and standalone Node.",
              "Full ledger and ArcOrbit checks.",
              "A packaged-host case-control path that completes without Desktop/GPU/Renderer descendants."
            ],
            "resolution": null
          }
        ],
        "gaps_cancelled": [],
        "resolved_gap": {
          "id": "GAP-DIAGNOSE-NESTED-TRUSTED-LAUNCH",
          "status": "resolved",
          "outcome": "The additional window is conclusively traced to nested trusted ledger scripts reusing the Electron executable after Runtime environment sanitization.",
          "reason": "PID 21446 exactly matched the selected task/run and development-case command, lacked ELECTRON_RUN_AS_NODE, loaded Electron Desktop resources, and created GPU/Renderer children at the user-observed timestamp.",
          "evidence": [
            "arckit-runtime://runs/RUN-20260818-181111015Z",
            "Live process tree 2026-08-19: 20688 Desktop -> 20707 Runtime -> 21446 development-case.mjs -> 21447-21449 GPU/utility/Renderer",
            "Live process environment 2026-08-19: PID 21446 lacked ELECTRON_RUN_AS_NODE and loaded app.asar/Electron Framework",
            "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs:135",
            "entry/skills/arckit-development-ledger/scripts/case-transition.mjs:471",
            "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs:490",
            "runtime/arcorbit/src/ledger-writer.mjs"
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
        "project_revision": 108,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The established one-thread-per-todo supervised execution outcome remains explicit; this round diagnoses an implementation violation without changing product scope.",
            "fact_refs": [
              "FACT-NESTED-TRUSTED-NODE-MODE-LOST"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "The unexpected window violates the recoverable task-execution interaction until the nested boundary is repaired.",
            "fact_refs": [
              "FACT-NESTED-TRUSTED-NODE-MODE-LOST"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-FIX-NESTED-TRUSTED-NODE-BOUNDARY"
            ]
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The incident concerns process identity and launch mode, not a durable visual-language decision.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "threatened",
            "reason": "The trusted Node execution boundary is incomplete at nested process.execPath launchers.",
            "fact_refs": [
              "FACT-NESTED-TRUSTED-NODE-MODE-LOST"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-FIX-NESTED-TRUSTED-NODE-BOUNDARY"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The packaged Runtime still enters Desktop mode during nested trusted Case creation.",
            "fact_refs": [
              "FACT-NESTED-TRUSTED-NODE-MODE-LOST"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-FIX-NESTED-TRUSTED-NODE-BOUNDARY"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Existing tests and package probes did not cover nested trusted child launches.",
            "fact_refs": [
              "FACT-NESTED-TRUSTED-NODE-MODE-LOST"
            ],
            "evidence": [],
            "gap_refs": [
              "GAP-FIX-NESTED-TRUSTED-NODE-BOUNDARY"
            ]
          }
        ]
      },
      "evidence": [
        "arckit-runtime://runs/RUN-20260818-181111015Z",
        "Live process tree 2026-08-19: 20688 Desktop -> 20707 Runtime -> 21446 development-case.mjs -> 21447-21449 GPU/utility/Renderer",
        "Live process environment 2026-08-19: PID 21446 lacked ELECTRON_RUN_AS_NODE and loaded app.asar/Electron Framework",
        "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs:135",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs:471",
        "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs:490",
        "runtime/arcorbit/src/ledger-writer.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-18T18:19:03.533Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Restore embedded Node mode at every nested trusted ledger subprocess boundary and verify the real packaged Case-control path.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The accepted diagnosis defines one minimal repair boundary across every nested trusted ledger launcher.",
        "snapshot_token": "394c14e11bcf9752dbbb797cf77e68c8ac3bb264cfe428ba491756702447719e",
        "selected_ref": "case-gap:CASE-20260818-007:GAP-FIX-NESTED-TRUSTED-NODE-BOUNDARY",
        "comparison_summary": "Compared all four unrelated Project gaps with the incident repair; the repair is the only ready Case obligation and directly restores blocked task execution.",
        "fresh_discovery_summary": "Implementation, source audit, tests, and packaged-host execution exposed no additional nested process.execPath launcher or downstream ordinary gap.",
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
            "reason": "This Project obligation is unrelated to the nested Electron launch and requires its own Case."
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
            "reason": "This Project obligation is unrelated to the nested Electron launch and requires its own Case."
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
            "reason": "This Project obligation is unrelated to the nested Electron launch and requires its own Case."
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
            "reason": "This Project obligation is unrelated to the nested Electron launch and requires its own Case."
          },
          {
            "ref": "case-gap:CASE-20260818-007:GAP-FIX-NESTED-TRUSTED-NODE-BOUNDARY",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "The accepted root cause makes this the only ready, incident-scoped repair obligation."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-FIX-NESTED-TRUSTED-NODE-BOUNDARY",
        "responsibility": "agent",
        "goal": "Make every nested trusted-ledger script launch explicitly retain Node mode under Electron while remaining portable under standalone Node, and prove real packaged case-control/transition/compatibility paths create no Desktop helper tree.",
        "reason": "The accepted diagnosis shows three trusted ledger spawnSync(process.execPath) boundaries inherit the globally sanitized Runtime environment and can therefore enter Desktop mode.",
        "derived_from": [
          "FACT-UNEXPECTED-SECOND-WINDOW-REPORT",
          "FACT-NESTED-TRUSTED-NODE-MODE-LOST"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Regression tests covering nested case-control, case-transition, and compatibility subprocess environments under Electron and standalone Node.",
          "Full ledger and ArcOrbit checks.",
          "A packaged-host case-control path that completes without Desktop/GPU/Renderer descendants."
        ]
      },
      "planned_transition": {
        "goal": "Restore embedded Node mode at every nested trusted ledger subprocess boundary and verify the real packaged Case-control path.",
        "expected_state_change": "Accept the nested-boundary repair fact, reconcile all threatened impacts to upheld, and resolve the repair gap."
      },
      "accepted_state_delta": {
        "facts_added": [
          {
            "id": "FACT-NESTED-TRUSTED-BOUNDARY-REPAIRED",
            "revision": 1,
            "status": "accepted",
            "statement": "All three nested trusted-ledger process.execPath launchers now use a shared self-contained environment helper that restores ELECTRON_RUN_AS_NODE=1 only when hosted by Electron; standalone Node preserves its environment, and a packaged case-control write completes without creating a Desktop helper tree.",
            "basis": "Source audit, targeted tests, full suite, package construction, and a packaged Electron case-control execution after explicit outer-environment sanitization all agree.",
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/trusted-node-subprocess.mjs",
              "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
              "runtime/arcorbit/test/runtime-process-environment.test.mjs",
              "Focused nested ledger checks: 37 passed, 0 failed",
              "npm --prefix runtime/arcorbit run check: 214 tests, 212 passed, 2 environment-gated skipped, 0 failed",
              "Local unsigned macOS x64 package build 20260818182107: succeeded",
              "Packaged-host case-control regression 2026-08-19: outer Electron environment flag removed, Case creation written=true, nested child completed, no release Desktop/GPU/Renderer process remained"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-INTERACTION-NESTED-WINDOW",
            "fact_id": "FACT-NESTED-TRUSTED-NODE-MODE-LOST",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "interaction-expectations-remain-recoverable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Task execution no longer creates an unintended Desktop window during trusted Case creation.",
            "gap_ids": [],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/trusted-node-subprocess.mjs",
              "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
              "runtime/arcorbit/test/runtime-process-environment.test.mjs",
              "Focused nested ledger checks: 37 passed, 0 failed",
              "npm --prefix runtime/arcorbit run check: 214 tests, 212 passed, 2 environment-gated skipped, 0 failed",
              "Local unsigned macOS x64 package build 20260818182107: succeeded",
              "Packaged-host case-control regression 2026-08-19: outer Electron environment flag removed, Case creation written=true, nested child completed, no release Desktop/GPU/Renderer process remained"
            ]
          },
          {
            "id": "IMPACT-TECH-NESTED-NODE-BOUNDARY",
            "fact_id": "FACT-NESTED-TRUSTED-NODE-MODE-LOST",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 18
            },
            "effect": "upheld",
            "reason": "The Desktop/Runtime/trusted capability boundary is explicit at both top-level and nested Node subprocess depths.",
            "gap_ids": [],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/trusted-node-subprocess.mjs",
              "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
              "runtime/arcorbit/test/runtime-process-environment.test.mjs",
              "Focused nested ledger checks: 37 passed, 0 failed",
              "npm --prefix runtime/arcorbit run check: 214 tests, 212 passed, 2 environment-gated skipped, 0 failed",
              "Local unsigned macOS x64 package build 20260818182107: succeeded",
              "Packaged-host case-control regression 2026-08-19: outer Electron environment flag removed, Case creation written=true, nested child completed, no release Desktop/GPU/Renderer process remained"
            ]
          },
          {
            "id": "IMPACT-REALIZATION-NESTED-WINDOW",
            "fact_id": "FACT-NESTED-TRUSTED-NODE-MODE-LOST",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "A packaged Electron host completes the formerly failing nested Case-control write with no second Desktop tree.",
            "gap_ids": [],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/trusted-node-subprocess.mjs",
              "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
              "runtime/arcorbit/test/runtime-process-environment.test.mjs",
              "Focused nested ledger checks: 37 passed, 0 failed",
              "npm --prefix runtime/arcorbit run check: 214 tests, 212 passed, 2 environment-gated skipped, 0 failed",
              "Local unsigned macOS x64 package build 20260818182107: succeeded",
              "Packaged-host case-control regression 2026-08-19: outer Electron environment flag removed, Case creation written=true, nested child completed, no release Desktop/GPU/Renderer process remained"
            ]
          },
          {
            "id": "IMPACT-RISK-NESTED-WINDOW",
            "fact_id": "FACT-NESTED-TRUSTED-NODE-MODE-LOST",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Unit, full-suite, distribution, and real packaged-host evidence now cover the nested launch path.",
            "gap_ids": [],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/trusted-node-subprocess.mjs",
              "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
              "runtime/arcorbit/test/runtime-process-environment.test.mjs",
              "Focused nested ledger checks: 37 passed, 0 failed",
              "npm --prefix runtime/arcorbit run check: 214 tests, 212 passed, 2 environment-gated skipped, 0 failed",
              "Local unsigned macOS x64 package build 20260818182107: succeeded",
              "Packaged-host case-control regression 2026-08-19: outer Electron environment flag removed, Case creation written=true, nested child completed, no release Desktop/GPU/Renderer process remained"
            ]
          }
        ],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_gap": {
          "id": "GAP-FIX-NESTED-TRUSTED-NODE-BOUNDARY",
          "status": "resolved",
          "outcome": "Nested trusted ledger subprocesses explicitly regain embedded Node mode and packaged Case creation no longer opens another ArcOrbit window.",
          "reason": "One shared helper covers all three process.execPath sites; all checks pass and the exact packaged Case-control path now completes without a Desktop/GPU/Renderer process tree.",
          "evidence": [
            "entry/skills/arckit-development-ledger/scripts/trusted-node-subprocess.mjs",
            "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
            "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
            "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
            "runtime/arcorbit/test/runtime-process-environment.test.mjs",
            "Focused nested ledger checks: 37 passed, 0 failed",
            "npm --prefix runtime/arcorbit run check: 214 tests, 212 passed, 2 environment-gated skipped, 0 failed",
            "Local unsigned macOS x64 package build 20260818182107: succeeded",
            "Packaged-host case-control regression 2026-08-19: outer Electron environment flag removed, Case creation written=true, nested child completed, no release Desktop/GPU/Renderer process remained"
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
        "project_revision": 108,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The repair preserves the established single supervised task-execution outcome without changing product scope.",
            "fact_refs": [
              "FACT-NESTED-TRUSTED-BOUNDARY-REPAIRED"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The packaged Case-control journey now completes without creating an unintended additional window.",
            "fact_refs": [
              "FACT-NESTED-TRUSTED-BOUNDARY-REPAIRED"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "Packaged-host case-control regression 2026-08-19"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The repair affects subprocess environment boundaries only and establishes no visual-language change.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "A self-contained trusted-ledger helper now makes the nested Electron-versus-Node boundary explicit at every known spawn site.",
            "fact_refs": [
              "FACT-NESTED-TRUSTED-BOUNDARY-REPAIRED"
            ],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/trusted-node-subprocess.mjs",
              "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
              "runtime/arcorbit/test/runtime-process-environment.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The real packaged Case-control path completes after outer Runtime sanitization without entering Desktop mode.",
            "fact_refs": [
              "FACT-NESTED-TRUSTED-BOUNDARY-REPAIRED"
            ],
            "evidence": [
              "Packaged-host case-control regression 2026-08-19: written=true and no release Desktop/GPU/Renderer process remained"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The exact missed nesting depth is controlled by focused tests, the full suite, packaging, and a real Electron-host execution.",
            "fact_refs": [
              "FACT-NESTED-TRUSTED-BOUNDARY-REPAIRED"
            ],
            "evidence": [
              "runtime/arcorbit/test/runtime-process-environment.test.mjs",
              "Focused nested ledger checks: 37 passed, 0 failed",
              "npm --prefix runtime/arcorbit run check: 214 tests, 212 passed, 2 environment-gated skipped, 0 failed",
              "Local unsigned macOS x64 package build 20260818182107: succeeded",
              "Packaged-host case-control regression 2026-08-19: outer Electron environment flag removed, Case creation written=true, nested child completed, no release Desktop/GPU/Renderer process remained"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/trusted-node-subprocess.mjs",
        "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
        "runtime/arcorbit/test/runtime-process-environment.test.mjs",
        "Focused nested ledger checks: 37 passed, 0 failed",
        "npm --prefix runtime/arcorbit run check: 214 tests, 212 passed, 2 environment-gated skipped, 0 failed",
        "Local unsigned macOS x64 package build 20260818182107: succeeded",
        "Packaged-host case-control regression 2026-08-19: outer Electron environment flag removed, Case creation written=true, nested child completed, no release Desktop/GPU/Renderer process remained"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-18T18:24:29.703Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Perform the mandatory five-dimension completion review for the nested trusted-ledger window regression.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The mandatory completion review is the only ready Case obligation after the exact live regression path is repaired and packaged-host verified.",
        "snapshot_token": "097a2ac9b8942b2326cfdc8eeee664398b12a310cfe270d6581ab433c175bb7c",
        "selected_ref": "case-gap:CASE-20260818-007:CASE-20260818-007:completion-review:1",
        "comparison_summary": "Compared the four unrelated Project gaps with the active Case review; only the review is incident-scoped, ready, and required for resolution.",
        "fresh_discovery_summary": "Fresh diff, source-boundary, test, package, process, and cleanup checks found no more important ordinary gap or review finding.",
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
            "reason": "This unrelated Project obligation requires a separate Case and does not outrank the active completion gate."
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
            "reason": "This unrelated Project obligation requires a separate Case and does not outrank the active completion gate."
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
            "reason": "This unrelated Project obligation requires a separate Case and does not outrank the active completion gate."
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
            "reason": "This unrelated Project obligation requires a separate Case and does not outrank the active completion gate."
          },
          {
            "ref": "case-gap:CASE-20260818-007:CASE-20260818-007:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "All ordinary incident obligations are closed; this is the required final semantic gate."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260818-007:completion-review:1",
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
        "goal": "Perform the mandatory five-dimension completion review for the nested trusted-ledger window regression.",
        "expected_state_change": "Record a clean review against content revision 2 and close the Case without content mutation."
      },
      "accepted_state_delta": {
        "facts_added": [],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [],
        "gaps_added": [],
        "gaps_cancelled": [],
        "resolved_gap": null,
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
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
            "git diff --check: clean on 2026-08-19",
            "entry/skills/arckit-development-ledger/scripts/trusted-node-subprocess.mjs",
            "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
            "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
            "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
            "runtime/arcorbit/test/runtime-process-environment.test.mjs",
            "Focused nested ledger checks: 37 passed, 0 failed",
            "npm --prefix runtime/arcorbit run check: 214 tests, 212 passed, 2 environment-gated skipped, 0 failed",
            "Unsigned macOS x64 package 20260818182107: succeeded",
            "Packaged-host case-control regression: written=true after outer flag sanitization; no release Desktop/GPU/Renderer process remained",
            "Temporary packaged regression project removed; no ARC_DEBUG marker or temporary log instrumentation remains"
          ]
        },
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
        "project_revision": 108,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The repair preserves the established single supervised task-execution outcome without changing product scope.",
            "fact_refs": [
              "FACT-NESTED-TRUSTED-BOUNDARY-REPAIRED"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The packaged Case-control journey now completes without creating an unintended additional window.",
            "fact_refs": [
              "FACT-NESTED-TRUSTED-BOUNDARY-REPAIRED"
            ],
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "Packaged-host case-control regression 2026-08-19"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The repair affects subprocess environment boundaries only and establishes no visual-language change.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "A self-contained trusted-ledger helper now makes the nested Electron-versus-Node boundary explicit at every known spawn site.",
            "fact_refs": [
              "FACT-NESTED-TRUSTED-BOUNDARY-REPAIRED"
            ],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/trusted-node-subprocess.mjs",
              "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
              "runtime/arcorbit/test/runtime-process-environment.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The real packaged Case-control path completes after outer Runtime sanitization without entering Desktop mode.",
            "fact_refs": [
              "FACT-NESTED-TRUSTED-BOUNDARY-REPAIRED"
            ],
            "evidence": [
              "Packaged-host case-control regression 2026-08-19: written=true and no release Desktop/GPU/Renderer process remained"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The exact missed nesting depth is controlled by focused tests, the full suite, packaging, and a real Electron-host execution.",
            "fact_refs": [
              "FACT-NESTED-TRUSTED-BOUNDARY-REPAIRED"
            ],
            "evidence": [
              "runtime/arcorbit/test/runtime-process-environment.test.mjs",
              "Focused nested ledger checks: 37 passed, 0 failed",
              "npm --prefix runtime/arcorbit run check: 214 tests, 212 passed, 2 environment-gated skipped, 0 failed",
              "Local unsigned macOS x64 package build 20260818182107: succeeded",
              "Packaged-host case-control regression 2026-08-19: outer Electron environment flag removed, Case creation written=true, nested child completed, no release Desktop/GPU/Renderer process remained"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "git diff --check: clean on 2026-08-19",
        "entry/skills/arckit-development-ledger/scripts/trusted-node-subprocess.mjs",
        "entry/skills/arckit-development-ledger/scripts/runtime-case-control.mjs",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
        "runtime/arcorbit/test/runtime-process-environment.test.mjs",
        "Focused nested ledger checks: 37 passed, 0 failed",
        "npm --prefix runtime/arcorbit run check: 214 tests, 212 passed, 2 environment-gated skipped, 0 failed",
        "Unsigned macOS x64 package 20260818182107: succeeded",
        "Packaged-host case-control regression: written=true after outer flag sanitization; no release Desktop/GPU/Renderer process remained",
        "Temporary packaged regression project removed; no ARC_DEBUG marker or temporary log instrumentation remains"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-18T18:25:06.050Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-DIAGNOSE-NESTED-TRUSTED-LAUNCH",
      "GAP-FIX-NESTED-TRUSTED-NODE-BOUNDARY"
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
    "updated_at": "2026-08-18T18:25:06.050Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
