/**
 * API 客户端配置
 * 
 * 功能：
 * 1. 配置 baseURL
 * 2. 请求拦截器：自动添加 Authorization token 和 Token 自动刷新
 * 3. 响应拦截器：统一错误处理（401 跳转登录）
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { getAccessToken, shouldRefreshToken, getRefreshToken, saveAuthInfo, clearAuthInfo, getAuthInfo } from '@/lib/utils/tokenManager'
import { gatewayApi } from './endpoints/gateway'

// Workshop 后端基础URL
// 注意：路径格式为 /{service}/v1/...，所以 baseURL 应该包含 service 和 v1
const WORKSHOP_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.feitianchengzi.com/workshop/v1'

// 创建 axios 实例
export const apiClient: AxiosInstance = axios.create({
  baseURL: WORKSHOP_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 标记是否正在刷新 Token
let isRefreshing = false
// 刷新 Token 时等待的请求队列
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: any) => void
}> = []

/**
 * 处理队列中的请求
 */
function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

/**
 * 请求拦截器：自动添加 Token 和检查刷新
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 检查是否需要刷新 Token
    if (shouldRefreshToken() && !isRefreshing) {
      isRefreshing = true

      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        console.log('🔄 Token 即将过期，自动刷新...')
        
        // 调用刷新接口
        const response = await gatewayApi.refreshToken({
          refresh_token: refreshToken,
        })

        // 保存新 Token（保留原有用户信息）
        const authInfo = getAuthInfo()
        saveAuthInfo({
          accessToken: response.data.tokens.access_token,
          refreshToken: response.data.tokens.refresh_token,
          tokenObtainedAt: Date.now(),
          tokenExpiresIn: response.data.tokens.expires_in,
          username: authInfo?.username,
          avatarUrl: authInfo?.avatarUrl,
        })

        console.log('✅ Token 刷新成功')
        
        // 处理等待队列
        processQueue(null, response.data.tokens.access_token)
      } catch (error) {
        console.error('❌ Token 刷新失败:', error)
        
        // 清除认证信息
        clearAuthInfo()
        
        // 刷新失败，跳转到登录页
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        
        // 处理等待队列
        processQueue(error, null)
        
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    // 如果正在刷新，将请求加入队列
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(() => {
        // Token 刷新完成后，使用新 Token 重新发起请求
        const token = getAccessToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      })
    }

    // 添加 Authorization header
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 注意：网关会自动从 JWT Token 中提取用户信息并添加 X-User-ID、X-Username 等请求头
    // 前端不需要（也不应该）手动添加这些头，网关会自动处理

    // 统一打印请求日志（包含完整 URL）
    const fullUrl = `${config.baseURL}${config.url}`
    const method = config.method?.toUpperCase() || 'GET'
    console.log(`🌐 API 请求: ${method} ${fullUrl}`)

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器：处理错误
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 未授权：跳转登录
    if (error.response?.status === 401) {
      clearAuthInfo()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }

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

