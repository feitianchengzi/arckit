---
name: arckit-project-governance-workflow
description: 治理小团队和 AI 协作中的项目验证与执行循环，维护 Backlog、Goal、Scope、Iteration、Task、Review、Decision、Roadmap 和 Project Plan 产物。默认由 using-arckit 在判断本轮需要项目级归属、推进、分发或验收回写时路由触发；用户明确点名本 skill、维护本 skill 本身或隔离测试时可直接使用。
---

# Project Governance Workflow

把本 skill 作为项目治理层：连接焦点、范围、证据、决策、专家交接和路线图变化。

核心模型：

```text
Backlog + Review + Decision + Roadmap -> Goal Intake
Goal -> Goal Scope
Iteration -> 跨一个或多个 Goals 分配 Tasks
Task -> goal_id + iteration_id
Iteration Review -> Goal Progress Review -> Decision -> Roadmap adjustment
Roadmap -> 对 accepted Goals、proposed Goal candidates、deferred Backlog 和 Decisions 排序
```

## 操作规则

- 把本 skill 用作项目控制层：决定焦点、范围、任务证据、review 结果、decision 和 roadmap 影响。
- 把 `Backlog` 视为原材料，而不是可直接执行的工作。
- 高价值 Backlog 必须先转为 `Goal`，再拆 `Task`。
- 用户提出 Goal 时，先做 Goal Intake：把提议与 active Goals、Backlog、近期 Reviews、Goal Progress、open Decisions、accepted Decisions、约束和当前 Roadmap 校准后再接受。
- 不要仅凭用户措辞创建或接受 Goal。历史证据不足或冲突时，将其保留为 `goal_candidate` 或 `proposed_goal`，并说明需要什么用户确认或证据。
- `Goal` 保持结果导向，且大于单个执行切片：说明为什么现在做、期望结果、成功标准、非目标和剩余不确定性。
- 不要强行把 `Goal` 和 `Iteration` 做成一对一关系。一个 Goal 可跨多个 Iterations；一个 Iteration 可包含多个 Goals 的 Tasks。
- `Iteration` 是时间盒和执行路径，只选择工作，不承载 Goal 的全部意义。
- `Task` 是 Goal 与 Iteration 的连接点。每个 `Task` 必须同时包含 `goal_id` 和 `iteration_id`。
- 如果提议的 Goal 实际只是小实现切片、页面 pass、重构或一次性任务组，把它做成 Iteration theme 或 Task cluster，而不是新 Goal。
- Iteration 混合多个 Goals 时，记录 `primary_goal_id`、`supporting_goal_ids` 和 `reason_for_mix`。
- 每个 Task 必须有 `done_when` 和 `evidence`。
- 用 `Review` 判断继续、调整或暂停。
- Review Iterations 时看执行证据；Review Goals 时看跨 Iterations 积累的进展。
- 当范围变化、风险被接受、重要工作被推迟或 Roadmap 改变时，写入 `Decision`。
- `Roadmap` 是排序层，不是更大的 Goal。它按 `now`、`next`、`later`、`not_now` 排列 accepted Goals、proposed Goal candidates、deferred Backlog 和 Decision outcomes。
- Roadmap items 必须带 `source` 和 `status`。只有用户确认或已有 accepted Decision 支持时，才用 `accepted`；否则用 `proposed`、`deferred` 或 `rejected_or_out_of_scope`。
- 推荐下一个 Goal 时，基于 Backlog、Reviews、Goal Progress、Decisions、Roadmap、约束和近期证据。返回推荐理由、替代项、不确定性和 `required_user_decision`，不要静默改变 active Goal。
- 单个 plan 文件难以扫描、覆盖多个 iterations 或混合历史与下一步执行时，优先使用多文档结构。
- 多文档项目中，index 文件保持短小，并优先编辑最窄相关文档。
- 按信息生命周期和编辑频率治理文档增长：entry、active core、workflow ledgers、reference library、indexes 和 archive 不应承担同一职责。
- entry 和 active-core 文件保持短小，指向源文件，不复制历史证据或长专家分析。
- 将稳定的 domain/product/interaction/architecture 内容路由到 reference 文档；将执行证据和治理状态路由到 workflow ledgers。
- Review 后，把已完成材料从 active views 移到相关 iteration shard 或冷 archive，同时在 indexes 或 source ledgers 中保留 ID 和链接。
- 当过程 skill 返回 `*_handoff` 时，把它翻译到最窄需要的 Backlog、Goal、Scope、Task、Review、Decision、Roadmap 或 document-map 更新中。

## 语言和字段名

- 创建或更新面向用户的文档时，正文、标题、标签、摘要和说明使用用户系统语言。
- macOS 上语言不明确时，用 `defaults read -g AppleLanguages` 查看第一首选语言。
- 将 `zh-Hans` 或 `zh-Hans-CN` 视为简体中文。
- 结构化字段名、ID、文件名、代码符号、YAML keys、JSON keys 和 workflow tokens 保持英文，例如 `goal_id`、`iteration_id`、`done_when`、`evidence`、`*_handoff`、`backlog_candidates`、`decision_candidates`。

## 模式路由

当工作涉及规划、排序、范围、任务证据、reviews、decisions、roadmap 变化或文档维护时，直接使用本 skill。

当主要不确定性深于规划时，先使用专家 skill：

| 需求 | 使用 | 回到本 skill 时转化为 |
| --- | --- | --- |
| 实体、公式、状态、不变量、业务词汇、政策边界 | `arckit-domain-modeling` | decision candidates、capability impacts、scope risks、task candidates |
| 需求草案、用户故事、非能力、验收口径、规格缺口 | `arckit-draft-spec` | capability updates、backlog candidates、scope boundaries、decision candidates |
| 用户反馈、页面层级、信息优先级、原型 walkthrough、交互风险 | `arckit-explore-product-design` | review evidence、backlog candidates、task candidates、decision candidates |
| 架构取舍、ADR、系统拆分、技术风险 | `arckit-architecture-decision` | decision candidates、scope risks、technical task candidates |
| 实现产物修改、测试、试跑、浏览器检查、发布或同步准备 | 对应实现 adapter，例如普通代码工作流、外部 `arckit-code`、Skill First、skill creator 或 ArcForge 类能力 | 先形成带 `artifact_type` 的 `implementation_handoff`；完成后回收 task evidence、Review result、Roadmap adjustment |

过程输出不应成为平行项目计划。把它们的 `*_handoff` 折回 workflow 文档。

## 工作流

1. 从项目、用户笔记、docs、issue lists、roadmap 或 codebase 收集上下文。若存在 document map 或 index，先读它，再只加载相关 artifact files。
   - 如果文档已分散在许多文件中，先按 layer 分类：entry、active core、workflow ledger、reference、index、archive 或无关项目文档。
   - 如果用户询问文档增长、文件夹结构或可维护性，新增内容前先输出 structure audit。
2. 提取 Backlog items，并分类为 Idea、Risk、Question、Feature、Bug、Research、Validation、Task Seed 或 Decision Candidate。
3. 用户设置或改变 Goal 时，运行 Goal Intake：用历史 Backlog、Review、Goal Progress、Decision、constraint 和 Roadmap 证据校准提议后再接受或修订。
4. 合并相关 Backlog items，并选择、更新或推荐最高杠杆的 active Goal 或 Goals。不要因为新 Iteration 开始就创建新 Goal。
5. 定义 Goal scope boundary：
   - `must_have`：验证核心价值所必需
   - `nice_to_have`：有用但不阻塞
   - `non_goals`：本阶段明确不做
   - `risk_controls`：安全、回滚、验证或数据保护需要
6. 将下一个 Iteration 规划为执行切片，包含 theme、review date、selected scope、excluded scope、success criteria、`primary_goal_id`、可选 `supporting_goal_ids` 和 `reason_for_mix`。
7. 尽量从一个或多个 active Goals 中选择 3-5 个 Tasks 进入下一个 Iteration。Tasks 要小到可验证。
8. 基于 task evidence 产出 Iteration Review，再更新每个受影响 Goal 的 Goal Progress。
9. 捕获 Decisions，并按 `now / next / later / not_now` 更新 Roadmap，每项标注 `source` 和 `status`。

## 专家交接

收到专家输出时使用以下映射：

```yaml
*_handoff:
  validated_insight: review evidence、context 或 plan rationale
  backlog_candidates: backlog.md
  decision_candidates: decisions.md
  capability_updates: 先进入 reference/product 或 capability docs，再形成 scope 或 task references
  scope_impact: scopes.md
  task_candidates: 只有 Goal 和 Iteration 清楚后才进入 tasks.md
  review_evidence: reviews.md
  roadmap_impact: roadmap.md
  open_questions: 作为 Question 进入 backlog.md，或作为 Decision Candidate 进入 decisions.md
```

不要把完整专家 artifact 复制到每个项目文件。每项内容放入自己的 home document，并链接到 source artifact。

进入实现前，若用户要求“开始实现”“交给工程”“派发给 Codex/Workshop”或等价表达，先准备最小 `implementation_handoff`：`artifact_type`、`scope`、`source_docs`、`tasks`、`acceptance`、`constraints`、`evidence_expected`。缺少 Goal、Iteration、验收口径或稳定定义时，先补治理或定义，不要直接派发模糊任务。

## 文档和输出路由

让 `SKILL.md` 专注于决定下一步治理动作。只有任务需要细节时才加载 references：

- 标准项目流程、模板、checklists、prompt snippets 或可复用 workflow 文档：读 `references/workflow.md`。
- 文档增长、文件夹层级、archive/index 设计、可扩展布局、检索规则或 Markdown-vs-database 问题：读 `references/multi-document-planning.md`。
- 精确 YAML/Markdown 输出形状、Goal Intake、next Goal recommendation、Roadmap drafts 或 structure audits：读 `references/output-patterns.md`。

默认文档规则：编辑最窄源文档。entry 和 active-core 文件保持短小；历史进入 workflow shards，稳定分析进入 `reference/`，导航进入 `indexes/`，被替代材料进入 `archive/`。

默认增长规则：Markdown 是人类可读 source of truth。只有用户明确希望 workflow data 存入数据库时，才使用生成的 JSON、SQLite 或 search indexes 作为 source of truth；否则它们只是派生视图。

## 参考

当用户要求完整可复用 workflow、模板、checklists、prompt snippets 或项目专属 workflow 文档时，读 `references/workflow.md`。

当用户要求拆分项目计划、维护多文档 planning set、从一个大 plan 文件迁移、控制文档增长、设计文件夹层级、归档旧 iterations，或决定 Backlog、Goal、Iteration、Task、Review、Decision、Roadmap、reference、index、archive artifact 归属时，读 `references/multi-document-planning.md`。

当用户要求精确输出模板、结构化 YAML、Goal Intake、next Goal recommendation、Roadmap draft、Review 格式或 structure audit 格式时，读 `references/output-patterns.md`。
