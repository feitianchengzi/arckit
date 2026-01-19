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
 * 检查 Refresh Token 是否已过期
 * @param authInfo 认证信息
 * @param bufferMs 提前多少毫秒视为过期（默认5分钟）
 */
export function isRefreshTokenExpired(
  authInfo: StoredAuthInfo,
  bufferMs: number = TOKEN_EXPIRY_BUFFER
): boolean {
  // 兼容旧数据格式：如果没有 refreshTokenObtainedAt 或 refreshExpiresIn，视为过期（需要重新登录）
  if (!authInfo.refreshTokenObtainedAt || !authInfo.refreshExpiresIn) {
    console.warn('⚠️ 检测到旧格式的认证信息，需要重新登录')
    return true
  }
  
  const now = Date.now()
  const expiresAt = authInfo.refreshTokenObtainedAt + (authInfo.refreshExpiresIn * 1000)
  
  // 提前5分钟视为过期，以便有时间刷新
  return now >= (expiresAt - bufferMs)
}

/**
 * 检查是否需要刷新 Access Token
 * 只检查 Access Token 是否过期，不检查 Refresh Token
 * Refresh Token 的检查应该在调用此函数之前单独进行
 * @returns true 表示 Access Token 已过期或即将过期，需要刷新
 */
export function shouldRefreshToken(): boolean {
  const authInfo = getAuthInfo()
  if (!authInfo) return false
  
  // 只检查 Access Token 是否过期
  // 如果 Access Token 即将在5分钟内过期，返回 true
  return isTokenExpired(authInfo, TOKEN_EXPIRY_BUFFER)
}

/**
 * 检查 Refresh Token 是否有效（存在且未过期）
 * @returns true 表示 Refresh Token 有效，可以用来刷新 Access Token
 */
export function isRefreshTokenValid(): boolean {
  const authInfo = getAuthInfo()
  if (!authInfo || !authInfo.refreshToken) {
    return false
  }
  
  // 检查 Refresh Token 是否过期
  return !isRefreshTokenExpired(authInfo, TOKEN_EXPIRY_BUFFER)
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

