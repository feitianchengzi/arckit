# Align dynamic Gap Loop and invariant semantics

Case: CASE-20260811-002
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-11T05:27:56.752Z

## User Intent

使每轮 Loop 基于 fresh state 独立判断并推进当前最重要的一个 Gap；software invariants 只约束当前接受的 transition，不生成预设工作清单；Completion Review 成为唯一显式语义自查，Review 后 closeout 不再修改内容。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260811-002",
  "title": "Align dynamic Gap Loop and invariant semantics",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-11T05:09:57.070Z",
  "updated_at": "2026-08-11T05:27:56.752Z",
  "user_intent": "使每轮 Loop 基于 fresh state 独立判断并推进当前最重要的一个 Gap；software invariants 只约束当前接受的 transition，不生成预设工作清单；Completion Review 成为唯一显式语义自查，Review 后 closeout 不再修改内容。",
  "expected_outcome": "using-arckit、Development Ledger、Runtime schema/runner、技术说明和测试共同实现并证明：Case 创建无需初始 impacts，后续普通 Gap 可在 fresh round 中被 Agent 语义提出并当轮执行，invariants 不承担诊断/流程路由，普通 Gap 只要求目标内证据，Completion Review 之外没有显式语义自查或关闭后修复。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-LOOP-001",
      "revision": 1,
      "status": "accepted",
      "statement": "每轮 Loop 基于 fresh Project/Case/工程事实独立判断当前最重要的一个 Gap；Case 创建和上一轮 transition 不预先规划完整 impacts 或 Gap 链。",
      "basis": "用户明确确认一次只做一个事情并依靠 Loop 持续补齐。",
      "evidence": [
        "original_user_input: 每一轮都是独立判断看下一步 gap 是什么。"
      ]
    },
    {
      "id": "FACT-LOOP-002",
      "revision": 1,
      "status": "accepted",
      "statement": "Software invariants 是当前 accepted transition 的抽象正确性约束，不负责生成 Bug 诊断、交互定义、代码实现或验证流程；这些动作由 Agent 根据阻塞、不确定性、风险、信息增益与可验证性动态选择。",
      "basis": "用户认同六条 invariant 的方向，但拒绝把它们当作同时补齐的任务清单。",
      "evidence": [
        "original_user_input: software_invariants 的影响不需要一起做，一次只做一个事情。"
      ]
    },
    {
      "id": "FACT-LOOP-003",
      "revision": 1,
      "status": "accepted",
      "statement": "Completion Review 是唯一显式语义自查；普通 Gap 只完成自身目标与必要证据，Review 后 closeout 不得再次语义检查或修复已关闭内容。",
      "basis": "用户明确限定唯一显式自查位置。",
      "evidence": [
        "original_user_input: 唯一需要显式自查的地方只有最后的 Completion Review。"
      ]
    },
    {
      "id": "FACT-LOOP-004",
      "revision": 1,
      "status": "accepted",
      "statement": "Case Transition v6 explicitly records candidate/fresh gap_selection; a fresh Gap is Agent-owned, dependency-ready, not previously persisted, and atomically created and resolved in the current turn.",
      "basis": "Ledger, Runtime gate/orchestrator, schemas, skills, and regression tests implement the same contract.",
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/arckit-development-ledger/SKILL.md",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/gate-engine.mjs",
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
        "runtime/arckit-runtime/test/case-transition.test.mjs",
        "runtime/arckit-runtime/test/state-condition-case.test.mjs",
        "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
        "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated skip"
      ]
    },
    {
      "id": "FACT-LOOP-005",
      "revision": 1,
      "status": "accepted",
      "statement": "Completion Review is the sole explicit semantic self-check; once it resolves the Case, Runtime closeout is limited to Git commit/no-op and cannot validate, edit, or repair content.",
      "basis": "The runner prompt, skill boundaries, technical contract, and prompt regression test agree.",
      "evidence": [
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "entry/skills/using-arckit/SKILL.md",
        "arckit/tech/arckit-runtime/desktop-execution-solution.md"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-LOOP-TECH-001",
      "fact_id": "FACT-LOOP-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 4
      },
      "effect": "upheld",
      "reason": "The accepted protocol upgrade is represented consistently in the repository architecture and Runtime boundary.",
      "gap_ids": [],
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/arckit-development-ledger/SKILL.md",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/gate-engine.mjs",
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
        "runtime/arckit-runtime/test/case-transition.test.mjs",
        "runtime/arckit-runtime/test/state-condition-case.test.mjs",
        "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
        "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated skip"
      ]
    },
    {
      "id": "IMPACT-LOOP-DATA-001",
      "fact_id": "FACT-LOOP-004",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "data_and_state",
        "revision": 2
      },
      "effect": "upheld",
      "reason": "The accepted Case transition now durably records how the current Gap was selected without preplanning future work.",
      "gap_ids": [],
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/arckit-development-ledger/SKILL.md",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/gate-engine.mjs",
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
        "runtime/arckit-runtime/test/case-transition.test.mjs",
        "runtime/arckit-runtime/test/state-condition-case.test.mjs",
        "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
        "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated skip"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-DYNAMIC-LOOP-PROTOCOL-001",
      "status": "resolved",
      "goal": "实现并验证 fresh-round Gap 提议、transition-scoped invariant 语义和 Completion Review 唯一自查边界，使 skill、ledger、Runtime 与持久技术契约一致。",
      "reason": "当前协议和 Runtime 仍只允许选择预先存在的 candidate gap，并在 Case resolved 后运行可检查和修复内容的 semantic closeout。",
      "derived_from": [
        "FACT-LOOP-001",
        "FACT-LOOP-002",
        "FACT-LOOP-003"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "blocks intended Loop semantics",
        "uncertainty": "low after explicit user decisions",
        "risk": "high protocol and state-integrity impact",
        "user_impact": "high"
      },
      "responsibility": "agent",
      "evidence_required": [
        "skill and durable protocol contract updates",
        "ledger/runtime schema and implementation tests",
        "full Runtime and cross-record audits"
      ],
      "resolution": {
        "id": "GAP-DYNAMIC-LOOP-PROTOCOL-001",
        "status": "resolved",
        "outcome": "Skills, ledger, Runtime, schemas, tests, UI wording, and technical contracts now implement the requested dynamic Loop semantics.",
        "reason": "Transition v6 accepts candidate or current-turn fresh gaps, core invariants constrain accepted transitions, and resolved Case closeout is Git-only.",
        "evidence": [
          "entry/skills/using-arckit/SKILL.md",
          "entry/skills/arckit-development-ledger/SKILL.md",
          "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
          "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
          "runtime/arckit-runtime/src/agent-orchestrator.mjs",
          "runtime/arckit-runtime/src/gate-engine.mjs",
          "runtime/arckit-runtime/src/state-driven-runner.mjs",
          "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
          "runtime/arckit-runtime/test/case-transition.test.mjs",
          "runtime/arckit-runtime/test/state-condition-case.test.mjs",
          "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
          "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
          "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
          "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated skip"
        ],
        "occurred_at": "2026-08-11T05:24:56.914Z"
      }
    },
    {
      "id": "CASE-20260811-002:review-finding:CR-LOOP-001",
      "status": "resolved",
      "goal": "Resolve review finding: The distributed controller conversation protocol still says to compare only ready dynamic gaps and leaves initial impacts ambiguous, so it does not fully express current-turn fresh Gap selection or empty-by-default initial impacts.",
      "reason": "omission found by completion review",
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
        "entry/skills/using-arckit/references/controller-conversation-protocol.md",
        "entry/skills/using-arckit/references/controller-conversation-protocol.md: ready-only flow and initial facts/impacts/gaps wording"
      ],
      "resolution": {
        "id": "CASE-20260811-002:review-finding:CR-LOOP-001",
        "status": "resolved",
        "outcome": "The forward conversation flow now includes candidate/fresh selection and empty-by-default initial impacts, and the reference is linked from the main skill.",
        "reason": "The changed reference and link checks directly close CR-LOOP-001.",
        "evidence": [
          "entry/skills/using-arckit/references/controller-conversation-protocol.md",
          "entry/skills/using-arckit/SKILL.md",
          "using-arckit structure and relative links: ok",
          "using-arckit agents/openai.yaml parse: ok",
          "git diff --check -- entry/skills/using-arckit: clean"
        ],
        "occurred_at": "2026-08-11T05:27:22.032Z"
      }
    }
  ],
  "content_revision": 2,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-08-11T05:09:57.070Z"
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
          "implementation_correctness": "clean",
          "problem_resolution": "findings",
          "verification_credibility": "clean",
          "regression_risk": "clean",
          "minimality": "clean"
        },
        "finding_ids": [
          "CR-LOOP-001"
        ],
        "evidence": [
          "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated skip",
          "project-state audit: ok",
          "iteration-state audit: ok",
          "development-case audit: review_ready",
          "skill markdown relative links: ok",
          "skill agents/openai.yaml parse: ok",
          "transition/runtime JSON schemas parse: ok",
          "git diff --check: clean"
        ],
        "occurred_at": "2026-08-11T05:26:16.645Z"
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
          "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated Electron layout skip",
          "arckit/project/state.record.json audit: ok",
          "active iteration audit: ok",
          "CASE-20260811-002 content revision 2 audit: review_ready",
          "using-arckit structure, links, YAML: ok",
          "case transition and Agent result JSON schemas: parse ok",
          "git diff --check: clean",
          "entry/skills/using-arckit/references/controller-conversation-protocol.md"
        ],
        "occurred_at": "2026-08-11T05:27:56.752Z"
      }
    ],
    "evidence": [
      "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated skip",
      "project-state audit: ok",
      "iteration-state audit: ok",
      "development-case audit: review_ready",
      "skill markdown relative links: ok",
      "skill agents/openai.yaml parse: ok",
      "transition/runtime JSON schemas parse: ok",
      "git diff --check: clean",
      "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated Electron layout skip",
      "arckit/project/state.record.json audit: ok",
      "active iteration audit: ok",
      "CASE-20260811-002 content revision 2 audit: review_ready",
      "using-arckit structure, links, YAML: ok",
      "case transition and Agent result JSON schemas: parse ok",
      "entry/skills/using-arckit/references/controller-conversation-protocol.md"
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
      "goal": "实现并验证 fresh-round Gap 提议、transition-scoped invariant 语义和 Completion Review 唯一自查边界，使 skill、ledger、Runtime 与持久技术契约一致。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The existing protocol-alignment gap is the current blocking work and its implementation plus regression evidence are now complete."
      },
      "selected_gap": {
        "id": "GAP-DYNAMIC-LOOP-PROTOCOL-001",
        "responsibility": "agent",
        "goal": "实现并验证 fresh-round Gap 提议、transition-scoped invariant 语义和 Completion Review 唯一自查边界，使 skill、ledger、Runtime 与持久技术契约一致。",
        "reason": "当前协议和 Runtime 仍只允许选择预先存在的 candidate gap，并在 Case resolved 后运行可检查和修复内容的 semantic closeout。",
        "derived_from": [
          "FACT-LOOP-001",
          "FACT-LOOP-002",
          "FACT-LOOP-003"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "blocks intended Loop semantics",
          "uncertainty": "low after explicit user decisions",
          "risk": "high protocol and state-integrity impact",
          "user_impact": "high"
        },
        "evidence_required": [
          "skill and durable protocol contract updates",
          "ledger/runtime schema and implementation tests",
          "full Runtime and cross-record audits"
        ]
      },
      "planned_transition": {
        "goal": "实现并验证 fresh-round Gap 提议、transition-scoped invariant 语义和 Completion Review 唯一自查边界，使 skill、ledger、Runtime 与持久技术契约一致。",
        "expected_state_change": "The selected protocol gap becomes resolved; Transition v6, transition-scoped core invariants, fresh gap selection, and the sole Completion Review boundary become durable and tested."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-DYNAMIC-LOOP-PROTOCOL-001",
          "status": "resolved",
          "outcome": "Skills, ledger, Runtime, schemas, tests, UI wording, and technical contracts now implement the requested dynamic Loop semantics.",
          "reason": "Transition v6 accepts candidate or current-turn fresh gaps, core invariants constrain accepted transitions, and resolved Case closeout is Git-only.",
          "evidence": [
            "entry/skills/using-arckit/SKILL.md",
            "entry/skills/arckit-development-ledger/SKILL.md",
            "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
            "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
            "runtime/arckit-runtime/src/agent-orchestrator.mjs",
            "runtime/arckit-runtime/src/gate-engine.mjs",
            "runtime/arckit-runtime/src/state-driven-runner.mjs",
            "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
            "runtime/arckit-runtime/test/case-transition.test.mjs",
            "runtime/arckit-runtime/test/state-condition-case.test.mjs",
            "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
            "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
            "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
            "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated skip"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-LOOP-004",
            "revision": 1,
            "status": "accepted",
            "statement": "Case Transition v6 explicitly records candidate/fresh gap_selection; a fresh Gap is Agent-owned, dependency-ready, not previously persisted, and atomically created and resolved in the current turn.",
            "basis": "Ledger, Runtime gate/orchestrator, schemas, skills, and regression tests implement the same contract.",
            "evidence": [
              "entry/skills/using-arckit/SKILL.md",
              "entry/skills/arckit-development-ledger/SKILL.md",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/gate-engine.mjs",
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
              "runtime/arckit-runtime/test/case-transition.test.mjs",
              "runtime/arckit-runtime/test/state-condition-case.test.mjs",
              "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
              "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated skip"
            ]
          },
          {
            "id": "FACT-LOOP-005",
            "revision": 1,
            "status": "accepted",
            "statement": "Completion Review is the sole explicit semantic self-check; once it resolves the Case, Runtime closeout is limited to Git commit/no-op and cannot validate, edit, or repair content.",
            "basis": "The runner prompt, skill boundaries, technical contract, and prompt regression test agree.",
            "evidence": [
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "entry/skills/using-arckit/SKILL.md",
              "arckit/tech/arckit-runtime/desktop-execution-solution.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-LOOP-TECH-001",
            "fact_id": "FACT-LOOP-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 4
            },
            "effect": "upheld",
            "reason": "The accepted protocol upgrade is represented consistently in the repository architecture and Runtime boundary.",
            "gap_ids": [],
            "evidence": [
              "entry/skills/using-arckit/SKILL.md",
              "entry/skills/arckit-development-ledger/SKILL.md",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/gate-engine.mjs",
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
              "runtime/arckit-runtime/test/case-transition.test.mjs",
              "runtime/arckit-runtime/test/state-condition-case.test.mjs",
              "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
              "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated skip"
            ]
          },
          {
            "id": "IMPACT-LOOP-DATA-001",
            "fact_id": "FACT-LOOP-004",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "data_and_state",
              "revision": 2
            },
            "effect": "upheld",
            "reason": "The accepted Case transition now durably records how the current Gap was selected without preplanning future work.",
            "gap_ids": [],
            "evidence": [
              "entry/skills/using-arckit/SKILL.md",
              "entry/skills/arckit-development-ledger/SKILL.md",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/gate-engine.mjs",
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
              "runtime/arckit-runtime/test/case-transition.test.mjs",
              "runtime/arckit-runtime/test/state-condition-case.test.mjs",
              "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
              "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated skip"
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
            "area_ref": "technical_foundation",
            "observed_revision": 3,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit uses repository-owned Markdown/JSON state, Node.js ESM ledger and Runtime scripts, an Electron desktop host, Project State v5, Case v5, candidate/fresh Case Transition v6, and Iteration v3 with trusted atomic transitions.",
              "reason": "Transition v6 and its Runtime/ledger enforcement are implemented, documented, and covered by automated regression tests.",
              "evidence": [
                "entry/skills/using-arckit/SKILL.md",
                "entry/skills/arckit-development-ledger/SKILL.md",
                "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
                "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
                "runtime/arckit-runtime/src/agent-orchestrator.mjs",
                "runtime/arckit-runtime/src/gate-engine.mjs",
                "runtime/arckit-runtime/src/state-driven-runner.mjs",
                "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
                "runtime/arckit-runtime/test/case-transition.test.mjs",
                "runtime/arckit-runtime/test/state-condition-case.test.mjs",
                "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
                "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
                "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
                "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated skip"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [
              "GAP-runtime-resilience-and-adapters"
            ],
            "reason": "The accepted transition upgrades the active Case transition contract from v5 to v6.",
            "evidence": [
              "entry/skills/using-arckit/SKILL.md",
              "entry/skills/arckit-development-ledger/SKILL.md",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/gate-engine.mjs",
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
              "runtime/arckit-runtime/test/case-transition.test.mjs",
              "runtime/arckit-runtime/test/state-condition-case.test.mjs",
              "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
              "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated skip"
            ]
          },
          {
            "area_ref": "data_and_state",
            "observed_revision": 1,
            "set_decision": {
              "status": "settled",
              "statement": "Canonical project data is Project v5, Iteration v3 and Case v5 in arckit/; each accepted Loop mutation uses Case Transition v6 with explicit candidate/fresh gap_selection, while Runtime run/session/thread records stay outside the target project and only opaque refs enter the ledger.",
              "reason": "The ledger now persists explicit per-round selection mode and basis while preserving the existing source-of-truth boundary.",
              "evidence": [
                "entry/skills/using-arckit/SKILL.md",
                "entry/skills/arckit-development-ledger/SKILL.md",
                "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
                "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
                "runtime/arckit-runtime/src/agent-orchestrator.mjs",
                "runtime/arckit-runtime/src/gate-engine.mjs",
                "runtime/arckit-runtime/src/state-driven-runner.mjs",
                "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
                "runtime/arckit-runtime/test/case-transition.test.mjs",
                "runtime/arckit-runtime/test/state-condition-case.test.mjs",
                "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
                "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
                "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
                "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated skip"
              ],
              "confidence": "high",
              "resume_condition": ""
            },
            "gap_refs": [
              "GAP-cross-record-audit"
            ],
            "reason": "The accepted transition adds a durable selection field to the Case mutation protocol.",
            "evidence": [
              "entry/skills/using-arckit/SKILL.md",
              "entry/skills/arckit-development-ledger/SKILL.md",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/src/gate-engine.mjs",
              "runtime/arckit-runtime/src/state-driven-runner.mjs",
              "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
              "runtime/arckit-runtime/test/case-transition.test.mjs",
              "runtime/arckit-runtime/test/state-condition-case.test.mjs",
              "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
              "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
              "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated skip"
            ]
          }
        ],
        "software_invariant_changes": [
          {
            "action": "sync_core",
            "invariant": {
              "id": "observable-behavior-has-durable-expectation",
              "applies_when": "The accepted Case transition adds or changes user-observable behavior, business rules, or acceptance semantics.",
              "must_hold": "The behavior accepted by this transition has an accurate, unambiguous, and durably recoverable product expectation.",
              "evidence_expectation": "Persistent evidence sufficient to recover the accepted behavior and its acceptance basis.",
              "priority": "required"
            },
            "reason": "Synchronize the core invariant with the accepted-transition-scoped protocol definition.",
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md"
            ]
          },
          {
            "action": "sync_core",
            "invariant": {
              "id": "changed-interactions-remain-recoverable",
              "applies_when": "The accepted Case transition adds or changes a user journey, interaction rule, navigation, feedback, or operable state.",
              "must_hold": "The interaction change accepted by this transition is coherent and durably recoverable.",
              "evidence_expectation": "Persistent evidence sufficient to understand and verify the accepted interaction change.",
              "priority": "required"
            },
            "reason": "Synchronize the core invariant with the accepted-transition-scoped protocol definition.",
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md"
            ]
          },
          {
            "action": "sync_core",
            "invariant": {
              "id": "changed-visual-language-remains-consistent",
              "applies_when": "The accepted Case transition adds or changes visual appearance, layout, theme, token, or component presentation.",
              "must_hold": "The visual change accepted by this transition remains consistent with the project visual language and is durably recoverable.",
              "evidence_expectation": "Persistent visual specification or equivalent evidence for the accepted visual change.",
              "priority": "required"
            },
            "reason": "Synchronize the core invariant with the accepted-transition-scoped protocol definition.",
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md"
            ]
          },
          {
            "action": "sync_core",
            "invariant": {
              "id": "changed-contracts-remain-explainable",
              "applies_when": "The accepted Case transition changes architecture, data models, APIs, integration boundaries, runtime contracts, or important technical constraints.",
              "must_hold": "The technical contract accepted by this transition is coherent, explainable, and durably recoverable.",
              "evidence_expectation": "Persistent technical evidence sufficient to recover the accepted decision, constraints, and affected boundaries.",
              "priority": "required"
            },
            "reason": "Synchronize the core invariant with the accepted-transition-scoped protocol definition.",
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md"
            ]
          },
          {
            "action": "sync_core",
            "invariant": {
              "id": "accepted-facts-are-realized",
              "applies_when": "The accepted Case transition claims executable behavior was added or changed, or that an implementation Gap was resolved.",
              "must_hold": "The implementation accepted by this transition realizes its relevant accepted facts and upheld project decisions and invariants.",
              "evidence_expectation": "Code and implementation evidence traceable to the facts and Project State used by this transition.",
              "priority": "required"
            },
            "reason": "Synchronize the core invariant with the accepted-transition-scoped protocol definition.",
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md"
            ]
          },
          {
            "action": "sync_core",
            "invariant": {
              "id": "material-risks-have-credible-evidence",
              "applies_when": "The accepted Case transition changes a risk-bearing surface or claims that a material correctness or regression risk is controlled.",
              "must_hold": "The risk-bearing claims accepted by this transition are supported by credible, repeatable, proportionate evidence.",
              "evidence_expectation": "Tests, checks, inspection, or operational evidence proportionate to the risks accepted by this transition.",
              "priority": "required"
            },
            "reason": "Synchronize the core invariant with the accepted-transition-scoped protocol definition.",
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
              "arckit/tech/arckit-runtime/state-condition-ledger-solution.md"
            ]
          }
        ],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "entry/skills/using-arckit/SKILL.md",
          "entry/skills/arckit-development-ledger/SKILL.md",
          "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
          "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
          "runtime/arckit-runtime/src/agent-orchestrator.mjs",
          "runtime/arckit-runtime/src/gate-engine.mjs",
          "runtime/arckit-runtime/src/state-driven-runner.mjs",
          "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
          "runtime/arckit-runtime/test/case-transition.test.mjs",
          "runtime/arckit-runtime/test/state-condition-case.test.mjs",
          "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
          "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
          "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
          "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated skip"
        ]
      },
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/arckit-development-ledger/SKILL.md",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "entry/skills/arckit-development-ledger/scripts/project-invariants.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/gate-engine.mjs",
        "runtime/arckit-runtime/src/state-driven-runner.mjs",
        "runtime/arckit-runtime/schemas/agent-loop-result.schema.json",
        "runtime/arckit-runtime/test/case-transition.test.mjs",
        "runtime/arckit-runtime/test/state-condition-case.test.mjs",
        "runtime/arckit-runtime/test/coherent-agent-loop.test.mjs",
        "runtime/arckit-runtime/test/state-driven-runner.test.mjs",
        "arckit/tech/arckit-runtime/state-condition-ledger-solution.md",
        "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated skip"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-11T05:24:56.914Z"
    },
    {
      "round": 2,
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All persisted ordinary work is closed, so the ledger-derived Completion Review is the required final semantic check."
      },
      "selected_gap": {
        "id": "CASE-20260811-002:completion-review:1",
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
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "expected_state_change": "Record the five-dimension Completion Review and convert any finding into one ordinary repair Gap."
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
            "implementation_correctness": "clean",
            "problem_resolution": "findings",
            "verification_credibility": "clean",
            "regression_risk": "clean",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "CR-LOOP-001",
              "kind": "omission",
              "statement": "The distributed controller conversation protocol still says to compare only ready dynamic gaps and leaves initial impacts ambiguous, so it does not fully express current-turn fresh Gap selection or empty-by-default initial impacts.",
              "responsibility": "agent",
              "artifact_refs": [
                "entry/skills/using-arckit/references/controller-conversation-protocol.md"
              ],
              "evidence": [
                "entry/skills/using-arckit/references/controller-conversation-protocol.md: ready-only flow and initial facts/impacts/gaps wording"
              ]
            }
          ],
          "evidence": [
            "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated skip",
            "project-state audit: ok",
            "iteration-state audit: ok",
            "development-case audit: review_ready",
            "skill markdown relative links: ok",
            "skill agents/openai.yaml parse: ok",
            "transition/runtime JSON schemas parse: ok",
            "git diff --check: clean"
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
        "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated skip",
        "project-state audit: ok",
        "iteration-state audit: ok",
        "development-case audit: review_ready",
        "skill markdown relative links: ok",
        "skill agents/openai.yaml parse: ok",
        "transition/runtime JSON schemas parse: ok",
        "git diff --check: clean"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-11T05:26:16.645Z"
    },
    {
      "round": 3,
      "goal": "Resolve review finding: The distributed controller conversation protocol still says to compare only ready dynamic gaps and leaves initial impacts ambiguous, so it does not fully express current-turn fresh Gap selection or empty-by-default initial impacts.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "The Completion Review produced one Agent-owned omission gap, which is now the only ready work."
      },
      "selected_gap": {
        "id": "CASE-20260811-002:review-finding:CR-LOOP-001",
        "responsibility": "agent",
        "goal": "Resolve review finding: The distributed controller conversation protocol still says to compare only ready dynamic gaps and leaves initial impacts ambiguous, so it does not fully express current-turn fresh Gap selection or empty-by-default initial impacts.",
        "reason": "omission found by completion review",
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
          "entry/skills/using-arckit/references/controller-conversation-protocol.md",
          "entry/skills/using-arckit/references/controller-conversation-protocol.md: ready-only flow and initial facts/impacts/gaps wording"
        ]
      },
      "planned_transition": {
        "goal": "Resolve review finding: The distributed controller conversation protocol still says to compare only ready dynamic gaps and leaves initial impacts ambiguous, so it does not fully express current-turn fresh Gap selection or empty-by-default initial impacts.",
        "expected_state_change": "The stale conversation protocol is aligned and the review finding becomes resolved; Completion Review becomes pending for the new content revision."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "CASE-20260811-002:review-finding:CR-LOOP-001",
          "status": "resolved",
          "outcome": "The forward conversation flow now includes candidate/fresh selection and empty-by-default initial impacts, and the reference is linked from the main skill.",
          "reason": "The changed reference and link checks directly close CR-LOOP-001.",
          "evidence": [
            "entry/skills/using-arckit/references/controller-conversation-protocol.md",
            "entry/skills/using-arckit/SKILL.md",
            "using-arckit structure and relative links: ok",
            "using-arckit agents/openai.yaml parse: ok",
            "git diff --check -- entry/skills/using-arckit: clean"
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
            "id": "CR-LOOP-001",
            "resolution": "resolved",
            "reason": "The omitted protocol details are now explicit and discoverable.",
            "evidence": [
              "entry/skills/using-arckit/references/controller-conversation-protocol.md",
              "entry/skills/using-arckit/SKILL.md",
              "using-arckit structure and relative links: ok",
              "using-arckit agents/openai.yaml parse: ok",
              "git diff --check -- entry/skills/using-arckit: clean"
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
        "entry/skills/using-arckit/references/controller-conversation-protocol.md",
        "entry/skills/using-arckit/SKILL.md",
        "using-arckit structure and relative links: ok",
        "using-arckit agents/openai.yaml parse: ok",
        "git diff --check -- entry/skills/using-arckit: clean"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-11T05:27:22.032Z"
    },
    {
      "round": 4,
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "After resolving the sole review finding, no ordinary work remains and Completion Review is the only required semantic check."
      },
      "selected_gap": {
        "id": "CASE-20260811-002:completion-review:2",
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
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "expected_state_change": "Record a clean five-dimension review for content revision 2 and resolve the Case."
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
            "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated Electron layout skip",
            "arckit/project/state.record.json audit: ok",
            "active iteration audit: ok",
            "CASE-20260811-002 content revision 2 audit: review_ready",
            "using-arckit structure, links, YAML: ok",
            "case transition and Agent result JSON schemas: parse ok",
            "git diff --check: clean",
            "entry/skills/using-arckit/references/controller-conversation-protocol.md"
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
        "npm --prefix runtime/arckit-runtime run check: 106 tests, 105 passed, 1 environment-gated Electron layout skip",
        "arckit/project/state.record.json audit: ok",
        "active iteration audit: ok",
        "CASE-20260811-002 content revision 2 audit: review_ready",
        "using-arckit structure, links, YAML: ok",
        "case transition and Agent result JSON schemas: parse ok",
        "git diff --check: clean",
        "entry/skills/using-arckit/references/controller-conversation-protocol.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-11T05:27:56.752Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-DYNAMIC-LOOP-PROTOCOL-001",
      "CASE-20260811-002:review-finding:CR-LOOP-001"
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
    "updated_at": "2026-08-11T05:27:56.752Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
