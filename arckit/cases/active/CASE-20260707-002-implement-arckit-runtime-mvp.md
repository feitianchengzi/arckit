# Implement Arckit Runtime MVP

Case: CASE-20260707-002
Status: active
Artifact Type: code
Current Gap: Desktop 全流程已修正为 Packet Preview 不执行 worker、Run Packet 授权同一 packet、运行中输入回到 Controller、worker packet/report 协议统一；剩余缺口是真实 Codex worker done result 与 ledger writeback 闭环。
Updated: 2026-07-08T13:23:43.000Z

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
  "updated_at": "2026-07-08T13:23:43.000Z",
  "user_intent": "拆解并开始实施 Arckit Runtime + Supervisor 方案，先落地可运行的单 agent runtime MVP。",
  "expected_outcome": "Arckit Runtime/Desktop 从单 agent supervised turn 升级为外部确定性多 agent 编排层：Runtime 负责任务拆解、worker 生命周期、report 校验、merge gate 和 ledger 写回；Desktop 负责项目、会话、Chat、agent loop 状态、暂停/纠偏/继续与证据展示；skills 降级为能力契约和 Runtime manifest。",
  "current_round_goal": "在真实 Codex app-server 环境中用 Desktop Chat 跑通 agentic worker loop，获得可 gate/write-ledger 的 done result。",
  "current_round_gap": "Desktop 全流程已修正为 Packet Preview 不执行 worker、Run Packet 授权同一 packet、运行中输入回到 Controller、worker packet/report 协议统一；剩余缺口是真实 Codex worker done result 与 ledger writeback 闭环。",
  "project_state_ref": "arckit/project/state.record.json",
  "project_state_delta": {
    "changed": [
      "runtime_surfaces",
      "implementation_coverage",
      "observability_support",
      "maintainability_handoff"
    ],
    "unchanged_unknown": [],
    "deferred": [
      "real Codex app-server worker loop done result",
      "accepted ledger writeback for Desktop-started agentic run"
    ],
    "blocked": [],
    "next_project_question": "用 Desktop 在 ../arckit-demo 或真实项目中发起 Codex app-server agentic run，观察 5 个 worker report、merge gate、raw events，并在 done 后 gate/write-ledger。",
    "updated_at": "2026-07-08T10:38:28.985Z"
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
      "reason": "Desktop Live Run Card 现在按 Thinking Summary、Plan、Execution Details、Agent Output、Command Output、Errors/Retries 和 Saved Evidence 分区展示，而不是只显示时间或 JSON。",
      "evidence": [
        "runtime/arckit-runtime/desktop/main.mjs",
        "runtime/arckit-runtime/desktop/preload.cjs",
        "runtime/arckit-runtime/desktop/renderer/index.html",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "runtime/arckit-runtime/src/project-initializer.mjs",
        "runtime/arckit-runtime/src/ledger-scripts.mjs",
        "runtime/arckit-runtime/src/cli.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs init-project --project /private/tmp/arckit-empty-smoke --name EmptySmoke --intent ...",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project /private/tmp/arckit-empty-smoke --task \"Build a simple todo app\" --dry-run --json",
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/memory/skills/arckit-development-ledger/scripts/project-state.mjs audit /private/tmp/arckit-empty-smoke/arckit/project/state.record.json",
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/memory/skills/arckit-development-ledger/scripts/development-case.mjs validate /private/tmp/arckit-empty-smoke/arckit/cases/active/CASE-20260708-001-initial-arckit-project-loop.md",
        "node --input-type=module -e \"import { createDesktopRunManager } from ./runtime/arckit-runtime/src/desktop-run-manager.mjs; ... empty project smoke ...\"",
        "npm run check",
        "node --input-type=module -e activity smoke",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "node --input-type=module -e detail smoke"
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
      "reason": "Runtime 已从单 prompt/single agent turn 重构为 agentic orchestrator：生成 loop_frame、agent_tasks、agent_reports、merge_result 和 runtime_result；Codex app-server adapter 支持 agent-report 输出；Desktop manager 和 renderer 展示 agent loop。",
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
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/project-initializer.mjs",
        "runtime/arckit-runtime/src/ledger-scripts.mjs",
        "runtime/arckit-runtime/src/cli.mjs",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs init-project --project /private/tmp/arckit-empty-smoke --name EmptySmoke --intent ...",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project /private/tmp/arckit-empty-smoke --task \"Build a simple todo app\" --dry-run --json",
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/memory/skills/arckit-development-ledger/scripts/project-state.mjs audit /private/tmp/arckit-empty-smoke/arckit/project/state.record.json",
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/memory/skills/arckit-development-ledger/scripts/development-case.mjs validate /private/tmp/arckit-empty-smoke/arckit/cases/active/CASE-20260708-001-initial-arckit-project-loop.md",
        "node --input-type=module -e \"import { createDesktopRunManager } from ./runtime/arckit-runtime/src/desktop-run-manager.mjs; ... empty project smoke ...\"",
        "npm run check",
        "node --input-type=module -e activity smoke",
        "node --input-type=module -e detail smoke",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs init-project --project /private/tmp/arckit-invalid-ledger-smoke --name InvalidLedgerSmoke --intent ...",
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/memory/skills/arckit-development-ledger/scripts/project-state.mjs audit /private/tmp/arckit-invalid-ledger-smoke/arckit/project/state.record.json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project /private/tmp/arckit-invalid-ledger-smoke --task \"start run should repair invalid ledger\" --dry-run --json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file /private/tmp/arckit-invalid-ledger-run.json",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/capability-registry.mjs",
        "runtime/arckit-runtime/schemas/agent-task.schema.json",
        "runtime/arckit-runtime/schemas/agent-report.schema.json",
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/using-arckit/arckit.capability.json",
        "memory/skills/arckit-development-ledger/arckit.capability.json",
        "node bin/arckit-runtime.mjs run --project ../.. --dry-run --json",
        "desktop-run-manager empty-project agentic dry-run smoke"
      ],
      "evidence_maturity": "confirmed",
      "next": "接入真实 Codex worker run 并收集 done result。"
    },
    "verification_state": {
      "status": "satisfied",
      "reason": "静态检查、Runtime dry-run、stream-events smoke、Desktop manager 空项目 agentic dry-run smoke 均通过。",
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
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file /tmp/arckit-runtime-real-turn-4-last-agent-result.json",
        "runtime/arckit-runtime/src/project-initializer.mjs",
        "runtime/arckit-runtime/src/ledger-scripts.mjs",
        "runtime/arckit-runtime/src/cli.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs init-project --project /private/tmp/arckit-empty-smoke --name EmptySmoke --intent ...",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project /private/tmp/arckit-empty-smoke --task \"Build a simple todo app\" --dry-run --json",
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/memory/skills/arckit-development-ledger/scripts/project-state.mjs audit /private/tmp/arckit-empty-smoke/arckit/project/state.record.json",
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/memory/skills/arckit-development-ledger/scripts/development-case.mjs validate /private/tmp/arckit-empty-smoke/arckit/cases/active/CASE-20260708-001-initial-arckit-project-loop.md",
        "node --input-type=module -e \"import { createDesktopRunManager } from ./runtime/arckit-runtime/src/desktop-run-manager.mjs; ... empty project smoke ...\"",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "runtime/arckit-runtime/desktop/renderer/index.html",
        "node --input-type=module -e activity smoke",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "node --input-type=module -e detail smoke",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs init-project --project /private/tmp/arckit-invalid-ledger-smoke --name InvalidLedgerSmoke --intent ...",
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/memory/skills/arckit-development-ledger/scripts/project-state.mjs audit /private/tmp/arckit-invalid-ledger-smoke/arckit/project/state.record.json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project /private/tmp/arckit-invalid-ledger-smoke --task \"start run should repair invalid ledger\" --dry-run --json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file /private/tmp/arckit-invalid-ledger-run.json",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/capability-registry.mjs",
        "runtime/arckit-runtime/schemas/agent-task.schema.json",
        "runtime/arckit-runtime/schemas/agent-report.schema.json",
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/using-arckit/arckit.capability.json",
        "memory/skills/arckit-development-ledger/arckit.capability.json",
        "node bin/arckit-runtime.mjs run --project ../.. --dry-run --json",
        "desktop-run-manager empty-project agentic dry-run smoke"
      ],
      "evidence_maturity": "confirmed",
      "next": "真实 Codex app-server run 验证仍待网络/model 环境完成。"
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
      "status": "satisfied",
      "reason": "本轮产品判断已沉淀为 Runtime-first：skill 不再承担 loop 执行，Desktop/Runtime 作为外部编排层。",
      "evidence": [
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/capability-registry.mjs",
        "runtime/arckit-runtime/schemas/agent-task.schema.json",
        "runtime/arckit-runtime/schemas/agent-report.schema.json",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/using-arckit/arckit.capability.json",
        "memory/skills/arckit-development-ledger/arckit.capability.json",
        "npm run check",
        "node bin/arckit-runtime.mjs run --project ../.. --dry-run --json",
        "desktop-run-manager empty-project agentic dry-run smoke"
      ],
      "evidence_maturity": "formalized",
      "next": "后续把更多 capability manifest 接入 Runtime routing。"
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
    "M1 不默认启动真实模型 turn；真实 supervised turn 需要用户显式运行 runtime CLI。",
    "Desktop 添加项目、Desktop start-run 和 CLI run 都应支持空项目从 0 初始化；缺少 arckit/project/state.record.json 不再是首条消息的失败条件。",
    "Ledger skill 脚本路径由 runtime 自身定位，不再假设目标项目包含 memory/skills。"
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
    },
    {
      "round": 8,
      "goal": "Support empty projects from first Desktop chat.",
      "actions": [
        "Added project-initializer to create standard project state, active case, initial discovery gap, STATE.md and cases index.",
        "Added shared ledger-scripts helper so runtime writeback locates ledger scripts from the Arckit repository instead of the target project.",
        "Changed CLI run and Desktop addProject/startRun to ensure Arckit state before execution.",
        "Changed Desktop renderer so missing state is shown as auto-initializable instead of disabling chat."
      ],
      "verification": [
        "runtime/arckit-runtime/src/project-initializer.mjs",
        "runtime/arckit-runtime/src/ledger-scripts.mjs",
        "runtime/arckit-runtime/src/cli.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs init-project --project /private/tmp/arckit-empty-smoke --name EmptySmoke --intent ...",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project /private/tmp/arckit-empty-smoke --task \"Build a simple todo app\" --dry-run --json",
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/memory/skills/arckit-development-ledger/scripts/project-state.mjs audit /private/tmp/arckit-empty-smoke/arckit/project/state.record.json",
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/memory/skills/arckit-development-ledger/scripts/development-case.mjs validate /private/tmp/arckit-empty-smoke/arckit/cases/active/CASE-20260708-001-initial-arckit-project-loop.md",
        "node --input-type=module -e \"import { createDesktopRunManager } from ./runtime/arckit-runtime/src/desktop-run-manager.mjs; ... empty project smoke ...\"",
        "npm run check"
      ],
      "source_projection_check": {
        "source_facts_changed": [],
        "projection_artifacts_changed": [
          "runtime/arckit-runtime/src/project-initializer.mjs",
          "runtime/arckit-runtime/src/ledger-scripts.mjs",
          "runtime/arckit-runtime/src/cli.mjs",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/desktop/renderer/renderer.js"
        ],
        "source_unknown": false,
        "deferred_projections": [
          "Desktop-started real Codex done/gate/write validation"
        ],
        "blocked_projections": []
      }
    },
    {
      "round": 9,
      "goal": "Improve Desktop run observability for live Codex turns.",
      "actions": [
        "Added desktop run activity aggregation with phase, current step, timeline, plan, output streams, raw events and controls.",
        "Rendered Live Run Card in the Chat column for the selected run.",
        "Changed right-side Run Control to show live activity and timeline instead of only a static RUNNING summary.",
        "Changed Events section to show selected run raw events and added idle/stuck hints."
      ],
      "verification": [
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "runtime/arckit-runtime/desktop/renderer/index.html",
        "npm run check",
        "node --input-type=module -e activity smoke"
      ],
      "source_projection_check": {
        "source_facts_changed": [],
        "projection_artifacts_changed": [
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/desktop/renderer/index.html",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/desktop/renderer/styles.css"
        ],
        "source_unknown": false,
        "deferred_projections": [
          "Desktop-started real Codex done/gate/write validation on ../arckit-demo"
        ],
        "blocked_projections": []
      }
    },
    {
      "round": 10,
      "goal": "Show agent reasoning summaries and execution details instead of JSON-only run cards.",
      "actions": [
        "Added raw_rpc preservation to normalized Codex app-server events.",
        "Persisted raw-events.jsonl and activity.json for every Desktop run.",
        "Aggregated item started/completed, errors, warnings, reasoning, agent output and command output into desktop run activity.",
        "Rendered Thinking Summary, Execution Details, Errors/Retries and Saved Evidence in the Live Run Card."
      ],
      "verification": [
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "npm run check",
        "node --input-type=module -e detail smoke"
      ],
      "source_projection_check": {
        "source_facts_changed": [],
        "projection_artifacts_changed": [
          "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/desktop/renderer/styles.css"
        ],
        "source_unknown": false,
        "deferred_projections": [
          "Real ../arckit-demo Codex app-server event coverage validation"
        ],
        "blocked_projections": []
      }
    },
    {
      "round": 11,
      "goal": "Repair existing project ledger enum drift before Desktop start-run.",
      "actions": [
        "Added project state normalization to ensureArckitProject before render/audit.",
        "Mapped invalid evidence_maturity values such as defined/designed/verified into valid maturity values.",
        "Normalized related enum fields for dimensions, state gaps and loop_control when safe."
      ],
      "verification": [
        "runtime/arckit-runtime/src/project-initializer.mjs",
        "npm run check",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs init-project --project /private/tmp/arckit-invalid-ledger-smoke --name InvalidLedgerSmoke --intent ...",
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/memory/skills/arckit-development-ledger/scripts/project-state.mjs audit /private/tmp/arckit-invalid-ledger-smoke/arckit/project/state.record.json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project /private/tmp/arckit-invalid-ledger-smoke --task \"start run should repair invalid ledger\" --dry-run --json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file /private/tmp/arckit-invalid-ledger-run.json"
      ],
      "source_projection_check": {
        "source_facts_changed": [],
        "projection_artifacts_changed": [
          "runtime/arckit-runtime/src/project-initializer.mjs"
        ],
        "source_unknown": false,
        "deferred_projections": [
          "Real ../arckit-demo Desktop Codex run validation"
        ],
        "blocked_projections": []
      }
    },
    {
      "round": 12,
      "goal": "Fix review findings in Arckit skills and Desktop agentic loop implementation.",
      "actions": [
        "Changed Codex app-server adapter approvals from unconditional denial to Runtime approval-policy based command/file/permission decisions.",
        "Tightened merge gate so done requires all worker reports, complete report shape, no partial/blocked/invalid reports, no risks, no unknowns, no main-agent decision requirement, and validation evidence.",
        "Loaded repository capability manifests plus installed Codex skill manifests, and injected selected capability context and bounded SKILL.md excerpts into worker prompts.",
        "Updated using-arckit OpenAI prompt to Runtime-first semantics instead of the old skill-declared subagent mode.",
        "Associated Codex reasoning, agent output, and command output with the active task_id/role in Desktop activity.",
        "Expanded Desktop Agent Reports UI to show findings, evidence, changes, risks, unknowns, recommendations, and main-agent decision flags."
      ],
      "verification": [
        "npm run check",
        "node bin/arckit-runtime.mjs run --project ../.. --dry-run --json",
        "node memory/skills/arckit-development-ledger/scripts/project-state.mjs audit arckit/project/state.record.json",
        "node memory/skills/arckit-development-ledger/scripts/project-iteration.mjs audit arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.record.json",
        "node memory/skills/arckit-development-ledger/scripts/development-case.mjs validate arckit/cases/active/CASE-20260707-002-implement-arckit-runtime-mvp.md"
      ],
      "source_projection_check": {
        "source_facts_changed": [
          "entry/skills/using-arckit/agents/openai.yaml"
        ],
        "projection_artifacts_changed": [
          "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
          "runtime/arckit-runtime/src/agent-orchestrator.mjs",
          "runtime/arckit-runtime/src/capability-registry.mjs",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/desktop/renderer/styles.css",
          "arckit/cases/active/CASE-20260707-002-implement-arckit-runtime-mvp.md"
        ],
        "source_unknown": false,
        "deferred_projections": [
          "Real ../arckit-demo Desktop Codex run validation",
          "Confirm Codex app-server approval response shape under a real file-editing worker task"
        ],
        "blocked_projections": []
      }
    },
    {
      "round": 13,
      "goal": "Optimize using-arckit content around Runtime-first product direction.",
      "actions": [
        "Rewrote using-arckit/SKILL.md as an entry protocol instead of an execution-engine prompt.",
        "Removed stale subagent references that still described skill-declared authorization and main-agent simulated dispatch.",
        "Added Runtime-first references for entry protocol, capability routing, worker contract and fallback closeout.",
        "Updated using-arckit capability manifest to expose Runtime/Desktop entry, worker contracts, merge gate contract and fallback closeout.",
        "Updated OpenAI agent prompt to prefer Runtime/Desktop and to report fallback_protocol_used when Runtime is unavailable."
      ],
      "verification": [
        "rg -n \"subagent|skill_declared|round-frame|round-handoff|merge-and-loop|subagent_task|subagent_report|capability-routing.md\" entry/skills/using-arckit",
        "npm run check",
        "node bin/arckit-runtime.mjs run --project ../.. --dry-run --json"
      ],
      "source_projection_check": {
        "source_facts_changed": [
          "entry/skills/using-arckit/SKILL.md",
          "entry/skills/using-arckit/arckit.capability.json",
          "entry/skills/using-arckit/agents/openai.yaml",
          "entry/skills/using-arckit/references/runtime-entry-protocol.md",
          "entry/skills/using-arckit/references/runtime-capability-routing.md",
          "entry/skills/using-arckit/references/runtime-worker-contract.md",
          "entry/skills/using-arckit/references/fallback-closeout.md"
        ],
        "projection_artifacts_changed": [
          "arckit/cases/active/CASE-20260707-002-implement-arckit-runtime-mvp.md"
        ],
        "source_unknown": false,
        "deferred_projections": [
          "Install/sync optimized using-arckit into ~/.codex/skills if user wants installed skill state updated"
        ],
        "blocked_projections": []
      }
    },
    {
      "round": 14,
      "goal": "Reposition using-arckit as one operator-agnostic project loop entry capability.",
      "actions": [
        "Rewrote using-arckit/SKILL.md so it defines one Arckit project loop entry capability independent of whether the operator is human, Desktop, Runtime, CLI, or another platform.",
        "Replaced Runtime-named references with entry-trigger-and-flow, capability-routing, and closeout-handoff references.",
        "Updated using-arckit capability manifest to project_loop_entry and removed operator-specific implementation semantics.",
        "Updated OpenAI prompt so trigger timing is based on whether input changes, recovers, advances, verifies, or hands off project state.",
        "Added Desktop run metadata entry_capability=using-arckit and operator=desktop, and rendered those chips in live run cards and the run inspector."
      ],
      "verification": [
        "rg -n \"Runtime/Desktop|Runtime-first|fallback_protocol|runtime_blocked|manual_orchestrated|desktop mode|operator-specific|subagent|skill_declared\" entry/skills/using-arckit",
        "npm run check",
        "node bin/arckit-runtime.mjs run --project ../.. --dry-run --json"
      ],
      "source_projection_check": {
        "source_facts_changed": [
          "entry/skills/using-arckit/SKILL.md",
          "entry/skills/using-arckit/arckit.capability.json",
          "entry/skills/using-arckit/agents/openai.yaml",
          "entry/skills/using-arckit/references/entry-trigger-and-flow.md",
          "entry/skills/using-arckit/references/capability-routing.md",
          "entry/skills/using-arckit/references/closeout-handoff.md"
        ],
        "projection_artifacts_changed": [
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/desktop/renderer/styles.css",
          "arckit/cases/active/CASE-20260707-002-implement-arckit-runtime-mvp.md"
        ],
        "source_unknown": false,
        "deferred_projections": [
          "Real ../arckit-demo Desktop Codex run validation",
          "Install/sync optimized using-arckit into ~/.codex/skills if installed skill state should match repository state"
        ],
        "blocked_projections": []
      }
    },
    {
      "round": 15,
      "goal": "Decouple concrete skill descriptions from using-arckit routing.",
      "actions": [
        "Rewrote concrete Arckit skill descriptions so each skill declares its own applicable scenarios instead of saying it is default-routed by using-arckit.",
        "Replaced workflow-memory and agent-context body coupling with generic project entry capability or caller wording.",
        "Updated workflow-memory OpenAI metadata, policy key, frame contribution wording, operations reference, and schema ledger_source away from using-arckit-specific semantics.",
        "Confirmed using-arckit references now remain only inside the using-arckit entry skill itself."
      ],
      "verification": [
        "rg -n \"默认由 using-arckit|由 using-arckit|using-arckit 在|using-arckit.*路由|进入 using-arckit|using-arckit\" entry definition memory engineering thinking -g 'SKILL.md' -g 'openai.yaml' -g '*.md' -g '*.yaml'",
        "rg -n \"description: .*using-arckit|default_from_using_arckit|ledger_source: using-arckit\" entry definition memory engineering thinking -g 'SKILL.md' -g 'openai.yaml' -g '*.md' -g '*.yaml'",
        "npm run check",
        "node bin/arckit-runtime.mjs run --project ../.. --dry-run --json"
      ],
      "source_projection_check": {
        "source_facts_changed": [
          "engineering/skills/arckit-refactor-strategy/SKILL.md",
          "memory/skills/arckit-development-ledger/SKILL.md",
          "definition/skills/arckit-spec/SKILL.md",
          "engineering/skills/arckit-implementation-handoff/SKILL.md",
          "memory/skills/arckit-workflow-memory/SKILL.md",
          "thinking/skills/arckit-decision-framework/SKILL.md",
          "thinking/skills/arckit-domain-modeling/SKILL.md",
          "memory/skills/arckit-intake/SKILL.md",
          "engineering/skills/arckit-debug-diagnosis/SKILL.md",
          "memory/skills/arckit-agent-context/SKILL.md",
          "memory/skills/arckit-pending/SKILL.md",
          "thinking/skills/arckit-architecture-decision/SKILL.md",
          "definition/skills/arckit-interaction/SKILL.md",
          "definition/skills/arckit-visual/SKILL.md",
          "thinking/skills/arckit-explore-product-design/SKILL.md",
          "thinking/skills/arckit-draft-spec/SKILL.md",
          "definition/skills/arckit-tech/SKILL.md",
          "memory/skills/arckit-workflow-memory/agents/openai.yaml",
          "memory/skills/arckit-workflow-memory/references/workflow-memory-operations.md",
          "memory/skills/arckit-workflow-memory/references/workflow-memory-schema.md"
        ],
        "projection_artifacts_changed": [
          "arckit/cases/active/CASE-20260707-002-implement-arckit-runtime-mvp.md"
        ],
        "source_unknown": false,
        "deferred_projections": [
          "Real ../arckit-demo Desktop Codex run validation",
          "Install/sync optimized skills into ~/.codex/skills if installed skill state should match repository state"
        ],
        "blocked_projections": []
      }
    },
    {
      "round": 16,
      "goal": "Define and implement the Controller/Worker loop semantics for using-arckit and Desktop.",
      "actions": [
        "Added arckit/spec/agentic-software-development/controller-worker-loop.md to record Human Runtime, Controller Agent, Worker Agent, execution gate, worker report intake, closeout, and Desktop automation semantics.",
        "Updated product-architecture and skill-architecture to state that using-arckit is a Controller and execution requires explicit executor binding.",
        "Rewrote entry/skills/using-arckit as a Controller protocol that outputs round_execution_packet, execution_gate, worker_packets, report_intake_rules, closeout_rules, and loop_handoff.",
        "Updated using-arckit capability manifest and OpenAI prompt around Controller, packet compiler, report intake, and closeout roles.",
        "Updated Runtime agent orchestration to produce controller_frame, execution_gate, executor_binding, worker_packets, report_intake_rules, closeout_rules, and report_intake in dry-run and execute paths.",
        "Updated Desktop activity and renderer to display Controller Packet, Gate, Executor, Worker Packets, and Report Intake as structured UI sections instead of opaque JSON."
      ],
      "verification": [
        "npm run check",
        "node bin/arckit-runtime.mjs run --project ../.. --dry-run --json",
        "node -e dry-run summary: validation=true, controller_frame=v1, execution_gate=pending, executor=none, worker_packets=5"
      ],
      "source_projection_check": {
        "source_facts_changed": [
          "arckit/spec/agentic-software-development/controller-worker-loop.md",
          "arckit/spec/agentic-software-development/product-architecture.md",
          "arckit/spec/agentic-software-development/skill-architecture.md",
          "arckit/spec/INDEX.md",
          "entry/skills/using-arckit/SKILL.md",
          "entry/skills/using-arckit/arckit.capability.json",
          "entry/skills/using-arckit/agents/openai.yaml",
          "entry/skills/using-arckit/references/controller-conversation-protocol.md",
          "entry/skills/using-arckit/references/worker-packet-and-report.md",
          "entry/skills/using-arckit/references/closeout-handoff.md"
        ],
        "projection_artifacts_changed": [
          "runtime/arckit-runtime/src/agent-orchestrator.mjs",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/desktop/renderer/styles.css",
          "arckit/cases/active/CASE-20260707-002-implement-arckit-runtime-mvp.md"
        ],
        "source_unknown": false,
        "deferred_projections": [
          "Real ../arckit-demo Desktop Codex run validation with authorized execution_gate and worker reports",
          "Ledger writeback after a real done runtime result",
          "Install/sync optimized skills into ~/.codex/skills if installed skill state should match repository state"
        ],
        "blocked_projections": []
      }
    },
    {
      "round": 17,
      "goal": "Fix Desktop Controller/Worker flow gaps found in review.",
      "actions": [
        "Changed Packet Preview so it stops after controller frame, execution gate, and worker packet generation; it no longer fabricates worker reports.",
        "Added packet-file execution support so Desktop Run Packet authorizes and executes the same preview packet instead of replanning a new one.",
        "Added Desktop Run Packet control and connected it to startRun(authorizeRunId).",
        "Changed active-run chat input from direct worker steer to Controller input that interrupts current execution and records a correction/supplement for the next Controller round.",
        "Changed Continue to use the latest loop_handoff.next_prompt or merge next_prompt instead of a hard-coded continuation string.",
        "Unified Runtime schema and prompts around arckit-worker-packet/v1 and arckit-worker-report/v1, and removed old agent task/report schemas."
      ],
      "verification": [
        "npm run check",
        "node bin/arckit-runtime.mjs run --project ../.. --dry-run --json",
        "dry-run summary: validation=true, gate=pending, executor=none, worker_tasks=5, worker_reports=0, accepted_reports=0",
        "node bin/arckit-runtime.mjs run --project ../.. --packet-file /private/tmp/arckit-packet-preview-fixed.json --adapter dry-run --json",
        "packet-file path summary: validation=true, gate=authorized, executor=desktop_runtime, worker_tasks=5, worker_reports=5 invalid dry-run-adapter reports"
      ],
      "source_projection_check": {
        "source_facts_changed": [],
        "projection_artifacts_changed": [
          "runtime/arckit-runtime/src/agent-orchestrator.mjs",
          "runtime/arckit-runtime/src/cli.mjs",
          "runtime/arckit-runtime/src/desktop-run-manager.mjs",
          "runtime/arckit-runtime/src/validator.mjs",
          "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
          "runtime/arckit-runtime/desktop/renderer/index.html",
          "runtime/arckit-runtime/desktop/renderer/renderer.js",
          "runtime/arckit-runtime/desktop/renderer/styles.css",
          "runtime/arckit-runtime/schemas/runtime-result.schema.json",
          "runtime/arckit-runtime/schemas/worker-packet.schema.json",
          "runtime/arckit-runtime/schemas/worker-report.schema.json",
          "runtime/arckit-runtime/README.md",
          "arckit/cases/active/CASE-20260707-002-implement-arckit-runtime-mvp.md"
        ],
        "source_unknown": false,
        "deferred_projections": [
          "Real ../arckit-demo Desktop Run Codex validation with live Codex app-server worker reports",
          "Ledger writeback after a real done runtime result"
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
    "next_round_goal": "在真实 Codex app-server 环境中用 Desktop Chat 跑通 agentic worker loop，获得可 gate/write-ledger 的 done result。",
    "loop_handoff": {
      "version": "loop-handoff/v1",
      "status": "continue",
      "next_responsibility": "agent",
      "agent_continuation_available": true,
      "human_decision_required": false,
      "trigger_mode": "manual_bridge",
      "responsibility_reason": "下一步仍是 agent 可继续的真实环境验证；不需要人类产品决策，但需要 Codex app-server/model/network 可用。",
      "next_prompt": "启动 Arckit Desktop，选择 ../arckit-demo 或真实项目，先用 Packet Preview 发送一个从 0 开始的开发任务，确认 execution_gate=pending、executor=none、worker_reports=0；再点击 Run Packet 授权同一 packet，用 Run Codex 获取真实 worker reports。观察 Worker Loop 中 controller_state_reader、controller_route_auditor、implementation_worker、verification_worker、closeout_controller 的 reports、merge gate 和 raw events；若 runtime_result=done，则执行 gate 和 write-ledger。",
      "agent_instruction": {
        "goal": "在真实 Codex app-server 环境中用 Desktop Chat 跑通 agentic worker loop，获得可 gate/write-ledger 的 done result。",
        "required_context_refs": [
          "arckit/project/state.record.json",
          "arckit/project/STATE.md",
          "arckit/cases/active/CASE-20260707-002-implement-arckit-runtime-mvp.md",
          "runtime/arckit-runtime/README.md"
        ],
        "required_actions": [
          "Run a real Desktop-started Codex app-server agentic loop.",
          "Verify worker reports, merge gate, raw events, packet authorization, and UI readability.",
          "Gate and write ledger only after a done runtime result."
        ],
        "required_checks": [
          "worker_reports",
          "merge_result",
          "runtime_result_validation",
          "gate_result",
          "ledger_writeback"
        ],
        "stop_condition": "Stop if Codex app-server/model/network is unavailable or worker reports cannot produce a valid runtime result."
      },
      "human_gate": {
        "required": false,
        "reason": "",
        "decision_needed": ""
      },
      "progress_guard": {
        "expected_state_change": "在真实 Codex app-server 环境中用 Desktop Chat 跑通 agentic worker loop，获得可 gate/write-ledger 的 done result。",
        "actual_state_change": "Runtime/Desktop Controller/Worker flow is validated for Packet Preview without fake reports, same-packet authorization path, Controller input interruption, worker packet/report schema, and Desktop structured display; real Codex done result remains pending.",
        "no_progress_limit": 1,
        "max_auto_rounds": 1
      },
      "blocked_reason": ""
    },
    "updated_at": "2026-07-08T13:23:43.000Z"
  }
}
```
