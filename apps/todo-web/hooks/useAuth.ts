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

      // 1. 先临时保存 Token 到 localStorage（此时还没有 userId，先保存 Token 以便后续调用 Profile 接口）
      // 注意：使用 saveAuthInfo 辅助函数，但 userId 先设为空字符串，后续会更新
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('auth_info', JSON.stringify({
            accessToken: response.data.tokens.access_token,
            refreshToken: response.data.tokens.refresh_token,
            tokenObtainedAt: Date.now(),
            tokenExpiresIn: response.data.tokens.expires_in,
            userId: '', // 临时值，会在获取 Profile 后更新
          }))
          // 同时设置 cookie 供中间件使用
          document.cookie = `auth_token=${response.data.tokens.access_token}; path=/; max-age=${response.data.tokens.expires_in}; SameSite=Lax`
        } catch (error) {
          console.error('❌ 临时保存 Token 失败:', error)
        }
      }

      // 2. 获取用户Profile（获取UUID）
      let userId: string
      try {
        const profileResponse = await gatewayApi.getUserProfile()
        userId = profileResponse.data.id
        console.log('🆔 获取到 User ID (UUID):', userId, '长度:', userId.length)
      } catch (error) {
        console.error('❌ 获取用户Profile失败:', error)
        // 清理临时保存的 Token
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_info')
          document.cookie = 'auth_token=; path=/; max-age=0'
        }
        throw new Error('无法获取用户信息，请重试')
      }

      // 3. 使用获取到的 UUID 保存完整的认证信息（会覆盖临时保存的数据）
      setAuth(response.data.tokens, userId)

      // 4. 登录成功后直接跳转到主页
      // 用户信息将在主页加载，如果是新用户会显示首次设置对话框
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
  const { setUser, user } = useAuthStore()

  return useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      // 确保 username 存在且有效
      if (!data.username || data.username.trim() === '') {
        throw new Error('用户名不能为空')
      }
      
      // 确保 avatar 不为空，如果为空则使用空字符串
      const requestData: CreateUserRequest = {
        username: data.username.trim(),
        avatar: data.avatar || '',
      }
      
      console.log('📝 准备设置用户信息:', requestData)
      
      // 用户应该已经在登录时创建了，直接使用更新接口
      // updateUser 接口不需要 ID，会自动使用当前登录用户的UUID（从Header中获取）
      console.log('🔄 更新用户信息（使用当前登录用户）')
      try {
        return await todoUserApi.updateUser(0, requestData)
      } catch (error: any) {
        // 如果更新失败（可能是用户不存在），尝试创建
        if (error.response?.status === 404 || error.response?.status === 400) {
          console.log('⚠️ 更新失败，尝试创建用户...')
          return await todoUserApi.createOrGetUser(requestData)
        }
        throw error
      }
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
