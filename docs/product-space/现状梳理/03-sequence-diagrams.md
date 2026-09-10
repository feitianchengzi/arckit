# 03 · 时序图

> 基于代码核实(2026-09-10)。六条核心流程的时序步骤,参与者标注:Renderer / Main / Coordinator / runManager / utilityProcess / Codex / workshop / lane。

## 时序 1:应用启动 → setup readiness 通过

```
Renderer          Main                  codexSetupMgr   skillProvisionMgr    workshop
   │                │                         │                │                 │
   │ app.whenReady  │                         │                │                 │
   │───────────────→│ 创建各 manager/coordinator│                │                 │
   │                │─────────────────────────→│                │                 │
   │                │──────────────────────────────────────────→│                 │
   │ loadFile       │                         │                │                 │
   │←───────────────│                         │                │                 │
   │                │ checkCoordinatedDesktopSetupReadiness()  │                 │
   │                │──┬─→ check() probe codex│                │                 │
   │                │  │   codex login status │                │                 │
   │                │  │←──── ready ──────────│                │                 │
   │                │  └─→ check() inspectBundle → provider → plan → drift       │
   │                │       ←── ready (resources+provider+codex passed) ────────→│
   │                │ combineDesktopSetupReadiness: status=ready, can_continue=true
   │                │ shouldStartAutomation? → workSync.reconcile() ─────────────→│
   │                │                         │   automation.maybeStartNext()      │
   │ setup-event    │                         │                │                 │
   │←───────────────│                         │                │                 │
```

关键判断:`status === "ready"` 且 `codex.status === "ready"` 且 `skills.status === "ready"` 且无进行中 operation → `can_continue = true` → `shouldStartAutomationAfterSetupReadiness` → 启动 automation + 15 分钟周期 reconcile 定时器。

## 时序 2:自动化 Loop 一次执行(thread → gap → ledger → closeout)

```
automationCoord    lane          runManager    utilityProc    Codex      workshop
      │              │               │            │            │            │
      │ maybeStartNext│               │            │            │            │
      │─────────────→│ 选 task       │            │            │            │
      │              │ setupReadinessPreflight     │            │            │
      │              │ updateTaskState(in_progress)────────────────────────────────→│
      │              │ startRun ────→│ host.spawn ─→│            │            │
      │              │               │            │ 启动 codex ─→│            │
      │              │               │            │  $using-arckit gap 推进      │
      │              │               │←──────────│ stderr JSONL 事件流          │
      │              │               │ applyRunEvent (phase/messages/timeline)   │
      │              │←── run.activity_changed ───│            │            │
      │              │←── run.finished ───────────│            │            │
      │              │ resolveTaskCaseBinding (trusted ledger write?)             │
      │              │ selectEffectiveLoopHandoff: complete + ledger written + bound
      │              │ startSameThreadCloseout (同 thread Git 收尾 Run)           │
      │              │   └→ startRun ──→│ spawn ──→│ closeout_only │            │
      │              │←── run.finished (closeout completed) ──────────────────── │
      │              │ markCloseoutCompleted → updateTaskState(completed)────────→│
      │              │ recent_completions 记入,清空 active_task                  │
      │              │ sync → maybeStartNext (领下一个)                           │
```

关键节点:
1. **resolveTaskCaseBinding** — 从 ledger_write_receipts 提取 authoritative Case binding(`written === true`)。conflict 或 unbound 走 recovery。
2. **selectEffectiveLoopHandoff** — 判定 next_responsibility(none/human/external)。human/external → setAwaitingHuman/setAwaitingExternalIntervention。
3. **ledger 校验** — `ledger_stage.writeback_required === true` 但 `ledger_write_result.parsed.written !== true` → addRecovery(`runtime_incomplete`)。
4. **closeout** — 验证 Case binding bound + thread_id 存在 → 同 thread 启动 Git 收尾 Run → 验证 closeout_result.status === "completed"。
5. **remote completion** — 验证 canonical Case 已 resolved → updateTaskState(completed) → 记入 recent_completions。

## 时序 3:Chat 发送消息 → 收到 Codex 回复

```
Renderer          Main           chatCoord        codexAdapter      Codex
   │                │                │                  │               │
   │ chat-send IPC  │                │                  │               │
   │───────────────→│ send()         │                  │               │
   │                │───────────────→│ 幂等检查+存用户消息 │               │
   │                │                │ consumeTurn      │               │
   │                │                │ setupReadinessPreflight          │
   │                │                │ adapter.runTurn()──────────────→│ turn
   │                │                │                  │  ←─ delta流 ──│
   │                │                │ codex.agent_message.delta        │
   │                │                │ upsertLiveMessage (32ms debounce)│
   │                │                │ emit chat.message.changed        │
   │ chat-event     │                │                  │               │
   │←───────────────│←───────────────│                  │               │
   │ (流式增量渲染)  │                │                  │               │
   │                │                │ onThreadBound → bindThread (首次)│
   │                │                │ codex.turn.completed             │
   │                │                │ commitLiveMessages → store       │
   │                │                │ emit chat.turn.completed         │
   │ snapshot 返回  │                │                  │               │
   │←───────────────│←───────────────│                  │               │
```

事件分流:
- `codex.agent_message.delta` → upsertLiveMessage(role=assistant, kind=text, content 累积),32ms debounce 通知
- `codex.reasoning.delta` → upsertLiveMessage(kind=reasoning)
- `codex.item.completed`(commandExecution/fileChange/toolCall) → upsert tool message
- `codex.item.completed`(agentMessage) → persistLiveMessage 写入 store
- `codex.turn.completed` → commitLiveMessages + completeRunningMessagesInStore

**approval 请求分支**:adapter → approvalProvider → 向 session push kind=approval 的 pending 消息 → emit chat.approval.requested → 等待 Promise(最长 5 分钟)→ renderer 经 `arckit:chat-approval-decision` resolve。

## 时序 4:人工介入 → 恢复 automation

```
Renderer          Main           automationCoord/lane      runManager     Codex
   │                │                │                          │            │
   │ automation-    │                │                          │            │
   │ intervene IPC  │                │                          │            │
   │───────────────→│ submitIntervention                        │            │
   │                │───────────────→│                          │            │
   │                │                │ 分支A: run running        │            │
   │                │                │   controlRun(steer,/steer msg)──────→│ 注入当前turn
   │                │                │   patchAutomation(phase=running,清intervention)
   │                │                │                          │            │
   │                │                │ 分支B: run 已停/awaiting_human       │
   │                │                │   addMessage(intervention)│            │
   │                │                │   startRun(kind=human_intervention,  │
   │                │                │     同 threadId, source_run_id)──spawn│
   │                │                │   patchAutomation(phase=running)      │
   │ automation-event│                │                          │            │
   │←───────────────│←───────────────│                          │            │
   │ showPage(command)               │                          │            │
```

两个分支:
- **分支 A(Runtime 在线)**:`controlRun({ type:"steer", message })` 经 stdin 发 `/steer` 注入当前 turn,清 intervention 标记。
- **分支 B(Runtime 已停/awaiting_human)**:`addMessage(intervention)` → `startRun`(`runtimeContext.kind="human_intervention"`,复用持久化 threadId,携带 source_run_id/human_gate,`continuationPolicy="automatic"`)。

**confirmExternalDependency**:`intervention_kind === "external_dependency"` 时,清标记 + `startRuntimeForActiveTask` 重启 Runtime 检查依赖。

## 时序 5:Recovery Center 对齐恢复

```
Renderer          Main           automationCoord/lane           workshop
   │                │                │
   │ automation-    │                │
   │ recovery IPC   │                │
   │───────────────→│ resolveRecovery│
   │                │───────────────→│ 验证 action ∈ recoveryActionsForItem
   │                │                │──┐ 按 action 分发:
   │                │                │  │ retry_sync    → sync() + maybeStartNext
   │                │                │  │ retry_start   → startRuntimeForActiveTask(同thread)
   │                │                │  │ retry_case_reuse / retry_as_new_case → 带绑定指令重启
   │                │                │  │ feedback_continue → startRun(kind=recovery_feedback,同thread)
   │                │                │  │ retry_closeout → startSameThreadCloseout
   │                │                │  │ retry_cli_handoff → launchCodexCliForActiveTask
   │                │                │  │ retry_complete → updateTaskState(completed)──→│
   │                │                │  │ accept_server_state → 放弃本地,sync
   │                │                │  │ mark_blocked → updateTaskState(blocked)──→│
   │                │                │←─┘ 移除 recovery item
   │                │                │ emit automation.changed
   │ automation-event│                │
   │←───────────────│                │
   │ 若无剩余 recovery → showPage(command)
```

recovery 产生场景(由 addRecovery 创建):
- `readiness_failed`(preflight 失败,freezeScope=global)
- `claim_failed`(Workshop PUT 冲突,global)
- `start_failed`(Runtime 启动失败)
- `runtime_incomplete`(ledger 未写入)
- `runtime_process_missing`(进程消失)
- `case_binding_missing` / `case_binding_conflict`(无权威 Case binding)
- `closeout_failed` / `closeout_start_failed`
- `external_state_change`(远程任务状态被外部修改)
- `task_missing`(active_task 不在远程快照)

> **global recovery**(`freeze_scope === "global"`)冻结整个 automation 队列,不领取新任务,直到 operator 手动解决。
>
> **startup 恢复**:桌面启动时若 active_task 存在且无 attention_items,但有 `runtime_incomplete`/`runtime_process_missing` recovery item → 在同 thread 上恢复执行。

## 时序 6:Workshop 数据同步(sync 按钮 / realtime 推送)

### 6a. 手动 sync

```
Renderer──sync IPC──→Main──→workSync.reconcile()
                                   │ patchTaskSync(syncing)
                                   │ getAuthStatus / refreshNebulaToken
                                   │ getCurrentUser + listProjects (并行)
                                   │ mapWithConcurrency(projectIds, 4, loadProject)
                                   │   └→ listProjectTasks + listProjectTags
                                   │ patchTaskSync(healthy) emit work.changed
                                   │
                      automationCoord.handleTaskProjectionChanged
                                   │ reconcileActiveTask / reconcileCanonicalCaseState
                                   │ maybeStartNext
                                   │ emit automation.changed
Main──automation-event──→Renderer(刷新队列/active面板)
```

handleTaskProjectionChanged 内部 reconcile 步骤:
- `reconcileActiveTask` — active_task 是否仍在远程快照;远程状态变了 → addRecovery(external_state_change)
- `reconcileUnassociatedInProgress` — 无 active_task 但远程有唯一 in_progress → 恢复关联
- `reconcileDetachedRunCompletion` — active_task 的 run 已结束但未处理
- `reconcileCanonicalCaseState` — 对齐 canonical Case 状态
- `stopRuntimeForExternalChange` — 有 external_state_change recovery → 安全停 Runtime
- `maybeStartNext` — 有可领取新任务 → 启动

### 6b. realtime 推送(WebSocket 长连接)

```
workshop──WebSocket msg──→realtimeAdapter.queueInvalidation (300ms debounce)
                                   │ onInvalidate → workSync.refreshProject(projectId)
                                   │   └→ loadProject → patchTaskSync emit work.changed
                                   │      → automationCoord.handleTaskProjectionChanged
                                   │      → Main──automation-event──→Renderer
```

cursor 机制:
- **resumable 模式**(schema_version=1,有 latest_event_id):本地 cursor 与 latest_event_id 比对。落后 → `listProjectEvents({ afterId: cursor, limit: 500 })` 分页补拉 replay;过期/超前 → 全量 invalidate。
- **legacy 模式**:全量刷新。
- cursor 和 state 持久化到 `store.platform.task_sync.projects[id]`。
- **凭证续期**:access_token 过期前 60 秒主动关闭重连。

## 关键架构发现

1. **单一持久 thread**:每个自动化 todo 拥有同一个持久化 Codex thread,从首次 turn 到 closeout、recovery、compaction 都在同一 thread 上。`runManager.startRun` 每次启动一个 `arcorbit run` 子进程,传入 `--thread-id` 和 `--thread-binding-file` 持久化绑定。
2. **Ledger 权威性**:Case binding 以 trusted ledger write 为准,不信任 repository 内容推断或旧 Run 缓存。所有 closeout 和 remote completion 都要求 `persistedCaseBinding.status === "bound"`。
3. **全局 recovery 冻结**:`freeze_scope === "global"` 冻结整个队列,不领取新任务。
4. **推送通知 + 拉取最新**:只有 run activity 和 chat message 走增量 patch(基于 revision/epoch 校验),其他 realtime 事件都走 refreshSnapshot 全量拉取——避免推送丢失导致状态不一致。
