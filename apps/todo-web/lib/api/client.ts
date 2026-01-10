/**
 * API 客户端配置
 * 
 * 功能：
 * 1. 配置 baseURL
 * 2. 请求拦截器：自动添加 Authorization token
 * 3. 响应拦截器：统一错误处理（401 跳转登录）
 */

import axios from 'axios'

// 创建 Axios 实例
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/todo/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 秒超时
})

// 请求拦截器：添加 Authorization token 和开发模式 Header
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // 开发模式：直接设置 Header（模拟网关行为）
      if (process.env.NODE_ENV === 'development') {
        // 从 localStorage 获取测试用户信息，如果没有则使用默认值
        const devUserId = localStorage.getItem('dev_user_id') || '11111111-1111-1111-1111-111111111111'
        const devUsername = localStorage.getItem('dev_username') || 'testuser'
        
        config.headers['X-User-ID'] = devUserId
        config.headers['X-User-Username'] = devUsername
      } else {
        // 生产模式：使用 JWT token（通过网关）
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：统一错误处理
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // 401 未授权：跳转到登录页
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // 清除 token
        localStorage.removeItem('auth_token')
        // 跳转到登录页
        window.location.href = '/login'
      }
    }
    
    // 其他错误：返回错误信息
    return Promise.reject(error)
  }
)

/**
 * API 错误类型
 */
export interface ApiError {
  message: string
  code?: string
  status?: number
}

/**
 * 统一错误处理函数
 */
export function handleApiError(error: any): ApiError {
  if (error.response) {
    // 服务器返回错误
    return {
      message: error.response.data?.message || '请求失败',
      code: error.response.data?.code,
      status: error.response.status,
    }
  } else if (error.request) {
    // 请求发送失败（网络错误）
    return {
      message: '网络连接失败，请检查网络',
      code: 'NETWORK_ERROR',
    }
  } else {
    // 其他错误
    return {
      message: error.message || '未知错误',
      code: 'UNKNOWN_ERROR',
    }
  }
}

