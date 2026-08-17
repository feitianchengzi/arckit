import { getAccessToken } from '@/lib/utils/tokenManager'
import {
  feedbackV2Client,
  isFeedbackV2NotificationsProjectEnabled,
  isFeedbackV2ProjectEnabled,
  type FeedbackSessionToken,
} from '@/lib/api/feedbackV2Client'

const DEFAULT_FEEDBACK_FRAME_URL = 'https://workshop.feitianchengzi.com/sdk/index.html?embed=web'
const FEEDBACK_FRAME_URL = import.meta.env.VITE_FEEDBACK_SDK_URL?.trim() || DEFAULT_FEEDBACK_FRAME_URL
const FEEDBACK_FRAME_ORIGIN = new URL(FEEDBACK_FRAME_URL).origin
const FEEDBACK_GATEWAY_URL = 'https://api.feitianchengzi.com'
const FEEDBACK_GUEST_ID_STORAGE = 'feedback_console_guest_user_id'
export const FEEDBACK_SDK_UNREAD_CHANGED_EVENT = 'feedback-sdk:unread-changed'

export type FeedbackTheme = 'light' | 'dark'
type FeedbackPanel = 'submit' | 'status'

interface FeedbackFrameElements {
  overlay: HTMLDivElement
  iframe: HTMLIFrameElement
}

interface JwtPayload {
  user_id?: unknown
  sub?: unknown
}

interface FeedbackSdkMessage {
  source?: unknown
  type?: unknown
  unread_count?: unknown
}

let cachedFeedbackSession: FeedbackSessionToken | null = null
let pendingFeedbackSession: {
  projectId: number
  customUserId: string
  promise: Promise<FeedbackSessionToken>
} | null = null

let frameElements: FeedbackFrameElements | null = null
let feedbackSdkReady = false
let feedbackSdkReadyPromise: Promise<void> | null = null
let resolveFeedbackSdkReady: (() => void) | null = null
let previousBodyOverflow: string | null = null
let currentTheme: FeedbackTheme = 'light'

function normalizeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = (4 - (base64.length % 4)) % 4
  return base64.padEnd(base64.length + padding, '=')
}

function decodeUtf8Base64(value: string) {
  return decodeURIComponent(
    Array.from(atob(value), (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
  )
}

function readUserId(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

function getCustomUserId() {
  const payload = getAccessToken()?.split('.')[1]
  if (payload) {
    try {
      const parsed = JSON.parse(decodeUtf8Base64(normalizeBase64Url(payload))) as JwtPayload
      const userId = readUserId(parsed.user_id) ?? readUserId(parsed.sub)
      if (userId) return `console_${userId}`
    } catch {
      // Use the persisted guest identifier if an invalid token is present.
    }
  }

  const existingGuestId = localStorage.getItem(FEEDBACK_GUEST_ID_STORAGE)
  if (existingGuestId) return existingGuestId

  const guestId = `console_guest_${crypto.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`}`
  localStorage.setItem(FEEDBACK_GUEST_ID_STORAGE, guestId)
  return guestId
}

function getProjectId(): number | undefined {
  const projectId = Number(import.meta.env.VITE_FEEDBACK_SDK_PROJECT_ID || '')
  return Number.isFinite(projectId) && projectId > 0 ? Math.floor(projectId) : undefined
}

function hasUsableFeedbackSession(projectId: number, customUserId: string) {
  const expiresAt = cachedFeedbackSession ? Date.parse(cachedFeedbackSession.expires_at) : 0
  return Boolean(
    cachedFeedbackSession &&
      cachedFeedbackSession.project_id === projectId &&
      cachedFeedbackSession.custom_user_id === customUserId &&
      Number.isFinite(expiresAt) &&
      expiresAt - Date.now() >= 60_000
  )
}

async function getFeedbackSession(projectId: number, customUserId: string) {
  if (hasUsableFeedbackSession(projectId, customUserId)) return cachedFeedbackSession as FeedbackSessionToken

  if (
    pendingFeedbackSession &&
    pendingFeedbackSession.projectId === projectId &&
    pendingFeedbackSession.customUserId === customUserId
  ) {
    return pendingFeedbackSession.promise
  }

  const pending = {
    projectId,
    customUserId,
    promise: feedbackV2Client.createSession(projectId, customUserId),
  }
  pendingFeedbackSession = pending

  try {
    const session = await pending.promise
    cachedFeedbackSession = session
    return session
  } finally {
    if (pendingFeedbackSession === pending) pendingFeedbackSession = null
  }
}

function applyStyles(element: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
  Object.assign(element.style, styles)
}

async function getConfigurationMessage() {
  const apiKey = import.meta.env.VITE_FEEDBACK_SDK_API_KEY?.trim()
  const projectId = getProjectId()
  if (!projectId) {
    throw new Error('反馈 SDK 缺少项目 ID 配置')
  }
  const customUserId = getCustomUserId()

  if (isFeedbackV2ProjectEnabled(projectId)) {
    const feedbackSession = await getFeedbackSession(projectId, customUserId)

    return {
      source: 'feedback-console-web',
      type: 'feedback-sdk:configure',
      config: {
        projectId,
        customUserId,
        gatewayUrl: FEEDBACK_GATEWAY_URL,
        feedbackV2Enabled: true,
        feedbackV2NotificationsEnabled: isFeedbackV2NotificationsProjectEnabled(projectId),
        feedbackV2AuthMode: 'session',
        feedbackSessionToken: feedbackSession.token,
        theme: currentTheme,
      },
    }
  }

  if (!apiKey) {
    throw new Error('反馈 SDK 缺少 API Key 配置')
  }

  return {
    source: 'feedback-console-web',
    type: 'feedback-sdk:configure',
    config: {
      apiKey,
      projectId,
      customUserId,
      gatewayUrl: FEEDBACK_GATEWAY_URL,
      theme: currentTheme,
    },
  }
}

export async function getFeedbackSdkUnreadCount(): Promise<number> {
  const projectId = getProjectId()
  if (!projectId || !isFeedbackV2ProjectEnabled(projectId) || !isFeedbackV2NotificationsProjectEnabled(projectId)) {
    return 0
  }

  const feedbackSession = await getFeedbackSession(projectId, getCustomUserId())
  const response = await fetch(
    `${FEEDBACK_GATEWAY_URL}/workshop/v2/feedback/notifications?unread_only=true&page=1&page_size=1`,
    { headers: { Authorization: `Bearer ${feedbackSession.token}` } },
  )
  const payload = await response.json().catch(() => ({})) as { data?: { unread_count?: unknown } }
  if (!response.ok) {
    throw new Error('反馈未读状态加载失败')
  }
  const unreadCount = Number(payload.data?.unread_count)
  return Number.isFinite(unreadCount) ? Math.max(0, Math.floor(unreadCount)) : 0
}

async function postConfiguration() {
  const message = await getConfigurationMessage()
  frameElements?.iframe.contentWindow?.postMessage(message, FEEDBACK_FRAME_ORIGIN)
}

function postOpenCommand(mode: FeedbackPanel) {
  frameElements?.iframe.contentWindow?.postMessage(
    { source: 'feedback-console-web', type: 'feedback-sdk:open', mode },
    FEEDBACK_FRAME_ORIGIN
  )
}

function hideFeedbackFrame() {
  if (!frameElements) return

  frameElements.overlay.hidden = true
  frameElements.overlay.style.opacity = '0'
  frameElements.overlay.style.pointerEvents = 'none'

  if (previousBodyOverflow !== null) {
    document.body.style.overflow = previousBodyOverflow
    previousBodyOverflow = null
  }
}

function showFeedbackFrame() {
  if (!frameElements) frameElements = createFeedbackFrame()
  if (!frameElements) return

  if (previousBodyOverflow === null) previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  frameElements.overlay.hidden = false
  window.requestAnimationFrame(() => {
    if (!frameElements) return
    frameElements.overlay.style.opacity = '1'
    frameElements.overlay.style.pointerEvents = 'auto'
  })
}

function createFeedbackFrame(): FeedbackFrameElements {
  const overlay = document.createElement('div')
  const iframe = document.createElement('iframe')

  overlay.hidden = true
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')
  overlay.setAttribute('aria-label', '产品反馈')
  applyStyles(overlay, {
    position: 'fixed',
    inset: '0',
    zIndex: '120',
    overflow: 'hidden',
    background: 'transparent',
    opacity: '0',
    pointerEvents: 'none',
    transition: 'opacity 160ms ease',
  })

  iframe.title = '产品反馈'
  iframe.src = FEEDBACK_FRAME_URL
  iframe.setAttribute('allowtransparency', 'true')
  iframe.setAttribute('scrolling', 'no')
  iframe.addEventListener('load', () => {
    void postConfiguration().catch(() => {
      // The opening request reports the missing configuration to the caller.
    })
  })
  applyStyles(iframe, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    border: '0',
    background: 'transparent',
  })

  overlay.appendChild(iframe)
  document.body.appendChild(overlay)

  return { overlay, iframe }
}

function installFeedbackMessageListener() {
  window.addEventListener('message', (event: MessageEvent<FeedbackSdkMessage>) => {
    if (event.origin !== FEEDBACK_FRAME_ORIGIN || event.source !== frameElements?.iframe.contentWindow) return
    if (event.data?.source !== 'feedback-sdk-web') return

    if (event.data.type === 'feedback-sdk:close') {
      hideFeedbackFrame()
      return
    }

    if (event.data.type === 'feedback-sdk:ready') {
      feedbackSdkReady = true
      resolveFeedbackSdkReady?.()
      resolveFeedbackSdkReady = null
      void postConfiguration().catch(() => {})
      return
    }

    if (event.data.type === 'feedback-sdk:refresh-session') {
      cachedFeedbackSession = null
      void postConfiguration().catch(() => {})
      return
    }

    if (event.data.type === FEEDBACK_SDK_UNREAD_CHANGED_EVENT) {
      const unreadCount = Number(event.data.unread_count)
      window.dispatchEvent(new CustomEvent(FEEDBACK_SDK_UNREAD_CHANGED_EVENT, {
        detail: { unreadCount: Number.isFinite(unreadCount) ? Math.max(0, Math.floor(unreadCount)) : 0 },
      }))
    }
  })
}

function waitForFeedbackSdk() {
  if (feedbackSdkReady) return Promise.resolve()
  if (feedbackSdkReadyPromise) return feedbackSdkReadyPromise

  feedbackSdkReadyPromise = new Promise<void>((resolve, reject) => {
    resolveFeedbackSdkReady = resolve
    window.setTimeout(() => {
      if (feedbackSdkReady) return
      feedbackSdkReadyPromise = null
      resolveFeedbackSdkReady = null
      reject(new Error('反馈 SDK 加载超时'))
    }, 15000)
  })

  return feedbackSdkReadyPromise
}

async function openFeedback(panel: FeedbackPanel, theme: FeedbackTheme) {
  currentTheme = theme
  showFeedbackFrame()
  try {
    await waitForFeedbackSdk()
    await postConfiguration()
    postOpenCommand(panel)
  } catch (error) {
    hideFeedbackFrame()
    throw error
  }
}

export function syncFeedbackSdkTheme(theme: FeedbackTheme) {
  currentTheme = theme
  if (!feedbackSdkReady) return
  void postConfiguration()
}

export function openFeedbackSubmit(theme: FeedbackTheme) {
  return openFeedback('submit', theme)
}

export function openFeedbackStatus(theme: FeedbackTheme) {
  return openFeedback('status', theme)
}

if (typeof window !== 'undefined') {
  installFeedbackMessageListener()
}
