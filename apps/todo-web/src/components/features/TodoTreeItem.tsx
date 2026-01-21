'use client'

/**
 * TodoTreeItem - 树形任务项组件
 * 支持递归嵌套展示子任务，类似 Reddit 的板块效果
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { StatusBadge, StatusSelect } from '@/components/ui'
import { TagList, PriorityBadge } from './'
import type { Todo, TodoStatus } from '@/types'
import { TodoItem } from './TodoItem'

export interface TodoTreeItemProps {
  todo: Todo
  projectId: string
  onStatusChange?: (todoId: number, newStatus: string) => void
  className?: string
  currentUserId?: number | null
  canEdit?: boolean
  depth?: number // 嵌套深度，用于缩进
  isLast?: boolean // 是否是最后一个（用于连接线样式）
}

export function TodoTreeItem({
  todo,
  projectId,
  onStatusChange,
  className,
  currentUserId,
  canEdit = false,
  depth = 0,
  isLast = false,
}: TodoTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true) // 默认展开
  const navigate = useNavigate()
  
  // 是否有子任务
  const hasChildren = todo.children && todo.children.length > 0
  
  // 最大深度限制（避免过深的嵌套）
  const MAX_DEPTH = 5
  
  // 计算背景色渐变（每层逐渐变浅）
  const getBackgroundColor = (depth: number): string => {
    const baseColors = [
      'bg-white',           // 0层：白色
      'bg-gray-50',        // 1层：浅灰
      'bg-gray-100/50',    // 2层：更浅灰
      'bg-blue-50/30',     // 3层：浅蓝
      'bg-blue-100/20',    // 4层：更浅蓝
    ]
    return baseColors[Math.min(depth, MAX_DEPTH - 1)] || baseColors[baseColors.length - 1]
  }
  
  const backgroundColor = getBackgroundColor(depth)
  
  // 点击展开/折叠
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }
  
  // 点击任务项跳转到详情
  const handleClick = () => {
    navigate(`/projects/${projectId}/tasks/${todo.id}`)
  }
  
  // 状态变更处理
  const handleStatusChange = (newStatus: TodoStatus) => {
    if (onStatusChange) {
      onStatusChange(todo.id, newStatus)
    }
  }
  
  // 如果深度过深，使用普通 TodoItem 展示（避免嵌套过深）
  if (depth >= MAX_DEPTH) {
    return (
      <TodoItem
        todo={todo}
        projectId={projectId}
        onStatusChange={onStatusChange}
        className={className}
        currentUserId={currentUserId}
        canEdit={canEdit}
      />
    )
  }
  
  return (
    <div className={clsx('relative', className, 'mb-2')}>
      {/* 任务项 */}
      <div
        className={clsx(
          'relative',
          'group',
          'rounded-lg border border-gray-200',
          'hover:shadow-md hover:border-primary transition-all',
          backgroundColor, // 使用渐变背景色
          depth > 0 && 'ml-4' // 子任务轻微缩进
        )}
      >
        {/* 主任务内容 */}
        <div
          onClick={handleClick}
          className={clsx(
            'p-4 space-y-3',
            'cursor-pointer',
            hasChildren && isExpanded && 'border-b border-gray-200' // 有子任务且展开时添加底部分隔线
          )}
        >
          {/* 头部：展开按钮 + 内容 + 状态 */}
          <div className="flex items-start gap-3">
            {/* 展开/折叠按钮 */}
            {hasChildren ? (
              <button
                onClick={handleToggleExpand}
                className={clsx(
                  'flex-shrink-0 w-6 h-6 flex items-center justify-center mt-0.5',
                  'rounded hover:bg-gray-200 transition-colors',
                  'text-gray-500 hover:text-gray-700'
                )}
                title={isExpanded ? '折叠子任务' : '展开子任务'}
              >
                <ChevronIcon isExpanded={isExpanded} />
              </button>
            ) : (
              <div className="w-6" /> // 占位，保持对齐
            )}
            
            {/* 任务内容和标签/优先级 */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-medium text-gray-900 truncate mb-2" title={todo.content}>
                {todo.content}
              </h3>
              
              {/* 标签和优先级 */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* 标签 */}
                {todo.tags && (
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 text-xs text-gray-500 font-bold">
                      <TagIcon className="w-3.5 h-3.5 text-gray-500" />
                      标签
                    </span>
                    <TagList projectId={projectId} tagsString={todo.tags} size="sm" />
                  </div>
                )}
                {/* 分隔符 */}
                {todo.tags && todo.priority !== null && todo.priority !== undefined && (
                  <span className="text-gray-300">|</span>
                )}
                {/* 优先级 */}
                {todo.priority !== null && todo.priority !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 text-xs text-gray-500 font-bold">
                      <PriorityIcon className="w-3.5 h-3.5 text-gray-500" />
                      优先级
                    </span>
                    <PriorityBadge value={todo.priority} size="sm" />
                  </div>
                )}
              </div>
            </div>
            
            {/* 状态选择/显示 */}
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
          
          {/* 底部信息：标识图标 + 创建人、执行人、时间 */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap ml-9">
              {/* 标识图标：我是创建人或执行人 */}
              {((currentUserId !== null && currentUserId !== undefined && todo.creatorId === currentUserId) ||
                (currentUserId !== null && currentUserId !== undefined && todo.assigneeId === currentUserId)) && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {currentUserId !== null && currentUserId !== undefined && todo.creatorId === currentUserId && (
                    <CreatorBadgeIcon className="w-3.5 h-3.5 text-blue-500" title="我创建的" />
                  )}
                  {currentUserId !== null && currentUserId !== undefined && todo.assigneeId === currentUserId && (
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
                    <span
                      className={clsx(
                        'font-medium',
                        currentUserId !== null &&
                          currentUserId !== undefined &&
                          todo.creatorId === currentUserId &&
                          'text-blue-600'
                      )}
                    >
                      {todo.creator.username}
                    </span>
                  </span>
                </div>
              )}
              
              {/* 执行者 */}
              {todo.assignee && (
                <div className="flex items-center gap-1.5">
                  <AssignIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    <span className="text-gray-500">执行：</span>
                    <span
                      className={clsx(
                        'font-medium',
                        currentUserId !== null &&
                          currentUserId !== undefined &&
                          todo.assigneeId === currentUserId &&
                          'text-orange-600'
                      )}
                    >
                      {todo.assignee.username}
                    </span>
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0 ml-9">
              {/* 子任务指示器 */}
              {hasChildren && (
                <div className="flex items-center gap-1 text-xs text-primary">
                  <SubtaskIcon className="w-3.5 h-3.5" />
                  <span>{todo.children!.length} 个子待办</span>
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
        
        {/* 子任务列表 */}
        {hasChildren && isExpanded && (
          <div className="px-4 pb-3 pt-2">
            {todo.children!.map((child, index) => (
              <TodoTreeItem
                key={child.id}
                todo={child}
                projectId={projectId}
                onStatusChange={onStatusChange}
                currentUserId={currentUserId}
                canEdit={canEdit}
                depth={depth + 1}
                isLast={index === todo.children!.length - 1}
              />
            ))}
          </div>
        )}
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

function ChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <svg
      className={clsx('w-4 h-4 transition-transform', isExpanded && 'rotate-90')}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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

function CreatorBadgeIcon({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      title={title}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function AssigneeBadgeIcon({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      title={title}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
