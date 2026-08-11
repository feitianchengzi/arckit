# 优化 using-arckit 与 Codex Runtime 的 Controller 执行边界

Case: CASE-20260808-001
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-08T18:33:55.416Z

## User Intent

在保持每个 Loop 只处理一个 Case gap、串行推进、不设置总墙钟或生产性 Round 上限、允许长时间编译的前提下，结合 Codex app-server 的真实运行机制，减少 Controller 重复工具执行、隐藏线程历史依赖和证据重复消费；明确哪些约束属于 using-arckit skill，哪些事实装配与协议适配属于 Runtime/Codex adapter，并完成必要实现与验证。

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260808-001",
  "title": "优化 using-arckit 与 Codex Runtime 的 Controller 执行边界",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-08T18:12:56.621Z",
  "updated_at": "2026-08-08T18:33:55.416Z",
  "user_intent": "在保持每个 Loop 只处理一个 Case gap、串行推进、不设置总墙钟或生产性 Round 上限、允许长时间编译的前提下，结合 Codex app-server 的真实运行机制，减少 Controller 重复工具执行、隐藏线程历史依赖和证据重复消费；明确哪些约束属于 using-arckit skill，哪些事实装配与协议适配属于 Runtime/Codex adapter，并完成必要实现与验证。",
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
      "reason": "产品规格要求的单 gap 串行、无总墙钟/生产性 Round/长编译 watchdog、Controller 不重做 Worker 工作，以及证据不足时通过 Worker/unresolved/handoff 处理，已经由 using-arckit 契约、Runtime bounded digest、fresh Controller thread 和完整测试实现。",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/cases/active/CASE-20260808-001-using-arckit-codex-runtime-controller.md",
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/using-arckit/references/controller-input-boundary.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
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
      "reason": "本 Case 只改变 skill 语义契约、Runtime 输入装配和 Codex app-server 协议适配，不新增用户动作、界面状态、导航或人工介入流程。",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/tech/arckit-runtime/solution.md",
        "arckit/interaction/automation-workspace/interaction.md"
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
      "reason": "本 Case 不改变 Renderer、布局、主题、Design Tokens 或组件视觉状态，只调整后台 Agent invocation 与语义边界。",
      "evidence": [
        "arckit/visual/_library/design-tokens.yaml",
        "arckit/visual/_library/component-catalog.yaml",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs"
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
      "reason": "Runtime 与技术方案一致：Controller digest 从 fresh canonical records 确定性派生；每次 Controller invocation 使用 fresh ephemeral thread 和显式 skill input；Worker thread 仍按 Case/type/workstream 复用；现代、legacy 与 permission approval 响应分别符合本机 Codex app-server 生成 schema。",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "https://learn.chatgpt.com/docs/app-server.md",
        "runtime/arckit-runtime/src/capability-registry.mjs",
        "runtime/arckit-runtime/test/capability-registry.test.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs"
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
      "reason": "using-arckit 已增加 bounded input 与默认无 Worker 工具边界；Runtime 已确定性派生 Controller context digest、为每次 Controller invocation 禁用 thread 复用并显式传入已验证 skill；Codex adapter 已按新旧协议分别处理 approval，并保持 Worker workstream thread 复用。",
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/using-arckit/references/controller-input-boundary.md",
        "entry/skills/using-arckit/agents/openai.yaml",
        "entry/skills/using-arckit/arckit.capability.json",
        "runtime/arckit-runtime/src/capability-registry.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/README.md"
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
      "reason": "聚焦测试验证 Controller digest、fresh ephemeral Controller thread、显式 skill input、现代 command accept/decline 和 permission profile 响应；完整 Runtime check 通过 160 tests（159 pass、0 fail、1 environment-gated skip），skill YAML/JSON/reference 结构检查通过。",
      "evidence": [
        "runtime/arckit-runtime/test/capability-registry.test.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "runtime/arckit-runtime/test/context-boundary.test.mjs",
        "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
        "verification:npm-prefix-runtime-arckit-runtime-run-check:160-tests-159-pass-0-fail-1-conditional-skip",
        "verification:using-arckit-yaml-json-references-ok"
      ],
      "next_transition": ""
    }
  },
  "content_revision": 8,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "runtime/arckit-runtime/config/case-policy.json and explicit user constraints, 2026-08-09",
      "snapshotted_at": "2026-08-08T18:12:56.621Z"
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
          "entry/skills/using-arckit/arckit.capability.json",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/tech/arckit-runtime/solution.md",
          "runtime/arckit-runtime/src/agent-orchestrator.mjs",
          "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
          "runtime/arckit-runtime/test/capability-registry.test.mjs",
          "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
          "verification:npm-prefix-runtime-arckit-runtime-run-check:160-tests-159-pass-0-fail-1-conditional-skip",
          "verification:using-arckit-yaml-json-references-ok",
          "verification:git-diff-check-clean",
          "https://learn.chatgpt.com/docs/app-server.md"
        ],
        "occurred_at": "2026-08-08T18:33:55.416Z"
      }
    ],
    "evidence": [
      "entry/skills/using-arckit/SKILL.md",
      "entry/skills/using-arckit/references/controller-input-boundary.md",
      "entry/skills/using-arckit/arckit.capability.json",
      "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
      "arckit/tech/arckit-runtime/solution.md",
      "runtime/arckit-runtime/src/agent-orchestrator.mjs",
      "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
      "runtime/arckit-runtime/test/capability-registry.test.mjs",
      "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
      "verification:npm-prefix-runtime-arckit-runtime-run-check:160-tests-159-pass-0-fail-1-conditional-skip",
      "verification:using-arckit-yaml-json-references-ok",
      "verification:git-diff-check-clean",
      "https://learn.chatgpt.com/docs/app-server.md"
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
      "goal": "正式化 Controller 执行效率与单 gap 串行约束。",
      "outcome": "completed",
      "planned_transition": "product_expectation 形成稳定规格；在 skill 与 Runtime 尚未实现前保持 alignment=diverged。",
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
              "reason": "稳定产品规格要求 Controller 每次只完成 planning 或 review，优先消费 Runtime 直接提供的 bounded canonical facts 与 reports，不重复 Worker 的检索、实现、构建或测试；每个 Loop 保持单 gap 串行，不增加总墙钟、生产性 Round 或长编译 watchdog。当前 skill 与 Runtime/Codex adapter 尚未完整实现该边界。"
            },
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/cases/active/CASE-20260808-001-using-arckit-codex-runtime-controller.md"
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
        "arckit/spec/INDEX.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-08T18:18:59.501Z"
    },
    {
      "round": 2,
      "goal": "正式化 skill、Runtime 与 Codex app-server adapter 的技术职责边界。",
      "outcome": "completed",
      "planned_transition": "technical_expectation 形成已采用方案；在代码与 skill 尚未同步前保持 alignment=diverged。",
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
              "reason": "技术方案规定 using-arckit 负责 Controller 的默认无工具语义和证据处理，Runtime 确定性派生 bounded Controller context digest，Codex adapter 为每次 Controller invocation 新建 ephemeral thread、显式传入 skill item 并遵循当前 approval schema；Worker thread 连续性保持不变。当前实现仍复用 Controller thread、仅发送文本 trigger，且 approval 返回值与生成的 app-server schema 不一致。"
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
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
        "arckit/tech/INDEX.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-08T18:20:34.483Z"
    },
    {
      "round": 3,
      "goal": "判定 Controller 执行边界优化是否需要交互规格变更。",
      "outcome": "completed",
      "planned_transition": "interaction_expectation 以 evidence-backed not_required 收束。",
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
              "reason": "本 Case 只改变 skill 语义契约、Runtime 输入装配和 Codex app-server 协议适配，不新增用户动作、界面状态、导航或人工介入流程。"
            },
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/tech/arckit-runtime/solution.md",
              "arckit/interaction/automation-workspace/interaction.md"
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
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-08T18:20:52.641Z"
    },
    {
      "round": 4,
      "goal": "判定 Controller 执行边界优化是否需要视觉规格变更。",
      "outcome": "completed",
      "planned_transition": "visual_expectation 以 evidence-backed not_required 收束。",
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
              "reason": "本 Case 不改变 Renderer、布局、主题、Design Tokens 或组件视觉状态，只调整后台 Agent invocation 与语义边界。"
            },
            "evidence": [
              "arckit/visual/_library/design-tokens.yaml",
              "arckit/visual/_library/component-catalog.yaml",
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
        "arckit/visual/_library/design-tokens.yaml",
        "arckit/visual/_library/component-catalog.yaml"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-08T18:21:07.980Z"
    },
    {
      "round": 5,
      "goal": "实现 using-arckit、Runtime 与 Codex adapter 的 Controller 执行边界。",
      "outcome": "completed",
      "planned_transition": "implementation_state 形成与产品及技术方案一致的已实现状态。",
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
              "reason": "using-arckit 已增加 bounded input 与默认无 Worker 工具边界；Runtime 已确定性派生 Controller context digest、为每次 Controller invocation 禁用 thread 复用并显式传入已验证 skill；Codex adapter 已按新旧协议分别处理 approval，并保持 Worker workstream thread 复用。"
            },
            "evidence": [
              "entry/skills/using-arckit/SKILL.md",
              "entry/skills/using-arckit/references/controller-input-boundary.md",
              "entry/skills/using-arckit/agents/openai.yaml",
              "entry/skills/using-arckit/arckit.capability.json",
              "runtime/arckit-runtime/src/capability-registry.mjs",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
              "runtime/arckit-runtime/README.md"
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
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-08T18:28:25.028Z"
    },
    {
      "round": 6,
      "goal": "验证 bounded Controller input、fresh thread、显式 skill input 与 Codex approval 协议。",
      "outcome": "completed",
      "planned_transition": "verification_state 以聚焦和完整 Runtime suite 证据收束。",
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
              "reason": "聚焦测试验证 Controller digest、fresh ephemeral Controller thread、显式 skill input、现代 command accept/decline 和 permission profile 响应；完整 Runtime check 通过 160 tests（159 pass、0 fail、1 environment-gated skip），skill YAML/JSON/reference 结构检查通过。"
            },
            "evidence": [
              "runtime/arckit-runtime/test/capability-registry.test.mjs",
              "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
              "runtime/arckit-runtime/test/context-boundary.test.mjs",
              "runtime/arckit-runtime/test/worker-thread-key.test.mjs",
              "verification:npm-prefix-runtime-arckit-runtime-run-check:160-tests-159-pass-0-fail-1-conditional-skip",
              "verification:using-arckit-yaml-json-references-ok"
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
        "runtime/arckit-runtime/test/capability-registry.test.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "verification:npm-prefix-runtime-arckit-runtime-run-check:160-tests-159-pass-0-fail-1-conditional-skip",
        "verification:using-arckit-yaml-json-references-ok"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-08T18:29:03.780Z"
    },
    {
      "round": 7,
      "goal": "用实现与验证证据对齐 Controller 执行效率产品预期。",
      "outcome": "completed",
      "planned_transition": "product_expectation 从 diverged 收敛为 aligned/resolved。",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "product_expectation",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "产品规格要求的单 gap 串行、无总墙钟/生产性 Round/长编译 watchdog、Controller 不重做 Worker 工作，以及证据不足时通过 Worker/unresolved/handoff 处理，已经由 using-arckit 契约、Runtime bounded digest、fresh Controller thread 和完整测试实现。"
            },
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "entry/skills/using-arckit/SKILL.md",
              "entry/skills/using-arckit/references/controller-input-boundary.md",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
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
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "verification:npm-prefix-runtime-arckit-runtime-run-check:160-tests-159-pass-0-fail-1-conditional-skip"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-08T18:29:20.986Z"
    },
    {
      "round": 8,
      "goal": "用实现与 Codex 协议验证证据对齐技术方案。",
      "outcome": "completed",
      "planned_transition": "technical_expectation 从 diverged 收敛为 aligned/resolved。",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "technical_expectation",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "Runtime 与技术方案一致：Controller digest 从 fresh canonical records 确定性派生；每次 Controller invocation 使用 fresh ephemeral thread 和显式 skill input；Worker thread 仍按 Case/type/workstream 复用；现代、legacy 与 permission approval 响应分别符合本机 Codex app-server 生成 schema。"
            },
            "evidence": [
              "arckit/tech/arckit-runtime/solution.md",
              "runtime/arckit-runtime/src/capability-registry.mjs",
              "runtime/arckit-runtime/src/agent-orchestrator.mjs",
              "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
              "runtime/arckit-runtime/test/capability-registry.test.mjs",
              "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
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
        "runtime/arckit-runtime/src/capability-registry.mjs",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "verification:npm-prefix-runtime-arckit-runtime-run-check:160-tests-159-pass-0-fail-1-conditional-skip"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-08T18:29:42.194Z"
    },
    {
      "round": 9,
      "goal": "复核 Controller 边界优化的正确性、完整性和最小性并关闭 Case。",
      "outcome": "completed",
      "planned_transition": "Record a clean completion review for content_revision=8.",
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
            "entry/skills/using-arckit/arckit.capability.json",
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/tech/arckit-runtime/solution.md",
            "runtime/arckit-runtime/src/agent-orchestrator.mjs",
            "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
            "runtime/arckit-runtime/test/capability-registry.test.mjs",
            "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
            "verification:npm-prefix-runtime-arckit-runtime-run-check:160-tests-159-pass-0-fail-1-conditional-skip",
            "verification:using-arckit-yaml-json-references-ok",
            "verification:git-diff-check-clean",
            "https://learn.chatgpt.com/docs/app-server.md"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/using-arckit/references/controller-input-boundary.md",
        "entry/skills/using-arckit/arckit.capability.json",
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/tech/arckit-runtime/solution.md",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/test/capability-registry.test.mjs",
        "runtime/arckit-runtime/test/codex-app-server-adapter.test.mjs",
        "verification:npm-prefix-runtime-arckit-runtime-run-check:160-tests-159-pass-0-fail-1-conditional-skip",
        "verification:using-arckit-yaml-json-references-ok",
        "verification:git-diff-check-clean",
        "https://learn.chatgpt.com/docs/app-server.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-08T18:33:55.416Z"
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
          "case:CASE-20260808-001"
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
    "updated_at": "2026-08-08T18:33:55.416Z"
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
