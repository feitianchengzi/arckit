/**
 * 主题状态管理 Store
 * 管理深色/浅色模式切换
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme: Theme) => {
        set({ theme })
        // 更新 HTML 元素的 class
        if (typeof window !== 'undefined') {
          const root = document.documentElement
          if (theme === 'dark') {
            root.classList.add('dark')
          } else {
            root.classList.remove('dark')
          }
        }
      },
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light'
          // 更新 HTML 元素的 class
          if (typeof window !== 'undefined') {
            const root = document.documentElement
            if (newTheme === 'dark') {
              root.classList.add('dark')
            } else {
              root.classList.remove('dark')
            }
          }
          return { theme: newTheme }
        })
      },
    }),
    {
      name: 'theme-storage',
      // 初始化时应用主题
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== 'undefined') {
          const root = document.documentElement
          if (state.theme === 'dark') {
            root.classList.add('dark')
          } else {
            root.classList.remove('dark')
          }
        }
      },
    }
  )
)

// 初始化主题（在应用启动时调用）
export const initializeTheme = () => {
  const store = useThemeStore.getState()
  const root = document.documentElement
  
  // 应用保存的主题
  if (store.theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

