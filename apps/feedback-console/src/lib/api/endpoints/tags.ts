/**
 * tags API - 标签管理接口
 */

import { apiClient } from '../client'
import { handleResponse } from '../interceptors/response'

export interface Tag {
  id: number
  project_id: number
  name: string
  created_at: string
  updated_at: string
}

export interface CreateTagInput {
  project_id: number
  name: string
}

export interface UpdateTagInput {
  name: string
}

export const tagsApi = {
  /**
   * 获取项目的所有标签
   * 后端路由: GET /workshop/v1/user/projects/:id/tags
   */
  listByProject: async (projectId: string): Promise<Tag[]> => {
    console.log('📋 获取项目标签列表，项目ID:', projectId)
    const response = await apiClient.get(`/user/projects/${projectId}/tags`)
    const data = handleResponse<Tag[]>(response)
    console.log('✅ 获取到标签列表，数量:', Array.isArray(data) ? data.length : 0)
    return Array.isArray(data) ? data : []
  },

  /**
   * 创建标签
   * 后端路由: POST /workshop/v1/user/projects/:id/tags
   */
  create: async (projectId: string, input: CreateTagInput): Promise<Tag> => {
    console.log('🆕 创建标签:', input)
    const response = await apiClient.post(`/user/projects/${projectId}/tags`, input)
    const tag = handleResponse<Tag>(response)
    console.log('✅ 标签创建成功:', tag)
    return tag
  },

  /**
   * 更新标签
   * 后端路由: PUT /workshop/v1/user/tags/:id
   */
  update: async (tagId: string, input: UpdateTagInput): Promise<Tag> => {
    console.log('🔄 更新标签，标签ID:', tagId, '更新内容:', input)
    const response = await apiClient.put(`/user/tags/${tagId}`, input)
    const tag = handleResponse<Tag>(response)
    console.log('✅ 标签更新成功:', tag)
    return tag
  },

  /**
   * 删除标签
   * 后端路由: DELETE /workshop/v1/user/tags/:id
   */
  delete: async (tagId: string): Promise<void> => {
    console.log('🗑️ 删除标签，标签ID:', tagId)
    await apiClient.delete(`/user/tags/${tagId}`)
    console.log('✅ 标签删除成功')
  },
}

