---
name: using-arckit
description: 软件项目协作的首轮入口 skill。用于把用户的自然语言请求编译成连续项目状态、development_case_record 和本轮 workflow frame，并优先维护到目标项目的 arckit/project 与 arckit/cases：识别项目目标、当前轮目标、阶段产物、最终产物类型、事实源缺口和未决项；按最关键的未满足结构激活当前 Arckit 能力；每轮执行后回写项目状态、case record、completion_audit，并决定继续补齐、阻塞确认、交接或关闭。只要首轮请求可能涉及需求、规格、交互、视觉、技术方案、项目上下文、bug 诊断、实现探索、实现交接、agent skill 或软件项目开发协作，就先使用本 skill。首轮之后的普通继续推进仍由本 skill 协调；当后续消息可能改变 workflow frame、事实路由、停止条件、验证策略或 workflow memory 判断时，路由 arckit-turn-adaptation；workflow resolution、execution record 和 workflow memory closeout 交给 arckit-workflow-memory。
---

# Using ArcKit

`using-arckit` 是 Arckit 的首轮研发事项编译协议。它把人的一句或多句请求当成真实软件项目的研发语义材料，先绑定或建立 `project_state_record`，再建立 `development_case_record`，能写项目文件时分别维护到 `arckit/project` 和 `arckit/cases`，再为当前一轮编译 `workflow_frame`，执行后回写项目状态、事项记录并审计后续还需要补齐哪些结构。

## 核心模型

`project_state_record` 记录整个软件项目的连续状态。它回答：这个项目长期要成为什么、当前处于什么阶段、目标用户和核心场景是什么、平台形态、客户端形态、服务端需求、账号体系、数据持久化、部署分发、质量门槛和技术基础分别处在什么承诺层级。所有软件请求默认都是连续项目的一部分；入口按状态层级、证据成熟度和本轮推进目标判断本轮更新项目状态、迭代状态、case 状态还是稳定事实源。

项目级状态的默认位置是 `arckit/project/STATE.md`。通过 `arckit-development-ledger` 创建、检查和读取项目状态；如果脚本不可用或写入边界不允许，在对话内维护同结构记录，并在 `project_state_delta` 中输出 pending write。

`development_case_record` 记录一个研发事项的整体状态。它回答：这件事最终要改变什么、当前先推进什么、哪些软件工程结构已经满足、哪些还需要补齐、哪些暂时延期或需要用户确认。用户输入可以很口语、很短或只描述结果愿望；入口 skill 负责把它拆成软件工程结构，而不是要求用户先按 Arckit 字段描述。

case record 的默认位置是 `arckit/cases/active/CASE-YYYYMMDD-###-slug.md`。通过 `arckit-development-ledger` 创建、检查、审计、关闭和同步索引；如果脚本不可用或写入边界不允许，在对话内维护同结构记录，并在 `round_update` 中输出 pending write。

`workflow_frame` 记录当前这一轮如何执行。它回答：本轮补哪个缺口、使用哪些 Arckit 能力、产出什么 handoff 或事实变更、何时停止。

`round_strategy_decision` 记录本轮路线选择。它回答：为什么本轮先走需求对话、规格草案、产品/交互探索、技术定义、实现探索、验证补齐或事实正式化；哪些路线已考虑但延期；什么信号会触发下一轮切换路线。

`completion_audit` 是每轮结束前的自查。它回答：必要结构是否已经 `satisfied|not_applicable|deferred`，还有哪些是 `unknown|needed|blocked`，下一轮应该继续、交接、请求确认还是关闭。

`visible_iteration_closeout` 是每轮最终响应前的用户可见闭环。它回答：本轮完成了什么、case 是否关闭、哪些结构仍只是探索或延期、下一轮最值得补什么，以及用户可以用什么反馈继续推进。

`project_state_delta` 是每轮结束前对项目连续状态的回查。它回答：本轮是否改变项目目标、平台、客户端、服务端、账号、数据、部署、质量、技术基础或迭代策略；哪些只是探索证据；哪些仍保持 `unknown|deferred|blocked`；下一轮应优先确认或正式化什么。

结构状态使用以下值：
- `unknown`：信息不足，尚不能判断是否需要。
- `needed`：本事项需要补齐。
- `satisfied`：已有与该结构匹配的稳定证据或产物支撑。
- `not_applicable`：对本事项不适用。
- `deferred`：已明确延期，带有原因和后续触发条件。
- `blocked`：缺用户确认、外部输入、权限或证据。

结构状态可以带 `evidence_maturity`，用于说明证据成熟度，而不是替代 `status`：
- `none`：没有有效证据。
- `exploratory`：证据来自探索、原型、草案、临时实现或初步判断。
- `confirmed`：证据已被用户确认、验证、评审或当前轮可采信判断支撑。
- `formalized`：证据已沉淀到稳定事实源、正式文档、验收记录或可复用结果中。

## 主流程

### 1. 绑定项目连续状态

输入：用户请求、目标项目目录、已有 `arckit/project/STATE.md`、README、代码结构、事实源、active cases 和用户纠错。

动作：
- 默认把用户的软件开发请求视为真实项目的连续研发材料；按项目连续状态、证据成熟度和本轮推进层级编译 workflow frame。
- 先查找 `arckit/project/STATE.md`；不存在且可写时使用 `arckit-development-ledger` 建立最小 `project_state_record`。
- 读取项目级状态、active case 索引和已有稳定事实源，判断本轮输入影响的是项目状态、某个 case、稳定事实源、实现探索，还是 workflow 方式。
- 当本轮为了探索生成网页、脚本、原型或临时代码时，把它记录为探索产物；不能自动把项目最终平台、客户端形态、服务端需求、账号体系或部署方式标为已确定。
- 如果项目级关键维度缺失，不要求用户一次性补全；将其保留为 `unknown|deferred|blocked`，并写明什么证据会推进它。

项目状态至少关注：
- `project_goal`
- `target_users`
- `core_scenarios`
- `platform_targets`
- `client_surface`
- `server_need`
- `account_identity`
- `data_persistence`
- `sync_collaboration`
- `deployment_distribution`
- `quality_bar`
- `technical_foundation`
- `iteration_strategy`

退出条件：得到可恢复的 `project_state_record`、项目状态路径或 pending write 状态，并明确本轮对项目级状态的预期影响范围。

### 2. 建立研发事项记录

输入：用户请求、项目上下文、已有事实、证据、错误、约束和用户纠错。

动作：
- 保留用户原始意图和显式约束。
- 基于 `project_state_record` 识别项目预期、本轮可交付内容和当前最可能的研发阶段。
- 当用户只给出普通一句话需求时，直接拆解，不要求用户补齐产品、交互、视觉、技术、实现、验证等字段；无法确定的结构标记为 `unknown|needed|deferred`，并写明本轮如何推进。
- 优先用 `arckit-development-ledger` 在 `arckit/cases/active/` 建立 case record；已有相关 active case 时读取并更新它。
- case record 必须关联项目状态：至少记录 `project_state_ref`；本轮结束时补 `project_state_delta`。
- 建立最小 `development_case_record`，字段可以简洁，但必须足够驱动下一步；不能落盘时保留同结构的对话内记录。

记录字段：
- `user_intent`：用户原话或忠实摘要。
- `expected_outcome`：这件事最终希望改变的软件、文档、skill、workflow 或判断。
- `current_round_goal`：本轮先推进的具体目标。
- `artifact_type`：`code|skill|document|workflow|mixed|unknown`。
- `project_state_ref`：对应项目连续状态路径。
- `project_state_delta`：本轮对项目级状态的影响摘要。
- `round_strategy_decision`：本轮路线选择、理由、已考虑但延期的路线和触发条件。
- `product_expectation`：产品行为、边界、价值或验收口径状态。
- `interaction_expectation`：页面、状态、流程和用户操作状态。
- `visual_expectation`：视觉规则、组件表现、样式和 token 状态。
- `technical_expectation`：架构、数据、接口、约束和技术方案状态。
- `implementation_state`：实现、探索、诊断或交接状态。
- `verification_state`：验证证据、验收比较和风险状态。
- `open_questions`：未决问题、冲突和待确认项。
- `decisions`：已经确认或本轮形成的判断。
- `pending_handoffs`：需要人类、后续任务或外部工具承接的事项。
- `workflow_memory_signals`：可能影响未来协作方式的信号。

每个结构项至少包含 `status`、`reason`、`evidence` 和 `next`；能判断证据成熟度时补 `evidence_maturity`。

退出条件：得到可执行的 `development_case_record`、case 路径或 pending write 状态，并能从 case 回溯到项目状态；若缺少必要目标或边界，生成最小澄清问题或把缺口标记为 `blocked`。

### 3. 解析工作流记忆

动作：
- 使用 `arckit-workflow-memory` 做 `workflow_resolution`。
- 读取项目级和用户级 workflow overlay。
- 将 overlay 应用到 `project_state_record` 和 `development_case_record`：它可以改变结构优先级、验证强度、确认点、停止条件或 closeout 策略。
- 本轮只创建或更新 execution record；场景级 workflow 的候选、信号和 closeout 由 `arckit-workflow-memory` 判断。

退出条件：记录 `workflow_resolution`，并说明 memory overlay 对本轮记录和 workflow frame 的影响。

### 4. 选择最关键未满足结构

动作：
- 同时查看 `project_state_record` 中所有 `unknown|needed|blocked` 的关键项目维度，以及 `development_case_record` 中所有 `unknown|needed|blocked` 的结构。
- 选择当前最能推进事项完成的一项作为 `current_round_gap`。
- 选择标准是：用户显式目标优先、阻塞项目连续演进或最终产物的缺口优先、会影响实现方向或验收口径的缺口优先、可在当前权限和证据下推进的缺口优先。
- 当用户意图是“先看到可用东西”“从 0 做个小应用”“先跑起来再说”这类探索式实现，可以把 `implementation_state` 作为本轮缺口，同时把探索后要回查的产品、交互、视觉、技术、验证或文档结构保留在 record 中。
- 生成 `round_strategy_decision`，先判断可选路线，再选择本轮路线；可选路线至少覆盖：需求对话、规格草案、产品/交互探索、交互原型、技术定义、实现探索、验证补齐、事实正式化。
- 选择实现探索时，记录为什么本轮适合先做可试用产物，以及需求对话、产品/交互探索、技术定义或事实正式化分别在什么信号下进入下一轮；这不是固定长流程，但必须让路线选择可审计。
- 当本轮实现选择了某种平台或技术形态，先判断它是探索手段、候选决策还是稳定事实；只有确认或正式化后才更新项目级对应维度为 `satisfied`。

thinking 类能力按缺口激活：
- 价值、取舍、方案选择或目标判断不清楚 -> `arckit-decision-framework`。
- 输入材料足够但规格表达尚未成形 -> `arckit-draft-spec`。
- 页面、状态、流程、体验风险或视觉方向需要探索 -> `arckit-explore-product-design`。
- 架构选择、系统拆分、数据流、依赖或技术取舍需要判断 -> `arckit-architecture-decision`。
- 实体、状态、不变量、生命周期、领域事件或上下文边界不清楚 -> `arckit-domain-modeling`。

事实和执行能力按缺口激活：
- 项目连续状态、case record 或迭代账本需要创建、读取、校验、审计、关闭或索引 -> `arckit-development-ledger`。
- 原始材料需要保留 -> `arckit-intake`。
- 产品预期事实稳定 -> `arckit-spec`。
- 交互预期事实稳定 -> `arckit-interaction`。
- 视觉预期事实稳定 -> `arckit-visual`。
- 技术预期事实稳定 -> `arckit-tech`。
- bug、回归、异常、显示错误或性能退化需要证据诊断 -> `arckit-debug-diagnosis`。
- 未决问题、风险、候选判断或交接事项需要低承诺保存 -> `arckit-pending`。

退出条件：明确 `current_round_gap`、`round_strategy_decision`、所选能力、跳过其他路线和缺口的原因、本轮停止条件。

### 5. 编译本轮 workflow frame

根据 `project_state_record`、`development_case_record`、`workflow_resolution` 和 `current_round_gap` 生成 `workflow_frame`：
- `scenario`
- `project_state_ref`
- `current_round_gap`
- `current_round_goal`
- `round_strategy_decision`
- `selected_capabilities`
- `why_now`
- `handoffs`
- `artifact_targets`
- `confirmation_points`
- `reflection_gates`
- `stop_conditions`

reflection gates 至少包含：
- `after_context_read`
- `before_write_or_execution`
- `after_round_execution`
- `before_final`
- `turn_adaptation`

退出条件：本轮要读什么、写什么、调用什么能力、何时停、如何回写 record 已明确。

### 6. 执行一轮并回写记录

动作：
- 按 `workflow_frame` 使用当前所需 skill 或普通工程能力。
- 先记录本轮将如何影响 `project_state_record`；执行后回写 `project_state_delta`。
- 过程型 skill 的输出先作为 handoff、候选判断、证据或风险回写到 `development_case_record`。
- 如果 case 已落盘，更新 `arckit/cases/active/<case>.md` 中的 Structured Record，并使用 `arckit-development-ledger` 校验。
- 如果项目状态已落盘，更新 `arckit/project/STATE.md` 中的 Structured Record，并使用 `arckit-development-ledger` 校验。
- 稳定事实只通过 `arckit-spec`、`arckit-interaction`、`arckit-visual` 或 `arckit-tech` 维护。
- 不稳定但有价值的信息进入 `open_questions`、`pending_handoffs` 或 `arckit-pending`。
- 实现探索产生的发现必须回查产品、交互、视觉、技术和验证结构，判断哪些要提升为事实、哪些保持 pending 或 deferred。
- 本轮代码已经实现的行为、界面、平台或技术选择，默认先作为实现证据；只有用户明确确认、已有稳定事实源，或本轮同时通过对应结果型 skill 维护了事实源时，才能把产品、交互、视觉、技术结构或项目级维度标记为 `satisfied`。
- 诊断结果必须回查实现状态、验证状态、事实源影响和未决项。

退出条件：本轮产物、证据、更新路径、未决项、项目状态变化、case 状态变化和写入或 pending write 状态已经明确。

### 7. 完成度审计

结束、阻塞或交接前执行 `completion_audit`：
- 先审计 `project_state_record` 的关键项目维度，生成 `project_state_delta`：`changed`、`unchanged_unknown`、`deferred`、`blocked`、`next_project_question`。
- 逐项检查 `product_expectation`、`interaction_expectation`、`visual_expectation`、`technical_expectation`、`implementation_state`、`verification_state`、`open_questions`、`pending_handoffs` 和 `workflow_memory_signals`。
- 将每项标记为 `satisfied|not_applicable|deferred|unknown|needed|blocked`，并给出最短原因。
- 审计每项状态时先判断证据类型是否匹配：实现文件和运行结果主要支撑 `implementation_state` 与 `verification_state`；产品、交互、视觉、技术结构需要用户确认、稳定事实源、对应结果型 skill 输出，或明确限定为本轮探索范围。
- 同时检查 `evidence_maturity`：`status` 说明结构是否满足，`evidence_maturity` 说明证据承诺层级；当证据仍是探索性时，优先保留后续补齐或正式化路径。
- 如果某项只是“当前 MVP 暂时够用”，但尚未沉淀为稳定预期事实，标记为 `deferred` 或 `needed`，并写明后续触发条件；不要仅因代码里存在对应行为就标记为 `satisfied`。
- 所有必要结构达到 `satisfied|not_applicable|deferred` 时，本事项可以关闭。
- 仍有 `needed|unknown` 时，生成 `next_round_goal`。
- 仍有 `blocked` 时，说明阻塞输入、确认点或权限。
- 有外部承接时，生成 handoff，并把必要内容写入 `arckit-pending` 或最终响应。
- 当 case 未关闭，或任何结构仍是 `deferred|needed|unknown|blocked`，必须生成 `visible_iteration_closeout`：`case_status`、本轮已完成、未满足结构摘要、`next_round_goal`、需要用户反馈或确认的最小问题。
- 当本轮没有写入 `arckit/spec`、`arckit/interaction`、`arckit/visual` 或 `arckit/tech`，必须在 `visible_iteration_closeout` 中说明这些稳定事实源暂未更新的原因，以及后续什么证据会触发正式化。
- 对实现探索型回合，最终响应不能只汇报代码文件、运行方式和验证命令；必须同时暴露本轮路线选择、探索结论、项目状态变化、case 是否继续 active、下一轮建议补齐或正式化的结构。
- 如果本轮生成了网页、桌面壳、移动端原型、服务端、脚本或其他实现形态，必须说明它当前是探索 artifact、候选方向还是正式项目方向；不能让实现产物静默决定项目最终形态。

如果 case 已落盘，通过 `arckit-development-ledger` 审计并回写 completion_audit；当 `completion_audit.status=complete` 时关闭 case，否则同步 case index。最后使用 `arckit-workflow-memory` 更新 execution record，并完成 workflow memory closeout。

退出条件：最终响应能说明这件事是关闭、继续补齐、阻塞确认还是交接后续。

### 8. 后续消息适配

首轮之后用户继续推进现有 frame 时，本 skill 直接基于 `project_state_record` 和 `development_case_record` 继续协调。后续消息可能改变当前目标、路线、事实路由、停止条件、验证策略、确认点、工具边界、术语边界或 workflow memory 判断时，交给 `arckit-turn-adaptation` 输出 `frame_delta`、`artifact_routing_delta`、`ledger_delta` 或 `workflow_correction_ledger`，再决定是否重编 `workflow_frame`、调整缺口优先级、更新账本、更新事实路由、停止或进入 workflow memory closeout。

## 输出要求

输出可以简洁，但必须覆盖：
- `development_case_record`：可用摘要，不必展开所有字段；包含 case 路径或 pending write 状态。
- `project_state_record`：项目状态路径或 pending write 状态；本轮涉及的项目维度摘要。
- `workflow_resolution`：命中、未命中或不可用状态。
- `workflow_frame`：本轮缺口、目标、能力、停止条件。
- `round_strategy_decision`：本轮选择的路线、理由、已延期路线和切换触发条件。
- `selected_capabilities`：本轮实际使用或准备使用的 Arckit 能力。
- `round_update`：本轮产物、证据、事实源变化和未决项。
- `project_state_delta`：本轮改变、保持未知、延期或阻塞的项目级维度，以及下一轮项目级确认入口。
- `completion_audit`：哪些满足、哪些未满足、下一步是什么。
- `visible_iteration_closeout`：case 是否关闭、未满足或延期结构、下一轮目标、用户反馈入口；只要 case 未关闭或仍有 deferred/needed/unknown/blocked，就必须对用户可见。
- `workflow_memory_closeout`：execution record 和 workflow signal 判断。

当用户只需要快速执行时，最终回答保持短，但内部仍按 `project_state_record -> development_case_record -> workflow_frame -> round_update -> project_state_delta -> completion_audit -> visible_iteration_closeout` 完成判断。短回答也必须保留下一轮入口：如果项目状态或 case 继续 active，用 1 到 3 个要点说明接下来最应该试用、确认、补齐或正式化什么。需要交给人类、外部工具或后续任务时，输出 `handoff`，说明已确认事实、输入、输出、风险和确认点。
