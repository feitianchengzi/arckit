/**
 * Dashboard Layout - 包含 Sidebar 的布局
 * 
 * 所有在 (dashboard) 路由组下的页面都会使用这个布局
 */

import { MainLayout } from '@/components/layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}
