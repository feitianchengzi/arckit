# API 文档

## 📋 概述

本文档提供 Todo Service 的完整 API 接口说明，适用于**测试环境**和**生产环境**。

## 🌐 环境配置

### 测试环境（本地开发）

- **基础URL**: `http://localhost:8081/workshop/v1`
- **认证方式**: 使用 Header 传递用户信息（网关模拟）
- **Header 格式**:
  ```bash
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111"
  -H "X-User-Username: alice"
  ```

### 生产环境（线上）

- **基础URL**: `https://api.feitianchengzi.com/workshop/v1`
- **认证方式**: 使用 JWT Token（由网关处理）
- **Header 格式**:
  ```bash
  -H "Authorization: Bearer $ACCESS_TOKEN"
  ```

## 📝 使用说明

### 环境变量设置

在调用接口前，根据环境设置相应的变量：

**测试环境**:
```bash
BASE_URL="http://localhost:8081/workshop/v1"
USER_ID="11111111-1111-1111-1111-111111111111"
USERNAME="alice"
```

**生产环境**:
```bash
BASE_URL="https://api.feitianchengzi.com/workshop/v1"
ACCESS_TOKEN="your_access_token_here"
```

### 通用请求格式

**测试环境示例**:
```bash
curl -X GET "$BASE_URL/user/projects" \
  -H "X-User-ID: $USER_ID" \
  -H "X-User-Username: $USERNAME"
```

**生产环境示例**:
```bash
curl -X GET "$BASE_URL/user/projects" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

## 📚 文档结构

- **[common.md](./common.md)** - 公共接口（健康检查、Header信息）
- **[user.md](./user.md)** - 用户相关接口（创建、查询、更新用户、获取OSS凭证）
- **[project.md](./project.md)** - 项目相关接口（创建、查询、更新、删除项目、成员管理、邀请）
- **[task.md](./task.md)** - 任务相关接口（创建、更新、查询、删除任务、任务附件）
- **[tag.md](./tag.md)** - 标签相关接口（创建、查询、更新、删除标签）

## 🔄 环境差异说明

| 项目 | 测试环境 | 生产环境 |
|------|---------|---------|
| 基础URL | `http://localhost:8081/workshop/v1` | `https://api.feitianchengzi.com/workshop/v1` |
| 认证方式 | Header 传递用户信息 | JWT Token |
| Header 字段 | `X-User-ID`, `X-User-Username` | `Authorization: Bearer <token>` |
| 网关处理 | 无（直接访问服务） | 有（网关处理认证和路由） |

**注意**: 除了认证方式和基础URL不同外，所有接口的请求体、响应格式、参数说明都完全相同。
