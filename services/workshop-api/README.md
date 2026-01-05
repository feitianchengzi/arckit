# Todo Service

一个基于 Go 和 Gin 框架的微服务项目，采用网关统一认证架构，支持多级别路由权限控制。

## 📋 项目简介

Todo Service 是一个标准的微服务应用，设计用于与 API 网关配合工作。网关负责统一认证和路由转发，本服务专注于业务逻辑处理。服务支持三种认证级别：public、user、apikey。

## 💡 项目使用说明

**本项目是一个样板工程（Template Project）**，旨在为微服务开发提供标准化的基础架构和代码模板。

### 二次开发指南

1. **从路由配置开始**：二次开发时，请从 `router/router.go` 文件开始，这是添加新 API 的入口点。

2. **在对应权限级别下编写 API**：
   - 根据业务需求，在 `router/router.go` 中找到对应的权限级别路由组（public/user/apikey）
   - 在相应的路由组下添加你的业务路由
   - 创建对应的 handler 处理函数

3. **示例**：
```go
// 在 router/router.go 的 userGroup 下添加新路由
userGroup := v1.Group("/user")
{
    userGroup.GET("/todos", handler.GetTodos)        // 获取待办列表
    userGroup.POST("/todos", handler.CreateTodo)    // 创建待办
    userGroup.PUT("/todos/:id", handler.UpdateTodo) // 更新待办
}
```

4. **生产部署**：
   - 当前提供的 `deploy.sh` 是开发/测试环境的部署脚本
   - **正式部署时，请根据自己的实际情况编写生产环境的部署脚本**
   - 考虑因素包括：容器编排（K8s/Docker Swarm）、服务发现、配置管理、监控告警、日志收集等

## 🏗️ 架构特点

### 1. **网关统一认证架构**
- 网关负责所有认证逻辑（JWT、API Key 等）
- 网关验证通过后，将用户信息通过请求头转发给业务服务
- 业务服务无需处理认证，只需从请求头提取用户信息

### 2. **多级别路由权限**
服务支持三种认证级别的路由：
- **public**: 无需认证，公开访问
- **user**: 需要 JWT 认证
- **apikey**: 需要 API 密钥认证

### 3. **统一路由格式**
```
/{service}/{version}/{auth_level}/{path}
```
示例：
- `GET /todo/v1/public/health` - 健康检查
- `GET /todo/v1/user/header-info` - 用户信息
- `GET /todo/v1/apikey/header-info` - API Key 信息

### 4. **Header 信息提取中间件**
- 全局中间件自动从请求头提取用户信息
- 提取的信息包括：UserID、Username、AppID、SessionID
- 信息存储在 Gin Context 中，方便 handler 使用

### 5. **环境变量配置**
- 所有配置通过环境变量管理
- 必需的环境变量：PORT、HOST、SERVICE_NAME
- 支持 Docker 容器化部署

## 📁 项目结构

```
todo/
├── main.go                    # 应用入口
├── router/
│   └── router.go              # 路由配置
├── handler/
│   ├── health.go              # 健康检查处理器
│   └── header_info.go         # Header 信息处理器
├── middleware/
│   └── extract_header_info.go # Header 提取中间件
├── docker-compose.yml          # Docker Compose 配置
├── Dockerfile                  # Docker 镜像构建文件
├── deploy.sh                   # 部署脚本
├── go.mod                      # Go 模块依赖
└── README.md                   # 项目文档
```

## 🔧 环境要求

- Go 1.24+
- Docker & Docker Compose
- 环境变量配置文件 `.env`

## ⚙️ 配置说明

创建 `.env` 文件，配置以下环境变量：

```env
# 服务配置
PORT=8081                    # 服务端口
HOST=0.0.0.0                 # 服务监听地址
SERVICE_NAME=todo            # 服务名称（用于路由前缀）

# 服务URL（本地开发）
BASE_URL=http://localhost:8081
```

## 🚀 部署方法

### 方式一：使用部署脚本（推荐）

```bash
# 1. 确保 .env 文件已配置
# 2. 运行部署脚本
chmod +x deploy.sh
./deploy.sh
```

部署脚本会自动：
- 检查环境变量配置
- 停止并清理旧容器
- 构建 Docker 镜像
- 启动服务容器
- 显示服务状态和日志

### 方式二：手动部署

```bash
# 1. 构建镜像
docker-compose build

# 2. 启动服务
docker-compose up -d

# 3. 查看日志
docker logs -f todo-service
```


## 🧪 测试方法

### 1. 健康检查接口（Public）

```bash
curl http://localhost:8081/todo/v1/public/health
```

**响应示例：**
```json
{
  "status": "ok",
  "timestamp": "2026-01-05T10:51:18.156596714Z",
  "service": "todo"
}
```

### 2. User 级别接口

```bash
curl http://localhost:8081/todo/v1/user/header-info \
  -H "X-User-ID: test-user-123" \
  -H "X-User-Username: testuser" \
  -H "X-User-AppID: app-123" \
  -H "X-User-SessionID: session-456"
```

**响应示例：**
```json
{
  "method": "user",
  "userID": "test-user-123",
  "username": "testuser",
  "appID": "app-123",
  "sessionID": "session-456"
}
```

### 3. Apikey 级别接口

```bash
curl http://localhost:8081/todo/v1/apikey/header-info \
  -H "X-User-ID: api-user-789" \
  -H "X-User-Username: apiuser" \
  -H "X-User-AppID: app-456" \
  -H "X-User-SessionID: session-789"
```

**响应示例：**
```json
{
  "method": "apikey",
  "userID": "api-user-789",
  "username": "apiuser",
  "appID": "app-456",
  "sessionID": "session-789"
}
```

### 4. 测试无 Header 情况

```bash
curl http://localhost:8081/todo/v1/user/header-info
```

**响应示例：**
```json
{
  "method": "user",
  "userID": "",
  "username": "",
  "appID": "",
  "sessionID": ""
}
```

## 📡 API 接口说明

### 请求头说明

网关会转发以下请求头到业务服务：
- `X-User-ID`: 用户ID
- `X-User-Username`: 用户名
- `X-User-AppID`: 应用ID
- `X-User-SessionID`: 会话ID

### 接口列表

| 方法 | 路径 | 认证级别 | 说明 |
|------|------|----------|------|
| GET | `/{service}/v1/public/health` | public | 健康检查 |
| GET | `/{service}/v1/user/header-info` | user | 获取用户 Header 信息 |
| GET | `/{service}/v1/apikey/header-info` | apikey | 获取 API Key Header 信息 |

### 响应格式

所有接口返回 JSON 格式数据，`header-info` 接口包含：
- `method`: 请求来源方法（user/apikey）
- `userID`: 用户ID
- `username`: 用户名
- `appID`: 应用ID
- `sessionID`: 会话ID

## 🔍 开发指南

### 添加新的 Handler

1. 在 `handler/` 目录创建新的 handler 文件
2. 实现处理函数，使用 `middleware.GetHeaderInfo(c)` 获取用户信息
3. 在 `router/router.go` 中添加路由

示例：
```go
// handler/example.go
func ExampleHandler(c *gin.Context) {
    headerInfo := middleware.GetHeaderInfo(c)
    // 处理逻辑
    c.JSON(http.StatusOK, gin.H{"data": "example"})
}

// router/router.go
userGroup.GET("/example", handler.ExampleHandler)
```

### 使用 Header 信息

```go
import "todo/middleware"

func MyHandler(c *gin.Context) {
    headerInfo := middleware.GetHeaderInfo(c)
    if headerInfo != nil {
        userID := headerInfo.UserID
        username := headerInfo.Username
        // 使用用户信息
    }
}
```

## 📝 注意事项

1. **环境变量必需**：PORT、HOST、SERVICE_NAME 必须设置，否则服务无法启动
2. **网关依赖**：本服务设计为与网关配合使用，网关负责认证和路由转发
3. **Header 提取**：所有请求都会经过 `ExtractHeaderInfo` 中间件，即使没有 header 信息也不会报错
4. **路由前缀**：路由前缀由 `SERVICE_NAME` 环境变量决定，确保与网关配置一致

## 🐳 Docker 说明

- 使用多阶段构建，减小镜像体积
- 基于 Alpine Linux，轻量级
- 支持环境变量配置
- 自动重启策略

## 📄 License

MIT

