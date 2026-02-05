/**
 * projects API - 项目管理接口
 */

import { apiClient } from '../client'
import { handleResponse, handlePaginatedResponse } from '../interceptors/response'
import type { Project } from '@/types'

export interface CreateProjectInput {
  name: string
  git_url: string
  organization_id?: number | null
}

export interface UpdateProjectInput {
  name?: string
  git_url?: string
  organization_id?: number
}

export const projectsApi = {
  /**
   * 获取当前用户的项目列表
   * 后端路由: GET /workshop/v1/user/projects
   * 注意：根据API文档，不需要 user_id 参数，网关会自动识别当前用户
   * 响应格式: { code: 'OK', data: Project[] } 或 { code: 'OK', data: Project[], meta: {...} }
   */
  list: async (options?: { organizationId?: number | null; includeDeleted?: boolean }): Promise<Project[]> => {
    const params: Record<string, number | boolean> = {}
    if (options?.includeDeleted !== undefined) {
      params.include_deleted = options.includeDeleted
    }
    if (typeof options?.organizationId === 'number') {
      params.organization_id = options.organizationId
    }
    const response = await apiClient.get('/user/projects', { params })
    
    // 后端实际返回格式: { code: 'OK', data: { projects: [...], total: 3 } }
    const responseData = response.data
    if (responseData?.code === 'OK' && responseData?.data) {
      const data = responseData.data
      
      // 检查是否是嵌套格式: { projects: [...], total: 3 }
      if (data && typeof data === 'object' && 'projects' in data && Array.isArray(data.projects)) {
        return data.projects
      }
      
      // 检查是否是分页格式: { code: 'OK', data: [...], meta: {...} }
      if (responseData?.meta) {
        const { data: projects } = handlePaginatedResponse<Project>(response)
        return Array.isArray(projects) ? projects : []
      }
      
      // 普通数组格式: { code: 'OK', data: [...] }
      if (Array.isArray(data)) {
        return data
      }
    }
    
    // 兜底：尝试使用 handleResponse
    try {
      const data = handleResponse<any>(response)
      // 如果返回的是对象，尝试提取 projects 字段
      if (data && typeof data === 'object' && 'projects' in data && Array.isArray(data.projects)) {
        return data.projects
      }
      // 如果是数组，直接返回
      if (Array.isArray(data)) {
        return data
      }
      console.warn('⚠️ 无法解析项目列表格式:', data)
      return []
    } catch (error) {
      console.error('❌ 解析项目列表失败:', error)
      return []
    }
  },
  
  /**
   * 创建项目
   * 后端路由: POST /workshop/v1/user/projects
   * 注意：根据API文档，不需要 user_id 参数，网关会自动识别当前用户
   * 创建者自动成为项目所有者（owner）
   * 响应格式: { code: 'OK', data: Project }
   */
  create: async (input: CreateProjectInput, userId?: number): Promise<Project> => {
    // 根据API文档，不需要 user_id 参数，网关会自动识别用户
    console.log('🆕 创建项目:', input)
    const response = await apiClient.post('/user/projects', input)
    const project = handleResponse<Project>(response)
    console.log('✅ 项目创建成功:', project)
    return project
  },
  
  /**
   * 获取项目详情
   * 注意：后端没有单独的获取项目详情接口
   * 我们从项目列表中查找对应的项目
   */
  getById: async (id: string, organizationId?: number | null): Promise<Project> => {
    // 由于后端不支持直接通过ID获取项目详情 (返回404)，
    // 我们先获取项目列表，然后从中查找目标项目
    // 如果已知 organizationId，则只获取该组织的项目列表
    const projects = await projectsApi.list({ organizationId })
    const project = projects.find((p) => p.id.toString() === id)
    
    if (!project) {
      throw new Error('Project not found')
    }
    
    return project
  },
  
  /**
   * 更新项目
   * 响应格式: { code: 'OK', data: Project }
   */
  update: async (id: string, input: UpdateProjectInput): Promise<Project> => {
    const response = await apiClient.put(`/user/projects/${id}`, input)
    return handleResponse<Project>(response)
  },
  
  /**
   * 删除项目
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/user/projects/${id}`)
  },
  
  /**
   * 获取项目成员列表
   * 注意：后端没有单独的获取成员列表接口
   * 成员列表包含在项目详情中，我们从项目列表中查找对应的项目并返回其成员
   */
  getMembers: async (projectId: string, organizationId?: number | null) => {
    const projects = await projectsApi.list({ organizationId })
    const project = projects.find((p) => p.id.toString() === projectId)
    
    if (!project) {
      throw new Error('项目不存在')
    }
    
    // 返回项目的成员列表
    return project.members || []
  },
  
  /**
   * 添加项目成员
   * 后端路由: POST /workshop/v1/user/projects/:id/members
   * 请求体: { organization_member_id: number }
   */
  addMember: async (projectId: string, organizationMemberId: number): Promise<void> => {
    console.log('➕ [添加成员] 开始添加项目成员')
    console.log('➕ [添加成员] 项目ID:', projectId)
    console.log('➕ [添加成员] 组织成员ID:', organizationMemberId)
    
    await apiClient.post(`/user/projects/${projectId}/members`, {
      organization_member_id: organizationMemberId,
    })
  },

  /**
   * 删除项目成员
   * 后端路由: DELETE /workshop/v1/user/projects/:id/members
   * 注意：根据API文档，不需要 user_id 参数，网关会自动识别当前用户
   * 权限：owner 和 admin 可以删除任何成员，任何成员都可以删除自己（离开项目）
   * 请求体: { target_user_id: number }
   */
  deleteMember: async (projectId: string, targetUserId: number): Promise<void> => {
    console.log('🗑️ [删除成员] 开始删除项目成员')
    console.log('🗑️ [删除成员] 项目ID:', projectId)
    console.log('🗑️ [删除成员] 目标用户ID:', targetUserId)
    console.log('🗑️ [删除成员] 请求URL:', `/user/projects/${projectId}/members`)
    console.log('🗑️ [删除成员] 请求体:', JSON.stringify({ target_user_id: targetUserId }))
    
    try {
      const response = await apiClient.delete(`/user/projects/${projectId}/members`, {
        data: { target_user_id: targetUserId }, // 请求体
      })
    } catch (error: any) {
      console.error('❌ [删除成员] 删除失败:', error.message)
      throw error
    }
  },
  
  /**
   * 设置成员角色
   * 后端路由: PUT /workshop/v1/user/projects/:id/members/role
   * 注意：根据API文档，不需要 user_id 参数，网关会自动识别当前用户
   * 请求体: { target_user_id: number, role: string }
   * 响应格式: { code: 'OK', data: ProjectMember }
   */
  setMemberRole: async (
    projectId: string, 
    targetUserId: number, 
    role: 'admin' | 'member'
  ) => {
    console.log('👤 设置成员角色, 项目ID:', projectId, '目标用户ID:', targetUserId, '新角色:', role)
    const response = await apiClient.put(
      `/user/projects/${projectId}/members/role`,
      {
        target_user_id: targetUserId,
        role,
      }
    )
    const member = handleResponse<any>(response)
    console.log('✅ 角色设置成功:', member)
    return member
  },
}
