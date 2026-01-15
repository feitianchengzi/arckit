/**
 * useInvitations - 邀请管理 Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invitationsApi, CreateInvitationInput } from '@/lib/api/endpoints/invitations'
import { useAuthStore } from '@/store/authStore'
import { todoUserApi } from '@/lib/api/endpoints/auth'

/**
 * 获取项目的邀请列表
 */
export function useInvitationList(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'invitations'],
    queryFn: () => invitationsApi.listByProject(projectId),
    enabled: !!projectId,
  })
}

/**
 * 创建邀请
 */
export function useCreateInvitation(projectId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: CreateInvitationInput) => invitationsApi.create(input),
    onSuccess: () => {
      // 使邀请列表缓存失效
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'invitations'],
      })
    },
  })
}

/**
 * 删除邀请
 */
export function useDeleteInvitation(projectId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (invitationId: string) =>
      invitationsApi.delete(projectId, invitationId),
    onSuccess: () => {
      // 使邀请列表缓存失效
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'invitations'],
      })
    },
  })
}

/**
 * 使用邀请码加入项目
 */
export function useJoinByInvite() {
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      // 检查是否已登录（网关会自动识别用户，不需要传递 user_id）
      if (!isAuthenticated) {
        throw new Error('请先登录后再使用邀请码')
      }
      
      return invitationsApi.join(inviteCode)
    },
    onSuccess: (data) => {
      // 使项目列表缓存失效（加入了新项目）
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      
      // 如果有 project_id，也使项目详情和成员列表缓存失效
      if (data?.project_id) {
        const projectId = data.project_id.toString()
        queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
        queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'members'] })
      }
    },
  })
}

