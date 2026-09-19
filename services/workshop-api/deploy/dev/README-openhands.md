# 智能客服功能

基于 OpenHands Agent Server 的智能客服系统，为客户提供基于代码仓库的智能问答能力。

## 功能特性

- **两层知识库检索**：客户私有库（代码仓库+项目文档）+ 共享产品库（arckit facts+FAQ）
- **置信度评分**：基于来源权重计算置信度，高置信生成草稿回复
- **人工确认机制**：所有回复经处理人确认后发送，初期不自动直发
- **降级策略**：检索超时/未命中/异常自动降级为追问收集
- **健康检查**：实时监控 OpenHands Agent Server 状态

## 架构

```
arcorbit 客户端
  → IPC (main.mjs)
    → platform-coordinator
      → workshop-api (handler/retrieve.go)
        → OpenHands Agent Server (Docker)
          → 客户代码仓库 (Docker volume)
```

## 快速开始

### 1. 环境要求

- Docker & Docker Compose
- PostgreSQL 12+
- Go 1.24+ (用于 workshop-api)
- Node.js 18+ (用于 arcorbit)

### 2. 配置

```bash
# 复制配置文件
cp services/workshop-api/deploy/dev/env.development.example services/workshop-api/deploy/dev/.env.development

# 编辑配置
vim services/workshop-api/deploy/dev/.env.development
```

关键配置项：
```bash
# LLM API Key（必填）
LLM_API_KEY=your_llm_api_key_here

# 启用 OpenHands（可选）
OPENHANDS_ENABLED=true

# 客户代码仓库路径（可选）
CUSTOMER_REPOS_PATH=./customer-repos
```

### 3. 启动服务

```bash
# 快速启动（自动检测配置）
cd services/workshop-api/deploy/dev
./start.sh

# 或手动启动
docker compose -f docker-compose.dev.yml -f docker-compose.openhands.yml up -d
```

### 4. 执行迁移

```bash
# 自动迁移
./verify.sh migration

# 或手动迁移
psql -h localhost -p 5433 -U postgres -d todo -f ../../database/migrations/20260917_openhands_config_up.sql
```

### 5. 验证

```bash
# 全链路验证
./verify.sh all

# 生成验证报告
./verify.sh report
```

## API 端点

### OpenHands 配置管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/user/projects/:id/openhands-config` | 查询 OpenHands 配置 |
| PUT | `/user/projects/:id/openhands-config` | 更新 OpenHands 配置 |
| GET | `/user/projects/:id/openhands-health` | 检查 OpenHands 健康状态 |

### 智能客服检索

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/user/feedbacks/retrieve` | 智能客服检索 |

### 客户代码仓库管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/user/projects/:id/code-repos` | 查询代码仓库列表 |
| POST | `/user/projects/:id/code-repos` | 创建代码仓库 |
| POST | `/user/projects/:id/code-repos/:repoId/sync` | 同步代码仓库 |
| DELETE | `/user/projects/:id/code-repos/:repoId` | 删除代码仓库 |

### 草稿管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/user/feedbacks/:id/drafts` | 创建草稿 |
| POST | `/user/feedbacks/:id/messages/:messageId/confirm` | 确认草稿 |
| POST | `/user/feedbacks/:id/messages/:messageId/reject` | 驳回草稿 |

## 配置说明

### OpenHands 配置字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| url | string | - | OpenHands Agent Server URL |
| api_key | string | - | API Key |
| llm_model | string | anthropic/claude-sonnet-4-5-20250929 | LLM 模型 |
| llm_temperature | float | 0.0 | 温度参数 |
| max_iterations | int | 50 | 最大迭代次数 |
| confidence_threshold | float | 0.75 | 置信度阈值 |
| timeout_ms | int | 10000 | 超时时间 |
| persona_file | string | - | 人设文件路径 |
| sandbox_runtime | string | docker | 沙箱运行时 |
| sandbox_base_image | string | ghcr.io/openhands/agent-server:latest-python | 沙箱基础镜像 |

### 降级策略

| 场景 | 行为 |
|------|------|
| 检索超时 (>10s) | 转追问收集 |
| 两库都未命中 | 转追问收集 |
| 服务异常 | 降级为人工流程 |
| Agent 容器不可用 | 标记项目客服为 degraded |

## 开发指南

### 添加新字段

1. 修改 `handler/retrieve.go` 中的 `OpenHandsAgent` 结构体
2. 添加数据库迁移文件
3. 更新配置读取逻辑

### 测试

```bash
# 运行单元测试
go test ./handler/... -v

# 运行集成测试
go test ./... -v -tags=integration
```

## 故障排查

### OpenHands Agent Server 无法启动

```bash
# 检查日志
docker compose -f docker-compose.dev.yml -f docker-compose.openhands.yml logs openhands-agent

# 检查健康状态
curl http://localhost:8000/health
```

### 数据库迁移失败

```bash
# 检查数据库连接
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d todo -c "SELECT 1"

# 手动执行迁移
psql -h localhost -p 5433 -U postgres -d todo -f database/migrations/20260917_openhands_config_up.sql
```

### Workshop API 无法连接 OpenHands

```bash
# 检查网络
docker compose -f docker-compose.dev.yml -f docker-compose.openhands.yml exec todo-service curl http://openhands-agent:8000/health

# 检查配置
curl http://localhost:8081/workshop/v1/user/projects/1/openhands-config
```

## 相关文档

- [PRD 文档](../../docs/product-space/迭代版本/【1】20260904/customer-support-prd.md)
- [时序图](../../docs/product-space/迭代版本/【1】20260904/customer-support-sequence-diagrams.md)
- [缺口分析](../../docs/product-space/迭代版本/【1】20260904/scenario-gap-analysis.md)
