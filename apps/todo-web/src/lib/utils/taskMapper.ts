/**
 * taskMapper - 前端 Todo 与后端 Task 的字段映射
 * 
 * 背景：
 * - 前端使用 Todo 模型（title, content, status, assigneeId）
 * - 后端使用 Task 模型（content, state, executor_id）
 * - 需要进行字段转换
 */

import type { Todo, Task, TodoStatus, TaskState } from '@/types'

// ==================== 状态映射 ====================

const STATUS_TO_STATE_MAP: Record<TodoStatus, TaskState> = {
  'PENDING': 'pending',
  'IN_PROGRESS': 'in_progress',
  'COMPLETED': 'completed',
  'CANCELLED': 'cancelled',
  'BLOCKED': 'blocked',
}

const STATE_TO_STATUS_MAP: Record<TaskState, TodoStatus> = {
  'pending': 'PENDING',
  'in_progress': 'IN_PROGRESS',
  'completed': 'COMPLETED',
  'cancelled': 'CANCELLED',
  'blocked': 'BLOCKED',
}

/**
 * 前端状态 → 后端状态
 */
export function statusToState(status: TodoStatus): TaskState {
  return STATUS_TO_STATE_MAP[status]
}

/**
 * 后端状态 → 前端状态
 */
export function stateToStatus(state: TaskState): TodoStatus {
  return STATE_TO_STATUS_MAP[state]
}

// ==================== 模型映射 ====================

/**
 * 后端 Task → 前端 Todo
 * 注意：后端可能不返回 creator、executor 和 children 字段，需要处理
 */
export function taskToTodo(task: Task): Todo {
  return {
    id: task.id,
    title: task.content.substring(0, 50) + (task.content.length > 50 ? '...' : ''), // 截取前 50 字符作为标题
    content: task.content,
    status: stateToStatus(task.state),
    assigneeId: task.executor_id,
    creatorId: task.creator_id,
    projectId: task.project_id,
    parentId: task.father_id,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    completionAt: task.completion_at,
    // 后端可能不返回这些字段，设为 undefined
    assignee: task.executor,
    creator: task.creator,
    children: task.children?.map(taskToTodo),
    tags: task.tags,
    priority: task.priority,
  }
}

/**
 * 前端 Todo → 后端 Task（创建/更新）
 */
export function todoToTaskInput(todo: Partial<Todo>): Partial<Task> {
  const result: Partial<Task> = {}
  
  if (todo.content !== undefined) {
    result.content = todo.content
  }
  
  if (todo.status !== undefined) {
    result.state = statusToState(todo.status)
  }
  
  if (todo.assigneeId !== undefined) {
    result.executor_id = todo.assigneeId
  }
  
  if (todo.projectId !== undefined) {
    result.project_id = todo.projectId
  }
  
  if (todo.parentId !== undefined) {
    result.father_id = todo.parentId
  }
  
  if (todo.tags !== undefined) {
    result.tags = todo.tags
  }
  
  if (todo.priority !== undefined) {
    result.priority = todo.priority
  }
  
  return result
}

/**
 * 批量转换：Task[] → Todo[]
 */
export function tasksToTodos(tasks: Task[]): Todo[] {
  return tasks.map(taskToTodo)
}

