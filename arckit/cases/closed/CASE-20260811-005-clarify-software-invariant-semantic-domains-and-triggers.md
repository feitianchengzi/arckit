# Clarify software invariant semantic domains and triggers

Case: CASE-20260811-005
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-11T16:52:06.147Z

## User Intent

Make core software invariants reliably expose affected durable product, interaction, visual, technical, realization, and risk facts from fresh Case evidence without fixed artifact routing.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260811-005",
  "title": "Clarify software invariant semantic domains and triggers",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-11T16:40:36.979Z",
  "updated_at": "2026-08-11T16:52:06.147Z",
  "user_intent": "Make core software invariants reliably expose affected durable product, interaction, visual, technical, realization, and risk facts from fresh Case evidence without fixed artifact routing.",
  "expected_outcome": "Every core invariant has a distinct semantic responsibility, applies to newly established as well as missing, stale, ambiguous, or contradicted durable facts, and separates authoritative expectations from realization and risk evidence.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-INVARIANT-SEMANTICS-001",
      "revision": 1,
      "status": "accepted",
      "statement": "The current core invariant direction is valid, but transition-centric triggers, overlapping product/interaction/visual boundaries, the narrow technical-contract framing, and undifferentiated persistent evidence can cause materially relevant durable facts to be missed.",
      "basis": "The user explicitly accepted the analysis and requested the corresponding Arckit optimization.",
      "evidence": [
        "current Codex conversation: accepted software_invariants analysis"
      ]
    },
    {
      "id": "FACT-INVARIANT-SEMANTICS-002",
      "revision": 1,
      "status": "accepted",
      "statement": "The maintained Arckit protocol now interprets six core software invariants from fresh Case facts: four distinct authoritative durable expectation or decision domains, actual-state realization, and material-risk evidence; missing, stale, ambiguous, and contradicted facts are first-class applicability triggers.",
      "basis": "Canonical definitions, Loop guidance, stable product and technical facts, compatible Project State, and the full Runtime check agree.",
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
        "entry/skills/using-arckit/references/round-boundary-contract.md",
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
        "verification:protocol-compatibility:compatible",
        "verification:npm-run-check:119-pass-1-environment-skip"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-INVARIANT-SEMANTICS-001",
      "fact_id": "FACT-INVARIANT-SEMANTICS-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 3
      },
      "effect": "upheld",
      "reason": "Invariant-guided Gap discovery now starts from fresh facts, covers missing and invalidated durable semantics, and distinguishes evidence responsibilities without fixed routing.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/product-concepts.md",
        "entry/skills/using-arckit/SKILL.md",
        "runtime/arckit-runtime/test/project-ledger-governance.test.mjs"
      ]
    },
    {
      "id": "IMPACT-INVARIANT-PRODUCT-002",
      "fact_id": "FACT-INVARIANT-SEMANTICS-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "product-expectations-remain-recoverable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Stable product definitions now state the fresh-fact trigger model and the distinct responsibility of durable product expectations.",
      "gap_ids": [],
      "evidence": [
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/controller-worker-loop.md"
      ]
    },
    {
      "id": "IMPACT-INVARIANT-TECH-003",
      "fact_id": "FACT-INVARIANT-SEMANTICS-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 7
      },
      "effect": "upheld",
      "reason": "The technical foundation now explains catalog ownership, semantic responsibility boundaries, evidence separation, and policy-neutral Runtime behavior.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
        "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs"
      ]
    },
    {
      "id": "IMPACT-INVARIANT-TECH-004",
      "fact_id": "FACT-INVARIANT-SEMANTICS-002",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "technical-decisions-remain-explainable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The broadened technical invariant and its rationale are explicit in canonical source and stable technical evidence.",
      "gap_ids": [],
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
        "arckit/tech/arckit-runtime/state-condition-ledger-solution.md"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-INVARIANT-SEMANTICS-001",
      "status": "resolved",
      "goal": "Establish distinct, fresh-fact-driven canonical software invariant semantics that reliably surface affected durable expectations, technical decisions, realization obligations, and material risk evidence without fixed skill or artifact routing.",
      "reason": "The user-approved semantic correction is required before invariant-guided Case loops can reliably decide whether long-lived project facts need confirmation or maintenance.",
      "derived_from": [
        "FACT-INVARIANT-SEMANTICS-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "The ambiguity directly affects every later Case round that relies on invariant-guided Gap discovery.",
        "uncertainty": "The desired semantic correction is accepted; the remaining work is to encode it consistently in canonical protocol, guidance, and evidence.",
        "risk": "Partial wording changes could preserve the same retrospective or artifact-substitution failure under different names.",
        "user_impact": "Agents may otherwise continue to omit relevant product, interaction, visual, or technical fact maintenance."
      },
      "responsibility": "agent",
      "evidence_required": [
        "Canonical triggers start from fresh facts and cover newly established, changed, missing, stale, ambiguous, and contradicted durable facts.",
        "Product, interaction, visual, and technical invariants have distinct abstract semantic boundaries while remaining independent of skills, paths, and artifact routing.",
        "Expectation evidence, realization evidence, and risk evidence cannot silently substitute for one another.",
        "Protocol guidance, fixtures, and local validation agree with the revised invariant catalog."
      ],
      "resolution": {
        "id": "GAP-INVARIANT-SEMANTICS-001",
        "status": "resolved",
        "outcome": "The six core invariants now use fresh-fact-driven triggers, distinct product/interaction/visual/technical semantic boundaries, and separate authoritative expectation, realization, and risk evidence responsibilities without fixed routing.",
        "reason": "Canonical source, Agent guidance, stable product and technical definitions, Project State reconciliation, and regression evidence agree.",
        "evidence": [
          "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
          "entry/skills/using-arckit/SKILL.md",
          "arckit/spec/agentic-software-development/product-concepts.md",
          "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
          "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
          "verification:npm-run-check:119-pass-1-environment-skip"
        ],
        "occurred_at": "2026-08-11T16:49:01.275Z"
      }
    }
  ],
  "content_revision": 1,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "using-arckit implementation-focused completion review",
      "snapshotted_at": "2026-08-11T16:40:36.979Z"
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
          "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
          "entry/skills/arckit-development-ledger/references/project-state-model.md",
          "entry/skills/using-arckit/SKILL.md",
          "entry/skills/using-arckit/references/round-boundary-contract.md",
          "arckit/spec/agentic-software-development/product-concepts.md",
          "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
          "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
          "verification:npm-run-check:119-pass-1-environment-skip",
          "verification:skill-quick-validate:using-arckit-and-ledger-valid",
          "verification:project-state-validate-and-audit:ok",
          "verification:protocol-compatibility:compatible",
          "verification:legacy-invariant-identifiers:none-in-entry-or-runtime",
          "verification:git-diff-check:ok"
        ],
        "occurred_at": "2026-08-11T16:52:06.147Z"
      }
    ],
    "evidence": [
      "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
      "entry/skills/arckit-development-ledger/references/project-state-model.md",
      "entry/skills/using-arckit/SKILL.md",
      "entry/skills/using-arckit/references/round-boundary-contract.md",
      "arckit/spec/agentic-software-development/product-concepts.md",
      "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
      "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
      "verification:npm-run-check:119-pass-1-environment-skip",
      "verification:skill-quick-validate:using-arckit-and-ledger-valid",
      "verification:project-state-validate-and-audit:ok",
      "verification:protocol-compatibility:compatible",
      "verification:legacy-invariant-identifiers:none-in-entry-or-runtime",
      "verification:git-diff-check:ok"
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
      "goal": "Encode the accepted six-domain invariant semantics in the canonical catalog, Agent guidance, stable product and technical facts, and proportionate regression evidence.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The user-approved ambiguity blocks reliable invariant-guided Gap discovery, and this is the only ready Case result that resolves it.",
        "snapshot_token": "2dba3fe92ec5e834d9cb1837962b4b78b8d41ef5e7c8d4af62a7dd82859be4ba",
        "selected_ref": "case-gap:CASE-20260811-005:GAP-INVARIANT-SEMANTICS-001",
        "comparison_summary": "Compared the ready Case Gap with all persisted Project gaps; only the Case Gap directly establishes the prerequisite canonical semantics.",
        "fresh_discovery_summary": "No additional fresh result is required to complete the already accepted semantic correction.",
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
            "reason": "Isolated scenario evaluation should validate the accepted canonical semantics in a later Case, not define them."
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high",
              "urgency": "medium"
            },
            "reason": "Runtime resilience and adapters do not determine the invariant semantic catalog."
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
            "reason": "Security validation is a separate real-project obligation."
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
            "reason": "Application-target synchronization follows maintenance and local validation."
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "excluded",
            "priority_basis": {
              "risk": "high",
              "urgency": "high"
            },
            "reason": "Cross-record audit is an independent Project-level acceptance matter."
          },
          {
            "ref": "case-gap:CASE-20260811-005:GAP-INVARIANT-SEMANTICS-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "The ambiguity directly affects every later Case round that relies on invariant-guided Gap discovery.",
              "uncertainty": "The desired semantic correction is accepted; the remaining work is to encode it consistently in canonical protocol, guidance, and evidence.",
              "risk": "Partial wording changes could preserve the same retrospective or artifact-substitution failure under different names.",
              "user_impact": "Agents may otherwise continue to omit relevant product, interaction, visual, or technical fact maintenance."
            },
            "reason": "This is the only ready Case Gap and directly establishes the user-approved invariant semantics."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-INVARIANT-SEMANTICS-001",
        "responsibility": "agent",
        "goal": "Establish distinct, fresh-fact-driven canonical software invariant semantics that reliably surface affected durable expectations, technical decisions, realization obligations, and material risk evidence without fixed skill or artifact routing.",
        "reason": "The user-approved semantic correction is required before invariant-guided Case loops can reliably decide whether long-lived project facts need confirmation or maintenance.",
        "derived_from": [
          "FACT-INVARIANT-SEMANTICS-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "The ambiguity directly affects every later Case round that relies on invariant-guided Gap discovery.",
          "uncertainty": "The desired semantic correction is accepted; the remaining work is to encode it consistently in canonical protocol, guidance, and evidence.",
          "risk": "Partial wording changes could preserve the same retrospective or artifact-substitution failure under different names.",
          "user_impact": "Agents may otherwise continue to omit relevant product, interaction, visual, or technical fact maintenance."
        },
        "evidence_required": [
          "Canonical triggers start from fresh facts and cover newly established, changed, missing, stale, ambiguous, and contradicted durable facts.",
          "Product, interaction, visual, and technical invariants have distinct abstract semantic boundaries while remaining independent of skills, paths, and artifact routing.",
          "Expectation evidence, realization evidence, and risk evidence cannot silently substitute for one another.",
          "Protocol guidance, fixtures, and local validation agree with the revised invariant catalog."
        ]
      },
      "planned_transition": {
        "goal": "Encode the accepted six-domain invariant semantics in the canonical catalog, Agent guidance, stable product and technical facts, and proportionate regression evidence.",
        "expected_state_change": "GAP-INVARIANT-SEMANTICS-001 resolves; the threatened product-capability impact becomes upheld; canonical invariants and relevant Project decisions become durably recoverable."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-INVARIANT-SEMANTICS-001",
          "status": "resolved",
          "outcome": "The six core invariants now use fresh-fact-driven triggers, distinct product/interaction/visual/technical semantic boundaries, and separate authoritative expectation, realization, and risk evidence responsibilities without fixed routing.",
          "reason": "Canonical source, Agent guidance, stable product and technical definitions, Project State reconciliation, and regression evidence agree.",
          "evidence": [
            "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
            "entry/skills/using-arckit/SKILL.md",
            "arckit/spec/agentic-software-development/product-concepts.md",
            "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
            "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
            "verification:npm-run-check:119-pass-1-environment-skip"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-INVARIANT-SEMANTICS-002",
            "revision": 1,
            "status": "accepted",
            "statement": "The maintained Arckit protocol now interprets six core software invariants from fresh Case facts: four distinct authoritative durable expectation or decision domains, actual-state realization, and material-risk evidence; missing, stale, ambiguous, and contradicted facts are first-class applicability triggers.",
            "basis": "Canonical definitions, Loop guidance, stable product and technical facts, compatible Project State, and the full Runtime check agree.",
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "entry/skills/using-arckit/references/round-boundary-contract.md",
              "arckit/spec/agentic-software-development/product-concepts.md",
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
              "verification:protocol-compatibility:compatible",
              "verification:npm-run-check:119-pass-1-environment-skip"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-INVARIANT-PRODUCT-002",
            "fact_id": "FACT-INVARIANT-SEMANTICS-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "product-expectations-remain-recoverable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Stable product definitions now state the fresh-fact trigger model and the distinct responsibility of durable product expectations.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/product-concepts.md",
              "arckit/spec/agentic-software-development/controller-worker-loop.md"
            ]
          },
          {
            "id": "IMPACT-INVARIANT-TECH-003",
            "fact_id": "FACT-INVARIANT-SEMANTICS-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 7
            },
            "effect": "upheld",
            "reason": "The technical foundation now explains catalog ownership, semantic responsibility boundaries, evidence separation, and policy-neutral Runtime behavior.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs"
            ]
          },
          {
            "id": "IMPACT-INVARIANT-TECH-004",
            "fact_id": "FACT-INVARIANT-SEMANTICS-002",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "technical-decisions-remain-explainable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The broadened technical invariant and its rationale are explicit in canonical source and stable technical evidence.",
            "gap_ids": [],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-INVARIANT-SEMANTICS-001",
            "fact_id": "FACT-INVARIANT-SEMANTICS-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 3
            },
            "effect": "upheld",
            "reason": "Invariant-guided Gap discovery now starts from fresh facts, covers missing and invalidated durable semantics, and distinguishes evidence responsibilities without fixed routing.",
            "gap_ids": [],
            "evidence": [
              "arckit/spec/agentic-software-development/product-concepts.md",
              "entry/skills/using-arckit/SKILL.md",
              "runtime/arckit-runtime/test/project-ledger-governance.test.mjs"
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
            "observed_revision": 2,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit provides Project/Iteration/Case ledgers, fresh-fact-driven invariant-guided dynamic Case Gap discovery, strict single-Gap Rounds, trusted atomic transitions, maintained development skills, and an optional supervised Runtime/Desktop.",
              "reason": "The stable product contract distinguishes six semantic invariant responsibilities and treats missing, stale, ambiguous, or contradicted durable facts as applicability signals without preplanning work types.",
              "evidence": [
                "arckit/spec/agentic-software-development/product-concepts.md",
                "arckit/spec/agentic-software-development/controller-worker-loop.md"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [
              "GAP-agent-scenario-evaluation"
            ],
            "reason": "The accepted product semantics refine how invariant-guided Gap discovery identifies materially affected long-term facts.",
            "evidence": [
              "arckit/spec/agentic-software-development/product-concepts.md",
              "arckit/spec/agentic-software-development/controller-worker-loop.md"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 6,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit uses repository-owned Markdown/JSON state, Node.js ESM Ledger and Runtime scripts, an Electron desktop host, Project State v5, Case v5, Case Transition v8, Ledger Snapshot v1, Round Closeout v2 and Iteration v3. The canonical catalog defines four authoritative durable expectation or decision responsibilities plus realization and risk responsibilities; Ledger validates complete assessments while Runtime does not duplicate semantic relevance or routing.",
              "reason": "The thin-host architecture keeps fresh-fact interpretation and dynamic capability choice in the Agent while the trusted ledger owns exact catalog, coverage, freshness, compatibility and atomic writeback.",
              "evidence": [
                "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
                "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
                "arckit/tech/arckit-runtime/solution.md"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "The canonical invariant catalog and evidence responsibilities are a stable technical protocol decision.",
            "evidence": [
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs"
            ]
          }
        ],
        "software_invariant_changes": [
          {
            "action": "sync_core",
            "invariant": {
              "id": "product-expectations-remain-recoverable",
              "applies_when": "Fresh Case facts establish, revise, invalidate, expose a gap in, or conflict with a durable product outcome, capability, business rule, or acceptance meaning.",
              "must_hold": "Every materially affected product expectation is accurate, unambiguous, and durably recoverable.",
              "evidence_expectation": "Authoritative durable evidence sufficient to recover the affected product expectation and the basis for accepting it.",
              "priority": "required"
            },
            "reason": "Synchronize the approved fresh-fact-driven core semantic definition.",
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "entry/skills/arckit-development-ledger/references/project-state-model.md"
            ]
          },
          {
            "action": "sync_core",
            "invariant": {
              "id": "interaction-expectations-remain-recoverable",
              "applies_when": "Fresh Case facts establish, revise, invalidate, expose a gap in, or conflict with how a person progresses through actions, states, feedback, navigation, or recovery.",
              "must_hold": "Every materially affected interaction expectation is coherent, complete enough to recover its decisions and states, and durably recoverable.",
              "evidence_expectation": "Authoritative durable evidence sufficient to recover the affected interaction expectation and its accepted state and response semantics.",
              "priority": "required"
            },
            "reason": "Synchronize the approved fresh-fact-driven core semantic definition.",
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "entry/skills/arckit-development-ledger/references/project-state-model.md"
            ]
          },
          {
            "action": "sync_core",
            "invariant": {
              "id": "visual-language-remains-consistent",
              "applies_when": "Fresh Case facts establish, revise, invalidate, expose a gap in, or conflict with a durable visual-language or presentation rule.",
              "must_hold": "Every materially affected visual expectation remains intentional, internally consistent, and durably recoverable.",
              "evidence_expectation": "Authoritative durable evidence sufficient to recover the affected visual expectation and its relationship to the project visual language.",
              "priority": "required"
            },
            "reason": "Synchronize the approved fresh-fact-driven core semantic definition.",
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "entry/skills/arckit-development-ledger/references/project-state-model.md"
            ]
          },
          {
            "action": "sync_core",
            "invariant": {
              "id": "technical-decisions-remain-explainable",
              "applies_when": "Fresh Case facts establish, revise, invalidate, expose a gap in, or conflict with a durable technical decision, structure, boundary, model, lifecycle, or constraint.",
              "must_hold": "Every materially affected technical decision remains coherent, explainable, and durably recoverable, including its rationale and affected relationships.",
              "evidence_expectation": "Authoritative durable evidence sufficient to recover the affected technical decision, rationale, constraints, and relationships.",
              "priority": "required"
            },
            "reason": "Synchronize the approved fresh-fact-driven core semantic definition.",
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "entry/skills/arckit-development-ledger/references/project-state-model.md"
            ]
          },
          {
            "action": "sync_core",
            "invariant": {
              "id": "accepted-facts-are-realized",
              "applies_when": "Fresh Case facts or the selected Gap make a material claim about the actual software state relative to accepted durable expectations.",
              "must_hold": "The accepted software state realizes every materially relevant accepted fact and upheld Project decision and invariant.",
              "evidence_expectation": "Direct, traceable realization evidence sufficient to show that the actual software state conforms to the governing accepted facts.",
              "priority": "required"
            },
            "reason": "Synchronize the approved fresh-fact-driven core semantic definition.",
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "entry/skills/arckit-development-ledger/references/project-state-model.md"
            ]
          },
          {
            "action": "sync_core",
            "invariant": {
              "id": "material-risks-have-credible-evidence",
              "applies_when": "Fresh Case facts or the selected Gap expose a material risk, alter its boundary, or claim that it is controlled.",
              "must_hold": "Every material risk claim accepted in the Case is supported by credible, repeatable, and proportionate evidence.",
              "evidence_expectation": "Repeatable, proportionate evidence sufficient to support the accepted risk claim and its scope.",
              "priority": "required"
            },
            "reason": "Synchronize the approved fresh-fact-driven core semantic definition.",
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "entry/skills/arckit-development-ledger/references/project-state-model.md"
            ]
          }
        ],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
          "entry/skills/arckit-development-ledger/references/project-state-model.md",
          "arckit/spec/agentic-software-development/product-concepts.md",
          "arckit/tech/arckit-runtime/state-condition-ledger-solution.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 26,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The accepted product semantics are explicit, unambiguous, and recoverable from the maintained product facts.",
            "fact_refs": [
              "FACT-INVARIANT-SEMANTICS-001",
              "FACT-INVARIANT-SEMANTICS-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/product-concepts.md",
              "arckit/spec/agentic-software-development/controller-worker-loop.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The accepted facts refine Agent reasoning semantics but do not establish or invalidate a human journey, operable state, navigation, feedback, or recovery expectation.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The accepted facts do not establish, revise, invalidate, or conflict with a durable visual-language or presentation rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The canonical catalog ownership, semantic boundaries, evidence responsibilities, and Runtime boundary are durably explained.",
            "fact_refs": [
              "FACT-INVARIANT-SEMANTICS-002"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Canonical source, Project State, skills, references, fixtures, and indexes realize the accepted semantic model consistently.",
            "fact_refs": [
              "FACT-INVARIANT-SEMANTICS-002"
            ],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "entry/skills/using-arckit/SKILL.md",
              "runtime/arckit-runtime/test/project-ledger-governance.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Protocol drift, compatibility recovery, transition coverage, and catalog semantics are covered by repeatable validation proportional to the change.",
            "fact_refs": [
              "FACT-INVARIANT-SEMANTICS-002"
            ],
            "evidence": [
              "verification:npm-run-check:119-pass-1-environment-skip",
              "verification:protocol-compatibility:compatible",
              "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
              "runtime/arckit-runtime/test/protocol-compatibility.test.mjs"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/using-arckit/references/round-boundary-contract.md",
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
        "verification:npm-run-check:119-pass-1-environment-skip",
        "verification:quick-validate:using-arckit-and-development-ledger-valid",
        "verification:project-state-audit:ok",
        "verification:protocol-compatibility:compatible",
        "verification:git-diff-check:passed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-11T16:49:01.275Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review content revision 1 across the five completion dimensions without changing implementation.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case gaps and impacts are closed; the ledger-derived Completion Review is the only ready Case obligation.",
        "snapshot_token": "18eee6f8c509a885da9aa97e59b6db942713b35229cb89c87ea6b27a367b7468",
        "selected_ref": "case-gap:CASE-20260811-005:CASE-20260811-005:completion-review:1",
        "comparison_summary": "Compared the sole ready Case review with all five persisted Project gaps; the Project gaps require separate Cases and do not block review of this accepted source change.",
        "fresh_discovery_summary": "No fresh ordinary Case Gap was discovered while independently reviewing content revision 1.",
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
            "reason": "Broader isolated-agent evaluation remains a separate Project Case and is preserved for real-scenario validation."
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
            "reason": "General Runtime resilience and adapter work is independent of reviewing these invariant semantics."
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
            "reason": "Permission-bearing validation requires a separate real-project Case."
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
            "reason": "Application-target synchronization and drift governance follow source acceptance and remain separately tracked."
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
            "reason": "Broader Project, Iteration, and Case cross-record acceptance remains a separate Project Case."
          },
          {
            "ref": "case-gap:CASE-20260811-005:CASE-20260811-005:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the only ready Case obligation and the current content revision has complete semantic and validation evidence."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260811-005:completion-review:1",
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
        "goal": "Review content revision 1 across the five completion dimensions without changing implementation.",
        "expected_state_change": "Record a clean Review and close the Case if deterministic audit agrees; otherwise persist findings for later Gaps."
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
            "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
            "entry/skills/arckit-development-ledger/references/project-state-model.md",
            "entry/skills/using-arckit/SKILL.md",
            "entry/skills/using-arckit/references/round-boundary-contract.md",
            "arckit/spec/agentic-software-development/product-concepts.md",
            "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
            "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
            "verification:npm-run-check:119-pass-1-environment-skip",
            "verification:skill-quick-validate:using-arckit-and-ledger-valid",
            "verification:project-state-validate-and-audit:ok",
            "verification:protocol-compatibility:compatible",
            "verification:legacy-invariant-identifiers:none-in-entry-or-runtime",
            "verification:git-diff-check:ok"
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
        "project_revision": 27,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "upheld",
            "reason": "The final review confirms that the fresh-fact trigger model and the distinct durable product-expectation responsibility remain explicit and recoverable.",
            "fact_refs": [
              "FACT-INVARIANT-SEMANTICS-001",
              "FACT-INVARIANT-SEMANTICS-002"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/product-concepts.md",
              "arckit/spec/agentic-software-development/controller-worker-loop.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The reviewed facts refine reasoning semantics and do not establish or invalidate a human journey, action-state progression, feedback, navigation, or recovery expectation.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The reviewed facts do not establish, revise, invalidate, or conflict with a durable visual-language or presentation rule.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Catalog ownership, semantic boundaries, evidence responsibilities, protocol reconciliation, and the policy-neutral Runtime boundary are coherent and durably explained.",
            "fact_refs": [
              "FACT-INVARIANT-SEMANTICS-002"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Canonical source, both entry skills, references, maintained product and technical facts, Project State, and regression fixtures consistently realize the accepted semantics.",
            "fact_refs": [
              "FACT-INVARIANT-SEMANTICS-002"
            ],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "entry/skills/using-arckit/SKILL.md",
              "runtime/arckit-runtime/test/project-ledger-governance.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Full Runtime tests, skill validation, strict ledger audit, compatibility probing, legacy-identifier scanning, and diff checking proportionately cover semantic and migration risk.",
            "fact_refs": [
              "FACT-INVARIANT-SEMANTICS-002"
            ],
            "evidence": [
              "verification:npm-run-check:119-pass-1-environment-skip",
              "verification:protocol-compatibility:compatible",
              "verification:git-diff-check:ok"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
        "entry/skills/arckit-development-ledger/references/project-state-model.md",
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/using-arckit/references/round-boundary-contract.md",
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
        "runtime/arckit-runtime/test/project-ledger-governance.test.mjs",
        "verification:npm-run-check:119-pass-1-environment-skip",
        "verification:skill-quick-validate:using-arckit-and-ledger-valid",
        "verification:project-state-validate-and-audit:ok",
        "verification:protocol-compatibility:compatible",
        "verification:legacy-invariant-identifiers:none-in-entry-or-runtime",
        "verification:git-diff-check:ok"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-11T16:52:06.147Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-INVARIANT-SEMANTICS-001"
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
    "updated_at": "2026-08-11T16:52:06.147Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
