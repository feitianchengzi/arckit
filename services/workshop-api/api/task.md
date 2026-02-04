# 任务相关接口

基础路径：`/workshop/v1/user/tasks`  
认证：JWT；中间件 `ExtractUserID` 已注入当前用户 ID  
权限：必须是项目成员；如果任务状态为 `in_progress`（执行中），只有执行者和管理员/所有者可以修改/删除；如果任务状态不是 `in_progress`，任何项目成员都可以修改/删除

---

## 通用说明

### 任务状态

- `pending` - 待处理（默认）
- `in_progress` - 进行中
- `completed` - 已完成
- `cancelled` - 已取消
- `blocked` - 已阻塞

### 权限规则

- 如果任务状态为 `in_progress`（执行中），只有执行者和管理员/所有者可以修改/删除，其他人不允许修改/删除
- 如果任务状态不是 `in_progress`，任何项目成员都可以修改/删除

---

## 1. 创建任务

**接口**: `POST /workshop/v1/user/tasks`

**认证级别**: `user`（需要JWT认证）

**权限要求**: 用户必须是项目成员

**请求示例**:

**测试环境**:
```bash
curl -X POST "http://localhost:8081/workshop/v1/user/tasks" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "content": "完成任务设计",
    "state": "pending",
    "executor_id": 2,
    "priority": 0,
    "tags": "重要,紧急"
  }'
```

**生产环境**:
```bash
curl -X POST "https://api.feitianchengzi.com/workshop/v1/user/tasks" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "content": "完成任务设计",
    "state": "pending",
    "executor_id": 2,
    "priority": 0,
    "tags": "重要,紧急"
  }'
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_id | uint | 是 | 项目ID |
| content | string | 是 | 任务内容 |
| state | string | 否 | 任务状态，默认为 "pending" |
| father_id | uint | 否 | 父任务ID，用于创建子任务 |
| executor_id | uint | 否 | 执行者用户ID（必须是项目成员） |
| priority | int | 否 | 优先级（可选，0为最高，数值越大优先级越低） |
| tags | string | 否 | 标签（可选，用逗号分割） |

**响应示例** (`201 Created`):
```json
{
  "code": "OK",
  "data": {
    "id": 1,
    "project_id": 1,
    "father_id": null,
    "content": "完成任务设计",
    "state": "pending",
    "creator_id": 10,
    "executor_id": 2,
    "priority": 0,
    "tags": "重要,紧急",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z",
    "completion_at": null
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 任务ID |
| project_id | uint | 项目ID |
| father_id | uint | 父任务ID（可为null） |
| content | string | 任务内容 |
| state | string | 任务状态 |
| creator_id | uint | 创建者用户ID |
| executor_id | uint | 执行者用户ID（可为null） |
| priority | int | 优先级（可为null） |
| tags | string | 标签（可为null） |
| created_at | string | 创建时间（ISO 8601格式） |
| updated_at | string | 更新时间（ISO 8601格式） |
| completion_at | string | 完成时间（ISO 8601格式，可为null） |

**特殊说明**:
- 使用事务处理，保证数据一致性

**错误响应**:

**400 Bad Request** - 请求参数错误:
```json
{
  "code": "BAD_REQUEST",
  "error": {
    "message": "请求参数错误: ...",
    "details": null
  }
}
```

**400 Bad Request** - 无效状态:
```json
{
  "code": "TASK_INVALID_STATE",
  "error": {
    "message": "无效的任务状态",
    "details": null
  }
}
```

**403 Forbidden**:
```json
{
  "code": "TASK_NOT_MEMBER",
  "error": {
    "message": "您不是该项目的成员，无法创建任务",
    "details": null
  }
}
```

**404 Not Found**:
```json
{
  "code": "TASK_PARENT_NOT_FOUND",
  "error": {
    "message": "父任务不存在",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "TASK_CREATE_FAILED",
  "error": {
    "message": "创建任务失败: ...",
    "details": null
  }
}
```

---

## 2. 更新任务

**接口**: `PUT /workshop/v1/user/tasks/:id`

**认证级别**: `user`（需要JWT认证）

**权限规则**:
- 如果任务状态为 `in_progress`（执行中），只有执行者和管理员/所有者可以修改，其他人不允许修改
- 如果任务状态不是 `in_progress`，任何项目成员都可以修改

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 任务ID |

**请求示例**:

**测试环境**:
```bash
TASK_ID=1

curl -X PUT "http://localhost:8081/workshop/v1/user/tasks/$TASK_ID" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "更新后的任务内容",
    "state": "in_progress",
    "executor_id": 3,
    "priority": 0,
    "tags": "重要,紧急"
  }'
```

**生产环境**:
```bash
TASK_ID=1

curl -X PUT "https://api.feitianchengzi.com/workshop/v1/user/tasks/$TASK_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "更新后的任务内容",
    "state": "in_progress",
    "executor_id": 3,
    "priority": 0,
    "tags": "重要,紧急"
  }'
```

**请求字段说明**（所有字段均为可选，但至少提供一个）:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 否 | 任务内容 |
| state | string | 否 | 任务状态 |
| executor_id | uint | 否 | 执行者用户ID（必须是项目成员） |
| father_id | uint | 否 | 父任务ID（可设置为null来清空） |
| priority | int | 否 | 优先级（可选，0为最高，数值越大优先级越低） |
| tags | string | 否 | 标签（可选，用逗号分割） |

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "id": 1,
    "project_id": 1,
    "father_id": null,
    "content": "更新后的任务内容",
    "state": "in_progress",
    "creator_id": 10,
    "executor_id": 3,
    "priority": 0,
    "tags": "重要,紧急",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:01:00Z",
    "completion_at": null
  }
}
```

**响应字段说明**: 同创建任务接口

**特殊说明**:
- 当状态变为 `completed` 时，自动设置完成时间
- 当状态从 `completed` 变为其他状态时，自动清除完成时间
- 父任务必须属于同一项目
- 任务不能成为自己的父任务
- 防止循环引用：系统会检查父任务链，确保不会形成循环

**错误响应**:

**400 Bad Request** - 请求参数错误:
```json
{
  "code": "BAD_REQUEST",
  "error": {
    "message": "请求参数错误: ...",
    "details": null
  }
}
```

**400 Bad Request** - 无效状态:
```json
{
  "code": "TASK_INVALID_STATE",
  "error": {
    "message": "无效的任务状态",
    "details": null
  }
}
```

**403 Forbidden** - 无权限:
```json
{
  "code": "TASK_NO_PERMISSION",
  "error": {
    "message": "您没有权限修改此任务",
    "details": null
  }
}
```

**404 Not Found**:
```json
{
  "code": "TASK_NOT_FOUND",
  "error": {
    "message": "任务不存在",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "TASK_UPDATE_FAILED",
  "error": {
    "message": "更新任务失败: ...",
    "details": null
  }
}
```

---

## 3. 查询任务列表

**接口**: `GET /workshop/v1/user/tasks?project_id=1`

**认证级别**: `user`（需要JWT认证）

**权限要求**: 用户必须是项目成员

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_id | uint | 是 | 项目ID |
| updated_after | string | 否 | 最后更新时间（UTC字符串格式，ISO 8601），如果提供此参数，只返回在此时间之后更新的任务 |
| father_id | uint | 否 | 父任务ID过滤。不提供：查询所有任务；为0：查询所有父任务ID为空的任务（顶级任务）；其他值：查询指定父任务ID的子任务 |
| include_deleted | bool | 否 | 是否包含已删除的记录（默认false） |
| page | int | 否 | 页码（默认1） |
| page_size | int | 否 | 每页条数（默认50，最大200） |

**请求示例**:

**测试环境**:
```bash
PROJECT_ID=1

curl -X GET "http://localhost:8081/workshop/v1/user/tasks?project_id=$PROJECT_ID" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
PROJECT_ID=1

curl -X GET "https://api.feitianchengzi.com/workshop/v1/user/tasks?project_id=$PROJECT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "tasks": [
      {
        "id": 1,
        "project_id": 1,
        "father_id": null,
        "content": "完成任务设计",
        "state": "pending",
        "creator_id": 10,
        "executor_id": 2,
        "priority": 0,
        "tags": "重要,紧急",
        "created_at": "2024-01-01T12:00:00Z",
        "updated_at": "2024-01-01T12:00:00Z",
        "completion_at": null,
        "deleted_at": null
      },
      {
        "id": 2,
        "project_id": 1,
        "father_id": 1,
        "content": "子任务：设计数据库",
        "state": "in_progress",
        "creator_id": 10,
        "executor_id": null,
        "priority": 1,
        "tags": "数据库,设计",
        "created_at": "2024-01-01T12:05:00Z",
        "updated_at": "2024-01-01T12:10:00Z",
        "completion_at": null,
        "deleted_at": null
      }
    ],
    "total": 2
  },
  "meta": {
    "page": 1,
    "page_size": 50,
    "total": 2
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| tasks | array | 任务列表 |
| total | int64 | 任务总数 |

**分页元数据字段说明（meta）**:

| 字段 | 类型 | 说明 |
|------|------|------|
| page | int | 当前页码 |
| page_size | int | 每页条数 |
| total | int | 总记录数 |

**特殊说明**:
- 如果提供了 `updated_after` 参数，将只返回 `updated_at` 晚于指定时间的任务
- `updated_after` 参数必须是有效的 UTC 时间字符串（ISO 8601 格式），例如：`2024-01-01T12:00:00Z`
- `father_id` 参数的使用方式：
  - 不提供：查询所有任务
  - 为0：查询所有父任务ID为空的任务（顶级任务）
  - 其他值：查询指定父任务ID的子任务，例如：`?father_id=5`
- `include_deleted` 参数用于查询包含已删除（软删除）的任务
- 当 `include_deleted=true` 时，响应中的 `deleted_at` 字段会显示删除时间（如果任务已删除）
- 默认情况下（`include_deleted=false`），只返回未删除的任务
- 多个查询参数可以组合使用，例如：`?project_id=1&updated_after=2024-01-01T12:00:00Z&father_id=0&include_deleted=true`
- 接口强制分页：未传 `page` / `page_size` 时，使用默认值 `page=1`、`page_size=50`

**查询包含已删除的任务**:

**测试环境**:
```bash
curl -X GET "http://localhost:8081/workshop/v1/user/tasks?project_id=$PROJECT_ID&include_deleted=true" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
curl -X GET "https://api.feitianchengzi.com/workshop/v1/user/tasks?project_id=$PROJECT_ID&include_deleted=true" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**错误响应**:

**400 Bad Request** - 项目ID为空:
```json
{
  "code": "PROJECT_ID_EMPTY",
  "error": {
    "message": "项目ID不能为空",
    "details": null
  }
}
```

**403 Forbidden**:
```json
{
  "code": "TASK_NOT_MEMBER",
  "error": {
    "message": "您不是该项目的成员，无法查看任务",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "TASK_QUERY_FAILED",
  "error": {
    "message": "查询任务失败: ...",
    "details": null
  }
}
```

---

## 4. 删除任务

**接口**: `DELETE /workshop/v1/user/tasks/:id`

**认证级别**: `user`（需要JWT认证）

**权限规则**:
- 如果任务状态为 `in_progress`（执行中），只有执行者和管理员/所有者可以删除，其他人不允许删除
- 如果任务状态不是 `in_progress`，任何项目成员都可以删除

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 任务ID |

**描述**: 删除单个任务（软删除），删除任务时会级联删除关联的附件。

**请求示例**:

**测试环境**:
```bash
TASK_ID=1

curl -X DELETE "http://localhost:8081/workshop/v1/user/tasks/$TASK_ID" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
TASK_ID=1

curl -X DELETE "https://api.feitianchengzi.com/workshop/v1/user/tasks/$TASK_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "task_id": 1,
    "deleted_at": "2024-01-01T12:20:00Z"
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| task_id | uint | 已删除的任务ID |
| deleted_at | string | 删除时间（ISO 8601格式） |

**特殊说明**:
- 删除操作为软删除，任务记录不会从数据库中物理删除
- 删除任务时会级联删除关联的附件（软删除）
- 使用 `include_deleted=true` 参数查询任务列表时，可以查看已删除的任务

**错误响应**:

**400 Bad Request**:
```json
{
  "code": "BAD_REQUEST",
  "error": {
    "message": "任务ID不能为空",
    "details": null
  }
}
```

**403 Forbidden** - 无权限:
```json
{
  "code": "TASK_NO_PERMISSION",
  "error": {
    "message": "您没有权限删除此任务",
    "details": null
  }
}
```

**404 Not Found**:
```json
{
  "code": "TASK_NOT_FOUND",
  "error": {
    "message": "任务不存在",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "TASK_DELETE_FAILED",
  "error": {
    "message": "删除任务失败: ...",
    "details": null
  }
}
```

---

## 5. 创建任务附件

**接口**: `POST /workshop/v1/user/tasks/attachments`

**认证级别**: `user`（需要JWT认证）

**权限要求**: 与任务修改权限相同（如果任务状态为 `in_progress`，只有执行者和管理员/所有者可以添加附件；如果任务状态不是 `in_progress`，任何项目成员都可以添加附件）

**请求示例**:

**测试环境**:
```bash
curl -X POST "http://localhost:8081/workshop/v1/user/tasks/attachments" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": 1,
    "type": "text",
    "content": "这是文本附件内容"
  }'
```

**生产环境**:
```bash
curl -X POST "https://api.feitianchengzi.com/workshop/v1/user/tasks/attachments" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": 1,
    "type": "text",
    "content": "这是文本附件内容"
  }'
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | uint | 是 | 任务ID |
| type | string | 是 | 附件类型：`text`（文本）、`file`（文件URL）、`url`（URL链接） |
| content | string | 是 | 内容：文本内容或URL |

**响应示例** (`201 Created`):
```json
{
  "code": "OK",
  "data": {
    "id": 1,
    "task_id": 1,
    "creator_id": 10,
    "type": "text",
    "content": "这是文本附件内容",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 附件ID |
| task_id | uint | 任务ID |
| creator_id | uint | 创建者用户ID |
| type | string | 附件类型 |
| content | string | 内容 |
| created_at | string | 创建时间（ISO 8601格式） |
| updated_at | string | 更新时间（ISO 8601格式） |

**附件类型说明**:
- `text`: 文本类型，`content` 字段存储文本内容
- `file`: 文件类型，`content` 字段存储文件URL（string）
- `url`: URL类型，`content` 字段存储URL链接（string）

**错误响应**:

**400 Bad Request** - 请求参数错误:
```json
{
  "code": "BAD_REQUEST",
  "error": {
    "message": "请求参数错误: ...",
    "details": null
  }
}
```

**400 Bad Request** - 无效附件类型:
```json
{
  "code": "TASK_ATTACHMENT_INVALID_TYPE",
  "error": {
    "message": "无效的附件类型，支持的类型：text/file/url",
    "details": null
  }
}
```

**403 Forbidden** - 无权限:
```json
{
  "code": "TASK_NO_PERMISSION",
  "error": {
    "message": "您没有权限为此任务添加附件",
    "details": null
  }
}
```

**404 Not Found**:
```json
{
  "code": "TASK_NOT_FOUND",
  "error": {
    "message": "任务不存在",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "TASK_ATTACHMENT_CREATE_FAILED",
  "error": {
    "message": "创建附件失败: ...",
    "details": null
  }
}
```

---

## 6. 查询任务附件列表

**接口**: `GET /workshop/v1/user/tasks/attachments?task_id=1`

**认证级别**: `user`（需要JWT认证）

**权限要求**: 用户必须是项目成员

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | uint | 是 | 任务ID |
| include_deleted | bool | 否 | 是否包含已删除的记录（默认false） |
| page | int | 否 | 页码（默认1） |
| page_size | int | 否 | 每页条数（默认50，最大200） |

**请求示例**:

**测试环境**:
```bash
TASK_ID=1

curl -X GET "http://localhost:8081/workshop/v1/user/tasks/attachments?task_id=$TASK_ID" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
TASK_ID=1

curl -X GET "https://api.feitianchengzi.com/workshop/v1/user/tasks/attachments?task_id=$TASK_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "attachments": [
      {
        "id": 1,
        "task_id": 1,
        "creator_id": 10,
        "type": "text",
        "content": "这是文本附件内容",
        "created_at": "2024-01-01T12:00:00Z",
        "updated_at": "2024-01-01T12:00:00Z",
        "deleted_at": null
      },
      {
        "id": 2,
        "task_id": 1,
        "creator_id": 10,
        "type": "file",
        "content": "https://example.com/files/document.pdf",
        "created_at": "2024-01-01T12:05:00Z",
        "updated_at": "2024-01-01T12:05:00Z",
        "deleted_at": null
      }
    ],
    "total": 2
  },
  "meta": {
    "page": 1,
    "page_size": 50,
    "total": 2
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| attachments | array | 附件列表 |
| total | int64 | 附件总数 |

**分页元数据字段说明（meta）**:

| 字段 | 类型 | 说明 |
|------|------|------|
| page | int | 当前页码 |
| page_size | int | 每页条数 |
| total | int | 总记录数 |

**分页说明**:
- 接口强制分页：未传 `page` / `page_size` 时，使用默认值 `page=1`、`page_size=50`

**查询包含已删除的附件**:

**测试环境**:
```bash
curl -X GET "http://localhost:8081/workshop/v1/user/tasks/attachments?task_id=$TASK_ID&include_deleted=true" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
curl -X GET "https://api.feitianchengzi.com/workshop/v1/user/tasks/attachments?task_id=$TASK_ID&include_deleted=true" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**错误响应**:

**400 Bad Request**:
```json
{
  "code": "BAD_REQUEST",
  "error": {
    "message": "参数绑定失败: ...",
    "details": null
  }
}
```

**403 Forbidden**:
```json
{
  "code": "TASK_NOT_MEMBER",
  "error": {
    "message": "您不是该项目的成员，无法查看附件",
    "details": null
  }
}
```

**404 Not Found**:
```json
{
  "code": "TASK_NOT_FOUND",
  "error": {
    "message": "任务不存在",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "TASK_ATTACHMENT_QUERY_FAILED",
  "error": {
    "message": "查询附件失败: ...",
    "details": null
  }
}
```

---

## 10. 更新任务附件

**接口**: `PUT /workshop/v1/user/tasks/attachments/:id`

**认证级别**: `user`（需要JWT认证）

**权限规则**: 只有创建者可以修改附件（附件类型不可更新，只能更新内容）

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 附件ID |

**请求示例**:

**测试环境**:
```bash
ATTACHMENT_ID=1

curl -X PUT "http://localhost:8081/workshop/v1/user/tasks/attachments/$ATTACHMENT_ID" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "更新后的内容"
  }'
```

**生产环境**:
```bash
ATTACHMENT_ID=1

curl -X PUT "https://api.feitianchengzi.com/workshop/v1/user/tasks/attachments/$ATTACHMENT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "更新后的内容"
  }'
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 否 | 内容（附件类型不可更新） |

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "id": 1,
    "task_id": 1,
    "creator_id": 10,
    "type": "text",
    "content": "更新后的内容",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:15:00Z"
  }
}
```

**响应字段说明**: 同创建附件接口

**特殊说明**:
- 附件类型（`type`）创建后不可更新，只能更新内容（`content`）
- 只有附件的创建者可以修改附件

**错误响应**:

**400 Bad Request** - 请求参数错误:
```json
{
  "code": "BAD_REQUEST",
  "error": {
    "message": "请求参数错误: ...",
    "details": null
  }
}
```

**400 Bad Request** - 没有需要更新的字段:
```json
{
  "code": "BAD_REQUEST",
  "error": {
    "message": "没有需要更新的字段",
    "details": null
  }
}
```

**403 Forbidden** - 无权限:
```json
{
  "code": "TASK_NO_PERMISSION",
  "error": {
    "message": "只有创建者可以修改此附件",
    "details": null
  }
}
```

**404 Not Found**:
```json
{
  "code": "TASK_ATTACHMENT_NOT_FOUND",
  "error": {
    "message": "附件不存在",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "TASK_ATTACHMENT_UPDATE_FAILED",
  "error": {
    "message": "更新附件失败: ...",
    "details": null
  }
}
```

---

## 11. 删除任务附件

**接口**: `DELETE /workshop/v1/user/tasks/attachments/:id`

**认证级别**: `user`（需要JWT认证）

**权限规则**:
- 创建者可以删除自己创建的附件
- 项目的管理员（admin）和所有者（owner）可以删除项目内任何附件

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 附件ID |

**请求示例**:

**测试环境**:
```bash
ATTACHMENT_ID=1

curl -X DELETE "http://localhost:8081/workshop/v1/user/tasks/attachments/$ATTACHMENT_ID" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
ATTACHMENT_ID=1

curl -X DELETE "https://api.feitianchengzi.com/workshop/v1/user/tasks/attachments/$ATTACHMENT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "id": 1,
    "deleted_at": "2024-01-01T12:20:00Z"
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 附件ID |
| deleted_at | string | 删除时间（ISO 8601格式） |

**特殊说明**:
- 删除操作为软删除，附件记录不会从数据库中物理删除
- 使用 `include_deleted=true` 参数查询附件列表时，可以查看已删除的附件

**错误响应**:

**400 Bad Request**:
```json
{
  "code": "BAD_REQUEST",
  "error": {
    "message": "附件ID不能为空",
    "details": null
  }
}
```

**403 Forbidden** - 无权限:
```json
{
  "code": "TASK_NO_PERMISSION",
  "error": {
    "message": "只有创建者、项目管理员或所有者可以删除此附件",
    "details": null
  }
}
```

**404 Not Found**:
```json
{
  "code": "TASK_ATTACHMENT_NOT_FOUND",
  "error": {
    "message": "附件不存在",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "TASK_ATTACHMENT_DELETE_FAILED",
  "error": {
    "message": "删除附件失败: ...",
    "details": null
  }
}
```
