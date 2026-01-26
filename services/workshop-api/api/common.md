# 公共接口

基础路径：`/workshop/v1/public` 或 `/workshop/v1/{auth_level}`  
认证：部分接口无需认证，部分需要认证

---

## 1. 健康检查

**接口**: `GET /workshop/v1/public/health`

**认证级别**: `public`（无需认证）

**描述**: 检查服务健康状态

**请求示例**:

**测试环境**:
```bash
curl -X GET "http://localhost:8081/todo/v1/public/health"
```

**生产环境**:
```bash
curl -X GET "https://api.feitianchengzi.com/workshop/v1/public/health"
```

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T12:00:00Z",
    "service": "workshop"
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

**接口**: `GET /workshop/v1/user/header-info` 或 `GET /workshop/v1/apikey/header-info`

**认证级别**: `user` 或 `apikey`（需要认证）

**描述**: 返回从请求头中提取的用户信息（用于调试）

**请求示例**:

**测试环境**:
```bash
curl -X GET "http://localhost:8081/todo/v1/user/header-info" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
curl -X GET "https://api.feitianchengzi.com/workshop/v1/user/header-info" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "method": "user",
    "userID": "1a5ceb31-fdc7-49d2-92ad-f2b7d3b90baf",
    "username": "john_doe",
    "appID": "default",
    "sessionID": "19ebbf07-d5a3-4f5c-8202-2a69f2ce7859"
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
