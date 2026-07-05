---
name: arckit-development-ledger
description: 维护目标项目 arckit/project、arckit/cases 和后续 arckit/iterations 中的软件研发状态账本。默认由 using-arckit 在首轮软件项目协作、上下文恢复、每轮 closeout 或需要创建/校验/审计项目状态、case record、迭代状态时路由触发；用于保存 project_state_record、development_case_record、project_state_delta、completion_audit、索引和关闭状态。用户明确点名本 skill、维护本 skill 本身或隔离测试时可直接使用。
---

# ArcKit Development Ledger

`arckit-development-ledger` 维护目标项目的软件研发状态账本。它把项目级连续状态、研发事项 case 和后续迭代状态保存在目标项目的 `arckit/` 数据区；schema、脚本和维护协议属于本 skill 自身。

## Scope

受管理的目标项目数据：

```text
<project-root>/arckit/project/STATE.md
<project-root>/arckit/cases/INDEX.md
<project-root>/arckit/cases/active/*.md
<project-root>/arckit/cases/closed/*.md
<project-root>/arckit/iterations/...
```

本 skill 的实现承载：

```text
scripts/project-state.mjs
scripts/development-case.mjs
schema/project-state-record.schema.json
schema/development-case-record.schema.json
```

## 主流程

### 1. 绑定项目账本

输入：目标项目根目录、用户请求、已有 `arckit/project/STATE.md`、`arckit/cases/INDEX.md`、active cases、事实源和用户纠错。

动作：
- 默认把软件开发请求视为真实项目连续演进的一部分。
- 如果 `arckit/project/STATE.md` 缺失且可写，创建可恢复的 `project_state_record`。
- 读取 active case 索引；已有相关 active case 时复用并更新。
- 账本脚本只写目标项目的具体记录，不把 schema 或脚本复制到目标项目 `arckit/` 数据区。

退出条件：得到可恢复的项目状态路径、case 路径或 pending write 状态。

### 2. 维护项目连续状态

项目状态至少维护：

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

动作：
- 把用户输入、case 结果、稳定事实源、实现探索和验证结果映射到项目维度。
- 当项目定位、目标用户、核心场景、协作模型、平台边界、长期工作方式或 agent 操作原则改变时，必须在 `project_state_delta.changed`、`decisions` 或 `project_memory` 中记录源事实变化；不要只记录下游 artifact、skill、代码或文档改动。
- 实现探索产生的网页、脚本、原型、移动端壳或服务端代码先作为探索证据。
- 只有用户确认、稳定事实源、验证结果或明确决策支撑时，才把项目级维度标记为 `satisfied`。
- 每轮生成 `project_state_delta`，包含 changed、unchanged_unknown、deferred、blocked 和 next_project_question。

退出条件：项目级维度状态和证据成熟度可解释，未确认内容有下一步。

### 3. 维护研发事项 case

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
- 当本轮存在源事实和投影产物关系时，在 case 的 `decisions`、`open_questions`、`pending_handoffs` 或 `rounds` 中记录：`source_facts_changed`、`projection_artifacts_changed`、`deferred_projections`、`blocked_projections` 或 `source_unknown`。这可以用简洁文本表达，不要求改变 schema。
- 如果只更新了投影产物而源事实未知或未更新，completion audit 不应写成完整完成；应保留 active、deferred 或 blocked，并写明下一轮需要定位或维护的源事实。
- case 完成后移动到 `arckit/cases/closed/`；未完成时保留 active，并写明 next_round_goal。
- case 只记录当前研发事项状态，不替代项目状态、pending、workflow memory 或稳定事实源。

退出条件：case record 可被未来 agent 读回，并能驱动下一轮继续、关闭、阻塞确认或交接。

### 4. 维护迭代状态

当前版本先预留迭代账本能力。需要跨多个 case 管理阶段目标、里程碑、验收口径和节奏时，写入 `arckit/iterations/`，并保持与 project state 和 active cases 的引用关系。

退出条件：如果本轮不需要迭代账本，标记为 not_applicable 或 deferred，不创建空目录。

## 脚本

运行脚本时，工作目录应设为目标项目根目录。

```text
node <skill-dir>/scripts/project-state.mjs init --name "<project-name>" --intent "<user intent>"
node <skill-dir>/scripts/project-state.mjs validate [state-file]
node <skill-dir>/scripts/project-state.mjs summary [state-file]

node <skill-dir>/scripts/development-case.mjs new --title "<title>" [--artifact-type code] [--intent "..."]
node <skill-dir>/scripts/development-case.mjs validate [case-file]
node <skill-dir>/scripts/development-case.mjs audit <case-file> [--write]
node <skill-dir>/scripts/development-case.mjs close <case-file> [--force]
node <skill-dir>/scripts/development-case.mjs index
```

## 输出要求

报告变更时包含：

- `ledger_paths`：项目状态、case、index 或 pending write 路径。
- `project_state_delta`：项目级 changed、unchanged_unknown、deferred、blocked、next_project_question。
- `case_record_delta`：case 当前状态、current_round_gap、completion_audit 和 next_round_goal。
- `source_projection_delta`：当适用时，说明源事实变化、投影产物变化、延期或阻塞的投影，以及是否存在只改投影未改源的风险。
- `ledger_validation`：脚本校验结果或无法校验原因。
- `next_ledger_step`：下一轮应继续、关闭、阻塞确认、补项目状态、补 case，还是进入迭代账本。
