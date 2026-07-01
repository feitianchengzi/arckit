# 工作流编排与自然沉淀技术方案

更新时间：2026-06-27

## 1. 技术定位

工作流编排与自然沉淀方案为 Arckit 提供首轮 runtime workflow compiler、turn adaptation gate、workflow memory overlay 和 artifact impact router。该层把用户任务转化为可执行的 skill 编排框架，并把有学习价值的任务轨迹沉淀为 signals、candidates 和经用户确认的 workflow patches。

该方案不改变现有 skill 的文件结构和能力边界。现有 skill 仍通过 `SKILL.md` 描述自身触发条件、职责、工作流和输出契约。新增能力通过入口编排、工作流存储和匹配机制提升多 skill 协作质量。

## 2. 架构组件

### 2.1 Scenario Classifier

Scenario Classifier 识别当前用户任务所属的软件项目协作场景。输入包括用户消息、当前工作目录、目标路径、已读项目文档、错误输出、测试状态和近期对话上下文。

输出包括：

- `scenario`：产品概念、技术方案、功能实现、bug 诊断、代码审查、skill 验证、项目治理、交付运维等。
- `confidence`：场景判断置信度。
- `signals`：触发该判断的关键证据。
- `missing_context`：当前缺失但影响工作流选择的信息。

### 2.2 Workflow Matcher

Workflow Matcher 根据场景和信号查询可用 Workflow Memory。它按作用域优先级加载候选 workflow，并选择最匹配的 workflow。

匹配信号包括：

- 场景标签。
- 用户意图。
- 文件路径和目录类型。
- 项目是否包含 `arckit/` 工作区。
- 是否涉及 skill 创建、安装或验证。
- 是否存在测试失败、日志、错误栈或回归描述。
- 用户在当前对话中的显式流程要求。

### 2.3 Runtime Situation Model

Runtime Situation Model 是编译 workflow frame 前的上下文快照。它至少包含：

- 用户当前目标和显式约束。
- 目标项目路径、项目阶段和是否包含 `arckit/` 工作区。
- 已读事实源、代码证据、错误输出、测试状态和最近对话纠偏。
- 当前缺失但影响 workflow 的上下文。
- 本轮可能产生影响的 artifact domains。

Situation model 不写入长期事实源，但它必须进入 workflow frame，供后续 reflection gates 更新。

### 2.4 Workflow Composer

Workflow Composer 不是复用一份固定 workflow 的执行器，而是 `using-arckit` 的首轮 runtime compiler。它使用 Arckit 默认能力地图、当前 situation model、用户显式要求和 workflow memory overlay 编译本轮 Workflow Frame。

Composer 生成的 Workflow Frame 至少包含：

- 场景和判断依据。
- situation model。
- 计划使用的 skill 集合。
- skill 执行顺序。
- 每个 skill 的输入和输出。
- 需要用户确认的节点。
- 结果文档落点。
- artifact impact scan。
- reflection gates。
- 已应用的 memory patches。
- 验证策略。
- 停止条件。

### 2.5 Turn Adaptation Gate

Turn Adaptation Gate 由 `arckit-turn-adaptation` 承担。它只处理首轮目标之后的用户消息，避免 `using-arckit` 同时承担首轮入口、执行中纠偏、目标切换和记忆判断。

输入包括：

- 后续用户消息。
- 当前或最近的 Workflow Frame。
- 已执行动作和已改文件。
- artifact impact scan 状态。
- 当前验证策略、确认点和停止条件。

输出包括：

- `turn_type`：`supplemental_context|user_workflow_correction|goal_change|artifact_fact_correction|pause_or_stop|clarification_answer`。
- `secondary_signals`：同一条后续消息中的附加信号，尤其用于保留主类型之外的 workflow 纠偏。
- `turn_adaptation_decision`：继续原 frame、重编 frame、更新 artifact routing、停止任务或交给 workflow memory。
- `frame_delta` 和 `artifact_routing_delta`。
- 可选 `workflow_correction_ledger`。

`workflow_correction_ledger` 是 Workflow Memory Manager 的结构化输入，不是项目事实源。字段包括 `correction_text`、`affected_workflow_area`、`scope_hint`、`changed_frame` 和 `default_signal_decision`。只有 workflow 纠偏信号生成 ledger；补充上下文、项目事实纠正和目标切换不会自动变成 workflow signal。若主 `turn_type` 是暂停、换目标或事实纠正，但 `secondary_signals` 包含 workflow 纠偏，仍必须生成 ledger。

### 2.6 Artifact Impact Router

Artifact Impact Router 负责把执行中发现的影响路由到正确事实源。它不由 workflow memory 承担。

| Impact | Target |
| --- | --- |
| 产品行为、验收口径、功能边界 | `arckit-spec` |
| 交互流程、页面状态、线框 | `arckit-interaction` |
| 视觉规则、主题、组件表现 | `arckit-visual` |
| 技术方案、架构、模型、契约 | `arckit-tech` |
| 未决问题、风险、过程 handoff | `arckit-pending` |
| 目标、任务、Review、Decision、Roadmap | `arckit-project-governance-workflow` |
| 实现可靠性、测试、验收证据 | `arckit-verify-implementation` 或对应质量 skill |
| 可改变未来 agent 工作方式的流程经验 | `arckit-workflow-memory` |

Router 在 `after_context_read`、`after_execution` 和 `before_final` 至少各有一次判断机会。没有影响时必须显式标记为 `none` 或 `skipped`。

Router 不按任务规模设置特殊分支。所有任务都按同一组目标逐项判断，不能因为任务只是读取、提交、状态确认或局部机械操作就预设扫描结果。最终输出可以简洁，但必须保留逐项判断结论，并且不能用“没有项目事实变化”替代 workflow memory closeout 判断。

当实现任务涉及 UI 一致性、跨页面行为/样式统一、组件状态统一、从代码抽象规范或通过代码实现反推规范变化时，Router 在进入代码实现前将 `interaction` 和 `visual` 标记为 `check`。代码实现后再根据 diff 和验证证据决定是否升级为 `update`，或保持 `check` 并说明未更新事实源的依据。

### 2.7 Workflow Memory Manager

Workflow Memory Manager 由 `arckit-workflow-memory` 承担。它负责任务开始的 memory check、任务结束的 signal decision、多个 signals 后的 candidate maintenance，以及用户确认后的 accepted workflow patch 写入。

Manager 不负责判断一条原始用户消息是首轮入口、补充信息、目标变更还是 workflow 纠偏。`using-arckit` 只负责识别首轮入口和后续消息交接；首轮之后的消息分类由 `arckit-turn-adaptation` 完成。Manager 消费最终 Workflow Frame、执行证据和可选的 `workflow_correction_ledger`。

Manager 写入 accepted workflow patch 前必须确认：

- 证据 signals。
- 适用场景。
- 作用域。
- candidate patch 内容。
- 与已有 workflow 的关系和冲突。
- 用户确认记录。

Manager 对 workflow memory closeout 的收口状态必须明确。每次 Arckit 任务结束、阻塞或失败后，必须先输出 `signal_decision`，action 只能是：

- `write_signal`：本轮有学习价值，需要写入 signal；写入结果再细分为 `workflow_signal_written`、`workflow_signal_pending_write` 或 `workflow_signal_blocked`。
- `update_candidate_only`：命中已有 candidate，本轮正常成功且没有新信息，只更新 candidate 的轻量验证状态。
- `skip`：命中 accepted workflow patch，本轮完全按预期成功，没有用户纠偏、失败、分歧或新增模式。

Manager 必须维护当前会话的 `pending_signal_buffer`。Signal 文件尚未落盘时，buffer 仍作为 candidate evidence。第二条相似 signal 后必须输出 candidate 状态；目录不存在或缺少确认时输出 `workflow_candidate_pending_write`。Candidate-only update 不创建伪 signal，也不更新 Recent Signals。

当输入包含 `workflow_correction_ledger`，且 ledger 表明用户改变后续验证方式、声明当前项目偏好、要求以后按某种方式执行、指出为什么没有学习/为什么跳过或改变 frame 时，Manager 默认按 workflow-level signal 处理；除非存在完全匹配的 accepted patch 或用户明确说不要记录，否则不能 skip。

当 `workflow_correction_ledger.scope_hint=current_project` 或 signal `scope=project` 时，Manager 默认写入项目级目录 `~/.arckit/workflows/projects/<project-fingerprint>/`。只有项目指纹无法稳定计算、项目级目录不可写，或用户明确要求用户级记忆时，才可降级到 user scope，并必须在 closeout 或 signal notes 中说明原因。

## 3. 存储模型

Workflow Memory 存储在用户级 Arckit 目录中，并按全局和项目作用域拆分。

推荐目录结构：

```text
~/.arckit/
  workflows/
    user/
      INDEX.md
      signals/
      candidates/
      accepted/
    projects/
      <project-fingerprint>/
        INDEX.md
        signals/
        candidates/
        accepted/
```

项目指纹使用稳定项目标识生成。优先使用 Git repository root 和 remote URL；没有 Git 信息时使用绝对路径的稳定哈希。

用户级 workflow 表示跨项目偏好。项目级 workflow 表示特定项目中的协作习惯。项目级 workflow 优先于用户级 workflow。

如果 `~/.arckit/workflows` 尚不存在，系统应把初始化视为 ArcKit 基础状态 bootstrap，而不是跳过沉淀。当前工具权限允许写入时，Manager 直接创建 `user/INDEX.md`、`user/signals/`、`user/candidates/` 和 `user/accepted/`；项目级 signal 需要时再创建对应 `projects/<project-fingerprint>/` 作用域。只有沙箱/工具权限不允许或用户明确禁止外部 workflow memory 时，才输出 bootstrap pending 或 blocked。当用户的写入边界只限制业务代码目录时，Manager 仍可按 signal 作用域写入 `~/.arckit/workflows`。

`INDEX.md` 是每个 workflow memory 作用域的导航索引。Memory check 必须先读取索引内容，再按索引选择 candidate/accepted 文件。索引缺失、过期、为空或未列出已存在文件时，Manager 扫描 `accepted/` 和 `candidates/` 兜底，并把 `index_status` 标记为 `missing|stale|incomplete`。写入或更新 signal、candidate patch、accepted workflow patch 后，Manager 必须同步 `INDEX.md`；如果 YAML 文件可写但索引不可写，收口状态必须包含 `workflow_index_pending_write` 或 `workflow_index_blocked`。

## 4. Workflow Schema

Workflow memory 使用 YAML 表达，并分为 signal、candidate patch 和 accepted workflow patch。Accepted patch 基础字段如下：

```yaml
id: wf-patch-bugfix-standard
type: workflow_patch
title: Bug 修复标准流程补丁
scope: user
status: accepted
triggers:
  scenarios:
    - bug-diagnosis
  signals:
    - test-failure
    - regression
priority: 50
patch:
  add_required_steps:
  - id: diagnose
    skill: arckit-debug-diagnosis
    purpose: 复现症状、收集证据、定位根因
  - id: verify
    skill: arckit-verify-implementation
    purpose: 验证最小修复和回归风险
  add_reflection_gates:
    - after_execution
  artifact_impact_scan:
    spec: check
    tech: check
    pending: check
    verification: check
  artifact_targets:
    - central implementation files
  confirmation_points:
    - before_persisting_project_facts
  stop_conditions:
    - tests_passed
    - user_goal_answered
source_candidate: cand-bugfix-standard
evidence_refs:
  - signals/2026-06-23-notes-helper-bugfix.yaml
version: 1
```

Schema 中的 `skill` 字段引用已安装或当前仓库可用的 skill 名称。Workflow patch 不复制 skill 正文，也不绕过 `using-arckit` 的 runtime compiler。Signal、candidate 和 patch 的完整字段由 `arckit-workflow-memory/references/workflow-memory-schema.md` 维护。

## 5. 加载与优先级

工作流加载顺序如下：

1. 当前用户明确要求。
2. 当前对话中已确认但尚未写入的 accepted workflow patch。
3. 项目级 Workflow Memory。
4. 项目个人 Workflow Memory。
5. 用户全局 Workflow Memory。
6. Arckit 内置默认 workflow。
7. 临时生成 workflow。

同一作用域内使用 `priority` 排序。多个 workflow patches 同时匹配时，Matcher 选择置信度高且不冲突的 patches；若多个 patches 可以组合，Composer 把它们应用到默认能力地图并生成组合 frame。冲突 patch 不直接执行，进入 pending 或要求用户确认。

## 6. 编排流程

`using-arckit` 执行首轮入口编排流程：

1. 读取入口 skill 自身规则和可用 skill 列表。
2. 对用户任务做场景识别。
3. 建立 runtime situation model。
4. 查询并匹配 Workflow Memory patches。
5. 将匹配 patches 应用到默认能力地图，编译 Workflow Frame。
6. 读取 Workflow Frame 中需要的 skill。
7. 按顺序执行或交接给对应 skill。
8. 在 reflection gates 收集每个 skill 的输出摘要、证据和未决项。
9. 首轮之后用户继续发消息时，交给 `arckit-turn-adaptation` 分类，并按 `turn_adaptation_decision` 更新 frame 或路由。
10. 执行 artifact impact scan，并把稳定事实、未决问题、治理影响和流程学习路由到不同 skill。
11. 任务结束、阻塞或失败时调用 `arckit-workflow-memory` 做 closeout；若存在 `workflow_correction_ledger`，一并传入。
12. Signal、candidate、accepted 和 INDEX 的具体维护由 Workflow Memory Manager 执行。

该流程允许入口 skill 从“最小必要 skill 选择”升级为“首轮场景识别和工作流编排器”，同时避免它膨胀为执行中所有消息和记忆判断的总控。

## 7. 自然沉淀流程

自然沉淀流程如下：

1. 系统在每次 Arckit 任务后做 signal decision。
2. 用户自然对话中的流程偏好、纠正、失败、阻塞或新增模式先由 `arckit-turn-adaptation` 分类；workflow 纠偏形成 ledger 后作为 signal 或 candidate 证据。
3. 正常重复命中 candidate 且无新信息时，系统只轻量更新 candidate。
4. 完全按 accepted workflow patch 成功执行且无新信息时，系统跳过写入。
5. 多个相似 signals 指向同一模式时，系统维护 workflow candidate patch。
6. 系统向用户展示 candidate patch 摘要、证据、作用域选项和影响。
7. 用户确认后，Manager 写入 accepted workflow patch。
8. 后续任务匹配 accepted patch，并由 Composer 应用到当轮 workflow frame。

未确认 candidate patch 保留在 candidates 中或作为 pending write，不进入 accepted。

## 8. 项目事实写入

Workflow Memory Manager 不写入产品概念或技术方案。产品和技术事实仍通过结果型 skill 写入目标项目：

- 产品功能和行为规则由 `arckit-spec` 写入 `arckit/spec/`。
- 技术方案、模型和契约由 `arckit-tech` 写入 `arckit/tech/`。
- 未决内容由 `arckit-pending` 保存。
- 治理事实由 `arckit-project-governance-workflow` 保存。

Workflow Frame 可以指定 artifact targets，但实际写入仍由对应结果型 skill 根据 INDEX、域归属和正文规范执行。Artifact Impact Router 只决定是否需要调用目标 skill，不替代目标 skill 的入库规则。

## 9. 安全与一致性约束

Workflow Memory 是 agent 行为偏好，不是不可覆盖的安全策略。它不得覆盖系统权限、工具沙箱、用户当前明确指令和项目事实源边界。

Accepted workflow 写入需要满足以下约束：

- 用户已确认。
- 作用域明确。
- 不把未验证推断写成项目事实。
- 不把项目业务内容写入用户全局 workflow。
- 不把一次临时绕过沉淀为稳定流程。
- 与已有 workflow 冲突时保留冲突说明。

## 10. 验证策略

该方案使用 Skill First 模拟验证。验证场景包括：

- 正向功能开发场景。
- bug 诊断和回归修复场景。
- skill 创建和 skill 验证场景。
- 产品概念到技术方案沉淀场景。
- 用户中途自然调整 workflow 的场景。
- 用户首轮之后补充信息、纠正流程、换目标、纠正项目事实、回答澄清和暂停/停止的 turn adaptation 场景。

每次验证收集实际触发 skill、读取文件、执行命令、写入路径、失败点和最终结果，用于评估 workflow 匹配和编排是否符合预期。
