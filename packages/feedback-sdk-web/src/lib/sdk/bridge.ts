import { configureFeedbackSDK, getFeedbackSDKConfig, isFeedbackSDKV2NotificationsEnabled, setFeedbackSDKTheme } from './config'
import type { FeedbackSDKConfig } from './config'
import { fetchFeedbackNotificationsV2 } from '@/lib/feedback/v2'
import { buildAppPath } from './router'
import { applyFeedbackSDKTheme, getFeedbackSDKTheme, type FeedbackSDKTheme } from './theme'

export const FEEDBACK_SDK_CONFIGURED_EVENT = 'feedback-sdk:configured'
export const FEEDBACK_SDK_NATIVE_IMAGE_EVENT = 'feedback-sdk:native-image-selected'
export const FEEDBACK_SDK_UNREAD_CHANGED_EVENT = 'feedback-sdk:unread-changed'

const FEEDBACK_SDK_HOST_SOURCES = new Set(['feedback-console-web', 'feedback-sdk-host'])
const FEEDBACK_SDK_HOST_CONFIGURE_MESSAGE = 'feedback-sdk:configure'
const FEEDBACK_SDK_HOST_OPEN_MESSAGE = 'feedback-sdk:open'
const FEEDBACK_SDK_HOST_GET_UNREAD_MESSAGE = 'feedback-sdk:get-unread-count'
const FEEDBACK_SDK_READY_MESSAGE = 'feedback-sdk:ready'
const FEEDBACK_SDK_REFRESH_SESSION_MESSAGE = 'feedback-sdk:refresh-session'
const FEEDBACK_SDK_UNREAD_CHANGED_MESSAGE = 'feedback-sdk:unread-changed'
const FEEDBACK_SDK_UNREAD_COUNT_MESSAGE = 'feedback-sdk:unread-count'

export interface FeedbackSDKNativeImagePayload {
  name?: string
  mimeType?: string
  type?: string
  base64?: string
  dataUrl?: string
}

export interface FeedbackSDKBridge {
  configure: (config: FeedbackSDKConfig) => void
  openSubmit: () => void
  openStatus: () => void
  getUnreadCount: () => Promise<number>
  getConfig: () => FeedbackSDKConfig
  setTheme: (theme: FeedbackSDKTheme) => void
  getTheme: () => FeedbackSDKTheme
  useSystemTheme: () => void
  setImageFromNative: (payload: FeedbackSDKNativeImagePayload) => void
}

declare global {
  interface Window {
    FeedbackSDK?: FeedbackSDKBridge
  }
}

interface FeedbackSDKHostConfigMessage {
  source?: unknown
  type?: unknown
  config?: unknown
  mode?: unknown
  request_id?: unknown
}

let hostMessageListenerInstalled = false

function parseOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .flatMap((origin) => {
      try {
        return [new URL(origin).origin]
      } catch {
        return []
      }
    })
}

function getAllowedParentOrigins(): string[] {
  const configuredOrigins = parseOrigins(
    import.meta.env.VITE_SDK_PARENT_ORIGINS || import.meta.env.VITE_SDK_PARENT_ORIGIN || ''
  )
  if (configuredOrigins.length) return configuredOrigins

  if (import.meta.env.DEV && document.referrer) {
    try {
      return [new URL(document.referrer).origin]
    } catch {
      // Fall through to the standard local development origin.
    }
  }
  if (import.meta.env.DEV) return ['http://localhost:3000']
  return [window.location.origin]
}

function isFeedbackSDKConfig(value: unknown): value is FeedbackSDKConfig {
  if (!value || typeof value !== 'object') return false

  const config = value as Record<string, unknown>
  return (
    (config.apiKey === undefined || typeof config.apiKey === 'string') &&
    (config.projectId === undefined || typeof config.projectId === 'number') &&
    (config.customUserId === undefined || typeof config.customUserId === 'string') &&
    (config.gatewayUrl === undefined || typeof config.gatewayUrl === 'string') &&
    (config.feedbackV2Enabled === undefined || typeof config.feedbackV2Enabled === 'boolean') &&
    (config.feedbackV2NotificationsEnabled === undefined || typeof config.feedbackV2NotificationsEnabled === 'boolean') &&
    (config.feedbackV2AuthMode === undefined || config.feedbackV2AuthMode === 'session' || config.feedbackV2AuthMode === 'apiKey') &&
    (config.feedbackSessionToken === undefined || typeof config.feedbackSessionToken === 'string') &&
    (config.theme === undefined || typeof config.theme === 'string')
  )
}

export function requestFeedbackSessionRefresh(): Promise<void> {
  if (typeof window === 'undefined' || window.parent === window) {
    return Promise.reject(new Error('反馈会话已过期，请由宿主应用刷新后重试'))
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener(FEEDBACK_SDK_CONFIGURED_EVENT, onConfigured)
      reject(new Error('反馈会话刷新超时，请重试'))
    }, 10000)
    const onConfigured = () => {
      window.clearTimeout(timeout)
      resolve()
    }
    window.addEventListener(FEEDBACK_SDK_CONFIGURED_EVENT, onConfigured, { once: true })
    window.parent.postMessage(
      { source: 'feedback-sdk-web', type: FEEDBACK_SDK_REFRESH_SESSION_MESSAGE },
      '*'
    )
  })
}

export function notifyFeedbackSDKUnreadCount(unreadCount: number) {
  if (typeof window === 'undefined' || window.parent === window) return

  const normalizedCount = Number.isFinite(unreadCount) ? Math.max(0, Math.floor(unreadCount)) : 0
  window.parent.postMessage(
    {
      source: 'feedback-sdk-web',
      type: FEEDBACK_SDK_UNREAD_CHANGED_MESSAGE,
      unread_count: normalizedCount,
    },
    '*',
  )
}

export async function getFeedbackSDKUnreadCount(): Promise<number> {
  if (!isFeedbackSDKV2NotificationsEnabled()) return 0
  const result = await fetchFeedbackNotificationsV2({ unreadOnly: true, page: 1, pageSize: 1 })
  return result.unreadCount
}

function isAllowedParentOrigin(origin: string): boolean {
  if (getAllowedParentOrigins().includes(origin)) return true
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
}

function installHostMessageListener() {
  if (hostMessageListenerInstalled) return
  hostMessageListenerInstalled = true

  window.addEventListener('message', (event: MessageEvent<FeedbackSDKHostConfigMessage>) => {
    if (window.parent === window || event.source !== window.parent || !isAllowedParentOrigin(event.origin)) return
    if (!FEEDBACK_SDK_HOST_SOURCES.has(String(event.data?.source || ''))) return

    if (event.data.type === FEEDBACK_SDK_HOST_CONFIGURE_MESSAGE) {
      if (!isFeedbackSDKConfig(event.data.config)) return
      configureFeedbackSDK(event.data.config)
      window.dispatchEvent(new CustomEvent(FEEDBACK_SDK_CONFIGURED_EVENT))
      return
    }

    if (event.data.type === FEEDBACK_SDK_HOST_OPEN_MESSAGE && (event.data.mode === 'submit' || event.data.mode === 'status')) {
      navigateTo(`/${event.data.mode}`)
      return
    }

    if (event.data.type === FEEDBACK_SDK_HOST_GET_UNREAD_MESSAGE && typeof event.data.request_id === 'string') {
      const responseTarget = event.source as WindowProxy
      void getFeedbackSDKUnreadCount()
        .then((unreadCount) => {
          responseTarget.postMessage(
            {
              source: 'feedback-sdk-web',
              type: FEEDBACK_SDK_UNREAD_COUNT_MESSAGE,
              request_id: event.data.request_id,
              unread_count: unreadCount,
            },
            event.origin,
          )
        })
        .catch(() => {
          responseTarget.postMessage(
            {
              source: 'feedback-sdk-web',
              type: FEEDBACK_SDK_UNREAD_COUNT_MESSAGE,
              request_id: event.data.request_id,
              unread_count: 0,
            },
            event.origin,
          )
        })
    }
  })
}

function notifyHostReady() {
  if (window.parent === window) return
  window.parent.postMessage(
    { source: 'feedback-sdk-web', type: FEEDBACK_SDK_READY_MESSAGE },
    '*'
  )
}

function navigateTo(path: '/submit' | '/status') {
  if (typeof window === 'undefined') return

  const targetPath = buildAppPath(path)
  const isEmbedded = new URLSearchParams(window.location.search).get('embed') === 'web'
  const targetSearch = isEmbedded ? '?embed=web' : ''
  const currentPath = window.location.pathname
  const currentSearch = window.location.search
  const hasHash = Boolean(window.location.hash)

  if (currentPath === targetPath && currentSearch === targetSearch && !hasHash) {
    window.dispatchEvent(new PopStateEvent('popstate'))
    return
  }

  const navigateFn = currentPath === targetPath ? window.history.replaceState : window.history.pushState
  navigateFn.call(window.history, {}, '', `${targetPath}${targetSearch}`)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function createBridge(): FeedbackSDKBridge {
  return {
    configure(config: FeedbackSDKConfig) {
      configureFeedbackSDK(config)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(FEEDBACK_SDK_CONFIGURED_EVENT))
      }
    },
    openSubmit() {
      navigateTo('/submit')
    },
    openStatus() {
      navigateTo('/status')
    },
    getUnreadCount() {
      return getFeedbackSDKUnreadCount()
    },
    getConfig() {
      return getFeedbackSDKConfig()
    },
    setTheme(theme: FeedbackSDKTheme) {
      setFeedbackSDKTheme(theme)
    },
    getTheme() {
      return getFeedbackSDKTheme()
    },
    useSystemTheme() {
      setFeedbackSDKTheme('system')
    },
    setImageFromNative(payload: FeedbackSDKNativeImagePayload) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(FEEDBACK_SDK_NATIVE_IMAGE_EVENT, { detail: payload }))
      }
    },
  }
}

export function installFeedbackSDKBridge() {
  if (typeof window === 'undefined') return
  applyFeedbackSDKTheme(getFeedbackSDKConfig().theme || 'light')
  window.FeedbackSDK = createBridge()
  installHostMessageListener()
  notifyHostReady()
}
