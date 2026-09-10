# 02 · 技术架构

> 基于代码核实(2026-09-10)。描述 ArcOrbit Desktop 的进程模型、组件依赖、持久化、IPC 通道与外部边界。

## 一、进程模型

```
┌──────────────────────────────────────────────────────────┐
│  Electron 主进程 (desktop/main.mjs)                        │
│  · contextIsolation:true · nodeIntegration:false          │
│  · 唯一业务逻辑宿主,持有全部 manager/coordinator              │
│  · app.setPath("userData", @arckit/arcorbit 子目录)         │
│                                                            │
│  ┌────────────┐   ipcMain.handle    ┌──────────────────┐ │
│  │  Renderer  │ ←──────────────────→│  Preload (sandbox)│ │
│  │ (index.html│  invoke/handle      │ arckitDesktop API │ │
│  │  renderer.js)│ on/send(事件推送)   └──────────────────┘ │
│  └────────────┘                                           │
│        │                                                   │
│        │ utilityProcess.fork (postMessage 控制协议 v1)       │
│        ▼                                                   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Utility Process: bin/arcorbit.mjs (Runtime CLI)      │ │
│  │  内部启动 codex --adapter codex-app-server             │ │
│  │  通过 $using-arckit manifest trigger 进入语义循环         │ │
│  │  --stream-events: stderr JSONL 事件流回流主进程           │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
         │                              │
         │ HTTP/SSE/WebSocket            │ spawn (chat/setup 路径)
         ▼                              ▼
┌─────────────────────┐        ┌──────────────────┐
│ workshop-api        │        │ Codex CLI         │
│ Go/Gin + Postgres   │        │ (standalone/npm/  │
│ + WebSocket hub     │        │  homebrew)        │
└─────────────────────┘        └──────────────────┘
         │
         ▼
┌─────────────────────┐
│ ArcForge Provider    │  (bundled in dist-package, 动态 import)
│ skill payload +      │  提供 provisioning plan/drift/apply/recover
│ distribution-lock    │
└─────────────────────┘
```

### 各进程职责

| 进程 | 职责 | 安全边界 |
|---|---|---|
| **主进程** (desktop/main.mjs) | 创建 BrowserWindow、注册全部 IPC、初始化所有 manager/coordinator、管理生命周期(定时同步/realtime 订阅/powerMonitor resume)、退出 cleanup | 持有全部 Node 能力 |
| **Utility Process** (electron-utility-runtime-host.mjs) | 以子进程方式启动 Runtime CLI;通信用 postMessage(parent-port),控制协议 `arcorbit-runtime-control/v1`,支持 steer/interrupt | 删除 `ELECTRON_RUN_AS_NODE` |
| **Renderer** (desktop/renderer/) | 纯前端 UI,通过 `window.arckitDesktop` 全局对象与主进程通信 | contextIsolation:true,nodeIntegration:false |
| **Preload** (desktop/preload.cjs) | 自包含 sandboxed,不加载外部模块;`contextBridge.exposeInMainWorld("arckitDesktop", ...)` | Feedback V2 通道有额外 result unwrapping(`feedback-v2-ipc-result/v1`) |

### 进程间通信方式

- Renderer → Main:全部 `ipcRenderer.invoke` / `ipcMain.handle`(request-response)
- Main → Renderer:`mainWindow.webContents.send` / `ipcRenderer.on`(事件推送)
- Main → Utility Process:`postMessage`(parent-port 模式),fallback 用 stdin 写 `/steer` `/interrupt`
- Main → Codex CLI(setup 路径):直接 spawn `codex` 命令

## 二、Manager / Coordinator 依赖拓扑

```
codexExecutableResolver (无依赖)
        │
runtimeHost ──→ runManager (核心数据层: desktop-store.json + runs/ + thread-bindings/)
                    │
                    ├──→ workSyncCoordinator (← taskSource, platformSource)
                    ├──→ chatCoordinator (← getCodexExecutable, setupReadinessPreflight)
                    ├──→ automationCoordinator (← workSync, setupReadinessPreflight, cliLauncher)
                    │         └── lane 模型: overview lane + 每 workspace 一个 lane (Proxy 隔离)
                    ├──→ platformCoordinator (← platformSource, workSync, automationCoordinator)
                    └──→ workshopRealtimeAdapter (← workshopService, workSyncCoordinator)

codexSetupManager (← codexExecutableResolver, runManager, skillProvisioningManager)
skillProvisioningManager (← resourcesRoot=dist-package/resources, dataRoot, codexProbe←codexSetupManager)
    ↑↓ 双向联动: codexSetup.recheckReadiness 回调 skillProvisioning.check
```

### 各组件职责

| 组件 | 职责 | 事件输出 |
|---|---|---|
| **runManager** | 核心数据层。desktop-store.json + runs/ 生命周期管理、run activity projection(解析 Runtime CLI stderr JSONL)、thread binding 持久化、lifecycle trace | `arckit:event` |
| **chatCoordinator** | Codex Chat 会话(非自动化)。通过 codex-app-server-adapter 流式消费 delta/item/turn 事件;管理 approval 请求(超时 5 分钟) | `arckit:chat-event` |
| **automationCoordinator** | 最复杂组件。自动化 task 执行队列;lane 模型(overview + 每 workspace 一 lane,Proxy 隔离);`maybeStartNext` → preflight → `updateTaskState(in_progress)` → `startRun` → `run.finished` → `selectEffectiveLoopHandoff`;并发上限 3(可配) | `arckit:automation-event` |
| **workSyncCoordinator** | Workshop 远程平台本地同步层。reconcile(全量)/ refreshProject(单项目)/ updateTaskState(状态变更+远程确认)/ createTask/deleteTask | `arckit:work-sync-event` |
| **platformCoordinator** | Platform 层聚合器。getSnapshot 聚合 org/member/project/task/feedback/tag/automation;queryWork(tree 过滤+分页);executeAction 路由 30+ 种 platform action;Feedback V2 降级 | — |
| **skillProvisioningManager** | Skill 安装/升级/恢复/移除。inspectBundle(验证 distribution-lock + checksums)→ provider import → plan → drift → apply/recover | `arckit:setup-event` |
| **codexSetupManager** | Codex CLI 安装/更新/迁移/登录/登出。inspect → probe → login status → 判定 ready;mutate 封装含 guardOwners/postcondition/recheck-on-failure | `arckit:setup-event` |
| **electronUtilityRuntimeHost** | 封装 `utilityProcess.fork`,提供 spawn/sendControl/terminate | — |

## 三、持久化

userData 路径:`<appData>/@arckit/arcorbit/`,Runtime data:`<userData>/runtime/`。

| 文件/目录 | 路径 | 存储内容 |
|---|---|---|
| **desktop-store.json** | `userData/runtime/` | 核心状态:projects、sessions(按 projectId 分组)、messages(按 sessionId,最多 300 条)、runs(最多 100 条)、settings(task_source 认证、codex_proxy)、platform(worksets/ui_preferences/today_project_ids/task_sync)、automation(active_executions/project_bindings/project_participation/acceptance_feedback_items/attention_items/recovery_items/recent_completions)、chat(selected_session_id/draft) |
| **runs/** | `userData/runtime/runs/<RUN-xxx>/` | result.json(stdout JSON)+ messages.jsonl(消息流,`desktop-run-message-record/v1`)+ activity.json(phase/messages/token_usage/timeline)+ stderr.log |
| **thread-bindings/** | `userData/runtime/thread-bindings/<projectId>/<taskId-hash>.json` | task→Codex thread 持久化绑定(`arckit-codex-thread-binding/v1`),确保同 task 复用同 thread |
| **lifecycle-traces/** | `userData/runtime/lifecycle-traces/` | span 树生命周期 trace(events + summary) |
| **codex-owner-receipts.json** | `userData/` | standalone Codex 安装记录(id/command/version) |
| **skill-sources/arckit/** | `userData/skill-sources/arckit/` | current/ + versions/ + previous/ + recovery-backups/ |

项目级状态(不在 userData,在项目目录):
- `<projectPath>/arckit/project/state.record.json` — Project State v5
- `<projectPath>/arckit/cases/` + `INDEX.md` — Case 记录

## 四、IPC 通道分组

Renderer→Main 全部 `invoke/handle`(request-response),Main→Renderer 全部 `send/on`(事件推送)。

### Renderer → Main(invoke/handle,共 ~70 个)

| 分组 | 通道数 | 代表通道 |
|---|---|---|
| **Setup** | 9 | setup-status / setup-check / setup-apply / setup-continue / codex-setup-install / codex-setup-login |
| **Platform** | 11 | platform-snapshot / platform-work-query / platform-workset-* / platform-today-preference / platform-action |
| **Automation** | 16 | automation-snapshot / automation-sync / automation-pause / automation-intervene / automation-acceptance-feedback / automation-stop / automation-handoff-cli / automation-recovery |
| **Chat** | 8 | chat-snapshot / chat-create / chat-select / chat-send / chat-interrupt / chat-approval-decision |
| **Feedback V2** | 9 | feedback-v2-messages / feedback-v2-reply / feedback-v2-read / feedback-v2-convert / feedback-v2-attachment-open |
| **Auth** | 4 | auth-status / auth-send-verification / auth-login / auth-logout |
| **Run** | 4 | list-runs / list-messages / run-activity-snapshot / pick-project |
| **窗口/设置** | 8 | window-state / window-minimize / window-toggle-maximize / window-close / get-settings / update-settings |
| **其他** | — | product-feedback-* / image-viewer-* / work-task-attachment-* / feedback-attachment-open / work-external-link-open |

### Main → Renderer(send/on,事件推送)

| 通道 | 触发源 | 渲染层效果 |
|---|---|---|
| `arckit:event` | runManager.onEvent() | run.started/finished/message.added → scheduleRefresh;run.activity_changed → 增量 patch |
| `arckit:automation-event` | automationCoordinator.onEvent() | 80ms 防抖 → refreshSnapshot(quiet);Command/Workbench/Recovery 刷新 |
| `arckit:work-sync-event` | workshopRealtimeAdapter + workSyncCoordinator | scheduleRefresh → refreshSnapshot(quiet);待办/反馈刷新 |
| `arckit:chat-event` | chatCoordinator.onEvent() | message.changed → 流式增量渲染;其他 → scheduleChatRefresh |
| `arckit:setup-event` | skillProvisioningManager + codexSetupManager | 更新 state.setup → renderSetup / renderToday |
| `arckit:window-state-changed` | 窗口控制 | 窗口状态同步 |
| `arckit:product-feedback-unread` | productFeedbackService | 导航栏未读角标 |

## 五、外部边界

### workshop-api(task-source-adapter / workshop-realtime-adapter)

- 封装:`createWorkshopTaskSource`,提供 auth(nebula/headers 双模式)、project/task/tag CRUD、feedback V1/V2、organization/member。
- 认证信息存 `desktop-store.json` 的 `settings.task_source`(access_token/refresh_token/user_id)。
- realtime:`createWorkshopRealtimeAdapter`,SSE/WebSocket 长连接、reconnect、per-project cursor,事件触发 `workSyncCoordinator.invalidateProject`(300ms debounce 增量刷新)。
- 路由格式:`/{service}/{version}/{auth_level}/{path}`,分 public / user / apikey / feedback 四级。
- 代理:Codex setup 用独立 `persist:arcorbit-codex-setup` session partition。

### Codex CLI(三种调用路径)

| 路径 | 调用链 | 用途 |
|---|---|---|
| Automation | runManager.startRun → utilityProcess.fork(bin/arcorbit.mjs) → 内部 codex --adapter codex-app-server | 自动化 Loop 执行 |
| Chat | createCodexAppServerAdapter 直接对接 Codex app-server(不走 Runtime CLI) | 人工对话,流式消费 |
| Setup | codex-setup-manager 直接 spawn codex 命令(login status / login / logout / npm install) | 安装/认证 |

可执行文件路径经 `codex-executable-resolver` 解析,支持 standalone/npm/homebrew 三 owner。

### ArcForge Provider

- `skillProvisioningManager` 在 `inspectBundle()` 时动态 import bundled provider(`resources/provisioning/arcforge-provider/dist/provider/index.js`)。
- Provider API 要求 8 个方法:inspectProvider/createProvisioningPlan/driftProvisioningPlan/applyProvisioningPlan/listProvisioningRelations/assessProvisioningUpgrade/recoverProvisioningUpgrade/removeManagedProvisioning。
- 版本和 capability 由 `distribution-lock.json` 锁定,运行时校验 apiVersion(`arcforge-embedded-provider/v1`)/providerVersion/buildCommit/capabilities。
- 安装策略:`project-only`(只装项目目录),agent target=codex,安装位置 `~/.arcforge` + 项目目录。

### 边界安全措施

- `assertMainRenderer(event)` — IPC 只来自主窗口
- `installMainWindowNavigationBoundary` — 限制 renderer 导航到允许 URL
- `requireFeedbackAttachmentUrl` / `requireWorkExternalLinkUrl` / `requireTrustedResourceUrl` — URL 白名单
- `shell.openExternal` 仅用于验证过的 URL
- Codex setup 独立 session partition,proxy 隔离
- Sensitive stdin(API key/token)使用后立即 `fill(0)` 清除
- `safeChild` 防止路径遍历
