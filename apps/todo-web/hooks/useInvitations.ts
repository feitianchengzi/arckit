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
  const user = useAuthStore((state) => state.user)
  
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      // 获取当前用户ID
      const userId = user?.id
      
      if (!userId) {
        throw new Error('无法获取用户ID，请先登录')
      }
      
      return invitationsApi.join(inviteCode, userId)
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

