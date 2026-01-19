'use client'

/**
 * TodoItem - 任务项组件
 */

import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { StatusBadge, StatusSelect } from '@/components/ui'
import type { Todo, TodoStatus } from '@/types'

export interface TodoItemProps {
  todo: Todo
  projectId: string
  onStatusChange?: (todoId: number, newStatus: string) => void
  className?: string
  currentUserId?: number | null // 当前用户的 user_id
  canEdit?: boolean // 是否有权限编辑任务状态
}

export function TodoItem({ todo, projectId, onStatusChange, className, currentUserId, canEdit = false }: TodoItemProps) {
  // 判断是否是创建者或执行者
  const isCreator = currentUserId !== null && currentUserId !== undefined && todo.creatorId === currentUserId
  const isAssignee = currentUserId !== null && currentUserId !== undefined && todo.assigneeId === currentUserId
  const navigate = useNavigate()
  
  const handleClick = () => {
    navigate(`/projects/${projectId}/tasks/${todo.id}`)
  }
  
  const handleStatusChange = (newStatus: TodoStatus) => {
    if (onStatusChange) {
      onStatusChange(todo.id, newStatus)
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
      {/* 头部：内容 + 状态 */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex-1 text-base font-medium text-gray-900 truncate" title={todo.content}>
          {todo.content}
        </h3>
        
        <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
          {canEdit ? (
            <StatusSelect
              value={todo.status}
              onChange={handleStatusChange}
              size="sm"
            />
          ) : (
            <StatusBadge status={todo.status} size="sm" />
          )}
        </div>
      </div>
      
      {/* 底部信息：标识图标 + 创建人、执行人、时间、子任务 */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {/* 标识图标：我是创建人或执行人 */}
          {(isCreator || isAssignee) && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {isCreator && (
                <CreatorBadgeIcon className="w-3.5 h-3.5 text-blue-500" title="我创建的" />
              )}
              {isAssignee && (
                <AssigneeBadgeIcon className="w-3.5 h-3.5 text-orange-500" title="我负责的" />
              )}
            </div>
          )}
          
          {/* 创建者 */}
          {todo.creator && (
            <div className="flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-600 whitespace-nowrap">
                <span className="text-gray-500">创建：</span>
                <span className={clsx('font-medium', isCreator && 'text-blue-600')}>
                  {todo.creator.username}
                </span>
              </span>
            </div>
          )}
          
          {/* 执行者 - 只在有执行人时显示 */}
          {todo.assignee && (
            <div className="flex items-center gap-1.5">
              <AssignIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-600 whitespace-nowrap">
                <span className="text-gray-500">执行：</span>
                <span className={clsx('font-medium', isAssignee && 'text-orange-600')}>
                  {todo.assignee.username}
                </span>
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* 子任务指示器 */}
          {todo.children && todo.children.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <SubtaskIcon className="w-3.5 h-3.5" />
              <span>{todo.children.length} 个子待办</span>
            </div>
          )}
          
          {/* 创建时间 */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <ClockIcon className="w-3.5 h-3.5" />
            <span>{formatDate(todo.createdAt)}</span>
          </div>
        </div>
      </div>
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

function CreatorBadgeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function AssigneeBadgeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}



