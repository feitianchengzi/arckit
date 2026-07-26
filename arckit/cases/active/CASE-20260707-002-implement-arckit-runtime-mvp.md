# Implement Arckit Runtime MVP

Case: CASE-20260707-002
Status: active
Artifact Type: code
Selected Gap: none
Updated: 2026-07-26T17:44:09.907Z

## User Intent

拆解并开始实施 Arckit Runtime + Supervisor 方案，先落地可运行的单 agent runtime MVP。

## Structured Record

```json
{
  "schema_version": "development-case-record/v3",
  "id": "CASE-20260707-002",
  "title": "Implement Arckit Runtime MVP",
  "status": "active",
  "artifact_type": "code",
  "created_at": "2026-07-07T15:49:29.148Z",
  "updated_at": "2026-07-26T17:44:09.907Z",
  "user_intent": "拆解并开始实施 Arckit Runtime + Supervisor 方案，先落地可运行的单 agent runtime MVP。",
  "expected_outcome": "Arckit Runtime/Desktop 从单 agent supervised turn 升级为外部确定性多 agent 编排层：Runtime 负责任务拆解、worker 生命周期、report 校验、merge gate 和 ledger hard gate；Desktop 负责项目、会话、Chat、agent loop 状态、暂停/纠偏/继续与证据展示；skills 通过 manifest-declared Agent trigger 或 trusted runtime entrypoint 提供实际语义与执行能力。",
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
      "reason": "Arckit Runtime 作为协议层控制面，投影自 agentic software development 产品概念和用户本轮明确诉求。",
      "evidence": [
        "arckit/spec/agentic-software-development/product-concepts.md",
        "arckit/spec/agentic-software-development/product-architecture.md",
        "arckit/spec/agentic-software-development/skill-architecture.md"
      ],
      "next_transition": ""
    },
    "interaction_expectation": {
      "applicability": "required",
      "maturity": "confirmed",
      "target_maturity": "confirmed",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
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
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/entry/skills/arckit-development-ledger/scripts/project-state.mjs audit /private/tmp/arckit-empty-smoke/arckit/project/state.record.json",
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/entry/skills/arckit-development-ledger/scripts/development-case.mjs validate /private/tmp/arckit-empty-smoke/arckit/cases/active/CASE-20260708-001-initial-arckit-project-loop.md",
        "node --input-type=module -e \"import { createDesktopRunManager } from ./runtime/arckit-runtime/src/desktop-run-manager.mjs; ... empty project smoke ...\"",
        "npm run check",
        "node --input-type=module -e activity smoke",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "node --input-type=module -e detail smoke"
      ],
      "next_transition": ""
    },
    "visual_expectation": {
      "applicability": "required",
      "maturity": "confirmed",
      "target_maturity": "confirmed",
      "alignment": "aligned",
      "target_alignment": "aligned",
      "resolution": "resolved",
      "reason": "Desktop renderer 已提供更清晰的信息层级：左侧是项目和 run，中心是连续 project conversation，右侧是 loop_control、top state gap、priority dimensions、run controls 和 event stream。",
      "evidence": [
        "runtime/arckit-runtime/desktop/renderer/index.html",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css"
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
      "reason": "已新增 Runtime 技术方案，明确 State Store、Loop Controller、Prompt Compiler、Agent Adapter、Event Bus、Gate、Validator 和 Ledger Writer。",
      "evidence": [
        "arckit/tech/arckit-runtime/solution.md",
        "arckit/tech/INDEX.md"
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
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/entry/skills/arckit-development-ledger/scripts/project-state.mjs audit /private/tmp/arckit-empty-smoke/arckit/project/state.record.json",
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/entry/skills/arckit-development-ledger/scripts/development-case.mjs validate /private/tmp/arckit-empty-smoke/arckit/cases/active/CASE-20260708-001-initial-arckit-project-loop.md",
        "node --input-type=module -e \"import { createDesktopRunManager } from ./runtime/arckit-runtime/src/desktop-run-manager.mjs; ... empty project smoke ...\"",
        "npm run check",
        "node --input-type=module -e activity smoke",
        "node --input-type=module -e detail smoke",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs init-project --project /private/tmp/arckit-invalid-ledger-smoke --name InvalidLedgerSmoke --intent ...",
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/entry/skills/arckit-development-ledger/scripts/project-state.mjs audit /private/tmp/arckit-invalid-ledger-smoke/arckit/project/state.record.json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project /private/tmp/arckit-invalid-ledger-smoke --task \"start run should repair invalid ledger\" --dry-run --json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file /private/tmp/arckit-invalid-ledger-run.json",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/capability-registry.mjs",
        "runtime/arckit-runtime/schemas/agent-task.schema.json",
        "runtime/arckit-runtime/schemas/agent-report.schema.json",
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/using-arckit/arckit.capability.json",
        "entry/skills/arckit-development-ledger/arckit.capability.json",
        "node bin/arckit-runtime.mjs run --project ../.. --dry-run --json",
        "desktop-run-manager empty-project agentic dry-run smoke"
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
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/entry/skills/arckit-development-ledger/scripts/project-state.mjs audit /private/tmp/arckit-empty-smoke/arckit/project/state.record.json",
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/entry/skills/arckit-development-ledger/scripts/development-case.mjs validate /private/tmp/arckit-empty-smoke/arckit/cases/active/CASE-20260708-001-initial-arckit-project-loop.md",
        "node --input-type=module -e \"import { createDesktopRunManager } from ./runtime/arckit-runtime/src/desktop-run-manager.mjs; ... empty project smoke ...\"",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "runtime/arckit-runtime/desktop/renderer/index.html",
        "node --input-type=module -e activity smoke",
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "node --input-type=module -e detail smoke",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs init-project --project /private/tmp/arckit-invalid-ledger-smoke --name InvalidLedgerSmoke --intent ...",
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/entry/skills/arckit-development-ledger/scripts/project-state.mjs audit /private/tmp/arckit-invalid-ledger-smoke/arckit/project/state.record.json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project /private/tmp/arckit-invalid-ledger-smoke --task \"start run should repair invalid ledger\" --dry-run --json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file /private/tmp/arckit-invalid-ledger-run.json",
        "runtime/arckit-runtime/src/agent-orchestrator.mjs",
        "runtime/arckit-runtime/src/capability-registry.mjs",
        "runtime/arckit-runtime/schemas/agent-task.schema.json",
        "runtime/arckit-runtime/schemas/agent-report.schema.json",
        "entry/skills/using-arckit/SKILL.md",
        "entry/skills/using-arckit/arckit.capability.json",
        "entry/skills/arckit-development-ledger/arckit.capability.json",
        "node bin/arckit-runtime.mjs run --project ../.. --dry-run --json",
        "desktop-run-manager empty-project agentic dry-run smoke"
      ],
      "next_transition": ""
    }
  },
  "open_questions": [
    {
      "id": "question-1",
      "question": "真实 Codex supervised turn 是否由 Desktop Client 发起，以便用户观察 event stream 并手动测试 steer 与 interrupt。",
      "status": "transferred",
      "owner": "human",
      "evidence": [
        "arckit/cases/active/CASE-20260707-002-implement-arckit-runtime-mvp.md"
      ]
    },
    {
      "id": "question-2",
      "question": "真实 Codex supervised turn 是否需要在非嵌套、网络可用的运行环境中执行，避免 inner turn 的 Responses API 网络被 sandbox 阻止。",
      "status": "transferred",
      "owner": "human",
      "evidence": [
        "arckit/cases/active/CASE-20260707-002-implement-arckit-runtime-mvp.md"
      ]
    }
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
      "id": "handoff-1",
      "target": "next agent round",
      "owner": "agent",
      "status": "pending",
      "resume_condition": "通过 Electron Desktop Chat 发起真实 Codex app-server supervised turn：添加真实项目、发送任务消息、观察右侧状态和 events、用运行中 Chat 消息测试 steer，获得 round_result=done 后执行 gate-result 和 write-ledger。",
      "evidence": []
    },
    {
      "id": "handoff-2",
      "target": "external",
      "owner": "external",
      "status": "completed",
      "resume_condition": "Align the retained Arckit skill set, Runtime capability policy, and current documentation.",
      "evidence": [
        "npm run check",
        "node --test runtime/arckit-runtime/test/capability-registry.test.mjs",
        "JSON parse validation for all retained capability manifests and Runtime capability policy",
        "Active-source removed-skill reference scan",
        "Development ledger project, iteration, and case validation",
        "arckit/cases/closed/CASE-20260726-001-implement-case-driven-definition-completeness-loop.md"
      ]
    }
  ],
  "process_notes": [],
  "rounds": [
    {
      "round": 1,
      "goal": "Implement Arckit Runtime M0.",
      "outcome": "completed",
      "planned_transition": "Implement Arckit Runtime M0.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "npm run check",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --dry-run --json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file /tmp/arckit-runtime-smoke.json"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-25T15:50:58.000Z"
    },
    {
      "round": 2,
      "goal": "Implement Arckit Runtime M1.",
      "outcome": "completed",
      "planned_transition": "Implement Arckit Runtime M1.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "npm run check",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs probe-app-server --project . --json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --dry-run --json > /tmp/arckit-runtime-m1-smoke.json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file /tmp/arckit-runtime-m1-smoke.json"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-25T15:50:58.000Z"
    },
    {
      "round": 3,
      "goal": "实现 Gate Engine 与 ledger writeback，验证无效结果不会写回。",
      "outcome": "completed",
      "planned_transition": "实现 Gate Engine 与 ledger writeback，验证无效结果不会写回。",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "npm run check",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --dry-run --json > /tmp/arckit-runtime-m2-smoke.json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file /tmp/arckit-runtime-m2-smoke.json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs gate-result --project . --file /tmp/arckit-runtime-m2-smoke.json --json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs write-ledger --project . --file /tmp/arckit-runtime-m2-done-fixture.json --dry-run --json"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-25T15:50:58.000Z"
    },
    {
      "round": 4,
      "goal": "Validate real Codex supervised turn, steer, interrupt and gate behavior.",
      "outcome": "completed",
      "planned_transition": "Validate real Codex supervised turn, steer, interrupt and gate behavior.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "npm run check",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file /tmp/arckit-runtime-real-turn-4-last-agent-result.json",
        "arckit/project/runtime-results/RUN-20260707-173823Z-real-supervised-turn/MANIFEST.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-25T15:50:58.000Z"
    },
    {
      "round": 5,
      "goal": "Implement Electron Desktop Client for local project loop control.",
      "outcome": "completed",
      "planned_transition": "Implement Electron Desktop Client for local project loop control.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "npm run check",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project . --task \"desktop client smoke\" --dry-run --json",
        "node --input-type=module -e 'import { createDesktopRunManager } from \"./runtime/arckit-runtime/src/desktop-run-manager.mjs\"; ...'",
        "npm install",
        "npm run desktop"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-25T15:50:58.000Z"
    },
    {
      "round": 6,
      "goal": "Improve Desktop Client into a project-list, chat and state-inspector workspace.",
      "outcome": "completed",
      "planned_transition": "Improve Desktop Client into a project-list, chat and state-inspector workspace.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "npm run check",
        "node --input-type=module -e 'import { createDesktopRunManager } from \"./runtime/arckit-runtime/src/desktop-run-manager.mjs\"; ...'",
        "npm run desktop"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-25T15:50:58.000Z"
    },
    {
      "round": 7,
      "goal": "Fix Desktop chat session semantics and composer layout.",
      "outcome": "completed",
      "planned_transition": "Fix Desktop chat session semantics and composer layout.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "npm run check",
        "node --input-type=module -e 'import { createDesktopRunManager } from \"./runtime/arckit-runtime/src/desktop-run-manager.mjs\"; ...'",
        "npm run desktop"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-25T15:50:58.000Z"
    },
    {
      "round": 8,
      "goal": "Support empty projects from first Desktop chat.",
      "outcome": "completed",
      "planned_transition": "Support empty projects from first Desktop chat.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/src/project-initializer.mjs",
        "runtime/arckit-runtime/src/ledger-scripts.mjs",
        "runtime/arckit-runtime/src/cli.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs init-project --project /private/tmp/arckit-empty-smoke --name EmptySmoke --intent ...",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project /private/tmp/arckit-empty-smoke --task \"Build a simple todo app\" --dry-run --json",
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/entry/skills/arckit-development-ledger/scripts/project-state.mjs audit /private/tmp/arckit-empty-smoke/arckit/project/state.record.json",
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/entry/skills/arckit-development-ledger/scripts/development-case.mjs validate /private/tmp/arckit-empty-smoke/arckit/cases/active/CASE-20260708-001-initial-arckit-project-loop.md",
        "node --input-type=module -e \"import { createDesktopRunManager } from ./runtime/arckit-runtime/src/desktop-run-manager.mjs; ... empty project smoke ...\"",
        "npm run check"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-25T15:50:58.000Z"
    },
    {
      "round": 9,
      "goal": "Improve Desktop run observability for live Codex turns.",
      "outcome": "completed",
      "planned_transition": "Improve Desktop run observability for live Codex turns.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "runtime/arckit-runtime/desktop/renderer/index.html",
        "npm run check",
        "node --input-type=module -e activity smoke"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-25T15:50:58.000Z"
    },
    {
      "round": 10,
      "goal": "Show agent reasoning summaries and execution details instead of JSON-only run cards.",
      "outcome": "completed",
      "planned_transition": "Show agent reasoning summaries and execution details instead of JSON-only run cards.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs",
        "runtime/arckit-runtime/src/desktop-run-manager.mjs",
        "runtime/arckit-runtime/desktop/renderer/renderer.js",
        "runtime/arckit-runtime/desktop/renderer/styles.css",
        "npm run check",
        "node --input-type=module -e detail smoke"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-25T15:50:58.000Z"
    },
    {
      "round": 11,
      "goal": "Repair existing project ledger enum drift before Desktop start-run.",
      "outcome": "completed",
      "planned_transition": "Repair existing project ledger enum drift before Desktop start-run.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "runtime/arckit-runtime/src/project-initializer.mjs",
        "npm run check",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs init-project --project /private/tmp/arckit-invalid-ledger-smoke --name InvalidLedgerSmoke --intent ...",
        "node /Users/Glare/Library/Developer/ModularProgram/feitianchengzi/arckit/entry/skills/arckit-development-ledger/scripts/project-state.mjs audit /private/tmp/arckit-invalid-ledger-smoke/arckit/project/state.record.json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs run --project /private/tmp/arckit-invalid-ledger-smoke --task \"start run should repair invalid ledger\" --dry-run --json",
        "node runtime/arckit-runtime/bin/arckit-runtime.mjs validate-result --file /private/tmp/arckit-invalid-ledger-run.json"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-25T15:50:58.000Z"
    },
    {
      "round": 12,
      "goal": "Fix review findings in Arckit skills and Desktop agentic loop implementation.",
      "outcome": "completed",
      "planned_transition": "Fix review findings in Arckit skills and Desktop agentic loop implementation.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "npm run check",
        "node bin/arckit-runtime.mjs run --project ../.. --dry-run --json",
        "node entry/skills/arckit-development-ledger/scripts/project-state.mjs audit arckit/project/state.record.json",
        "node entry/skills/arckit-development-ledger/scripts/project-iteration.mjs audit arckit/project/iterations/ITER-20260705-001-state-driven-loop-foundation.record.json",
        "node entry/skills/arckit-development-ledger/scripts/development-case.mjs validate arckit/cases/active/CASE-20260707-002-implement-arckit-runtime-mvp.md"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-25T15:50:58.000Z"
    },
    {
      "round": 13,
      "goal": "Optimize using-arckit content around Runtime-first product direction.",
      "outcome": "completed",
      "planned_transition": "Optimize using-arckit content around Runtime-first product direction.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "rg -n \"subagent|skill_declared|round-frame|round-handoff|merge-and-loop|subagent_task|subagent_report|capability-routing.md\" entry/skills/using-arckit",
        "npm run check",
        "node bin/arckit-runtime.mjs run --project ../.. --dry-run --json"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-25T15:50:58.000Z"
    },
    {
      "round": 14,
      "goal": "Reposition using-arckit as one operator-agnostic project loop entry capability.",
      "outcome": "completed",
      "planned_transition": "Reposition using-arckit as one operator-agnostic project loop entry capability.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "rg -n \"Runtime/Desktop|Runtime-first|fallback_protocol|runtime_blocked|manual_orchestrated|desktop mode|operator-specific|subagent|skill_declared\" entry/skills/using-arckit",
        "npm run check",
        "node bin/arckit-runtime.mjs run --project ../.. --dry-run --json"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-25T15:50:58.000Z"
    },
    {
      "round": 15,
      "goal": "Decouple concrete skill descriptions from using-arckit routing.",
      "outcome": "completed",
      "planned_transition": "Decouple concrete skill descriptions from using-arckit routing.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "rg -n \"默认由 using-arckit|由 using-arckit|using-arckit 在|using-arckit.*路由|进入 using-arckit|using-arckit\" entry definition memory engineering thinking -g 'SKILL.md' -g 'openai.yaml' -g '*.md' -g '*.yaml'",
        "rg -n \"description: .*using-arckit|default_from_using_arckit|ledger_source: using-arckit\" entry definition memory engineering thinking -g 'SKILL.md' -g 'openai.yaml' -g '*.md' -g '*.yaml'",
        "npm run check",
        "node bin/arckit-runtime.mjs run --project ../.. --dry-run --json"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-25T15:50:58.000Z"
    },
    {
      "round": 16,
      "goal": "Define and implement the Controller/Worker loop semantics for using-arckit and Desktop.",
      "outcome": "completed",
      "planned_transition": "Define and implement the Controller/Worker loop semantics for using-arckit and Desktop.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "npm run check",
        "node bin/arckit-runtime.mjs run --project ../.. --dry-run --json",
        "node -e dry-run summary: validation=true, controller_frame=v1, execution_gate=pending, executor=none, worker_packets=5"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-25T15:50:58.000Z"
    },
    {
      "round": 17,
      "goal": "Fix Desktop Controller/Worker flow gaps found in review.",
      "outcome": "completed",
      "planned_transition": "Fix Desktop Controller/Worker flow gaps found in review.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "npm run check",
        "node bin/arckit-runtime.mjs run --project ../.. --dry-run --json",
        "dry-run summary: validation=true, gate=pending, executor=none, worker_tasks=5, worker_reports=0, accepted_reports=0",
        "node bin/arckit-runtime.mjs run --project ../.. --packet-file /private/tmp/arckit-packet-preview-fixed.json --adapter dry-run --json",
        "packet-file path summary: validation=true, gate=authorized, executor=desktop_runtime, worker_tasks=5, worker_reports=5 invalid dry-run-adapter reports"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-25T15:50:58.000Z"
    },
    {
      "round": 19,
      "goal": "Separate Controller, Runtime, and Worker capability execution planes.",
      "outcome": "completed",
      "planned_transition": "Separate Controller, Runtime, and Worker capability execution planes.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "npm run check",
        "npm run smoke",
        "JSON parse validation for capability policy and seven retained manifests",
        "YAML parse validation for seven retained agents/openai.yaml files",
        "Development ledger project, iteration, and case validation"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-25T15:50:58.000Z"
    },
    {
      "round": 20,
      "goal": "Make Runtime invoke using-arckit and arckit-development-ledger instead of duplicating their behavior.",
      "outcome": "completed",
      "planned_transition": "Make Runtime invoke using-arckit and arckit-development-ledger instead of duplicating their behavior.",
      "accepted_state_delta": {
        "facets": [],
        "resolved_open_questions": [],
        "completed_handoffs": [],
        "completion_review_result": null,
        "resolved_review_findings": [],
        "review_budget_extension": null
      },
      "evidence": [
        "npm run check",
        "npm run smoke",
        "node --test test/capability-registry.test.mjs",
        "Temporary-project init-project smoke through manifest-resolved development-ledger scripts",
        "Temporary-project project-state audit and development-case validation"
      ],
      "runtime_result_ref": "",
      "occurred_at": "2026-07-25T15:50:58.000Z"
    }
  ],
  "case_resolution": {
    "status": "unresolved",
    "stage": "working",
    "base_ready": false,
    "satisfied": [
      "product_expectation",
      "interaction_expectation",
      "visual_expectation",
      "technical_expectation",
      "implementation_state",
      "verification_state"
    ],
    "remaining": [
      "pending_handoffs"
    ],
    "blocked": [],
    "reason": "Case State still has 1 unresolved area(s).",
    "candidate_gaps": [
      {
        "id": "CASE-20260707-002:handoff:handoff-1",
        "facet": "pending_handoffs",
        "responsibility": "agent",
        "current_state": "pending",
        "target_state": "completed_or_cancelled",
        "next_transition": "通过 Electron Desktop Chat 发起真实 Codex app-server supervised turn：添加真实项目、发送任务消息、观察右侧状态和 events、用运行中 Chat 消息测试 steer，获得 round_result=done 后执行 gate-result 和 write-ledger。",
        "evidence_required": [
          "handoff completion or cancellation evidence"
        ]
      }
    ],
    "loop_handoff": {
      "version": "loop-handoff/v2",
      "status": "continue",
      "next_responsibility": "agent",
      "agent_continuation_available": true,
      "human_decision_required": false,
      "trigger_mode": "manual_bridge",
      "responsibility_reason": "The Case State exposes 1 unresolved candidate gap(s) for Controller selection.",
      "next_prompt": "Continue CASE-20260707-002: inspect candidate_gaps and select one bounded evidence-backed transition.",
      "agent_instruction": {
        "goal": "Select one evidence-backed transition from 1 unresolved Case gap(s).",
        "required_context_refs": [
          "arckit/project/state.record.json",
          "case:CASE-20260707-002"
        ],
        "required_actions": [
          "Select one evidence-backed transition from 1 unresolved Case gap(s)."
        ],
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
        "expected_state_change": "Select one evidence-backed transition from 1 unresolved Case gap(s).",
        "actual_state_change": "",
        "no_progress_limit": 2,
        "max_auto_rounds": 3
      }
    },
    "updated_at": "2026-07-26T17:44:09.907Z"
  },
  "project_impact_candidate": {
    "status": "none",
    "changes": [],
    "evidence": []
  },
  "content_revision": 19,
  "completion_review": {
    "status": "pending",
    "policy": {
      "initial_max_cycles": 3,
      "source": "repository-migration:runtime/arckit-runtime/config/case-policy.json",
      "snapshotted_at": "2026-07-26T17:44:09.907Z"
    },
    "additional_cycles_authorized": 0,
    "cycle_count": 0,
    "reviewed_content_revision": null,
    "dimensions": {
      "correctness": "unknown",
      "completeness": "unknown",
      "minimality": "unknown"
    },
    "findings": [],
    "cycles": [],
    "evidence": [],
    "escalation": null,
    "human_authorizations": []
  }
}
```
