import { applyFeedbackSDKTheme, normalizeFeedbackSDKTheme, type FeedbackSDKTheme } from './theme'

export type FeedbackSDKV2AuthMode = 'session' | 'apiKey'
export type FeedbackSDKLocale = 'zh-CN' | 'en-US'

/**
 * Optional non-identifying diagnostics supplied by an embedding host. This is
 * deliberately a closed allowlist: no tenant, account, form, money, file,
 * authorization, cookie, stack, screenshot or full user-agent data belongs
 * here.
 */
export interface FeedbackSDKHostContext {
  release?: string
  build?: string
  module?: string
  route?: string
  browser?: string
  os?: string
  locale?: string
  clientTimestamp?: string
  requestId?: string
}

export interface FeedbackSDKConfig {
  apiKey?: string
  projectId?: number
  customUserId?: string
  gatewayUrl?: string
  feedbackV2Enabled?: boolean
  feedbackV2NotificationsEnabled?: boolean
  feedbackV2AuthMode?: FeedbackSDKV2AuthMode
  feedbackSessionToken?: string
  locale?: FeedbackSDKLocale
  /** 允许向其 postMessage 的宿主 origin 列表（运行时可配，覆盖构建期 VITE_SDK_PARENT_ORIGINS） */
  parentOrigins?: string[]
  theme?: FeedbackSDKTheme
  hostContext?: FeedbackSDKHostContext
}

function trimValue(value?: string | null): string {
  return (value || '').trim()
}

function toPositiveInt(value?: number): number | undefined {
  if (typeof value !== 'number') return undefined
  if (!Number.isFinite(value) || value <= 0) return undefined
  return Math.floor(value)
}

const defaultConfig: FeedbackSDKConfig = {
  apiKey: trimValue(import.meta.env.VITE_SDK_FEEDBACK_API_KEY || ''),
  projectId: (() => {
    const raw = trimValue(import.meta.env.VITE_SDK_FEEDBACK_PROJECT_ID || '')
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined
  })(),
  gatewayUrl: trimValue(import.meta.env.VITE_GATEWAY_URL || ''),
  feedbackV2NotificationsEnabled: trimValue(import.meta.env.VITE_SDK_FEEDBACK_V2_NOTIFICATIONS_ENABLED || '').toLowerCase() === 'true',
  theme: normalizeFeedbackSDKTheme(import.meta.env.VITE_SDK_THEME || '') || 'light',
}

const runtimeConfig: FeedbackSDKConfig = {}

function bounded(value: unknown, maxLength: number, pattern: RegExp): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  if (!normalized || normalized.length > maxLength || !pattern.test(normalized)) return undefined
  return normalized
}

export function normalizeFeedbackSDKHostContext(value: unknown): FeedbackSDKHostContext | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const source = value as Record<string, unknown>
  const result: FeedbackSDKHostContext = {}
  result.release = bounded(source.release, 64, /^[A-Za-z0-9._-]+$/)
  result.build = bounded(source.build, 64, /^[A-Za-z0-9._-]+$/)
  result.module = bounded(source.module, 64, /^[a-z][a-z-]*$/)
  // Route names are semantic screen keys, never full URLs or resource paths.
  result.route = bounded(source.route, 64, /^[a-z][a-z-]*$/)
  result.browser = bounded(source.browser, 120, /^[A-Za-z][A-Za-z0-9 .,_-]*$/)
  result.os = bounded(source.os, 40, /^[A-Za-z][A-Za-z0-9 ._-]*$/)
  result.locale = bounded(source.locale, 20, /^[A-Za-z]{2,3}(?:-[A-Za-z]{2,4})?$/)
  result.requestId = bounded(source.requestId, 64, /^[A-Za-z0-9_-]+$/)
  if (typeof source.clientTimestamp === 'string' && source.clientTimestamp.length <= 40) {
    const parsed = new Date(source.clientTimestamp)
    if (!Number.isNaN(parsed.getTime())) result.clientTimestamp = parsed.toISOString()
  }
  Object.keys(result).forEach((key) => {
    if (result[key as keyof FeedbackSDKHostContext] === undefined) delete result[key as keyof FeedbackSDKHostContext]
  })
  return Object.keys(result).length ? result : undefined
}

export function configureFeedbackSDK(config: FeedbackSDKConfig) {
  if (trimValue(config.apiKey)) {
    runtimeConfig.apiKey = trimValue(config.apiKey)
  }
  const pid = toPositiveInt(config.projectId)
  if (pid) {
    runtimeConfig.projectId = pid
  }
  if (trimValue(config.customUserId)) {
    runtimeConfig.customUserId = trimValue(config.customUserId)
  }
  if (trimValue(config.gatewayUrl)) {
    runtimeConfig.gatewayUrl = trimValue(config.gatewayUrl)
  }
  if (typeof config.feedbackV2Enabled === 'boolean') {
    runtimeConfig.feedbackV2Enabled = config.feedbackV2Enabled
  }
  if (typeof config.feedbackV2NotificationsEnabled === 'boolean') {
    runtimeConfig.feedbackV2NotificationsEnabled = config.feedbackV2NotificationsEnabled
  }
  if (config.feedbackV2AuthMode === 'session' || config.feedbackV2AuthMode === 'apiKey') {
    runtimeConfig.feedbackV2AuthMode = config.feedbackV2AuthMode
  }
  if (config.feedbackSessionToken !== undefined) {
    runtimeConfig.feedbackSessionToken = trimValue(config.feedbackSessionToken)
  }
  if (config.locale === 'zh-CN' || config.locale === 'en-US') {
    runtimeConfig.locale = config.locale
  }
  if (Array.isArray(config.parentOrigins)) {
    runtimeConfig.parentOrigins = config.parentOrigins.map((origin) => trimValue(origin)).filter(Boolean)
  }
  if (config.hostContext !== undefined) {
    const hostContext = normalizeFeedbackSDKHostContext(config.hostContext)
    if (hostContext) runtimeConfig.hostContext = hostContext
    else delete runtimeConfig.hostContext
  }
  const theme = normalizeFeedbackSDKTheme(config.theme)
  if (theme) {
    runtimeConfig.theme = theme
    applyFeedbackSDKTheme(theme)
  }
}

export function initializeFeedbackSDK(config: FeedbackSDKConfig) {
  configureFeedbackSDK(config)
}

export function setFeedbackSDKApiKey(apiKey: string) {
  runtimeConfig.apiKey = trimValue(apiKey)
}

export function setFeedbackSDKProjectId(projectId: number) {
  const pid = toPositiveInt(projectId)
  if (pid) {
    runtimeConfig.projectId = pid
  }
}

export function setFeedbackSDKCustomUserId(customUserId: string) {
  runtimeConfig.customUserId = trimValue(customUserId)
}

export function setFeedbackSDKSessionToken(token: string) {
  runtimeConfig.feedbackSessionToken = trimValue(token)
}

export function setFeedbackSDKTheme(theme?: string | null) {
  const normalizedTheme = normalizeFeedbackSDKTheme(theme)
  if (!normalizedTheme) return

  runtimeConfig.theme = normalizedTheme
  applyFeedbackSDKTheme(normalizedTheme)
}

export function getFeedbackSDKConfig(): FeedbackSDKConfig {
  return {
    ...defaultConfig,
    ...runtimeConfig,
  }
}

export function getFeedbackSDKV2AuthMode(): FeedbackSDKV2AuthMode | null {
  const config = getFeedbackSDKConfig()
  if (config.feedbackV2Enabled !== true) return null

  const hasSessionToken = Boolean(trimValue(config.feedbackSessionToken))
  const hasDirectAPIKeyConfig = Boolean(trimValue(config.apiKey) && toPositiveInt(config.projectId) && trimValue(config.customUserId))

  if (config.feedbackV2AuthMode === 'session') return hasSessionToken ? 'session' : null
  if (config.feedbackV2AuthMode === 'apiKey') return hasDirectAPIKeyConfig ? 'apiKey' : null
  if (hasSessionToken) return 'session'
  return hasDirectAPIKeyConfig ? 'apiKey' : null
}

export function isFeedbackSDKV2Enabled(): boolean {
  return getFeedbackSDKV2AuthMode() !== null
}

// Notifications are a separate V2 rollout. Existing V2 integrations keep
// their current request pattern until they explicitly opt in.
export function isFeedbackSDKV2NotificationsEnabled(): boolean {
  return getFeedbackSDKV2AuthMode() !== null && getFeedbackSDKConfig().feedbackV2NotificationsEnabled === true
}
