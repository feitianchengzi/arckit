# Restore shared skill resources in Desktop installation

Case: CASE-20260814-008
Status: closed
Artifact Type: code
Selected Gap: none
Updated: 2026-08-14T14:31:58.232Z

## User Intent

Fix arckit-runtime Desktop skill installation so the installed governed skills include the required _arckit_shared directory.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260814-008",
  "title": "Restore shared skill resources in Desktop installation",
  "status": "closed",
  "artifact_type": "code",
  "created_at": "2026-08-14T14:13:13.751Z",
  "updated_at": "2026-08-14T14:31:58.232Z",
  "user_intent": "Fix arckit-runtime Desktop skill installation so the installed governed skills include the required _arckit_shared directory.",
  "expected_outcome": "Desktop Setup Readiness installs _arckit_shared together with the governed Arckit skills and regression evidence proves the installed resource contract.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-SHARED-INSTALL-001",
      "revision": 1,
      "status": "accepted",
      "statement": "The arckit-runtime Desktop client currently installs skills without the required _arckit_shared directory.",
      "basis": "The user reported the observed installed skills result.",
      "evidence": [
        "user report: arckit-runtime Desktop installed skills are missing _arckit_shared"
      ]
    },
    {
      "id": "FACT-SHARED-INSTALL-ROOT-CAUSE",
      "revision": 1,
      "status": "accepted",
      "statement": "Runtime distribution assembly excludes definition/skills/_arckit_shared because discoverSkillPaths admits only directories containing SKILL.md; the asset never enters the packaged payload, although ArcForge already discovers non-skill shared assets under skills containers and transactionally copies them to ambient agent skill roots.",
      "basis": "The complete source-to-target code path matches the symptom: the source asset exists and is referenced, assembly filters it out, no other payload copy includes it, and downstream logic can apply only staged assets.",
      "evidence": [
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "definition/skills/_arckit_shared/case-gap-contract.md",
        "definition/skills/arckit-spec/SKILL.md",
        "../arcforge/src/core/skills.ts",
        "../arcforge/src/core/skill-availability-apply.ts"
      ]
    },
    {
      "id": "FACT-SHARED-INSTALL-REPAIRED",
      "revision": 1,
      "status": "accepted",
      "statement": "Runtime distribution assembly now packages definition/skills/_arckit_shared as a governed shared asset, records it in the payload manifest and distribution lock, and the embedded ArcForge provider installs both shared files into the Codex user skills root with clean post-apply drift.",
      "basis": "Focused assembly tests, a real embedded-provider provisioning smoke, the complete Runtime test suite, diff checks, and ledger audits all pass.",
      "evidence": [
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
        "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
        "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
        "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
        "verification: git diff --check and trusted Project/Case audits passed"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-SHARED-INSTALL-DELIVERY",
      "fact_id": "FACT-SHARED-INSTALL-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "delivery_and_distribution",
        "revision": 3
      },
      "effect": "upheld",
      "reason": "The packaged payload now includes and verifies the required shared asset.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
        "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
        "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
        "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
        "verification: git diff --check and trusted Project/Case audits passed"
      ]
    },
    {
      "id": "IMPACT-SHARED-INSTALL-REALIZATION",
      "fact_id": "FACT-SHARED-INSTALL-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Real provider smoke proves _arckit_shared reaches the ambient Codex skills root and drift converges.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
        "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
        "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
        "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
        "verification: git diff --check and trusted Project/Case audits passed"
      ]
    },
    {
      "id": "IMPACT-SHARED-INSTALL-PRODUCT",
      "fact_id": "FACT-SHARED-INSTALL-ROOT-CAUSE",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 6
      },
      "effect": "upheld",
      "reason": "Setup Readiness now provisions complete governed definition skills including their shared dependency.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
        "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
        "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
        "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
        "verification: git diff --check and trusted Project/Case audits passed"
      ]
    },
    {
      "id": "IMPACT-SHARED-INSTALL-PRODUCT-INVARIANT",
      "fact_id": "FACT-SHARED-INSTALL-ROOT-CAUSE",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "product-expectations-remain-recoverable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The accepted complete provisioning outcome is realized and covered by durable regression gates.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
        "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
        "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
        "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
        "verification: git diff --check and trusted Project/Case audits passed"
      ]
    },
    {
      "id": "IMPACT-SHARED-INSTALL-TECHNICAL-INVARIANT",
      "fact_id": "FACT-SHARED-INSTALL-ROOT-CAUSE",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "technical-decisions-remain-explainable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Assembler output now preserves the shared-asset input expected by the existing ArcForge provider boundary.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
        "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
        "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
        "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
        "verification: git diff --check and trusted Project/Case audits passed"
      ]
    },
    {
      "id": "IMPACT-SHARED-INSTALL-RISK-INVARIANT",
      "fact_id": "FACT-SHARED-INSTALL-ROOT-CAUSE",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "material-risks-have-credible-evidence",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Package assembly and real provisioning smoke independently guard payload and installed-target completeness.",
      "gap_ids": [],
      "evidence": [
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
        "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
        "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
        "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
        "verification: git diff --check and trusted Project/Case audits passed"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-SHARED-INSTALL-DIAGNOSE",
      "status": "resolved",
      "goal": "Establish the root cause and exact repair boundary for omission of _arckit_shared from Desktop-installed skills.",
      "reason": "The omission could originate in packaged resource assembly, governed-skill discovery, install-plan construction, or directory-copy behavior; a safe repair depends on identifying the actual boundary.",
      "derived_from": [
        "case_intent",
        "FACT-SHARED-INSTALL-001"
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
        "Traceable code, packaging, and test evidence identifying where _arckit_shared should enter the install contract and why it is omitted."
      ],
      "resolution": {
        "id": "GAP-SHARED-INSTALL-DIAGNOSE",
        "status": "resolved",
        "outcome": "Runtime distribution assembly omits the shared directory before provisioning begins.",
        "reason": "The assembler copies only direct skill directories containing SKILL.md; _arckit_shared intentionally has none, while ArcForge already applies shared assets when present in the staged source.",
        "evidence": [
          "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
          "definition/skills/_arckit_shared/case-gap-contract.md",
          "definition/skills/arckit-spec/SKILL.md",
          "../arcforge/src/core/skills.ts",
          "../arcforge/src/core/skill-availability-apply.ts"
        ],
        "occurred_at": "2026-08-14T14:24:55.184Z"
      }
    },
    {
      "id": "GAP-SHARED-INSTALL-REPAIR",
      "status": "resolved",
      "goal": "Ensure Runtime distribution assembly includes _arckit_shared as a governed shared asset and verify ArcForge provisioning installs it beside ambient Codex skills.",
      "reason": "The root cause is confined to the distribution payload input: ArcForge already discovers, plans, applies, drifts, and rolls back shared assets present in the staged source.",
      "derived_from": [
        "FACT-SHARED-INSTALL-001",
        "FACT-SHARED-INSTALL-ROOT-CAUSE"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high",
        "user_impact": "high",
        "uncertainty": "low"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Distribution assembly regression evidence that the payload and manifest include definition/skills/_arckit_shared.",
        "Provisioning smoke evidence that both shared files reach the Codex user skills root and post-apply drift is clean.",
        "Focused Runtime tests and distribution checks pass without temporary diagnostic instrumentation."
      ],
      "resolution": {
        "id": "GAP-SHARED-INSTALL-REPAIR",
        "status": "resolved",
        "outcome": "Runtime distribution payloads now include governed shared assets and provisioning installs _arckit_shared beside ambient Codex skills.",
        "reason": "Distribution assembly now separates skill paths from shared asset paths, includes both in payload digests and lock metadata, and package plus real provider smoke tests prove the shared files reach the target with clean drift.",
        "evidence": [
          "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
          "runtime/arckit-runtime/test/package-distribution.test.mjs",
          "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
          "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
          "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
          "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
          "verification: git diff --check and trusted Project/Case audits passed"
        ],
        "occurred_at": "2026-08-14T14:30:16.587Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-08-14T14:13:13.751Z"
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
          "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
          "runtime/arckit-runtime/test/package-distribution.test.mjs",
          "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
          "arckit/spec/arckit-runtime-distribution.md",
          "arckit/tech/arckit-runtime/installer-supply-chain.md",
          "verification: package distribution tests passed 2 of 2",
          "verification: real embedded-provider smoke installed both _arckit_shared files with missing 0 changed 0 same 14",
          "verification: Runtime check passed 183, failed 0, skipped 1",
          "verification: git diff --check and trusted Project/Case audits passed",
          "verification: no ARC_DEBUG marker remained and smoke temp was cleaned"
        ],
        "occurred_at": "2026-08-14T14:31:58.232Z"
      }
    ],
    "evidence": [
      "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
      "runtime/arckit-runtime/test/package-distribution.test.mjs",
      "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
      "arckit/spec/arckit-runtime-distribution.md",
      "arckit/tech/arckit-runtime/installer-supply-chain.md",
      "verification: package distribution tests passed 2 of 2",
      "verification: real embedded-provider smoke installed both _arckit_shared files with missing 0 changed 0 same 14",
      "verification: Runtime check passed 183, failed 0, skipped 1",
      "verification: git diff --check and trusted Project/Case audits passed",
      "verification: no ARC_DEBUG marker remained and smoke temp was cleaned"
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
      "goal": "Trace source through assembly, payload, provider discovery, planning, and application to identify the first omission and repair boundary.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The reported missing shared dependency directly blocks installed definition skills, and diagnosis is the prerequisite for safe repair.",
        "snapshot_token": "560c2ce228c4433aa746a6f128b8ca3f4446c77582182771c4ae73ea81e2ba8e",
        "selected_ref": "case-gap:CASE-20260814-008:GAP-SHARED-INSTALL-DIAGNOSE",
        "comparison_summary": "Selected CASE-008 diagnosis over four case-required Project gaps because it directly addresses the current user increment.",
        "fresh_discovery_summary": "Diagnosis exposed one downstream repair candidate; it is deferred until the root-cause fact is accepted and fresh-read.",
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
            "reason": "Requires its own Case and is less immediate than the reported installer defect."
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
            "reason": "Requires its own Case and does not establish why the shared dependency is missing."
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
            "reason": "Requires its own permission-bearing Case and is unrelated to this packaging omission."
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
            "reason": "Requires its own Case and does not unblock the current installation failure."
          },
          {
            "ref": "case-gap:CASE-20260814-008:GAP-SHARED-INSTALL-DIAGNOSE",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Directly addresses the current report and is the prerequisite for repair."
          },
          {
            "ref": "fresh-gap:CASE-20260814-008:GAP-SHARED-INSTALL-REPAIR",
            "source": "fresh",
            "eligibility": "ineligible",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "high",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Its boundary was derived from facts established this round and must wait for closeout and fresh-read."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-SHARED-INSTALL-DIAGNOSE",
        "responsibility": "agent",
        "goal": "Establish the root cause and exact repair boundary for omission of _arckit_shared from Desktop-installed skills.",
        "reason": "The omission could originate in packaged resource assembly, governed-skill discovery, install-plan construction, or directory-copy behavior; a safe repair depends on identifying the actual boundary.",
        "derived_from": [
          "case_intent",
          "FACT-SHARED-INSTALL-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "high",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Traceable code, packaging, and test evidence identifying where _arckit_shared should enter the install contract and why it is omitted."
        ]
      },
      "planned_transition": {
        "goal": "Trace source through assembly, payload, provider discovery, planning, and application to identify the first omission and repair boundary.",
        "expected_state_change": "Accept one root-cause fact, resolve diagnosis, and expose one downstream repair Gap without executing it."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-SHARED-INSTALL-DIAGNOSE",
          "status": "resolved",
          "outcome": "Runtime distribution assembly omits the shared directory before provisioning begins.",
          "reason": "The assembler copies only direct skill directories containing SKILL.md; _arckit_shared intentionally has none, while ArcForge already applies shared assets when present in the staged source.",
          "evidence": [
            "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
            "definition/skills/_arckit_shared/case-gap-contract.md",
            "definition/skills/arckit-spec/SKILL.md",
            "../arcforge/src/core/skills.ts",
            "../arcforge/src/core/skill-availability-apply.ts"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-SHARED-INSTALL-ROOT-CAUSE",
            "revision": 1,
            "status": "accepted",
            "statement": "Runtime distribution assembly excludes definition/skills/_arckit_shared because discoverSkillPaths admits only directories containing SKILL.md; the asset never enters the packaged payload, although ArcForge already discovers non-skill shared assets under skills containers and transactionally copies them to ambient agent skill roots.",
            "basis": "The complete source-to-target code path matches the symptom: the source asset exists and is referenced, assembly filters it out, no other payload copy includes it, and downstream logic can apply only staged assets.",
            "evidence": [
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "definition/skills/_arckit_shared/case-gap-contract.md",
              "definition/skills/arckit-spec/SKILL.md",
              "../arcforge/src/core/skills.ts",
              "../arcforge/src/core/skill-availability-apply.ts"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-SHARED-INSTALL-PRODUCT",
            "fact_id": "FACT-SHARED-INSTALL-ROOT-CAUSE",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 6
            },
            "effect": "threatened",
            "reason": "Setup Readiness cannot establish complete governed definition skills while their shared dependency is absent.",
            "gap_ids": [
              "GAP-SHARED-INSTALL-REPAIR"
            ],
            "evidence": [
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "definition/skills/arckit-spec/SKILL.md"
            ]
          },
          {
            "id": "IMPACT-SHARED-INSTALL-PRODUCT-INVARIANT",
            "fact_id": "FACT-SHARED-INSTALL-ROOT-CAUSE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "product-expectations-remain-recoverable",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The accepted complete governed skill provisioning outcome is not realized by the assembled payload.",
            "gap_ids": [
              "GAP-SHARED-INSTALL-REPAIR"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs"
            ]
          },
          {
            "id": "IMPACT-SHARED-INSTALL-TECHNICAL-INVARIANT",
            "fact_id": "FACT-SHARED-INSTALL-ROOT-CAUSE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "technical-decisions-remain-explainable",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The assembler discards the shared-asset input already supported by the provider boundary.",
            "gap_ids": [
              "GAP-SHARED-INSTALL-REPAIR"
            ],
            "evidence": [
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "../arcforge/src/core/skills.ts"
            ]
          },
          {
            "id": "IMPACT-SHARED-INSTALL-RISK-INVARIANT",
            "fact_id": "FACT-SHARED-INSTALL-ROOT-CAUSE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Distribution checks do not assert shared dependencies reach payload or installed target.",
            "gap_ids": [
              "GAP-SHARED-INSTALL-REPAIR"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-SHARED-INSTALL-DELIVERY",
            "fact_id": "FACT-SHARED-INSTALL-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "delivery_and_distribution",
              "revision": 3
            },
            "effect": "threatened",
            "reason": "Distribution assembly excludes a required shared skill asset from the payload.",
            "gap_ids": [
              "GAP-SHARED-INSTALL-REPAIR"
            ],
            "evidence": [
              "user report: installed skills are missing _arckit_shared",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs"
            ]
          },
          {
            "id": "IMPACT-SHARED-INSTALL-REALIZATION",
            "fact_id": "FACT-SHARED-INSTALL-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Setup Readiness remains unrealized until the shared asset is packaged and installed.",
            "gap_ids": [
              "GAP-SHARED-INSTALL-REPAIR"
            ],
            "evidence": [
              "user report: installed skills are missing _arckit_shared",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-SHARED-INSTALL-REPAIR",
            "status": "open",
            "goal": "Ensure Runtime distribution assembly includes _arckit_shared as a governed shared asset and verify ArcForge provisioning installs it beside ambient Codex skills.",
            "reason": "The root cause is confined to the distribution payload input: ArcForge already discovers, plans, applies, drifts, and rolls back shared assets present in the staged source.",
            "derived_from": [
              "FACT-SHARED-INSTALL-001",
              "FACT-SHARED-INSTALL-ROOT-CAUSE"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "high",
              "risk": "high",
              "user_impact": "high",
              "uncertainty": "low"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Distribution assembly regression evidence that the payload and manifest include definition/skills/_arckit_shared.",
              "Provisioning smoke evidence that both shared files reach the Codex user skills root and post-apply drift is clean.",
              "Focused Runtime tests and distribution checks pass without temporary diagnostic instrumentation."
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
        "project_revision": 64,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "threatened",
            "reason": "The diagnosed omission prevents complete governed skill provisioning.",
            "fact_refs": [
              "FACT-SHARED-INSTALL-001",
              "FACT-SHARED-INSTALL-ROOT-CAUSE"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs"
            ],
            "gap_refs": [
              "GAP-SHARED-INSTALL-REPAIR"
            ]
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "Diagnosis does not change Setup Readiness actions, confirmation, feedback, navigation, or recovery.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The filesystem dependency does not affect visual presentation rules.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "threatened",
            "reason": "Assembly discards a provider-supported shared-asset input.",
            "fact_refs": [
              "FACT-SHARED-INSTALL-ROOT-CAUSE"
            ],
            "evidence": [
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "../arcforge/src/core/skills.ts",
              "../arcforge/src/core/skill-availability-apply.ts"
            ],
            "gap_refs": [
              "GAP-SHARED-INSTALL-REPAIR"
            ]
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The installed client remains incomplete until _arckit_shared reaches the Codex skills root.",
            "fact_refs": [
              "FACT-SHARED-INSTALL-001",
              "FACT-SHARED-INSTALL-ROOT-CAUSE"
            ],
            "evidence": [
              "user report: installed skills are missing _arckit_shared",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs"
            ],
            "gap_refs": [
              "GAP-SHARED-INSTALL-REPAIR"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Current checks omit shared-asset payload and target assertions.",
            "fact_refs": [
              "FACT-SHARED-INSTALL-ROOT-CAUSE"
            ],
            "evidence": [
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs"
            ],
            "gap_refs": [
              "GAP-SHARED-INSTALL-REPAIR"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "definition/skills/_arckit_shared/case-gap-contract.md",
        "definition/skills/arckit-spec/SKILL.md",
        "../arcforge/src/core/skills.ts",
        "../arcforge/src/core/skill-availability-apply.ts",
        "definition/skills/_arckit_shared/content-spec.md",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T14:24:55.184Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Include non-skill shared asset directories in the governed distribution payload and add package plus real provisioning regression gates.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The accepted root cause makes the bounded distribution assembly repair ready and it directly restores the user-reported installation contract.",
        "snapshot_token": "7d353263dac7429740791fa770ed987f66ec38009fc7dfed447ad52459621db8",
        "selected_ref": "case-gap:CASE-20260814-008:GAP-SHARED-INSTALL-REPAIR",
        "comparison_summary": "Selected the only CASE-008 ready Gap over four unrelated case-required Project gaps.",
        "fresh_discovery_summary": "No additional fresh candidate was discovered; implementation and verification stayed within the accepted repair boundary.",
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
            "reason": "Requires its own Case and is unrelated to the bounded repair."
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
            "reason": "Requires its own Case and is unrelated to this payload completeness defect."
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
            "reason": "Requires its own permission-bearing Case."
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
            "reason": "Requires its own Case and does not block the selected repair."
          },
          {
            "ref": "case-gap:CASE-20260814-008:GAP-SHARED-INSTALL-REPAIR",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Selected because the root cause is accepted and this directly restores the reported installation contract."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-SHARED-INSTALL-REPAIR",
        "responsibility": "agent",
        "goal": "Ensure Runtime distribution assembly includes _arckit_shared as a governed shared asset and verify ArcForge provisioning installs it beside ambient Codex skills.",
        "reason": "The root cause is confined to the distribution payload input: ArcForge already discovers, plans, applies, drifts, and rolls back shared assets present in the staged source.",
        "derived_from": [
          "FACT-SHARED-INSTALL-001",
          "FACT-SHARED-INSTALL-ROOT-CAUSE"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "low",
          "risk": "high",
          "user_impact": "high"
        },
        "evidence_required": [
          "Distribution assembly regression evidence that the payload and manifest include definition/skills/_arckit_shared.",
          "Provisioning smoke evidence that both shared files reach the Codex user skills root and post-apply drift is clean.",
          "Focused Runtime tests and distribution checks pass without temporary diagnostic instrumentation."
        ]
      },
      "planned_transition": {
        "goal": "Include non-skill shared asset directories in the governed distribution payload and add package plus real provisioning regression gates.",
        "expected_state_change": "Resolve the repair Gap with complete payload and installed-target evidence, and reconcile all related impacts to upheld."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-SHARED-INSTALL-REPAIR",
          "status": "resolved",
          "outcome": "Runtime distribution payloads now include governed shared assets and provisioning installs _arckit_shared beside ambient Codex skills.",
          "reason": "Distribution assembly now separates skill paths from shared asset paths, includes both in payload digests and lock metadata, and package plus real provider smoke tests prove the shared files reach the target with clean drift.",
          "evidence": [
            "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
            "runtime/arckit-runtime/test/package-distribution.test.mjs",
            "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
            "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
            "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
            "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
            "verification: git diff --check and trusted Project/Case audits passed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-SHARED-INSTALL-REPAIRED",
            "revision": 1,
            "status": "accepted",
            "statement": "Runtime distribution assembly now packages definition/skills/_arckit_shared as a governed shared asset, records it in the payload manifest and distribution lock, and the embedded ArcForge provider installs both shared files into the Codex user skills root with clean post-apply drift.",
            "basis": "Focused assembly tests, a real embedded-provider provisioning smoke, the complete Runtime test suite, diff checks, and ledger audits all pass.",
            "evidence": [
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
              "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
              "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
              "verification: git diff --check and trusted Project/Case audits passed"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-SHARED-INSTALL-DELIVERY",
            "fact_id": "FACT-SHARED-INSTALL-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "delivery_and_distribution",
              "revision": 3
            },
            "effect": "upheld",
            "reason": "The packaged payload now includes and verifies the required shared asset.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
              "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
              "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
              "verification: git diff --check and trusted Project/Case audits passed"
            ]
          },
          {
            "id": "IMPACT-SHARED-INSTALL-REALIZATION",
            "fact_id": "FACT-SHARED-INSTALL-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Real provider smoke proves _arckit_shared reaches the ambient Codex skills root and drift converges.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
              "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
              "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
              "verification: git diff --check and trusted Project/Case audits passed"
            ]
          },
          {
            "id": "IMPACT-SHARED-INSTALL-PRODUCT",
            "fact_id": "FACT-SHARED-INSTALL-ROOT-CAUSE",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 6
            },
            "effect": "upheld",
            "reason": "Setup Readiness now provisions complete governed definition skills including their shared dependency.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
              "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
              "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
              "verification: git diff --check and trusted Project/Case audits passed"
            ]
          },
          {
            "id": "IMPACT-SHARED-INSTALL-PRODUCT-INVARIANT",
            "fact_id": "FACT-SHARED-INSTALL-ROOT-CAUSE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "product-expectations-remain-recoverable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The accepted complete provisioning outcome is realized and covered by durable regression gates.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
              "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
              "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
              "verification: git diff --check and trusted Project/Case audits passed"
            ]
          },
          {
            "id": "IMPACT-SHARED-INSTALL-TECHNICAL-INVARIANT",
            "fact_id": "FACT-SHARED-INSTALL-ROOT-CAUSE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "technical-decisions-remain-explainable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Assembler output now preserves the shared-asset input expected by the existing ArcForge provider boundary.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
              "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
              "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
              "verification: git diff --check and trusted Project/Case audits passed"
            ]
          },
          {
            "id": "IMPACT-SHARED-INSTALL-RISK-INVARIANT",
            "fact_id": "FACT-SHARED-INSTALL-ROOT-CAUSE",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "material-risks-have-credible-evidence",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Package assembly and real provisioning smoke independently guard payload and installed-target completeness.",
            "gap_ids": [],
            "evidence": [
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
              "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
              "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
              "verification: git diff --check and trusted Project/Case audits passed"
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
        "project_revision": 64,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The existing complete governed provisioning expectation is realized without changing its product meaning.",
            "fact_refs": [
              "FACT-SHARED-INSTALL-ROOT-CAUSE",
              "FACT-SHARED-INSTALL-REPAIRED"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
              "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
              "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
              "verification: git diff --check and trusted Project/Case audits passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The repair does not alter Setup Readiness actions, states, confirmation, feedback, navigation, or recovery.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The repair changes packaged filesystem resources and regression evidence only.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The assembler now supplies the shared assets already supported by the provider while preserving existing Runtime and provider responsibilities.",
            "fact_refs": [
              "FACT-SHARED-INSTALL-ROOT-CAUSE",
              "FACT-SHARED-INSTALL-REPAIRED"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "../arcforge/src/core/skills.ts",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
              "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
              "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
              "verification: git diff --check and trusted Project/Case audits passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Real provisioning smoke proves both shared files are installed and post-drift is clean.",
            "fact_refs": [
              "FACT-SHARED-INSTALL-REPAIRED"
            ],
            "evidence": [
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
              "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
              "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
              "verification: git diff --check and trusted Project/Case audits passed"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Assembly coverage, real provider smoke, the full Runtime suite, diff checks, and ledger audits proportionately cover the regression.",
            "fact_refs": [
              "FACT-SHARED-INSTALL-REPAIRED"
            ],
            "evidence": [
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
              "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
              "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
              "verification: git diff --check and trusted Project/Case audits passed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
        "verification: node --test runtime/arckit-runtime/test/package-distribution.test.mjs passed 2 of 2",
        "verification: local arcforge-embedded-provider distribution smoke installed _arckit_shared and converged with missing 0 changed 0 same 14",
        "verification: npm --prefix runtime/arckit-runtime run check passed 183, failed 0, skipped 1",
        "verification: git diff --check and trusted Project/Case audits passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T14:30:16.587Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review content revision 2 across correctness, problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case obligations are closed, so the implementation-focused completion review is the only eligible CASE-008 action.",
        "snapshot_token": "adf53460ddf6c93cbeb45e7921ecd806dbf445781c3a4c009b9c5f30d9d7cd8d",
        "selected_ref": "case-gap:CASE-20260814-008:CASE-20260814-008:completion-review:1",
        "comparison_summary": "Selected the terminal CASE-008 review over four unrelated case-required Project gaps.",
        "fresh_discovery_summary": "No more important fresh ordinary Gap or review finding was discovered.",
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
            "reason": "Requires its own Case and is outside this completion review."
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
            "reason": "Requires its own Case and is outside this completion review."
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
            "reason": "Requires its own permission-bearing Case."
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
            "reason": "Requires its own Case and is outside this bounded review."
          },
          {
            "ref": "case-gap:CASE-20260814-008:CASE-20260814-008:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "Selected because all implementation obligations are closed and this is the terminal Case gate."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260814-008:completion-review:1",
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
        "goal": "Review content revision 2 across correctness, problem resolution, verification credibility, regression risk, and minimality.",
        "expected_state_change": "Accept a clean review for the unchanged implementation and resolve CASE-008 if all five dimensions are clean."
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
            "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
            "runtime/arckit-runtime/test/package-distribution.test.mjs",
            "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
            "arckit/spec/arckit-runtime-distribution.md",
            "arckit/tech/arckit-runtime/installer-supply-chain.md",
            "verification: package distribution tests passed 2 of 2",
            "verification: real embedded-provider smoke installed both _arckit_shared files with missing 0 changed 0 same 14",
            "verification: Runtime check passed 183, failed 0, skipped 1",
            "verification: git diff --check and trusted Project/Case audits passed",
            "verification: no ARC_DEBUG marker remained and smoke temp was cleaned"
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
        "project_revision": 64,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "Review confirms the complete governed provisioning capability is realized without changing its durable product meaning.",
            "fact_refs": [
              "FACT-SHARED-INSTALL-REPAIRED"
            ],
            "evidence": [
              "arckit/spec/arckit-runtime-distribution.md",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "verification: package distribution tests passed 2 of 2",
              "verification: real embedded-provider smoke installed both _arckit_shared files with missing 0 changed 0 same 14",
              "verification: Runtime check passed 183, failed 0, skipped 1",
              "verification: git diff --check and trusted Project/Case audits passed",
              "verification: no ARC_DEBUG marker remained and smoke temp was cleaned"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "Review confirms no interaction actions, states, feedback, navigation, or recovery behavior changed.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "Review confirms no visual presentation surface changed.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Review confirms the assembler now supplies the provider-supported shared asset without changing Runtime or provider ownership.",
            "fact_refs": [
              "FACT-SHARED-INSTALL-ROOT-CAUSE",
              "FACT-SHARED-INSTALL-REPAIRED"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "verification: package distribution tests passed 2 of 2",
              "verification: real embedded-provider smoke installed both _arckit_shared files with missing 0 changed 0 same 14",
              "verification: Runtime check passed 183, failed 0, skipped 1",
              "verification: git diff --check and trusted Project/Case audits passed",
              "verification: no ARC_DEBUG marker remained and smoke temp was cleaned"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Real provider smoke and post-drift evidence directly realize the repaired installation fact.",
            "fact_refs": [
              "FACT-SHARED-INSTALL-REPAIRED"
            ],
            "evidence": [
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "verification: package distribution tests passed 2 of 2",
              "verification: real embedded-provider smoke installed both _arckit_shared files with missing 0 changed 0 same 14",
              "verification: Runtime check passed 183, failed 0, skipped 1",
              "verification: git diff --check and trusted Project/Case audits passed",
              "verification: no ARC_DEBUG marker remained and smoke temp was cleaned"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Review confirms repeatable assembly, real provisioning, full-suite, diff, audit, and cleanup evidence covers the material regression risk.",
            "fact_refs": [
              "FACT-SHARED-INSTALL-REPAIRED"
            ],
            "evidence": [
              "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
              "runtime/arckit-runtime/test/package-distribution.test.mjs",
              "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
              "arckit/spec/arckit-runtime-distribution.md",
              "arckit/tech/arckit-runtime/installer-supply-chain.md",
              "verification: package distribution tests passed 2 of 2",
              "verification: real embedded-provider smoke installed both _arckit_shared files with missing 0 changed 0 same 14",
              "verification: Runtime check passed 183, failed 0, skipped 1",
              "verification: git diff --check and trusted Project/Case audits passed",
              "verification: no ARC_DEBUG marker remained and smoke temp was cleaned"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arckit-runtime/scripts/prepare-distribution.mjs",
        "runtime/arckit-runtime/test/package-distribution.test.mjs",
        "runtime/arckit-runtime/scripts/smoke-distribution.mjs",
        "arckit/spec/arckit-runtime-distribution.md",
        "arckit/tech/arckit-runtime/installer-supply-chain.md",
        "verification: package distribution tests passed 2 of 2",
        "verification: real embedded-provider smoke installed both _arckit_shared files with missing 0 changed 0 same 14",
        "verification: Runtime check passed 183, failed 0, skipped 1",
        "verification: git diff --check and trusted Project/Case audits passed",
        "verification: no ARC_DEBUG marker remained and smoke temp was cleaned"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-14T14:31:58.232Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-SHARED-INSTALL-DIAGNOSE",
      "GAP-SHARED-INSTALL-REPAIR"
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
    "updated_at": "2026-08-14T14:31:58.232Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
