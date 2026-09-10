# 05 · 业务场景串联与缺口分析

> 基于代码核实(2026-09-10)。以客户支持链路为线索串联现状平台,识别缺失(需新增)与冗余(搁置)。配合 `01-product-architecture.md` ~ `04-page-linking.md` 现状基线阅读。

## 一、业务场景定义

平台的核心业务场景是**客户支持链路**:从客户反馈到内部处理再到交付回复的完整闭环。它天然穿过现状平台的多个能力域,是串起整个平台的线索。

```
客户侧                内部侧(平台)
─────              ────────────────
反馈提交     →①→   反馈进入 + 分诊判断
                     ↓
                   ②转为开发待办(反馈→Task 绑定)
                     ↓
                   ③认领/分配执行人
                     ↓
                   ④Codex Loop 自动开发  ←── 人工介入(steer)
                     ↓                        ↑
                   ⑤closeout 生成进展草稿     │ 客户追问
                     ↓                        │ 关联活跃 Case
                   ⑥草稿确认 → 回复客户  ──────┘
                     ↓
                   ⑦验收
                     ↓
                   ⑧交付产物
```

## 二、逐环节串联现状

### ① 反馈提交 → 进入内部

| 现状能力 | 判定 |
|---|---|
| `packages/feedback-sdk-web`(HTTP REST + iframe postMessage) | ✅ 支持,但无实时推送(纯轮询) |
| `desktop/product-feedback/` 独立窗口(SDK-webview + apiKey 认证,提交/我的反馈) | ✅ 支持,是对客反馈入口雏形 |
| workshop-api `feedback` 路由 + FeedbackSession/FeedbackMessage 后端模型 | ✅ 支持 |
| `workshopRealtimeAdapter` WebSocket per-project cursor | ✅ workshop-api 侧有实时能力 |

**缺失**:
- **SDK → 内部的实时推送**:现状 SDK 无 WebSocket/SSE,客户发反馈后内部需手动刷新。workshop-api 后端已有 WebSocket 基础(per-project cursor),SDK 侧没接。需补 SDK 侧订阅。
- **对话式 AI 客服入口**:SDK 只有 `AIUnderstanding` 占位接口,无实际知识库调用。净新增,依赖知识库。

### ② 分诊判断

| 现状能力 | 判定 |
|---|---|
| Feedback V2 六态状态机(待处理/已确认/开发中/已完成/已转待办/已忽略) | ✅ 有状态流转 |
| feedback-console 权限模块(TaskPermission/ProjectPermission,基于 role) | ⚠️ 有但门控有漏洞 |
| feedback 详情对话面板(customer/developer/system 三 sender) | ✅ 支持 |

**缺失**(需新增):
- **triage 门控修复**:`requireFeedbackProjectMember` 不查 role(`handler/feedback_workflow.go:148-165`),member 也能 triage。bug,必须先修。
- **capabilities 字段**:现状 `ProjectMember` 只有 Role/Duty/IsExternal,无 capabilities。分诊需"谁有权分诊"的细粒度控制。需 migration(owner/admin→triage 能力默认映射)。
- **AI 分诊初判**:workshop-api 中 weknora/vector/embedding 零命中。分诊的"自动初判类型/优先级/可行动性"无任何代码。净新增,依赖知识库。

**冗余(搁置)**:
- 现状 Feedback V1 与 V2 并存(`feedback_v1` + Feedback V2 IPC)。本期走 V2,V1 标记搁置,不再演进。

### ③ 转为开发待办(反馈→Task 绑定)

| 现状能力 | 判定 |
|---|---|
| `feedback-v2-convert` IPC + FeedbackTaskLink 后端模型(converted_to/related/duplicate) | ✅ 后端绑定关系有 |
| `platform-action`(task.create) | ✅ 创建待办有 |

**缺失**:
- **runtime 侧感知 FeedbackTaskLink**:`task-source-adapter.mjs` 的 listTasks **不拉 FeedbackTaskLink**,runtime 不知道一个 Task 关联了哪个客户反馈。automation 的 feedback_id 绑定目前只走 acceptance_feedback_items(验收反馈),不是客户反馈。需扩展 task-source-adapter 查询。
- **Gap.derived_from 追溯**:`derived_from` schema 是 `string[]`(语义是"推理依据"),把 `customer-feedback:<id>` 塞进去会混淆语义。需决策:前缀约定泛化(轻)还是新增 `triggered_by` 字段(语义清晰)。桥1核心。

### ④ 认领/分配

| 现状能力 | 判定 |
|---|---|
| Work 页 task.update 设 executor_id(`platform-action`) | ✅ 支持 |
| Task `ExecutorID *uint`(可空) | ✅ 支持未认领态 |

**缺失**:无。现状认领机制完整。设计稿假设的 `assignee` 独立概念现状用 executor_id 覆盖,够用。

### ⑤ Codex Loop 自动开发(现状最完整的环节)

| 现状能力 | 判定 |
|---|---|
| automationCoordinator lane 模型(3 并发)+ maybeStartNext 自动领取 | ✅ 完整 |
| setupReadinessPreflight → updateTaskState(in_progress) → startRun | ✅ 完整 |
| utilityProcess.fork → Codex app-server → $using-arckit gap 推进 | ✅ 完整 |
| thread-binding 持久化(同 task 复用同 thread) | ✅ 完整 |
| run activity 投影(phase/messages/token_usage/timeline)经 `arckit:event` 增量推送 | ✅ 完整 |
| Intervention Workbench(review/intervention/acceptance) | ✅ 完整 |

**缺失**:无。现状最成熟的部分,直接用。

**冗余(搁置)**:
- 设计稿把 automation 总闸/暂停/Gap 时间线塞进 Work 页——现状已由 **Command 页**(指挥中心)+ **Workbench**(执行态势)承载,不在 Work 重复。搁置设计稿那套 Work 内嵌控制条,沿用现状分层。

### ⑥ closeout → 生成进展草稿

| 现状能力 | 判定 |
|---|---|
| `runSameThreadCloseout`(同 thread Git 收尾 Run) | ✅ closeout 本身有 |
| `finishAcceptanceFeedback` 更新本地 acceptance 状态 | ⚠️ 只更新本地 |

**缺失**(桥2,完全缺失):
- **runtime → workshop-api 回写通道**:现状 runtime 是纯拉取模式,`runSameThreadCloseout` 只做 Git 收尾,无 HTTP 回写 FeedbackMessage。需补反向写回能力。
- **FeedbackMessage 草稿状态字段**:`FeedbackMessage` 结构体无 `state` 字段,无法区分草稿/已发送。需 Postgres migration 加 `state`(draft/sent)。

### ⑦ 草稿确认 → 回复客户

| 现状能力 | 判定 |
|---|---|
| `feedback-v2-reply` IPC + Feedback 详情对话面板 | ✅ 回复能力有 |
| Feedback 详情对话面板(customer/developer/system 渲染 + 回复编辑器) | ✅ UI 有 |

**缺失**:
- **草稿确认流程**:现状没有"草稿待确认"环节,回复是直接发。需在回复能力上加一层草稿状态门控(pending_review → sent)及确认动作。
- **草稿落点**:建议并入 Feedback 详情的对话面板(草稿作为 system/developer 消息的 pending 状态),避免新增独立 Drafts 页。

### ⑧ 客户追问 → steer 注入

| 现状能力 | 判定 |
|---|---|
| `codex-app-server-adapter` steer(stdin `/steer` 或 parent port) | ✅ 底层能力就绪 |
| automation intervention 分支 A(run running → steer 注入当前 turn) | ✅ 就绪 |

**缺失**(桥3,核心缺失):
- **workshop-api → runtime 事件推送通道**:现状 runtime 不监听 workshop-api 的 WebSocket,纯轮询。客户发 FeedbackMessage 后,无法实时触发 runtime 检测活跃 Case 并 steer。需补 runtime 侧消息事件监听。
- **FeedbackMessage ↔ 活跃 Case 关联**:runtime 即使收到事件,也不知道哪条客户追问对应哪个活跃 task thread。依赖 ③的 FeedbackTaskLink 感知 + Gap.derived_from 追溯链路打通后,才能把客户追问路由到正确 thread。

### ⑨ 验收

| 现状能力 | 判定 |
|---|---|
| Task `accepted` 态 + automation acceptance feedback 机制 | ✅ 基本支持 |
| Workbench acceptance review 模式 + Today 责任台分发 | ✅ 支持 |

**缺失**:无重大缺口。验收动作的现状路径(Today 分发 + Workbench acceptance review)可用。设计稿的独立"验收列表"视图可不新增,用 Today 验收段 + Command 验收队列即可。

### ⑩ 交付产物

| 现状能力 | 判定 |
|---|---|
| 无 deliveries 模型、无 artifact_url、无构建产物流程 | ❌ 完全无 |

**缺失**:产物交付 track(模型 + 构建集成 + 通知客户)。设计稿和 PRD 均声明"部署不在本期",标为**后期阶段**,本期搁置。

## 三、缺失清单汇总(需新增,按依赖排序)

| 缺口 | 依赖 | 落点 | 阶段 |
|---|---|---|---|
| **triage 门控修复** | 无 | workshop-api handler | 立即(已确认 bug) |
| **capabilities 字段 + 默认映射** | 无 | 后端 migration + 前端权限 | 第一批 |
| **runtime ↔ workshop-api 双向通信** | 无 | runtime 回写 + runtime 监听 WS | 前置基础设施(设计稿遗漏) |
| **FeedbackMessage state 字段** | 无 | Postgres migration | 前置基础设施 |
| **task-source-adapter 拉 FeedbackTaskLink** | 无 | runtime 侧扩展 | 第二批(桥1) |
| **Gap.derived_from 追溯(或 triggered_by)** | FeedbackTaskLink 感知 | Gap schema + runtime | 第二批(桥1) |
| **closeout → 草稿回写(桥2)** | 双向通信 + state 字段 | runtime closeout 扩展 | 第三批 |
| **草稿确认流程** | 桥2 | Feedback 详情 UI | 第三批 |
| **客户追问 → steer(桥3)** | 双向通信 + 桥1 追溯 | runtime 事件路由 | 第三批 |
| **SDK 实时推送** | workshop-api WS 已有 | SDK 侧订阅 | 第三批(影响 SLA) |
| **AI 分诊 + 知识库** | 无(净新增) | workshop-api + WeKnora | 并行(代码检索延后) |
| **产物交付 track** | 无 | 新模型 + 构建集成 | 后期(本期搁置) |

### 关键发现:设计稿遗漏的前置基础设施

设计稿把桥2/桥3 描述为"接通即可",但代码核实:**runtime 与 workshop-api 之间是单向拉取模式**,三个桥依赖的双向通信通道完全不存在。这是最大的隐藏工程量,必须作为前置基础设施先行,否则桥1/2/3 都无法落地。

建议在第一批(triage + capabilities)之后、桥1/2/3 之前,插入一个**双向通信基础设施**步骤:
- runtime → workshop-api 回写能力
- workshop-api → runtime 事件推送(runtime 监听 WebSocket,复用后端已有 per-project cursor)
- FeedbackMessage 加 state 字段(migration)

## 四、冗余清单(标记搁置,不演进)

| 冗余项 | 现状 | 处理 |
|---|---|---|
| **规划预览层四页(Idea/Release/Operations/Engineering)** | 静态示意数据,按钮 disabled,无后端绑定 | 标记搁置,本期不接入业务闭环。产品生命周期愿景,当前不串联客户支持链路 |
| **Feedback V1** | 与 V2 并存 | 本期走 V2,V1 标记搁置,不再加新能力 |
| **设计稿 Work 页内嵌的 automation-bar / Gap 时间线 / thread_id 展示** | 与现状 Command + Workbench 职责重叠 | 搁置设计稿那套,沿用现状分层(Work 管待办,Command 管态势,Workbench 管执行) |
| **设计稿客户/项目两级筛选** | 与现状 workset/scope 机制重叠 | 搁置设计稿那套,复用现状 workset |
| **设计稿把 Organization 改成"验收与交付"** | 现状 Organization 是组织治理 | 搁置设计稿的重定义,Organization 保持组织治理职责;验收用 Today/Command 承载 |

## 五、业务场景如何串起整个平台

用客户支持链路走一遍,验证现状平台被完整串联:

```
反馈提交     → SDK(product-feedback 窗口)         ← 对客入口
分诊判断     → Feedback 页(权限+状态流转)          ← 反馈治理
转待办       → feedback-v2-convert + Work 页       ← 反馈→任务桥
认领分配     → Work 页(task.update executor)      ← 待办管理
Codex 开发   → Command + automation coordinator   ← 自动化执行
执行态势     → Intervention Workbench             ← Loop 审查/介入
异常恢复     → Recovery Center                    ← 异常对齐
进展草稿     → Feedback 详情(草稿确认)            ← 桥2回写(待建)
回复客户     → feedback-v2-reply + SDK            ← 对客回复
客户追问     → steer 注入(经桥3事件路由)          ← 桥3(待建)
验收         → Today 责任台 + Workbench acceptance ← 责任分发
交付         → (后期,本期搁置)
责任聚合     → Today(deriveTodayWorkspace)       ← 统一责任台
```

现状平台的能力域(SDK / Feedback / Work / Command / Workbench / Recovery / Today / Organization / Chat)**全部被这条链路激活**,不存在游离的孤岛能力。规划预览层四页本期搁置不接入。

## 六、落地前三个前置决策

动任何缺失项前,必须先定:

1. **derived_from 语义**:前缀泛化(`customer-feedback:`)还是新增 `triggered_by`?决定桥1的 schema 改动面。前缀泛化轻但须在 SKILL.md 显式记录语义泛化,约束 agent 不要把触发来源当推理依据;新增字段语义清晰但 schema 改动大。
2. **双向通信通道形态**:runtime 监听 workshop-api WebSocket(复用 per-project cursor)还是另建事件总线?决定桥2/3/8 的基础设施选型。倾向复用现状 WebSocket cursor,runtime 侧补订阅。
3. **草稿落点**:独立 Drafts 页还是并入 Feedback 详情?决定是否新增页面。倾向并入 Feedback 详情,避免页面膨胀,草稿作为 developer/system 消息的 pending 状态。

## 七、建议步骤排序

```
第一批(可立即启动):
  triage 门控修复(role 兜底)              ← 代码已确认漏洞,改动面小
  capabilities 字段 + 默认映射(不改权限逻辑)

前置基础设施(设计稿遗漏,第二批之前):
  runtime ↔ workshop-api 双向通信通道
  FeedbackMessage 加 state 字段(migration)

第二批(依赖前置):
  capabilities 权限逻辑切换 role → capabilities
  桥1(task-source-adapter 扩展 FeedbackTaskLink + derived_from 追溯)

第三批(依赖桥1 + 前置):
  桥2(closeout → 草稿回写 + 草稿确认流程)
  桥3(客户追问 → steer,依赖事件推送 + 桥1追溯)
  SDK 实时推送

并行(独立工作面):
  WeKnora 文档知识库部署 + AI 分诊

延后(选型未定 / 本期不做):
  代码语义检索
  产物交付 track(部署不在本期)
```
