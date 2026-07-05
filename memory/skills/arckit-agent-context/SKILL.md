---
name: arckit-agent-context
description: 维护项目级 agent 启动上下文、AGENTS.md 长期规则和 durable context 路由。默认由 using-arckit 在用户输入包含长期协作约定、仓库导航规则、事实源读取顺序、后续默认行为或 AGENTS.md 维护需求时路由触发；用户明确点名本 skill、维护本 skill 本身或隔离测试时可直接使用。不保存聊天记录，不替代 arckit/spec、arckit/tech、arckit/interaction、arckit/visual、arckit-pending 或 arckit-workflow-memory。
---

# ArcKit Agent Context

本 skill 维护软件项目的 agent 启动上下文。它把用户在任务中夹带的长期 agent 协作规则、仓库导航规则和事实源路由规则沉淀到正确位置，让人类、单 agent 和多 agent 平台进入项目时能从同一套上下文继续工作。

`AGENTS.md` 是项目启动和路由表面，不是知识库、聊天记忆或需求文档。

## 硬约束

- 只维护高信号、长期有效、项目级或目录级的 agent 操作上下文。
- 不把临时任务约束、原始聊天记录、一次性偏好、未确认推断、产品规则、技术方案、交互事实或视觉事实直接写入 `AGENTS.md`。
- 产品行为进入 `arckit/spec/`；技术方案进入 `arckit/tech/`；交互事实进入 `arckit/interaction/`；视觉事实进入 `arckit/visual/`；未决上下文进入 `arckit/pending/`；工作方式学习进入 `arckit-workflow-memory`。
- 如果 durable context 实际表达的是项目定位、产品概念、技术架构、协作模型、权限边界或长期工作方式源事实变化，不要只写 `AGENTS.md`；必须路由到对应源事实或 pending。`AGENTS.md` 只保存 agent 启动和路由规则投影。
- 当用户输入同时包含长期上下文和即时任务时，先分类和持久化长期上下文，再把即时任务交回原 workflow 继续执行。
- 写入 `AGENTS.md` 时保持短、稳定、可执行、链接驱动；优先合并已有规则，不追加重复段落。
- 发现长期规则可能改变 agent 行为边界、验证策略、事实路由或写入权限时，必须在输出中标明影响和后续确认点。

## 主流程

### 1. 识别 durable context

输入：用户请求、现有 `AGENTS.md`、项目 arckit 文档入口、当前 workflow frame 或 case record。

动作：
- 检查是否出现长期信号，例如“以后”“默认”“始终”“不要再”“这个项目约定”“记住”“沉淀”“下次”“长期”“所有后续”。
- 区分长期上下文、即时任务、临时约束和普通说明。
- 如果没有长期信号但用户明确要求维护 `AGENTS.md`，按显式请求继续。

退出条件：得到待分类的候选上下文；没有候选时返回 `agent_context_update.status=not_applicable`。

### 2. 分类和路由

动作：
- 判断候选内容属于哪一类：
  - `agent_startup_rule`：agent 进入项目时必须知道的读取顺序、仓库导航、操作边界。
  - `context_routing_rule`：不同事实应写入哪个 Arckit surface。
- `workflow_preference`：用户对协作方式、验证方式或 closeout 的长期偏好。
- `source_fact_change`：项目定位、产品概念、技术架构、协作模型、权限边界或长期工作方式等源事实变化，AGENTS.md 只能承接其 agent 启动规则投影。
- `product_fact`、`technical_fact`、`interaction_fact`、`visual_fact`：应交给对应事实源。
  - `pending_context`：有价值但未确认或边界不清。
  - `temporary_constraint`：只适用于本轮，不持久化。
- 选择目标：`AGENTS.md`、对应 Arckit 事实源、`arckit-pending`、`arckit-workflow-memory` 或 no-write。

退出条件：每条候选都有目标、理由和证据成熟度。

### 3. 维护 AGENTS.md

触发条件：分类结果包含 `agent_startup_rule` 或 `context_routing_rule`，且内容已足够稳定。

动作：
- 读取当前 `AGENTS.md`，查找是否已有同义规则。
- 优先更新现有段落；没有合适段落时新增高信号小节。
- 写成 agent 可执行规则，不写讨论过程、用户原话、一次性任务或长解释。
- 若规则只适用于子目录，写清路径范围。
- 若规则和现有规则冲突，停止写入并输出冲突说明。

退出条件：`AGENTS.md` 已更新，或明确说明 blocked/conflict/no-write。

### 4. 交回即时任务

动作：
- 如果用户请求包含即时任务，输出可交给 `using-arckit` 或当前执行 skill 的 `continuation_handoff`。
- 如果内容被路由到其他事实源或 pending，只输出 handoff，不直接替代对应 skill 写入。

退出条件：长期上下文处理结果和即时任务继续方式都已明确。

## 输出格式

```yaml
agent_context_update:
  status: updated | routed | skipped | blocked | not_applicable
  durable_context:
    - text: ""
      classification: agent_startup_rule | context_routing_rule | workflow_preference | source_fact_change | product_fact | technical_fact | interaction_fact | visual_fact | pending_context | temporary_constraint
      target: AGENTS.md | arckit/spec | arckit/tech | arckit/interaction | arckit/visual | arckit/pending | arckit-workflow-memory | no-write
      reason: ""
      evidence_maturity: exploratory | confirmed | formalized
  updated_paths: []
  conflicts: []
  continuation_handoff:
    immediate_task: ""
    suggested_next_skill: ""
    notes: []
```

## 完成标准

- 说明哪些输入被识别为长期上下文，哪些只是临时约束。
- 说明每条上下文写入、路由、跳过或阻塞的理由。
- 更新 `AGENTS.md` 时保持聚焦、稳定、可执行，并避免重复规则。
- 不把产品、技术、交互或视觉事实绕过对应 Arckit 事实源写进 `AGENTS.md`。
