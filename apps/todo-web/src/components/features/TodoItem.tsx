'use client'

/**
 * TodoItem - 任务项组件
 */

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { StatusBadge, StatusSelect, Avatar } from '@/components/ui'
import { TagList, PriorityBadge } from './'
import { parseTaskTags, buildTaskTags } from '@/lib/utils/tagUtils'
import type { Todo, TodoStatus, ProjectMember } from '@/types'
import { XIcon, ChevronDownIcon } from '@/components/ui/icons'
import { useTagStore } from '@/store/tagStore'
import { TagDisplay } from './TagDisplay'

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
  canEditTags?: boolean // 是否可以编辑标签（owner/admin/创建人）
  onUpdateTags?: (taskId: number, tagsString: string) => Promise<void> // 更新标签的回调
  onClick?: () => void // 点击待办项的回调（用于打开抽屉）
}

export function TodoItem({ todo, projectId, onStatusChange, className, currentUserId, canEdit = false,   members = [], canAssignAssignee = false, onUpdateAssignee,   canEditPriority = false, onUpdatePriority, canEditTags = false, onUpdateTags, onClick }: TodoItemProps) {
  // 判断是否是创建者或执行者
  const isCreator = currentUserId !== null && currentUserId !== undefined && todo.creatorId === currentUserId
  const isAssignee = currentUserId !== null && currentUserId !== undefined && todo.assigneeId === currentUserId
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false)
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false)
  const [isEditingAssignee, setIsEditingAssignee] = useState(false)
  const [isEditingPriority, setIsEditingPriority] = useState(false)
  const [isEditingTags, setIsEditingTags] = useState(false)
  const [newAssigneeId, setNewAssigneeId] = useState<number | null | undefined>(undefined)
  const [isSavingAssignee, setIsSavingAssignee] = useState(false)
  const [assigneeError, setAssigneeError] = useState('')
  const [newPriority, setNewPriority] = useState<number | null | undefined>(undefined)
  const [newTagIds, setNewTagIds] = useState<number[] | null>(null)
  const [isUpdatingTags, setIsUpdatingTags] = useState(false)
  const navigate = useNavigate()
  const { loadProjectTags, getProjectTags } = useTagStore()
  
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      navigate(`/projects/${projectId}/tasks/${todo.id}`)
    }
  }
  
  const handleStatusChange = (newStatus: TodoStatus) => {
    if (onStatusChange) {
      onStatusChange(todo.id, newStatus as string)
    }
  }
  
  return (
    <div
      onClick={handleClick}
      className={clsx(
        'group',
        'bg-surface-elevated border border-border',
        'p-3 space-y-2',
        'hover:shadow-md hover:border-primary transition-all cursor-pointer',
        className
      )}
    >
      {/* 头部：内容 + 状态/优先级 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-foreground truncate mb-1.5" title={todo.content}>
            {todo.content}
          </h3>
          
          {/* 标签和优先级 */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* 标签 - 始终显示 */}
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-xs text-foreground-secondary font-bold">
                <TagIcon className="w-3.5 h-3.5 text-foreground-secondary" />
                标签
              </span>
              {isEditingTags && canEditTags && onUpdateTags ? (
                <TagSelectorInline
                  projectId={projectId}
                  currentTags={todo.tags}
                  selectedTagIds={newTagIds !== null ? newTagIds : parseTaskTags(todo.tags)}
                  onChange={(tagIds) => setNewTagIds(tagIds)}
                  onSave={async () => {
                    try {
                      setIsUpdatingTags(true)
                      const tagsString = buildTaskTags(newTagIds !== null ? newTagIds : parseTaskTags(todo.tags))
                      await onUpdateTags(todo.id, tagsString)
                      setIsEditingTags(false)
                      setNewTagIds(null)
                    } catch (error) {
                      console.error('更新标签失败:', error)
                    } finally {
                      setIsUpdatingTags(false)
                    }
                  }}
                  onCancel={() => {
                    setIsEditingTags(false)
                    setNewTagIds(null)
                  }}
                  loading={isUpdatingTags}
                />
              ) : parseTaskTags(todo.tags).length > 0 ? (
                <div className="flex items-center gap-1">
                  <TagList projectId={projectId} tagsString={todo.tags} size="sm" />
                  {canEditTags && onUpdateTags && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsEditingTags(true)
                        setNewTagIds(parseTaskTags(todo.tags))
                        loadProjectTags(projectId).catch(console.error)
                      }}
                      className="p-0.5 rounded hover:bg-surface-hover transition-colors text-foreground-secondary hover:text-foreground"
                      aria-label="设置标签"
                      title="设置标签"
                    >
                      <ReplaceIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-foreground-tertiary">无</span>
                  {canEditTags && onUpdateTags && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsEditingTags(true)
                        setNewTagIds([])
                        loadProjectTags(projectId).catch(console.error)
                      }}
                      className="p-0.5 rounded hover:bg-surface-hover transition-colors text-foreground-secondary hover:text-foreground"
                      aria-label="设置标签"
                      title="设置标签"
                    >
                      <ReplaceIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
            {/* 分隔符 */}
            <span className="text-foreground-tertiary">|</span>
            {/* 优先级 - 始终显示 */}
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-xs text-gray-500 font-bold">
                <PriorityIcon className="w-3.5 h-3.5 text-gray-500" />
                优先级
              </span>
              {isEditingPriority && canEditPriority && onUpdatePriority ? (
                <PrioritySelectorInline
                  value={newPriority !== undefined ? newPriority : (todo.priority ?? null)}
                  onChange={setNewPriority}
                  onSave={async () => {
                    try {
                      setIsUpdatingPriority(true)
                      await onUpdatePriority(todo.id, newPriority ?? null)
                      setIsEditingPriority(false)
                      setNewPriority(undefined)
                    } catch (error) {
                      console.error('更新优先级失败:', error)
                    } finally {
                      setIsUpdatingPriority(false)
                    }
                  }}
                  onCancel={() => {
                    setIsEditingPriority(false)
                    setNewPriority(undefined)
                  }}
                  loading={isUpdatingPriority}
                />
              ) : todo.priority !== null && todo.priority !== undefined ? (
                <div className="flex items-center gap-1">
                  <PriorityBadge value={todo.priority} size="sm" />
                  {canEditPriority && onUpdatePriority && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsEditingPriority(true)
                        setNewPriority(todo.priority ?? null)
                      }}
                      className="p-0.5 rounded hover:bg-surface-hover transition-colors text-foreground-secondary hover:text-foreground"
                      aria-label="设置优先级"
                      title="设置优先级"
                    >
                      <ReplaceIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-foreground-tertiary">未设定</span>
                  {canEditPriority && onUpdatePriority && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsEditingPriority(true)
                        setNewPriority(null)
                      }}
                      className="p-0.5 rounded hover:bg-surface-hover transition-colors text-foreground-secondary hover:text-foreground"
                      aria-label="设置优先级"
                      title="设置优先级"
                    >
                      <ReplaceIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
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
            <div className="flex items-center gap-0.5 text-xs text-foreground-secondary whitespace-nowrap">
              <span className="text-foreground-secondary font-bold">创建：</span>
              <Avatar user={todo.creator} size="xs" />
              <span className={clsx('font-medium', isCreator && 'text-blue-600')}>
                {todo.creator.username}
              </span>
            </div>
          )}
          
          {/* 执行者 - 始终显示 */}
          <div className="flex items-center gap-0.5 text-xs text-foreground-secondary whitespace-nowrap">
            <span className="text-foreground-secondary font-bold">执行：</span>
            {todo.assignee ? (
              <div className="flex items-center gap-1">
                <Avatar user={todo.assignee} size="xs" />
                <span className={clsx('font-medium', isAssignee && 'text-blue-600')}>
                  {todo.assignee.username}
                </span>
                {canAssignAssignee && onUpdateAssignee && members.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isEditingAssignee) {
                        setIsEditingAssignee(false)
                        setNewAssigneeId(undefined)
                        setAssigneeError('')
                      } else {
                        setIsEditingAssignee(true)
                        setNewAssigneeId(todo.assigneeId || undefined)
                      }
                    }}
                    className="p-0.5 rounded hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 ml-0.5"
                    aria-label={isEditingAssignee ? "收起" : "展开"}
                    title={isEditingAssignee ? "收起" : "展开"}
                  >
                    <ChevronDownIcon 
                      className={clsx(
                        "w-3 h-3 transition-transform",
                        isEditingAssignee && "transform rotate-180"
                      )} 
                    />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-foreground-tertiary">未选定</span>
                {canAssignAssignee && onUpdateAssignee && members.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isEditingAssignee) {
                        setIsEditingAssignee(false)
                        setNewAssigneeId(undefined)
                        setAssigneeError('')
                      } else {
                        setIsEditingAssignee(true)
                        setNewAssigneeId(undefined)
                      }
                    }}
                    className="p-0.5 rounded hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 ml-0.5"
                    aria-label={isEditingAssignee ? "收起" : "展开"}
                    title={isEditingAssignee ? "收起" : "展开"}
                  >
                    <ChevronDownIcon 
                      className={clsx(
                        "w-3 h-3 transition-transform",
                        isEditingAssignee && "transform rotate-180"
                      )} 
                    />
                  </button>
                )}
              </div>
            )}
            {assigneeError && (
              <span className="text-xs text-error ml-2">{assigneeError}</span>
            )}
          </div>
          {/* 成员选择区域 - 点击更换后展开 */}
          {isEditingAssignee && canAssignAssignee && onUpdateAssignee && members.length > 0 && (
            <div
              className={clsx(
                'w-full transition-all duration-300 ease-in-out',
                isEditingAssignee ? 'max-h-[500px] opacity-100 mt-2 pt-2 border-t border-divider' : 'max-h-0 opacity-0'
              )}
              style={{ overflow: isEditingAssignee ? 'visible' : 'hidden' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-wrap gap-x-1 gap-y-1.5">
                {/* 成员列表 */}
                {members.map((member) => {
                  const memberId = member.user_id
                  const isSelected = newAssigneeId === memberId
                  const memberUsername = member.username || member.user?.username || '未知用户'
                  const memberAvatar = member.avatar || member.user?.avatar
                  
                  return (
                    <button
                      key={memberId}
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation()
                        // 如果正在保存或已选中，不处理
                        if (isSavingAssignee || isSelected) return
                        
                        // 如果点击的是当前选中的，不处理
                        if (newAssigneeId === memberId) return
                        
                        try {
                          setIsSavingAssignee(true)
                          setAssigneeError('')
                          setNewAssigneeId(memberId)
                          await onUpdateAssignee(todo.id, memberId)
                          setIsEditingAssignee(false)
                        } catch (error: any) {
                          console.error('分配任务失败:', error)
                          
                          // 恢复之前的选择
                          setNewAssigneeId(todo.assigneeId || undefined)
                          
                          if (error?.response?.status === 403) {
                            setAssigneeError('您没有权限分配此任务')
                          } else {
                            const errorData = error?.response?.data
                            let errorMsg = '更新失败，请重试'
                            
                            if (errorData) {
                              if (errorData.error && errorData.error.message) {
                                errorMsg = errorData.error.message
                              } else if (errorData.message) {
                                errorMsg = errorData.message
                              } else if (errorData.error && typeof errorData.error === 'string') {
                                errorMsg = errorData.error
                              }
                            } else if (error?.message) {
                              errorMsg = error.message
                            }
                            
                            setAssigneeError(errorMsg)
                          }
                        } finally {
                          setIsSavingAssignee(false)
                        }
                      }}
                      disabled={isSavingAssignee}
                      className={clsx(
                        "relative flex flex-col items-center gap-0.5 px-1 py-1 transition-all hover:shadow-lg bg-surface-elevated rounded border border-border shadow focus:outline-none focus:ring-0 w-[60px]",
                        isSavingAssignee && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Avatar
                        user={{
                          username: memberUsername,
                          avatar: memberAvatar
                        }}
                        size="xs"
                      />
                      <span className="text-[10px] text-foreground text-center truncate w-full" title={memberUsername}>{memberUsername}</span>
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg border border-white/50 flex items-center justify-center">
                          {isSavingAssignee ? (
                            <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
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
          <div className="flex items-center gap-1 text-xs text-foreground-secondary">
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
  
  // 如果时间差为负数（未来时间），返回具体日期
  if (diffMs < 0) {
    return date.toLocaleDateString('zh-CN')
  }
  
  // 计算时间差
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  // 刚刚（1分钟内）
  if (diffSeconds < 60) {
    return '刚刚'
  }
  
  // x分钟前（1分钟到59分钟）
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`
  }
  
  // x小时前（1小时到23小时）
  if (diffHours < 24) {
    return `${diffHours}小时前`
  }
  
  // 昨天（24小时到48小时前）
  if (diffDays === 1) {
    return '昨天'
  }
  
  // 前天（48小时到72小时前）
  if (diffDays === 2) {
    return '前天'
  }
  
  // 更早的日期显示具体日期
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

function ReplaceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  )
}

// ==================== 执行人选择器组件（内联版本）====================

interface AssigneeSelectorInlineProps {
  members: ProjectMember[]
  value: number | undefined
  onChange: (value: number | undefined) => void
  onSave: () => Promise<void>
  onCancel: () => void
  loading?: boolean
}

function AssigneeSelectorInline({ members, value, onChange, onSave, onCancel, loading }: AssigneeSelectorInlineProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const selectedMember = members.find((m) => m.user_id === value)
  const selectedUsername = selectedMember?.username || selectedMember?.user?.username || (value === undefined ? '未选定' : '未知用户')

  // 计算下拉菜单位置
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const menuHeight = Math.min(320, (members.length + 1) * 40 + 8)
      const menuWidth = 240

      let top = buttonRect.bottom + 4
      if (top + menuHeight > viewportHeight) {
        top = buttonRect.top - menuHeight - 4
      }

      let left = buttonRect.left
      if (left + menuWidth > viewportWidth) {
        left = viewportWidth - menuWidth - 8
      }
      if (left < 8) {
        left = 8
      }

      setMenuPosition({ top, left })
    } else {
      setMenuPosition(null)
    }
  }, [isOpen, members.length])

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-1.5 py-0.5 text-xs border border-border rounded bg-surface-elevated hover:bg-surface-hover focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary h-6 justify-between min-w-[120px]"
        >
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {value !== undefined ? (
              <>
                <Avatar
                  user={{
                    username: selectedMember?.username || selectedMember?.user?.username,
                    avatar: selectedMember?.avatar || selectedMember?.user?.avatar
                  }}
                  size="xs"
                />
                <span className="truncate text-xs">{selectedUsername}</span>
              </>
            ) : (
              <span className="text-foreground-secondary text-xs">未选定</span>
            )}
          </div>
          <svg className="w-3 h-3 text-foreground-tertiary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          className="p-0.5 rounded bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label="保存"
          title="保存"
        >
          {loading ? (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="p-0.5 rounded bg-surface-active text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label="取消"
          title="取消"
        >
          <XIcon className="w-3 h-3" />
        </button>
      </div>

      {isOpen && menuPosition && createPortal(
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={menuRef}
            className="fixed z-[101] w-[240px] bg-surface-elevated rounded-lg shadow-lg border border-border py-1 max-h-80 overflow-auto"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            <button
              type="button"
              onClick={() => {
                onChange(undefined)
                setIsOpen(false)
              }}
              className={clsx(
                'w-full px-2 py-1 text-left flex items-center gap-1.5 hover:bg-surface-hover transition-colors text-xs',
                value === undefined && 'bg-surface-hover'
              )}
              style={{ borderBottom: 'none' }}
            >
              <span className="text-xs text-foreground-secondary">未选定</span>
            </button>
            {members.map((member) => {
              const memberUsername = member.username || member.user?.username || '未知用户'
              const isSelected = member.user_id === value
              return (
                <button
                  key={member.user_id}
                  type="button"
                  onClick={() => {
                    onChange(member.user_id)
                    setIsOpen(false)
                  }}
                  className={clsx(
                    'w-full px-2 py-1 text-left flex items-center gap-1.5 hover:bg-surface-hover transition-colors text-xs',
                    isSelected && 'bg-surface-hover'
                  )}
                  style={{ borderBottom: 'none' }}
                >
                  <Avatar
                    user={{
                      username: memberUsername,
                      avatar: member.avatar || member.user?.avatar
                    }}
                    size="xs"
                  />
                  <span className="text-xs text-foreground flex-1">{memberUsername}</span>
                  {isSelected && (
                    <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

// ==================== 优先级选择器组件（内联版本）====================

interface PrioritySelectorInlineProps {
  value: number | null
  onChange: (value: number | null) => void
  onSave: () => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const PRIORITY_OPTIONS = [
  { value: 0, label: '最高', icon: '🔴' },
  { value: 1, label: '高', icon: '🟠' },
  { value: 2, label: '中', icon: '🟡' },
  { value: 3, label: '低', icon: '🟢' },
  { value: null, label: '未设定', icon: '⚪' },
]

function PrioritySelectorInline({ value, onChange, onSave, onCancel, loading }: PrioritySelectorInlineProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const selectedOption = PRIORITY_OPTIONS.find((p) => p.value === value) || PRIORITY_OPTIONS[4]

  // 计算下拉菜单位置
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const menuHeight = Math.min(320, PRIORITY_OPTIONS.length * 40 + 8)
      const menuWidth = 200

      let top = buttonRect.bottom + 4
      if (top + menuHeight > viewportHeight) {
        top = buttonRect.top - menuHeight - 4
      }

      let left = buttonRect.left
      if (left + menuWidth > viewportWidth) {
        left = viewportWidth - menuWidth - 8
      }
      if (left < 8) {
        left = 8
      }

      setMenuPosition({ top, left })
    } else {
      setMenuPosition(null)
    }
  }, [isOpen])

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-1.5 py-0.5 text-xs border border-border rounded bg-surface-elevated hover:bg-surface-hover focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary h-6 justify-between min-w-[100px]"
        >
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span>{selectedOption.icon}</span>
            <span className="truncate text-xs">{selectedOption.label}</span>
          </div>
          <svg className="w-3 h-3 text-foreground-tertiary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          className="p-0.5 rounded bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label="保存"
          title="保存"
        >
          {loading ? (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="p-0.5 rounded bg-surface-active text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label="取消"
          title="取消"
        >
          <XIcon className="w-3 h-3" />
        </button>
      </div>

      {isOpen && menuPosition && createPortal(
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={menuRef}
            className="fixed z-[101] w-[200px] bg-surface-elevated rounded-lg shadow-lg border border-border py-1 max-h-80 overflow-auto"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            {PRIORITY_OPTIONS.map((option) => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value ?? 'none'}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={clsx(
                    'w-full px-2 py-1 text-left flex items-center gap-1.5 hover:bg-surface-hover transition-colors text-xs',
                    isSelected && 'bg-surface-hover'
                  )}
                  style={{ borderBottom: 'none' }}
                >
                  <span className="text-xs">{option.icon}</span>
                  <span className="text-xs text-foreground flex-1">{option.label}</span>
                  {isSelected && (
                    <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}


// ==================== 标签选择器组件（内联版本）====================

interface TagSelectorInlineProps {
  projectId: string
  currentTags?: string | null
  selectedTagIds: number[]
  onChange: (tagIds: number[]) => void
  onSave: () => Promise<void>
  onCancel: () => void
  loading?: boolean
}

function TagSelectorInline({ projectId, currentTags, selectedTagIds, onChange, onSave, onCancel, loading }: TagSelectorInlineProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { getProjectTags } = useTagStore()

  const projectTags = getProjectTags(projectId)
  const selectedTags = projectTags.filter(tag => selectedTagIds.includes(tag.id))

  // 计算下拉菜单位置
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const menuHeight = Math.min(400, (projectTags.length + 1) * 50 + 60)
      const menuWidth = 280

      let top = buttonRect.bottom + 4
      if (top + menuHeight > viewportHeight) {
        top = buttonRect.top - menuHeight - 4
      }

      let left = buttonRect.left
      if (left + menuWidth > viewportWidth) {
        left = viewportWidth - menuWidth - 8
      }
      if (left < 8) {
        left = 8
      }

      setMenuPosition({ top, left })
    } else {
      setMenuPosition(null)
    }
  }, [isOpen, projectTags.length])

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleTagToggle = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId))
    } else {
      onChange([...selectedTagIds, tagId])
    }
  }

  const getButtonText = () => {
    if (selectedTags.length === 0) {
      return '选择标签'
    }
    if (selectedTags.length === 1) {
      return selectedTags[0].displayName
    }
    return `已选 ${selectedTags.length} 个`
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-1.5 py-0.5 text-xs border border-border rounded bg-surface-elevated hover:bg-surface-hover focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary h-6 justify-between min-w-[100px]"
        >
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {selectedTags.length > 0 ? (
              <>
                {selectedTags.slice(0, 1).map(tag => (
                  <TagDisplay key={tag.id} tag={tag} size="xs" />
                ))}
                {selectedTags.length > 1 && (
                  <span className="text-xs text-gray-500">+{selectedTags.length - 1}</span>
                )}
              </>
            ) : (
              <span className="text-foreground-secondary text-xs truncate">{getButtonText()}</span>
            )}
          </div>
          <svg className="w-3 h-3 text-foreground-tertiary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          className="p-0.5 rounded bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label="保存"
          title="保存"
        >
          {loading ? (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="p-0.5 rounded bg-surface-active text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label="取消"
          title="取消"
        >
          <XIcon className="w-3 h-3" />
        </button>
      </div>

      {isOpen && menuPosition && createPortal(
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={menuRef}
            className="fixed z-[101] w-[280px] bg-surface-elevated rounded-lg shadow-lg border border-border py-1 max-h-[400px] overflow-auto"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            {projectTags.length > 0 ? (
              <div className="py-1">
                {projectTags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag.id)
                  return (
                    <div
                      key={tag.id}
                      className={clsx(
                        'px-2 py-1.5 hover:bg-gray-100 transition-colors',
                        isSelected && 'bg-surface-hover'
                      )}
                    >
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTagToggle(tag.id)}
                          className="w-3.5 h-3.5 text-primary border-gray-300 rounded focus:ring-primary flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <TagDisplay tag={tag} size="xs" />
                      </label>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="px-3 py-4 text-xs text-foreground-secondary text-center">
                暂无标签
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
