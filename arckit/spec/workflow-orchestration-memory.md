# Arckit 工作流编排与自然沉淀规格

更新时间：2026-06-23

## 1. 产品定位

Arckit 支持基于 skill 的动态工作流编排。该能力使 `using-arckit` 不只作为最小 skill 路由器存在，而是承担软件项目协作场景识别、工作流匹配、工作流组合和沉淀建议的入口职责。

该能力解决的问题是：用户触发入口 skill 后，agent 应表现为基于已有 Arckit 能力系统性处理问题，而不是只在 prompt 明确命中特定关键词时才偶发加载少数 skill。

工作流编排与自然沉淀能力面向以下目标：

- 让 `using-arckit` 根据任务场景形成明确的 workflow frame。
- 让 workflow frame 编排多个专门 skill 的使用顺序、条件和交接边界。
- 让用户通过自然对话调整当前 workflow。
- 让经过用户确认的调整沉淀为可复用的用户级或项目级工作流。
- 让产品概念、技术方案和项目事实仍沉淀到目标项目的 `arckit/` 工作区，而不是写入用户级工作流记忆。

## 2. 核心概念

### 2.1 Workflow Frame

Workflow Frame 是单次任务的执行框架。它由 `using-arckit` 在理解用户请求后生成，描述当前任务属于什么场景、需要哪些 skill、每个 skill 的职责、执行顺序、是否需要用户确认、以及最终产物落点。

Workflow Frame 是执行计划，不是项目事实。它可以在当前对话中根据证据和用户反馈调整。

### 2.2 Workflow Memory

Workflow Memory 是持续沉淀出来的工作流记忆。它记录 workflow signals、workflow candidates 和 accepted workflows，属于 agent procedural memory。

Workflow Memory 不记录某个具体产品的功能定义、技术方案、业务结论或项目事实。具体项目事实仍由 `arckit/spec/`、`arckit/tech/`、`arckit/interaction/`、`arckit/visual/`、治理文档或 pending 文档承载。

Workflow Memory 分三层：

- `signal`：单次任务轨迹、用户纠偏、成功/失败证据或可复用模式线索。
- `candidate`：多个相似 signals 或明确流程级纠偏归纳出的候选工作流。
- `accepted workflow`：用户确认后可被默认匹配的稳定工作流。

### 2.3 Natural Deposition

Natural Deposition 是 agent 在持续工作中收集 workflow signals、归纳 workflow candidates，并在用户确认后把 candidate 提升为 accepted workflow 的过程。

自然沉淀的输入通常是自然语言，例如：

- “以后这种 bug 先复现再改。”
- “这类产品早期讨论先问商业目标，再问技术约束。”
- “不要每次只用入口 skill，应该先归类再组合工作流。”
- “当前项目里这种 skill 验证都要走 skill first 模拟。”

这些表达首先成为 workflow signal 或 candidate 证据，只有在用户确认沉淀范围后才成为 accepted workflow。

## 3. 入口行为

`using-arckit` 是工作流编排入口。它在适用 Arckit 的任务中执行以下行为：

1. 识别用户任务所属场景。
2. 使用 `arckit-workflow-memory` 查询可用的用户级和项目级 Workflow Memory。
3. 选择匹配的 workflow，或在没有匹配项时生成临时 workflow。
4. 根据 workflow 加载必要 skill。
5. 在执行中接收证据、失败和用户反馈，并调整 workflow frame。
6. 在任务结束、阻塞或失败时使用 `arckit-workflow-memory` 记录 workflow signal。
7. 当多个 signals 稳定指向同一模式时维护 workflow candidate。
8. 在用户确认后把 candidate 提升到合适作用域的 accepted workflow。

入口不默认加载所有 skill，也不把所有请求强行纳入单一固定流程。入口负责让当前任务有明确的场景分类和工作流结构。

如果 Workflow Memory 目录尚不存在，入口不能把“目录不存在”解释为无需沉淀。`~/.arckit/workflows` 是 ArcKit 用户级基础运行状态目录；当前工具权限允许写入时，系统应直接初始化目录、INDEX、signals、candidates 和 accepted。只有沙箱/工具权限不允许、用户明确禁止外部记忆或明确禁止写 `~/.arckit` 时，才输出 bootstrap pending 或 blocked。用户只限制“业务代码只改目标项目目录”时，不自动禁止用户级 workflow memory。

`INDEX.md` 是 Workflow Memory 的导航索引。任务开始时系统必须读取相关作用域的 `INDEX.md` 内容，再按索引选择可能匹配的 accepted workflow 和 candidate。若索引缺失、过期、为空，或没有列出磁盘上已存在的 candidate/accepted 文件，系统不能直接判定无匹配；应扫描对应目录兜底，并在任务收口时修复索引或输出索引 pending/blocked 状态。

同一会话中的 pending signals 也属于 candidate evidence。第二条相似 signal 后，系统必须输出 candidate 状态；如果目录不存在或缺少写入确认，则输出 `workflow_candidate_pending_write`。不能等 signal 文件实际落盘后才开始维护 candidate。

## 4. 场景识别

Arckit 至少识别以下场景：

| 场景 | 典型任务 | 默认工作流倾向 |
| --- | --- | --- |
| 产品概念定义 | 梳理想法、目标用户、价值、边界 | decision、draft spec、spec |
| 技术方案定义 | 架构、数据模型、接口、约束 | architecture decision、domain modeling、tech |
| 正向功能实现 | 新增能力、补测试、改 README | implementation handoff、普通代码工作流、verify |
| bug 诊断 | 失败、回归、异常、测试红 | debug diagnosis、verify |
| 代码审查 | review、风险评估、质量反馈 | code review、verify |
| skill 验证 | skill first、模拟测试、复测 skill | arcforge skill first |
| 项目治理 | 目标、迭代、任务、review、decision | project governance |
| 运行交付 | 发布、回滚、SLO、告警、运行观察 | release readiness、runtime operations |

场景识别不是关键词匹配。它综合用户意图、目标路径、已有项目文档、错误输出、测试状态、对话上下文和用户偏好。

## 5. 工作流匹配

当进入 Arckit 工作流时，系统按以下优先级选择 workflow：

1. 当前用户明确指令。
2. 当前对话中刚确认的 workflow 调整。
3. 当前项目级 Workflow Memory。
4. 当前项目的个人本地 Workflow Memory。
5. 用户全局 Workflow Memory。
6. Arckit 默认场景 workflow。
7. 临时自由生成 workflow。

更高优先级 workflow 可以覆盖低优先级 workflow，但不得覆盖系统安全规则、工具权限规则或当前用户的显式反向要求。

## 6. 工作流执行

Workflow Frame 包含以下信息：

| 字段 | 含义 |
| --- | --- |
| `scenario` | 当前任务场景 |
| `confidence` | 场景判断置信度 |
| `workflow_source` | 匹配来源，可能是 project、user、default 或 ad hoc |
| `skills` | 需要使用的 skill 列表和顺序 |
| `handoffs` | skill 之间的输入输出交接 |
| `confirmation_points` | 需要用户确认的节点 |
| `artifact_targets` | 结果沉淀目标 |
| `stop_conditions` | 任务何时可以结束 |
| `memory_candidates` | 可选的工作流沉淀候选 |

对复杂任务，`using-arckit` 先输出简短路由说明。对需要写入稳定文档、修改项目事实或沉淀 workflow 的任务，agent 必须在写入前保证用户意图明确。

## 7. 自然调整

用户可以用自然语言调整当前 workflow。系统支持以下调整类型：

- 增加或移除步骤。
- 改变 skill 顺序。
- 改变验证强度。
- 改变是否需要先计划、先调研、先复现或先验收。
- 改变某类任务的默认沉淀位置。
- 改变当前项目或全局偏好。

当调整只影响当前任务时，系统直接更新当前 workflow frame。

当调整可能影响未来任务时，系统生成 workflow patch，并要求用户确认作用域：

- 仅本次。
- 当前项目。
- 当前项目个人偏好。
- 用户全局偏好。

未确认的 workflow patch 不写入长期记忆。

## 8. 沉淀边界

Workflow Memory 只沉淀 agent 工作方式。项目内容沉淀到目标项目的 Arckit 事实源。

| 内容类型 | 沉淀位置 |
| --- | --- |
| 工作流 signals、candidates、accepted workflows | 用户级或项目级 Workflow Memory |
| 产品概念、功能规格、行为规则、验收口径 | `arckit/spec/` |
| 技术方案、架构、数据模型、API 契约 | `arckit/tech/` |
| 交互流程、页面状态、线框 | `arckit/interaction/` |
| 视觉策略、token、主题、组件视觉 | `arckit/visual/` |
| 未承诺问题、风险、开放讨论 | `arckit/pending/` |
| 目标、迭代、任务、review、decision、roadmap | 项目治理文档 |

Workflow Memory 不替代 `arckit/spec/` 或 `arckit/tech/`。

## 9. 用户确认

系统在以下情况必须请求用户确认：

- 初始化或写入用户级 `~/.arckit/workflows` 时，当前工具权限、沙箱权限或用户明确边界要求确认。
- 将 workflow candidate 提升为 accepted workflow。
- 将当前临时 workflow 或单次 signal 提升为项目级默认 workflow。
- 将用户级 workflow 应用于当前项目并覆盖项目已有规则。
- 将过程分析结果写入 `arckit/spec/`、`arckit/tech/` 或其他结果事实源。
- 删除、归档或重写已有 workflow。

确认请求必须说明写入内容、作用域和后续影响。

## 10. 验收口径

该能力满足以下验收标准：

- 给定普通软件开发任务时，`using-arckit` 能输出场景判断和 workflow frame，而不是只给最小 skill 列表。
- 给定 bug 诊断任务时，系统能自动组合 debug 和 verify 类 skill。
- 给定正向功能开发任务时，系统能形成 implementation handoff、执行代码工作流并安排验证，而不是完全跳出 Arckit。
- 给定 skill first 验证任务时，系统能匹配 Skill First workflow。
- 给定用户自然纠正时，系统能区分本次调整和可沉淀偏好。
- 给定连续相似任务时，系统能记录 signals，形成 candidate，并在用户确认后写入对应用户级或项目级 accepted workflow。
- 给定 Workflow Memory 目录不存在或权限不足时，系统能输出 `workflow_signal_pending_write`，而不是只报告“没有创建 workflow 文件”。
- 给定连续相似 pending signals 时，系统能输出 `workflow_candidate_pending_write`，而不是只列出多个 pending signal。
- 给定 workflow candidate 已写入但 `INDEX.md` 未列出时，系统能读取索引内容、识别索引不完整、扫描 candidate 目录兜底命中，并在收口时维护 `INDEX.md` 或输出 `workflow_index_pending_write|workflow_index_blocked`。
- 给定产品概念或技术方案讨论时，系统能把内容沉淀到 `arckit/spec/` 或 `arckit/tech/`，而不是写入 Workflow Memory。
