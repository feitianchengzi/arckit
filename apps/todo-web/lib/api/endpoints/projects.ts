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
   * 后端路由: GET /todo/v1/user/projects?user_id={userId}
   * 响应格式: { projects: Project[], total: number }
   */
  list: async (userId?: number): Promise<Project[]> => {
    // 如果没有传入 userId，尝试从 localStorage 获取
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
    
    const { data } = await apiClient.get(`/user/projects?user_id=${userId}`)
    // 后端返回格式是 { projects: [], total: 0 }，需要提取 projects 数组
    return data?.projects || data || []
  },
  
  /**
   * 创建项目
   * 后端路由: POST /todo/v1/user/projects?user_id={userId}
   */
  create: async (input: CreateProjectInput, userId?: number): Promise<Project> => {
    // 如果没有传入 userId，尝试从 localStorage 获取
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
    
    const { data } = await apiClient.post(`/user/projects?user_id=${userId}`, input)
    return data
  },
  
  /**
   * 获取项目详情
   * 注意：后端没有单独的获取项目详情接口
   * 我们从项目列表中查找对应的项目
   */
  getById: async (id: string, userId?: number): Promise<Project> => {
    // 后端没有单独的获取项目详情接口，我们从项目列表中查找
    const projects = await projectsApi.list(userId)
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
    const projects = await projectsApi.list(userId)
    const project = projects.find((p) => p.id.toString() === projectId)
    
    if (!project) {
      throw new Error('项目不存在')
    }
    
    // 返回项目的成员列表
    return project.members || []
  },
  
  /**
   * 删除项目成员
   * 后端路由: DELETE /todo/v1/user/projects/:id/members?user_id={userId}
   * 请求体: { target_user_id: number }
   */
  deleteMember: async (projectId: string, targetUserId: number, currentUserId: number): Promise<void> => {
    await apiClient.delete(`/user/projects/${projectId}/members?user_id=${currentUserId}`, {
      data: { target_user_id: targetUserId },
    })
  },
  
  /**
   * 设置成员角色
   * 后端路由: PUT /todo/v1/user/projects/:id/members/role?user_id={userId}
   * 请求体: { target_user_id: number, role: string }
   */
  setMemberRole: async (
    projectId: string, 
    targetUserId: number, 
    role: 'admin' | 'member',
    currentUserId: number
  ) => {
    const { data } = await apiClient.put(
      `/user/projects/${projectId}/members/role?user_id=${currentUserId}`,
      {
        target_user_id: targetUserId,
        role,
      }
    )
    return data
  },
}

