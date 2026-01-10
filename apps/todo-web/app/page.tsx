/**
 * 首页 - 重定向逻辑
 */

import { redirect } from 'next/navigation'

export default function HomePage() {
  // 重定向到项目列表
  // 中间件会检查认证状态并决定跳转到哪里
  redirect('/projects')
}

