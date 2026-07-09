# Arckit Runtime 技术方案

## 定位

Arckit Runtime 是 Arckit 的执行控制面。它把原先依赖 agent 自觉遵守的 loop 行为外移为可执行程序，使 Codex、opencode 或多 agent worker 只作为受控执行器参与一轮研发任务。

Runtime 不替代 Arckit skills。Skills 继续承载方法、事实源维护规则、输出契约和模板；Runtime 负责读取状态、选择缺口、编译受控指令、观察执行事件、处理暂停修正、校验结构化结果和回写账本。

## 架构组件

```text
User Input
  -> Runtime Kernel
      -> Controller Reducer
      -> Round Plan
      -> Worker Dispatch
      -> Report Intake
      -> Deterministic Merge
      -> Ledger Gate
      -> Ledger Writeback
      -> Next Control State
  -> Desktop UI
```

Runtime Kernel 是产品级执行内核，不是“启动多个 Codex worker 的壳”。Worker 只执行 bounded task；worker report 只是输入证据。是否接受 report、是否形成可写回的 source fact change claim、是否允许 ledger writeback、下一轮控制状态，都由 Runtime Kernel 的确定性代码负责。

Runtime Kernel 不充当 semantic truth judge。代码不判断产品概念、架构取舍或业务语义是否“真的正确”；这些语义判断来自 bounded Worker、Controller LLM 或人类。Runtime Kernel 负责把这些语义判断压成结构化 claim，并验证 claim 是否满足协议、证据、artifact ownership、human gate 和 ledger gate 条件。

Desktop UI 只展示 Runtime Kernel 的 control state，不自己猜测业务流程。Skills 继续提供能力说明、事实源维护规则和 worker 协议；它们不能替代 Runtime Kernel 做 loop 控制。

Skill layer 位于系统底层。Skills 只承载可复用能力、底层协议、事实源维护规则和 worker 可执行边界，不沉淀 Desktop Runtime 的产品架构、状态机、自动写回策略或控制内核决策。这类上层架构事实只写入 `arckit/tech` 与 runtime 代码。

Runtime 只读取 `arckit.capability.json` 作为能力路由和边界元数据。Runtime 不读取 `SKILL.md` 正文作为控制逻辑来源，也不把 skill 内容注入 worker prompt 来替代 Agent 侧的 skill 加载机制。Codex 类 Agent 在执行 worker packet 时按自身安装的 skill 机制加载和使用允许的 skills。

### Runtime Kernel

Runtime Kernel 当前由以下确定性阶段组成：

- Round State Machine：记录 `planned -> authorized -> workers_running -> reports_collected -> merge_ready -> ledger_gate_ready -> ledger_written -> next_round_ready`，并支持 `blocked`、`human_gate_required`、`external_wait`、`failed` 等控制态。
- Controller Reducer：接收 worker reports，按 packet、role、evidence、risk、unknown、source fact establishment 的协议条件做接受/拒绝/继续判断；它验证 claim 的结构化条件，不替代 LLM 或人类判断语义正确性。
- Artifact Ownership Map：把路径归类为 source fact、projection、runtime log、pending/raw input、implementation evidence 等，避免让 worker 自述决定 source/projection 边界。
- Ledger Stage：当 runtime result 到达 `ledger_gate_ready` 时，先做 deterministic gate；gate 允许则自动写 ledger，gate 阻塞则把原因投影到 UI。

### State Store

State Store 读取目标项目的 Arckit 状态入口：

- `arckit/project/state.record.json`
- `arckit/project/STATE.md`
- `arckit/project/iterations/*.record.json`
- `arckit/cases/INDEX.md`
- `arckit/pending/INDEX.md`
- `arckit/spec/INDEX.md`
- `arckit/tech/INDEX.md`

`state.record.json` 是 canonical record；Markdown brief 只作为 loop 决策摘要。

### Loop Controller

Loop Controller 从 `state_gaps` 和 `loop_control` 选择本轮目标。选择依据优先使用 gap 的 `urgency` 和 `risk`，再回退到 `loop_control.next_transition`。

本轮目标必须形成：

- selected gap
- round goal
- required context refs
- required outputs
- stop conditions

### Capability Registry

Capability Registry 读取 repository 和已安装 skill 中的 `arckit.capability.json` manifest。Manifest 只提供 runtime 可读的能力元数据：

- capability id
- runtime role
- input facts
- outputs
- allowed write targets
- forbidden decisions
- runtime notes

Capability Registry 不把 `SKILL.md` 当作 Runtime 架构事实，也不把 skill 正文作为 Desktop 控制决策输入。

### Prompt Compiler

Prompt Compiler 把项目状态、选中 gap、上下文路径、停止条件和输出 schema 编译成一个 bounded agent instruction。

Prompt Compiler 不要求 agent 自己发现 Runtime 协议；它把本轮必须满足的 packet、report schema、停止条件和 allowed skill ids 显式注入当前 turn。Worker prompt 会把 allowed skill ids 写成显式 `$skill-name` 触发项，但不注入 skill 正文。具体 skill 行为由 Codex 类 Agent 的已安装 skill 包负责。

### Agent Adapter

Agent Adapter 是外部执行器边界。M0 提供 dry-run adapter；M1 已接 Codex app-server stdio JSON-RPC；后续可以接 opencode 或多 agent runtime。

统一 adapter 语义是：

- start or resume a thread
- start a turn
- stream agent events
- steer an active turn
- interrupt an active turn
- return a runtime result

### Event Bus

Event Bus 将执行过程投影给 Supervisor，包括：

- agent message delta
- reasoning summary
- plan update
- tool call
- command execution
- file change
- approval request
- validation result

Runtime 不依赖完整隐藏推理链作为控制接口；它依赖可审计事件、工具行为和结构化结果。

### Policy / Gate Engine

Gate Engine 在高风险状态下中断或阻塞继续执行：

- claim 缺少协议字段或证据
- source facts unknown
- only projection artifacts changed
- artifact ownership map 检测到 projection-only changes
- artifact ownership map 检测到 unknown artifacts
- `human_decision_required=true`
- destructive command
- cross-workspace write
- case closeout without ledger update
- missing artifact impact scan
- missing workflow memory closeout when workflow correction exists

### Validator

Validator 校验 agent 的最终 `arckit-runtime-result/v1`，至少要求：

- `artifact_impact_scan`
- `source_projection_check`
- `validation_evidence`
- `loop_handoff`

`loop_handoff` 必须区分 `next_responsibility` 和 `trigger_mode`。当 `human_decision_required=true` 时，`next_responsibility` 必须是 `human`。

### Ledger Writer

Ledger Writer 负责后续将验证后的结果写回：

- project state delta
- iteration state delta
- development case record
- pending handoff
- workflow memory execution record

Ledger writeback 是 Runtime Kernel 的必经阶段，不依赖 worker 建议。Desktop 执行型 run 在 `round_result=done` 且 `ledger_stage.status=gate_ready` 后会自动运行 gate；gate 允许时自动写 ledger，gate 不允许时保留 blocker 给 UI 和下一轮 Controller 处理。

## M0 实现范围

M0 位于 `runtime/arckit-runtime/`，实现：

- `run --project <path> --dry-run`
- `validate-result --file <path>`
- 状态读取
- gap 选择
- prompt 编译
- runtime result schema
- 本地结构校验
- Codex app-server adapter 占位

M0 的目标是证明 Arckit loop 可以由 runtime 控制，而不是继续依赖单个 agent 自觉阅读 skills。

## 后续里程碑

### M1：Codex app-server supervisor

M1 接入 Codex app-server JSON-RPC，当前实现位于 `runtime/arckit-runtime/adapters/codex-app-server-adapter.mjs`：

- `thread/start`
- `turn/start`
- streamed item notifications
- `turn/steer`
- `turn/interrupt`

Supervisor 提供观察、暂停、修正和中断能力。

CLI 支持：

- `probe-app-server --project <path> --json`：只做 app-server initialize 握手，不启动模型 turn。
- `run --adapter codex-app-server --stream-events`：把 normalized runtime events 作为 JSONL 输出到 stderr。
- `run --adapter codex-app-server --supervise-stdin`：在 turn 运行时接受 `/steer <text>` 和 `/interrupt`。

M1 已验证本地 Codex app-server initialize 握手；真实模型 turn 因会消耗模型调用并可能修改仓库，默认留给人工显式触发。

### M2：Gate 与 ledger writeback

M2 将 gate 和 validator 结果接入 `arckit-development-ledger`，当前实现位于：

- `runtime/arckit-runtime/src/gate-engine.mjs`
- `runtime/arckit-runtime/src/ledger-writer.mjs`

- 自动创建或更新 case
- 校验 loop handoff
- 写入 project state delta
- 渲染 `STATE.md`
- 审计 projection drift

Gate 的写回准入条件：

- `validate-result` 必须通过。
- `round_result` 必须是 `done`。
- `ledger_stage.status` 必须是 `gate_ready`。
- `validation_evidence` 必须非空。
- Runtime 只能验证结构化 claim 的协议、证据和 artifact ownership 条件；语义正确性必须来自 worker evidence、人类确认或后续验证，不由 gate 自行推理。
- `human_decision_required=true`、`next_responsibility=human` 或 `trigger_mode=user_decision` 会阻止自动写回。
- `source_unknown=true` 且只有 projection artifact 变化会阻止自动写回。
- `artifact_ownership_scan.projection_artifacts_changed` 非空且没有 source fact change 会阻止自动写回。
- `artifact_ownership_scan.unknown_artifacts` 非空会阻止自动写回。
- `blocked_projections` 非空会阻止自动写回。
- `changed_files` 不能包含绝对路径、`..` 或空路径。

`write-ledger` 的写回范围：

- 写入 `arckit/project/runtime-results/RUN-*.json` execution record。
- 更新 `arckit/project/state.record.json` 和投影 `STATE.md`。
- 更新 active iteration record、iteration brief 和 `ITERATIONS.md`。
- 更新 active case record 和 `arckit/cases/INDEX.md`。
- 默认支持 `--dry-run` 只输出计划，不改文件。

### M3：Electron Desktop Client

M3 增加本地桌面控制端，当前实现位于：

- `runtime/arckit-runtime/desktop/main.mjs`
- `runtime/arckit-runtime/desktop/preload.cjs`
- `runtime/arckit-runtime/desktop/renderer/*`
- `runtime/arckit-runtime/src/desktop-run-manager.mjs`

Desktop Client 不重新实现 Runtime。它通过 Electron main 进程调用同一个 `bin/arckit-runtime.mjs`，并把运行过程投影成桌面交互：

- 添加本地 Arckit 项目。
- 使用左侧项目列表、中间连续 Chat、右侧 Arckit 状态检查器的三栏工作台。
- 将 Chat session 和 Run 分离：session 是连续对话，run 是某个 session 内的一次执行记录。
- 通过中间 Chat 输入 operator task，并通过 `--task` 注入 supervised turn。
- 空闲时发送 Chat message 会启动 dry-run 或 Codex app-server run。
- 运行中发送 Chat message 会转为 steer。
- 左侧 Chats 列表支持创建新会话；Runs 列表只切换执行详情，不承担会话切换语义。
- 右侧展示 loop_control、top state gap、priority dimensions、normalized loop events 和 gate/write 控制。
- 在运行中发送 interrupt。
- run 完成后如果 runtime result 到达 `ledger_gate_ready`，自动执行 gate-result；gate 允许时自动 write-ledger，gate 阻塞时展示阻塞原因。
- 将项目注册表、run history、result 和 events 存在 Electron userData。

当前 Desktop Client 已验证语法检查、project status 读取、project conversation persistence、run manager dry-run smoke 和 Electron 启动。完整验收还需要用桌面端执行一次真实 Codex app-server run，产出 `round_result=done` 并通过 gate/write-ledger。

### M4：可替换 agent adapter

M4 增加 opencode 或多 agent adapter。Runtime 保持同一 loop 控制面，不把状态选择、事实路由和完成审计交给 worker 自行决定。

## 验收口径

Arckit Runtime 满足方案时表现为：

- 能从 canonical project state 选择下一轮 gap。
- 能生成包含上下文、停止条件和输出 schema 的受控 agent 指令。
- 能实时展示 agent 执行事件，支持 steer 和 interrupt。
- 能展示 Runtime Kernel 输出的 round state、controller reducer result、artifact ownership scan 和 ledger stage。
- 能拒绝缺少 artifact impact scan、source-projection check 或 loop handoff 的结果。
- 能把 LLM/worker 的语义判断限制为结构化 claim，再由代码验证协议、证据、路径归属和门禁条件。
- 能把 agent 续轮、人工决策、外部等待和完成状态区分为不同 loop handoff。
- 能只把 `requires_human_decision=true` 当作人工门禁；`requires_main_agent_decision=true` 进入 Controller Reducer 内部动作，不默认阻塞 closeout。
- 能在不改 agent core 的情况下先接 Codex app-server，并保留 opencode、多 agent adapter 的扩展边界。
