/**
 * 登录跳转工具
 * 在会话失效场景下保留当前访问路径，登录后可回到原页面。
 */

export function buildLoginRedirectUrl(redirectPath?: string): string {
  if (typeof window === 'undefined') return '/login'

  const fallbackPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
  const targetPath = (redirectPath ?? fallbackPath).trim()

  if (!targetPath) {
    return '/login'
  }

  if (targetPath.startsWith('/login')) {
    return targetPath
  }

  return `/login?redirect=${encodeURIComponent(targetPath)}`
}

export function redirectToLogin(redirectPath?: string): void {
  if (typeof window === 'undefined') return
  window.location.href = buildLoginRedirectUrl(redirectPath)
}
