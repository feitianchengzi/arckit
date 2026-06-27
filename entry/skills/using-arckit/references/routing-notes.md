# Using ArcKit 路由说明

本文件承接 `using-arckit` 的详细路由知识。主 `SKILL.md` 只保留门禁；需要判断场景、skill 组合或事实源边界时读取本文件。

## 能力分层

- 入口编排层：`using-arckit`；workflow memory 使用 `arckit-workflow-memory`；显式角色协作使用 `arckit-role-orchestration`。
- 判断层：`arckit-decision-framework`。
- 想法层：`arckit-idea`、`arckit-market-research`、`arckit-idea-explore`。
- 过程层：`arckit-draft-spec`、`arckit-explore-product-design`、`arckit-architecture-decision`、`arckit-domain-modeling`。
- 定义层：`arckit-spec`、`arckit-interaction`、`arckit-visual`、`arckit-tech`。
- 治理层：`arckit-project-governance-workflow`。
- 规划辅助层：`arckit-team-responsibility`、`arckit-iteration-planning`、`product-work-item-discovery`。
- 记忆层：`arckit-intake`、`arckit-pending`、`arckit-workflow-memory`。
- 诊断层：`arckit-debug-diagnosis`。
- 质量层：`arckit-verify-implementation`、`arckit-code-review`。
- 交付层：`arckit-release-readiness`、`arckit-runtime-operations`。
- 桌面桥：`arckit-workshop-desktop`。

当前仓库不承载具体技术栈的正向编码 skill。用户要求实现代码时，先形成 `implementation_handoff`，再按普通代码工作流或外部 `arckit-code` 执行；实现改变范围、证据、计划或稳定文档时，再回到对应 ArcKit skill。

## 默认顺序

```text
user intent
-> scenario classification
-> runtime situation model
-> arckit-workflow-memory memory_check
-> memory overlay patch match
-> workflow frame compilation
-> specialist skills with explicit handoffs and reflection gates
-> artifact impact scan and result/pending/governance write-back when needed
-> arckit-workflow-memory closeout decision and candidate/index maintenance
```

## Workflow Frame 字段

- `scenario`
- `signals`
- `runtime_situation`
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
- `workflow_memory`
- `confirmation_points`
- `stop_conditions`

## Workflow Composition Reasoning

编译 workflow frame 时先回答下面问题。答案可以很短，但必须足以解释为什么当前选择这些能力、跳过哪些能力，以及下一次何时重编译。

- `final_goal`：用户最终想得到什么，例如可运行代码、产品判断、可确认原型、稳定规格、技术方案、修复结果、发布判断或工作流维护结果。
- `current_phase`：本轮当前最应该处于探索、定义、原型、视觉、技术方案、实现、验证、治理、记忆沉淀或收口中的哪一段。
- `phase_reason`：为什么当前阶段不是直接实现、不是继续讨论、不是先写稳定事实源，或为什么必须请求确认。
- `missing_piece`：当前最缺的是证据、选择、确认、交互结构、视觉方向、产品规则、技术边界、实现改动、验证结果还是流程记忆。
- `available_arckit_capabilities`：列出本轮可能相关的基础能力，例如 `arckit-explore-product-design`、`arckit-interaction`、`arckit-visual`、`arckit-spec`、`arckit-tech`、`arckit-debug-diagnosis`、实现工作流、`arckit-verify-implementation`、`arckit-pending`、`arckit-workflow-memory`。
- `selected_capabilities`：只选择当前阶段实际需要的能力，并说明每个能力补哪个缺口。
- `why_not_selected`：对明显相关但本轮不选的能力给出简短理由，避免 agent 凭直觉跳过原型、确认、验证或实现。
- `artifact_stability`：区分稳定事实、过程产物、候选方案、待确认假设和 workflow signal 来源；不要把过程讨论直接写入稳定事实源。
- `adaptation_triggers`：记录哪些信号会让本轮重新编译 workflow。
- `next_recompile_condition`：明确下一次重编译条件，例如用户选择方案、原型反馈、测试失败、发现技术阻塞、用户质疑流程、确认点通过或目标阶段切换。

### 能力选择启发式

- 当用户最终要代码但当前缺交互结构、方案选择或视觉方向时，先选择探索、交互或视觉能力形成过程产物；实现能力保持为后续 handoff，而不是丢失最终目标。
- 当用户要求“让我选择”“先给方案”“先生成原型”“确认后再做”时，当前阶段通常是探索、原型或确认；实现、稳定 spec 或 tech 只有在确认后进入。
- 当用户描述清楚、风险低、已有 artifact 足够且没有确认/比较信号时，可以直接实现；但仍要在 workflow frame 中说明跳过探索、交互、视觉或技术方案的原因。
- 当用户最终目标和当前步骤分离时，workflow frame 必须同时保留二者，例如 `final_goal: 生成可运行代码`，`current_phase: 先做交互原型供选择`。
- 当用户反馈“为什么没先...”“不是这个意思”“你是不是没按 using-arckit 生成工作流”时，不要争辩默认流程；把它识别为 workflow-level correction，重新判断 final goal、current phase 和 selected capabilities。
- 当实现中发现定义不稳定、视觉/交互歧义、技术边界不清、验证失败或用户改口，触发重编译，而不是把当前路径硬走完。

### Workflow-Level Correction 恢复协议

触发 workflow-level correction 时，输出并执行：

```yaml
workflow_recompile:
  detected_deviation: ""
  corrected_final_goal: ""
  corrected_current_phase: ""
  phase_reason: ""
  selected_capabilities: []
  why_not_selected: {}
  recovery_next_step: ""
  workflow_signal_decision_hint: write_signal|update_candidate_only|skip
```

`workflow_signal_decision_hint` 只是给 `arckit-workflow-memory` 的 closeout 输入，不替代最终 signal decision。

## Workflow 选择优先级

1. 当前用户明确指令。
2. 当前对话中已确认的 workflow 调整。
3. 当前项目级 workflow memory。
4. 当前项目个人 workflow memory。
5. 用户全局 workflow memory。
6. Arckit 默认场景 workflow。
7. 临时生成的 ad-hoc workflow。

## 默认 Workflow 参考

- 原始资料归档：`arckit-intake`，随后按内容进入分析或定义。
- 反馈、需求、bug、风险、任务候选：治理推进走 `arckit-project-governance-workflow`；暂不承诺走 `arckit-pending`；具体执行另起 debug/spec/design/tech/code/verify。
- 读项目后推荐后续开发：`product-work-item-discovery`；需要排期或 owner 时再接 `arckit-iteration-planning`、`arckit-team-responsibility`、`arckit-project-governance-workflow`。
- 模糊想法判断：`arckit-decision-framework`，需要外部证据接 `arckit-market-research`，需要用户研究或线框接 `arckit-idea-explore`。
- 方向变成可执行版本：缺定义先补定义；缺推进方式用 `arckit-project-governance-workflow`；最后形成 `implementation_handoff`。
- 功能、页面或模块定义：产品行为写 `arckit-spec`；交互写 `arckit-interaction`；视觉写 `arckit-visual`；技术方案写 `arckit-tech`。
- 正向实现：`implementation_handoff` -> 普通代码工作流或外部 `arckit-code` -> `arckit-verify-implementation`。
- bug、回归、偶发失败、性能退化：`arckit-debug-diagnosis` -> `arckit-verify-implementation`；需要运行期信号时接 `arckit-runtime-operations`。
- 代码审查：`arckit-code-review`，必要时接 `arckit-verify-implementation` 和治理收口。
- skill 创建、维护、反馈固化：`arcforge-skill-creator`；隔离验证或模拟测试用 `arcforge-skill-first`。
- 发布或运行期工作：`arckit-release-readiness` 或 `arckit-runtime-operations`。
- 本地桌面记录、任务派发或 Codex dispatch：先确认任务足够明确，再用 `arckit-workshop-desktop`。
- 显式角色协作：`arckit-role-orchestration`，且执行前需要用户确认。

## Coordination Rules

- 入口先编排再执行：先形成 workflow frame，再读取专门 skill。
- Workflow memory 是 overlay：命中的 candidate/accepted 必须改写或明确不改写本轮 workflow frame，不能只展示为来源。
- 每轮执行 artifact impact scan：稳定事实进 spec/interaction/visual/tech，未决问题进 pending，目标任务影响进 governance，流程经验进 workflow memory。
- 轻量任务可压缩 artifact impact scan：若没有项目事实、未决上下文、治理状态或流程学习变化，输出 `all skipped; no project facts changed` 即可。
- 执行中保留 reflection gates：after_context_read、before_edit、after_execution、before_final。
- 用户流程纠偏是 reflection gate：出现“为什么没有先...”“不是这个意思”“让我选择”“先生成原型”“先确认”“最终要代码但现在先...”等表达时，触发 `user_workflow_correction` 并重新编译 workflow frame。
- Workflow memory 默认参与：开始检查，结束做 closeout decision，并按学习价值写 signal、轻量更新 candidate 或跳过。
- Memory 缺目录也要收口：可写时初始化，不可写时 pending，不能只报告不存在。
- 连续相似任务必须触发 candidate 维护：pending signals 也算 evidence。
- 正向实现也进入 workflow frame：不要因为没有技术栈 skill 就完全跳出 ArcKit。
- 自然沉淀分层：signal -> candidate -> accepted，accepted 必须用户确认。
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
