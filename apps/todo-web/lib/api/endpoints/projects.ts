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
   * 后端路由: GET /todo/v1/user/projects
   * 响应格式: { projects: Project[], total: number }
   */
  list: async (): Promise<Project[]> => {
    const { data } = await apiClient.get('/user/projects')
    // 后端返回格式是 { projects: [], total: 0 }，需要提取 projects 数组
    return data?.projects || data || []
  },
  
  /**
   * 创建项目
   */
  create: async (input: CreateProjectInput): Promise<Project> => {
    const { data } = await apiClient.post('/user/projects', input)
    return data
  },
  
  /**
   * 获取项目详情
   * 注意：后端没有单独的获取项目详情接口
   * 我们从项目列表中查找对应的项目
   */
  getById: async (id: string): Promise<Project> => {
    // 后端没有单独的获取项目详情接口，我们从项目列表中查找
    const projects = await projectsApi.list()
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
   */
  getMembers: async (projectId: string) => {
    const { data } = await apiClient.get(`/user/projects/${projectId}/members`)
    return data
  },
}

