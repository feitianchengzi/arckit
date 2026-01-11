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
   * 后端路由: GET /todo/v1/user/tasks?project_id={projectId}&user_id={userId}
   * 响应格式: { tasks: Task[], total: number }
   */
  listByProject: async (projectId: string, userId?: number): Promise<Task[]> => {
    // 如果没有传入 userId，尝试从 localStorage 获取
    if (!userId && typeof window !== 'undefined') {
      try {
        const authStorage = localStorage.getItem('auth-storage')
        if (authStorage) {
          const authData = JSON.parse(authStorage)
          if (authData?.state?.user?.id) {
            userId = authData.state.user.id
          }
        }
      } catch (err) {
        console.warn('无法从 localStorage 获取用户ID:', err)
      }
    }
    
    if (!userId) {
      throw new Error('无法获取用户ID，请先登录')
    }
    
    const { data } = await apiClient.get(`/user/tasks`, {
      params: { project_id: projectId, user_id: userId },
    })
    // 后端返回格式是 { tasks: [], total: 0 }，需要提取 tasks 数组
    return data?.tasks || data || []
  },
  
  /**
   * 创建任务
   * 后端路由: POST /todo/v1/user/tasks?user_id={userId}
   * 请求体需要包含 project_id
   */
  create: async (input: CreateTaskInput, userId?: number): Promise<Task> => {
    // 如果没有传入 userId，尝试从 localStorage 获取
    if (!userId && typeof window !== 'undefined') {
      try {
        const authStorage = localStorage.getItem('auth-storage')
        if (authStorage) {
          const authData = JSON.parse(authStorage)
          if (authData?.state?.user?.id) {
            userId = authData.state.user.id
          }
        }
      } catch (err) {
        console.warn('无法从 localStorage 获取用户ID:', err)
      }
    }
    
    if (!userId) {
      throw new Error('无法获取用户ID，请先登录')
    }
    
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
    
    const { data } = await apiClient.post(`/user/tasks?user_id=${userId}`, taskInput)
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
   * 后端路由: PUT /todo/v1/user/tasks/:id?user_id={userId}
   */
  update: async (
    projectId: string,
    taskId: string,
    input: UpdateTaskInput,
    userId?: number
  ): Promise<Task> => {
    // 如果没有传入 userId，尝试从 localStorage 获取
    if (!userId && typeof window !== 'undefined') {
      try {
        const authStorage = localStorage.getItem('auth-storage')
        if (authStorage) {
          const authData = JSON.parse(authStorage)
          if (authData?.state?.user?.id) {
            userId = authData.state.user.id
          }
        }
      } catch (err) {
        console.warn('无法从 localStorage 获取用户ID:', err)
      }
    }
    
    if (!userId) {
      throw new Error('无法获取用户ID，请先登录')
    }
    
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
    
    const { data } = await apiClient.put(`/user/tasks/${taskId}?user_id=${userId}`, taskInput)
    return data
  },
  
  /**
   * 删除任务
   * 后端路由: DELETE /todo/v1/user/tasks?user_id={userId}
   * 请求体需要包含 task_ids 数组（批量删除）
   */
  delete: async (projectId: string, taskId: string, userId?: number): Promise<void> => {
    // 如果没有传入 userId，尝试从 localStorage 获取
    if (!userId && typeof window !== 'undefined') {
      try {
        const authStorage = localStorage.getItem('auth-storage')
        if (authStorage) {
          const authData = JSON.parse(authStorage)
          if (authData?.state?.user?.id) {
            userId = authData.state.user.id
          }
        }
      } catch (err) {
        console.warn('无法从 localStorage 获取用户ID:', err)
      }
    }
    
    if (!userId) {
      throw new Error('无法获取用户ID，请先登录')
    }
    
    await apiClient.delete(`/user/tasks?user_id=${userId}`, {
      data: { task_ids: [parseInt(taskId)] },
    })
  },
  
  /**
   * 更新任务状态
   * 后端路由: PUT /todo/v1/user/tasks/:id?user_id={userId}
   */
  updateStatus: async (
    projectId: string,
    taskId: string,
    status: string,
    userId?: number
  ): Promise<Task> => {
    // 如果没有传入 userId，尝试从 localStorage 获取
    if (!userId && typeof window !== 'undefined') {
      try {
        const authStorage = localStorage.getItem('auth-storage')
        if (authStorage) {
          const authData = JSON.parse(authStorage)
          if (authData?.state?.user?.id) {
            userId = authData.state.user.id
          }
        }
      } catch (err) {
        console.warn('无法从 localStorage 获取用户ID:', err)
      }
    }
    
    if (!userId) {
      throw new Error('无法获取用户ID，请先登录')
    }
    
    const { data } = await apiClient.put(`/user/tasks/${taskId}?user_id=${userId}`, {
      state: statusToState(status as any),
    })
    return data
  },
  
  /**
   * 获取任务的子任务列表
   * 从任务列表中筛选出子任务
   */
  getChildren: async (projectId: string, taskId: string): Promise<Task[]> => {
    const tasks = await tasksApi.listByProject(projectId)
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
