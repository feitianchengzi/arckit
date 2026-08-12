# Align invariant-guided single-Gap Case loops

Case: CASE-20260811-004
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-11T15:14:31.249Z

## User Intent

Make Project State, Case State, Case Gap and Round responsibilities explicit, and make Project software invariants plus dynamically selected skills guarantee that every materially relevant judgment becomes an explicit Case Gap without preplanning a workflow.

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260811-004",
  "title": "Align invariant-guided single-Gap Case loops",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-11T14:47:35.684Z",
  "updated_at": "2026-08-11T15:14:31.249Z",
  "user_intent": "Make Project State, Case State, Case Gap and Round responsibilities explicit, and make Project software invariants plus dynamically selected skills guarantee that every materially relevant judgment becomes an explicit Case Gap without preplanning a workflow.",
  "expected_outcome": "Each fresh round selects exactly one independently acceptable Case Gap; new facts are recorded without authorizing extra work in the same round; invariant-guided judgments can emerge or reopen in later rounds; direct Codex and Runtime share one ledger-owned protocol.",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-LOOP-BOUNDARY-001",
      "revision": 1,
      "status": "accepted",
      "statement": "A Round begins from fresh Project and Case state, selects one Case Gap, completes only that Gap, records newly exposed facts and obligations, then ends before any newly exposed work is selected.",
      "basis": "Explicit user correction after a direct Codex execution exposed an oversized first Gap.",
      "evidence": [
        "current Codex conversation: approved Project/Case/Gap/Loop boundary"
      ]
    },
    {
      "id": "FACT-INVARIANT-GUIDANCE-001",
      "revision": 1,
      "status": "accepted",
      "statement": "Project software invariants are persistent abstract guidance for Case Loop reasoning; together with current Case facts and dynamically selected skills they must ensure every materially relevant judgment is explicitly handled by some Gap, without initialization-time fact-category or workflow prediction.",
      "basis": "Explicit user clarification of the intended role of software_invariants.",
      "evidence": [
        "current Codex conversation: approved invariant-guided Gap discovery semantics"
      ]
    },
    {
      "id": "FACT-LOOP-SEMANTICS-002",
      "revision": 1,
      "status": "accepted",
      "statement": "The durable product contract now defines software invariants as persistent abstract guidance for fresh Case Gap discovery, while each Round establishes exactly one independently acceptable result and defers newly exposed work to a later fresh round.",
      "basis": "The maintained product specifications consistently express the user-approved model.",
      "evidence": [
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/controller-worker-loop.md"
      ]
    },
    {
      "id": "FACT-LOOP-TECH-CONTRACT-003",
      "revision": 1,
      "status": "accepted",
      "statement": "Case Transition v8 carries a complete invariant_assessment for the current Project invariant catalog; Ledger validates coverage and references, Round Closeout v2 exposes accepted judgments, and Runtime only transports the trusted objects.",
      "basis": "The maintained technical solutions define one protocol shared by direct Codex and Runtime.",
      "evidence": [
        "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
        "arckit/tech/arckit-runtime/solution.md"
      ]
    },
    {
      "id": "FACT-LOOP-PROTOCOL-IMPLEMENTED-004",
      "revision": 1,
      "status": "accepted",
      "statement": "The maintained source now uses Case Transition v8 and Round Closeout v2, persists complete per-round invariant assessments, prevents newly exposed work from expanding the selected claim, and keeps Runtime semantically policy-neutral.",
      "basis": "Skill contracts, trusted scripts/schemas, Runtime transport/presentation and regression tests agree.",
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
        "runtime/arckit-runtime/test/case-transition.test.mjs"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-LOOP-BOUNDARY-001",
      "fact_id": "FACT-LOOP-BOUNDARY-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "product_capabilities",
        "revision": 2
      },
      "effect": "upheld",
      "reason": "The source protocol now enforces a single acceptance claim and requires newly exposed work to wait for post-commit fresh selection.",
      "gap_ids": [],
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/using-arckit/references/round-boundary-contract.md",
        "runtime/arckit-runtime/test/case-transition.test.mjs"
      ]
    },
    {
      "id": "IMPACT-INVARIANT-GUIDANCE-001",
      "fact_id": "FACT-INVARIANT-GUIDANCE-001",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Every v8 transition must explicitly assess the current Project invariant catalog; missing, duplicate, stale or unbound judgments are rejected and later facts can reopen a Gap.",
      "gap_ids": [],
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
        "runtime/arckit-runtime/test/case-transition.test.mjs"
      ]
    },
    {
      "id": "IMPACT-TECH-CONTRACT-001",
      "fact_id": "FACT-LOOP-TECH-CONTRACT-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 6
      },
      "effect": "upheld",
      "reason": "The technical foundation now durably defines the ledger/Runtime ownership and protocol boundary.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
        "arckit/tech/arckit-runtime/solution.md"
      ]
    },
    {
      "id": "IMPACT-TECH-EXPLAINABLE-001",
      "fact_id": "FACT-LOOP-TECH-CONTRACT-003",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "changed-contracts-remain-explainable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The changed Case transition, closeout and Runtime boundaries are explicitly recoverable from stable technical evidence.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arckit-runtime/state-condition-ledger-solution.md"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-LOOP-SEMANTICS-001",
      "status": "resolved",
      "goal": "Establish durable product semantics that distinguish Project State, Case State, Project Gap, Case Gap and Round, and define invariant-guided explicit judgment discovery without allowing new facts to expand the selected Gap.",
      "reason": "The approved model must first become a stable product contract before technical protocol or skill implementation is chosen.",
      "derived_from": [
        "FACT-LOOP-BOUNDARY-001",
        "FACT-INVARIANT-GUIDANCE-001"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "The implementation contract cannot be corrected reliably until the product concepts and single-Gap boundary are explicit.",
        "uncertainty": "The intended semantics are now user-approved; the remaining uncertainty is how to express them durably without creating a fixed workflow.",
        "risk": "If implementation starts first, the same Project/Case and within-round scope confusion can be reintroduced.",
        "user_impact": "This directly controls whether users can understand and trust each autonomous Case round."
      },
      "responsibility": "agent",
      "evidence_required": [
        "Stable specification explicitly distinguishes Project State, Case State, Project Gap, Case Gap and Round.",
        "Specification states that new facts can create or reopen later Gap candidates but cannot authorize extra work in the current Round.",
        "Specification defines software invariants as persistent abstract Case Loop guidance without preplanned artifact categories or fixed order."
      ],
      "resolution": {
        "id": "GAP-LOOP-SEMANTICS-001",
        "status": "resolved",
        "outcome": "Durable product semantics now define distinct Project, Case, Project Gap, Case Gap and Round responsibilities, invariant-guided dynamic judgment discovery, and strict no-scope-expansion behavior.",
        "reason": "The product concepts, Agent Loop and Runtime workspace specifications now state the approved model and acceptance boundaries.",
        "evidence": [
          "arckit/spec/agentic-software-development/product-concepts.md",
          "arckit/spec/agentic-software-development/controller-worker-loop.md",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
        ],
        "occurred_at": "2026-08-11T14:51:10.761Z"
      }
    },
    {
      "id": "GAP-LOOP-TECH-CONTRACT-001",
      "status": "resolved",
      "goal": "Define the trusted Case/Ledger technical contract that records invariant-guided explicit judgments, supports reopening from later facts, gates Case closure, and preserves a strict single-Gap Round without Runtime semantic duplication.",
      "reason": "The new product semantics expose a technical state-model and transition-contract result that is not yet established.",
      "derived_from": [
        "FACT-LOOP-SEMANTICS-002"
      ],
      "blocked_by": [
        "GAP-LOOP-SEMANTICS-001"
      ],
      "priority_basis": {
        "blocking": "Skill and ledger implementation cannot be accepted until the canonical Case judgment and closure contract is defined.",
        "uncertainty": "The minimal auditable Case representation and protocol-version boundary still require technical design.",
        "risk": "An underspecified record could either miss relevant judgments or reintroduce a heavy fixed checklist.",
        "user_impact": "This determines whether direct Codex and Runtime reliably expose relevant Tech and other judgments."
      },
      "responsibility": "agent",
      "evidence_required": [
        "Stable technical solution defines Project, Case and Round write boundaries.",
        "Technical contract records relevant invariant-guided judgments without encoding skill, path, fact category or order.",
        "Closure and reopening semantics are deterministic while relevance remains an Agent judgment.",
        "Direct Codex and Runtime consume the same trusted fields without duplicate semantic logic."
      ],
      "resolution": {
        "id": "GAP-LOOP-TECH-CONTRACT-001",
        "status": "resolved",
        "outcome": "The technical solution now defines a complete invariant_assessment on every content round, single-claim execution, deterministic coverage/gap validation, reopening through later assessments, and Runtime pass-through.",
        "reason": "The state ledger and Runtime solutions specify the canonical structures, validation ownership and version boundaries.",
        "evidence": [
          "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
          "arckit/tech/arckit-runtime/solution.md"
        ],
        "occurred_at": "2026-08-11T14:55:30.007Z"
      }
    },
    {
      "id": "GAP-LOOP-PROTOCOL-IMPLEMENTATION-001",
      "status": "resolved",
      "goal": "Implement the invariant-guided single-Gap protocol in using-arckit, the trusted Ledger schemas/scripts and thin Runtime transport, with deterministic coverage, reopening and closure tests.",
      "reason": "The accepted product and technical contracts are not yet realized in executable skill and protocol behavior.",
      "derived_from": [
        "FACT-LOOP-TECH-CONTRACT-003"
      ],
      "blocked_by": [
        "GAP-LOOP-TECH-CONTRACT-001"
      ],
      "priority_basis": {
        "blocking": "The user-visible behavior remains incorrect until the maintained skills and trusted protocol enforce the contract.",
        "uncertainty": "Implementation details are bounded by the accepted v8/v2 technical solution.",
        "risk": "Schema and closure changes can break both direct Codex and Runtime if implemented inconsistently.",
        "user_impact": "This is the executable correction for oversized rounds and silently omitted technical judgments."
      },
      "responsibility": "agent",
      "evidence_required": [
        "using-arckit enforces one acceptance claim and stops before newly exposed work.",
        "Each accepted content transition covers the current Project invariant catalog and persists its assessment.",
        "Ledger blocks missing, duplicate or structurally invalid judgments and blocks premature review/closure.",
        "Runtime transports and presents the trusted assessment without semantic duplication.",
        "Direct Codex and Runtime regression tests cover Tech-like judgment discovery, reopening and no intra-round continuation."
      ],
      "resolution": {
        "id": "GAP-LOOP-PROTOCOL-IMPLEMENTATION-001",
        "status": "resolved",
        "outcome": "Using Arckit, Ledger v8/v2 and Runtime now enforce and expose complete invariant-guided single-claim Rounds, including later reopening.",
        "reason": "Source contracts, trusted validation, persistence, Runtime pass-through/presentation and focused regressions all realize the accepted product and technical design.",
        "evidence": [
          "entry/skills/using-arckit/SKILL.md",
          "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
          "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
          "runtime/arckit-runtime/src/agent-orchestrator.mjs",
          "runtime/arckit-runtime/test/case-transition.test.mjs",
          "command:npm --prefix runtime/arckit-runtime run check (116 passed, 1 skipped)"
        ],
        "occurred_at": "2026-08-11T15:09:05.358Z"
      }
    },
    {
      "id": "CASE-20260811-004:review-finding:INVARIANT-ASSESSMENT-CANONICAL-AUDIT",
      "status": "resolved",
      "goal": "Resolve review finding: Persisted v8 Round invariant assessments are not fully audited: empty judgments or disposition/evidence inconsistencies can pass Case validation and make Completion Review eligible through empty-array closure semantics.",
      "reason": "omission found by completion review",
      "derived_from": [
        "completion_review",
        "content_revision:3"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "high",
        "risk": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
        "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
        "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
        "code:validateCaseRecordV5 only checks generic judgment fields for v8 rounds",
        "code:auditCaseRecordV5 uses judgments.every, which is true for an empty array",
        "test gap:no persisted-corruption regression for premature Completion Review"
      ],
      "resolution": {
        "id": "CASE-20260811-004:review-finding:INVARIANT-ASSESSMENT-CANONICAL-AUDIT",
        "status": "resolved",
        "outcome": "Persisted v8 assessments now fail closed on empty or invalid judgments, and compatibility probing detects canonical corruption.",
        "reason": "Case audit, Case schema, cross-record compatibility checks and focused corruption regressions now agree.",
        "evidence": [
          "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
          "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
          "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
          "runtime/arckit-runtime/test/case-transition.test.mjs",
          "runtime/arckit-runtime/test/protocol-compatibility.test.mjs"
        ],
        "occurred_at": "2026-08-11T15:13:32.770Z"
      }
    }
  ],
  "content_revision": 4,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "User authorized complete autonomous optimization; completion review may perform up to three evidence-backed repair cycles.",
      "snapshotted_at": "2026-08-11T14:47:35.684Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
    "reviewed_content_revision": 4,
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
        "content_revision": 3,
        "dimensions": {
          "implementation_correctness": "findings",
          "problem_resolution": "clean",
          "verification_credibility": "findings",
          "regression_risk": "findings",
          "minimality": "clean"
        },
        "finding_ids": [
          "INVARIANT-ASSESSMENT-CANONICAL-AUDIT"
        ],
        "evidence": [
          "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
          "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
          "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
          "command:npm --prefix runtime/arckit-runtime run check (116 passed, 1 skipped)"
        ],
        "occurred_at": "2026-08-11T15:10:56.017Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
        "reviewer": "agent",
        "outcome": "clean",
        "content_revision": 4,
        "dimensions": {
          "implementation_correctness": "clean",
          "problem_resolution": "clean",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "entry/skills/using-arckit/SKILL.md",
          "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
          "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
          "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
          "runtime/arckit-runtime/test/case-transition.test.mjs",
          "runtime/arckit-runtime/test/protocol-compatibility.test.mjs",
          "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
          "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
          "command:skill quick_validate (using-arckit and arckit-development-ledger valid)",
          "command:npm --prefix runtime/arckit-runtime run check (118 passed, 1 skipped)",
          "command:git diff --check"
        ],
        "occurred_at": "2026-08-11T15:14:31.249Z"
      }
    ],
    "evidence": [
      "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
      "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
      "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
      "command:npm --prefix runtime/arckit-runtime run check (116 passed, 1 skipped)",
      "entry/skills/using-arckit/SKILL.md",
      "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
      "runtime/arckit-runtime/test/case-transition.test.mjs",
      "runtime/arckit-runtime/test/protocol-compatibility.test.mjs",
      "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
      "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
      "command:skill quick_validate (using-arckit and arckit-development-ledger valid)",
      "command:npm --prefix runtime/arckit-runtime run check (118 passed, 1 skipped)",
      "command:git diff --check"
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
      "goal": "Make the approved Project/Case/Gap/Round and invariant-guided single-Gap semantics durable in product specifications only.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The Case semantic contract is the only ready Case Gap and must be stabilized before selecting a technical protocol or implementation.",
        "snapshot_token": "575697c4747c1f63ddb774bf4e7b63a535d1e84bd7c3e6f8315e417a79d978bd",
        "selected_ref": "case-gap:CASE-20260811-004:GAP-LOOP-SEMANTICS-001",
        "comparison_summary": "The selected Case Gap directly addresses the user correction. Five Project gaps remain valid but belong to independent cross-Case obligations and are deferred.",
        "fresh_discovery_summary": "No additional work was selected. The completed product semantics expose a future technical protocol result, recorded as a new result Gap only.",
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
            "reason": "Independent isolated scenario evaluation remains outside this Case semantic definition round."
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
            "reason": "Runtime resilience is a separate project obligation and does not block the current semantic contract."
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
            "reason": "Security validation is unrelated to the selected Case result."
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
            "reason": "Application-target synchronization follows maintenance and verification, not this product definition Gap."
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
            "reason": "General cross-record auditing remains independent from defining the new Case Loop semantics."
          },
          {
            "ref": "case-gap:CASE-20260811-004:GAP-LOOP-SEMANTICS-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "The implementation contract cannot be corrected reliably until the product concepts and single-Gap boundary are explicit.",
              "uncertainty": "The intended semantics are now user-approved; the remaining uncertainty is how to express them durably without creating a fixed workflow.",
              "risk": "If implementation starts first, the same Project/Case and within-round scope confusion can be reintroduced.",
              "user_impact": "This directly controls whether users can understand and trust each autonomous Case round."
            },
            "reason": "It is the only current Case result and provides the stable product contract required by all later work."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-LOOP-SEMANTICS-001",
        "responsibility": "agent",
        "goal": "Establish durable product semantics that distinguish Project State, Case State, Project Gap, Case Gap and Round, and define invariant-guided explicit judgment discovery without allowing new facts to expand the selected Gap.",
        "reason": "The approved model must first become a stable product contract before technical protocol or skill implementation is chosen.",
        "derived_from": [
          "FACT-LOOP-BOUNDARY-001",
          "FACT-INVARIANT-GUIDANCE-001"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "The implementation contract cannot be corrected reliably until the product concepts and single-Gap boundary are explicit.",
          "uncertainty": "The intended semantics are now user-approved; the remaining uncertainty is how to express them durably without creating a fixed workflow.",
          "risk": "If implementation starts first, the same Project/Case and within-round scope confusion can be reintroduced.",
          "user_impact": "This directly controls whether users can understand and trust each autonomous Case round."
        },
        "evidence_required": [
          "Stable specification explicitly distinguishes Project State, Case State, Project Gap, Case Gap and Round.",
          "Specification states that new facts can create or reopen later Gap candidates but cannot authorize extra work in the current Round.",
          "Specification defines software invariants as persistent abstract Case Loop guidance without preplanned artifact categories or fixed order."
        ]
      },
      "planned_transition": {
        "goal": "Make the approved Project/Case/Gap/Round and invariant-guided single-Gap semantics durable in product specifications only.",
        "expected_state_change": "The product capability decision and stable specifications express the corrected semantics; any newly exposed technical work remains an unresolved Gap for a later fresh round."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-LOOP-SEMANTICS-001",
          "status": "resolved",
          "outcome": "Durable product semantics now define distinct Project, Case, Project Gap, Case Gap and Round responsibilities, invariant-guided dynamic judgment discovery, and strict no-scope-expansion behavior.",
          "reason": "The product concepts, Agent Loop and Runtime workspace specifications now state the approved model and acceptance boundaries.",
          "evidence": [
            "arckit/spec/agentic-software-development/product-concepts.md",
            "arckit/spec/agentic-software-development/controller-worker-loop.md",
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-LOOP-SEMANTICS-002",
            "revision": 1,
            "status": "accepted",
            "statement": "The durable product contract now defines software invariants as persistent abstract guidance for fresh Case Gap discovery, while each Round establishes exactly one independently acceptable result and defers newly exposed work to a later fresh round.",
            "basis": "The maintained product specifications consistently express the user-approved model.",
            "evidence": [
              "arckit/spec/agentic-software-development/product-concepts.md",
              "arckit/spec/agentic-software-development/controller-worker-loop.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-LOOP-BOUNDARY-001",
            "fact_id": "FACT-LOOP-BOUNDARY-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 2
            },
            "effect": "threatened",
            "reason": "The stable capability contract is corrected, but trusted Case/Ledger and skill behavior still need to realize it.",
            "gap_ids": [
              "GAP-LOOP-TECH-CONTRACT-001"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/controller-worker-loop.md"
            ]
          },
          {
            "id": "IMPACT-INVARIANT-GUIDANCE-001",
            "fact_id": "FACT-INVARIANT-GUIDANCE-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The accepted semantic facts are durable but not yet realized by the trusted protocol and skills.",
            "gap_ids": [
              "GAP-LOOP-TECH-CONTRACT-001"
            ],
            "evidence": [
              "arckit/spec/agentic-software-development/product-concepts.md"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-LOOP-TECH-CONTRACT-001",
            "status": "open",
            "goal": "Define the trusted Case/Ledger technical contract that records invariant-guided explicit judgments, supports reopening from later facts, gates Case closure, and preserves a strict single-Gap Round without Runtime semantic duplication.",
            "reason": "The new product semantics expose a technical state-model and transition-contract result that is not yet established.",
            "derived_from": [
              "FACT-LOOP-SEMANTICS-002"
            ],
            "blocked_by": [
              "GAP-LOOP-SEMANTICS-001"
            ],
            "priority_basis": {
              "blocking": "Skill and ledger implementation cannot be accepted until the canonical Case judgment and closure contract is defined.",
              "uncertainty": "The minimal auditable Case representation and protocol-version boundary still require technical design.",
              "risk": "An underspecified record could either miss relevant judgments or reintroduce a heavy fixed checklist.",
              "user_impact": "This determines whether direct Codex and Runtime reliably expose relevant Tech and other judgments."
            },
            "responsibility": "agent",
            "evidence_required": [
              "Stable technical solution defines Project, Case and Round write boundaries.",
              "Technical contract records relevant invariant-guided judgments without encoding skill, path, fact category or order.",
              "Closure and reopening semantics are deterministic while relevance remains an Agent judgment.",
              "Direct Codex and Runtime consume the same trusted fields without duplicate semantic logic."
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
            "observed_revision": 1,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit provides Project/Iteration/Case ledgers, invariant-guided dynamic Case Gap discovery, strict single-Gap Rounds, trusted atomic transitions, maintained development skills, and an optional supervised Runtime/Desktop.",
              "reason": "The stable product contract now distinguishes project-wide state, Case-local facts and judgments, independently acceptable Case Gaps, and post-closeout fresh selection.",
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
            "reason": "The accepted user correction refines the core state-driven loop capability.",
            "evidence": [
              "arckit/spec/agentic-software-development/product-concepts.md",
              "arckit/spec/agentic-software-development/controller-worker-loop.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/spec/agentic-software-development/product-concepts.md",
          "arckit/spec/agentic-software-development/controller-worker-loop.md"
        ]
      },
      "evidence": [
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/controller-worker-loop.md",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/spec/INDEX.md",
        "arckit/spec/_map/RELATIONS.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-11T14:51:10.761Z"
    },
    {
      "round": 2,
      "goal": "Define only the trusted technical contract for invariant-guided single-Gap rounds and thin-host consumption.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The trusted state-model contract is the only ready Case Gap and blocks implementation.",
        "snapshot_token": "448b17a36ea36433a9533bc795fdb504a75bccb88304de5e4fffb3593a1177ff",
        "selected_ref": "case-gap:CASE-20260811-004:GAP-LOOP-TECH-CONTRACT-001",
        "comparison_summary": "The selected technical Gap is the only ready Case result; all Project gaps remain independent and deferred.",
        "fresh_discovery_summary": "The technical design establishes that implementation requires Transition v8, Closeout v2, round invariant assessment validation and thin Runtime pass-through; that implementation is recorded as a later result Gap.",
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
            "reason": "Independent scenario evaluation remains outside this Case technical contract."
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
            "reason": "Runtime resilience does not block the selected ledger contract."
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
            "reason": "Security validation is unrelated to this protocol design."
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
            "reason": "Distribution follows implementation and verification."
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
            "reason": "General cross-record audit remains a separate project obligation."
          },
          {
            "ref": "case-gap:CASE-20260811-004:GAP-LOOP-TECH-CONTRACT-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "Skill and ledger implementation cannot be accepted until the canonical Case judgment and closure contract is defined.",
              "uncertainty": "The minimal auditable Case representation and protocol-version boundary still require technical design.",
              "risk": "An underspecified record could either miss relevant judgments or reintroduce a heavy fixed checklist.",
              "user_impact": "This determines whether direct Codex and Runtime reliably expose relevant Tech and other judgments."
            },
            "reason": "It defines the minimal auditable protocol needed before skill and code changes can be accepted."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-LOOP-TECH-CONTRACT-001",
        "responsibility": "agent",
        "goal": "Define the trusted Case/Ledger technical contract that records invariant-guided explicit judgments, supports reopening from later facts, gates Case closure, and preserves a strict single-Gap Round without Runtime semantic duplication.",
        "reason": "The new product semantics expose a technical state-model and transition-contract result that is not yet established.",
        "derived_from": [
          "FACT-LOOP-SEMANTICS-002"
        ],
        "blocked_by": [
          "GAP-LOOP-SEMANTICS-001"
        ],
        "priority_basis": {
          "blocking": "Skill and ledger implementation cannot be accepted until the canonical Case judgment and closure contract is defined.",
          "uncertainty": "The minimal auditable Case representation and protocol-version boundary still require technical design.",
          "risk": "An underspecified record could either miss relevant judgments or reintroduce a heavy fixed checklist.",
          "user_impact": "This determines whether direct Codex and Runtime reliably expose relevant Tech and other judgments."
        },
        "evidence_required": [
          "Stable technical solution defines Project, Case and Round write boundaries.",
          "Technical contract records relevant invariant-guided judgments without encoding skill, path, fact category or order.",
          "Closure and reopening semantics are deterministic while relevance remains an Agent judgment.",
          "Direct Codex and Runtime consume the same trusted fields without duplicate semantic logic."
        ]
      },
      "planned_transition": {
        "goal": "Define only the trusted technical contract for invariant-guided single-Gap rounds and thin-host consumption.",
        "expected_state_change": "Technical source of truth and Project technical/data decisions describe Transition v8, Closeout v2, full invariant assessment coverage and closure/reopening rules; implementation remains unresolved."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-LOOP-TECH-CONTRACT-001",
          "status": "resolved",
          "outcome": "The technical solution now defines a complete invariant_assessment on every content round, single-claim execution, deterministic coverage/gap validation, reopening through later assessments, and Runtime pass-through.",
          "reason": "The state ledger and Runtime solutions specify the canonical structures, validation ownership and version boundaries.",
          "evidence": [
            "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
            "arckit/tech/arckit-runtime/solution.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-LOOP-TECH-CONTRACT-003",
            "revision": 1,
            "status": "accepted",
            "statement": "Case Transition v8 carries a complete invariant_assessment for the current Project invariant catalog; Ledger validates coverage and references, Round Closeout v2 exposes accepted judgments, and Runtime only transports the trusted objects.",
            "basis": "The maintained technical solutions define one protocol shared by direct Codex and Runtime.",
            "evidence": [
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
              "arckit/tech/arckit-runtime/solution.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-TECH-CONTRACT-001",
            "fact_id": "FACT-LOOP-TECH-CONTRACT-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 6
            },
            "effect": "upheld",
            "reason": "The technical foundation now durably defines the ledger/Runtime ownership and protocol boundary.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
              "arckit/tech/arckit-runtime/solution.md"
            ]
          },
          {
            "id": "IMPACT-TECH-EXPLAINABLE-001",
            "fact_id": "FACT-LOOP-TECH-CONTRACT-003",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "changed-contracts-remain-explainable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The changed Case transition, closeout and Runtime boundaries are explicitly recoverable from stable technical evidence.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-LOOP-BOUNDARY-001",
            "fact_id": "FACT-LOOP-BOUNDARY-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 2
            },
            "effect": "threatened",
            "reason": "Product and technical contracts are settled, but source skills, trusted scripts and schemas do not yet realize them.",
            "gap_ids": [
              "GAP-LOOP-PROTOCOL-IMPLEMENTATION-001"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md"
            ]
          },
          {
            "id": "IMPACT-INVARIANT-GUIDANCE-001",
            "fact_id": "FACT-INVARIANT-GUIDANCE-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "The invariant-guided behavior is specified but not yet implemented by the distributed skills and trusted ledger.",
            "gap_ids": [
              "GAP-LOOP-PROTOCOL-IMPLEMENTATION-001"
            ],
            "evidence": [
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-LOOP-PROTOCOL-IMPLEMENTATION-001",
            "status": "open",
            "goal": "Implement the invariant-guided single-Gap protocol in using-arckit, the trusted Ledger schemas/scripts and thin Runtime transport, with deterministic coverage, reopening and closure tests.",
            "reason": "The accepted product and technical contracts are not yet realized in executable skill and protocol behavior.",
            "derived_from": [
              "FACT-LOOP-TECH-CONTRACT-003"
            ],
            "blocked_by": [
              "GAP-LOOP-TECH-CONTRACT-001"
            ],
            "priority_basis": {
              "blocking": "The user-visible behavior remains incorrect until the maintained skills and trusted protocol enforce the contract.",
              "uncertainty": "Implementation details are bounded by the accepted v8/v2 technical solution.",
              "risk": "Schema and closure changes can break both direct Codex and Runtime if implemented inconsistently.",
              "user_impact": "This is the executable correction for oversized rounds and silently omitted technical judgments."
            },
            "responsibility": "agent",
            "evidence_required": [
              "using-arckit enforces one acceptance claim and stops before newly exposed work.",
              "Each accepted content transition covers the current Project invariant catalog and persists its assessment.",
              "Ledger blocks missing, duplicate or structurally invalid judgments and blocks premature review/closure.",
              "Runtime transports and presents the trusted assessment without semantic duplication.",
              "Direct Codex and Runtime regression tests cover Tech-like judgment discovery, reopening and no intra-round continuation."
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
            "area_ref": "data_and_state",
            "observed_revision": 3,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical project data is Project v5, Iteration v3 and Case v5 in arckit/; normal Loop mutation uses Case Transition v8 bound to Ledger Snapshot v1, persists a complete round invariant assessment, produces Round Closeout v2, and requires a verified post-commit snapshot before continuation. Runtime run/session/thread records stay outside the target project and only opaque refs enter the ledger.",
              "reason": "The ledger owns candidate, invariant coverage, transition, closeout and fresh-read contracts shared by direct Codex and Runtime.",
              "evidence": [
                "arckit/tech/arckit-runtime/state-condition-ledger-solution.md"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [
              "GAP-cross-record-audit"
            ],
            "reason": "The accepted technical design changes the canonical transition and closeout contracts.",
            "evidence": [
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md"
            ]
          },
          {
            "area_ref": "technical_foundation",
            "observed_revision": 5,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit uses repository-owned Markdown/JSON state, Node.js ESM Ledger and Runtime scripts, an Electron desktop host, Project State v5, Case v5, Case Transition v8, Ledger Snapshot v1, Round Closeout v2 and Iteration v3. Ledger validates complete invariant assessments while Runtime calls manifest-declared entrypoints and does not duplicate semantic relevance or routing.",
              "reason": "The thin-host architecture keeps semantic judgment in the Agent and structural coverage/freshness in the trusted ledger.",
              "evidence": [
                "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
                "arckit/tech/arckit-runtime/solution.md"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "The accepted design adds invariant assessment and single-claim round boundaries to the trusted protocol.",
            "evidence": [
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
              "arckit/tech/arckit-runtime/solution.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
          "arckit/tech/arckit-runtime/solution.md"
        ]
      },
      "evidence": [
        "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
        "arckit/tech/arckit-runtime/solution.md",
        "arckit/tech/INDEX.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-11T14:55:30.007Z"
    },
    {
      "round": 3,
      "goal": "Realize only the accepted invariant-guided single-Gap protocol in source skills, trusted Ledger and thin Runtime, and prove it with deterministic regressions.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The product and technical contracts are already accepted; implementing them is the only ready Case result and directly removes the two remaining threatened impacts.",
        "snapshot_token": "c102317d428b45c3d06b206675ccc61353a30211625d65e5e8bed01916865228",
        "selected_ref": "case-gap:CASE-20260811-004:GAP-LOOP-PROTOCOL-IMPLEMENTATION-001",
        "comparison_summary": "Compared all five Project-level candidates and the one ready Case candidate. Project candidates require separate Cases and do not supersede realization of the current Case contract.",
        "fresh_discovery_summary": "Implementation and tests exposed no independent result that must be completed before this bounded protocol realization.",
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
            "reason": "Isolated real-agent evaluation is a Project-level follow-up and does not replace implementation of the current accepted contract."
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
            "reason": "General Runtime resilience remains a separate Project concern; this Round only realizes the invariant-assessment transport already designed."
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
            "reason": "Permission-bearing project validation requires a separate Case and external fixture."
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
            "reason": "Application-target synchronization is governance work after source validation, not part of this implementation claim."
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
            "reason": "Broader real-project cross-record acceptance remains a separate Project Case."
          },
          {
            "ref": "case-gap:CASE-20260811-004:GAP-LOOP-PROTOCOL-IMPLEMENTATION-001",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "The user-visible behavior remains incorrect until the maintained skills and trusted protocol enforce the contract.",
              "uncertainty": "Implementation details are bounded by the accepted v8/v2 technical solution.",
              "risk": "Schema and closure changes can break both direct Codex and Runtime if implemented inconsistently.",
              "user_impact": "This is the executable correction for oversized rounds and silently omitted technical judgments."
            },
            "reason": "It is the only ready Case Gap and its implementation plus regression evidence now satisfies the accepted v8/v2 contract."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-LOOP-PROTOCOL-IMPLEMENTATION-001",
        "responsibility": "agent",
        "goal": "Implement the invariant-guided single-Gap protocol in using-arckit, the trusted Ledger schemas/scripts and thin Runtime transport, with deterministic coverage, reopening and closure tests.",
        "reason": "The accepted product and technical contracts are not yet realized in executable skill and protocol behavior.",
        "derived_from": [
          "FACT-LOOP-TECH-CONTRACT-003"
        ],
        "blocked_by": [
          "GAP-LOOP-TECH-CONTRACT-001"
        ],
        "priority_basis": {
          "blocking": "The user-visible behavior remains incorrect until the maintained skills and trusted protocol enforce the contract.",
          "uncertainty": "Implementation details are bounded by the accepted v8/v2 technical solution.",
          "risk": "Schema and closure changes can break both direct Codex and Runtime if implemented inconsistently.",
          "user_impact": "This is the executable correction for oversized rounds and silently omitted technical judgments."
        },
        "evidence_required": [
          "using-arckit enforces one acceptance claim and stops before newly exposed work.",
          "Each accepted content transition covers the current Project invariant catalog and persists its assessment.",
          "Ledger blocks missing, duplicate or structurally invalid judgments and blocks premature review/closure.",
          "Runtime transports and presents the trusted assessment without semantic duplication.",
          "Direct Codex and Runtime regression tests cover Tech-like judgment discovery, reopening and no intra-round continuation."
        ]
      },
      "planned_transition": {
        "goal": "Realize only the accepted invariant-guided single-Gap protocol in source skills, trusted Ledger and thin Runtime, and prove it with deterministic regressions.",
        "expected_state_change": "GAP-LOOP-PROTOCOL-IMPLEMENTATION-001 becomes resolved and the two implementation-threatened impacts become upheld; Completion Review remains the next separately derived obligation."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-LOOP-PROTOCOL-IMPLEMENTATION-001",
          "status": "resolved",
          "outcome": "Using Arckit, Ledger v8/v2 and Runtime now enforce and expose complete invariant-guided single-claim Rounds, including later reopening.",
          "reason": "Source contracts, trusted validation, persistence, Runtime pass-through/presentation and focused regressions all realize the accepted product and technical design.",
          "evidence": [
            "entry/skills/using-arckit/SKILL.md",
            "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
            "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
            "runtime/arckit-runtime/src/agent-orchestrator.mjs",
            "runtime/arckit-runtime/test/case-transition.test.mjs",
            "command:npm --prefix runtime/arckit-runtime run check (116 passed, 1 skipped)"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-LOOP-PROTOCOL-IMPLEMENTED-004",
            "revision": 1,
            "status": "accepted",
            "statement": "The maintained source now uses Case Transition v8 and Round Closeout v2, persists complete per-round invariant assessments, prevents newly exposed work from expanding the selected claim, and keeps Runtime semantically policy-neutral.",
            "basis": "Skill contracts, trusted scripts/schemas, Runtime transport/presentation and regression tests agree.",
            "evidence": [
              "entry/skills/using-arckit/SKILL.md",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
              "runtime/arckit-runtime/test/case-transition.test.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-LOOP-BOUNDARY-001",
            "fact_id": "FACT-LOOP-BOUNDARY-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "product_capabilities",
              "revision": 2
            },
            "effect": "upheld",
            "reason": "The source protocol now enforces a single acceptance claim and requires newly exposed work to wait for post-commit fresh selection.",
            "gap_ids": [],
            "evidence": [
              "entry/skills/using-arckit/SKILL.md",
              "entry/skills/using-arckit/references/round-boundary-contract.md",
              "runtime/arckit-runtime/test/case-transition.test.mjs"
            ]
          },
          {
            "id": "IMPACT-INVARIANT-GUIDANCE-001",
            "fact_id": "FACT-INVARIANT-GUIDANCE-001",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Every v8 transition must explicitly assess the current Project invariant catalog; missing, duplicate, stale or unbound judgments are rejected and later facts can reopen a Gap.",
            "gap_ids": [],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
              "runtime/arckit-runtime/test/case-transition.test.mjs"
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
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/arckit-development-ledger/SKILL.md",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "entry/skills/arckit-development-ledger/schema/case-transition.schema.json",
        "entry/skills/arckit-development-ledger/schema/round-closeout.schema.json",
        "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/desktop/transcript-presentation.mjs",
        "runtime/arckit-runtime/test/case-transition.test.mjs",
        "command:skill quick_validate (using-arckit and arckit-development-ledger valid)",
        "command:npm --prefix runtime/arckit-runtime run check (116 passed, 1 skipped)",
        "command:git diff --check"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-11T15:09:05.358Z"
    },
    {
      "round": 4,
      "goal": "Review content revision 3 across the five completion dimensions without changing implementation.",
      "outcome": "partial",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case gaps and impacts are closed, so the ledger-derived implementation-focused Completion Review is the only ready Case obligation.",
        "snapshot_token": "72c1fbafe965c5fe217e9352660ab8fe213d9abfb87a91558f6ac4e3a3f865f5",
        "selected_ref": "case-gap:CASE-20260811-004:CASE-20260811-004:completion-review:1",
        "comparison_summary": "Compared the five Project-level candidates with the current Case review. They require separate Cases; reviewing the just-completed protocol is the only current Case result.",
        "fresh_discovery_summary": "No higher-priority fresh ordinary Gap was known before review; the review itself found one persisted-assessment audit omission.",
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
            "reason": "Broader isolated-agent evaluation remains a separate Project Case."
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
            "reason": "General Runtime resilience remains separate from reviewing this protocol change."
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
            "reason": "Permission-bearing validation needs a separate Case and fixture."
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
            "reason": "Synchronization governance follows source acceptance and is not Completion Review content."
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
            "reason": "The broad Project/Iteration/Case audit program remains a separate Project Case."
          },
          {
            "ref": "case-gap:CASE-20260811-004:CASE-20260811-004:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the only ready Case obligation after all ordinary gaps and impacts closed."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260811-004:completion-review:1",
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
        "goal": "Review content revision 3 across the five completion dimensions without changing implementation.",
        "expected_state_change": "Record review findings only; any repair becomes a later ordinary Gap."
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
          "reviewed_content_revision": 3,
          "dimensions": {
            "implementation_correctness": "findings",
            "problem_resolution": "clean",
            "verification_credibility": "findings",
            "regression_risk": "findings",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "INVARIANT-ASSESSMENT-CANONICAL-AUDIT",
              "kind": "omission",
              "statement": "Persisted v8 Round invariant assessments are not fully audited: empty judgments or disposition/evidence inconsistencies can pass Case validation and make Completion Review eligible through empty-array closure semantics.",
              "responsibility": "agent",
              "artifact_refs": [
                "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
                "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
                "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json"
              ],
              "evidence": [
                "code:validateCaseRecordV5 only checks generic judgment fields for v8 rounds",
                "code:auditCaseRecordV5 uses judgments.every, which is true for an empty array",
                "test gap:no persisted-corruption regression for premature Completion Review"
              ]
            }
          ],
          "evidence": [
            "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
            "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
            "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
            "command:npm --prefix runtime/arckit-runtime run check (116 passed, 1 skipped)"
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
        "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
        "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
        "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
        "command:npm --prefix runtime/arckit-runtime run check (116 passed, 1 skipped)"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-11T15:10:56.017Z"
    },
    {
      "round": 5,
      "goal": "Make persisted v8 invariant-assessment validation fail closed and prove compatibility recovery detects corruption.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The persisted-assessment audit finding is the only ready Case Gap and blocks a trustworthy terminal review.",
        "snapshot_token": "373537a628ebd829348d6d40ca7f5075ea2c084a5ee9e3b2ff5ed3ffb354d61c",
        "selected_ref": "case-gap:CASE-20260811-004:CASE-20260811-004:review-finding:INVARIANT-ASSESSMENT-CANONICAL-AUDIT",
        "comparison_summary": "Compared all five Project-level candidates with the sole ready Case repair; the repair is the only result that can restore this Case's completion gate.",
        "fresh_discovery_summary": "No more important fresh candidate was discovered while implementing the bounded canonical-audit repair.",
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
            "reason": "Separate Project Case; it does not repair the current canonical audit omission."
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
            "reason": "Separate Runtime resilience work."
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
            "reason": "Separate permission-bearing validation work."
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
            "reason": "Source acceptance must precede delivery governance."
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
            "reason": "Broader cross-record acceptance remains a separate Project Case."
          },
          {
            "ref": "case-gap:CASE-20260811-004:CASE-20260811-004:review-finding:INVARIANT-ASSESSMENT-CANONICAL-AUDIT",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "It is the sole ready Case result and directly closes the Review finding."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260811-004:review-finding:INVARIANT-ASSESSMENT-CANONICAL-AUDIT",
        "responsibility": "agent",
        "goal": "Resolve review finding: Persisted v8 Round invariant assessments are not fully audited: empty judgments or disposition/evidence inconsistencies can pass Case validation and make Completion Review eligible through empty-array closure semantics.",
        "reason": "omission found by completion review",
        "derived_from": [
          "completion_review",
          "content_revision:3"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "high",
          "uncertainty": "",
          "risk": "high",
          "user_impact": ""
        },
        "evidence_required": [
          "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
          "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
          "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
          "code:validateCaseRecordV5 only checks generic judgment fields for v8 rounds",
          "code:auditCaseRecordV5 uses judgments.every, which is true for an empty array",
          "test gap:no persisted-corruption regression for premature Completion Review"
        ]
      },
      "planned_transition": {
        "goal": "Make persisted v8 invariant-assessment validation fail closed and prove compatibility recovery detects corruption.",
        "expected_state_change": "Resolve the Review finding and invalidate the prior Review so a fresh final review is required."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260811-004:review-finding:INVARIANT-ASSESSMENT-CANONICAL-AUDIT",
          "status": "resolved",
          "outcome": "Persisted v8 assessments now fail closed on empty or invalid judgments, and compatibility probing detects canonical corruption.",
          "reason": "Case audit, Case schema, cross-record compatibility checks and focused corruption regressions now agree.",
          "evidence": [
            "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
            "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
            "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
            "runtime/arckit-runtime/test/case-transition.test.mjs",
            "runtime/arckit-runtime/test/protocol-compatibility.test.mjs"
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
        "resolved_review_findings": [
          {
            "id": "INVARIANT-ASSESSMENT-CANONICAL-AUDIT",
            "resolution": "resolved",
            "reason": "Persisted assessment validation, fail-closed Review eligibility and compatibility probing now reject the corrupt states identified by Review.",
            "evidence": [
              "runtime/arckit-runtime/test/case-transition.test.mjs",
              "runtime/arckit-runtime/test/protocol-compatibility.test.mjs",
              "command:npm --prefix runtime/arckit-runtime run check (118 passed, 1 skipped)"
            ]
          }
        ],
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
        "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
        "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
        "entry/skills/arckit-development-ledger/schema/development-case-record.schema.json",
        "runtime/arckit-runtime/test/case-transition.test.mjs",
        "runtime/arckit-runtime/test/protocol-compatibility.test.mjs",
        "command:npm --prefix runtime/arckit-runtime run check (118 passed, 1 skipped)",
        "command:git diff --check"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-11T15:13:32.770Z"
    },
    {
      "round": 6,
      "goal": "Perform the final five-dimension review of content revision 4 without changing content.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case gaps, impacts and the prior Review finding are closed; Completion Review cycle 2 is the only ready Case obligation.",
        "snapshot_token": "e1a757f2eed1ef59092dbd28ac717d59131f13fbc200ce0e5a19af740f3ed8da",
        "selected_ref": "case-gap:CASE-20260811-004:CASE-20260811-004:completion-review:2",
        "comparison_summary": "Compared all five Project-level candidates with the sole Case review candidate. Project candidates require separate Cases and do not block closure of this verified Case.",
        "fresh_discovery_summary": "No fresh ordinary Gap was discovered during the final review of content revision 4.",
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
            "reason": "Broader isolated real-agent evaluation remains a separate Project Case and is preserved as a Project Gap."
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
            "reason": "General Runtime resilience remains a separate Project concern."
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
            "reason": "Permission-bearing validation remains a separate Project Case."
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
            "reason": "Application-target synchronization and drift governance remain explicitly tracked after source acceptance."
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
            "reason": "Broader real-project cross-record acceptance remains a separate Project Case."
          },
          {
            "ref": "case-gap:CASE-20260811-004:CASE-20260811-004:completion-review:2",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "It is the only ready Case obligation and content revision 4 has complete verification evidence."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260811-004:completion-review:2",
        "responsibility": "agent",
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "reason": "All ordinary Case gaps and state impacts are closed.",
        "derived_from": [
          "case_result",
          "content_revision:4"
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
        "goal": "Perform the final five-dimension review of content revision 4 without changing content.",
        "expected_state_change": "Record a clean Review and close the Case if deterministic audit agrees."
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
          "reviewed_content_revision": 4,
          "dimensions": {
            "implementation_correctness": "clean",
            "problem_resolution": "clean",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "entry/skills/using-arckit/SKILL.md",
            "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
            "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
            "entry/skills/arckit-development-ledger/scripts/protocol-compatibility.mjs",
            "runtime/arckit-runtime/test/case-transition.test.mjs",
            "runtime/arckit-runtime/test/protocol-compatibility.test.mjs",
            "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
            "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
            "command:skill quick_validate (using-arckit and arckit-development-ledger valid)",
            "command:npm --prefix runtime/arckit-runtime run check (118 passed, 1 skipped)",
            "command:git diff --check"
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
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/arckit-development-ledger/SKILL.md",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "entry/skills/arckit-development-ledger/scripts/development-case.mjs",
        "runtime/arckit-runtime/test/case-transition.test.mjs",
        "runtime/arckit-runtime/test/protocol-compatibility.test.mjs",
        "command:skill quick_validate (using-arckit and arckit-development-ledger valid)",
        "command:npm --prefix runtime/arckit-runtime run check (118 passed, 1 skipped)",
        "command:git diff --check"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-11T15:14:31.249Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-LOOP-SEMANTICS-001",
      "GAP-LOOP-TECH-CONTRACT-001",
      "GAP-LOOP-PROTOCOL-IMPLEMENTATION-001",
      "CASE-20260811-004:review-finding:INVARIANT-ASSESSMENT-CANONICAL-AUDIT"
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
    "updated_at": "2026-08-11T15:14:31.249Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
