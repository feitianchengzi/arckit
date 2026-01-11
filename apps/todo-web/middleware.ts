/**
 * Next.js 中间件
 * 处理认证和路由保护
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 公开路由（无需认证）
const PUBLIC_ROUTES = ['/login', '/register']

// 认证路由（已登录不可访问）
const AUTH_ROUTES = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检查是否有 auth token (从 cookie)
  const token = request.cookies.get('auth_token')?.value

  // 如果访问认证页面，但已登录，跳转到主页
  // 注意：允许用户访问登录页面，即使有 token（用户可能想切换账号）
  // 所以这里暂时不重定向，让登录页面自己处理
  // if (AUTH_ROUTES.includes(pathname) && token) {
  //   return NextResponse.redirect(new URL('/projects', request.url))
  // }

  // 如果访问受保护页面，但未登录，跳转到登录页
  if (!PUBLIC_ROUTES.includes(pathname) && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// 配置需要运行中间件的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了:
     * - api routes
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
