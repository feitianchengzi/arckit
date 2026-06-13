---
name: using-arckit
description: >-
  当用户要启动或协调 Arckit 软件项目工作时使用，尤其是询问该用哪个 skill、描述项目生命周期任务、需要完整软件开发工作流、需要在 idea/spec/interaction/visual/tech/iteration/memory/debug 等 skills 间路由，或希望把 Workshop Desktop 作为桌面任务与记录桥接纳入流程时使用。这是 Arckit 入口 skill，负责选择和编排其他 Arckit skills，避免默认加载全部 skill。
---

# 使用 Arckit

把本 skill 作为 Arckit 软件项目工作的入口路由。Arckit 是方法中心；Workshop Desktop 是可选的桌面桥，用于任务、记录和 Codex dispatch。

## Routing Rules

选择能满足用户请求的最小 skill 集。不要加载所有 skill。多个 skill 都适用时，按生命周期顺序组合，并在用户期望结果已经处理后停止。

1. 仅在本地上下文无法安全判断时澄清意图。
2. 对当前不确定点使用对应专门 skill。
3. 将稳定的规划、范围、决策或任务影响交回 `project-governance-workflow`。
4. 仅当流程需要桌面应用、本地记录、Workshop 任务或 Codex dispatch 时使用 `arckit-workshop-desktop`。

在 Arckit 源仓库内工作时，优先读取本仓库中的同级源路径，而不是用户级已安装副本。例如读取 `idea/skills/arckit-idea/SKILL.md`，而不是 `~/.codex/skills/arckit-idea/SKILL.md`。开发和验证 skill 时，已安装副本可能落后于源码。

## Skill Map

- `decision-framework`：判断 idea、需求、选项或策略是否值得推进；用第一性原理、产品价值评估或苏格拉底追问拷问假设。用户目标是决策时作为主 workflow；其他 skill 到达关键判断点时作为辅助方法。
- `arckit-idea`：当用户要求登记、保存、更新、归档或跟进记录时，在 `arckit/idea/` 中保存和跟踪商机或产品创意。
- `arckit-idea-explore`：围绕产品创意做深度探索，产出假设梳理、模拟用户研究、支持率判断以及 `idea.md` / `idea.html`。
- `arckit-spec`：维护 `arckit/spec/` 下的产品功能规格。
- `arckit-interaction`：维护 `arckit/interaction/` 下的页面级交互策略、线框和交互文档。
- `arckit-visual`：维护 `arckit/visual/` 下的视觉策略、design tokens、主题和组件视觉规格。
- `arckit-tech`：维护 `arckit/tech/` 下的技术方案、数据模型和 API 契约。
- `project-governance-workflow`：治理 Backlog、Goal、scope、Iteration、Task、Review、Decision、Roadmap 和项目文档结构。
- `arckit-pending`：在 `arckit/pending/` 中暂存未解决的项目问题、延后想法和未决上下文。
- `arckit-debug-diagnosis`：基于证据诊断 bug、回归、数据不一致、测试失败或异常行为。
- `arckit-workshop-desktop`：检查、安装、更新、打开或使用 Workshop Desktop 处理记录、任务、app-server 调用和 Codex dispatch。

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
