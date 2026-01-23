'use client'

/**
 * ProjectList - Sidebar 项目列表组件
 * 
 * 功能：
 * 1. 显示项目列表（像文件目录）
 * 2. 可展开/折叠
 * 3. 点击项目跳转到项目详情
 */

import { useNavigate, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { useProjectList } from '@/hooks/useProjects'

interface ProjectListProps {
  onItemClick?: (href: string) => void // 点击项目项的回调
}

export function ProjectList({ onItemClick }: ProjectListProps = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const { data: projects = [], isLoading } = useProjectList()

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
    <div className="space-y-1">
      {/* 项目列表内容 - 直接显示，不需要展开/折叠 */}
      {isLoading ? (
        <div className="px-3 py-2 flex items-center gap-2">
          <LoadingSpinner />
          <span className="text-xs text-gray-500">加载中...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="px-3 py-2 text-xs text-gray-500">
          暂无项目
        </div>
      ) : (
        projects.map((project: any) => (
          <button
            key={project.id}
            onClick={() => handleProjectClick(project.id)}
            className={clsx(
              'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
              'min-h-[44px]', // 移动端触摸优化
              {
                'bg-primary-50 text-primary font-medium': currentProjectId === String(project.id),
                'text-gray-700 hover:bg-gray-100': currentProjectId !== String(project.id),
              }
            )}
            title={project.name}
            aria-current={currentProjectId === String(project.id) ? 'page' : undefined}
          >
            <FolderIcon />
            <span className="truncate">{project.name}</span>
          </button>
        ))
      )}
    </div>
  )
}

// 导出项目列表内容组件（不包含新建项目按钮）
export function ProjectListContent({ onItemClick }: ProjectListProps = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const { data: projects = [], isLoading } = useProjectList()

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
    <div className="space-y-1">
      {isLoading ? (
        <div className="px-3 py-2 flex items-center gap-2">
          <LoadingSpinner />
          <span className="text-xs text-gray-500">加载中...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="px-3 py-2 text-xs text-gray-500">
          暂无项目
        </div>
      ) : (
        projects.map((project: any) => (
          <button
            key={project.id}
            onClick={() => handleProjectClick(project.id)}
            className={clsx(
              'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
              'min-h-[44px]', // 移动端触摸优化
              {
                'bg-primary-50 text-primary font-medium': currentProjectId === String(project.id),
                'text-gray-700 hover:bg-gray-100': currentProjectId !== String(project.id),
              }
            )}
            title={project.name}
            aria-current={currentProjectId === String(project.id) ? 'page' : undefined}
          >
            <FolderIcon />
            <span className="truncate">{project.name}</span>
          </button>
        ))
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
      className="w-3 h-3 animate-spin text-gray-400"
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

