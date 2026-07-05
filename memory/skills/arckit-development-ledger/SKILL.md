---
name: arckit-development-ledger
description: 维护目标项目 arckit/project 和 arckit/cases 中的软件项目状态、迭代状态与研发事项 case。默认由 using-arckit 在软件项目协作、上下文恢复、每轮 closeout、状态驱动 loop 判断或需要创建/校验/审计 project state、iteration state、case record 时路由触发。用于把每轮工作转化为项目完整性状态变化、迭代状态变化和可接手 case 证据；不把 STATE.md 当作持续增长的日志。
---

# ArcKit Development Ledger

`arckit-development-ledger` 维护目标项目的软件研发状态账本。它的核心目标不是记录“做过什么”，而是支撑基于状态的 loop 工程：读取当前状态，判断目标状态，识别最大状态差距，执行能产生状态转移的行动，验证状态是否真的改变，再回写新的状态。

## Scope

受管理的目标项目数据：

```text
<project-root>/arckit/project/STATE.md
<project-root>/arckit/project/state.record.json
<project-root>/arckit/project/ITERATIONS.md
<project-root>/arckit/project/iterations/*.md
<project-root>/arckit/project/iterations/*.record.json
<project-root>/arckit/cases/INDEX.md
<project-root>/arckit/cases/active/*.md
<project-root>/arckit/cases/closed/*.md
```

本 skill 的实现承载：

```text
scripts/project-state.mjs
scripts/project-iteration.mjs
scripts/development-case.mjs
schema/project-state-record.schema.json
schema/iteration-state-record.schema.json
schema/development-case-record.schema.json
```

## 状态模型原则

- 项目状态是软件项目在完整性模型上的当前取值，不是项目简介、资料索引、轮次日志或 changelog。
- `arckit/project/state.record.json` 是全局完整性状态的 canonical machine-readable record。所有脚本、agent loop、审计和外部平台集成应优先读写它。
- `arckit/project/STATE.md` 是从 canonical record 生成的 loop decision brief。它是有损投影，只保留下一轮 loop 决策需要的 focus、next transition、风险、禁止误判和精确读取入口；不内嵌完整 JSON，不作为第二事实源。
- 迭代状态属于项目状态推进层，必须放在 `arckit/project/iterations/`，并由 `arckit/project/ITERATIONS.md` 索引。
- 每个迭代使用 `*.record.json` 作为 canonical iteration state，配套 `.md` 作为 generated iteration decision brief；不要在迭代 Markdown 中维护完整 JSON。
- case 是状态变化的证据和过程记录，不是全局状态本身。
- skill、代码、文档、CLI、Web、App、API、服务端和 agent workflow 都只是软件实现产物形态；不能因为项目是 skill 类产物就默认排除登录、权限、数据、部署、运行表面或运维维度。
- 一个维度是否需要，不由产物类型先验决定，而由项目目标、用户场景、运行环境、风险边界、交付方式和维护方式决定。
- 完成度不能用百分比表达；必须表达当前状态、目标状态、证据成熟度、gap、next transition、优先级和 confidence。

## 项目完整性维度

全局项目状态至少维护以下通用软件项目维度：

- `project_intent`：项目目标、价值边界和不做什么。
- `users_and_stakeholders`：用户、使用者、维护者、接手者和外部责任方。
- `problem_scenarios`：核心问题、主场景、异常场景和成功标准。
- `product_behavior`：产品行为、能力规则、业务约束和验收口径。
- `user_experience`：人类交互体验，包括 GUI、CLI、agent dialogue、文档 handoff 和操作流程。
- `runtime_surfaces`：运行和使用表面，包括 skill、代码库、CLI、App、Web、API、后台任务或外部平台。
- `identity_access`：身份、权限、租户、密钥、访问控制和审计需求。
- `data_state`：数据模型、持久化、同步、迁移、备份、保留和删除。
- `integration_boundaries`：模型、工具、第三方服务、平台、SDK、外部 adapter 和网络边界。
- `architecture_foundation`：系统结构、模块边界、依赖关系、扩展点和技术约束。
- `implementation_coverage`：实现覆盖、关键路径、平台差异和缺口。
- `quality_validation`：测试、真实场景验证、回归、性能、可用性和验收证据。
- `security_privacy`：安全、隐私、凭证、敏感数据、隔离和滥用风险。
- `delivery_operation`：安装、分发、部署、发布、升级、回滚和运行责任。
- `observability_support`：日志、诊断、指标、故障定位、用户反馈和恢复手段。
- `maintainability_handoff`：未来人类或 agent 如何理解、修改、接手和安全继续。
- `iteration_governance`：当前迭代目标、状态推进节奏、关闭条件和跨 case 收敛。

每个维度使用统一状态语言：

```text
unknown -> needed -> defined -> designed -> implemented -> integrated -> verified -> accepted -> released -> operational
```

维度也可以是 `not_required`、`deferred` 或 `blocked`。只有证据支撑时才能提升状态；代码或 skill 文件存在只能证明 implemented 级别，不自动证明 verified、accepted、released 或 operational。

## 主流程

### 1. 绑定项目账本

输入：目标项目根目录、用户请求、已有 `arckit/project/state.record.json`、`arckit/project/STATE.md`、`arckit/project/ITERATIONS.md`、active iteration、`arckit/cases/INDEX.md`、active cases、事实源和用户纠错。

动作：
- 默认把软件开发请求视为真实项目连续演进的一部分。
- 如果 `arckit/project/state.record.json` 缺失且可写，创建可恢复的 `project_state_record`，并生成 `STATE.md` 投影视图。
- 如果只存在旧版内嵌 JSON 的 `STATE.md`，先迁移到 `state.record.json`，再生成新的投影视图。
- 如果本轮需要阶段目标、版本目标或跨 case 收敛，读取或创建 `arckit/project/iterations/*.md`。
- 读取 active case 索引；已有相关 active case 时复用并更新。
- 账本脚本只写目标项目的具体记录，不把 schema 或脚本复制到目标项目 `arckit/` 数据区。

退出条件：得到可恢复的项目状态、迭代状态、case 路径或 pending write 状态。

### 2. 维护全局项目状态

动作：
- 把用户输入、稳定事实源、实现探索、验证结果、case 结果和风险发现映射为项目完整性维度状态变化。
- 更新 `completeness_dimensions` 的当前状态、目标状态、证据、gap、next transition、priority 和 confidence。
- 维护 `state_gaps`，只放当前最影响 loop 决策的状态缺口，不把所有问题都塞进去。
- 维护 `loop_control`，让下一轮能直接知道当前 loop focus、next transition、priority basis 和 stop condition。
- `active_constraints` 只放仍然有效的项目级约束和决策，不放历史过程。
- `canonical_artifact_refs` 只放当前状态判断所依赖的权威事实源入口；它不是资料导航页。
- 每轮替换 `last_state_delta`，不要累计历史 delta。
- 更新 canonical record 后重新渲染 `STATE.md`，并用 audit 检查 projection 是否漂移；不要手工让两者各自漂移。

退出条件：项目完整性状态可驱动下一轮 loop，当前最大状态差距和下一步状态转移清楚。

### 3. 维护迭代状态

迭代状态放在：

```text
arckit/project/ITERATIONS.md
arckit/project/iterations/*.record.json
arckit/project/iterations/*.md
```

动作：
- 把迭代定义为项目状态转移容器，而不是任务列表或时间日志。
- 用 `target_state_delta` 表达本迭代承诺把哪些项目维度从什么状态推到什么目标状态。
- 用 `current_state_delta` 表达当前已经发生的状态转移。
- 用 `acceptance_state`、`blocking_gaps` 和 `close_condition` 判断迭代能否关闭。
- 迭代 Markdown 只呈现 goal、next state transition、acceptance、remaining gaps、recent changes 和 precision refs。
- 将相关 active/closed cases 作为证据引用，但不要把 case 过程复制到迭代状态。
- 更新 canonical iteration record 后重新渲染 iteration brief，并同步 `arckit/project/ITERATIONS.md` 索引。

退出条件：当前迭代的目标状态、实际状态、阻塞缺口和关闭条件可恢复。

### 4. 维护研发事项 case

case record 至少维护：

- `project_state_ref`
- `user_intent`
- `expected_outcome`
- `current_round_goal`
- `current_round_gap`
- `round_strategy_decision`
- `product_expectation`
- `interaction_expectation`
- `visual_expectation`
- `technical_expectation`
- `implementation_state`
- `verification_state`
- `open_questions`
- `pending_handoffs`
- `workflow_memory_signals`
- `project_state_delta`
- `completion_audit`

动作：
- 新事项创建到 `arckit/cases/active/`。
- 每轮执行后更新 Structured Record，运行校验并同步 `INDEX.md`。
- 在 case 中记录本轮做了什么、为什么做、验证了什么、改变了哪些项目或迭代状态。
- 当本轮存在源事实和投影产物关系时，在 case 的 `decisions`、`open_questions`、`pending_handoffs` 或 `rounds` 中记录：`source_facts_changed`、`projection_artifacts_changed`、`deferred_projections`、`blocked_projections` 或 `source_unknown`。
- 如果只更新了投影产物而源事实未知或未更新，completion audit 不应写成完整完成；应保留 active、deferred 或 blocked，并写明下一轮需要定位或维护的源事实。
- case 完成后移动到 `arckit/cases/closed/`；未完成时保留 active，并写明 next_round_goal。
- case 只记录当前研发事项状态和过程证据，不替代 project state、iteration state、pending、workflow memory 或稳定事实源。

退出条件：case record 可被未来 agent 读回，并能解释一次状态转移或下一轮继续条件。

## 脚本

运行脚本时，工作目录应设为目标项目根目录。

```text
node <skill-dir>/scripts/project-state.mjs init --name "<project-name>" --intent "<user intent>"
node <skill-dir>/scripts/project-state.mjs migrate [legacy-state-file]
node <skill-dir>/scripts/project-state.mjs render [record-file]
node <skill-dir>/scripts/project-state.mjs audit [record-file|state-file]
node <skill-dir>/scripts/project-state.mjs validate [record-file|state-file]
node <skill-dir>/scripts/project-state.mjs summary [record-file|state-file]

node <skill-dir>/scripts/project-iteration.mjs new --title "<title>" [--goal "..."]
node <skill-dir>/scripts/project-iteration.mjs migrate [legacy-iteration-file]
node <skill-dir>/scripts/project-iteration.mjs render [record-file]
node <skill-dir>/scripts/project-iteration.mjs audit [record-file|iteration-file]
node <skill-dir>/scripts/project-iteration.mjs validate [record-file|iteration-file]
node <skill-dir>/scripts/project-iteration.mjs index

node <skill-dir>/scripts/development-case.mjs new --title "<title>" [--artifact-type code] [--intent "..."]
node <skill-dir>/scripts/development-case.mjs validate [case-file]
node <skill-dir>/scripts/development-case.mjs audit <case-file> [--write]
node <skill-dir>/scripts/development-case.mjs close <case-file> [--force]
node <skill-dir>/scripts/development-case.mjs index
```

## 输出要求

报告变更时包含：

- `ledger_paths`：项目状态、迭代状态、case、index 或 pending write 路径。
- `project_state_delta`：项目级 changed dimensions、state transitions、deferred、blocked、next loop focus。
- `iteration_state_delta`：当前迭代目标状态、实际状态、阻塞 gap、关闭条件和下一步。
- `case_record_delta`：case 当前状态、current_round_gap、completion_audit 和 next_round_goal。
- `source_projection_delta`：当适用时，说明源事实变化、投影产物变化、延期或阻塞的投影，以及是否存在只改投影未改源的风险。
- `ledger_validation`：脚本校验结果或无法校验原因。
- `next_ledger_step`：下一轮应推动哪个状态转移、关闭哪个 case、补哪个项目/迭代状态，或进入阻塞确认。
