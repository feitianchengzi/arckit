# Implement Arckit Runtime MVP

Case: CASE-20260707-002
Status: active
Artifact Type: code
Current Gap: Desktop 已补 session/run 分离和固定输入框；完整 accepted loop 仍需通过 Desktop Chat 发起真实 Codex done/gate/write 闭环。
Updated: 2026-07-08T04:21:48.000Z

## User Intent

拆解并开始实施 Arckit Runtime + Supervisor 方案，先落地可运行的单 agent runtime MVP。

## Structured Record

```json
{
  "schema_version": "development-case-record/v1",
  "id": "CASE-20260707-002",
  "title": "Implement Arckit Runtime MVP",
  "status": "active",
  "artifact_type": "code",
  "created_at": "2026-07-07T15:49:29.148Z",
  "updated_at": "2026-07-08T04:21:48.000Z",
  "user_intent": "拆解并开始实施 Arckit Runtime + Supervisor 方案，先落地可运行的单 agent runtime MVP。",
  "expected_outcome": "Arckit Runtime 从 skill 文档约束升级为可执行控制面：先具备本地 CLI、状态读取、gap 选择、受控 prompt 编译、runtime result schema 和结构校验；后续接 Codex app-server 实现实时观察、steer 和 interrupt。",
  "current_round_goal": "通过 Electron Desktop Chat 添加真实项目、发送任务启动 Codex app-server supervised turn，获得 done result 后通过 gate/write-ledger。",
  "current_round_gap": "Desktop 已补 session/run 分离和固定输入框；完整 accepted loop 仍需通过 Desktop Chat 发起真实 Codex done/gate/write 闭环。",
  "project_state_ref": "arckit/project/state.record.json",
  "project_state_delta": {
    "changed": [
      "user_experience",
      "runtime_surfaces",
      "quality_validation",
      "implementation_coverage",
      "maintainability_handoff"
    ],
    "unchanged_unknown": [],
    "deferred": [
      "accepted ledger writeback for Desktop-started GAP-runtime-real-supervised-turn"
    ],
    "blocked": [
      "Desktop-started Codex app-server done result not yet validated in a network-enabled run"
    ],
    "next_project_question": "是否用 Desktop Chat 在具备 OpenAI Responses API 网络访问的环境中重跑真实 supervised turn。",
    "updated_at": "2026-07-08T00:28:46.000Z"
  },
  "round_strategy_decision": {
    "selected_route": "runtime_m0_implementation",
    "reason": "用户明确认为 skills-only 到达瓶颈，并要求完整实施计划与开始实施；最小可验证路径是先把 loop control 外移为 runtime，而不是继续堆 skills 或直接上多 agent。",
    "considered_routes": [
      {
        "route": "continue_skills_only",
        "decision": "deferred",
        "reason": "skills 继续作为能力契约和方法层，但不再承担 loop 稳定性的主责。"
      },
      {
        "route": "codex_app_server_supervisor",
        "decision": "deferred",
        "reason": "作为 M1 接入；M0 先稳定 runtime contract、状态读取和校验边界。",
        "trigger": "M0 dry-run CLI and runtime result validation pass."
      },
      {
        "route": "multi_agent_runtime",
        "decision": "deferred",
        "reason": "多 agent 会放大状态漂移，必须等单 agent supervised runtime 稳定后再接入。"
      },
      {
        "route": "runtime_m0_implementation",
        "decision": "selected",
        "reason": "先实现可运行控制面骨架，验证 Runtime 能从 canonical state 自动选择 gap 并生成受控 agent instruction。"
      }
    ],
    "next_route_triggers": [
      "M0 smoke test passes",
      "Runtime result validator accepts full run envelope",
      "Codex app-server adapter can be implemented against existing adapter boundary"
    ],
    "user_visible_summary": "本轮先落地 Arckit Runtime M0，把状态读取、gap 选择、prompt 编译和结果校验变成可执行程序。"
  },
  "structures": {
    "product_expectation": {
      "status": "satisfied",
      "reason": "Arckit Runtime 作为协议层控制面，投影自 agentic software development 产品概念和用户本轮明确诉求。",
      "evidence": [
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/product-architecture.md",
        "arckit/spec/agentic-software-development/skill-architecture.md"
      ],
      "evidence_maturity": "formalized",
      "next": "后续若 Runtime 成为独立产品 surface，再补专门 spec。"
    },
    "interaction_expectation": {
      "status": "satisfied",
      "reason": "Desktop 已改为左侧项目列表、中间连续 Chat、右侧 Arckit 状态检查器。已补 Chat session 与 run 分离，新会话入口，以及消息列表独立滚动、输入框固定底部。空闲时发送 Chat 消息启动 runtime turn，运行中发送 Chat 消息转为 steer。",
      "evidence": [
        "runtime/arckit-runtime/desktop/main.mjs",
        "runtime/arckit-runtime/desktop/preload.cjs",
        "runtime/arckit-runtime/desktop/renderer/index.html",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css"
      ],
      "evidence_maturity": "confirmed",
      "next": "用真实 Codex app-server run 验证 Desktop 操作链路。"
    },
    "visual_expectation": {
      "status": "satisfied",
      "reason": "Desktop renderer 已提供更清晰的信息层级：左侧是项目和 run，中心是连续 project conversation，右侧是 loop_control、top state gap、priority dimensions、run controls 和 event stream。",
      "evidence": [
        "runtime/arckit-runtime/desktop/renderer/index.html",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css"
      ],
      "evidence_maturity": "confirmed",
      "next": "若 Desktop 变成长期产品 surface，再补正式 interaction/visual fact 文档。"
    },
    "technical_expectation": {
      "status": "satisfied",
      "reason": "已新增 Runtime 技术方案，明确 State Store、Loop Controller、Prompt Compiler、Agent Adapter、Event Bus、Gate、Validator 和 Ledger Writer。",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "arckit/tech/INDEX.md"
      ],
      "evidence_maturity": "formalized",
      "next": "M2 实现 Gate Engine 与 ledger writeback 后补充写回协议细节。"
    },
    "implementation_state": {
      "status": "satisfied",
      "reason": "M1/M2 已实现；本轮新增 Electron Desktop Client 和 desktop run manager，保留 CLI 与 Desktop 共享同一 runtime 控制面。",
      "evidence": [
        "runtime/arckit-runtime/package.json",
        "runtime/arckit-runtime/package-lock.json",
        "runtime/arckit-runtime/bin/arckit-runtime.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/desktop/main.mjs",
        "runtime/arckit-runtime/desktop/preload.cjs",
        "runtime/arckit-runtime/desktop/renderer/index.html",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "runtime/arckit-runtime/src/async-event-queue.mjs",
        "runtime/arckit-runtime/src/json-rpc-stdio-client.mjs",
        "runtime/arckit-runtime/src/state-store.mjs",
        "runtime/arckit-runtime/src/loop-controller.mjs",
        "runtime/arckit-runtime/src/prompt-compiler.mjs",
        "runtime/arckit-runtime/src/validator.mjs",
        "runtime/arckit-runtime/schemas/runtime-result.schema.json",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs"
      ],
      "evidence_maturity": "formalized",
      "next": "通过 Desktop Client 发起真实 Codex app-server run 并完成 gate/write-ledger。"
    },
    "verification_state": {
      "status": "deferred",
      "reason": "Desktop Client 语法检查、project status 读取、conversation persistence、dry-run manager smoke 和 Electron 启动已验证；真实 app-server turn 的事件流、steer 和 interrupt 控制路径已有证据，但 Desktop Chat 发起的 done result 尚未在可联网环境完成。",
      "evidence": [
        "npm run check",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --task \"desktop client smoke\" --dry-run --json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --task \"desktop core capability clarity smoke\" --dry-run --json",
        "node --input-type=module -e \"import { createDesktopRunManager } from './runtime/arckit-runtime/src/desktop-run-manager.mjs'; ...\"",
        "node --input-type=module -e 'import { createDesktopRunManager } from \"./runtime/arckit-runtime/src/desktop-run-manager.mjs\"; ...'",
        "npm run desktop",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --dry-run --json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file /tmp/arckit-runtime-m1-smoke.json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs probe-app-server --project . --json",
        "arckit/project/runtime-results/RUN-20260707-161744356Z.json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --dry-run --json > /tmp/arckit-runtime-m2-smoke.json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file /tmp/arckit-runtime-m2-smoke.json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs gate-result --project . --file /tmp/arckit-runtime-m2-smoke.json --json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs write-ledger --project . --file /tmp/arckit-runtime-m2-done-fixture.json --dry-run --json",
        "arckit/project/runtime-results/RUN-20260707-173823Z-real-supervised-turn/result.json",
        "arckit/project/runtime-results/RUN-20260707-173823Z-real-supervised-turn/events.jsonl",
        "arckit/project/runtime-results/RUN-20260707-173823Z-real-supervised-turn/interrupt-probe-result.json",
        "arckit/project/runtime-results/RUN-20260707-173823Z-real-supervised-turn/interrupt-probe-events.jsonl",
        "arckit/project/runtime-results/RUN-20260707-173823Z-real-supervised-turn/MANIFEST.md",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file /tmp/arckit-runtime-real-turn-4-last-agent-result.json"
      ],
      "evidence_maturity": "confirmed",
      "next": "在可联网环境中通过 Desktop Chat 重跑 supervised turn，直到 round_result=done 并 gate-result allowed。"
    },
    "open_questions": {
      "status": "satisfied",
      "reason": "当前不需要人类在 Codex app-server 与 opencode 之间做最终选择；adapter 边界允许后续替换。",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md"
      ],
      "evidence_maturity": "confirmed",
      "next": "M2 默认继续 Gate Engine 与 ledger writeback。"
    },
    "pending_handoffs": {
      "status": "deferred",
      "reason": "Desktop live Codex run 是 agent-continuable 后续验证事项，不需要另建 pending item。",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md"
      ],
      "evidence_maturity": "confirmed",
      "next": "下一轮用 Desktop Chat 跑真实 Codex app-server done/gate/write 验证。"
    },
    "workflow_memory_signals": {
      "status": "not_applicable",
      "reason": "本轮是 Arckit 产品/技术实现，不是用户纠正当前项目的工作方式记忆；无需写 workflow signal。",
      "evidence": [],
      "evidence_maturity": "none",
      "next": ""
    }
  },
  "open_questions": [
    "真实 Codex supervised turn 是否由 Desktop Client 发起，以便用户观察 event stream 并手动测试 steer 与 interrupt。",
    "真实 Codex supervised turn 是否需要在非嵌套、网络可用的运行环境中执行，避免 inner turn 的 Responses API 网络被 sandbox 阻止。"
  ],
  "decisions": [
    "Runtime 放在顶层 runtime/arckit-runtime，避免污染 lifecycle skill 目录。",
    "M0 不启动真实 Codex，不自动写 ledger；先实现 dry-run 和 runtime result validator。",
    "Codex app-server adapter 作为 M1，使用 stdio JSON-RPC 和本地 schema probe 先实现可观察、可 steer、可 interrupt 的控制边界。",
    "M1 不默认启动真实模型 turn；真实 supervised turn 需要用户显式运行 runtime CLI。"
  ],
  "pending_handoffs": [
    {
      "kind": "implementation_handoff",
      "target": "next agent round",
      "summary": "通过 Electron Desktop Chat 发起真实 Codex app-server supervised turn：添加真实项目、发送任务消息、观察右侧状态和 events、用运行中 Chat 消息测试 steer，获得 round_result=done 后执行 gate-result 和 write-ledger。"
    }
  ],
  "workflow_memory_signals": [],
  "rounds": [
    {
      "round": 1,
      "goal": "Implement Arckit Runtime M0.",
      "actions": [
        "Added runtime/arckit-runtime package.",
        "Implemented state store, loop controller, prompt compiler, dry-run adapter, runtime result validator, CLI and schema.",
        "Added arckit/tech/arckit-runtime/solution.md and updated arckit/tech/INDEX.md."
      ],
      "verification": [
        "npm run check",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --dry-run --json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file /tmp/arckit-runtime-smoke.json"
      ],
      "source_projection_check": {
        "source_facts_changed": [
          "arckit/tech/arckit-runtime/solution.md"
        ],
        "projection_artifacts_changed": [
          "arckit/tech/INDEX.md",
          "runtime/arckit-runtime/*"
        ],
        "source_unknown": false,
        "deferred_projections": [
          "arckit/spec dedicated runtime feature, if Runtime becomes a product surface"
        ],
        "blocked_projections": []
      }
    },
    {
      "round": 2,
      "goal": "Implement Arckit Runtime M1.",
      "actions": [
        "Added async event queue and JSON-RPC-backed Codex app-server adapter.",
        "Implemented app-server initialize, thread/start, turn/start, notification normalization, turn/steer, and turn/interrupt control points.",
        "Added CLI probe-app-server, --stream-events, --supervise-stdin, --approval-policy, --model, and --codex-bin options.",
        "Updated Runtime README and technical solution with M1 usage and supervision boundary."
      ],
      "verification": [
        "npm run check",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs probe-app-server --project . --json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --dry-run --json > /tmp/arckit-runtime-m1-smoke.json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file /tmp/arckit-runtime-m1-smoke.json"
      ],
      "source_projection_check": {
        "source_facts_changed": [
          "arckit/tech/arckit-runtime/solution.md"
        ],
        "projection_artifacts_changed": [
          "runtime/arckit-runtime/*",
          "arckit/cases/active/CASE-20260707-002-implement-arckit-runtime-mvp.md"
        ],
        "source_unknown": false,
        "deferred_projections": [
          "Supervisor UI/TUI interaction spec if the CLI control surface becomes a product UI",
          "Real Codex supervised turn transcript after user explicitly triggers it"
        ],
        "blocked_projections": []
      }
    },
    {
      "round": 3,
      "goal": "实现 Gate Engine 与 ledger writeback，验证无效结果不会写回。",
      "actions": [
        "Accepted runtime result and wrote ledger execution record arckit/project/runtime-results/RUN-20260707-161744356Z.json."
      ],
      "verification": [
        "npm run check",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --dry-run --json > /tmp/arckit-runtime-m2-smoke.json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file /tmp/arckit-runtime-m2-smoke.json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs gate-result --project . --file /tmp/arckit-runtime-m2-smoke.json --json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs write-ledger --project . --file /tmp/arckit-runtime-m2-done-fixture.json --dry-run --json"
      ],
      "source_projection_check": {
        "source_facts_changed": [
          "arckit/tech/arckit-runtime/solution.md"
        ],
        "projection_artifacts_changed": [
          "runtime/arckit-runtime/*",
          "arckit/project/state.record.json",
          "arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.record.json",
          "arckit/cases/active/CASE-20260707-002-implement-arckit-runtime-mvp.md"
        ],
        "source_unknown": false,
        "deferred_projections": [
          "Real Codex supervised turn transcript after user explicitly triggers it",
          "Supervisor UI/TUI interaction spec if the CLI control surface becomes a product UI"
        ],
        "blocked_projections": []
      }
    },
    {
      "round": 4,
      "goal": "Validate real Codex supervised turn, steer, interrupt and gate behavior.",
      "actions": [
        "Fixed strict structured output schema for Codex app-server response_format.",
        "Fixed adapter parsing to use the last completed agentMessage instead of concatenating multiple JSON messages.",
        "Ran a real codex-app-server supervised turn with event streaming.",
        "Captured steer and interrupt evidence under runtime-results evidence directory.",
        "Confirmed gate-result and write-ledger dry-run block the result because round_result is not done."
      ],
      "verification": [
        "npm run check",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file /tmp/arckit-runtime-real-turn-4-last-agent-result.json",
        "arckit/project/runtime-results/RUN-20260707-173823Z-real-supervised-turn/MANIFEST.md"
      ],
      "source_projection_check": {
        "source_facts_changed": [],
        "projection_artifacts_changed": [
          "arckit/project/runtime-results/RUN-20260707-173823Z-real-supervised-turn/result.json",
          "arckit/project/runtime-results/RUN-20260707-173823Z-real-supervised-turn/events.jsonl",
          "arckit/project/runtime-results/RUN-20260707-173823Z-real-supervised-turn/interrupt-probe-result.json",
          "arckit/project/runtime-results/RUN-20260707-173823Z-real-supervised-turn/interrupt-probe-events.jsonl",
          "arckit/project/runtime-results/RUN-20260707-173823Z-real-supervised-turn/MANIFEST.md"
        ],
        "source_unknown": false,
        "deferred_projections": [
          "canonical accepted writeback until done result gates successfully"
        ],
        "blocked_projections": [
          "quality_validation accepted transition blocked by sandboxed network failure"
        ]
      }
    },
    {
      "round": 5,
      "goal": "Implement Electron Desktop Client for local project loop control.",
      "actions": [
        "Added Electron main/preload/renderer desktop client.",
        "Added desktop run manager for project registry, run history, runtime process supervision, event forwarding, steer/interrupt, gate-result and write-ledger.",
        "Added CLI --task so Desktop task input is injected into the supervised runtime prompt.",
        "Installed Electron dependency and added npm desktop script.",
        "Launched the Electron desktop client."
      ],
      "verification": [
        "npm run check",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --task \"desktop client smoke\" --dry-run --json",
        "node --input-type=module -e 'import { createDesktopRunManager } from \"./runtime/arckit-runtime/src/desktop-run-manager.mjs\"; ...'",
        "npm install",
        "npm run desktop"
      ],
      "source_projection_check": {
        "source_facts_changed": [
          "arckit/tech/arckit-runtime/solution.md"
        ],
        "projection_artifacts_changed": [
          "runtime/arckit-runtime/package.json",
          "runtime/arckit-runtime/package-lock.json",
          "runtime/arckit-runtime/.gitignore",
          "runtime/arckit-runtime/src/cli.mjs",
          "runtime/arckit-runtime/src/prompt-compiler.mjs",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/desktop/main.mjs",
          "runtime/arckit-runtime/desktop/preload.cjs",
          "runtime/arckit-runtime/desktop/renderer/index.html",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/desktop/renderer/styles.css",
          "runtime/arckit-runtime/README.md",
          "arckit/project/state.record.json",
          "arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.record.json",
          "arckit/cases/active/CASE-20260707-002-implement-arckit-runtime-mvp.md"
        ],
        "source_unknown": false,
        "deferred_projections": [
          "Desktop-started real Codex app-server done result and gate/write evidence"
        ],
        "blocked_projections": []
      }
    },
    {
      "round": 6,
      "goal": "Improve Desktop Client into a project-list, chat and state-inspector workspace.",
      "actions": [
        "Reworked renderer layout into left project list, center continuous chat and right Arckit state inspector.",
        "Added project conversation persistence in desktop run manager.",
        "Added project status IPC that reads state.record.json for loop_control, top_gap, priority dimensions and active cases.",
        "Changed chat behavior so idle messages start runtime turns and messages during active runs send steer.",
        "Moved gate, preview ledger, write ledger and event stream into the right state rail."
      ],
      "verification": [
        "npm run check",
        "node --input-type=module -e 'import { createDesktopRunManager } from \"./runtime/arckit-runtime/src/desktop-run-manager.mjs\"; ...'",
        "npm run desktop"
      ],
      "source_projection_check": {
        "source_facts_changed": [
          "User feedback: Desktop should use left project list, center chat, right status display and show continuous conversation."
        ],
        "projection_artifacts_changed": [
          "runtime/arckit-runtime/desktop/renderer/index.html",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/desktop/renderer/styles.css",
          "arckit/cases/active/CASE-20260707-002-implement-arckit-runtime-mvp.md"
        ],
        "source_unknown": false,
        "deferred_projections": [
          "Project/iteration accepted transition for GAP-runtime-real-supervised-turn until Desktop Chat-started round_result=done gates and writes ledger",
          "Formal interaction/visual docs if Desktop becomes a stable product surface beyond this MVP"
        ],
        "blocked_projections": []
      }
    },
    {
      "round": 7,
      "goal": "Fix Desktop chat session semantics and composer layout.",
      "actions": [
        "Separated Chat sessions from Runs in the desktop store.",
        "Added New chat and Chats list to the left rail.",
        "Scoped runs to the selected chat; clicking a run now changes execution detail instead of pretending to switch conversation.",
        "Persisted messages by session id and associated runs with session id.",
        "Fixed chat layout so messages scroll independently and the composer remains fixed at the bottom."
      ],
      "verification": [
        "npm run check",
        "node --input-type=module -e 'import { createDesktopRunManager } from \"./runtime/arckit-runtime/src/desktop-run-manager.mjs\"; ...'",
        "npm run desktop"
      ],
      "source_projection_check": {
        "source_facts_changed": [
          "User feedback: RUNS should not be treated as conversations; message list should not push the input box down."
        ],
        "projection_artifacts_changed": [
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/desktop/main.mjs",
          "runtime/arckit-runtime/desktop/preload.cjs",
          "runtime/arckit-runtime/desktop/renderer/index.html",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/desktop/renderer/styles.css",
          "runtime/arckit-runtime/README.md",
          "arckit/tech/arckit-runtime/solution.md",
          "arckit/project/state.record.json",
          "arckit/cases/active/CASE-20260707-002-implement-arckit-runtime-mvp.md"
        ],
        "source_unknown": false,
        "deferred_projections": [
          "Desktop Chat-started real Codex app-server done result and gate/write evidence"
        ],
        "blocked_projections": []
      }
    }
  ],
  "completion_audit": {
    "status": "incomplete",
    "satisfied": [
      "product_expectation",
      "interaction_expectation",
      "visual_expectation",
      "technical_expectation",
      "implementation_state",
      "open_questions",
      "workflow_memory_signals"
    ],
    "remaining": [
      "verification_state",
      "pending_handoffs"
    ],
    "blocked": [],
    "next_round_goal": "通过 Electron Desktop Chat 在可联网环境中重跑真实 Codex supervised turn，获得 round_result=done 后通过 gate/write-ledger。",
    "loop_handoff": {
      "version": "loop-handoff/v1",
      "status": "continue",
      "next_responsibility": "agent",
      "agent_continuation_available": true,
      "human_decision_required": false,
      "trigger_mode": "manual_bridge",
      "responsibility_reason": "Desktop Client 已改为三栏 Chat workspace，事件流、steer 和 interrupt 已被证实；下一步仍是 agent 可执行验证，但需要网络可用环境产出 done result。",
      "next_prompt": "继续 active case CASE-20260707-002：使用 runtime/arckit-runtime Electron Desktop Chat 添加真实项目，发送任务消息发起 codex-app-server supervised turn，运行中发送 Chat 消息测试 steer，观察右侧状态和 events，保存 result/events，确认 round_result=done 后运行 gate-result 和 write-ledger。",
      "agent_instruction": {
        "goal": "Obtain a completed Desktop Chat-started done result for GAP-runtime-real-supervised-turn.",
        "required_context_refs": [
          "arckit/project/state.record.json",
          "arckit/project/STATE.md",
          "runtime/arckit-runtime/README.md",
          "arckit/project/runtime-results/RUN-20260707-173823Z-real-supervised-turn/MANIFEST.md"
        ],
        "required_actions": [
          "Launch Electron Desktop Chat.",
          "Add a real Arckit project.",
          "Send a task message to run codex-app-server supervised turn with network access from Desktop.",
          "Send another Chat message after turn start to exercise steer.",
          "Validate result and gate ledger writeback.",
          "Run write-ledger only when gate-result allows."
        ],
        "required_checks": [
          "runtime_result.round_result=done",
          "validation_evidence non-empty",
          "gate-result allowed",
          "steer/interrupt evidence retained"
        ],
        "stop_condition": "Stop blocked again if model stream cannot complete or gate-result blocks."
      },
      "human_gate": {
        "required": false,
        "reason": "",
        "decision_needed": ""
      },
      "progress_guard": {
        "expected_state_change": "quality_validation can move verified -> accepted only after a Desktop Chat-started done supervised result validates and gates.",
        "actual_state_change": "Desktop Client implemented and launched; three-column continuous Chat workspace implemented; event stream, steer, and interrupt behavior proved; done result still needs network-enabled run",
        "no_progress_limit": 2,
        "max_auto_rounds": 3
      },
      "blocked_reason": ""
    },
    "updated_at": "2026-07-08T04:21:48.000Z"
  }
}
```

## Round Notes

- M0 implemented `runtime/arckit-runtime`.
- M0 validation passed:
  - `npm run check`
  - `node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --dry-run --json`
  - `node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file /tmp/arckit-runtime-smoke.json`
- M1 implemented Codex app-server stdio adapter, normalized event stream, `probe-app-server`, `--stream-events`, and `--supervise-stdin`.
- M1 validation passed:
  - `npm run check`
  - `node runtime/arckit-runtime/bin/arckit-runtime.mjs probe-app-server --project . --json`
  - `node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --dry-run --json > /tmp/arckit-runtime-m1-smoke.json`
  - `node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file /tmp/arckit-runtime-m1-smoke.json`
