/**
 * feedbacks API - 反馈接口
 */

import { apiClient } from '../client'
import { handleResponse } from '../interceptors/response'
import type { ApiMeta } from '@/types/api'

export interface Feedback {
  id: number
  project_id: number
  short_id: string
	title: string
	content: string
	status?: string
	triage_status?: 'pending' | 'accepted' | 'ignored'
	customer_status?: 'submitted' | 'reviewing' | 'developing' | 'released' | 'completed' | 'ignored'
	task_id?: number
	task_state?: string
	custom_user_id?: string
  user_phone?: string
  user_email?: string
  file?: string
  data?: string
  created_at: string
  updated_at: string
}

export interface CreateFeedbackInput {
  projectId: number
  title: string
  content: string
  customUserId?: string
  userPhone?: string
  userEmail?: string
  callbackUrl?: string
  file?: string
  data?: string
}

export interface FeedbackListOptions {
  page?: number
  pageSize?: number
  includeDeleted?: boolean
  shortId?: string
  userPhone?: string
  userEmail?: string
  customUserId?: string
}

export interface FeedbackListResult {
  feedbacks: Feedback[]
  meta: ApiMeta
  total: number
}

export interface UpdateFeedbackInput {
  shortId?: string
  title?: string
  content?: string
  customUserId?: string
  userPhone?: string
  userEmail?: string
  file?: string
  data?: string
}

export interface DeleteFeedbackResult {
  feedback_id: number
  deleted_at: string
}

export const feedbacksApi = {
  /**
   * 查询反馈
   * 后端路由: GET /workshop/v1/user/feedbacks
   */
  listByProject: async (projectId: string | number, options?: FeedbackListOptions): Promise<FeedbackListResult> => {
    const params: Record<string, any> = {
      project_id: projectId,
    }
    if (options?.shortId) params.short_id = options.shortId
    if (options?.userPhone) params.user_phone = options.userPhone
    if (options?.userEmail) params.user_email = options.userEmail
    if (options?.customUserId) params.custom_user_id = options.customUserId
    if (options?.includeDeleted !== undefined) params.include_deleted = options.includeDeleted
    if (options?.page) params.page = options.page
    if (options?.pageSize) params.page_size = options.pageSize

    console.log('📋 获取反馈列表，项目ID:', projectId, '参数:', params)
    const response = await apiClient.get('/user/feedbacks', { params })
    const responseData = response.data

    let feedbacks: Feedback[] = []
    let total = 0
    let meta: ApiMeta = {
      page: options?.page || 1,
      page_size: options?.pageSize || 0,
      total: 0,
    }

    if (responseData?.code === 'OK' && responseData?.data !== undefined) {
      const data = responseData.data
      if (Array.isArray(data)) {
        feedbacks = data
        total = feedbacks.length
      } else if (data && typeof data === 'object') {
        if (Array.isArray((data as any).feedbacks)) {
          feedbacks = (data as any).feedbacks
          total = typeof (data as any).total === 'number' ? (data as any).total : feedbacks.length
        } else if (Array.isArray((data as any).items)) {
          feedbacks = (data as any).items
          total = typeof (data as any).total === 'number' ? (data as any).total : feedbacks.length
        }
      }
      if (responseData?.meta) {
        meta = responseData.meta as ApiMeta
        if (typeof meta.total !== 'number') {
          meta.total = total
        }
      } else {
        meta = {
          page: options?.page || 1,
          page_size: options?.pageSize || feedbacks.length,
          total,
        }
      }
      return { feedbacks, meta, total }
    }

    try {
      const data = handleResponse<any>(response)
      if (Array.isArray(data)) {
        feedbacks = data
        total = feedbacks.length
      } else if (data && typeof data === 'object') {
        if (Array.isArray((data as any).feedbacks)) {
          feedbacks = (data as any).feedbacks
          total = typeof (data as any).total === 'number' ? (data as any).total : feedbacks.length
        } else if (Array.isArray((data as any).items)) {
          feedbacks = (data as any).items
          total = typeof (data as any).total === 'number' ? (data as any).total : feedbacks.length
        }
      }
      meta = {
        page: options?.page || 1,
        page_size: options?.pageSize || feedbacks.length,
        total,
      }
      return { feedbacks, meta, total }
    } catch (error) {
      console.error('❌ 解析反馈列表失败:', error)
      return {
        feedbacks: [],
        meta: {
          page: options?.page || 1,
          page_size: options?.pageSize || 0,
          total: 0,
        },
        total: 0,
      }
    }
  },

  /**
   * 创建反馈
   * 后端路由: POST /workshop/v1/user/feedbacks
   */
  create: async (input: CreateFeedbackInput): Promise<Feedback> => {
    console.log('📝 创建反馈，项目ID:', input.projectId)
    const response = await apiClient.post('/user/feedbacks', {
      project_id: input.projectId,
      title: input.title,
      content: input.content,
      custom_user_id: input.customUserId,
      user_phone: input.userPhone,
      user_email: input.userEmail,
      callback_url: input.callbackUrl,
      file: input.file,
      data: input.data,
    })
    const feedback = handleResponse<Feedback>(response)
    console.log('✅ 反馈创建成功:', feedback.short_id)
    return feedback
  },

  /**
   * 更新反馈
   * 后端路由: PUT /workshop/v1/user/feedbacks/:id
   */
  update: async (id: number, input: UpdateFeedbackInput): Promise<Feedback> => {
    console.log('✏️ 更新反馈，ID:', id)
    const response = await apiClient.put(`/user/feedbacks/${id}`, {
      short_id: input.shortId,
      title: input.title,
      content: input.content,
      custom_user_id: input.customUserId,
      user_phone: input.userPhone,
      user_email: input.userEmail,
      file: input.file,
      data: input.data,
    })
    const feedback = handleResponse<Feedback>(response)
    console.log('✅ 反馈更新成功:', feedback.short_id)
    return feedback
  },

  /**
   * 删除反馈
   * 后端路由: DELETE /workshop/v1/user/feedbacks/:id
   */
  remove: async (id: number): Promise<DeleteFeedbackResult> => {
    const response = await apiClient.delete(`/user/feedbacks/${id}`)
    return handleResponse<DeleteFeedbackResult>(response)
  },
}
