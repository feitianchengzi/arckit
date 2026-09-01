/**
 * 认证相关 Hooks
 */

import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const { setAuth, setUser } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginRequest) => gatewayApi.login(data),
    onSuccess: async (response, variables) => {

      // 1. 保存认证信息（只需要保存 Token）
      const inputAccount = variables.code_type === 'email' ? variables.email : variables.phone
      const responseAccount = response.data.user?.email || response.data.user?.phone || ''
      const account = (inputAccount || responseAccount).trim()

      setAuth(
        response.data.tokens,
        account
          ? {
              value: account,
              type: variables.code_type,
            }
          : undefined
      )

      // 2. 登录成功后，检查是否有 redirect 参数
      // 从 URL 中获取 redirect 参数（如果存在）
      const urlParams = new URLSearchParams(window.location.search)
      const redirect = urlParams.get('redirect') || '/projects'
      
      console.log('🔄 登录后跳转:', redirect)
      
      // 如果是邀请链接，先保存到 sessionStorage，然后导航到主页完成首次设置
      if (redirect && redirect.startsWith('/join-organization/')) {
        sessionStorage.setItem('pending_invite_redirect', redirect)
        console.log('💾 保存邀请链接到 sessionStorage，先导航到主页完成设置:', redirect)
        // 先导航到主页，让用户完成首次设置
        navigate('/projects', { replace: true })
      } else {
        // 其他情况直接导航到目标页面
        navigate(redirect, { replace: true })
      }

      // 3. 清除相关查询缓存
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
      // 使用 setTimeout 将状态更新推迟到下一个事件循环，避免在渲染过程中更新状态
      setTimeout(() => {
        setUser(user)
      }, 0)
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
  const navigate = useNavigate()
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
      navigate('/login')
    },
  })
}

/**
 * 获取当前用户 Hook
 */
export function useGetCurrentUser() {
  const { isAuthenticated, user, setUser } = useAuthStore()

  const query = useQuery({
    queryKey: ['user', 'current'],
    queryFn: () => todoUserApi.getCurrentUser(),
    enabled: isAuthenticated && !user,
    staleTime: 5 * 60 * 1000, // 5分钟内认为数据新鲜
  })

  // 使用 useEffect 处理数据更新
  React.useEffect(() => {
    if (query.data) {
      setUser(query.data)
    }
  }, [query.data, setUser])

  return query
}

/**
 * 获取当前用户 Hook（别名，为了向后兼容）
 */
export const useCurrentUser = useGetCurrentUser
