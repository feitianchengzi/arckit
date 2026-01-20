/**
 * 全局类型定义
 * 
 * 注意：
 * - 前端使用 Todo 模型
 * - 后端使用 Task 模型
 * - 需要通过 taskMapper 进行转换
 */

// ==================== User ====================

export interface User {
  id: number
  username: string
  avatar?: string
  created_at: string
  updated_at: string
}

// ==================== Project ====================

export interface Project {
  id: number
  name: string
  git_url: string
  creator_id: number
  created_at: string
  updated_at: string
  creator?: User
  members?: ProjectMember[]
}

export interface CreateProjectInput {
  name: string
  git_url: string
}

// ==================== Project Member ====================

export interface ProjectMember {
  id: number
  project_id: number
  user_id: number
  role: ProjectRole
  created_at: string
  updated_at: string
  user?: User
  // API 文档中，成员数据直接包含 username 和 avatar
  username?: string
  avatar?: string
}

export type ProjectRole = 'owner' | 'admin' | 'member'

// ==================== Todo (前端模型) ====================

export interface Todo {
  id: number
  title: string // 从 content 截取
  content: string
  status: TodoStatus
  assigneeId?: number // 对应后端 executor_id
  creatorId: number
  projectId: number
  parentId?: number // 对应后端 father_id
  createdAt: string
  updatedAt: string
  completionAt?: string
  assignee?: User
  creator?: User
  children?: Todo[]
  tags?: string // 标签字符串，格式："[Bug](#ffff0000),[Add](#ffabc101),..."
  priority?: number // 优先级，0为最高优先级
}

export type TodoStatus = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'BLOCKED'

export interface CreateTodoInput {
  content: string
  projectId: number
  assigneeId?: number
  parentId?: number
}

export interface UpdateTodoInput {
  content?: string
  status?: TodoStatus
  assigneeId?: number
  tags?: string // 标签字符串
  priority?: number // 优先级
}

// ==================== Task (后端模型) ====================

export interface Task {
  id: number
  project_id: number
  father_id?: number
  content: string
  state: TaskState
  creator_id: number
  executor_id?: number
  created_at: string
  updated_at: string
  completion_at?: string
  creator?: User
  executor?: User
  children?: Task[]
  tags?: string // 标签字符串，格式："[Bug](#ffff0000),[Add](#ffabc101),..."
  priority?: number // 优先级，0为最高优先级
}

export type TaskState = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'blocked'

// ==================== Task History ====================

export interface TaskHistory {
  id: number
  task_id: number
  old_state: TaskState
  new_state: TaskState
  operator_id: number
  changed_at: string
  operator?: User
}

// ==================== Invitation ====================

export interface ProjectInvitation {
  id: number
  project_id: number
  invite_code: string
  invite_link?: string  // 后端可能返回的邀请链接
  role: ProjectRole
  inviter_id: number
  expires_at?: string
  used_at?: string
  created_at: string
  updated_at: string
  project?: Project
  inviter?: User
}

export interface CreateInvitationInput {
  project_id: number
  role: ProjectRole
  expires_in_hours?: number // 0 表示永不过期
  max_uses?: number // 最大使用次数，不传则默认1
}

// ==================== API Response ====================

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
}

