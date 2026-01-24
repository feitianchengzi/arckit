'use client'

/**
 * TodoItem - 任务项组件
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { StatusBadge, StatusSelect, Avatar } from '@/components/ui'
import { TagList, PriorityBadge } from './'
import { parseTaskTags } from '@/lib/utils/tagUtils'
import type { Todo, TodoStatus, ProjectMember } from '@/types'

export interface TodoItemProps {
  todo: Todo
  projectId: string
  onStatusChange?: (todoId: number, newStatus: string) => void
  className?: string
  currentUserId?: number | null // 当前用户的 user_id
  canEdit?: boolean // 是否有权限编辑任务状态
  members?: ProjectMember[] // 项目成员列表
  canAssignAssignee?: boolean // 是否可以分配执行人（owner/admin/创建人）
  onUpdateAssignee?: (taskId: number, assigneeId: number | null) => Promise<void> // 更新执行人的回调
  canEditPriority?: boolean // 是否可以编辑优先级（owner/admin/创建人）
  onUpdatePriority?: (taskId: number, priority: number | null) => Promise<void> // 更新优先级的回调
}

export function TodoItem({ todo, projectId, onStatusChange, className, currentUserId, canEdit = false,   members = [], canAssignAssignee = false, onUpdateAssignee, canEditPriority = false, onUpdatePriority }: TodoItemProps) {
  // 判断是否是创建者或执行者
  const isCreator = currentUserId !== null && currentUserId !== undefined && todo.creatorId === currentUserId
  const isAssignee = currentUserId !== null && currentUserId !== undefined && todo.assigneeId === currentUserId
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false)
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false)
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
        'bg-white border border-gray-300',
        'p-3 space-y-2',
        'hover:shadow-md hover:border-primary transition-all cursor-pointer',
        className
      )}
    >
      {/* 头部：内容 + 状态/优先级 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-gray-900 truncate mb-1.5" title={todo.content}>
            {todo.content}
          </h3>
          
          {/* 标签和优先级 */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* 标签 - 始终显示 */}
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-xs text-gray-500 font-bold">
                <TagIcon className="w-3.5 h-3.5 text-gray-500" />
                标签
              </span>
              {parseTaskTags(todo.tags).length > 0 ? (
                <TagList projectId={projectId} tagsString={todo.tags} size="sm" />
              ) : (
                <span className="text-xs text-gray-400">无</span>
              )}
            </div>
            {/* 分隔符 */}
            <span className="text-gray-300">|</span>
            {/* 优先级 - 始终显示 */}
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-xs text-gray-500 font-bold">
                <PriorityIcon className="w-3.5 h-3.5 text-gray-500" />
                优先级
              </span>
              {canEditPriority && onUpdatePriority ? (
                <select
                  value={todo.priority !== null && todo.priority !== undefined ? todo.priority : ''}
                  onChange={async (e) => {
                    const value = e.target.value
                    try {
                      setIsUpdatingPriority(true)
                      const priority = value === '' ? null : Number(value)
                      await onUpdatePriority(todo.id, priority)
                    } catch (error) {
                      console.error('更新优先级失败:', error)
                    } finally {
                      setIsUpdatingPriority(false)
                    }
                  }}
                  disabled={isUpdatingPriority}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={clsx(
                    "px-2 py-0.5 text-xs border border-gray-300 rounded-md",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                    "disabled:bg-gray-100 disabled:cursor-not-allowed",
                    "bg-white text-gray-900",
                    isUpdatingPriority && "opacity-50"
                  )}
                >
                  <option value="">未设定</option>
                  <option value="0">🔴 最高</option>
                  <option value="1">🟠 高</option>
                  <option value="2">🟡 中</option>
                  <option value="3">🟢 低</option>
                </select>
              ) : todo.priority !== null && todo.priority !== undefined ? (
                <PriorityBadge value={todo.priority} size="sm" />
              ) : (
                <span className="text-xs text-gray-400">未设定</span>
              )}
            </div>
          </div>
        </div>
        
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
      
      {/* 底部信息：创建人、执行人、时间、子任务 */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-5 flex-wrap">
          {/* 创建者 */}
          {todo.creator && (
            <div className="flex items-center gap-0.5 text-xs text-gray-600 whitespace-nowrap">
              <span className="text-gray-500 font-bold">创建：</span>
              <Avatar user={todo.creator} size="xs" />
              <span className={clsx('font-medium', isCreator && 'text-blue-600')}>
                {todo.creator.username}
              </span>
            </div>
          )}
          
          {/* 执行者 - 始终显示 */}
          <div className="flex items-center gap-0.5 text-xs text-gray-600 whitespace-nowrap">
            <span className="text-gray-500 font-bold">执行：</span>
            {canAssignAssignee && onUpdateAssignee && members.length > 0 ? (
              <select
                value={todo.assigneeId || ''}
                onChange={async (e) => {
                  const value = e.target.value
                  
                  try {
                    setIsUpdatingAssignee(true)
                    const assigneeId = value === '' ? null : Number(value)
                    await onUpdateAssignee(todo.id, assigneeId)
                  } catch (error) {
                    console.error('更新执行人失败:', error)
                  } finally {
                    setIsUpdatingAssignee(false)
                  }
                }}
                disabled={isUpdatingAssignee}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className={clsx(
                  "px-2 py-0.5 text-xs border border-gray-300 rounded-md",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                  "disabled:bg-gray-100 disabled:cursor-not-allowed",
                  "bg-white text-gray-900",
                  isUpdatingAssignee && "opacity-50"
                )}
              >
                <option value="">未选定</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.username || member.user?.username || `用户 ${member.user_id}`}
                  </option>
                ))}
              </select>
            ) : todo.assignee ? (
              <>
                <Avatar user={todo.assignee} size="xs" />
                <span className={clsx('font-medium', isAssignee && 'text-blue-600')}>
                  {todo.assignee.username}
                </span>
              </>
            ) : (
              <span className="text-gray-400">未选定</span>
            )}
          </div>
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

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  )
}

function PriorityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  )
}



