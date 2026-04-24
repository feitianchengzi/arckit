'use client'

/**
 * TodoTreeItem - 树形任务项组件
 * 支持递归嵌套展示子任务，类似 Reddit 的板块效果
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { StatusBadge, StatusSelect, Avatar } from '@/components/ui'
import { TagList, PriorityBadge, TaskContentDialog } from './'
import { parseTaskTags, buildTaskTags } from '@/lib/utils/tagUtils'
import { getFirstNonEmptyLine, hasMultipleLines } from '@/lib/utils/contentUtils'
import type { Todo, TodoStatus, ProjectMember } from '@/types'
import { TodoItem } from './TodoItem'
import { XIcon } from '@/components/ui/icons'
import { useTagStore } from '@/store/tagStore'
import { TagDisplay } from './TagDisplay'
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
  onSelectParent?: (todoId: number) => void // 选择父待办回调
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
  parentExpanded = false,
  members = [],
  canAssignAssignee = false,
  onUpdateAssignee,
  canEditPriority = false,
  onUpdatePriority,
  canEditTags = false,
  onUpdateTags,
  onClick,
  currentUserRole = null,
  selectionMode = false,
  selectionDisabled = false,
  selectionDisabledIds,
  onSelectParent,
}: TodoTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false) // 默认不展开
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false)
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false)
  const [isEditingAssignee, setIsEditingAssignee] = useState(false)
  const [isEditingPriority, setIsEditingPriority] = useState(false)
  const [isEditingTags, setIsEditingTags] = useState(false)
  const [newAssigneeId, setNewAssigneeId] = useState<number | null | undefined>(undefined)
  const [newPriority, setNewPriority] = useState<number | null | undefined>(undefined)
  const [newTagIds, setNewTagIds] = useState<number[] | null>(null)
  const [isUpdatingTags, setIsUpdatingTags] = useState(false)
  const [showContentDialog, setShowContentDialog] = useState(false)
  const navigate = useNavigate()
  const { loadProjectTags, getProjectTags } = useTagStore()
  const theme = useThemeStore((state) => state.theme)
  
  // 提取第一行内容
  const firstLine = useMemo(() => getFirstNonEmptyLine(todo.content), [todo.content])
  const firstLineDisplay = useMemo(() => decodeUrlsInTextForDisplay(firstLine), [firstLine])
  const hasMoreLines = useMemo(() => hasMultipleLines(todo.content), [todo.content])
  const contentTitleDisplay = useMemo(() => decodeUrlsInTextForDisplay(todo.content), [todo.content])
  
  // 是否有子任务
  const hasChildren = todo.children && todo.children.length > 0
  
  const handleDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation() // 阻止触发父元素的点击事件
    if (selectionMode) return
    setShowContentDialog(true)
  }
  
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
        canAssignAssignee={canAssignAssignee}
        onUpdateAssignee={onUpdateAssignee}
        canEditPriority={canEditPriority}
        onUpdatePriority={onUpdatePriority}
        canEditTags={canEditTags}
        onUpdateTags={onUpdateTags}
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
          !isChildTask && 'mb-2',
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
            <div>
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
                  canAssignAssignee={canAssignAssignee}
                  onUpdateAssignee={onUpdateAssignee}
                  canEditPriority={canEditPriority}
                  onUpdatePriority={onUpdatePriority}
                  canEditTags={canEditTags}
                  onUpdateTags={onUpdateTags}
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
        !isChildTask && 'mb-2',
        selectionMode && isSelectionDisabled && 'opacity-60'
      )}
    >
      {/* 任务项 */}
      <div
        className={clsx(
          'relative',
          'group',
          backgroundColor, // 使用渐变背景色
          isChildTask
            ? 'border-t border-border' // 子任务：只有上分割线
            : 'border border-border', // 根任务：完整border
          !isChildTask && !selectionMode && 'hover:shadow-md hover:border-primary transition-all', // 根任务hover效果
          !isChildTask && selectionMode && 'transition-all hover:border-primary/60'
        )}
      >
        {/* 主任务内容 */}
        <div
          onClick={handleClick}
          className={clsx(
            'p-3 space-y-2',
            !selectionMode ? 'cursor-pointer' : 'cursor-default',
            selectionMode && isSelectionDisabled && 'cursor-not-allowed',
            hasChildren && isExpanded && !isChildTask && 'border-b border-divider' // 根任务有子任务且展开时添加底部分隔线
          )}
        >
          {/* 头部：内容 + 状态 */}
          <div className="flex items-start gap-3">
            {/* 任务内容和标签/优先级 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-base font-medium text-foreground truncate flex-1" title={contentTitleDisplay}>
                  {firstLineDisplay || '无内容'}
                </h3>
                {hasMoreLines && (
                  <button
                    onClick={handleDetailClick}
                    className="flex-shrink-0 text-foreground-secondary hover:text-foreground transition-colors p-1"
                    title="查看详情"
                    aria-label="查看详情"
                  >
                    <DetailIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
              
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
                  <span className="flex items-center gap-1 text-xs text-foreground-secondary font-bold">
                    <PriorityIcon className="w-3.5 h-3.5 text-foreground-secondary" />
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
            
            {/* 状态选择/显示 */}
            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0 flex flex-col items-end gap-2">
              {canEdit ? (
                <StatusSelect
                  value={todo.status}
                  onChange={handleStatusChange}
                  size="sm"
                />
              ) : (
                <StatusBadge status={todo.status} size="sm" />
              )}
              {selectionMode && (
                isSelectionDisabled ? (
                  <div className="flex items-center gap-1 text-xs text-foreground-tertiary">
                    <DisabledIcon className="w-3.5 h-3.5" />
                    不可选
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectParent?.(todo.id)
                    }}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    选择
                  </button>
                )
              )}
            </div>
          </div>
          
          {/* 底部信息：创建人、执行人、时间 */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-5 flex-wrap">
              {/* 创建者 */}
              {todo.creator && (
                <div className="flex items-center gap-0.5 text-xs text-foreground-secondary whitespace-nowrap">
                  <span className="text-foreground-secondary font-bold">创建：</span>
                  <Avatar user={todo.creator} size="xs" />
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
                </div>
              )}
              
              {/* 执行者 - 始终显示 */}
              <div className="flex items-center gap-0.5 text-xs text-foreground-secondary whitespace-nowrap">
                <span className="text-foreground-secondary font-bold">执行：</span>
                {isEditingAssignee && canAssignAssignee && onUpdateAssignee && members.length > 0 ? (
                  <AssigneeSelectorInline
                    members={members}
                    value={newAssigneeId !== undefined ? newAssigneeId : (todo.assigneeId || undefined)}
                    onChange={setNewAssigneeId}
                    onSave={async () => {
                      try {
                        setIsUpdatingAssignee(true)
                        await onUpdateAssignee(todo.id, newAssigneeId ?? null)
                        setIsEditingAssignee(false)
                        setNewAssigneeId(undefined)
                      } catch (error) {
                        console.error('更新执行人失败:', error)
                      } finally {
                        setIsUpdatingAssignee(false)
                      }
                    }}
                    onCancel={() => {
                      setIsEditingAssignee(false)
                      setNewAssigneeId(undefined)
                    }}
                    loading={isUpdatingAssignee}
                  />
                ) : todo.assignee ? (
                  <div className="flex items-center gap-1">
                    <Avatar user={todo.assignee} size="xs" />
                    <span
                      className={clsx(
                        'font-medium',
                        currentUserId !== null &&
                          currentUserId !== undefined &&
                          todo.assigneeId === currentUserId &&
                          'text-blue-600'
                      )}
                    >
                      {todo.assignee.username}
                    </span>
                    {canAssignAssignee && onUpdateAssignee && members.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsEditingAssignee(true)
                          setNewAssigneeId(todo.assigneeId || undefined)
                        }}
                        className="p-0.5 rounded hover:bg-surface-hover transition-colors text-foreground-secondary hover:text-foreground"
                        aria-label="更换执行人"
                        title="更换执行人"
                      >
                        <ReplaceIcon className="w-3 h-3" />
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
                          setIsEditingAssignee(true)
                          setNewAssigneeId(undefined)
                        }}
                        className="p-0.5 rounded hover:bg-surface-hover transition-colors text-foreground-secondary hover:text-foreground"
                        aria-label="设置执行人"
                        title="设置执行人"
                      >
                        <ReplaceIcon className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* 子任务指示器 - 可点击展开/折叠 */}
              {hasChildren && (
                <button
                  onClick={handleToggleExpand}
                  className={clsx(
                    "flex items-center gap-1 text-xs transition-colors",
                    isExpanded 
                      ? "text-foreground hover:text-foreground" 
                      : "text-primary hover:text-primary-600"
                  )}
                  title={isExpanded ? '折叠子任务' : '展开子任务'}
                >
                  <SubtaskIcon className="w-3.5 h-3.5" />
                  <span>{todo.children!.length} 个子待办</span>
                  <ChevronIcon isExpanded={isExpanded} />
                </button>
              )}
              
              {/* 创建时间 */}
              <div className="flex items-center gap-1 text-xs text-foreground-secondary">
                <ClockIcon className="w-3.5 h-3.5" />
                <span>{formatDate(todo.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 子任务列表 */}
        {hasChildren && isExpanded && (
          <div>
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
                canAssignAssignee={canAssignAssignee}
                onUpdateAssignee={onUpdateAssignee}
                canEditPriority={canEditPriority}
                onUpdatePriority={onUpdatePriority}
                canEditTags={canEditTags}
                onUpdateTags={onUpdateTags}
                onClick={onClick} // 传递 onClick 回调，确保子待办也能在抽屉中打开
                selectionMode={selectionMode}
                selectionDisabledIds={selectionDisabledIds}
                onSelectParent={onSelectParent}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* 内容详情弹窗 */}
      <TaskContentDialog
        open={showContentDialog}
        onClose={() => setShowContentDialog(false)}
        content={todo.content}
        title="任务详情"
      />
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
          <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          className="p-0.5 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
            className="fixed z-[101] w-[200px] rounded-lg shadow-lg border border-border py-1 max-h-80 overflow-auto"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              backgroundColor: 'var(--color-surface-elevated)'
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
                    isSelected && 'bg-surface-active'
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

function DetailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          className="p-0.5 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
            className="fixed z-[101] w-[240px] rounded-lg shadow-lg border border-border py-1 max-h-80 overflow-auto"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              backgroundColor: 'var(--color-surface-elevated)'
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
                value === undefined && 'bg-surface-active'
              )}
              style={{ borderBottom: 'none' }}
            >
              <span className="text-xs text-gray-500">未选定</span>
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
                    isSelected && 'bg-surface-active'
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
                  <TagDisplay key={tag.id} tag={tag} size="sm" />
                ))}
                {selectedTags.length > 1 && (
                  <span className="text-xs text-gray-500">+{selectedTags.length - 1}</span>
                )}
              </>
            ) : (
              <span className="text-gray-500 text-xs truncate">{getButtonText()}</span>
            )}
          </div>
          <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          className="p-0.5 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
            className="fixed z-[101] w-[280px] rounded-lg shadow-lg border border-border py-1 max-h-[400px] overflow-auto"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              backgroundColor: 'var(--color-surface-elevated)'
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
                        'px-2 py-1.5 hover:bg-surface-hover transition-colors',
                        isSelected && 'bg-surface-active'
                      )}
                    >
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTagToggle(tag.id)}
                          className="w-3.5 h-3.5 text-primary border-border rounded focus:ring-primary flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <TagDisplay tag={tag} size="sm" />
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
