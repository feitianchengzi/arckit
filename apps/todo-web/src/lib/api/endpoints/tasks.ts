/**
 * tasks API - 任务管理接口
 */

import { apiClient } from '../client'
import { handleResponse } from '../interceptors/response'
import { statusToState } from '@/lib/utils/taskMapper'
import type { Task, TodoStatus } from '@/types'
import type { ApiMeta } from '@/types/api'

// 定义任务输入类型
export interface CreateTaskInput {
  projectId: number
  content: string
  assigneeId?: number
  parentId?: number
  priority?: number
  tags?: string
}

export interface UpdateTaskInput {
  content?: string
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'BLOCKED'
  assigneeId?: number
  tags?: string // 标签字符串
  priority?: number // 优先级
}

export interface TaskListFilters {
  status?: TodoStatus[]
  creatorIds?: number[]
  executorIds?: number[]
  tagIds?: number[]
  priorities?: number[]
  startTime?: string
  endTime?: string
  searchKey?: string
  updatedAfter?: string
  fatherId?: number
  includeDeleted?: boolean
}

export interface TaskListOptions {
  filters?: TaskListFilters
  page?: number
  pageSize?: number
}

export interface TaskListResult {
  tasks: Task[]
  meta: ApiMeta
  total: number
}

const serializeArrayParam = (values?: Array<string | number>) => {
  if (!values) return undefined
  if (values.length === 0) return '[]'
  return values.join(',')
}

export const tasksApi = {
  /**
   * 获取项目的任务列表
   * 后端路由: GET /workshop/v1/user/tasks?project_id={projectId}
   * 注意：根据API文档，不需要 user_id 参数，网关会自动识别用户
   * 响应格式:
   * - { code: 'OK', data: { tasks: [...], total: 3 }, meta: {...} }
   * - { code: 'OK', data: Task[] }
   */
  listByProject: async (projectId: string, options?: TaskListOptions): Promise<TaskListResult> => {
    const filters = options?.filters
    const params: Record<string, any> = {
      project_id: projectId,
    }

    const stateParam = filters?.status ? serializeArrayParam(filters.status.map(statusToState)) : undefined
    if (stateParam !== undefined) {
      params.state = stateParam
    }
    const creatorParam = serializeArrayParam(filters?.creatorIds)
    if (creatorParam !== undefined) {
      params.creator_id = creatorParam
    }
    const executorParam = serializeArrayParam(filters?.executorIds)
    if (executorParam !== undefined) {
      params.executor_id = executorParam
    }
    const tagsParam = serializeArrayParam(filters?.tagIds)
    if (tagsParam !== undefined) {
      params.tags = tagsParam
    }
    const priorityParam = serializeArrayParam(filters?.priorities)
    if (priorityParam !== undefined) {
      params.priority = priorityParam
    }
    if (filters?.startTime) {
      params.start_time = filters.startTime
    }
    if (filters?.endTime) {
      params.end_time = filters.endTime
    }
    if (filters?.searchKey) {
      params.search_key = filters.searchKey
    }
    if (filters?.updatedAfter) {
      params.updated_after = filters.updatedAfter
    }
    if (filters?.fatherId !== undefined) {
      params.father_id = filters.fatherId
    }
    if (filters?.includeDeleted !== undefined) {
      params.include_deleted = filters.includeDeleted
    }
    if (options?.page) {
      params.page = options.page
    }
    if (options?.pageSize) {
      params.page_size = options.pageSize
    }

    console.log('📋 获取项目任务列表，项目ID:', projectId, '筛选:', params)
    const response = await apiClient.get(`/user/tasks`, { params })

    const responseData = response.data
    let tasks: Task[] = []
    let total = 0
    let meta: ApiMeta = {
      page: options?.page || 1,
      page_size: options?.pageSize || 0,
      total: 0,
    }

    if (responseData?.code === 'OK' && responseData?.data !== undefined) {
      const data = responseData.data

      if (data && typeof data === 'object' && 'tasks' in data && Array.isArray(data.tasks)) {
        tasks = data.tasks
        total = typeof data.total === 'number' ? data.total : tasks.length
      } else if (Array.isArray(data)) {
        tasks = data
        total = tasks.length
      }

      if (responseData?.meta) {
        meta = responseData.meta as ApiMeta
        if (typeof meta.total !== 'number') {
          meta.total = total
        }
      } else {
        meta = {
          page: options?.page || 1,
          page_size: options?.pageSize || tasks.length,
          total,
        }
      }

      return { tasks, meta, total }
    }

    try {
      const data = handleResponse<any>(response)
      if (data && typeof data === 'object' && 'tasks' in data && Array.isArray(data.tasks)) {
        tasks = data.tasks
        total = typeof data.total === 'number' ? data.total : tasks.length
      } else if (Array.isArray(data)) {
        tasks = data
        total = tasks.length
      }
      meta = {
        page: options?.page || 1,
        page_size: options?.pageSize || tasks.length,
        total,
      }
      return { tasks, meta, total }
    } catch (error) {
      console.error('❌ 解析任务列表失败:', error)
      return {
        tasks: [],
        meta: {
          page: options?.page || 1,
          page_size: options?.pageSize || 0,
          total: 0,
        },
        total: 0,
      }
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
    
    if (input.priority !== undefined && input.priority !== null) {
      taskInput.priority = input.priority
    }
    
    if (input.tags !== undefined && input.tags !== null && input.tags !== '') {
      taskInput.tags = input.tags
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
    const { tasks } = await tasksApi.listByProject(projectId, { page: 1, pageSize: 200 })
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
    
    if (input.tags !== undefined) {
      taskInput.tags = input.tags
    }
    
    if (input.priority !== undefined) {
      taskInput.priority = input.priority
    }
    
    console.log('🔄 更新任务，任务ID:', taskId, '更新内容:', taskInput)
    const response = await apiClient.put(`/user/tasks/${taskId}`, taskInput)
    const task = handleResponse<Task>(response)
    console.log('✅ 任务更新成功:', task)
    return task
  },
  
  /**
   * 删除任务
   * 后端路由: DELETE /workshop/v1/user/tasks/:id
   * 注意：根据API文档，不需要 user_id 参数，网关会自动识别用户
   * 删除任务时会级联删除关联的附件（软删除）
   * 
   * 响应格式:
   * {
   *   "code": "OK",
   *   "data": {
   *     "task_id": 1,
   *     "deleted_at": "2024-01-01T12:20:00Z"
   *   }
   * }
   */
  delete: async (projectId: string, taskId: string, userId?: number): Promise<{ task_id: number; deleted_at: string }> => {
    // 根据API文档，不需要 user_id 参数，网关会自动识别用户
    console.log('🗑️ 删除任务，任务ID:', taskId)
    const response = await apiClient.delete(`/user/tasks/${taskId}`)
    const result = handleResponse<{ task_id: number; deleted_at: string }>(response)
    console.log('✅ 任务删除成功:', result)
    return result
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
    const { tasks } = await tasksApi.listByProject(projectId, {
      page: 1,
      pageSize: 200,
      filters: {
        fatherId: Number(taskId),
      },
    })
    return tasks || []
  },
}
