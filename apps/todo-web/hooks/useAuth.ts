/**
 * useAuth - 认证相关 Hook
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authApi, LoginInput, RegisterInput } from '@/lib/api/endpoints/auth'
import { useAuthStore } from '@/store/authStore'

/**
 * 登录输入参数（扩展了 redirect）
 */
interface LoginInputWithRedirect extends LoginInput {
  redirect?: string
}

/**
 * 登录
 */
export function useLogin() {
  const router = useRouter()
  const setToken = useAuthStore((state) => state.setToken)
  const setUser = useAuthStore((state) => state.setUser)
  
  return useMutation({
    mutationFn: (input: LoginInputWithRedirect) => {
      // 从 input 中提取 redirect，不传递给 API
      const { redirect, ...loginData } = input
      return authApi.login(loginData).then(data => ({ ...data, redirect }))
    },
    onSuccess: (result) => {
      console.log('useLogin onSuccess 被调用:', result)
      // 保存 token 和用户信息（会同时设置 localStorage 和 cookie）
      setToken(result.token)
      setUser(result.user)
      
      // 跳转到指定页面（或默认项目列表）
      const redirectUrl = result.redirect || '/projects'
      console.log('准备跳转到', redirectUrl)
      window.location.href = redirectUrl
    },
  })
}

/**
 * 注册
 */
export function useRegister() {
  const router = useRouter()
  const setToken = useAuthStore((state) => state.setToken)
  const setUser = useAuthStore((state) => state.setUser)
  
  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: (data) => {
      // 保存 token 和用户信息（会同时设置 localStorage 和 cookie）
      setToken(data.token)
      setUser(data.user)
      
      // 跳转到项目列表
      // 使用 window.location.href 确保完整的页面刷新和中间件重新评估
      window.location.href = '/projects'
    },
  })
}

/**
 * 获取当前用户信息
 */
export function useCurrentUser() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authApi.getCurrentUser(),
    enabled: isAuthenticated, // 只在已认证时查询
  })
}

/**
 * 退出登录
 */
export function useLogout() {
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)
  
  return () => {
    logout()
    router.push('/login')
  }
}

