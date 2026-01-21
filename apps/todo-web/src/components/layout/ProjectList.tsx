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
import { useState, useEffect } from 'react'
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
  const [isExpanded, setIsExpanded] = useState(true)

  // 获取当前选中的项目 ID
  const currentProjectId = pathname?.match(/\/projects\/(\d+)/)?.[1]
  
  // 判断是否在项目相关页面（项目列表、项目详情、项目子页面等）
  const isInProjectPage = pathname?.startsWith('/projects') && pathname !== '/projects/new'
  
  // 只在首次进入项目页面时自动展开（如果之前没有保存过折叠状态）
  useEffect(() => {
    // 从 localStorage 读取保存的折叠状态
    const savedExpanded = localStorage.getItem('projectListExpanded')
    if (savedExpanded !== null) {
      setIsExpanded(savedExpanded === 'true')
    } else if (isInProjectPage) {
      // 如果没有保存过状态，且在项目页面，则自动展开
      setIsExpanded(true)
    }
  }, []) // 只在组件挂载时执行一次
  
  // 保存折叠状态到 localStorage
  useEffect(() => {
    localStorage.setItem('projectListExpanded', String(isExpanded))
  }, [isExpanded])

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

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
      {/* 项目列表标题 - 可折叠 */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleExpand}
          className={clsx(
            'flex-1 flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors',
            'min-h-[44px]', // 移动端触摸优化
            {
              'bg-blue-50 text-blue-600': isInProjectPage, // 父级别使用浅蓝色
              'text-gray-700 hover:bg-gray-100': !isInProjectPage,
            }
          )}
        >
          <div className="flex items-center gap-2">
            <ProjectsIcon />
            <span>项目列表</span>
          </div>
          <ChevronIcon isExpanded={isExpanded} />
        </button>
        
        {/* 新建项目按钮 */}
        <button
          onClick={handleCreateProject}
          className="px-2 py-2 text-primary hover:bg-primary-50 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="新建项目"
          aria-label="新建项目"
        >
          <PlusIcon />
        </button>
      </div>

      {/* 项目列表内容 */}
      {isExpanded && (
        <div className="ml-3 space-y-1">
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
                    'bg-primary-50 text-primary font-medium': currentProjectId === String(project.id), // 子项目使用主题色
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

function ChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <svg
      className={clsx('w-4 h-4 transition-transform', {
        'transform rotate-90': isExpanded,
      })}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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

