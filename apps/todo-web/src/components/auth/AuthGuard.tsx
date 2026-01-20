import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { LoadingView } from '@/components/ui'
import { todoUserApi } from '@/lib/api/endpoints/auth'
import { logFlow } from '@/utils/tokenDebug'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, checkAuth, user, setUser } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)
  
  // 使用 ref 防止重复初始化（React 严格模式会导致组件挂载两次）
  const hasInitialized = useRef(false)

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
    // 防止重复初始化（React 严格模式会导致组件挂载两次）
    if (hasInitialized.current) {
      console.log('🔒 AuthGuard: 已经初始化过，跳过')
      return
    }
    
    hasInitialized.current = true
    console.log('🔍 AuthGuard: useEffect 被触发（首次）')
    logFlow('AuthGuard：useEffect 被触发，开始检查认证状态')
    
    // 组件挂载时立即检查认证状态（从 localStorage 恢复）
    const hasAuth = checkAuth()
    console.log('🔍 AuthGuard: checkAuth() 返回:', hasAuth)
    logFlow('AuthGuard：checkAuth() 返回', { hasAuth })
    
    if (!hasAuth) {
      // 如果 token 过期，尝试刷新（异步）
      const checkRefresh = async () => {
        console.log('🔄 AuthGuard: Token 已过期，尝试刷新...')
        logFlow('AuthGuard：Token 已过期，开始尝试刷新')
        
        const { checkAndRefreshAuth } = useAuthStore.getState()
        const refreshed = await checkAndRefreshAuth()
        
        if (!refreshed) {
          // 刷新失败或没有 token，重定向到登录页
          logFlow('AuthGuard：刷新失败，跳转登录页')
          setIsChecking(false)
          const redirectPath = location.pathname + location.search
          navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true })
          return
        }
        
        // 刷新成功，加载用户信息
        logFlow('AuthGuard：刷新成功，加载用户信息')
        await loadUserInfo()
        setIsChecking(false)
      }
      
      checkRefresh().catch((error) => {
        console.error('❌ AuthGuard: checkRefresh 失败:', error)
        logFlow('AuthGuard：checkRefresh 异常', { error: error.message })
        setIsChecking(false)
      })
    } else {
      // Token 有效，加载用户信息（如果还没有）
      console.log('✅ AuthGuard: Token 有效，加载用户信息')
      logFlow('AuthGuard：Token 有效，加载用户信息')
      loadUserInfo().finally(() => {
        setIsChecking(false)
      })
    }
  }, []) // 只在组件挂载时执行一次

  // 监听认证状态变化（例如 token 过期）
  // 注意：这个 useEffect 只在认证状态真正改变时触发跳转，不会干扰初始检查
  useEffect(() => {
    console.log('🔍 AuthGuard: 监听 useEffect 被触发', { isChecking, isAuthenticated })
    // 只有在检查完成后，且明确是未认证状态时，才跳转
    // 这避免了在初始化期间（第一个 useEffect 正在执行）就跳转
    if (!isChecking && isAuthenticated === false) {
      // 认证状态明确为 false，重定向到登录页
      console.log('⚠️ AuthGuard: 检测到未认证状态，跳转登录页')
      logFlow('AuthGuard：检测到未认证状态，跳转登录页', { isAuthenticated })
      const redirectPath = location.pathname + location.search
      navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true })
    }
  }, [isAuthenticated, isChecking, navigate, location])

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

