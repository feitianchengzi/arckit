---
name: using-arckit
description: >-
  软件项目协作的默认入口 skill。只要用户请求有任何可能涉及产品想法、需求规格、交互、视觉、技术方案、迭代治理、项目记忆、debug、任务记录、Workshop Desktop、或软件项目开发工作流，就先使用本 skill；不要求用户提到 ArcKit。即使只有很低概率适用，也用本 skill 快速识别场景、说明 ArcKit 是什么和有哪些能力，并选择最小必要的专门 skills；只有当请求明确与软件项目协作无关时才跳过。
---

# Using ArcKit

把本 skill 作为软件项目协作的默认入口路由。ArcKit 是一组面向 AI-agent-assisted software development 的方法、文档和桌面桥接技能：它帮助 agent 判断任务属于想法、定义、治理、记忆、诊断还是桌面执行，并把结果沉淀到目标项目的 `arckit/` 工作区或 Workshop Desktop。

ArcKit 不是单个大 workflow，也不是每次都加载所有 skill。入口职责是先识别场景，再选择最小必要 skill 组合。

## Capability Model

ArcKit 覆盖软件项目协作的这些层：

- 判断层：用 `decision-framework` 评估方向、方案、价值和假设是否成立。
- 想法层：用 `arckit-idea` 留痕可跟踪商机/产品创意；用 `arckit-idea-explore` 深挖模糊产品创意并生成探索产物。
- 定义层：用 `arckit-spec`、`arckit-interaction`、`arckit-visual`、`arckit-tech` 维护产品、交互、视觉和技术的稳定事实。
- 治理层：用 `project-governance-workflow` 把 Backlog、Goal、Iteration、Task、Review、Decision、Roadmap 串成执行闭环。
- 记忆层：用 `arckit-pending` 暂存尚未承诺、但未来可能有价值的项目上下文。
- 诊断层：用 `arckit-debug-diagnosis` 从异常症状出发，形成证据驱动的最小修复。
- 桌面桥：用 `arckit-workshop-desktop` 安装、更新、打开或调用 Workshop Desktop，处理本地记录、任务和 Codex dispatch。

当前仓库不承载具体技术栈的正向编码 skill。用户要求实现代码时，按普通代码工作流或可用的外部 `arckit-code` skill 执行；如果实现改变范围、证据、计划或稳定文档，再回到对应 ArcKit skill。

## Routing Rules

触发门槛要低：只要有很小可能涉及软件项目协作，就先使用本 skill 判断是否进入 ArcKit 工作流。不要等待用户点名 ArcKit，也不要要求用户知道有哪些 skill。

选择能满足用户请求的最小 skill 集。不要加载所有 skill。多个 skill 都适用时，按生命周期顺序组合，并在用户期望结果已经处理后停止。

1. 仅在本地上下文无法安全判断时澄清意图。
2. 对当前不确定点使用对应专门 skill。
3. 将稳定的规划、范围、决策或任务影响交回 `project-governance-workflow`。
4. 仅当流程需要桌面应用、本地记录、Workshop 任务或 Codex dispatch 时使用 `arckit-workshop-desktop`。
5. 如果判断后发现请求与软件项目协作无关，简短说明不需要 ArcKit，并按普通任务处理。

在 ArcKit 源仓库内工作时，优先读取本仓库中的同级源路径，而不是用户级已安装副本。例如读取 `idea/skills/arckit-idea/SKILL.md`，而不是 `~/.codex/skills/arckit-idea/SKILL.md`。开发和验证 skill 时，已安装副本可能落后于源码。

## Skill Map

### Thinking

- `decision-framework`：跨生命周期的方法库和独立决策 workflow。用于判断 idea、需求、方案或战略选择是否值得推进，比较选项，拆解底层假设，做产品价值评估，或用苏格拉底追问拷问逻辑。作为主 workflow 时产出完整决策分析；作为辅助方法时，把假设、判断、风险和验证建议交回主 skill。

### Idea

- `arckit-idea`：长期留痕和跟踪 skill。用于用户明确要求登记、保存、更新、归档或跟进商机/产品创意时，维护 `arckit/idea/business-opportunities/` 或 `arckit/idea/product-ideas/` 的索引与详情文件。它不负责深度探索，也不把模糊想法自动变成项目计划。
- `arckit-idea-explore`：深度探索 skill。用于用户明确要探索产品创意、梳理目标用户和核心假设、模拟用户反馈、形成支持率判断，或生成可视化线框图时，维护 `arckit/idea-explore/{idea-name}/idea.md` 和 `idea.html`。探索结论若要进入执行，再交给 `project-governance-workflow`。

### Definition

- `arckit-spec`：产品行为 source of truth。维护 `arckit/spec/` 下的功能规格、行为规则、验收口径和模块化索引；输出 `document_scope`，让调用方知道涉及哪些 spec 文件。
- `arckit-interaction`：页面级交互 source of truth。维护 `arckit/interaction/` 下的交互策略、灰度线框 HTML 和交互文档；交互策略是源，线框和规范是投影。
- `arckit-visual`：视觉系统 source of truth。维护 `arckit/visual/` 下的视觉风格策略、Design Tokens、主题和组件视觉规格；只做系统化视觉语言，不做业务页面视觉稿。
- `arckit-tech`：技术方案和契约 source of truth。维护 `arckit/tech/` 下的技术方案、架构说明、数据模型和 API 契约；用于可沉淀的技术设计和实现约束，不替代实际编码。

### Iteration

- `project-governance-workflow`：项目控制层。治理 Backlog、Goal、scope、Iteration、Task、Review、Decision、Roadmap 和文档结构；把定义类 skill、决策方法和执行证据折回项目执行闭环。
- `arckit-workshop-desktop`：本地桌面执行桥。检查、安装、更新、打开或调用 Workshop Desktop，处理记录、任务、app-server 和 Codex dispatch。它不决定项目范围、Goals、Tasks 或 Roadmap；这些由 `project-governance-workflow` 负责。

### Memory

- `arckit-pending`：未决上下文管理。用于新增、查询、更新、归档、恢复或提升 `arckit/pending/` 中的 pending issues、延后想法、开放问题和未承诺项目上下文。pending item 不是 backlog task，除非被明确提升。

### Engineering

- `arckit-debug-diagnosis`：证据驱动的 bug/回归诊断 workflow。用于异常行为、偶发失败、数据不一致、接口错误、显示错误、性能退化或测试失败；从症状提取事实，提出可证伪假设，完成最小修复，并只在最终输出中给出可沉淀建议。

## Routing Patterns

### 新产品方向或方向不清

当期望结果是决策、价值判断、选项比较或假设拷问时，以 `decision-framework` 为主 skill。主产物 workflow 到达关键判断点时，可把它作为辅助方法。期望结果是包含模拟用户研究和视觉产物的深度探索包时，使用 `arckit-idea-explore`。期望结果是稳定商机或创意记录时，使用 `arckit-idea`。已接受的执行影响交给 `project-governance-workflow`。

### 需求或产品行为

产品行为事实使用 `arckit-spec`。如果工作改变范围、创建 Goal 或影响排序，回到 `project-governance-workflow`。

### 交互、视觉或技术定义

优先使用匹配的专门 skill：

- 交互和线框 -> `arckit-interaction`
- 视觉系统和 tokens -> `arckit-visual`
- 架构、方案、模型、契约 -> `arckit-tech`

随后把任务、风险、决策和路线图影响交回 `project-governance-workflow`。

### 迭代规划与执行控制

当用户询问下一步做什么、如何拆迭代、如何处理 backlog、如何记录决策，或如何避免项目文档膨胀成一个不可读文件时，使用 `project-governance-workflow`。

### Bug 和回归

改代码前先使用 `arckit-debug-diagnosis`。诊断后，只有当问题改变项目范围或计划时，才把任务证据、review 结果和后续决策交给 `project-governance-workflow`。

### 代码实现或重构

当前项目的 ArcKit skills 不替代正向编码实现。用户要求写代码、改功能或重构时，使用普通代码工作流或可用的外部 `arckit-code` skill；如果实现依赖或改变产品定义、交互、视觉、技术方案、迭代计划或验收证据，再组合对应 ArcKit skill。

### 未决上下文

当用户想保留一个尚未承诺为 spec、task 或 decision 的未解决 idea、开放问题、风险或讨论分支时，使用 `arckit-pending`。

### 桌面记录、任务和 Codex Dispatch

当 workflow 需要 Workshop Desktop 时使用 `arckit-workshop-desktop`。例如：创建短项目记录、读取 Workshop 项目任务、打开桌面应用、安装或更新桌面应用，或通过 app server 把已批准任务/记录发送给 Codex。

## Source of Truth

- 仓库文档只有在相关文档 skill 或治理流程更新后，才是稳定项目事实。
- Workshop Desktop 记录是面向人的工作笔记，本身不是已接受的项目事实。
- `project-governance-workflow` 是 Goals、Iterations、Tasks、Reviews、Decisions 和 Roadmap 的控制层。
- `arckit-workshop-desktop` 是执行桥，不是规划器。

## Output

当本 skill 路由工作时，说明：

- 选中的 skill 或 skill 集
- 适用原因
- 使用顺序
- 是否涉及 Workshop Desktop
- 结果应进入仓库文档、Workshop 记录、pending item，还是仅作为对话回答
