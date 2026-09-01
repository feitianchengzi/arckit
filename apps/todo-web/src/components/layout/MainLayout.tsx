'use client'

/**
 * MainLayout - 主布局组件
 * 
 * 结构：
 * ┌─────────┬──────────────┐
 * │ Sidebar │   Content    │
 * │         │              │
 * │         │              │
 * └─────────┴──────────────┘
 */

import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* 侧边栏 */}
      <Sidebar />
      
      {/* 主内容区域 */}
      <main className="flex-1 overflow-y-auto lg:pl-[280px]">
        <div className="container mx-auto p-6 max-w-[1600px]">
          {children}
        </div>
      </main>
    </div>
  )
}
