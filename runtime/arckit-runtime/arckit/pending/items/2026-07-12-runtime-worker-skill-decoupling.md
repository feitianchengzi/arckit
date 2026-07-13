# 软件开发场景下的 Runtime、Worker 与 Skill 解耦

## Status

- State: parked
- Type: process_handoff
- Source: 用户与 Agent 架构讨论
- Created: 2026-07-12
- Updated: 2026-07-12
- Decision: 仅记录，暂不执行

## Background

当前 `arckit-runtime` 已经具备 Controller 规划、Worker Packet、Worker Report、Runtime Guard、状态恢复、事件记录与 ledger writeback 等完整 loop runtime 形态。讨论最初考虑将其泛化为支持任意行业的通用 Agent Loop Runtime，随后将范围收窄到软件开发场景，以降低抽象和迁移成本。

## Pending Item

待判断是否在保留 Arckit 软件开发领域模型的前提下，将当前固定 worker 类型与 skill 绑定方式解耦为可配置能力层。

候选结构为：

```text
Arckit Software Development Runtime
├── 固定协议
│   ├── Project State / Case / Loop
│   ├── Packet / Report / Evidence
│   ├── Runtime Guard
│   └── Ledger Writeback
├── 固定安全层
│   └── Execution Classes
└── 可配置能力层
    ├── Worker Profiles
    ├── Skills / Capabilities
    └── Executor Adapters
```

核心候选关系：Worker Profile 表达软件开发中的语义身份和任务倾向；Execution Class 表达稳定的执行权限；Skill 表达可由 worker 动态绑定的能力。Controller 根据当前 Project State、Case、state gap 和证据选择 worker profile 与 skills，Runtime 继续掌握授权、gate、report intake、closeout 和 ledger writeback。

## Current Judgment

限定在软件开发场景后，可以暂时保留现有 Arckit State Store、artifact ownership、source/projection、Project/Case/Iteration ledger 等领域结构，只解耦 worker 语义、权限类别和 skill 绑定。

当前倾向采用 `Worker Profile + Execution Class + Skill` 三层拆分，但尚未形成正式技术决策，也未承诺实现。暂不引入跨行业状态模型、通用 ledger plugin 或固定工作流 DSL。

## Process Handoff

- Kind: architecture_decision_handoff
- Source Skill: arckit-architecture-decision
- Target Candidate Skills: arckit-architecture-decision, arckit-tech
- Source Refs: `README.md`, `src/orchestration/role-definitions.mjs`, `src/capability-registry.mjs`, `schemas/controller-plan.schema.json`, 本次用户与 Agent 讨论

### Accepted Facts

- Arckit 的产品轴保持为 Project State 通过 Case 和 Loop 被持续推进。
- Runtime 继续拥有 loop control、执行授权、结构校验、report intake、Runtime Guard、human gate、closeout 和 ledger writeback。
- Worker 与 Skill 不应被建模为一对一关系；一个 worker 可以组合多个 skills，同一个 skill 也可以被多个 workers 使用。
- 当前 `worker_type` 同时承担语义角色、权限边界和 skill 路由，存在可拆分空间。
- 软件开发范围内无需优先泛化 State Store、artifact ontology 和 ledger writeback。

### Assumptions

- 少量稳定 Execution Classes 足以覆盖主要软件开发 worker 的权限需求。
- Controller 能够根据 Project State 和证据动态选择自定义 Worker Profile，而不需要固定工作流顺序。
- 现有六类 worker 可以迁移为内置默认 profiles，并在兼容期保留旧字段。

### Gaps

- 尚未定义 Worker Profile manifest 的字段和版本协议。
- 尚未确定 Execution Class 的最小集合及权限矩阵。
- 尚未确定 Controller Plan、Worker Packet 和 Worker Report 的兼容迁移方式。
- 尚未验证自定义 worker profile 是否会与 skill 的职责描述重复。
- 尚未用第二组软件开发 worker（例如安全审查或数据库迁移）验证动态选择路径。

### Risks

- Worker Profile 数量膨胀，形成难以治理的角色目录。
- Profile 与 Skill 的职责边界不清，重复表达能力、约束和输出。
- 允许 profile 自定义底层控制权限可能削弱 Runtime Guard。
- 把配置发展为固定 worker 顺序，会使动态 Controller 退化为工作流引擎。
- 过早删除旧 `worker_type` 可能破坏 schema、Desktop 展示和已有 runtime result。

### Rejected Items

- 当前阶段把 Runtime 泛化为跨行业状态机。
- 当前阶段插件化 Arckit State Store、artifact ownership 和 ledger writer。
- 使用配置声明固定的 `product -> tech -> implementation -> verification` 工作流。
- 允许 Worker Profile 绕过 Runtime，直接决定 human gate、Case 关闭或 ledger writeback。

### Suggested Next

- 当准备推进时，先通过 `arckit-architecture-decision` 明确 Worker Profile、Execution Class 和 Skill 的边界。
- 决策确认后，交给 `arckit-tech` 维护正式技术方案和协议。
- 使用现有六类 worker 建立默认 profiles，并增加一个自定义软件开发 profile 作为验证场景。
- 在验证前不拆独立仓库，不改变现有 Runtime 对 Project State、Case、Loop 的所有权。

## Revisit When

- 准备修改 `worker_type`、Controller Plan 或 Worker Packet schema 时。
- 需要让用户为软件开发项目配置自定义 worker 时。
- 需要引入新的执行后端或为不同技术栈组合专用 worker 时。
- 当前六类固定 worker 已明显限制真实软件开发 route 时。

## Related Areas

- `src/orchestration/role-definitions.mjs`
- `src/capability-registry.mjs`
- `src/agent-orchestrator.mjs`
- `schemas/controller-plan.schema.json`
- `schemas/worker-packet.schema.json`
- `schemas/worker-report.schema.json`

## Notes

- 用户要求先将讨论 pending，不执行实现，不提升为正式技术事实。

## Outcome

尚未提升或关闭。
