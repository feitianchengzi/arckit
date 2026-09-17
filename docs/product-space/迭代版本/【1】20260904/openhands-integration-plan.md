# 客户支持通道 — OpenHands 客服 Agent 落地方案

> 基于当前项目 arcorbit 客户端现状，本期不构建知识库，以代码仓库作为权威知识/逻辑源头，引入 OpenHands 开源项目作为客服 Agent，实现对外问答服务。

---

## 一、方案背景

### 1.1 需求变更

| 原方案 | 新方案 |
|--------|--------|
| 构建 WeKnora 知识库 + 代码 RAG 管道 | **不构建知识库**，以代码仓库为权威源 |
| 置信度合并算法 + 两层检索 | **单层代码检索**，OpenHands Agent 直接读取代码仓库 |
| 独立知识源管理面板 | **复用 Git 仓库管理**，无需额外管理界面 |

### 1.2 为什么选 OpenHands

| 维度 | OpenHands | 自建方案 |
|------|-----------|----------|
| **代码理解能力** | ✅ 原生支持代码仓库读取、符号分析、调用关系追踪 | 需自建 tree-sitter + embedding |
| **对话能力** | ✅ 支持多轮对话、追问、澄清 | 需自建对话管理 |
| **沙箱隔离** | ✅ Docker 沙箱，每个客户独立环境 | 需自建隔离机制 |
| **REST API** | ✅ 完整的会话管理 + 事件流 API | 需自建 API 层 |
| **开源免费** | ✅ MIT 协议，88k stars | 开发成本高 |
| **模型无关** | ✅ 支持 OpenAI/Claude/本地模型 | 需自建模型适配 |

**核心判断**：OpenHands 本身就是为"代码仓库 + AI Agent"场景设计的，与我们的需求高度匹配。

---

## 二、架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        客户侧 (SDK)                              │
│  FeedbackConversationPanel (复用现有组件)                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │ POST /api/v1/projects/{pid}/feedbacks/retrieve
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    workshop-api (治理层)                          │
│  retrieve handler (待建)                                         │
│   ├─ 鉴权 + 项目隔离校验                                         │
│   ├─ 查询该项目绑定的 OpenHands Agent Server 地址                  │
│   └─ 代理转发到 OpenHands Agent Server                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              OpenHands Agent Server (每客户独立容器)               │
│  ├─ 沙箱环境：客户代码仓库已挂载                                   │
│  ├─ Agent：读取代码、分析问题、生成回复                            │
│  ├─ 会话管理：维护客户对话上下文                                   │
│  └─ 事件流：实时推送 Agent 状态                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ 文件系统
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  客户代码仓库 (本地挂载)                           │
│  /projects/{customer_id}/                                       │
│  ├─ src/                                                        │
│  ├─ tests/                                                      │
│  └─ docs/                                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 核心组件

| 组件 | 职责 | 部署方式 |
|------|------|----------|
| **OpenHands Agent Server** | 代码理解 + 对话 + 生成回复 | Docker 容器，每客户独立 |
| **workshop-api retrieve handler** | 鉴权 + 路由 + 代理转发 | 现有服务扩展 |
| **客户代码仓库挂载** | 提供代码上下文 | 本地目录挂载到容器 |
| **会话存储** | 维护客户对话历史 | 复用 workshop-api DB |

---

## 三、详细设计

### 3.1 客户代码仓库管理

**现状**：arcorbit 已有项目工作空间绑定机制（`workspace 绑客户代码目录`）

**扩展**：每个客户项目绑定一个本地代码仓库目录

```typescript
// 扩展 KnowledgeSource 模型
interface CustomerCodeRepo {
  id: number;
  project_id: number;           // 关联的 workshop 项目
  customer_id: string;          // 客户标识
  repo_path: string;            // 本地代码仓库路径
  branch: string;               // 默认分支
  last_synced_at: number;       // 最后同步时间
  status: 'ready' | 'syncing' | 'error';
}
```

**同步机制**：
- 客户提交反馈时，确保代码仓库是最新的（git pull）
- 定期同步（每小时或每天，视客户需求）
- 支持手动触发同步

### 3.2 OpenHands Agent Server 配置

**每客户独立容器**：

```yaml
# docker-compose.customer.yml
version: '3.8'
services:
  openhands-agent:
    image: ghcr.io/openhands/agent-server:latest
    ports:
      - "8000"
    volumes:
      - /projects/${CUSTOMER_ID}:/projects/code:ro  # 只读挂载
      - /home/openhands/.openhands:/home/openhands/.openhands
    environment:
      - LLM_API_KEY=${LLM_API_KEY}
      - LLM_MODEL=${LLM_MODEL:-gpt-4}
      - OH_SESSION_API_KEYS_0=${SESSION_API_KEY}
      - OH_SECRET_KEY=${SECRET_KEY}
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2'
```

**Agent 配置**：

```python
# customer_agent_config.py
AGENT_CONFIG = {
    "system_prompt": """你是一个专业的技术支持工程师。
    
    你的知识来源是客户提供的代码仓库（位于 /projects/code/ 目录）。
    
    工作原则：
    1. 首先阅读代码仓库中的相关文件，理解问题背景
    2. 基于代码实际实现回答问题，不要猜测
    3. 如果代码中没有相关信息，诚实告知
    4. 提供具体的代码引用（文件路径:行号）
    5. 如果问题涉及修改代码，提供具体的修改建议
    
    可用工具：
    - read_file: 读取代码文件
    - search_code: 搜索代码内容
    - list_directory: 列出目录结构
    """,
    "tools": ["read_file", "search_code", "list_directory"],
    "max_iterations": 10,  # 限制单次对话的 Agent 循环次数
    "sandbox": {
        "type": "docker",
        "image": "python:3.12-slim",
        "network": "none",  # 禁用网络，提高安全性
    }
}
```

### 3.3 workshop-api 集成

**新增 retrieve handler**：

```go
// handler/retrieve.go
func RetrieveHandler(c *gin.Context) {
    projectId := c.Param("projectId")
    
    // 1. 鉴权 + 项目隔离
    user := getCurrentUser(c)
    if !hasProjectAccess(user, projectId) {
        c.JSON(403, gin.H{"error": "无权限"})
        return
    }
    
    // 2. 查询该项目的 OpenHands Agent Server 地址
    agentServer := getAgentServerByProject(projectId)
    if agentServer == nil {
        // 项目未启用智能客服
        c.JSON(200, gin.H{
            "need_collect": true,
            "message": "该项目未启用智能客服",
        })
        return
    }
    
    // 3. 转发到 OpenHands Agent Server
    var req struct {
        Query          string `json:"query"`
        ConversationID string `json:"conversation_id,omitempty"`
    }
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": "请求格式错误"})
        return
    }
    
    // 4. 调用 OpenHands API
    response, err := callOpenHandsAgent(
        agentServer.URL,
        agentServer.APIKey,
        req.Query,
        req.ConversationID,
    )
    if err != nil {
        // 降级：转追问收集
        c.JSON(200, gin.H{
            "need_collect": true,
            "message": "我先帮你记录下来转团队跟进",
        })
        return
    }
    
    // 5. 返回结果
    c.JSON(200, gin.H{
        "code": 0,
        "data": response,
    })
}

// 调用 OpenHands Agent Server
func callOpenHandsAgent(serverURL, apiKey, query, conversationID string) (*AgentResponse, error) {
    // 构造请求
    payload := map[string]interface{}{
        "content": query,
    }
    if conversationID != "" {
        payload["conversation_id"] = conversationID
    }
    
    // 发送请求到 OpenHands Agent Server
    // POST /api/conversations/{id}/messages 或创建新会话
    // ...
    
    return &AgentResponse{
        Content:         "基于代码分析的结果...",
        ConversationID:  "conv_xxx",
        SourceFiles:     []string{"src/main.go:42"},
    }, nil
}
```

### 3.4 会话管理

**复用 workshop-api 的 FeedbackMessage 模型**：

```sql
-- 扩展 FeedbackMessage 表
ALTER TABLE feedback_messages ADD COLUMN IF NOT EXISTS
  conversation_id VARCHAR(255),           -- OpenHands 会话 ID
  agent_type VARCHAR(50) DEFAULT 'human', -- 'human' | 'openhands'
  source_files JSONB;                     -- 引用的代码文件列表
```

**会话流程**：

```
客户提问 → workshop-api 创建/获取会话 → 调用 OpenHands Agent
                                         ↓
                              Agent 读取代码仓库
                                         ↓
                              Agent 生成回复（含代码引用）
                                         ↓
                              workshop-api 存储消息
                                         ↓
                              返回给客户（草稿确认后）
```

### 3.5 安全设计

| 安全措施 | 实现方式 |
|----------|----------|
| **代码仓库只读** | Docker 挂载使用 `:ro` 标志 |
| **网络隔离** | 容器禁用外部网络（`network: none`） |
| **资源限制** | 限制 CPU/内存使用 |
| **会话隔离** | 每客户独立 Agent Server 容器 |
| **API 认证** | OpenHands Session API Key |
| **敏感信息** | LLM API Key 加密存储 |

---

## 四、工作量评估

### 4.1 模块拆解

| 模块 | 工作内容 | 工作量 | 负责人 |
|------|----------|--------|--------|
| **OpenHands 部署** | Docker 镜像构建 + 容器编排 | 3人日 | 运维 |
| **客户代码仓库管理** | 同步机制 + 状态追踪 | 5人日 | 后端 |
| **workshop-api retrieve** | 鉴权 + 路由 + 代理转发 | 5人日 | 后端 |
| **会话管理** | FeedbackMessage 扩展 + 会话状态 | 3人日 | 后端 |
| **Agent 配置** | System prompt + 工具配置 | 2人日 | 后端 |
| **客户端 IPC 扩展** | preload.cjs 新增检索 API | 2人日 | 客户端 |
| **草稿确认流程** | 处理人确认/驳回 UI | 5人日 | 客户端 |
| **测试** | 单元测试 + 集成测试 + 端到端测试 | 5人日 | 测试 |
| **文档** | 部署文档 + API 文档 | 2人日 | 后端 |

**小计**：32 人日（约 6 周）

### 4.2 与原方案对比

| 维度 | 原方案（知识库） | 新方案（OpenHands） |
|------|------------------|---------------------|
| **工作量** | 45 人日（知识库部分） | 32 人日 |
| **周期** | 3-4 周 | 6 周 |
| **复杂度** | 高（WeKnora + 代码 RAG + 置信度） | 中（OpenHands 部署 + 集成） |
| **维护成本** | 高（知识库更新、索引维护） | 低（代码仓库 Git 同步） |
| **扩展性** | 中（需为每个客户建索引） | 高（Docker 容器天然隔离） |

---

## 五、推进计划

### 阶段一：基础设施（第 1-2 周）

```
Week 1:
  ├─ [运维] OpenHands Docker 镜像构建 + 测试（2天）
  └─ [后端] 客户代码仓库管理模块（3天）

Week 2:
  ├─ [运维] 容器编排 + 监控（2天）
  └─ [后端] workshop-api retrieve handler（3天）
```

**里程碑**：OpenHands Agent Server 可独立运行，代码仓库可挂载

### 阶段二：集成开发（第 3-4 周）

```
Week 3:
  ├─ [后端] 会话管理 + FeedbackMessage 扩展（3天）
  └─ [后端] Agent 配置 + System prompt（2天）

Week 4:
  ├─ [客户端] preload.cjs 检索 API 扩展（2天）
  └─ [客户端] 草稿确认流程 UI（3天）
```

**里程碑**：SDK 客户端可调用检索接口，Agent 可生成回复

### 阶段三：测试上线（第 5-6 周）

```
Week 5:
  ├─ [测试] 单元测试 + 集成测试（3天）
  └─ [测试] 端到端测试 + 性能测试（2天）

Week 6:
  ├─ [运维] 生产环境部署（2天）
  ├─ [文档] 部署文档 + API 文档（2天）
  └─ [全员] 灰度发布 + 监控（1天）
```

**里程碑**：系统上线，单客户试点

---

## 六、技术选型决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| **Agent 框架** | OpenHands Agent Server | 开源、代码理解能力强、Docker 沙箱隔离 |
| **LLM 模型** | GPT-4 / Claude 3.5 | 代码理解能力强，成本可控 |
| **容器运行时** | Docker | OpenHands 原生支持，部署简单 |
| **会话存储** | 复用 workshop-api DB | 避免新增组件，统一管理 |
| **代码同步** | Git + Webhook | 标准方案，可靠 |

---

## 七、风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| **OpenHands 容器资源消耗** | 每客户需 2GB 内存 | 试点期限制客户数量，监控资源使用 |
| **LLM API 成本** | 每次对话消耗 token | 设置 max_iterations 限制，缓存常见问题 |
| **代码仓库大小** | 大仓库加载慢 | 使用 shallow clone，只同步必要分支 |
| **Agent 回复质量** | 可能产生错误回复 | 草稿确认机制，人工审核后发送 |
| **容器安全** | 潜在逃逸风险 | 只读挂载 + 网络隔离 + 资源限制 |

---

## 八、验收标准

| 场景 | 验收条件 | 优先级 |
|------|----------|--------|
| **代码问答** | 客户提问 → Agent 读取代码 → 生成回复 → 人工确认 → 发送 | P0 |
| **会话连续性** | 同一客户多次提问，Agent 保持上下文 | P0 |
| **代码引用** | 回复中包含具体的文件路径:行号 | P0 |
| **降级处理** | Agent 不可用时，转追问收集 | P0 |
| **草稿确认** | 处理人可编辑/驳回/转人工回复 | P0 |
| **多客户隔离** | 不同客户的代码仓库完全隔离 | P0 |

---

## 附录：OpenHands API 参考

### 创建会话

```bash
POST /api/conversations
Content-Type: application/json
X-Session-API-Key: {api_key}

{
  "title": "Customer FB-830141",
  "agent": {
    "llm": {
      "model": "gpt-4",
      "api_key": "sk-xxx"
    }
  }
}
```

### 发送消息

```bash
POST /api/conversations/{conversation_id}/messages
Content-Type: application/json
X-Session-API-Key: {api_key}

{
  "content": "这个函数是做什么的？",
  "auto_run": true
}
```

### 获取事件流

```bash
GET /api/conversations/{conversation_id}/events
Accept: text/event-stream
X-Session-API-Key: {api_key}
```
