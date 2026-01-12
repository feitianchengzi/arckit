/**
 * projects API - 项目管理接口
 */

import { apiClient } from '../client'
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
   * 响应格式: { projects: Project[], total: number }
   */
  list: async (userId?: number): Promise<Project[]> => {
    // 根据API文档，不需要 user_id 参数，网关会自动识别用户
    console.log('📋 获取项目列表')
    const { data } = await apiClient.get('/user/projects')
    // 后端返回格式是 { projects: [], total: 0 }，需要提取 projects 数组
    const projects = data?.projects || data || []
    console.log('✅ 获取到项目列表，数量:', projects.length)
    return projects
  },
  
  /**
   * 创建项目
   * 后端路由: POST /workshop/v1/user/projects
   * 注意：根据API文档，不需要 user_id 参数，网关会自动识别当前用户
   * 创建者自动成为项目所有者（owner）
   */
  create: async (input: CreateProjectInput, userId?: number): Promise<Project> => {
    // 根据API文档，不需要 user_id 参数，网关会自动识别用户
    console.log('🆕 创建项目:', input)
    const { data } = await apiClient.post('/user/projects', input)
    console.log('✅ 项目创建成功:', data)
    return data
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
   */
  update: async (id: string, input: UpdateProjectInput): Promise<Project> => {
    const { data } = await apiClient.put(`/user/projects/${id}`, input)
    return data
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
   * 注意：根据API文档，不需要 user_id 参数，网关会自动识别当前用户
   * 请求体: { target_user_id: number }
   */
  deleteMember: async (projectId: string, targetUserId: number, currentUserId?: number): Promise<void> => {
    console.log('🗑️ 删除项目成员, 项目ID:', projectId, '目标用户ID:', targetUserId)
    await apiClient.delete(`/user/projects/${projectId}/members`, {
      data: { target_user_id: targetUserId },
    })
    console.log('✅ 成员删除成功')
  },
  
  /**
   * 设置成员角色
   * 后端路由: PUT /workshop/v1/user/projects/:id/members/role
   * 注意：根据API文档，不需要 user_id 参数，网关会自动识别当前用户
   * 请求体: { target_user_id: number, role: string }
   */
  setMemberRole: async (
    projectId: string, 
    targetUserId: number, 
    role: 'admin' | 'member',
    currentUserId?: number
  ) => {
    console.log('👤 设置成员角色, 项目ID:', projectId, '目标用户ID:', targetUserId, '新角色:', role)
    const { data } = await apiClient.put(
      `/user/projects/${projectId}/members/role`,
      {
        target_user_id: targetUserId,
        role,
      }
    )
    console.log('✅ 角色设置成功:', data)
    return data
  },
}

