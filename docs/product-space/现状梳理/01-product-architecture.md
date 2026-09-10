# 01 · 产品架构

> 基于代码核实(2026-09-10)。描述 ArcOrbit Desktop 当前的产品分层与核心概念,不是目标设计。

## 一、产品轴

ArcOrbit 围绕一条产品轴运转:**Project State(可恢复的软件项目对象)通过 Case(显式推进上下文)和 Loop(有界运行时循环)被持续推进**。

```
Project State ──通过──→ Case ──被持续推进──→ Loop
  (对象)              (上下文)              (运行时循环)
```

- **Project State** — 存在项目目录下 `arckit/project/state.record.json`(v5),是可恢复的软件项目对象。
- **Case** — 显式的项目状态推进上下文,存在 `arckit/cases/`(带 INDEX.md)。只有 trusted ledger write(`written === true`)才能建立权威 Case binding。
- **Loop** — 有界运行时循环:一个 todo 对应一个**持久化 Codex thread**,从首次 turn → serial gaps → validation → repair → context compaction → Git closeout,全程同一 thread。Runtime **不创建** Controller / Worker / Review / Repair 独立线程。
- **Ledger** — 权威证据源。closeout 和 remote completion 都以 `persistedCaseBinding.status === "bound"` 为前置,不信任 repository 内容推断或旧 Run 缓存。

桌面客户端把这条轴映射成三组页面 + 一个前置就绪层。

## 二、产品分层

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ArcOrbit Desktop 产品分层                        │
├─────────────────────────────────────────────────────────────────────┤
│  规划预览层(只读 · 不写 · 不授权)                                        │
│    Idea ───────── Release ───────── Operations ───────── Engineering │
│   机会探索          发版准备            运营计划          领域模型管理      │
├─────────────────────────────────────────────────────────────────────┤
│  实操层(产生/消费真实数据,经 workshop-api 持久化)                         │
│    Work ──── Chat ──── Feedback ──── Organization                     │
│   待办管理    人工对话    用户反馈处理     组织治理                      │
├─────────────────────────────────────────────────────────────────────┤
│  运行控制层(围绕自动化 Loop 的态势/介入/恢复)                              │
│         Today ──→ Command ──→ Task Browser                             │
│         (责任台)     (指挥中心)     (任务浏览器)                          │
│                       │                                                │
│                       ├──→ Intervention Workbench (人工介入)            │
│                       └──→ Recovery Center (异常恢复)                   │
├─────────────────────────────────────────────────────────────────────┤
│  前置: Setup Readiness(Codex + Skill bundle 就绪检查)                    │
└─────────────────────────────────────────────────────────────────────┘
```

## 三、各页面产品角色

### 实操层(产生/消费真实数据)

| 页面 | 产品角色 | 数据边界 |
|---|---|---|
| **Work** | 平台级待办管理(对应 workshop-api 的 task 域) | 七状态筛选 + 创建人/执行人/标签/优先级/日期筛选;task.create/update/delete 经 workshop-api 持久化;新建 pending 待办自动进入 automation queue |
| **Chat** | 与 Codex agent 的持久对话(非自动化) | 每个会话绑定一个持久 Codex thread;发消息后创建 thread,agent 在同一 thread 连续工作;支持 approval 请求(超时 5 分钟) |
| **Feedback** | 用户反馈处理 | 状态流转:待处理/已确认/开发中/已完成/已转待办/已忽略;可转待办(convert-to-task) |
| **Organization** | 组织治理(不受产品集过滤) | 概览/成员/项目三 tab;新建组织或用邀请码加入;跨产品集全局治理 |

### 运行控制层

| 页面 | 产品角色 | 数据边界 |
|---|---|---|
| **Today** | 每日责任台,聚合所有来源的责任项 | 聚合 automation attention/recovery + platform tasks/feedback + chat approval + setup readiness;按责任类型分发到对应 API |
| **Command** | 自动化指挥中心,看 Loop 执行态势 | 指标卡 + 当前运行(Runtime/Codex thread/Agent Loop/ledger 收束状态)+ 普通队列 + 验收队列 + 最近完成 + attention strip;可暂停领取/立即同步 |
| **Task Browser** | 服务器任务浏览器(从 Command 进入) | 浏览当前范围内远端待处理任务 |
| **Intervention Workbench** | 人工介入工作台 | review(只读审查)/ intervention(提交授权/事实/决策 + 恢复条件)/ acceptance review(提交验收问题)三种模式 |
| **Recovery Center** | 异常恢复中心 | recovery_items 渲染为恢复卡片;执行 retry_start / retry_sync / retry_case_reuse / feedback_continue / accept_server_state / mark_blocked 等恢复动作 |

### 规划预览层(只读 · 不写 · 不授权)

| 页面 | 产品角色 | 边界声明 |
|---|---|---|
| **Idea** | 产品机会探索 | 创意漏斗:探索中/讨论中/已确认;**PLAN VIEW · 不创建 Project** |
| **Release** | 发版准备预览 | 候选变更→验证→签名→渠道发布流程;**不创建 tag、不触发 workflow、不签名、不发布安装包** |
| **Operations** | 运营计划预览 | 受众/渠道/内容/效果回流;**不调用外部平台** |
| **Engineering** | 领域模型管理 | State Model / Capability Mapping / Lifecycle Mapping 编辑器;**MANAGEMENT PREVIEW · 无真实写入** |

> 规划预览层四页的按钮多为 `disabled` 或标注「示意」,决策和写入走外部流程,不进入数据闭环。

### 前置

| 页面 | 产品角色 | 触发时机 |
|---|---|---|
| **Setup Readiness** | Codex CLI + Skill bundle 就绪检查 | 首次启动 / Codex 不可用时弹出;`can_continue === true` 后进入主界面 |

## 四、与外部系统的产品边界

```
┌──────────────────────────────────────────────────────────┐
│  ArcOrbit Desktop(Electron 客户端)                         │
│                                                            │
│  实操层页面 ──HTTP──→ workshop-api ──→ Postgres            │
│                       (Go/Gin,团队协作数据底座)              │
│                       ↑ WebSocket(realtime)                │
│                                                            │
│  运行控制层 ──→ Runtime CLI ──→ Codex CLI                  │
│                  (utility process)  (agent 执行器)          │
│                                                            │
│  Setup Readiness ──→ ArcForge Provider(bundled skill)      │
│                      (dist-package/resources)              │
└──────────────────────────────────────────────────────────┘
```

- **workshop-api**:团队协作的数据底座,提供 user/organization/project/task/feedback/tag/oss + WebSocket realtime。路由分 public / user / apikey / feedback 四级,网关统一认证。
- **Codex CLI**:agent 执行器,有 standalone / npm / homebrew 三种 owner。Automation 路径经 Runtime CLI 调用,Chat 路径直接对接 app-server,Setup 路径直接 spawn。
- **ArcForge Provider**:bundled 在 `dist-package/resources` 里,提供 skill provisioning 的 plan/drift/apply/recover 能力,版本和 capability 由 `distribution-lock.json` 锁定。

## 五、核心数据对象持久化位置

| 对象 | 位置 | 归属 |
|---|---|---|
| Project State(v5) | `<projectPath>/arckit/project/state.record.json` | 项目目录 |
| Case 记录 | `<projectPath>/arckit/cases/` | 项目目录 |
| Thread Binding(task→Codex thread) | `userData/runtime/thread-bindings/<projectId>/` | 客户端 userData |
| Run 证据(result/messages/activity/log) | `userData/runtime/runs/<RUN-xxx>/` | 客户端 userData |
| desktop-store(projects/sessions/runs/settings/platform/automation/chat) | `userData/runtime/desktop-store.json` | 客户端 userData |
| Skill 源码 | `userData/skill-sources/arckit/` | 客户端 userData |
| Codex owner receipts | `userData/codex-owner-receipts.json` | 客户端 userData |
| 团队协作数据(task/feedback/org/project) | Postgres(via workshop-api) | 后端 |

> 项目级状态(Project State / Case)在项目目录,客户端状态在 userData,团队协作数据在后端——三层分离。
