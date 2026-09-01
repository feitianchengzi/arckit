# NebulaAuth 用户使用指南

## 📋 概述

本文档提供完整的用户登录和访问业务服务的流程指南，包含详细的 curl 命令示例。

### 🌐 服务器信息
- **API 网关地址**: `https://api.feitianchengzi.com`
- **协议**: HTTPS
- **端口**: 443（默认 HTTPS 端口）

---

## 🔐 完整使用流程

### 流程概览
```
1. 发送验证码 → 2. 用户登录 → 3. 获取Token → 4. 访问业务服务
```

---

## 📧 方式一：邮箱登录

### 步骤 1: 发送邮箱验证码

```bash
# 发送验证码到邮箱
curl -X POST https://api.feitianchengzi.com/auth-server/v1/public/send_verification \
  -H "Content-Type: application/json" \
  -d '{
    "code_type": "email",
    "target": "your-email@example.com",
    "purpose": "login"
  }'
```

**响应示例**:
```json
{
  "code": "OK",
  "data": {
    "message": "验证码已发送"
  }
}
```

**说明**:
- `code_type`: 验证码类型，邮箱登录使用 `"email"`
- `target`: 目标邮箱地址
- `purpose`: 用途，登录使用 `"login"`，注册使用 `"register"`

---

### 步骤 2: 使用验证码登录

```bash
# 使用收到的验证码进行登录
curl -X POST https://api.feitianchengzi.com/auth-server/v1/public/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "code": "123456",
    "code_type": "email",
    "purpose": "login"
  }'
```

**响应示例**:
```json
{
  "code": "OK",
  "data": {
    "user": {
      "email": "your-email@example.com",
      "phone": null,
      "username": null,
      "avatar_url": null,
      "is_active": true,
      "is_verified": false,
      "is_admin": false
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsImtpZCI6ImM4YjQxNWQ3LTcyNzktNDU4OC1hZDc5LWY2ZGJlNzNlZjU5YiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsImtpZCI6ImM4YjQxNWQ3LTcyNzktNDU4OC1hZDc5LWY2ZGJlNzNlZjU5YiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 7200,
      "refresh_expires_in": 604800,
      "access_token_expires_at": 1737331200000,
      "refresh_token_expires_at": 1737928800000
    }
  }
}
```

**重要说明**:
- 登录接口返回的用户数据中**不包含 `id` 和 `uuid` 字段**，只返回用户的基本信息
- `access_token` 有效期为 2 小时（7200 秒）
- `refresh_token` 有效期为 7 天（604800 秒）
- `access_token_expires_at`: Access Token 的过期时间（Unix 时间戳，毫秒），前端可直接使用此值判断是否过期
- `refresh_token_expires_at`: Refresh Token 的过期时间（Unix 时间戳，毫秒），前端可直接使用此值判断是否过期

---

### 步骤 3: 保存 Token（可选）

```bash
# 将返回的 access_token 保存为环境变量，方便后续使用
export ACCESS_TOKEN="REPLACE_WITH_PRIVATE_SECRET"

# 或者保存到文件
echo '{
  "access_token": "eyJhbGciOiJIUzI1NiIsImtpZCI6ImM4YjQxNWQ3LTcyNzktNDU4OC1hZDc5LWY2ZGJlNzNlZjU5YiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsImtpZCI6ImM4YjQxNWQ3LTcyNzktNDU4OC1hZDc5LWY2ZGJlNzNlZjU5YiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 7200,
  "refresh_expires_in": 604800,
  "access_token_expires_at": 1737331200000,
  "refresh_token_expires_at": 1737928800000
}' > token.json
```

**前端使用建议**:
```javascript
// 保存 token 和过期时间
localStorage.setItem('access_token', tokens.access_token);
localStorage.setItem('refresh_token', tokens.refresh_token);
localStorage.setItem('access_token_expires_at', tokens.access_token_expires_at);
localStorage.setItem('refresh_token_expires_at', tokens.refresh_token_expires_at);

// 检查 access token 是否过期
function isAccessTokenExpired() {
  const expiresAt = parseInt(localStorage.getItem('access_token_expires_at'));
  return Date.now() >= expiresAt;
}

// 提前 5 分钟刷新 token
function shouldRefreshToken() {
  const expiresAt = parseInt(localStorage.getItem('access_token_expires_at'));
  const bufferTime = 5 * 60 * 1000; // 5 分钟
  return Date.now() >= (expiresAt - bufferTime);
}
```

---

## 📱 方式二：手机号登录

### 步骤 1: 发送手机验证码

```bash
# 发送验证码到手机号
curl -X POST https://api.feitianchengzi.com/auth-server/v1/public/send_verification \
  -H "Content-Type: application/json" \
  -d '{
    "code_type": "sms",
    "target": "13800138000",
    "purpose": "login"
  }'
```

**响应示例**:
```json
{
  "code": "OK",
  "data": {
    "message": "验证码已发送"
  }
}
```

---

### 步骤 2: 使用验证码登录

```bash
# 使用收到的验证码进行登录
curl -X POST https://api.feitianchengzi.com/auth-server/v1/public/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "code": "123456",
    "code_type": "sms",
    "purpose": "login"
  }'
```

**响应格式与邮箱登录相同**，只是 `email` 字段替换为 `phone` 字段。

---

## 🚀 步骤 4: 访问业务服务

登录成功后，使用获取的 `access_token` 访问需要认证的业务服务。

### 示例 1: 访问 Workshop 服务（健康检查）

```bash
# 使用环境变量中的 TOKEN
TOKEN=REPLACE_WITH_PRIVATE_SECRET
BASE_URL="https://api.feitianchengzi.com/workshop/v1"

# 测试健康检查接口（无需认证）
curl -X GET "$BASE_URL/public/health"
```

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-12T08:23:36.02533123Z",
  "service": "workshop"
}
```

---

### 示例 2: 访问需要用户认证的业务服务

```bash
# 访问需要用户认证的接口
TOKEN=REPLACE_WITH_PRIVATE_SECRET
BASE_URL="https://api.feitianchengzi.com/workshop/v1"

# 在请求头中携带 Token
curl -X GET "$BASE_URL/user/your-endpoint" \
  -H "Authorization: Bearer $TOKEN"
```

**说明**:
- 所有需要认证的接口都需要在请求头中携带 `Authorization: Bearer <access_token>`
- Token 格式：`Bearer <access_token>`（注意 Bearer 后面有空格）

---

### 示例 3: 获取用户信息

```bash
# 获取当前登录用户的信息
TOKEN=REPLACE_WITH_PRIVATE_SECRET

curl -X GET https://api.feitianchengzi.com/user-service/v1/user/profile \
  -H "Authorization: Bearer $TOKEN"
```

**响应示例**:
```json
{
  "code": "OK",
  "data": {
    "id": "1a5ceb31-fdc7-49d2-92ad-f2b7d3b90baf",
    "email": "your-email@example.com",
    "username": null,
    "avatar_url": null,
    "is_active": true,
    "is_verified": false,
    "created_at": "2026-01-12T07:33:57.52492Z",
    "updated_at": "2026-01-12T07:33:57.52492Z"
  }
}
```

---

## 🔄 Token 刷新

当 `access_token` 过期后，可以使用 `refresh_token` 刷新获取新的 token。

### 刷新 Token

```bash
# 使用 refresh_token 刷新 access_token
curl -X POST https://api.feitianchengzi.com/auth-server/v1/public/refresh_token \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "your_refresh_token_here"
  }'
```

**响应示例**:
```json
{
  "code": "OK",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsImtpZCI6ImM4YjQxNWQ3LTcyNzktNDU4OC1hZDc5LWY2ZGJlNzNlZjU5YiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsImtpZCI6ImM4YjQxNWQ3LTcyNzktNDU4OC1hZDc5LWY2ZGJlNzNlZjU5YiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 7200,
    "refresh_expires_in": 604800,
    "access_token_expires_at": 1737331200000,
    "refresh_token_expires_at": 1737928800000
  }
}
```

**⚠️ 重要提示**:
- 刷新接口会返回**全新的** `access_token` 和 `refresh_token`
- **必须同时保存**新的 `access_token` 和 `refresh_token`，替换旧的 token
- 如果只保存新的 `access_token` 而忽略新的 `refresh_token`，会导致后续无法刷新

---

## 🔐 双Token机制详解（前端开发必读）

### 机制概述

NebulaAuth 采用**双Token机制**（Access Token + Refresh Token），这是一种安全且用户友好的认证方案：

| Token类型 | 用途 | 有效期 | 使用场景 |
|-----------|------|--------|----------|
| **Access Token** | 访问受保护资源 | 2小时 | 每次API请求时携带 |
| **Refresh Token** | 刷新Access Token | 7天 | 当Access Token过期时使用 |

### 工作流程

```
┌─────────────┐     登录/注册      ┌─────────────┐
│   前端      │ ───────────────► │  后端       │
│             │                   │             │
│             │ ◄─────────────── │             │
│             │   返回 tokens     │             │
│             │                   │             │
│  存储 tokens │                   │             │
└─────────────┘                   └─────────────┘
       │
       │  正常请求（携带 access_token）
       │
       ▼
┌─────────────┐                   ┌─────────────┐
│   前端      │ ───────────────► │  后端       │
│             │  Authorization:   │             │
│             │  Bearer <token>   │             │
│             │ ◄─────────────── │             │
│             │    200 OK         │             │
└─────────────┘                   └─────────────┘
       │
       │  access_token 即将过期（提前5分钟）
       │
       ▼
┌─────────────┐   refresh_token   ┌─────────────┐
│   前端      │ ───────────────► │  后端       │
│             │                   │             │
│             │ ◄─────────────── │             │
│             │  新的 tokens     │             │
│             │                   │             │
│  更新存储   │                   │             │
└─────────────┘                   └─────────────┘
       │
       │  refresh_token 也过期
       │
       ▼
┌─────────────┐
│  跳转登录页  │
└─────────────┘
```

### Token数据结构

登录/注册/刷新接口返回的 `tokens` 对象包含以下字段：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `access_token` | string | 访问令牌，用于API请求时在请求头中携带 |
| `refresh_token` | string | 刷新令牌，用于刷新 access_token |
| `expires_in` | number | access_token 有效时长（秒） |
| `refresh_expires_in` | number | refresh_token 有效时长（秒） |
| `access_token_expires_at` | number | access_token 过期时间（Unix时间戳，**毫秒**） |
| `refresh_token_expires_at` | number | refresh_token 过期时间（Unix时间戳，**毫秒**） |

### 前端实现要点

#### 1. Token存储

- **存储位置**：使用 `localStorage`（Web）或 `SecureStorage`（移动端）存储 tokens
- **存储内容**：必须同时保存 `access_token`、`refresh_token` 以及它们的过期时间戳
- **数据结构**：建议使用结构化的对象存储，包含所有必要的字段

#### 2. Token过期检查

- **Access Token 过期检查**：比较当前时间与 `access_token_expires_at`（毫秒时间戳）
- **提前刷新策略**：建议在 access_token 过期前 **5 分钟** 进行刷新，避免请求失败
- **Refresh Token 过期检查**：在刷新前先检查 `refresh_token_expires_at`，如果已过期则跳转登录页

#### 3. Token刷新逻辑

- **刷新时机**：
  - 在发起API请求前，如果 access_token 即将过期（提前5分钟），先刷新
  - 当API请求返回 401 错误时，尝试刷新后重试
- **防止并发刷新**：多个并发请求可能同时触发刷新，需要实现锁机制，确保同一时间只进行一次刷新
- **错误处理**：刷新失败时清除本地 tokens 并跳转到登录页
- **重要**：刷新成功后，必须同时保存新的 `access_token` 和 `refresh_token`

#### 4. 请求拦截

- **请求拦截器**：在请求发送前自动检查 token 过期情况，必要时先刷新
- **响应拦截器**：拦截 401 错误，自动刷新 token 后重试请求
- **请求头设置**：所有需要认证的请求都应在 `Authorization` 头中携带 `Bearer <access_token>`

#### 5. 错误处理

- **401 错误**：尝试使用 refresh_token 刷新，刷新成功后重试原请求
- **刷新失败**：清除本地 tokens，跳转到登录页
- **网络错误**：记录错误日志，根据业务需求决定是否重试

### 关键注意事项

#### ⚠️ 必须同时保存两个Token

刷新接口返回的是**全新的 token 对**，必须同时保存新的 `access_token` 和 `refresh_token`。如果只保存新的 `access_token` 而继续使用旧的 `refresh_token`，会导致后续无法刷新。

#### ⚠️ 提前刷新策略

建议在 access_token 过期前 **5 分钟** 进行刷新，避免请求失败。可以通过比较 `当前时间 + 5分钟` 与 `access_token_expires_at` 来判断是否需要刷新。

#### ⚠️ 防止并发刷新

多个并发请求可能同时触发刷新，需要实现锁机制，确保同一时间只进行一次刷新操作。可以使用标志位和 Promise 来实现。

#### ⚠️ 时间戳单位

注意：`access_token_expires_at` 和 `refresh_token_expires_at` 是**毫秒**时间戳，不是秒。在比较时直接使用 `Date.now()` 进行比较即可，无需转换。

### Refresh Token Rotation 机制

NebulaAuth 实现了 **Refresh Token Rotation（刷新令牌轮换）** 策略：

- **每次刷新**都会生成**全新的** `access_token` 和 `refresh_token`
- 只要用户持续活跃（7天内至少刷新一次），`refresh_token` 就不会过期
- 这比"快过期才返回新 refresh_token"更安全

### 默认Token有效期

| Token类型 | 默认有效期 | 配置环境变量 |
|-----------|-----------|-------------|
| Access Token | 2小时 | `JWT_ACCESS_TOKEN_DURATION` |
| Refresh Token | 7天 | `JWT_REFRESH_TOKEN_DURATION` |

---

## 📖 Todo Service API 接口文档

### 📝 文档变更说明

**重要变更**: 详细的 API 接口文档已按功能模块拆分到 `api/` 目录下，本文档不再包含详细的接口调用说明。

**变更原因**:
- 之前同时维护 `USER_GUIDE.md` 和 `api/` 目录下的文档，内容重复且容易不一致
- 测试环境和生产环境的主要区别只是基础URL和认证方式，接口本身完全相同
- 按功能模块拆分后，文档更易维护，查找更方便

**新的文档结构**:
- 所有接口文档已按功能模块拆分到 `api/` 目录
- 每个接口文档同时包含**测试环境**和**生产环境**的请求示例
- 统一的环境差异说明请查看 [api/README.md](./api/README.md)

### 📚 API 文档索引

请查看 [api/README.md](./api/README.md) 了解环境差异说明，然后查看相应的接口文档：

- **[api/common.md](./api/common.md)** - 公共接口（健康检查、Header信息）
- **[api/user.md](./api/user.md)** - 用户相关接口（创建、查询、更新用户、获取OSS凭证）
- **[api/project.md](./api/project.md)** - 项目相关接口（创建、查询、更新、删除项目、成员管理、邀请）
- **[api/task.md](./api/task.md)** - 任务相关接口（创建、更新、查询、删除任务、任务附件）
- **[api/tag.md](./api/tag.md)** - 标签相关接口（创建、查询、更新、删除标签）

### 🌐 环境差异说明

**测试环境（本地开发）**:
- **基础URL**: `http://localhost:8081/workshop/v1`
- **认证方式**: 使用 Header 传递用户信息（网关模拟）
- **Header 格式**:
  ```bash
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111"
  -H "X-User-Username: alice"
  ```

**生产环境（线上）**:
- **基础URL**: `https://api.feitianchengzi.com/workshop/v1`
- **认证方式**: 使用 JWT Token（由网关处理）
- **Header 格式**:
  ```bash
  -H "Authorization: Bearer $ACCESS_TOKEN"
  ```

**注意**: 除了认证方式和基础URL不同外，所有接口的请求体、响应格式、参数说明都完全相同。

详细的环境配置说明请查看 [api/README.md](./api/README.md)

---

## 📊 权限说明

### 项目成员角色

| 角色 | 说明 | 权限 |
|------|------|------|
| `owner` | 所有者 | 项目创建者，拥有所有权限 |
| `admin` | 管理员 | 可以管理项目成员和任务 |
| `member` | 成员 | 可以创建任务；对于未分配执行者的任务，任何成员都可以修改；对于已分配执行者的任务，只有执行者、管理员和所有者可以修改 |

### 任务状态

| 状态值 | 说明 |
|--------|------|
| `pending` | 待处理 |
| `in_progress` | 进行中 |
| `pending_review` | 待评审（默认） |
| `completed` | 已完成 |
| `accepted` | 已验收 |
| `cancelled` | 已取消 |
| `blocked` | 已阻塞 |


## 📝 完整示例脚本

以下是一个完整的示例脚本，展示从登录到访问业务服务的全流程：

```bash
#!/bin/bash

# ============================================
# NebulaAuth 完整使用流程示例
# ============================================

# 配置
EMAIL="your-email@example.com"
BASE_URL="https://api.feitianchengzi.com"

echo "=== 步骤 1: 发送邮箱验证码 ==="
curl -X POST "$BASE_URL/auth-server/v1/public/send_verification" \
  -H "Content-Type: application/json" \
  -d "{
    \"code_type\": \"email\",
    \"target\": \"$EMAIL\",
    \"purpose\": \"login\"
  }"

echo -e "\n\n请查看邮箱获取验证码，然后输入："
read -p "验证码: " VERIFICATION_CODE

echo -e "\n=== 步骤 2: 使用验证码登录 ==="
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth-server/v1/public/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"code\": \"$VERIFICATION_CODE\",
    \"code_type\": \"email\",
    \"purpose\": \"login\"
  }")

# 提取 access_token（需要安装 jq）
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.tokens.access_token')

if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
  echo "登录成功！"
  echo "Access Token: ${ACCESS_TOKEN:0:50}..."

  # 保存 token 到文件
  echo "$LOGIN_RESPONSE" > token.json
  echo "Token 已保存到 token.json"

  echo -e "\n=== 步骤 3: 访问业务服务（Workshop 健康检查）==="
  curl -X GET "$BASE_URL/workshop/v1/public/health" \
    -H "Authorization: Bearer $ACCESS_TOKEN"

  echo -e "\n=== 步骤 4: 获取用户信息 ==="
  curl -X GET "$BASE_URL/user-service/v1/user/profile" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
else
  echo "登录失败，请检查验证码是否正确"
  echo "响应: $LOGIN_RESPONSE"
fi
```

---

## ⚠️ 注意事项

### 1. Token 有效期
- **Access Token**: 2 小时（7200 秒），过期后需要刷新
- **Refresh Token**: 7 天（604800 秒），用于刷新 access token
- **过期时间戳**: 响应中包含 `access_token_expires_at` 和 `refresh_token_expires_at`（Unix 时间戳，毫秒），前端可直接使用这些值判断 token 是否过期，无需手动计算

### 2. 验证码有效期
- 验证码通常 5 分钟内有效
- 验证码使用后即失效，不能重复使用

### 3. 请求频率限制
- 验证码发送有频率限制，避免频繁请求
- 建议两次发送间隔至少 1 分钟

### 4. 错误处理
- 如果 token 过期，会返回 `401 Unauthorized`
- 使用 `refresh_token` 刷新后重试
- 如果 refresh_token 也过期，需要重新登录

### 5. 用户数据字段
- **登录接口**返回的用户数据中**不包含 `id` 和 `uuid` 字段**
- 如需获取完整用户信息（包括 id），请调用 `/user-service/v1/user/profile` 接口

---

## 🔍 常见问题

### Q1: 验证码收不到怎么办？
- 检查邮箱/手机号是否正确
- 检查垃圾邮件/短信拦截
- 确认验证码发送频率限制
- 联系管理员检查服务状态

### Q2: Token 过期了怎么办？
- 使用 `refresh_token` 刷新获取新的 `access_token`
- 如果 `refresh_token` 也过期，需要重新登录

### Q3: 如何判断 Token 是否有效？
- **推荐方式**: 使用响应中的 `access_token_expires_at` 字段（Unix 时间戳，毫秒），与当前时间比较即可判断是否过期
- **备选方式**: 调用需要认证的接口，如果返回 401，说明 token 无效或已过期
- 可以调用 `/auth-server/v1/public/auth/validate` 接口验证 token

### Q4: 可以同时使用多个设备登录吗？
- 支持多设备登录
- 每个设备会生成独立的 session
- 可以在用户设置中管理登录设备

---

## 🔑 API Key 使用指南

API Key 是一种长期有效的静态密钥，适用于服务器间通信、自动化脚本等场景。与 JWT Token 不同，API Key 不需要频繁刷新，可以长期有效（可设置过期时间）。

### API Key vs JWT Token

| 特性 | API Key | JWT Token |
|------|---------|-----------|
| **有效期** | 可长期有效（可设置过期时间） | 2小时（需要刷新） |
| **适用场景** | 服务器间通信、自动化脚本、第三方集成 | 用户登录后的 Web/App 访问 |
| **认证方式** | `Authorization: Bearer ak_xxx` | `Authorization: Bearer <jwt_token>` |
| **权限控制** | 可限制允许访问的服务 | 基于用户角色 |

### 步骤 1: 创建 API Key

**接口**: `POST /auth-server/v1/user/generate_apikey`

**前置条件**: 需要先登录获取 JWT Token

```bash
# 使用已登录的 JWT Token 创建 API Key
TOKEN=REPLACE_WITH_PRIVATE_SECRET

curl -X POST https://api.feitianchengzi.com/auth-server/v1/user/generate_apikey \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "服务器间通信密钥",
    "expires_at": "2026-12-31T23:59:59Z",
    "permissions": ["read", "write"],
    "allowed_services": ["user-service", "workshop"]
  }'
```

**请求参数说明**:

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `name` | string | 是 | API Key 名称，用于标识用途 |
| `expires_at` | string | 否 | 过期时间（ISO 8601格式），不设置则永不过期 |
| `permissions` | array | 否 | 权限列表，如 `["read", "write"]` |
| `allowed_services` | array | 否 | 允许访问的服务列表，为空则允许所有服务 |

**响应示例**:

```json
{
  "code": "OK",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "服务器间通信密钥",
    "api_key": "ak_a1b2c3d4e5f6...",
    "permissions": ["read", "write"],
    "allowed_services": ["user-service", "workshop"],
    "is_active": true,
    "expires_at": "2026-12-31T23:59:59Z",
    "created_at": "2026-01-15T10:30:00Z"
  }
}
```

⚠️ **重要提示**: `api_key` 字段**只在创建时返回一次**，请务必妥善保存。如果丢失，只能删除后重新创建。

---

### 步骤 2: 查询 API Key 列表

**接口**: `GET /auth-server/v1/user/apikeys`

```bash
TOKEN=REPLACE_WITH_PRIVATE_SECRET

curl -X GET https://api.feitianchengzi.com/auth-server/v1/user/apikeys \
  -H "Authorization: Bearer $TOKEN"
```

**响应示例**:

```json
{
  "code": "OK",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "服务器间通信密钥",
      "permissions": ["read", "write"],
      "allowed_services": ["user-service", "workshop"],
      "is_active": true,
      "expires_at": "2026-12-31T23:59:59Z",
      "created_at": "2026-01-15T10:30:00Z",
      "last_used_at": "2026-01-20T08:15:30Z"
    }
  ]
}
```

**说明**:
- 返回的是当前用户创建的所有 API Key 列表
- **不包含 `api_key` 明文**，只返回元数据
- `id` 用于管理（删除）API Key
- `last_used_at` 显示最后使用时间

---

### 步骤 3: 使用 API Key 访问服务

使用 API Key 访问服务时，需要在请求头中携带 `Authorization: Bearer ak_xxx`。

**路由规则**: `/workshop/v1/apikey/{具体方法}`

```bash
API_KEY=REPLACE_WITH_PRIVATE_SECRET

# 示例: 访问 workshop 服务
curl -X GET https://api.feitianchengzi.com/workshop/v1/apikey/header-info \
  -H "Authorization: Bearer $API_KEY"
```

**注意事项**:
- API Key 访问使用 `apikey` 权限级别，不是 `user` 级别
- API Key 只能访问 `allowed_services` 中指定的服务
- 如果 API Key 已过期或被禁用，会返回 401 错误

---

### 步骤 4: 删除 API Key

**接口**: `DELETE /auth-server/v1/user/apikeys/{id}`

```bash
TOKEN=REPLACE_WITH_PRIVATE_SECRET
API_KEY_ID=REPLACE_WITH_PRIVATE_SECRET

curl -X DELETE "https://api.feitianchengzi.com/auth-server/v1/user/apikeys/$API_KEY_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**响应示例**:

```json
{
  "code": "OK",
  "data": {
    "message": "API密钥删除成功",
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "服务器间通信密钥"
  }
}
```

**说明**:
- 只能删除自己创建的 API Key
- 删除后立即失效，无法恢复
- 建议定期清理不再使用的 API Key

---

### API Key 安全最佳实践

1. **妥善保管**: API Key 只在创建时显示一次，请立即保存到安全的地方（如环境变量、密钥管理系统）

2. **定期轮换**: 建议定期（如每 3-6 个月）创建新的 API Key 并停用旧的

3. **权限最小化**: 只授予必要的权限和服务访问范围

4. **设置过期时间**: 为 API Key 设置合理的过期时间，减少长期密钥带来的风险

5. **监控使用**: 定期查看 `last_used_at` 字段，发现异常及时停用

6. **使用环境变量**: 不要在代码中硬编码 API Key，使用环境变量
   ```bash
   # 正确做法
   API_KEY=$API_KEY

   # 错误做法
   API_KEY=REPLACE_WITH_PRIVATE_SECRET
   ```

---

## 📚 相关文档

- [完整 API 文档](./API_DOCUMENTATION.md) - 查看所有可用的 API 接口
- [系统架构说明](./README.md) - 了解系统架构和设计

---

## 🆘 获取帮助

如遇到问题，请：
1. 检查本文档的常见问题部分
2. 查看 [API 文档](./API_DOCUMENTATION.md) 获取详细接口说明
3. 联系技术支持
