'use client'

/**
 * TodoItem - 任务项组件
 */

import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Todo } from '@/types'

export interface TodoItemProps {
  todo: Todo
  projectId: string
  onStatusChange?: (todoId: number, newStatus: string) => void
  className?: string
}

export function TodoItem({ todo, projectId, onStatusChange, className }: TodoItemProps) {
  const router = useRouter()
  
  const handleClick = () => {
    router.push(`/projects/${projectId}/tasks/${todo.id}`)
  }
  
  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation() // 阻止冒泡，避免触发 handleClick
    
    if (onStatusChange) {
      // 这里可以扩展为一个下拉菜单，暂时简单处理
      const nextStatus = getNextStatus(todo.status)
      onStatusChange(todo.id, nextStatus)
    }
  }
  
  return (
    <div
      onClick={handleClick}
      className={clsx(
        'group',
        'bg-white rounded-lg border border-gray-200',
        'p-4 space-y-3',
        'hover:shadow-md hover:border-primary transition-all cursor-pointer',
        className
      )}
    >
      {/* 头部：标题 + 状态 */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="flex-1 text-base font-medium text-gray-900 line-clamp-2">
          {todo.title}
        </h3>
        
        <div onClick={handleStatusClick}>
          <StatusBadge status={todo.status} size="sm" />
        </div>
      </div>
      
      {/* 内容 */}
      {todo.content && todo.content !== todo.title && (
        <p className="text-sm text-gray-600 line-clamp-2">
          {todo.content}
        </p>
      )}
      
      {/* 底部信息 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          {/* 创建者 */}
          {todo.creator && (
            <div className="flex items-center gap-1">
              <UserIcon className="w-4 h-4" />
              <span>{todo.creator.username}</span>
            </div>
          )}
          
          {/* 执行者 */}
          {todo.assignee && (
            <div className="flex items-center gap-1">
              <AssignIcon className="w-4 h-4" />
              <span>{todo.assignee.username}</span>
            </div>
          )}
        </div>
        
        {/* 创建时间 */}
        <div className="flex items-center gap-1">
          <ClockIcon className="w-4 h-4" />
          <span>{formatDate(todo.createdAt)}</span>
        </div>
      </div>
      
      {/* 子任务指示器 */}
      {todo.children && todo.children.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-primary">
          <SubtaskIcon className="w-4 h-4" />
          <span>{todo.children.length} 个子任务</span>
        </div>
      )}
    </div>
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
  
  return date.toLocaleDateString('zh-CN')
}

function getNextStatus(currentStatus: string): string {
  const statusFlow = ['PENDING', 'IN_PROGRESS', 'COMPLETED']
  const currentIndex = statusFlow.indexOf(currentStatus)
  
  if (currentIndex === -1 || currentIndex === statusFlow.length - 1) {
    return statusFlow[0]
  }
  
  return statusFlow[currentIndex + 1]
}

// ==================== 图标组件 ====================

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function AssignIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

function SubtaskIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  )
}



