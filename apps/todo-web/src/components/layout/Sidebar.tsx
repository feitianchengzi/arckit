'use client'

/**
 * Sidebar - 侧边栏组件
 * 
 * 功能：
 * 1. 显示用户头像和信息
 * 2. 导航菜单
 * 3. 设置和退出
 * 4. 响应式：桌面固定，移动端可折叠（抽屉菜单）
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { useAuthStore } from '@/store/authStore'
import { ProjectList } from './ProjectList'

interface SidebarProps {
  className?: string
  isOpen?: boolean // 移动端/平板端是否打开
  onClose?: () => void // 关闭回调
}

export function Sidebar({ className, isOpen = true, onClose }: SidebarProps) {
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
  
  // 移动端/平板端：点击导航项后自动关闭侧边栏
  const handleNavClick = (href: string) => {
    navigate(href)
    // 移动端/平板端点击后关闭侧边栏
    if (window.innerWidth < 1024 && onClose) {
      onClose()
    }
  }
  
  return (
    <aside
      className={clsx(
        // 基础样式
        'flex flex-col h-screen bg-white border-r border-gray-200',
        'w-64 z-50',
        // 桌面端：静态定位，始终显示
        'lg:static lg:translate-x-0 lg:block',
        // 移动端/平板端：固定定位，支持滑动动画
        'fixed top-0 left-0',
        'transform transition-transform duration-300 ease-in-out',
        {
          // 移动端/平板端：根据 isOpen 状态控制显示/隐藏（桌面端忽略此状态）
          '-translate-x-full lg:translate-x-0': !isOpen,
          'translate-x-0': isOpen,
        },
        className
      )}
      aria-label="主导航"
    >
      {/* 移动端/平板端：关闭按钮 */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">待办管理系统</h2>
        <button
          onClick={onClose}
          className={clsx(
            'w-10 h-10 flex items-center justify-center',
            'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
            'rounded-lg transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
          )}
          aria-label="关闭菜单"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* 用户信息区域 */}
      <div className={clsx(
        'p-6 border-b border-gray-200',
        'lg:block',
        { 'hidden lg:block': !isOpen } // 移动端关闭时隐藏，桌面端始终显示
      )}>
        {/* 桌面端：系统标题 */}
        <button
          onClick={() => handleNavClick('/projects')}
          className="hidden lg:block w-full mb-4 text-left"
        >
          <h2 className="text-lg font-bold text-gray-900 hover:text-primary transition-colors">
            待办管理系统
          </h2>
        </button>
        
        <div className="flex items-center gap-3">
          {/* 头像（可点击跳转到设置） */}
          <button
            onClick={() => handleNavClick('/settings')}
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
      <nav className={clsx(
        'flex-1 p-4 space-y-1 overflow-y-auto',
        'lg:block',
        { 'hidden lg:block': !isOpen } // 移动端关闭时隐藏，桌面端始终显示
      )}>
        {/* 项目列表（可展开） */}
        <ProjectList onItemClick={handleNavClick} />
        
        {/* 我的待办 */}
        <NavItem
          icon={<TasksIcon />}
          label="我的待办"
          href="/tasks"
          onClick={handleNavClick}
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
  onClick?: (href: string) => void // 点击回调
}

function NavItem({ icon, label, href, exact = false, onClick }: NavItemProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  
  // 判断是否选中：精确匹配或路径前缀匹配
  const isActive = exact 
    ? pathname === href 
    : pathname?.startsWith(href) || false
  
  const handleClick = () => {
    if (onClick) {
      onClick(href)
    } else {
      navigate(href)
    }
  }
  
  return (
    <button
      onClick={handleClick}
      className={clsx(
        'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors',
        'min-h-[44px]', // 移动端触摸优化
        {
          'bg-primary-50 text-primary font-medium': isActive,
          'text-gray-700 hover:bg-gray-100': !isActive,
        }
      )}
      aria-current={isActive ? 'page' : undefined}
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

