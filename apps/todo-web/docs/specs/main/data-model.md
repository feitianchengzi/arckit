# 数据模型设计（基于现有后端）

**项目**: 待办管理系统  
**创建日期**: 2024-12-19  
**数据库**: PostgreSQL  
**ORM**: GORM (Go)  
**状态**: 基于现有后端实现

---

## 实体关系图 (ERD)

```
User ──┬── Project (creator)
       │
       ├── ProjectMember (many-to-many)
       │
       ├── Task (creator)
       │
       ├── Task (executor)
       │
       └── ProjectInvitation (inviter)

Project ──┬── Task (one-to-many)
          │
          ├── ProjectMember (many-to-many)
          │
          └── ProjectInvitation (one-to-many)

Task ──── Task (parent-child, self-referential)
```

---

## 实体定义（基于现有后端）

### 1. User (用户)

**表名**: `users`

**用途**: 系统用户，使用网关提供的 UUID 作为唯一标识

**字段**:
- `id`: uint (Primary Key, Auto Increment)
- `uuid`: string (Unique, 网关提供的用户 UUID)
- `username`: string (用户名)
- `avatar`: string? (可选，头像 URL)
- `created_at`: timestamp (创建时间)
- `updated_at`: timestamp (更新时间)

**索引**:
- Unique: `uuid`
- Index: `username`

**关系**:
- `created_projects`: Project[] (创建的项目)
- `project_memberships`: ProjectMember[] (参与的项目)
- `created_tasks`: Task[] (创建的任务)
- `executing_tasks`: Task[] (执行的任务)
- `sent_invitations`: ProjectInvitation[] (发送的邀请)

**注意事项**:
- 用户由网关创建，业务服务从请求头的 `X-User-ID` (UUID) 获取用户信息
- 业务服务需要时通过 UUID 查询或创建用户记录

---

### 2. Project (项目)

**表名**: `projects`

**用途**: 任务的容器，支持多成员协作

**字段**:
- `id`: uint (Primary Key, Auto Increment)
- `name`: string (项目名称, max 200 字符)
- `git_url`: string (Git 地址, max 500 字符)
- `creator_id`: uint (创建人 ID, Foreign Key → User.id)
- `created_at`: timestamp (创建时间)
- `updated_at`: timestamp (更新时间)

**验证规则**:
- `name`: 必填，长度 1-200 字符
- `git_url`: 必填，有效的 URL 格式

**关系**:
- `creator`: User (创建人，保留历史记录，不级联删除)
- `members`: ProjectMember[] (项目成员，级联删除)
- `tasks`: Task[] (项目任务，级联删除)
- `invitations`: ProjectInvitation[] (项目邀请，级联删除)

**索引**:
- Index: `name`, `git_url`, `creator_id`

---

### 3. ProjectMember (项目成员)

**表名**: `project_members`

**用途**: User 和 Project 的多对多关系，记录成员角色

**字段**:
- `id`: uint (Primary Key, Auto Increment)
- `project_id`: uint (项目 ID, Foreign Key → Project.id)
- `user_id`: uint (用户 ID, Foreign Key → User.id)
- `role`: string (角色: owner, admin, member, 默认 member)
- `created_at`: timestamp (加入时间)
- `updated_at`: timestamp (更新时间)

**角色定义**:
- `owner`: 所有者（项目创建者），拥有所有权限
- `admin`: 管理员，可以管理项目成员和任务
- `member`: 成员，可以创建任务，只能修改/删除自己创建或分配给自己执行的任务

**验证规则**:
- `project_id` + `user_id`: 唯一组合（一个用户在一个项目中只能有一条记录）
- `role`: 必须是 owner, admin, member 之一

**关系**:
- `project`: Project (级联删除)
- `user`: User

**索引**:
- Unique: `(project_id, user_id)`
- Index: `project_id`, `user_id`, `role`

---

### 4. Task (任务)

**表名**: `tasks`

**用途**: 任务项，支持父子关系和状态流转

**字段**:
- `id`: uint (Primary Key, Auto Increment)
- `project_id`: uint (项目 ID, Foreign Key → Project.id)
- `father_id`: uint? (可选，父任务 ID, Foreign Key → Task.id, self-referential)
- `content`: string (任务内容, text 类型)
- `state`: string (状态: pending, in_progress, completed, cancelled, blocked, 默认 pending)
- `creator_id`: uint (创建人 ID, Foreign Key → User.id)
- `executor_id`: uint? (可选，执行人 ID, Foreign Key → User.id)
- `created_at`: timestamp (创建时间)
- `updated_at`: timestamp (更新时间)
- `completion_at`: timestamp? (可选，完成时间)

**状态定义**:
- `pending`: 待处理（默认）
- `in_progress`: 进行中
- `completed`: 已完成
- `cancelled`: 已取消
- `blocked`: 已阻塞

**验证规则**:
- `content`: 必填
- `state`: 必须是有效状态值之一
- `executor_id`: 如果存在，必须是项目成员
- `father_id`: 如果存在，父任务必须属于同一项目

**关系**:
- `project`: Project (级联删除)
- `creator`: User (保留历史记录，不级联删除)
- `executor`: User? (保留历史记录，不级联删除)
- `parent`: Task? (父任务)
- `children`: Task[] (子任务，级联删除)

**索引**:
- Index: `project_id`, `father_id`, `state`, `creator_id`, `executor_id`

**状态转换**:
- 允许任意状态之间的转换
- 业务逻辑在 handler 层验证

---

### 5. ProjectInvitation (项目邀请)

**表名**: `project_invitations`

**用途**: 项目邀请，支持邀请码和过期时间

**字段**:
- `id`: uint (Primary Key, Auto Increment)
- `project_id`: uint (项目 ID, Foreign Key → Project.id)
- `invite_code`: string (邀请码, 64 字符, Unique)
- `role`: string (邀请角色: owner, admin, member, 默认 member)
- `inviter_id`: uint (邀请人 ID, Foreign Key → User.id)
- `expires_at`: timestamp? (可选，过期时间，null 表示永不过期)
- `used_at`: timestamp? (可选，使用时间，null 表示未使用)
- `created_at`: timestamp (创建时间)
- `updated_at`: timestamp (更新时间)

**验证规则**:
- `invite_code`: 必填，64 字符，唯一
- `role`: 必须是有效角色值之一
- `expires_at`: 如果设置，必须大于当前时间
- `inviter_id`: 必须是项目成员

**关系**:
- `project`: Project (级联删除)
- `inviter`: User (保留历史记录，不级联删除)

**业务逻辑**:
- `IsExpired()`: 检查邀请是否过期
- `IsUsed()`: 检查邀请是否已使用
- 邀请码格式：64 字符的随机字符串

**索引**:
- Unique: `invite_code`
- Index: `project_id`, `inviter_id`, `expires_at`

---

## 数据模型差异对比（设计 vs 实现）

| 实体 | 设计 | 现有实现 | 差异 |
|------|------|----------|------|
| User | 使用 email 作为唯一标识 | 使用 UUID（网关提供） | ✓ 实现更符合微服务架构 |
| Project | 包含 description 字段 | 包含 git_url 字段 | ✓ 实现关联 Git 仓库 |
| Task | 字段名 title/content | 字段名 content | ⚠️ 前端需适配 |
| Task | 包含 version 字段（乐观锁） | 无 version 字段 | ⚠️ 并发控制需其他方案 |
| TodoStatusHistory | 单独的状态历史表 | 未实现 | ⚠️ 状态历史功能缺失 |
| Comment | 评论功能 | 未实现 | ⚠️ 评论功能待开发 |

---

## 前端对接注意事项

### 1. 字段映射

**Task 字段映射**:
```typescript
// 前端设计（待办）
interface Todo {
  id: number
  title: string        // 映射到 content（前端可截取）
  content: string      // 映射到 content
  status: string       // 映射到 state
  assigneeId: number   // 映射到 executor_id
  // ...
}

// 后端实现（任务）
interface Task {
  id: number
  content: string      // 任务内容（完整）
  state: string        // 任务状态
  executor_id: number  // 执行人ID
  // ...
}
```

### 2. 状态映射

**前端 → 后端状态映射**:
```typescript
const statusMap = {
  'PENDING': 'pending',
  'IN_PROGRESS': 'in_progress',
  'COMPLETED': 'completed'
}
```

后端额外支持：`cancelled`, `blocked`

### 3. 用户认证

**前端需要实现**:
- 从网关获取 JWT token
- 存储 token（localStorage/sessionStorage）
- 每次请求携带 token（Authorization header）
- 网关验证后会转发 `X-User-ID` 到后端

### 4. 缺失功能

**需要前端自行实现或与后端协商**:
- ✅ 用户注册/登录（由网关处理）
- ⚠️ 评论功能（后端未实现，需开发）
- ⚠️ 状态历史（后端未实现，需开发）
- ⚠️ 并发编辑冲突检测（无乐观锁，需其他方案）

---

## API 对接路径

**后端 API 路由格式**: `/{service}/v1/{auth_level}/{path}`

**示例**:
- 创建项目: `POST /todo/v1/user/projects`
- 查询任务: `GET /todo/v1/user/tasks?project_id=1`
- 创建任务: `POST /todo/v1/user/tasks`

**认证级别**:
- `public`: 无需认证（如健康检查）
- `user`: 需要 JWT 认证（业务接口）
- `apikey`: 需要 API 密钥认证（系统接口）

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19  
**基于**: 现有 Go 后端实现（server/）
