# Project State v5 模型

Project State 从宏观层面回答三件事：当前怎么推进、这个软件项目包含哪些能力决策、所有软件变化必须持续满足什么抽象正确性。它不登记 skill、路径、owner、固定执行流程或全部历史 Case。

## 1. Advancement

`advancement` 保存当前 active Iteration、未完成 Case refs、实际 Project gaps 和 `selection_context`。Project gap 表示真实存在、值得跨 Case 跟踪的项目级缺口；open 软件决策不自动等于 gap。closed Case 历史只保存在 Case INDEX 与 Iteration。

## 2. Software definition

`software_definition.decision_areas` 是协议明确且顺序稳定的清单。Agent 必须结合用户意图、长期事实和源码逐项理解当前项目的决策，不得自行删减或把它换成临时生成的项目清单。

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

这里的“清楚”只表示该软件定义决策本身清楚，不存在“已清楚但未和代码对齐”的复合状态。后续实现 Gap 会读取全部相关决策；代码偏离属于 Case impact/gap，而不是污染 decision status。

权威清单和文字由 `scripts/project-software-definition.mjs` 定义，`project-state.mjs` 初始化并严格校验。项目个性化通过更新这些 area 的 decision 达成，而不是修改通用 skill。

## 3. Software invariants

六条核心不变量独立于具体软件能力和项目决策：

- `product-expectations-remain-recoverable`
- `interaction-expectations-remain-recoverable`
- `visual-language-remains-consistent`
- `technical-decisions-remain-explainable`
- `accepted-facts-are-realized`
- `material-risks-have-credible-evidence`

它们为每个具体 Case Loop 提供六个互补的抽象判断责任：产品、交互、视觉和技术四条分别判断对应长期预期或决策是否仍准确、清楚、可恢复；realization 判断现实软件状态是否兑现相关已接受事实；risk 判断重要风险主张是否有可信依据。前四条需要权威长期事实证据，不能只用现实状态或风险证据替代；后两条也不能反过来代替长期预期或决策的明确表达。

Agent 必须从 fresh Case facts 判断 applicability，而不是从计划中的行动或已经完成的 transition 倒推。新事实只要建立、改变、否定、暴露缺失、使既有内容过时、产生歧义或与长期事实冲突，就可能使相应 invariant 相关；没有主动修改某个事实域不等于不相关。Invariant 的语义责任不等于固定 skill、路径、工件或工作类型，Agent 仍结合 Project decisions、事实来源和动态能力决定如何查询、确认或维护；实际相关且未成立的结果由动态 Case Gap 承接。核心定义由 `scripts/project-invariants.mjs` 管理；具体需求、技术栈、模块、文件或一次 Case 发现都不是新 invariant。

## 生效机制

Runtime 把完整 Project State、active Cases 和相关工程上下文交给同一 Agent。Agent 每轮从具体事实独立判断当前最重要的 Gap，并在 v8 transition 中对当前全部 invariants 留下显式 assessment；只有当前事实或 transition 对 target 产生实际影响时才记录持久 decision/invariant impact。每次被接受的 transition 可原子更新 Project decision/invariant/gap；下一轮 fresh-read 后重新评估全部 invariants，因此先前已处理的事实域也可以因新事实重开。Runtime 只传输 assessment，不推导 skill、路径或结果。
