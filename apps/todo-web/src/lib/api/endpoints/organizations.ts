/**
 * organizations API - 组织管理接口
 */

import { apiClient } from '../client'
import { handleResponse } from '../interceptors/response'
import type { ApiMeta } from '@/types/api'

export interface Organization {
  id: number
  name: string
  description?: string
  creator_id: number
  created_at: string
  updated_at?: string
  deleted_at?: string
}

export interface OrganizationMember {
  id: number
  user_id: number
  role: 'owner' | 'admin' | 'member'
  username: string
  avatar?: string
  created_at: string
  is_me: boolean
}

export interface CreateOrganizationInput {
  name: string
  description?: string
}

export interface UpdateOrganizationInput {
  id: number
  name?: string
  description?: string
}

export interface InviteMemberInput {
  organization_id: number
  role?: 'member' | 'admin'
  expires_in?: number // 小时，0表示永不过期
  max_uses?: number
}

export interface JoinOrganizationInput {
  invite_code: string
}

export interface DeleteMemberInput {
  organization_id: number
  target_user_id: number
}

export interface UpdateMemberRoleInput {
  organization_id: number
  target_user_id: number
  role: 'admin' | 'member'
}

export interface OrganizationInvitation {
  invite_code: string
  invite_link?: string
  role: string
  max_uses: number
  used_count: number
  expires_at?: string
  created_at: string
}

export interface OrganizationListOptions {
  includeDeleted?: boolean
  page?: number
  pageSize?: number
}

export interface OrganizationListResult {
  organizations: Organization[]
  meta: ApiMeta
  total: number
}

export const organizationsApi = {
  /**
   * 创建组织
   * 后端路由: POST /workshop/v1/user/organizations
   */
  create: async (input: CreateOrganizationInput): Promise<Organization> => {
    const response = await apiClient.post('/user/organizations', input)
    const data = handleResponse<{ 
      id: number, 
      name: string, 
      description?: string, 
      creator_id: number, 
      members: OrganizationMember[],
      created_at: string 
    }>(response)
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      creator_id: data.creator_id,
      created_at: data.created_at
    }
  },

  /**
   * 查询用户参与的组织
   * 后端路由: GET /workshop/v1/user/organizations
   */
  listPage: async (options?: OrganizationListOptions): Promise<OrganizationListResult> => {
    const params: Record<string, boolean | number> = {}
    if (options?.includeDeleted !== undefined) {
      params.include_deleted = options.includeDeleted
    }
    if (options?.page) {
      params.page = options.page
    }
    if (options?.pageSize) {
      params.page_size = options.pageSize
    }

    const response = await apiClient.get('/user/organizations', {
      params
    })

    const fallbackMeta = (organizations: Organization[], total = organizations.length): ApiMeta => {
      const requestedPage = options?.page || 1
      const requestedPageSize = options?.pageSize || 0
      const pageSize =
        requestedPageSize > 0 && organizations.length <= requestedPageSize
          ? requestedPageSize
          : organizations.length

      return {
        page: requestedPage,
        page_size: pageSize,
        total,
      }
    }

    const responseData = response.data
    if (responseData?.code === 'OK' && responseData?.data) {
      const data = responseData.data
      const organizations = Array.isArray(data.organizations) ? data.organizations as Organization[] : []
      const total = typeof data.total === 'number' ? data.total : organizations.length
      const meta = responseData.meta
        ? (responseData.meta as ApiMeta)
        : fallbackMeta(organizations, total)

      return {
        organizations,
        meta: {
          ...meta,
          total: typeof meta.total === 'number' ? meta.total : total,
        },
        total: typeof meta.total === 'number' ? meta.total : total,
      }
    }

    const data = handleResponse<{
      organizations: Organization[],
      total: number
    }>(response)
    const total = typeof data.total === 'number' ? data.total : data.organizations.length

    return {
      organizations: data.organizations,
      meta: fallbackMeta(data.organizations, total),
      total,
    }
  },

  list: async (includeDeleted = false): Promise<Organization[]> => {
    const { organizations } = await organizationsApi.listPage({ includeDeleted })
    return organizations
  },

  /**
   * 查询组织成员列表
   * 后端路由: GET /workshop/v1/user/organizations/:id/members
   */
  listMembers: async (organizationId: number, includeDeleted = false): Promise<OrganizationMember[]> => {
    const response = await apiClient.get(`/user/organizations/${organizationId}/members`, {
      params: { include_deleted: includeDeleted }
    })
    const data = handleResponse<{ 
      members: OrganizationMember[], 
      total: number 
    }>(response)
    
    return data.members
  },

  /**
   * 更新组织信息
   * 后端路由: PUT /workshop/v1/user/organizations/:id
   */
  update: async (input: UpdateOrganizationInput): Promise<Organization> => {
    const response = await apiClient.put(`/user/organizations/${input.id}`, {
      name: input.name,
      description: input.description
    })
    const data = handleResponse<{ 
      id: number, 
      name: string, 
      description?: string, 
      creator_id: number, 
      created_at: string,
      updated_at: string 
    }>(response)
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      creator_id: data.creator_id,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  },

  /**
   * 删除组织
   * 后端路由: DELETE /workshop/v1/user/organizations/:id
   */
  delete: async (id: number): Promise<void> => {
    const response = await apiClient.delete(`/user/organizations/${id}`)
    handleResponse(response)
  },

  /**
   * 生成组织邀请码
   * 后端路由: POST /workshop/v1/user/organizations/:id/invitations
   */
  createInvite: async (input: InviteMemberInput): Promise<OrganizationInvitation> => {
    const response = await apiClient.post(`/user/organizations/${input.organization_id}/invitations`, {
      role: input.role || 'member',
      expires_in: input.expires_in || 0,
      max_uses: input.max_uses || 1
    })
    const data = handleResponse<OrganizationInvitation>(response)
    
    return data
  },

  /**
   * 使用邀请码加入组织
   * 后端路由: POST /workshop/v1/user/organizations/join
   */
  join: async (input: JoinOrganizationInput): Promise<any> => {
    const response = await apiClient.post('/user/organizations/join', input)
    const data = handleResponse(response)
    
    return data
  },

  /**
   * 删除组织成员
   * 后端路由: DELETE /workshop/v1/user/organizations/:id/members
   */
  removeMember: async (input: DeleteMemberInput): Promise<void> => {
    const response = await apiClient.delete(`/user/organizations/${input.organization_id}/members`, {
      data: { target_user_id: input.target_user_id }
    })
    handleResponse(response)
  },

  /**
   * 更新组织成员角色
   * 后端路由: PUT /workshop/v1/user/organizations/:id/members/role
   */
  updateMemberRole: async (input: UpdateMemberRoleInput): Promise<OrganizationMember> => {
    const response = await apiClient.put(`/user/organizations/${input.organization_id}/members/role`, {
      target_user_id: input.target_user_id,
      role: input.role
    })
    const data = handleResponse<OrganizationMember>(response)
    
    return data
  }
}
