/**
 * 权限管理相关的类型定义
 */

import type { TodoStatus } from '@/types'

/**
 * 项目角色
 */
export type ProjectRole = 'owner' | 'admin' | 'member'

/**
 * 任务信息（用于权限检查）
 */
export interface TaskInfo {
  id: number
  creatorId: number
  assigneeId?: number | null  // null 或 undefined 表示未分配
  status: TodoStatus
  projectId: number
}

/**
 * 用户上下文（当前用户信息）
 */
export interface UserContext {
  userId: number | null
  role: ProjectRole | null
}

/**
 * 权限检查上下文
 */
export interface PermissionContext {
  task?: TaskInfo
  user: UserContext
  projectId?: string | number
}

/**
 * 认领待办的上下文信息
 */
export interface ClaimTaskContext {
  taskInfo: TaskInfo
  userId: number
  isProjectMember: boolean
  userRole?: ProjectRole | null  // 可选，认领不依赖角色
}
