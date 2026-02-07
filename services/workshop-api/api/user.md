# 用户相关接口

基础路径：`/workshop/v1/user/users`  
认证：JWT；中间件 `ExtractUserID` 已注入当前用户 ID

---

## 1. 创建用户

**接口**: `POST /workshop/v1/user/users`

**认证级别**: `user`（需要JWT认证）

**描述**: 根据网关提供的 UUID 创建用户；若用户已存在则返回现有用户信息（仅创建用户，不再自动创建默认组织）

**请求示例**:

**测试环境**:
```bash
curl -X POST "http://localhost:8081/workshop/v1/user/users" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "avatar": "https://example.com/avatar.png"
  }'
```

**生产环境**:
```bash
curl -X POST "https://api.feitianchengzi.com/workshop/v1/user/users" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "avatar": "https://example.com/avatar.png"
  }'
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 否 | 用户名（可选，优先使用Header中的值） |
| avatar | string | 否 | 头像地址（可选） |

**响应示例** (`201 Created` 新用户 或 `200 OK` 已存在):
```json
{
  "code": "OK",
  "data": {
    "username": "test_user",
    "avatar": "https://example.com/avatar.png",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| username | string | 用户名 |
| avatar | string | 头像地址 |
| created_at | string | 创建时间（ISO 8601格式） |
| updated_at | string | 更新时间（ISO 8601格式） |

**特殊说明**:
- 请求体必须至少提供一个字段（username 或 avatar）
- 如果请求体中 username 为空，会使用 Header 中的用户名
- 如果用户已存在，返回 `200 OK` 和现有用户信息；如果用户不存在，返回 `201 Created` 和新创建的用户信息
- 仅创建用户，不会自动创建默认组织

**错误响应**:

**400 Bad Request**:
```json
{
  "code": "BAD_REQUEST",
  "error": {
    "message": "请求参数错误: ...",
    "details": null
  }
}
```

**400 Bad Request** - 缺少字段:
```json
{
  "code": "USER_MISSING_FIELDS",
  "error": {
    "message": "至少需要提供一个字段（username或avatar）",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "USER_CREATE_FAILED",
  "error": {
    "message": "创建用户失败: ...",
    "details": null
  }
}
```

---

## 2. 查询用户

**接口**: `GET /workshop/v1/user/users`

**认证级别**: `user`（需要JWT认证）

**描述**: 查询当前登录用户的信息（使用 Header 中的 UserID）

**请求示例**:

**测试环境**:
```bash
curl -X GET "http://localhost:8081/workshop/v1/user/users" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
curl -X GET "https://api.feitianchengzi.com/workshop/v1/user/users" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "username": "test_user",
    "avatar": "https://example.com/avatar.png",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

**响应字段说明**: 同创建用户接口

**错误响应**:

**401 Unauthorized**:
```json
{
  "code": "UNAUTHORIZED",
  "error": {
    "message": "未获取到用户信息，请确保已通过网关认证",
    "details": null
  }
}
```

**404 Not Found**:
```json
{
  "code": "USER_NOT_FOUND",
  "error": {
    "message": "用户不存在",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "USER_QUERY_FAILED",
  "error": {
    "message": "查询用户失败: ...",
    "details": null
  }
}
```

---

## 3. 更新用户

**接口**: `PUT /workshop/v1/user/users`

**认证级别**: `user`（需要JWT认证）

**权限规则**: 用户只能更新自己的信息（使用Header中的UUID）

**请求示例**:

**测试环境**:
```bash
curl -X PUT "http://localhost:8081/workshop/v1/user/users" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "updated_username",
    "avatar": "https://example.com/new_avatar.png"
  }'
```

**生产环境**:
```bash
curl -X PUT "https://api.feitianchengzi.com/workshop/v1/user/users" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "updated_username",
    "avatar": "https://example.com/new_avatar.png"
  }'
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 否 | 用户名（可选） |
| avatar | string | 否 | 头像地址（可选） |

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "username": "updated_username",
    "avatar": "https://example.com/new_avatar.png",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:01:00Z"
  }
}
```

**响应字段说明**: 同创建用户接口

**特殊说明**:
- 至少需要提供一个更新字段（username 或 avatar）
- 所有字段均为可选，但至少提供一个

**错误响应**:

**400 Bad Request** - 缺少字段:
```json
{
  "code": "USER_MISSING_FIELDS",
  "error": {
    "message": "至少需要提供一个更新字段（username或avatar）",
    "details": null
  }
}
```

**404 Not Found**:
```json
{
  "code": "USER_NOT_FOUND",
  "error": {
    "message": "用户不存在",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "USER_UPDATE_FAILED",
  "error": {
    "message": "更新用户失败: ...",
    "details": null
  }
}
```

---

## 4. 获取OSS临时访问凭证

**接口**: `GET /workshop/v1/user/oss/credentials`

**认证级别**: `user`（需要JWT认证）

**描述**: 为客户端生成临时的阿里云OSS访问凭证，用于直接上传文件到OSS。通过阿里云STS（Security Token Service）服务生成临时凭证，**临时凭证有效期为15分钟（900秒）**，过期后需要重新获取。

**流程说明**:
1. 验证用户身份（通过JWT Token）
2. 从环境变量读取OSS和STS配置
3. 调用阿里云STS服务生成临时凭证
4. 返回临时凭证信息

**请求示例**:

**测试环境**:
```bash
curl -X GET "http://localhost:8081/workshop/v1/user/oss/credentials" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
curl -X GET "https://api.feitianchengzi.com/workshop/v1/user/oss/credentials" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "access_key_id": "STS.xxxxx",
    "access_key_secret": "xxxxx",
    "security_token": "CAISxxxxx",
    "expiration": "2024-01-01T13:00:00Z",
    "bucket_name": "feitianchengziworkshop",
    "region": "oss-cn-beijing",
    "root_path": "/workshop",
    "authorization_v4": true,
    "secure": true
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| access_key_id | string | 临时AccessKeyId，用于OSS访问 |
| access_key_secret | string | 临时AccessKeySecret，用于OSS访问 |
| security_token | string | SecurityToken，使用临时凭证时必须提供 |
| expiration | string | 凭证过期时间（ISO 8601格式） |
| bucket_name | string | OSS存储桶名称 |
| region | string | OSS区域标识，格式为 `oss-{region}`，例如 `oss-cn-beijing` |
| root_path | string | OSS根目录路径，允许操作的根目录（例如：`/workshop`） |
| authorization_v4 | boolean | 是否使用V4签名（推荐），固定为 `true` |
| secure | boolean | 是否使用HTTPS协议，固定为 `true` |

**重要提示**:

- ⚠️ **临时凭证有效期为15分钟（900秒）**，过期后无法使用，需要重新调用此接口获取
- 临时凭证仅用于客户端直接上传文件到OSS，不要将凭证存储在客户端
- 建议在需要上传文件前再获取临时凭证，避免凭证过期
- 使用临时凭证访问OSS时，必须在请求头中包含 `x-oss-security-token` 字段，值为返回的 `security_token`
- `region` 字段格式为 `oss-{region}`（例如：`oss-cn-beijing`），在使用OSS SDK时可以直接使用
- `root_path` 字段表示允许操作的根目录路径，客户端上传文件时应在此路径下操作（例如：`/workshop`）
- `authorization_v4` 和 `secure` 字段固定为 `true`，表示使用V4签名和HTTPS协议
- 推荐使用阿里云OSS官方SDK进行文件上传，SDK会自动处理签名和请求头

**错误响应**:

**401 Unauthorized** - 未认证:
```json
{
  "code": "UNAUTHORIZED",
  "error": {
    "message": "未获取到用户信息，请确保已通过网关认证",
    "details": null
  }
}
```

**500 Internal Server Error** - 配置错误:
```json
{
  "code": "INTERNAL_ERROR",
  "error": {
    "message": "OSS配置不完整：缺少OSS_ACCESS_KEY_ID或OSS_ACCESS_KEY_SECRET",
    "details": null
  }
}
```

**使用示例**（JavaScript）:

```javascript
// 1. 获取临时凭证
const response = await fetch('https://api.feitianchengzi.com/workshop/v1/user/oss/credentials', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data: credentials } = await response.json();

// 2. 使用阿里云OSS JavaScript SDK
import OSS from 'ali-oss';

// 初始化OSS客户端
// 注意：OSS SDK需要的region格式是 "cn-beijing"，需要去掉 "oss-" 前缀
const ossRegion = credentials.region.replace('oss-', '');
const client = new OSS({
  region: ossRegion, // 例如: "cn-beijing"
  accessKeyId: credentials.access_key_id,
  accessKeySecret: credentials.access_key_secret,
  stsToken: credentials.security_token,
  bucket: credentials.bucket_name,
  secure: credentials.secure // true，使用HTTPS
});

// 3. 上传文件（使用 root_path 作为基础路径）
const fileName = 'example.jpg';
const filePath = `${credentials.root_path}/uploads/${fileName}`.replace(/\/+/g, '/');
const result = await client.put(filePath, file);
console.log('上传成功:', result.url);
```
