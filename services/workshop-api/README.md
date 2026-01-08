# Todo Service

一个基于 Go 和 Gin 框架的微服务项目，提供团队协作的任务管理功能，支持项目管理和任务管理。采用网关统一认证架构，支持多级别路由权限控制。

## 📋 项目简介

Todo Service 是一个团队共享任务管理系统，提供以下核心功能：

- **用户管理**：基于网关 UUID 的用户创建、查询、更新
- **项目管理**：创建、更新、删除项目，支持 Git 地址关联
- **成员管理**：支持三种角色（owner/admin/member），邀请码机制
- **任务管理**：创建、更新、查询、批量删除任务，支持任务层级和状态管理

## 🏗️ 架构特点

### 1. **网关统一认证架构**
- 网关负责所有认证逻辑（JWT、API Key 等）
- 网关验证通过后，将用户信息通过请求头转发给业务服务
- 业务服务无需处理认证，只需从请求头提取用户信息

### 2. **多级别路由权限**
服务支持三种认证级别的路由：
- **public**: 无需认证，公开访问（健康检查）
- **user**: 需要 JWT 认证（业务接口）
- **apikey**: 需要 API 密钥认证（系统接口）

### 3. **统一路由格式**
```
/{service}/{version}/{auth_level}/{path}
```
示例：
- `GET /todo/v1/public/health` - 健康检查
- `POST /todo/v1/user/projects` - 创建项目
- `GET /todo/v1/user/tasks?project_id=1` - 查询任务

### 4. **数据库模型**
- **User**: 用户表，使用网关提供的 UUID 作为唯一标识
- **Project**: 项目表，关联 Git 地址
- **ProjectMember**: 项目成员表，支持 owner/admin/member 三种角色
- **ProjectInvitation**: 项目邀请表，支持邀请码机制
- **Task**: 任务表，支持任务层级和多种状态

### 5. **权限控制**
- **项目权限**：
  - `owner`: 拥有所有权限，可以删除项目、设置成员角色
  - `admin`: 可以管理成员和任务
  - `member`: 可以创建任务，只能修改/删除自己创建或分配给自己执行的任务
- **任务权限**：
  - owner/admin 可以操作任意任务
  - member 只能操作自己创建或分配给自己执行的任务

## 📁 项目结构

```
todo/
├── main.go                    # 应用入口
├── router/
│   └── router.go              # 路由配置
├── handler/                   # 业务处理器
│   ├── health.go              # 健康检查处理器
│   ├── header_info.go         # Header 信息处理器
│   ├── user.go                # 用户处理器
│   ├── project.go             # 项目处理器
│   └── task.go                # 任务处理器
├── middleware/                # 中间件
│   ├── extract_header_info.go # Header 提取中间件
│   ├── user_id.go             # 用户ID提取中间件
│   └── database.go            # 数据库连接中间件
├── models/                    # 数据模型
│   ├── user.go                # 用户模型
│   ├── project.go             # 项目模型
│   └── task.go                # 任务模型
├── database/                  # 数据库配置
│   └── db.go                  # 数据库初始化
├── api/                       # API 文档
│   ├── README.md              # API 文档索引
│   ├── common_api.md          # 公共接口文档
│   ├── user_api.md            # 用户接口文档
│   ├── project_api.md         # 项目接口文档
│   └── task_api.md            # 任务接口文档
├── docker-compose.yml         # Docker Compose 配置
├── Dockerfile                 # Docker 镜像构建文件
├── deploy.sh                  # 部署脚本
├── go.mod                     # Go 模块依赖
└── README.md                  # 项目文档
```

## 🔧 环境要求

- Go 1.24+
- PostgreSQL 12+（或其他 GORM 支持的数据库）
- Docker & Docker Compose（可选，用于容器化部署）

## ⚙️ 配置说明

创建 `.env` 文件，配置以下环境变量：

```env
# 服务配置
PORT=8081                    # 服务端口
HOST=0.0.0.0                 # 服务监听地址
SERVICE_NAME=todo            # 服务名称（用于路由前缀）

# 数据库配置
DB_HOST=localhost            # 数据库主机
DB_PORT=5432                 # 数据库端口
DB_USER=postgres             # 数据库用户
DB_PASSWORD=postgres         # 数据库密码
DB_NAME=todo                 # 数据库名称
DB_SSLMODE=disable           # SSL 模式

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

### 方式三：本地运行

```bash
# 1. 确保 PostgreSQL 已启动
# 2. 设置环境变量（或使用 .env 文件）
export PORT=8081
export HOST=0.0.0.0
export SERVICE_NAME=todo
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=todo

# 3. 运行服务
go run main.go
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

### 2. 创建用户

```bash
curl -X POST "http://localhost:8081/todo/v1/user/users" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "avatar": "https://example.com/avatar.png"
  }'
```

### 3. 创建项目

```bash
curl -X POST "http://localhost:8081/todo/v1/user/projects" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "电商平台开发",
    "git_url": "https://github.com/team/ecommerce.git"
  }'
```

### 4. 创建任务

```bash
curl -X POST "http://localhost:8081/todo/v1/user/tasks" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "content": "完成任务设计",
    "state": "pending"
  }'
```

### 5. 查询任务列表

```bash
curl -X GET "http://localhost:8081/todo/v1/user/tasks?project_id=1" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

## 📡 API 接口说明

详细的 API 文档请参考 `api/` 目录下的文档：

- **[API 文档索引](./api/README.md)** - API 文档概览
- **[公共接口](./api/common_api.md)** - 健康检查、Header 信息
- **[用户接口](./api/user_api.md)** - 用户创建、查询、更新
- **[项目接口](./api/project_api.md)** - 项目管理和成员管理
- **[任务接口](./api/task_api.md)** - 任务管理

### 请求头说明

网关会转发以下请求头到业务服务：
- `X-User-ID`: 用户 UUID（必需）
- `X-User-Username`: 用户名
- `X-User-AppID`: 应用 ID
- `X-User-SessionID`: 会话 ID

### 主要接口列表

| 功能模块 | 方法 | 路径 | 认证级别 | 说明 |
|---------|------|------|----------|------|
| 健康检查 | GET | `/{service}/v1/public/health` | public | 健康检查 |
| 用户管理 | POST | `/{service}/v1/user/users` | user | 创建用户 |
| 用户管理 | GET | `/{service}/v1/user/users/:uuid` | user | 查询用户 |
| 用户管理 | PUT | `/{service}/v1/user/users/:uuid` | user | 更新用户 |
| 项目管理 | POST | `/{service}/v1/user/projects` | user | 创建项目 |
| 项目管理 | GET | `/{service}/v1/user/projects` | user | 查询用户参与的项目 |
| 项目管理 | PUT | `/{service}/v1/user/projects/:id` | user | 更新项目 |
| 项目管理 | DELETE | `/{service}/v1/user/projects/:id` | user | 删除项目 |
| 成员管理 | POST | `/{service}/v1/user/projects/:id/invitations` | user | 邀请项目成员 |
| 成员管理 | POST | `/{service}/v1/user/projects/join` | user | 加入项目 |
| 成员管理 | DELETE | `/{service}/v1/user/projects/:id/members` | user | 删除项目成员 |
| 成员管理 | PUT | `/{service}/v1/user/projects/:id/members/role` | user | 设置成员角色 |
| 任务管理 | POST | `/{service}/v1/user/tasks` | user | 创建任务 |
| 任务管理 | PUT | `/{service}/v1/user/tasks/:id` | user | 更新任务 |
| 任务管理 | GET | `/{service}/v1/user/tasks?project_id=1` | user | 查询任务列表 |
| 任务管理 | DELETE | `/{service}/v1/user/tasks` | user | 批量删除任务 |

### 数据模型

#### 任务状态
- `pending` - 待处理（默认）
- `in_progress` - 进行中
- `completed` - 已完成
- `cancelled` - 已取消
- `blocked` - 已阻塞

#### 项目成员角色
- `owner` - 所有者（项目创建者），拥有所有权限
- `admin` - 管理员，可以管理项目成员和任务
- `member` - 成员，可以创建任务，只能修改/删除自己创建或分配给自己执行的任务

## 🔍 开发指南

### 添加新的 Handler

1. 在 `handler/` 目录创建新的 handler 文件
2. 实现处理函数，使用 `middleware.GetDB(c)` 获取数据库连接
3. 使用 `middleware.RequireUserID(c)` 获取用户 ID
4. 在 `router/router.go` 中添加路由

示例：
```go
// handler/example.go
func ExampleHandler(c *gin.Context) {
    db := middleware.GetDB(c)
    userID, ok := middleware.RequireUserID(c)
    if !ok {
        return
    }
    // 处理逻辑
    c.JSON(http.StatusOK, gin.H{"data": "example"})
}

// router/router.go
userGroup.GET("/example", handler.ExampleHandler)
```

### 使用中间件

```go
import "todo/middleware"

func MyHandler(c *gin.Context) {
    // 获取数据库连接
    db := middleware.GetDB(c)
    
    // 获取用户ID（自动从Header UUID查询用户表）
    userID, ok := middleware.RequireUserID(c)
    if !ok {
        // 用户ID获取失败（已返回错误响应）
        return
    }
    
    // 获取Header信息
    headerInfo := middleware.GetHeaderInfo(c)
    if headerInfo != nil {
        uuid := headerInfo.UserID
        username := headerInfo.Username
        // 使用用户信息
    }
}
```

### 数据库模型

所有数据模型定义在 `models/` 目录下：
- `models.User` - 用户模型
- `models.Project` - 项目模型
- `models.ProjectMember` - 项目成员模型
- `models.ProjectInvitation` - 项目邀请模型
- `models.Task` - 任务模型

数据库连接和迁移在 `database/db.go` 中自动处理。

## 📝 注意事项

1. **环境变量必需**：PORT、HOST、SERVICE_NAME 必须设置，否则服务无法启动
2. **数据库连接**：确保 PostgreSQL 已启动并配置正确
3. **网关依赖**：本服务设计为与网关配合使用，网关负责认证和路由转发
4. **Header 提取**：所有请求都会经过 `ExtractHeaderInfo` 中间件，即使没有 header 信息也不会报错
5. **用户ID获取**：中间件 `ExtractUserID` 会自动从 Header UUID 查询用户表获取用户ID，推荐在请求URL中使用 `user_id` 查询参数避免额外查询
6. **权限验证**：所有操作都需要验证用户是否为项目成员，直接查询项目成员表
7. **事务处理**：批量删除任务使用事务处理，保证数据一致性
8. **级联删除**：删除项目会自动级联删除项目成员和任务（通过数据库外键约束）

## 🐳 Docker 说明

- 使用多阶段构建，减小镜像体积
- 基于 Alpine Linux，轻量级
- 支持环境变量配置
- 自动重启策略
- 包含 PostgreSQL 数据库（通过 docker-compose.yml）

## 📄 License

MIT
