/**
 * projects API - 项目管理接口
 */

import { apiClient } from '../client'
import { handleResponse, handlePaginatedResponse } from '../interceptors/response'
import type { Project } from '@/types'

export interface CreateProjectInput {
  name: string
  git_url: string
}

export interface UpdateProjectInput {
  name?: string
  git_url?: string
}

export const projectsApi = {
  /**
   * 获取当前用户的项目列表
   * 后端路由: GET /workshop/v1/user/projects
   * 注意：根据API文档，不需要 user_id 参数，网关会自动识别当前用户
   * 响应格式: { code: 'OK', data: Project[] } 或 { code: 'OK', data: Project[], meta: {...} }
   */
  list: async (userId?: number): Promise<Project[]> => {
    // 根据API文档，不需要 user_id 参数，网关会自动识别用户
    console.log('📋 获取项目列表')
    const response = await apiClient.get('/user/projects')
    
    // 后端实际返回格式: { code: 'OK', data: { projects: [...], total: 3 } }
    const responseData = response.data
    if (responseData?.code === 'OK' && responseData?.data) {
      const data = responseData.data
      
      // 检查是否是嵌套格式: { projects: [...], total: 3 }
      if (data && typeof data === 'object' && 'projects' in data && Array.isArray(data.projects)) {
        console.log('✅ 获取到项目列表（嵌套格式），数量:', data.projects.length)
        return data.projects
      }
      
      // 检查是否是分页格式: { code: 'OK', data: [...], meta: {...} }
      if (responseData?.meta) {
        const { data: projects } = handlePaginatedResponse<Project>(response)
        console.log('✅ 获取到项目列表（分页），数量:', projects.length)
        return Array.isArray(projects) ? projects : []
      }
      
      // 普通数组格式: { code: 'OK', data: [...] }
      if (Array.isArray(data)) {
        console.log('✅ 获取到项目列表（数组），数量:', data.length)
        return data
      }
    }
    
    // 兜底：尝试使用 handleResponse
    try {
      const data = handleResponse<any>(response)
      // 如果返回的是对象，尝试提取 projects 字段
      if (data && typeof data === 'object' && 'projects' in data && Array.isArray(data.projects)) {
        console.log('✅ 获取到项目列表（handleResponse 嵌套），数量:', data.projects.length)
        return data.projects
      }
      // 如果是数组，直接返回
      if (Array.isArray(data)) {
        console.log('✅ 获取到项目列表（handleResponse 数组），数量:', data.length)
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
  getById: async (id: string, userId?: number): Promise<Project> => {
    // 后端没有单独的获取项目详情接口，我们从项目列表中查找
    const projects = await projectsApi.list() // 不需要 userId
    const project = projects.find((p) => p.id.toString() === id)
    
    if (!project) {
      throw new Error('项目不存在')
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
  getMembers: async (projectId: string, userId?: number) => {
    // 后端没有单独的获取成员列表接口，我们从项目列表中查找对应的项目
    const projects = await projectsApi.list()
    const project = projects.find((p) => p.id.toString() === projectId)
    
    if (!project) {
      throw new Error('项目不存在')
    }
    
    // 返回项目的成员列表
    const members = project.members || []
    console.log('👥 获取项目成员列表，项目ID:', projectId, '成员数量:', members.length)
    return members
  },
  
  /**
   * 删除项目成员
   * 后端路由: DELETE /workshop/v1/user/projects/:id/members
   * 注意：根据API文档，需要 user_id 查询参数（当前用户ID，数据库ID）
   * 请求体: { target_user_id: number }
   */
  deleteMember: async (projectId: string, targetUserId: number, currentUserId?: number): Promise<void> => {
    console.log('🗑️ 删除项目成员, 项目ID:', projectId, '目标用户ID:', targetUserId, '当前用户ID:', currentUserId)
    
    // 构建查询参数
    const params: Record<string, string> = {}
    if (currentUserId) {
      params.user_id = currentUserId.toString()
    }
    
    await apiClient.delete(`/user/projects/${projectId}/members`, {
      params, // 查询参数
      data: { target_user_id: targetUserId }, // 请求体
    })
    console.log('✅ 成员删除成功')
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
    role: 'admin' | 'member',
    currentUserId?: number
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

