/**
 * API 客户端配置
 * 
 * 功能：
 * 1. 配置 baseURL
 * 2. 请求拦截器：自动添加 Authorization token 和 Token 自动刷新
 * 3. 响应拦截器：统一错误处理（401 跳转登录）
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { getAccessToken, shouldRefreshToken, getRefreshToken, saveAuthInfo, clearAuthInfo, getAuthInfo, isRefreshTokenValid } from '@/lib/utils/tokenManager'
import { gatewayApi } from './endpoints/gateway'
import { logFlow } from '@/utils/tokenDebug'

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
 * 
 * 逻辑流程：
 * 1. 如果有认证信息，检查 Access Token 是否需要刷新
 *    - 如果 Access Token 过期且 Refresh Token 有效 → 刷新 Token
 *    - 如果 Refresh Token 也过期 → 清除认证信息，跳转登录页
 * 2. 添加 Authorization header（如果有 token）
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const authInfo = getAuthInfo()
    
    // 如果没有认证信息，直接放行（可能是公开接口）
    if (!authInfo) {
      logFlow('请求拦截器：无认证信息，直接放行', { url: config.url })
      return config
    }

    // 如果有认证信息，检查 Access Token 是否需要刷新
    if (shouldRefreshToken() && !isRefreshing) {
      logFlow('请求拦截器：检测到 Access Token 即将过期，开始刷新', { url: config.url })
      // 在刷新前，先检查 Refresh Token 是否有效
      if (!isRefreshTokenValid()) {
        const errorMsg = '⚠️ Refresh Token 已过期，需要重新登录'
        console.warn(errorMsg)
        
        logFlow('请求拦截器：Refresh Token 已过期，跳转登录页', {
          authInfo: authInfo ? {
            tokenObtainedAt: authInfo.tokenObtainedAt,
            tokenExpiresIn: authInfo.tokenExpiresIn,
            refreshTokenObtainedAt: authInfo.refreshTokenObtainedAt,
            refreshExpiresIn: authInfo.refreshExpiresIn,
          } : null
        })
        
        // 保存错误日志
        localStorage.setItem('token_error_log', JSON.stringify({
          error: 'refresh_token_expired',
          message: errorMsg,
          timestamp: Date.now(),
          authInfo: authInfo ? {
            tokenObtainedAt: authInfo.tokenObtainedAt,
            tokenExpiresIn: authInfo.tokenExpiresIn,
            refreshTokenObtainedAt: authInfo.refreshTokenObtainedAt,
            refreshExpiresIn: authInfo.refreshExpiresIn,
          } : null
        }))
        
        clearAuthInfo()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(new Error('Refresh token expired'))
      }

      isRefreshing = true

      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        console.log('🔄 Access Token 即将过期，使用 Refresh Token 刷新...')
        console.log('📊 当前认证信息:', {
          accessTokenObtainedAt: new Date(authInfo.tokenObtainedAt).toLocaleString('zh-CN'),
          refreshTokenObtainedAt: new Date(authInfo.refreshTokenObtainedAt).toLocaleString('zh-CN'),
        })
        
        logFlow('请求拦截器：调用刷新接口', {
          accessTokenObtainedAt: new Date(authInfo.tokenObtainedAt).toLocaleString('zh-CN'),
          refreshTokenObtainedAt: new Date(authInfo.refreshTokenObtainedAt).toLocaleString('zh-CN'),
        })
        
        // 调用刷新接口
        const response = await gatewayApi.refreshToken({
          refresh_token: refreshToken,
        })

        logFlow('请求拦截器：刷新接口返回成功', { expiresIn: response.data.expires_in })

        // 根据 API 文档（第 278-291 行），响应格式为：
        // { code: 'OK', data: { access_token: ..., refresh_token: ..., expires_in: ..., ... } }
        // gatewayApi.refreshToken 返回的是 response.data（即 axios 的 response.data）
        // 所以 response 就是 { code: 'OK', data: {...} }
        // response.data 才是 tokens
        const tokens = response.data
        
        // 检查响应格式
        if (!tokens || !tokens.access_token) {
          console.error('❌ 刷新接口返回格式错误')
          throw new Error('Invalid refresh token response format')
        }

        // 保存新 Token（保留原有用户信息）
        const currentAuthInfo = getAuthInfo()
        const now = Date.now()
        saveAuthInfo({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenObtainedAt: now,
          tokenExpiresIn: tokens.expires_in,
          refreshTokenObtainedAt: now,
          refreshExpiresIn: tokens.refresh_expires_in,
          username: currentAuthInfo?.username,
          avatarUrl: currentAuthInfo?.avatarUrl,
        })

        console.log('✅ Access Token 刷新成功')
        console.log(`📅 新 Token 有效期: ${tokens.expires_in} 秒`)
        
        logFlow('请求拦截器：Token 刷新成功，保存新 Token', {
          newExpiresIn: tokens.expires_in,
          newTokenObtainedAt: new Date(now).toLocaleString('zh-CN')
        })
        
        // 保存成功日志
        localStorage.setItem('token_test_log', JSON.stringify({
          action: 'token_refresh_success',
          timestamp: now,
          message: 'Token 刷新成功'
        }))
        
        // 处理等待队列
        processQueue(null, tokens.access_token)
        logFlow('请求拦截器：处理等待队列完成', { queueLength: failedQueue.length })
      } catch (error: any) {
        console.error('❌ Token 刷新失败:', error)
        console.error('错误详情:', error.message)
        
        logFlow('请求拦截器：Token 刷新失败，跳转登录页', {
          error: error.message,
          responseData: error.response?.data,
          status: error.response?.status
        })
        
        // 保存错误日志
        localStorage.setItem('token_error_log', JSON.stringify({
          error: 'refresh_failed',
          message: error.message,
          responseData: error.response?.data,
          status: error.response?.status,
          timestamp: Date.now()
        }))
        
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
  async (error) => {
    const originalRequest = error.config

    // 401 未授权：尝试刷新 Token 并重试
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('⚠️ 收到 401 响应，尝试刷新 Token...')
      logFlow('响应拦截器：收到 401 响应', { url: originalRequest.url })
      
      // 标记该请求已重试过，避免无限循环
      originalRequest._retry = true

      // 如果正在刷新，等待刷新完成
      if (isRefreshing) {
        console.log('⏳ Token 正在刷新中，请求加入等待队列...')
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => {
            // 刷新完成，使用新 Token 重试请求
            const token = getAccessToken()
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            console.log('♻️ Token 刷新完成，重试原始请求')
            return apiClient(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      // 检查是否有 Refresh Token
      const refreshToken = getRefreshToken()
      if (!refreshToken || !isRefreshTokenValid()) {
        console.warn('❌ Refresh Token 无效或已过期，需要重新登录')
        logFlow('响应拦截器：Refresh Token 无效或已过期，跳转登录页', {
          hasRefreshToken: !!refreshToken,
          isValid: isRefreshTokenValid()
        })
        clearAuthInfo()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      // 开始刷新
      isRefreshing = true

      try {
        console.log('🔄 开始刷新 Access Token...')
        logFlow('响应拦截器：开始刷新 Access Token')
        
        // 调用刷新接口
        const response = await gatewayApi.refreshToken({
          refresh_token: refreshToken,
        })

        logFlow('响应拦截器：刷新接口返回成功', { expiresIn: response.data.expires_in })

        const tokens = response.data
        
        if (!tokens || !tokens.access_token) {
          console.error('❌ 刷新接口返回格式错误')
          throw new Error('Invalid refresh token response format')
        }

        // 保存新 Token
        const authInfo = getAuthInfo()
        const now = Date.now()
        saveAuthInfo({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenObtainedAt: now,
          tokenExpiresIn: tokens.expires_in,
          refreshTokenObtainedAt: now,
          refreshExpiresIn: tokens.refresh_expires_in,
          username: authInfo?.username,
          avatarUrl: authInfo?.avatarUrl,
        })

        console.log('✅ Token 刷新成功（来自 401 响应）')
        logFlow('响应拦截器：Token 刷新成功，准备重试请求', {
          newExpiresIn: tokens.expires_in,
          newTokenObtainedAt: new Date(now).toLocaleString('zh-CN')
        })
        
        // 保存成功日志
        localStorage.setItem('token_test_log', JSON.stringify({
          action: 'token_refresh_from_401',
          timestamp: now,
          message: 'Token 在收到 401 后刷新成功'
        }))

        // 处理等待队列
        processQueue(null, tokens.access_token)
        logFlow('响应拦截器：处理等待队列完成', { queueLength: failedQueue.length })

        // 使用新 Token 重试原始请求
        originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`
        console.log('♻️ 使用新 Token 重试原始请求')
        logFlow('响应拦截器：使用新 Token 重试原始请求', { url: originalRequest.url })
        return apiClient(originalRequest)
      } catch (refreshError: any) {
        console.error('❌ Token 刷新失败（来自 401 响应）:', refreshError)
        logFlow('响应拦截器：Token 刷新失败，跳转登录页', {
          error: refreshError.message,
          responseData: refreshError.response?.data,
          status: refreshError.response?.status
        })
        
        // 保存错误日志
        localStorage.setItem('token_error_log', JSON.stringify({
          error: 'refresh_failed_from_401',
          message: refreshError.message,
          responseData: refreshError.response?.data,
          status: refreshError.response?.status,
          timestamp: Date.now()
        }))

        // 刷新失败，清除认证信息并跳转登录
        processQueue(refreshError, null)
        clearAuthInfo()
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // 其他错误直接返回
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

