# 反馈相关接口

基础路径：`/workshop/v1/user/feedbacks`  
认证：JWT；中间件 `ExtractUserID` 已注入当前用户 ID  
权限：项目成员可创建/查询/更新；删除仅项目管理员/所有者

---

## 1. 创建反馈

**接口**: `POST /workshop/v1/user/feedbacks`

**认证级别**: `user`（需要JWT认证）

**权限要求**: 用户必须是项目成员

**描述**: 创建项目反馈。`short_id` 由服务自动生成，响应中返回。

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_id | uint | 是 | 项目ID |
| title | string | 是 | 反馈标题 |
| content | string | 是 | 反馈内容 |
| custom_user_id | string | 否 | 自定义用户ID（非系统用户ID） |
| user_phone | string | 否 | 用户手机号 |
| user_email | string | 否 | 用户邮箱 |
| callback_url | string | 否 | 回调地址（仅创建时使用，不会存储） |
| file | string | 否 | 单个附件文件地址 |
| data | string | 否 | JSON字符串 |

**请求示例**:

**测试环境**:
```bash
curl -X POST "http://localhost:8081/workshop/v1/user/feedbacks" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "title": "首页反馈",
    "content": "登录页按钮需要更明显",
    "custom_user_id": "cust_001",
    "user_phone": "13800138000",
    "user_email": "user@example.com",
    "file": "https://cdn.example.com/feedback/1.png",
    "data": "{\"source\":\"web\"}"
  }'
```

**生产环境**:
```bash
curl -X POST "https://api.feitianchengzi.com/workshop/v1/user/feedbacks" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "title": "首页反馈",
    "content": "登录页按钮需要更明显"
  }'
```

**响应示例** (`201 Created`):
```json
{
  "code": "OK",
  "data": {
    "id": 10,
    "project_id": 1,
    "short_id": "A1B2C3D4E5F6",
    "title": "首页反馈",
    "content": "登录页按钮需要更明显",
    "custom_user_id": "cust_001",
    "user_phone": "13800138000",
    "user_email": "user@example.com",
    "file": "https://cdn.example.com/feedback/1.png",
    "data": "{\"source\":\"web\"}",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

**回调说明**:
- 若传入 `callback_url`，服务会以 `GET` 方式请求该地址，并附带 `short_id` 查询参数
- 回调请求失败将导致创建回滚，返回创建失败

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

**403 Forbidden**:
```json
{
  "code": "FEEDBACK_NOT_MEMBER",
  "error": {
    "message": "您不是该项目的成员，无法创建反馈",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "FEEDBACK_CREATE_FAILED",
  "error": {
    "message": "创建反馈失败: ...",
    "details": null
  }
}
```

---

## 2. 查询反馈

**接口**: `GET /workshop/v1/user/feedbacks`

**认证级别**: `user`（需要JWT认证）

**权限要求**: 用户必须是项目成员

**描述**: 按条件查询反馈。以下查询参数至少提供一个：`project_id` / `short_id` / `user_phone` / `user_email` / `custom_user_id`。

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_id | uint | 否 | 项目ID |
| short_id | string | 否 | 反馈短ID |
| user_phone | string | 否 | 用户手机号 |
| user_email | string | 否 | 用户邮箱 |
| custom_user_id | string | 否 | 自定义用户ID（非系统用户ID） |
| include_deleted | bool | 否 | 是否包含已删除记录（默认false） |
| page | int | 否 | 页码（默认1） |
| page_size | int | 否 | 每页条数（默认50，最大200） |

**请求示例**:

```bash
curl -X GET "http://localhost:8081/workshop/v1/user/feedbacks?project_id=1&user_email=user@example.com" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": [
    {
      "id": 10,
      "project_id": 1,
      "short_id": "A1B2C3D4E5F6",
      "title": "首页反馈",
      "content": "登录页按钮需要更明显",
      "custom_user_id": "cust_001",
      "user_phone": "13800138000",
      "user_email": "user@example.com",
    "file": "https://cdn.example.com/feedback/1.png",
      "data": "{\"source\":\"web\"}",
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z",
      "deleted_at": null
    }
  ],
  "meta": {
    "page": 1,
    "page_size": 50,
    "total": 1
  }
}
```

**错误响应**:

**400 Bad Request**:
```json
{
  "code": "BAD_REQUEST",
  "error": {
    "message": "查询参数至少需要提供一个条件",
    "details": null
  }
}
```

**403 Forbidden**:
```json
{
  "code": "FEEDBACK_NOT_MEMBER",
  "error": {
    "message": "您不是该项目的成员，无法查看反馈",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "FEEDBACK_QUERY_FAILED",
  "error": {
    "message": "查询反馈失败: ...",
    "details": null
  }
}
```

---

## 3. 更新反馈

**接口**: `PUT /workshop/v1/user/feedbacks/:id`

**认证级别**: `user`（需要JWT认证）

**权限要求**: 用户必须是项目成员

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 反馈ID |

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| short_id | string | 否 | 短ID（需全局唯一） |
| title | string | 否 | 反馈标题 |
| content | string | 否 | 反馈内容 |
| custom_user_id | string | 否 | 自定义用户ID |
| user_phone | string | 否 | 用户手机号 |
| user_email | string | 否 | 用户邮箱 |
| file | string | 否 | 单个附件文件地址 |
| data | string | 否 | JSON字符串 |

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "id": 10,
    "project_id": 1,
    "short_id": "A1B2C3D4E5F6",
    "title": "首页反馈（更新）",
    "content": "按钮需要更明显",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:10:00Z"
  }
}
```

**错误响应**:

**404 Not Found**:
```json
{
  "code": "FEEDBACK_NOT_FOUND",
  "error": {
    "message": "反馈不存在",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "FEEDBACK_UPDATE_FAILED",
  "error": {
    "message": "更新反馈失败: ...",
    "details": null
  }
}
```

---

## 4. 删除反馈

**接口**: `DELETE /workshop/v1/user/feedbacks/:id`

**认证级别**: `user`（需要JWT认证）

**权限要求**: 仅项目管理员/所有者

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 反馈ID |

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "feedback_id": 10,
    "deleted_at": "2024-01-01T12:20:00Z"
  }
}
```

**错误响应**:

**403 Forbidden**:
```json
{
  "code": "FEEDBACK_NO_PERMISSION",
  "error": {
    "message": "只有项目管理员或所有者可以删除反馈",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "FEEDBACK_DELETE_FAILED",
  "error": {
    "message": "删除反馈失败: ...",
    "details": null
  }
}
```
