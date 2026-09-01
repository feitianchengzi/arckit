/**
 * 登录跳转工具
 * 在会话失效场景下保留当前访问路径，登录后可回到原页面。
 */

import { buildAppPath, normalizeInAppPath } from '@/lib/router/base'

export function buildLoginRedirectUrl(redirectPath?: string): string {
  if (typeof window === 'undefined') return buildAppPath('/login')

  const fallbackPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
  const targetPath = normalizeInAppPath(redirectPath ?? fallbackPath, '/feedbacks')
  const loginPath = buildAppPath('/login')
  const normalizedLoginPrefix = `${loginPath}?redirect=`

  if (!targetPath) {
    return loginPath
  }

  if (targetPath === loginPath || targetPath.startsWith(normalizedLoginPrefix)) {
    return targetPath
  }

  return `${loginPath}?redirect=${encodeURIComponent(targetPath)}`
}

export function redirectToLogin(redirectPath?: string): void {
  if (typeof window === 'undefined') return
  const target = buildLoginRedirectUrl(redirectPath)
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`

  if (target === current) {
    return
  }

  try {
    const targetUrl = new URL(target, window.location.origin)
    const next = `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`
    window.history.replaceState(null, '', next)
    window.dispatchEvent(new PopStateEvent('popstate'))
  } catch {
    window.location.replace(target)
  }
}
