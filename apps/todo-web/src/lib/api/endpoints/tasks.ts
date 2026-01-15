/**
 * tasks API - 任务管理接口
 */

import { apiClient } from '../client'
import { handleResponse, handlePaginatedResponse } from '../interceptors/response'
import type { Task } from '@/types'

// 定义任务输入类型
export interface CreateTaskInput {
  projectId: number
  content: string
  assigneeId?: number
  parentId?: number
}

export interface UpdateTaskInput {
  content?: string
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'BLOCKED'
  assigneeId?: number
}

export const tasksApi = {
  /**
   * 获取项目的任务列表
   * 后端路由: GET /workshop/v1/user/tasks?project_id={projectId}
   * 注意：根据API文档，不需要 user_id 参数，网关会自动识别用户
   * 响应格式: { code: 'OK', data: Task[] } 或 { code: 'OK', data: Task[], meta: {...} }
   */
  listByProject: async (projectId: string, userId?: number): Promise<Task[]> => {
    // 根据API文档，不需要 user_id 参数，网关会自动识别用户
    console.log('📋 获取项目任务列表，项目ID:', projectId)
    const response = await apiClient.get(`/user/tasks`, {
      params: { project_id: projectId },
    })
    
    // 后端可能返回格式: { code: 'OK', data: { tasks: [...], total: 3 } } 或 { code: 'OK', data: [...] }
    const responseData = response.data
    if (responseData?.code === 'OK' && responseData?.data) {
      const data = responseData.data
      
      // 检查是否是嵌套格式: { tasks: [...], total: 3 }
      if (data && typeof data === 'object' && 'tasks' in data && Array.isArray(data.tasks)) {
        console.log('✅ 获取到任务列表（嵌套格式），数量:', data.tasks.length)
        return data.tasks
      }
      
      // 检查是否是分页格式: { code: 'OK', data: [...], meta: {...} }
      if (responseData?.meta) {
        const { data: tasks } = handlePaginatedResponse<Task>(response)
        console.log('✅ 获取到任务列表（分页），数量:', tasks.length)
        return Array.isArray(tasks) ? tasks : []
      }
      
      // 普通数组格式: { code: 'OK', data: [...] }
      if (Array.isArray(data)) {
        console.log('✅ 获取到任务列表（数组），数量:', data.length)
        return data
      }
    }
    
    // 兜底：尝试使用 handleResponse
    try {
      const data = handleResponse<any>(response)
      // 如果返回的是对象，尝试提取 tasks 字段
      if (data && typeof data === 'object' && 'tasks' in data && Array.isArray(data.tasks)) {
        console.log('✅ 获取到任务列表（handleResponse 嵌套），数量:', data.tasks.length)
        return data.tasks
      }
      // 如果是数组，直接返回
      if (Array.isArray(data)) {
        console.log('✅ 获取到任务列表（handleResponse 数组），数量:', data.length)
        return data
      }
      console.warn('⚠️ 无法解析任务列表格式:', data)
      return []
    } catch (error) {
      console.error('❌ 解析任务列表失败:', error)
      return []
    }
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
    const response = await apiClient.post(`/user/tasks`, taskInput)
    const task = handleResponse<Task>(response)
    console.log('✅ 任务创建成功:', task)
    return task
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
    const response = await apiClient.put(`/user/tasks/${taskId}`, taskInput)
    const task = handleResponse<Task>(response)
    console.log('✅ 任务更新成功:', task)
    return task
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
    const response = await apiClient.put(`/user/tasks/${taskId}`, {
      state: statusToState(status as any),
    })
    const task = handleResponse<Task>(response)
    console.log('✅ 任务状态更新成功:', task)
    return task
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
