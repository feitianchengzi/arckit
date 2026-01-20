'use client'

/**
 * TodoTreeItem - 树形任务项组件
 * 支持递归嵌套展示子任务，类似 Reddit 的板块效果
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { StatusBadge, StatusSelect } from '@/components/ui'
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
  
  // 计算缩进（每层增加 24px）
  const indentWidth = Math.min(depth, MAX_DEPTH) * 24
  
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
    <div className={clsx('relative', className, 'mb-3')}>
      {/* 书签样式标记（如果有父任务） */}
      {depth > 0 && (
        <div
          className="absolute left-0 text-primary"
          style={{
            left: `${(depth - 1) * 24 + 4}px`,
            top: '12px', // 与子任务容器的 pt-3 (12px) 对齐
          }}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
          >
            <path d="M460.8 234.666667h405.333333c17.066667 0 34.133333-12.8 34.133334-34.133334s-17.066667-29.866667-38.4-29.866666h-405.333334c-17.066667 0-29.866667 12.8-29.866666 29.866666s12.8 34.133333 34.133333 34.133334zM861.866667 789.333333h-119.466667c-17.066667 0-34.133333 12.8-34.133333 34.133334s12.8 34.133333 34.133333 34.133333h119.466667c17.066667 0 34.133333-12.8 34.133333-34.133333s-12.8-34.133333-34.133333-34.133334zM430.933333 546.133333c12.8 51.2 59.733333 85.333333 110.933334 85.333334 64 0 119.466667-51.2 119.466666-119.466667s-51.2-119.466667-119.466666-119.466667c-55.466667 0-98.133333 34.133333-110.933334 85.333334H277.333333V315.733333c51.2-12.8 85.333333-59.733333 85.333334-110.933333C362.666667 136.533333 311.466667 85.333333 247.466667 85.333333S128 136.533333 128 200.533333c0 55.466667 34.133333 102.4 85.333333 115.2v422.4C213.333333 802.133333 264.533333 853.333333 332.8 853.333333h102.4c12.8 51.2 59.733333 85.333333 110.933333 85.333334 64 0 119.466667-51.2 119.466667-119.466667s-51.2-119.466667-119.466667-119.466667c-55.466667 0-98.133333 34.133333-110.933333 85.333334H332.8c-29.866667 0-51.2-25.6-51.2-51.2v-192h149.333333z m115.2-85.333333c29.866667 0 51.2 25.6 51.2 51.2s-25.6 51.2-51.2 51.2-51.2-25.6-51.2-51.2 21.333333-51.2 51.2-51.2z m0 307.2c29.866667 0 51.2 25.6 51.2 51.2s-25.6 51.2-51.2 51.2-51.2-25.6-51.2-51.2 21.333333-51.2 51.2-51.2zM192 200.533333c0-29.866667 25.6-51.2 51.2-51.2S298.666667 174.933333 298.666667 200.533333 273.066667 256 247.466667 256s-55.466667-25.6-55.466667-55.466667zM861.866667 482.133333h-119.466667c-17.066667 0-34.133333 12.8-34.133333 34.133334s12.8 34.133333 34.133333 34.133333h119.466667c17.066667 0 34.133333-12.8 34.133333-34.133333s-12.8-34.133333-34.133333-34.133334z" />
          </svg>
        </div>
      )}
      
      {/* 任务项 */}
      <div
        className={clsx(
          'relative',
          'group',
          'bg-white rounded-lg border border-gray-200',
          'hover:shadow-md hover:border-primary transition-all',
          depth > 0 && 'ml-6 mr-3' // 子任务缩进和右边距
        )}
        style={{
          marginLeft: depth > 0 ? `${indentWidth}px` : undefined,
        }}
      >
        {/* 主任务内容 */}
        <div
          onClick={handleClick}
          className={clsx(
            'p-4 space-y-3',
            'cursor-pointer',
            hasChildren && 'border-b border-gray-100' // 有子任务时添加底部分隔线
          )}
        >
          {/* 头部：展开按钮 + 内容 + 状态 */}
          <div className="flex items-center gap-3">
            {/* 展开/折叠按钮 */}
            {hasChildren ? (
              <button
                onClick={handleToggleExpand}
                className={clsx(
                  'flex-shrink-0 w-6 h-6 flex items-center justify-center',
                  'rounded hover:bg-gray-100 transition-colors',
                  'text-gray-500 hover:text-gray-700'
                )}
                title={isExpanded ? '折叠子任务' : '展开子任务'}
              >
                <ChevronIcon isExpanded={isExpanded} />
              </button>
            ) : (
              <div className="w-6" /> // 占位，保持对齐
            )}
            
            {/* 任务内容 */}
            <h3 className="flex-1 text-base font-medium text-gray-900 truncate" title={todo.content}>
              {todo.content}
            </h3>
            
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
          <div className="pt-3 pb-2 pl-3 pr-3">
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
