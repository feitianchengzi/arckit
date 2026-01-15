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

import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { useAuthStore } from '@/store/authStore'
import { ProjectList } from './ProjectList'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const navigate = useNavigate()
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
    navigate('/login')
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
        {/* 系统标题（可点击跳转到主页） */}
        <button
          onClick={() => navigate('/projects')}
          className="w-full mb-4 text-left"
        >
          <h2 className="text-lg font-bold text-gray-900 hover:text-primary transition-colors">
            待办管理系统
          </h2>
        </button>
        
        <div className="flex items-center gap-3">
          {/* 头像（可点击跳转到设置） */}
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold hover:bg-primary-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            title="设置"
          >
            {userInitial}
          </button>
          
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
        {/* 项目列表（可展开） */}
        <ProjectList />
        
        {/* 我的任务 */}
        <NavItem
          icon={<TasksIcon />}
          label="我的任务"
          href="/tasks"
        />
      </nav>
      
    </aside>
  )
}

// ==================== 子组件 ====================

interface NavItemProps {
  icon: React.ReactNode
  label: string
  href: string
  exact?: boolean // 是否精确匹配（默认 false，匹配路径前缀）
}

function NavItem({ icon, label, href, exact = false }: NavItemProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  
  // 判断是否选中：精确匹配或路径前缀匹配
  const isActive = exact 
    ? pathname === href 
    : pathname?.startsWith(href) || false
  
  return (
    <button
      onClick={() => navigate(href)}
      className={clsx(
        'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors',
        {
          'bg-primary-50 text-primary font-medium': isActive,
          'text-gray-700 hover:bg-gray-100': !isActive,
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

