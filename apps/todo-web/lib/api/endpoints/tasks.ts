/**
 * tasks API - 任务管理接口
 */

import { apiClient } from '../client'
import type { Task } from '@/types'
import { todoToTaskInput, statusToState } from '@/lib/utils/taskMapper'

export interface CreateTaskInput {
  content: string
  projectId: number
  assigneeId?: number
  parentId?: number
}

export interface UpdateTaskInput {
  content?: string
  status?: string
  assigneeId?: number
}

export const tasksApi = {
  /**
   * 获取项目的任务列表
   * 后端路由: GET /todo/v1/user/tasks?project_id={projectId}
   * 响应格式: { tasks: Task[], total: number }
   */
  listByProject: async (projectId: string): Promise<Task[]> => {
    const { data } = await apiClient.get(`/user/tasks`, {
      params: { project_id: projectId },
    })
    // 后端返回格式是 { tasks: [], total: 0 }，需要提取 tasks 数组
    return data?.tasks || data || []
  },
  
  /**
   * 创建任务
   * 后端路由: POST /todo/v1/user/tasks
   * 请求体需要包含 project_id
   */
  create: async (input: CreateTaskInput): Promise<Task> => {
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
    
    const { data } = await apiClient.post(`/user/tasks`, taskInput)
    return data
  },
  
  /**
   * 获取任务详情
   * 注意：后端没有单独的获取任务详情接口
   * 我们从任务列表中查找对应的任务
   */
  getById: async (projectId: string, taskId: string): Promise<Task> => {
    // 后端没有单独的获取任务详情接口，我们从任务列表中查找
    const tasks = await tasksApi.listByProject(projectId)
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
   * 后端路由: PUT /todo/v1/user/tasks/:id
   */
  update: async (
    projectId: string,
    taskId: string,
    input: UpdateTaskInput
  ): Promise<Task> => {
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
    
    const { data } = await apiClient.put(`/user/tasks/${taskId}`, taskInput)
    return data
  },
  
  /**
   * 删除任务
   * 后端路由: DELETE /todo/v1/user/tasks
   * 请求体需要包含 task_ids 数组（批量删除）
   */
  delete: async (projectId: string, taskId: string): Promise<void> => {
    await apiClient.delete(`/user/tasks`, {
      data: { task_ids: [parseInt(taskId)] },
    })
  },
  
  /**
   * 更新任务状态
   * 后端路由: PUT /todo/v1/user/tasks/:id
   */
  updateStatus: async (
    projectId: string,
    taskId: string,
    status: string
  ): Promise<Task> => {
    const { data } = await apiClient.put(`/user/tasks/${taskId}`, {
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

