# 组织相关接口

基础路径：`/workshop/v1/user/organizations`  
认证：JWT；中间件 `ExtractUserID` 已注入当前用户 ID  
权限：除特别说明外需是组织成员；角色含 `owner` / `admin` / `member`

---

## 通用说明

### 组织成员角色

- `owner` - 所有者（组织创建者），拥有所有权限
- `admin` - 管理员，可以管理组织成员和项目
- `member` - 成员，可以查看组织信息

---

## 1. 创建组织

**接口**: `POST /workshop/v1/user/organizations`

**认证级别**: `user`（需要JWT认证）

**描述**: 创建新组织，创建者自动成为组织所有者（owner）

**请求示例**:

**测试环境**:
```bash
curl -X POST "http://localhost:8081/workshop/v1/user/organizations" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "阿里巴巴技术团队",
    "description": "专注于电商平台开发"
  }'
```

**生产环境**:
```bash
curl -X POST "https://api.feitianchengzi.com/workshop/v1/user/organizations" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "阿里巴巴技术团队",
    "description": "专注于电商平台开发"
  }'
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 组织名称 |
| description | string | 否 | 组织描述 |

**响应示例** (`201 Created`):
```json
{
  "code": "OK",
  "data": {
    "id": 1,
    "name": "阿里巴巴技术团队",
    "description": "专注于电商平台开发",
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
    ],
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 组织ID |
| name | string | 组织名称 |
| description | string | 组织描述 |
| creator_id | uint | 创建者用户ID |
| members | array | 组织成员列表 |
| created_at | string | 创建时间（ISO 8601格式） |

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
- 创建组织时，创建者自动成为组织所有者（owner）
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
  "code": "ORGANIZATION_CREATE_FAILED",
  "error": {
    "message": "创建组织失败: ...",
    "details": null
  }
}
```

---

## 2. 查询用户参与的组织

**接口**: `GET /workshop/v1/user/organizations`

**认证级别**: `user`（需要JWT认证）

**描述**: 查询当前登录用户参与的所有组织

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| include_deleted | bool | 否 | 是否包含已删除的记录（默认false） |

**请求示例**:

**测试环境**:
```bash
curl -X GET "http://localhost:8081/workshop/v1/user/organizations" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
curl -X GET "https://api.feitianchengzi.com/workshop/v1/user/organizations" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "organizations": [
      {
        "id": 1,
        "name": "阿里巴巴技术团队",
        "description": "专注于电商平台开发",
        "creator_id": 10,
        "created_at": "2024-01-01T12:00:00Z",
        "updated_at": "2024-01-01T12:00:00Z",
        "deleted_at": null
      }
    ],
    "total": 1
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| organizations | array | 组织列表 |
| total | int64 | 组织总数 |

**组织对象字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 组织ID |
| name | string | 组织名称 |
| description | string | 组织描述 |
| creator_id | uint | 创建者用户ID |
| created_at | string | 创建时间（ISO 8601格式） |
| updated_at | string | 更新时间（ISO 8601格式） |
| deleted_at | string | 删除时间（ISO 8601格式，如果存在） |

**特殊说明**:
- `include_deleted` 参数用于查询包含已删除（软删除）的组织
- 当 `include_deleted=true` 时，响应中的 `deleted_at` 字段会显示删除时间（如果组织已删除）
- 默认情况下（`include_deleted=false`），只返回未删除的组织

---

## 3. 查询组织成员列表

**接口**: `GET /workshop/v1/user/organizations/:id/members`

**认证级别**: `user`（需要JWT认证）

**描述**: 查询指定组织的成员列表，只有组织成员可以查看

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uint | 是 | 组织ID |

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| include_deleted | bool | 否 | 是否包含已删除的记录（默认false） |

**请求示例**:

**测试环境**:
```bash
curl -X GET "http://localhost:8081/workshop/v1/user/organizations/1/members" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
curl -X GET "https://api.feitianchengzi.com/workshop/v1/user/organizations/1/members" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "members": [
      {
        "id": 1,
        "user_id": 10,
        "role": "owner",
        "username": "john_doe",
        "avatar": "https://example.com/avatar.png",
        "created_at": "2024-01-01T12:00:00Z",
        "is_me": true
      },
      {
        "id": 2,
        "user_id": 11,
        "role": "admin",
        "username": "jane_smith",
        "avatar": "https://example.com/avatar2.png",
        "created_at": "2024-01-02T12:00:00Z",
        "is_me": false
      }
    ],
    "total": 2
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| members | array | 组织成员列表 |
| total | int64 | 成员总数 |

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

**错误响应**:

**403 Forbidden**:
```json
{
  "code": "ORGANIZATION_NOT_MEMBER",
  "error": {
    "message": "您不是该组织的成员",
    "details": null
  }
}
```

**404 Not Found**:
```json
{
  "code": "ORGANIZATION_NOT_FOUND",
  "error": {
    "message": "组织不存在",
    "details": null
  }
}
```

---

## 4. 更新组织信息

**接口**: `PUT /workshop/v1/user/organizations/:id`

**认证级别**: `user`（需要JWT认证）

**描述**: 更新组织信息，只有组织所有者和管理员可以更新

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uint | 是 | 组织ID |

**权限规则**:
- `owner` / `admin`：可以更新组织信息
- `member`：无权限更新组织

**请求示例**:

**测试环境**:
```bash
curl -X PUT "http://localhost:8081/workshop/v1/user/organizations/1" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "阿里巴巴技术团队（更新）",
    "description": "专注于电商平台开发和AI技术"
  }'
```

**生产环境**:
```bash
curl -X PUT "https://api.feitianchengzi.com/workshop/v1/user/organizations/1" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "阿里巴巴技术团队（更新）",
    "description": "专注于电商平台开发和AI技术"
  }'
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 组织名称 |
| description | string | 否 | 组织描述 |

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "id": 1,
    "name": "阿里巴巴技术团队（更新）",
    "description": "专注于电商平台开发和AI技术",
    "creator_id": 10,
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T13:00:00Z"
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 组织ID |
| name | string | 组织名称 |
| description | string | 组织描述 |
| creator_id | uint | 创建者用户ID |
| created_at | string | 创建时间（ISO 8601格式） |
| updated_at | string | 更新时间（ISO 8601格式） |

**错误响应**:

**403 Forbidden**:
```json
{
  "code": "ORGANIZATION_NO_PERMISSION",
  "error": {
    "message": "您没有权限更新此组织，只有组织所有者和管理员可以更新",
    "details": null
  }
}
```

---

## 5. 删除组织

**接口**: `DELETE /workshop/v1/user/organizations/:id`

**认证级别**: `user`（需要JWT认证）

**描述**: 删除组织，只有组织所有者可以删除。删除组织会级联删除组织成员和项目。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uint | 是 | 组织ID |

**权限规则**:
- `owner`：可以删除组织
- `admin` / `member`：无权限删除组织

**请求示例**:

**测试环境**:
```bash
curl -X DELETE "http://localhost:8081/workshop/v1/user/organizations/1" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice"
```

**生产环境**:
```bash
curl -X DELETE "https://api.feitianchengzi.com/workshop/v1/user/organizations/1" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "message": "组织删除成功"
  }
}
```

**特殊说明**:
- 删除组织会级联删除组织成员和项目（依赖数据库外键约束的 ON DELETE CASCADE）
- 只有组织所有者可以删除组织

**错误响应**:

**403 Forbidden**:
```json
{
  "code": "ORGANIZATION_NO_PERMISSION",
  "error": {
    "message": "只有组织所有者可以删除组织",
    "details": null
  }
}
```

---

## 6. 邀请组织成员（生成邀请码）

**接口**: `POST /workshop/v1/user/organizations/:id/invitations`

**认证级别**: `user`（需要JWT认证）

**描述**: 生成组织邀请码，只有组织所有者和管理员可以邀请成员

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uint | 是 | 组织ID |

**权限规则**:
- `owner` / `admin`：可以邀请成员
- `member`：无权限邀请成员

**请求示例**:

**测试环境**:
```bash
curl -X POST "http://localhost:8081/workshop/v1/user/organizations/1/invitations" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "member",
    "expires_in": 24,
    "max_uses": 10
  }'
```

**生产环境**:
```bash
curl -X POST "https://api.feitianchengzi.com/workshop/v1/user/organizations/1/invitations" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "member",
    "expires_in": 24,
    "max_uses": 10
  }'
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| role | string | 否 | 邀请的角色（默认member） |
| expires_in | int | 否 | 过期时间（小时，0表示永不过期） |
| max_uses | int | 否 | 最大使用次数（默认1） |

**响应示例** (`201 Created`):
```json
{
  "code": "OK",
  "data": {
    "invite_code": "ABCD1234EFGH5678IJKL9012MNOP3456",
    "invite_link": "/join?code=ABCD1234EFGH5678IJKL9012MNOP3456",
    "role": "member",
    "max_uses": 10,
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
| role | string | 角色 |
| max_uses | int | 最大使用次数 |
| used_count | int | 已使用次数 |
| expires_at | string | 过期时间（ISO 8601格式，如果存在） |
| created_at | string | 创建时间（ISO 8601格式） |

**特殊说明**:
- 邀请码使用UUID生成，移除连字符并转换为大写
- `expires_in=0` 表示邀请码永不过期
- `max_uses` 默认为1，表示只能使用一次

**错误响应**:

**403 Forbidden**:
```json
{
  "code": "ORGANIZATION_NO_PERMISSION",
  "error": {
    "message": "您没有权限邀请组织成员，只有组织所有者和管理员可以邀请",
    "details": null
  }
}
```

---

## 7. 加入组织（使用邀请码）

**接口**: `POST /workshop/v1/user/organizations/join`

**认证级别**: `user`（需要JWT认证）

**描述**: 使用邀请码加入组织

**请求示例**:

**测试环境**:
```bash
curl -X POST "http://localhost:8081/workshop/v1/user/organizations/join" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "invite_code": "ABCD1234EFGH5678IJKL9012MNOP3456"
  }'
```

**生产环境**:
```bash
curl -X POST "https://api.feitianchengzi.com/workshop/v1/user/organizations/join" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invite_code": "ABCD1234EFGH5678IJKL9012MNOP3456"
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
    "organization_id": 1,
    "user_id": 12,
    "role": "member",
    "organization_name": "阿里巴巴技术团队",
    "created_at": "2024-01-01T13:00:00Z"
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 成员关系ID |
| organization_id | uint | 组织ID |
| user_id | uint | 用户ID |
| role | string | 角色 |
| organization_name | string | 组织名称 |
| created_at | string | 加入时间（ISO 8601格式） |

**错误响应**:

**400 Bad Request**:
```json
{
  "code": "ORGANIZATION_INVITE_EXPIRED",
  "error": {
    "message": "该邀请码已过期",
    "details": null
  }
}
```

```json
{
  "code": "ORGANIZATION_INVITE_USED",
  "error": {
    "message": "该邀请码已达到最大使用次数",
    "details": null
  }
}
```

```json
{
  "code": "ORGANIZATION_ALREADY_MEMBER",
  "error": {
    "message": "您已经是该组织的成员",
    "details": null
  }
}
```

**404 Not Found**:
```json
{
  "code": "ORGANIZATION_INVITE_INVALID",
  "error": {
    "message": "邀请码无效",
    "details": null
  }
}
```

---

## 8. 删除组织成员

**接口**: `DELETE /workshop/v1/user/organizations/:id/members`

**认证级别**: `user`（需要JWT认证）

**描述**: 删除组织成员，可以删除自己或由管理员删除其他成员

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uint | 是 | 组织ID |

**权限规则**:
- 可以删除自己（不需要额外权限）
- `owner` / `admin`：可以删除其他成员
- 如果所有者删除自己，需要转移所有权：
  1. 优先选择第一个管理员改为所有者
  2. 如果没有管理员，选择第一个成员改为所有者
  3. 如果组织只有所有者一个人，删除失败

**请求示例**:

**测试环境**:
```bash
curl -X DELETE "http://localhost:8081/workshop/v1/user/organizations/1/members" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "target_user_id": 11
  }'
```

**生产环境**:
```bash
curl -X DELETE "https://api.feitianchengzi.com/workshop/v1/user/organizations/1/members" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_user_id": 11
  }'
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| target_user_id | uint | 是 | 要删除的用户ID |

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "message": "组织成员删除成功"
  }
}
```

**错误响应**:

**400 Bad Request**:
```json
{
  "code": "ORGANIZATION_NO_PERMISSION",
  "error": {
    "message": "无法删除组织所有者，组织至少需要保留一个成员",
    "details": null
  }
}
```

**403 Forbidden**:
```json
{
  "code": "ORGANIZATION_NO_PERMISSION",
  "error": {
    "message": "您没有权限删除组织成员，只有组织所有者和管理员可以删除",
    "details": null
  }
}
```

---

## 9. 更新组织成员角色

**接口**: `PUT /workshop/v1/user/organizations/:id/members/role`

**认证级别**: `user`（需要JWT认证）

**描述**: 更新组织成员角色，只有组织所有者可以修改成员角色

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | uint | 是 | 组织ID |

**权限规则**:
- `owner`：可以修改成员角色（admin/member）
- `admin` / `member`：无权限修改成员角色
- 不能修改组织所有者的角色

**请求示例**:

**测试环境**:
```bash
curl -X PUT "http://localhost:8081/workshop/v1/user/organizations/1/members/role" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: alice" \
  -H "Content-Type: application/json" \
  -d '{
    "target_user_id": 11,
    "role": "admin"
  }'
```

**生产环境**:
```bash
curl -X PUT "https://api.feitianchengzi.com/workshop/v1/user/organizations/1/members/role" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_user_id": 11,
    "role": "admin"
  }'
```

**请求字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| target_user_id | uint | 是 | 要更新的用户ID |
| role | string | 是 | 目标角色（admin/member） |

**响应示例** (`200 OK`):
```json
{
  "code": "OK",
  "data": {
    "id": 2,
    "user_id": 11,
    "role": "admin",
    "username": "jane_smith",
    "avatar": "https://example.com/avatar2.png",
    "updated_at": "2024-01-01T14:00:00Z"
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 成员关系ID |
| user_id | uint | 用户ID |
| role | string | 角色 |
| username | string | 用户名 |
| avatar | string | 头像地址 |
| updated_at | string | 更新时间（ISO 8601格式） |

**错误响应**:

**400 Bad Request**:
```json
{
  "code": "BAD_REQUEST",
  "error": {
    "message": "无效的角色，仅支持 admin 或 member",
    "details": null
  }
}
```

```json
{
  "code": "ORGANIZATION_NO_PERMISSION",
  "error": {
    "message": "不能修改组织所有者的角色",
    "details": null
  }
}
```

**403 Forbidden**:
```json
{
  "code": "ORGANIZATION_NO_PERMISSION",
  "error": {
    "message": "只有组织所有者可以设置成员权限",
    "details": null
  }
}
```

---

## 错误代码说明

| 错误代码 | HTTP状态码 | 说明 |
|---------|-----------|------|
| ORGANIZATION_NOT_FOUND | 404 | 组织不存在 |
| ORGANIZATION_CREATE_FAILED | 500 | 创建组织失败 |
| ORGANIZATION_UPDATE_FAILED | 500 | 更新组织失败 |
| ORGANIZATION_QUERY_FAILED | 500 | 查询组织失败 |
| ORGANIZATION_NOT_MEMBER | 403 | 不是组织成员 |
| ORGANIZATION_NO_PERMISSION | 403 | 没有权限 |
| ORGANIZATION_ID_EMPTY | 400 | 组织ID不能为空 |
| ORGANIZATION_INVITE_INVALID | 404 | 邀请码无效 |
| ORGANIZATION_INVITE_USED | 400 | 邀请码已达到最大使用次数 |
| ORGANIZATION_INVITE_EXPIRED | 400 | 邀请码已过期 |
| ORGANIZATION_ALREADY_MEMBER | 400 | 已经是组织成员 |
