# Multi-Document Planning

当项目计划已经不适合放在一个文件中，或用户要求拆分、重组、长期维护规划文档时，使用本参考。

## 目录

- [何时拆分](#何时拆分)
- [文件夹分层](#文件夹分层)
- [推荐布局](#推荐布局)
- [粒度规则](#粒度规则)
- [分层检索](#分层检索)
- [Context Hygiene](#context-hygiene)
- [Artifact Homes](#artifact-homes)
- [迁移步骤](#迁移步骤)
- [Growth Triggers](#growth-triggers)
- [Growth Steps](#growth-steps)
- [Update Routing](#update-routing)
- [Quality Checks](#quality-checks)

## 何时拆分

满足以下任一条件时，拆分单一计划文件：

- 文件已经难以扫描，或经常超过几百行。
- 多个 iterations 或 MVP 阶段混在一起。
- Tasks、decisions、reviews 和 roadmap changes 都在同一位置编辑。
- 用户要求更清晰的文档归属，或希望未来 agent 更容易接续。

如果项目仍然很小、生命周期很短，或主要只是一次性 planning note，可以继续保持一个文件。

## 文件夹分层

先按信息生命周期和编辑频率组织，再决定文件名：

| 层级 | 典型文件 | 应放内容 | 不应放内容 |
| --- | --- | --- | --- |
| Entry | `docs/project-plan.md`，可选 `docs/project/README.md` | 简短当前焦点、文档地图、编辑规则。 | 完整历史、任务证据、长分析。 |
| Active core | `docs/project/current.md` | Active Goals、当前/下一轮 Iteration、活跃 task 顺序、open gates、当前 Roadmap 摘要。 | 已完成 iterations、旧 reviews、完整 task 正文、历史 roadmap 状态。 |
| Workflow ledgers | `backlog.md` 或 `workflow/backlog/*`、`plans.md` 或 `workflow/goals/*`、`scopes.md` 或 `workflow/scopes/*`、`iterations.md` 或 `workflow/iterations/*`、`decisions.md` 或 `workflow/decisions/*`、`roadmap.md` 或 `workflow/roadmap/*` | 治理对象和证据的 source of truth。 | 持久 domain/product/architecture 长文。 |
| Reference library | `reference/domain/`、`reference/product/`、`reference/interaction/`、`reference/architecture/`、`reference/data/`、`reference/prototypes/` | 长期有效、用于支撑 workflow 的专家知识。 | 活跃 task 状态，未路由的 decision candidates。 |
| Indexes | `indexes/id-registry.md`、`indexes/active-task-index.md`、`indexes/decision-index.md`、`indexes/document-map.md` | 导航、查找、跨文件指针。 | 原始 decisions、task evidence、requirements 正文。 |
| Archive | `archive/superseded/`、`archive/exports/`，可选冷存储文件夹 | 被替代计划、生成导出、旧快照、正常检索不再需要的冷材料。 | 活跃工作、未解决 decisions、规范 iteration shards。 |

## 推荐布局

当 planning set 已经多文档化、但仍然容易扫描时，使用标准布局：

```text
docs/project-plan.md
docs/project/current.md
docs/project/context.md
docs/project/backlog.md
docs/project/plans.md
docs/project/scopes.md
docs/project/iterations.md
docs/project/tasks.md
docs/project/reviews.md
docs/project/decisions.md
docs/project/roadmap.md
docs/project/reference/
docs/project/archive/
docs/project/indexes/
```

`docs/project-plan.md` 应保持短小。它只解释当前焦点、链接 artifact files，并说明编辑规则。当标准 artifact files 变长后，`current.md` 会很有用；其中只保留 active Goals、current/next Iteration、active Tasks、open Decisions 和 current Roadmap。

当 `docs/project/` 已经拥挤、reference docs 很多、workflow ledgers 难以维护，或用户要求无限增长和分层检索时，使用规范可扩展布局：

```text
docs/project-plan.md
docs/project/
  README.md
  current.md
  workflow/
    backlog/
      index.md
      open.md
      deferred/YYYY-QN.md
      closed/YYYY-QN.md
    goals/
      index.md
      G-012.md
    scopes/
      index.md
      G-012.md
    iterations/
      index.md
      I-012/
        plan.md
        tasks.md
        review.md
        evidence.md
    decisions/
      index.md
      open.md
      2026/
        D-047.md
    roadmap/
      current.md
      history/2026-Q2.md
  reference/
    domain/
    product/
    interaction/
    architecture/
    data/
    prototypes/
  indexes/
    id-registry.md
    active-task-index.md
    decision-index.md
    document-map.md
    retrieval-guide.md
  archive/
    superseded/
    exports/
```

不要只因为美观迁移既有 flat layout。如果链接已经依赖根级文件，先增加 `reference/README.md`、`indexes/id-registry.md` 和 `archive/README.md`；然后只移动确实造成检索或编辑问题的区域。

在可扩展布局中，每个增长关注点都有 shard key：

| 关注点 | 分片键 | 活跃视图 |
| --- | --- | --- |
| Backlog | status + quarter | `workflow/backlog/open.md` |
| Goal | `G-*` | `workflow/goals/index.md` 和 `current.md` |
| Scope | `G-*` 或 `I-*` | `workflow/scopes/index.md` 和 `current.md` |
| Iteration plan、Goal mix、tasks、review、evidence | `I-*` | `workflow/iterations/index.md` 和 `current.md` |
| Decision | year + `D-*` | `workflow/decisions/open.md` |
| Roadmap | 当前排序加季度历史 | `workflow/roadmap/current.md` |
| Reference | area + topic | `reference/<area>/README.md` |

## 粒度规则

不要让每个 ID 都单独成文件。文件边界应该降低检索和编辑成本；过多小文件会制造另一种维护问题。

默认规则：

| 产物 | 默认位置 | 何时创建独立文件 | 何时避免独立文件 |
| --- | --- | --- | --- |
| Backlog item `B-*` | 保留在 `workflow/backlog/open.md`、`deferred/YYYY-QN.md` 或 `closed/YYYY-QN.md`。 | 它是大型研究 brief、风险调查、客户/来源记录，或在提升前会被多次引用的 epic。 | 它只是短原始想法、重复项、问题、task seed 或低上下文笔记。 |
| Goal `G-*` | 可扩展布局中，一个活跃/重要 Goal 一个文件。 | 它有 success criteria、non-goals、scope impact，或跨多个 iterations。 | 它只是小 planning note，或已关闭且没有未来检索价值。 |
| Scope | 每个 `G-*` 一个文件；偶尔每个 `I-*` 一个文件。 | 边界包含实质 tradeoffs、risk controls 或会被其他文件引用的 non-goals。 | 它只是在复述当前 iteration plan。 |
| Iteration `I-*` | 每个 iteration 一个文件夹，包含 `plan.md`、`tasks.md`、`review.md` 和可选 `evidence.md`。 | 对重复执行默认使用这种方式，因为它能限制 task 和 review 增长。`plan.md` 应包含 `primary_goal_id`、可选 `supporting_goal_ids` 和 `reason_for_mix`。 | 项目仍是一次性计划，没有重复 iterations。 |
| Task `T-*` | Tasks 放在 iteration 的 `tasks.md` 中。 | 某个 task 是 mini-spec、research packet 或 evidence bundle，太大不适合任务列表；从 `tasks.md` 链接它。 | 它是普通可执行项，只有 `done_when` 和短 evidence。 |
| Decision `D-*` | 已接受 decision 每个一个文件；候选项留在 `open.md`。 | decision 改变范围、接受风险、推迟重要工作、改变公式/政策，或影响 Roadmap。 | 它只是未解决候选项或小笔记。 |
| Review | 保留在 iteration 文件夹中。 | Evidence 大到需要 `evidence.md` 或附件。 | 它只是简短 closeout。 |
| Reference topic | `reference/<area>/` 下每个稳定 topic 一个文件。 | Topic 有长期价值，会被多个 workflow items 引用。 | 它只是临时执行证据或未解决 decision。 |

Backlog 的谨慎默认是先收集，而不是每个 item 一个文件。先把 Backlog item 提升成 Goal、Decision、Reference topic 或 Iteration task，再给它持久独立归属。

## 分层检索

使用以下读取顺序，避免未来 agent 扫描整个 planning tree：

1. Entry：读取 `docs/project-plan.md` 或 `docs/project/README.md`。
2. Active state：读取 `docs/project/current.md`。
3. Index lookup：读取 `indexes/retrieval-guide.md`、`indexes/id-registry.md` 或 `indexes/active-task-index.md`。
4. Source shard：读取精确 workflow shard，例如 `workflow/iterations/I-012/tasks.md`、`workflow/goals/G-012.md` 或 `workflow/decisions/2026/D-047.md`。
5. Reference support：只读取被链接的 `reference/<area>/<topic>.md` 文件。
6. Cold history：只有 active files 指向 archive，或用户要求历史上下文时，才搜索 `archive/`。

当项目文件多到检索路径不明显时，创建 `indexes/retrieval-guide.md`。它应列出常见问题和查找位置，例如：

| 问题 | 起点 | 然后读取 |
| --- | --- | --- |
| 下一步做什么？ | `current.md` | `workflow/iterations/<current>/tasks.md` |
| 为什么选择这个范围？ | `workflow/scopes/<goal>.md` | 链接的 decisions |
| Review 后改变了什么？ | `workflow/iterations/<id>/review.md` | `workflow/roadmap/current.md` |
| 这个 ID 在哪里？ | `indexes/id-registry.md` | source shard |

## Context Hygiene

只要默认上下文有边界，文档增长就是可接受的。风险不是旧文件存在，而是在当前执行任务中无状态边界地读入旧计划、原始 backlog、被替代 decisions 和历史 reviews。

使用以下控制：

- 默认读取集：entry file、`current.md`、相关 index 和精确 workflow shard。
- 非默认读取集：完整 backlog、review history、decision history、reference library 和 archive。
- 只在历史问题、来源检查，或 active source 链接到 archive 时读取 archive。
- 使用历史材料前先标记状态：`active`、`open`、`deferred`、`closed`、`superseded` 或 `reference`。
- 将仍然有效的历史影响提升到 live source：`current.md`、当前 Scope、accepted Decision 或 current Roadmap。
- 不要通过平均旧计划和新计划来推断当前方向。如果 source status 冲突，优先 active core 和 live source shards；状态不清楚时说明不确定性。

常见 context contamination patterns：

| Contamination | 预防方式 |
| --- | --- |
| Raw Backlog 变成可执行工作 | Task 前必须先有 Goal 和 Iteration。 |
| Goal 变成 Iteration wrapper | Goal 保持结果导向；一次执行切片使用 Iteration theme 或 Task cluster。 |
| Iteration 静默混合多个 Goals | 要求 `primary_goal_id`、`supporting_goal_ids` 和 `reason_for_mix`。 |
| 用户提出的 Goal 绕过历史 | 接受前用 Backlog、Review、Goal Progress、Decision、constraints 和 Roadmap 做 Goal Intake。 |
| Roadmap 变成更大的 Goal | Roadmap 只对 Goals、Goal candidates、deferred Backlog 和 Decisions 排序；不要直接从 Roadmap 拆 tasks。 |
| AI 生成的 Roadmap 看起来已承诺 | 要求 `source` 和 `status`；除非用户确认或已有 accepted Decision，否则使用 `proposed`。 |
| 被替代计划看起来像当前计划 | 将 superseded files 放入 archive，并在 indexes 中标记。 |
| 旧 Review 噪声遮蔽当前下一步 | 保持 `current.md` 短小，并通过 active iteration shard 路由下一步。 |
| Reference prose 变成 shadow plan | 只把治理后果路由到 Backlog、Scope、Decision、Task、Review 或 Roadmap。 |
| 重复摘要互相冲突 | 优先 source shard，而不是 summary/index text。 |

## Artifact Homes

除非仓库已经有清晰约定，否则使用以下归属：

| Artifact | Home document | 说明 |
| --- | --- | --- |
| Current context | `context.md` 或 `workflow/context.md` | 稳定项目背景和 planning assumptions。 |
| Backlog | `backlog.md` 或 `workflow/backlog/open.md`，加 status/quarter shards | 只作为原材料；不要把每个 backlog item 当成可执行项。 |
| Project plan and goals | `plans.md` 或 `workflow/goals/G-*.md` | Objectives、focus、constraints、non-goals、`G-*`。 |
| Scope boundary | `scopes.md` 或 `workflow/scopes/G-*.md` | `must_have`、`nice_to_have`、`non_goals`、`risk_controls`。 |
| Iteration | `iterations.md` 或 `workflow/iterations/I-*/plan.md` | `I-*`、`primary_goal_id`、可选 `supporting_goal_ids`、`reason_for_mix`、selected scope、excluded scope、success criteria。 |
| Task | `tasks.md` 或 `workflow/iterations/I-*/tasks.md` | `T-*`、`goal_id`、`iteration_id`、`done_when`、`evidence`。 |
| Review | `reviews.md` 或 `workflow/iterations/I-*/review.md` | Templates 和已完成 iteration reviews；在 `workflow/goals/G-*.md` 或 Goal ledger 中更新受影响 Goal progress。 |
| Evidence | `tasks.md` / `reviews.md` 或 `workflow/iterations/I-*/evidence.md` | Verification output、browser checks、user review evidence、screenshots、links。 |
| Decision | `decisions.md` 或 `workflow/decisions/YYYY/D-*.md`，候选项用 `open.md` | `D-*` logs 和 `DC-*` decision candidates。 |
| Roadmap | `roadmap.md` 或 `workflow/roadmap/current.md`，历史用 `history/YYYY-QN.md` | 带 `now`、`next`、`later`、`not_now` 的排序层；每项应有 `item_type`、`source`、`status` 和 `rationale`。历史 roadmap states 放在 active view 外。 |

Domain model docs、scenario notes、architecture notes 和 product specs 可以留在 planning set 外部。从 index 或使用它们的 artifact 链接过去。

当项目有持久专家产物时，使用子文件夹：

| 文件夹 | 内容 | 规则 |
| --- | --- | --- |
| `reference/` | Domain models、capability catalogs、user stories、formulas、interaction architecture、architecture notes、data-shape specs、prototype specs。 | Reference docs 可以很长，但应支撑 Decisions、Backlog、Scope 和 Tasks，而不是替代它们。 |
| `archive/` | 被替代计划、生成导出、冷快照，以及普通 shards 不服务的特殊历史材料。 | 保留 IDs，并从 active artifact 或 index 链接。不要把 archive 当成未解决工作的垃圾箱。 |
| `indexes/` | ID registry、decision index、capability map、active task index。 | Indexes 是导航辅助，不是 source of truth。 |

## 迁移步骤

1. 读取当前 plan，列出顶层 headings。
2. 将每个 section 分类为 entry、active core、workflow ledger、reference、index、archive 或 out of scope。
3. 选择目标 document map，必要时创建文件夹。
4. 将每个顶层 section 移到它的 artifact home。
5. 用简短 index 和链接替换旧大文件。
6. 保留所有既有 IDs 和 status values。
7. 确认每个旧顶层 section 都出现在新文件中，或被有意退役。
8. 用 `rg` 或等价搜索做轻量 link/heading 检查。

高增长迁移按以下顺序执行：

1. 先缩短 entry file。
2. 增加或刷新 `current.md`。
3. 将 workflow ledgers 和 reference documents 分离。
4. 增加 IDs 和 active work 的 indexes。
5. 从 `workflow/iterations/I-*/` 开始写入新 iteration material，让 task 和 review evidence 自然有边界。
6. 当 decisions、backlog 和 roadmap ledgers 难以扫描时，再进行 shard。
7. 最后移动文件路径，因为路径变动成本高，也可能破坏历史链接。

## Growth Triggers

把以下情况视为需要重构的信号：

- Entry file 在解释历史，而不是只说明从哪里开始。
- `current.md` 包含已完成 task evidence 或旧 review narrative。
- 某个 workflow ledger 大部分是已完成历史，只有很小一部分活跃。
- 某个 reference doc 混合多个独立 topic，例如 domain rules、page IA、data structure 和 prototype notes。
- Project folder root 包含许多长期专家 docs，用户无法判断哪些是 active workflow files。
- 未来 agent 必须扫描许多文件后，才能知道 active Goals、current Iteration 和 next task。
- 同一 ID family 出现在多个文件中，却没有 index 说明 source of truth。
- 搜索一个 active task 返回太多已关闭历史匹配。

不要只因行数过多就过度反应。如果长 reference document 只有一个清晰 topic 且归属稳定，可以接受。反过来，较短文件如果混合 active decisions、task evidence 和 future ideas，也仍然有害。

## Growth Steps

当多文档集合变大时：

1. 创建或更新 `current.md`，包含 active Goals、current/next Iteration、active Tasks、open Decisions 和 current Roadmap。
2. 为每个新 iteration 创建 `workflow/iterations/I-*/`，并把 iteration plan、task list、review 和 evidence 放进去。
3. 保留旧 flat `tasks.md`、`reviews.md` 和 `iterations.md` 作为兼容映射，直到链接变动成本可接受，再逐步迁移旧 sections。
4. 为 decision candidates 创建 `workflow/decisions/open.md`，为 accepted decisions 创建 `workflow/decisions/YYYY/D-*.md`。
5. 保持 `workflow/backlog/open.md` 只包含活跃原材料；把 deferred 或 closed items 移入季度 shards。
6. 将持久 domain、product、interaction、architecture、data-shape、formula 或 prototype artifacts 移入 `reference/<area>/`，除非仓库已有清晰归属。
7. 当按 `B-*`、`G-*`、`I-*`、`T-*`、`D-*`、`DC-*`、`CAP-*` 或 `US-*` 跨文件查找变慢时，增加 `indexes/id-registry.md`。
8. 当未来 agent 需要确定性读取顺序时，增加 `indexes/retrieval-guide.md`。
9. 只有用户明确希望 workflow data 存在数据库中时，才把生成的 JSON、SQLite 或 search indexes 作为 source of truth；否则它们只是派生视图。

推荐的 bounded source shapes：

```text
docs/project/workflow/iterations/I-012/plan.md
docs/project/workflow/iterations/I-012/tasks.md
docs/project/workflow/iterations/I-012/review.md
docs/project/workflow/iterations/I-012/evidence.md
docs/project/workflow/decisions/2026/D-047.md
docs/project/workflow/backlog/deferred/2026-Q2.md
docs/project/archive/superseded/2026-05-23-old-roadmap.md
```

小项目使用 flat layout 就够了。迁移到可扩展布局时，在 headings 或 frontmatter 中保留 IDs，确保移动后 `rg "T-095"` 仍能找到该 item。

## Update Routing

- 新 idea 或 risk：标准布局更新 `backlog.md`；可扩展布局更新 `workflow/backlog/open.md`。
- 新用户提出的 goal：先用 Backlog、Review、Goal Progress、Decision、constraints 和 Roadmap 做 Goal Intake。如果接受或修订，更新 `plans.md`，或创建/更新 `workflow/goals/G-*.md`；否则保留为 Goal Candidate 或 Backlog item。
- Scope boundary 变化：更新 `scopes.md`，或创建/更新 `workflow/scopes/G-*.md`；如果变化重要，增加 decision。
- 新 iteration：更新 `iterations.md`，或创建 `workflow/iterations/I-*/plan.md`，其中包含 `primary_goal_id`、可选 `supporting_goal_ids` 和 `reason_for_mix`。
- 新 implementation task：更新 `tasks.md`，或加入 `workflow/iterations/I-*/tasks.md`。
- 已完成 task evidence：更新 task source 和 evidence source；只在 iteration review 时更新 `reviews.md` 或 `workflow/iterations/I-*/review.md`。
- 接受风险、推迟工作、公式/政策变化或 roadmap 变化：更新 `decisions.md`，或创建 `workflow/decisions/YYYY/D-*.md`。
- 排序变化：更新 `roadmap.md` 或 `workflow/roadmap/current.md`，带上 `now`、`next`、`later`、`not_now`、`source` 和 `status`；有用时把旧 roadmap state 移入 `workflow/roadmap/history/YYYY-QN.md`。如果变化改变了已接受方向，增加或更新 Decision。
- Specialist handoff：把每个 `*_handoff` 字段路由到自己的 artifact home，不要把整份分析复制到每个文件。
- Historical evidence：保留在相关 iteration shard；Review 后归档，除非它仍是 open Task 或 Decision 的活跃证据。
- 新长期 domain/product/interaction/architecture 分析：创建或更新 `reference/<area>/<topic>.md`，然后只把治理后果路由到 Backlog、Scope、Decision、Task、Review 或 Roadmap。
- 新 index 请求：`indexes/` 只更新指针和状态摘要；原始 rationale 留在 source files。
- 既有 flat layout 有许多根级文件：移动旧文件前，优先增加 document map，并为未来材料建立新 subfolders。

## Quality Checks

完成前检查：

- Index 链接到每个 artifact document。
- 如果存在 `current.md`，它只包含 active 或 next-step material。
- 每个 task 都有 `goal_id`、`iteration_id`、`done_when` 和 `evidence`。
- 混合 Goals 的 iterations 说明 `primary_goal_id`、`supporting_goal_ids` 和 `reason_for_mix`。
- Goals 不是单个 iteration 的 task wrapper。
- 用户提出的 Goals 在成为 active 前，已经用历史 workflow evidence 校准。
- Roadmap 是排序层，不是第二个 Goal ledger。
- 生成的 roadmap items 标为 `proposed`，除非有用户确认或 accepted Decision。
- Backlog items 没有在缺少 goal 的情况下混入 executable tasks。
- Decisions 记录为什么方向改变，而不只是记录改变了什么。
- 没有 artifact 在两个 home 中重复。
- Archived IDs 仍能从 index 或引用它们的 active artifact 中搜索到。
- Entry 和 active-core files 足够短，能回答“从哪里开始”和“下一步做什么”，无需扫描历史。
- Reference files 有清晰 topic ownership，不会变成 shadow task trackers。
- 未来 agent 可以从 entry file 加 `current.md` 找到 active Goals、current Iteration、next active task 和 open decisions。
