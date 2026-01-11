/**
 * 认证相关 Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { gatewayApi } from '@/lib/api/endpoints/gateway'
import { todoUserApi } from '@/lib/api/endpoints/auth'
import { useAuthStore } from '@/store/authStore'
import {
  SendVerificationRequest,
  LoginRequest,
  CreateUserRequest,
} from '@/types/auth'

/**
 * 发送验证码 Hook
 */
export function useSendVerificationCode() {
  return useMutation({
    mutationFn: (data: SendVerificationRequest) => gatewayApi.sendVerification(data),
    onSuccess: () => {
      console.log('✅ 验证码发送成功')
    },
    onError: (error: any) => {
      console.error('❌ 验证码发送失败:', error)
      throw error
    },
  })
}

/**
 * 登录 Hook
 */
export function useLogin() {
  const router = useRouter()
  const { setAuth, setUser } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginRequest) => gatewayApi.login(data),
    onSuccess: async (response) => {
      console.log('✅ 登录成功:', response.data.user)
      console.log('🔑 Access Token:', response.data.tokens.access_token)
      console.log('🆔 User ID (UUID):', response.data.user.id)

      // 1. 保存 Token 到 localStorage
      setAuth(response.data.tokens, response.data.user.id)

      // 2. 尝试创建/获取 TODO 后端用户
      try {
        const todoUser = await todoUserApi.createOrGetUser({
          username: response.data.user.username || undefined,
          avatar: response.data.user.avatar_url || '',
        })

        // 3. 保存用户信息到 Store
        setUser(todoUser)
      } catch (error) {
        console.error('❌ 获取用户信息失败:', error)
        // 即使失败也允许进入应用
      }

      // 4. 登录成功后直接跳转到主页
      // 首次设置对话框将在主页显示
      router.push('/projects')

      // 5. 清除相关查询缓存
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error: any) => {
      console.error('❌ 登录失败:', error)
      throw error
    },
  })
}

/**
 * 首次设置用户信息 Hook
 */
export function useFirstTimeSetup() {
  const { setUser } = useAuthStore()

  return useMutation({
    mutationFn: (data: CreateUserRequest) => {
      // 确保 avatar 不为空，如果为空则使用空字符串
      const requestData: CreateUserRequest = {
        username: data.username,
        avatar: data.avatar || '',
      }
      return todoUserApi.createOrGetUser(requestData)
    },
    onSuccess: (user) => {
      console.log('✅ 用户信息设置成功:', user)
      setUser(user)
    },
    onError: (error: any) => {
      console.error('❌ 用户信息设置失败:', error)
      throw error
    },
  })
}

/**
 * 退出登录 Hook
 */
export function useLogout() {
  const router = useRouter()
  const { logout } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      // 这里可以调用后端的退出接口（如果有）
      return Promise.resolve()
    },
    onSuccess: () => {
      // 清除本地状态
      logout()

      // 清除所有查询缓存
      queryClient.clear()

      // 跳转到登录页
      router.push('/login')
    },
  })
}

/**
 * 获取当前用户 Hook
 */
export function useGetCurrentUser() {
  const { isAuthenticated, user, setUser } = useAuthStore()

  return useQuery({
    queryKey: ['user', 'current'],
    queryFn: () => todoUserApi.getCurrentUser(),
    enabled: isAuthenticated && !user,
    staleTime: 5 * 60 * 1000, // 5分钟内认为数据新鲜
    onSuccess: (data) => {
      setUser(data)
    },
  })
}

/**
 * 获取当前用户 Hook（别名，为了向后兼容）
 */
export const useCurrentUser = useGetCurrentUser
