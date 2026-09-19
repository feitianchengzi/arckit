# Project State v5 模型

Project State 从宏观层面回答三件事：当前怎么推进、这个软件项目包含哪些能力决策、所有软件变化必须持续满足什么抽象正确性。它不登记 skill、路径、owner、固定执行流程或全部历史 Case。

## 1. Advancement

`advancement` 保存当前 active Iteration、未完成 Case refs、实际 Project gaps 和 `selection_context`。Project gap 表示真实存在、值得跨 Case 跟踪的项目级缺口；open 软件决策不自动等于 gap。closed Case 历史只保存在 Case INDEX 与 Iteration。

## 2. Software definition

`software_definition.decision_areas` 是协议明确且顺序稳定的清单。Agent 必须结合用户意图、长期事实和源码逐项理解当前项目的决策，不得自行删减或把它换成临时生成的项目清单。该清单是软件事实的观察与归属维度，不是待执行任务列表；恢复各项状态不要求在当前 Gap 中把它们同时定案。

| ID | 要回答的宏观问题 |
| --- | --- |
| `product_intent_and_scope` | 软件为什么存在，服务谁，边界是什么？ |
| `product_capabilities` | 必须提供哪些产品能力？ |
| `runtime_surfaces` | 包含哪些端、界面、服务或运行表面？ |
| `experience_and_interaction` | 用户旅程、交互与反馈如何工作？ |
| `visual_language` | 视觉语言、主题和组件呈现遵循什么？ |
| `identity_and_access` | 是否需要身份、登录、角色和权限？ |
| `data_and_state` | 核心数据、状态、生命周期和持久化如何定义？ |
| `external_integrations` | 依赖哪些外部系统和集成边界？ |
| `feedback_and_support` | 是否需要反馈、帮助、支持与故障恢复入口？ |
| `commercialization_and_entitlement` | 是否收费、授权、订阅或限制权益？ |
| `technical_foundation` | 技术栈、架构与关键技术约束是什么？ |
| `security_privacy_compliance` | 安全、隐私和合规要求是什么？ |
| `quality_and_validation` | 如何证明正确性和控制回归风险？ |
| `delivery_and_distribution` | 如何构建、发布、分发、升级和跨平台交付？ |
| `observability_and_operation` | 如何观测、诊断和运营运行中的软件？ |

每个 area 的 `decision` 使用 `open | settled | deferred | stale`：

- `open`：尚无可靠结论；可以没有 gap。
- `settled`：结论清楚，statement/reason/evidence 完整。
- `deferred`：当前明确不决策，必须写 reason 与 resume_condition。
- `stale`：旧结论因新事实失效，必须由 gap_refs 承接。

一个 Gap 可以将可共同决定、共同验收的相关低风险结论同步到多个 area；仅能分别验证不要求拆分。重要独立取舍、关键难点或需要先取得一个答案才能决定其余工作的缺口须独立选择，不以“完善整个需求”为由一并 settled。尚未解决的 area 保留真实状态；发现旧结论失效时可以标记 stale 并记录缺口，无需同轮建立替代方案。

这里的“清楚”只表示该软件定义决策本身清楚，不存在“已清楚但未和代码对齐”的复合状态。后续实现 Gap 会读取全部相关决策；实现偏离属于 Case impact/gap，而不是污染 decision status。

权威清单和文字由 `scripts/project-software-definition.mjs` 定义，`project-state.mjs` 初始化并严格校验。项目个性化通过更新这些 area 的 decision 达成，而不是修改通用 skill。

## 3. Software invariants

`software_invariants` 保存实际应用到项目的抽象约束。每项包含稳定 `id`、`applies_when`、`must_hold`、`evidence_expectation` 与 `priority`。Agent 从当前 trusted snapshot 逐项读取，再依据事实判断适用性和未解决义务，不从名称猜测内容，也不以 skill 正文中的分类替代项目定义。

模板内容只在 [templates/software-invariants.json](../templates/software-invariants.json) 定义；`scripts/project-invariants.mjs` 动态加载模板用于初始化和确定性校验。Agent 从 trusted State 读取并理解实际内容，提示词、Host 和脚本不预设条目数量、领域、顺序或语义判断。模板核心项继续精确校验；必要的协议更新通过 sync_core 或协议恢复处理。项目可增加符合既有协议的长期非核心不变量。模板可以演进，旧判断不自动继承新含义。

完整 assessment 根据 observed Project revision 下的实际集合校验覆盖、重复项、引用和处置关系。Agent 使用的数量、适用条件和证据要求来自该集合；后续定义或扩展由相应维护机制管理，工作方法无需复制一份同步修改。

### 不变量、缺口与轮次的关系

不变量是下限不是上限，是保障不是自主推理的限制，也是必须的不是可选的。每轮显式考虑实际 catalog，但候选还可来自目标、用户输入、执行反馈、依赖和外部变化；业务 Gap 需关联实际不变量责任；控制与恢复义务可不映射业务方向并说明原因。`priority` 表示责任强度，required 要求明确判断，不意味着本轮清零或固定工作排序。状态含义、混合结果、反证更新和事实载体维护见 [invariant-assessment.md](invariant-assessment.md)。

不变量描述软件应持续具备的正确性，不是每个 Loop 都要全部重新完成的工作列表。`applies_when` 判断事实是否触及该责任，`must_hold` 描述应维护的状态，`evidence_expectation` 描述接受相应结论所需的证据；这些字段都不选择本轮行动。

每轮识别全部相关义务后，只选择当前最关键、最值得独立解决的缺口。选中根因诊断，不等于本轮还要确定产品、交互和技术方案。其他相关责任可以在 assessment 中保持 threatened/undetermined 并由开放 Gap 承接；已有证据充分时 upheld，确实无关时 not_relevant。不能用 not_relevant 代替“本轮不做”，也不能为追求全部 upheld 顺带补齐独立决策。

Case facts 保存已证实的观察与结论，Gap 保存尚未成立的具体结果及其共同验收的子结果，impact 保存事实对 Project target 的实际影响，assessment 保存本轮对不变量的完整判断。接受一个事实不表示它引出的所有问题都已解决；多个视角发现的是同一问题时可以关联同一 Gap，相关低风险结果可以合并，重要独立取舍和预期建立与正式兑现仍须分开。

## 生效机制

Agent 从 trusted snapshot 恢复 Project State、active Cases 和相关工程上下文，选择前依据 Case 目标、相关预期、当前事实和未决问题逐项识别责任，综合其他候选来源判断当前最重要的 Gap；提交时按实际证据更新完整 assessment。只有当前事实或 transition 对 target 产生实际影响时才记录持久 impact。结论形成或改变的当轮维护对应事实载体，不等到 Case 最后补文档。下一轮 fresh-read 后重新评估，因此先前判断可因新事实改变。Runtime 只传输与动态投影，不推导领域、skill、路径或结果。
