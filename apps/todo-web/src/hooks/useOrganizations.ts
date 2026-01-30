import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { organizationsApi } from '@/lib/api/endpoints/organizations'
import { useAuthStore } from '@/store/authStore'

/**
 * 获取用户参与的组织列表
 */
export function useOrganizationList(includeDeleted = false) {
  return useQuery({
    queryKey: ['organizations', { includeDeleted }],
    queryFn: () => organizationsApi.list(includeDeleted),
    staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
  })
}

/**
 * 获取特定组织的成员列表
 */
export function useOrganizationMembers(organizationId: number, includeDeleted = false) {
  return useQuery({
    queryKey: ['organizationMembers', organizationId, { includeDeleted }],
    queryFn: () => organizationsApi.listMembers(organizationId, includeDeleted),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
  })
}

export function useJoinOrganizationInvite() {
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!isAuthenticated) {
        throw new Error('请先登录后再使用邀请码')
      }

      return organizationsApi.join({ invite_code: inviteCode })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      if (data?.organization_id) {
        queryClient.invalidateQueries({ queryKey: ['organizationMembers', data.organization_id] })
      }
    },
  })
}
