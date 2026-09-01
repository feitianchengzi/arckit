import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
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
 * 分页获取用户参与的组织列表，用于组织切换菜单滚动加载
 */
export function useInfiniteOrganizationList(includeDeleted = false, pageSize = 20) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  return useInfiniteQuery({
    queryKey: ['organizations', 'infinite', { includeDeleted, pageSize }],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      organizationsApi.listPage({
        includeDeleted,
        page: Number(pageParam) || 1,
        pageSize,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = lastPage.meta?.page || allPages.length
      const currentPageSize = lastPage.meta?.page_size || pageSize
      const total = lastPage.meta?.total ?? lastPage.total

      if (lastPage.organizations.length === 0 || currentPageSize <= 0) {
        return undefined
      }

      if (typeof total === 'number' && total > 0) {
        return currentPage * currentPageSize < total ? currentPage + 1 : undefined
      }

      return lastPage.organizations.length >= pageSize ? allPages.length + 1 : undefined
    },
    enabled: isAuthenticated && !!user && !!user.username,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 更新组织成员角色
 */
export function useUpdateOrganizationMemberRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      organizationId, 
      targetUserId, 
      role 
    }: { 
      organizationId: number
      targetUserId: number
      role: 'admin' | 'member' 
    }) => {
      return organizationsApi.updateMemberRole({
        organization_id: organizationId,
        target_user_id: targetUserId,
        role
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['organizationMembers', variables.organizationId] 
      })
    },
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
