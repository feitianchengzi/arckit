# Arckit 工作流编排与自然沉淀规格

更新时间：2026-07-02

## 1. 产品定位

Arckit 支持基于 skill 的动态工作流编排。该能力使 `using-arckit` 不只作为关键词 skill 路由器存在，而是承担软件项目协作首轮场景识别、工作流匹配和 workflow frame 编译入口职责；任务执行中会改变当前 frame、事实路由、停止条件或 workflow memory 判断的后续用户消息由 `arckit-turn-adaptation` 分类和适配。

该能力解决的问题是：用户触发入口 skill 后，agent 应表现为基于已有 Arckit 能力系统性处理问题，而不是只在 prompt 明确命中特定关键词时才偶发加载少数 skill。

工作流编排与自然沉淀能力面向以下目标：

- 让 `using-arckit` 根据任务场景形成明确的 workflow frame。
- 让 `arckit-turn-adaptation` 识别首轮之后会改变 frame、事实路由、停止条件或 workflow memory 判断的消息，并输出结构化 delta。
- 让 workflow frame 编排多个专门 skill 的使用顺序、条件和交接边界。
- 让 workflow memory 作为偏好、经验和纠偏形成的 overlay 参与编排，而不是替代入口的运行时判断。
- 让 agent 在执行中持续做 artifact impact scan，把稳定事实、诊断事实、未决问题、外部 adapter 事项和流程学习路由到不同事实源。
- 让用户通过自然对话调整当前 workflow。
- 让经过用户确认的调整沉淀为可复用的用户级或项目级工作流。
- 让产品概念、技术方案和项目事实仍沉淀到目标项目的 `arckit/` 工作区，而不是写入用户级工作流记忆。

## 2. 核心概念

### 2.1 Workflow Frame

Workflow Frame 是单次任务的执行框架。它由 `using-arckit` 在理解用户请求后生成，描述当前任务属于什么场景、需要哪些 skill、每个 skill 的职责、执行顺序、是否需要用户确认、以及最终产物落点。

Workflow Frame 是执行计划，不是项目事实。它可以在当前对话中根据证据和用户反馈调整。

### 2.1.1 Loop Handoff

Loop Handoff 是任务结束、阻塞、延期或交接时输出的续轮 envelope。它同时服务人类手动触发下一轮和未来自动桥调度。

Loop Handoff 至少包含：

- `status`：continue、done、needs_human、blocked 或 deferred。
- `next_responsibility`：agent、human、external 或 none。
- `agent_continuation_available`：下一步是否可以由 Agent 继续执行。
- `human_decision_required`：下一步是否需要人类真实判断、授权或确认。
- `trigger_mode`：manual_bridge、auto_bridge、user_decision、external_wait 或 none。
- `next_prompt`：人类手动触发下一轮时可直接交给 Agent 的自然语言输入。
- `agent_instruction`：自动桥可读取的目标、上下文引用、动作、检查项和停止条件。
- `human_gate`：人类需要处理的决策、授权、风险接受或确认内容。
- `progress_guard`：用于防止自动桥无进展循环的预期状态变化、实际状态变化和轮次上限。

`manual_bridge` 只表示下一步本质上由 Agent 负责，但当前缺少自动续轮调度器，需要人把 `next_prompt` 或 `agent_instruction` 手动交给下一轮。`manual_bridge` 不表示 `human_decision_required=true`。

`human_decision_required=true` 只用于审美判断、商业取舍、产品确认、权限授权、破坏性操作确认、风险接受或发布责任。自动桥不能推进该状态。

### 2.2 Runtime Workflow Compiler

Runtime Workflow Compiler 是 `using-arckit` 的首轮运行时编排职责。它不直接复用一份固定 workflow，而是综合用户当前目标、项目上下文、可用 skill、已有事实源和 workflow memory overlay，编译本轮 `workflow_frame`。

Compiler 的输出必须能实际影响执行：选择或跳过 skill、确定 skill 顺序、设置 handoff、声明 artifact targets、设置 reflection gates 和 closeout 路由。

### 2.3 Turn Adaptation

Turn Adaptation 是 `arckit-turn-adaptation` 的职责。它处理首轮目标之后会改变当前 workflow frame、artifact routing、停止条件、验证策略或 workflow memory 判断的用户消息，先判断影响层级，再决定是否更新 workflow frame、artifact routing、停止当前任务或生成 workflow correction ledger。

触发 turn adaptation 的后续消息至少分为：

- `continue_current_frame`：判断后交回 `using-arckit` 在现有 frame 内继续推进。
- `supplemental_context`：补充材料、约束或背景。
- `user_workflow_correction`：纠正 agent 的流程选择、验证方式、确认点、工具使用、停止条件或记忆判断。
- `goal_change`：改变最终交付目标。
- `artifact_fact_correction`：纠正产品、技术、交互、视觉或 pending 事实。
- `clarification_answer`：回答 agent 之前提出的问题。
- `pause_or_stop`：要求暂停、停止或稍等。

只有 `user_workflow_correction` 生成 `workflow_correction_ledger`。普通补充信息、目标变更和项目事实纠正不能自动写成 workflow signal。

### 2.4 Workflow Correction Ledger

Workflow Correction Ledger 是 `arckit-turn-adaptation` 交给 `arckit-workflow-memory` 的结构化输入。它至少包含：

- `correction_text`：用户原话或忠实摘要。
- `affected_workflow_area`：verification、compile/test、confirmation、artifact routing、stop condition、tool use、memory closeout 或 workflow framing。
- `scope_hint`：current_project、user_global、one_off 或 unknown。
- `changed_frame`：是否改变 workflow frame、验证强度、停止条件、工具调用或确认点。
- `default_signal_decision`：默认 `write_signal`；只有用户明确说一次性或不要记录时才为 `skip`。

例如用户说“当前项目写完代码后，只需要自查是否有错误、多余、遗漏，不需要编译，我人工编译”时，应被视为 workflow correction，作用于 verification、compile/test 和 stop condition，scope hint 为 current_project，默认 signal decision 为 write_signal。

### 2.5 Workflow Memory

Workflow Memory 是持续沉淀出来的工作流记忆。它记录 workflow signals、workflow candidate patches 和 accepted workflow patches，属于 agent procedural memory。Workflow signal 是学习证据，不是每次任务的审计日志。

Workflow Memory 不记录某个具体产品的功能定义、技术方案、业务结论或项目事实。具体项目事实仍由 `arckit/spec/`、`arckit/tech/`、`arckit/interaction/`、`arckit/visual/` 或 pending 文档承载。

Workflow Memory 主要沉淀 workflow patch 或 overlay，而不是完整替代入口编排器的固定流程。Patch 可以增加、删除或调整步骤、确认点、验证强度、artifact scan 项和 closeout 策略。

Workflow Memory 不负责判断一条原始用户消息是补充信息、目标变更还是流程纠偏。`using-arckit` 负责首轮入口和普通后续推进；当后续消息可能改变 frame、事实路由、停止条件或 workflow memory 判断时，交给 `arckit-turn-adaptation` 分类。Workflow Memory 消费最终 workflow frame、执行证据和可选的 `workflow_correction_ledger` 做 signal decision。

当 `workflow_correction_ledger.scope_hint=current_project` 或 signal `scope=project` 时，Workflow Memory 默认写入项目级目录 `~/.arckit/workflows/projects/<project-fingerprint>/`。只有项目指纹无法稳定计算、项目级目录不可写，或用户明确要求用户级记忆时，才可降级到 user scope，并必须说明原因。

Workflow Memory 分三层：

- `signal`：有学习价值的单次任务轨迹、用户纠偏、成功/失败证据或可复用模式线索。
- `candidate`：多个相似 signals 或明确流程级纠偏归纳出的候选 workflow patch。
- `accepted workflow`：用户确认后可被默认匹配的稳定 workflow patch 或 workflow overlay。

### 2.6 Artifact Impact Scan

Artifact Impact Scan 是每轮 ArcKit 工作流的反思路由动作。它判断本轮任务是否产生或改变以下内容：

- 产品行为、验收口径或功能边界。
- 交互流程、页面状态或线框。
- 视觉规则、主题、组件表现或 token。
- 技术方案、架构约束、模型或接口契约。
- 未决问题、风险、待讨论分支或过程 handoff。
- 诊断事实、修复证据或实现异常线索。
- 外部治理、质量、发布、运维或任务推进事项。
- 可改变未来 agent 工作方式的流程经验。

Scan 的结果决定是否调用 `arckit-intake`、`arckit-spec`、`arckit-interaction`、`arckit-visual`、`arckit-tech`、`arckit-debug-diagnosis`、`arckit-pending` 或 `arckit-workflow-memory`。没有影响时必须显式跳过，避免过度沉淀。

Artifact impact scan 不按任务规模设置特殊分支。所有任务都按同一组目标逐项判断，任务规模、实现难度或是否只是局部操作不能作为省略扫描的依据。最终响应可以用简洁形式说明 scan 结果，但必须基于逐项判断；无项目事实变化只影响 intake、spec、interaction、visual、tech、debug、pending 等事实源路由，不替代 workflow memory closeout 判断。

当用户目标是代码实现，但内容涉及 UI 一致性、跨页面行为或样式统一、组件状态统一、从已有代码抽象规范或通过实现反推规范变化时，scan 必须先把 `interaction` 和 `visual` 标记为 `check`。代码实现完成后，系统再依据实际变更判断是否将交互流程、页面状态、视觉规则、主题、token 或组件表现更新到对应事实源。

### 2.7 Natural Deposition

Natural Deposition 是 agent 在持续工作中做 signal decision、收集有学习价值的 workflow signals、归纳 workflow candidate patches，并在用户确认后把 candidate patch 提升为 accepted workflow patch 的过程。

自然沉淀的输入通常是自然语言，例如：

- “以后这种 bug 先复现再改。”
- “这类产品早期讨论先问商业目标，再问技术约束。”
- “不要每次只用入口 skill，应该先归类再组合工作流。”
- “当前项目里这种 skill 验证都要走 skill first 模拟。”

这些表达首先成为 workflow signal 或 candidate patch 证据，只有在用户确认沉淀范围后才成为 accepted workflow patch。

## 3. 入口行为

`using-arckit` 是首轮工作流编排入口。它在适用 Arckit 的首轮任务中执行以下行为：

1. 识别用户任务所属场景。
2. 建立 runtime situation model，概括用户目标、项目阶段、可用证据、不确定点和当前显式约束。
3. 使用 `arckit-workflow-memory` 查询可用的用户级和项目级 Workflow Memory overlay。
4. 将匹配的 workflow patch 应用到默认能力地图，编译本轮 workflow frame。
5. 根据 workflow frame 加载必要 skill。
6. 设置 reflection gates，并在后续消息可能改变 frame、事实路由、停止条件或 workflow memory 判断时交给 `arckit-turn-adaptation`。
7. 在关键节点和结束前做 artifact impact scan，并按结果路由到对应事实源或 pending。
8. 在任务结束、阻塞或失败时触发 `arckit-workflow-memory` 做 workflow memory closeout。

入口不默认加载所有 skill，也不把所有请求强行纳入单一固定流程。入口负责让首轮任务有明确的场景分类和工作流结构，并继续协调现有 frame 内的普通后续推进；frame delta、workflow correction ledger、signal decision 和持久化由对应专门 skill 处理。

如果 Workflow Memory 目录尚不存在，系统不能把“目录不存在”解释为无需沉淀。`~/.arckit/workflows` 是 ArcKit 用户级基础运行状态目录；具体初始化、索引读取、兜底扫描、signal/candidate/accepted 写入和 index 维护由 `arckit-workflow-memory` 负责。用户只限制“业务代码只改目标项目目录”时，不自动禁止用户级 workflow memory。

`INDEX.md` 是 Workflow Memory 的导航索引。任务开始和收口时的索引读取、兜底扫描、pending/blocked 状态和 candidate maintenance 细节，由 `arckit-workflow-memory` 维护；`using-arckit` 只消费 memory overlay 并触发 closeout。

## 3.1 后续消息适配行为

当用户在首轮目标之后继续发消息时，系统先判断它是在现有 frame 内继续推进，还是会改变 frame、事实路由、停止条件或 workflow memory 判断。只有后一类进入 `arckit-turn-adaptation`。

`arckit-turn-adaptation` 执行以下行为：

1. 定位当前 workflow frame、已执行动作、artifact impact scan 状态和停止条件。
2. 分类主 `turn_type`，并保留 `secondary_signals`。
3. 对补充信息、澄清回答、目标变更、项目事实纠正和暂停/停止分别给出 frame delta 或交回入口继续协调。
4. 只要主类型或 secondary signals 中存在 workflow 纠偏，就生成 `workflow_correction_ledger`。
5. 将 ledger 交给 `arckit-workflow-memory` 做 signal decision。

该边界确保“项目事实不变”不会被误判为“workflow memory 可跳过”。Artifact impact scan 只判断项目事实源是否需要更新；workflow correction ledger 决定是否需要 workflow memory closeout。

## 4. 场景识别

Arckit 至少识别以下场景：

| 场景 | 典型任务 | 默认工作流倾向 |
| --- | --- | --- |
| 产品概念定义 | 梳理想法、目标用户、价值、边界 | decision、draft spec、spec |
| 技术方案定义 | 架构、数据模型、接口、约束 | architecture decision、domain modeling、tech |
| 正向实现产物建设 | 新增能力、补测试、改 README、创建或维护 skill、更新 workflow | implementation handoff、按 artifact_type 选择外部实现 adapter |
| bug 诊断 | 失败、回归、异常、测试红 | debug diagnosis、事实源或 pending 收口 |
| 外部质量或审查 | review、风险评估、质量反馈 | pending 或 external adapter handoff |
| 外部治理 | 目标、迭代、任务、review、decision | pending 或 external adapter handoff |
| 外部运行交付 | 发布、回滚、SLO、告警、运行观察 | pending 或 external adapter handoff |

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

更高优先级 workflow patch 可以覆盖低优先级 patch，但不得覆盖系统安全规则、工具权限规则或当前用户的显式反向要求。Patch 不能绕过 runtime compiler；它只能修改当轮 workflow frame 的步骤、顺序、确认点、artifact scan、验证强度或 closeout 策略。

## 6. 工作流执行

Workflow Frame 包含以下信息：

| 字段 | 含义 |
| --- | --- |
| `scenario` | 当前任务场景 |
| `confidence` | 场景判断置信度 |
| `workflow_source` | 匹配来源，可能是 project、user、default 或 ad hoc |
| `situation` | 用户目标、项目阶段、已有证据、不确定点和约束 |
| `skills` | 需要使用的 skill 列表和顺序 |
| `handoffs` | skill 之间的输入输出交接 |
| `confirmation_points` | 需要用户确认的节点 |
| `artifact_targets` | 结果沉淀目标 |
| `artifact_impact_scan` | spec、interaction、visual、tech、pending、governance 和 memory 的影响判断 |
| `reflection_gates` | 执行中需要重新判断 workflow 的节点，包括 turn adaptation gate |
| `memory_overlay` | 命中并已应用的 workflow patches |
| `stop_conditions` | 任务何时可以结束 |
| `memory_candidates` | 可选的工作流沉淀候选 |

对复杂任务，`using-arckit` 先输出简短路由说明。对需要写入稳定文档、修改项目事实或沉淀 workflow 的任务，agent 必须在写入前保证用户意图明确。

默认 reflection gates 包括：

- `after_context_read`：读完关键上下文后，判断是否需要补充定义、技术方案、治理上下文或 pending。
- `before_edit`：修改文件前，判断验收口径、写入边界和 artifact targets 是否足够明确。
- `after_execution`：执行或验证后，判断是否暴露新事实、风险、开放问题或流程偏好。
- `before_final`：最终响应前，完成 artifact impact scan 和 workflow memory closeout。
- `loop_handoff`：最终响应前，生成 `completion_audit.loop_handoff`，先判断下一步职责归属，再判断触发方式。
- `turn_adaptation`：首轮之后用户消息改变 frame、事实路由、停止条件或 workflow memory 判断时，交给 `arckit-turn-adaptation` 分类并决定是否重编 frame。

`loop_handoff` reflection gate 的判定规则是：只有 `next_responsibility=agent`、`agent_continuation_available=true` 且 `human_decision_required=false` 时，下一轮才可由自动桥直接触发；当前没有自动桥时使用 `trigger_mode=manual_bridge`。需要人类判断时使用 `next_responsibility=human` 和 `trigger_mode=user_decision`。等待外部系统或系统外操作结果时使用 `next_responsibility=external` 和 `trigger_mode=external_wait`。

## 7. 自然调整

用户可以用自然语言调整当前 workflow。首轮之后影响当前 frame 或未来协作方式的调整由 `arckit-turn-adaptation` 先分类。系统支持以下调整类型：

- 增加或移除步骤。
- 改变 skill 顺序。
- 改变验证强度。
- 改变是否需要先计划、先调研、先复现或先验收。
- 改变某类任务的默认沉淀位置。
- 增加 artifact impact scan 或 reflection gate。
- 改变当前项目或全局偏好。

当调整只影响当前任务时，系统直接更新当前 workflow frame。

当调整可能影响未来任务时，`arckit-turn-adaptation` 生成 workflow correction ledger，`arckit-workflow-memory` 先记录 signal 或更新 candidate。只有用户明确确认后，系统才把 candidate 提升为 accepted workflow patch。作用域包括：

- 仅本次。
- 当前项目。
- 当前项目个人偏好。
- 用户全局偏好。

未确认的 workflow patch 不写入长期记忆。Workflow patch 必须描述它如何改变未来编排，例如新增步骤、调整顺序、添加确认点、提高验证强度或改变 artifact scan，而不是只记录“用户说过什么”。

## 8. 沉淀边界

Workflow Memory 只沉淀 agent 工作方式。项目内容沉淀到目标项目的 Arckit 事实源。

| 内容类型 | 沉淀位置 |
| --- | --- |
| 工作流 signals、candidate patches、accepted workflow patches | 用户级或项目级 Workflow Memory |
| 产品概念、功能规格、行为规则、验收口径 | `arckit/spec/` |
| 技术方案、架构、数据模型、API 契约 | `arckit/tech/` |
| 交互流程、页面状态、线框 | `arckit/interaction/` |
| 视觉策略、token、主题、组件视觉 | `arckit/visual/` |
| 未承诺问题、风险、开放讨论 | `arckit/pending/` |
| 外部治理、质量、发布、运维或任务推进事项 | `arckit/pending/` 或 external adapter handoff |

Workflow Memory 不替代 `arckit/spec/` 或 `arckit/tech/`。

## 9. 用户确认

系统在以下情况必须请求用户确认：

- 初始化或写入用户级 `~/.arckit/workflows` 时，当前工具权限、沙箱权限或用户明确边界要求确认。
- 将 workflow candidate patch 提升为 accepted workflow patch。
- 将当前临时 workflow 或单次 signal 提升为项目级默认 workflow。
- 将用户级 workflow 应用于当前项目并覆盖项目已有规则。
- 将过程分析结果写入 `arckit/spec/`、`arckit/tech/` 或其他结果事实源。
- 删除、归档或重写已有 workflow。

确认请求必须说明写入内容、作用域和后续影响。

## 10. 验收口径

该能力满足以下验收标准：

- 给定普通软件开发任务时，`using-arckit` 能输出场景判断和 workflow frame，而不是只给压缩后的 skill 列表。
- 给定 bug 诊断任务时，系统能使用 debug diagnosis 收集证据、定位根因，并把后续事实源或 pending 影响说清楚。
- 给定正向功能开发任务时，系统能形成 implementation handoff，并把后续执行输入交给外部 adapter。
- 给定 UI 一致性、跨页面行为/样式统一或组件状态统一的实现任务时，系统能在代码实现前识别 `interaction` 和 `visual` 的潜在规范影响，并在实现后决定是否更新对应文档。
- 给定源码 skill 规则变更时，系统能在执行前或执行后识别 spec/tech impact，并调用对应结果型 skill 更新稳定文档。
- 给定本轮仍有 agent 可继续处理的缺口时，系统能输出 `next_responsibility=agent`、`agent_continuation_available=true`、`human_decision_required=false` 和 `trigger_mode=manual_bridge|auto_bridge`，而不是误判为人类接手。
- 给定本轮需要人类产品取舍、授权、风险接受、审美判断或发布责任时，系统能输出 `next_responsibility=human`、`human_decision_required=true` 和明确的 `decision_needed`，自动桥不得继续推进。
- 给定本轮等待 CI、云控制台、第三方审批、本地人工编译结果或其他外部状态时，系统能输出 `next_responsibility=external` 和恢复条件。
- 给定执行中暴露的未决问题时，系统能把内容路由到 `arckit-pending`，而不是写入稳定 spec/tech 或 workflow memory。
- 给定命中的 workflow patch 时，系统能实际改变本轮 skill 组合、handoff、artifact scan、确认点或验证强度，而不是只把它展示为 `workflow_source`。
- 给定任务未改变项目事实时，系统仍按同一组目标完成 artifact impact scan，并明确 workflow memory closeout 需要独立判断。
- 给定 skill first 验证任务时，系统能形成 external adapter handoff，说明验证任务、写入边界和观察重点。
- 给定用户自然纠正时，系统能区分本次调整和可沉淀偏好。
- 给定连续相似且有学习价值的任务时，系统能记录 signals，形成 candidate patch，并在用户确认后写入对应用户级或项目级 accepted workflow patch。
- 给定命中 candidate 且完全按预期成功的任务时，系统能输出 `update_candidate_only` 并轻量更新 candidate，而不是写一条重复 signal。
- 给定命中 accepted 且完全按预期成功的任务时，系统能输出 `skip`，而不是写一条重复 signal。
- 给定 Workflow Memory 目录不存在或权限不足且本轮需要写入时，系统能输出 `workflow_signal_pending_write`，而不是只报告“没有创建 workflow 文件”。
- 给定连续相似 pending signals 时，系统能输出 `workflow_candidate_pending_write`，而不是只列出多个 pending signal。
- 给定 workflow candidate 已写入但 `INDEX.md` 未列出时，系统能读取索引内容、识别索引不完整、扫描 candidate 目录兜底命中，并在收口时维护 `INDEX.md` 或输出 `workflow_index_pending_write|workflow_index_blocked`。
- 给定产品概念或技术方案讨论时，系统能把内容沉淀到 `arckit/spec/` 或 `arckit/tech/`，而不是写入 Workflow Memory。
