# Loop Engineering Research

## 定位

本文档保存 2026 年 7 月 8 日前后关于三层 loop 与 loop engineering 的研究输入。

本文档不是已经确认的 Arckit 产品需求。它作为 `agentic-software-development/` 模块下的候选材料，供后续产品概念、产品架构、Controller Worker Loop、workflow orchestration memory 或外部 runtime adapter 规格演化时引用。

本文档中的外部观点按来源归档。只有在后续被明确纳入其他规格文档后，才成为 Arckit 的正式产品预期。

## Source Basis

| 来源 | 用途 | 可信度 |
|---|---|---|
| Andrew Ng X post 转录报道，Times of India，2026 | 保存吴恩达关于三层 loop 的公开表达 | 中：非官网原文，但内容具备明确转录语境 |
| Addy Osmani，Loop Engineering，2026 | 保存 loop engineering 的工程组件框架 | 高：作者原文 |
| OpenAI Agents SDK 文档，2026 | 保存 agents、tools、handoffs、guardrails、sessions、tracing、sandbox agents 等 runtime primitives | 高：官方文档 |
| Google ADK Runtime Event Loop 与 Loop Agents 文档，2026 | 保存 event loop、session/state/memory、LoopAgent termination 等运行时结构 | 高：官方文档 |
| LangGraph 文档，2026 | 保存 durable execution、persistence、human-in-the-loop、memory、debugging 等长运行 agent 能力 | 高：官方文档 |
| Anthropic Building Effective Agents，2024-2026 持续引用 | 保存 workflows 与 agents 的工程边界 | 高：官方工程文章 |
| arXiv 2026 loop engineering / graph execution 相关论文 | 保存显式 DAG、planning/execution/recovery 分离等研究趋势 | 中：研究输入，需结合工程实践判断 |

## 吴恩达三层 Loop

吴恩达的三层 loop 描述 0-to-1 产品研发中的反馈节奏，而不是单个 agent 内部的工具调用循环。

三层 loop 包括：

| Loop | 核心动作 | 典型周期 | 人的作用 |
|---|---|---|---|
| Agentic Coding Loop | Coding agent 根据规格、测试和错误反馈持续写代码、运行测试、修复问题 | 分钟级 | 提供规格、约束和可验证目标 |
| Developer Feedback Loop | 开发者检查产品状态，调整功能、UI、用户流、规格和 evals | 十几分钟到数小时 | 注入产品判断和场景上下文 |
| External Feedback Loop | 通过朋友、alpha 用户、线上实验或真实使用数据获得外部反馈 | 小时到天或周 | 判断真实用户反馈对产品方向的影响 |

该模型把人类价值放在上下文优势上。人类理解用户、业务、场景、取舍和目标，Agent 主要加速局部实现与验证循环。

该模型对 Arckit 的直接启发是：Agent loop 不能被视为完整研发闭环。Arckit 需要表达 Agent 执行循环、开发者反馈循环和外部反馈循环之间的接力关系。

## 2026 Loop Engineering 架构

2026 年的 loop engineering 关注点从 prompt 写法转向可复用的工程容器。

一个 loop artifact 通常包含：

| 组成 | 说明 |
|---|---|
| Trigger | loop 启动条件，包括人工输入、定时任务、CI 失败、PR 变化、issue 变化、用户反馈或外部事件 |
| Goal | 本轮要达成的目标，以及目标所属的产品、代码、文档、验证或协作阶段 |
| Constraints | 权限、允许修改范围、禁止触碰范围、成本、风险、上下文读取顺序和人类确认点 |
| Memory | 当前状态、历史事件、长期事实、执行记录、artifact、trace 和恢复入口 |
| Execution Fabric | worktree、sandbox、工具、MCP、connectors、skills、sub-agents 和外部服务 |
| Verifier | 测试、lint、schema、evals、真实环境检查、review agent 或 human checkpoint |
| Stop Rule | 完成条件、最大迭代、失败阈值、升级条件和外部等待条件 |
| Handoff | 完成、继续、阻塞、需要人类或外部等待时的可恢复交接材料 |

该架构把 agent 自主性限制在有触发器、隔离、验证、停止条件、外部记忆和审计轨迹的运行容器内。

## 标准 Loop 流转

标准 loop 流转表现为：

1. Trigger 捕获人工输入、代码事件、运行事件或外部反馈。
2. Loop specification resolver 识别目标、上下文、约束、验证方式和停止规则。
3. Orchestrator 创建 session、分配 worktree 或 sandbox，并绑定 tools、skills、connectors 和 sub-agents。
4. Worker agent 在受限执行环境中执行任务。
5. Tool execution 产生文件变更、命令输出、外部系统结果或运行证据。
6. Verifier 使用确定性检查、review agent、eval 或 human checkpoint 判断结果。
7. Orchestrator 根据验证结果选择 pass、retry、replan、handoff、external wait 或 human escalation。
8. Memory 层记录 trace、artifact、决策、风险、失败原因和下一步恢复入口。

该流转要求执行、验证、停止和恢复全部显式化。长 loop 不依赖聊天上下文保持状态。

## 工程趋势

最新 loop 工程呈现以下趋势：

- Loop specification 成为 prompt 之上的稳定工程对象。
- Automation 成为 loop 的心跳，人工 prompt 不再是唯一启动方式。
- Worktree 或 sandbox 成为并行 agent 执行的默认隔离方式。
- Maker 和 Checker 分离，写代码的 agent 不独自决定完成。
- Memory 从上下文窗口外移到文件、数据库、issue、trace、ledger 或 artifact store。
- Control flow 从隐式 while loop 迁移到显式 graph、DAG 或 workflow。
- Human-in-the-loop 从临时打断变成明确 checkpoint、authorization gate 和 escalation rule。
- Observability 成为默认能力，trace、session、token、成本、失败原因和 artifact lineage 需要可审计。

## 与 Arckit 现有概念的对应关系

| Loop Engineering 概念 | Arckit 现有对应 |
|---|---|
| Trigger | `workflow-orchestration-memory.md` 中的 runtime compiler、turn adaptation 和 workflow patch overlay |
| Goal / Constraints | Controller frame、execution gate、worker packet 和显式约束 |
| Memory | development ledger、pending、agent context、workflow memory 和 spec/tech/interaction/visual 事实源 |
| Execution Fabric | Human Runtime、Desktop Runtime、external agent、外部 adapter 和 skills |
| Verifier | report intake rules、closeout rules、评测集、实现证据和验证证据 |
| Stop Rule | done、continue、needs_human、blocked、external_wait 与 loop handoff |
| Handoff | implementation handoff、pending handoff、Loop Handoff 和 next prompt |

该对应关系说明 Arckit 已经覆盖 loop engineering 的多个结构点，但当前文档需要进一步判断是否要把 trigger、verifier、stop rule 和 memory 组合成更明确的 loop specification artifact。

## 候选产品含义

Loop engineering 对 Arckit 的候选含义包括：

- Arckit 可以把一次协作从“对话轮次”提升为“可恢复 loop”。
- `Loop Handoff` 可以扩展为 loop specification 的输出或中间态，而不只是一轮结束材料。
- `execution_gate` 可以成为 human-in-the-loop 的授权节点，而不是普通确认文案。
- `report_intake_rules` 与 `closeout_rules` 可以承担 verifier 和 stop rule 的产品语义。
- Desktop Runtime 可以成为 Human Runtime 的自动化承载，同时保留相同 Controller Worker Loop 语义。
- Workflow memory 可以记录 loop specification 的候选版本、触发结果和执行反馈。

这些含义仍是候选输入。是否提升为正式产品结构，需要后续在 product concepts、product architecture、controller worker loop 或 workflow orchestration memory 中分别判断。

## 开放问题

- Arckit 是否需要定义独立的 `loop_specification` artifact。
- `Loop Handoff` 与 `loop_specification` 是同一对象的不同阶段，还是两个不同对象。
- Trigger 应该属于 workflow memory、development ledger、Desktop Runtime，还是独立的 runtime adapter 契约。
- Verifier 应该作为通用产品概念，还是只在质量、实现和 closeout 场景中出现。
- External Feedback Loop 应该进入 spec、pending、idea、quality 评测集，还是由外部产品运营系统承接。
- Graph/DAG runtime 是否是 Arckit 的产品语义，还是外部平台的实现细节。

## 引用链接

- https://timesofindia.indiatimes.com/technology/tech-news/google-brain-cofounder-writes-an-open-letter-on-loop-engineering-the-term-made-viral-by-claude-creator-who-said-that-coding-is-dead/articleshow/132230526.cms
- https://addyosmani.com/blog/loop-engineering/
- https://openai.github.io/openai-agents-python/
- https://adk.dev/runtime/event-loop/
- https://adk.dev/agents/workflow-agents/loop-agents/
- https://docs.langchain.com/oss/python/langgraph/overview
- https://www.anthropic.com/engineering/building-effective-agents
- https://arxiv.org/abs/2607.00038
- https://arxiv.org/abs/2604.11378
