# 支持 Runtime 切换到交互式 Codex CLI 并按 Case 恢复

Case: CASE-20260807-001
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-07T05:17:05.142Z

## User Intent

为 Arckit Runtime 增加显式切换到交互式 Codex CLI 的能力：安全停止当前自动执行，在目标项目终端启动用户可见、可持续参与的 Codex 对话，通过 using-arckit 从同一 Case State 接管；Runtime 重开或重新接管时以 fresh Case State 而非旧 Run 状态判断继续、人工等待或完成收尾，并保持 state-driven loop 仅在真正需要人工决策时暂停。

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260807-001",
  "title": "支持 Runtime 切换到交互式 Codex CLI 并按 Case 恢复",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-07T04:51:51.888Z",
  "updated_at": "2026-08-07T05:17:05.142Z",
  "user_intent": "为 Arckit Runtime 增加显式切换到交互式 Codex CLI 的能力：安全停止当前自动执行，在目标项目终端启动用户可见、可持续参与的 Codex 对话，通过 using-arckit 从同一 Case State 接管；Runtime 重开或重新接管时以 fresh Case State 而非旧 Run 状态判断继续、人工等待或完成收尾，并保持 state-driven loop 仅在真正需要人工决策时暂停。",
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
      "reason": "产品规格已明确执行入口切换、可交互 CLI、单一执行权与按 fresh Case State 恢复规则。",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/spec/INDEX.md"
      ],
      "next_transition": ""
    },
    "interaction_expectation": {
      "applicability": "required",
      "maturity": "formalized",
      "target_maturity": "formalized",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "交互规范与灰度线框已覆盖安全切换、CLI 接管、重新打开终端、恢复自动执行和按 Case 对账反馈。",
      "evidence": [
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/interaction/_map/feature-matrix.md",
        "arckit/interaction/INDEX.md"
      ],
      "next_transition": ""
    },
    "visual_expectation": {
      "applicability": "not_required",
      "maturity": "confirmed",
      "target_maturity": "confirmed",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "本次仅新增现有 Command Center 中的按钮、状态提示和标准卡片，复用既有灰度线框与视觉组件，不引入新的视觉语言、Token 或组件外观。",
      "evidence": [
        "arckit/interaction/automation-workspace/default.html",
        "arckit/interaction/automation-workspace/interaction.md"
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
      "reason": "技术方案已明确 Coordinator、Desktop Run Manager、平台终端启动器、受限 IPC、case_id 绑定和 fresh active/closed Case 对账职责。",
      "evidence": [
        "arckit/tech/arckit-runtime/desktop-execution-solution.md",
        "arckit/tech/arckit-runtime/solution.md",
        "arckit/tech/INDEX.md"
      ],
      "next_transition": ""
    },
    "implementation_state": {
      "applicability": "required",
      "maturity": "formalized",
      "target_maturity": "formalized",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "Coordinator、平台终端启动器、active/closed Case reader、Run activity Case 投影、受限 IPC 与 Renderer 控件已形成完整实现。",
      "evidence": [
        "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/desktop/main.mjs",
        "runtime/arckit-runtime/desktop/preload.cjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/README.md"
      ],
      "next_transition": ""
    },
    "verification_state": {
      "applicability": "required",
      "maturity": "formalized",
      "target_maturity": "formalized",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "完整 Runtime check 通过 149 项测试并仅跳过需显式 Electron 环境的既有布局测试；新增测试覆盖 launcher、Case 提取、安全 handoff、fresh active resume、fresh closed closeout、Case reader 与受限 IPC。",
      "evidence": [
        "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "command:npm run check (149 passed, 1 existing Electron layout test skipped)"
      ],
      "next_transition": ""
    }
  },
  "content_revision": 7,
  "completion_review": {
    "status": "clean",
    "policy": {
      "initial_max_cycles": 3,
      "source": "runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-08-07T04:51:51.888Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 2,
    "reviewed_content_revision": 7,
    "dimensions": {
      "correctness": "clean",
      "completeness": "clean",
      "minimality": "clean"
    },
    "findings": [
      {
        "id": "REVIEW-CLI-OWNERSHIP-RACE",
        "kind": "error",
        "statement": "定时 Case 对账在 Runtime 进程仍 active 时可能依据刚关闭的 Case 提前启动 commit，破坏单一执行权。",
        "responsibility": "agent",
        "affected_facets": [
          "implementation_state",
          "verification_state"
        ],
        "artifact_refs": [
          "runtime/arckit-runtime/src/automation-coordinator.mjs"
        ],
        "evidence": [
          "runtime/arckit-runtime/src/automation-coordinator.mjs:reconcileCanonicalCaseState"
        ],
        "status": "resolved",
        "resolution_reason": "Case 对账现会跳过 switching 状态与任何仍 active 的 Runtime run，只有 CLI handoff 或 detached 状态可从 canonical Case 进入收尾。",
        "resolution_evidence": [
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs: periodic Case reconciliation never starts commit while the Runtime process still owns execution"
        ],
        "discovered_in_cycle": 1
      },
      {
        "id": "REVIEW-CLI-LAUNCH-CONFIRMATION",
        "kind": "error",
        "statement": "macOS 启动器仅等待 osascript spawn，AppleScript 随后失败时仍会把活动任务标成 cli_handoff。",
        "responsibility": "agent",
        "affected_facets": [
          "implementation_state",
          "verification_state"
        ],
        "artifact_refs": [
          "runtime/arckit-runtime/src/interactive-cli-launcher.mjs"
        ],
        "evidence": [
          "runtime/arckit-runtime/src/interactive-cli-launcher.mjs:createInteractiveCodexCliLauncher"
        ],
        "status": "resolved",
        "resolution_reason": "macOS 启动器等待 osascript 成功退出；非零退出进入 cli_handoff_failed，不会写入 cli_handoff。",
        "resolution_evidence": [
          "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
          "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs: interactive launcher reports a rejected macOS terminal request"
        ],
        "discovered_in_cycle": 1
      }
    ],
    "cycles": [
      {
        "cycle": 1,
        "autonomous_cycle": 1,
        "reviewer": "agent",
        "outcome": "findings",
        "content_revision": 6,
        "dimensions": {
          "correctness": "findings",
          "completeness": "clean",
          "minimality": "clean"
        },
        "finding_ids": [
          "REVIEW-CLI-OWNERSHIP-RACE",
          "REVIEW-CLI-LAUNCH-CONFIRMATION"
        ],
        "evidence": [
          "git diff review",
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "runtime/arckit-runtime/src/interactive-cli-launcher.mjs"
        ],
        "occurred_at": "2026-08-07T05:14:45.024Z"
      },
      {
        "cycle": 2,
        "autonomous_cycle": 2,
        "reviewer": "agent",
        "outcome": "clean",
        "content_revision": 7,
        "dimensions": {
          "correctness": "clean",
          "completeness": "clean",
          "minimality": "clean"
        },
        "finding_ids": [],
        "evidence": [
          "command:npm run check (151 passed, 1 existing Electron layout test skipped)",
          "command:git diff --check",
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
          "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs",
          "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
          "arckit/interaction/automation-workspace/interaction.md",
          "arckit/tech/arckit-runtime/desktop-execution-solution.md"
        ],
        "occurred_at": "2026-08-07T05:17:05.142Z"
      }
    ],
    "evidence": [
      "git diff review",
      "runtime/arckit-runtime/src/automation-coordinator.mjs",
      "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
      "command:npm run check (151 passed, 1 existing Electron layout test skipped)",
      "command:git diff --check",
      "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
      "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs",
      "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
      "arckit/interaction/automation-workspace/interaction.md",
      "arckit/tech/arckit-runtime/desktop-execution-solution.md"
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
      "goal": "定义 Runtime 与交互式 Codex CLI 围绕 canonical Case State 的完整切换和恢复闭环。",
      "outcome": "completed",
      "planned_transition": "product_expectation 从 unknown 推进到 formalized、aligned、resolved。",
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
              "reason": "产品规格已明确执行入口切换、可交互 CLI、单一执行权与按 fresh Case State 恢复规则。"
            },
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "arckit/spec/INDEX.md"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "completion_review_result": null,
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "arckit/spec/INDEX.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T04:56:20.241Z"
    },
    {
      "round": 2,
      "goal": "定义 Runtime 到交互式 Codex CLI 以及返回 Runtime 的用户操作和页面状态。",
      "outcome": "completed",
      "planned_transition": "interaction_expectation 从 unknown 推进到 formalized、aligned、resolved。",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "interaction_expectation",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "交互规范与灰度线框已覆盖安全切换、CLI 接管、重新打开终端、恢复自动执行和按 Case 对账反馈。"
            },
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "arckit/interaction/_map/feature-matrix.md",
              "arckit/interaction/INDEX.md"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "completion_review_result": null,
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "arckit/interaction/_map/feature-matrix.md",
        "arckit/interaction/INDEX.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T04:59:34.248Z"
    },
    {
      "round": 3,
      "goal": "判断本次执行入口接力是否需要新增视觉体系。",
      "outcome": "completed",
      "planned_transition": "visual_expectation 以证据支持的 not_required 判断完成。",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "visual_expectation",
            "set": {
              "applicability": "not_required",
              "maturity": "confirmed",
              "target_maturity": "confirmed",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "本次仅新增现有 Command Center 中的按钮、状态提示和标准卡片，复用既有灰度线框与视觉组件，不引入新的视觉语言、Token 或组件外观。"
            },
            "evidence": [
              "arckit/interaction/automation-workspace/default.html",
              "arckit/interaction/automation-workspace/interaction.md"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "completion_review_result": null,
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/interaction/automation-workspace/default.html",
        "arckit/interaction/automation-workspace/interaction.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T04:59:48.273Z"
    },
    {
      "round": 4,
      "goal": "定义安全停止、平台终端启动、Case 绑定以及 Runtime 返回对账的技术边界。",
      "outcome": "completed",
      "planned_transition": "technical_expectation 从 unknown 推进到 formalized、aligned、resolved。",
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
              "reason": "技术方案已明确 Coordinator、Desktop Run Manager、平台终端启动器、受限 IPC、case_id 绑定和 fresh active/closed Case 对账职责。"
            },
            "evidence": [
              "arckit/tech/arckit-runtime/desktop-execution-solution.md",
              "arckit/tech/arckit-runtime/solution.md",
              "arckit/tech/INDEX.md"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "completion_review_result": null,
        "review_budget_extension": null
      },
      "evidence": [
        "arckit/tech/arckit-runtime/desktop-execution-solution.md",
        "arckit/tech/arckit-runtime/solution.md",
        "arckit/tech/INDEX.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T05:01:23.484Z"
    },
    {
      "round": 5,
      "goal": "实现 Desktop 中 Runtime 到交互式 Codex CLI 的安全执行权接力与按 Case 恢复闭环。",
      "outcome": "completed",
      "planned_transition": "implementation_state 从 unknown 推进到 formalized、aligned、resolved。",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "implementation_state",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "Coordinator、平台终端启动器、active/closed Case reader、Run activity Case 投影、受限 IPC 与 Renderer 控件已形成完整实现。"
            },
            "evidence": [
              "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/src/desktop-run-manager.mjs",
              "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
              "runtime/arckit-runtime/desktop/main.mjs",
              "runtime/arckit-runtime/desktop/preload.cjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js",
              "runtime/arckit-runtime/README.md"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "completion_review_result": null,
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/src/projection/run-event-projector.mjs",
        "runtime/arckit-runtime/desktop/main.mjs",
        "runtime/arckit-runtime/desktop/preload.cjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/README.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T05:11:23.140Z"
    },
    {
      "round": 6,
      "goal": "验证交互式 CLI 启动、执行权互斥、fresh Case 恢复以及 Desktop IPC/Renderer 闭环。",
      "outcome": "completed",
      "planned_transition": "verification_state 从 unknown 推进到 formalized、aligned、resolved。",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "verification_state",
            "set": {
              "applicability": "required",
              "maturity": "formalized",
              "target_maturity": "formalized",
              "alignment": "aligned",
              "target_alignment": "aligned",
              "resolution": "resolved",
              "reason": "完整 Runtime check 通过 149 项测试并仅跳过需显式 Electron 环境的既有布局测试；新增测试覆盖 launcher、Case 提取、安全 handoff、fresh active resume、fresh closed closeout、Case reader 与受限 IPC。"
            },
            "evidence": [
              "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
              "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
              "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
              "command:npm run check (149 passed, 1 existing Electron layout test skipped)"
            ]
          }
        ],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "completion_review_result": null,
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/desktop-run-manager.test.mjs",
        "runtime/arckit-runtime/test/desktop-renderer.test.mjs",
        "command:npm run check (149 passed, 1 existing Electron layout test skipped)"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T05:11:41.691Z"
    },
    {
      "round": 7,
      "goal": "审查 Runtime/CLI 接力实现的正确性、完整性和最小性。",
      "outcome": "partial",
      "planned_transition": "记录 content_revision=6 的证据化 review findings，驱动必要修复。",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [],
        "completion_review_result": {
          "outcome": "findings",
          "reviewer": "agent",
          "reviewed_content_revision": 6,
          "dimensions": {
            "correctness": "findings",
            "completeness": "clean",
            "minimality": "clean"
          },
          "findings": [
            {
              "id": "REVIEW-CLI-OWNERSHIP-RACE",
              "kind": "error",
              "statement": "定时 Case 对账在 Runtime 进程仍 active 时可能依据刚关闭的 Case 提前启动 commit，破坏单一执行权。",
              "responsibility": "agent",
              "affected_facets": [
                "implementation_state",
                "verification_state"
              ],
              "artifact_refs": [
                "runtime/arckit-runtime/src/automation-coordinator.mjs"
              ],
              "evidence": [
                "runtime/arckit-runtime/src/automation-coordinator.mjs:reconcileCanonicalCaseState"
              ]
            },
            {
              "id": "REVIEW-CLI-LAUNCH-CONFIRMATION",
              "kind": "error",
              "statement": "macOS 启动器仅等待 osascript spawn，AppleScript 随后失败时仍会把活动任务标成 cli_handoff。",
              "responsibility": "agent",
              "affected_facets": [
                "implementation_state",
                "verification_state"
              ],
              "artifact_refs": [
                "runtime/arckit-runtime/src/interactive-cli-launcher.mjs"
              ],
              "evidence": [
                "runtime/arckit-runtime/src/interactive-cli-launcher.mjs:createInteractiveCodexCliLauncher"
              ]
            }
          ],
          "evidence": [
            "git diff review",
            "runtime/arckit-runtime/src/automation-coordinator.mjs",
            "runtime/arckit-runtime/src/interactive-cli-launcher.mjs"
          ]
        },
        "review_budget_extension": null
      },
      "evidence": [
        "git diff review",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/interactive-cli-launcher.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T05:14:45.024Z"
    },
    {
      "round": 8,
      "goal": "关闭 completion review 发现的执行权竞态与终端启动误报。",
      "outcome": "completed",
      "planned_transition": "两个 review findings 均由实现和回归测试证据标记 resolved，并产生新的 content revision。",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "resolved_review_findings": [
          {
            "id": "REVIEW-CLI-OWNERSHIP-RACE",
            "resolution": "resolved",
            "reason": "Case 对账现会跳过 switching 状态与任何仍 active 的 Runtime run，只有 CLI handoff 或 detached 状态可从 canonical Case 进入收尾。",
            "evidence": [
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs: periodic Case reconciliation never starts commit while the Runtime process still owns execution"
            ]
          },
          {
            "id": "REVIEW-CLI-LAUNCH-CONFIRMATION",
            "resolution": "resolved",
            "reason": "macOS 启动器等待 osascript 成功退出；非零退出进入 cli_handoff_failed，不会写入 cli_handoff。",
            "evidence": [
              "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
              "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs: interactive launcher reports a rejected macOS terminal request"
            ]
          }
        ],
        "completion_review_result": null,
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs",
        "command:npm run check (151 passed, 1 existing Electron layout test skipped)"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T05:15:03.210Z"
    },
    {
      "round": 9,
      "goal": "复审修复后的完整交付并关闭 Case。",
      "outcome": "completed",
      "planned_transition": "当前 content revision 的 correctness、completeness、minimality 均 clean，Case 从 review_ready 转为 resolved。",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": {
          "outcome": "clean",
          "reviewer": "agent",
          "reviewed_content_revision": 7,
          "dimensions": {
            "correctness": "clean",
            "completeness": "clean",
            "minimality": "clean"
          },
          "findings": [],
          "evidence": [
            "command:npm run check (151 passed, 1 existing Electron layout test skipped)",
            "command:git diff --check",
            "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
            "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs",
            "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
            "arckit/interaction/automation-workspace/interaction.md",
            "arckit/tech/arckit-runtime/desktop-execution-solution.md"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "command:npm run check (151 passed, 1 existing Electron layout test skipped)",
        "command:git diff --check",
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/interactive-cli-launcher.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "runtime/arckit-runtime/test/interactive-cli-launcher.test.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T05:17:05.142Z"
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
          "case:CASE-20260807-001"
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
    "updated_at": "2026-08-07T05:17:05.142Z"
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
