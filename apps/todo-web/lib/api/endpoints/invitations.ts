/**
 * invitations API - 邀请管理接口
 */

import { apiClient } from '../client'
import type { ProjectInvitation, ProjectRole } from '@/types'

export interface CreateInvitationInput {
  project_id: number
  role: ProjectRole
  expires_in_hours?: number // 0 表示永不过期
}

export const invitationsApi = {
  /**
   * 创建邀请
   * 后端路由: POST /todo/v1/user/projects/:id/invitations
   * 后端参数: { role: string, expires_in: number } (expires_in 是小时数)
   * 后端响应: { invite_code, invite_link, role, expires_at, created_at }
   */
  create: async (input: CreateInvitationInput): Promise<ProjectInvitation> => {
    const { data } = await apiClient.post(
      `/user/projects/${input.project_id}/invitations`,
      {
        role: input.role,
        expires_in: input.expires_in_hours || 0, // 后端参数名是 expires_in（小时数）
      }
    )
    
    // 后端返回格式: { invite_code, invite_link, role, expires_at, created_at }
    // 转换为前端的 ProjectInvitation 格式
    return {
      id: 0, // 后端响应中没有 id，设为 0
      project_id: input.project_id,
      invite_code: data.invite_code,
      role: data.role as ProjectRole,
      inviter_id: 0, // 后端响应中没有 inviter_id
      expires_at: data.expires_at || undefined,
      created_at: data.created_at,
      updated_at: data.created_at, // 后端响应中没有 updated_at，使用 created_at
    }
  },
  
  /**
   * 获取项目的邀请列表
   * 注意：后端目前不支持此接口，返回空数组
   */
  listByProject: async (projectId: string): Promise<ProjectInvitation[]> => {
    // 后端没有获取邀请列表的接口，返回空数组
    // TODO: 如果后端支持，可以添加此接口
    return []
  },
  
  /**
   * 使用邀请码加入项目
   * 后端路由: POST /todo/v1/user/projects/join?user_id={userId}
   * 请求体: { invite_code: string }
   * 
   * 注意：后端需要查询参数 user_id（数据库ID）
   * 
   * @param inviteCode 邀请码
   * @param userId 用户ID（数据库ID），如果不提供会尝试从其他途径获取
   */
  join: async (inviteCode: string, userId?: number): Promise<{ project_id: number }> => {
    // 如果没有传入 userId，尝试从 localStorage 获取（作为备用方案）
    if (!userId && typeof window !== 'undefined') {
      try {
        const authStorage = localStorage.getItem('auth-storage')
        if (authStorage) {
          const authData = JSON.parse(authStorage)
          if (authData?.state?.user?.id) {
            userId = authData.state.user.id
          }
        }
      } catch (err) {
        console.warn('无法从 localStorage 获取用户ID:', err)
      }
    }
    
    if (!userId) {
      throw new Error('无法获取用户ID，请先登录')
    }
    
    const { data } = await apiClient.post(`/user/projects/join?user_id=${userId}`, {
      invite_code: inviteCode,
    })
    return data
  },
  
  /**
   * 删除邀请
   * 注意：后端目前不支持此接口
   */
  delete: async (projectId: string, invitationId: string): Promise<void> => {
    // 后端没有删除邀请的接口
    // TODO: 如果后端支持，可以添加此接口
    throw new Error('后端不支持删除邀请功能')
  },
}

