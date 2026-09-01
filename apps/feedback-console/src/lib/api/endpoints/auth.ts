/**
 * TODO 后端 API - 用户相关接口
 */

import { apiClient } from '../client'
import { handleResponse } from '../interceptors/response'
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
      const response = await apiClient.post('/user/users', requestBody)
      
      // 使用 handleResponse 统一处理响应格式: {code: 'OK', data: {...}}
      const responseData = handleResponse<{
        username: string
        avatar: string
        created_at: string
        updated_at: string
      }>(response)
      
      return {
        id: 0, // API 不返回数据库 ID
        uuid: '', // 网关已处理，前端不需要 UUID
        username: responseData.username || '',
        avatar: responseData.avatar || '',
        created_at: responseData.created_at || '',
        updated_at: responseData.updated_at || '',
      }
    } catch (error: any) {
      console.error('❌ 创建/获取用户失败:', error.message)
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
      const response = await apiClient.put('/user/users', data)
      
      // 使用 handleResponse 统一处理响应格式: {code: 'OK', data: {...}}
      const responseData = handleResponse<{
        username: string
        avatar: string
        created_at: string
        updated_at: string
      }>(response)
      
      
      return {
        id: 0, // API 不返回数据库 ID
        uuid: '', // 网关已处理，前端不需要 UUID
        username: responseData.username || '',
        avatar: responseData.avatar || '',
        created_at: responseData.created_at || '',
        updated_at: responseData.updated_at || '',
      }
    } catch (error: any) {
      console.error('❌ 更新用户信息失败:', error.message)
      throw error
    }
  },

  /**
   * 获取当前登录用户信息
   * GET /user/users
   * 通过 Header 中的 UserID 识别用户（网关自动注入）
   */
  getCurrentUser: async (): Promise<TodoUser> => {
    console.log('📥 获取当前登录用户信息 [REQUEST TRACE]: /user/users called from auth.ts')
    console.log('ℹ️  网关会自动从 Token 中解析 UserID 并注入到请求头')
    try {
      const response = await apiClient.get('/user/users')
      
      // 使用 handleResponse 统一处理响应格式: {code: 'OK', data: {...}}
      const responseData = handleResponse<{
        username: string
        avatar: string
        created_at: string
        updated_at: string
      }>(response)
      
      
      return {
        id: 0, // API 不返回数据库 ID
        uuid: '', // 网关已处理，前端不需要 UUID
        username: responseData.username || '',
        avatar: responseData.avatar || '',
        created_at: responseData.created_at || '',
        updated_at: responseData.updated_at || '',
      }
    } catch (error: any) {
      console.error('❌ 获取当前用户信息失败')
      console.error('请求 URL:', '/user/users')
      console.error('请求失败:', error.message)
      throw error
    }
  },
}
