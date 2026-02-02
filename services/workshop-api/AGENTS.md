# Todo Service - AI Agent Guide

## 项目概述

Todo Service 是一个基于 Go 语言和 Gin 框架开发的团队协作任务管理微服务。该服务采用**网关统一认证架构**，支持多级别路由权限控制，提供完整的项目管理、任务管理和成员管理功能。

### 核心功能

- **用户管理**：基于网关 UUID 的用户创建、查询、更新
- **组织管理**：支持创建组织、成员管理、邀请码机制
- **项目管理**：创建、更新、删除项目，支持 Git 地址关联
- **成员管理**：支持三种角色（owner/admin/member），邀请码机制
- **任务管理**：创建、更新、查询、删除任务，支持任务层级和状态管理
- **标签管理**：项目级别的标签管理
- **任务附件**：支持文本、文件、URL 三种附件类型
- **OSS 集成**：提供阿里云 OSS 临时访问凭证

### 技术栈

| 组件 | 技术 |
|------|------|
| 编程语言 | Go 1.24+ |
| Web 框架 | Gin v1.10.1 |
| ORM | GORM v1.31.1 |
| 数据库 | PostgreSQL 12+ |
| 部署 | Docker + Docker Compose |
| 云服务 | 阿里云 OSS/STS |

## 项目结构

```
todo/
├── main.go                    # 应用入口点
├── go.mod                     # Go 模块依赖定义
├── go.sum                     # Go 模块依赖校验
├── deploy.sh                  # 主部署脚本（开发/生产环境选择）
├── deploy/
│   ├── Dockerfile             # Docker 镜像构建文件
│   ├── dev/                   # 开发环境部署配置
│   │   ├── deploy.sh          # 开发环境部署脚本
│   │   ├── docker-compose.dev.yml
│   │   ├── .env.development   # 开发环境变量（实际配置）
│   │   └── env.development.example
│   └── prod/                  # 生产环境部署配置
│       ├── deploy.sh          # 生产环境部署脚本
│       ├── docker-compose.prod.yml
│       └── ...
├── router/
│   └── router.go              # 路由配置和中间件链
├── handler/                   # HTTP 请求处理器
│   ├── health.go              # 健康检查
│   ├── user.go                # 用户管理
│   ├── organization.go        # 组织管理
│   ├── project.go             # 项目管理
│   ├── task.go                # 任务管理
│   ├── tag.go                 # 标签管理
│   └── header_info.go         # Header 信息调试
├── middleware/                # Gin 中间件
│   ├── extract_header_info.go # 提取网关转发的 Header 信息
│   ├── user_id.go             # 从 Header UUID 查询用户 ID
│   └── database.go            # 数据库连接注入
├── models/                    # GORM 数据模型
│   ├── user.go                # User 模型
│   ├── organization.go        # Organization, OrganizationMember, OrganizationInvitation 模型
│   ├── project.go             # Project, ProjectMember, ProjectInvitation 模型
│   ├── task.go                # Task 模型
│   ├── tag.go                 # Tag 模型
│   └── task_attachment.go     # TaskAttachment 模型
├── database/
│   └── db.go                  # 数据库初始化和连接池配置
├── response/
│   └── response.go            # 统一响应结构和错误码定义
├── api/                       # API 接口文档
│   ├── README.md              # API 文档索引
│   ├── common.md              # 公共接口
│   ├── user.md                # 用户接口
│   ├── organization.md        # 组织接口
│   ├── project.md             # 项目接口
│   ├── task.md                # 任务接口
│   └── tag.md                 # 标签接口
└── test/                      # 测试脚本和工具
```

## 架构设计

### 网关统一认证架构

本服务设计为与 API 网关配合使用，网关负责所有认证逻辑：

1. **网关处理认证**：JWT Token 验证、API Key 验证等
2. **Header 转发**：认证通过后，网关将用户信息通过请求头转发给业务服务
3. **业务服务无认证**：业务服务只需从请求头提取用户信息，无需处理认证逻辑

### 路由格式

```
/{service}/{version}/{auth_level}/{path}
```

**认证级别（auth_level）**：
- `public`：无需认证（如健康检查）
- `user`：需要 JWT 认证（业务接口）
- `apikey`：需要 API Key 认证（系统接口）

**示例**：
- `GET /workshop/v1/public/health` - 健康检查
- `POST /workshop/v1/user/projects` - 创建项目（需认证）
- `GET /workshop/v1/user/tasks?project_id=1` - 查询任务（需认证）

### 网关转发的 Header 信息

| Header | 说明 |
|--------|------|
| `X-User-ID` | 用户 UUID（必需） |
| `X-User-Username` | 用户名 |
| `X-User-AppID` | 应用 ID |
| `X-User-SessionID` | 会话 ID |

### 权限模型

**组织成员角色**：
- `owner`：所有者，拥有所有权限
- `admin`：管理员，可以管理成员
- `member`：成员，基础权限

**项目成员角色**：
- `owner`：可以删除项目、设置成员角色
- `admin`：可以管理成员和任务
- `member`：可以创建任务；对于未分配执行者的任务，任何成员都可以修改；对于已分配执行者的任务，只有执行者、管理员和所有者可以修改

### 数据模型关系

```
User (1) ───< (N) OrganizationMember >─── (N) Organization
User (1) ───< (N) ProjectMember >─── (N) Project
Project (1) ───< (N) Task
Project (1) ───< (N) Tag
Task (1) ───< (N) TaskAttachment
Task (self-reference) ─── 父子任务层级
```

## 环境变量配置

### 必需环境变量

```bash
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
```

### 可选环境变量

```bash
# CORS 配置（仅在需要时配置）
CORS_ALLOW_ORIGINS=http://localhost:3000,http://localhost:8000

# OSS/STS 配置（用于文件上传功能）
OSS_ACCESS_KEY_ID=your_access_key
OSS_ACCESS_KEY_SECRET=your_secret
OSS_BUCKET_NAME=your_bucket
OSS_RAM_ROLE_ARN=acs:ram::xxx:role/xxx
OSS_REGION=cn-hangzhou
OSS_ROOT_PATH=uploads/
```

## 构建和运行

### 本地开发运行

```bash
# 1. 确保 PostgreSQL 已启动
# 2. 设置环境变量
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

### 使用部署脚本

```bash
# 开发环境（默认，包含本地数据库）
./deploy.sh dev
# 或
./deploy.sh development

# 生产环境
./deploy.sh prod
# 或
./deploy.sh production
```

### 手动 Docker 部署

```bash
# 构建镜像
docker-compose -f deploy/dev/docker-compose.dev.yml build

# 启动服务
docker-compose -f deploy/dev/docker-compose.dev.yml up -d

# 查看日志
docker logs -f todo-service
```

## 开发规范

### Handler 开发模式

```go
package handler

import (
    "net/http"
    "todo/middleware"
    "todo/response"
    "github.com/gin-gonic/gin"
)

func ExampleHandler(c *gin.Context) {
    // 1. 获取数据库连接
    db := middleware.GetDB(c)
    if db == nil {
        c.JSON(http.StatusInternalServerError, response.NewErrorResponse(
            response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
        return
    }
    
    // 2. 获取用户ID（如需要）
    userID, ok := middleware.RequireUserID(c)
    if !ok {
        // 已返回错误响应，直接返回
        return
    }
    
    // 3. 获取Header信息（可选）
    headerInfo := middleware.GetHeaderInfo(c)
    
    // 4. 业务逻辑处理...
    
    // 5. 返回响应
    c.JSON(http.StatusOK, response.NewSuccessResponse(data))
}
```

### 响应格式规范

**成功响应**：
```json
{
  "code": "OK",
  "data": { ... },
  "meta": {          // 分页时才有
    "page": 1,
    "page_size": 20,
    "total": 100
  }
}
```

**错误响应**：
```json
{
  "code": "ERROR_CODE",
  "error": {
    "message": "错误描述",
    "details": { ... }  // 可选
  }
}
```

### 错误码规范

错误码定义在 `response/response.go` 中，按模块分类：
- 通用错误：`CodeBadRequest`, `CodeUnauthorized`, `CodeForbidden`, `CodeNotFound`, `CodeInternalError`
- 用户错误：`CodeUserNotFound`, `CodeUserCreateFailed`, ...
- 项目错误：`CodeProjectNotFound`, `CodeProjectCreateFailed`, ...
- 任务错误：`CodeTaskNotFound`, `CodeTaskCreateFailed`, ...
- 组织错误：`CodeOrganizationNotFound`, ...

## 数据库规范

### 模型定义规范

```go
type ModelName struct {
    ID        uint           `json:"id" gorm:"primaryKey;autoIncrement"`
    // ... 业务字段
    CreatedAt time.Time      `json:"created_at" gorm:"autoCreateTime"`
    UpdatedAt time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
    DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index;column:delete_at"`
}

func (ModelName) TableName() string {
    return "table_names"  // 复数形式，蛇形命名
}
```

### 关联关系

- **级联删除**：使用 `constraint:OnDelete:CASCADE` 标签
- **外键命名**：使用 `ForeignKey` 和 `References` 明确指定
- **软删除**：所有模型都使用 `gorm.DeletedAt` 实现软删除

### 连接池配置

```go
sqlDB.SetMaxOpenConns(200)           // 最大打开连接数
sqlDB.SetMaxIdleConns(50)            // 最大空闲连接数
sqlDB.SetConnMaxLifetime(time.Hour)  // 连接最大生命周期
sqlDB.SetConnMaxIdleTime(30 * time.Minute)  // 空闲连接最大空闲时间
```

## 测试方法

### 健康检查

```bash
curl http://localhost:8081/workshop/v1/public/health
```

### 创建用户

```bash
curl -X POST "http://localhost:8081/workshop/v1/user/users" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "avatar": "https://example.com/avatar.png"
  }'
```

### 创建项目

```bash
curl -X POST "http://localhost:8081/workshop/v1/user/projects" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "电商平台开发",
    "git_url": "https://github.com/team/ecommerce.git"
  }'
```

详细的 API 测试示例请参考 `api/` 目录下的文档。

## 安全考虑

### 认证安全

- 服务本身不处理认证，完全依赖网关进行身份验证
- 所有业务接口（`user` 级别）必须携带有效的用户身份信息
- 用户 UUID 从网关 Header 获取，不可伪造

### 权限控制

- 每个业务操作都需要验证用户是否为相关组织的成员
- 角色权限检查在 Handler 中显式实现
- 敏感操作（删除项目、设置角色）仅限 owner

### 数据安全

- 使用环境变量管理敏感配置（数据库密码、OSS 密钥等）
- 数据库连接使用 SSL 模式（生产环境）
- OSS 临时凭证有效期 15 分钟，最小权限原则

### 部署安全

- Docker 镜像使用多阶段构建，减小攻击面
- 基于 Alpine Linux，轻量级且安全
- 生产环境配置分离，不提交敏感信息到代码仓库

## 部署流程

### 开发环境

开发环境使用 `docker-compose.dev.yml`，包含：
- todo-service 应用容器
- PostgreSQL 数据库容器

```bash
cd deploy/dev
cp env.development.example .env.development
# 编辑 .env.development 配置
./deploy.sh
```

### 生产环境

生产环境使用 `docker-compose.prod.yml`，通常连接外部数据库：

```bash
cd deploy/prod
cp env.workshop.production.example .env.workshop.production
# 编辑 .env.workshop.production 配置
./deploy.sh
```

## 常见问题

### 1. 服务启动失败，提示环境变量未设置

确保设置了所有必需环境变量：PORT、HOST、SERVICE_NAME、DB_HOST、DB_PORT、DB_USER、DB_PASSWORD、DB_NAME

### 2. 数据库连接失败

- 检查 PostgreSQL 是否已启动
- 检查数据库连接配置是否正确
- 检查数据库是否存在

### 3. 接口返回 401/403

- 确保请求携带了正确的 Header（本地开发：X-User-ID）
- 确保用户已通过网关认证（生产环境：Authorization Header）

### 4. 权限不足

- 检查用户是否为项目/组织成员
- 检查用户的角色是否有权限执行该操作

## 相关文档

- [README.md](./README.md) - 项目总体说明
- [USER_GUIDE.md](./USER_GUIDE.md) - 用户使用指南（包含网关认证流程）
- [api/README.md](./api/README.md) - API 文档索引
