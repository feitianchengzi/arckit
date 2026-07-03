# Using ArcKit 路由说明

本文件承接 `using-arckit` 的详细路由知识。主 `SKILL.md` 只保留门禁；需要判断场景、skill 组合或事实源边界时读取本文件。

## 能力分层

- 入口编排层：`using-arckit`；任务中后续消息适配使用 `arckit-turn-adaptation`；workflow memory 使用 `arckit-workflow-memory`；显式角色协作使用 `arckit-role-orchestration`。
- 判断层：`arckit-decision-framework`。
- 想法层：`arckit-idea`、`arckit-market-research`、`arckit-idea-explore`。
- 过程层：`arckit-draft-spec`、`arckit-explore-product-design`、`arckit-architecture-decision`、`arckit-domain-modeling`。
- 定义层：`arckit-spec`、`arckit-interaction`、`arckit-visual`、`arckit-tech`。
- 治理层：`arckit-project-governance-workflow`。
- 规划辅助层：`arckit-team-responsibility`、`arckit-iteration-planning`、`product-work-item-discovery`。
- 记忆层：`arckit-intake`、`arckit-pending`、`arckit-workflow-memory`。
- 诊断层：`arckit-debug-diagnosis`。
- 质量层：`arckit-verify-implementation`、`arckit-code-review`。
- 交付层：`arckit-git-branching`、`arckit-release-readiness`、`arckit-runtime-operations`。
- 桌面桥：`arckit-workshop-desktop`。

当前仓库不承载具体技术栈的正向编码 skill。用户要求实现代码时，先形成 `implementation_handoff`，再按普通代码工作流或外部 `arckit-code` 执行；实现改变范围、证据、计划或稳定文档时，再回到对应 ArcKit skill。

## 默认顺序

```text
user intent
-> scenario classification
-> runtime situation model
-> arckit-workflow-memory workflow_resolution
-> bind accepted/candidate scenario workflow, or create scenario-level candidate when no match exists
-> workflow frame compilation
-> specialist skills with explicit handoffs and reflection gates
-> arckit-turn-adaptation when a later user message changes context, workflow, goal, facts, or stop state
-> artifact impact scan and result/pending/governance write-back when needed
-> arckit-workflow-memory execution_record update and closeout
```

## Workflow Frame 字段

- `scenario`
- `signals`
- `runtime_situation`
- `workflow_resolution`
- `workflow_composition_reasoning`
- `final_goal`
- `current_phase`
- `phase_reason`
- `workflow_source`
- `available_arckit_capabilities`
- `selected_capabilities`
- `why_not_selected`
- `skills`
- `handoffs`
- `artifact_targets`
- `artifact_impact_scan`
- `reflection_gates`
- `adaptation_triggers`
- `next_recompile_condition`
- `memory_overlay`
- `execution_record_target`
- `workflow_memory`
- `confirmation_points`
- `stop_conditions`

## Workflow Composition Reasoning

编译 workflow frame 时先回答下面问题。答案可以很短，但必须足以解释为什么当前选择这些能力、跳过哪些能力，以及下一次何时重编译。

- `final_goal`：用户最终想得到什么，例如可运行代码、产品判断、可确认原型、稳定规格、技术方案、修复结果、发布判断或工作流维护结果。
- `current_phase`：本轮当前最应该处于探索、定义、原型、视觉、技术方案、实现、验证、治理、记忆沉淀或收口中的哪一段。
- `phase_reason`：为什么当前阶段不是直接实现、不是继续讨论、不是先写稳定事实源，或为什么必须请求确认。
- `missing_piece`：当前缺的是证据、选择、确认、交互结构、视觉方向、产品规则、技术边界、实现改动、验证结果还是流程记忆。
- `available_arckit_capabilities`：列出本轮可能相关的基础能力，例如 `arckit-explore-product-design`、`arckit-interaction`、`arckit-visual`、`arckit-spec`、`arckit-tech`、`arckit-debug-diagnosis`、实现工作流、`arckit-verify-implementation`、`arckit-pending`、`arckit-workflow-memory`。
- `selected_capabilities`：只选择当前阶段实际需要的能力，并说明每个能力补哪个缺口。
- `why_not_selected`：对明显相关但本轮不选的能力给出简短理由，避免 agent 凭直觉跳过原型、确认、验证或实现。
- `artifact_stability`：区分稳定事实、过程产物、候选方案、待确认假设和 workflow signal 来源；不要把过程讨论直接写入稳定事实源。
- `adaptation_triggers`：记录哪些信号会让本轮重新编译 workflow。
- `next_recompile_condition`：明确下一次重编译条件，例如用户选择方案、原型反馈、测试失败、发现技术阻塞、用户质疑流程、确认点通过或目标阶段切换。

### 能力选择原则

本节不是场景穷举表。它只规定编译 `workflow_frame` 时的选择维度；具体任务先按这些维度判断，再选择当前阶段实际需要的能力集合。

- 分离最终目标和当前阶段：`final_goal` 保留用户最终要的产物，`current_phase` 表达本轮现在要补的缺口。二者不一致时，不丢失最终目标，也不跳过当前缺口。
- 先判缺口再选能力：缺证据、选择、确认、交互结构、视觉方向、产品规则、技术边界、实现改动、验证结果或流程记忆时，选择能补该缺口的能力；只选当前阶段实际需要的能力。
- 先解析并绑定场景工作流：同一类场景优先复用项目级 accepted/candidate workflow，再参考用户级 accepted/candidate workflow。只有无法匹配已有场景工作流时，才创建场景级 candidate；本次任务只产生 `execution_record`。
- 区分产物稳定性：稳定事实进入 spec、interaction、visual 或 tech；过程产物、候选方案和待确认假设不直接写入稳定事实源；可复用流程经验交给 workflow memory 判断。
- 实现不是默认终点：正向实现前先判断代码改动是否建立、强化或改变产品、交互、视觉或技术规范。若 UI 一致性、跨页面行为/样式、组件状态或从代码反推规范变化影响交互/视觉，先将 `interaction` 和 `visual` 标记为 `check`，实现后再依据证据决定是否 `update`。
- 直接实现需要说明依据：只有当前定义、交互、视觉、技术边界和验收口径足够清楚，且没有选择、确认或比较缺口时，才进入实现；同时在 `why_not_selected` 中说明为何暂不选择明显相关的探索、交互、视觉、spec 或 tech 能力。
- 执行中保持可重编译：出现用户纠偏、目标变化、事实纠正、定义不稳定、视觉/交互歧义、技术阻塞、验证失败或新的 artifact impact 时，重新判断 `final_goal`、`current_phase`、`selected_capabilities` 和 artifact routing；首轮之后的用户消息先交给 `arckit-turn-adaptation` 分类。
- 保持术语不诱导降级：不要使用会让 agent 误解为可以削减流程完整性的 workflow 修饰词。需要控制输出长度时，明确要求“简洁输出但完整判断 workflow resolution、artifact impact scan 和 closeout”。

### 发布和出包路由

用户表达发布、出包、测试分发、应用商店发布、TestFlight、App Store、内测、公测、正式发布或发布候选时，先判断用户要的是哪一种交付动作：

- 分支/tag 触发：用户想发包、出测试包、发 TestFlight、发应用商店候选、创建 release 线、打 tag、触发远端 workflow，默认选择 `arckit-git-branching`。
- 远端失败原因收集：用户反馈 Xcode Cloud、CI、发布平台或远端出包 workflow 失败，但只有泛化失败标题、logs/artifacts 不足、没有上传历史或不知道失败原因在哪里看，默认选择 `arckit-git-branching`；先指导收集失败原因原文，不进入 debug 或 readiness。
- 发布 readiness：用户明确要求发布前检查、上线 gate、go/no-go、灰度/回滚策略、发布风险评估，才选择 `arckit-release-readiness`。
- 运行期观察：用户要求线上健康、监控、SLO、告警或运行状态，才选择 `arckit-runtime-operations`。

当分支/tag 触发、远端失败原因收集和 readiness 都可能相关时，先选择 `arckit-git-branching` 给出 Git 触发方案或失败原因收集入口；readiness 只能作为后续显式确认的补充，不要抢占默认路由。

### Turn Adaptation 交接

后续用户消息由 `arckit-turn-adaptation` 输出：

```yaml
turn_adaptation_decision:
  turn_type: supplemental_context|user_workflow_correction|goal_change|artifact_fact_correction|pause_or_stop|clarification_answer
  frame_delta: {}
  artifact_routing_delta: {}
  handoff_targets: []
workflow_correction_ledger: null
```

当 `workflow_correction_ledger` 非空时，把它作为 `arckit-workflow-memory` 的 closeout 输入；它不替代最终 signal decision。

## Workflow 选择优先级

1. 当前用户明确指令。
2. 当前对话中已确认的 workflow 调整。
3. 当前项目级 accepted scenario workflow。
4. 当前项目级 candidate scenario workflow。
5. 用户全局 accepted scenario workflow。
6. 用户全局 candidate scenario workflow。
7. Arckit 默认场景 workflow。
8. 新建场景级 candidate workflow。

## 默认 Workflow 参考

- 原始资料归档：`arckit-intake`，随后按内容进入分析或定义。
- 反馈、需求、bug、风险、任务候选：治理推进走 `arckit-project-governance-workflow`；暂不承诺走 `arckit-pending`；具体执行另起 debug/spec/design/tech/code/verify。
- 读项目后推荐后续开发：`product-work-item-discovery`；需要排期或 owner 时再接 `arckit-iteration-planning`、`arckit-team-responsibility`、`arckit-project-governance-workflow`。
- 模糊想法判断：`arckit-decision-framework`，需要外部证据接 `arckit-market-research`，需要用户研究或线框接 `arckit-idea-explore`。
- 方向变成可执行版本：缺定义先补定义；缺推进方式用 `arckit-project-governance-workflow`；最后形成 `implementation_handoff`。
- 功能、页面或模块定义：产品行为写 `arckit-spec`；交互写 `arckit-interaction`；视觉写 `arckit-visual`；技术方案写 `arckit-tech`。
- 正向实现：先判断实现是否会建立或强化产品、交互、视觉或技术规范；普通实现走 `implementation_handoff` -> 普通代码工作流或外部 `arckit-code` -> `arckit-verify-implementation`；UI 一致性、跨页面行为/样式统一或组件状态统一需要在实现前标记 `interaction: check`、`visual: check`，实现后按证据决定是否 update 文档。
- bug、回归、偶发失败、性能退化：`arckit-debug-diagnosis` -> `arckit-verify-implementation`；需要运行期信号时接 `arckit-runtime-operations`。
- 代码审查：`arckit-code-review`，必要时接 `arckit-verify-implementation` 和治理收口。
- skill 创建、维护、反馈固化：`arcforge-skill-creator`；隔离验证或模拟测试用 `arcforge-skill-first`。
- 发布/出包/测试分发/应用商店候选：默认 `arckit-git-branching`，把意图转成 `release/*` 分支和 tag push 触发远端 workflow；不展开本地构建、archive、上传或平台发布流程。
- 远端出包 workflow 失败但缺少错误原因：默认 `arckit-git-branching`，先指导用户从远端 workflow UI、平台通知和开发者邮箱收集失败原因原文；拿到错误前不进入 debug、readiness 或无证据配置修改。
- 发布前 gate、go/no-go、灰度/回滚风险：`arckit-release-readiness`。
- 运行期健康、监控、SLO、告警：`arckit-runtime-operations`。
- 本地桌面记录、任务派发或 Codex dispatch：先确认任务足够明确，再用 `arckit-workshop-desktop`。
- 显式角色协作：`arckit-role-orchestration`，且执行前需要用户确认。

## Coordination Rules

- 入口先编排再执行：先形成 workflow frame，再读取专门 skill。
- Workflow memory 是 scenario workflow resolution 和 overlay 来源：命中的 workflow 必须绑定到本轮 frame，并改写或明确不改写本轮 workflow frame，不能只展示为来源。
- 执行记录不是新 workflow：每次任务写 `execution_record`；同类场景维护同一个 accepted/candidate workflow。
- 每轮执行 artifact impact scan：稳定事实进 spec/interaction/visual/tech，未决问题进 pending，目标任务影响进 governance，流程经验进 workflow memory。
- Artifact impact scan 不按任务规模设置特殊分支：所有任务都按同一组目标逐项判断。最终表述可以简洁，但不得用任务规模推断结果，也不得用“无项目事实变化”替代 workflow memory closeout 判断。
- 执行中保留 reflection gates：after_context_read、before_edit、after_execution、before_final、turn_adaptation。
- 后续用户消息是 turn adaptation gate：出现补充、纠错、换目标、事实纠正、回答澄清或暂停时，先用 `arckit-turn-adaptation` 分类，再决定是否重编 workflow frame 或更新 artifact routing。
- Workflow memory 默认参与：开始做 workflow resolution，结束写 execution record 并做 closeout；具体 signal、candidate、accepted、executions 和 index 规则由 `arckit-workflow-memory` 处理。
- 正向实现也进入 workflow frame：不要因为没有技术栈 skill 就完全跳出 ArcKit。
- 过程 handoff 临时保存：需要后续复用但未确认时放 `arckit-pending`。
- 工作流偏好和项目事实分离：workflow memory 只记录 agent 工作方式。

## Source of Truth

- 原始输入事实：`arckit-intake`。
- 产品定义事实：`arckit-spec`、`arckit-interaction`、`arckit-visual`、`arckit-tech`。
- 项目治理事实：`arckit-project-governance-workflow`。
- 规划辅助事实：`arckit-iteration-planning`、`arckit-team-responsibility`、`product-work-item-discovery`。
- 未承诺上下文：`arckit-pending`。
- 桌面执行记录：Workshop Desktop。
- Workflow Memory：`~/.arckit/workflows/` 或项目级 workflow memory。

Workflow memory 不替代项目事实源。
