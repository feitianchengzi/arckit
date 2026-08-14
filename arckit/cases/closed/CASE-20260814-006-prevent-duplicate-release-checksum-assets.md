# Prevent duplicate release checksum assets

Case: CASE-20260814-006
Status: closed
Artifact Type: workflow
Selected Gap: none
Updated: 2026-08-14T13:35:55.765Z

## User Intent

Repair the manually dispatched Runtime release workflow so multi-platform artifacts publish to one draft release without duplicate asset-name failures, then deliver the fix on main and a new TF tag.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260814-006",
  "title": "Prevent duplicate release checksum assets",
  "status": "closed",
  "artifact_type": "workflow",
  "created_at": "2026-08-14T13:29:06.860Z",
  "updated_at": "2026-08-14T13:35:55.765Z",
  "user_intent": "Repair the manually dispatched Runtime release workflow so multi-platform artifacts publish to one draft release without duplicate asset-name failures, then deliver the fix on main and a new TF tag.",
  "expected_outcome": "The publish job combines all target checksum manifests into one deterministic checksums.txt, rejects any remaining duplicate Release asset basename before mutation, updates an existing draft safely, and remains covered by repository tests.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-RELEASE-ASSET-COLLISION-001",
      "revision": 1,
      "status": "accepted",
      "statement": "Every package matrix target uploads a file named checksums.txt, while the publish job downloads all target artifacts and passes every nested file to one GitHub Release whose asset namespace is flat.",
      "basis": "The workflow, finalize script, HTTP 422 response, and partially created tf/v0.1.0-b4 draft all agree: the first checksums.txt uploads and the next same-named asset is rejected.",
      "evidence": [
        ".github/workflows/arckit-runtime-package.yml",
        "runtime/arckit-runtime/scripts/finalize-package-artifacts.mjs",
        "GitHub Actions failure: ReleaseAsset.name already exists for checksums.txt",
        "GitHub draft release tf/v0.1.0-b4 contains one checksums.txt after partial creation"
      ]
    },
    {
      "id": "FACT-RELEASE-ASSET-COLLISION-002",
      "revision": 1,
      "status": "accepted",
      "statement": "Runtime draft-release preparation revalidates each target checksum against the downloaded installer, replaces all target-local manifests with one sorted aggregate checksums.txt, and fails before Release mutation if any prospective asset basename is duplicated.",
      "basis": "The workflow invokes the new preparation boundary after artifact download, unit tests exercise success and both failure gates, and the full Runtime check passes.",
      "evidence": [
        ".github/workflows/arckit-runtime-package.yml",
        "runtime/arckit-runtime/scripts/prepare-release-assets.mjs",
        "runtime/arckit-runtime/test/prepare-release-assets.test.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "arckit/tech/arckit-runtime/installer-supply-chain.md"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-RELEASE-ASSET-COLLISION",
      "fact_id": "FACT-RELEASE-ASSET-COLLISION-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "delivery_and_distribution",
        "revision": 3
      },
      "effect": "upheld",
      "reason": "The governed all-target draft-release path now presents GitHub with one verified checksum manifest and a basename-unique asset set.",
      "gap_ids": [],
      "evidence": [
        ".github/workflows/arckit-runtime-package.yml",
        "runtime/arckit-runtime/scripts/prepare-release-assets.mjs",
        "runtime/arckit-runtime/test/prepare-release-assets.test.mjs",
        "verification: npm run check passed with 0 failures"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-UNIQUE-RELEASE-ASSETS",
      "status": "resolved",
      "goal": "Publish one deterministic aggregate checksums.txt and guarantee every uploaded GitHub Release asset basename is unique before creating or updating a draft.",
      "reason": "Per-target checksum files have identical names and the current publish job performs no flattening collision check.",
      "derived_from": [
        "case_intent",
        "FACT-RELEASE-ASSET-COLLISION-001"
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
        "A deterministic aggregation test proving all per-target installer checksum lines appear exactly once in one checksums.txt.",
        "A duplicate-basename rejection test and workflow contract coverage proving publish uses the prepared unique asset set.",
        "The complete Runtime check passes."
      ],
      "resolution": {
        "id": "GAP-UNIQUE-RELEASE-ASSETS",
        "status": "resolved",
        "outcome": "The publish job verifies every target checksum against its installer, writes one deterministically sorted aggregate checksums.txt, removes target-local manifests, and rejects any remaining duplicate Release asset basename before GitHub mutation.",
        "reason": "Targeted tests cover aggregation, digest mismatch and duplicate-name failure before mutation; workflow contract coverage and the complete Runtime suite pass.",
        "evidence": [
          ".github/workflows/arckit-runtime-package.yml",
          "runtime/arckit-runtime/scripts/prepare-release-assets.mjs",
          "runtime/arckit-runtime/test/prepare-release-assets.test.mjs",
          "runtime/arckit-runtime/test/package-distribution.test.mjs",
          "arckit/tech/arckit-runtime/installer-supply-chain.md",
          "verification: git diff --check passed",
          "verification: npm run check passed 183 tests with 1 environment-gated skip and 0 failures"
        ],
        "occurred_at": "2026-08-14T13:34:21.341Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "using-arckit default autonomous completion review policy",
      "snapshotted_at": "2026-08-14T13:29:06.860Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 1,
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
        "content_revision": 1,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          ".github/workflows/arckit-runtime-package.yml",
          "runtime/arckit-runtime/scripts/prepare-release-assets.mjs",
          "runtime/arckit-runtime/test/prepare-release-assets.test.mjs",
          "runtime/arckit-runtime/test/package-distribution.test.mjs",
          "arckit/tech/arckit-runtime/installer-supply-chain.md",
          "verification: preparation executes after artifact download and before gh release view/upload/create",
          "verification: git diff --check passed",
          "verification: npm run check passed 183 tests with 1 environment-gated skip and 0 failures"
        ],
        "occurred_at": "2026-08-14T13:35:55.765Z"
      }
    ],
    "evidence": [
      ".github/workflows/arckit-runtime-package.yml",
      "runtime/arckit-runtime/scripts/prepare-release-assets.mjs",
      "runtime/arckit-runtime/test/prepare-release-assets.test.mjs",
      "runtime/arckit-runtime/test/package-distribution.test.mjs",
      "arckit/tech/arckit-runtime/installer-supply-chain.md",
      "verification: preparation executes after artifact download and before gh release view/upload/create",
      "verification: git diff --check passed",
      "verification: npm run check passed 183 tests with 1 environment-gated skip and 0 failures"
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
      "goal": "Prepare one verified, deterministic and basename-unique Release asset set before invoking GitHub Release mutation.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The checksum collision is the sole Case-local blocker after every requested platform package succeeded.",
        "snapshot_token": "31326102a8f78d7fa216b8706a800b336951b1e2dd6144889ccb2af9b0ad242e",
        "selected_ref": "case-gap:CASE-20260814-006:GAP-UNIQUE-RELEASE-ASSETS",
        "comparison_summary": "Compared all four independent Project candidates with the ready Release-asset collision repair and selected the bounded publish blocker.",
        "fresh_discovery_summary": "Implementation and validation found no additional downstream obligation beyond deterministic checksum aggregation, digest verification, and pre-upload basename uniqueness.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Agent scenario evaluation does not unblock the failing draft release."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Runtime resilience work is independent of Release asset preparation."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Permission-bearing project validation is unrelated to the flat asset-name collision."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Cross-record auditing does not precede this packaging workflow repair."
          },
          {
            "ref": "case-gap:CASE-20260814-006:GAP-UNIQUE-RELEASE-ASSETS",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the only ready Case gap and directly blocks the authorized TF draft release."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-UNIQUE-RELEASE-ASSETS",
        "responsibility": "agent",
        "goal": "Publish one deterministic aggregate checksums.txt and guarantee every uploaded GitHub Release asset basename is unique before creating or updating a draft.",
        "reason": "Per-target checksum files have identical names and the current publish job performs no flattening collision check.",
        "derived_from": [
          "case_intent",
          "FACT-RELEASE-ASSET-COLLISION-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "A deterministic aggregation test proving all per-target installer checksum lines appear exactly once in one checksums.txt.",
          "A duplicate-basename rejection test and workflow contract coverage proving publish uses the prepared unique asset set.",
          "The complete Runtime check passes."
        ]
      },
      "planned_transition": {
        "goal": "Prepare one verified, deterministic and basename-unique Release asset set before invoking GitHub Release mutation.",
        "expected_state_change": "All target checksums become one aggregate asset, duplicate basenames fail before upload, and existing drafts can be safely updated with --clobber."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-UNIQUE-RELEASE-ASSETS",
          "status": "resolved",
          "outcome": "The publish job verifies every target checksum against its installer, writes one deterministically sorted aggregate checksums.txt, removes target-local manifests, and rejects any remaining duplicate Release asset basename before GitHub mutation.",
          "reason": "Targeted tests cover aggregation, digest mismatch and duplicate-name failure before mutation; workflow contract coverage and the complete Runtime suite pass.",
          "evidence": [
            ".github/workflows/arckit-runtime-package.yml",
            "runtime/arckit-runtime/scripts/prepare-release-assets.mjs",
            "runtime/arckit-runtime/test/prepare-release-assets.test.mjs",
            "runtime/arckit-runtime/test/package-distribution.test.mjs",
            "arckit/tech/arckit-runtime/installer-supply-chain.md",
            "verification: git diff --check passed",
            "verification: npm run check passed 183 tests with 1 environment-gated skip and 0 failures"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-RELEASE-ASSET-COLLISION-002",
            "revision": 1,
            "status": "accepted",
            "statement": "Runtime draft-release preparation revalidates each target checksum against the downloaded installer, replaces all target-local manifests with one sorted aggregate checksums.txt, and fails before Release mutation if any prospective asset basename is duplicated.",
            "basis": "The workflow invokes the new preparation boundary after artifact download, unit tests exercise success and both failure gates, and the full Runtime check passes.",
            "evidence": [
              ".github/workflows/arckit-runtime-package.yml",
              "runtime/arckit-runtime/scripts/prepare-release-assets.mjs",
              "runtime/arckit-runtime/test/prepare-release-assets.test.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "arckit/tech/arckit-runtime/installer-supply-chain.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-RELEASE-ASSET-COLLISION",
            "fact_id": "FACT-RELEASE-ASSET-COLLISION-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "delivery_and_distribution",
              "revision": 3
            },
            "effect": "upheld",
            "reason": "The governed all-target draft-release path now presents GitHub with one verified checksum manifest and a basename-unique asset set.",
            "gap_ids": [],
            "evidence": [
              ".github/workflows/arckit-runtime-package.yml",
              "runtime/arckit-runtime/scripts/prepare-release-assets.mjs",
              "runtime/arckit-runtime/test/prepare-release-assets.test.mjs",
              "verification: npm run check passed with 0 failures"
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
        "project_revision": 60,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The manually triggered multi-platform draft-release capability remains explicit and the repaired asset boundary realizes it.",
            "fact_refs": [
              "FACT-RELEASE-ASSET-COLLISION-002"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              ".github/workflows/arckit-runtime-package.yml"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "Release asset aggregation changes no end-user action, navigation, feedback, or recovery state.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The publish workflow change has no visual-language effect.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Checksum aggregation, revalidation, uniqueness, and draft rerun semantics are durable in the installer supply-chain technical solution.",
            "fact_refs": [
              "FACT-RELEASE-ASSET-COLLISION-002"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "runtime/arckit-runtime/scripts/prepare-release-assets.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "The workflow invokes the tested preparation script before collecting paths for either release create or upload.",
            "fact_refs": [
              "FACT-RELEASE-ASSET-COLLISION-002"
            ],
            "evidence": [
              ".github/workflows/arckit-runtime-package.yml",
              "runtime/arckit-runtime/test/package-distribution.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Tests cover deterministic aggregation, checksum mismatch, duplicate basename rejection before mutation, workflow binding, and the complete Runtime regression surface.",
            "fact_refs": [
              "FACT-RELEASE-ASSET-COLLISION-002"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/prepare-release-assets.test.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "verification: npm run check passed 183 tests with 1 environment-gated skip and 0 failures"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        ".github/workflows/arckit-runtime-package.yml",
        "runtime/arckit-runtime/scripts/prepare-release-assets.mjs",
        "runtime/arckit-runtime/test/prepare-release-assets.test.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "verification: git diff --check passed",
        "verification: npm run check passed 183 tests with 1 environment-gated skip and 0 failures"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T13:34:21.341Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Perform the implementation-focused completion review for content revision 1.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case obligations are closed, so the content-revision-1 completion review is the only eligible Case candidate.",
        "snapshot_token": "d8a0643648d90e628515b50b216275a10eaa5657b0b56e4b6090ae8b180833d3",
        "selected_ref": "case-gap:CASE-20260814-006:CASE-20260814-006:completion-review:1",
        "comparison_summary": "Compared the terminal Case review with all four persisted Project candidates and selected the only Case-local closeout gate.",
        "fresh_discovery_summary": "Final source, ordering, failure-boundary, documentation and regression audits found no additional repair gap.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Agent scenario evaluation remains independent of this completed release-workflow repair."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "The broader Runtime resilience gap does not alter this Case closeout."
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Security project validation is outside the Release asset namespace scope."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "risk": "high"
            },
            "reason": "Cross-record audit work does not precede the implementation-focused Case review."
          },
          {
            "ref": "case-gap:CASE-20260814-006:CASE-20260814-006:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the sole Case candidate and required terminal quality gate."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260814-006:completion-review:1",
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
        "goal": "Perform the implementation-focused completion review for content revision 1.",
        "expected_state_change": "The Case closes only if correctness, problem resolution, verification credibility, regression risk and minimality are all clean."
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
          "reviewed_content_revision": 1,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            ".github/workflows/arckit-runtime-package.yml",
            "runtime/arckit-runtime/scripts/prepare-release-assets.mjs",
            "runtime/arckit-runtime/test/prepare-release-assets.test.mjs",
            "runtime/arckit-runtime/test/package-distribution.test.mjs",
            "arckit/tech/arckit-runtime/installer-supply-chain.md",
            "verification: preparation executes after artifact download and before gh release view/upload/create",
            "verification: git diff --check passed",
            "verification: npm run check passed 183 tests with 1 environment-gated skip and 0 failures"
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
        "project_revision": 60,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The reviewed workflow restores the declared manually triggered multi-platform draft-release outcome.",
            "fact_refs": [
              "FACT-RELEASE-ASSET-COLLISION-002"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              ".github/workflows/arckit-runtime-package.yml"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The reviewed CI publish boundary changes no end-user interaction semantics.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The reviewed CI publish boundary has no visual-language effect.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Final review confirms the stable aggregation, verification, uniqueness and draft update rules agree across code and technical documentation.",
            "fact_refs": [
              "FACT-RELEASE-ASSET-COLLISION-002"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "runtime/arckit-runtime/scripts/prepare-release-assets.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Call-order inspection confirms every Release create or upload is preceded by the tested unique-asset preparation boundary.",
            "fact_refs": [
              "FACT-RELEASE-ASSET-COLLISION-002"
            ],
            "evidence": [
              ".github/workflows/arckit-runtime-package.yml",
              "verification: preparation executes before all gh release mutations"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The review confirms both the original duplicate-name failure and checksum-integrity regression paths are covered with no unrelated implementation expansion.",
            "fact_refs": [
              "FACT-RELEASE-ASSET-COLLISION-002"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/prepare-release-assets.test.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "verification: npm run check passed 183 tests with 1 environment-gated skip and 0 failures"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        ".github/workflows/arckit-runtime-package.yml",
        "runtime/arckit-runtime/scripts/prepare-release-assets.mjs",
        "runtime/arckit-runtime/test/prepare-release-assets.test.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "verification: preparation executes after artifact download and before gh release view/upload/create",
        "verification: git diff --check passed",
        "verification: npm run check passed 183 tests with 1 environment-gated skip and 0 failures"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T13:35:55.765Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-UNIQUE-RELEASE-ASSETS"
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
    "updated_at": "2026-08-14T13:35:55.765Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
