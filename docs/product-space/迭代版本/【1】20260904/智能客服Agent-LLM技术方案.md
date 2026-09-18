# 智能客服 Agent + LLM 技术方案

> 文档日期：2026-09-18
>
> 明确智能客服采用真实 Agent + LLM 架构，而非硬编码模板回复。

---

## 一、架构设计

### 1.1 核心原则

- **Agent 驱动**：智能客服由 Agent + LLM 驱动，不是规则引擎
- **工具调用**：Agent 可调用检索工具获取知识
- **上下文感知**：Agent 维护对话历史，支持多轮对话
- **自然语言回复**：LLM 生成自然语言回复，不是模板填充

### 1.2 架构图

```
┌─────────────────────────────────────────────────────────────┐
│  客户 SDK                                                    │
│  FeedbackConversationPanel                                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ POST /feedbacks/:id/messages
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  workshop-api                                                │
│  MessageHandler                                               │
│    ├─ 存储客户消息                                             │
│    └─ 触发 Agent 处理                                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ 调用 Agent
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent Service (OpenHands / 自建)                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Agent Loop                                          │    │
│  │    1. 接收问题 + 对话历史                              │    │
│  │    2. LLM 决策：调用工具 or 直接回复                    │    │
│  │    3. 执行工具调用                                     │    │
│  │    4. 将工具结果 → LLM 生成回复                        │    │
│  │    5. 返回最终回复                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│  工具层：                                                      │
│    ├─ search_customer_code(query) → 本地代码检索               │
│    ├─ search_customer_docs(query) → 项目文档检索               │
│    └─ search_product_knowledge(query) → 产品FAQ/spec检索      │
└──────────────────────────┬──────────────────────────────────┘
                           │ 返回 Agent 回复
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  workshop-api                                                │
│  CreateAgentReplyHandler                                      │
│    ├─ 存储 Agent 回复（sender_type=agent）                     │
│    └─ 推送给客户 SDK                                          │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Agent 工具定义

```json
{
  "tools": [
    {
      "name": "search_customer_code",
      "description": "搜索客户代码仓库，查找相关函数、类、模块的实现",
      "parameters": {
        "query": "搜索关键词或问题描述",
        "limit": "返回结果数量，默认5"
      }
    },
    {
      "name": "search_customer_docs",
      "description": "搜索项目文档，包括spec、设计文档、变更记录",
      "parameters": {
        "query": "搜索关键词或问题描述",
        "limit": "返回结果数量，默认5"
      }
    },
    {
      "name": "search_product_knowledge",
      "description": "搜索产品知识库，包括arckit facts、FAQ",
      "parameters": {
        "query": "搜索关键词或问题描述",
        "limit": "返回结果数量，默认5"
      }
    }
  ]
}
```

### 1.4 Agent System Prompt

```
你是一个专业的技术支持助手，负责回答客户关于产品的问题。

## 能力
- 搜索客户代码仓库，查找相关实现
- 搜索项目文档，了解需求和设计
- 搜索产品知识库，获取FAQ和最佳实践

## 规则
1. 基于检索结果回答问题，不要编造信息
2. 引用具体的文件路径和代码片段
3. 如果信息不足，主动询问更多细节
4. 保持友好、专业的语气
5. 使用中文回复

## 回复格式
- 先直接回答问题
- 再提供相关来源（文件路径、文档链接）
- 如有代码示例，用代码块展示
```

---

## 二、API 设计

### 2.1 Agent 消息处理接口

**请求**：`POST /api/v1/projects/{projectId}/feedbacks/{feedbackId}/agent-message`

**请求体**：
```json
{
  "content": "如何登录系统？",
  "conversation_id": "conv_abc123"  // 可选，用于多轮对话
}
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "message_id": 12345,
    "content": "根据代码实现，登录功能在 src/auth/login.ts 中...",
    "sender_type": "agent",
    "tool_calls": [
      {
        "tool": "search_customer_code",
        "query": "登录 login",
        "results_count": 3
      }
    ],
    "conversation_id": "conv_abc123",
    "confidence": 0.92
  }
}
```

### 2.2 对话历史接口

**请求**：`GET /api/v1/projects/{projectId}/feedbacks/{feedbackId}/agent-conversations/{conversationId}`

**响应**：
```json
{
  "code": 0,
  "data": {
    "conversation_id": "conv_abc123",
    "messages": [
      {
        "role": "user",
        "content": "如何登录系统？",
        "timestamp": "2026-09-18T10:00:00Z"
      },
      {
        "role": "assistant",
        "content": "根据代码实现，登录功能在...",
        "tool_calls": [...],
        "timestamp": "2026-09-18T10:00:05Z"
      }
    ]
  }
}
```

---

## 三、实现细节

### 3.1 消息处理流程

```go
// AgentMessageHandler 处理客户消息，触发 Agent 响应
func AgentMessageHandler(c *gin.Context) {
    // 1. 解析参数
    projectID := parseProjectID(c)
    feedbackID := parseFeedbackID(c)
    
    // 2. 存储客户消息
    customerMessage := createFeedbackMessage(feedbackID, req.Content, "customer")
    
    // 3. 获取对话历史
    conversationID := req.ConversationID
    if conversationID == "" {
        conversationID = createNewConversation(feedbackID)
    }
    history := getConversationHistory(conversationID)
    
    // 4. 调用 Agent
    agentResponse := callAgent(projectID, req.Content, history)
    
    // 5. 存储 Agent 回复
    agentMessage := createFeedbackMessage(feedbackID, agentResponse.Content, "agent")
    agentMessage.Metadata = {
        "tool_calls": agentResponse.ToolCalls,
        "confidence": agentResponse.Confidence,
        "conversation_id": conversationID
    }
    
    // 6. 推送给客户
    broadcastToCustomer(feedbackID, agentMessage)
    
    // 7. 返回响应
    respond(c, agentMessage)
}
```

### 3.2 Agent 调用逻辑

```go
func callAgent(projectID uint, query string, history []Message) *AgentResponse {
    // 1. 获取 Agent 配置
    agentConfig := getAgentConfig(projectID)
    
    // 2. 构建工具列表
    tools := buildTools(projectID)
    
    // 3. 构建 prompt
    systemPrompt := getSystemPrompt(projectID)
    messages := buildMessages(systemPrompt, history, query)
    
    // 4. 调用 LLM（带工具定义）
    llmResponse := callLLM(agentConfig, messages, tools)
    
    // 5. 执行工具调用（如果有）
    for llmResponse.ToolCalls != nil {
        toolResults := executeToolCalls(llmResponse.ToolCalls)
        messages = append(messages, llmResponse)
        messages = append(messages, ToolResultMessage(toolResults))
        llmResponse = callLLM(agentConfig, messages, tools)
    }
    
    // 6. 返回最终回复
    return &AgentResponse{
        Content:    llmResponse.Content,
        ToolCalls:  llmResponse.ToolCalls,
        Confidence: calculateConfidence(llmResponse),
    }
}
```

### 3.3 工具执行

```go
func executeToolCalls(toolCalls []ToolCall) []ToolResult {
    var results []ToolResult
    for _, tc := range toolCalls {
        switch tc.Tool {
        case "search_customer_code":
            results = append(results, searchCustomerCode(tc.Params))
        case "search_customer_docs":
            results = append(results, searchCustomerDocs(tc.Params))
        case "search_product_knowledge":
            results = append(results, searchProductKnowledge(tc.Params))
        }
    }
    return results
}

func searchCustomerCode(params ToolParams) ToolResult {
    // 调用已有的 searchCodeChunksBySQL
    chunks := searchCodeChunksBySQL(db, projectID, params.Query, params.Limit)
    return ToolResult{
        Tool:    "search_customer_code",
        Content: formatCodeChunks(chunks),
    }
}
```

---

## 四、数据模型

### 4.1 AgentMessage 扩展

```typescript
interface AgentMessage {
  id: number;
  feedback_id: number;
  project_id: number;
  conversation_id: string;
  sender_type: 'customer' | 'agent' | 'system';
  content: string;
  tool_calls?: ToolCall[];
  confidence?: number;
  metadata?: Record<string, any>;
  created_at: Date;
}

interface ToolCall {
  tool: string;
  params: Record<string, any>;
  results_count: number;
}

interface Conversation {
  id: string;
  feedback_id: number;
  project_id: number;
  messages: AgentMessage[];
  created_at: Date;
  updated_at: Date;
}
```

### 4.2 数据库表

```sql
-- Agent 对话表
CREATE TABLE agent_conversations (
  id VARCHAR(128) PRIMARY KEY,
  feedback_id INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Agent 消息表（扩展现有 feedback_messages）
ALTER TABLE feedback_messages
  ADD COLUMN conversation_id VARCHAR(128),
  ADD COLUMN tool_calls JSONB,
  ADD COLUMN confidence DECIMAL(3,2);
```

---

## 五、部署架构

### 5.1 组件依赖

| 组件 | 用途 | 部署方式 |
|------|------|----------|
| OpenHands Agent Server | Agent 运行时 | Docker 容器 |
| LLM API (Claude/GPT) | 语言生成 | 外部 API |
| Embedding 服务 | 代码/文档向量化 | 本地或云端 |
| PostgreSQL | 数据存储 | 已有 |

### 5.2 配置示例

```json
{
  "agent": {
    "enabled": true,
    "server_url": "http://localhost:8000",
    "llm": {
      "provider": "anthropic",
      "model": "claude-sonnet-4-5-20250929",
      "api_key_env": "LLM_API_KEY"
    },
    "tools": {
      "customer_code": {
        "enabled": true,
        "search_limit": 5
      },
      "customer_docs": {
        "enabled": true,
        "search_limit": 5
      },
      "product_knowledge": {
        "enabled": true,
        "search_limit": 5
      }
    }
  }
}
```

---

## 六、与现有代码的集成

### 6.1 现有代码复用

| 现有代码 | 复用方式 |
|----------|----------|
| `searchCodeChunksBySQL` | 作为 `search_customer_code` 工具的实现 |
| `callOpenHandsAgent` | 改造为真正的 Agent 调用 |
| `FeedbackConversationPanel` | 添加 Agent 回复渲染逻辑 |
| `feedback_messages` 表 | 扩展 conversation_id、tool_calls 字段 |

### 6.2 需要新增的代码

| 文件 | 说明 |
|------|------|
| `handler/agent_message.go` | Agent 消息处理 |
| `handler/agent_tools.go` | 工具定义和执行 |
| `handler/agent_conversation.go` | 对话管理 |
| `migrations/20260918_agent_conversation_up.sql` | 数据库迁移 |

---

## 七、降级策略

| 场景 | 降级方案 |
|------|----------|
| Agent Server 不可用 | 返回"转人工处理"，创建 Feedback |
| LLM API 超时 | 重试一次，失败则转人工 |
| 工具调用失败 | Agent 基于已有知识回复，标注信息可能不完整 |
| 无相关知识 | Agent 主动询问更多细节 |

---

## 八、验证方式

```bash
# 1. 启动 Agent Server
docker compose up -d openhands-agent

# 2. 测试 Agent 消息接口
curl -X POST http://localhost:8081/workshop/v1/user/feedbacks/1/agent-message \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -d '{"content": "如何登录系统？"}'

# 3. 验证响应包含 Agent 回复和工具调用记录
```
