export type FeedbackSDKTheme = 'light' | 'dark' | 'system'

const FALLBACK_THEME: FeedbackSDKTheme = 'light'
const FALLBACK_RESOLVED_THEME: 'light' | 'dark' = 'light'
const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)'

let activeTheme: FeedbackSDKTheme = FALLBACK_THEME
let removeSystemThemeListener: (() => void) | null = null

export function normalizeFeedbackSDKTheme(theme?: string | null): FeedbackSDKTheme | undefined {
  if (theme === 'light' || theme === 'dark' || theme === 'system') {
    return theme
  }
  return undefined
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return FALLBACK_RESOLVED_THEME
  }
  return window.matchMedia(SYSTEM_DARK_QUERY).matches ? 'dark' : 'light'
}

function resolveTheme(theme: FeedbackSDKTheme): 'light' | 'dark' {
  return theme === 'system' ? getSystemTheme() : theme
}

function applyResolvedTheme(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.dataset.feedbackSdkTheme = activeTheme
  root.dataset.feedbackSdkResolvedTheme = theme
  root.style.colorScheme = theme
}

function watchSystemThemeIfNeeded(theme: FeedbackSDKTheme) {
  removeSystemThemeListener?.()
  removeSystemThemeListener = null

  if (theme !== 'system' || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return
  }

  const mediaQuery = window.matchMedia(SYSTEM_DARK_QUERY)
  const handleChange = () => applyResolvedTheme(resolveTheme(activeTheme))

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleChange)
    removeSystemThemeListener = () => mediaQuery.removeEventListener('change', handleChange)
    return
  }

  mediaQuery.addListener(handleChange)
  removeSystemThemeListener = () => mediaQuery.removeListener(handleChange)
}

export function applyFeedbackSDKTheme(theme: FeedbackSDKTheme = FALLBACK_THEME) {
  activeTheme = theme
  watchSystemThemeIfNeeded(theme)
  applyResolvedTheme(resolveTheme(theme))
}

export function getFeedbackSDKTheme(): FeedbackSDKTheme {
  return activeTheme
}
