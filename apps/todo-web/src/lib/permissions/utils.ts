/**
 * 权限检查的辅助工具函数
 */

import type { Todo } from '@/types'
import type { TaskInfo } from './types'

/**
 * 将 Todo 对象转换为 TaskInfo（用于权限检查）
 * 
 * @param todo Todo 对象
 * @returns TaskInfo 对象
 */
export function todoToTaskInfo(todo: Todo): TaskInfo {
  return {
    id: todo.id,
    creatorId: todo.creatorId,
    assigneeId: todo.assigneeId,
    status: todo.status,
    projectId: todo.projectId
  }
}

/**
 * 检查执行人是否未分配
 * 
 * @param assigneeId 执行人ID
 * @returns 是否未分配
 */
export function isAssigneeUnassigned(assigneeId?: number | null): boolean {
  return !assigneeId || assigneeId === null
}
