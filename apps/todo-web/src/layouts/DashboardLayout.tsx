import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import clsx from 'clsx'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // 监听窗口大小变化，桌面端自动打开侧边栏
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false) // 桌面端不需要遮罩层状态
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize() // 初始化时检查

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 点击遮罩层关闭侧边栏
  const handleOverlayClick = () => {
    setSidebarOpen(false)
  }

  // ESC 键关闭侧边栏
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [sidebarOpen])

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      {/* 移动端菜单按钮 */}
      <button
        onClick={() => setSidebarOpen(true)}
        className={clsx(
          'lg:hidden fixed top-4 left-4 z-50',
          'w-11 h-11 flex items-center justify-center',
          'bg-white rounded-lg shadow-md',
          'text-gray-700 hover:bg-gray-100',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'transition-colors'
        )}
        aria-label="打开菜单"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* 侧边栏 */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* 遮罩层（移动端和平板端） */}
      {sidebarOpen && (
        <div
          onClick={handleOverlayClick}
          className={clsx(
            'lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40',
            'transition-opacity duration-300'
          )}
          aria-hidden="true"
        />
      )}

      {/* 主内容区 */}
      <main 
        className="flex-1 overflow-y-auto w-full lg:w-auto lg:pl-64"
      >
        <div className="container mx-auto max-w-7xl p-4 md:p-6 pt-16 lg:pt-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

