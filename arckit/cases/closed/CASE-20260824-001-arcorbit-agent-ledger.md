# 治理 ArcOrbit Agent 语义输出与 Ledger 提交边界

Case: CASE-20260824-001
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-24T03:38:58.350Z

## User Intent

消除 Agent 动态业务语义与 Ledger 确定性状态提交之间的低层存储耦合，使自动执行能够在不让脚本推断业务语义的前提下稳定推进。

## Structured Record

```json
{
  "schema_version": "development-case-record/v5",
  "id": "CASE-20260824-001",
  "title": "治理 ArcOrbit Agent 语义输出与 Ledger 提交边界",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-24T02:18:58.488Z",
  "updated_at": "2026-08-24T03:38:58.350Z",
  "user_intent": "消除 Agent 动态业务语义与 Ledger 确定性状态提交之间的低层存储耦合，使自动执行能够在不让脚本推断业务语义的前提下稳定推进。",
  "expected_outcome": "Agent 只声明有证据的语义状态变更意图；可信 Ledger 确定性解析身份与版本、维护派生关系、执行完整投影校验并原子提交；局部主张错误得到可定位修正，成功 receipt 与 Case 绑定不会因后续失败丢失。",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facts": [
    {
      "id": "FACT-AGENT-OWNS-LIVE-SEMANTICS",
      "revision": 1,
      "status": "accepted",
      "statement": "业务语义由同一 Agent 结合 fresh Project/Case facts 动态判断并声明；Ledger 脚本只可执行确定性验证、解析、派生维护与原子提交，不得从自然语言或不完整字段推断业务含义。",
      "basis": "操作者明确确认的架构约束与仓库 Project State/Case/Loop、coherent Agent、trusted ledger 分工一致。",
      "evidence": [
        "AGENTS.md",
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/arckit-development-ledger/SKILL.md"
      ]
    },
    {
      "id": "FACT-AGENT-OUTPUT-IS-STORAGE-COUPLED",
      "revision": 1,
      "status": "accepted",
      "statement": "当前 Agent Loop 直接要求 Agent 生成接近 Ledger 存储形态的完整 Case transition，Agent 因而承担 revision 引用、跨作用域引用和双向关系维护；确定性写回对这些局部错误逐项 fail-fast，真实自动化运行已因连续修正耗尽而停止。",
      "basis": "当前 output schema、orchestrator、transition validator、project validator 与 repair loop 的调用链证据共同确认该耦合和失败放大路径。",
      "evidence": [
        "runtime/arcorbit/schemas/agent-loop-result.schema.json",
        "runtime/arcorbit/src/agent-orchestrator.mjs",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "entry/skills/arckit-development-ledger/scripts/project-state.mjs",
        "runtime/arcorbit/src/state-driven-runner.mjs"
      ]
    },
    {
      "id": "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Agent output is a snapshot-bound Semantic Case Command containing explicit business judgments and semantic relationships; the trusted Ledger is the sole deterministic materializer of canonical ids, revisions, derived relations, internal Transition and atomic receipts, and never infers missing business meaning.",
      "basis": "The accepted ArcOrbit technical solution defines the command boundary, ownership rules, rejection taxonomy and receipt durability, consistent with the operator-confirmed architecture constraint.",
      "evidence": [
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "AGENTS.md"
      ]
    },
    {
      "id": "FACT-SEMANTIC-COMMAND-MATERIALIZER-IMPLEMENTED",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit Agent Loop v2 outputs a snapshot-bound Semantic Case Command; the trusted Ledger writeback resolves explicit typed refs and local handles, assigns canonical ids and revisions, rehydrates the selected candidate, projects reverse Project Gap relations, compiles internal v8 and atomically applies it while legacy direct v8 remains compatible.",
      "basis": "Executable source and regression tests demonstrate deterministic mapping independent of business prose and successful end-to-end canonical writeback.",
      "evidence": [
        "runtime/arcorbit/schemas/agent-loop-result.schema.json",
        "entry/skills/arckit-development-ledger/scripts/semantic-case-command.mjs",
        "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "runtime/arcorbit/src/agent-orchestrator.mjs",
        "runtime/arcorbit/test/semantic-case-command.test.mjs",
        "entry/skills/using-arckit/references/semantic-command-handoff.md"
      ]
    },
    {
      "id": "FACT-LEDGER-REJECTION-CLASSIFICATION-IMPLEMENTED",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit and the trusted Ledger classify claim, stale, protocol, materialization and infrastructure failures by ownership; only claim_invalid enters Agent repair.",
      "basis": "The writeback policy, runner control flow and regression tests implement the accepted architecture.",
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
        "runtime/arcorbit/src/ledger-writer.mjs",
        "runtime/arcorbit/src/state-driven-runner.mjs",
        "runtime/arcorbit/test/semantic-case-command.test.mjs",
        "runtime/arcorbit/test/state-driven-runner.test.mjs"
      ]
    },
    {
      "id": "FACT-ACCEPTED-LEDGER-RECEIPTS-PERSISTED",
      "revision": 1,
      "status": "accepted",
      "statement": "ArcOrbit persists every accepted ledger result as an idempotent append-only Run receipt and derives authoritative Case binding from the full accepted receipt set.",
      "basis": "The projector preserves prior success across later failures, while Coordinator binds same-Case receipts and rejects cross-Case conflicts.",
      "evidence": [
        "runtime/arcorbit/src/projection/run-event-projector.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/test/token-usage-projector.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs"
      ]
    }
  ],
  "state_impacts": [
    {
      "id": "IMPACT-SEMANTIC-LEDGER-BOUNDARY",
      "fact_id": "FACT-AGENT-OUTPUT-IS-STORAGE-COUPLED",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "technical-decisions-remain-explainable",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The Agent semantic responsibility and Ledger deterministic materialization responsibility are now explicit and durably recoverable.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    },
    {
      "id": "IMPACT-SEMANTIC-COMMAND-TECHNICAL-FOUNDATION",
      "fact_id": "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED",
      "fact_revision": 1,
      "target": {
        "kind": "software_decision",
        "ref": "technical_foundation",
        "revision": 30
      },
      "effect": "upheld",
      "reason": "The durable technical foundation now defines the coherent Agent and trusted Ledger materialization boundary.",
      "gap_ids": [],
      "evidence": [
        "arckit/tech/arcorbit/desktop-execution-solution.md"
      ]
    },
    {
      "id": "IMPACT-SEMANTIC-COMMAND-REALIZATION",
      "fact_id": "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "Semantic command materialization, rejection responsibility and accepted receipt durability are all implemented and verified.",
      "gap_ids": [],
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
        "runtime/arcorbit/src/state-driven-runner.mjs",
        "runtime/arcorbit/test/semantic-case-command.test.mjs",
        "runtime/arcorbit/test/state-driven-runner.test.mjs",
        "runtime/arcorbit/src/projection/run-event-projector.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/test/token-usage-projector.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs"
      ]
    },
    {
      "id": "IMPACT-SEMANTIC-MATERIALIZER-REALIZATION",
      "fact_id": "FACT-SEMANTIC-COMMAND-MATERIALIZER-IMPLEMENTED",
      "fact_revision": 1,
      "target": {
        "kind": "software_invariant",
        "ref": "accepted-facts-are-realized",
        "revision": null
      },
      "effect": "upheld",
      "reason": "The semantic command and deterministic materializer slice is realized by Runtime, Ledger skill contract, source and regression tests.",
      "gap_ids": [],
      "evidence": [
        "runtime/arcorbit/schemas/agent-loop-result.schema.json",
        "entry/skills/arckit-development-ledger/scripts/semantic-case-command.mjs",
        "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "runtime/arcorbit/src/agent-orchestrator.mjs",
        "runtime/arcorbit/test/semantic-case-command.test.mjs",
        "entry/skills/using-arckit/references/semantic-command-handoff.md"
      ]
    }
  ],
  "gaps": [
    {
      "id": "GAP-SEMANTIC-COMMAND-BOUNDARY-CONTRACT",
      "status": "resolved",
      "goal": "建立并验证 Agent 语义命令到 Ledger 确定性物化的责任契约与兼容迁移切片。",
      "reason": "在修改 Runtime 或 Ledger 前，必须先明确哪些内容是 Agent 的动态语义声明，哪些身份、版本、派生关系、全局校验、错误分类和 receipt 由确定性层负责，否则会把同一耦合换一种字段形式保留下来。",
      "derived_from": [
        "FACT-AGENT-OWNS-LIVE-SEMANTICS",
        "FACT-AGENT-OUTPUT-IS-STORAGE-COUPLED"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "边界未定会阻塞安全实现。",
        "uncertainty": "中；原则已确认，但当前协议与兼容切片仍需源码级验证。",
        "risk": "高；错误下沉会让脚本推断语义，错误上浮会继续消耗 Agent 修正预算。",
        "user_impact": "高；该边界决定自动化任务能否稳定续跑和可信恢复。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "当前 Agent output 到 Ledger commit 的端到端责任图和耦合证据",
        "不由脚本推断业务语义的命令与物化边界",
        "覆盖身份、版本、派生关系、拒绝分类和持久 receipt 的兼容迁移方案",
        "能够约束后续实现的技术文档与可执行验证口径"
      ],
      "resolution": {
        "id": "GAP-SEMANTIC-COMMAND-BOUNDARY-CONTRACT",
        "status": "resolved",
        "outcome": "Accepted the Semantic Case Command and deterministic Ledger Materializer boundary.",
        "reason": "The technical contract now explicitly assigns every semantic decision to the Agent and limits Ledger behavior to reference resolution, identity/revision allocation, declared relation projection, complete validation and atomic commit.",
        "evidence": [
          "arckit/tech/arcorbit/desktop-execution-solution.md"
        ],
        "occurred_at": "2026-08-24T02:23:17.695Z"
      }
    },
    {
      "id": "GAP-IMPLEMENT-SEMANTIC-COMMAND-MATERIALIZER",
      "status": "resolved",
      "goal": "实现 Agent Semantic Case Command schema 与 trusted Ledger Command Materializer，并以兼容测试证明脚本只做确定性物化。",
      "reason": "已接受的职责契约尚未由 Runtime output 和 Ledger writeback 实现。",
      "derived_from": [
        "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED"
      ],
      "blocked_by": [],
      "priority_basis": {
        "blocking": "阻塞新的 Agent 输出边界。",
        "uncertainty": "中；需在保持 v8 canonical commit 的同时引入语义命令。",
        "risk": "高；错误实现会把语义推断下沉或保留存储耦合。",
        "user_impact": "高；直接决定自动执行稳定性。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "Semantic Case Command schema 与 validator",
        "trusted materializer 的 handle/ref/revision/关系投影测试",
        "现有 Case transition 兼容与端到端 writeback 回归"
      ],
      "resolution": {
        "id": "GAP-IMPLEMENT-SEMANTIC-COMMAND-MATERIALIZER",
        "status": "resolved",
        "outcome": "Agent v2 emits Semantic Case Command and trusted Ledger materializes typed refs/local handles into canonical v8 under the commit lock.",
        "reason": "Schema, Runtime forwarding, Ledger materialization, legacy v8 compatibility and end-to-end tests now establish the accepted responsibility boundary.",
        "evidence": [
          "runtime/arcorbit/schemas/agent-loop-result.schema.json",
          "entry/skills/arckit-development-ledger/scripts/semantic-case-command.mjs",
          "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
          "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
          "runtime/arcorbit/src/agent-orchestrator.mjs",
          "runtime/arcorbit/test/semantic-case-command.test.mjs",
          "entry/skills/using-arckit/references/semantic-command-handoff.md"
        ],
        "occurred_at": "2026-08-24T03:28:52.401Z"
      }
    },
    {
      "id": "GAP-CLASSIFY-LEDGER-REJECTIONS",
      "status": "resolved",
      "goal": "实现 claim、stale、protocol、materialization 与 infrastructure rejection 的责任分类，并只让 claim_invalid 消耗 Agent repair budget。",
      "reason": "统一 repair 会把 freshness 或确定性层故障误交给 Agent，并放大局部错误。",
      "derived_from": [
        "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED"
      ],
      "blocked_by": [
        "GAP-IMPLEMENT-SEMANTIC-COMMAND-MATERIALIZER"
      ],
      "priority_basis": {
        "blocking": "阻塞正确的自动恢复与修正策略。",
        "uncertainty": "低；分类边界已被技术契约明确。",
        "risk": "高；误分类会重复实现、错误停机或掩盖 Ledger 缺陷。",
        "user_impact": "高；决定异常是否可恢复。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "各 rejection 类的可执行测试",
        "repair budget 只对 claim_invalid 递增的 runner 测试",
        "fresh replan 与 infrastructure recovery 回归"
      ],
      "resolution": {
        "id": "GAP-CLASSIFY-LEDGER-REJECTIONS",
        "status": "resolved",
        "outcome": "Five rejection classes now route to claim repair, fresh replan, protocol reconciliation, materializer inspection, or Runtime recovery.",
        "reason": "Executable policy and runner tests demonstrate the accepted responsibility boundary.",
        "evidence": [
          "entry/skills/arckit-development-ledger/scripts/semantic-case-command.mjs",
          "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
          "runtime/arcorbit/src/ledger-writer.mjs",
          "runtime/arcorbit/src/state-driven-runner.mjs",
          "runtime/arcorbit/test/semantic-case-command.test.mjs",
          "runtime/arcorbit/test/state-driven-runner.test.mjs",
          "runtime/arcorbit/test/ledger-writer.test.mjs"
        ],
        "occurred_at": "2026-08-24T03:34:03.439Z"
      }
    },
    {
      "id": "GAP-PERSIST-ACCEPTED-LEDGER-RECEIPTS",
      "status": "resolved",
      "goal": "把 accepted ledger receipts 作为 append-only Run 事实持久化，并由 Coordinator 从 receipts 建立不可被后续失败覆盖的 Case binding。",
      "reason": "latest-only ledger projection 会丢失先前成功的 Case 创建或 transition receipt，使真实 Case 已存在但任务仍未绑定。",
      "derived_from": [
        "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED"
      ],
      "blocked_by": [
        "GAP-IMPLEMENT-SEMANTIC-COMMAND-MATERIALIZER"
      ],
      "priority_basis": {
        "blocking": "阻塞可靠 Case binding 与重启恢复。",
        "uncertainty": "低；覆盖路径已由 projector 与 Coordinator 调用链确认。",
        "risk": "高；证据丢失会产生重复 Case 或错误 recovery。",
        "user_impact": "高；任务看似失败且无法正确续跑。"
      },
      "responsibility": "agent",
      "evidence_required": [
        "连续成功/失败 round 的 append-only receipt projector 测试",
        "同 Case 多 receipt 和跨 Case 冲突的 Coordinator 测试",
        "detached startup reconciliation 回归"
      ],
      "resolution": {
        "id": "GAP-PERSIST-ACCEPTED-LEDGER-RECEIPTS",
        "status": "resolved",
        "outcome": "Run Activity appends accepted ledger receipts, and Coordinator aggregates them into stable or conflicting Case bindings across live and detached recovery.",
        "reason": "Projector, binding extraction, conflict handling and detached-start tests demonstrate the accepted behavior.",
        "evidence": [
          "runtime/arcorbit/src/projection/run-event-projector.mjs",
          "runtime/arcorbit/src/automation-coordinator.mjs",
          "runtime/arcorbit/test/token-usage-projector.test.mjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "npm test: 355 tests, 350 passed, 5 skipped, 0 failed"
        ],
        "occurred_at": "2026-08-24T03:36:36.555Z"
      }
    }
  ],
  "content_revision": 4,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 10,
      "source": "runtime/arcorbit/config/case-policy.json",
      "snapshotted_at": "2026-08-24T02:18:58.488Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
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
          "arckit/tech/arcorbit/desktop-execution-solution.md",
          "entry/skills/using-arckit/references/semantic-command-handoff.md",
          "runtime/arcorbit/test/semantic-case-command.test.mjs",
          "runtime/arcorbit/test/state-driven-runner.test.mjs",
          "runtime/arcorbit/test/token-usage-projector.test.mjs",
          "runtime/arcorbit/test/automation-coordinator.test.mjs",
          "npm test: 356 tests, 351 passed, 5 skipped, 0 failed",
          "skill quick validation: both maintained skills valid",
          "git diff --check: clean"
        ],
        "occurred_at": "2026-08-24T03:38:58.350Z"
      }
    ],
    "evidence": [
      "arckit/tech/arcorbit/desktop-execution-solution.md",
      "entry/skills/using-arckit/references/semantic-command-handoff.md",
      "runtime/arcorbit/test/semantic-case-command.test.mjs",
      "runtime/arcorbit/test/state-driven-runner.test.mjs",
      "runtime/arcorbit/test/token-usage-projector.test.mjs",
      "runtime/arcorbit/test/automation-coordinator.test.mjs",
      "npm test: 356 tests, 351 passed, 5 skipped, 0 failed",
      "skill quick validation: both maintained skills valid",
      "git diff --check: clean"
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
      "goal": "建立并验证 Agent 语义命令到 Ledger 确定性物化的责任契约与兼容迁移切片。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh snapshot comparison identifies the Case contract gap as the only ready candidate for this architecture Case.",
        "snapshot_token": "c25d54b9367ab38a9c14c361b174295c3768ea6dc2c0eb89b7a8bde8a30468df",
        "selected_ref": "case-gap:CASE-20260824-001:GAP-SEMANTIC-COMMAND-BOUNDARY-CONTRACT",
        "comparison_summary": "Four Project gaps require separate Cases; the unrelated Work performance Case is out of scope; the semantic command contract is selected.",
        "fresh_discovery_summary": "No fresh gap supersedes the persisted contract gap; implementation obligations are consequences of the accepted contract and are added for later rounds.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "该 Project Gap 需要独立 Case，且不替代当前已绑定的语义命令边界契约。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "该 Project Gap 需要独立 Case，且不替代当前已绑定的语义命令边界契约。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "该 Project Gap 需要独立 Case，且不替代当前已绑定的语义命令边界契约。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "该 Project Gap 需要独立 Case，且不替代当前已绑定的语义命令边界契约。"
          },
          {
            "ref": "case-gap:CASE-20260824-001:GAP-SEMANTIC-COMMAND-BOUNDARY-CONTRACT",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "边界未定会阻塞安全实现。",
              "uncertainty": "中；原则已确认，但当前协议与兼容切片仍需源码级验证。",
              "risk": "高；错误下沉会让脚本推断语义，错误上浮会继续消耗 Agent 修正预算。",
              "user_impact": "高；该边界决定自动化任务能否稳定续跑和可信恢复。"
            },
            "reason": "该 Gap 是当前架构 Case 唯一 ready 候选，先确定责任契约才能安全实现。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-SEMANTIC-COMMAND-BOUNDARY-CONTRACT",
        "responsibility": "agent",
        "goal": "建立并验证 Agent 语义命令到 Ledger 确定性物化的责任契约与兼容迁移切片。",
        "reason": "在修改 Runtime 或 Ledger 前，必须先明确哪些内容是 Agent 的动态语义声明，哪些身份、版本、派生关系、全局校验、错误分类和 receipt 由确定性层负责，否则会把同一耦合换一种字段形式保留下来。",
        "derived_from": [
          "FACT-AGENT-OWNS-LIVE-SEMANTICS",
          "FACT-AGENT-OUTPUT-IS-STORAGE-COUPLED"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "边界未定会阻塞安全实现。",
          "uncertainty": "中；原则已确认，但当前协议与兼容切片仍需源码级验证。",
          "risk": "高；错误下沉会让脚本推断语义，错误上浮会继续消耗 Agent 修正预算。",
          "user_impact": "高；该边界决定自动化任务能否稳定续跑和可信恢复。"
        },
        "evidence_required": [
          "当前 Agent output 到 Ledger commit 的端到端责任图和耦合证据",
          "不由脚本推断业务语义的命令与物化边界",
          "覆盖身份、版本、派生关系、拒绝分类和持久 receipt 的兼容迁移方案",
          "能够约束后续实现的技术文档与可执行验证口径"
        ]
      },
      "planned_transition": {
        "goal": "建立并验证 Agent 语义命令到 Ledger 确定性物化的责任契约与兼容迁移切片。",
        "expected_state_change": "Undefined Agent/Ledger responsibility boundary becomes an accepted durable contract with bounded implementation gaps."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-SEMANTIC-COMMAND-BOUNDARY-CONTRACT",
          "status": "resolved",
          "outcome": "Accepted the Semantic Case Command and deterministic Ledger Materializer boundary.",
          "reason": "The technical contract now explicitly assigns every semantic decision to the Agent and limits Ledger behavior to reference resolution, identity/revision allocation, declared relation projection, complete validation and atomic commit.",
          "evidence": [
            "arckit/tech/arcorbit/desktop-execution-solution.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Agent output is a snapshot-bound Semantic Case Command containing explicit business judgments and semantic relationships; the trusted Ledger is the sole deterministic materializer of canonical ids, revisions, derived relations, internal Transition and atomic receipts, and never infers missing business meaning.",
            "basis": "The accepted ArcOrbit technical solution defines the command boundary, ownership rules, rejection taxonomy and receipt durability, consistent with the operator-confirmed architecture constraint.",
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "AGENTS.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-SEMANTIC-COMMAND-TECHNICAL-FOUNDATION",
            "fact_id": "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED",
            "fact_revision": 1,
            "target": {
              "kind": "software_decision",
              "ref": "technical_foundation",
              "revision": 30
            },
            "effect": "upheld",
            "reason": "The durable technical foundation now defines the coherent Agent and trusted Ledger materialization boundary.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          },
          {
            "id": "IMPACT-SEMANTIC-COMMAND-REALIZATION",
            "fact_id": "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Current Runtime still exposes storage-shaped Transition v8 and latest-only ledger projection, so the accepted contract is not yet realized.",
            "gap_ids": [
              "GAP-IMPLEMENT-SEMANTIC-COMMAND-MATERIALIZER",
              "GAP-CLASSIFY-LEDGER-REJECTIONS",
              "GAP-PERSIST-ACCEPTED-LEDGER-RECEIPTS"
            ],
            "evidence": [
              "runtime/arcorbit/schemas/agent-loop-result.schema.json",
              "runtime/arcorbit/src/projection/run-event-projector.mjs"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-SEMANTIC-LEDGER-BOUNDARY",
            "fact_id": "FACT-AGENT-OUTPUT-IS-STORAGE-COUPLED",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "technical-decisions-remain-explainable",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The Agent semantic responsibility and Ledger deterministic materialization responsibility are now explicit and durably recoverable.",
            "gap_ids": [],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          }
        ],
        "gaps_added": [
          {
            "id": "GAP-IMPLEMENT-SEMANTIC-COMMAND-MATERIALIZER",
            "status": "open",
            "goal": "实现 Agent Semantic Case Command schema 与 trusted Ledger Command Materializer，并以兼容测试证明脚本只做确定性物化。",
            "reason": "已接受的职责契约尚未由 Runtime output 和 Ledger writeback 实现。",
            "derived_from": [
              "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED"
            ],
            "blocked_by": [],
            "priority_basis": {
              "blocking": "阻塞新的 Agent 输出边界。",
              "uncertainty": "中；需在保持 v8 canonical commit 的同时引入语义命令。",
              "risk": "高；错误实现会把语义推断下沉或保留存储耦合。",
              "user_impact": "高；直接决定自动执行稳定性。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "Semantic Case Command schema 与 validator",
              "trusted materializer 的 handle/ref/revision/关系投影测试",
              "现有 Case transition 兼容与端到端 writeback 回归"
            ],
            "resolution": null
          },
          {
            "id": "GAP-CLASSIFY-LEDGER-REJECTIONS",
            "status": "open",
            "goal": "实现 claim、stale、protocol、materialization 与 infrastructure rejection 的责任分类，并只让 claim_invalid 消耗 Agent repair budget。",
            "reason": "统一 repair 会把 freshness 或确定性层故障误交给 Agent，并放大局部错误。",
            "derived_from": [
              "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED"
            ],
            "blocked_by": [
              "GAP-IMPLEMENT-SEMANTIC-COMMAND-MATERIALIZER"
            ],
            "priority_basis": {
              "blocking": "阻塞正确的自动恢复与修正策略。",
              "uncertainty": "低；分类边界已被技术契约明确。",
              "risk": "高；误分类会重复实现、错误停机或掩盖 Ledger 缺陷。",
              "user_impact": "高；决定异常是否可恢复。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "各 rejection 类的可执行测试",
              "repair budget 只对 claim_invalid 递增的 runner 测试",
              "fresh replan 与 infrastructure recovery 回归"
            ],
            "resolution": null
          },
          {
            "id": "GAP-PERSIST-ACCEPTED-LEDGER-RECEIPTS",
            "status": "open",
            "goal": "把 accepted ledger receipts 作为 append-only Run 事实持久化，并由 Coordinator 从 receipts 建立不可被后续失败覆盖的 Case binding。",
            "reason": "latest-only ledger projection 会丢失先前成功的 Case 创建或 transition receipt，使真实 Case 已存在但任务仍未绑定。",
            "derived_from": [
              "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED"
            ],
            "blocked_by": [
              "GAP-IMPLEMENT-SEMANTIC-COMMAND-MATERIALIZER"
            ],
            "priority_basis": {
              "blocking": "阻塞可靠 Case binding 与重启恢复。",
              "uncertainty": "低；覆盖路径已由 projector 与 Coordinator 调用链确认。",
              "risk": "高；证据丢失会产生重复 Case 或错误 recovery。",
              "user_impact": "高；任务看似失败且无法正确续跑。"
            },
            "responsibility": "agent",
            "evidence_required": [
              "连续成功/失败 round 的 append-only receipt projector 测试",
              "同 Case 多 receipt 和跨 Case 冲突的 Coordinator 测试",
              "detached startup reconciliation 回归"
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
            "area_ref": "technical_foundation",
            "observed_revision": 29,
            "set_decision": {
              "status": "settled",
              "statement": "Arckit 继续使用 repository-owned Markdown/JSON state 与 Node.js ESM ledger CLI；ArcOrbit 继续作为 Electron Desktop/Runtime host，并保留 policy-neutral Runtime Kernel、persistent one-thread-per-todo、Platform Coordinator、restricted Workshop adapters、utilityProcess Runtime、trusted in-process ledger entrypoints、project-only skill provisioning、Feedback SDK WebContents 和现代/旧版 realtime 协议边界。真实 Chat 的 accepted architecture 在 main process 增加独立 ChatCoordinator 和 kind=chat Store ownership，并从现有 Codex adapter 中抽取可复用 Conversation 层：app-server client、persistent thread start/resume、turn start/interrupt、通用事件 projector、token usage 和异步 approval provider。State-driven Runtime 只在该基础层之上保留 using-arckit、Agent Loop schema、fresh ledger snapshot、Gap Loop、Automation lease 和 closeout 语义，Chat 不复用这些语义。每个活动 Chat session 拥有与其固定项目根对应的 adapter owner；不同 Chat session 和 Automation owner 不共享活动 turn 或 lease。typed Chat IPC 只提供 snapshot/create/select/rename/delete/send/interrupt/approvalDecision；select 只持久化经 main process 验证的 Chat session 选择，不改变 draft、thread 或 session updated_at。Renderer 不能提供任意 cwd、thread id、Codex method、文件权限或 shell command。 Chat 与 Automation Renderer 共享单一 Conversation Surface 模块和 scroll-follow/event-binding 行为，消费者仅提供规范化消息、Composer policy 与回调；Automation 专属类型由左右面板消费。Run Activity 以结构化 gap_rounds 持久化 round selection/closeout/work summary，任务级执行总览跨 transcript Runs 聚合，不解析被截断的消息文本。 ArcOrbit Automation Agent 只输出绑定 fresh snapshot 的 Semantic Case Command；Agent 显式决定事实、Gap、影响、Project decision 与 invariant judgment 的业务语义，trusted Ledger Command Materializer 在 commit lock 内确定性分配身份与 revision、解析 local handle、展开反向关系、编译内部 Transition、完整校验 projected state 并原子提交，Runtime 不复制物化规则。",
              "reason": "动态业务语义与 canonical Ledger mechanics 必须分层，避免 Agent 承担存储 bookkeeping 或确定性脚本推断业务含义。",
              "evidence": [
                "arckit/tech/arcorbit/desktop-execution-solution.md",
                "runtime/arcorbit/desktop/renderer/renderer.js",
                "runtime/arcorbit/src/projection/run-event-projector.mjs"
              ],
              "confidence": "high",
              "resume_condition": "当 Semantic Case Command 的语义责任、Materializer 的确定性边界、canonical commit protocol 或 receipt ownership 变化时重审。"
            },
            "gap_refs": [],
            "reason": "Record the accepted Semantic Case Command and trusted Materializer architecture in the Project technical foundation.",
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ]
          }
        ],
        "software_invariant_changes": [],
        "project_gap_changes": [],
        "selection_context_change": null,
        "evidence": [
          "arckit/tech/arcorbit/desktop-execution-solution.md"
        ]
      },
      "invariant_assessment": {
        "project_revision": 200,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "This architecture contract does not establish or revise this invariant domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "This architecture contract does not establish or revise this invariant domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "This architecture contract does not establish or revise this invariant domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The semantic ownership and deterministic materialization boundary is explicit in the accepted technical solution.",
            "fact_refs": [
              "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The accepted command/materializer boundary still requires Runtime and Ledger implementation.",
            "fact_refs": [
              "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED"
            ],
            "evidence": [
              "runtime/arcorbit/schemas/agent-loop-result.schema.json"
            ],
            "gap_refs": [
              "GAP-IMPLEMENT-SEMANTIC-COMMAND-MATERIALIZER",
              "GAP-CLASSIFY-LEDGER-REJECTIONS",
              "GAP-PERSIST-ACCEPTED-LEDGER-RECEIPTS"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Repair misclassification and receipt loss remain material until executable regression evidence closes the implementation gaps.",
            "fact_refs": [
              "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED"
            ],
            "evidence": [
              "runtime/arcorbit/src/state-driven-runner.mjs",
              "runtime/arcorbit/src/projection/run-event-projector.mjs"
            ],
            "gap_refs": [
              "GAP-IMPLEMENT-SEMANTIC-COMMAND-MATERIALIZER",
              "GAP-CLASSIFY-LEDGER-REJECTIONS",
              "GAP-PERSIST-ACCEPTED-LEDGER-RECEIPTS"
            ]
          }
        ]
      },
      "evidence": [
        "arckit/tech/arcorbit/desktop-execution-solution.md",
        "runtime/arcorbit/schemas/agent-loop-result.schema.json",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "runtime/arcorbit/src/projection/run-event-projector.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-24T02:23:17.695Z"
    },
    {
      "round": 2,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "实现 Agent Semantic Case Command schema 与 trusted Ledger Command Materializer，并以兼容测试证明脚本只做确定性物化。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Fresh snapshot exposes the Materializer implementation as the only ready gap in this Case.",
        "snapshot_token": "0a99708e6d7f9b85da2e52d2e7b0541ec3688a369695d804b5632f8ed6136705",
        "selected_ref": "case-gap:CASE-20260824-001:GAP-IMPLEMENT-SEMANTIC-COMMAND-MATERIALIZER",
        "comparison_summary": "All Project gaps were deferred as separate-Case work; the current Case has one ready implementation gap.",
        "fresh_discovery_summary": "Implementation evidence revealed no new prerequisite; rejection and receipt obligations are already persisted and remain for later fresh rounds.",
        "considered": [
          {
            "ref": "project-gap:GAP-agent-scenario-evaluation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "high",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "该 Project Gap 需要独立 Case，不替代当前实现切片。"
          },
          {
            "ref": "project-gap:GAP-runtime-resilience-and-adapters",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "该 Project Gap 需要独立 Case，不替代当前实现切片。"
          },
          {
            "ref": "project-gap:GAP-security-real-project-validation",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "该 Project Gap 需要独立 Case，不替代当前实现切片。"
          },
          {
            "ref": "project-gap:GAP-cross-record-audit",
            "source": "persisted",
            "eligibility": "case_required",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "",
              "uncertainty": "",
              "risk": "high",
              "user_impact": ""
            },
            "reason": "该 Project Gap 需要独立 Case，不替代当前实现切片。"
          },
          {
            "ref": "case-gap:CASE-20260824-001:GAP-IMPLEMENT-SEMANTIC-COMMAND-MATERIALIZER",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "阻塞新的 Agent 输出边界。",
              "uncertainty": "中；需在保持 v8 canonical commit 的同时引入语义命令。",
              "risk": "高；错误实现会把语义推断下沉或保留存储耦合。",
              "user_impact": "高；直接决定自动执行稳定性。"
            },
            "reason": "该 Gap 是当前 Case 唯一 ready 候选，直接阻塞后续拒绝与 receipt 治理。"
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-IMPLEMENT-SEMANTIC-COMMAND-MATERIALIZER",
        "responsibility": "agent",
        "goal": "实现 Agent Semantic Case Command schema 与 trusted Ledger Command Materializer，并以兼容测试证明脚本只做确定性物化。",
        "reason": "已接受的职责契约尚未由 Runtime output 和 Ledger writeback 实现。",
        "derived_from": [
          "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED"
        ],
        "blocked_by": [],
        "priority_basis": {
          "blocking": "阻塞新的 Agent 输出边界。",
          "uncertainty": "中；需在保持 v8 canonical commit 的同时引入语义命令。",
          "risk": "高；错误实现会把语义推断下沉或保留存储耦合。",
          "user_impact": "高；直接决定自动执行稳定性。"
        },
        "evidence_required": [
          "Semantic Case Command schema 与 validator",
          "trusted materializer 的 handle/ref/revision/关系投影测试",
          "现有 Case transition 兼容与端到端 writeback 回归"
        ]
      },
      "planned_transition": {
        "goal": "实现 Agent Semantic Case Command schema 与 trusted Ledger Command Materializer，并以兼容测试证明脚本只做确定性物化。",
        "expected_state_change": "Storage-shaped Agent output becomes a semantic command that trusted Ledger deterministically materializes into internal v8."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-IMPLEMENT-SEMANTIC-COMMAND-MATERIALIZER",
          "status": "resolved",
          "outcome": "Agent v2 emits Semantic Case Command and trusted Ledger materializes typed refs/local handles into canonical v8 under the commit lock.",
          "reason": "Schema, Runtime forwarding, Ledger materialization, legacy v8 compatibility and end-to-end tests now establish the accepted responsibility boundary.",
          "evidence": [
            "runtime/arcorbit/schemas/agent-loop-result.schema.json",
            "entry/skills/arckit-development-ledger/scripts/semantic-case-command.mjs",
            "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
            "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
            "runtime/arcorbit/src/agent-orchestrator.mjs",
            "runtime/arcorbit/test/semantic-case-command.test.mjs",
            "entry/skills/using-arckit/references/semantic-command-handoff.md"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-SEMANTIC-COMMAND-MATERIALIZER-IMPLEMENTED",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit Agent Loop v2 outputs a snapshot-bound Semantic Case Command; the trusted Ledger writeback resolves explicit typed refs and local handles, assigns canonical ids and revisions, rehydrates the selected candidate, projects reverse Project Gap relations, compiles internal v8 and atomically applies it while legacy direct v8 remains compatible.",
            "basis": "Executable source and regression tests demonstrate deterministic mapping independent of business prose and successful end-to-end canonical writeback.",
            "evidence": [
              "runtime/arcorbit/schemas/agent-loop-result.schema.json",
              "entry/skills/arckit-development-ledger/scripts/semantic-case-command.mjs",
              "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "runtime/arcorbit/src/agent-orchestrator.mjs",
              "runtime/arcorbit/test/semantic-case-command.test.mjs",
              "entry/skills/using-arckit/references/semantic-command-handoff.md"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [
          {
            "id": "IMPACT-SEMANTIC-MATERIALIZER-REALIZATION",
            "fact_id": "FACT-SEMANTIC-COMMAND-MATERIALIZER-IMPLEMENTED",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "The semantic command and deterministic materializer slice is realized by Runtime, Ledger skill contract, source and regression tests.",
            "gap_ids": [],
            "evidence": [
              "runtime/arcorbit/schemas/agent-loop-result.schema.json",
              "entry/skills/arckit-development-ledger/scripts/semantic-case-command.mjs",
              "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "runtime/arcorbit/src/agent-orchestrator.mjs",
              "runtime/arcorbit/test/semantic-case-command.test.mjs",
              "entry/skills/using-arckit/references/semantic-command-handoff.md"
            ]
          }
        ],
        "impacts_updated": [
          {
            "id": "IMPACT-SEMANTIC-COMMAND-REALIZATION",
            "fact_id": "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Semantic materialization is implemented, while rejection responsibility and accepted receipt durability remain unresolved parts of the accepted contract.",
            "gap_ids": [
              "GAP-CLASSIFY-LEDGER-REJECTIONS",
              "GAP-PERSIST-ACCEPTED-LEDGER-RECEIPTS"
            ],
            "evidence": [
              "runtime/arcorbit/schemas/agent-loop-result.schema.json",
              "entry/skills/arckit-development-ledger/scripts/semantic-case-command.mjs",
              "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
              "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
              "runtime/arcorbit/src/agent-orchestrator.mjs",
              "runtime/arcorbit/test/semantic-case-command.test.mjs",
              "entry/skills/using-arckit/references/semantic-command-handoff.md"
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
        "project_revision": 201,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "This implementation slice does not establish or revise this invariant domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "This implementation slice does not establish or revise this invariant domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "This implementation slice does not establish or revise this invariant domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The skill contract, technical solution and source preserve an explicit Agent/Ledger responsibility boundary.",
            "fact_refs": [
              "FACT-SEMANTIC-COMMAND-MATERIALIZER-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "entry/skills/using-arckit/references/semantic-command-handoff.md",
              "entry/skills/arckit-development-ledger/scripts/semantic-case-command.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "The materializer is realized, but the accepted architecture also requires rejection classification and durable accepted receipts.",
            "fact_refs": [
              "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED",
              "FACT-SEMANTIC-COMMAND-MATERIALIZER-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/test/semantic-case-command.test.mjs"
            ],
            "gap_refs": [
              "GAP-CLASSIFY-LEDGER-REJECTIONS",
              "GAP-PERSIST-ACCEPTED-LEDGER-RECEIPTS"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "Materializer behavior is covered, while retry misclassification and receipt loss retain dedicated evidence obligations.",
            "fact_refs": [
              "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED"
            ],
            "evidence": [
              "runtime/arcorbit/test/semantic-case-command.test.mjs"
            ],
            "gap_refs": [
              "GAP-CLASSIFY-LEDGER-REJECTIONS",
              "GAP-PERSIST-ACCEPTED-LEDGER-RECEIPTS"
            ]
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/schemas/agent-loop-result.schema.json",
        "entry/skills/arckit-development-ledger/scripts/semantic-case-command.mjs",
        "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
        "entry/skills/arckit-development-ledger/scripts/case-transition.mjs",
        "runtime/arcorbit/src/agent-orchestrator.mjs",
        "runtime/arcorbit/test/semantic-case-command.test.mjs",
        "entry/skills/using-arckit/references/semantic-command-handoff.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-24T03:28:52.401Z"
    },
    {
      "round": 3,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "实现 claim、stale、protocol、materialization 与 infrastructure rejection 的责任分类，并只让 claim_invalid 消耗 Agent repair budget。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Rejection responsibility controls safe automation recovery and precedes receipt reconciliation.",
        "snapshot_token": "f04a3185c807d84d5790890219de4147f4e1cc3f96c9d9e2bb98c3b0b6c11da6",
        "selected_ref": "case-gap:CASE-20260824-001:GAP-CLASSIFY-LEDGER-REJECTIONS",
        "comparison_summary": "Compared every persisted candidate; selected the ready high-risk rejection-classification gap in this Case.",
        "fresh_discovery_summary": "No fresh gap supersedes the two accepted implementation gaps.",
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
            "reason": "This candidate remains available but is not the selected bounded transition."
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
            "reason": "This candidate remains available but is not the selected bounded transition."
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
            "reason": "This candidate remains available but is not the selected bounded transition."
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
            "reason": "This candidate remains available but is not the selected bounded transition."
          },
          {
            "ref": "case-gap:CASE-20260823-007:GAP-WORK-STATUS-SWITCH-PERFORMANCE-DIAGNOSIS",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "根因和责任边界未建立，阻塞可信实现。",
              "uncertainty": "高；当前只有用户可感知症状，没有调用链或测量证据。",
              "risk": "高；盲目缓存、去抖或局部跳过更新可能造成陈旧列表、双重状态源或行为回归。",
              "user_impact": "高；状态切换是 Work 页面高频核心操作。"
            },
            "reason": "This candidate remains available but is not the selected bounded transition."
          },
          {
            "ref": "case-gap:CASE-20260824-001:GAP-CLASSIFY-LEDGER-REJECTIONS",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "阻塞正确的自动恢复与修正策略。",
              "uncertainty": "低；分类边界已被技术契约明确。",
              "risk": "高；误分类会重复实现、错误停机或掩盖 Ledger 缺陷。",
              "user_impact": "高；决定异常是否可恢复。"
            },
            "reason": "This high-risk ready Case gap governs safe recovery before receipt reconciliation."
          },
          {
            "ref": "case-gap:CASE-20260824-001:GAP-PERSIST-ACCEPTED-LEDGER-RECEIPTS",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "阻塞可靠 Case binding 与重启恢复。",
              "uncertainty": "低；覆盖路径已由 projector 与 Coordinator 调用链确认。",
              "risk": "高；证据丢失会产生重复 Case 或错误 recovery。",
              "user_impact": "高；任务看似失败且无法正确续跑。"
            },
            "reason": "This candidate remains available but is not the selected bounded transition."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-CLASSIFY-LEDGER-REJECTIONS",
        "responsibility": "agent",
        "goal": "实现 claim、stale、protocol、materialization 与 infrastructure rejection 的责任分类，并只让 claim_invalid 消耗 Agent repair budget。",
        "reason": "统一 repair 会把 freshness 或确定性层故障误交给 Agent，并放大局部错误。",
        "derived_from": [
          "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED"
        ],
        "blocked_by": [
          "GAP-IMPLEMENT-SEMANTIC-COMMAND-MATERIALIZER"
        ],
        "priority_basis": {
          "blocking": "阻塞正确的自动恢复与修正策略。",
          "uncertainty": "低；分类边界已被技术契约明确。",
          "risk": "高；误分类会重复实现、错误停机或掩盖 Ledger 缺陷。",
          "user_impact": "高；决定异常是否可恢复。"
        },
        "evidence_required": [
          "各 rejection 类的可执行测试",
          "repair budget 只对 claim_invalid 递增的 runner 测试",
          "fresh replan 与 infrastructure recovery 回归"
        ]
      },
      "planned_transition": {
        "goal": "实现 claim、stale、protocol、materialization 与 infrastructure rejection 的责任分类，并只让 claim_invalid 消耗 Agent repair budget。",
        "expected_state_change": "Ledger and Runtime distinguish five rejection responsibilities, and only invalid Agent claims consume repair budget."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-CLASSIFY-LEDGER-REJECTIONS",
          "status": "resolved",
          "outcome": "Five rejection classes now route to claim repair, fresh replan, protocol reconciliation, materializer inspection, or Runtime recovery.",
          "reason": "Executable policy and runner tests demonstrate the accepted responsibility boundary.",
          "evidence": [
            "entry/skills/arckit-development-ledger/scripts/semantic-case-command.mjs",
            "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
            "runtime/arcorbit/src/ledger-writer.mjs",
            "runtime/arcorbit/src/state-driven-runner.mjs",
            "runtime/arcorbit/test/semantic-case-command.test.mjs",
            "runtime/arcorbit/test/state-driven-runner.test.mjs",
            "runtime/arcorbit/test/ledger-writer.test.mjs"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-LEDGER-REJECTION-CLASSIFICATION-IMPLEMENTED",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit and the trusted Ledger classify claim, stale, protocol, materialization and infrastructure failures by ownership; only claim_invalid enters Agent repair.",
            "basis": "The writeback policy, runner control flow and regression tests implement the accepted architecture.",
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
              "runtime/arcorbit/src/ledger-writer.mjs",
              "runtime/arcorbit/src/state-driven-runner.mjs",
              "runtime/arcorbit/test/semantic-case-command.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-SEMANTIC-COMMAND-REALIZATION",
            "fact_id": "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "threatened",
            "reason": "Semantic materialization and rejection responsibility are implemented; accepted receipt durability remains the only unresolved part of this contract.",
            "gap_ids": [
              "GAP-PERSIST-ACCEPTED-LEDGER-RECEIPTS"
            ],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
              "runtime/arcorbit/src/state-driven-runner.mjs",
              "runtime/arcorbit/test/semantic-case-command.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs"
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
        "project_revision": 201,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "This implementation slice does not establish or revise this invariant domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "This implementation slice does not establish or revise this invariant domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "This implementation slice does not establish or revise this invariant domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "Rejection responsibility is explicit in the accepted technical contract and executable policy.",
            "fact_refs": [
              "FACT-LEDGER-REJECTION-CLASSIFICATION-IMPLEMENTED"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
              "runtime/arcorbit/src/state-driven-runner.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "threatened",
            "reason": "Semantic materialization and rejection classification are realized; append-only accepted receipt recovery remains open.",
            "fact_refs": [
              "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED",
              "FACT-LEDGER-REJECTION-CLASSIFICATION-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/test/semantic-case-command.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs"
            ],
            "gap_refs": [
              "GAP-PERSIST-ACCEPTED-LEDGER-RECEIPTS"
            ]
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "threatened",
            "reason": "All rejection responsibilities and repair-budget behavior are covered, while receipt loss still retains a dedicated evidence obligation.",
            "fact_refs": [
              "FACT-LEDGER-REJECTION-CLASSIFICATION-IMPLEMENTED"
            ],
            "evidence": [
              "runtime/arcorbit/test/semantic-case-command.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/ledger-writer.test.mjs"
            ],
            "gap_refs": [
              "GAP-PERSIST-ACCEPTED-LEDGER-RECEIPTS"
            ]
          }
        ]
      },
      "evidence": [
        "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
        "runtime/arcorbit/src/state-driven-runner.mjs",
        "runtime/arcorbit/test/semantic-case-command.test.mjs",
        "runtime/arcorbit/test/state-driven-runner.test.mjs",
        "runtime/arcorbit/test/ledger-writer.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-24T03:34:03.439Z"
    },
    {
      "round": 4,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "把 accepted ledger receipts 作为 append-only Run 事实持久化，并由 Coordinator 从 receipts 建立不可被后续失败覆盖的 Case binding。",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "Append-only accepted receipts are the remaining realization gap and unblock trustworthy Case binding recovery.",
        "snapshot_token": "8a8a788af200c369fc8c6cb6548477a8904ac59e51c31f484d3553fc6cadc6ad",
        "selected_ref": "case-gap:CASE-20260824-001:GAP-PERSIST-ACCEPTED-LEDGER-RECEIPTS",
        "comparison_summary": "Compared every persisted candidate and selected the sole remaining ready gap in this architecture Case.",
        "fresh_discovery_summary": "No fresh issue supersedes the accepted receipt durability gap.",
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
            "reason": "This candidate belongs to separate project work and is deferred."
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
            "reason": "This candidate belongs to separate project work and is deferred."
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
            "reason": "This candidate belongs to separate project work and is deferred."
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
            "reason": "This candidate belongs to separate project work and is deferred."
          },
          {
            "ref": "case-gap:CASE-20260823-007:GAP-WORK-STATUS-SWITCH-PERFORMANCE-DIAGNOSIS",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "根因和责任边界未建立，阻塞可信实现。",
              "uncertainty": "高；当前只有用户可感知症状，没有调用链或测量证据。",
              "risk": "高；盲目缓存、去抖或局部跳过更新可能造成陈旧列表、双重状态源或行为回归。",
              "user_impact": "高；状态切换是 Work 页面高频核心操作。"
            },
            "reason": "This candidate belongs to separate project work and is deferred."
          },
          {
            "ref": "case-gap:CASE-20260824-001:GAP-PERSIST-ACCEPTED-LEDGER-RECEIPTS",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "阻塞可靠 Case binding 与重启恢复。",
              "uncertainty": "低；覆盖路径已由 projector 与 Coordinator 调用链确认。",
              "risk": "高；证据丢失会产生重复 Case 或错误 recovery。",
              "user_impact": "高；任务看似失败且无法正确续跑。"
            },
            "reason": "This is the remaining ready realization gap in the architecture Case."
          }
        ]
      },
      "selected_gap": {
        "id": "GAP-PERSIST-ACCEPTED-LEDGER-RECEIPTS",
        "responsibility": "agent",
        "goal": "把 accepted ledger receipts 作为 append-only Run 事实持久化，并由 Coordinator 从 receipts 建立不可被后续失败覆盖的 Case binding。",
        "reason": "latest-only ledger projection 会丢失先前成功的 Case 创建或 transition receipt，使真实 Case 已存在但任务仍未绑定。",
        "derived_from": [
          "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED"
        ],
        "blocked_by": [
          "GAP-IMPLEMENT-SEMANTIC-COMMAND-MATERIALIZER"
        ],
        "priority_basis": {
          "blocking": "阻塞可靠 Case binding 与重启恢复。",
          "uncertainty": "低；覆盖路径已由 projector 与 Coordinator 调用链确认。",
          "risk": "高；证据丢失会产生重复 Case 或错误 recovery。",
          "user_impact": "高；任务看似失败且无法正确续跑。"
        },
        "evidence_required": [
          "连续成功/失败 round 的 append-only receipt projector 测试",
          "同 Case 多 receipt 和跨 Case 冲突的 Coordinator 测试",
          "detached startup reconciliation 回归"
        ]
      },
      "planned_transition": {
        "goal": "把 accepted ledger receipts 作为 append-only Run 事实持久化，并由 Coordinator 从 receipts 建立不可被后续失败覆盖的 Case binding。",
        "expected_state_change": "Successful ledger results persist as idempotent append-only receipts and remain authoritative after later failures."
      },
      "accepted_state_delta": {
        "resolved_gap": {
          "id": "GAP-PERSIST-ACCEPTED-LEDGER-RECEIPTS",
          "status": "resolved",
          "outcome": "Run Activity appends accepted ledger receipts, and Coordinator aggregates them into stable or conflicting Case bindings across live and detached recovery.",
          "reason": "Projector, binding extraction, conflict handling and detached-start tests demonstrate the accepted behavior.",
          "evidence": [
            "runtime/arcorbit/src/projection/run-event-projector.mjs",
            "runtime/arcorbit/src/automation-coordinator.mjs",
            "runtime/arcorbit/test/token-usage-projector.test.mjs",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "npm test: 355 tests, 350 passed, 5 skipped, 0 failed"
          ]
        },
        "facts_added": [
          {
            "id": "FACT-ACCEPTED-LEDGER-RECEIPTS-PERSISTED",
            "revision": 1,
            "status": "accepted",
            "statement": "ArcOrbit persists every accepted ledger result as an idempotent append-only Run receipt and derives authoritative Case binding from the full accepted receipt set.",
            "basis": "The projector preserves prior success across later failures, while Coordinator binds same-Case receipts and rejects cross-Case conflicts.",
            "evidence": [
              "runtime/arcorbit/src/projection/run-event-projector.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/token-usage-projector.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs"
            ]
          }
        ],
        "facts_superseded": [],
        "impacts_added": [],
        "impacts_updated": [
          {
            "id": "IMPACT-SEMANTIC-COMMAND-REALIZATION",
            "fact_id": "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED",
            "fact_revision": 1,
            "target": {
              "kind": "software_invariant",
              "ref": "accepted-facts-are-realized",
              "revision": null
            },
            "effect": "upheld",
            "reason": "Semantic command materialization, rejection responsibility and accepted receipt durability are all implemented and verified.",
            "gap_ids": [],
            "evidence": [
              "entry/skills/arckit-development-ledger/scripts/runtime-writeback.mjs",
              "runtime/arcorbit/src/state-driven-runner.mjs",
              "runtime/arcorbit/test/semantic-case-command.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/src/projection/run-event-projector.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs",
              "runtime/arcorbit/test/token-usage-projector.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs"
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
        "project_revision": 201,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "This implementation slice does not establish or revise this invariant domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "This implementation slice does not establish or revise this invariant domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "This implementation slice does not establish or revise this invariant domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The Run projection and Coordinator consume trusted receipts without inferring Case identity from Agent prose or repository shape.",
            "fact_refs": [
              "FACT-ACCEPTED-LEDGER-RECEIPTS-PERSISTED"
            ],
            "evidence": [
              "runtime/arcorbit/src/projection/run-event-projector.mjs",
              "runtime/arcorbit/src/automation-coordinator.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "All accepted semantic-command architecture slices are implemented: materialization, rejection ownership and append-only receipt recovery.",
            "fact_refs": [
              "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED",
              "FACT-SEMANTIC-COMMAND-MATERIALIZER-IMPLEMENTED",
              "FACT-LEDGER-REJECTION-CLASSIFICATION-IMPLEMENTED",
              "FACT-ACCEPTED-LEDGER-RECEIPTS-PERSISTED"
            ],
            "evidence": [
              "runtime/arcorbit/test/semantic-case-command.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/token-usage-projector.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "The full Runtime suite and focused recovery regressions cover deterministic materialization, rejection routing, receipt preservation, conflict detection and detached recovery.",
            "fact_refs": [
              "FACT-ACCEPTED-LEDGER-RECEIPTS-PERSISTED"
            ],
            "evidence": [
              "runtime/arcorbit/test/semantic-case-command.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/token-usage-projector.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs",
              "npm test: 355 tests, 350 passed, 5 skipped, 0 failed"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/src/projection/run-event-projector.mjs",
        "runtime/arcorbit/src/automation-coordinator.mjs",
        "runtime/arcorbit/test/token-usage-projector.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "npm test: 355 tests, 350 passed, 5 skipped, 0 failed"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-24T03:36:36.555Z"
    },
    {
      "round": 5,
      "transition_schema_version": "arckit-case-transition/v8",
      "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
      "outcome": "completed",
      "gap_selection": {
        "mode": "candidate",
        "basis": "All ordinary Case gaps and impacts are closed; the current content revision requires the bounded Completion Review.",
        "snapshot_token": "c5aef9ce19190be0c990bfc4d9e8b5b5b0f366ec8ed17cfa31017158261a68ca",
        "selected_ref": "case-gap:CASE-20260824-001:CASE-20260824-001:completion-review:1",
        "comparison_summary": "Compared all persisted candidates; only this Case completion-review candidate can establish resolution of the architecture work.",
        "fresh_discovery_summary": "Review found one semantic review-shape mismatch and one unbounded stale-replan risk; both were corrected and reverified before this clean result.",
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
            "reason": "This candidate belongs to a separate active Case or future Project Case."
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
            "reason": "This candidate belongs to a separate active Case or future Project Case."
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
            "reason": "This candidate belongs to a separate active Case or future Project Case."
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
            "reason": "This candidate belongs to a separate active Case or future Project Case."
          },
          {
            "ref": "case-gap:CASE-20260823-007:GAP-WORK-STATUS-SWITCH-PERFORMANCE-DIAGNOSIS",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "deferred",
            "priority_basis": {
              "blocking": "根因和责任边界未建立，阻塞可信实现。",
              "uncertainty": "高；当前只有用户可感知症状，没有调用链或测量证据。",
              "risk": "高；盲目缓存、去抖或局部跳过更新可能造成陈旧列表、双重状态源或行为回归。",
              "user_impact": "高；状态切换是 Work 页面高频核心操作。"
            },
            "reason": "This candidate belongs to a separate active Case or future Project Case."
          },
          {
            "ref": "case-gap:CASE-20260824-001:CASE-20260824-001:completion-review:1",
            "source": "persisted",
            "eligibility": "ready",
            "disposition": "selected",
            "priority_basis": {
              "blocking": "high",
              "uncertainty": "low",
              "risk": "high",
              "user_impact": "high"
            },
            "reason": "All ordinary gaps are closed, so the implementation-focused Completion Review is mandatory."
          }
        ]
      },
      "selected_gap": {
        "id": "CASE-20260824-001:completion-review:1",
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
        "goal": "Review the completed implementation for correctness, real problem resolution, verification credibility, regression risk, and minimality.",
        "expected_state_change": "Record a clean five-dimension review for content revision 4 and resolve the Case if trusted invariants remain satisfied."
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
            "arckit/tech/arcorbit/desktop-execution-solution.md",
            "entry/skills/using-arckit/references/semantic-command-handoff.md",
            "runtime/arcorbit/test/semantic-case-command.test.mjs",
            "runtime/arcorbit/test/state-driven-runner.test.mjs",
            "runtime/arcorbit/test/token-usage-projector.test.mjs",
            "runtime/arcorbit/test/automation-coordinator.test.mjs",
            "npm test: 356 tests, 351 passed, 5 skipped, 0 failed",
            "skill quick validation: both maintained skills valid",
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
      "invariant_assessment": {
        "project_revision": 201,
        "judgments": [
          {
            "invariant_ref": "product-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The architecture governance changes do not alter this product, interaction, or visual invariant domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "interaction-expectations-remain-recoverable",
            "disposition": "not_relevant",
            "reason": "The architecture governance changes do not alter this product, interaction, or visual invariant domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "visual-language-remains-consistent",
            "disposition": "not_relevant",
            "reason": "The architecture governance changes do not alter this product, interaction, or visual invariant domain.",
            "fact_refs": [],
            "evidence": [],
            "gap_refs": []
          },
          {
            "invariant_ref": "technical-decisions-remain-explainable",
            "disposition": "upheld",
            "reason": "The durable technical contract, Agent-facing handoff and trusted implementation consistently preserve the semantic/deterministic boundary.",
            "fact_refs": [
              "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED",
              "FACT-SEMANTIC-COMMAND-MATERIALIZER-IMPLEMENTED",
              "FACT-LEDGER-REJECTION-CLASSIFICATION-IMPLEMENTED",
              "FACT-ACCEPTED-LEDGER-RECEIPTS-PERSISTED"
            ],
            "evidence": [
              "arckit/tech/arcorbit/desktop-execution-solution.md",
              "entry/skills/using-arckit/references/semantic-command-handoff.md"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "accepted-facts-are-realized",
            "disposition": "upheld",
            "reason": "Every accepted architecture claim is represented by source changes and executable regression evidence with no remaining Case gap.",
            "fact_refs": [
              "FACT-SEMANTIC-COMMAND-CONTRACT-ACCEPTED",
              "FACT-SEMANTIC-COMMAND-MATERIALIZER-IMPLEMENTED",
              "FACT-LEDGER-REJECTION-CLASSIFICATION-IMPLEMENTED",
              "FACT-ACCEPTED-LEDGER-RECEIPTS-PERSISTED"
            ],
            "evidence": [
              "runtime/arcorbit/test/semantic-case-command.test.mjs",
              "runtime/arcorbit/test/state-driven-runner.test.mjs",
              "runtime/arcorbit/test/token-usage-projector.test.mjs",
              "runtime/arcorbit/test/automation-coordinator.test.mjs"
            ],
            "gap_refs": []
          },
          {
            "invariant_ref": "material-risks-have-credible-evidence",
            "disposition": "upheld",
            "reason": "Focused tests cover prose independence, id and revision allocation, all rejection responsibilities, bounded stale replan, append-only receipt recovery and Case binding conflict; the full suite has zero failures.",
            "fact_refs": [
              "FACT-SEMANTIC-COMMAND-MATERIALIZER-IMPLEMENTED",
              "FACT-LEDGER-REJECTION-CLASSIFICATION-IMPLEMENTED",
              "FACT-ACCEPTED-LEDGER-RECEIPTS-PERSISTED"
            ],
            "evidence": [
              "npm test: 356 tests, 351 passed, 5 skipped, 0 failed",
              "skill quick validation: using-arckit valid",
              "skill quick validation: arckit-development-ledger valid",
              "git diff --check: clean"
            ],
            "gap_refs": []
          }
        ]
      },
      "evidence": [
        "runtime/arcorbit/test/semantic-case-command.test.mjs",
        "runtime/arcorbit/test/state-driven-runner.test.mjs",
        "runtime/arcorbit/test/token-usage-projector.test.mjs",
        "runtime/arcorbit/test/automation-coordinator.test.mjs",
        "npm test: 356 tests, 351 passed, 5 skipped, 0 failed",
        "git diff --check: clean"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-24T03:38:58.350Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "satisfied": [
      "GAP-SEMANTIC-COMMAND-BOUNDARY-CONTRACT",
      "GAP-IMPLEMENT-SEMANTIC-COMMAND-MATERIALIZER",
      "GAP-CLASSIFY-LEDGER-REJECTIONS",
      "GAP-PERSIST-ACCEPTED-LEDGER-RECEIPTS"
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
    "updated_at": "2026-08-24T03:38:58.350Z"
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
