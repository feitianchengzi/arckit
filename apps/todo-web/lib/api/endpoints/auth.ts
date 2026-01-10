/**
 * auth API - 认证相关接口
 */

import { apiClient } from '../client'

export interface LoginInput {
  username: string
  password: string
}

export interface RegisterInput {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  user: {
    id: number
    username: string
    avatar?: string
  }
}

export const authApi = {
  /**
   * 登录
   * 开发模式：直接返回 mock 数据，并设置测试用户信息
   * 生产模式：调用网关登录接口
   */
  login: async (input: LoginInput): Promise<AuthResponse> => {
    // 开发模式：模拟登录
    if (process.env.NODE_ENV === 'development') {
      // 生成一个固定的 UUID（基于用户名）
      const uuid = `dev-${input.username.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`
      // 存储测试用户信息到 localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('dev_user_id', uuid)
        localStorage.setItem('dev_username', input.username)
        localStorage.setItem('auth_token', 'dev-token-' + Date.now())
      }
      
      // 尝试创建用户（后端会根据 X-User-ID Header 自动创建）
      // 设置较短的超时时间，避免长时间等待
      try {
        const { data: user } = await apiClient.post('/user/users', {
          username: input.username,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${input.username}`,
        }, {
          timeout: 2000, // 2秒超时
        })
        
        return {
          token: 'dev-token',
          user: {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
          },
        }
      } catch (error: any) {
        // 如果后端不可用（连接失败、超时等），静默返回 mock 数据
        // 不抛出错误，让登录流程继续
        console.log('开发模式：后端不可用，使用 mock 数据', error.message)
        return {
          token: 'dev-token',
          user: {
            id: 1,
            username: input.username,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${input.username}`,
          },
        }
      }
    }
    
    // 生产模式：调用网关登录接口
    const { data } = await apiClient.post('/public/login', input)
    return data
  },
  
  /**
   * 注册
   * 开发模式：同登录逻辑
   * 生产模式：调用网关注册接口
   */
  register: async (input: RegisterInput): Promise<AuthResponse> => {
    // 开发模式：使用登录逻辑
    if (process.env.NODE_ENV === 'development') {
      return authApi.login(input)
    }
    
    // 生产模式：调用网关注册接口
    const { data } = await apiClient.post('/public/register', input)
    return data
  },
  
  /**
   * 获取当前用户信息
   * 开发模式：调用后端创建用户接口（如果不存在会自动创建）
   * 生产模式：调用网关获取用户信息接口
   */
  getCurrentUser: async () => {
    // 开发模式：调用后端创建用户接口
    if (process.env.NODE_ENV === 'development') {
      if (typeof window !== 'undefined') {
        const devUsername = localStorage.getItem('dev_username') || 'testuser'
        const devUserId = localStorage.getItem('dev_user_id') || '11111111-1111-1111-1111-111111111111'
        
        try {
          // 后端会根据 X-User-ID Header 自动创建或返回用户
          const { data } = await apiClient.post('/user/users', {
            username: devUsername,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${devUsername}`,
          }, {
            timeout: 2000, // 2秒超时
          })
          return data
        } catch (error: any) {
          // 如果后端不可用，返回 mock 数据
          console.log('开发模式：后端不可用，使用 mock 用户数据', error.message)
          return {
            id: 1,
            uuid: devUserId,
            username: devUsername,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${devUsername}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
      }
    }
    
    // 生产模式：调用网关获取用户信息接口
    const { data } = await apiClient.get('/user/info')
    return data
  },
}

