# 工作流编排与自然沉淀技术方案

更新时间：2026-06-23

## 1. 技术定位

工作流编排与自然沉淀方案为 Arckit 提供一层 workflow memory 和 workflow orchestrator。该层位于 `using-arckit` 与专门 skill 之间，负责把用户任务转化为可执行的 skill 编排框架，并把连续任务轨迹沉淀为 signals、candidates 和经用户确认的 accepted workflows。

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

### 2.3 Workflow Composer

Workflow Composer 在没有匹配 workflow 或匹配置信度不足时生成临时 Workflow Frame。它使用 Arckit 默认场景规则和当前任务证据组合必要 skill。

Composer 生成的 Workflow Frame 至少包含：

- 场景和判断依据。
- 计划使用的 skill 集合。
- skill 执行顺序。
- 每个 skill 的输入和输出。
- 需要用户确认的节点。
- 结果文档落点。
- 验证策略。
- 停止条件。

### 2.4 Workflow Memory Manager

Workflow Memory Manager 由 `arckit-workflow-memory` 承担。它负责任务开始的 memory check、任务结束的 signal capture、多个 signals 后的 candidate maintenance，以及用户确认后的 accepted workflow 写入。

Manager 写入 accepted workflow 前必须确认：

- 证据 signals。
- 适用场景。
- 作用域。
- candidate 内容。
- 与已有 workflow 的关系和冲突。
- 用户确认记录。

Manager 对 signal capture 的收口状态必须明确。每次 Arckit 任务结束、阻塞或失败后，状态只能是：

- `workflow_signal_written`：signal 已写入。
- `workflow_signal_pending_write`：目录不存在、权限不足、工具不可写或需要用户确认，已给出待写入路径和内容。
- `workflow_signal_blocked`：用户明确禁止或拒绝写入 workflow memory。

Manager 必须维护当前会话的 `pending_signal_buffer`。Signal 文件尚未落盘时，buffer 仍作为 candidate evidence。第二条相似 signal 后必须输出 candidate 状态；目录不存在或缺少确认时输出 `workflow_candidate_pending_write`。

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

如果 `~/.arckit/workflows` 尚不存在，系统应把初始化视为 ArcKit 基础状态 bootstrap，而不是跳过沉淀。当前工具权限允许写入时，Manager 直接创建 `user/INDEX.md`、`user/signals/`、`user/candidates/` 和 `user/accepted/`；只有沙箱/工具权限不允许或用户明确禁止外部 workflow memory 时，才输出 bootstrap pending 或 blocked。当用户的写入边界只限制业务代码目录时，Manager 仍可写入用户级 workflow memory。

`INDEX.md` 是每个 workflow memory 作用域的导航索引。Memory check 必须先读取索引内容，再按索引选择 candidate/accepted 文件。索引缺失、过期、为空或未列出已存在文件时，Manager 扫描 `accepted/` 和 `candidates/` 兜底，并把 `index_status` 标记为 `missing|stale|incomplete`。写入或更新 signal、candidate、accepted workflow 后，Manager 必须同步 `INDEX.md`；如果 YAML 文件可写但索引不可写，收口状态必须包含 `workflow_index_pending_write` 或 `workflow_index_blocked`。

## 4. Workflow Schema

Workflow memory 使用 YAML 表达，并分为 signal、candidate 和 accepted workflow。Accepted workflow 基础字段如下：

```yaml
id: bugfix-standard
title: Bug 修复标准流程
scope: user
status: accepted
triggers:
  scenarios:
    - bug-diagnosis
  signals:
    - test-failure
    - regression
priority: 50
steps:
  - id: diagnose
    skill: arckit-debug-diagnosis
    purpose: 复现症状、收集证据、定位根因
  - id: verify
    skill: arckit-verify-implementation
    purpose: 验证最小修复和回归风险
confirmation_points:
  - before_persisting_project_facts
artifact_targets:
  project_facts:
    - arckit/spec
    - arckit/tech
  workflow_memory:
    - ~/.arckit/workflows
stop_conditions:
  - tests_passed
  - user_goal_answered
source_candidate: cand-bugfix-standard
evidence_refs:
  - signals/2026-06-23-notes-helper-bugfix.yaml
version: 1
```

Schema 中的 `skill` 字段引用已安装或当前仓库可用的 skill 名称。Workflow 不复制 skill 正文。Signal 和 candidate 的完整字段由 `arckit-workflow-memory/references/workflow-memory-schema.md` 维护。

## 5. 加载与优先级

工作流加载顺序如下：

1. 当前用户明确要求。
2. 当前对话中已确认但尚未写入的 accepted workflow。
3. 项目级 Workflow Memory。
4. 项目个人 Workflow Memory。
5. 用户全局 Workflow Memory。
6. Arckit 内置默认 workflow。
7. 临时生成 workflow。

同一作用域内使用 `priority` 排序。多个 workflow 同时匹配时，Matcher 选择置信度最高的 workflow；若多个 workflow 可以组合，Composer 生成组合 frame，并保留每个来源的引用。

## 6. 编排流程

`using-arckit` 执行以下编排流程：

1. 读取入口 skill 自身规则和可用 skill 列表。
2. 对用户任务做场景识别。
3. 查询并匹配 Workflow Memory。
4. 生成或采用 Workflow Frame。
5. 读取 Workflow Frame 中需要的 skill。
6. 按顺序执行或交接给对应 skill。
7. 收集每个 skill 的输出摘要、证据和未决项。
8. 根据执行反馈调整当前 Workflow Frame。
9. 任务结束、阻塞或失败时调用 `arckit-workflow-memory` 记录 workflow signal。
10. 如果 memory root 不存在且可写，直接初始化并写入 signal；如果不可写，输出 bootstrap/signal pending write；不能只口头报告未写。
11. 把本轮 signal 加入 pending signal buffer。
12. 第二条相似 signal 后维护 candidate；若 signal 文件尚未落盘或 memory root 不存在，输出 candidate pending write。
13. 每次写入或更新 signal、candidate、accepted workflow 后同步对应 `INDEX.md`；若索引不同步，输出 index pending/blocked 状态。
14. 经用户确认后写入 accepted workflow。

该流程允许入口 skill 从“最小必要 skill 选择”升级为“场景识别和工作流编排器”。

## 7. 自然沉淀流程

自然沉淀流程如下：

1. 系统在每次 Arckit 任务后记录 workflow signal。
2. 用户自然对话中的流程偏好或纠正也作为 signal 或 candidate 证据。
3. 多个相似 signals 指向同一模式时，系统维护 workflow candidate。
4. 系统向用户展示 candidate 摘要、证据、作用域选项和影响。
5. 用户确认后，Manager 写入 accepted workflow。
6. 后续任务匹配 accepted workflow。

未确认 candidate 保留在 candidates 中或作为 pending write，不进入 accepted。

## 8. 项目事实写入

Workflow Memory Manager 不写入产品概念或技术方案。产品和技术事实仍通过结果型 skill 写入目标项目：

- 产品功能和行为规则由 `arckit-spec` 写入 `arckit/spec/`。
- 技术方案、模型和契约由 `arckit-tech` 写入 `arckit/tech/`。
- 未决内容由 `arckit-pending` 保存。
- 治理事实由 `arckit-project-governance-workflow` 保存。

Workflow Frame 可以指定 artifact targets，但实际写入仍由对应结果型 skill 根据 INDEX、域归属和正文规范执行。

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

每次验证收集实际触发 skill、读取文件、执行命令、写入路径、失败点和最终结果，用于评估 workflow 匹配和编排是否符合预期。
