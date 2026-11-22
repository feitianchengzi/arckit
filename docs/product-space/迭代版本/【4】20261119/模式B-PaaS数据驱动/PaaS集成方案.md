# PaaS 集成方案：基于既有事件管道的外部数据驱动与事件契约

> Proposed / 2026-11-19。本文沉淀模式B（平台作为 PaaS、外部系统不打开平台 UI）的升级方案——**基于 workshop-api 既有事件/鉴权管道**，不新造平行机制。共享模型与事件清单单点定义在 [../README.md](../README.md)；模式A 的交互原语是事件的唯一来源。

## 1. 背景与问题

同一批用户存在两种使用方式：用平台（模式A），或不打开平台 UI、只把平台当能力底座——写入卡片、订阅讨论与执行事件、读取上下文与讨论摘要、调用 Agent 能力，数据驱动在外部完成。

平台核心资产是 **Project 上下文（含 git_url）→ 卡片 → 讨论资产 → 自动化/Agent 执行**；UI 只是第一方消费面。外部数据驱动缺的不是数据，是**出站通道与契约**——而数据与事件在服务端已经存在（`project_events` 事务内写入、WS 游标回放），只是没有对外暴露。

## 2. 诊断（对外集成面盘点，基于真实路由与实现）

| 集成面 | 现状（文件证据） | 缺口 |
| --- | --- | --- |
| 入站写 | `router.go` `registerBusinessRoutes()` 同时注册 user/apikey → apikey 可全量 CRUD task、触发 build/artifact；feedback V2 路由同组注册 | task 域写权限过宽（可删任务）；无 scope 分档；`ConvertFeedbackToTask` 等对 apikey 显式 403（`feedback_workflow.go:1476`） |
| 入站读 | `GET /tasks`（apikey）、`GET /public/feedbacks?key=`（`feedback_access_key.go`） | 仅 `api/*.md` 文档、无 OpenAPI；无「卡片上下文 + 讨论摘要」聚合接口 |
| 出站事件 | **无通用机制**。仅 `GET /projects/:id/ws` + `GET /projects/:id/events` 游标回放（`realtime.go`），需项目成员身份，外部系统进不来；桌面 `arckit:automation-event` 是 Electron IPC 不可外订阅 | **最大缺口**：无 webhook/订阅/签名重试 |
| 回调 | feedback `callback_url` 仅创建时一次性 GET ping（`handler/feedback.go:180-209`，5s 超时失败回滚），不持久化、无签名 | 不是 webhook |
| 导出 | 仅前端客户端 Markdown 导出（`ExportTodosDialog`） | 无服务端批量导出 |
| 事件底座 | `project_events` 表 + `recordProjectEvent`（事务内，`realtime_helpers.go`）——**事件已在库里，含 task/feedback 实体与 payload** | 未对外投递，可直接做 Webhook outbox 数据源 |

**结论**：PaaS 化 = 给已有数据与事件加三层契约（L1 API / L2 事件 / L3 能力），L2 是数据驱动关键路径；实现基于 `project_events` outbox，不新增事件源。

## 3. 产品约束

1. **事件契约以模式A 交互原语为唯一来源**（共享 README §7），且每类事件映射到**既有 `project_events` 事件名或其最小扩展**（如 `task_attachment.created` → `discussion.opinion_added` 的对外语义别名）。
2. **本次范围 = 契约定义 + 设计稿呈现**；Webhook 投递实现列后续 P1。
3. **apikey scope 收敛先于扩权**：先收敛 task 域（现状全量写），再谈新能力。
4. **讨论资产对外只出结构不出全文**：与模式A 注入规则同源；全文需 `discussion` scope + 成员身份。
5. **不引入外部依赖到产品代码**：契约以文档 + 设计稿冻结；实现选型（`project_events` outbox + 投递 worker）留到工程阶段。

## 4. 方案：L1 / L2 / L3 三层能力面

### 4.1 L1 数据面（已有接口，补契约与收敛）

| 能力 | 现状 | 本次动作 |
| --- | --- | --- |
| 卡片 CRUD | apikey 已通（`registerBusinessRoutes`） | P1：scope 三档收敛；P2：`api/*.md` 升级 OpenAPI |
| 卡片上下文/讨论摘要 | 字段分散在 `tasks`/`feedbacks`/`task.attachments` | P2：`GET /tasks/:id/context` 聚合——字段清单 = 模式A 上下文面板（共享 README §4），含 Discussion 结构摘要（P1 表） |
| 反馈提交 | apikey/session 已通 | 不动 |
| 批量导出 | 无 | P2：`GET /projects/:id/export?type=cards|discussions|events` |

scope 三档（apikey 创建时声明，网关 + handler 断言）：

- `read`：GET 任务/上下文/讨论摘要。
- `write`：POST/PUT 任务、artifact/build 回写；**不含删除与状态伪造**（删除现状对 apikey 收敛为 403）。
- `discussion`：讨论全文与完整过程（默认不发）。

### 4.2 L2 事件面（本次核心：契约定义；实现基于 `project_events` outbox）

**机制**：站内事务已写 `project_events`（`recordProjectEvent` 保证与状态变更原子）→ P1 增加投递 worker 按订阅外发 → 外部端点接收。**不新增事件源，只新增出口。**

事件体统一信封：

```json
{
  "event_id": "evt_9f3...",
  "type": "card.squeezed",
  "project_id": 12,
  "occurred_at": "2026-11-19T10:03:11Z",
  "actor": { "type": "user|agent|system", "id": "..." },
  "card": { "task_id": 456, "title": "...", "squeeze_state": "讨论中" },
  "context": { "project_name": "...", "git_url": "..." },
  "discussion_digest": { "topics": 1, "opinions": 4, "decision": null },
  "delivery": { "attempt": 1, "signature": "sha256=..." }
}
```

**事件清单与模式A 映射**（权威定义在共享 README §7；与既有 `project_events` 事件名的对应）：

| 对外事件 | 关键 payload | 现有 `project_events` 来源 | 模式A 触发交互 | 典型外部用途 |
| --- | --- | --- | --- | --- |
| `card.squeezed` | `card`、`source_feedback_id` | `task.created`（zone=squeeze 变体） | 反馈「进入挤压区」 | 外部工单同步、积压监控 |
| `discussion.opinion_added` | `opinion{role, summary}` | `task_attachment.created` | 讨论发言 | 通知群、讨论看板 |
| `discussion.decided` | `decision{verdict, rationale}` | 新增（P1，走 `recordProjectEvent`） | 「标记决策结论」 | 需求池准入、排期系统 |
| `task.decomposed` | `subtasks[]` | 新增 + `task.created` 批量 | Agent 自动拆解 | 外部任务树对齐 |
| `agent.question_raised` | `question, blocked_on` | `automation.changed(awaiting-human)` 的卡片侧镜像（P2） | Agent 主动提问 | 外部 @ 责任人、值班告警 |
| `task.state_changed` | `from, to` | `task.updated` | 状态选择器 | BI 漏斗、SLA 统计 |

**投递语义（契约级，P1 实现）**：至少一次、指数退避重试（5 次）、HMAC-SHA256（`X-Arckit-Signature`）、`event_id` 幂等、失败死信可查。

**订阅管理（P1）**：`POST/GET/DELETE /projects/:id/webhooks`（user 级 admin/owner）；管理 UI 后置。

### 4.3 L3 能力面（Agent/工作流能力作为可调用服务）

| 能力 | 现状入口 | PaaS 化动作 |
| --- | --- | --- |
| 反馈预分析 | `POST /feedbacks/:id/triage`（规则版，`handler/triage.go`） | 保持；apikey 可调（已有） |
| 反馈→卡片 | `convert-to-task`（apikey 403，`feedback_workflow.go:1476`） | P1：放开为 `zone=squeeze` 变体 + `write` scope——外部可建卡进挤压区，**不可代受理决定**（handler 断言保留） |
| 卡片拆解 | 无（桌面 `task.subtask.create` 是成员 action） | P2：`POST /tasks/:id/decompose` 返回草稿，人确认后落库——与模式A 拍板项 3 同源 |
| Agent 提问 | 无对外入口（桌面 attention 是本地原语） | P2：`POST /tasks/:id/agent-questions`，产出走 `agent.question_raised` |

### 4.4 落地优先级

- **P0（本迭代，零工程）**：事件契约 + payload 字段定义 + 与既有 `project_events` 名的映射 + 设计稿呈现；`GET /tasks/:id/context` 字段清单冻结。
- **P1（后续迭代，3–5 天）**：`project_events` outbox 投递 worker + 签名重试死信 + 订阅管理 API；apikey scope 三档收敛；`zone=squeeze` 建卡变体。
- **P2（后续迭代）**：OpenAPI、服务端导出、`/context` 聚合接口、`decompose`/`agent-questions` 能力 API。

## 5. 设计稿呈现

[设计稿/paas-integration.html](设计稿/paas-integration.html) 以外部系统（示例：Acme 数据平台）视角覆盖：订阅配置 → Webhook 事件日志（payload + 签名头 + 投递重试）→ API 调试台（scope 三档越权演示）→ 外部 BI 看板（事件聚合）。一键演示按事件契约顺序推流；评审路径见 [设计稿/README.md](设计稿/README.md)。

## 6. 待拍板项

1. Webhook 实现排期进 P1 还是本迭代一并做？（本文推荐 P1，本迭代只冻结契约）
2. `convert-to-task` 的 apikey 403 是否放开为「可建卡进挤压区、不可代决策」？（推荐放开但限 `write` scope + handler 断言）
3. 对外事件别名（如 `task_attachment.created` → `discussion.opinion_added`）在投递层做映射，还是服务端直接写新事件名？（推荐投递层映射，避免动站内管道）
4. 导出 API 是否包含讨论全文（受约束 4 限制，默认只出结构摘要）？

## 7. 落地拆分建议

| 优先级 | 改动 | 真实文件范围 | 依赖 |
| --- | --- | --- | --- |
| P0 | 事件契约 + payload 冻结 | 本目录文档 + 设计稿 | 共享 README §7 |
| P1 | outbox 投递 worker | `database/migrations/`（新 webhook 订阅/投递表）、新 `handler/webhook*.go`、投递 worker（参照 `feedbackemail/worker.go` 模式） | `project_events` 现成 |
| P1 | 订阅管理 API | `router/router.go`、`handler/` | 无 |
| P1 | apikey scope 三档 | 网关 + `middleware/` + `router_test.go` 断言 | auth-server 在仓外，需协同 |
| P1 | `zone=squeeze` 建卡变体 | `handler/feedback_workflow.go`、`platform-coordinator.mjs` action | P1 Discussion |
| P2 | `GET /tasks/:id/context` | `handler/task.go` | P1 Discussion 字段 |
| P2 | OpenAPI + 导出 | `api/` 目录 | P1 |
| P2 | decompose / agent-questions | `handler/` | 模式A P2 |

## 8. 验收要点

1. 契约层：六类事件均有字段级 payload、触发时机、**既有 `project_events` 来源映射**，且与模式A 交互原语一一对应。
2. P1 实现后：外部端点收到带签名 payload，`event_id` 幂等去重；失败按退避重试、死信可查；投递与 `project_events` 落库同源（不丢事件）。
3. apikey `read` 无法写、`write` 无法删任务、无 `discussion` scope 读不到讨论全文；`zone=squeeze` 建卡成功但受理决定类操作仍 403。
4. `GET /tasks/:id/context` 返回与模式A 卡片上下文面板逐字段一致。
5. 设计稿一键演示走通：订阅 → 六类事件推流 → payload 展开 → 失败重试 → BI 看板联动。
