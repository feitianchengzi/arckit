import { useQuery } from '@tanstack/react-query'
import { organizationsApi } from '@/lib/api/endpoints/organizations'

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