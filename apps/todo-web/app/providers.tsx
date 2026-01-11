'use client'

/**
 * Providers - 全局 Provider 组件
 * 
 * 包含：
 * 1. React Query Provider
 * 2. Auth Store 初始化
 * 3. 未来可能添加：i18n Provider, Theme Provider
 */

import { ReactNode, useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // 创建 QueryClient（使用 useState 确保每个客户端只创建一次）
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 数据新鲜时间：1 分钟内不重新请求
            staleTime: 60 * 1000,
            // 缓存时间：5 分钟后清除
            gcTime: 5 * 60 * 1000,
            // 窗口聚焦时不自动重新请求
            refetchOnWindowFocus: false,
            // 失败重试 1 次
            retry: 1,
            // 重试延迟
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Mutation 失败重试 0 次（不重试）
            retry: 0,
          },
        },
      })
  )

  // 初始化认证状态
  useEffect(() => {
    const { initialize } = useAuthStore.getState()
    initialize()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
