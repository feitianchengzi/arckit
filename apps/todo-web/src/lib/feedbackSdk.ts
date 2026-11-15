import { showGlobalToast } from '@/components/ui/Toast'
import { gatewayApi } from '@/lib/api/endpoints/gateway'
import { getAccessToken } from '@/lib/utils/tokenManager'

const FEEDBACK_FRAME_URL = import.meta.env.VITE_FEEDBACK_SDK_URL?.trim() || '/sdk/index.html?embed=web'
const FEEDBACK_API_KEY = import.meta.env.VITE_FEEDBACK_API_KEY?.trim() || ''
const FEEDBACK_PROJECT_ID = 45
const FEEDBACK_GATEWAY_URL = import.meta.env.DEV ? '/api-proxy' : import.meta.env.VITE_GATEWAY_URL || 'https://api.feitianchengzi.com'
const LOAD_TIMEOUT = 15000
const LOAD_ERROR = '帮助与反馈暂时无法打开，请稍后重试。'
const IDENTITY_ERROR = '暂时无法确认你的身份，请重新登录后再试。'

export type FeedbackTheme = 'light' | 'dark' | 'system'
type FeedbackFrameMode = 'submit' | 'status'
interface FeedbackOptions {
  apiKey: string
  projectId: number
  customUserId: string
  gatewayUrl: string
  feedbackV2Enabled: true
  feedbackV2AuthMode: 'apiKey'
  theme: FeedbackTheme
}
interface FeedbackFrame {
  overlay: HTMLDivElement
  iframe: HTMLIFrameElement
  origin: string
  tokenUserId: string | null
  options: FeedbackOptions
  ready: boolean
  readySerial: number
  consumedReadySerial: number
  loadAwaitingReady: boolean
  timer?: number
  wait: Promise<void>
  resolve: () => void
  reject: (error: Error) => void
  onMessage: (event: MessageEvent) => void
  onLoad: () => void
  onError: () => void
  onKey: (event: KeyboardEvent) => void
}

let frame: FeedbackFrame | null = null
let previousBodyOverflow: string | null = null
let currentMode: FeedbackFrameMode = 'submit'
let currentTheme: FeedbackTheme = 'system'
let customUserIdCache: { tokenUserId: string | null; id: string } | null = null
let customUserIdPending: { tokenUserId: string | null; promise: Promise<string> } | null = null

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function getUserIdFromToken(): string | null {
  const payload = getAccessToken()?.split('.')[1]
  if (!payload) return null
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')
    const decoded = decodeURIComponent(Array.from(atob(padded), (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''))
    const parsed = JSON.parse(decoded) as { user_id?: unknown; sub?: unknown }
    return readString(parsed.user_id) ?? readString(parsed.sub)
  } catch { return null }
}

async function resolveCustomUserId(tokenUserId: string | null): Promise<string> {
  if (customUserIdCache?.tokenUserId === tokenUserId) return customUserIdCache.id
  if (customUserIdPending?.tokenUserId === tokenUserId) return customUserIdPending.promise
  const promise = gatewayApi.getUserProfile()
    .then((profile) => readString(profile.id) ?? tokenUserId)
    .catch(() => tokenUserId)
    .then((id) => {
      if (!id || getUserIdFromToken() !== tokenUserId) throw new Error(IDENTITY_ERROR)
      customUserIdCache = { tokenUserId, id }
      return id
    })
    .finally(() => { if (customUserIdPending?.promise === promise) customUserIdPending = null })
  customUserIdPending = { tokenUserId, promise }
  return promise
}

function clearReadyTimer(target: FeedbackFrame) {
  if (target.timer !== undefined) window.clearTimeout(target.timer)
  target.timer = undefined
}

function destroyFrame() {
  const previous = frame
  frame = null
  if (previous) {
    clearReadyTimer(previous)
    window.removeEventListener('message', previous.onMessage)
    window.removeEventListener('keydown', previous.onKey)
    previous.iframe.removeEventListener('load', previous.onLoad)
    previous.iframe.removeEventListener('error', previous.onError)
    previous.reject(new Error(LOAD_ERROR))
    previous.overlay.remove()
  }
  if (previousBodyOverflow !== null) {
    document.body.style.overflow = previousBodyOverflow
    previousBodyOverflow = null
  }
}

function postConfiguration(target: FeedbackFrame) {
  if (target !== frame || !target.ready) return
  target.iframe.contentWindow?.postMessage({ source: 'feedback-sdk-host', type: 'feedback-sdk:configure', config: target.options }, target.origin)
}

function postOpen(target: FeedbackFrame, mode: FeedbackFrameMode) {
  if (target !== frame || !target.ready) return
  target.iframe.contentWindow?.postMessage({ source: 'feedback-sdk-host', type: 'feedback-sdk:open', mode }, target.origin)
}

function startReadyWait(target: FeedbackFrame) {
  clearReadyTimer(target)
  target.ready = false
  target.wait = new Promise<void>((resolve, reject) => { target.resolve = resolve; target.reject = reject })
  // Reload waits can exist without an active open() caller. The next caller
  // still receives the rejection, without an unhandled rejection on timeout.
  void target.wait.catch(() => {})
  target.timer = window.setTimeout(() => {
    if (frame !== target) return
    const wasVisible = !target.overlay.hidden
    target.reject(new Error(LOAD_ERROR))
    destroyFrame()
    if (wasVisible) showGlobalToast(LOAD_ERROR, 'error', 3000)
  }, LOAD_TIMEOUT)
}

function createFrame(options: FeedbackOptions, tokenUserId: string | null): FeedbackFrame {
  const sdkURL = new URL(FEEDBACK_FRAME_URL, window.location.href)
  if (!/^https?:$/.test(sdkURL.protocol)) throw new Error(LOAD_ERROR)
  sdkURL.searchParams.set('embed', 'web')
  const overlay = document.createElement('div')
  overlay.hidden = true
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')
  overlay.setAttribute('aria-label', '帮助与反馈')
  Object.assign(overlay.style, { position: 'fixed', inset: '0', zIndex: '120', background: 'transparent', overflow: 'hidden' })
  const iframe = document.createElement('iframe')
  iframe.title = '帮助与反馈'
  iframe.setAttribute('allow', 'microphone')
  iframe.setAttribute('allowtransparency', 'true')
  Object.assign(iframe.style, { display: 'block', width: '100%', height: '100%', border: '0', background: 'transparent' })
  const target: FeedbackFrame = {
    overlay, iframe, origin: sdkURL.origin, tokenUserId, options,
    ready: false, readySerial: 0, consumedReadySerial: 0, loadAwaitingReady: false,
    wait: Promise.resolve(), resolve: () => {}, reject: () => {},
    onMessage: (event) => {
      if (frame !== target || event.origin !== target.origin || event.source !== iframe.contentWindow || event.data?.source !== 'feedback-sdk-web') return
      if (event.data.type === 'feedback-sdk:close') { destroyFrame(); return }
      if (event.data.type !== 'feedback-sdk:ready') return
      if (getUserIdFromToken() !== target.tokenUserId) { destroyFrame(); return }
      target.readySerial++
      if (target.loadAwaitingReady) {
        target.consumedReadySerial = target.readySerial
        target.loadAwaitingReady = false
      }
      target.ready = true
      clearReadyTimer(target)
      postConfiguration(target)
      if (!target.overlay.hidden) postOpen(target, currentMode)
      target.resolve()
    },
    onLoad: () => {
      if (frame !== target) return
      // Bootstrap normally sends ready before the document's load event.
      // Also support loaders that announce ready after load. A later reload
      // needs its own handshake, not the previous document's readiness.
      if (target.readySerial > target.consumedReadySerial) {
        target.consumedReadySerial = target.readySerial
        return
      }
      target.loadAwaitingReady = true
      if (target.ready) startReadyWait(target)
    },
    onError: () => {
      if (frame !== target) return
      const wasVisible = !target.overlay.hidden
      destroyFrame()
      if (wasVisible) showGlobalToast(LOAD_ERROR, 'error', 3000)
    },
    onKey: (event) => { if (event.key === 'Escape' && frame === target) destroyFrame() },
  }
  frame = target
  startReadyWait(target)
  window.addEventListener('message', target.onMessage)
  window.addEventListener('keydown', target.onKey)
  iframe.addEventListener('load', target.onLoad)
  iframe.addEventListener('error', target.onError)
  iframe.src = sdkURL.href
  overlay.appendChild(iframe)
  document.body.appendChild(overlay)
  return target
}

export function syncFeedbackSdkTheme(theme: FeedbackTheme) {
  currentTheme = theme
  if (!frame) return
  if (getUserIdFromToken() !== frame.tokenUserId) { destroyFrame(); return }
  frame.options.theme = theme
  postConfiguration(frame)
}

export async function configureFeedbackSdk(theme: FeedbackTheme = 'system') {
  if (!FEEDBACK_API_KEY) throw new Error('帮助与反馈暂未准备好，请联系产品支持人员。')
  currentTheme = theme
  const tokenUserId = getUserIdFromToken()
  if (frame && frame.tokenUserId !== tokenUserId) destroyFrame()
  const customUserId = await resolveCustomUserId(tokenUserId)
  if (getUserIdFromToken() !== tokenUserId) throw new Error(IDENTITY_ERROR)
  const options: FeedbackOptions = {
    apiKey: FEEDBACK_API_KEY, projectId: FEEDBACK_PROJECT_ID, customUserId,
    gatewayUrl: new URL(FEEDBACK_GATEWAY_URL, window.location.href).href.replace(/\/$/, ''),
    feedbackV2Enabled: true, feedbackV2AuthMode: 'apiKey', theme: currentTheme,
  }
  if (frame && frame.options.customUserId !== customUserId) destroyFrame()
  const target = frame ?? createFrame(options, tokenUserId)
  target.options = options
  if (target.ready) postConfiguration(target)
  await target.wait
  if (frame !== target || getUserIdFromToken() !== tokenUserId) throw new Error(IDENTITY_ERROR)
  return target
}

async function openFeedback(mode: FeedbackFrameMode, theme: FeedbackTheme) {
  currentMode = mode
  const openingTokenUserId = getUserIdFromToken()
  try {
    const configuring = configureFeedbackSdk(theme)
    // Once identity resolution creates the iframe it stays hidden until its
    // own ready signal, so customers never see the legacy unconfigured page.
    const target = await configuring
    if (previousBodyOverflow === null) previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    target.overlay.hidden = false
    postOpen(target, currentMode)
  } catch (error) {
    if (frame?.tokenUserId === openingTokenUserId) destroyFrame()
    throw new Error(error instanceof Error && error.message === IDENTITY_ERROR ? IDENTITY_ERROR : error instanceof Error && error.message === '帮助与反馈暂未准备好，请联系产品支持人员。' ? error.message : LOAD_ERROR)
  }
}

export async function openFeedbackSubmit(theme: FeedbackTheme) { await openFeedback('submit', theme) }
export async function openFeedbackStatus(theme: FeedbackTheme) { await openFeedback('status', theme) }
