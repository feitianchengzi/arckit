import type { FeedbackItem, FeedbackStatus, TimelineNode } from '@/lib/feedback/types'
import { getFeedbackSDKConfig, setFeedbackSDKApiKey, setFeedbackSDKCustomUserId, setFeedbackSDKProjectId } from '@/lib/sdk'

function getGatewayBaseUrl(): string {
  const cfg = getFeedbackSDKConfig()
  if (cfg.gatewayUrl?.trim()) return cfg.gatewayUrl.trim()
  if (import.meta.env.DEV) return '/gateway'
  return import.meta.env.VITE_GATEWAY_URL || 'https://api.feitianchengzi.com'
}

const FEEDBACK_API_KEY_STORAGE = 'sdk_feedback_api_key'
const FEEDBACK_PROJECT_ID_STORAGE = 'sdk_feedback_project_id'
const FEEDBACK_CUSTOM_USER_ID_STORAGE = 'sdk_feedback_custom_user_id'

interface ApiEnvelope<T> {
  code?: string
  message?: string
  data?: T
  error?: {
    message?: string
  }
  meta?: {
    page?: number
    page_size?: number
    total?: number
  }
}

interface ProjectRecord {
  id: number
  name?: string
}

export interface FeedbackRecord {
  id: number
  project_id: number
  short_id: string
  title: string
  content: string
	status?: string
	triage_status?: 'pending' | 'accepted' | 'ignored'
	customer_status?: FeedbackStatus
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

interface FeedbackDataPayload {
  feedback_state?: string
  status?: string
  state?: string
  eta_text?: string
  converted_task_id?: number
  converted_at?: string
  reviewed_at?: string
  [key: string]: unknown
}

function trimValue(input?: string | null): string {
  return (input || '').trim()
}

function toPositiveInt(value: string): number | null {
  if (!value) return null
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.floor(n)
}

function getLocalStorage(key: string): string {
  if (typeof window === 'undefined') return ''
  return trimValue(localStorage.getItem(key))
}

function setLocalStorage(key: string, value: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, value)
}

function parseDataPayload(data?: string): FeedbackDataPayload | null {
  if (!data) return null
  try {
    const parsed = JSON.parse(data)
    if (parsed && typeof parsed === 'object') {
      return parsed as FeedbackDataPayload
    }
  } catch {
    return null
  }
  return null
}

function formatDateTime(isoText: string): string {
  const date = new Date(isoText)
  if (Number.isNaN(date.getTime())) return isoText
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildTimeline(status: FeedbackStatus, feedback: FeedbackRecord, useCustomerWorkflow = false): TimelineNode[] {
  const payload = parseDataPayload(feedback.data)
  const createdAt = formatDateTime(feedback.created_at)
  const updatedAt = formatDateTime(feedback.updated_at)

  const nodes: TimelineNode[] = [
    {
      status: 'submitted',
      title: '已提交',
      at: createdAt,
      note: '反馈已提交，等待处理。',
    },
  ]

	if (useCustomerWorkflow) {
		if (status === 'submitted') return nodes
		if (status === 'ignored') {
			nodes.push({
				status: 'ignored',
				title: '暂不处理',
				at: updatedAt,
				note: '该反馈当前暂不继续推进。',
			})
			return nodes
		}
		if (status === 'reviewing') {
			nodes.push({
				status: 'reviewing',
				title: '已受理',
				at: updatedAt,
				note: feedback.task_id ? `已进入待办 #${feedback.task_id}。` : '反馈已受理，等待后续处理。',
			})
			return nodes
		}
		if (status === 'developing') {
			nodes.push({
				status: 'developing',
				title: '开发中',
				at: updatedAt,
				note: feedback.task_id ? `关联待办 #${feedback.task_id} 正在处理中。` : '相关处理正在进行。',
			})
			return nodes
		}
		if (status === 'completed') {
			nodes.push({
				status: 'completed',
				title: '已完成',
				at: updatedAt,
				note: '相关处理已完成。',
			})
			return nodes
		}
		if (status === 'released') {
			nodes.push({
				status: 'released',
				title: '已上线',
				at: updatedAt,
				note: '相关处理已上线。',
			})
			return nodes
		}
		return nodes
	}

  if (status === 'submitted') {
    return nodes
  }

  if (status === 'analyzing') {
    nodes.push({
      status: 'analyzing',
      title: 'AI 分析中',
      at: updatedAt,
      note: '系统正在解析你的反馈内容。',
    })
    return nodes
  }

  if (status === 'reviewing') {
    nodes.push({
      status: 'analyzing',
      title: 'AI 分析完成',
      at: updatedAt,
      note: '已完成初步分析，进入开发评估。',
    })
    nodes.push({
      status: 'reviewing',
      title: '开发评估中',
      at: payload?.reviewed_at ? formatDateTime(String(payload.reviewed_at)) : updatedAt,
      note: '产品与开发正在评估优先级和排期。',
    })
    return nodes
  }

  if (status === 'developing') {
    nodes.push({
      status: 'analyzing',
      title: 'AI 分析完成',
      at: updatedAt,
      note: '反馈已被确认，并流转到开发队列。',
    })
    nodes.push({
      status: 'reviewing',
      title: '开发评估完成',
      at: updatedAt,
      note: '方案确认完毕，进入实施阶段。',
    })
    nodes.push({
      status: 'developing',
      title: '开发中',
      at: payload?.converted_at ? formatDateTime(String(payload.converted_at)) : updatedAt,
      note: payload?.converted_task_id
        ? `已流转为待办 #${payload.converted_task_id}，正在开发。`
        : '需求已进入开发阶段。',
    })
    return nodes
  }

  if (status === 'completed' || status === 'ignored') {
    const isIgnored = status === 'ignored'
    nodes.push({
      status: 'analyzing',
      title: 'AI 分析完成',
      at: updatedAt,
      note: '系统已完成反馈分类。',
    })
    nodes.push({
      status: 'reviewing',
      title: isIgnored ? '评估结束' : '处理完成',
      at: payload?.reviewed_at ? formatDateTime(String(payload.reviewed_at)) : updatedAt,
      note: isIgnored ? '该反馈已完成评估，暂不继续推进。' : '该反馈已完成处理。',
    })
    nodes.push({
      status,
      title: isIgnored ? '已忽略' : '已完成',
      at: updatedAt,
      note: isIgnored ? '本条反馈当前不再继续推进。' : '感谢反馈，相关处理已完成。',
    })
    return nodes
  }

  if (status === 'released') {
    nodes.push({
      status: 'analyzing',
      title: 'AI 分析完成',
      at: updatedAt,
      note: '系统已完成反馈分类。',
    })
    nodes.push({
      status: 'reviewing',
      title: '上线确认',
      at: updatedAt,
      note: '该反馈已完成处理并进入上线确认。',
    })
    nodes.push({
      status: 'released',
      title: '已上线',
      at: updatedAt,
      note: '感谢反馈，相关处理已上线。',
    })
    return nodes
  }

  return nodes
}

function pickStatus(feedback: FeedbackRecord, useCustomerWorkflow = false): FeedbackStatus {
	if (useCustomerWorkflow) {
		const customerStatus = String(feedback.customer_status || '').toLowerCase()
		if (customerStatus === 'submitted' || customerStatus === 'reviewing' || customerStatus === 'developing' || customerStatus === 'released' || customerStatus === 'completed' || customerStatus === 'ignored') {
			return customerStatus as FeedbackStatus
		}
	}
	const payload = parseDataPayload(feedback.data)
  const feedbackState = String(payload?.feedback_state || payload?.state || '').toLowerCase()
  const sdkStatus = String(payload?.status || '').toLowerCase()
  const raw = feedbackState || sdkStatus

  if (raw === 'submitted' || raw === 'analyzing' || raw === 'reviewing' || raw === 'developing' || raw === 'released' || raw === 'completed' || raw === 'ignored') {
    return raw as FeedbackStatus
  }

  if (raw === 'in_progress' || raw === 'processing' || raw === 'inprogress' || raw === 'converted' || typeof payload?.converted_task_id === 'number') {
    return 'developing'
  }
  if (raw === 'accepted') {
    return 'reviewing'
  }
  if (raw === 'done' || raw === 'finished') {
    return 'completed'
  }
  if (raw === 'rejected') {
    return 'ignored'
  }
  if (raw === 'pending') {
    return 'analyzing'
  }
  return 'submitted'
}

function pickEtaText(feedback: FeedbackRecord, status: FeedbackStatus, useCustomerWorkflow = false): string {
	if (useCustomerWorkflow) {
		switch (status) {
			case 'submitted':
				return '已提交，等待处理'
			case 'reviewing':
				return '已受理，等待后续处理'
			case 'developing':
				return '开发中'
			case 'completed':
				return '相关处理已完成'
			case 'released':
				return '相关处理已上线'
			case 'ignored':
				return '当前反馈暂不处理'
			default:
				return '处理中'
		}
	}
	const payload = parseDataPayload(feedback.data)
  if (typeof payload?.eta_text === 'string' && payload.eta_text.trim()) {
    return payload.eta_text.trim()
  }

  const raw = String(payload?.feedback_state || '').toLowerCase()
  if (raw === 'accepted') return '开发评估中'
  if (raw === 'in_progress') return '开发中'
  if (raw === 'completed') return '已完成处理'
  if (raw === 'ignored') return '当前反馈已忽略'
  if (raw === 'converted') return '已流转至开发待办'

  switch (status) {
    case 'submitted':
      return '已提交，等待处理'
    case 'analyzing':
      return 'AI 分析中'
    case 'reviewing':
      return '开发评估中'
    case 'developing':
      return '开发中'
    case 'released':
      return '已上线'
    case 'completed':
      return '已完成处理'
    case 'ignored':
      return '当前反馈已忽略'
    default:
      return '处理中'
  }
}

export function feedbackToItem(feedback: FeedbackRecord, options?: { useCustomerWorkflow?: boolean }): FeedbackItem {
	const useCustomerWorkflow = options?.useCustomerWorkflow === true
	const status = pickStatus(feedback, useCustomerWorkflow)
	return {
    id: String(feedback.id),
    title: feedback.title || `反馈 #${feedback.short_id}`,
    summary: feedback.content || '暂无反馈描述',
    createdAt: formatDateTime(feedback.created_at),
		etaText: pickEtaText(feedback, status, useCustomerWorkflow),
		status,
		timeline: buildTimeline(status, feedback, useCustomerWorkflow),
  }
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const response = await fetch(input, init)
  const json = (await response.json().catch(() => ({}))) as ApiEnvelope<T>

  if (!response.ok) {
    const message = json.error?.message || json.message || `Request failed: ${response.status}`
    throw new Error(message)
  }

  if (json.code && json.code !== 'OK') {
    throw new Error(json.error?.message || json.message || `API error: ${json.code}`)
  }

  return json
}

export function getOrPersistApiKey(_searchParams?: URLSearchParams): string {
  const sdkConfigApiKey = trimValue(getFeedbackSDKConfig().apiKey)
  if (sdkConfigApiKey) {
    setFeedbackSDKApiKey(sdkConfigApiKey)
    setLocalStorage(FEEDBACK_API_KEY_STORAGE, sdkConfigApiKey)
    return sdkConfigApiKey
  }

  const storedFeedbackKey = getLocalStorage(FEEDBACK_API_KEY_STORAGE)
  if (storedFeedbackKey) return storedFeedbackKey

  const envKey = trimValue(import.meta.env.VITE_SDK_FEEDBACK_API_KEY || '')
  if (envKey) return envKey

  return ''
}

export function saveApiKeyToStorage(apiKey: string) {
  const trimmed = trimValue(apiKey)
  if (!trimmed) return
  setFeedbackSDKApiKey(trimmed)
  setLocalStorage(FEEDBACK_API_KEY_STORAGE, trimmed)
}

export function getOrPersistCustomUserId(_searchParams?: URLSearchParams): string {
  const sdkCustomUserId = trimValue(getFeedbackSDKConfig().customUserId)
  if (sdkCustomUserId) {
    setFeedbackSDKCustomUserId(sdkCustomUserId)
    setLocalStorage(FEEDBACK_CUSTOM_USER_ID_STORAGE, sdkCustomUserId)
    return sdkCustomUserId
  }

  const stored = getLocalStorage(FEEDBACK_CUSTOM_USER_ID_STORAGE)
  if (stored) {
    setFeedbackSDKCustomUserId(stored)
    return stored
  }

  const generated = `sdk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
  setFeedbackSDKCustomUserId(generated)
  setLocalStorage(FEEDBACK_CUSTOM_USER_ID_STORAGE, generated)
  return generated
}

async function listProjectsByApiKey(apiKey: string): Promise<ProjectRecord[]> {
  const envelope = await requestJson<any>(`${getGatewayBaseUrl()}/workshop/v1/apikey/projects`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  const data = envelope.data
  if (Array.isArray(data)) return data as ProjectRecord[]
  if (data && typeof data === 'object' && Array.isArray((data as any).projects)) {
    return (data as any).projects as ProjectRecord[]
  }
  return []
}

export async function resolveProjectId(_searchParams: URLSearchParams | undefined, apiKey: string): Promise<number> {
  const sdkProjectId = toPositiveInt(String(getFeedbackSDKConfig().projectId || ''))
  if (sdkProjectId) {
    setFeedbackSDKProjectId(sdkProjectId)
    setLocalStorage(FEEDBACK_PROJECT_ID_STORAGE, String(sdkProjectId))
    return sdkProjectId
  }

  const storedProjectId = toPositiveInt(getLocalStorage(FEEDBACK_PROJECT_ID_STORAGE))
  if (storedProjectId) {
    setFeedbackSDKProjectId(storedProjectId)
    return storedProjectId
  }

  const envProjectId = toPositiveInt(trimValue(import.meta.env.VITE_SDK_FEEDBACK_PROJECT_ID || ''))
  if (envProjectId) {
    setFeedbackSDKProjectId(envProjectId)
    return envProjectId
  }

  const projects = await listProjectsByApiKey(apiKey)
  const firstProject = projects[0]
  if (!firstProject?.id) {
    throw new Error('未找到可用项目，请先在工作台创建项目，或通过 SDK configure 注入 projectId')
  }

  setFeedbackSDKProjectId(firstProject.id)
  setLocalStorage(FEEDBACK_PROJECT_ID_STORAGE, String(firstProject.id))
  return firstProject.id
}

function buildSubmitTitle(content: string): string {
  const normalized = content.trim().replace(/\s+/g, ' ')
  if (!normalized) return '用户反馈'
  return normalized.length > 24 ? `${normalized.slice(0, 24)}...` : normalized
}

export async function submitFeedbackByApiKey(params: {
  apiKey: string
  projectId: number
  customUserId: string
  content: string
  imageName?: string
  fileKey?: string
}): Promise<{ id: number; shortId: string }> {
  const content = params.content.trim()
  if (!content) {
    throw new Error('反馈内容不能为空')
  }

  const payload: Record<string, unknown> = {
    source: 'feedback-sdk-web',
    channel: 'webview',
    feedback_state: 'pending',
  }
  if (params.imageName?.trim()) {
    payload.attachment_name = params.imageName.trim()
  }

  const envelope = await requestJson<FeedbackRecord>(`${getGatewayBaseUrl()}/workshop/v1/apikey/feedbacks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      project_id: params.projectId,
      title: buildSubmitTitle(content),
      content,
      custom_user_id: params.customUserId,
      file: params.fileKey?.trim() || undefined,
      data: JSON.stringify(payload),
    }),
  })

  const feedback = envelope.data
  if (!feedback?.id || !feedback.short_id) {
    throw new Error('反馈提交成功，但返回数据不完整')
  }

  return {
    id: feedback.id,
    shortId: feedback.short_id,
  }
}

export async function fetchFeedbackItemsByApiKey(params: {
  apiKey: string
  projectId?: number
  customUserId?: string
  userEmail?: string
  userPhone?: string
  page?: number
  pageSize?: number
}): Promise<{ items: FeedbackItem[]; total: number }> {
  const query = new URLSearchParams()
  if (params.projectId) query.set('project_id', String(params.projectId))
  if (params.customUserId) query.set('custom_user_id', params.customUserId)
  if (params.userEmail) query.set('user_email', params.userEmail)
  if (params.userPhone) query.set('user_phone', params.userPhone)
  query.set('page', String(params.page || 1))
  query.set('page_size', String(params.pageSize || 50))

  const envelope = await requestJson<FeedbackRecord[]>(
    `${getGatewayBaseUrl()}/workshop/v1/apikey/feedbacks?${query.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
      },
    },
  )

  const list = Array.isArray(envelope.data) ? envelope.data : []
	const items = list.map((feedback) => feedbackToItem(feedback))
  const total = typeof envelope.meta?.total === 'number' ? envelope.meta.total : items.length

  return { items, total }
}
