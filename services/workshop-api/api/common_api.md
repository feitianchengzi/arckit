# 公共接口

基础路径：`/{service}/v1/public` 或 `/{service}/v1/{auth_level}`  
认证：部分接口无需认证，部分需要认证

---

## 1. 健康检查

**接口**: `GET /{service}/v1/public/health`

**认证级别**: `public`（无需认证）

**描述**: 检查服务健康状态

**请求参数**: 无

**响应示例** (`200 OK`):

```json
{
  "code": "OK",
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T12:00:00Z",
    "service": "todo"
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| status | string | 服务状态，固定为 "ok" |
| timestamp | string | 当前时间戳（ISO 8601格式） |
| service | string | 服务名称（从环境变量 SERVICE_NAME 读取，默认 "todo"） |

**错误响应**: 无

---

## 2. 获取Header信息

**接口**: `GET /{service}/v1/user/header-info` 或 `GET /{service}/v1/apikey/header-info`

**认证级别**: `user` 或 `apikey`（需要认证）

**描述**: 返回从请求头中提取的用户信息（用于调试）

**请求参数**: 无

**响应示例** (`200 OK`):

```json
{
  "code": "OK",
  "data": {
    "method": "user",
    "userID": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "appID": "app_123",
    "sessionID": "session_456"
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| method | string | 认证级别（user/apikey） |
| userID | string | 用户UUID（从 X-User-ID Header 提取） |
| username | string | 用户名（从 X-User-Username Header 提取） |
| appID | string | 应用ID（从 X-User-AppID Header 提取） |
| sessionID | string | 会话ID（从 X-User-SessionID Header 提取） |

**错误响应**: 无（即使Header为空也会返回空字符串）

---

## 通用说明

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

### 通用响应格式

**成功响应**:

```json
{
  "code": "OK",
  "data": {
    // 接口返回的数据
  },
  "meta": {
    // 分页元数据（可选）
    "page": 1,
    "page_size": 20,
    "total": 100
  }
}
```

**错误响应**:

```json
{
  "code": "ERROR_CODE",
  "error": {
    "message": "错误信息描述",
    "details": null
  }
}
```

**错误代码说明**:
- `BAD_REQUEST` - 请求参数错误
- `UNAUTHORIZED` - 未认证或认证失败
- `FORBIDDEN` - 权限不足
- `NOT_FOUND` - 资源不存在
- `INTERNAL_ERROR` - 服务器内部错误
- 其他特定错误代码请参考各接口文档

### HTTP状态码

- `200 OK` - 请求成功
- `201 Created` - 资源创建成功
- `400 Bad Request` - 请求参数错误
- `401 Unauthorized` - 未认证或认证失败
- `403 Forbidden` - 权限不足
- `404 Not Found` - 资源不存在
- `500 Internal Server Error` - 服务器内部错误

