# Todo Service API 文档索引

## 概述

Todo Service 是一个团队共享任务管理系统，提供项目管理和任务管理功能。

**基础路径**: `/{service}/v1/{auth_level}/{path}`

**服务名称**: `todo-service`（可通过环境变量 `SERVICE_NAME` 配置）

**版本**: `v1`

## 文档分类

- **[common_api.md](./common_api.md)** - 公共接口（健康检查、Header信息）
- **[user_api.md](./user_api.md)** - 用户相关接口（创建、查询、更新用户）
- **[project_api.md](./project_api.md)** - 项目及成员管理接口（创建项目、邀请成员、加入项目、成员管理）
- **[task_api.md](./task_api.md)** - 任务管理接口（创建、更新、查询、删除任务）

## 认证说明

### 认证级别

1. **public** - 无需认证，公开接口
2. **user** - 需要JWT认证，用户级别接口
3. **apikey** - 需要API密钥认证，API级别接口

### Header信息

网关会在请求头中传递以下信息（业务服务自动提取）：

- `X-User-ID` - 用户UUID（必需）
- `X-User-Username` - 用户名
- `X-User-AppID` - 应用ID
- `X-User-SessionID` - 会话ID

### 用户ID获取

所有 `user` 级别的接口都通过中间件 `ExtractUserID` 自动获取用户ID，handler 直接使用 `middleware.RequireUserID(c)` 获取，无需手动查询用户表。

## 通用响应格式

### 成功响应

根据接口不同，返回相应的数据结构。

### 错误响应

```json
{
  "error": "错误信息描述"
}
```

### HTTP状态码

- `200 OK` - 请求成功
- `201 Created` - 资源创建成功
- `400 Bad Request` - 请求参数错误
- `401 Unauthorized` - 未认证或认证失败
- `403 Forbidden` - 权限不足
- `404 Not Found` - 资源不存在
- `500 Internal Server Error` - 服务器内部错误

## 数据模型

### 任务状态

| 状态值 | 说明 |
|--------|------|
| pending | 待处理 |
| in_progress | 进行中 |
| completed | 已完成 |
| cancelled | 已取消 |
| blocked | 已阻塞 |

### 项目成员角色

| 角色值 | 说明 | 权限 |
|--------|------|------|
| owner | 所有者 | 项目创建者，拥有所有权限 |
| admin | 管理员 | 可以管理项目成员和任务 |
| member | 成员 | 可以创建任务，只能修改/删除自己创建或分配给自己执行的任务 |

## 注意事项

1. **用户识别**: 系统使用网关提供的用户UUID（`X-User-ID`）进行用户识别，通过中间件自动转换为数据库用户ID
2. **权限验证**: 所有操作都需要验证用户是否为项目成员，直接查询项目成员表，无需查询用户表和项目表
3. **事务处理**: 批量删除任务使用事务处理，保证数据一致性
4. **历史记录**: 即使用户离职，任务的创建者和执行者信息仍然保留，用于历史记录追踪
5. **时间格式**: 所有时间字段使用 ISO 8601 格式（例如：`2024-01-01T12:00:00Z`）
