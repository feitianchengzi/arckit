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
| git_url | string | 是 | Git仓库地址 |

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
        "username": "john_doe",
        "avatar": "https://example.com/avatar.png",
        "created_at": "2024-01-01T12:00:00Z",
        "is_me": true
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
| username | string | 用户名 |
| avatar | string | 头像地址 |
| created_at | string | 加入时间（ISO 8601格式） |
| is_me | bool | 是否是当前用户自己 |

**特殊说明**:
- 创建项目时，创建者自动成为项目所有者（owner）
- `is_me` 字段表示该成员是否是当前登录用户自己

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
            "username": "john_doe",
            "avatar": "https://example.com/avatar.png",
            "created_at": "2024-01-01T12:00:00Z",
            "is_me": true
          }
        ]
      }
    ],
    "total": 1
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| projects | array | 项目列表 |
| total | int64 | 项目总数 |

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

**特殊说明**:
- `include_deleted` 参数用于查询包含已删除（软删除）的项目
- 当 `include_deleted=true` 时，响应中的 `deleted_at` 字段会显示删除时间（如果项目已删除）
- 默认情况下（`include_deleted=false`），只返回未删除的项目

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

## 6. 加入项目（使用邀请码）

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
    "created_at": "2024-01-01T12:10:00Z"
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

**特殊说明**:
- 同一个邀请码可以被多人使用，最多使用次数由创建邀请时设置的 `max_uses` 决定（默认1次）
- 每次使用后，邀请码的 `used_count` 会递增，达到 `max_uses` 后无法继续使用
- 如果用户已经是项目成员，无法重复加入

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

## 7. 删除项目成员

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

## 8. 设置成员角色

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
| role | string | 是 | 角色（仅支持 "admin" 或 "member"） |

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "id": 2,
    "project_id": 1,
    "user_id": 123,
    "role": "admin",
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
| username | string | 用户名 |
| avatar | string | 头像地址 |
| updated_at | string | 更新时间（ISO 8601格式） |

**特殊说明**:
- 不能修改项目所有者（owner）的角色
- 只能将成员设置为 `admin` 或 `member`

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
