/**
 * authStore - 认证状态管理
 * 
 * 功能：
 * 1. 管理用户 token
 * 2. 管理当前用户信息
 * 3. 提供登录、登出方法
 * 4. 持久化到 localStorage
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  username: string
  avatar?: string
}

interface AuthState {
  // 状态
  token: string | null
  user: User | null
  isAuthenticated: boolean
  
  // Actions
  setToken: (token: string) => void
  setUser: (user: User) => void
  logout: () => void
  reset: () => void
}

const initialState = {
  token: null,
  user: null,
  isAuthenticated: false,
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      
      // 设置 token
      setToken: (token: string) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token)
          // 同时设置 cookie，供中间件使用
          document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
        }
        set({ token, isAuthenticated: true })
      },
      
      // 设置用户信息
      setUser: (user: User) => {
        set({ user })
      },
      
      // 退出登录
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
          // 清除 cookie
          document.cookie = 'auth_token=; path=/; max-age=0'
        }
        set(initialState)
      },
      
      // 重置状态
      reset: () => {
        set(initialState)
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// 便捷的选择器
export const useCurrentUser = () => useAuthStore((state) => state.user)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
