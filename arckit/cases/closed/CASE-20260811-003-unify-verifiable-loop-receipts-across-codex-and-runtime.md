# Unify verifiable Loop receipts across Codex and Runtime

Case: CASE-20260811-003
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-11T10:18:49.525Z

## User Intent

Make protocol recovery, round visibility, fresh-read evidence and next-Gap selection use one ledger-owned contract in direct Codex and arckit-runtime execution.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260811-003",
  "title": "Unify verifiable Loop receipts across Codex and Runtime",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-11T09:40:35.223Z",
  "updated_at": "2026-08-11T10:18:49.525Z",
  "user_intent": "Make protocol recovery, round visibility, fresh-read evidence and next-Gap selection use one ledger-owned contract in direct Codex and arckit-runtime execution.",
  "expected_outcome": "Both hosts consume the same trusted snapshot, selection and closeout contracts without duplicating ledger semantics, and each round remains independently selected from fresh canonical state.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-LOOP-PROTOCOL-FEEDBACK",
      "revision": 1,
      "status": "accepted",
      "statement": "Direct Codex testing exposed a protocol-upgrade startup deadlock, invisible round boundaries, unverifiable fresh reads, opaque candidate comparison, and persisted composite Gaps that can overconstrain the next round.",
      "basis": "User-provided real execution feedback",
      "evidence": [
        "conversation:user-feedback-2026-08-11"
      ]
    },
    {
      "id": "FACT-CASELESS-PROTOCOL-RECOVERY",
      "revision": 1,
      "status": "accepted",
      "statement": "Protocol compatibility and reconciliation are manifest-declared trusted Ledger entrypoints that run before ordinary Case selection and do not require an active Case.",
      "basis": "The compatibility implementation and direct-Codex no-active-Case regression prove recovery no longer depends on Case transition.",
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
        "entry/skills/using-arckit/references/protocol-compatibility-recovery.md",
        "runtime/arckit-runtime/test/protocol-compatibility.test.mjs"
      ]
    },
    {
      "id": "FACT-VERIFIABLE-ROUND-BOUNDARY",
      "revision": 1,
      "status": "accepted",
      "statement": "Each normal Loop binds candidate comparison to a trusted selection token, returns a standalone accepted round closeout with no next candidate, and requires a separate post-commit snapshot receipt before continuation.",
      "basis": "Transition v7, Snapshot v1, Closeout v1, direct skill instructions, Runtime sequencing, and regression tests implement the same boundary.",
      "evidence": [
        "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
        "entry/skills/arckit-development-ledger/schema/ledger-snapshot.schema.json",
        "entry/skills/arckit-development-ledger/schema/round-closeout.schema.json",
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/test/state-condition-case.test.mjs"
      ]
    },
    {
      "id": "FACT-RUNTIME-THIN-LEDGER-HOST",
      "revision": 1,
      "status": "accepted",
      "statement": "Runtime consumes and projects trusted Ledger snapshots, selection traces, closeouts, and fresh-read receipts without reimplementing canonical candidate, revision, protocol-compatibility, or freshness semantics.",
      "basis": "State Store delegates canonical reads to loop_snapshot, Gate delegates transition validation to the Ledger entrypoint, and Desktop projection only formats supplied receipts.",
      "evidence": [
        "runtime/arckit-runtime/src/state-store.mjs",
        "runtime/arckit-runtime/src/gate-engine.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "arckit/tech/arckit-runtime/state-condition-ledger-solution.md"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-LOOP-DATA-CONTRACT",
      "fact_id": "FACT-VERIFIABLE-ROUND-BOUNDARY",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "data_and_state",
        "revision": 3
      },
      "effect": "upheld",
      "reason": "The canonical state boundary now explicitly includes Snapshot v1, Transition v7, and Closeout v1.",
      "gap_ids": [],
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/loop-snapshot.mjs",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs"
      ]
    },
    {
      "id": "IMPACT-LOOP-TECHNICAL-FOUNDATION",
      "fact_id": "FACT-RUNTIME-THIN-LEDGER-HOST",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 5
      },
      "effect": "upheld",
      "reason": "The Ledger remains the trusted deterministic layer while Runtime remains a policy-neutral host.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/src/state-store.mjs",
        "runtime/arckit-runtime/src/gate-engine.mjs"
      ]
    },
    {
      "id": "IMPACT-LOOP-USER-VISIBILITY",
      "fact_id": "FACT-VERIFIABLE-ROUND-BOUNDARY",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "experience_and_interaction",
        "revision": 3
      },
      "effect": "upheld",
      "reason": "Persisted candidates, Agent comparison, accepted closeout, and fresh-read confirmation are separately visible.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs"
      ]
    },
    {
      "id": "IMPACT-LOOP-VALIDATION",
      "fact_id": "FACT-CASELESS-PROTOCOL-RECOVERY",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "quality_and_validation",
        "revision": 2
      },
      "effect": "upheld",
      "reason": "Automated coverage includes no-Case recovery, stale selection, read/write/read ordering, concurrency, projections, and full Runtime regression.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/test/protocol-compatibility.test.mjs",
        "npm --prefix runtime/arckit-runtime run check"
      ]
    },
    {
      "id": "IMPACT-LOOP-OBSERVABILITY",
      "fact_id": "FACT-RUNTIME-THIN-LEDGER-HOST",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "observability_and_operation",
        "revision": 3
      },
      "effect": "upheld",
      "reason": "Runtime projects distinct candidate, selection, closeout, and fresh-read events without owning their canonical judgments.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-UNIFIED-LOOP-RECEIPTS",
      "status": "resolved",
      "goal": "Establish one verifiable fresh-state and round-boundary contract shared by direct Codex and Runtime execution.",
      "reason": "The current Loop has no single trusted object that binds protocol availability, candidate comparison, accepted writeback and the post-write read.",
      "derived_from": [
        "FACT-LOOP-PROTOCOL-FEEDBACK"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "critical",
        "uncertainty": "medium",
        "risk": "high",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "direct Codex recovery-path contract evidence",
        "Runtime read/write/read ordering tests",
        "trusted snapshot and closeout contract tests",
        "full Runtime check"
      ],
      "resolution": {
        "id": "GAP-UNIFIED-LOOP-RECEIPTS",
        "status": "resolved",
        "outcome": "Direct Codex and Runtime now share Ledger-owned protocol recovery, snapshot-bound selection, accepted closeout, and verified post-commit fresh-read contracts.",
        "reason": "Skills, schemas, trusted scripts, Runtime projections, stable specifications, and automated regressions agree on one thin-host design.",
        "evidence": [
          "entry/skills/arckit-development-ledger/scripts/loop-snapshot.mjs",
          "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
          "entry/skills/using-arckit/references/round-boundary-contract.md",
          "runtime/arckit-runtime/test/protocol-compatibility.test.mjs",
          "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
          "npm --prefix runtime/arckit-runtime run check: 113 tests, 112 passed, 1 environment-gated skip"
        ],
        "occurred_at": "2026-08-11T10:14:31.788Z"
      }
    },
    {
      "id": "CASE-20260811-003:review-finding:FINDING-PRIOR-SELECTION-TOKEN-NAME",
      "status": "resolved",
      "goal": "Resolve review finding: Rename the closeout field prior_snapshot_token because it actually contains the Case-scoped selection token, not the global Ledger snapshot token.",
      "reason": "error found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:1"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "entry/skills/arckit-development-ledger/schema/round-closeout.schema.json",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "roundCloseoutReceipt receives transition.gap_selection.snapshot_token",
        "rg prior_snapshot_token"
      ],
      "resolution": {
        "id": "CASE-20260811-003:review-finding:FINDING-PRIOR-SELECTION-TOKEN-NAME",
        "status": "resolved",
        "outcome": "The closeout schema and generator now expose prior_selection_token, with a regression asserting prior_snapshot_token is absent.",
        "reason": "The field name now matches the Case-scoped token's actual semantics without changing the selection or freshness algorithms.",
        "evidence": [
          "entry/skills/arckit-development-ledger/schema/round-closeout.schema.json",
          "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
          "runtime/arckit-runtime/test/state-condition-case.test.mjs",
          "npm --prefix runtime/arckit-runtime run check: 113 tests, 112 passed, 1 environment-gated skip"
        ],
        "occurred_at": "2026-08-11T10:17:52.946Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "using-arckit default completion review policy",
      "snapshotted_at": "2026-08-11T09:40:35.223Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
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
        "outcome": "findings",
        "content_revision": 1,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [
          "FINDING-PRIOR-SELECTION-TOKEN-NAME"
        ],
        "evidence": [
          "git diff --check",
          "node project-state.mjs validate: ok",
          "node project-iteration.mjs validate: ok",
          "node development-case.mjs audit: review_ready",
          "npm --prefix runtime/arckit-runtime run check: 113 tests, 112 passed, 1 environment-gated skip",
          "rg prior_snapshot_token"
        ],
        "occurred_at": "2026-08-11T10:16:15.181Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
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
          "npm --prefix runtime/arckit-runtime run check: 113 tests, 112 passed, 1 environment-gated skip",
          "git diff --check",
          "jq schema and manifest parse checks",
          "node project-state.mjs validate: ok",
          "node project-iteration.mjs validate: ok",
          "runtime/arckit-runtime/test/protocol-compatibility.test.mjs",
          "runtime/arckit-runtime/test/parallel-case.test.mjs",
          "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
          "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
          "runtime/arckit-runtime/test/state-condition-case.test.mjs",
          "rg prior_snapshot_token confirms only the negative regression assertion remains"
        ],
        "occurred_at": "2026-08-11T10:18:49.525Z"
      }
    ],
    "evidence": [
      "git diff --check",
      "node project-state.mjs validate: ok",
      "node project-iteration.mjs validate: ok",
      "node development-case.mjs audit: review_ready",
      "npm --prefix runtime/arckit-runtime run check: 113 tests, 112 passed, 1 environment-gated skip",
      "rg prior_snapshot_token",
      "jq schema and manifest parse checks",
      "runtime/arckit-runtime/test/protocol-compatibility.test.mjs",
      "runtime/arckit-runtime/test/parallel-case.test.mjs",
      "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
      "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
      "runtime/arckit-runtime/test/state-condition-case.test.mjs",
      "rg prior_snapshot_token confirms only the negative regression assertion remains"
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
      "goal": "Unify protocol recovery, candidate comparison, round closeout, and post-commit fresh-read behind Ledger-owned trusted entrypoints and receipts.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The user explicitly requested the unified Loop protocol optimization; it is the only ready Case gap and blocks reliable direct-Codex and Runtime continuation.",
        "snapshot_token": "57b7159387dcde0dafd0b918a19f9543b8fa353feb96f50702ced9203cdaeb32",
        "selected_ref": "case-gap:CASE-20260811-003:GAP-UNIFIED-LOOP-RECEIPTS",
        "comparison_summary": "Compared all five Project candidates and the active Case candidate. Project candidates require their own Case and do not supersede the user's current high-risk Loop-contract request.",
        "fresh_discovery_summary": "Implementation and review found no independent fresh result gap; code, specifications, and tests jointly evidence the same unified receipt outcome.",
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
            "reason": "Requires an isolated Skill First Case after this protocol change is available."
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
            "reason": "Broader Runtime resilience work remains valid but is not the current user-authorized Case."
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
            "reason": "Requires a permission-bearing validation project and is outside this Loop-contract Case."
          },
          {
            "ref": "project-gap:GAP-delivery-governance",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "medium",
              "urgency": "medium"
            },
            "reason": "Installation and drift governance follows isolated verification; it does not replace the current implementation."
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
            "reason": "The current transition exercises cross-record validation, but the broader real-project acceptance gap remains independently scoped."
          },
          {
            "ref": "case-gap:CASE-20260811-003:GAP-UNIFIED-LOOP-RECEIPTS",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "critical",
              "uncertainty": "medium",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the only ready Case gap and directly resolves all five reported Loop protocol failures."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-UNIFIED-LOOP-RECEIPTS",
        "responsibility": "agent",
        "goal": "Establish one verifiable fresh-state and round-boundary contract shared by direct Codex and Runtime execution.",
        "reason": "The current Loop has no single trusted object that binds protocol availability, candidate comparison, accepted writeback and the post-write read.",
        "derived_from": [
          "FACT-LOOP-PROTOCOL-FEEDBACK"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "critical",
          "uncertainty": "medium",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "direct Codex recovery-path contract evidence",
          "Runtime read/write/read ordering tests",
          "trusted snapshot and closeout contract tests",
          "full Runtime check"
        ]
      },
      "planned_transition": {
        "goal": "Unify protocol recovery, candidate comparison, round closeout, and post-commit fresh-read behind Ledger-owned trusted entrypoints and receipts.",
        "expected_state_change": "Direct Codex and Runtime share Transition v7, Snapshot v1, Closeout v1, and the same verifiable read/write/read sequence without duplicate Runtime semantics."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-UNIFIED-LOOP-RECEIPTS",
          "status": "resolved",
          "outcome": "Direct Codex and Runtime now share Ledger-owned protocol recovery, snapshot-bound selection, accepted closeout, and verified post-commit fresh-read contracts.",
          "reason": "Skills, schemas, trusted scripts, Runtime projections, stable specifications, and automated regressions agree on one thin-host design.",
          "evidence": [
            "entry/skills/arckit-development-ledger/scripts/loop-snapshot.mjs",
            "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
            "entry/skills/using-arckit/references/round-boundary-contract.md",
            "runtime/arckit-runtime/test/protocol-compatibility.test.mjs",
            "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
            "npm --prefix runtime/arckit-runtime run check: 113 tests, 112 passed, 1 environment-gated skip"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-CASELESS-PROTOCOL-RECOVERY",
            "revision": 1,
            "status": "accepted",
            "statement": "Protocol compatibility and reconciliation are manifest-declared trusted Ledger entrypoints that run before ordinary Case selection and do not require an active Case.",
            "basis": "The compatibility implementation and direct-Codex no-active-Case regression prove recovery no longer depends on Case transition.",
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
              "entry/skills/using-arckit/references/protocol-compatibility-recovery.md",
              "runtime/arckit-runtime/test/protocol-compatibility.test.mjs"
            ]
          },
          {
            "id": "FACT-VERIFIABLE-ROUND-BOUNDARY",
            "revision": 1,
            "status": "accepted",
            "statement": "Each normal Loop binds candidate comparison to a trusted selection token, returns a standalone accepted round closeout with no next candidate, and requires a separate post-commit snapshot receipt before continuation.",
            "basis": "Transition v7, Snapshot v1, Closeout v1, direct skill instructions, Runtime sequencing, and regression tests implement the same boundary.",
            "evidence": [
              "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
              "entry/skills/arckit-development-ledger/schema/ledger-snapshot.schema.json",
              "entry/skills/arckit-development-ledger/schema/round-closeout.schema.json",
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/test/state-condition-case.test.mjs"
            ]
          },
          {
            "id": "FACT-RUNTIME-THIN-LEDGER-HOST",
            "revision": 1,
            "status": "accepted",
            "statement": "Runtime consumes and projects trusted Ledger snapshots, selection traces, closeouts, and fresh-read receipts without reimplementing canonical candidate, revision, protocol-compatibility, or freshness semantics.",
            "basis": "State Store delegates canonical reads to loop_snapshot, Gate delegates transition validation to the Ledger entrypoint, and Desktop projection only formats supplied receipts.",
            "evidence": [
              "runtime/arckit-runtime/src/state-store.mjs",
              "runtime/arckit-runtime/src/gate-engine.mjs",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-LOOP-DATA-CONTRACT",
            "fact_id": "FACT-VERIFIABLE-ROUND-BOUNDARY",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 3
            },
            "effect": "upheld",
            "reason": "The canonical state boundary now explicitly includes Snapshot v1, Transition v7, and Closeout v1.",
            "gap_ids": [],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/loop-snapshot.mjs",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs"
            ]
          },
          {
            "id": "IMPACT-LOOP-TECHNICAL-FOUNDATION",
            "fact_id": "FACT-RUNTIME-THIN-LEDGER-HOST",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 5
            },
            "effect": "upheld",
            "reason": "The Ledger remains the trusted deterministic layer while Runtime remains a policy-neutral host.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/src/state-store.mjs",
              "runtime/arckit-runtime/src/gate-engine.mjs"
            ]
          },
          {
            "id": "IMPACT-LOOP-USER-VISIBILITY",
            "fact_id": "FACT-VERIFIABLE-ROUND-BOUNDARY",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "experience_and_interaction",
              "revision": 3
            },
            "effect": "upheld",
            "reason": "Persisted candidates, Agent comparison, accepted closeout, and fresh-read confirmation are separately visible.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "runtime/arckit-runtime/test/token-usage-projector.test.mjs"
            ]
          },
          {
            "id": "IMPACT-LOOP-VALIDATION",
            "fact_id": "FACT-CASELESS-PROTOCOL-RECOVERY",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "quality_and_validation",
              "revision": 2
            },
            "effect": "upheld",
            "reason": "Automated coverage includes no-Case recovery, stale selection, read/write/read ordering, concurrency, projections, and full Runtime regression.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/test/protocol-compatibility.test.mjs",
              "npm --prefix runtime/arckit-runtime run check"
            ]
          },
          {
            "id": "IMPACT-LOOP-OBSERVABILITY",
            "fact_id": "FACT-RUNTIME-THIN-LEDGER-HOST",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "observability_and_operation",
              "revision": 3
            },
            "effect": "upheld",
            "reason": "Runtime projects distinct candidate, selection, closeout, and fresh-read events without owning their canonical judgments.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs"
            ]
          }
        ],
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
        "software_definition_changes": [
          {
            "area_ref": "data_and_state",
            "observed_revision": 2,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical project data is Project v5, Iteration v3 and Case v5 in arckit/; normal Loop mutation uses Case Transition v7 bound to Ledger Snapshot v1, produces Round Closeout v1, and requires a verified post-commit snapshot before continuation. Runtime run/session/thread records stay outside the target project and only opaque refs enter the ledger.",
              "reason": "The Ledger now owns the complete read/select/write/closeout/read contract shared by direct Codex and Runtime.",
              "evidence": [
                "entry/skills/arckit-development-ledger/scripts/loop-snapshot.mjs",
                "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
                "arckit/tech/arckit-runtime/state-condition-ledger-solution.md"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [
              "GAP-cross-record-audit"
            ],
            "reason": "Transition v7 and the snapshot/closeout receipts materially extend the canonical state contract.",
            "evidence": [
              "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
              "entry/skills/arckit-development-ledger/schema/ledger-snapshot.schema.json",
              "entry/skills/arckit-development-ledger/schema/round-closeout.schema.json"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 4,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit uses repository-owned Markdown/JSON state, Node.js ESM Ledger and Runtime scripts, an Electron desktop host, Project State v5, Case v5, Case Transition v7, Ledger Snapshot v1, Round Closeout v1, and Iteration v3. Runtime calls manifest-declared trusted Ledger entrypoints instead of duplicating canonical state mechanisms.",
              "reason": "The thin-host integration centralizes compatibility, candidate, revision, transition, closeout, and freshness semantics in the Ledger capability.",
              "evidence": [
                "entry/skills/arckit-development-ledger/arckit.capability.json",
                "runtime/arckit-runtime/src/state-store.mjs",
                "runtime/arckit-runtime/src/gate-engine.mjs",
                "runtime/arckit-runtime/src/state-driven-runner.mjs"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "The trusted snapshot and closeout entrypoints change the stable Runtime/Ledger architecture boundary.",
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md"
            ]
          },
          {
            "area_ref": "experience_and_interaction",
            "observed_revision": 2,
            "set_decision": {
              "status": "settled",
              "statement": "Users can invoke using-arckit conversationally; Desktop users observe the persisted candidate catalog, Agent comparison and exclusion reasons, an independent accepted round closeout, and a verified post-commit fresh-read in one persistent Agent conversation.",
              "reason": "The round boundary is now explicitly visible without splitting the coherent Agent into planner and worker turns.",
              "evidence": [
                "arckit/spec/agentic-software-development/controller-worker-loop.md",
                "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
                "runtime/arckit-runtime/src/projection/run-event-projector.mjs"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [],
            "reason": "The user-visible candidate, closeout, and fresh-read sequence is a stable interaction contract.",
            "evidence": [
              "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs"
            ]
          },
          {
            "area_ref": "quality_and_validation",
            "observed_revision": 1,
            "set_decision": {
              "status": "settled",
              "statement": "Protocol changes require schema/script validation, cross-record audits, Runtime automated tests, projection checks, direct-Codex no-Case recovery evidence, stale-token checks, read/write/read ordering checks, and risk-proportionate real execution evidence.",
              "reason": "The unified receipt protocol adds explicit regressions for the startup deadlock and each round-boundary failure mode.",
              "evidence": [
                "runtime/arckit-runtime/test/protocol-compatibility.test.mjs",
                "runtime/arckit-runtime/test/state-condition-case.test.mjs",
                "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
                "runtime/arckit-runtime/test/parallel-case.test.mjs",
                "npm --prefix runtime/arckit-runtime run check: 113 tests, 112 passed, 1 environment-gated skip"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation",
              "GAP-cross-record-audit"
            ],
            "reason": "The failure reports establish new durable acceptance gates.",
            "evidence": [
              "runtime/arckit-runtime/test/protocol-compatibility.test.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "runtime/arckit-runtime/test/token-usage-projector.test.mjs"
            ]
          },
          {
            "area_ref": "observability_and_operation",
            "observed_revision": 2,
            "set_decision": {
              "status": "settled",
              "statement": "Runtime persists lifecycle, activity, messages and timing outside the target project, supports restart reconciliation, exposes opaque run refs, and separately projects Ledger candidate catalogs, Agent selection traces, accepted round closeouts, and post-commit fresh-read receipts.",
              "reason": "Users can now distinguish prior-round acceptance from next-round state without Runtime inventing canonical semantics.",
              "evidence": [
                "runtime/arckit-runtime/src/state-driven-runner.mjs",
                "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
                "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "Round receipt visibility extends the stable operations and observability contract.",
            "evidence": [
              "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
              "arckit/tech/arckit-runtime/desktop-execution-solution.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "entry/skills/arckit-development-ledger/scripts/loop-snapshot.mjs",
          "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
          "runtime/arckit-runtime/src/state-driven-runner.mjs",
          "arckit/spec/agentic-software-development/controller-worker-loop.md",
          "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
          "npm --prefix runtime/arckit-runtime run check: 113 tests, 112 passed, 1 environment-gated skip"
        ]
      },
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/arckit-development-ledger/SKILL.md",
        "entry/skills/arckit-development-ledger/scripts/loop-snapshot.mjs",
        "runtime/arckit-runtime/src/state-store.mjs",
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/test/protocol-compatibility.test.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
        "npm --prefix runtime/arckit-runtime run check: 113 tests, 112 passed, 1 environment-gated skip"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-11T10:14:31.788Z"
    },
    {
      "round": 2,
      "goal": "Review content revision 1 against the five completion dimensions without mutating implementation content.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case gaps and impacts are closed, so the Ledger-derived completion review is the only ready Case candidate.",
        "snapshot_token": "284fc9428318971f72eefd95ddf072c8fb3e365fd4eb5d6119570dbf5f7ce3fa",
        "selected_ref": "case-gap:CASE-20260811-003:CASE-20260811-003:completion-review:1",
        "comparison_summary": "Compared all five Project candidates with the derived completion review. Project candidates require separate Cases; the review is the only ready obligation for this Case.",
        "fresh_discovery_summary": "Review discovered one concrete naming defect, which is recorded as a finding rather than repaired inside the review transition.",
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
            "reason": "Requires a separate isolated validation Case."
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
            "reason": "Broader Runtime resilience remains outside this Case."
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
            "reason": "Requires a permission-bearing project."
          },
          {
            "ref": "project-gap:GAP-delivery-governance",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "medium",
              "urgency": "medium"
            },
            "reason": "Governance follows verification and user confirmation."
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
            "reason": "The broader real-project audit remains independently scoped."
          },
          {
            "ref": "case-gap:CASE-20260811-003:CASE-20260811-003:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the only ready Case obligation after Round 1."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260811-003:completion-review:1",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:1"
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
        "goal": "Review content revision 1 against the five completion dimensions without mutating implementation content.",
        "expected_state_change": "Record the review finding as a normal repair Gap and keep the Case unresolved."
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
          "outcome": "findings",
          "reviewer": "agent",
          "reviewed_content_revision": 1,
          "dimensions": {
            "implementation_correctness": "findings",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "FINDING-PRIOR-SELECTION-TOKEN-NAME",
              "kind": "error",
              "statement": "Rename the closeout field prior_snapshot_token because it actually contains the Case-scoped selection token, not the global Ledger snapshot token.",
              "responsibility": "agent",
              "artifact_refs": [
                "entry/skills/arckit-development-ledger/schema/round-closeout.schema.json",
                "entry/skills/arckit-development-ledger/scripts/case-transition.mjs"
              ],
              "evidence": [
                "roundCloseoutReceipt receives transition.gap_selection.snapshot_token",
                "rg prior_snapshot_token"
              ]
            }
          ],
          "evidence": [
            "git diff --check",
            "node project-state.mjs validate: ok",
            "node project-iteration.mjs validate: ok",
            "node development-case.mjs audit: review_ready",
            "npm --prefix runtime/arckit-runtime run check: 113 tests, 112 passed, 1 environment-gated skip",
            "rg prior_snapshot_token"
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
      "evidence": [
        "git diff --check",
        "npm --prefix runtime/arckit-runtime run check: 113 tests, 112 passed, 1 environment-gated skip",
        "entry/skills/arckit-development-ledger/schema/round-closeout.schema.json",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-11T10:16:15.181Z"
    },
    {
      "round": 3,
      "goal": "Rename the misleading closeout field to prior_selection_token and prove the old field is absent.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The review finding is the only ready Case gap and blocks a clean completion review.",
        "snapshot_token": "88d3ba062dcd00d15e4885b75e07f32c8e8e23abbce78e968a480d6dba0b4aef",
        "selected_ref": "case-gap:CASE-20260811-003:CASE-20260811-003:review-finding:FINDING-PRIOR-SELECTION-TOKEN-NAME",
        "comparison_summary": "Compared all persisted Project candidates with the single repair candidate; the Project items require separate Cases and the repair is necessary for this Case to proceed.",
        "fresh_discovery_summary": "No additional fresh defect or result gap was found during the bounded field rename and regression run.",
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
            "reason": "Requires a separate isolated validation Case."
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
            "reason": "Broader Runtime resilience remains outside this repair."
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
            "reason": "Requires a permission-bearing project."
          },
          {
            "ref": "project-gap:GAP-delivery-governance",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "medium",
              "urgency": "medium"
            },
            "reason": "Governance follows isolated verification and confirmation."
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
            "reason": "The broader real-project audit remains independently scoped."
          },
          {
            "ref": "case-gap:CASE-20260811-003:CASE-20260811-003:review-finding:FINDING-PRIOR-SELECTION-TOKEN-NAME",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "The naming mismatch is the only ready Case obligation and has a minimal deterministic repair."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260811-003:review-finding:FINDING-PRIOR-SELECTION-TOKEN-NAME",
        "responsibility": "agent",
        "goal": "Resolve review finding: Rename the closeout field prior_snapshot_token because it actually contains the Case-scoped selection token, not the global Ledger snapshot token.",
        "reason": "error found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:1"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "entry/skills/arckit-development-ledger/schema/round-closeout.schema.json",
          "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
          "roundCloseoutReceipt receives transition.gap_selection.snapshot_token",
          "rg prior_snapshot_token"
        ]
      },
      "planned_transition": {
        "goal": "Rename the misleading closeout field to prior_selection_token and prove the old field is absent.",
        "expected_state_change": "Closeout v1 accurately distinguishes the prior Case-scoped selection token from the post-commit global snapshot token."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260811-003:review-finding:FINDING-PRIOR-SELECTION-TOKEN-NAME",
          "status": "resolved",
          "outcome": "The closeout schema and generator now expose prior_selection_token, with a regression asserting prior_snapshot_token is absent.",
          "reason": "The field name now matches the Case-scoped token's actual semantics without changing the selection or freshness algorithms.",
          "evidence": [
            "entry/skills/arckit-development-ledger/schema/round-closeout.schema.json",
            "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
            "runtime/arckit-runtime/test/state-condition-case.test.mjs",
            "npm --prefix runtime/arckit-runtime run check: 113 tests, 112 passed, 1 environment-gated skip"
          ]
        },
        "facts_added": [],
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
      "evidence": [
        "entry/skills/arckit-development-ledger/schema/round-closeout.schema.json",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "runtime/arckit-runtime/test/state-condition-case.test.mjs",
        "npm --prefix runtime/arckit-runtime run check: 113 tests, 112 passed, 1 environment-gated skip"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-11T10:17:52.946Z"
    },
    {
      "round": 4,
      "goal": "Review content revision 2 against all five completion dimensions and close the Case only if clean.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All repair work is closed and the content-revision-2 completion review is the only ready Case candidate.",
        "snapshot_token": "e42a996fd35ec370b58c00a9b4e46a077f683a7a6adee1d979701df979399690",
        "selected_ref": "case-gap:CASE-20260811-003:CASE-20260811-003:completion-review:2",
        "comparison_summary": "Compared all five Project candidates with the fresh completion-review candidate. The Project items require separate Cases; this review is the sole remaining obligation for the current Case.",
        "fresh_discovery_summary": "No fresh implementation, specification, test, or consistency gap was found after the token-field repair and full regression run.",
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
            "reason": "Requires a separate isolated Skill First validation Case."
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
            "reason": "Broader Runtime resilience remains outside this Case."
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
            "reason": "Requires a permission-bearing project."
          },
          {
            "ref": "project-gap:GAP-delivery-governance",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "medium",
              "urgency": "medium"
            },
            "reason": "Governance follows isolated verification and user confirmation."
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
            "reason": "The broader real-project audit remains independently scoped."
          },
          {
            "ref": "case-gap:CASE-20260811-003:CASE-20260811-003:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the only remaining Case obligation and all required review evidence is available."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260811-003:completion-review:2",
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
        "goal": "Review content revision 2 against all five completion dimensions and close the Case only if clean.",
        "expected_state_change": "Record a clean review for content revision 2 and deterministically resolve the Case."
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
            "npm --prefix runtime/arckit-runtime run check: 113 tests, 112 passed, 1 environment-gated skip",
            "git diff --check",
            "jq schema and manifest parse checks",
            "node project-state.mjs validate: ok",
            "node project-iteration.mjs validate: ok",
            "runtime/arckit-runtime/test/protocol-compatibility.test.mjs",
            "runtime/arckit-runtime/test/parallel-case.test.mjs",
            "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
            "runtime/arckit-runtime/test/token-usage-projector.test.mjs",
            "runtime/arckit-runtime/test/state-condition-case.test.mjs",
            "rg prior_snapshot_token confirms only the negative regression assertion remains"
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
      "evidence": [
        "npm --prefix runtime/arckit-runtime run check: 113 tests, 112 passed, 1 environment-gated skip",
        "git diff --check",
        "entry/skills/arckit-development-ledger/scripts/loop-snapshot.mjs",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/test/protocol-compatibility.test.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "runtime/arckit-runtime/test/token-usage-projector.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-11T10:18:49.525Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-UNIFIED-LOOP-RECEIPTS",
      "CASE-20260811-003:review-finding:FINDING-PRIOR-SELECTION-TOKEN-NAME"
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
    "updated_at": "2026-08-11T10:18:49.525Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
