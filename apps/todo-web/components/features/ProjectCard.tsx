'use client'

/**
 * ProjectCard - 项目卡片组件
 * 
 * 状态：
 * 1. 默认（可点击）
 * 2. Hover（高亮）
 * 3. 加载中（禁用）
 * 4. 错误（显示错误信息）
 */

import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import type { Project } from '@/types'

export interface ProjectCardProps {
  project: Project
  className?: string
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const router = useRouter()
  
  const handleClick = () => {
    router.push(`/projects/${project.id}`)
  }
  
  return (
    <button
      onClick={handleClick}
      className={clsx(
        'w-full text-left',
        'bg-white rounded-lg shadow-sm border border-gray-200',
        'p-6 space-y-3',
        'hover:shadow-md hover:border-primary transition-all',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className
      )}
    >
      {/* 项目名称 */}
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
          {project.name}
        </h3>
        
        {/* 项目图标 */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
          <FolderIcon className="w-6 h-6 text-primary" />
        </div>
      </div>
      
      {/* Git 地址 */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <GitIcon className="w-4 h-4" />
        <span className="truncate">{project.git_url}</span>
      </div>
      
      {/* 底部信息 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <UserIcon className="w-4 h-4" />
          <span>{project.creator?.username || '未知'}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <ClockIcon className="w-4 h-4" />
          <span>{formatDate(project.created_at)}</span>
        </div>
      </div>
    </button>
  )
}

// ==================== 工具函数 ====================

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays} 天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`
  
  return date.toLocaleDateString('zh-CN')
}

// ==================== 图标组件 ====================

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )
}

function GitIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}



