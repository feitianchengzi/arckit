# 任务相关接口

基础路径：`/{service}/v1/user/tasks`  
认证：JWT；中间件 `ExtractUserID` 已注入当前用户 ID  
权限：必须是项目成员；`owner/admin` 可操作任意任务，`member` 仅可操作自己创建或分配给自己的任务

## 通用说明

### 用户ID获取方式

所有接口通过中间件 `ExtractUserID` 自动获取用户ID，获取优先级如下：

1. **优先从查询参数获取**：如果请求URL中包含 `user_id` 查询参数，直接使用该值
2. **从Header UUID查询**：如果没有查询参数，则从请求头 `X-User-ID` 获取用户UUID，然后查询用户表获取对应的用户ID

**推荐方式**：在请求URL中添加 `user_id` 查询参数，避免额外的数据库查询。

**示例**：
```bash
# 推荐：使用查询参数
POST /todo/v1/user/tasks?user_id=3

# 备选：仅使用Header（会查询用户表）
POST /todo/v1/user/tasks
# Header: X-User-ID: 11111111-1111-1111-1111-111111111111
```

### 任务状态

- `pending` - 待处理（默认）
- `in_progress` - 进行中
- `completed` - 已完成
- `cancelled` - 已取消
- `blocked` - 已阻塞

### 权限规则

- `owner` / `admin`: 可以修改/删除任意任务
- `member`: 只能修改/删除自己创建或分配给自己执行的任务

---

## 1. 创建任务

**接口**: `POST /{service}/v1/user/tasks`

**认证级别**: `user`（需要JWT认证）

**权限要求**: 用户必须是项目成员

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | uint | 否 | 用户ID（数据库ID），推荐使用查询参数，避免从UUID查询用户表 |

**请求体**:

```json
{
  "project_id": 1,
  "content": "完成任务设计",
  "state": "pending",
  "father_id": null,
  "executor_id": 2
}
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_id | uint | 是 | 项目ID |
| content | string | 是 | 任务内容 |
| state | string | 否 | 任务状态，默认为 "pending" |
| father_id | uint | 否 | 父任务ID，用于创建子任务 |
| executor_id | uint | 否 | 执行者用户ID（必须是项目成员） |

**响应示例** (`201 Created`):

```json
{
  "id": 1,
  "project_id": 1,
  "father_id": null,
  "content": "完成任务设计",
  "state": "pending",
  "creator_id": 10,
  "executor_id": 2,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z",
  "completion_at": null
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
| created_at | string | 创建时间（ISO 8601格式） |
| updated_at | string | 更新时间（ISO 8601格式） |
| completion_at | string | 完成时间（ISO 8601格式，可为null） |

**错误响应**:

- `400 Bad Request` - 请求参数错误、无效的任务状态、父任务必须属于同一项目或指定的执行者不是该项目的成员
- `403 Forbidden` - 您不是该项目的成员，无法创建任务
- `404 Not Found` - 父任务不存在
- `500 Internal Server Error` - 创建任务失败

---

## 2. 更新任务

**接口**: `PUT /{service}/v1/user/tasks/:id`

**认证级别**: `user`（需要JWT认证）

**权限规则**:
- `owner` / `admin`: 可以修改任意任务
- `member`: 只能修改自己创建或分配给自己执行的任务

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 任务ID |

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | uint | 否 | 用户ID（数据库ID），推荐使用查询参数，避免从UUID查询用户表 |

**请求体**（所有字段均为可选，但至少提供一个）:

```json
{
  "content": "更新后的任务内容",
  "state": "in_progress",
  "executor_id": 3,
  "father_id": null
}
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 否 | 任务内容 |
| state | string | 否 | 任务状态 |
| executor_id | uint | 否 | 执行者用户ID（必须是项目成员） |
| father_id | uint | 否 | 父任务ID |

**特殊说明**:

- 当状态变为 `completed` 时，自动设置完成时间
- 当状态从 `completed` 变为其他状态时，自动清除完成时间
- 父任务必须属于同一项目
- 任务不能成为自己的父任务

**响应示例** (`200 OK`):

```json
{
  "id": 1,
  "project_id": 1,
  "father_id": null,
  "content": "更新后的任务内容",
  "state": "in_progress",
  "creator_id": 10,
  "executor_id": 3,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:01:00Z",
  "completion_at": null
}
```

**响应字段说明**: 同创建任务接口

**错误响应**:

- `400 Bad Request` - 请求参数错误、无效的任务状态、父任务必须属于同一项目、任务不能成为自己的父任务或指定的执行者不是该项目的成员
- `403 Forbidden` - 您没有权限修改此任务或您不是该项目的成员
- `404 Not Found` - 任务不存在或父任务不存在
- `500 Internal Server Error` - 更新任务失败

---

## 3. 查询任务列表

**接口**: `GET /{service}/v1/user/tasks?project_id=1`

**认证级别**: `user`（需要JWT认证）

**权限要求**: 用户必须是项目成员

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_id | uint | 是 | 项目ID |
| user_id | uint | 否 | 用户ID（数据库ID），推荐使用查询参数，避免从UUID查询用户表 |

**响应示例** (`200 OK`):

```json
{
  "tasks": [
    {
      "id": 1,
      "project_id": 1,
      "father_id": null,
      "content": "完成任务设计",
      "state": "pending",
      "creator_id": 10,
      "executor_id": 2,
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z",
      "completion_at": null
    },
    {
      "id": 2,
      "project_id": 1,
      "father_id": 1,
      "content": "子任务：设计数据库",
      "state": "in_progress",
      "creator_id": 10,
      "executor_id": null,
      "created_at": "2024-01-01T12:05:00Z",
      "updated_at": "2024-01-01T12:10:00Z",
      "completion_at": null
    }
  ],
  "total": 2
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| tasks | array | 任务列表 |
| total | int64 | 任务总数 |

**错误响应**:

- `400 Bad Request` - 项目ID不能为空或无效的项目ID
- `403 Forbidden` - 您不是该项目的成员，无法查看任务
- `500 Internal Server Error` - 查询任务失败

---

## 4. 批量删除任务

**接口**: `DELETE /{service}/v1/user/tasks`

**认证级别**: `user`（需要JWT认证）

**权限规则**:
- `owner` / `admin`: 可以删除任意任务
- `member`: 只能删除自己创建或分配给自己执行的任务

**描述**: 批量删除任务，使用事务处理，所有任务要么全部删除成功，要么全部失败回滚

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | uint | 否 | 用户ID（数据库ID），推荐使用查询参数，避免从UUID查询用户表 |

**请求体**:

```json
{
  "task_ids": [1, 2, 3]
}
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_ids | array[uint] | 是 | 任务ID列表，至少包含一个ID |

**响应示例** (`200 OK`):

```json
{
  "deleted_count": 3,
  "task_ids": [1, 2, 3]
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| deleted_count | int | 删除的任务数量 |
| task_ids | array[uint] | 已删除的任务ID列表 |

**错误响应**:

- `400 Bad Request` - 请求参数错误（task_ids为空或格式错误）
- `403 Forbidden` - 您没有权限删除此任务或您不是该项目的成员
- `404 Not Found` - 任务不存在
- `500 Internal Server Error` - 删除任务失败

**注意事项**:

- 使用事务处理，如果任何一个任务删除失败，整个操作会回滚
- 所有任务必须存在且用户有权限删除，否则返回错误
- 会逐个验证每个任务的权限

---

## 使用示例

以下示例使用测试用户信息（参考 `README.md`）：
- **Alice**: `user_id=3`, `UUID=11111111-1111-1111-1111-111111111111`, `username=alice`
- **Bob**: `user_id=4`, `UUID=22222222-2222-2222-2222-222222222222`, `username=bob`

### 创建任务

```bash
curl -X POST "http://localhost:8081/todo/v1/user/tasks?user_id=3" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "content": "完成任务设计文档",
    "state": "pending"
  }'
```

### 创建任务（分配给执行者）

```bash
curl -X POST "http://localhost:8081/todo/v1/user/tasks?user_id=3" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "content": "实现用户登录功能",
    "state": "in_progress",
    "executor_id": 4
  }'
```

### 创建子任务

```bash
curl -X POST "http://localhost:8081/todo/v1/user/tasks?user_id=3" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "content": "子任务：设计数据库表结构",
    "state": "pending",
    "father_id": 1
  }'
```

### 更新任务

```bash
curl -X PUT "http://localhost:8081/todo/v1/user/tasks/1?user_id=3" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "完成任务设计文档（已更新）",
    "state": "in_progress"
  }'
```

### 更新任务状态为已完成

```bash
curl -X PUT "http://localhost:8081/todo/v1/user/tasks/2?user_id=4" \
  -H "X-User-ID: 22222222-2222-2222-2222-222222222222" \
  -H "X-User-Username: bob" \
  -H "Content-Type: application/json" \
  -d '{
    "state": "completed"
  }'
```

### 查询任务列表

```bash
curl -X GET "http://localhost:8081/todo/v1/user/tasks?project_id=1&user_id=3" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

### 批量删除任务

```bash
curl -X DELETE "http://localhost:8081/todo/v1/user/tasks?user_id=3" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "task_ids": [1, 2, 3]
  }'
```
