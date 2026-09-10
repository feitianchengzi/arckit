# 04 · 页面串联

> 基于代码核实(2026-09-10)。描述渲染层页面切换机制、跨页面共享状态、端到端工作流串联与后端同步链路。

## 一、页面切换机制

**核心实现:`state.page` + `data-page` / `data-page-view` 双属性映射**

渲染层维护全局 `state.page` 字符串(初始 `"today"`),代表当前激活页面。切换入口两类:

- **导航栏点击**:带 `data-page` 的按钮经 `wireEvents()` 统一绑定 `click` → `showPage(button.dataset.page)`
- **程序内跳转**:代码直接调用 `showPage("command")` / `showPage("recovery")` / `showPage("workbench")` 等

### showPage(page) 逻辑

1. 设置 `state.page = page`
2. **chat / work 特殊处理**:只做精简渲染(`renderPageVisibility` + `renderNavigation` + `renderCommandBar` + 对应面板),触发各自异步刷新(`refreshChat()` / `refreshWorkQuery()`),不走全量 `render()`,避免拉冗余数据
3. **tasks 页面**:`refreshSnapshot()`(复用 automation snapshot 的 task 列表)
4. **其他页面**(today/command/workbench/recovery/organization/feedback 等):全量 `render()`

### renderPageVisibility()

- 遍历 `[data-page-view]` 元素,`is-active` class 与 `state.page` 匹配(每个页面是一个 `<div data-page-view="xxx">`,CSS `.is-active` 控制显隐)
- 遍历 `[data-page]` 导航按钮,高亮当前页对应导航项;子页面归属父级 tab:
  - `tasks` → 高亮 `work`
  - `workbench` / `recovery` → 高亮 `command`

### 导航状态维护

`state.page` 是唯一真相源。导航栏计数角标(attention/work/automation/feedback 未处理数量)在 `renderNavigation()` 每次从 `state.snapshot` 和 `state.platform` 重新计算,不持久化。Today 页面的选中项目/模式/责任项有独立偏好持久化(经 `api.setTodayPreference` 存到后端 ui_preferences)。

## 二、跨页面共享状态

渲染层全局 `state` 对象(单一,所有页面共享):

| 数据域 | 存储位置 | 消费页面 | 更新源 |
|---|---|---|---|
| **Automation Snapshot** | `state.snapshot` | Command / Workbench / Recovery / Tasks / Today / Navigation 角标 | `refreshSnapshot()` → `api.automationSnapshot()` |
| **Platform Snapshot** | `state.platform` | Work / Feedback / Today / Organization / Workset 选择器 | `refreshSnapshot()` → `api.platformSnapshot()` |
| **Work Query Projection** | `state.workQuery` + workQueryState(LRU,最多 12) | Work 页面专用 | `refreshWorkQuery()` → `api.platformWorkQuery()` |
| **Chat Snapshot** | chatStateCoordinator 内部状态 | Chat / Today(chat_approval 责任项) | `chatStateCoordinator.refresh()` / `applyStreamEvent()` |
| **Active Task / Run** | `state.snapshot.active_task` / `active_run` | Command(当前运行) / Workbench(审查/干预) / Recovery | automation snapshot 刷新;activityRefreshQueue 增量 patch |
| **Workbench 专用** | `state.workbenchMode`/`workbenchRun`/`workbenchTask`/`workbenchCompletion`/`workbenchFeedbackId` | Workbench | `openWorkbench()` 设置;`loadTranscript()` 填充 transcript |
| **Recovery Items** | `state.snapshot.recovery_items` | Recovery / Command attention strip / Today | automation snapshot |
| **Feedback** | `state.platform.feedback_v1` + `product_workspaces[].feedback_management` | Feedback / Navigation 角标 | platform snapshot |
| **Codex Probe / Setup** | `state.setup`(含 `codex_setup`) | Setup 引导页 / Today(项目配置) | `api.getSetupReadiness()` + `onSetupEvent` |
| **Authentication** | `state.authentication` | 全局(导航栏用户状态/登录门禁) | `api.getAuthStatus()` + refreshSnapshot |
| **Organization Scope** | `state.organizationScopeId` / `organizationSection` | Organization | refreshSnapshot 初始化 |
| **Today Drafts** | `state.todayDrafts` | Today(草稿输入) | 内存 + `scheduleTodayPreferencePersistence()` 异步持久化 |

### 数据刷新枢纽

- **`refreshSnapshot()`**:并行拉 automation snapshot + platform snapshot → 全量 `render()`。`scheduleRefresh()` 做 80ms 防抖去重。
- **Work 页面**:走 `refreshWorkQuery()` 而非全量 snapshot,避免拉 feedback/organization 冗余数据,带 LRU 缓存 + epoch/generation 防竞态。
- **Chat 页面**:走 `refreshChat()` → `chatStateCoordinator.refresh()`,带 owner epoch 防竞态。
- **定时刷新**:30 秒间隔自动刷新当前页面数据(work 走 refreshWorkQuery,其他走 refreshSnapshot,均 quiet)。

## 三、端到端工作流串联

```
┌─────────────────────────────────────────────────────────────────────┐
│  Work(创建待办)                                                       │
│    executePlatformAction("task.create") → workshop-api               │
│    新建 pending 待办自动进入 automation queue                          │
│    选中待办→详情→"审查"→ openWorkbench("review") 或 showPage("recovery")│
└──────────────────────────┬──────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Command(队列执行)  ← automation coordinator 自动领取                  │
│    普通队列 / 验收队列 / 当前运行 / 最近完成 / attention strip         │
│    ├ 查看对话 ──→ Workbench(review)                                   │
│    ├ 处理 ──→ Workbench(intervention)                                 │
│    ├ 停止 ──→ Recovery                                                │
│    └ 查看全部待处理 ──→ Task Browser                                   │
└──────────┬───────────────────────────────────┬───────────────────────┘
           ▼                                   ▼
┌──────────────────────────┐   ┌──────────────────────────────────────┐
│  Intervention Workbench   │   │  Recovery Center                      │
│  review: 只读审查对话+证据 │   │  recovery_items 渲染为恢复卡片          │
│  intervention: 提交授权/   │   │  retry_start / retry_sync /            │
│    事实/决策+恢复条件      │   │  retry_case_reuse / feedback_continue  │
│    → submitIntervention   │   │  accept_server_state / mark_blocked    │
│    → 恢复 automation       │   │  无剩余 → showPage("command")          │
│  acceptance: 提交验收问题  │   │  feedback_continue → Workbench(review) │
│    → submitAcceptanceFeedback│ └──────────────────────────────────────┘
└──────────────────────────┘
                           ▲
                           │ 聚合所有来源的责任项
┌──────────────────────────┴──────────────────────────────────────────┐
│  Today(责任台)  deriveTodayWorkspace() 聚合                           │
│    automation attention + recovery + platform tasks/feedback +        │
│    chat approval + setup readiness                                    │
│    performTodayAction 按责任类型分发:                                   │
│      chat_approval → decideChatApproval                               │
│      automation_intervention → submitIntervention                     │
│      automation_recovery → resolveAutomationRecovery                  │
│      work_completed → accept_work / raise_acceptance_issue            │
│      work_blocked → return_work / cancel_work                         │
│      project_configuration → applySetupPlan / bindWorkspace           │
└─────────────────────────────────────────────────────────────────────┘
```

### 各页面数据产生/消费

| 页面 | 产生 | 消费 |
|---|---|---|
| **Work** | task.create/update/delete → workshop-api | platform(workset/projects/members/tags)、workQuery 投影 |
| **Chat** | 持久 Codex thread 对话、approval 决策 | chat snapshot、setup readiness(前置) |
| **Command** | 自动化执行决策(领取/停止/暂停/介入) | automation snapshot(queue/active_run/recent_completions/attention/recovery) |
| **Workbench** | intervention 消息、acceptance feedback | transcript(消息流)、run activity(phase/gate/ledger/closeout) |
| **Recovery** | recovery action(retry/accept/block) | recovery_items |
| **Today** | 按责任类型分发到上述各 API | 聚合几乎所有 snapshot |
| **Feedback** | feedback CRUD/convert-to-task | platform feedback_v1 + feedback_management |
| **Organization** | org/member/project CRUD | platform orgs(不受 workset 过滤) |
| **Idea/Release/Operations/Engineering** | 无(只读预览,按钮 disabled) | 无后端绑定,静态示意数据 |

## 四、页面与后端(workshop-api)数据同步链路

### Renderer → IPC → Main → Workshop

所有渲染层 API 调用:`window.arckitDesktop`(preload `contextBridge` 注入)→ `ipcRenderer.invoke("arckit:xxx", input)` → main.mjs `ipcMain.handle` → 对应 coordinator/service → workshop-api HTTP。

**coordinator 分工**:
- `automationCoordinator` — 自动化快照、执行选择、启停、干预、恢复、CLI 交接
- `platformCoordinator` — 平台快照、work query、workset CRUD、today 偏好、通用 platform action(task/feedback/org CRUD)
- `chatCoordinator` — 聊天会话 CRUD、消息发送、审批决策
- `workshopService` — 认证(验证码/登录/登出)
- `workSyncCoordinator` — work 数据同步(reconcile)
- `runManager` — run 列表、消息列表、run activity snapshot
- `skillProvisioningManager` — skill 安装/迁移/恢复

### Realtime 推送如何到达页面

main.mjs 的 event source 通过 `mainWindow.webContents.send()` 推送,preload 暴露为 `api.onXxx(listener)`,渲染层在 `boot()` 注册监听:

| 推送频道 | 触发源 | 渲染层处理 | 最终效果 |
|---|---|---|---|
| `arckit:automation-event` | automationCoordinator.onEvent() | scheduleAutomationRefresh(80ms 防抖) → refreshSnapshot(quiet) | Command/Workbench/Recovery 刷新 |
| `arckit:event` | runManager.onEvent() | run.started/finished/message.added → scheduleRefresh(0);run.activity_changed → scheduleActivityRefresh(120) → 增量 patch | 当前 run activity 增量更新 |
| `arckit:work-sync-event` | workshopRealtimeAdapter + workSyncCoordinator | scheduleRefresh → refreshSnapshot(quiet) | 待办/反馈刷新 |
| `arckit:chat-event` | chatCoordinator.onEvent() | message.changed → chatStateCoordinator.applyStreamEvent → renderChat(流式增量);其他 → scheduleChatRefresh | Chat 流式输出/状态刷新 |
| `arckit:setup-event` | skillProvisioningManager + codexSetupManager | 更新 state.setup → renderSetup / renderToday | Setup 页/Today 项目配置刷新 |
| `arckit:product-feedback-unread` | productFeedbackService | 更新 state.productFeedback.unread_count → renderProductFeedbackTrigger | 导航栏未读角标 |

### Realtime 订阅动态管理

- `scheduleRealtimeSubscriptions()` 在 automation-event 和 work-sync-event 推送后触发,延迟调用 `reconcileRealtimeSubscriptions()` → `workshopRealtimeAdapter.updateProjects(projectIds)`,按当前需实时同步的项目列表动态调整 WebSocket/SSE 订阅。
- 每 15 分钟定时全量 reconcile。
- 系统从睡眠恢复:`powerMonitor.resume` → `reconnectAll()` + 全量同步。

### 增量 vs 全量

- **增量 patch**:run activity(基于 revision 连续性校验,失败 fallback 全量拉取)、chat message(基于 owner epoch)。
- **全量拉取**:其他所有 realtime 事件最终走 `refreshSnapshot()`——设计选择"推送通知 + 拉取最新"模型,而非"推送即数据",避免推送丢失导致状态不一致。
