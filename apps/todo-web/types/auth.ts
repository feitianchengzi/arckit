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

