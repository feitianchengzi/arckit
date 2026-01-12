/**
 * TODO 后端 API - 用户相关接口
 */

import { apiClient } from '../client'
import { CreateUserRequest, TodoUser } from '@/types/auth'
import { getAuthInfo } from '@/lib/utils/tokenManager'

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
   * PUT /{service}/v1/user/users
   * 注意：根据API文档，更新接口不需要用户ID，使用当前登录用户的ID
   * @param id 用户ID（保留参数用于兼容，但不会被使用）
   * @param data 要更新的用户信息
   */
  updateUser: async (id: number, data: Partial<CreateUserRequest>): Promise<TodoUser> => {
    console.log('🔄 更新用户信息:', data)
    // 根据API文档，更新接口路径是 PUT /workshop/v1/user/users（不需要ID）
    try {
      const response = await apiClient.put<TodoUser>('/user/users', data)
      console.log('✅ 更新用户信息成功:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ 更新用户信息失败')
      console.error('请求 URL:', '/user/users')
      console.error('请求方法:', 'PUT')
      console.error('请求体:', data)
      console.error('响应状态:', error.response?.status)
      console.error('错误信息:', error.response?.data || error.message)
      throw error
    }
  },

  /**
   * 获取当前登录用户信息
   * GET /user/users
   * 通过 Header 中的 UserID 识别用户
   */
  getCurrentUser: async (): Promise<TodoUser> => {
    console.log('📥 获取当前登录用户信息')
    try {
      const response = await apiClient.get<any>('/user/users')
      console.log('📦 getCurrentUser 响应:', response.data)
      
      // API 不返回 id，我们需要从 authInfo 获取 UUID
      const authInfo = getAuthInfo()
      return {
        id: 0, // API 不返回数据库 ID
        uuid: authInfo?.userId || '',
        username: response.data.username || '',
        avatar: response.data.avatar || '',
        created_at: response.data.created_at || '',
        updated_at: response.data.updated_at || '',
      }
    } catch (error: any) {
      console.error('❌ 获取当前用户信息失败')
      console.error('请求 URL:', '/user/users')
      console.error('响应状态:', error.response?.status)
      console.error('错误信息:', error.response?.data || error.message)
      throw error
    }
  },
}
