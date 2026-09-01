'use client'

/**
 * TodoItem - 任务项组件
 */

import { useState, useRef, useEffect, useMemo, type RefObject } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Avatar } from '@/components/ui'
import { TagList } from './'
import { getFirstNonEmptyLine } from '@/lib/utils/contentUtils'
import { formatTaskListDate } from '@/lib/utils/dateUtils'
import type { Todo, TodoStatus, ProjectMember } from '@/types'
import { permissionManager } from '@/lib/permissions'
import { todoToTaskInfo } from '@/lib/permissions/utils'
import type { TaskInfo } from '@/lib/permissions'
import { buildRouteFromState } from '@/lib/utils/navigationState'
import { buildProjectPath } from '@/lib/utils/projectRouting'
import { decodeUrlsInTextForDisplay } from '@/lib/utils/urlDisplay'

export interface TodoItemProps {
  todo: Todo
  projectId: string
  onStatusChange?: (todoId: number, newStatus: string) => void
  className?: string
  currentUserId?: number | null // 当前用户的 user_id
  canEdit?: boolean // 是否有权限编辑任务状态（已考虑状态为进行中时的权限）
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
  onSelectParent?: (todoId: number) => void // 选择父待办回调
}

type LinearPriorityTone = 'none' | 'urgent' | 'high' | 'medium' | 'low'
type LinearStatusTone = 'backlog' | 'todo' | 'progress' | 'review' | 'done' | 'canceled' | 'blocked'
type QuickTaskMenu = 'priority' | 'status' | null

const LINEAR_PRIORITY_OPTIONS: Array<{
  value: number | null
  label: string
  shortcut: string
  tone: LinearPriorityTone
}> = [
  { value: null, label: '无优先级', shortcut: '0', tone: 'none' },
  { value: 0, label: '紧急', shortcut: '1', tone: 'urgent' },
  { value: 1, label: '高', shortcut: '2', tone: 'high' },
  { value: 2, label: '中', shortcut: '3', tone: 'medium' },
  { value: 3, label: '低', shortcut: '4', tone: 'low' },
]

const LINEAR_STATUS_OPTIONS: Array<{
  status: TodoStatus
  label: string
  shortcut: string
  tone: LinearStatusTone
}> = [
  { status: 'PENDING_REVIEW', label: '待评审', shortcut: '1', tone: 'backlog' },
  { status: 'PENDING', label: '待处理', shortcut: '2', tone: 'todo' },
  { status: 'IN_PROGRESS', label: '进行中', shortcut: '3', tone: 'progress' },
  { status: 'COMPLETED', label: '已完成', shortcut: '4', tone: 'review' },
  { status: 'ACCEPTED', label: '已验收', shortcut: '5', tone: 'done' },
  { status: 'CANCELLED', label: '已取消', shortcut: '6', tone: 'canceled' },
  { status: 'BLOCKED', label: '已阻塞', shortcut: '7', tone: 'blocked' },
]

export function TodoItem({
  todo,
  projectId,
  onStatusChange,
  className,
  currentUserId,
  canEdit = false,
  members = [],
  canEditPriority = false,
  onUpdatePriority,
  onClick,
  currentUserRole = null,
  selectionMode = false,
  selectionDisabled = false,
  onSelectParent,
}: TodoItemProps) {
  // 从成员列表中查找执行人信息（如果todo.assignee不存在）
  const assigneeInfo = useMemo(() => {
    if (todo.assignee) {
      return todo.assignee
    }
    if (todo.assigneeId && Array.isArray(members) && members.length > 0) {
      const member = members.find((m: any) => m.user_id === todo.assigneeId)
      if (member) {
        return {
          id: todo.assigneeId,
          username: member.username || member.user?.username || '未知',
          avatar: member.avatar || member.user?.avatar,
          created_at: '',
          updated_at: '',
        }
      }
    }
    return null
  }, [todo.assignee, todo.assigneeId, members])
  
  // 权限检查：修改状态
  // 使用权限管理器检查权限，但保留 canEdit prop 的兼容性
  const canChangeStatus = useMemo(() => {
    if (selectionMode) return false
    if (!currentUserId || !currentUserRole) return false
    
    const taskInfo: TaskInfo = todoToTaskInfo(todo)
    const hasPermission = permissionManager.task.hasStatusChangePermission(
      taskInfo,
      currentUserRole,
      currentUserId
    )
    
    // 如果权限管理器返回 true，直接使用
    // 如果权限管理器返回 false，但在非进行中状态且 canEdit 为 true，也允许修改（向后兼容）
    if (hasPermission) {
      return true
    }
    
    // 向后兼容：非进行中状态时，如果 canEdit 为 true，也允许修改
    if (todo.status !== 'IN_PROGRESS' && canEdit) {
      return true
    }
    
    return false
  }, [selectionMode, todo, currentUserRole, currentUserId, canEdit])
  const [openQuickMenu, setOpenQuickMenu] = useState<QuickTaskMenu>(null)
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const currentPath = `${location.pathname}${location.search}${location.hash}`
  
  // 提取第一行内容
  const firstLine = useMemo(() => getFirstNonEmptyLine(todo.content), [todo.content])
  const firstLineDisplay = useMemo(() => decodeUrlsInTextForDisplay(firstLine), [firstLine])
  const contentTitleDisplay = useMemo(() => decodeUrlsInTextForDisplay(todo.content), [todo.content])
  const subtaskProgress = useMemo(() => getSubtaskProgress(todo), [todo])
  
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
  
  const handleStatusChange = (newStatus: TodoStatus) => {
    if (onStatusChange) {
      onStatusChange(todo.id, newStatus as string)
    }
  }

  const canUsePriorityMenu = canEditPriority && Boolean(onUpdatePriority)
  const canUseStatusMenu = canChangeStatus && Boolean(onStatusChange)

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

  if (selectionMode) {
    return (
      <div
        className={clsx(
          'group',
          'bg-surface-elevated border border-border',
          'px-3 py-2',
          selectionDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-default',
          className
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
          </div>
          <div className="flex items-center gap-2">
            {selectionDisabled ? (
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
    )
  }
  
  return (
    <div
      onClick={handleClick}
      className={clsx(
        'task-list-row-frame group',
        !selectionMode && 'cursor-pointer',
        selectionMode && 'cursor-default',
        selectionMode && selectionDisabled && 'opacity-60 cursor-not-allowed',
        className
      )}
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
        </div>

        <div className="task-list-meta">
          <TagList projectId={projectId} tagsString={todo.tags} size="sm" variant="linear" />

          {assigneeInfo ? (
            <span className="task-list-assignee-avatar" title={assigneeInfo.username}>
              <Avatar user={assigneeInfo} size="sm" />
            </span>
          ) : (
            <span className="task-list-assignee is-empty" aria-label="未选定执行者" />
          )}

          <span className="task-list-date">{formatTaskListDate(todo.createdAt)}</span>
        </div>
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

export function getLinearPriorityOption(priority: number | null) {
  return LINEAR_PRIORITY_OPTIONS.find((option) => option.value === priority) || LINEAR_PRIORITY_OPTIONS[0]
}

export function getLinearStatusOption(status: TodoStatus) {
  return LINEAR_STATUS_OPTIONS.find((option) => option.status === status) || LINEAR_STATUS_OPTIONS[1]
}

export function LinearPriorityMarker({ priority, variant = 'default' }: { priority: number | null; variant?: 'default' | 'menu' }) {
  const option = getLinearPriorityOption(priority)

  return (
    <span className={clsx('task-linear-priority-marker', `is-${option.tone}`, variant === 'menu' && 'is-menu')}>
      {option.tone === 'none' && '---'}
      {option.tone === 'urgent' && '!'}
      {(option.tone === 'high' || option.tone === 'medium' || option.tone === 'low') && (
        <>
          <span />
          <span />
          <span />
        </>
      )}
    </span>
  )
}

export function LinearStatusMarker({ status }: { status: TodoStatus }) {
  const option = getLinearStatusOption(status)
  return <span className={clsx('task-linear-status-marker', `is-${option.tone}`)} />
}

function useLinearMenuDismiss(menuRef: RefObject<HTMLDivElement>, onClose: () => void) {
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current && event.target instanceof Node && !menuRef.current.contains(event.target)) {
        onClose()
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuRef, onClose])
}

export function TaskQuickControls({
  priority,
  status,
  priorityMenuOpen,
  statusMenuOpen,
  canChangePriority,
  canChangeStatus,
  priorityUpdating,
  statusUpdating,
  onTogglePriority,
  onToggleStatus,
  onClose,
  onChangePriority,
  onChangeStatus,
}: {
  priority: number | null
  status: TodoStatus
  priorityMenuOpen: boolean
  statusMenuOpen: boolean
  canChangePriority: boolean
  canChangeStatus: boolean
  priorityUpdating: boolean
  statusUpdating: boolean
  onTogglePriority: () => void
  onToggleStatus: () => void
  onClose: () => void
  onChangePriority: (priority: number | null) => void | Promise<void>
  onChangeStatus: (status: TodoStatus) => void
}) {
  const priorityLabel = getLinearPriorityOption(priority).label
  const statusLabel = getLinearStatusOption(status).label

  return (
    <div
      className="task-linear-controls"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <span className="task-linear-control">
        <button
          type="button"
          className={clsx('task-linear-control-button', priorityMenuOpen && 'is-active')}
          aria-label={`切换优先级：${priorityLabel}`}
          aria-haspopup="menu"
          aria-expanded={priorityMenuOpen}
          disabled={!canChangePriority || priorityUpdating}
          title={priorityLabel}
          onClick={onTogglePriority}
        >
          <LinearPriorityMarker priority={priority} />
        </button>
        {priorityMenuOpen && (
          <LinearPriorityMenu
            currentPriority={priority}
            updating={priorityUpdating}
            onChange={onChangePriority}
            onClose={onClose}
          />
        )}
      </span>

      <span className="task-linear-control">
        <button
          type="button"
          className={clsx('task-linear-control-button', statusMenuOpen && 'is-active')}
          aria-label={`切换状态：${statusLabel}`}
          aria-haspopup="menu"
          aria-expanded={statusMenuOpen}
          disabled={!canChangeStatus || statusUpdating}
          title={statusLabel}
          onClick={onToggleStatus}
        >
          <LinearStatusMarker status={status} />
        </button>
        {statusMenuOpen && (
          <LinearStatusMenu
            currentStatus={status}
            updating={statusUpdating}
            onChange={onChangeStatus}
            onClose={onClose}
          />
        )}
      </span>
    </div>
  )
}

export function LinearPriorityMenu({
  currentPriority,
  updating,
  onChange,
  onClose,
}: {
  currentPriority: number | null
  updating: boolean
  onChange: (priority: number | null) => void | Promise<void>
  onClose: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  useLinearMenuDismiss(menuRef, onClose)

  return (
    <div className="task-linear-menu task-linear-priority-menu" ref={menuRef} role="menu" aria-label="切换优先级">
      <div className="task-linear-menu-options">
        {LINEAR_PRIORITY_OPTIONS.map((option) => {
          const isActive = option.value === currentPriority
          return (
            <button
              className={clsx('task-linear-menu-option', isActive && 'is-active')}
              key={option.value ?? 'none'}
              type="button"
              role="menuitemradio"
              aria-checked={isActive}
              disabled={updating}
              onClick={(event) => {
                event.stopPropagation()
                if (isActive) {
                  onClose()
                  return
                }
                void onChange(option.value)
              }}
            >
              <LinearPriorityMarker priority={option.value} variant="menu" />
              <span>{option.label}</span>
              <span className="task-linear-menu-current">{isActive ? '✓' : ''}</span>
              <kbd>{option.shortcut}</kbd>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function LinearStatusMenu({
  currentStatus,
  updating,
  onChange,
  onClose,
}: {
  currentStatus: TodoStatus
  updating: boolean
  onChange: (status: TodoStatus) => void
  onClose: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  useLinearMenuDismiss(menuRef, onClose)

  return (
    <div className="task-linear-menu task-linear-status-menu" ref={menuRef} role="menu" aria-label="切换状态">
      <div className="task-linear-menu-options">
        {LINEAR_STATUS_OPTIONS.map((option) => {
          const isActive = option.status === currentStatus
          return (
            <button
              className={clsx('task-linear-menu-option', isActive && 'is-active')}
              key={option.status}
              type="button"
              role="menuitemradio"
              aria-checked={isActive}
              disabled={updating}
              onClick={(event) => {
                event.stopPropagation()
                onChange(option.status)
              }}
            >
              <LinearStatusMarker status={option.status} />
              <span>{option.label}</span>
              <span className="task-linear-menu-current">{isActive ? '✓' : ''}</span>
              <kbd>{option.shortcut}</kbd>
            </button>
          )
        })}
      </div>
    </div>
  )
}


// ==================== 图标组件 ====================

function DisabledIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-12.728 12.728M6.343 6.343a9 9 0 1111.314 11.314A9 9 0 016.343 6.343z" />
    </svg>
  )
}
