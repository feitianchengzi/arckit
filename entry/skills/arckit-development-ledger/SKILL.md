---
name: arckit-development-ledger
description: "维护 arckit/project 与 arckit/cases 的 Project State、Case State、iteration 和确定性 transition。适用于项目初始化、上下文恢复、状态驱动 loop、人工或 Runtime closeout、Case audit 与 Project 聚合。Project 只管理宏观完整性和 Case 选择；Case 管理单事项 definition/implementation/verification 完整性；不把日志、prompt、固定 skill 顺序或 Runtime 策略写入状态。"
---

# Arckit Development Ledger

本 skill 是 Project State -> Case -> Loop 的 canonical ledger。人工直接使用与 Runtime 调用通过同一组 `case_control` / `case_transition` 可信入口；Runtime 只负责 gate 和调用 trusted entrypoint，不复制写回语义。

## 受管理对象

- `arckit/project/state.record.json`：`project-state-record/v3`，宏观软件完整性、project gaps、active Case refs 与 `case_control`。
- `arckit/project/STATE.md`：Project record 的有损决策投影。
- `arckit/project/iterations/*.record.json`：`iteration-state-record/v2`，只保存阶段性 Project 目标、resolved Case 聚合、验收状态和 Case refs。
- `arckit/cases/{active,closed}/*.md`：`development-case-record/v3`，单个有边界事项的完整 Case State、内容 revision 与完成态复审。
- Runtime execution records：raw process/evidence，由 Runtime 宿主在项目目录外管理；Case 只保存可选 opaque run ref，不依赖该记录恢复语义状态。

## 硬边界

- Project State 不保存 next responsibility、trigger mode、continuation prompt、Worker 顺序或轮次目标；这些属于 Case handoff/Loop。
- Iteration State 同样不保存 Loop continuation、当前 Worker 路线或日志型同态变化；每条 accepted Project change 必须改变状态、绑定 closed Case 并提供持久证据。
- 每个尚未达到 target、带明确 gap 且 priority 非 none 的 Project dimension，必须被至少一个 `state_gap.covered_dimensions` 覆盖；覆盖关系用于 Case 选择，不表达固定顺序。
- `arckit-case-transition/v2` 是语义对象，不以临时文件为状态载体。Runtime 直接传递对象；人工或 Agent CLI 对一次性载荷优先使用 stdin。只有调用环境不能传 stdin 时才创建调用方拥有的临时文件，并负责限制权限、最终清理且绝不把路径写入 evidence。详细 transport 规则见 [references/transition-transport.md](references/transition-transport.md)。
- canonical state 不接受 `/tmp`、`/private/tmp` 或其他临时目录作为 evidence ref；被状态依赖的证据必须持久可恢复。
- ledger entrypoint 不在目标项目创建完整 Runtime result、activity、events 或 transcript。Desktop run 使用 `arckit-runtime://runs/RUN-...` 作为可选追踪引用；非 Desktop 调用可以留空，且两种情况都必须依靠 Case round 的 accepted delta 与 evidence 独立恢复。
- Case renderer 必须把 transition、命令和 evidence 当作不透明数据逐字往返；不得为了避开序列化字符而改写真实证据。dry-run 必须覆盖 Structured Record 渲染重解析和 Case 索引输入预检。
- Project 维度初始化为 `unknown -> unknown`。只有项目目标和证据明确时才设置 target；不为所有项目预置 accepted 义务。
- Case 的六个结果 facets 是 product、interaction、visual、technical、implementation、verification；open questions、pending handoffs 和 process notes 不是同一种 facet。
- facet 使用正交状态：`applicability`、`maturity/target_maturity`、`alignment/target_alignment`、`resolution`。
- 每个 facet 最终必须是 evidence-backed required target，或 evidence-backed not_required。未知、暂缓、只有代码存在、只有文档存在都不能完成。
- definition alignment 可以因实现变化退回 stale/diverged；状态不是只升不降。
- 六个 facet、open questions 与 pending handoffs 全部完成只表示 `base_ready`。当前 `content_revision` 必须经过 correctness、completeness、minimality 三维完成态复审并得到 clean，Case 才能 resolved。
- 完成态复审有 Case 创建时显式快照的自主轮次上限。最后一个授权轮次仍不 clean 时，ledger 必须派生 human-only gap 和 `needs_human` handoff；Agent 不得重置计数或自行追加预算。
- `deferred` 不是 Case resolution 或 Loop handoff 状态。移交必须有 owner 与恢复条件，并保持 unresolved，直到 ledger 能派生 resolved。

## 主流程

### 1. 绑定 Project 与 Case

读取 Project v3、active iteration、`case_control` 和全部 active Case v3。Project 先选择已有 Case，或创建一个承载当前项目推进意图的新 Case；新 Case 必须从显式 Case/Runtime policy 快照 `max_review_cycles`，不能由 ledger 内置业务默认值。随后 Controller 只能从 selected Case 的 `case_resolution.candidate_gaps` 选择本轮 transition。

Runtime 收到 Controller 的 `arckit-case-control-handoff/v1` 后，`case_control` 入口校验 Project revision 和 active Case 范围。`create_case` 由 ledger 分配 Case id，并使用 Controller 给出的 title、intent、artifact type 与 selection reason；复审上限来自 Runtime 显式 policy 快照。创建/选择、Project 与 iteration 注册、投影和 Case index 作为可回滚操作提交。Runtime 不得以任务文本或固定规则补造这些语义字段。

退出条件：Project 有明确 selected Case ref，Case record 可恢复。

### 2. 维护 Case State

新 Case 的全部 facet 从 applicability unknown 开始，不预判哪些文档或实现必需。Controller/人工通过实际场景逐项形成 required/not_required 判断；required 时设定 target maturity/alignment。

`development-case.mjs audit` 确定性派生：

- satisfied facets
- remaining/blocked
- 全部 unresolved `candidate_gaps`；数组顺序不表示优先级
- `case_resolution`
- `loop-handoff/v2`

open question 只有 resolved/transferred 后才不阻塞；pending handoff 只有 completed/cancelled 后才不阻塞；process notes 从不作为完成 facet。

六个 facets、问题和 handoff 满足后，audit 只派生 `completion_review` gap，不直接 resolved。复审发现项派生 `review_findings` gap；修复或有证据的处置提升 `content_revision`，旧 clean 结论随即失效。应用这类 transition 前读取 [references/completion-review.md](references/completion-review.md)。

### 3. 应用统一 Case transition

人工或 Runtime 都向 `case-transition.mjs` 提交 `arckit-case-transition/v2`。入口只接受：Case id、预期 `case_updated_at` revision、完整 concrete Case gap（含 responsibility）、planned transition、accepted state delta、evidence、unresolved、round outcome、Controller case resolution claim、Project impact candidate。

人工或 Agent 直接调用 CLI、需要选择 stdin/文件输入或处理临时载荷时，先读取 [references/transition-transport.md](references/transition-transport.md)。CLI 不删除调用方提供的文件；临时输入的生命周期由创建方管理。

入口按顺序：

1. 校验 Case id、expected revision、gap、delta 字段和证据。
2. 对照当前 Case 精确校验 selected gap 的 id、facet、responsibility、current/target state 与 next transition；过期 transition 必须重做 Controller 判断。
3. 在副本上应用 accepted facet/question/handoff/review delta并重新审计完整 Case；内容修改和 clean 复审不能在同一个 transition 中提交。
4. 拒绝强于派生结果的 resolved claim，以及无真实状态变化或证据不完整的 Project impact。
5. 预校验 Case、Project 和 iteration 的完整目标状态，并对渲染后的 Structured Record 做逐字语义往返检查、对 Case 索引现有输入做只读预检。
6. 作为一个提交写 Case、Project、iteration 与 projections/index；任一步失败都恢复提交前状态。
7. 重新生成 candidate gaps 与 loop handoff；resolved 时关闭并移动 Case。
8. Case resolved 时同步关闭 Project/Iteration 对该 Case 的引用；仅当 Project impact 为 accepted 时应用显式维度变化。

退出条件：Case record 是 transition 后的唯一事实，或整个 ledger commit 无副作用地失败。外部 Runtime 记录不参与 canonical ledger 原子提交。

### 4. 聚合 Project/Iteration

Case 未 resolved 时不修改 Project dimensions，不把 round progress 投影成宏观成熟度。Case resolved 后：

- 从 active refs 移除 Case，保存 closed ref。
- 只应用 `project_impact_candidate.changes` 中显式、from_state 匹配的维度变化。
- 更新 `case_control`，让 Project 再选择下一个 Case。
- iteration 只记录同一组显式变化和 Case evidence。
- resolved Case 未完成全部 covered dimensions 时，Project gap 保留并清除已关闭的 `candidate_case_ref`，不能因为一次 Case closeout 静默丢失剩余宏观 gap。

### 5. 渲染与校验

每次写 canonical record 后重新渲染 STATE/iteration brief 和 Case index。raw operator event、完整 prompt、worker stream 或 runtime envelope 只能进入 Runtime 宿主拥有的外部记录；Case round 最多保存 opaque run ref，不能保存宿主文件系统路径或复制 raw envelope。

Project/Iteration audit 必须保证 active iteration 使用 v2、两侧 `active_case_refs` 完全一致、`case_control.selected_case_ref` 属于 active Cases、gap candidate 指向真实 active Case、closed Case evidence 可解析、所有 actionable dimensions 有 gap 覆盖，且 canonical evidence 不依赖临时文件。`select-case` 必须把 Case 原子注册到 Project 与 active Iteration，不能接受悬空或非 active 路径。

## Trusted entrypoints

`arckit.capability.json` 是 Runtime 唯一绑定契约：

- `project_state`: `scripts/project-state.mjs`
- `project_iteration`: `scripts/project-iteration.mjs`
- `development_case`: `scripts/development-case.mjs`
- `case_control`: `scripts/runtime-case-control.mjs`
- `case_transition`: `scripts/case-transition.mjs`
- `writeback`: `scripts/runtime-writeback.mjs`

Runtime 不得把本 skill 绑定给普通 Worker，也不得复制其 schema 迁移、audit 或聚合逻辑。

## CLI

```text
node scripts/project-state.mjs init --name "Project" --intent "..."
node scripts/project-state.mjs select-case --case-ref "arckit/cases/active/CASE-...md" --intent "..." --reason "..."
node scripts/project-state.mjs repair-runtime-refs [record]
node scripts/project-state.mjs render|audit|validate|summary [record]

node scripts/development-case.mjs new --title "..." --artifact-type mixed --intent "..." --max-review-cycles 3 --review-policy-source "explicit-policy-ref"
node scripts/development-case.mjs validate [case]
node scripts/development-case.mjs audit <case> --write true
node scripts/development-case.mjs close <case>
node scripts/development-case.mjs index [--dry-run true]

node scripts/case-transition.mjs validate <transition.json|->
node scripts/case-transition.mjs apply --case <case.md> --transition <transition.json|-> [--dry-run true]
```

## 输出

- `ledger_paths`
- `case_transition_result`
- `case_control_result`
- `case_record_delta`：facets、content revision、completion review、candidate gaps、derived resolution
- `round_outcome`
- `loop_handoff_delta`
- `project_state_delta`：仅 resolved Case 聚合结果
- `iteration_state_delta`
- `ledger_validation`
- `next_ledger_step`
