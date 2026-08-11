# 修复未登录重启时 Runtime 未按 canonical Case 收尾

Case: CASE-20260807-004
Status: closed
Artifact Type: mixed
Selected Gap: none
Updated: 2026-08-07T06:34:28.989Z

## User Intent

根治 Runtime 重启恢复对远端认证的错误依赖：无论任务源是否已登录，都先恢复并对账本地 canonical Case，持久区分 Case 已完成、提交已完成与远端待办待写回，避免旧 Run/缓存把已关闭 Case 显示为仍在执行，也避免重复提交。

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260807-004",
  "title": "修复未登录重启时 Runtime 未按 canonical Case 收尾",
  "status": "closed",
  "artifact_type": "mixed",
  "created_at": "2026-08-07T06:16:44.086Z",
  "updated_at": "2026-08-07T06:34:28.989Z",
  "user_intent": "根治 Runtime 重启恢复对远端认证的错误依赖：无论任务源是否已登录，都先恢复并对账本地 canonical Case，持久区分 Case 已完成、提交已完成与远端待办待写回，避免旧 Run/缓存把已关闭 Case 显示为仍在执行，也避免重复提交。",
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
      "reason": "产品行为明确要求本地 canonical Case 对账独立于远端认证，并把 Case、commit、远端写回作为三个单调检查点。",
      "evidence": [
        "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
        "现场状态：JuSong CASE-20260806-001 closed/resolved 且 Runtime task source unauthenticated"
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
      "reason": "Command Center 明确展示 Case 已完成、commit 已完成与等待远端收尾，责任方不再误标为 Runtime。",
      "evidence": [
        "arckit/interaction/automation-workspace/interaction.md",
        "arckit/interaction/automation-workspace/default.html",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
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
      "reason": "本次只在既有 Command Center 阶段条和恢复线框中替换状态语义，不引入新的视觉风格、Token、组件外观或审美判断。",
      "evidence": [
        "arckit/interaction/automation-workspace/default.html",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
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
      "reason": "Store v8 持久化三段检查点，启动同步先本地对账后远端认证，历史 commit Run 可确定性恢复 checkpoint。",
      "evidence": [
        "arckit/tech/arckit-runtime/desktop-execution-solution.md",
        "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs"
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
      "reason": "Coordinator、Store normalization 和 Renderer 已实现本地优先恢复、单调收尾检查点、远端待写回状态与 legacy 恢复。",
      "evidence": [
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
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
      "reason": "现场等价回归覆盖认证失效前的 closed Case 对账、已完成 commit 跨重启不重复，以及认证恢复后只完成远端写回；全量检查通过。",
      "evidence": [
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs: startup reconciles a closed canonical Case before expired task-source authentication",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs: startup preserves a completed commit checkpoint and waits for authentication without recommitting",
        "command:npm run check (153 passed, 1 existing Electron layout test skipped)"
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
      "snapshotted_at": "2026-08-07T06:16:44.086Z"
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
        "id": "REVIEW-COMMIT-PRESENCE-GUARD",
        "kind": "error",
        "statement": "reconcileRuntimePresence 的提前返回列表包含 committing，使其后用于 commit_process_missing 的专用恢复分支不可达；commit Run 记录缺失时会继续停在 committing。",
        "responsibility": "agent",
        "affected_facets": [
          "implementation_state",
          "verification_state"
        ],
        "artifact_refs": [
          "runtime/arckit-runtime/src/automation-coordinator.mjs"
        ],
        "evidence": [
          "runtime/arckit-runtime/src/automation-coordinator.mjs:reconcileRuntimePresence"
        ],
        "status": "resolved",
        "resolution_reason": "committing 不再被 presence guard 提前返回；不存在活动或持久 Run 时进入 commit_process_missing recovery。",
        "resolution_evidence": [
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs: startup reports a missing commit process instead of leaving the task stuck in committing",
          "command:node --test test/automation-coordinator.test.mjs (27 passed)"
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
          "REVIEW-COMMIT-PRESENCE-GUARD"
        ],
        "evidence": [
          "git diff review",
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "command:npm run check (153 passed, 1 existing Electron layout test skipped)"
        ],
        "occurred_at": "2026-08-07T06:30:06.978Z"
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
          "command:npm run check (154 passed, 1 existing Electron layout test skipped)",
          "command:git diff --check",
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs: startup reconciles a closed canonical Case before expired task-source authentication",
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs: startup preserves a completed commit checkpoint and waits for authentication without recommitting",
          "runtime/arckit-runtime/test/automation-coordinator.test.mjs: startup reports a missing commit process instead of leaving the task stuck in committing",
          "runtime/arckit-runtime/src/automation-coordinator.mjs",
          "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
          "runtime/arckit-runtime/desktop/renderer/renderer.js"
        ],
        "occurred_at": "2026-08-07T06:34:28.989Z"
      }
    ],
    "evidence": [
      "git diff review",
      "runtime/arckit-runtime/src/automation-coordinator.mjs",
      "command:npm run check (153 passed, 1 existing Electron layout test skipped)",
      "command:npm run check (154 passed, 1 existing Electron layout test skipped)",
      "command:git diff --check",
      "runtime/arckit-runtime/test/automation-coordinator.test.mjs: startup reconciles a closed canonical Case before expired task-source authentication",
      "runtime/arckit-runtime/test/automation-coordinator.test.mjs: startup preserves a completed commit checkpoint and waits for authentication without recommitting",
      "runtime/arckit-runtime/test/automation-coordinator.test.mjs: startup reports a missing commit process instead of leaving the task stuck in committing",
      "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
      "runtime/arckit-runtime/desktop/renderer/renderer.js"
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
      "goal": "完成 product_expectation 的事实闭环",
      "outcome": "completed",
      "planned_transition": "product_expectation 从 unknown/unresolved 变为有证据的 resolved",
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
              "reason": "产品行为明确要求本地 canonical Case 对账独立于远端认证，并把 Case、commit、远端写回作为三个单调检查点。"
            },
            "evidence": [
              "arckit/spec/agentic-software-development/runtime-automation-workspace.md",
              "现场状态：JuSong CASE-20260806-001 closed/resolved 且 Runtime task source unauthenticated"
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
        "现场状态：JuSong CASE-20260806-001 closed/resolved 且 Runtime task source unauthenticated"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T06:28:44.152Z"
    },
    {
      "round": 2,
      "goal": "完成 interaction_expectation 的事实闭环",
      "outcome": "completed",
      "planned_transition": "interaction_expectation 从 unknown/unresolved 变为有证据的 resolved",
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
              "reason": "Command Center 明确展示 Case 已完成、commit 已完成与等待远端收尾，责任方不再误标为 Runtime。"
            },
            "evidence": [
              "arckit/interaction/automation-workspace/interaction.md",
              "arckit/interaction/automation-workspace/default.html",
              "runtime/arckit-runtime/desktop/renderer/renderer.js"
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
        "arckit/interaction/automation-workspace/default.html",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T06:28:44.448Z"
    },
    {
      "round": 3,
      "goal": "完成 visual_expectation 的事实闭环",
      "outcome": "completed",
      "planned_transition": "visual_expectation 从 unknown/unresolved 变为有证据的 resolved",
      "accepted_state_delta": {
        "facets": [
          {
            "facet": "visual_expectation",
            "set": {
              "applicability": "not_required",
              "resolution": "resolved",
              "reason": "本次只在既有 Command Center 阶段条和恢复线框中替换状态语义，不引入新的视觉风格、Token、组件外观或审美判断。"
            },
            "evidence": [
              "arckit/interaction/automation-workspace/default.html",
              "runtime/arckit-runtime/desktop/renderer/renderer.js"
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
        "arckit/interaction/automation-workspace/default.html",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T06:28:44.744Z"
    },
    {
      "round": 4,
      "goal": "完成 technical_expectation 的事实闭环",
      "outcome": "completed",
      "planned_transition": "technical_expectation 从 unknown/unresolved 变为有证据的 resolved",
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
              "reason": "Store v8 持久化三段检查点，启动同步先本地对账后远端认证，历史 commit Run 可确定性恢复 checkpoint。"
            },
            "evidence": [
              "arckit/tech/arckit-runtime/desktop-execution-solution.md",
              "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
              "runtime/arckit-runtime/src/automation-coordinator.mjs"
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
        "arckit/tech/arckit-runtime/desktop-execution-solution.md",
        "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
        "runtime/arckit-runtime/src/automation-coordinator.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T06:28:45.039Z"
    },
    {
      "round": 5,
      "goal": "完成 implementation_state 的事实闭环",
      "outcome": "completed",
      "planned_transition": "implementation_state 从 unknown/unresolved 变为有证据的 resolved",
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
              "reason": "Coordinator、Store normalization 和 Renderer 已实现本地优先恢复、单调收尾检查点、远端待写回状态与 legacy 恢复。"
            },
            "evidence": [
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
              "runtime/arckit-runtime/desktop/renderer/renderer.js"
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
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T06:28:45.336Z"
    },
    {
      "round": 6,
      "goal": "完成 verification_state 的事实闭环",
      "outcome": "completed",
      "planned_transition": "verification_state 从 unknown/unresolved 变为有证据的 resolved",
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
              "reason": "现场等价回归覆盖认证失效前的 closed Case 对账、已完成 commit 跨重启不重复，以及认证恢复后只完成远端写回；全量检查通过。"
            },
            "evidence": [
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs: startup reconciles a closed canonical Case before expired task-source authentication",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs: startup preserves a completed commit checkpoint and waits for authentication without recommitting",
              "command:npm run check (153 passed, 1 existing Electron layout test skipped)"
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
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs: startup reconciles a closed canonical Case before expired task-source authentication",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs: startup preserves a completed commit checkpoint and waits for authentication without recommitting",
        "command:npm run check (153 passed, 1 existing Electron layout test skipped)"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T06:28:45.637Z"
    },
    {
      "round": 7,
      "goal": "完成根因修复的三维审查",
      "outcome": "completed",
      "planned_transition": "记录 correctness finding 并进入 repairing。",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
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
              "id": "REVIEW-COMMIT-PRESENCE-GUARD",
              "kind": "error",
              "statement": "reconcileRuntimePresence 的提前返回列表包含 committing，使其后用于 commit_process_missing 的专用恢复分支不可达；commit Run 记录缺失时会继续停在 committing。",
              "responsibility": "agent",
              "affected_facets": [
                "implementation_state",
                "verification_state"
              ],
              "artifact_refs": [
                "runtime/arckit-runtime/src/automation-coordinator.mjs"
              ],
              "evidence": [
                "runtime/arckit-runtime/src/automation-coordinator.mjs:reconcileRuntimePresence"
              ]
            }
          ],
          "evidence": [
            "git diff review",
            "runtime/arckit-runtime/src/automation-coordinator.mjs",
            "command:npm run check (153 passed, 1 existing Electron layout test skipped)"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "git diff review",
        "runtime/arckit-runtime/src/automation-coordinator.mjs"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T06:30:06.978Z"
    },
    {
      "round": 8,
      "goal": "恢复 commit process missing 的可达恢复路径",
      "outcome": "completed",
      "planned_transition": "REVIEW-COMMIT-PRESENCE-GUARD 从 open 变为 resolved，并增加回归覆盖。",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [
          {
            "id": "REVIEW-COMMIT-PRESENCE-GUARD",
            "resolution": "resolved",
            "reason": "committing 不再被 presence guard 提前返回；不存在活动或持久 Run 时进入 commit_process_missing recovery。",
            "evidence": [
              "runtime/arckit-runtime/src/automation-coordinator.mjs",
              "runtime/arckit-runtime/test/automation-coordinator.test.mjs: startup reports a missing commit process instead of leaving the task stuck in committing",
              "command:node --test test/automation-coordinator.test.mjs (27 passed)"
            ]
          }
        ],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/src/automation-coordinator.mjs",
        "runtime/arckit-runtime/test/automation-coordinator.test.mjs",
        "command:node --test test/automation-coordinator.test.mjs (27 passed)"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T06:31:04.640Z"
    },
    {
      "round": 9,
      "goal": "完成 content_revision=7 的终态复审并关闭 Case",
      "outcome": "completed",
      "planned_transition": "completion_review 对 correctness、completeness、minimality 均 clean，Case 从 review_ready 转为 resolved",
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
            "command:npm run check (154 passed, 1 existing Electron layout test skipped)",
            "command:git diff --check",
            "runtime/arckit-runtime/test/automation-coordinator.test.mjs: startup reconciles a closed canonical Case before expired task-source authentication",
            "runtime/arckit-runtime/test/automation-coordinator.test.mjs: startup preserves a completed commit checkpoint and waits for authentication without recommitting",
            "runtime/arckit-runtime/test/automation-coordinator.test.mjs: startup reports a missing commit process instead of leaving the task stuck in committing",
            "runtime/arckit-runtime/src/automation-coordinator.mjs",
            "runtime/arckit-runtime/src/desktop/desktop-store.mjs",
            "runtime/arckit-runtime/desktop/renderer/renderer.js"
          ]
        },
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "command:npm run check (154 passed, 1 existing Electron layout test skipped)",
        "command:git diff --check",
        "review:correctness/completeness/minimality clean for content_revision=7"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-08-07T06:34:28.989Z"
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
          "case:CASE-20260807-004"
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
    "updated_at": "2026-08-07T06:34:28.989Z"
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
