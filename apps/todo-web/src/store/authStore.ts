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
  isTokenExpired,
  shouldRefreshToken,
  getRefreshToken,
  isRefreshTokenValid,
} from '@/lib/utils/tokenManager'
import { gatewayApi } from '@/lib/api/endpoints/gateway'

interface AuthState {
  // 状态
  isAuthenticated: boolean
  user: TodoUser | null
  isLoading: boolean

  // Actions
  setAuth: (tokens: TokenInfo) => void
  setUser: (user: TodoUser) => void
  logout: () => void
  checkAuth: () => boolean
  checkAndRefreshAuth: () => Promise<boolean>
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // 初始状态
  isAuthenticated: false,
  user: null,
  isLoading: true,

  /**
   * 设置认证信息（登录时调用）
   * 注意：不再保存 userId，网关会自动从 Token 中解析
   */
  setAuth: (tokens: TokenInfo) => {
    const now = Date.now()
    saveAuthInfo({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenObtainedAt: now,
      tokenExpiresIn: tokens.expires_in,
      refreshTokenObtainedAt: now,
      refreshExpiresIn: tokens.refresh_expires_in,
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
   * 检查认证状态（同步）
   * 检查 token 是否存在且未过期
   * 注意：如果 token 过期，返回 false，但不自动刷新（刷新需要异步调用 checkAndRefreshAuth）
   */
  checkAuth: () => {
    const authInfo = getAuthInfo()
    
    // 没有 token，未登录
    if (!authInfo || !authInfo.accessToken) {
      set({ isAuthenticated: false })
      return false
    }
    
    // 检查 token 是否过期
    if (isTokenExpired(authInfo)) {
      // Token 已过期，返回 false
      // 调用方应该使用 checkAndRefreshAuth() 来尝试刷新
      set({ isAuthenticated: false })
      return false
    }
    
    // Token 有效
    set({ isAuthenticated: true })
    return true
  },

  /**
   * 检查并刷新认证状态（异步）
   * 如果 token 过期，尝试刷新
   */
  checkAndRefreshAuth: async () => {
    const authInfo = getAuthInfo()
    
    // 步骤1: 检查 Refresh Token 是否存在且未过期
    if (!isRefreshTokenValid()) {
      console.warn('⚠️ Refresh Token 不存在或已过期，需要重新登录')
      clearAuthInfo()
      set({ isAuthenticated: false, user: null })
      // 跳转到登录页
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      return false
    }
    
    // 步骤2: 检查 Access Token 是否过期
    if (!shouldRefreshToken()) {
      // Access Token 未过期，认证有效
      set({ isAuthenticated: true })
      return true
    }
    
    // Access Token 已过期，需要刷新
    
    // 尝试刷新 token
    try {
      console.log('🔄 Token 已过期，尝试刷新...')
      
      const response = await gatewayApi.refreshToken({
        refresh_token: authInfo.refreshToken,
      })
      
      // 保存新 token（保留原有用户信息）
      const now = Date.now()
      saveAuthInfo({
        accessToken: response.data.tokens.access_token,
        refreshToken: response.data.tokens.refresh_token,
        tokenObtainedAt: now,
        tokenExpiresIn: response.data.tokens.expires_in,
        refreshTokenObtainedAt: now,
        refreshExpiresIn: response.data.tokens.refresh_expires_in,
        username: authInfo.username,
        avatarUrl: authInfo.avatarUrl,
      })
      
      console.log('✅ Token 刷新成功')
      set({ isAuthenticated: true })
      return true
    } catch (error) {
      console.error('❌ Token 刷新失败:', error)
      
      // 刷新失败，清除认证信息
      clearAuthInfo()
      set({ isAuthenticated: false, user: null })
      return false
    }
  },

  /**
   * 初始化：从 localStorage 恢复状态
   * 注意：初始化时只恢复认证状态，不恢复用户信息
   * 用户信息需要通过 API 获取（从项目列表中获取或调用用户 API）
   */
  initialize: () => {
    const authInfo = getAuthInfo()

    if (!authInfo || !authInfo.accessToken) {
      // 没有 token
      set({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      })
      return
    }
    
    // 检查 token 是否过期
    if (isTokenExpired(authInfo)) {
      // Token 已过期，尝试刷新（异步）
      get().checkAndRefreshAuth().then((success) => {
        set({ isLoading: false })
      })
      // 先设置为未认证，刷新成功后会更新
      set({
        isAuthenticated: false,
        user: null,
        isLoading: true, // 正在刷新
      })
    } else {
      // Token 有效
      set({
        isAuthenticated: true,
        user: null,
        isLoading: false,
      })
    }
  },
}))

// 便捷的 Hooks
export const useCurrentUser = () => useAuthStore((state) => state.user)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
