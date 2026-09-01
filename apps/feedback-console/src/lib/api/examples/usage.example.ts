/**
 * 统一 API 响应处理使用示例
 * 
 * 本文件展示如何使用新的统一响应处理机制
 * 注意：这是示例文件，不会被实际使用
 */

import { apiClient } from '../client'
import { handleResponse, handlePaginatedResponse, ApiError } from '../interceptors/response'
import type { ApiResponse, ApiPaginatedResponse } from '@/types/api'

// ==================== 示例 1: 基本使用 ====================

interface User {
  id: string
  name: string
  email: string
}

/**
 * 获取用户信息
 */
async function getUserExample() {
  try {
    // 方式 1: 使用 handleResponse 自动解析
    const response = await apiClient.get('/user/profile')
    const user = handleResponse<User>(response)
    console.log('用户信息:', user)
    
    // 方式 2: 手动处理（不推荐）
    const response2 = await apiClient.get<ApiResponse<User>>('/user/profile')
    if (response2.data.code === 'OK') {
      const user2 = response2.data.data
      console.log('用户信息:', user2)
    }
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('错误码:', error.code)
      console.error('错误消息:', error.message)
      console.error('错误详情:', error.details)
    }
  }
}

// ==================== 示例 2: 分页数据 ====================

interface Task {
  id: number
  title: string
  status: string
}

/**
 * 获取任务列表（带分页）
 */
async function getTasksExample() {
  try {
    const response = await apiClient.get('/user/tasks', {
      params: {
        project_id: 123,
        page: 1,
        page_size: 20,
      },
    })
    
    // 使用 handlePaginatedResponse 自动解析
    const { data, meta } = handlePaginatedResponse<Task>(response)
    
    console.log('任务列表:', data)
    console.log('总数:', meta.total)
    console.log('当前页:', meta.page)
    console.log('每页数量:', meta.page_size)
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('获取任务失败:', error.getUserMessage())
    }
  }
}

// ==================== 示例 3: 错误处理 ====================

/**
 * 完整的错误处理示例
 */
async function errorHandlingExample() {
  try {
    const response = await apiClient.get('/user/profile')
    const user = handleResponse<User>(response)
    console.log('成功:', user)
  } catch (error) {
    if (error instanceof ApiError) {
      // 方式 1: 判断具体错误码
      if (error.is('USER_NOT_FOUND')) {
        console.error('用户不存在')
      } else if (error.is('UNAUTHORIZED')) {
        console.error('未授权，请先登录')
      } else if (error.is('VALIDATION_FAILED')) {
        // 处理验证错误，可能包含字段级 details
        console.error('验证失败')
        if (error.details?.fields) {
          Object.entries(error.details.fields).forEach(([field, message]) => {
            console.error(`  ${field}: ${message}`)
          })
        }
      }
      
      // 方式 2: 判断错误类型
      if (error.isAuthError()) {
        // 认证错误 - 跳转登录页
        window.location.href = '/login'
      } else if (error.isPermissionError()) {
        // 权限错误 - 显示提示
        alert('您没有权限执行此操作')
      } else if (error.isNotFoundError()) {
        // 资源不存在 - 跳转 404
        window.location.href = '/404'
      } else if (error.isValidationError()) {
        // 验证错误 - 显示表单错误
        alert(`验证失败: ${error.message}`)
      } else if (error.isNetworkError()) {
        // 网络错误 - 提示重试
        alert('网络连接失败，请检查网络')
      } else if (error.isServerError()) {
        // 服务器错误 - 提示稍后重试
        alert('服务器错误，请稍后重试')
      } else {
        // 其他错误
        alert(`操作失败: ${error.message}`)
      }
      
      // 方式 3: 使用友好消息
      console.error(error.getUserMessage())
      
      // 方式 4: 记录详细日志
      console.error('API 错误:', error.toJSON())
      
      // 方式 5: 处理 details 字段（特殊情况）
      if (error.details) {
        console.error('错误详情:', error.details)
      }
    } else {
      // 非 API 错误
      console.error('未知错误:', error)
    }
  }
}

// ==================== 示例 4: React Hook 中使用 ====================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * React 组件中的使用示例
 */
function useUserProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchUser = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.get('/user/profile')
      const userData = handleResponse<User>(response)
      setUser(userData)
    } catch (err) {
      if (err instanceof ApiError) {
        // 认证错误 - 跳转登录
        if (err.isAuthError()) {
          router.push('/login')
          return
        }
        
        // 设置用户友好的错误消息
        setError(err.getUserMessage())
        
        // 记录详细错误（用于调试）
        console.error('获取用户信息失败:', err.toJSON())
      } else {
        setError('未知错误')
        console.error('获取用户信息失败:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  return { user, loading, error, fetchUser }
}

// ==================== 示例 5: React Query 中使用 ====================

import { useQuery, useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'

/**
 * 使用 React Query (v5)
 * 注意：React Query v5 移除了 useQuery 的 onError 和 onSuccess 回调
 * 错误处理应该在组件中使用 useEffect 监听 error 状态
 */
function useUserProfileQuery() {
  const query = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const response = await apiClient.get('/user/profile')
      return handleResponse<User>(response)
    },
  })
  
  // 错误处理：使用 useEffect 监听 error 状态
  useEffect(() => {
    if (query.error && query.error instanceof ApiError) {
      console.error('获取用户失败:', query.error.getUserMessage())
    }
  }, [query.error])
  
  return query
}

/**
 * 创建项目示例（Mutation）
 */
interface CreateProjectInput {
  name: string
  git_url: string
}

interface Project {
  id: number
  name: string
  git_url: string
}

function useCreateProject() {
  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const response = await apiClient.post('/user/projects', input)
      return handleResponse<Project>(response)
    },
    onSuccess: (project) => {
      console.log('项目创建成功:', project)
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.is('PROJECT_ALREADY_EXISTS')) {
          alert('项目已存在')
        } else if (error.isValidationError()) {
          alert(`验证失败: ${error.message}`)
        } else {
          alert(error.getUserMessage())
        }
      }
    },
  })
}

// ==================== 示例 6: API 封装 ====================

/**
 * 项目 API 封装示例
 */
export const projectsApi = {
  /**
   * 获取项目列表
   */
  list: async (): Promise<Project[]> => {
    const response = await apiClient.get('/user/projects')
    return handleResponse<Project[]>(response)
  },

  /**
   * 获取单个项目
   */
  getById: async (id: string): Promise<Project> => {
    const response = await apiClient.get(`/user/projects/${id}`)
    return handleResponse<Project>(response)
  },

  /**
   * 创建项目
   */
  create: async (input: CreateProjectInput): Promise<Project> => {
    const response = await apiClient.post('/user/projects', input)
    return handleResponse<Project>(response)
  },

  /**
   * 更新项目
   */
  update: async (id: string, input: Partial<CreateProjectInput>): Promise<Project> => {
    const response = await apiClient.put(`/user/projects/${id}`, input)
    return handleResponse<Project>(response)
  },

  /**
   * 删除项目
   */
  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/user/projects/${id}`)
    // void 返回值不需要解析 data
    if (response.data.code !== 'OK') {
      throw new ApiError(
        response.data.error.message,
        response.data.code,
        response.data.error.details,
        response.status
      )
    }
  },
}

/**
 * 任务 API 封装示例（带分页）
 */
export const tasksApi = {
  /**
   * 获取任务列表（带分页）
   */
  list: async (params: {
    project_id: string
    page?: number
    page_size?: number
  }): Promise<{ data: Task[]; meta: ApiPaginatedResponse<Task>['meta'] }> => {
    const response = await apiClient.get('/user/tasks', { params })
    return handlePaginatedResponse<Task>(response)
  },
}

// ==================== 示例 7: 全局错误处理 ====================

/**
 * 全局错误处理器（可用于 Error Boundary）
 */
export function handleGlobalError(error: any): void {
  if (error instanceof ApiError) {
    // 认证错误 - 全局跳转
    if (error.isAuthError()) {
      console.error('认证失败，跳转登录页')
      window.location.href = '/login'
      return
    }

    // 权限错误 - 全局提示
    if (error.isPermissionError()) {
      console.error('权限不足')
      // 显示全局 Toast
      return
    }

    // 服务器错误 - 全局提示
    if (error.isServerError()) {
      console.error('服务器错误')
      // 显示全局错误页面
      return
    }

    // 其他错误 - 显示消息
    console.error(error.getUserMessage())
  } else {
    // 非 API 错误
    console.error('未知错误:', error)
  }
}

// ==================== 示例 8: 类型安全的 API 调用 ====================

/**
 * 类型安全的 API 调用封装
 */
async function typeSafeApiCall<T>(
  apiCall: () => Promise<T>
): Promise<{ data: T | null; error: ApiError | null }> {
  try {
    const data = await apiCall()
    return { data, error: null }
  } catch (err) {
    if (err instanceof ApiError) {
      return { data: null, error: err }
    }
    // 转换为 ApiError
    return {
      data: null,
      error: new ApiError(
        err instanceof Error ? err.message : '未知错误',
        'UNKNOWN_ERROR'
      ),
    }
  }
}

/**
 * 使用类型安全的 API 调用
 */
async function typeSafeExample() {
  const { data, error } = await typeSafeApiCall(async () => {
    const response = await apiClient.get('/user/profile')
    return handleResponse<User>(response)
  })

  if (error) {
    console.error('错误:', error.getUserMessage())
    return
  }

  console.log('用户:', data)
}

// ==================== 示例 9: 处理 details 字段 ====================

/**
 * details 字段处理示例
 * details 通常为 null，仅在特殊情况下包含补充信息
 */
async function handleDetailsExample() {
  try {
    // 场景 1: 表单验证错误
    // 示例：创建用户时验证失败
    const response = await apiClient.post('/user/users', {
      email: 'invalid-email',
      password: '123',
    })
    handleResponse<User>(response)
  } catch (error) {
    if (error instanceof ApiError && error.is('VALIDATION_FAILED')) {
      // details 包含字段级错误
      const fieldErrors = error.details?.fields || {}
      
      console.log('字段错误:')
      Object.entries(fieldErrors).forEach(([field, message]) => {
        console.log(`  ${field}: ${message}`)
      })
    }
  }

  try {
    // 场景 2: 业务规则冲突
    await projectsApi.delete('123')
  } catch (error) {
    if (error instanceof ApiError && error.code === 'OPERATION_FAILED') {
      // details 包含冲突原因
      if (error.details?.reason === '项目中还有未完成的任务') {
        const taskCount = error.details.task_count
        console.log(`无法删除，还有 ${taskCount} 个未完成的任务`)
      }
    }
  }

  try {
    // 场景 3: 权限不足
    // 示例：删除项目成员时权限不足
    const response = await apiClient.delete('/user/projects/123/members', {
      data: { target_user_id: 456 },
    })
    handleResponse<void>(response)
  } catch (error) {
    if (error instanceof ApiError && error.isPermissionError()) {
      // details 包含权限信息
      const requiredRole = error.details?.required_role
      const currentRole = error.details?.current_role
      
      if (requiredRole && currentRole) {
        console.log(`需要 ${requiredRole} 权限，当前是 ${currentRole}`)
      }
    }
  }

  try {
    // 场景 4: 速率限制
    // 示例：发送验证码时触发速率限制
    const response = await apiClient.post('/auth-server/v1/public/send_verification', {
      code_type: 'email',
      target: 'test@example.com',
      purpose: 'login',
    })
    handleResponse<{ success: boolean }>(response)
  } catch (error) {
    if (error instanceof ApiError && error.is('RATE_LIMIT_EXCEEDED')) {
      // details 包含重试信息
      const retryAfter = error.details?.retry_after || 60
      console.log(`请求过于频繁，请 ${retryAfter} 秒后重试`)
    }
  }
}

// ==================== 导出示例函数 ====================

export {
  getUserExample,
  getTasksExample,
  errorHandlingExample,
  useUserProfile,
  useUserProfileQuery,
  useCreateProject,
  // handleGlobalError 已经在上面用 export function 声明，不需要重复导出
  typeSafeApiCall,
  typeSafeExample,
  handleDetailsExample,
}

