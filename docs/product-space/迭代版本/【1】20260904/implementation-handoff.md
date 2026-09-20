# 智能客服功能 — 实现交接文档

> 本文档是 `customer-support-prd.md`、`customer-support-sequence-diagrams.md`、`scenario-gap-analysis.md`、`knowledge-base-integration-guide.md` 的**工程落地配套文档**。
>
> 它记录了从设计稿到可运行代码的完整实现过程，包括所有改动文件、实现细节、已知问题和后续计划。
>
> 文档日期：2026-09-17
> 状态：代码链路完成，仅剩 UI 数据源接通 + 部署依赖

---

## 0. 实现范围

### 0.1 已完成

| 模块 | 内容 | 状态 |
|------|------|------|
| workshop-api 编译修复 | 重复函数定义 + Now() bug | ✅ 完成 |
| IPC 链路打通 | 8 个 preload → main → coordinator → API handler | ✅ 完成 |
| UI 组件迁移 | AI 分诊面板 + 检索卡片 + 代码仓库管理 | ✅ 完成 |
| 事件绑定 | 5 个新事件处理函数 | ✅ 完成 |
| 样式对齐 | 4 组 CSS 组件 | ✅ 完成 |
| 配置框架 | openhands-agent.json + persona.md | ✅ 完成 |
| 部署编排 | Docker Compose + 环境变量 | ✅ 完成 |
| 监控降级 | 健康检查 + 降级策略 + 耗时统计 | ✅ 完成 |
| 数据库迁移 | openhands_agents + customer_code_repos 表 | ✅ 完成 |
| 本地验证工具 | verify.sh + start.sh | ✅ 完成 |
| **triage 门控** | `requireFeedbackTriagePermission` 权限检查 | ✅ 完成 |
| **capabilities 字段** | ProjectMember 模型扩展 + HasCapability 方法 | ✅ 完成 |
| **FeedbackMessage state** | 草稿状态（pending_review/sent）| ✅ 完成 |
| **草稿回写 API** | CreateDraftHandler / ConfirmDraftHandler / RejectDraftHandler | ✅ 完成 |
| **WebSocket 事件推送** | workshop-realtime-adapter.mjs 实现事件广播 | ✅ 完成 |
| **桥1：FeedbackTaskLink API** | GetFeedbackTaskLinks / GetTaskFeedbackLinks | ✅ 完成 |
| **桥2：closeout 草稿回写** | markCloseoutCompleted() 中调用 createDraftFromCloseout() | ✅ 完成 |
| **桥3：steer 注入** | codex-app-server-adapter 的 stdin /steer 能力 | ✅ 完成 |

### 0.2 未完成（后续阶段）

| 模块 | 内容 | 优先级 | 状态 |
|------|------|--------|------|
| OpenHands Agent Server 实际部署 | Docker 容器启动 + LLM 配置 | P0 | 部署依赖，非代码缺口 |
| 客户代码仓库语义索引 | regex 分块 + embedding（非 tree-sitter） | P0 | ✅ 代码已完成 |
| 产物交付 track | 构建产物 + artifact_url 回写 + 自动通知 | P2 | ✅ 代码已完成 |
| UI 数据源接通 | AI 分诊面板 + 检索卡片数据填充 | P1 | ⚠️ 待接通 |

---

## 1. 改动文件清单

### 1.1 workshop-api（Go 后端）

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `services/workshop-api/handler/customer_code_repo.go` | 修复 | 删除 3 个重复函数定义，修复 `Now()` bug，添加 `time` import |
| `services/workshop-api/handler/retrieve.go` | 增强 | 增强 `OpenHandsAgent` 模型（+8 字段），修改 `callOpenHandsAgent` 使用配置，新增配置 CRUD + 健康检查端点 |
| `services/workshop-api/handler/feedback.go` | 新增 | `GetFeedbackTaskLinks` / `GetTaskFeedbackLinks` API |
| `services/workshop-api/handler/feedback_workflow.go` | 修复 | `requireFeedbackTriagePermission` 权限检查，`ConvertFeedbackToTask` 设置 `SourceFeedbackID` |
| `services/workshop-api/handler/knowledge.go` | 新增 | 知识库 CRUD + reindex 触发实际 pipeline |
| `services/workshop-api/handler/code_index.go` | 新增 | 代码索引 pipeline（文件遍历、regex 符号分块、embedding、向量检索、SQL LIKE 兜底） |
| `services/workshop-api/handler/artifact.go` | 新增 | 产物交付 API + `autoNotifyDelivery`（自动通知客户） |
| `services/workshop-api/handler/build.go` | 新增 | 构建触发 + 自动交付通知 |
| `services/workshop-api/handler/delivery.go` | 新增 | 交付通知 API + 状态查询 |
| `services/workshop-api/router/router.go` | 新增路由 | 桥1 路由 + 知识库 + 代码索引 + 构建 + 交付路由 |
| `services/workshop-api/models/knowledge.go` | 新增 | KnowledgeWorkspace, KnowledgeSource, CodeChunk 模型 |
| `services/workshop-api/models/project.go` | 新增 | capabilities 字段 + HasCapability 方法 + 能力常量 |
| `services/workshop-api/models/project_test.go` | 新增测试 | 13 个测试用例覆盖能力检查逻辑 |
| `services/workshop-api/handler/feedback_workflow_test.go` | 新增测试 | `requireFeedbackTriagePermission` 权限测试 |
| `services/workshop-api/handler/code_index_test.go` | 新增测试 | 11 个单元测试覆盖索引 pipeline |
| `services/workshop-api/handler/build_test.go` | 新增测试 | 构建触发测试 |
| `services/workshop-api/handler/delivery_test.go` | 新增测试 | 交付通知测试 |
| `services/workshop-api/handler/knowledge_test.go` | 新增测试 | 知识库 CRUD 测试 |
| `services/workshop-api/database/migrations/20260917_knowledge_workspace_source_up.sql` | 新增迁移 | knowledge_workspaces + knowledge_sources + code_chunks 表 |
| `services/workshop-api/database/migrations/20260917_knowledge_workspace_source_down.sql` | 新增迁移 | 回滚迁移 |
| `services/workshop-api/database/migrations/20260917_task_artifact_feedback_up.sql` | 新增迁移 | tasks.artifact_url + tasks.source_feedback_id 字段 |
| `services/workshop-api/database/migrations/20260917_task_artifact_feedback_down.sql` | 新增迁移 | 回滚迁移 |
| `services/workshop-api/database/migrations/20260917_member_capabilities_up.sql` | 新增迁移 | ProjectMember capabilities 字段 |
| `services/workshop-api/database/migrations/20260917_member_capabilities_down.sql` | 新增迁移 | 回滚迁移 |
| `services/workshop-api/database/migrations/20260917_feedback_message_state_up.sql` | 新增迁移 | FeedbackMessage state 字段 |
| `services/workshop-api/database/migrations/20260917_feedback_message_state_down.sql` | 新增迁移 | 回滚迁移 |
| `services/workshop-api/database/migrations/20260917_openhands_config_up.sql` | 新增迁移 | openhands_agents + customer_code_repos 表 |
| `services/workshop-api/database/migrations/20260917_openhands_config_down.sql` | 新增迁移 | 回滚迁移 |
| `services/workshop-api/deploy/dev/docker-compose.openhands.yml` | 新增配置 | OpenHands Agent Server Docker 编排 |
| `services/workshop-api/deploy/dev/env.development.example` | 新增配置 | OpenHands 环境变量配置 |
| `services/workshop-api/deploy/dev/verify.sh` | 新增脚本 | 全链路验证脚本 |
| `services/workshop-api/deploy/dev/start.sh` | 新增脚本 | 本地快速启动脚本 |
| `services/workshop-api/deploy/dev/README-openhands.md` | 新增文档 | 智能客服功能文档 |

### 1.2 arcorbit 客户端（Electron + MJS）

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `runtime/arcorbit/config/openhands-agent.json` | 新增配置 | OpenHands Agent 配置（LLM、检索、沙箱、降级策略） |
| `runtime/arcorbit/config/openhands-persona.md` | 新增配置 | 智能客服人设 prompt（角色、语气、能力边界、行为规则） |
| `runtime/arcorbit/desktop/main.mjs` | 新增 handler | 8 个 `ipcMain.handle` 注册 |
| `runtime/arcorbit/src/platform-coordinator.mjs` | 新增方法 | 8 个方法（retrieveFeedback、confirmFeedbackDraft 等） |
| `runtime/arcorbit/desktop/renderer/renderer.js` | 新增组件 | `renderAITriagePanel`、`renderRetrievalCard`、`renderCustomerCodeRepos` + 5 个事件处理函数 |
| `runtime/arcorbit/desktop/renderer/styles.css` | 新增样式 | 检索卡片、AI 分诊面板、客户代码仓库管理、草稿消息增强 |

---

## 2. 架构实现

### 2.1 IPC 链路

```
renderer.js (UI)
  │ api.confirmFeedbackDraft({ projectId, feedbackId, messageId })
  ▼
preload.cjs (IPC 桥接)
  │ invokeFeedbackV2("arckit:feedback-draft-confirm", input)
  ▼
main.mjs (主进程)
  │ ipcMain.handle("arckit:feedback-draft-confirm", ...)
  │ settleFeedbackV2Ipc(() => platformCoordinator.confirmFeedbackDraft(input))
  ▼
platform-coordinator.mjs (协调层)
  │ runFeedbackV2Action(projectId, "draft_confirm", () =>
  │   platformSource.request(`/feedbacks/${id}/messages/${mid}/confirm`, { method: "POST" })
  │ )
  ▼
workshop-platform-adapter.mjs (适配层)
  │ request(path, options) → HTTP 调用
  ▼
workshop-api (Go 后端)
  │ ConfirmDraftHandler → 更新 FeedbackMessage.state = "sent"
  ▼
PostgreSQL
```

### 2.2 双向通信链路

```
Runtime → Workshop-API (HTTP REST)
  │ task-source-adapter.mjs → workshop-platform-adapter.mjs
  │ createFeedbackDraft / confirmFeedbackDraft / rejectFeedbackDraft
  ▼
Workshop-API → Runtime (WebSocket 事件)
  │ realtime/hub.go → WritePump → WebSocket
  │ project_events 表 → LISTEN/NOTIFY → Hub.Broadcast
  ▼
workshop-realtime-adapter.mjs
  │ WebSocket 消息 → queueInvalidation() → refreshProject()
```

### 2.3 桥1：FeedbackTaskLink 追溯

```
Feedback → FeedbackTaskLink → Task
  │                         │
  │  feedback.id            │  task.id
  │  task_id                │  source_feedback_id (可选)
  ▼                         ▼
GetFeedbackTaskLinks    GetTaskFeedbackLinks
```

### 2.4 桥2：closeout → 草稿回写

```
Case resolved
  │
  ▼
startSameThreadCloseout()
  │ Git 收尾
  ▼
markCloseoutCompleted()
  │ 调用 createDraftFromCloseout()
  ▼
POST /feedbacks/{id}/drafts
  │ 创建 FeedbackMessage(state=pending_review)
  ▼
PostgreSQL
```

### 2.5 桥3：客户追问 → steer

```
客户发送追问
  │
  ▼
SDK → POST /feedbacks/{id}/messages
  │ 创建 FeedbackMessage
  ▼
workshop-api → WebSocket 广播 feedback.message.created
  │
  ▼
runtime/workshop-realtime-adapter.mjs
  │ onInvalidate() → detectActiveCaseForFeedback()
  │ 如果有活跃 Case → steer 注入
  ▼
codex-app-server-adapter
  │ stdin /steer 或 parent port
  ▼
同一 Agent 线程处理追问
```

---

## 3. API 端点详情

### 3.1 桥1：FeedbackTaskLink 查询

#### 查询反馈关联的待办

```
GET /workshop/v2/user/feedbacks/{feedbackId}/task-links

响应:
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "feedback_id": 100,
      "project_id": 1,
      "task_id": 200,
      "relation_type": "converted_to",
      "is_primary": true,
      "created_by": 1,
      "created_at": "2026-09-17T10:00:00Z"
    }
  ]
}
```

#### 查询待办关联的反馈

```
GET /workshop/v2/user/tasks/{taskId}/feedback-links

响应:
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "feedback_id": 100,
      "project_id": 1,
      "task_id": 200,
      "relation_type": "converted_to",
      "is_primary": true
    }
  ]
}
```

### 3.2 桥2：草稿管理

#### 创建草稿（runtime 回写）

```
POST /workshop/v2/apikey/feedbacks/{feedbackId}/drafts

请求体:
{
  "content": "草稿内容",
  "task_id": 200,
  "source_files": ["src/auth/login.ts"]
}

响应:
{
  "code": 0,
  "data": {
    "message_id": 1,
    "state": "pending_review"
  }
}
```

#### 确认草稿

```
POST /workshop/v2/user/feedbacks/{feedbackId}/messages/{messageId}/confirm

请求体:
{
  "content": "确认发送的内容"
}

响应:
{
  "code": 0,
  "data": {
    "message_id": 1,
    "state": "sent"
  }
}
```

#### 驳回草稿

```
POST /workshop/v2/user/feedbacks/{feedbackId}/messages/{messageId}/reject

响应:
{
  "code": 0,
  "data": {
    "message_id": 1,
    "status": "rejected"
  }
}
```

### 3.3 OpenHands 配置管理

#### 查询配置

```
GET /workshop/v2/user/projects/{projectId}/openhands-config

响应:
{
  "code": 0,
  "data": {
    "id": 1,
    "project_id": 1,
    "url": "http://localhost:8000",
    "llm_model": "anthropic/claude-sonnet-4-5-20250929",
    "confidence_threshold": 0.75,
    "timeout_ms": 10000,
    "status": "active"
  }
}
```

#### 更新配置

```
PUT /workshop/v2/user/projects/{projectId}/openhands-config

请求体:
{
  "url": "http://localhost:8000",
  "api_key": "your-api-key",
  "llm_model": "anthropic/claude-sonnet-4-5-20250929",
  "llm_temperature": 0.0,
  "max_iterations": 50,
  "confidence_threshold": 0.75,
  "timeout_ms": 10000,
  "persona_file": "runtime/arcorbit/config/openhands-persona.md",
  "sandbox_runtime": "docker",
  "sandbox_base_image": "ghcr.io/openhands/agent-server:latest-python"
}
```

#### 健康检查

```
GET /workshop/v2/user/projects/{projectId}/openhands-health

响应:
{
  "status": "available",
  "message": "OpenHands Agent 正常运行"
}
```

### 3.4 智能客服检索

```
POST /workshop/v2/user/feedbacks/retrieve

请求体:
{
  "query": "用户问题",
  "conversation_id": ""
}

响应:
{
  "code": 0,
  "data": {
    "hits": [
      {
        "source": "customer_code",
        "type": "code",
        "title": "src/auth/login.ts",
        "snippet": "login 函数实现...",
        "score": 0.9
      }
    ],
    "confidence": 0.9,
    "draft_reply": "根据代码实现...",
    "need_collect": false,
    "conversation_id": "abc123"
  },
  "meta": {
    "elapsed_seconds": 0.5,
    "project_id": 1
  }
}
```

### 3.5 客户代码仓库管理

#### 创建仓库

```
POST /workshop/v2/user/projects/{projectId}/code-repos

请求体:
{
  "customer_id": "customer-001",
  "repo_path": "/projects/customer-001/repo",
  "branch": "main"
}
```

#### 查询列表

```
GET /workshop/v2/user/projects/{projectId}/code-repos

响应:
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "project_id": 1,
      "customer_id": "customer-001",
      "repo_path": "/projects/customer-001/repo",
      "branch": "main",
      "status": "ready"
    }
  ]
}
```

#### 同步仓库

```
POST /workshop/v2/user/projects/{projectId}/code-repos/{repoId}/sync

响应:
{
  "code": 0,
  "data": {
    "repo_id": 1,
    "status": "syncing"
  }
}
```

---

## 4. 数据模型

### 4.1 新增字段

#### ProjectMember.capabilities

```sql
ALTER TABLE project_members
  ADD COLUMN capabilities JSONB NOT NULL DEFAULT '[]'::jsonb;
```

- 类型：`[]string`
- 默认值：`[]`
- owner/admin 默认包含 `"triage"` 能力
- 支持的值：`triage`, `manage_code_repos`, `manage_knowledge`, `manage_open_hands`

#### FeedbackMessage.state

```sql
ALTER TABLE feedback_messages
  ADD COLUMN state VARCHAR(32) NOT NULL DEFAULT 'sent';
```

- 类型：`string`
- 可选值：`pending_review`（草稿）, `sent`（已发送）

### 4.2 新增表

#### openhands_agents

```sql
CREATE TABLE openhands_agents (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  url VARCHAR(500) NOT NULL,
  api_key VARCHAR(500) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  llm_model VARCHAR(200) DEFAULT 'anthropic/claude-sonnet-4-5-20250929',
  llm_temperature DOUBLE PRECISION DEFAULT 0.0,
  max_iterations INTEGER DEFAULT 50,
  confidence_threshold DOUBLE PRECISION DEFAULT 0.75,
  timeout_ms INTEGER DEFAULT 10000,
  persona_file VARCHAR(500),
  sandbox_runtime VARCHAR(32) DEFAULT 'docker',
  sandbox_base_image VARCHAR(500) DEFAULT 'ghcr.io/openhands/agent-server:latest-python',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### customer_code_repos

```sql
CREATE TABLE customer_code_repos (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  customer_id VARCHAR(128) NOT NULL,
  repo_path VARCHAR(500) NOT NULL,
  branch VARCHAR(100) NOT NULL DEFAULT 'main',
  last_synced_at TIMESTAMP,
  status VARCHAR(32) NOT NULL DEFAULT 'ready',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 5. 配置文件说明

### 5.1 openhands-agent.json

**位置**：`runtime/arcorbit/config/openhands-agent.json`

```json
{
  "enabled": false,
  "server_url": "http://localhost:8000",
  "api_key_env": "OH_SESSION_API_KEYS_0",
  "sandbox": {
    "runtime": "docker",
    "base_image": "ghcr.io/openhands/agent-server:latest-python",
    "workspace_path": "/workspace"
  },
  "llm": {
    "model": "anthropic/claude-sonnet-4-5-20250929",
    "api_key_env": "LLM_API_KEY",
    "temperature": 0.0,
    "max_iterations": 50
  },
  "retrieval": {
    "confidence_threshold": 0.75,
    "timeout_ms": 10000,
    "source_weights": {
      "product_faq": 1.2,
      "product_facts": 1.0,
      "customer_doc": 0.9,
      "customer_code": 0.8
    }
  },
  "fallback": {
    "on_timeout": "collect",
    "on_error": "collect",
    "on_no_match": "collect"
  },
  "conversation": {
    "max_history": 20,
    "context_window": 8000,
    "summarize_after": 15
  }
}
```

### 5.2 openhands-persona.md

**位置**：`runtime/arcorbit/config/openhands-persona.md`

**核心内容**：
- 角色定义：项目技术支持助手
- 语气规范：友好、专业、简洁、中文、不使用 emoji
- 能力边界：只能基于代码仓库和文档回答，不能修改代码/执行部署
- 信息来源标注：回复必须标注文件路径/文档名
- 降级策略：超时/未命中/异常 → 转追问收集

---

## 6. 已知问题

### 6.1 编译问题

| 问题 | 状态 | 说明 |
|------|------|------|
| `customer_code_repo.go` 重复函数定义 | ✅ 已修复 | 删除 `parseFeedbackIDParam`、`isAPIKeyRequest`、`notifyProjectEvent` 重复定义 |
| `SyncCustomerCodeRepoHandler` Now() bug | ✅ 已修复 | `"Now()"` 字符串 → `time.Now()` |

### 6.2 运行时问题

| 问题 | 状态 | 说明 |
|------|------|------|
| OpenHands Agent Server 未部署 | ⚠️ 待部署 | 需要配置 LLM_API_KEY 并启动 Docker 容器 |
| 客户代码仓库语义索引 | ✅ 已实现 | regex 符号分块 + embedding 向量检索，SQL LIKE 兜底 |

### 6.3 UI 问题

| 问题 | 状态 | 说明 |
|------|------|------|
| AI 分诊面板数据源未接通 | ✅ 已接通 | 详情打开时经 `runFeedbackTriage` IPC（`arckit:feedback-triage`）调用 `POST /feedbacks/:id/triage`，后端写入 `data.triage` 后刷新 |
| 检索卡片数据源未接通 | ✅ 已接通 | 详情打开时 `loadFeedbackRetrieval` 调用 retrieve 并就地渲染 |

### 6.4 三桥 runtime 侧落地（2026-09-18 TDD 补齐）

| 桥 | 落点 | 状态 |
|----|------|------|
| 桥1 | `normalizeTask` 保留 `source_feedback_id`；claim 时写入 `active_task.customer_feedback_id`；`continuationContext` 携带 `customer_feedback_ref`（`customer-feedback:<id>`，供 Agent ledger 记录 Gap.derived_from） | ✅ 完成 |
| 桥2 | `closeoutDraftTarget(active)` 门控（仅客户反馈来源执行），`markCloseoutCompleted` 经注入的 `taskSource` 回写 `POST /feedbacks/:id/drafts`；验收反馈（AF-*）不误写 | ✅ 完成 |
| 桥3 | `workshop-realtime-adapter` 透传 `feedback.message.created` 载荷（含断线重放）；`automationCoordinator.handleCustomerFeedbackEvent` 硬关联匹配（feedback_id + project + run running）后 `controlRun steer` 注入 `[customer-follow-up feedback:<id>]` 消息 | ✅ 完成 |

测试：`runtime/arcorbit/test/customer-support-bridges.test.mjs`（8 例）+ `workshop-realtime-adapter.test.mjs` 新增 2 例 + `platform-coordinator.test.mjs` 新增 1 例。

### 6.5 真实端到端验收发现并修复的缺陷（2026-09-19）

| 缺陷 | 影响 | 修复 | 回归测试 |
|------|------|------|---------|
| `CodeChunk.TableName` 缺 schema 限定 | 代码索引写入落到不存在的 `public.code_chunks` 且错误被吞，索引永远无法持久化、检索永远为空 | TableName 改为 `code_index.code_chunks` | `code_index_schema_integration_test.go` + `knowledge_test.go` 断言更新 |
| `TriageHandler` 无 role 门控 | member 可触发 AI 分诊初判，违反 PRD 安全验收 AC-F04 | 加 `requireFeedbackTriagePermission` | `triage_gate_test.go`（owner/admin 200、member 403） |
| `TaskResponse` 缺 `source_feedback_id` | 任务列表/转换响应丢失桥1溯源字段，runtime 拿不到客户反馈 ID | 字段加入 struct 与两个 mapper | E2E 步骤[4] 断言 |
| `KnowledgeRetrieveTestHandler` 测试对响应信封 code 类型断言过严 | DSN 门控测试在带库环境下恒失败（存量） | 测试改用 `json.RawMessage` | 全量回归绿 |

端到端验收脚本：`deploy/dev/e2e-acceptance.sh`（31 项断言，覆盖 反馈提交→检索(降级)→分诊→转任务(桥1)→越权403→认领→WS广播(桥3输入)→草稿确认/驳回(桥2)→验收→产物交付→代码索引(降级)→DB级一致性）。运行方式：启动服务后 `./e2e-acceptance.sh <BASE_URL> <USER_UUID> <PROJECT_ID>`。

### 6.6 真实端到端验收第二轮（2026-09-19 复验，32 项断言）

干净环境（清理历史残留配置与 chunk）复跑发现并修复以下缺陷；E2E 脚本新增来源路径断言后为 32 项：

| 缺陷 | 影响 | 修复 | 回归 |
|------|------|------|------|
| `chunkCodeFile` 构造 chunk 漏传 `filePath` | 所有索引 chunk 的 file_path 落库为空，检索命中卡片无来源文件路径（违反 PRD F-03 来源标注） | 两个分支补 `filePath: relPath` | `TestChunkCodeFile` 增加 filePath 断言 + E2E 步骤[10] 新增断言 |
| 无 active OpenHands 配置时 `RetrieveHandler` 直接短路返回"未启用智能客服" | 本地检索层（客户代码索引）被整层跳过，与 PRD F-03"两层检索/本地兜底"矛盾；首轮验收通过系历史残留配置掩盖 | 移除短路：未配置 Agent 时仍执行本地检索层，阈值取默认 0.75 | E2E 步骤[10]（干净状态下）复验命中 |
| 非 git 目录 sync 被 `git pull` 失败误标 `error` 且 `last_synced_at` 恒零值 | 本地目录快照（合法形态）状态永远报错、永不自动索引 | sync 前先 `rev-parse` 判定：非 git 仓库视为快照直接 ready 并触发索引 | E2E 步骤[10] + DB 断言 status=ready |
| sync 自动索引与显式 `/index` 并发到达可同源双写 | 重复 chunk | `runCodeIndexPipeline` 加互斥锁串行化 | 并发场景观察 |
| `snippet[:500]` 按字节截断可切破 UTF-8 多字节字符 | 检索摘要尾部出现乱码替换符 | 复用 rune-safe `truncateRunes` | go test 全量绿 |
| `renderer.js` `loadKnowledgeFactSummary(selected)` 误置于无该作用域的 `wireOrganizationActions` | 打开组织页触发 `ReferenceError: selected is not defined`，知识库状态行永远"加载中" | 调用移回拥有 `selected` 的 `renderOrganizationProjects` 末尾 | arcorbit 739 用例全绿（修复前 2 例失败） |

mock 模型路径验证（`/tmp/mock-openhands.cjs` 按 `callOpenHandsAgent` 契约实现 /health、/api/conversations、/api/conversations/:cid/events）：健康检查 available；检索双层合并（agent_hits=1、draft_reply、confidence 0.72）；带 conversation_id 二轮追问正确路由到 /events 端点；Agent 宕机时本地命中照常返回、全未命中转 need_collect，无阻断。

已知改进项（不阻断投产，记录备忘）：① retrieve 本地层为整句 SQL LIKE 不分词，混合查询（"LoginUser 登录无响应"）命中不了本地代码，可接入向量检索层；② 同一物理目录重复注册仓库会产生跨 source 重复 chunk（检索层已去重，数据层可在注册时按 repo_path 清理旧 source）；③ 验收当日观察到一次检索响应含未转义控制字符（jq 解析失败），后续 40+ 次压测未能复现，服务端为标准 encoding/json，建议生产监控留意。


---

## 7. 后续计划

### 7.1 部署依赖（非代码缺口）

1. 配置 LLM API Key + 启动 OpenHands Agent Server
2. 部署 Embedding 服务（BGE-M3 / Ollama）用于向量检索
3. 配置阿里云 OSS 用于产物上传

### 7.2 UI 数据源接通（P1）

1. 在 feedback 响应中附加 `data.triage` 对象（triage 分析结果）
2. 在 feedback 响应中附加 `retrieval` 字段（检索结果）
3. 需要后端新增 triage 接口或将 triage 逻辑集成到 retrieve 流程

### 7.3 验证与完善

1. 端到端验证全链路（retrieve → draft → confirm → triage → task → artifact）
2. 完善降级策略（无 OpenHands / 无 Embedding / 无 OSS）
3. 性能调优（代码索引批量构建、检索延迟优化）

---

## 8. 测试用例

### 8.1 单元测试

```bash
# workshop-api
cd services/workshop-api
go test ./handler/... -v -run TestOpenHands
go test ./handler/... -v -run TestCustomerCodeRepo
go test ./handler/... -v -run TestDraft
go test ./handler/... -v -run TestRequireFeedbackTriagePermission
go test ./models/... -v -run TestHasCapability
```

### 8.2 集成测试

```bash
# 全链路验证
cd services/workshop-api/deploy/dev
./verify.sh all

# 生成验证报告
./verify.sh report
```

### 8.3 手动测试

```bash
# 1. 健康检查
curl http://localhost:8081/workshop/v1/public/health

# 2. OpenHands 配置查询
curl http://localhost:8081/workshop/v1/user/projects/1/openhands-config

# 3. OpenHands 健康检查
curl http://localhost:8081/workshop/v1/user/projects/1/openhands-health

# 4. 智能客服检索
curl -X POST http://localhost:8081/workshop/v2/user/feedbacks/retrieve \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -d '{"query": "test query", "conversation_id": ""}'

# 5. 客户代码仓库列表
curl http://localhost:8081/workshop/v2/user/projects/1/code-repos \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111"

# 6. 反馈关联待办查询
curl http://localhost:8081/workshop/v2/user/feedbacks/1/task-links \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111"

# 7. 待办关联反馈查询
curl http://localhost:8081/workshop/v2/user/tasks/1/feedback-links \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111"
```

---

## 9. 部署检查清单

### 9.1 开发环境

- [ ] PostgreSQL 运行中
- [ ] 数据库迁移已执行（GORM AutoMigrate + SQL 迁移文件）
- [ ] Workshop API 运行中
- [ ] OpenHands Agent Server 运行中（可选）
- [ ] LLM API Key 已配置

### 9.2 生产环境

- [ ] PostgreSQL 集群配置
- [ ] 数据库迁移已执行
- [ ] Workshop API 部署
- [ ] OpenHands Agent Server 部署
- [ ] LLM API Key 安全存储
- [ ] 监控告警配置
- [ ] 日志收集配置

---

## 10. 相关文档

| 文档 | 位置 | 说明 |
|------|------|------|
| PRD | `customer-support-prd.md` | 产品需求文档 |
| 时序图 | `customer-support-sequence-diagrams.md` | 环节时序图 |
| 缺口分析 | `scenario-gap-analysis.md` | 业务场景缺口分析 |
| 知识库集成 | `knowledge-base-integration-guide.md` | 知识库集成与使用说明 |
| 设计稿 | `设计稿/` | UI 设计原型 |
| 功能文档 | `deploy/dev/README-openhands.md` | 智能客服功能文档 |

---

## 11. 联系人

| 角色 | 负责内容 |
|------|---------|
| 后端开发 | workshop-api 改动、数据库迁移 |
| 前端开发 | arcorbit 客户端 UI 组件、IPC 链路 |
| DevOps | Docker 部署、OpenHands Agent Server |
| 产品 | 需求确认、验收标准 |
