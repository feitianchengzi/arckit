/**
 * 网关 API 接口
 * 直接调用网关接口，不使用 mock
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import {
  SendVerificationRequest,
  SendVerificationResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  GenerateApiKeyRequest,
  GenerateApiKeyResponse,
  ApiKeyInfo,
  ListApiKeysResponse,
} from '@/types/auth'
import { getAccessToken } from '@/lib/utils/tokenManager'

// 网关基础URL（可通过环境变量 VITE_GATEWAY_URL 覆盖）
const GATEWAY_BASE_URL = import.meta.env.VITE_GATEWAY_URL || 'https://api.feitianchengzi.com'

// 创建网关专用 axios 实例
const gatewayClient: AxiosInstance = axios.create({
  baseURL: GATEWAY_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：为需要认证的接口添加 Authorization 头
gatewayClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 公共接口（登录、发送验证码等）不需要 Token
    const publicEndpoints = ['/auth-server/v1/public']
    const needsAuth = !publicEndpoints.some(endpoint => config.url?.includes(endpoint))
    
    if (needsAuth) {
      const token = getAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        console.log('🔐 网关请求添加 Authorization 头')
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 网关 API
 */
export const gatewayApi = {
  /**
   * 发送验证码
   * POST /auth-server/v1/public/send_verification
   */
  sendVerification: async (
    data: SendVerificationRequest
  ): Promise<SendVerificationResponse> => {
    const url = `${GATEWAY_BASE_URL}/auth-server/v1/public/send_verification`
    console.log('📧 调用网关发送验证码接口')
    console.log('📍 完整 URL:', url)
    console.log('📦 请求数据:', data)
    const response = await gatewayClient.post<SendVerificationResponse>(
      '/auth-server/v1/public/send_verification',
      data
    )
    return response.data
  },

  /**
   * 验证码登录
   * POST /auth-server/v1/public/login
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const url = `${GATEWAY_BASE_URL}/auth-server/v1/public/login`
    console.log('🔐 调用网关登录接口')
    console.log('📍 完整 URL:', url)
    console.log('📦 请求数据:', data)
    const response = await gatewayClient.post<LoginResponse>(
      '/auth-server/v1/public/login',
      data
    )
    return response.data
  },

  /**
   * 刷新 Token
   * POST /auth-server/v1/public/refresh_token
   */
  refreshToken: async (
    data: RefreshTokenRequest
  ): Promise<RefreshTokenResponse> => {
    const url = `${GATEWAY_BASE_URL}/auth-server/v1/public/refresh_token`
    console.log('🔄 调用网关刷新 Token 接口')
    console.log('📍 完整 URL:', url)
    console.log('📦 请求数据:', data)
    const response = await gatewayClient.post<RefreshTokenResponse>(
      '/auth-server/v1/public/refresh_token',
      data
    )
    return response.data
  },

  /**
   * 创建 API Key（需要用户已登录）
   * POST /auth-server/v1/user/generate_apikey
   */
  generateApiKey: async (
    data: GenerateApiKeyRequest
  ): Promise<GenerateApiKeyResponse> => {
    const url = `${GATEWAY_BASE_URL}/auth-server/v1/user/generate_apikey`
    console.log('🔑 调用创建 API Key 接口')
    console.log('📍 完整 URL:', url)
    console.log('📦 请求数据:', data)
    const response = await gatewayClient.post<GenerateApiKeyResponse>(
      '/auth-server/v1/user/generate_apikey',
      data
    )
    return response.data
  },

  /**
   * 查询当前账号创建的 API Key 元数据
   * GET /auth-server/v1/user/apikeys
   *
   * 注意：后端不会返回 API Key 明文，明文只在创建时返回一次。
   */
  listApiKeys: async (): Promise<ApiKeyInfo[]> => {
    const response = await gatewayClient.get<ListApiKeysResponse>('/auth-server/v1/user/apikeys')
    const payload = response.data?.data
    if (Array.isArray(payload)) return payload
    if (payload && typeof payload === 'object') {
      if (Array.isArray(payload.api_keys)) return payload.api_keys
      if (Array.isArray(payload.items)) return payload.items
      if (Array.isArray(payload.keys)) return payload.keys
    }
    return []
  },
}
