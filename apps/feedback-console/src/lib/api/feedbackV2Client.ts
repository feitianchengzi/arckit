import { apiClient } from './client'
import { handleResponse } from './interceptors/response'
import type {
  CreateFeedbackInput,
  Feedback,
  FeedbackListOptions,
  FeedbackListResult,
  UpdateFeedbackInput,
} from './endpoints/feedbacks'
import type { STSCredentials } from './endpoints/upload'
import type { ApiMeta } from '@/types/api'

const DEFAULT_WORKSHOP_V2_BASE_URL = 'https://api.feitianchengzi.com/workshop/v2'

function resolveWorkshopV2BaseUrl(): string {
  const configured = import.meta.env.VITE_WORKSHOP_V2_API_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')

  const v1Base = import.meta.env.VITE_API_URL?.trim()
  if (v1Base) return v1Base.replace(/\/v1\/?$/, '/v2').replace(/\/$/, '')
  return DEFAULT_WORKSHOP_V2_BASE_URL
}

function parseProjectIds(raw?: string): Set<number> {
  return new Set(
    (raw || '')
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isInteger(item) && item > 0)
  )
}

function isAllProjectsEnabled(raw?: string): boolean {
  return raw?.trim() === '*'
}

const feedbackV2ProjectIdsRaw = import.meta.env.VITE_FEEDBACK_V2_PROJECT_IDS
const feedbackV2NotificationProjectIdsRaw = import.meta.env.VITE_FEEDBACK_V2_NOTIFICATION_PROJECT_IDS
const feedbackV2ProjectIds = parseProjectIds(feedbackV2ProjectIdsRaw)
const feedbackV2NotificationProjectIds = parseProjectIds(feedbackV2NotificationProjectIdsRaw)
const allFeedbackV2ProjectsEnabled = isAllProjectsEnabled(feedbackV2ProjectIdsRaw)
const allFeedbackV2NotificationProjectsEnabled = isAllProjectsEnabled(feedbackV2NotificationProjectIdsRaw)

export function isFeedbackV2ProjectEnabled(projectId: string | number): boolean {
  return allFeedbackV2ProjectsEnabled || feedbackV2ProjectIds.has(Number(projectId))
}

// Notification rollout is independent from the existing V2 workflow flag.
// Existing V2 Console projects keep their exact current API request pattern.
export function isFeedbackV2NotificationsProjectEnabled(projectId: string | number): boolean {
  return allFeedbackV2NotificationProjectsEnabled || feedbackV2NotificationProjectIds.has(Number(projectId))
}

async function listByProject(projectId: string | number, options?: FeedbackListOptions): Promise<FeedbackListResult> {
  const params: Record<string, unknown> = { project_id: projectId }
  if (options?.shortId) params.short_id = options.shortId
  if (options?.userPhone) params.user_phone = options.userPhone
  if (options?.userEmail) params.user_email = options.userEmail
  if (options?.customUserId) params.custom_user_id = options.customUserId
  if (options?.includeDeleted !== undefined) params.include_deleted = options.includeDeleted
  if (options?.page) params.page = options.page
  if (options?.pageSize) params.page_size = options.pageSize

  const response = await apiClient.get(`${resolveWorkshopV2BaseUrl()}/user/feedbacks`, { params })
  const data = handleResponse<Feedback[]>(response)
  const feedbacks = Array.isArray(data) ? data : []
  const meta = (response.data?.meta || {
    page: options?.page || 1,
    page_size: options?.pageSize || feedbacks.length,
    total: feedbacks.length,
  }) as ApiMeta

  return { feedbacks, meta, total: typeof meta.total === 'number' ? meta.total : feedbacks.length }
}

async function create(input: CreateFeedbackInput): Promise<Feedback> {
  const response = await apiClient.post(`${resolveWorkshopV2BaseUrl()}/user/feedbacks`, {
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
  return handleResponse<Feedback>(response)
}

async function update(id: number, input: UpdateFeedbackInput): Promise<Feedback> {
  const response = await apiClient.put(`${resolveWorkshopV2BaseUrl()}/user/feedbacks/${id}`, {
    short_id: input.shortId,
    title: input.title,
    content: input.content,
    custom_user_id: input.customUserId,
    user_phone: input.userPhone,
    user_email: input.userEmail,
    file: input.file,
    data: input.data,
  })
  return handleResponse<Feedback>(response)
}

export interface DeleteFeedbackResult {
  feedback_id: number
  deleted_at: string
}

async function remove(id: number): Promise<DeleteFeedbackResult> {
  const response = await apiClient.delete(`${resolveWorkshopV2BaseUrl()}/user/feedbacks/${id}`)
  return handleResponse<DeleteFeedbackResult>(response)
}

export interface FeedbackSessionToken {
  token: string
  token_type: 'Bearer'
  project_id: number
  custom_user_id: string
  expires_at: string
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

export interface FeedbackUploadPolicy {
  object_key: string
  upload_url: string
  fields: Record<string, string>
  expires_at: string
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

interface FeedbackV2OSSCredentials {
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

export interface ConvertFeedbackToTaskResult {
  feedback: Feedback
  task: {
    id: number
    project_id: number
    father_id?: number
    content: string
    state: string
    creator_id: number
    executor_id?: number
    priority?: number
    tags?: string
  }
  link: {
    id: number
    feedback_id: number
    project_id: number
    task_id: number
    relation_type: string
    is_primary: boolean
  }
}

function toSTSCredentials(credentials: FeedbackV2OSSCredentials): STSCredentials {
  return {
    AccessKeyId: credentials.access_key_id,
    AccessKeySecret: credentials.access_key_secret,
    SecurityToken: credentials.security_token,
    Expiration: credentials.expiration,
    BucketName: credentials.bucket_name,
    Region: credentials.region,
    RootPath: credentials.root_path,
    AuthorizationV4: credentials.authorization_v4,
    Secure: credentials.secure,
  }
}

async function createSession(projectId: number, customUserId: string): Promise<FeedbackSessionToken> {
  const response = await apiClient.post(`${resolveWorkshopV2BaseUrl()}/user/feedback-sessions`, {
    project_id: projectId,
    custom_user_id: customUserId,
  })
  const session = handleResponse<FeedbackSessionToken>(response)
  if (!session?.token || !session.expires_at) {
    throw new Error('反馈会话创建成功，但 token 返回不完整')
  }
  return session
}

async function getMessages(feedbackId: number): Promise<FeedbackV2Message[]> {
  const response = await apiClient.get(`${resolveWorkshopV2BaseUrl()}/user/feedbacks/${feedbackId}/messages`, {
    params: { page: 1, page_size: 100 },
  })
  const messages = handleResponse<FeedbackV2Message[]>(response)
  return Array.isArray(messages) ? messages : []
}

async function getNotifications(params: {
  projectId: number
  feedbackId?: number
  unreadOnly?: boolean
  page?: number
  pageSize?: number
}): Promise<{ notifications: FeedbackV2Notification[]; unreadCount: number }> {
  const response = await apiClient.get(`${resolveWorkshopV2BaseUrl()}/user/feedback-notifications`, {
    params: {
      project_id: params.projectId,
      feedback_id: params.feedbackId,
      unread_only: params.unreadOnly,
      page: params.page || 1,
      page_size: params.pageSize || 100,
    },
  })
  const result = handleResponse<FeedbackV2NotificationListResponse>(response)
  return {
    notifications: Array.isArray(result?.notifications) ? result.notifications : [],
    unreadCount: typeof result?.unread_count === 'number' ? result.unread_count : 0,
  }
}

async function markNotificationsRead(params: { projectId: number; feedbackId?: number; notificationIds?: number[] }): Promise<{ markedCount: number }> {
  const response = await apiClient.post(`${resolveWorkshopV2BaseUrl()}/user/feedback-notifications/read`, {
    project_id: params.projectId,
    feedback_id: params.feedbackId,
    notification_ids: params.notificationIds,
  })
  const result = handleResponse<{ marked_count?: number }>(response)
  return { markedCount: typeof result?.marked_count === 'number' ? result.marked_count : 0 }
}

async function createDeveloperMessage(params: {
  feedbackId: number
  content?: string
  metadata?: Record<string, unknown>
  attachments?: FeedbackV2Attachment[]
}): Promise<FeedbackV2Message> {
  const response = await apiClient.post(`${resolveWorkshopV2BaseUrl()}/user/feedbacks/${params.feedbackId}/messages`, {
    content: params.content?.trim() || '',
    metadata: params.metadata,
    attachments: params.attachments || [],
  })
  return handleResponse<FeedbackV2Message>(response)
}

async function createDeveloperUploadPolicy(params: {
  feedbackId: number
  type: 'image' | 'file'
  fileName: string
  mimeType: string
  size: number
}): Promise<FeedbackUploadPolicy> {
  const response = await apiClient.post(
    `${resolveWorkshopV2BaseUrl()}/user/feedbacks/${params.feedbackId}/upload-policies`,
    {
      type: params.type,
      file_name: params.fileName,
      mime_type: params.mimeType,
      size: params.size,
    },
  )
  const policy = handleResponse<FeedbackUploadPolicy>(response)
  if (!policy?.object_key || !policy.upload_url || !policy.fields) {
    throw new Error('上传策略返回不完整')
  }
  return policy
}

async function uploadWithPolicy(file: File, policy: FeedbackUploadPolicy): Promise<void> {
  const form = new FormData()
  Object.entries(policy.fields).forEach(([key, value]) => form.append(key, value))
  // OSS PostObject requires the file field to be the final form field.
  form.append('file', file, file.name)

  let response: Response
  try {
    response = await fetch(policy.upload_url, { method: 'POST', body: form })
  } catch {
    throw new Error('附件上传请求失败，请检查 OSS Bucket 是否允许当前控制台域名使用 POST 上传')
  }
  if (response.status !== 201) {
    throw new Error(`附件上传失败（OSS 返回 ${response.status}）`)
  }
}

async function getAttachmentCredentials(feedbackId: number, attachmentId: number): Promise<STSCredentials> {
  const response = await apiClient.get(
    `${resolveWorkshopV2BaseUrl()}/user/feedbacks/${feedbackId}/attachments/${attachmentId}/oss/credentials`,
  )
  return toSTSCredentials(handleResponse<FeedbackV2OSSCredentials>(response))
}

async function convertToTask(params: {
  feedbackId: number
  content?: string
  state?: string
  executorId?: number
  fatherId?: number
  priority?: number
  tags?: string
}): Promise<ConvertFeedbackToTaskResult> {
  const response = await apiClient.post(
    `${resolveWorkshopV2BaseUrl()}/user/feedbacks/${params.feedbackId}/convert-to-task`,
    {
      content: params.content,
      state: params.state,
      executor_id: params.executorId,
      father_id: params.fatherId,
      priority: params.priority,
      tags: params.tags,
    },
  )
	return handleResponse<ConvertFeedbackToTaskResult>(response)
}

async function ignoreFeedback(feedbackId: number): Promise<Feedback> {
	const response = await apiClient.post(`${resolveWorkshopV2BaseUrl()}/user/feedbacks/${feedbackId}/ignore`)
	return handleResponse<Feedback>(response)
}

async function getTaskAttachmentCredentials(taskAttachmentId: number, objectKey: string): Promise<STSCredentials> {
  const response = await apiClient.get(
    `${resolveWorkshopV2BaseUrl()}/user/tasks/attachments/${taskAttachmentId}/oss/credentials`,
    { params: { object_key: objectKey } },
  )
  return toSTSCredentials(handleResponse<FeedbackV2OSSCredentials>(response))
}

export const feedbackV2Client = {
  listByProject,
  create,
  update,
  remove,
  createSession,
  getMessages,
  getNotifications,
  markNotificationsRead,
  createDeveloperMessage,
  createDeveloperUploadPolicy,
  uploadWithPolicy,
	getAttachmentCredentials,
	convertToTask,
	ignoreFeedback,
	getTaskAttachmentCredentials,
}
