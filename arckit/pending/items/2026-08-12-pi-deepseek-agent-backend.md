# Pi + DeepSeek 作为 Arckit Runtime Agent Backend

## Status

- State: parked
- Type: technical
- Source: 2026-08-12 用户对话与针对 Arckit Runtime、Pi、DeepSeek 官方资料的调研
- Created: 2026-08-12
- Updated: 2026-08-12
- Decision: 记录为候选 Agent Backend，暂不替换 Codex 默认后端，也不承诺实施。

## Background

Arckit Runtime 当前建立在 Codex Agent 之上，由 Runtime 自动化围绕同一 Codex 对话的状态读取、逐 gap 推进、ledger gate、上下文压缩、人工介入与 Git closeout。讨论提出：是否可以把底层 Codex Agent 换成 Pi Agent Harness 与 DeepSeek 模型组合，以验证 Arckit 是否能够成为独立于单一 Agent/模型的 Project State、Case 与 Loop 协作协议层。

## Pending Item

判断并验证 Pi + DeepSeek 是否能够作为 Arckit Runtime 的第二个 Agent Backend，并在满足安全性、会话恢复、结构化结果和执行质量要求后，再决定是否具备替换 Codex 默认后端的条件。

该方向不是单纯切换模型配置，而是同时替换 Agent Harness 与模型：

- Codex Agent/App Server 替换为 Pi RPC 或 Pi SDK。
- Codex 模型替换为 DeepSeek 官方 API 模型。
- Arckit 的 canonical Project/Case/Loop、ledger gates 和状态驱动推进原则保持不变。

## Current Judgment

技术上可行，但不是即插即用替换。更合适的候选路径是保留 Codex 作为参考和默认后端，新增受限的 `pi-rpc` 实验 adapter，通过同一套 Arckit 场景验证跨 Agent 可移植性。

模型接入不是主要问题。主要改造集中在通用 Agent Backend 契约、结构化结果提交、执行安全、人工接管、事件投影与会话绑定。生产替换的首要阻碍是 Pi 没有内置 sandbox；在外部隔离和审批机制建立之前，不应把 Pi + DeepSeek 用作无人监督自动化的默认后端。

## Evidence and Uncertainty

### Accepted Facts

- 当前 Arckit Runtime 依赖一个持久 Codex thread，使用 `thread/resume`、逐 turn 结构化输出、上下文用量、同 thread compaction、operator steer/interrupt 和 same-thread Git closeout。
- 当前代码已有 Agent adapter seam，但默认 adapter、thread binding、`codex.*` 事件、Workbench 文案、人工 CLI 接管和部分 coordinator 路径仍然与 Codex 耦合。
- Pi 提供无头 RPC 与 TypeScript SDK、持久 session、恢复与切换、事件流、steer/follow-up/abort、上下文统计和 compaction。
- Pi 支持 Agent Skills 标准，能够从配置中加载 Codex skill 目录；显式 skill 调用语法与 Codex 不同。
- Pi 原生支持 DeepSeek provider；调研时 DeepSeek 官方 API 模型支持 thinking、tool calls 和 JSON output。
- Pi 官方明确说明其没有内置 sandbox，文件、Shell、扩展与网络能力继承 Pi 进程权限；无人监督运行需要外部容器、VM、micro-VM 或策略控制 sandbox。
- DeepSeek JSON Output 保证有效 JSON 的能力不等同于 Codex 每 turn 的 JSON Schema `outputSchema` 契约；Pi 可通过带参数 schema 的终止工具提交结构化结果。

### Assumptions

- 本讨论中的 DeepSeek 指官方 API，而不是本地部署的蒸馏或量化模型。
- Pi 与 DeepSeek 的组合能够完成基本代码工具调用，但尚未证明其在真实 Arckit Case 中的语义判断质量与 Codex 等价。
- Arckit skills 的主体方法论可以跨 Agent 复用，但触发方式、工具名称和部分宿主能力可能需要兼容层。

### Gaps

- 尚未定义 provider-neutral 的 Agent Backend 接口及 session binding schema。
- 尚未实现 `pi-rpc` adapter、Pi interactive handoff 和通用 `agent.*` 事件投影。
- 尚未为 Agent Loop 和 task closeout 实现 schema 校验的终止提交工具。
- 尚未建立 Pi 的外部 sandbox、workspace/network/credential policy 和人工审批桥接。
- 尚未验证 `$using-arckit` 到 `/skill:using-arckit` 的确定性调用与跨宿主 skill 兼容性。
- 尚未执行 process restart、session resume、80% compaction、stale revision 拒绝、人工介入返回和 Git closeout 等一致性测试。
- 尚未使用真实 Case 对 Codex 与 Pi + DeepSeek 的 gap 选择、实现、验证、自审、成本和稳定性进行对照评估。

### Risks

- Pi 在宿主用户权限下运行，可能破坏 Arckit 所追求的可放心自动化边界。
- DeepSeek 的编码、长程状态判断、工具调用和 skill 遵循质量可能不足，但当前没有项目级实测证据。
- 依赖自由文本或普通 JSON 输出可能产生格式漂移、空内容或无法通过 ledger gate 的结果。
- 过早为单一替代后端重构，可能把 Runtime 从 Codex 耦合转变为 Pi 耦合，而没有形成真正的 Agent Backend 协议。
- Pi 与 DeepSeek 的接口和模型目录可能继续变化，需要版本固定、兼容性探测和回归测试。

## Revisit When

- 准备把 Arckit Runtime 从 Codex 专用实现提升为多 Agent Backend 架构时。
- 出现明确的供应商独立、成本、本地化或模型选择需求时。
- 已具备可复用的 Arckit Agent conformance/evaluation 场景时。
- 已确定 Pi 外部 sandbox 与人工审批的可信实现方案时。
- Codex 后端出现无法满足产品目标的明确限制时。

## Related Areas

- `runtime/arckit-runtime/src/agent-adapter.mjs`
- `runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs`
- `runtime/arckit-runtime/src/agent-orchestrator.mjs`
- `runtime/arckit-runtime/src/state-driven-runner.mjs`
- `runtime/arckit-runtime/src/automation-coordinator.mjs`
- `runtime/arckit-runtime/src/interactive-cli-launcher.mjs`
- `runtime/arckit-runtime/src/projection/run-event-projector.mjs`
- `entry/skills/using-arckit/`
- `entry/skills/arckit-development-ledger/`

## Notes

- 推荐的最小验证不是删除 Codex adapter，而是并行增加一个 `pi-rpc` adapter。
- 候选通用能力包括：start/resume session、run turn、steer、interrupt、context usage、compact、interactive handoff 和 close。
- 候选验证口径包括：同一 canonical state 输入、同一 ledger gate、同一 Case 场景以及可比较的结果证据。

## Outcome

尚未提升为正式技术方案或已承诺工作。
