'use client'

/**
 * ProjectList - Sidebar 项目列表组件
 * 
 * 功能：
 * 1. 显示项目列表（像文件目录）
 * 2. 可展开/折叠
 * 3. 点击项目跳转到项目详情
 */

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import clsx from 'clsx'
import { useProjectList } from '@/hooks/useProjects'

export function ProjectList() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: projects = [], isLoading } = useProjectList()
  const [isExpanded, setIsExpanded] = useState(true)

  // 获取当前选中的项目 ID
  const currentProjectId = pathname?.match(/\/projects\/(\d+)/)?.[1]

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const handleCreateProject = () => {
    router.push('/projects/new')
  }

  return (
    <div className="space-y-1">
      {/* 项目列表标题 - 可折叠 */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleExpand}
          className="flex-1 flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
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
          className="px-2 py-2 text-primary hover:bg-primary-50 rounded-md transition-colors"
          title="新建项目"
        >
          <PlusIcon />
        </button>
      </div>

      {/* 项目列表内容 */}
      {isExpanded && (
        <div className="ml-3 space-y-1">
          {isLoading ? (
            <div className="px-3 py-2 text-xs text-gray-500">
              加载中...
            </div>
          ) : projects.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500">
              暂无项目
            </div>
          ) : (
            projects.map((project: any) => (
              <button
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                  {
                    'bg-primary-50 text-primary font-medium': currentProjectId === String(project.id),
                    'text-gray-700 hover:bg-gray-100': currentProjectId !== String(project.id),
                  }
                )}
                title={project.name}
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

