import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { LoadingView } from '@/components/ui'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, checkAuth } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // 组件挂载时立即检查认证状态（从 localStorage 恢复）
    const hasAuth = checkAuth()
    
    if (!hasAuth) {
      // 如果 token 过期，尝试刷新（异步）
      const checkRefresh = async () => {
        const { checkAndRefreshAuth } = useAuthStore.getState()
        const refreshed = await checkAndRefreshAuth()
        setIsChecking(false)
        
        if (!refreshed) {
          // 刷新失败或没有 token，重定向到登录页
          const redirectPath = location.pathname + location.search
          navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true })
        }
      }
      
      checkRefresh()
    } else {
      setIsChecking(false)
    }
  }, []) // 只在组件挂载时执行一次

  // 监听认证状态变化（例如 token 过期）
  useEffect(() => {
    if (!isChecking) {
      const hasAuth = checkAuth()
      if (!hasAuth && isAuthenticated === false) {
        // 认证状态变为未登录，重定向到登录页
        const redirectPath = location.pathname + location.search
        navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true })
      }
    }
  }, [isAuthenticated, isChecking, checkAuth, navigate, location])

  // 正在检查认证状态时，显示加载中
  if (isChecking) {
    return <LoadingView size="lg" text="检查登录状态..." />
  }

  // 如果未认证，返回 null（正在重定向）
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

