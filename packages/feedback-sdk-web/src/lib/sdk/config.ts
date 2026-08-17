import { applyFeedbackSDKTheme, normalizeFeedbackSDKTheme, type FeedbackSDKTheme } from './theme'

export type FeedbackSDKV2AuthMode = 'session' | 'apiKey'

export interface FeedbackSDKConfig {
  apiKey?: string
  projectId?: number
  customUserId?: string
  gatewayUrl?: string
  feedbackV2Enabled?: boolean
  feedbackV2NotificationsEnabled?: boolean
  feedbackV2AuthMode?: FeedbackSDKV2AuthMode
  feedbackSessionToken?: string
  theme?: FeedbackSDKTheme
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
