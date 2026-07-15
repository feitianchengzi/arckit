# 反馈相关接口

基础路径：

- V1 基础反馈：`/workshop/v1/{user|apikey}/feedbacks`
- V2 基础反馈：`/workshop/v2/{user|apikey}/feedbacks`
- V2 工作流扩展：`/workshop/v2/{user|apikey}/feedbacks/:id/messages`、`/workshop/v2/user/feedbacks/:id/convert-to-task`

认证：JWT；中间件 `ExtractUserID` 已注入当前用户 ID  
权限：项目成员可创建/查询/更新；删除仅项目管理员/所有者

V2 部署在同一套服务、同一套数据库中，不需要新建 OSS/ECS。数据库只做增量扩展：保留 `feedbacks` 作为主表，新增消息、附件和待办关联表，V1 不暴露消息与流转接口。

---

## 1. 创建反馈

**接口**:

- `POST /workshop/v1/user/feedbacks`
- `POST /workshop/v2/user/feedbacks`
- `POST /workshop/v1/apikey/feedbacks`
- `POST /workshop/v2/apikey/feedbacks`

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

**接口**:

- `GET /workshop/v1/user/feedbacks`
- `GET /workshop/v2/user/feedbacks`
- `GET /workshop/v1/apikey/feedbacks`
- `GET /workshop/v2/apikey/feedbacks`

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

**接口**:

- `PUT /workshop/v1/user/feedbacks/:id`
- `PUT /workshop/v2/user/feedbacks/:id`

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

**接口**:

- `DELETE /workshop/v1/user/feedbacks/:id`
- `DELETE /workshop/v2/user/feedbacks/:id`

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

---

## 5. 查询反馈消息

**接口**:

- `GET /workshop/v2/user/feedbacks/:id/messages`
- `GET /workshop/v2/apikey/feedbacks/:id/messages?custom_user_id=xxx`

**认证级别**: `user` 或 `apikey`

**权限要求**:

- `user`: 项目成员可查看。
- `apikey`: API Key 所属用户必须是项目成员，且 `custom_user_id` 必须与反馈记录归属一致。

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": [
    {
      "id": 1,
      "feedback_id": 10,
      "project_id": 1,
      "sender_type": "customer",
      "sender_custom_user_id": "sdk_user_123",
      "message_type": "text",
      "content": "我补充一张截图",
      "attachments": [
        {
          "id": 1,
          "message_id": 1,
          "type": "image",
          "object_key": "feedbacks/example.png",
          "file_name": "example.png",
          "mime_type": "image/png",
          "created_at": "2024-01-01T12:00:00Z",
          "updated_at": "2024-01-01T12:00:00Z"
        }
      ],
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "page_size": 50,
    "total": 1
  }
}
```

---

## 6. 创建反馈消息

**接口**:

- `POST /workshop/v2/user/feedbacks/:id/messages`
- `POST /workshop/v2/apikey/feedbacks/:id/messages`

**认证级别**: `user` 或 `apikey`

**请求体参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 否 | 消息正文，和附件至少提供一个 |
| custom_user_id | string | apikey 必填 | SDK 用户 ID，必须与反馈归属一致 |
| metadata | object | 否 | 扩展信息 |
| attachments | array | 否 | 附件列表 |

**附件字段**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | `image` / `file` / `url` |
| object_key | string | 否 | OSS object key，和 url 至少提供一个 |
| url | string | 否 | 外链地址，和 object_key 至少提供一个 |
| file_name | string | 否 | 文件名 |
| mime_type | string | 否 | MIME 类型 |
| size | int64 | 否 | 文件大小 |

**请求示例**:
```json
{
  "custom_user_id": "sdk_user_123",
  "content": "这里补充一下复现路径",
  "attachments": [
    {
      "type": "image",
      "object_key": "feedbacks/example.png",
      "file_name": "example.png",
      "mime_type": "image/png"
    }
  ]
}
```

---

## 7. 将反馈流转为待办

**接口**: `POST /workshop/v2/user/feedbacks/:id/convert-to-task`

**认证级别**: `user`

**权限要求**: 项目成员可流转。`apikey` 不允许调用。

**请求体参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 否 | 待办内容，默认使用反馈标题和内容 |
| state | string | 否 | 待办初始状态，默认 `pending_review` |
| executor_id | uint | 否 | 执行者 |
| father_id | uint | 否 | 父待办 |
| priority | int | 否 | 优先级 |
| tags | string | 否 | 标签 ID 字符串 |

**行为说明**:

- 后端在一个事务中创建待办、创建 `feedback_task_links`、更新反馈状态、写入系统消息。
- 后续关联待办状态更新时，会通过 `feedback_task_links` 反写反馈状态，并追加系统消息。

**响应示例** (`201 Created`):
```json
{
  "code": "OK",
  "data": {
    "feedback": {
      "id": 10,
      "project_id": 1,
      "short_id": "A1B2C3D4E5F6",
      "title": "按钮点击无响应",
      "content": "点击提交按钮没有反应",
      "status": "converted"
    },
    "task": {
      "id": 20,
      "project_id": 1,
      "state": "pending_review",
      "content": "[反馈] 按钮点击无响应\n点击提交按钮没有反应"
    },
    "link": {
      "id": 1,
      "feedback_id": 10,
      "project_id": 1,
      "task_id": 20,
      "relation_type": "converted_to",
      "is_primary": true
    }
  }
}
```
