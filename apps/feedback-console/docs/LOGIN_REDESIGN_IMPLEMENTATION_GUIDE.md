# 登录流程重设计 - 编码实现指导文档

## 📋 文档说明

本文档为弱AI开发者提供详细的逐步实现指导，包含完整代码示例和详细说明。请按顺序完成每个步骤。

---

## 🎯 开发目标

实现基于验证码的新登录流程，包括：
1. 验证码登录页面
2. Token自动管理和刷新
3. 首次登录用户设置对话框
4. 自动注册功能

---

## 🛠️ 技术栈

```json
{
  "框架": "Next.js 14 (App Router)",
  "语言": "TypeScript",
  "UI": "React 18 + Tailwind CSS",
  "状态管理": "Zustand",
  "数据获取": "React Query (TanStack Query)",
  "HTTP客户端": "Axios",
  "表单": "React Hook Form + Zod"
}
```

---

## 📁 文件结构

### 需要创建的文件

```
frontend/
├── components/
│   ├── ui/
│   │   ├── VerificationCodeInput.tsx    ✨ 新增
│   │   ├── AvatarUpload.tsx             ✨ 新增
│   │   └── Dialog.tsx                   ✨ 新增
│   └── features/
│       └── FirstTimeSetupDialog.tsx     ✨ 新增
├── lib/
│   ├── api/
│   │   └── endpoints/
│   │       ├── auth.ts                  🔧 修改
│   │       └── gateway.ts               ✨ 新增
│   └── utils/
│       ├── validators.ts                ✨ 新增
│       └── tokenManager.ts              ✨ 新增
├── hooks/
│   ├── useAuth.ts                       🔧 修改
│   └── useTokenRefresh.ts               ✨ 新增
├── store/
│   └── authStore.ts                     🔧 修改
├── app/
│   └── (auth)/
│       ├── login/
│       │   └── page.tsx                 🔧 完全重写
│       └── register/
│           └── page.tsx                 🔧 改为重定向
└── types/
    └── auth.ts                          ✨ 新增
```

---

## 🚀 实施步骤

## 阶段 1: 基础设施和类型定义

### 步骤 1.1: 创建类型定义

**文件**: `frontend/types/auth.ts`

```typescript
/**
 * 认证相关类型定义
 */

// ==================== 网关 API 类型 ====================

/** 验证码类型 */
export type CodeType = 'email' | 'sms'

/** 验证码用途 */
export type CodePurpose = 'register' | 'login' | 'reset_password'

/** 发送验证码请求 */
export interface SendVerificationRequest {
  code_type: CodeType
  target: string  // 邮箱或手机号
  purpose?: CodePurpose  // 已废弃，可不传
}

/** 发送验证码响应 */
export interface SendVerificationResponse {
  success: boolean
  message: string
}

/** 登录请求（邮箱） */
export interface LoginWithEmailRequest {
  email: string
  code: string
  code_type: 'email'
  purpose: 'login'
}

/** 登录请求（手机号） */
export interface LoginWithPhoneRequest {
  phone: string
  code: string
  code_type: 'sms'
  purpose: 'login'
}

/** 登录请求联合类型 */
export type LoginRequest = LoginWithEmailRequest | LoginWithPhoneRequest

/** Token 信息 */
export interface TokenInfo {
  access_token: string
  refresh_token: string
  expires_in: number  // 秒数，如 7200 (2小时)
}

/** 网关用户信息 */
export interface GatewayUser {
  id: string  // UUID
  email?: string
  phone?: string
  username?: string | null
  avatar_url?: string | null
}

/** 登录响应 */
export interface LoginResponse {
  success: boolean
  data: {
    user: GatewayUser
    tokens: TokenInfo
  }
}

/** 刷新Token请求 */
export interface RefreshTokenRequest {
  refresh_token: string
}

/** 刷新Token响应 */
export interface RefreshTokenResponse {
  success: boolean
  data: {
    tokens: TokenInfo
  }
}

// ==================== TODO 后端 API 类型 ====================

/** 创建/获取用户请求 */
export interface CreateUserRequest {
  username?: string
  avatar?: string
}

/** TODO 后端用户信息 */
export interface TodoUser {
  id: number
  uuid: string
  username: string
  avatar: string
  created_at: string
  updated_at: string
}

// ==================== 本地存储类型 ====================

/** 本地存储的认证信息 */
export interface StoredAuthInfo {
  accessToken: string
  refreshToken: string
  tokenObtainedAt: number  // 时间戳（毫秒）
  tokenExpiresIn: number   // 秒数
  userId: string           // UUID
  username?: string
  avatarUrl?: string
}

// ==================== 组件 Props 类型 ====================

/** 验证码输入框 Props */
export interface VerificationCodeInputProps {
  value: string
  onChange: (value: string) => void
  onSendCode: () => Promise<void>
  disabled?: boolean
  error?: string
  countdown: number
  isSending: boolean
}

/** 首次设置对话框 Props */
export interface FirstTimeSetupDialogProps {
  open: boolean
  onClose: () => void
  onComplete: (data: { username: string; avatar?: string }) => void
  defaultUsername?: string
}

/** 头像上传组件 Props */
export interface AvatarUploadProps {
  value?: string
  onChange: (url: string) => void
  maxSize?: number  // KB
  recommendedSize?: string
}
```

**说明**:
- 严格按照网关接口文档定义类型
- 区分网关API和TODO后端API的类型
- 定义本地存储数据结构
- 为组件提供Props类型

---

### 步骤 1.2: 创建验证工具

**文件**: `frontend/lib/utils/validators.ts`

```typescript
/**
 * 验证工具函数
 */

import { CodeType } from '@/types/auth'

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证手机号格式（中国大陆）
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * 智能识别输入类型（邮箱或手机号）
 * @returns 'email' | 'sms' | null
 */
export function detectInputType(input: string): CodeType | null {
  const trimmed = input.trim()
  
  if (isValidEmail(trimmed)) {
    return 'email'
  }
  
  if (isValidPhone(trimmed)) {
    return 'sms'
  }
  
  return null
}

/**
 * 验证用户名格式
 * 规则：2-20个字符，支持中英文、数字、下划线
 */
export function isValidUsername(username: string): boolean {
  if (username.length < 2 || username.length > 20) {
    return false
  }
  const usernameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/
  return usernameRegex.test(username)
}

/**
 * 验证验证码格式
 * 规则：6位数字
 */
export function isValidVerificationCode(code: string): boolean {
  const codeRegex = /^\d{6}$/
  return codeRegex.test(code)
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

/**
 * 验证图片文件
 */
export function validateImageFile(
  file: File,
  maxSizeKB: number = 200
): { valid: boolean; error?: string } {
  // 验证文件类型
  const validTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: '只支持 JPG、PNG、GIF 格式',
    }
  }

  // 验证文件大小
  const maxSizeBytes = maxSizeKB * 1024
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `文件大小不能超过 ${maxSizeKB}KB`,
    }
  }

  return { valid: true }
}
```

---

### 步骤 1.3: 创建 Token 管理工具

**文件**: `frontend/lib/utils/tokenManager.ts`

```typescript
/**
 * Token 管理工具
 * 负责 Token 的存储、读取、验证和刷新
 */

import { StoredAuthInfo } from '@/types/auth'

const STORAGE_KEY = 'auth_info'
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000 // 5分钟缓冲期（毫秒）

/**
 * 保存认证信息到 localStorage
 */
export function saveAuthInfo(info: StoredAuthInfo): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info))
    
    // 同时设置 cookie 供中间件使用
    document.cookie = `auth_token=${info.accessToken}; path=/; max-age=${info.tokenExpiresIn}; SameSite=Lax`
  } catch (error) {
    console.error('Failed to save auth info:', error)
  }
}

/**
 * 从 localStorage 读取认证信息
 */
export function getAuthInfo(): StoredAuthInfo | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    
    return JSON.parse(stored) as StoredAuthInfo
  } catch (error) {
    console.error('Failed to get auth info:', error)
    return null
  }
}

/**
 * 清除认证信息
 */
export function clearAuthInfo(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(STORAGE_KEY)
    // 清除 cookie
    document.cookie = 'auth_token=; path=/; max-age=0'
  } catch (error) {
    console.error('Failed to clear auth info:', error)
  }
}

/**
 * 检查 Token 是否已过期
 * @param bufferMs 提前多少毫秒视为过期（默认5分钟）
 */
export function isTokenExpired(
  authInfo: StoredAuthInfo,
  bufferMs: number = TOKEN_EXPIRY_BUFFER
): boolean {
  const now = Date.now()
  const expiresAt = authInfo.tokenObtainedAt + (authInfo.tokenExpiresIn * 1000)
  
  // 提前5分钟视为过期，以便有时间刷新
  return now >= (expiresAt - bufferMs)
}

/**
 * 获取 Token 剩余有效时间（秒）
 */
export function getTokenRemainingTime(authInfo: StoredAuthInfo): number {
  const now = Date.now()
  const expiresAt = authInfo.tokenObtainedAt + (authInfo.tokenExpiresIn * 1000)
  const remaining = Math.max(0, expiresAt - now)
  
  return Math.floor(remaining / 1000)
}

/**
 * 检查是否需要刷新 Token
 * 如果 Token 即将在5分钟内过期，返回 true
 */
export function shouldRefreshToken(): boolean {
  const authInfo = getAuthInfo()
  if (!authInfo) return false
  
  return isTokenExpired(authInfo, TOKEN_EXPIRY_BUFFER)
}

/**
 * 从认证信息中提取访问令牌
 */
export function getAccessToken(): string | null {
  const authInfo = getAuthInfo()
  return authInfo?.accessToken || null
}

/**
 * 从认证信息中提取刷新令牌
 */
export function getRefreshToken(): string | null {
  const authInfo = getAuthInfo()
  return authInfo?.refreshToken || null
}
```

**说明**:
- 集中管理 Token 的所有操作
- 自动处理 Token 过期检查
- 提前5分钟判定为即将过期，预留刷新时间
- 同时管理 localStorage 和 cookie

---

## 阶段 2: API 接口层

### 步骤 2.1: 创建网关 API 客户端

**文件**: `frontend/lib/api/endpoints/gateway.ts`

```typescript
/**
 * 网关 API 接口
 * 基础URL: 生产环境使用域名，开发环境使用 mock
 */

import axios, { AxiosInstance } from 'axios'
import {
  SendVerificationRequest,
  SendVerificationResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '@/types/auth'

// 网关基础URL（生产环境需要配置域名）
const GATEWAY_BASE_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.example.com'

// 创建网关专用 axios 实例
const gatewayClient: AxiosInstance = axios.create({
  baseURL: GATEWAY_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

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
    // 开发模式：模拟发送验证码
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [DEV] 模拟发送验证码:', data)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟成功
      return {
        success: true,
        message: '验证码已发送',
      }
    }

    // 生产模式：调用网关接口
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
    // 开发模式：模拟登录
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 [DEV] 模拟登录:', data)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 验证码必须是 '123456' 才能成功
      if (data.code !== '123456') {
        throw new Error('验证码错误')
      }

      const target = 'email' in data ? data.email : data.phone
      const uuid = `dev-${target.replace(/[^a-zA-Z0-9]/g, '-')}`

      // 模拟成功响应
      return {
        success: true,
        data: {
          user: {
            id: uuid,
            email: 'email' in data ? data.email : undefined,
            phone: 'phone' in data ? data.phone : undefined,
            username: null,
            avatar_url: null,
          },
          tokens: {
            access_token: `dev-access-token-${Date.now()}`,
            refresh_token: `dev-refresh-token-${Date.now()}`,
            expires_in: 7200, // 2小时
          },
        },
      }
    }

    // 生产模式：调用网关接口
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
    // 开发模式：模拟刷新
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [DEV] 模拟刷新 Token')
      await new Promise(resolve => setTimeout(resolve, 500))

      return {
        success: true,
        data: {
          tokens: {
            access_token: `dev-access-token-${Date.now()}`,
            refresh_token: `dev-refresh-token-${Date.now()}`,
            expires_in: 7200,
          },
        },
      }
    }

    // 生产模式：调用网关接口
    const response = await gatewayClient.post<RefreshTokenResponse>(
      '/auth-server/v1/public/refresh_token',
      data
    )
    return response.data
  },
}
```

**说明**:
- 独立的网关 API 客户端
- 开发模式使用 mock 数据（验证码固定为 `123456`）
- 生产模式调用真实网关接口
- 清晰的错误处理

---

### 步骤 2.2: 修改 TODO 后端 API

**文件**: `frontend/lib/api/endpoints/auth.ts` (修改)

```typescript
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
    const response = await apiClient.post<TodoUser>('/user/users', data || {})
    return response.data
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
```

**说明**:
- TODO 后端接口保持不变
- 使用现有的 `apiClient`（已配置 interceptor）
- 接口会自动从 Header 中读取 UUID

---

### 步骤 2.3: 配置 API Client Interceptor

**文件**: `frontend/lib/api/client.ts` (修改)

在现有文件中添加 Token 刷新逻辑：

```typescript
/**
 * API 客户端配置
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { getAccessToken, shouldRefreshToken, getRefreshToken, saveAuthInfo, clearAuthInfo } from '@/lib/utils/tokenManager'
import { gatewayApi } from './endpoints/gateway'

// TODO 后端基础URL
const TODO_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// 创建 axios 实例
export const apiClient: AxiosInstance = axios.create({
  baseURL: TODO_BASE_URL,
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

        // 保存新 Token
        saveAuthInfo({
          accessToken: response.data.tokens.access_token,
          refreshToken: response.data.tokens.refresh_token,
          tokenObtainedAt: Date.now(),
          tokenExpiresIn: response.data.tokens.expires_in,
          userId: '', // 保持原有的 userId
          username: undefined,
          avatarUrl: undefined,
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

    // 开发模式：添加测试用的 Header
    if (process.env.NODE_ENV === 'development') {
      const devUserId = localStorage.getItem('dev_user_id')
      const devUsername = localStorage.getItem('dev_username')
      
      if (devUserId) {
        config.headers['X-User-ID'] = devUserId
      }
      if (devUsername) {
        config.headers['X-Username'] = devUsername
      }
    }

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
```

**说明**:
- ✅ 每次请求前自动检查 Token 是否即将过期
- ✅ 自动刷新 Token，无需用户感知
- ✅ 刷新期间的请求会排队等待
- ✅ 刷新失败自动跳转登录页
- ✅ 开发模式自动添加测试 Header

---

## 阶段 3: 状态管理

### 步骤 3.1: 重构 Auth Store

**文件**: `frontend/store/authStore.ts` (完全重写)

```typescript
/**
 * 认证状态管理 Store
 * 管理登录状态、用户信息、Token
 */

import { create } from 'zustand'
import { TodoUser, TokenInfo } from '@/types/auth'
import {
  saveAuthInfo,
  getAuthInfo,
  clearAuthInfo,
  getAccessToken,
} from '@/lib/utils/tokenManager'

interface AuthState {
  // 状态
  isAuthenticated: boolean
  user: TodoUser | null
  isLoading: boolean

  // Actions
  setAuth: (tokens: TokenInfo, userId: string) => void
  setUser: (user: TodoUser) => void
  logout: () => void
  checkAuth: () => boolean
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // 初始状态
  isAuthenticated: false,
  user: null,
  isLoading: true,

  /**
   * 设置认证信息（登录时调用）
   */
  setAuth: (tokens: TokenInfo, userId: string) => {
    saveAuthInfo({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenObtainedAt: Date.now(),
      tokenExpiresIn: tokens.expires_in,
      userId,
    })

    set({ isAuthenticated: true })
  },

  /**
   * 设置用户信息
   */
  setUser: (user: TodoUser) => {
    // 同时更新 localStorage 中的用户信息
    const authInfo = getAuthInfo()
    if (authInfo) {
      saveAuthInfo({
        ...authInfo,
        username: user.username,
        avatarUrl: user.avatar,
      })
    }

    set({ user })
  },

  /**
   * 退出登录
   */
  logout: () => {
    clearAuthInfo()
    set({
      isAuthenticated: false,
      user: null,
    })

    // 跳转到登录页
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  },

  /**
   * 检查认证状态
   */
  checkAuth: () => {
    const token = getAccessToken()
    const hasAuth = !!token

    set({ isAuthenticated: hasAuth })
    return hasAuth
  },

  /**
   * 初始化：从 localStorage 恢复状态
   */
  initialize: () => {
    const authInfo = getAuthInfo()

    if (authInfo && authInfo.accessToken) {
      set({
        isAuthenticated: true,
        user: authInfo.username
          ? {
              id: 0,
              uuid: authInfo.userId,
              username: authInfo.username,
              avatar: authInfo.avatarUrl || '',
              created_at: '',
              updated_at: '',
            }
          : null,
        isLoading: false,
      })
    } else {
      set({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      })
    }
  },
}))

// 便捷的 Hooks
export const useCurrentUser = () => useAuthStore((state) => state.user)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
```

---

## 阶段 4: Hooks

### 步骤 4.1: 创建登录 Hook

**文件**: `frontend/hooks/useAuth.ts` (重写)

```typescript
/**
 * 认证相关 Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { gatewayApi } from '@/lib/api/endpoints/gateway'
import { todoUserApi } from '@/lib/api/endpoints/auth'
import { useAuthStore } from '@/store/authStore'
import {
  SendVerificationRequest,
  LoginRequest,
  CreateUserRequest,
} from '@/types/auth'

/**
 * 发送验证码 Hook
 */
export function useSendVerificationCode() {
  return useMutation({
    mutationFn: (data: SendVerificationRequest) => gatewayApi.sendVerification(data),
    onSuccess: () => {
      console.log('✅ 验证码发送成功')
    },
    onError: (error: any) => {
      console.error('❌ 验证码发送失败:', error)
      throw error
    },
  })
}

/**
 * 登录 Hook
 */
export function useLogin() {
  const router = useRouter()
  const { setAuth, setUser } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginRequest) => gatewayApi.login(data),
    onSuccess: async (response) => {
      console.log('✅ 登录成功:', response.data.user)

      // 1. 保存 Token 到 localStorage
      setAuth(response.data.tokens, response.data.user.id)

      // 2. 尝试创建/获取 TODO 后端用户
      try {
        const todoUser = await todoUserApi.createOrGetUser({
          username: response.data.user.username || undefined,
          avatar: response.data.user.avatar_url || undefined,
        })

        // 3. 保存用户信息到 Store
        setUser(todoUser)

        // 4. 检查是否需要首次设置
        if (!todoUser.username) {
          // 首次登录，需要设置用户名
          console.log('📝 首次登录，需要设置用户名')
          // 这里不跳转，由页面组件检测并显示对话框
        } else {
          // 已设置，直接跳转
          router.push('/projects')
        }
      } catch (error) {
        console.error('❌ 获取用户信息失败:', error)
        // 即使失败也允许进入应用
        router.push('/projects')
      }

      // 5. 清除相关查询缓存
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error: any) => {
      console.error('❌ 登录失败:', error)
      throw error
    },
  })
}

/**
 * 首次设置用户信息 Hook
 */
export function useFirstTimeSetup() {
  const { setUser } = useAuthStore()

  return useMutation({
    mutationFn: (data: CreateUserRequest) => todoUserApi.createOrGetUser(data),
    onSuccess: (user) => {
      console.log('✅ 用户信息设置成功:', user)
      setUser(user)
    },
    onError: (error: any) => {
      console.error('❌ 用户信息设置失败:', error)
      throw error
    },
  })
}

/**
 * 退出登录 Hook
 */
export function useLogout() {
  const router = useRouter()
  const { logout } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      // 这里可以调用后端的退出接口（如果有）
      return Promise.resolve()
    },
    onSuccess: () => {
      // 清除本地状态
      logout()

      // 清除所有查询缓存
      queryClient.clear()

      // 跳转到登录页
      router.push('/login')
    },
  })
}

/**
 * 获取当前用户 Hook
 */
export function useCurrentUser() {
  const { isAuthenticated, user, setUser } = useAuthStore()

  return useQuery({
    queryKey: ['user', 'current'],
    queryFn: () => todoUserApi.getCurrentUser(),
    enabled: isAuthenticated && !user,
    staleTime: 5 * 60 * 1000, // 5分钟内认为数据新鲜
    onSuccess: (data) => {
      setUser(data)
    },
  })
}
```

---

## 阶段 5: UI 组件

### 步骤 5.1: 创建对话框组件

**文件**: `frontend/components/ui/Dialog.tsx`

```typescript
/**
 * 对话框组件
 * 使用 Headless UI 的 Dialog 实现
 */

'use client'

import { Fragment } from 'react'
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  showCloseButton = true,
}: DialogProps) {
  return (
    <Transition appear show={open} as={Fragment}>
      <HeadlessDialog as="div" className="relative z-50" onClose={onClose}>
        {/* 背景遮罩 */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        {/* 对话框容器 */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <HeadlessDialog.Panel
                className={`w-full ${maxWidthClasses[maxWidth]} transform overflow-hidden rounded-xl bg-white shadow-xl transition-all`}
              >
                {/* 标题区域 */}
                {(title || showCloseButton) && (
                  <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                    <div className="flex-1">
                      {title && (
                        <HeadlessDialog.Title
                          as="h2"
                          className="text-xl font-semibold text-gray-900"
                        >
                          {title}
                        </HeadlessDialog.Title>
                      )}
                      {description && (
                        <HeadlessDialog.Description className="mt-1 text-sm text-gray-500">
                          {description}
                        </HeadlessDialog.Description>
                      )}
                    </div>
                    {showCloseButton && (
                      <button
                        type="button"
                        className="ml-4 text-gray-400 hover:text-gray-500"
                        onClick={onClose}
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* 内容区域 */}
                <div className="px-6 py-4">{children}</div>
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  )
}
```

**说明**: 如果项目中没有安装 `@heroicons/react`，请安装：

```bash
npm install @heroicons/react
```

---

### 步骤 5.2: 创建验证码输入组件

**文件**: `frontend/components/ui/VerificationCodeInput.tsx`

```typescript
/**
 * 验证码输入组件
 * 包含输入框和发送验证码按钮（带倒计时）
 */

'use client'

import { useState, useEffect } from 'react'
import { TextField } from './TextField'
import { Button } from './Button'

export interface VerificationCodeInputProps {
  /** 验证码值 */
  value: string
  /** 值改变回调 */
  onChange: (value: string) => void
  /** 发送验证码回调 */
  onSendCode: () => Promise<void>
  /** 是否禁用 */
  disabled?: boolean
  /** 错误信息 */
  error?: string
  /** 发送按钮是否禁用（例如：用户名未填写时） */
  sendButtonDisabled?: boolean
}

const COUNTDOWN_SECONDS = 60

export function VerificationCodeInput({
  value,
  onChange,
  onSendCode,
  disabled,
  error,
  sendButtonDisabled,
}: VerificationCodeInputProps) {
  const [countdown, setCountdown] = useState(0)
  const [isSending, setIsSending] = useState(false)

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 发送验证码
  const handleSendCode = async () => {
    if (countdown > 0 || isSending || sendButtonDisabled) return

    setIsSending(true)
    try {
      await onSendCode()
      // 成功后开始倒计时
      setCountdown(COUNTDOWN_SECONDS)
    } catch (error) {
      // 错误由父组件处理
      console.error('发送验证码失败:', error)
    } finally {
      setIsSending(false)
    }
  }

  // 按钮文字
  const getButtonText = () => {
    if (isSending) return '发送中...'
    if (countdown > 0) return `${countdown}秒后重新发送`
    return '发送验证码'
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        验证码
      </label>
      
      <div className="flex gap-2">
        {/* 验证码输入框 */}
        <div className="flex-1">
          <input
            type="text"
            maxLength={6}
            value={value}
            onChange={(e) => {
              // 只允许数字
              const numericValue = e.target.value.replace(/\D/g, '')
              onChange(numericValue)
            }}
            placeholder="请输入6位验证码"
            disabled={disabled}
            className={`
              w-full px-3 py-2 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
              ${error ? 'border-error' : 'border-gray-300'}
            `}
          />
        </div>

        {/* 发送按钮 */}
        <Button
          type="button"
          variant="secondary"
          onClick={handleSendCode}
          disabled={countdown > 0 || isSending || sendButtonDisabled}
          loading={isSending}
          className="whitespace-nowrap"
        >
          {getButtonText()}
        </Button>
      </div>

      {/* 辅助文字或错误提示 */}
      {error ? (
        <p className="text-sm text-error">{error}</p>
      ) : countdown > 0 ? (
        <p className="text-sm text-gray-500">{countdown}秒后可重新发送</p>
      ) : (
        <p className="text-sm text-gray-500">请输入收到的6位验证码</p>
      )}
    </div>
  )
}
```

---

### 步骤 5.3: 创建头像上传组件

**文件**: `frontend/components/ui/AvatarUpload.tsx`

```typescript
/**
 * 头像上传组件
 */

'use client'

import { useState, useRef } from 'react'
import { validateImageFile, formatFileSize } from '@/lib/utils/validators'

export interface AvatarUploadProps {
  /** 头像 URL */
  value?: string
  /** 上传成功回调 */
  onChange: (url: string) => void
  /** 最大文件大小（KB） */
  maxSize?: number
  /** 推荐尺寸文字 */
  recommendedSize?: string
}

export function AvatarUpload({
  value,
  onChange,
  maxSize = 200,
  recommendedSize = '50x50',
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | undefined>(value)
  const [error, setError] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件
    const validation = validateImageFile(file, maxSize)
    if (!validation.valid) {
      setError(validation.error!)
      return
    }

    setError('')
    setIsUploading(true)

    try {
      // 生成预览
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        setPreview(dataUrl)
        onChange(dataUrl)
        setIsUploading(false)
      }
      reader.onerror = () => {
        setError('文件读取失败')
        setIsUploading(false)
      }
      reader.readAsDataURL(file)

      // 注意：这里只是本地预览
      // 如果需要上传到服务器，需要添加上传逻辑：
      // const formData = new FormData()
      // formData.append('avatar', file)
      // const response = await uploadApi.uploadAvatar(formData)
      // onChange(response.url)
    } catch (err) {
      setError('上传失败，请重试')
      setIsUploading(false)
    }
  }

  // 触发文件选择
  const handleClick = () => {
    fileInputRef.current?.click()
  }

  // 处理拖拽
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      // 模拟 input change 事件
      const input = fileInputRef.current
      if (input) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        input.files = dataTransfer.files
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        头像（可选）
      </label>

      <div className="flex items-center gap-4">
        {/* 头像预览 */}
        <div
          className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 cursor-pointer hover:border-primary transition-colors"
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {preview ? (
            <img
              src={preview}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
            </div>
          )}
        </div>

        {/* 上传按钮和说明 */}
        <div className="flex-1">
          <button
            type="button"
            onClick={handleClick}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {preview ? '更换头像' : '上传头像'}
          </button>
          <p className="mt-1 text-xs text-gray-500">
            支持 JPG、PNG，不超过 {maxSize}KB
          </p>
          <p className="text-xs text-gray-500">
            建议尺寸：{recommendedSize}
          </p>
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 错误提示 */}
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  )
}
```

---

### 步骤 5.4: 创建首次设置对话框

**文件**: `frontend/components/features/FirstTimeSetupDialog.tsx`

```typescript
/**
 * 首次登录设置对话框
 */

'use client'

import { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { AvatarUpload } from '@/components/ui/AvatarUpload'
import { isValidUsername } from '@/lib/utils/validators'

export interface FirstTimeSetupDialogProps {
  open: boolean
  onClose: () => void
  onComplete: (data: { username: string; avatar?: string }) => Promise<void>
  defaultEmail?: string
}

export function FirstTimeSetupDialog({
  open,
  onClose,
  onComplete,
  defaultEmail,
}: FirstTimeSetupDialogProps) {
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState<string>()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 验证并提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 验证用户名
    if (!isValidUsername(username)) {
      setError('用户名长度为2-20个字符，支持中英文、数字、下划线')
      return
    }

    setIsSubmitting(true)
    try {
      await onComplete({ username, avatar })
      // 成功后关闭对话框
      onClose()
    } catch (err: any) {
      setError(err.message || '设置失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 跳过设置
  const handleSkip = async () => {
    // 使用邮箱前缀作为默认用户名
    const defaultUsername = defaultEmail?.split('@')[0] || `user${Date.now()}`
    
    setIsSubmitting(true)
    try {
      await onComplete({ username: defaultUsername })
      onClose()
    } catch (err) {
      setError('操作失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="欢迎使用待办管理系统！🎉"
      description="完善你的个人信息"
      maxWidth="md"
      showCloseButton={false}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 用户名输入 */}
        <div>
          <TextField
            label="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名（2-20字符）"
            required
            fullWidth
            helperText={`${username.length}/20`}
            maxLength={20}
          />
        </div>

        {/* 头像上传 */}
        <div>
          <AvatarUpload
            value={avatar}
            onChange={setAvatar}
            maxSize={200}
            recommendedSize="50x50"
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-error-light border border-error rounded-md p-3">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="flex-1"
          >
            跳过
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={!username || isSubmitting}
            className="flex-1"
          >
            完成设置
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500">
          跳过后可在设置页面修改
        </p>
      </form>
    </Dialog>
  )
}
```

---

## 阶段 6: 页面实现

### 步骤 6.1: 重写登录页面

**文件**: `frontend/app/(auth)/login/page.tsx` (完全重写)

```typescript
'use client'

/**
 * 登录页面 - 验证码登录
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { VerificationCodeInput } from '@/components/ui/VerificationCodeInput'
import { FirstTimeSetupDialog } from '@/components/features/FirstTimeSetupDialog'
import { useSendVerificationCode, useLogin, useFirstTimeSetup } from '@/hooks/useAuth'
import { useAuthStore, useCurrentUser } from '@/store/authStore'
import { detectInputType, isValidEmail, isValidPhone } from '@/lib/utils/validators'
import type { CodeType, LoginRequest } from '@/types/auth'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentUser = useCurrentUser()

  // 表单状态
  const [username, setUsername] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [codeType, setCodeType] = useState<CodeType | null>(null)
  const [error, setError] = useState('')
  
  // 首次设置对话框
  const [showSetupDialog, setShowSetupDialog] = useState(false)

  // Hooks
  const sendCode = useSendVerificationCode()
  const login = useLogin()
  const firstTimeSetup = useFirstTimeSetup()

  // 检查是否已登录
  useEffect(() => {
    const { checkAuth } = useAuthStore.getState()
    if (checkAuth() && currentUser) {
      const redirect = searchParams.get('redirect') || '/projects'
      router.push(redirect)
    }
  }, [currentUser, router, searchParams])

  // 发送验证码
  const handleSendCode = async () => {
    setError('')

    // 验证用户名
    const type = detectInputType(username)
    if (!type) {
      setError('请输入有效的邮箱或手机号')
      throw new Error('Invalid username')
    }

    setCodeType(type)

    // 调用发送接口
    try {
      await sendCode.mutateAsync({
        code_type: type,
        target: username,
        purpose: 'login',
      })
    } catch (err: any) {
      setError(err.message || '发送失败，请重试')
      throw err
    }
  }

  // 登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 验证
    if (!username) {
      setError('请输入邮箱或手机号')
      return
    }

    if (!verificationCode || verificationCode.length !== 6) {
      setError('请输入6位验证码')
      return
    }

    const type = codeType || detectInputType(username)
    if (!type) {
      setError('用户名格式不正确')
      return
    }

    // 构建登录请求
    const loginData: LoginRequest = type === 'email'
      ? {
          email: username,
          code: verificationCode,
          code_type: 'email',
          purpose: 'login',
        }
      : {
          phone: username,
          code: verificationCode,
          code_type: 'sms',
          purpose: 'login',
        }

    try {
      const result = await login.mutateAsync(loginData)
      
      // 检查是否需要首次设置
      // 注意：login hook 会自动调用 createOrGetUser
      // 这里需要等待一下再检查用户状态
      setTimeout(() => {
        const user = useAuthStore.getState().user
        if (!user || !user.username) {
          setShowSetupDialog(true)
        } else {
          // 已设置，跳转
          const redirect = searchParams.get('redirect') || '/projects'
          router.push(redirect)
        }
      }, 500)
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || '登录失败'
      setError(message)
    }
  }

  // 完成首次设置
  const handleCompleteSetup = async (data: { username: string; avatar?: string }) => {
    try {
      await firstTimeSetup.mutateAsync(data)
      
      // 跳转到主页
      const redirect = searchParams.get('redirect') || '/projects'
      router.push(redirect)
    } catch (err: any) {
      throw new Error(err.message || '设置失败')
    }
  }

  // 实时验证用户名格式
  const getUsernameError = () => {
    if (!username) return ''
    const type = detectInputType(username)
    if (!type) return '请输入有效的邮箱或手机号'
    return ''
  }

  const usernameError = getUsernameError()
  const isSendCodeDisabled = !username || !!usernameError

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo 和标题 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">待办管理系统</h1>
            <p className="mt-2 text-gray-600">使用验证码快速登录</p>
          </div>

          {/* 登录表单 */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* 用户名（邮箱/手机号） */}
              <TextField
                id="username"
                label="邮箱/手机号"
                placeholder="请输入邮箱或手机号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
                required
                autoComplete="username"
                helperText="支持邮箱和手机号登录"
                error={usernameError}
              />

              {/* 验证码 */}
              <VerificationCodeInput
                value={verificationCode}
                onChange={setVerificationCode}
                onSendCode={handleSendCode}
                sendButtonDisabled={isSendCodeDisabled}
                error={error && error.includes('验证码') ? error : ''}
              />

              {/* 全局错误提示 */}
              {error && !error.includes('验证码') && (
                <div className="bg-error-light border border-error rounded-md p-3">
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}

              {/* 登录按钮 */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={login.isPending}
                disabled={!username || !verificationCode || login.isPending}
              >
                {login.isPending ? '登录中...' : '立即登录'}
              </Button>
            </form>

            {/* 提示信息 */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                💡 新用户将自动创建账户
              </p>
            </div>
          </div>

          {/* 开发提示 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800 font-medium">
                开发模式提示
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                验证码固定为：<span className="font-mono font-bold">123456</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 首次设置对话框 */}
      <FirstTimeSetupDialog
        open={showSetupDialog}
        onClose={() => {
          setShowSetupDialog(false)
          // 即使不设置也允许进入
          const redirect = searchParams.get('redirect') || '/projects'
          router.push(redirect)
        }}
        onComplete={handleCompleteSetup}
        defaultEmail={codeType === 'email' ? username : undefined}
      />
    </>
  )
}
```

**说明**:
- ✅ 完整的验证码登录流程
- ✅ 实时验证用户名格式
- ✅ 首次登录弹出设置对话框
- ✅ 开发模式提示（验证码固定为 123456）
- ✅ 错误处理和加载状态

---

### 步骤 6.2: 修改注册页面为重定向

**文件**: `frontend/app/(auth)/register/page.tsx` (修改)

```typescript
'use client'

/**
 * 注册页面
 * 重定向到登录页（新流程不需要独立注册）
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()

  useEffect(() => {
    // 重定向到登录页
    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto" />
        <p className="mt-4 text-gray-600">跳转到登录页...</p>
      </div>
    </div>
  )
}
```

---

## 阶段 7: 中间件和初始化

### 步骤 7.1: 更新中间件

**文件**: `frontend/middleware.ts` (修改)

```typescript
/**
 * Next.js 中间件
 * 处理认证和路由保护
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 公开路由（无需认证）
const PUBLIC_ROUTES = ['/login', '/register']

// 认证路由（已登录不可访问）
const AUTH_ROUTES = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检查是否有 auth token (从 cookie)
  const token = request.cookies.get('auth_token')?.value

  // 如果访问认证页面，但已登录，跳转到主页
  if (AUTH_ROUTES.includes(pathname) && token) {
    return NextResponse.redirect(new URL('/projects', request.url))
  }

  // 如果访问受保护页面，但未登录，跳转到登录页
  if (!PUBLIC_ROUTES.includes(pathname) && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// 配置需要运行中间件的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了:
     * - api routes
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

### 步骤 7.2: 应用初始化

**文件**: `frontend/app/layout.tsx` (修改)

在根布局中初始化 Auth Store：

```typescript
'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 初始化认证状态
  useEffect(() => {
    const { initialize } = useAuthStore.getState()
    initialize()
  }, [])

  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
```

---

## 🧪 测试清单

### 功能测试

```
登录流程测试
□ 1. 输入有效邮箱 → 发送验证码 → 输入验证码 → 登录成功
□ 2. 输入有效手机号 → 发送验证码 → 输入验证码 → 登录成功
□ 3. 首次登录 → 弹出设置对话框 → 输入用户名 → 完成设置
□ 4. 首次登录 → 点击跳过 → 使用默认用户名 → 进入应用
□ 5. 已登录用户访问登录页 → 自动跳转到主页

错误处理测试
□ 6. 输入无效邮箱格式 → 显示错误提示
□ 7. 输入无效手机号格式 → 显示错误提示
□ 8. 验证码未输入 → 登录按钮禁用
□ 9. 输入错误验证码 → 显示错误提示
□ 10. 60秒内重复发送验证码 → 按钮禁用并显示倒计时

Token管理测试
□ 11. Token即将过期 → 自动刷新 → 继续使用
□ 12. Token刷新失败 → 清除认证信息 → 跳转登录页
□ 13. 退出登录 → 清除本地数据 → 跳转登录页

响应式测试
□ 14. 在桌面端正常显示
□ 15. 在平板端正常显示
□ 16. 在手机端正常显示

无障碍测试
□ 17. 使用 Tab 键可以正常导航
□ 18. 使用回车键可以提交表单
□ 19. 屏幕阅读器可以正确读取内容
```

---

## 📝 开发注意事项

### 1. 环境变量配置

在 `.env.local` 文件中配置：

```bash
# 网关地址（生产环境）
NEXT_PUBLIC_GATEWAY_URL=https://gateway.example.com

# TODO 后端地址
NEXT_PUBLIC_API_URL=http://localhost:3000

# 开发模式
NODE_ENV=development
```

### 2. 开发模式说明

- 开发模式验证码固定为 `123456`
- 所有网关接口使用 mock 数据
- 不需要真实的验证码服务

### 3. 生产部署前检查

```
□ 1. 更新 NEXT_PUBLIC_GATEWAY_URL 为真实域名
□ 2. 移除所有 console.log 调试语句
□ 3. 测试真实的验证码发送
□ 4. 测试 Token 刷新逻辑
□ 5. 配置 HTTPS 证书
□ 6. 设置正确的 Cookie 安全策略
```

### 4. 性能优化建议

- 使用 React.memo 优化组件渲染
- 验证码输入使用防抖
- 图片上传添加压缩
- 使用 Suspense 和 Loading 组件

---

## 🐛 常见问题排查

### 问题 1: Token 无法保存

**原因**: localStorage 在 SSR 中不可用  
**解决**: 确保只在客户端组件中使用，检查 `typeof window !== 'undefined'`

### 问题 2: 验证码发送失败

**原因**: 网关地址配置错误或网络问题  
**解决**: 检查 NEXT_PUBLIC_GATEWAY_URL 配置，查看网络请求日志

### 问题 3: 首次设置对话框不显示

**原因**: 用户信息检查逻辑错误  
**解决**: 检查 login hook 中的 createOrGetUser 调用，确保正确判断 username 是否为 null

### 问题 4: Token 刷新导致请求重复

**原因**: 刷新期间的请求没有排队  
**解决**: 检查 apiClient interceptor 中的队列逻辑

---

## ✅ 完成标准

当以下所有项都完成时，开发任务完成：

- [ ] 所有文件创建和修改完成
- [ ] 代码通过 TypeScript 类型检查
- [ ] 代码通过 ESLint 检查
- [ ] 所有功能测试通过
- [ ] 错误处理完善
- [ ] 响应式布局正常
- [ ] 无障碍测试通过
- [ ] 开发模式测试通过
- [ ] 代码注释完整
- [ ] 组件 Props 有类型定义

---

## 📚 参考资料

1. [网关接口文档](../../../server/api/auth-api.md)
2. [TODO 后端接口文档](../../../server/api/user_api.md)
3. [登录业务总结](../../../server/login业务总结.md)
4. [UI 设计规范](./LOGIN_REDESIGN_UI_SPEC.md)
5. [Next.js 14 文档](https://nextjs.org/docs)
6. [React Query 文档](https://tanstack.com/query/latest/docs/react/overview)
7. [Zustand 文档](https://zustand-demo.pmnd.rs/)

---

## 💬 支持

如果在开发过程中遇到问题，请：

1. 检查上述"常见问题排查"部分
2. 查看浏览器控制台错误信息
3. 检查网络请求日志
4. 参考相关文档

祝开发顺利！🚀

