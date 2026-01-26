# 标签相关接口

基础路径：`/workshop/v1/user/projects/:id/tags` 或 `/workshop/v1/user/tags/:id`  
认证：JWT；中间件 `ExtractUserID` 已注入当前用户 ID  
权限：项目成员均可操作

---

## 1. 查询项目的所有标签

**接口**: `GET /workshop/v1/user/projects/:id/tags`

**认证级别**: `user`（需要JWT认证）

**权限要求**: 用户必须是项目成员（项目内所有成员均可操作）

**描述**: 查询指定项目的所有标签，按创建时间倒序排列。

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 项目ID |

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| include_deleted | bool | 否 | 是否包含已删除的记录（默认false） |

**请求示例**:

**测试环境**:
```bash
PROJECT_ID=1

curl -X GET "http://localhost:8081/todo/v1/user/projects/$PROJECT_ID/tags" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
PROJECT_ID=1

curl -X GET "https://api.feitianchengzi.com/workshop/v1/user/projects/$PROJECT_ID/tags" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": [
    {
      "id": 3,
      "project_id": 1,
      "name": "紧急",
      "created_at": "2024-01-01T15:00:00Z",
      "updated_at": "2024-01-01T15:00:00Z",
      "deleted_at": null
    },
    {
      "id": 2,
      "project_id": 1,
      "name": "重要",
      "created_at": "2024-01-01T14:00:00Z",
      "updated_at": "2024-01-01T14:00:00Z",
      "deleted_at": null
    },
    {
      "id": 1,
      "project_id": 1,
      "name": "开发",
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z",
      "deleted_at": null
    }
  ]
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 标签ID |
| project_id | uint | 项目ID |
| name | string | 标签名称 |
| created_at | string | 创建时间（ISO 8601格式） |
| updated_at | string | 更新时间（ISO 8601格式） |
| deleted_at | string | 删除时间（ISO 8601格式，如果存在） |

**查询包含已删除的标签**:

**测试环境**:
```bash
curl -X GET "http://localhost:8081/todo/v1/user/projects/$PROJECT_ID/tags?include_deleted=true" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
curl -X GET "https://api.feitianchengzi.com/workshop/v1/user/projects/$PROJECT_ID/tags?include_deleted=true" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**特殊说明**:
- `include_deleted` 参数用于查询包含已删除（软删除）的标签
- 当 `include_deleted=true` 时，响应中的 `deleted_at` 字段会显示删除时间（如果标签已删除）
- 默认情况下（`include_deleted=false`），只返回未删除的标签

**错误响应**:

**400 Bad Request**:
```json
{
  "code": "BAD_REQUEST",
  "error": {
    "message": "项目ID格式错误",
    "details": null
  }
}
```

**403 Forbidden**:
```json
{
  "code": "TAG_NOT_MEMBER",
  "error": {
    "message": "您不是该项目的成员，无法查看标签",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "TAG_QUERY_FAILED",
  "error": {
    "message": "查询标签失败: ...",
    "details": null
  }
}
```

---

## 2. 创建标签

**接口**: `POST /workshop/v1/user/projects/:id/tags`

**认证级别**: `user`（需要JWT认证）

**权限要求**: 用户必须是项目成员（项目内所有成员均可操作）

**描述**: 为指定项目创建新标签。同一项目内标签名称必须唯一。

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 项目ID |

**请求示例**:

**测试环境**:
```bash
PROJECT_ID=1

curl -X POST "http://localhost:8081/todo/v1/user/projects/$PROJECT_ID/tags" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "name": "重要"
  }'
```

**生产环境**:
```bash
PROJECT_ID=1

curl -X POST "https://api.feitianchengzi.com/workshop/v1/user/projects/$PROJECT_ID/tags" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "name": "重要"
  }'
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_id | uint | 是 | 项目ID（必须与URL路径中的项目ID一致） |
| name | string | 是 | 标签名称（必填，最大长度100字符） |

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "id": 1,
    "project_id": 1,
    "name": "重要",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z",
    "deleted_at": null
  }
}
```

**响应字段说明**: 同查询标签接口

**错误响应**:

**400 Bad Request** - 标签名称已存在:
```json
{
  "code": "BAD_REQUEST",
  "error": {
    "message": "该标签名称已存在",
    "details": null
  }
}
```

**403 Forbidden**:
```json
{
  "code": "TAG_NOT_MEMBER",
  "error": {
    "message": "您不是该项目的成员，无法创建标签",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "TAG_CREATE_FAILED",
  "error": {
    "message": "创建标签失败: ...",
    "details": null
  }
}
```

---

## 3. 更新标签

**接口**: `PUT /workshop/v1/user/tags/:id`

**认证级别**: `user`（需要JWT认证）

**权限要求**: 用户必须是项目成员（项目内所有成员均可操作）

**描述**: 更新指定标签的名称。同一项目内标签名称必须唯一（排除当前标签）。

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 标签ID |

**请求示例**:

**测试环境**:
```bash
TAG_ID=1

curl -X PUT "http://localhost:8081/todo/v1/user/tags/$TAG_ID" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "非常重要"
  }'
```

**生产环境**:
```bash
TAG_ID=1

curl -X PUT "https://api.feitianchengzi.com/workshop/v1/user/tags/$TAG_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "非常重要"
  }'
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 标签名称（必填，最大长度100字符） |

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "id": 1,
    "project_id": 1,
    "name": "非常重要",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T15:30:00Z",
    "deleted_at": null
  }
}
```

**响应字段说明**: 同查询标签接口

**错误响应**:

**400 Bad Request** - 标签名称已存在:
```json
{
  "code": "BAD_REQUEST",
  "error": {
    "message": "该标签名称已存在",
    "details": null
  }
}
```

**404 Not Found**:
```json
{
  "code": "TAG_NOT_FOUND",
  "error": {
    "message": "标签不存在",
    "details": null
  }
}
```

**403 Forbidden**:
```json
{
  "code": "TAG_NOT_MEMBER",
  "error": {
    "message": "您不是该项目的成员，无法更新标签",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "TAG_UPDATE_FAILED",
  "error": {
    "message": "更新标签失败: ...",
    "details": null
  }
}
```

---

## 4. 删除标签

**接口**: `DELETE /workshop/v1/user/tags/:id`

**认证级别**: `user`（需要JWT认证）

**权限要求**: 用户必须是项目成员（项目内所有成员均可操作）

**描述**: 删除指定标签。

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 标签ID |

**请求示例**:

**测试环境**:
```bash
TAG_ID=1

curl -X DELETE "http://localhost:8081/todo/v1/user/tags/$TAG_ID" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
TAG_ID=1

curl -X DELETE "https://api.feitianchengzi.com/workshop/v1/user/tags/$TAG_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": null
}
```

**特殊说明**:
- 删除标签不会影响已使用该标签的任务
- 删除操作为软删除，标签记录不会从数据库中物理删除

**错误响应**:

**400 Bad Request**:
```json
{
  "code": "BAD_REQUEST",
  "error": {
    "message": "标签ID格式错误",
    "details": null
  }
}
```

**404 Not Found**:
```json
{
  "code": "TAG_NOT_FOUND",
  "error": {
    "message": "标签不存在",
    "details": null
  }
}
```

**403 Forbidden**:
```json
{
  "code": "TAG_NOT_MEMBER",
  "error": {
    "message": "您不是该项目的成员，无法删除标签",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "TAG_DELETE_FAILED",
  "error": {
    "message": "删除标签失败: ...",
    "details": null
  }
}
```
