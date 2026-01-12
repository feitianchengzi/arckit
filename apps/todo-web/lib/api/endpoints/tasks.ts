/**
 * tasks API - 任务管理接口
 */

import { apiClient } from '../client'
import type { Task } from '@/types'
import type { CreateTaskInput, UpdateTaskInput } from './tasks'

// 重新导出类型
export type { CreateTaskInput, UpdateTaskInput }

export const tasksApi = {
  /**
   * 获取项目的任务列表
   * 后端路由: GET /workshop/v1/user/tasks?project_id={projectId}
   * 注意：根据API文档，不需要 user_id 参数，网关会自动识别用户
   * 响应格式: { tasks: Task[], total: number }
   */
  listByProject: async (projectId: string, userId?: number): Promise<Task[]> => {
    // 根据API文档，不需要 user_id 参数，网关会自动识别用户
    console.log('📋 获取项目任务列表，项目ID:', projectId)
    const { data } = await apiClient.get(`/user/tasks`, {
      params: { project_id: projectId },
    })
    // 后端返回格式是 { tasks: [], total: 0 }，需要提取 tasks 数组
    const tasks = data?.tasks || data || []
    console.log('✅ 获取到任务列表，数量:', tasks.length)
    return tasks
  },
  
  /**
   * 创建任务
   * 后端路由: POST /workshop/v1/user/tasks
   * 注意：根据API文档，不需要 user_id 参数，网关会自动识别用户
   * 请求体需要包含 project_id
   */
  create: async (input: CreateTaskInput, userId?: number): Promise<Task> => {
    // 根据API文档，不需要 user_id 参数，网关会自动识别用户
    const taskInput: any = {
      project_id: input.projectId,
      content: input.content,
    }
    
    if (input.assigneeId !== undefined) {
      taskInput.executor_id = input.assigneeId
    }
    
    if (input.parentId !== undefined) {
      taskInput.father_id = input.parentId
    }
    
    console.log('🆕 创建任务:', taskInput)
    const { data } = await apiClient.post(`/user/tasks`, taskInput)
    console.log('✅ 任务创建成功:', data)
    return data
  },
  
  /**
   * 获取任务详情
   * 注意：后端没有单独的获取任务详情接口
   * 我们从任务列表中查找对应的任务
   */
  getById: async (projectId: string, taskId: string, userId?: number): Promise<Task> => {
    // 后端没有单独的获取任务详情接口，我们从任务列表中查找
    const tasks = await tasksApi.listByProject(projectId, userId)
    const task = tasks.find((t) => t.id.toString() === taskId)
    
    if (!task) {
      throw new Error('任务不存在')
    }
    
    // 构建任务树：找出所有子任务
    const children = tasks.filter((t) => t.father_id === task.id)
    if (children.length > 0) {
      task.children = children
    }
    
    return task
  },
  
  /**
   * 更新任务
   * 后端路由: PUT /workshop/v1/user/tasks/:id
   * 注意：根据API文档，不需要 user_id 参数，网关会自动识别用户
   */
  update: async (
    projectId: string,
    taskId: string,
    input: UpdateTaskInput,
    userId?: number
  ): Promise<Task> => {
    // 根据API文档，不需要 user_id 参数，网关会自动识别用户
    const taskInput: any = {}
    
    if (input.content !== undefined) {
      taskInput.content = input.content
    }
    
    if (input.status !== undefined) {
      taskInput.state = statusToState(input.status as any)
    }
    
    if (input.assigneeId !== undefined) {
      taskInput.executor_id = input.assigneeId
    }
    
    console.log('🔄 更新任务，任务ID:', taskId, '更新内容:', taskInput)
    const { data } = await apiClient.put(`/user/tasks/${taskId}`, taskInput)
    console.log('✅ 任务更新成功:', data)
    return data
  },
  
  /**
   * 删除任务
   * 后端路由: DELETE /workshop/v1/user/tasks
   * 注意：根据API文档，不需要 user_id 参数，网关会自动识别用户
   * 请求体需要包含 task_ids 数组（批量删除）
   */
  delete: async (projectId: string, taskId: string, userId?: number): Promise<void> => {
    // 根据API文档，不需要 user_id 参数，网关会自动识别用户
    console.log('🗑️ 删除任务，任务ID:', taskId)
    await apiClient.delete(`/user/tasks`, {
      data: { task_ids: [parseInt(taskId)] },
    })
    console.log('✅ 任务删除成功')
  },
  
  /**
   * 更新任务状态
   * 后端路由: PUT /workshop/v1/user/tasks/:id
   * 注意：根据API文档，不需要 user_id 参数，网关会自动识别用户
   */
  updateStatus: async (
    projectId: string,
    taskId: string,
    status: string,
    userId?: number
  ): Promise<Task> => {
    // 根据API文档，不需要 user_id 参数，网关会自动识别用户
    console.log('🔄 更新任务状态，任务ID:', taskId, '新状态:', status)
    const { data } = await apiClient.put(`/user/tasks/${taskId}`, {
      state: statusToState(status as any),
    })
    console.log('✅ 任务状态更新成功:', data)
    return data
  },
  
  /**
   * 获取任务的子任务列表
   * 从任务列表中筛选出子任务
   */
  getChildren: async (projectId: string, taskId: string): Promise<Task[]> => {
    const tasks = await tasksApi.listByProject(projectId) // 不需要 userId
    return tasks.filter((t) => t.father_id?.toString() === taskId) || []
  },
}

// ==================== 工具函数 ====================

function statusToState(status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'): string {
  const mapping: Record<string, string> = {
    'PENDING': 'pending',
    'IN_PROGRESS': 'in_progress',
    'COMPLETED': 'completed',
  }
  return mapping[status] || status.toLowerCase()
}
