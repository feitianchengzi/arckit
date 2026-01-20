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
  refresh_expires_in: number  // 刷新Token过期时间（秒），如 2592000 (30天)
  key_id: string  // Token密钥ID
}

/** 网关用户信息（登录接口返回，不包含 id/uuid） */
export interface GatewayUser {
  email?: string
  phone?: string
  username?: string | null
  avatar_url?: string | null
  is_active?: boolean
  is_verified?: boolean
  is_admin?: boolean
}

/** 登录响应 */
export interface LoginResponse {
  success: boolean
  message?: string
  data: {
    user: GatewayUser
    tokens: TokenInfo
  }
  auth_level?: string
}

/** 刷新Token请求 */
export interface RefreshTokenRequest {
  refresh_token: string
}

/** 刷新Token响应 */
export interface RefreshTokenResponse {
  code: string
  data: TokenInfo  // 根据 API 文档，data 直接就是 TokenInfo，不是 { tokens: TokenInfo }
}

// ==================== 用户服务 API 类型 ====================

/** 用户服务返回的完整用户信息（包含 UUID） */
export interface UserProfile {
  id: string  // UUID（重要！登录接口不返回，需要调用 Profile 接口获取）
  email?: string
  username?: string | null
  avatar_url?: string | null
  is_active?: boolean
  is_verified?: boolean
  created_at?: string
  updated_at?: string
}

/** 获取用户Profile响应 */
export interface UserProfileResponse {
  success: boolean
  data: UserProfile
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
  tokenObtainedAt: number  // Access Token 获取时间戳（毫秒）
  tokenExpiresIn: number   // Access Token 过期时间（秒数）
  refreshTokenObtainedAt: number  // Refresh Token 获取时间戳（毫秒）
  refreshExpiresIn: number   // Refresh Token 过期时间（秒数）
  // 注意：不再保存 userId，网关会自动从 Token 中解析并注入到请求头
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
  sendButtonDisabled?: boolean
}

/** 首次设置对话框 Props */
export interface FirstTimeSetupDialogProps {
  open: boolean
  onClose: () => void
  onComplete: (data: { username: string; avatar?: string }) => Promise<void>
  defaultEmail?: string
}

/** 头像上传组件 Props */
export interface AvatarUploadProps {
  value?: string
  onChange: (url: string) => void
  maxSize?: number  // KB
  recommendedSize?: string
}

