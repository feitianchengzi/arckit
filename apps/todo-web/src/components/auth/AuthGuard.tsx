import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, checkAuth } = useAuthStore()

  useEffect(() => {
    // 检查认证状态
    const hasAuth = checkAuth()
    
    if (!hasAuth) {
      // 未登录，重定向到登录页
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true })
    }
  }, [isAuthenticated, checkAuth, navigate, location])

  // 如果未认证，返回 null（正在重定向）
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

