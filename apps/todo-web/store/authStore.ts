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
