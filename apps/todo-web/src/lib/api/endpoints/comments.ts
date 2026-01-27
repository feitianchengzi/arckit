/**
 * 评论 API - 基于任务附件接口实现
 * 评论一律使用 type: 'text'，富文本约定见 COMMENT_RICH_TEXT_FORMAT。
 */

import { apiClient } from '../client'
import { handleResponse } from '../interceptors/response'

/**
 * text 字段富文本格式约定：[] 内仅格式类型，() 内为参数。
 *
 * - @ 提及： [name](username)
 *   示例 "[name](戴鹏飞3)" → 展示为 @戴鹏飞3
 *
 * - 链接：   [link](url) 或 [link](url|显示名)
 *   [link](url)：展示时用 url 作为链接文案；
 *   [link](url|显示名)：展示时用「显示名」作文案。显示名中勿含 | 或 )。
 *   示例 "[link](https://www.baidu.com)"、"[link](https://www.baidu.com|百度)"
 *   用户输入裸 URL（如 www.baidu.com）时，提交前转为 [link](https://www.baidu.com)
 *
 * - 图片：   (当前) 使用 payload.imageKeys；(后续可扩展) 内联如 [image](ossKey)
 * - 文件：   (当前) 使用 payload.fileKeys；(后续可扩展) 内联如 [file](ossKey)
 */
export const COMMENT_RICH_TEXT_FORMAT = {
  mention: '[name](username)' as const,
  link: '[link](url)' as const,
  linkWithName: '[link](url|显示名)' as const,
}

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
 * type='text' 时 content 的 JSON 结构，与接口返回一致。
 * 创建/更新时需将此对象 JSON.stringify 后作为 content 上传。
 */
export interface TextCommentContentPayload {
  text: string
  imageKeys: string[]
  fileKeys: string[]
}

/**
 * 将正文中的裸 URL 转为链接格式 [link](url)，[] 仅类型。
 * 不改写已是 [xxx](...) 的片段；www / https? 补全为 https 后写成 [link](url)。
 */
export function rawUrlsToLinkFormat(text: string): string {
  if (!text || typeof text !== 'string') return text
  const parts = text.split(/(\]\([^)]*\))/g)
  return parts
    .map((p) => {
      if (/^\]\([^)]*\)$/.test(p)) return p
      return p.replace(
        /(https?:\/\/[^\s\]\)<>"]+)|(www\.[^\s\]\)<>"]+)/gi,
        (raw: string) => {
          const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
          return `[link](${url})`
        }
      )
    })
    .join('')
}

/** 把文本评论 payload 转为接口要求的 content 字符串 */
export function buildTextCommentContent(p: TextCommentContentPayload): string {
  return JSON.stringify({
    text: p.text,
    imageKeys: p.imageKeys ?? [],
    fileKeys: p.fileKeys ?? [],
  })
}

/** 从接口返回的 content 中解析出正文，兼容旧数据（纯字符串） */
export function parseTextCommentContent(content: string): string {
  const p = parseTextCommentContentPayload(content)
  return p ? p.text : (content ?? '')
}

/** 解析出完整 payload，用于编辑回填；非 JSON 或无效时返回 null */
export function parseTextCommentContentPayload(content: string): TextCommentContentPayload | null {
  if (!content || typeof content !== 'string') return null
  try {
    const o = JSON.parse(content) as TextCommentContentPayload
    if (o && typeof o.text === 'string') {
      return {
        text: o.text,
        imageKeys: Array.isArray(o.imageKeys) ? o.imageKeys : [],
        fileKeys: Array.isArray(o.fileKeys) ? o.fileKeys : [],
      }
    }
  } catch {
    // 旧数据为纯文本，可当作 { text: content, imageKeys: [], fileKeys: [] }
    return { text: content, imageKeys: [], fileKeys: [] }
  }
  return null
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
