/**
 * 中间件 - 路由保护
 * 
 * 功能：
 * 1. 检查用户是否已登录
 * 2. 未登录用户访问受保护路由 → 跳转到登录页
 * 3. 已登录用户访问登录/注册页 → 跳转到项目列表
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 从 cookie 或 header 中获取 token
  // 注意：由于 middleware 在服务端运行，无法访问 localStorage
  // 这里简化处理，实际项目可以使用 cookie
  const token = request.cookies.get('auth_token')?.value
  
  // 公开路由（不需要认证）
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))
  
  // 受保护路由（需要认证）
  const protectedRoutes = ['/projects', '/tasks', '/settings']
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  
  // 情况 1: 未登录访问受保护路由 → 跳转到登录
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // 情况 2: 已登录访问登录/注册页 → 跳转到项目列表
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/projects', request.url))
  }
  
  // 情况 3: 其他情况 → 放行
  return NextResponse.next()
}

// 配置中间件匹配路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - public 文件夹
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
}

