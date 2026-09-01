# 项目相关接口

基础路径：`/workshop/v1/user/projects`  
认证：JWT；中间件 `ExtractUserID` 已注入当前用户 ID  
权限：除特别说明外需是项目成员；角色含 `owner` / `admin` / `member`

---

## 通用说明

### 项目成员角色

- `owner` - 所有者（项目创建者），拥有所有权限
- `admin` - 管理员，可以管理项目成员和任务
- `member` - 成员，可以创建任务，只能修改/删除自己创建或分配给自己执行的任务

---

## 实时通知（WebSocket）

**接口**: `GET /workshop/v1/user/projects/:id/ws`

**认证级别**: `user`（需要JWT认证）

**描述**: 连接项目房间，接收该项目内的变更事件（C/U/D）。WebSocket 是失效通知通道，REST 资源仍是真值来源。

**权限**: 仅项目成员可连接。

**连接示例**（测试环境）:

```
ws://localhost:8081/workshop/v1/user/projects/{project_id}/ws
```

**子协议（Sec-WebSocket-Protocol）**:
- 推荐命名为业务服务相关的子协议，例如：`workshop-ws`
- 服务端会回写选中的子协议，避免客户端因协议缺失而断开

**推荐握手示例**（同时携带业务子协议 + 鉴权子协议）:

```js
const ws = new WebSocket(
  "wss://<gateway>/workshop/v1/user/projects/<project_id>/ws",
  ["workshop-ws", `nebula-auth.${token}`]
);
```

**事件格式**:
```json
{
  "id": 1842,
  "schema_version": 1,
  "event": "task.created",
  "project_id": 12,
  "entity": "task",
  "subject_id": "41",
  "actor": {
    "id": 1,
    "username": "alice",
    "avatar": "https://example.com/avatar.png"
  },
  "occurred_at": "2026-02-04T12:34:56.789Z",
  "data": {
    "...": "..."
  }
}
```

**系统事件**:
- `system.connected` - 连接成功；`data.earliest_event_id` 与 `data.latest_event_id` 给出当前项目的保留边界。

**断线恢复**:

连接方应持久化最后一个完成 REST 刷新的事件 `id`。重连收到 `system.connected` 后，先调用：

`GET /workshop/v1/user/projects/:id/events?after_id=<cursor>&limit=500`

响应中的 `events` 按全局单调递增 `id` 排序，并包含 `next_after_id`、`has_more`、`earliest_event_id` 和 `latest_event_id`。重放期间先缓存 WebSocket 实时事件，重放结束后按 `id` 去重合并。只有对应 REST 刷新成功后才能推进本地 cursor。

事件默认保留 30 天。若 cursor 早于服务端保留边界，接口返回 `410` 与 `EVENT_CURSOR_EXPIRED`，客户端必须完成一次全量 REST 刷新，再将 cursor 推进到连接时的 `latest_event_id`。

**常见变更事件**（只推变更类事件，不推查询事件）:
- `project.created` / `project.updated` / `project.deleted`
- `project_member.created` / `project_member.updated` / `project_member.deleted`
- `project_invitation.created`
- `task.created` / `task.updated` / `task.deleted`
- `tag.created` / `tag.updated` / `tag.deleted`
- `task_attachment.created` / `task_attachment.updated` / `task_attachment.deleted`

**错误说明**:
- 非项目成员连接会返回 `403`。
- 连接采用标准 WebSocket Ping/Pong 心跳，断线后建议客户端自动重连。
- 服务端使用有界发送队列；慢消费者会被主动断开并通过上述重放接口恢复。
- 项目删除或成员权限被移除后，相关连接会在收到最终失效事件后关闭。

---

## 1. 创建项目

**接口**: `POST /workshop/v1/user/projects`

**认证级别**: `user`（需要JWT认证）

**描述**: 创建新项目，创建者自动成为项目所有者（owner）

**请求示例**:

**测试环境**:
```bash
curl -X POST "http://localhost:8081/workshop/v1/user/projects" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "电商平台开发",
    "git_url": "https://github.com/team/ecommerce.git"
  }'
```

**生产环境**:
```bash
curl -X POST "https://api.feitianchengzi.com/workshop/v1/user/projects" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "电商平台开发",
    "git_url": "https://github.com/team/ecommerce.git"
  }'
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 项目名称 |
| git_url | string | 否 | Git仓库地址（可选），不传或传空则不关联 Git |
| organization_id | uint | 否 | 组织ID（可选），不传则项目不关联组织；**仅允许组织成员创建** |

**响应示例** (`201 Created`):
```json
{
  "code": "OK",
  "data": {
    "id": 1,
    "name": "电商平台开发",
    "git_url": "https://github.com/team/ecommerce.git",
    "creator_id": 10,
    "members": [
      {
        "id": 1,
        "user_id": 10,
        "role": "owner",
        "duty": null,
        "username": "john_doe",
        "avatar": "https://example.com/avatar.png",
        "created_at": "2024-01-01T12:00:00Z",
        "is_me": true,
        "is_external": false
      }
    ]
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 项目ID |
| name | string | 项目名称 |
| git_url | string | Git仓库地址 |
| creator_id | uint | 创建者用户ID |
| members | array | 项目成员列表 |

**成员对象字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 成员关系ID |
| user_id | uint | 用户ID |
| role | string | 角色（owner/admin/member） |
| duty | string | 职能/职责描述（可选，可为 null） |
| username | string | 用户名 |
| avatar | string | 头像地址 |
| created_at | string | 加入时间（ISO 8601格式） |
| is_me | bool | 是否是当前用户自己 |
| is_external | bool | 是否为组织外部成员（通过邀请码加入且非项目所属组织成员时为 true） |

**特殊说明**:
- 创建项目时，创建者自动成为项目所有者（owner）
- `is_me` 字段表示该成员是否是当前登录用户自己
- 若传 `organization_id`，当前用户必须为该组织成员

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

**500 Internal Server Error**:
```json
{
  "code": "PROJECT_CREATE_FAILED",
  "error": {
    "message": "创建项目失败: ...",
    "details": null
  }
}
```

---

## 2. 查询用户参与的项目

**接口**: `GET /workshop/v1/user/projects`

**认证级别**: `user`（需要JWT认证）

**描述**: 查询当前登录用户参与的所有项目，每个项目包含完整的成员列表

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| include_deleted | bool | 否 | 是否包含已删除的记录（默认false） |
| organization_id | uint | 否 | 组织ID（可选，为空或0则查询组织ID为空的项目，否则查询指定组织ID的项目） |
| page | int | 否 | 页码（默认1） |
| page_size | int | 否 | 每页条数（默认50，最大200） |

**请求示例**:

**测试环境**:
```bash
curl -X GET "http://localhost:8081/workshop/v1/user/projects" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
curl -X GET "https://api.feitianchengzi.com/workshop/v1/user/projects" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "projects": [
      {
        "id": 1,
        "name": "电商平台开发",
        "git_url": "https://github.com/team/ecommerce.git",
        "creator_id": 10,
        "created_at": "2024-01-01T12:00:00Z",
        "updated_at": "2024-01-01T12:00:00Z",
        "deleted_at": null,
        "members": [
          {
            "id": 1,
            "user_id": 10,
            "role": "owner",
            "duty": null,
            "username": "john_doe",
            "avatar": "https://example.com/avatar.png",
            "created_at": "2024-01-01T12:00:00Z",
            "is_me": true,
            "is_external": false
          }
        ]
      }
    ],
    "total": 1
  },
  "meta": {
    "page": 1,
    "page_size": 50,
    "total": 1
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| projects | array | 项目列表 |
| total | int64 | 项目总数 |

**分页元数据字段说明（meta）**:

| 字段 | 类型 | 说明 |
|------|------|------|
| page | int | 当前页码 |
| page_size | int | 每页条数 |
| total | int | 总记录数 |

**项目对象字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 项目ID |
| name | string | 项目名称 |
| git_url | string | Git仓库地址 |
| creator_id | uint | 创建者用户ID |
| created_at | string | 创建时间（ISO 8601格式） |
| updated_at | string | 更新时间（ISO 8601格式） |
| deleted_at | string | 删除时间（ISO 8601格式，如果存在） |
| members | array | 项目成员列表 |

**成员对象字段说明**（与创建项目接口的成员对象一致）:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 成员关系ID |
| user_id | uint | 用户ID |
| role | string | 角色（owner/admin/member） |
| duty | string | 职能/职责描述（可选，可为 null） |
| username | string | 用户名 |
| avatar | string | 头像地址 |
| created_at | string | 加入时间（ISO 8601格式） |
| is_me | bool | 是否是当前用户自己 |
| is_external | bool | 是否为组织外部成员 |

**特殊说明**:
- `include_deleted` 参数用于查询包含已删除（软删除）的项目
- 当 `include_deleted=true` 时，响应中的 `deleted_at` 字段会显示删除时间（如果项目已删除）
- 默认情况下（`include_deleted=false`），只返回未删除的项目
- 接口强制分页：未传 `page` / `page_size` 时，使用默认值 `page=1`、`page_size=50`
- `organization_id` 参数用于按组织过滤项目：
  - 不提供或为 `0`：返回不属于任何组织的项目（`organization_id IS NULL`）+ 当前用户在该项目中为外部成员的项目（`is_external = true`）
  - 提供有效值：只返回属于该组织的项目（`organization_id = ?`）

**查询包含已删除的项目**:

**测试环境**:
```bash
curl -X GET "http://localhost:8081/workshop/v1/user/projects?include_deleted=true" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
curl -X GET "https://api.feitianchengzi.com/workshop/v1/user/projects?include_deleted=true" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**查询指定组织的项目**:

**测试环境**:
```bash
curl -X GET "http://localhost:8081/workshop/v1/user/projects?organization_id=1" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
curl -X GET "https://api.feitianchengzi.com/workshop/v1/user/projects?organization_id=1" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**查询不属于任何组织的项目**:

**测试环境**:
```bash
curl -X GET "http://localhost:8081/workshop/v1/user/projects?organization_id=0" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
curl -X GET "https://api.feitianchengzi.com/workshop/v1/user/projects?organization_id=0" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**错误响应**:

**500 Internal Server Error**:
```json
{
  "code": "PROJECT_QUERY_FAILED",
  "error": {
    "message": "查询项目失败: ...",
    "details": null
  }
}
```

---

## 3. 更新项目

**接口**: `PUT /workshop/v1/user/projects/:id`

**认证级别**: `user`（需要JWT认证）

**权限规则**: 只有 `owner` 和 `admin` 可以更新项目信息

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 项目ID |

**请求示例**:

**测试环境**:
```bash
PROJECT_ID=1

curl -X PUT "http://localhost:8081/workshop/v1/user/projects/$PROJECT_ID" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新项目名称",
    "git_url": "https://github.com/team/new-repo.git"
  }'
```

**生产环境**:
```bash
PROJECT_ID=1

curl -X PUT "https://api.feitianchengzi.com/workshop/v1/user/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新项目名称",
    "git_url": "https://github.com/team/new-repo.git"
  }'
```

**请求字段说明**（所有字段均为可选，但至少提供一个）:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 项目名称 |
| git_url | string | 否 | Git仓库地址 |
| organization_id | uint | 否 | 组织ID（可选）。**临时迁移字段，后续将移除** |

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "id": 1,
    "name": "新项目名称",
    "git_url": "https://github.com/team/new-repo.git",
    "creator_id": 10,
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:01:00Z",
    "members": [...]
  }
}
```

**响应字段说明**: 同创建项目接口，包含完整的成员列表

**特殊说明**:
- `organization_id` 为临时迁移字段，后续版本将移除，请勿长期依赖
- 当前版本**不校验**组织成员身份，仅用于历史项目迁移，后续将收紧

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
  "code": "PROJECT_NO_PERMISSION",
  "error": {
    "message": "您没有权限更新此项目，只有项目所有者和管理员可以更新",
    "details": null
  }
}
```

**404 Not Found**:
```json
{
  "code": "PROJECT_NOT_FOUND",
  "error": {
    "message": "项目不存在",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "PROJECT_UPDATE_FAILED",
  "error": {
    "message": "更新项目失败: ...",
    "details": null
  }
}
```

---

## 4. 删除项目

**接口**: `DELETE /workshop/v1/user/projects/:id`

**认证级别**: `user`（需要JWT认证）

**权限规则**: 只有项目所有者（owner）可以删除项目

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 项目ID |

**请求示例**:

**测试环境**:
```bash
PROJECT_ID=1

curl -X DELETE "http://localhost:8081/workshop/v1/user/projects/$PROJECT_ID" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
PROJECT_ID=1

curl -X DELETE "https://api.feitianchengzi.com/workshop/v1/user/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "message": "项目删除成功"
  }
}
```

**特殊说明**:
- 删除项目会级联删除项目成员和任务

**错误响应**:

**403 Forbidden**:
```json
{
  "code": "PROJECT_NO_PERMISSION",
  "error": {
    "message": "您没有权限删除此项目，只有项目所有者可以删除",
    "details": null
  }
}
```

**404 Not Found**:
```json
{
  "code": "PROJECT_NOT_FOUND",
  "error": {
    "message": "项目不存在",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "PROJECT_DELETE_FAILED",
  "error": {
    "message": "删除项目失败: ...",
    "details": null
  }
}
```

---

## 5. 邀请项目成员（生成邀请码）

**接口**: `POST /workshop/v1/user/projects/:id/invitations`

**认证级别**: `user`（需要JWT认证）

**权限规则**: 只有 `owner` 和 `admin` 可以邀请成员

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 项目ID |

**请求示例**:

**测试环境**:
```bash
PROJECT_ID=1

curl -X POST "http://localhost:8081/workshop/v1/user/projects/$PROJECT_ID/invitations" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "member",
    "expires_in": 24,
    "max_uses": 5
  }'
```

**生产环境**:
```bash
PROJECT_ID=1

curl -X POST "https://api.feitianchengzi.com/workshop/v1/user/projects/$PROJECT_ID/invitations" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "member",
    "expires_in": 24,
    "max_uses": 5
  }'
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| role | string | 否 | 邀请的角色（可选，默认为 "member"），可选值：`member`, `admin` |
| expires_in | int | 否 | 过期时间（小时，可选），0 表示永不过期 |
| max_uses | int | 否 | 最大使用次数（可选，默认1），同一个邀请码最多可以被使用多少次 |

**响应示例** (`201 Created`):
```json
{
  "code": "OK",
  "data": {
    "invite_code": "ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234",
    "invite_link": "/join?code=ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234",
    "role": "member",
    "max_uses": 5,
    "used_count": 0,
    "expires_at": "2024-01-02T12:00:00Z",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| invite_code | string | 邀请码 |
| invite_link | string | 邀请链接 |
| role | string | 邀请的角色 |
| max_uses | int | 最大使用次数 |
| used_count | int | 已使用次数 |
| expires_at | string | 过期时间（ISO 8601格式） |
| created_at | string | 创建时间（ISO 8601格式） |

**错误响应**:

**403 Forbidden**:
```json
{
  "code": "PROJECT_NO_PERMISSION",
  "error": {
    "message": "您没有权限邀请成员，只有项目所有者和管理员可以邀请",
    "details": null
  }
}
```

**404 Not Found**:
```json
{
  "code": "PROJECT_NOT_FOUND",
  "error": {
    "message": "项目不存在",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "PROJECT_INVITE_FAILED",
  "error": {
    "message": "生成邀请码失败: ...",
    "details": null
  }
}
```

---

## 6. 添加项目成员（通过组织成员ID）

**接口**: `POST /workshop/v1/user/projects/:id/members`

**认证级别**: `user`（需要JWT认证）

**权限规则**: 无权限限制，任何已认证用户均可调用。仅校验项目存在、项目已关联组织、组织成员存在且属于该项目所在组织。

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 项目ID |

**描述**: 通过组织成员ID将对应用户直接加入为项目成员。项目必须已关联组织，且组织成员必须属于该项目所在组织。若该用户已是项目成员，则幂等返回当前成员信息。

**请求示例**:

**测试环境**:
```bash
PROJECT_ID=1

curl -X POST "http://localhost:8081/workshop/v1/user/projects/$PROJECT_ID/members" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_member_id": 5
  }'
```

**生产环境**:
```bash
PROJECT_ID=1

curl -X POST "https://api.feitianchengzi.com/workshop/v1/user/projects/$PROJECT_ID/members" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_member_id": 5
  }'
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| organization_member_id | uint | 是 | 组织成员ID（组织成员表主键） |

**响应示例** (`201 Created` - 新加入):
```json
{
  "code": "OK",
  "data": {
    "id": 4,
    "project_id": 1,
    "user_id": 12,
    "role": "member",
    "username": "jane_doe",
    "avatar": "https://example.com/avatar.png",
    "created_at": "2024-01-01T12:10:00Z",
    "is_external": false
  }
}
```

**响应示例** (`200 OK` - 已是成员，幂等):
```json
{
  "code": "OK",
  "data": {
    "id": 3,
    "project_id": 1,
    "user_id": 12,
    "role": "member",
    "username": "jane_doe",
    "avatar": "https://example.com/avatar.png",
    "created_at": "2024-01-01T12:00:00Z",
    "is_external": false
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 成员关系ID（project_members 主键） |
| project_id | uint | 项目ID |
| user_id | uint | 用户ID |
| role | string | 角色（新加入固定为 "member"） |
| username | string | 用户名 |
| avatar | string | 头像地址 |
| created_at | string | 加入时间（ISO 8601格式） |
| is_external | bool | 是否为组织外部成员（通过组织成员添加的均为 false） |

**特殊说明**:
- 项目必须已关联组织（`organization_id` 非空），否则返回 400。
- 组织成员必须属于该项目所在组织，否则返回 400。
- 若该用户已是项目成员，返回 200 及当前成员信息（幂等）。

**错误响应**:

**400 Bad Request** - 项目未关联组织:
```json
{
  "code": "BAD_REQUEST",
  "error": {
    "message": "该项目未关联组织，无法通过组织成员添加",
    "details": null
  }
}
```

**400 Bad Request** - 组织成员不属于项目所在组织:
```json
{
  "code": "BAD_REQUEST",
  "error": {
    "message": "该组织成员不属于本项目所在组织",
    "details": null
  }
}
```

**404 Not Found** - 项目不存在:
```json
{
  "code": "PROJECT_NOT_FOUND",
  "error": {
    "message": "项目不存在",
    "details": null
  }
}
```

**404 Not Found** - 组织成员不存在:
```json
{
  "code": "BAD_REQUEST",
  "error": {
    "message": "组织成员不存在",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "PROJECT_CREATE_FAILED",
  "error": {
    "message": "添加项目成员失败: ...",
    "details": null
  }
}
```

---

## 7. 加入项目（使用邀请码）

**接口**: `POST /workshop/v1/user/projects/join`

**认证级别**: `user`（需要JWT认证）

**描述**: 使用邀请码加入项目

**请求示例**:

**测试环境**:
```bash
curl -X POST "http://localhost:8081/workshop/v1/user/projects/join" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "invite_code": "ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234"
  }'
```

**生产环境**:
```bash
curl -X POST "https://api.feitianchengzi.com/workshop/v1/user/projects/join" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invite_code": "ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234"
  }'
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| invite_code | string | 是 | 邀请码 |

**响应示例** (`201 Created`):
```json
{
  "code": "OK",
  "data": {
    "id": 3,
    "project_id": 1,
    "user_id": 12,
    "role": "member",
    "project_name": "电商平台开发",
    "created_at": "2024-01-01T12:10:00Z",
    "is_external": true
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 成员关系ID |
| project_id | uint | 项目ID |
| user_id | uint | 用户ID |
| role | string | 角色 |
| project_name | string | 项目名称 |
| created_at | string | 加入时间（ISO 8601格式） |
| is_external | bool | 是否为组织外部成员：若项目关联组织且当前用户不是该组织成员则为 true，否则为 false |

**特殊说明**:
- 同一个邀请码可以被多人使用，最多使用次数由创建邀请时设置的 `max_uses` 决定（默认1次）
- 每次使用后，邀请码的 `used_count` 会递增，达到 `max_uses` 后无法继续使用
- 如果用户已经是项目成员，无法重复加入
- 通过邀请码加入时，若项目有关联组织且用户不是该组织成员，则 `is_external` 为 true

**错误响应**:

**400 Bad Request** - 邀请码无效:
```json
{
  "code": "PROJECT_INVITE_INVALID",
  "error": {
    "message": "邀请码无效",
    "details": null
  }
}
```

**400 Bad Request** - 邀请码已使用:
```json
{
  "code": "PROJECT_INVITE_USED",
  "error": {
    "message": "邀请码已达到最大使用次数",
    "details": null
  }
}
```

**400 Bad Request** - 邀请码已过期:
```json
{
  "code": "PROJECT_INVITE_EXPIRED",
  "error": {
    "message": "邀请码已过期",
    "details": null
  }
}
```

**400 Bad Request** - 已是成员:
```json
{
  "code": "PROJECT_ALREADY_MEMBER",
  "error": {
    "message": "您已经是该项目的成员",
    "details": null
  }
}
```

---

## 8. 删除项目成员

**接口**: `DELETE /workshop/v1/user/projects/:id/members`

**认证级别**: `user`（需要JWT认证）

**权限规则**:
- 任何成员都可以删除自己（不需要额外权限）
- `owner` 和 `admin` 可以删除其他成员
- 如果删除的是所有者，系统会自动转移所有权：
  - 优先选择第一个管理员改为所有者
  - 如果没有管理员，选择第一个成员改为所有者
  - 如果项目只有所有者一个人，删除失败

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 项目ID |

**请求示例**:

**测试环境**:
```bash
PROJECT_ID=1

# 删除其他成员（需要 owner/admin 权限）
curl -X DELETE "http://localhost:8081/workshop/v1/user/projects/$PROJECT_ID/members" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "target_user_id": 123
  }'

# 删除自己（任何成员都可以）
curl -X DELETE "http://localhost:8081/workshop/v1/user/projects/$PROJECT_ID/members" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "target_user_id": 456
  }'
```

**生产环境**:
```bash
PROJECT_ID=1

# 删除其他成员（需要 owner/admin 权限）
curl -X DELETE "https://api.feitianchengzi.com/workshop/v1/user/projects/$PROJECT_ID/members" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_user_id": 123
  }'

# 删除自己（任何成员都可以）
curl -X DELETE "https://api.feitianchengzi.com/workshop/v1/user/projects/$PROJECT_ID/members" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_user_id": 456
  }'
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| target_user_id | uint | 是 | 目标用户ID（数据库ID） |

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "message": "项目成员删除成功"
  }
}
```

**特殊说明**:
- 任何成员都可以删除自己，无需额外权限
- 删除他人需要 `owner` 或 `admin` 权限
- 无法删除项目所有者，项目至少需要保留一个成员
- 如果删除的是所有者自己，系统会自动转移所有权

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
  "code": "PROJECT_NO_PERMISSION",
  "error": {
    "message": "您没有权限删除此成员",
    "details": null
  }
}
```

**404 Not Found**:
```json
{
  "code": "PROJECT_NOT_FOUND",
  "error": {
    "message": "项目不存在",
    "details": null
  }
}
```

**500 Internal Server Error**:
```json
{
  "code": "PROJECT_DELETE_MEMBER_FAILED",
  "error": {
    "message": "删除项目成员失败: ...",
    "details": null
  }
}
```

---

## 9. 设置成员角色

**接口**: `PUT /workshop/v1/user/projects/:id/members/role`

**认证级别**: `user`（需要JWT认证）

**权限规则**: 只有项目所有者（owner）可以设置成员角色

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 项目ID |

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | uint | 是 | 用户ID（数据库ID），推荐使用查询参数，避免从UUID查询用户表 |

**请求示例**:

**测试环境**:
```bash
PROJECT_ID=1

curl -X PUT "http://localhost:8081/workshop/v1/user/projects/$PROJECT_ID/members/role?user_id=3" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "target_user_id": 123,
    "role": "admin"
  }'
```

**生产环境**:
```bash
PROJECT_ID=1

curl -X PUT "https://api.feitianchengzi.com/workshop/v1/user/projects/$PROJECT_ID/members/role?user_id=3" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_user_id": 123,
    "role": "admin"
  }'
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| target_user_id | uint | 是 | 目标用户ID |
| role | string | 否 | 角色（"admin" 或 "member"），与 duty 至少提供一个 |
| duty | string | 否 | 职能/职责描述，与 role 至少提供一个 |

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "id": 2,
    "project_id": 1,
    "user_id": 123,
    "role": "admin",
    "duty": "前端开发负责人",
    "username": "jane_doe",
    "avatar": "https://example.com/avatar.png",
    "updated_at": "2024-01-01T12:15:00Z"
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 成员关系ID |
| project_id | uint | 项目ID |
| user_id | uint | 用户ID |
| role | string | 角色 |
| duty | string | 职能/职责描述（可选，可为 null） |
| username | string | 用户名 |
| avatar | string | 头像地址 |
| updated_at | string | 更新时间（ISO 8601格式） |

**特殊说明**:
- 不能修改项目所有者（owner）的角色
- 只能将成员设置为 `admin` 或 `member`
- 可以单独更新 `duty` 而不修改 `role`
- 可以单独更新 `role` 而不修改 `duty`
- 也可以同时更新 `role` 和 `duty`

**错误响应**:

**400 Bad Request** - 无效角色:
```json
{
  "code": "BAD_REQUEST",
  "error": {
    "message": "无效的角色，仅支持 admin 或 member",
    "details": null
  }
}
```

**400 Bad Request** - 不能修改所有者:
```json
{
  "code": "PROJECT_NO_PERMISSION",
  "error": {
    "message": "不能修改项目所有者的角色",
    "details": null
  }
}
```

**403 Forbidden**:
```json
{
  "code": "PROJECT_NO_PERMISSION",
  "error": {
    "message": "只有项目所有者可以设置成员权限",
    "details": null
  }
}
```

**404 Not Found**:
```json
{
  "code": "PROJECT_NOT_MEMBER",
  "error": {
    "message": "目标用户不是项目成员",
    "details": null
  }
}
```

---

## 10. 查询组织所有项目（管理员）

**接口**: `GET /workshop/v1/user/organization/projects`

**认证级别**: `user`（需要JWT认证）

**描述**: 管理员查询组织下的所有项目，返回每个项目的成员列表

**权限规则**: 只有组织所有者（owner）或管理员（admin）可以查询

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| organization_id | uint | 是 | 组织ID |
| page | int | 否 | 页码（默认1） |
| page_size | int | 否 | 每页条数（默认50，最大200） |

**请求示例**:

**测试环境**:
```bash
ORG_ID=1

curl -X GET "http://localhost:8081/workshop/v1/user/organization/projects?organization_id=$ORG_ID" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
ORG_ID=1

curl -X GET "https://api.feitianchengzi.com/workshop/v1/user/organization/projects?organization_id=$ORG_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "projects": [
      {
        "id": 1,
        "name": "电商平台开发",
        "git_url": "https://github.com/team/ecommerce.git",
        "creator_id": 10,
        "created_at": "2024-01-01T12:00:00Z",
        "updated_at": "2024-01-02T12:00:00Z",
        "deleted_at": null,
        "members": [
          {
            "id": 1,
            "user_id": 10,
            "role": "owner",
            "duty": null,
            "username": "john_doe",
            "avatar": "https://example.com/avatar.png",
            "created_at": "2024-01-01T12:00:00Z",
            "is_me": true,
            "is_external": false
          }
        ]
      }
    ],
    "total": 1
  },
  "meta": {
    "page": 1,
    "page_size": 50,
    "total": 1
  }
}
```

**响应字段说明**: 同查询用户参与的项目接口

**特殊说明**:
- 接口强制分页：未传 `page` / `page_size` 时，使用默认值 `page=1`、`page_size=50`
- 不支持 `include_deleted`，默认只返回未删除的项目
