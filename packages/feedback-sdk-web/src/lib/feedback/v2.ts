import type { FeedbackItem } from '@/lib/feedback/types'
import { feedbackToItem, type FeedbackRecord } from './api'
import { requestFeedbackSessionRefresh } from '@/lib/sdk/bridge'
import { getFeedbackSDKConfig, getFeedbackSDKV2AuthMode } from '@/lib/sdk'

interface ApiEnvelope<T> {
  code?: string
  message?: string
  data?: T
  error?: { message?: string }
  meta?: { total?: number }
}

export interface FeedbackV2Attachment {
  id?: number
  type: 'image' | 'file' | 'url'
  object_key?: string
  url?: string
  file_name?: string
  mime_type?: string
  size?: number
}

export interface FeedbackV2Message {
  id: number
  feedback_id: number
  project_id: number
  sender_type: 'customer' | 'developer' | 'system'
  sender_user_id?: number
  sender_custom_user_id?: string
  client_message_id?: string
  message_type: string
  content: string
  metadata?: unknown
  attachments: FeedbackV2Attachment[]
  created_at: string
  updated_at: string
}

export interface FeedbackV2Notification {
  id: number
  project_id: number
  feedback_id: number
  feedback_short_id?: string
  feedback_title?: string
  message_id: number
  message_type: string
  message_preview: string
  sender_type: 'customer' | 'developer' | 'system'
  type: 'customer_message' | 'developer_message' | 'status_change'
  created_at: string
  read_at?: string
}

interface FeedbackV2NotificationListResponse {
  notifications: FeedbackV2Notification[]
  unread_count: number
}

export interface FeedbackV2UploadPolicy {
  object_key: string
  upload_url: string
  fields: Record<string, string>
  expires_at: string
}

export interface FeedbackV2OSSCredentials {
  access_key_id: string
  access_key_secret: string
  security_token: string
  expiration: string
  bucket_name: string
  region: string
  root_path: string
  authorization_v4: boolean
  secure: boolean
}

interface DirectAPIKeyContext {
  apiKey: string
  projectId: number
  customUserId: string
}

function getGatewayBaseUrl(): string {
  const cfg = getFeedbackSDKConfig()
  if (cfg.gatewayUrl?.trim()) return cfg.gatewayUrl.trim()
  if (import.meta.env.DEV) return '/gateway'
  return import.meta.env.VITE_GATEWAY_URL || 'https://api.feitianchengzi.com'
}

function currentSessionToken(): string {
  const token = getFeedbackSDKConfig().feedbackSessionToken?.trim()
  if (!token) throw new Error('未检测到反馈会话 token，请由宿主应用注入后重试。')
  return token
}

function currentDirectAPIKeyContext(): DirectAPIKeyContext {
  const config = getFeedbackSDKConfig()
  const apiKey = config.apiKey?.trim() || ''
  const customUserId = config.customUserId?.trim() || ''
  const projectId = Number(config.projectId)
  if (!apiKey || !customUserId || !Number.isFinite(projectId) || projectId <= 0) {
    throw new Error('V2 API Key 模式需要 apiKey、projectId 和 customUserId。')
  }
  return { apiKey, projectId: Math.floor(projectId), customUserId }
}

function currentV2AuthMode() {
  const mode = getFeedbackSDKV2AuthMode()
  if (!mode) {
    throw new Error('V2 需要反馈会话 token，或完整的 apiKey、projectId、customUserId 配置。')
  }
  return mode
}

async function requestJson<T>(sessionPath: string, directAPIKeyPath: string, init: RequestInit, retry = true): Promise<ApiEnvelope<T>> {
  const authMode = currentV2AuthMode()
  const isSession = authMode === 'session'
  const directContext = isSession ? null : currentDirectAPIKeyContext()
  const response = await fetch(
    `${getGatewayBaseUrl()}/workshop/v2/${isSession ? 'feedback' : 'apikey'}${isSession ? sessionPath : directAPIKeyPath}`,
    {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${isSession ? currentSessionToken() : directContext?.apiKey}`,
      },
    },
  )

  if (isSession && response.status === 401 && retry) {
    await requestFeedbackSessionRefresh()
    return requestJson<T>(sessionPath, directAPIKeyPath, init, false)
  }

  const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T>
  if (!response.ok || (body.code && body.code !== 'OK')) {
    throw new Error(body.error?.message || body.message || `Request failed: ${response.status}`)
  }
  return body
}

function buildSubmitTitle(content: string): string {
  const normalized = content.trim().replace(/\s+/g, ' ')
  if (!normalized) return '用户反馈'
  return normalized.length > 24 ? `${normalized.slice(0, 24)}...` : normalized
}

function directScopePayload(): Pick<DirectAPIKeyContext, 'projectId' | 'customUserId'> {
  const { projectId, customUserId } = currentDirectAPIKeyContext()
  return { projectId, customUserId }
}

export async function submitFeedbackV2(params: {
  content: string
  attachments?: FeedbackV2Attachment[]
}): Promise<{ id: number; shortId: string }> {
  const content = params.content.trim()
  if (!content) throw new Error('反馈内容不能为空')

  const authMode = currentV2AuthMode()
  const directScope = authMode === 'apiKey' ? directScopePayload() : null
  const metadata = { source: 'feedback-sdk-web', channel: 'webview', feedback_state: 'pending' }
  const envelope = await requestJson<FeedbackRecord>('/feedbacks', '/feedbacks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(directScope
        ? { project_id: directScope.projectId, custom_user_id: directScope.customUserId }
        : {}),
      title: buildSubmitTitle(content),
      content,
      data: directScope ? JSON.stringify(metadata) : metadata,
      attachments: params.attachments || [],
    }),
  })
  if (!envelope.data?.id || !envelope.data.short_id) {
    throw new Error('反馈提交成功，但返回数据不完整')
  }
  return {
    id: envelope.data.id,
    shortId: envelope.data.short_id,
  }
}

export async function fetchFeedbackItemsV2(params?: { page?: number; pageSize?: number }): Promise<{ items: FeedbackItem[]; total: number }> {
  const authMode = currentV2AuthMode()
  const query = new URLSearchParams({
    page: String(params?.page || 1),
    page_size: String(params?.pageSize || 50),
  })
  if (authMode === 'apiKey') {
    const { projectId, customUserId } = directScopePayload()
    query.set('project_id', String(projectId))
    query.set('custom_user_id', customUserId)
  }
  const path = `/feedbacks?${query.toString()}`
  const envelope = await requestJson<FeedbackRecord[]>(path, path, { method: 'GET' })
  const list = Array.isArray(envelope.data) ? envelope.data : []
  return {
	items: list.map((feedback) => feedbackToItem(feedback, { useCustomerWorkflow: true })),
    total: typeof envelope.meta?.total === 'number' ? envelope.meta.total : list.length,
  }
}

export async function getFeedbackMessagesV2(feedbackId: number, params?: { page?: number; pageSize?: number }): Promise<FeedbackV2Message[]> {
  const authMode = currentV2AuthMode()
  const query = new URLSearchParams({
    page: String(params?.page || 1),
    page_size: String(params?.pageSize || 50),
  })
  if (authMode === 'apiKey') {
    query.set('custom_user_id', directScopePayload().customUserId)
  }
  const path = `/feedbacks/${feedbackId}/messages?${query.toString()}`
  const envelope = await requestJson<FeedbackV2Message[]>(path, path, { method: 'GET' })
  return Array.isArray(envelope.data) ? envelope.data : []
}

export async function createFeedbackMessageV2(params: {
  feedbackId: number
  content?: string
  clientMessageId: string
  metadata?: Record<string, unknown>
  attachments?: FeedbackV2Attachment[]
}): Promise<FeedbackV2Message> {
  const authMode = currentV2AuthMode()
  const directScope = authMode === 'apiKey' ? directScopePayload() : null
  const path = `/feedbacks/${params.feedbackId}/messages`
  const envelope = await requestJson<FeedbackV2Message>(path, path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(directScope ? { custom_user_id: directScope.customUserId } : {}),
      content: params.content?.trim() || '',
      client_message_id: params.clientMessageId,
      metadata: params.metadata,
      attachments: params.attachments || [],
    }),
  })
  if (!envelope.data) throw new Error('消息发送成功，但返回数据不完整')
  return envelope.data
}

export async function createFeedbackUploadPolicyV2(params: {
  type: 'image' | 'file'
  fileName: string
  mimeType: string
  size: number
}): Promise<FeedbackV2UploadPolicy> {
  const authMode = currentV2AuthMode()
  const directScope = authMode === 'apiKey' ? directScopePayload() : null
  const envelope = await requestJson<FeedbackV2UploadPolicy>('/upload-policies', '/feedbacks/upload-policies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(directScope
        ? { project_id: directScope.projectId, custom_user_id: directScope.customUserId }
        : {}),
      type: params.type,
      file_name: params.fileName,
      mime_type: params.mimeType,
      size: params.size,
    }),
  })
  if (!envelope.data?.object_key || !envelope.data.upload_url || !envelope.data.fields) {
    throw new Error('附件上传策略返回不完整')
  }
  return envelope.data
}

export async function getFeedbackOSSCredentialsV2(): Promise<FeedbackV2OSSCredentials> {
  const authMode = currentV2AuthMode()
  let directPath = '/feedbacks/oss/credentials'
  if (authMode === 'apiKey') {
    const { projectId, customUserId } = directScopePayload()
    directPath += `?${new URLSearchParams({ project_id: String(projectId), custom_user_id: customUserId }).toString()}`
  }
  const envelope = await requestJson<FeedbackV2OSSCredentials>('/oss/credentials', directPath, { method: 'GET' })
  if (!envelope.data?.access_key_id || !envelope.data.bucket_name) {
    throw new Error('附件访问凭证返回不完整')
  }
  return envelope.data
}

export async function getFeedbackAttachmentOSSCredentialsV2(params: {
  feedbackId: number
  attachmentId: number
}): Promise<FeedbackV2OSSCredentials> {
  if (!Number.isFinite(params.feedbackId) || params.feedbackId <= 0 || !Number.isFinite(params.attachmentId) || params.attachmentId <= 0) {
    throw new Error('附件标识无效，无法申请临时访问权限')
  }
  const authMode = currentV2AuthMode()
  const sessionPath = `/feedbacks/${Math.floor(params.feedbackId)}/attachments/${Math.floor(params.attachmentId)}/oss/credentials`
  let directPath = sessionPath
  if (authMode === 'apiKey') {
    directPath += `?${new URLSearchParams({ custom_user_id: directScopePayload().customUserId }).toString()}`
  }
  const envelope = await requestJson<FeedbackV2OSSCredentials>(sessionPath, directPath, { method: 'GET' })
  if (!envelope.data?.access_key_id || !envelope.data.bucket_name) {
    throw new Error('附件访问凭证返回不完整')
  }
  return envelope.data
}

export async function fetchFeedbackNotificationsV2(params?: {
  feedbackId?: number
  unreadOnly?: boolean
  page?: number
  pageSize?: number
}): Promise<{ notifications: FeedbackV2Notification[]; unreadCount: number }> {
  const authMode = currentV2AuthMode()
  const sessionQuery = new URLSearchParams({
    page: String(params?.page || 1),
    page_size: String(params?.pageSize || 100),
  })
  if (params?.feedbackId) sessionQuery.set('feedback_id', String(params.feedbackId))
  if (params?.unreadOnly) sessionQuery.set('unread_only', 'true')

  const directQuery = new URLSearchParams(sessionQuery)
  if (authMode === 'apiKey') {
    const { projectId, customUserId } = directScopePayload()
    directQuery.set('project_id', String(projectId))
    directQuery.set('custom_user_id', customUserId)
  }

  const envelope = await requestJson<FeedbackV2NotificationListResponse>(
    `/notifications?${sessionQuery.toString()}`,
    `/feedback-notifications?${directQuery.toString()}`,
    { method: 'GET' },
  )
  return {
    notifications: Array.isArray(envelope.data?.notifications) ? envelope.data.notifications : [],
    unreadCount: typeof envelope.data?.unread_count === 'number' ? envelope.data.unread_count : 0,
  }
}

export async function markFeedbackNotificationsReadV2(params: {
  feedbackId?: number
  notificationIds?: number[]
}): Promise<{ markedCount: number }> {
  const authMode = currentV2AuthMode()
  const payload: Record<string, unknown> = {
    ...(params.feedbackId ? { feedback_id: params.feedbackId } : {}),
    ...(params.notificationIds?.length ? { notification_ids: params.notificationIds } : {}),
  }
  if (authMode === 'apiKey') {
    const { projectId, customUserId } = directScopePayload()
    payload.project_id = projectId
    payload.custom_user_id = customUserId
  }
  const envelope = await requestJson<{ marked_count?: number }>(
    '/notifications/read',
    '/feedback-notifications/read',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )
  return { markedCount: typeof envelope.data?.marked_count === 'number' ? envelope.data.marked_count : 0 }
}
