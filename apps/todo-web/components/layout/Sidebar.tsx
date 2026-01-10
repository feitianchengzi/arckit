'use client'

/**
 * Sidebar - 侧边栏组件
 * 
 * 功能：
 * 1. 显示用户头像和信息
 * 2. 导航菜单
 * 3. 设置和退出
 * 4. 响应式：桌面固定，移动端可折叠
 */

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { useAuthStore } from '@/store/authStore'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter()
  const storeUser = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  
  // 使用 state 来避免 hydration 不匹配
  // 服务端和客户端首次渲染时都显示默认值，客户端 hydration 后再更新
  const [user, setUser] = useState<typeof storeUser>(null)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    setUser(storeUser)
  }, [storeUser])
  
  const handleLogout = () => {
    logout()
    router.push('/login')
  }
  
  // 获取用户名字母（避免 hydration 不匹配）
  const userInitial = mounted && user?.username 
    ? user.username.charAt(0).toUpperCase() 
    : 'U'
  
  const displayUsername = mounted && user?.username 
    ? user.username 
    : '未登录'
  
  return (
    <aside
      className={clsx(
        'flex flex-col h-screen bg-white border-r border-gray-200',
        'w-64', // 固定宽度
        className
      )}
    >
      {/* 用户信息区域 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {/* 头像 */}
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
            {userInitial}
          </div>
          
          {/* 用户名 */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {displayUsername}
            </p>
            <p className="text-xs text-gray-500">
              开发者
            </p>
          </div>
        </div>
      </div>
      
      {/* 导航菜单 */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavItem
          icon={<ProjectsIcon />}
          label="项目列表"
          href="/projects"
          active={true}
        />
        
        <NavItem
          icon={<TasksIcon />}
          label="我的任务"
          href="/tasks"
        />
      </nav>
      
      {/* 底部操作区域 */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={() => router.push('/settings')}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <SettingsIcon />
          <span>设置</span>
        </button>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-error hover:bg-error-light rounded-md transition-colors"
        >
          <LogoutIcon />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  )
}

// ==================== 子组件 ====================

interface NavItemProps {
  icon: React.ReactNode
  label: string
  href: string
  active?: boolean
}

function NavItem({ icon, label, href, active = false }: NavItemProps) {
  const router = useRouter()
  
  return (
    <button
      onClick={() => router.push(href)}
      className={clsx(
        'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors',
        {
          'bg-primary-50 text-primary font-medium': active,
          'text-gray-700 hover:bg-gray-100': !active,
        }
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

// ==================== 图标组件 ====================

function ProjectsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )
}

function TasksIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}
