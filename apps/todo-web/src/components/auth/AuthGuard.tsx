import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { LoadingView } from '@/components/ui'
import { todoUserApi } from '@/lib/api/endpoints/auth'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, checkAuth, user, setUser } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  // 加载用户信息的辅助函数
  const loadUserInfo = async () => {
    const { user: currentUser, setUser: setCurrentUser } = useAuthStore.getState()
    
    // 如果已经有用户信息，不需要加载
    if (currentUser?.username) {
      return
    }
    
    try {
      console.log('📥 AuthGuard: 加载用户信息...')
      const userData = await todoUserApi.getCurrentUser()
      setCurrentUser(userData)
      console.log('✅ AuthGuard: 用户信息加载成功, username:', userData.username)
    } catch (error: any) {
      console.error('❌ AuthGuard: 加载用户信息失败:', error)
      // 如果获取失败（404 = 用户不存在），不影响认证状态
      // 用户信息会在后续页面中创建（如 ProjectsPage）
    }
  }

  useEffect(() => {
    // 组件挂载时立即检查认证状态（从 localStorage 恢复）
    const hasAuth = checkAuth()
    
    if (!hasAuth) {
      // 如果 token 过期，尝试刷新（异步）
      const checkRefresh = async () => {
        const { checkAndRefreshAuth } = useAuthStore.getState()
        const refreshed = await checkAndRefreshAuth()
        
        if (!refreshed) {
          // 刷新失败或没有 token，重定向到登录页
          setIsChecking(false)
          const redirectPath = location.pathname + location.search
          navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true })
          return
        }
        
        // 刷新成功，加载用户信息
        await loadUserInfo()
        setIsChecking(false)
      }
      
      checkRefresh()
    } else {
      // Token 有效，加载用户信息（如果还没有）
      loadUserInfo().finally(() => {
        setIsChecking(false)
      })
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

