# Arckit 产品概念主轴与前沿性判断

## Status

- State: promoted
- Type: product
- Source: agent 对话
- Created: 2026-07-09
- Updated: 2026-07-09
- Decision: 已提升为正式产品规格

## Background

用户希望先围绕理论和产品概念探讨 Arckit，不考虑实现问题。讨论上下文包括 2026 loop engineering 调研、吴恩达三层 loop、Arckit 当前 `spec/` 中的 agentic software development 概念，以及项目自身围绕 Runtime/Desktop agentic worker loop 的状态。

本 item 保存当前概念判断，避免把尚未拍板的价值判断、定位风险和产品主轴候选直接写入稳定 spec。

## Pending Item

Arckit 当前需要继续澄清的核心问题是：如何把 `Project State` 通过 `Case` 和 `Loop` 被持续推进这个主轴，转化为稳定产品概念和对外表达。

候选主轴包括：

- `Loop`：Arckit 作为可恢复 agent loop 的协议层，核心价值是让多轮、多 agent、跨会话协作可恢复、可验证、可接手。
- `Case`：Arckit 作为软件研发事项的持续推进系统，核心价值是让每个开发事项有边界、证据、状态和接力材料。
- `Project State`：Arckit 作为项目事实和状态推进系统，核心价值是让项目通过 case 和 loop 持续推进，并避免状态漂移。

当前用户倾向认可的主轴表达是：`Project State` 通过 `Case` 和 `Loop` 被持续推进。该表达能把 project state、development case、loop handoff、worker packet、report intake、ledger 和事实源统一到同一个产品心智中。

## Current Judgment

Arckit 的方向不落后，属于前沿但仍处在产品概念收敛阶段。它不是普通 prompt/skill 库，也不是单一 coding agent，而是在定义人、agent、多 agent 平台围绕同一软件项目事实协作的协议层。

当前产品概念倾向是：Arckit 的最高层对象是 `Project State`；`Case` 是围绕具体研发事项推进项目状态的承载；`Loop` 是人、agent、runtime 或外部平台推动 case 前进并产生可验证状态变化的执行循环。该判断仍需后续在正式 spec 中定义概念关系、边界和验收口径。

### 主要优点

- Arckit 抓住了 AI 辅助软件开发中的真实难点：状态、事实、接力、验证、责任边界和跨轮恢复，而不是只优化 prompt 或增加 agent 数量。
- Arckit 对人的角色理解成熟。人类主要承担上下文、授权、取舍、风险接受和产品判断；agent 负责局部执行、验证和报告。
- 事实源治理是强项。`spec`、`tech`、`interaction`、`visual`、`pending`、`project`、`cases` 和 `workflow memory` 的分工，比把所有上下文塞进 prompt 更可靠。
- `Loop Handoff` 中区分 `next_responsibility`、`trigger_mode` 和 `human_decision_required` 很有价值，能避免把手动触发误判为人类决策，也避免把真正需要人类负责的判断静默交给 agent。
- Arckit 天然适合长期、多角色、跨会话协作。单次任务价值有限，复杂项目中 agent 接手、人类补充、外部平台继续、几天后恢复的场景会放大它的价值。

### 主要问题

- 概念密度过高，用户入口不够锋利。Arckit 同时像 skill repository、agent collaboration protocol、project fact system、workflow memory、runtime controller、handoff framework、development ledger 和 Desktop loop surface。
- 产品心智需要收敛。当前更容易被内部理解为“软件开发协作协议层”，但用户更容易理解的价值表达是“让 AI agent 做过的软件项目工作可以被恢复、验证和接手”。
- 存在过度协议化风险。Frame、gate、handoff、ledger、scan 都合理，但如果所有任务都显性暴露完整仪式，产品体验会变重。
- 核心 artifact 尚未统一。Workflow Frame、Loop Handoff、Controller Frame、Worker Packet、Worker Report、Case、Project State、Runtime Result、Pending Handoff 和 Workflow Memory Signal 之间的主从关系还需要进一步定型。
- External Feedback Loop 仍弱。当前更强的是 agentic coding loop 和 developer feedback loop；真实用户反馈、alpha 测试、线上数据、客户反馈如何进入 spec、pending、evaluation 或 case 仍未清楚。
- 价值表达偏内部系统视角。用户更关心少重复解释、agent 不乱改、中断后能接上、多个 agent 做完后知道谁做了什么、项目长期不漂移、能否放心继续下一轮。
- 边界有扩张风险。Arckit 覆盖 idea、thinking、definition、memory、engineering、quality 和 delivery 时，需要避免变成过宽的全研发操作系统。

## Product Direction Notes

更有差异化的产品楔子不是“全生命周期 AI 软件开发”，而是：

> 长任务 / 多轮任务 / 多 agent 任务的可恢复协作。

面向用户的价值表达可以优先围绕：

- 少重复解释。
- Agent 不越界、不乱改。
- 中断后能继续。
- 多 agent 结果可审计。
- 项目长期状态不漂移。
- 人类判断和 agent 执行边界清楚。

Arckit 的复杂度应该只在复杂任务中显性化。简单任务中，协议层应尽量隐身，只在需要恢复、验证、接力、升级或写回时出现。

## Candidate Concept Model For Confirmation

### 核心命题

Arckit 的产品主轴可以定义为：`Project State` 通过 `Case` 和 `Loop` 被持续推进。

该命题把 Arckit 从“agent 怎么执行任务”提升为“软件项目状态如何在人和 agent 协作中可靠前进”。Agent、skill、runtime、Desktop、handoff、ledger 和 workflow memory 都是推进或保护状态变化的机制，不是最高层产品对象。

### 三个核心对象

#### Project State

`Project State` 是一个软件项目在 Arckit 视角下的当前可恢复状态。它不等同于某个 Markdown 文件、JSON 文件或任务列表，而是由事实源、case、pending、验证证据和工作方式共同表达的项目状态模型。

`Project State` 至少包含以下维度：

- 目标状态：项目当前要解决什么真实软件预期。
- 预期事实状态：产品、交互、视觉、技术、验收口径等是否清楚。
- 实现事实状态：当前软件、skill、workflow 或文档系统实际上是什么。
- 验证状态：哪些预期已经被证据验证，哪些仍缺证据。
- 协作状态：当前谁能继续、下一步由谁负责、如何恢复。
- 风险和未决状态：哪些内容进入 pending，哪些需要外部或人类判断。
- 工作方式状态：哪些协作经验影响后续默认 loop。

`Project State` 的价值是让项目在跨人、跨 agent、跨会话、跨时间后仍能被恢复，而不是依赖上一轮对话记忆。

#### Case

`Case` 是围绕一个具体研发事项推进 `Project State` 的承载单元。它把一个状态缺口、目标状态、边界、证据和推进记录聚合到一起。

一个 `Case` 不是普通待办，也不是所有想法都必须进入 case。只有当一个事项需要被持续推进、验证、接力或关闭时，它才应成为 case。

`Case` 至少回答：

- 当前要推进哪个 project state gap。
- 本事项的目标状态是什么。
- 哪些事实源、pending、约束和证据是依据。
- 哪些动作允许，哪些动作禁止。
- 当前处于规划、执行、验证、等待、人类判断、阻塞还是关闭。
- 关闭后 project state 应如何变化。

`Case` 的价值是让研发事项不漂移。它阻止 agent 把一次 prompt 当成完整项目目标，也阻止多个 loop 之间丢失原始边界。

#### Loop

`Loop` 是推动一个 case 前进并尝试产生可验证状态变化的一次协作循环。它可以由人类手动触发，也可以由 Runtime、Desktop、多 agent 平台或外部事件触发。

一个 `Loop` 不等同于一次模型调用，也不等同于一个 agent 自己的工具循环。它是从触发、恢复上下文、选择目标、执行或等待、验证、接力到生成下一步状态的完整业务循环。

`Loop` 至少回答：

- 本轮为什么启动。
- 本轮推进哪个 case 或 project state gap。
- 本轮允许哪些执行体参与。
- 本轮产生了什么证据、报告、变更、pending 或 handoff。
- 本轮是否实际推进了状态。
- 下一步由 agent、人类、外部系统还是无人继续。

`Loop` 的价值是让推进过程可观察、可停止、可验证、可接手，而不是让 agent 在上下文里无限自转。

### 三者关系

`Project State` 是最高层对象。它表达项目当前在哪里、下一步最值得推进什么、哪些状态已被验证、哪些状态仍不可靠。

`Case` 是 `Project State` 的推进容器。一个 project 可以同时存在多个 active、waiting、blocked 或 closed case。每个 case 应绑定一个或多个明确的 project state gap。

`Loop` 是 `Case` 的推进循环。一个 case 可以经历多个 loop。每个 loop 只能尝试推进当前 case 的一部分状态，不能静默扩大为新的项目目标。

一次正常推进关系是：

```text
Project State 暴露 gap
  -> 创建或选择 Case
  -> Case 定义目标状态、边界和证据要求
  -> Loop 被触发并推进 Case
  -> Loop 产出 evidence / report / change / pending / handoff
  -> Case 判断是否继续、等待、阻塞或关闭
  -> Project State 根据验证后的 state delta 更新
```

### 最小不变量

- 没有 source basis、case 或明确用户授权时，系统不应静默更新 `Project State`。
- 没有明确目标状态、边界和验证口径时，系统不应把一个事项提升为可执行 case。
- 一个 loop 结束时必须说明它对 case 和 project state 的影响：推进、未推进、等待、阻塞、需要人类或完成。
- 一个 loop 不能因为 agent 停止输出就被视为完成；完成必须依赖目标满足和证据通过。
- 一个 case 关闭时必须说明 project state 发生了什么变化，或说明为什么无需状态变化也可以关闭。
- 人类手动触发下一轮不等于人类承担产品判断；`manual_bridge` 和 `human_decision_required` 必须继续分开。
- Pending 信息不能被静默提升为预期事实；它只能作为 case 或 state 更新的候选输入。
- External feedback 不能只作为聊天补充；它必须进入 pending、evaluation、case 或 project state 的某个明确位置。

### 候选生命周期

`Project State` 可以按维度演进，而不是单一全局状态。候选维度状态包括：

- `unknown`：缺少足够事实，无法可靠推进。
- `defined`：目标或事实已被定义，但尚未验证。
- `in_progress`：已有 active case 正在推进该维度。
- `verified`：已有证据支持当前状态。
- `accepted`：用户或协议规则接受该状态作为后续默认依据。
- `stale`：状态可能过期，需要重新验证或恢复。

`Case` 的候选生命周期包括：

- `proposed`：候选事项，尚未确认是否推进。
- `active`：已成为当前推进事项。
- `waiting_external`：等待外部结果或反馈。
- `needs_human`：需要人类判断、授权、取舍或风险接受。
- `blocked`：没有可行下一步，或条件不足。
- `ready_to_close`：已有关闭依据，等待确认或写回。
- `closed`：已完成、放弃、合并或转移。

`Loop` 的候选生命周期包括：

- `planned`：已生成本轮目标和约束。
- `authorized`：执行体已被授权。
- `running`：执行或等待中。
- `reviewing`：结果正在被 intake、验证或合并。
- `done`：本轮目标满足，并产生可定位状态影响。
- `continue`：本轮未完成，但下一步仍由 agent 或 runtime 继续。
- `needs_human`：下一步需要人类真实判断。
- `external_wait`：下一步等待外部系统或系统外操作。
- `blocked`：本轮无法继续。

### 与现有概念的归位

- `Workflow Frame` 是 loop 启动前或执行中的编排框架，不是最高层对象。
- `Loop Handoff` 是 loop 结束时的接力状态，不是 case 本身。
- `Runtime Result` 是一次 loop 的结构化结果证据，不是 project state 本身。
- `Worker Packet` 是 loop 内部派发给执行体的任务边界，不是 case 本身。
- `Worker Report` 是执行体返回给 loop 的证据输入，不直接更新 project state。
- `Ledger` 是 state delta 和 runtime evidence 的写回机制，不定义产品目标。
- `Pending` 是低承诺空间，保存不能直接进入 project state 的风险、假设和候选上下文。
- `Workflow Memory` 只改变未来 loop 的默认组织方式，不承载产品功能事实。

### 候选产品决策

用户授权 agent 基于当前理解自行决策后，当前候选产品决策如下：

#### Decision 1: Project State 是最高层产品对象

`Project State` 是 Arckit 的最高层产品对象。`Case` 和 `Loop` 都服务于 `Project State` 的持续推进。

该决策的理由是：Arckit 的核心价值不是让某个 agent 完成一轮任务，而是让软件项目在跨人、跨 agent、跨会话、跨时间后仍能恢复、判断和继续。只有以 `Project State` 为主轴，spec、tech、pending、case、loop handoff、workflow memory 和 ledger 才能被解释为同一套状态推进系统中的不同支撑对象。

#### Decision 2: Case 只承载需要持续推进的研发事项

`Case` 不承载所有想法、聊天内容或普通上下文。只有当一个事项需要持续推进、验证、接力、等待、阻塞判断或关闭时，它才应成为 case。

普通想法、未确认风险、外部反馈、过程判断和候选方向默认先进入 pending、intake、evaluation 或低承诺空间。它们只有在需要被持续推进时才创建或更新 case。

#### Decision 3: Loop 是业务推进循环

`Loop` 是业务推进循环，不等同于 agent 内部工具调用循环，也不等同于一次模型调用。

一个 loop 从触发和状态恢复开始，到目标选择、执行或等待、结果 intake、验证、接力和下一步状态判断结束。它的核心输出不是“agent 输出了什么”，而是“本轮是否推进了 case 和 project state，以及下一步由谁继续”。

#### Decision 4: Case 关闭必须产生可解释的状态影响

`Case` 关闭必须产生可解释的状态影响。该影响可以是产品、技术、实现、验证、pending 或工作方式上的 project state delta，也可以是明确的 no-change closure。

No-change closure 只在以下情况成立：

- 事项被证明重复、无效、过期或不再需要。
- 事项被合并到另一个 case。
- 事项被明确放弃，并保留原因。
- 事项转移到外部系统或外部责任方。

因此，case 关闭不一定必须改变产品或技术事实，但必须改变项目的可恢复协作状态。系统不能把“agent 停止工作”或“没有更多输出”当成 case 关闭。

#### Decision 5: External Feedback 先进入低承诺入口，再决定是否推进 Project State

External Feedback Loop 不应留在普通对话里，也不应直接写入正式 project state。

外部反馈进入 Arckit 的默认路径是：

```text
external feedback
  -> intake / pending / evaluation sample
  -> triage
  -> create or update case when actionable
  -> loop validates or explores impact
  -> verified state delta updates Project State
```

也就是说，外部反馈先进入低承诺入口，再根据证据和判断进入 evaluation、pending 或 case。只有经过验证、确认或明确接纳后，它才更新 `Project State`。

该决策让吴恩达三层 loop 中的 External Feedback Loop 可以进入 Arckit，但不会污染正式事实源。

### domain_modeling_handoff

```yaml
domain_modeling_handoff:
  domain: Arckit product concept axis
  glossary:
    - Project State: 软件项目在 Arckit 视角下的当前可恢复状态，由事实源、case、pending、验证证据和工作方式共同表达。
    - Case: 围绕一个具体研发事项推进 Project State 的承载单元。
    - Loop: 推动一个 case 前进并尝试产生可验证状态变化的一次协作循环。
  entities:
    - Project State
    - Case
    - Loop
  value_objects:
    - state gap
    - state delta
    - source basis
    - validation evidence
    - loop handoff
    - trigger mode
    - next responsibility
  aggregates:
    - Project State owns state dimensions and indexes active or historical cases.
    - Case owns goal, scope, evidence requirements, loop history and closeout decision.
    - Loop owns trigger, execution boundary, reports, validation result and handoff.
  domain_events:
    - state_gap_detected
    - case_created
    - loop_triggered
    - worker_report_received
    - loop_closed
    - case_closed
    - project_state_updated
    - external_feedback_received
  commands:
    - select_state_gap
    - open_case
    - trigger_loop
    - intake_loop_result
    - write_state_delta
    - request_human_decision
    - park_pending_context
  invariants:
    - Project State 不在缺少 source basis、case 或用户授权时静默更新。
    - Case 不在缺少目标状态、边界和验证口径时进入执行。
    - Loop 结束时必须声明对 Case 和 Project State 的影响。
    - Case 关闭时必须说明 Project State 变化或无变化关闭理由。
    - manual_bridge 不等于 human_decision_required。
  state_transitions:
    - Project State dimension: unknown -> defined -> in_progress -> verified -> accepted
    - Project State dimension: accepted -> stale
    - Case: proposed -> active -> ready_to_close -> closed
    - Case: active -> waiting_external | needs_human | blocked
    - Loop: planned -> authorized -> running -> reviewing -> done
    - Loop: reviewing -> continue | needs_human | external_wait | blocked
  bounded_contexts:
    - Product concept context: 定义 Project State、Case、Loop 的产品语义。
    - Fact governance context: 管理 spec、tech、interaction、visual、pending 和 workflow memory 的边界。
    - Collaboration context: 管理 handoff、next responsibility、trigger mode 和 human gate。
    - Runtime context: 承载 loop execution，但不决定产品主轴。
  open_questions:
    - Project State 的维度集合是否需要固定，还是按项目动态扩展。
    - External Feedback Loop 的 intake、pending、evaluation 和 case 分流规则需要后续正式定义。
    - Case granularity 的最小边界是什么。
    - Loop 与 Workflow Frame 的关系是否需要在正式 spec 中重命名或合并。
  downstream_candidates:
    - arckit-spec
    - arckit-tech
```

## Revisit When

- 准备重写 Arckit 的产品定位、README、首页叙事或 pitch。
- 准备把 loop engineering research 提升为正式产品概念。
- 准备统一 `Loop`、`Case`、`Project State`、`Loop Handoff` 和 `Runtime Result` 的概念关系。
- 准备设计 External Feedback Loop 如何进入 Arckit。
- 准备判断 Arckit 是协议层、runtime 控制面、项目状态系统还是完整研发操作层。

## Related Areas

- `arckit/spec/agentic-software-development/product-concepts.md`
- `arckit/spec/agentic-software-development/product-architecture.md`
- `arckit/spec/agentic-software-development/controller-worker-loop.md`
- `arckit/spec/agentic-software-development/loop-engineering-research.md`
- `arckit/spec/workflow-orchestration-memory.md`
- `arckit/project/STATE.md`

## Notes

- 本 item 是产品概念判断，不是实现计划。
- 本 item 不承诺新增功能、不创建 backlog task、不要求立即修改 spec。
- 2026-07-09：用户表示“`Project State` 通过 `Case` 和 `Loop` 被持续推进”比较符合预期，本 item 从 parked 调整为 candidate。
- 2026-07-09：补充 `Project State / Case / Loop` 候选概念模型、生命周期、不变量、现有概念归位和 domain_modeling_handoff，等待用户统一确认。
- 2026-07-09：用户授权 agent 对待确认点自行决策；补充五项候选产品决策，仍不提升为正式 spec。

## Outcome

已于 2026-07-09 提升到：

- `../spec/agentic-software-development/product-concepts.md`
- `../spec/agentic-software-development/product-architecture.md`
- `../spec/agentic-software-development/controller-worker-loop.md`
