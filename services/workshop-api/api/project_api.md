# 项目相关接口

基础路径：`/{service}/v1/user/projects`  
认证：JWT；中间件 `ExtractUserID` 已注入当前用户 ID  
权限：除特别说明外需是项目成员；角色含 `owner` / `admin` / `member`

## 通用说明

- 所有接口通过中间件自动获取用户ID，无需手动查询用户表
- 项目成员角色：
  - `owner` - 所有者（项目创建者），拥有所有权限
  - `admin` - 管理员，可以管理项目成员和任务
  - `member` - 成员，可以创建任务，只能修改/删除自己创建或分配给自己执行的任务

---

## 1. 创建项目

**接口**: `POST /{service}/v1/user/projects`

**认证级别**: `user`（需要JWT认证）

**描述**: 创建新项目，创建者自动成为项目所有者（owner）

**请求体**:

```json
{
  "name": "电商平台开发",
  "git_url": "https://github.com/team/ecommerce.git"
}
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 项目名称 |
| git_url | string | 是 | Git仓库地址 |

**响应示例** (`201 Created`):

```json
{
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
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 项目ID |
| name | string | 项目名称 |
| git_url | string | Git仓库地址 |
| creator_id | uint | 创建者用户ID |
| members | array | 项目成员列表（包含创建者） |

**错误响应**:

- `400 Bad Request` - 请求参数错误或缺少用户ID
- `500 Internal Server Error` - 创建项目失败

---

## 2. 查询用户参与的项目

**接口**: `GET /{service}/v1/user/projects`

**认证级别**: `user`（需要JWT认证）

**描述**: 查询当前登录用户参与的所有项目，每个项目包含完整的成员列表

**查询参数**: 无（自动使用当前登录用户）

**响应示例** (`200 OK`):

```json
{
  "projects": [
    {
      "id": 1,
      "name": "电商平台开发",
      "git_url": "https://github.com/team/ecommerce.git",
      "creator_id": 10,
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z",
      "members": [
        {
          "id": 1,
          "user_id": 10,
          "role": "owner",
          "username": "john_doe",
          "avatar": "https://example.com/avatar.png",
          "created_at": "2024-01-01T12:00:00Z"
        },
        {
          "id": 2,
          "user_id": 11,
          "role": "member",
          "username": "jane_doe",
          "avatar": "https://example.com/avatar2.png",
          "created_at": "2024-01-01T12:05:00Z"
        }
      ]
    }
  ],
  "total": 1
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| projects | array | 项目列表 |
| total | int64 | 项目总数 |

**错误响应**:

- `400 Bad Request` - 缺少用户ID
- `500 Internal Server Error` - 查询项目失败

---

## 3. 更新项目

**接口**: `PUT /{service}/v1/user/projects/:id`

**认证级别**: `user`（需要JWT认证）

**权限规则**: 只有 `owner` 和 `admin` 可以更新项目信息

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 项目ID |

**请求体**（所有字段均为可选，但至少提供一个）:

```json
{
  "name": "新项目名称",
  "git_url": "https://github.com/team/new-repo.git"
}
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 项目名称 |
| git_url | string | 否 | Git仓库地址 |

**响应示例** (`200 OK`):

```json
{
  "id": 1,
  "name": "新项目名称",
  "git_url": "https://github.com/team/new-repo.git",
  "creator_id": 10,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:01:00Z",
  "members": [...]
}
```

**响应字段说明**: 同创建项目接口，包含完整的成员列表

**错误响应**:

- `400 Bad Request` - 请求参数错误或缺少用户ID
- `403 Forbidden` - 您没有权限更新此项目，只有项目所有者和管理员可以更新
- `404 Not Found` - 项目不存在或您不是该项目的成员
- `500 Internal Server Error` - 更新项目失败

---

## 4. 删除项目

**接口**: `DELETE /{service}/v1/user/projects/:id`

**认证级别**: `user`（需要JWT认证）

**权限规则**: 只有项目所有者（owner）可以删除项目

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 项目ID |

**响应示例** (`200 OK`):

```json
{
  "message": "项目删除成功"
}
```

**错误响应**:

- `400 Bad Request` - 项目ID不能为空或缺少用户ID
- `403 Forbidden` - 只有项目所有者可以删除项目或您不是该项目的成员
- `404 Not Found` - 项目不存在
- `500 Internal Server Error` - 删除项目失败

**注意事项**:

- 删除项目会级联删除项目成员和任务
- 只有项目所有者可以删除项目

---

## 5. 邀请项目成员（生成邀请码）

**接口**: `POST /{service}/v1/user/projects/:id/invitations`

**认证级别**: `user`（需要JWT认证）

**权限规则**: 只有 `owner` 和 `admin` 可以邀请成员

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 项目ID |

**请求体**:

```json
{
  "role": "member",
  "expires_in": 24
}
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| role | string | 否 | 邀请的角色（可选，默认为 "member"），可选值：member, admin |
| expires_in | int | 否 | 过期时间（小时，可选），0 表示永不过期 |

**响应示例** (`201 Created`):

```json
{
  "invite_code": "ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234",
  "invite_link": "/join?code=ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234",
  "role": "member",
  "expires_at": "2024-01-02T12:00:00Z",
  "created_at": "2024-01-01T12:00:00Z"
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| invite_code | string | 邀请码（唯一） |
| invite_link | string | 邀请链接 |
| role | string | 邀请的角色 |
| expires_at | string | 过期时间（ISO 8601格式，如果设置了过期时间） |
| created_at | string | 创建时间（ISO 8601格式） |

**错误响应**:

- `400 Bad Request` - 请求参数错误、无效的项目角色或缺少用户ID
- `403 Forbidden` - 您没有权限邀请项目成员，只有项目所有者和管理员可以邀请或您不是该项目的成员
- `404 Not Found` - 项目不存在
- `500 Internal Server Error` - 创建邀请失败

---

## 6. 加入项目（使用邀请码）

**接口**: `POST /{service}/v1/user/projects/join`

**认证级别**: `user`（需要JWT认证）

**描述**: 使用邀请码加入项目

**请求体**:

```json
{
  "invite_code": "ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234"
}
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| invite_code | string | 是 | 邀请码 |

**响应示例** (`201 Created`):

```json
{
  "id": 3,
  "project_id": 1,
  "user_id": 12,
  "role": "member",
  "project_name": "电商平台开发",
  "created_at": "2024-01-01T12:10:00Z"
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

**错误响应**:

- `400 Bad Request` - 请求参数错误、该邀请码已被使用、该邀请码已过期或缺少用户ID
- `403 Forbidden` - 您已经是该项目的成员
- `404 Not Found` - 邀请码无效或项目不存在
- `500 Internal Server Error` - 加入项目失败

**注意事项**:

- 邀请码使用后会被标记为已使用，不能重复使用
- 如果邀请码设置了过期时间，过期后无法使用
- 如果用户已经是项目成员，无法重复加入

---

## 7. 删除项目成员

**接口**: `DELETE /{service}/v1/user/projects/:id/members`

**认证级别**: `user`（需要JWT认证）

**权限规则**: `owner` 和 `admin` 可以删除任何成员

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 项目ID |

**请求体**:

```json
{
  "target_user_id": 123
}
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| target_user_id | uint | 是 | 要删除的用户ID |

**响应示例** (`200 OK`):

```json
{
  "message": "项目成员删除成功"
}
```

**错误响应**:

- `400 Bad Request` - 请求参数错误、无法删除项目所有者，项目至少需要保留一个成员或缺少用户ID
- `403 Forbidden` - 您没有权限删除项目成员，只有项目所有者和管理员可以删除或您不是该项目的成员
- `404 Not Found` - 项目不存在、该用户不是项目成员
- `500 Internal Server Error` - 删除项目成员失败

**特殊说明**:

- 如果删除的是所有者（owner）自己，需要转移所有权：
  1. 优先选择第一个管理员（admin）改为所有者
  2. 如果没有管理员，选择第一个成员（member）改为所有者
  3. 如果项目只有所有者一个人，删除失败
- 如果删除的是自己，直接使用已查询的成员信息，无需再次查询

---

## 8. 设置成员角色

**接口**: `PUT /{service}/v1/user/projects/:id/members/role`

**认证级别**: `user`（需要JWT认证）

**权限规则**: 只有项目所有者（owner）可以设置成员角色

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | uint | 项目ID |

**请求体**:

```json
{
  "target_user_id": 123,
  "role": "admin"
}
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| target_user_id | uint | 是 | 目标用户ID |
| role | string | 是 | 角色（仅支持 "admin" 或 "member"） |

**响应示例** (`200 OK`):

```json
{
  "id": 2,
  "project_id": 1,
  "user_id": 123,
  "role": "admin",
  "username": "jane_doe",
  "avatar": "https://example.com/avatar.png",
  "updated_at": "2024-01-01T12:15:00Z"
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

**错误响应**:

- `400 Bad Request` - 请求参数错误、无效的角色，仅支持 admin 或 member、不能修改项目所有者的角色或缺少用户ID
- `403 Forbidden` - 只有项目所有者可以设置成员权限或您不是该项目的成员
- `404 Not Found` - 项目不存在、目标用户不是项目成员
- `500 Internal Server Error` - 更新成员角色失败

**限制**:

- 不能修改项目所有者（owner）的角色
- 只能将成员设置为 `admin` 或 `member`

---

## 使用示例

### 创建项目

```bash
curl -X POST "https://api.example.com/todo-service/v1/user/projects" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "电商平台开发",
    "git_url": "https://github.com/team/ecommerce.git"
  }'
```

### 查询用户参与的项目

```bash
curl -X GET "https://api.example.com/todo-service/v1/user/projects?user_id=10" \
  -H "Authorization: Bearer <token>"
```

### 更新项目

```bash
curl -X PUT "https://api.example.com/todo-service/v1/user/projects/1" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新项目名称",
    "git_url": "https://github.com/team/new-repo.git"
  }'
```

### 邀请项目成员

```bash
curl -X POST "https://api.example.com/todo-service/v1/user/projects/1/invitations" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "member",
    "expires_in": 24
  }'
```

### 加入项目

```bash
curl -X POST "https://api.example.com/todo-service/v1/user/projects/join" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "invite_code": "ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234"
  }'
```

### 删除项目成员

```bash
curl -X DELETE "https://api.example.com/todo-service/v1/user/projects/1/members" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "target_user_id": 123
  }'
```

### 设置成员角色

```bash
curl -X PUT "https://api.example.com/todo-service/v1/user/projects/1/members/role" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "target_user_id": 123,
    "role": "admin"
  }'
```
