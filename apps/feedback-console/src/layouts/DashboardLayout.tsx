import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Avatar } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import clsx from 'clsx'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useAuthStore((state) => state.user)

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
    <div className="relative flex h-[100dvh] overflow-hidden bg-surface transition-colors">
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-divider bg-surface-elevated/95 px-3 backdrop-blur-xl lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className={clsx(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            'text-foreground hover:bg-surface-hover',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'transition-colors'
          )}
          aria-label="打开菜单"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">反馈管理台</p>
          <p className="truncate text-[11px] text-foreground-tertiary">查看、回复并处理用户反馈</p>
        </div>

        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex h-11 min-w-0 max-w-[42%] items-center gap-2 rounded-xl px-2 text-left transition-colors hover:bg-surface-hover"
          aria-label={`当前账户：${user?.username || '未登录'}，打开账户菜单`}
        >
          <Avatar user={user} size="sm" showTooltip={false} />
          <span className="truncate text-xs font-medium text-foreground-secondary">{user?.username || '账户'}</span>
        </button>
      </header>

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
            'fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] lg:hidden',
            'transition-opacity duration-300'
          )}
          aria-hidden="true"
        />
      )}

      {/* 主内容区 */}
      <main className="h-full w-full flex-1 overflow-y-auto lg:w-auto lg:pl-[336px]">
        <div className="container mx-auto max-w-[1600px] px-3 pb-3 pt-[4.25rem] sm:px-4 sm:pb-4 md:px-6 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
