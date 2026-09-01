# 反馈相关接口

基础路径：

- V1 基础反馈：`/workshop/v1/{user|apikey}/feedbacks`
- V2 基础反馈：`/workshop/v2/{user|apikey}/feedbacks`
- V2 工作流扩展：`/workshop/v2/{user|apikey}/feedbacks/:id/messages`、`/workshop/v2/{user|apikey}/feedbacks/:id/attachments/:attachment_id/oss/credentials`、`/workshop/v2/user/feedbacks/:id/convert-to-task`、`/workshop/v2/user/feedbacks/:id/ignore`、`/workshop/v2/user/feedbacks/:id/restore`

认证：JWT；中间件 `ExtractUserID` 已注入当前用户 ID  
权限：项目成员可创建/查询/更新/删除；删除为软删除

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
| attachments | array | V2 `apikey` 可选 | 首条消息附件；仅 V2 API Key 路径支持，需先申请 V2 上传策略 |

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

**权限要求**: 项目成员

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
  "code": "FEEDBACK_NOT_MEMBER",
  "error": {
    "message": "您不是该项目的成员，无法删除反馈",
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

## 7. V2 API Key 附件策略与读取

### 开发者回复上传

**接口**: `POST /workshop/v2/user/feedbacks/:id/upload-policies`

**权限要求**: 当前登录用户必须是该反馈所属项目的成员。

请求体与 API Key 上传策略相同：`type`、`file_name`、`mime_type`、`size` 均为必填项。服务端会返回一个仅允许向单个 object key 写入、有效期 10 分钟的 OSS PostObject 策略；控制台必须将返回的 `fields` 写入 `FormData`，最后追加 `file` 字段并以 `POST` 上传。上传成功后，将返回的 `object_key` 放入开发者消息的 `attachments`。

开发者附件固定写在项目和当前成员隔离的对象前缀下，不能写入用户附件空间，也不会暴露通用可写 STS 凭据。

直连 API Key 模式不需要换取反馈会话 token。所有请求均使用 `Authorization: Bearer <api-key>`，并且 API Key 所属用户必须仍是对应项目成员。

### 签发上传策略

**接口**: `POST /workshop/v2/apikey/feedbacks/upload-policies`

```json
{
  "project_id": 1,
  "custom_user_id": "sdk_user_123",
  "type": "image",
  "file_name": "screen.png",
  "mime_type": "image/png",
  "size": 120034
}
```

响应返回精确限制 object key、MIME 类型、文件字节数和 10 分钟有效期的 OSS PostObject 策略。上传成功后，将返回的 `object_key` 连同 `type`、`file_name`、`mime_type`、`size` 写入创建反馈或创建消息的 `attachments`。

### 读取私有附件

**接口**: `GET /workshop/v2/apikey/feedbacks/oss/credentials?project_id=1&custom_user_id=sdk_user_123`

返回只允许读取该项目和该 `custom_user_id` 附件前缀的 15 分钟 STS 凭证。不得使用它上传文件或将 STS 密钥持久化。

### 读取会话中的指定附件

当附件由开发者在控制台上传时，对象不位于用户附件前缀。SDK 必须按反馈和附件 ID 申请精确的只读凭据，不能复用前缀凭据：

```text
GET /workshop/v2/feedback/feedbacks/:id/attachments/:attachment_id/oss/credentials
GET /workshop/v2/apikey/feedbacks/:id/attachments/:attachment_id/oss/credentials?custom_user_id=sdk_user_123
```

前者使用反馈会话 token，后者使用直连 API Key。服务端会先校验反馈归属，再签发仅允许 `GetObject` 该一个 object key、有效期不超过 15 分钟的 STS 凭据。V2 `user` 路径也可供项目成员读取其项目下的指定附件。

---

## 8. 将反馈流转为待办

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
- 流转时已存在的会话图片、文件和 HTTPS 链接会按原消息写为待办沟通记录；用户补充和开发者回复会保留各自的文字上下文。图片在待办内联预览，文件可打开或下载。
- 流转完成后，用户从 SDK 继续发送的每条 V2 消息会自动追加为该待办的一条评论，纯文本和图片、文件、HTTPS 链接都会保留；带 `client_message_id` 的重试不会重复创建评论。开发者在控制台的后续回复仍保留在反馈会话中，不会自动镜像为待办评论。
- 后续关联待办状态更新时，会通过 `feedback_task_links` 反写反馈状态，并追加系统消息。

待办中的反馈附件需要通过以下 V2 `user` 接口读取临时凭据，服务端会同时校验待办成员权限、待办-反馈关联以及附件引用关系：

```text
GET /workshop/v2/user/tasks/attachments/:id/oss/credentials?object_key={object_key}
```

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

---

## 9. 忽略与恢复反馈

**接口**:

- `POST /workshop/v2/user/feedbacks/:id/ignore`
- `POST /workshop/v2/user/feedbacks/:id/restore`

**认证级别**: `user`

**权限要求**: 项目成员可操作；`apikey` 不允许变更反馈受理决定。

**行为说明**:

- `ignore` 将尚未流转待办的反馈标记为 `triage_status=ignored`。
- `restore` 只接受当前 `triage_status=ignored` 且未关联主待办的反馈，并在同一事务中将原记录恢复为 `triage_status=pending`、`status=pending`。
- 恢复会同步兼容 `data.feedback_state=pending` 与 `data.status=analyzing`，保留其它 metadata、反馈 ID、消息和附件历史。
- 服务端在事务内锁定反馈记录并重新校验状态；并发恢复时只有第一个请求成功，后续请求返回 `409 Conflict`。
- 成功后写入系统状态消息，并发布反馈更新、消息与通知事件。

**成功响应** (`200 OK`):

```json
{
  "code": "OK",
  "data": {
    "id": 10,
    "project_id": 1,
    "triage_status": "pending",
    "status": "pending",
    "customer_status": "submitted",
    "data": "{\"feedback_state\":\"pending\",\"status\":\"analyzing\"}"
  }
}
```

**错误响应**:

- `403 Forbidden`: 当前用户不是项目成员，或使用 API Key 调用。
- `404 Not Found`: 反馈不存在。
- `409 Conflict`: 反馈不是 `ignored`，或已经流转为待办。
