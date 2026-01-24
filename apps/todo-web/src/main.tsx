import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { useThemeStore, initializeTheme } from './store/themeStore'
import { initErrorInterceptor } from './lib/oss/load'
import App from './App'
import './globals.css'

// 导入 Token 调试工具（开发环境）
if (import.meta.env.DEV) {
  import('./utils/tokenDebug').then(module => {
    console.log('🔧 Token 调试工具已加载')
    console.log('💡 可用命令：')
    console.log('  - window.debugToken()            查看 Token 状态')
    console.log('  - window.simulateTokenExpiring() 模拟 Token 即将过期（测试刷新）')
    console.log('  - window.getTestLog()            查看测试日志（即使跳转后）')
    console.log('  - window.clearTestLog()          清除测试日志')
    console.log('  - window.resetTokenTime()        清除认证信息')
  })
}

// 检查并清除旧格式的认证数据
const storedAuthInfo = localStorage.getItem('auth_info')
if (storedAuthInfo) {
  try {
    const authInfo = JSON.parse(storedAuthInfo)
    // 检查是否缺少 Refresh Token 时间字段
    if (!authInfo.refreshTokenObtainedAt || !authInfo.refreshExpiresIn) {
      console.warn('🔄 检测到旧格式的认证信息，自动清除并提示重新登录')
      localStorage.removeItem('auth_info')
      document.cookie = 'auth_token=; path=/; max-age=0'
      
      // 如果不在登录页，提示用户
      if (window.location.pathname !== '/login') {
        // 延迟执行，确保 React 应用已加载
        setTimeout(() => {
          alert('检测到认证数据格式已更新，请重新登录。')
          window.location.href = '/login'
        }, 100)
      }
    }
  } catch (error) {
    console.error('解析认证信息失败:', error)
    localStorage.removeItem('auth_info')
  }
}

// 创建 React Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// 在应用启动前初始化认证状态
useAuthStore.getState().initialize()

// 初始化主题（必须在应用渲染前执行）
initializeTheme()

// 初始化 OSS 错误拦截器（自动修复 403 错误）
initErrorInterceptor()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter 
        basename="/"
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)

