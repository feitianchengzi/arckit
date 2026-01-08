# 前后端 API 对接文档

**项目**: 待办管理系统  
**前端**: React + Next.js  
**后端**: Go + Gin（已实现）  
**创建日期**: 2024-12-19

---

## 基础信息

### API 基础路径

```
http://localhost:8081/{service}/v1/{auth_level}/{path}
```

- **service**: `todo` (通过环境变量 `SERVICE_NAME` 配置)
- **version**: `v1`
- **auth_level**: `public` | `user` | `apikey`

### 认证机制

1. **网关统一认证**：
   - 前端从网关获取 JWT token
   - 前端每次请求携带 token（`Authorization: Bearer <token>`）
   - 网关验证 token 后，转发请求到后端并添加 Header：
     - `X-User-ID`: 用户 UUID
     - `X-User-Username`: 用户名

2. **前端实现**：
   ```typescript
   // Axios 配置示例
   const apiClient = axios.create({
     baseURL: process.env.NEXT_PUBLIC_API_URL, // http://localhost:8081/todo/v1
     headers: {
       'Content-Type': 'application/json'
     }
   })
   
   // 请求拦截器：添加 token
   apiClient.interceptors.request.use(config => {
     const token = localStorage.getItem('auth_token')
     if (token) {
       config.headers.Authorization = `Bearer ${token}`
     }
     return config
   })
   ```

---

## API 端点列表

### 1. 健康检查

**路径**: `GET /todo/v1/public/health`  
**认证**: public（无需认证）

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-05T10:51:18Z",
  "service": "todo"
}
```

---

### 2. 用户管理

#### 2.1 创建用户

**路径**: `POST /todo/v1/user/users`  
**认证**: user（需要 JWT）

**请求**:
```json
{
  "username": "alice",
  "avatar": "https://example.com/avatar.png"
}
```

**响应**:
```json
{
  "id": 1,
  "uuid": "11111111-1111-1111-1111-111111111111",
  "username": "alice",
  "avatar": "https://example.com/avatar.png",
  "created_at": "2026-01-05T10:51:18Z",
  "updated_at": "2026-01-05T10:51:18Z"
}
```

#### 2.2 查询用户

**路径**: `GET /todo/v1/user/users/:uuid`  
**认证**: user

**响应**: 同 2.1

#### 2.3 更新用户

**路径**: `PUT /todo/v1/user/users/:uuid`  
**认证**: user

**请求**:
```json
{
  "username": "alice_new",
  "avatar": "https://example.com/new_avatar.png"
}
```

---

### 3. 项目管理

#### 3.1 创建项目

**路径**: `POST /todo/v1/user/projects`  
**认证**: user

**请求**:
```json
{
  "name": "电商平台开发",
  "git_url": "https://github.com/team/ecommerce.git"
}
```

**响应**:
```json
{
  "id": 1,
  "name": "电商平台开发",
  "git_url": "https://github.com/team/ecommerce.git",
  "creator_id": 1,
  "created_at": "2026-01-05T10:51:18Z",
  "updated_at": "2026-01-05T10:51:18Z"
}
```

#### 3.2 查询用户参与的项目

**路径**: `GET /todo/v1/user/projects`  
**认证**: user

**响应**:
```json
[
  {
    "id": 1,
    "name": "电商平台开发",
    "git_url": "https://github.com/team/ecommerce.git",
    "creator_id": 1,
    "role": "owner",
    "created_at": "2026-01-05T10:51:18Z",
    "updated_at": "2026-01-05T10:51:18Z"
  }
]
```

**注意**: 响应中包含用户在该项目的角色（`role`）

#### 3.3 更新项目

**路径**: `PUT /todo/v1/user/projects/:id`  
**认证**: user

**请求**:
```json
{
  "name": "新项目名称",
  "git_url": "https://github.com/team/new-repo.git"
}
```

**权限**: 仅 owner 和 admin 可以更新

#### 3.4 删除项目

**路径**: `DELETE /todo/v1/user/projects/:id`  
**认证**: user

**权限**: 仅 owner 可以删除

---

### 4. 项目成员管理

#### 4.1 生成邀请码

**路径**: `POST /todo/v1/user/projects/:id/invitations`  
**认证**: user

**请求**:
```json
{
  "role": "member",
  "expires_at": "2026-01-12T10:51:18Z"
}
```

**参数说明**:
- `role`: 邀请角色（`owner`, `admin`, `member`）
- `expires_at`: 过期时间（可选，null 表示永不过期）

**响应**:
```json
{
  "id": 1,
  "project_id": 1,
  "invite_code": "a1b2c3d4e5f6...（64字符）",
  "role": "member",
  "inviter_id": 1,
  "expires_at": "2026-01-12T10:51:18Z",
  "used_at": null,
  "created_at": "2026-01-05T10:51:18Z",
  "updated_at": "2026-01-05T10:51:18Z"
}
```

**前端处理**:
```typescript
// 生成邀请链接
const inviteLink = `${window.location.origin}/invite/${inviteCode}`
```

#### 4.2 加入项目

**路径**: `POST /todo/v1/user/projects/join`  
**认证**: user

**请求**:
```json
{
  "invite_code": "a1b2c3d4e5f6..."
}
```

**响应**:
```json
{
  "message": "成功加入项目",
  "project_id": 1,
  "role": "member"
}
```

**错误响应**:
- `400`: 邀请码无效或已过期
- `409`: 用户已是项目成员

#### 4.3 删除项目成员

**路径**: `DELETE /todo/v1/user/projects/:id/members`  
**认证**: user

**请求**:
```json
{
  "user_id": 2
}
```

**权限**: 仅 owner 和 admin 可以删除成员

#### 4.4 设置成员角色

**路径**: `PUT /todo/v1/user/projects/:id/members/role`  
**认证**: user

**请求**:
```json
{
  "user_id": 2,
  "role": "admin"
}
```

**权限**: 仅 owner 可以设置角色

---

### 5. 任务管理

#### 5.1 创建任务

**路径**: `POST /todo/v1/user/tasks`  
**认证**: user

**请求**:
```json
{
  "project_id": 1,
  "content": "完成任务设计",
  "state": "pending",
  "executor_id": 2,
  "father_id": null
}
```

**参数说明**:
- `project_id`: 项目 ID（必需）
- `content`: 任务内容（必需）
- `state`: 任务状态（可选，默认 `pending`）
- `executor_id`: 执行人 ID（可选）
- `father_id`: 父任务 ID（可选，用于子任务）

**响应**:
```json
{
  "id": 1,
  "project_id": 1,
  "father_id": null,
  "content": "完成任务设计",
  "state": "pending",
  "creator_id": 1,
  "executor_id": 2,
  "created_at": "2026-01-05T10:51:18Z",
  "updated_at": "2026-01-05T10:51:18Z",
  "completion_at": null
}
```

#### 5.2 更新任务

**路径**: `PUT /todo/v1/user/tasks/:id`  
**认证**: user

**请求**:
```json
{
  "content": "更新后的任务内容",
  "state": "in_progress",
  "executor_id": 3
}
```

**权限**:
- owner/admin: 可以更新任意任务
- member: 只能更新自己创建或分配给自己执行的任务

#### 5.3 查询任务列表

**路径**: `GET /todo/v1/user/tasks`  
**认证**: user

**查询参数**:
- `project_id`: 项目 ID（必需）
- `state`: 任务状态（可选，筛选）
- `executor_id`: 执行人 ID（可选，筛选）
- `creator_id`: 创建人 ID（可选，筛选）

**示例**:
```
GET /todo/v1/user/tasks?project_id=1&state=pending
```

**响应**:
```json
[
  {
    "id": 1,
    "project_id": 1,
    "father_id": null,
    "content": "完成任务设计",
    "state": "pending",
    "creator_id": 1,
    "executor_id": 2,
    "created_at": "2026-01-05T10:51:18Z",
    "updated_at": "2026-01-05T10:51:18Z",
    "completion_at": null,
    "creator": {
      "id": 1,
      "username": "alice"
    },
    "executor": {
      "id": 2,
      "username": "bob"
    }
  }
]
```

#### 5.4 批量删除任务

**路径**: `DELETE /todo/v1/user/tasks`  
**认证**: user

**请求**:
```json
{
  "task_ids": [1, 2, 3]
}
```

**权限**: 同更新任务

---

## 前端适配建议

### 1. 字段映射

```typescript
// 前端模型（Todo）
interface Todo {
  id: number
  title: string        // 从 content 截取前 50 字符
  content: string      // 映射到后端 content
  status: TodoStatus   // 映射到后端 state
  assigneeId: number   // 映射到后端 executor_id
  creatorId: number    // 映射到后端 creator_id
  projectId: number    // 映射到后端 project_id
  parentId?: number    // 映射到后端 father_id
}

// 后端模型（Task）
interface Task {
  id: number
  content: string
  state: string
  executor_id: number
  creator_id: number
  project_id: number
  father_id?: number
}

// 映射函数
function mapTaskToTodo(task: Task): Todo {
  return {
    id: task.id,
    title: task.content.substring(0, 50), // 截取前 50 字符作为标题
    content: task.content,
    status: mapState(task.state),
    assigneeId: task.executor_id,
    creatorId: task.creator_id,
    projectId: task.project_id,
    parentId: task.father_id
  }
}

function mapTodoToTask(todo: Partial<Todo>): Partial<Task> {
  return {
    content: todo.content,
    state: mapStatus(todo.status),
    executor_id: todo.assigneeId,
    project_id: todo.projectId,
    father_id: todo.parentId
  }
}
```

### 2. 状态映射

```typescript
enum TodoStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  BLOCKED = 'BLOCKED'
}

const statusMap: Record<string, TodoStatus> = {
  'pending': TodoStatus.PENDING,
  'in_progress': TodoStatus.IN_PROGRESS,
  'completed': TodoStatus.COMPLETED,
  'cancelled': TodoStatus.CANCELLED,
  'blocked': TodoStatus.BLOCKED
}

const stateMap: Record<TodoStatus, string> = {
  [TodoStatus.PENDING]: 'pending',
  [TodoStatus.IN_PROGRESS]: 'in_progress',
  [TodoStatus.COMPLETED]: 'completed',
  [TodoStatus.CANCELLED]: 'cancelled',
  [TodoStatus.BLOCKED]: 'blocked'
}
```

### 3. API 客户端封装

```typescript
// lib/api/client.ts
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/todo/v1',
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token 过期，跳转登录
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// lib/api/endpoints/tasks.ts
export const tasksApi = {
  list: (projectId: number, params?: { state?: string }) =>
    apiClient.get('/user/tasks', { params: { project_id: projectId, ...params } }),
  
  create: (data: Partial<Task>) =>
    apiClient.post('/user/tasks', data),
  
  update: (id: number, data: Partial<Task>) =>
    apiClient.put(`/user/tasks/${id}`, data),
  
  delete: (taskIds: number[]) =>
    apiClient.delete('/user/tasks', { data: { task_ids: taskIds } })
}
```

### 4. React Query 集成

```typescript
// hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/lib/api/endpoints/tasks'

export function useTasks(projectId: number, state?: string) {
  return useQuery({
    queryKey: ['tasks', projectId, state],
    queryFn: () => tasksApi.list(projectId, { state }).then(res => res.data)
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: tasksApi.create,
    onSuccess: (data, variables) => {
      // 使任务列表缓存失效
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.project_id] })
    }
  })
}
```

---

## 错误处理

### 错误响应格式

```json
{
  "error": "错误信息描述"
}
```

### HTTP 状态码

- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未认证或认证失败
- `403 Forbidden`: 权限不足
- `404 Not Found`: 资源不存在
- `409 Conflict`: 资源冲突（如已是项目成员）
- `500 Internal Server Error`: 服务器内部错误

---

## 开发环境配置

**前端环境变量** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8081/todo/v1
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8080
```

**后端配置** (`.env`):
```env
PORT=8081
HOST=0.0.0.0
SERVICE_NAME=todo
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=todo
CORS_ALLOW_ORIGINS=http://localhost:3000
```

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

