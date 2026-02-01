'use client'

/**
 * ProjectList - Sidebar 项目列表组件
 * 
 * 功能：
 * 1. 显示项目列表（像文件目录）
 * 2. 可展开/折叠
 * 3. 点击项目跳转到项目详情
 */

import { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { useProjectList } from '@/hooks/useProjects'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/Tooltip'

interface ProjectListProps {
  onItemClick?: (href: string) => void // 点击项目项的回调
  organizationId?: number | null
}

export function ProjectList({ onItemClick, organizationId }: ProjectListProps = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const { data: projects = [], isLoading } = useProjectList(organizationId)
  const user = useAuthStore((state) => state.user)

  // Sort projects: my projects first
  const sortedProjects = useMemo(() => {
    if (!projects) return []
    return [...projects].sort((a, b) => {
      const aIsMine = user?.id && a.creator_id === user.id
      const bIsMine = user?.id && b.creator_id === user.id
      
      if (aIsMine && !bIsMine) return -1
      if (!aIsMine && bIsMine) return 1
      return 0
    })
  }, [projects, user?.id])

  // 获取当前选中的项目 ID
  const currentProjectId = pathname?.match(/\/projects\/(\d+)/)?.[1]

  const handleCreateProject = () => {
    const href = '/projects/new'
    if (onItemClick) {
      onItemClick(href)
    } else {
      navigate(href)
    }
  }

  const handleProjectClick = (projectId: number) => {
    const href = `/projects/${projectId}`
    if (onItemClick) {
      onItemClick(href)
    } else {
      navigate(href)
    }
  }

  return (
    <div className="space-y-2">
      {/* 项目列表内容 - 直接显示，不需要展开/折叠 */}
      {isLoading ? (
        <div className="px-3 py-2 flex items-center gap-2">
          <LoadingSpinner />
          <span className="text-xs text-foreground-secondary">加载中...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="px-3 py-2 text-xs text-foreground-secondary">
          暂无项目
        </div>
      ) : (
        sortedProjects.map((project: any) => {
          const isActive = currentProjectId === String(project.id)

          // 查找创建者信息：优先使用 creator 字段，如果没有，则从 members 中匹配 creator_id
          const creator = project.creator || (() => {
            const member = project.members?.find((m: any) => m.user_id === project.creator_id)
            return member ? (member.user || { username: member.username, avatar: member.avatar }) : null
          })()

          return (
            <button
              key={project.id}
              onClick={() => handleProjectClick(project.id)}
              className={clsx(
                'w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors group',
                'min-h-[44px] border',
                'focus:outline-none',
                isActive 
                  ? 'bg-primary-light dark:!bg-[#212B3B] border-[#2E5AF1] dark:border-[#23467E]' 
                  : 'bg-surface-elevated dark:bg-[#2A2A2A] border-transparent hover:bg-surface-hover dark:hover:bg-[#3A3A3A]'
              )}
              title={project.name}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={clsx(
                  'h-9 w-9 flex items-center justify-center rounded-lg transition-colors',
                  isActive 
                    ? 'bg-[#b9c6ee] dark:bg-[#233E69] text-[#51A2FF]' 
                    : 'bg-[#e4e6eb] dark:bg-[#333333] text-foreground-secondary group-hover:bg-[#d0d3d8] dark:group-hover:bg-[#3e3e3e]'
                )}
              >
                <FolderIcon />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-sm font-semibold text-foreground">{project.name}</div>
                <div className={clsx('text-xs', isActive ? 'text-foreground-secondary' : 'text-foreground-tertiary')}>
                  {isActive ? '当前项目' : '点击查看'}
                </div>
              </div>
              
              {/* Creator Avatar */}
              <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <Tooltip 
                  content={
                    <div className="flex items-center gap-3 whitespace-nowrap px-1 py-0.5">
                      <Avatar user={creator} size="sm" />
                      <span className="text-sm font-medium">创建人：{creator?.username || '未知'}</span>
                    </div>
                  }
                  position="right"
                >
                  <div>
                    <Avatar 
                      user={creator} 
                      size="xs" 
                      showTooltip={false} 
                    />
                  </div>
                </Tooltip>
              </div>
            </button>
          )
        })
      )}
    </div>
  )
}

// 导出项目列表内容组件（不包含新建项目按钮）
export function ProjectListContent({ onItemClick, organizationId }: ProjectListProps = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const { data: projects = [], isLoading } = useProjectList(organizationId)
  const user = useAuthStore((state) => state.user)

  // Sort projects: my projects first
  const sortedProjects = useMemo(() => {
    if (!projects) return []
    return [...projects].sort((a, b) => {
      const aIsMine = user?.id && a.creator_id === user.id
      const bIsMine = user?.id && b.creator_id === user.id
      
      if (aIsMine && !bIsMine) return -1
      if (!aIsMine && bIsMine) return 1
      return 0
    })
  }, [projects, user?.id])

  // 获取当前选中的项目 ID
  const currentProjectId = pathname?.match(/\/projects\/(\d+)/)?.[1]

  const handleProjectClick = (projectId: number) => {
    const href = `/projects/${projectId}`
    if (onItemClick) {
      onItemClick(href)
    } else {
      navigate(href)
    }
  }

  return (
    <div className="space-y-2">
      {isLoading ? (
        <div className="px-3 py-2 flex items-center gap-2">
          <LoadingSpinner />
          <span className="text-xs text-foreground-secondary">加载中...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="px-3 py-2 text-xs text-foreground-secondary">
          暂无项目
        </div>
      ) : (
        sortedProjects.map((project: any) => {
          const isActive = currentProjectId === String(project.id)

          // 查找创建者信息：优先使用 creator 字段，如果没有，则从 members 中匹配 creator_id
          const creator = project.creator || (() => {
            const member = project.members?.find((m: any) => m.user_id === project.creator_id)
            return member ? (member.user || { username: member.username, avatar: member.avatar }) : null
          })()

          return (
            <button
              key={project.id}
              onClick={() => handleProjectClick(project.id)}
              className={clsx(
                'w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors group',
                'min-h-[44px] border',
                'focus:outline-none',
                isActive 
                  ? 'bg-primary-light dark:!bg-[#212B3B] border-[#2E5AF1] dark:border-[#23467E]' 
                  : 'bg-surface-elevated dark:bg-[#2A2A2A] border-transparent hover:bg-surface-hover dark:hover:bg-[#3A3A3A]'
              )}
              title={project.name}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={clsx(
                  'h-9 w-9 flex items-center justify-center rounded-lg transition-colors',
                  isActive 
                    ? 'bg-[#b9c6ee] dark:bg-[#233E69] text-[#51A2FF]' 
                    : 'bg-[#e4e6eb] dark:bg-[#333333] text-foreground-secondary group-hover:bg-[#d0d3d8] dark:group-hover:bg-[#3e3e3e]'
                )}
              >
                <FolderIcon />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-sm font-semibold text-foreground">{project.name}</div>
                <div className={clsx('text-xs', isActive ? 'text-foreground-secondary' : 'text-foreground-tertiary')}>
                  {isActive ? '当前项目' : '点击查看'}
                </div>
              </div>

              {/* Creator Avatar */}
              <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <Tooltip 
                  content={
                    <div className="flex items-center gap-3 whitespace-nowrap px-1 py-0.5">
                      <Avatar user={creator} size="sm" />
                      <span className="text-sm font-medium">创建人：{creator?.username || '未知'}</span>
                    </div>
                  }
                  position="right"
                >
                  <div>
                    <Avatar 
                      user={creator} 
                      size="xs" 
                      showTooltip={false} 
                    />
                  </div>
                </Tooltip>
              </div>
            </button>
          )
        })
      )}
    </div>
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

function FolderIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <svg
      className="w-3 h-3 animate-spin text-foreground-tertiary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
