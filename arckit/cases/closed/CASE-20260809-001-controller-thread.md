# 纠正 Controller thread 复用与双桥接边界

Case: CASE-20260809-001
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-09T05:47:23.397Z

## User Intent

纠正 CASE-20260808-001 中过度引入的每次 Controller invocation 新建 thread：恢复项目级 planning 与 Case 级 review 的稳定 ephemeral lane 复用，保持每轮 fresh canonical state 为事实与授权来源；收窄 using-arckit 对 Runtime bridge 与人类直接 Codex bridge 的输入边界，同时保留 bounded Controller digest、显式 Codex skill input、approval schema 修复和 Worker Case/type/workstream 复用，并完成回归验证。

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260809-001",
  "title": "纠正 Controller thread 复用与双桥接边界",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-09T05:35:45.718Z",
  "updated_at": "2026-08-09T05:47:23.397Z",
  "user_intent": "纠正 CASE-20260808-001 中过度引入的每次 Controller invocation 新建 thread：恢复项目级 planning 与 Case 级 review 的稳定 ephemeral lane 复用，保持每轮 fresh canonical state 为事实与授权来源；收窄 using-arckit 对 Runtime bridge 与人类直接 Codex bridge 的输入边界，同时保留 bounded Controller digest、显式 Codex skill input、approval schema 修复和 Worker Case/type/workstream 复用，并完成回归验证。",
  "expected_outcome": "",
  "project_state_ref": "arckit/project/state.record.json",
  "current_round": {
    "goal": "",
    "selected_gap": null
  },
  "facets": {
    "product_expectation": {
      "applicability": "required",
      "maturity": "formalized",
      "target_maturity": "formalized",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "产品规格已由实现和回归证据满足：每轮从 fresh canonical state 更新事实与授权，同一待办的 planning/review 稳定 lane 保留连续 thread；人工 Codex 可主动读取 canonical records 并在同一对话执行 Worker packet，Runtime 使用 bounded digest；单 gap 串行、无总墙钟/生产性 Round/长编译 watchdog 约束保持不变。",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/cases/closed/CASE-20260806-002-strengthen-runtime-context-handoff-and-workstream-thread-isolati.md",
        "https://learn.chatgpt.com/guides/best-practices.md",
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/using-arckit/references/controller-input-boundary.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "verification:npm-prefix-runtime-arckit-runtime-run-check:160-tests-159-pass-0-fail-1-conditional-skip"
      ],
      "next_transition": ""
    },
    "interaction_expectation": {
      "applicability": "not_required",
      "maturity": "unknown",
      "target_maturity": "unknown",
      "alignment": "unknown",
      "target_alignment": "unknown",
      "resolution": "resolved",
      "reason": "本次纠正只恢复 Runtime 内部 Controller thread lane 与 skill 输入语义，不新增用户动作、页面状态、导航或人工介入流程。",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs"
      ],
      "next_transition": ""
    },
    "visual_expectation": {
      "applicability": "not_required",
      "maturity": "unknown",
      "target_maturity": "unknown",
      "alignment": "unknown",
      "target_alignment": "unknown",
      "resolution": "resolved",
      "reason": "本次纠正不改变 Renderer、组件、Design Tokens、主题或任何视觉状态。",
      "evidence": [
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "arckit/visual/_library/design-tokens.yaml"
      ],
      "next_transition": ""
    },
    "technical_expectation": {
      "applicability": "required",
      "maturity": "formalized",
      "target_maturity": "formalized",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "技术方案与实现已对齐：Controller planning 与每个 Case review 使用独立稳定 ephemeral lane 并在 lane 内复用 turn；fresh digest、packet、reports 和 revision 保持事实与授权权威；显式 Codex skill input、approval schema、bounded digest 与 Worker workstream 复用均保留。",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "arckit/cases/closed/CASE-20260806-002-strengthen-runtime-context-handoff-and-workstream-thread-isolati.md",
        "https://learn.chatgpt.com/docs/app-server.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "runtime/arckit-runtime/test/worker-thread-key.test.mjs"
      ],
      "next_transition": ""
    },
    "implementation_state": {
      "applicability": "required",
      "maturity": "confirmed",
      "target_maturity": "confirmed",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "using-arckit 已明确 Human bridge 主动读取 canonical records、Runtime bridge 消费 bounded digest，同一 Agent 可在同一对话执行 Worker packet 后回到 review；Runtime 已移除 Controller reuseThread=false 与逐 turn unsubscribe，恢复 planning/review 稳定 lane，同时保留显式 skill input、bounded digest、approval schema 和 Worker workstream 复用。",
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/using-arckit/references/controller-input-boundary.md",
        "entry/skills/using-arckit/agents/openai.yaml",
        "entry/skills/using-arckit/arckit.capability.json",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/README.md",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "verification:focused-controller-thread-and-capability-tests:42-pass-0-fail"
      ],
      "next_transition": ""
    },
    "verification_state": {
      "applicability": "required",
      "maturity": "confirmed",
      "target_maturity": "confirmed",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "聚焦测试验证同一 Controller lane 连续 turn 复用、不同 planning/review lane 隔离、每个 turn 仍包含显式 skill input；完整 Runtime check 通过 160 tests（159 pass、0 fail、1 environment-gated skip），skill YAML/JSON/reference 与 diff 检查通过。",
      "evidence": [
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "runtime/arckit-runtime/test/capability-registry.test.mjs",
        "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
        "verification:focused-controller-thread-and-capability-tests:42-pass-0-fail",
        "verification:npm-prefix-runtime-arckit-runtime-run-check:160-tests-159-pass-0-fail-1-conditional-skip",
        "verification:using-arckit-yaml-json-references-ok",
        "verification:git-diff-check-clean"
      ],
      "next_transition": ""
    }
  },
  "content_revision": 8,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "runtime/arckit-runtime/config/case-policy.json and explicit user correction, 2026-08-09",
      "snapshotted_at": "2026-08-09T05:35:45.718Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 1,
    "reviewed_content_revision": 8,
    "dimensions": {
      "correctness": "clean",
      "completeness": "clean",
      "minimality": "clean"
    },
    "findings": [],
    "cycles": [
      {
        "cycle": 1,
        "autonomous_cycle": 1,
        "reviewer": "agent",
        "outcome": "clean",
        "content_revision": 8,
        "dimensions": {
          "correctness": "clean",
          "completeness": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "entry/skills/using-arckit/SKILL.md",
          "entry/skills/using-arckit/references/controller-input-boundary.md",
          "entry/skills/using-arckit/agents/openai.yaml",
          "entry/skills/using-arckit/arckit.capability.json",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/tech/arckit-runtime/solution.md",
          "runtime/arckit-runtime/src/agent-orchestrator.mjs",
          "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
          "runtime/arckit-runtime/README.md",
          "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
          "runtime/arckit-runtime/test/capability-registry.test.mjs",
          "verification:focused-controller-thread-and-capability-tests:42-pass-0-fail",
          "verification:npm-prefix-runtime-arckit-runtime-run-check:160-tests-159-pass-0-fail-1-conditional-skip",
          "verification:using-arckit-yaml-json-references-ok",
          "verification:git-diff-check-clean",
          "arckit/cases/closed/CASE-20260806-002-strengthen-runtime-context-handoff-and-workstream-thread-isolati.md",
          "https://learn.chatgpt.com/docs/app-server.md",
          "https://learn.chatgpt.com/guides/best-practices.md"
        ],
        "occurred_at": "2026-08-09T05:47:23.397Z"
      }
    ],
    "evidence": [
      "entry/skills/using-arckit/SKILL.md",
      "entry/skills/using-arckit/references/controller-input-boundary.md",
      "entry/skills/using-arckit/agents/openai.yaml",
      "entry/skills/using-arckit/arckit.capability.json",
      "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
      "arckit/tech/arckit-runtime/solution.md",
      "runtime/arckit-runtime/src/agent-orchestrator.mjs",
      "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
      "runtime/arckit-runtime/README.md",
      "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
      "runtime/arckit-runtime/test/capability-registry.test.mjs",
      "verification:focused-controller-thread-and-capability-tests:42-pass-0-fail",
      "verification:npm-prefix-runtime-arckit-runtime-run-check:160-tests-159-pass-0-fail-1-conditional-skip",
      "verification:using-arckit-yaml-json-references-ok",
      "verification:git-diff-check-clean",
      "arckit/cases/closed/CASE-20260806-002-strengthen-runtime-context-handoff-and-workstream-thread-isolati.md",
      "https://learn.chatgpt.com/docs/app-server.md",
      "https://learn.chatgpt.com/guides/best-practices.md"
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
      "goal": "正式化 fresh state、稳定 Controller lane 与人工/Runtime 双桥接的产品行为。",
      "outcome": "completed",
      "planned_transition": "product_expectation becomes formalized and remains diverged until implementation correction.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "product_expectation",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "diverged",
              "target_alignment": "aligned",
              "resolution": "unresolved",
              "reason": "稳定产品规格要求每轮从 fresh canonical state 更新事实与授权，但同一待办的 planning/review 稳定 lane 保留连续 thread；人工 Codex 主动读取 Project/Case facts 并可在同一对话执行 packet，Runtime 使用 bounded digest。当前实现仍对每次 Controller invocation 设置 reuseThread=false。"
            },
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/cases/closed/CASE-20260806-002-strengthen-runtime-context-handoff-and-workstream-thread-isolati.md",
              "https://learn.chatgpt.com/guides/best-practices.md"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/cases/closed/CASE-20260806-002-strengthen-runtime-context-handoff-and-workstream-thread-isolati.md",
        "https://learn.chatgpt.com/guides/best-practices.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-09T05:38:03.504Z"
    },
    {
      "round": 2,
      "goal": "恢复稳定 Controller planning/review lane 与 fresh-state authority 的技术方案。",
      "outcome": "completed",
      "planned_transition": "technical_expectation becomes formalized and remains diverged until code correction.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "technical_expectation",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "diverged",
              "target_alignment": "aligned",
              "resolution": "unresolved",
              "reason": "技术方案恢复项目级 planning 和 Case 级 review 的稳定 ephemeral thread lane：同一 lane 连续 turn 复用，fresh digest/packet/revision 覆盖历史事实与授权；显式 Codex skill input、bounded Controller digest、approval schema 和 Worker workstream 复用继续保留。当前代码仍设置 reuseThread=false 并在每次 Controller turn 后 unsubscribe。"
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "arckit/cases/closed/CASE-20260806-002-strengthen-runtime-context-handoff-and-workstream-thread-isolati.md",
              "https://learn.chatgpt.com/docs/app-server.md"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "arckit/cases/closed/CASE-20260806-002-strengthen-runtime-context-handoff-and-workstream-thread-isolati.md",
        "https://learn.chatgpt.com/docs/app-server.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-09T05:39:52.749Z"
    },
    {
      "round": 3,
      "goal": "判定 interaction_expectation 的适用性。",
      "outcome": "completed",
      "planned_transition": "interaction_expectation becomes evidence-backed not_required.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "interaction_expectation",
            "set": {
              "applicability": "not_required",
              "maturity": "unknown",
              "target_maturity": "unknown",
              "alignment": "unknown",
              "target_alignment": "unknown",
              "resolution": "resolved",
              "reason": "本次纠正只恢复 Runtime 内部 Controller thread lane 与 skill 输入语义，不新增用户动作、页面状态、导航或人工介入流程。"
            },
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-09T05:40:12.289Z"
    },
    {
      "round": 4,
      "goal": "判定 visual_expectation 的适用性。",
      "outcome": "completed",
      "planned_transition": "visual_expectation becomes evidence-backed not_required.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "visual_expectation",
            "set": {
              "applicability": "not_required",
              "maturity": "unknown",
              "target_maturity": "unknown",
              "alignment": "unknown",
              "target_alignment": "unknown",
              "resolution": "resolved",
              "reason": "本次纠正不改变 Renderer、组件、Design Tokens、主题或任何视觉状态。"
            },
            "evidence": [
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
              "arckit/visual/_library/design-tokens.yaml"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "arckit/visual/_library/design-tokens.yaml"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-09T05:40:12.583Z"
    },
    {
      "round": 5,
      "goal": "实现 Human/Runtime 双桥接契约与稳定 Controller lane 复用。",
      "outcome": "completed",
      "planned_transition": "implementation_state becomes confirmed, aligned, and resolved.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "implementation_state",
            "set": {
              "applicability": "required",
              "maturity": "confirmed",
              "target_maturity": "confirmed",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "using-arckit 已明确 Human bridge 主动读取 canonical records、Runtime bridge 消费 bounded digest，同一 Agent 可在同一对话执行 Worker packet 后回到 review；Runtime 已移除 Controller reuseThread=false 与逐 turn unsubscribe，恢复 planning/review 稳定 lane，同时保留显式 skill input、bounded digest、approval schema 和 Worker workstream 复用。"
            },
            "evidence": [
              "entry/skills/using-arckit/SKILL.md",
              "entry/skills/using-arckit/references/controller-input-boundary.md",
              "entry/skills/using-arckit/agents/openai.yaml",
              "entry/skills/using-arckit/arckit.capability.json",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
              "runtime/arckit-runtime/README.md",
              "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
              "verification:focused-controller-thread-and-capability-tests:42-pass-0-fail"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/using-arckit/references/controller-input-boundary.md",
        "entry/skills/using-arckit/agents/openai.yaml",
        "entry/skills/using-arckit/arckit.capability.json",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/README.md",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "verification:focused-controller-thread-and-capability-tests:42-pass-0-fail"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-09T05:43:52.234Z"
    },
    {
      "round": 6,
      "goal": "验证稳定 Controller lane、显式 skill input、双桥接边界与 Runtime 回归。",
      "outcome": "completed",
      "planned_transition": "verification_state becomes confirmed, aligned, and resolved.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "verification_state",
            "set": {
              "applicability": "required",
              "maturity": "confirmed",
              "target_maturity": "confirmed",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "聚焦测试验证同一 Controller lane 连续 turn 复用、不同 planning/review lane 隔离、每个 turn 仍包含显式 skill input；完整 Runtime check 通过 160 tests（159 pass、0 fail、1 environment-gated skip），skill YAML/JSON/reference 与 diff 检查通过。"
            },
            "evidence": [
              "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
              "runtime/arckit-runtime/test/capability-registry.test.mjs",
              "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
              "verification:focused-controller-thread-and-capability-tests:42-pass-0-fail",
              "verification:npm-prefix-runtime-arckit-runtime-run-check:160-tests-159-pass-0-fail-1-conditional-skip",
              "verification:using-arckit-yaml-json-references-ok",
              "verification:git-diff-check-clean"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "runtime/arckit-runtime/test/capability-registry.test.mjs",
        "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
        "verification:focused-controller-thread-and-capability-tests:42-pass-0-fail",
        "verification:npm-prefix-runtime-arckit-runtime-run-check:160-tests-159-pass-0-fail-1-conditional-skip",
        "verification:using-arckit-yaml-json-references-ok",
        "verification:git-diff-check-clean"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-09T05:44:46.255Z"
    },
    {
      "round": 7,
      "goal": "以实现与验证证据对齐 product_expectation。",
      "outcome": "completed",
      "planned_transition": "product_expectation becomes aligned and resolved.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "product_expectation",
            "set": {
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "产品规格已由实现和回归证据满足：每轮从 fresh canonical state 更新事实与授权，同一待办的 planning/review 稳定 lane 保留连续 thread；人工 Codex 可主动读取 canonical records 并在同一对话执行 Worker packet，Runtime 使用 bounded digest；单 gap 串行、无总墙钟/生产性 Round/长编译 watchdog 约束保持不变。"
            },
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "entry/skills/using-arckit/SKILL.md",
              "entry/skills/using-arckit/references/controller-input-boundary.md",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
              "verification:npm-prefix-runtime-arckit-runtime-run-check:160-tests-159-pass-0-fail-1-conditional-skip"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/using-arckit/references/controller-input-boundary.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "verification:npm-prefix-runtime-arckit-runtime-run-check:160-tests-159-pass-0-fail-1-conditional-skip"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-09T05:45:06.116Z"
    },
    {
      "round": 8,
      "goal": "以实现与验证证据对齐 technical_expectation。",
      "outcome": "completed",
      "planned_transition": "technical_expectation becomes aligned and resolved.",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "technical_expectation",
            "set": {
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "技术方案与实现已对齐：Controller planning 与每个 Case review 使用独立稳定 ephemeral lane 并在 lane 内复用 turn；fresh digest、packet、reports 和 revision 保持事实与授权权威；显式 Codex skill input、approval schema、bounded digest 与 Worker workstream 复用均保留。"
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
              "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
              "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
              "https://learn.chatgpt.com/docs/app-server.md"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
        "https://learn.chatgpt.com/docs/app-server.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-09T05:45:06.432Z"
    },
    {
      "round": 9,
      "goal": "Review the complete Case result for correctness, completeness, and minimality, then record a clean result or evidence-backed findings.",
      "outcome": "completed",
      "planned_transition": "Record a clean review of the corrected Controller thread and dual-bridge architecture.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": {
          "outcome": "clean",
          "reviewer": "agent",
          "reviewed_content_revision": 8,
          "dimensions": {
            "correctness": "clean",
            "completeness": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "entry/skills/using-arckit/SKILL.md",
            "entry/skills/using-arckit/references/controller-input-boundary.md",
            "entry/skills/using-arckit/agents/openai.yaml",
            "entry/skills/using-arckit/arckit.capability.json",
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/tech/arckit-runtime/solution.md",
            "runtime/arckit-runtime/src/agent-orchestrator.mjs",
            "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
            "runtime/arckit-runtime/README.md",
            "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
            "runtime/arckit-runtime/test/capability-registry.test.mjs",
            "verification:focused-controller-thread-and-capability-tests:42-pass-0-fail",
            "verification:npm-prefix-runtime-arckit-runtime-run-check:160-tests-159-pass-0-fail-1-conditional-skip",
            "verification:using-arckit-yaml-json-references-ok",
            "verification:git-diff-check-clean",
            "arckit/cases/closed/CASE-20260806-002-strengthen-runtime-context-handoff-and-workstream-thread-isolati.md",
            "https://learn.chatgpt.com/docs/app-server.md",
            "https://learn.chatgpt.com/guides/best-practices.md"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/using-arckit/references/controller-input-boundary.md",
        "entry/skills/using-arckit/agents/openai.yaml",
        "entry/skills/using-arckit/arckit.capability.json",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/tech/arckit-runtime/solution.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/README.md",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "runtime/arckit-runtime/test/capability-registry.test.mjs",
        "verification:focused-controller-thread-and-capability-tests:42-pass-0-fail",
        "verification:npm-prefix-runtime-arckit-runtime-run-check:160-tests-159-pass-0-fail-1-conditional-skip",
        "verification:using-arckit-yaml-json-references-ok",
        "verification:git-diff-check-clean",
        "arckit/cases/closed/CASE-20260806-002-strengthen-runtime-context-handoff-and-workstream-thread-isolati.md",
        "https://learn.chatgpt.com/docs/app-server.md",
        "https://learn.chatgpt.com/guides/best-practices.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-09T05:47:23.397Z"
    }
  ],
  "case_resolution": {
    "status": "resolved",
    "stage": "resolved",
    "base_ready": true,
    "satisfied": [
      "product_expectation",
      "interaction_expectation",
      "visual_expectation",
      "technical_expectation",
      "implementation_state",
      "verification_state",
      "completion_review"
    ],
    "remaining": [],
    "blocked": [],
    "reason": "All Case content is complete and the current content revision has a clean completion review.",
    "candidate_gaps": [],
    "loop_handoff": {
      "version": "loop-handoff/v2",
      "status": "done",
      "next_responsibility": "none",
      "agent_continuation_available": false,
      "human_decision_required": false,
      "trigger_mode": "none",
      "responsibility_reason": "The Case State has no unresolved content gap and the current content revision has a clean completion review.",
      "next_prompt": "",
      "agent_instruction": {
        "goal": "",
        "required_context_refs": [
          "arckit/project/state.record.json",
          "case:CASE-20260809-001"
        ],
        "required_actions": [],
        "required_checks": [
          "case_transition evidence",
          "derived case_resolution"
        ],
        "stop_condition": "Stop after applying one evidence-backed Case transition or producing a human/external handoff."
      },
      "human_gate": {
        "required": false,
        "reason": "",
        "decision_needed": ""
      },
      "progress_guard": {
        "expected_state_change": "",
        "actual_state_change": "",
        "no_progress_limit": 2,
        "max_auto_rounds": 3
      }
    },
    "updated_at": "2026-08-09T05:47:23.397Z"
  },
  "project_impact_candidate": {
    "status": "none",
    "changes": [],
    "evidence": []
  }
}
```

## Round Notes

- Case history is canonical in Structured Record.rounds; keep prose notes exceptional.
