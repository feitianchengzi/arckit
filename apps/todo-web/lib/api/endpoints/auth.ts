/**
 * TODO 后端 API - 用户相关接口
 */

import { apiClient } from '../client'
import { CreateUserRequest, TodoUser } from '@/types/auth'

export const todoUserApi = {
  /**
   * 创建/获取用户
   * POST /{service}/v1/user/users
   * 
   * 如果用户已存在（根据UUID），返回现有用户信息
   * 如果用户不存在，创建新用户
   */
  createOrGetUser: async (data?: CreateUserRequest): Promise<TodoUser> => {
    // 确保请求体不为空，至少发送一个空对象
    const requestBody = data || {}
    
    try {
      const response = await apiClient.post<TodoUser>('/user/users', requestBody)
      return response.data
    } catch (error: any) {
      // 记录详细的错误信息以便调试
      console.error('❌ 创建/获取用户失败')
      console.error('请求 URL:', '/user/users')
      console.error('请求方法:', 'POST')
      console.error('请求体:', requestBody)
      console.error('响应状态:', error.response?.status)
      console.error('错误信息:', error.response?.data || error.message)
      console.error('请求 Headers:', error.config?.headers)
      console.error('完整错误对象:', error)
      throw error
    }
  },

  /**
   * 更新用户信息
   * PUT /{service}/v1/user/users/:id
   */
  updateUser: async (id: number, data: Partial<CreateUserRequest>): Promise<TodoUser> => {
    const response = await apiClient.put<TodoUser>(`/user/users/${id}`, data)
    return response.data
  },

  /**
   * 获取当前用户信息
   * GET /{service}/v1/user/users/me
   */
  getCurrentUser: async (): Promise<TodoUser> => {
    const response = await apiClient.get<TodoUser>('/user/users/me')
    return response.data
  },
}
