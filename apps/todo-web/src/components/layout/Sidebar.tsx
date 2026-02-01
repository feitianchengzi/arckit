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
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { useQueryClient } from '@tanstack/react-query'
import { ProjectListContent } from './ProjectList'
import { OrganizationList } from './OrganizationList'
import { CreateOrganizationDialog } from '../features/CreateOrganizationDialog'
import { CreateProjectDialog } from '../features/CreateProjectDialog'
import { Avatar } from '@/components/ui'
import { useOrganizationList } from '@/hooks/useOrganizations'
import { useProjectList } from '@/hooks/useProjects'

import { useOrganizationStore } from '@/store/organizationStore'

interface SidebarProps {
  className?: string
  isOpen?: boolean // 移动端/平板端是否打开
  onClose?: () => void // 关闭回调
}

export function Sidebar({ className, isOpen = true, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const storeUser = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { theme, toggleTheme } = useThemeStore()
  const queryClient = useQueryClient()
  const { data: organizations = [] } = useOrganizationList()
  const { currentOrganizationId, setCurrentOrganizationId } = useOrganizationStore()

  // 使用 state 来避免 hydration 不匹配
  // 服务端和客户端首次渲染时都显示默认值，客户端 hydration 后再更新
  const [user, setUser] = useState<typeof storeUser>(null)
  const [mounted, setMounted] = useState(false)
  
  // 组织相关状态
  const [showCreateOrgDialog, setShowCreateOrgDialog] = useState(false)
  // 项目相关状态
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false)
  
  useEffect(() => {
    console.log('[Sidebar] 用户信息更新:', storeUser)
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

  const pathname = location.pathname
  const { data: projects = [] } = useProjectList(currentOrganizationId)
  const hasOrganizations = organizations.length > 0
  const selectedOrganization = currentOrganizationId
    ? organizations.find((organization) => organization.id === currentOrganizationId)
    : null
  const isPersonalProjects = !currentOrganizationId && pathname.startsWith('/projects')
  const headerTitle = selectedOrganization?.name ?? (isPersonalProjects ? '个人项目' : '项目')
  const projectCount = projects.length

  // 移动端/平板端：点击导航项后自动关闭侧边栏
  const handleNavClick = (href: string) => {
    navigate(href)
    // 移动端/平板端点击后关闭侧边栏
    if (window.innerWidth < 1024 && onClose) {
      onClose()
    }
  }
  
  const handleCreateOrgSuccess = () => {
    // 创建组织成功后刷新组织列表
    console.log('组织创建成功');
    // 使组织列表查询失效，触发重新获取
    queryClient.invalidateQueries({ queryKey: ['organizations'] });
  }
  
  const handleCreateProjectSuccess = () => {
    // 创建项目成功后刷新项目列表
    console.log('项目创建成功');
    // 使项目列表查询失效，触发重新获取
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  }
  
  return (
    <aside
      className={clsx(
        // 基础样式 - 使用 relative 定位，类似 Android RelativeLayout
        'relative bg-surface-elevated border-r border-border flex flex-col',
        'w-[320px] z-50',
        'transition-colors',
        // 桌面端：固定定位，不随内容滚动
        'lg:fixed lg:top-0 lg:left-0 lg:translate-x-0 lg:block',
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
      style={{ height: '100vh', maxHeight: '100vh' }}
    >

      {/* 移动端/平板端：关闭按钮 */}
      <div className="lg:hidden absolute top-0 right-0 p-4 z-20">
        <button
          onClick={onClose}
          className={clsx(
            'w-10 h-10 flex items-center justify-center',
            'text-foreground-secondary hover:text-foreground',
            'hover:bg-surface-hover',
            'active:bg-surface-active',
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

      <div className="flex flex-1 min-h-0 h-full">
        <div className="flex w-20 flex-col border-r border-border min-h-0 h-full bg-surface-elevated">
          <div className="flex-1 overflow-y-auto py-3">
            <div className="flex items-center justify-center pb-3">
              <div className="flex h-9 w-9 items-center justify-center text-foreground-secondary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M5 7v11a1 1 0 001 1h12a1 1 0 001-1V7M7 7V5a1 1 0 011-1h8a1 1 0 011 1v2" />
                </svg>
              </div>
            </div>
            <div className="border-b border-border" />
            <OrganizationList
              onItemClick={handleNavClick}
              selectedOrganizationId={currentOrganizationId}
              onSelectOrganization={setCurrentOrganizationId}
            />
          </div>
          <div className="mt-auto space-y-2">
            <div className="border-t border-border">
              <div className="w-full flex flex-col items-center gap-3 px-3 pt-3">
                <button
                  onClick={() => handleNavClick('/settings')}
                  className="group relative flex h-11 w-11 items-center justify-center rounded-xl bg-gray-200 dark:bg-[#2A2A2A] text-foreground-secondary hover:bg-surface-hover hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  title="设置"
                >
                  <Avatar
                    user={user}
                    size="sm"
                    showTooltip={false}
                  />
                  <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-surface-elevated px-3 py-1 text-xs font-semibold text-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    {displayUsername}
                  </span>
                </button>
                <button
                  onClick={toggleTheme}
                  className={clsx(
                    'flex h-11 w-11 items-center justify-center rounded-xl',
                    'text-foreground-secondary bg-gray-200 dark:bg-[#2A2A2A] hover:bg-surface-hover hover:text-foreground transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                  )}
                  title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
                  aria-label="切换深色模式"
                >
                  {theme === 'dark' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="border-t border-border flex justify-center pb-3 pt-3">
              <button
                onClick={() => setShowCreateOrgDialog(true)}
                className={clsx(
                  'flex h-11 w-11 items-center justify-center rounded-xl',
                  'text-foreground-secondary bg-gray-200 dark:bg-[#2A2A2A] hover:bg-surface-hover hover:text-foreground transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  'font-semibold'
                )}
                title="新建组织"
                aria-label="新建组织"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="flex w-64 flex-col min-h-0 bg-surface dark:bg-[#202020]">
          <div className="px-4 pt-4 pb-3">
            <div className="text-base font-semibold text-foreground">{headerTitle}</div>
            <div className="text-xs text-foreground-secondary">{projectCount} 个项目</div>
          </div>
          <div className="px-4 pb-3">
            <button
              onClick={() => setShowCreateProjectDialog(true)}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary dark:bg-[#2B7FFF] py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark dark:hover:bg-[#2570E6] focus:outline-none"
              title="新增项目"
              aria-label="新增项目"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增项目
            </button>
          </div>
          <div className="border-t border-border" />
          {!hasOrganizations && (
            <div className="px-4 py-3 text-xs text-foreground-secondary">
              请先加入或创建一个组织
            </div>
          )}
          {hasOrganizations && !currentOrganizationId && !isPersonalProjects && (
            <div className="px-4 py-3 text-xs text-foreground-secondary">
              请选择组织后创建项目
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <ProjectListContent onItemClick={handleNavClick} organizationId={currentOrganizationId} />
          </div>
          {currentOrganizationId && selectedOrganization && (
            <>
              <div className="border-t border-border" />
              <div className="px-4 py-3">
                <button
                  onClick={() => handleNavClick(`/organizations/${currentOrganizationId}`)}
                  className="w-full flex items-center justify-center rounded-lg bg-surface-elevated py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  title="组织设置"
                  aria-label="组织设置"
                >
                  组织设置
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* 新建组织对话框 */}
      <CreateOrganizationDialog
        open={showCreateOrgDialog}
        onClose={() => setShowCreateOrgDialog(false)}
        onSuccess={handleCreateOrgSuccess}
      />
      
      {/* 新建项目对话框 */}
      <CreateProjectDialog
        open={showCreateProjectDialog}
        onClose={() => setShowCreateProjectDialog(false)}
        onSuccess={handleCreateProjectSuccess}
        selectedOrganizationId={currentOrganizationId}
      />
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
          'bg-primary-light text-primary font-medium': isActive,
          'text-foreground hover:bg-surface-hover': !isActive,
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

function LogoIcon() {
  return (
    <svg 
      className="w-8 h-8 text-primary" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
      strokeWidth={2}
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" 
      />
    </svg>
  )
}
