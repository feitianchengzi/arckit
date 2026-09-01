import { gatewayApi } from '@/lib/api/endpoints/gateway'
import { getAccessToken } from '@/lib/utils/tokenManager'

const FEEDBACK_FRAME_URL = '/sdk/index.html?embed=web'
const FEEDBACK_API_KEY = import.meta.env.VITE_FEEDBACK_API_KEY?.trim() || ''
const FEEDBACK_PROJECT_ID = 45
const FEEDBACK_GATEWAY_URL = import.meta.env.DEV
  ? '/api-proxy'
  : import.meta.env.VITE_GATEWAY_URL || 'https://api.feitianchengzi.com'

export type FeedbackTheme = 'light' | 'dark' | 'system'
type FeedbackFrameMode = 'submit' | 'status'

interface FeedbackSDKOptions {
  apiKey: string
  projectId: number
  customUserId: string
  theme?: FeedbackTheme
  gatewayUrl?: string
}

interface FeedbackSDKGlobal {
  configure: (options: FeedbackSDKOptions) => void
  openSubmit: () => void
  openStatus: () => void
  setTheme?: (theme: Exclude<FeedbackTheme, 'system'>) => void
  useSystemTheme?: () => void
}

interface JwtPayload {
  user_id?: unknown
  sub?: unknown
}

interface FeedbackFrameElements {
  overlay: HTMLDivElement
  panel: HTMLDivElement
  iframe: HTMLIFrameElement
  loading: HTMLDivElement
  closeButton: HTMLButtonElement
}

declare global {
  interface Window {
    FeedbackSDK?: FeedbackSDKGlobal
  }
}

let sdkLoadPromise: Promise<FeedbackSDKGlobal> | null = null
let customUserIdPromise: Promise<string> | null = null
let customUserIdPromiseTokenUserId: string | null = null
let customUserIdCache: string | null = null
let customUserIdCacheTokenUserId: string | null = null
let configuredCustomUserId: string | null = null
let configuredTheme: FeedbackTheme | null = null
let frameElements: FeedbackFrameElements | null = null
let previousBodyOverflow: string | null = null
let currentFrameMode: FeedbackFrameMode = 'submit'
let frameChromeSyncId: number | undefined

function normalizeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = (4 - (base64.length % 4)) % 4
  return base64.padEnd(base64.length + padding, '=')
}

function decodeUtf8Base64(value: string) {
  return decodeURIComponent(
    Array.from(atob(value), (char) =>
      `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`
    ).join('')
  )
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}

function getUserIdFromToken() {
  const accessToken = getAccessToken()
  const payload = accessToken?.split('.')[1]

  if (!payload) {
    return null
  }

  try {
    const parsed = JSON.parse(decodeUtf8Base64(normalizeBase64Url(payload))) as JwtPayload
    return readString(parsed.user_id) ?? readString(parsed.sub)
  } catch (error) {
    console.warn('反馈 SDK 解析 Token 用户 ID 失败:', error)
    return null
  }
}

function applyStyles(element: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
  Object.assign(element.style, styles)
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

  if (frameChromeSyncId) {
    window.clearInterval(frameChromeSyncId)
    frameChromeSyncId = undefined
  }
}

function applyFeedbackFrameMode(mode: FeedbackFrameMode) {
  currentFrameMode = mode

  if (!frameElements) {
    return
  }

  const submitWidth = '640px'
  const statusWidth = '980px'
  const contentWidth = mode === 'status' ? statusWidth : submitWidth

  applyStyles(frameElements.panel, {
    width: mode === 'status'
      ? 'min(1040px, calc(100vw - 48px))'
      : 'min(800px, calc(100vw - 48px))',
    height: mode === 'status'
      ? 'min(760px, calc(100dvh - 48px))'
      : 'min(560px, calc(100dvh - 48px))',
  })

  applyStyles(frameElements.closeButton, {
    right: `max(12px, calc((100% - ${contentWidth}) / 2 + 12px))`,
  })
}

function syncFeedbackFrameChrome() {
  if (!frameElements) {
    return
  }

  try {
    const frameWindow = frameElements.iframe.contentWindow
    const card = frameWindow?.document.querySelector('#root > div > div > div')
    if (!frameWindow || !card || typeof card.getBoundingClientRect !== 'function') {
      return
    }

    const cardRect = card.getBoundingClientRect()
    const minimumWidth = currentFrameMode === 'status' ? 980 : 640
    const minimumHeight = currentFrameMode === 'status' ? 620 : 0
    const width = Math.max(Math.ceil(cardRect.width), minimumWidth)
    const height = Math.max(Math.ceil(cardRect.height), minimumHeight)

    if (width > 0 && height > 0) {
      applyStyles(frameElements.panel, {
        width: `min(${width}px, calc(100vw - 48px))`,
        height: `min(${height}px, calc(100dvh - 48px))`,
      })
    }

    applyStyles(frameElements.closeButton, {
      top: '8px',
      right: '12px',
    })
  } catch {
    // Same-origin access is expected here; keep the fallback position if it ever fails.
  }
}

function scheduleFeedbackFrameChromeSync() {
  if (frameChromeSyncId) {
    window.clearInterval(frameChromeSyncId)
  }

  syncFeedbackFrameChrome()

  let syncCount = 0
  frameChromeSyncId = window.setInterval(() => {
    syncFeedbackFrameChrome()
    syncCount += 1

    if (syncCount >= 40 && frameChromeSyncId) {
      window.clearInterval(frameChromeSyncId)
      frameChromeSyncId = undefined
    }
  }, 125)
}

function showFeedbackFrame(mode: FeedbackFrameMode) {
  if (typeof window === 'undefined') {
    return
  }

  if (!frameElements) {
    frameElements = createFeedbackFrame()
  }

  if (!frameElements) return
  applyFeedbackFrameMode(mode)

  if (previousBodyOverflow === null) {
    previousBodyOverflow = document.body.style.overflow
  }

  document.body.style.overflow = 'hidden'
  frameElements.overlay.hidden = false
  window.requestAnimationFrame(() => {
    if (!frameElements) return
    frameElements.overlay.style.opacity = '1'
    frameElements.overlay.style.pointerEvents = 'auto'
  })
}

function createFeedbackFrame() {
  const overlay = document.createElement('div')
  const panel = document.createElement('div')
  const closeButton = document.createElement('button')
  const iframe = document.createElement('iframe')
  const loading = document.createElement('div')

  overlay.hidden = true
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')
  overlay.setAttribute('aria-label', '产品反馈')
  overlay.addEventListener('mousedown', (event) => {
    if (event.target === overlay) {
      hideFeedbackFrame()
    }
  })

  applyStyles(overlay, {
    position: 'fixed',
    inset: '0',
    zIndex: '120',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'rgba(15, 23, 42, 0.38)',
    backdropFilter: 'blur(2px)',
    opacity: '0',
    pointerEvents: 'none',
    transition: 'opacity 160ms ease',
  })

  applyStyles(panel, {
    position: 'relative',
    overflow: 'visible',
    background: 'transparent',
  })

  closeButton.type = 'button'
  closeButton.textContent = '×'
  closeButton.setAttribute('aria-label', '关闭反馈')
  closeButton.title = '关闭反馈'
  closeButton.addEventListener('click', hideFeedbackFrame)
  applyStyles(closeButton, {
    position: 'absolute',
    top: '18px',
    zIndex: '2',
    width: '32px',
    height: '32px',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    background: 'color-mix(in srgb, var(--color-surface-elevated) 88%, transparent)',
    color: 'var(--color-foreground-secondary)',
    cursor: 'pointer',
    fontSize: '24px',
    lineHeight: '28px',
    boxShadow: 'none',
  })

  loading.textContent = '反馈加载中...'
  applyStyles(loading, {
    position: 'absolute',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '1',
    color: 'var(--color-foreground-secondary)',
    fontSize: '14px',
    background: 'transparent',
  })

  iframe.title = '产品反馈'
  iframe.src = FEEDBACK_FRAME_URL
  iframe.setAttribute('allowtransparency', 'true')
  applyStyles(iframe, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    border: '0',
    background: 'transparent',
  })

  panel.append(iframe, loading, closeButton)
  overlay.append(panel)
  document.body.appendChild(overlay)

  const elements = { overlay, panel, iframe, loading, closeButton }
  frameElements = elements
  applyFeedbackFrameMode(currentFrameMode)

  return elements
}

function getFrameSdk() {
  const frameWindow = frameElements?.iframe.contentWindow
  return frameWindow?.FeedbackSDK
}

function loadFeedbackSdk() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Feedback SDK can only be loaded in browser'))
  }

  if (!frameElements) {
    frameElements = createFeedbackFrame()
  }
  const elements = frameElements

  const existingSdk = getFrameSdk()
  if (existingSdk) {
    elements.loading.style.display = 'none'
    return Promise.resolve(existingSdk)
  }

  if (sdkLoadPromise) {
    return sdkLoadPromise
  }

  sdkLoadPromise = new Promise<FeedbackSDKGlobal>((resolve, reject) => {
    let settled = false
    let timeoutId: number | undefined
    let pollId: number | undefined

    const cleanup = () => {
      if (timeoutId) window.clearTimeout(timeoutId)
      if (pollId) window.clearInterval(pollId)
    }

    const rejectOnce = (error: Error) => {
      if (settled) return
      settled = true
      sdkLoadPromise = null
      cleanup()
      reject(error)
    }

    const resolveOnce = (sdk: FeedbackSDKGlobal) => {
      if (settled) return
      settled = true
      cleanup()
      if (frameElements) {
        frameElements.loading.style.display = 'none'
      }
      scheduleFeedbackFrameChromeSync()
      resolve(sdk)
    }

    const checkSdk = () => {
      try {
        const sdk = getFrameSdk()
        if (sdk) {
          resolveOnce(sdk)
        }
      } catch (error) {
        rejectOnce(error instanceof Error ? error : new Error('Feedback frame access failed'))
      }
    }

    timeoutId = window.setTimeout(
      () => rejectOnce(new Error('Feedback SDK load timeout')),
      15000
    )

    elements.iframe.addEventListener('load', checkSdk, { once: true })
    elements.iframe.addEventListener(
      'error',
      () => rejectOnce(new Error('Feedback SDK frame load failed')),
      { once: true }
    )
    pollId = window.setInterval(checkSdk, 120)
    checkSdk()
  })

  return sdkLoadPromise
}

async function resolveCustomUserId() {
  const tokenUserId = getUserIdFromToken()

  if (customUserIdCache && customUserIdCacheTokenUserId === tokenUserId) {
    return customUserIdCache
  }

  if (customUserIdCache) {
    customUserIdCache = null
    customUserIdCacheTokenUserId = null
    customUserIdPromise = null
    customUserIdPromiseTokenUserId = null
    configuredCustomUserId = null
  }

  if (customUserIdPromise && customUserIdPromiseTokenUserId === tokenUserId) {
    return customUserIdPromise
  }

  customUserIdPromiseTokenUserId = tokenUserId
  customUserIdPromise = gatewayApi
    .getUserProfile()
    .then((profile) => {
      const profileId = readString(profile.id)
      if (profileId) {
        customUserIdCache = profileId
        customUserIdCacheTokenUserId = tokenUserId
        return profileId
      }

      if (tokenUserId) {
        customUserIdCache = tokenUserId
        customUserIdCacheTokenUserId = tokenUserId
        return tokenUserId
      }

      throw new Error('Unable to resolve feedback user id')
    })
    .catch((error) => {
      const tokenUserId = getUserIdFromToken()
      if (tokenUserId) {
        console.warn(
          '获取 Profile 失败，反馈 SDK 临时使用 Token 用户 ID:',
          error instanceof Error ? error.message : 'unknown error'
        )
        customUserIdCache = tokenUserId
        customUserIdCacheTokenUserId = tokenUserId
        return tokenUserId
      }

      customUserIdPromise = null
      customUserIdPromiseTokenUserId = null
      throw error
    })

  return customUserIdPromise
}

export function syncFeedbackSdkTheme(theme: FeedbackTheme) {
  const sdk = getFrameSdk()
  if (!sdk) {
    return
  }

  if (theme === 'system') {
    sdk.useSystemTheme?.()
  } else {
    sdk.setTheme?.(theme)
  }

  configuredTheme = theme
}

export async function configureFeedbackSdk(theme: FeedbackTheme = 'system') {
  if (!FEEDBACK_API_KEY) {
    throw new Error('VITE_FEEDBACK_API_KEY is required to configure the Feedback SDK')
  }

  const [sdk, customUserId] = await Promise.all([
    loadFeedbackSdk(),
    resolveCustomUserId(),
  ])

  if (configuredCustomUserId !== customUserId) {
    sdk.configure({
      apiKey: FEEDBACK_API_KEY,
      projectId: FEEDBACK_PROJECT_ID,
      customUserId,
      gatewayUrl: FEEDBACK_GATEWAY_URL,
      theme,
    })

    configuredCustomUserId = customUserId
    configuredTheme = theme
    return sdk
  }

  if (configuredTheme !== theme) {
    syncFeedbackSdkTheme(theme)
  }

  return sdk
}

export async function openFeedbackSubmit(theme: FeedbackTheme) {
  showFeedbackFrame('submit')
  try {
    const sdk = await configureFeedbackSdk(theme)
    sdk.openSubmit()
    scheduleFeedbackFrameChromeSync()
  } catch (error) {
    hideFeedbackFrame()
    throw error
  }
}

export async function openFeedbackStatus(theme: FeedbackTheme) {
  showFeedbackFrame('status')
  try {
    const sdk = await configureFeedbackSdk(theme)
    sdk.openStatus()
    scheduleFeedbackFrameChromeSync()
  } catch (error) {
    hideFeedbackFrame()
    throw error
  }
}
