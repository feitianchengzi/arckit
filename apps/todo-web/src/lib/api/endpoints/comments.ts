/**
 * 评论 API - 基于任务附件接口实现
 * 使用附件接口，type: "comment"
 */

import { apiClient } from '../client'
import { handleResponse } from '../interceptors/response'

/**
 * 评论（附件）数据结构
 */
export interface TaskComment {
  id: number
  task_id: number
  creator_id: number
  type: 'text' | 'url' | 'file'
  content: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/**
 * 创建评论请求参数
 */
export interface CreateCommentInput {
  task_id: number
  type: 'text' | 'url' | 'file'
  content: string
}

/**
 * 更新评论请求参数
 */
export interface UpdateCommentInput {
  content: string
}

/**
 * 评论列表响应
 */
export interface CommentsResponse {
  attachments: TaskComment[]
  total: number
}

export const commentsApi = {
  /**
   * 创建评论
   * 后端路由: POST /workshop/v1/user/tasks/attachments
   */
  create: async (input: CreateCommentInput): Promise<TaskComment> => {
    console.log('💬 创建评论，任务ID:', input.task_id, '类型:', input.type)
    const response = await apiClient.post('/user/tasks/attachments', {
      task_id: input.task_id,
      type: input.type,
      content: input.content,
    })
    const comment = handleResponse<TaskComment>(response)
    console.log('✅ 评论创建成功:', comment)
    return comment
  },

  /**
   * 获取任务的评论列表
   * 后端路由: GET /workshop/v1/user/tasks/attachments?task_id={taskId}
   * 注意：后端不支持按 type 过滤，需要在前端过滤出 type=comment 的附件
   */
  listByTask: async (taskId: number): Promise<TaskComment[]> => {
    console.log('📋 获取任务评论列表，任务ID:', taskId)
    const response = await apiClient.get('/user/tasks/attachments', {
      params: {
        task_id: taskId,
      },
    })
    const result = handleResponse<CommentsResponse>(response)
    // 过滤出 type 为 text/url/file 且未删除的评论
    const comments = (result.attachments || []).filter(
      (attachment) => (attachment.type === 'text' || attachment.type === 'url' || attachment.type === 'file') && !attachment.deleted_at
    ) as TaskComment[]
    console.log('✅ 获取评论列表成功，共', comments.length, '条')
    return comments
  },

  /**
   * 更新评论
   * 后端路由: PUT /workshop/v1/user/tasks/attachments/:id
   */
  update: async (commentId: number, input: UpdateCommentInput): Promise<TaskComment> => {
    console.log('✏️ 更新评论，评论ID:', commentId)
    const response = await apiClient.put(`/user/tasks/attachments/${commentId}`, {
      content: input.content,
    })
    const comment = handleResponse<TaskComment>(response)
    console.log('✅ 评论更新成功:', comment)
    return comment
  },

  /**
   * 删除评论
   * 后端路由: DELETE /workshop/v1/user/tasks/attachments/:id
   */
  delete: async (commentId: number): Promise<{ id: number; deleted_at: string }> => {
    console.log('🗑️ 删除评论，评论ID:', commentId)
    const response = await apiClient.delete(`/user/tasks/attachments/${commentId}`)
    const result = handleResponse<{ id: number; deleted_at: string }>(response)
    console.log('✅ 评论删除成功:', result)
    return result
  },
}
