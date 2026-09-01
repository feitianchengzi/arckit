'use client'

/**
 * TodoTreeItem - 树形任务项组件
 * 支持递归嵌套展示子任务，类似 Reddit 的板块效果
 */

import { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Avatar } from '@/components/ui'
import { TagList } from './'
import { getFirstNonEmptyLine } from '@/lib/utils/contentUtils'
import { formatTaskListDate } from '@/lib/utils/dateUtils'
import type { Todo, TodoStatus, ProjectMember } from '@/types'
import { TaskQuickControls, TodoItem } from './TodoItem'
import { useThemeStore } from '@/store/themeStore'
import { buildRouteFromState } from '@/lib/utils/navigationState'
import { buildProjectPath } from '@/lib/utils/projectRouting'
import { decodeUrlsInTextForDisplay } from '@/lib/utils/urlDisplay'

export interface TodoTreeItemProps {
  todo: Todo
  projectId: string
  onStatusChange?: (todoId: number, newStatus: string) => void
  className?: string
  currentUserId?: number | null
  canEdit?: boolean
  depth?: number // 嵌套深度，用于缩进
  isLast?: boolean // 是否是最后一个（用于连接线样式）
  parentExpanded?: boolean // 父任务是否展开
  members?: ProjectMember[] // 项目成员列表
  canAssignAssignee?: boolean // 是否可以分配执行人（owner/admin/创建人）
  onUpdateAssignee?: (taskId: number, assigneeId: number | null) => Promise<void> // 更新执行人的回调
  canEditPriority?: boolean // 是否可以编辑优先级（owner/admin/创建人）
  onUpdatePriority?: (taskId: number, priority: number | null) => Promise<void> // 更新优先级的回调
  canEditTags?: boolean // 是否可以编辑标签（owner/admin/创建人）
  onUpdateTags?: (taskId: number, tagsString: string) => Promise<void> // 更新标签的回调
  onClick?: (todoId: number) => void // 点击待办项的回调（用于打开抽屉），接收待办 ID 作为参数
  currentUserRole?: 'owner' | 'admin' | 'member' | null // 当前用户在项目中的角色
  selectionMode?: boolean // 是否处于父待办选择模式
  selectionDisabled?: boolean // 是否禁止选择该待办
  selectionDisabledIds?: Set<number> // 选择模式禁用集合
  selectedTaskId?: string | null // 当前打开详情的待办 ID
  onSelectParent?: (todoId: number) => void // 选择父待办回调
}

type QuickTaskMenu = 'priority' | 'status' | null

export function TodoTreeItem({
  todo,
  projectId,
  onStatusChange,
  className,
  currentUserId,
  canEdit = false,
  depth = 0,
  isLast = false,
  parentExpanded = false,
  members = [],
  canEditPriority = false,
  onUpdatePriority,
  onClick,
  currentUserRole = null,
  selectionMode = false,
  selectionDisabled = false,
  selectionDisabledIds,
  selectedTaskId = null,
  onSelectParent,
}: TodoTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false) // 默认不展开
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [openQuickMenu, setOpenQuickMenu] = useState<QuickTaskMenu>(null)
  const navigate = useNavigate()
  const theme = useThemeStore((state) => state.theme)
  
  // 提取第一行内容
  const firstLine = useMemo(() => getFirstNonEmptyLine(todo.content), [todo.content])
  const firstLineDisplay = useMemo(() => decodeUrlsInTextForDisplay(firstLine), [firstLine])
  const contentTitleDisplay = useMemo(() => decodeUrlsInTextForDisplay(todo.content), [todo.content])
  
  // 是否有子任务
  const hasChildren = todo.children && todo.children.length > 0
  const subtaskProgress = useMemo(() => getSubtaskProgress(todo), [todo])
  const isSelected = !selectionMode && selectedTaskId === String(todo.id)
  
  // 最大深度限制（避免过深的嵌套）
  const MAX_DEPTH = 5
  
  // 是否是子任务（depth > 0）
  const isChildTask = depth > 0
  
  // 计算背景色渐变（子任务层级越深背景色越深，展开状态下使用不同颜色）
  const getBackgroundColor = (depth: number, isExpandedState: boolean): string => {
    if (depth === 0) {
      return 'bg-surface-elevated' // 根任务：使用语义化背景色
    }
    
    // 如果父任务展开，子任务使用淡蓝色调表示展开状态
    if (isExpandedState) {
      if (theme === 'dark') {
        // 深色模式：使用深灰色系
        const expandedColors = [
          'bg-slate-900/40',   // 第1代子任务
          'bg-slate-900/50',   // 第2代子任务
          'bg-slate-800/55',   // 第3代子任务
          'bg-slate-800/65',   // 第4代子任务
          'bg-slate-700/70',   // 第5代子任务
        ]
        const colorIndex = Math.min(depth - 1, expandedColors.length - 1)
        return expandedColors[colorIndex] || expandedColors[expandedColors.length - 1]
      } else {
        // 浅色模式：使用浅蓝色调
        const expandedColors = [
          'bg-blue-50',      // 第1代子任务：浅蓝
          'bg-blue-100',     // 第2代子任务：中浅蓝
          'bg-blue-200',     // 第3代子任务：中蓝
          'bg-blue-300',     // 第4代子任务：深蓝
          'bg-blue-400',     // 第5代子任务：更深蓝
        ]
        const colorIndex = Math.min(depth - 1, expandedColors.length - 1)
        return expandedColors[colorIndex] || expandedColors[expandedColors.length - 1]
      }
    }
    
    // 父任务未展开时的默认灰色（使用语义化颜色，自动适配深色模式）
    const childColors = [
      'bg-surface-hover',      // 第1代子任务：浅灰
      'bg-surface-active',      // 第2代子任务：中灰
      'bg-surface-disabled',      // 第3代子任务：深灰
      'bg-surface-disabled',      // 第4代子任务：更深灰
      'bg-surface-disabled',      // 第5代子任务：最深灰
    ]
    const colorIndex = Math.min(depth - 1, childColors.length - 1)
    return childColors[colorIndex] || childColors[childColors.length - 1]
  }
  
  // 使用父任务的展开状态来决定子任务的背景色
  const backgroundColor = getBackgroundColor(depth, parentExpanded)
  const isSelectionDisabled = selectionDisabledIds ? selectionDisabledIds.has(todo.id) : selectionDisabled
  const location = useLocation()
  const currentPath = `${location.pathname}${location.search}${location.hash}`
  const rowIndent = 4 + depth * 24
  
  // 点击展开/折叠（通过点击"x个子待办"触发）
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }
  
  // 点击任务项跳转到详情或打开抽屉
  const handleClick = () => {
    if (selectionMode) return
    if (onClick) {
      // 传递当前待办的 ID，确保子待办点击时使用的是子待办的 ID
      onClick(todo.id)
    } else {
      navigate(buildProjectPath(projectId, `tasks/${todo.id}`), {
        state: buildRouteFromState(currentPath),
      })
    }
  }
  
  // 状态变更处理
  const handleStatusChange = (newStatus: TodoStatus) => {
    if (onStatusChange) {
      onStatusChange(todo.id, newStatus as string)
    }
  }

  const canUsePriorityMenu = canEditPriority && Boolean(onUpdatePriority)
  const canUseStatusMenu = canEdit && Boolean(onStatusChange)

  const handleQuickPriorityChange = async (priority: number | null) => {
    if (!canUsePriorityMenu || !onUpdatePriority || isUpdatingPriority) return

    try {
      setIsUpdatingPriority(true)
      await onUpdatePriority(todo.id, priority)
      setOpenQuickMenu(null)
    } catch (error) {
      console.error('更新优先级失败:', error)
    } finally {
      setIsUpdatingPriority(false)
    }
  }

  const handleQuickStatusChange = (newStatus: TodoStatus) => {
    if (!canUseStatusMenu || isUpdatingStatus) return

    try {
      setIsUpdatingStatus(true)
      if (newStatus !== todo.status) {
        handleStatusChange(newStatus)
      }
      setOpenQuickMenu(null)
    } finally {
      setIsUpdatingStatus(false)
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
        members={members}
        canEditPriority={canEditPriority}
        onUpdatePriority={onUpdatePriority}
        onClick={onClick}
        currentUserRole={currentUserRole}
        selectionMode={selectionMode}
        selectionDisabled={isSelectionDisabled}
        onSelectParent={onSelectParent}
      />
    )
  }

  if (selectionMode) {
    return (
      <div
        className={clsx(
          'relative',
          className,
          !isChildTask && 'mb-px',
          isSelectionDisabled && 'opacity-60'
        )}
      >
        <div
          className={clsx(
            'relative',
            'group',
            backgroundColor,
            isChildTask ? 'border-t border-border' : 'border border-border'
          )}
        >
          <div
            className={clsx(
              'px-3 py-2',
              isSelectionDisabled ? 'cursor-not-allowed' : 'cursor-default'
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 flex items-center gap-2">
                {todo.creator && <Avatar user={todo.creator} size="xs" />}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground truncate" title={contentTitleDisplay}>
                    {firstLineDisplay || '无内容'}
                  </div>
                </div>
                {hasChildren && (
                  <button
                    onClick={handleToggleExpand}
                    className={clsx(
                      'inline-flex items-center gap-1 text-xs transition-colors whitespace-nowrap flex-shrink-0',
                      isExpanded ? 'text-foreground hover:text-foreground' : 'text-primary hover:text-primary-600'
                    )}
                    title={isExpanded ? '折叠子任务' : '展开子任务'}
                  >
                    <SubtaskIcon className="w-3.5 h-3.5" />
                    <span>{todo.children!.length} 个子待办</span>
                    <ChevronIcon isExpanded={isExpanded} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isSelectionDisabled ? (
                  <div className="flex items-center gap-1 text-xs text-foreground-tertiary">
                    <DisabledIcon className="w-3.5 h-3.5" />
                    不可选
                  </div>
                ) : (
                  <button
                    onClick={() => onSelectParent?.(todo.id)}
                    className="px-4 py-2 rounded-md text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors flex-shrink-0 whitespace-nowrap min-w-[72px]"
                  >
                    选择
                  </button>
                )}
              </div>
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div className="task-tree-children">
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
                  parentExpanded={isExpanded}
                  members={members}
                  currentUserRole={currentUserRole}
                  canEditPriority={canEditPriority}
                  onUpdatePriority={onUpdatePriority}
                  onClick={onClick}
                  selectionMode={selectionMode}
                  selectionDisabledIds={selectionDisabledIds}
                  onSelectParent={onSelectParent}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
  
  return (
    <div
      className={clsx(
        'relative',
        className,
        !isChildTask && 'mb-px',
        selectionMode && isSelectionDisabled && 'opacity-60'
      )}
    >
      {/* 任务项 */}
      <div
        className={clsx(
          'relative',
          'group'
        )}
      >
        {/* 主任务内容 */}
        <div
          onClick={handleClick}
          className={clsx(
            'task-list-row-frame',
            isSelected && 'is-selected',
            !selectionMode ? 'cursor-pointer' : 'cursor-default',
            selectionMode && isSelectionDisabled && 'cursor-not-allowed'
          )}
          aria-selected={isSelected}
          style={{ paddingLeft: rowIndent }}
        >
          <div className="task-linear-row">
            <TaskQuickControls
              priority={todo.priority ?? null}
              status={todo.status}
              priorityMenuOpen={openQuickMenu === 'priority'}
              statusMenuOpen={openQuickMenu === 'status'}
              canChangePriority={canUsePriorityMenu}
              canChangeStatus={canUseStatusMenu}
              priorityUpdating={isUpdatingPriority}
              statusUpdating={isUpdatingStatus}
              onTogglePriority={() => setOpenQuickMenu((current) => (current === 'priority' ? null : 'priority'))}
              onToggleStatus={() => setOpenQuickMenu((current) => (current === 'status' ? null : 'status'))}
              onClose={() => setOpenQuickMenu(null)}
              onChangePriority={handleQuickPriorityChange}
              onChangeStatus={handleQuickStatusChange}
            />

            <div className="task-linear-main">
              <span className="task-linear-title-row">
                <h3 className="task-linear-title" title={contentTitleDisplay}>
                  {firstLineDisplay || '无内容'}
                </h3>
              </span>

              {subtaskProgress.total > 0 && (
                <span className="task-list-progress">
                  <span className="progress-ring" />
                  {subtaskProgress.completed}/{subtaskProgress.total}
                </span>
              )}

              {hasChildren && (
                <button
                  onClick={handleToggleExpand}
                  onDoubleClick={(event) => event.stopPropagation()}
                  className={clsx('task-tree-toggle', isExpanded && 'is-expanded')}
                  type="button"
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? '折叠子任务' : '展开子任务'}
                  title={isExpanded ? '折叠子任务' : '展开子任务'}
                >
                  <ChevronIcon isExpanded={isExpanded} />
                </button>
              )}
            </div>

            <div className="task-list-meta">
              <TagList projectId={projectId} tagsString={todo.tags} size="sm" variant="linear" />

              {todo.assignee ? (
                <span className="task-list-assignee-avatar" title={todo.assignee.username}>
                  <Avatar user={todo.assignee} size="sm" />
                </span>
              ) : (
                <span className="task-list-assignee is-empty" aria-label="未选定执行者" />
              )}

              <span className="task-list-date">{formatTaskListDate(todo.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* 子任务列表 */}
        {hasChildren && isExpanded && (
          <div className="task-tree-children">
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
                parentExpanded={isExpanded} // 传递当前任务的展开状态给子任务
                members={members}
                currentUserRole={currentUserRole}
                canEditPriority={canEditPriority}
                onUpdatePriority={onUpdatePriority}
                onClick={onClick} // 传递 onClick 回调，确保子待办也能在抽屉中打开
                selectionMode={selectionMode}
                selectionDisabledIds={selectionDisabledIds}
                selectedTaskId={selectedTaskId}
                onSelectParent={onSelectParent}
              />
            ))}
          </div>
        )}
      </div>
      
    </div>
  )
}

// ==================== 工具函数 ====================

function getSubtaskProgress(todo: Todo) {
  const children = todo.children ?? []

  return {
    completed: children.filter((child) => child.status === 'COMPLETED' || child.status === 'ACCEPTED').length,
    total: children.length,
  }
}

// ==================== 图标组件 ====================

function ChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <svg
      className={clsx('icon w-4 h-4 transition-transform', isExpanded && 'rotate-90')}
      fill="none"
      viewBox="0 0 16 16"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="m6.5 5 3 3-3 3" />
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

function DisabledIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-12.728 12.728M6.343 6.343a9 9 0 1111.314 11.314A9 9 0 016.343 6.343z" />
    </svg>
  )
}
