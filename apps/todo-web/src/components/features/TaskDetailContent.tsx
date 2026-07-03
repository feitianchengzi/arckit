/**
 * TaskDetailContent - 待办详情内容组件
 * 可以在页面或抽屉中使用
 */

import { useState, useRef, useEffect, useMemo, Children, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, LoadingView, ErrorView, ConfirmDialog, Avatar } from '@/components/ui'
import { XIcon, ChevronDownIcon, TrashIcon, LinkIcon } from '@/components/ui/icons'
import { showGlobalToast } from '@/components/ui/Toast'
import { TagSelector, CommentSection, TagList } from '@/components/features'
import {
  getLinearPriorityOption,
  getLinearStatusOption,
  LinearPriorityMarker,
  LinearPriorityMenu,
  LinearStatusMarker,
  LinearStatusMenu,
} from './TodoItem'
import { useTask, useUpdateTask, useDeleteTask, useUpdateTaskStatus } from '@/hooks/useTasks'
import { useProject, useProjectMembers } from '@/hooks/useProjects'
import { useOrganizationStore } from '@/store/organizationStore'
import { useOrganizationMembers } from '@/hooks/useOrganizations'
import { useAuthStore } from '@/store/authStore'
import type { TodoStatus } from '@/types'
import ReactMarkdown from 'react-markdown'
import { normalizeMarkdown } from '@/lib/utils/markdown'
import { permissionManager } from '@/lib/permissions'
import { isAssigneeUnassigned } from '@/lib/permissions/utils'
import type { TaskInfo } from '@/lib/permissions'
import clsx from 'clsx'
import { buildRouteFromState, getRouteFromState } from '@/lib/utils/navigationState'
import { buildProjectPath } from '@/lib/utils/projectRouting'
import { decodeUrlForDisplay, decodeUrlsInTextForDisplay } from '@/lib/utils/urlDisplay'

function getLinkDisplayChildren(children: React.ReactNode, href?: string): React.ReactNode {
  if (!href) return children
  const parts = Children.toArray(children)
  if (!parts.length) return children
  if (!parts.every((part) => typeof part === 'string' || typeof part === 'number')) {
    return children
  }
  const rawText = parts.join('')
  const trimmedText = rawText.trim()
  if (!trimmedText || !/%[0-9A-Fa-f]{2}/.test(trimmedText)) return children

  const decoded = decodeUrlForDisplay(trimmedText)
  if (decoded === trimmedText) return children

  const leadingSpace = rawText.match(/^\s*/)?.[0] ?? ''
  const trailingSpace = rawText.match(/\s*$/)?.[0] ?? ''
  return `${leadingSpace}${decoded}${trailingSpace}`
}

function getTextDisplayChildren(children?: React.ReactNode): React.ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === 'string') {
      return decodeUrlsInTextForDisplay(child)
    }
    return child
  })
}

function formatRelativeTimeZh(value?: string | null): string {
  if (!value) return '刚刚'
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return '刚刚'

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (seconds < 60) return '刚刚'

  const units: Array<[number, string]> = [
    [365 * 24 * 60 * 60, '年'],
    [30 * 24 * 60 * 60, '个月'],
    [24 * 60 * 60, '天'],
    [60 * 60, '小时'],
    [60, '分钟'],
  ]

  for (const [unitSeconds, label] of units) {
    if (seconds >= unitSeconds) {
      return `${Math.floor(seconds / unitSeconds)} ${label}前`
    }
  }

  return '刚刚'
}

export interface TaskDetailContentProps {
  projectId: string
  taskId: string
  onDelete?: () => void // 删除后的回调
  showHeader?: boolean // 是否显示头部（返回按钮等）
  onClose?: () => void // 关闭回调（用于抽屉）
  parentTaskId?: number | null // 父任务ID（用于回退）
  onNavigateToSubtask?: (subtaskId: number) => void // 导航到子待办的回调
  hideCopyLinkButton?: boolean // 是否隐藏内容区的复制链接按钮
}

export function TaskDetailContent({ 
  projectId, 
  taskId, 
  onDelete,
  showHeader = true,
  onClose,
  parentTaskId,
  onNavigateToSubtask,
  hideCopyLinkButton = false
}: TaskDetailContentProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { data: project } = useProject(projectId)
  const { data: todo, isLoading, error, refetch } = useTask(projectId, taskId)
  const currentPath = `${location.pathname}${location.search}${location.hash}`
  const backPath = getRouteFromState(location.state)
  
  // 获取父任务信息（如果有）
  const parentTask = (todo as any)?.parentTask
  const updateTask = useUpdateTask(projectId, taskId)
  const deleteTask = useDeleteTask(projectId)
  const updateStatus = useUpdateTaskStatus(projectId)
  
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [updateError, setUpdateError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [statusUpdateError, setStatusUpdateError] = useState('')
  const [openDetailMenu, setOpenDetailMenu] = useState<'status' | 'priority' | 'assignee' | null>(null)
  const tabHeaderRef = useRef<HTMLDivElement>(null)
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)
  
  const { data: members } = useProjectMembers(projectId)
  const { currentOrganizationId } = useOrganizationStore()
  const { data: orgMembers } = useOrganizationMembers(currentOrganizationId || 0)
  const currentUser = useAuthStore((state) => state.user)
  // 从成员列表中查找创建者和执行者信息
  const creatorInfo = Array.isArray(members) ? members.find((m: any) => m.user_id === todo?.creatorId) : undefined
  const executorInfo = Array.isArray(members) ? members.find((m: any) => m.user_id === todo?.assigneeId) : undefined
  
  // 获取创建者和执行者的用户名
  const creatorUsername = todo?.creator?.username || creatorInfo?.username || creatorInfo?.user?.username || '未知'
  const executorUsername = todo?.assignee?.username || executorInfo?.username || executorInfo?.user?.username || '未分配'
  
  // 获取当前用户在项目中的角色（通过 is_me 字段）
  const currentUserMember = (members as any)?.find((m: any) => m.is_me === true)
  const currentUserRole = currentUserMember?.role || null
  const currentUserId = currentUserMember?.user_id || null
  
  // 检查当前用户是否是任务创建者或执行者（通过 user_id 比较，更可靠）
  const isCreator = todo?.creatorId !== undefined && todo?.creatorId !== null && currentUserId !== null && todo.creatorId === currentUserId
  const isAssignee = todo?.assigneeId !== undefined && todo?.assigneeId !== null && currentUserId !== null && todo.assigneeId === currentUserId
  
  // 判断执行者是否未分配（用于显示和提示）
  const isAssigneeUnassignedLocal = !todo?.assigneeId || executorUsername === '未分配'
  
  // 权限检查：编辑任务内容
  // 当状态为"进行中"时，只有执行人、管理员、owner可以编辑
  // 非"进行中"的任何项目角色都可以编辑
  const canEditContent = useMemo(() => {
    if (!todo) return false
    const taskInfo: TaskInfo = {
      id: todo.id,
      creatorId: todo.creatorId,
      assigneeId: todo.assigneeId,
      status: todo.status,
      projectId: todo.projectId
    }
    const isProjectMember = !!currentUserMember
    return permissionManager.task.hasEditPermission(
      taskInfo,
      currentUserRole,
      currentUserId,
      isProjectMember
    )
  }, [todo, currentUserRole, currentUserId, currentUserMember])
  
  // 权限检查：删除任务（仅创建人/项目owner/admin）
  const canDelete = useMemo(() => {
    if (!todo) return false
    const isOwnerOrAdmin = currentUserRole === 'owner' || currentUserRole === 'admin'
    const isCreator = currentUserId !== null && currentUserId !== undefined && todo.creatorId === currentUserId
    return isOwnerOrAdmin || isCreator
  }, [todo, currentUserRole, currentUserId])

  // 权限检查：分配执行者
  // 规则：
  // - 当状态为"进行中"时，只有执行人、管理员、owner可以分配执行人
  // - 非"进行中"的任何项目角色都可以分配执行人
  const canEditAssignee = useMemo(() => {
    if (!todo) return false
    
    const taskInfo: TaskInfo = {
      id: todo.id,
      creatorId: todo.creatorId,
      assigneeId: todo.assigneeId,
      status: todo.status,
      projectId: todo.projectId
    }
    const isUnassigned = isAssigneeUnassigned(todo.assigneeId)
    const isProjectMember = !!currentUserMember
    
    return permissionManager.task.hasAssignAssigneePermission(
      taskInfo,
      currentUserRole,
      currentUserId,
      isUnassigned,
      isProjectMember
    )
  }, [todo, currentUserRole, currentUserId, currentUserMember])
  
  // 权限检查：修改状态
  // 当状态为"进行中"时，只有执行人、管理员、owner可以修改
  // 非"进行中"的任何项目角色都可以修改
  const canChangeStatus = useMemo(() => {
    if (!todo) return false
    const taskInfo: TaskInfo = {
      id: todo.id,
      creatorId: todo.creatorId,
      assigneeId: todo.assigneeId,
      status: todo.status,
      projectId: todo.projectId
    }
    const isProjectMember = !!currentUserMember
    return permissionManager.task.hasStatusChangePermission(
      taskInfo,
      currentUserRole,
      currentUserId,
      isProjectMember
    )
  }, [todo, currentUserRole, currentUserId, currentUserMember])
  
  // 权限检查：编辑优先级
  // 当状态为"进行中"时，只有执行人、管理员、owner可以编辑优先级
  // 非"进行中"的任何项目角色都可以编辑优先级
  const canEditPriority = useMemo(() => {
    if (!todo) return false
    const taskInfo: TaskInfo = {
      id: todo.id,
      creatorId: todo.creatorId,
      assigneeId: todo.assigneeId,
      status: todo.status,
      projectId: todo.projectId
    }
    const isProjectMember = !!currentUserMember
    return permissionManager.task.hasEditPriorityPermission(
      taskInfo,
      currentUserRole,
      currentUserId,
      isProjectMember
    )
  }, [todo, currentUserRole, currentUserId, currentUserMember])
  
  // 权限检查：编辑标签
  // 当状态为"进行中"时，只有执行人、管理员、owner可以编辑标签
  // 非"进行中"的任何项目角色都可以编辑标签
  const canEditTags = useMemo(() => {
    if (!todo) return false
    const taskInfo: TaskInfo = {
      id: todo.id,
      creatorId: todo.creatorId,
      assigneeId: todo.assigneeId,
      status: todo.status,
      projectId: todo.projectId
    }
    const isProjectMember = !!currentUserMember
    return permissionManager.task.hasEditTagsPermission(
      taskInfo,
      currentUserRole,
      currentUserId,
      isProjectMember
    )
  }, [todo, currentUserRole, currentUserId, currentUserMember])

  const handleCopyTaskLink = async () => {
    try {
      const detailUrl = `${window.location.origin}${buildProjectPath(projectId, `tasks/${taskId}`)}`
      await navigator.clipboard.writeText(detailUrl)
      showGlobalToast('详情链接已复制', 'success', 2000)
    } catch (error) {
      console.error('复制详情链接失败:', error)
      showGlobalToast('复制失败，请手动复制', 'error', 2500)
    }
  }

  const handleBack = () => {
    if (backPath) {
      navigate(-1)
      return
    }

    navigate('/tasks', { replace: true })
  }

  useEffect(() => {
    if (!isEditing) return

    const frame = requestAnimationFrame(() => {
      const textarea = editTextareaRef.current
      if (!textarea) return

      textarea.focus()
      const end = textarea.value.length
      textarea.setSelectionRange(end, end)
    })

    return () => cancelAnimationFrame(frame)
  }, [isEditing])
  
  // 加载状态
  if (isLoading) {
    return <LoadingView size="lg" text="加载待办详情..." />
  }
  
  // 错误状态
  if (error || !todo) {
    return (
      <ErrorView
        title="加载失败"
        message="无法获取待办详情，请稍后重试"
        onRetry={() => refetch()}
      />
    )
  }
  
  // 进入编辑模式
  const handleEdit = () => {
    setEditContent(todo.content)
    setIsEditing(true)
    setUpdateError('')
  }
  
  // 保存编辑
  const handleSave = async () => {
    setUpdateError('')
    
    if (!editContent.trim()) {
      setUpdateError('待办内容不能为空')
      return
    }
    
    try {
      await updateTask.mutateAsync({ content: editContent.trim() })
      setIsEditing(false)
    } catch (err: any) {
      setUpdateError(err.response?.data?.message || '更新失败，请重试')
    }
  }
  
  // 取消编辑
  const handleCancel = () => {
    setIsEditing(false)
    setEditContent('')
    setUpdateError('')
  }

  const handleInlineContentBlur = async () => {
    if (!isEditing) return

    const nextContent = editContent.trim()
    if (nextContent === todo.content.trim()) {
      setIsEditing(false)
      setEditContent('')
      setUpdateError('')
      return
    }

    if (!nextContent) {
      setUpdateError('待办内容不能为空')
      requestAnimationFrame(() => editTextareaRef.current?.focus())
      return
    }

    setUpdateError('')
    try {
      await updateTask.mutateAsync({ content: nextContent })
      setIsEditing(false)
      setEditContent('')
    } catch (err: any) {
      setUpdateError(err.response?.data?.message || '更新失败，请重试')
      requestAnimationFrame(() => editTextareaRef.current?.focus())
    }
  }

  // 处理状态变更
  const handleStatusChange = async (newStatus: TodoStatus) => {
    setStatusUpdateError('')
    
    if (newStatus === todo.status) {
      return
    }
    
    // 权限检查：使用权限管理器检查是否有权限修改状态
    if (!canChangeStatus) {
      setStatusUpdateError('没有权限修改此任务的状态')
      return
    }
    
    try {
      await updateStatus.mutateAsync({ taskId, status: newStatus })
    } catch (err: any) {
      setStatusUpdateError(err.response?.data?.message || '状态更新失败，请重试')
    }
  }

  const handleDetailStatusChange = async (newStatus: TodoStatus) => {
    await handleStatusChange(newStatus)
    setOpenDetailMenu(null)
  }

  const handleDetailPriorityChange = async (priority: number | null) => {
    if (!canEditPriority) {
      setUpdateError('没有权限修改此任务的优先级')
      return
    }

    setUpdateError('')
    try {
      await updateTask.mutateAsync({ priority: priority ?? undefined })
      setOpenDetailMenu(null)
    } catch (err: any) {
      setUpdateError(err.response?.data?.message || '优先级更新失败，请重试')
    }
  }

  const handleDetailAssigneeChange = async (assigneeId: number | null) => {
    if (!canEditAssignee) {
      setUpdateError(
        isAssigneeUnassignedLocal
          ? '您没有权限分配此任务，只有项目成员可以分配未分配的任务'
          : '您没有权限分配此任务，只有任务创建者、执行人、项目管理员或所有者可以分配任务'
      )
      return
    }

    setUpdateError('')
    try {
      await updateTask.mutateAsync({ assigneeId })
      setOpenDetailMenu(null)
    } catch (err: any) {
      const errorData = err?.response?.data
      const errorMsg =
        errorData?.error?.message ||
        errorData?.message ||
        (typeof errorData?.error === 'string' ? errorData.error : '') ||
        err?.message ||
        '更新失败，请重试'
      setUpdateError(errorMsg)
    }
  }
  
  // 处理删除
  const handleDelete = async () => {
    try {
      await deleteTask.mutateAsync(taskId)
      if (onDelete) {
        onDelete()
      } else if (onClose) {
        onClose()
      } else {
        navigate(buildProjectPath(projectId))
      }
    } catch (err: any) {
      alert(err.response?.data?.message || '删除失败，请重试')
      setShowDeleteConfirm(false)
    }
  }


  // 处理评论添加后的滚动
  const handleCommentAdded = () => {
    // 等待 DOM 更新
    setTimeout(() => {
      if (tabHeaderRef.current) {
        const rect = tabHeaderRef.current.getBoundingClientRect()
        // 找到滚动的容器（通常是 window 或最近的滚动父级）
        // 这里假设是 window 或 body 滚动，如果是 Drawer 内部滚动，需要找到对应的容器
        // 获取当前滚动容器（Drawer 的内容区域）
        const scrollContainer = tabHeaderRef.current.closest('.overflow-y-auto') as HTMLElement
        
        if (scrollContainer) {
          // 计算目标位置：当前滚动位置 + 元素相对容器的位置 - 偏移量
          // offsetTop 是元素相对于 offsetParent 的位置
          // 我们需要计算元素相对于滚动容器顶部的距离
          const containerRect = scrollContainer.getBoundingClientRect()
          const relativeTop = rect.top - containerRect.top + scrollContainer.scrollTop
          
          scrollContainer.scrollTo({
            top: relativeTop - 22, // 向上偏移 25px
            behavior: 'smooth'
          })
        } else {
          // 兜底：如果是 window 滚动
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop
          const targetTop = rect.top + scrollTop - 22
          window.scrollTo({
            top: targetTop,
            behavior: 'smooth'
          })
        }
      }
    }, 100)
  }
  
  return (
    <div className="space-y-4 md:space-y-6 p-6">
      {/* 页面头部 */}
      {showHeader && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 p-6 pb-4">
          <div className="flex items-center gap-2 md:gap-3">
            {/* 返回按钮 */}
            {onClose ? (
              <button
                onClick={onClose}
                className="text-foreground-secondary hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="关闭"
                aria-label="关闭"
              >
                <BackIcon className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            ) : (
              <button
                onClick={handleBack}
                className="text-foreground-secondary hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="返回上一页"
                aria-label="返回上一页"
              >
                <BackIcon className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            )}
            
            {/* 父任务图标（如果有） */}
            {parentTask && (
              <button
                onClick={() => {
                  if (onClose) onClose()
                  navigate(buildProjectPath(projectId, `tasks/${parentTask.id}`), {
                    state: buildRouteFromState(currentPath),
                  })
                }}
                className="text-gray-600 hover:text-gray-900 relative group min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="查看父任务"
              >
                <ParentTaskIcon className="w-5 h-5 md:w-6 md:h-6" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-10 pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs rounded py-1.5 px-2.5 whitespace-nowrap shadow-lg">
                    父任务：{parentTask.title || parentTask.content.substring(0, 30)}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </button>
            )}
            
            {/* 项目详情图标 */}
            <button
              onClick={() => {
                if (onClose) onClose()
                navigate(buildProjectPath(projectId))
              }}
              className="text-gray-600 hover:text-gray-900 relative group min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="查看项目详情"
            >
              <ProjectIcon className="w-5 h-5 md:w-6 md:h-6" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-10 pointer-events-none">
                <div className="bg-gray-900 text-white text-xs rounded py-1.5 px-2.5 whitespace-nowrap shadow-lg">
                  项目详情：{project?.name || '项目'}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </button>
            
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">待办详情</h1>
              {project && (
                <p className="mt-1 text-sm md:text-base text-foreground-secondary">项目：{project.name}</p>
              )}
            </div>
          </div>
          
          {!isEditing && (!hideCopyLinkButton || canDelete) && (
            <div className="flex gap-3">
              {!hideCopyLinkButton && (
                <Button variant="secondary" onClick={handleCopyTaskLink}>
                  <span className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    复制链接
                  </span>
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  loading={deleteTask.isPending}
                >
                  删除
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      
      <section className="task-detail-linear-section">
        <div className="task-detail-linear-summary" aria-label="待办属性">
          <span
            className="task-detail-property-control"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={clsx('task-detail-summary-chip', openDetailMenu === 'status' && 'is-active')}
              aria-label={`切换状态：${getLinearStatusOption(todo.status).label}`}
              aria-haspopup="menu"
              aria-expanded={openDetailMenu === 'status'}
              disabled={!canChangeStatus || updateStatus.isPending}
              onClick={() => setOpenDetailMenu((current) => (current === 'status' ? null : 'status'))}
            >
              <LinearStatusMarker status={todo.status} />
              <span>{getLinearStatusOption(todo.status).label}</span>
            </button>
            {openDetailMenu === 'status' && (
              <LinearStatusMenu
                currentStatus={todo.status}
                updating={updateStatus.isPending}
                onChange={handleDetailStatusChange}
                onClose={() => setOpenDetailMenu(null)}
              />
            )}
          </span>

          <span
            className="task-detail-property-control"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={clsx('task-detail-summary-chip', openDetailMenu === 'priority' && 'is-active')}
              aria-label={`切换优先级：${getLinearPriorityOption(todo.priority ?? null).label}`}
              aria-haspopup="menu"
              aria-expanded={openDetailMenu === 'priority'}
              disabled={!canEditPriority || updateTask.isPending}
              onClick={() => setOpenDetailMenu((current) => (current === 'priority' ? null : 'priority'))}
            >
              <LinearPriorityMarker priority={todo.priority ?? null} />
              <span>{getLinearPriorityOption(todo.priority ?? null).label}</span>
            </button>
            {openDetailMenu === 'priority' && (
              <LinearPriorityMenu
                currentPriority={todo.priority ?? null}
                updating={updateTask.isPending}
                onChange={handleDetailPriorityChange}
                onClose={() => setOpenDetailMenu(null)}
              />
            )}
          </span>

          <TaskDetailAssigneeControl
            open={openDetailMenu === 'assignee'}
            disabled={!canEditAssignee || updateTask.isPending}
            updating={updateTask.isPending}
            members={Array.isArray(members) ? members : []}
            assigneeId={todo.assigneeId ?? null}
            assigneeName={executorUsername}
            assigneeAvatar={executorInfo?.avatar || executorInfo?.user?.avatar || todo?.assignee?.avatar}
            onToggle={() => setOpenDetailMenu((current) => (current === 'assignee' ? null : 'assignee'))}
            onClose={() => setOpenDetailMenu(null)}
            onChange={handleDetailAssigneeChange}
          />
        </div>

        {statusUpdateError && (
          <p className="task-detail-error-text">{statusUpdateError}</p>
        )}

        <div className="task-detail-content-block">
          {isEditing ? (
            <textarea
              ref={editTextareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleInlineContentBlur}
              rows={8}
              className="task-detail-content-editor"
              disabled={updateTask.isPending}
            />
          ) : (
            <div
              role={canEditContent ? 'button' : undefined}
              tabIndex={canEditContent ? 0 : undefined}
              onClick={() => {
                if (canEditContent) handleEdit()
              }}
              onKeyDown={(event) => {
                if (canEditContent && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault()
                  handleEdit()
                }
              }}
              className={clsx('task-detail-content-display prose prose-sm max-w-none', canEditContent && 'is-editable')}
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
              }}
            >
              <ReactMarkdown
                components={{
                  p: ({ children }: { children?: React.ReactNode }) => <p className="text-foreground mb-3 last:mb-0">{getTextDisplayChildren(children)}</p>,
                  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-xl font-bold text-foreground mb-3 mt-4 first:mt-0">{getTextDisplayChildren(children)}</h1>,
                  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-lg font-bold text-foreground mb-2 mt-4 first:mt-0">{getTextDisplayChildren(children)}</h2>,
                  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-base font-bold text-foreground mb-2 mt-3 first:mt-0">{getTextDisplayChildren(children)}</h3>,
                  code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
                    inline ? (
                      <code className="bg-surface-active text-foreground px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                    ) : (
                      <code className="block bg-surface-active text-foreground p-3 rounded text-sm font-mono overflow-x-auto mb-3">{children}</code>
                    ),
                  pre: ({ children }: { children?: React.ReactNode }) => <pre className="bg-surface-active text-foreground p-3 rounded text-sm font-mono overflow-x-auto mb-3">{children}</pre>,
                  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc list-inside mb-3 space-y-1 text-foreground">{children}</ul>,
                  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-foreground">{children}</ol>,
                  li: ({ children }: { children?: React.ReactNode }) => <li className="text-foreground">{getTextDisplayChildren(children)}</li>,
                  blockquote: ({ children }: { children?: React.ReactNode }) => <blockquote className="border-l-4 border-border pl-4 italic text-foreground mb-3">{getTextDisplayChildren(children)}</blockquote>,
                  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
                    <a
                      href={href}
                      className="text-blue-600 hover:text-blue-700 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {getLinkDisplayChildren(children, href)}
                    </a>
                  ),
                  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold text-foreground">{getTextDisplayChildren(children)}</strong>,
                  em: ({ children }: { children?: React.ReactNode }) => <em className="italic text-foreground">{getTextDisplayChildren(children)}</em>,
                  hr: () => <hr className="border-border my-4" />,
                  table: ({ children }: { children?: React.ReactNode }) => <div className="overflow-x-auto mb-3"><table className="min-w-full border-collapse border border-border">{children}</table></div>,
                  th: ({ children }: { children?: React.ReactNode }) => <th className="border border-border px-3 py-2 bg-surface-active text-foreground font-semibold text-left">{getTextDisplayChildren(children)}</th>,
                  td: ({ children }: { children?: React.ReactNode }) => <td className="border border-border px-3 py-2 text-foreground">{getTextDisplayChildren(children)}</td>,
                }}
              >
                {normalizeMarkdown(todo.content)}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {updateError && (
          <p className="task-detail-error-text">{updateError}</p>
        )}

        <div className="task-detail-tags-row">
          {canEditTags ? (
            <TagSelector
              projectId={projectId}
              currentTags={todo.tags}
              onTagsChange={async (tagsString: string) => {
                await updateTask.mutateAsync({ tags: tagsString })
              }}
              showCreateButton={true}
              size="md"
              className="task-detail-tag-selector"
              displayAllSelected
              selectedDisplayVariant="linear"
            />
          ) : (
            <div className="task-detail-tags-static">
              {todo.tags ? (
                <TagList
                  projectId={projectId}
                  tagsString={todo.tags}
                  variant="linear"
                  maxVisible={999}
                />
              ) : (
                <span className="task-detail-tags-empty">无标签</span>
              )}
            </div>
          )}
        </div>

        <div className="task-detail-creator-event">
          <Avatar
            user={{
              username: creatorUsername,
              avatar: creatorInfo?.avatar || creatorInfo?.user?.avatar || todo?.creator?.avatar
            }}
            size="sm"
          />
          <span>
            <strong>{creatorUsername}</strong>
            创建了任务 · {formatRelativeTimeZh(todo.createdAt)}
          </span>
        </div>
      </section>
      
      {/* 评论区域 */}
      <div 
        ref={tabHeaderRef}
        className="rounded-lg" 
        style={{ backgroundColor: 'var(--color-surface)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)', borderTopWidth: '0.5px', borderTopColor: 'var(--color-divider)' }}
      >
        <div className="task-detail-comment-nav">
          <button
            type="button"
            className="task-detail-comment-tab"
          >
            评论
          </button>
        </div>
        
        <div className="border-b" style={{ borderBottomWidth: '0.5px', borderBottomColor: 'var(--color-divider)' }}></div>
        
        <div className="p-6">
          <CommentSection
            taskId={todo.id}
            taskInfo={{
              id: todo.id,
              creatorId: todo.creatorId,
              assigneeId: todo.assigneeId,
              status: todo.status,
              projectId: todo.projectId
            }}
            members={Array.isArray(members) ? members : []}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            isProjectMember={!!currentUserMember}
            projectId={projectId}
            onCommentAdded={handleCommentAdded}
          />
        </div>
      </div>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="删除待办"
        message={
          todo.children && todo.children.length > 0
            ? `确定要删除这个待办吗？此待办有 ${todo.children.length} 个子待办，删除后子待办也会被删除。`
            : '确定要删除这个待办吗？此操作不可撤销。'
        }
        confirmLabel="删除"
        cancelLabel="取消"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}

function useDetailMenuDismiss(menuRef: RefObject<HTMLDivElement>, onClose: () => void) {
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

function TaskDetailAssigneeControl({
  open,
  disabled,
  updating,
  members,
  assigneeId,
  assigneeName,
  assigneeAvatar,
  onToggle,
  onClose,
  onChange,
}: {
  open: boolean
  disabled: boolean
  updating: boolean
  members: any[]
  assigneeId: number | null
  assigneeName: string
  assigneeAvatar?: string | null
  onToggle: () => void
  onClose: () => void
  onChange: (assigneeId: number | null) => void | Promise<void>
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  useDetailMenuDismiss(menuRef, onClose)

  return (
    <span
      className="task-detail-property-control"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className={clsx('task-detail-summary-chip', open && 'is-active')}
        aria-label={`切换执行者：${assigneeName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={onToggle}
      >
        {assigneeId ? (
          <span className="task-detail-assignee-avatar">
            <Avatar
              user={{
                username: assigneeName,
                avatar: assigneeAvatar || undefined,
              }}
              size="sm"
            />
          </span>
        ) : (
          <span className="task-list-assignee is-empty" aria-label="未分配" />
        )}
        <span>{assigneeName}</span>
      </button>

      {open && (
        <div className="task-linear-menu task-detail-assignee-menu" ref={menuRef} role="menu" aria-label="切换执行者">
          <div className="task-linear-menu-options">
            <button
              className={clsx('task-linear-menu-option task-detail-assignee-option', !assigneeId && 'is-active')}
              type="button"
              role="menuitemradio"
              aria-checked={!assigneeId}
              disabled={updating}
              onClick={(event) => {
                event.stopPropagation()
                if (!assigneeId) {
                  onClose()
                  return
                }
                void onChange(null)
              }}
            >
              <span className="task-list-assignee is-empty" aria-hidden="true" />
              <span className="task-detail-assignee-name">未分配</span>
              <span className="task-detail-assignee-check">{!assigneeId ? '✓' : ''}</span>
              <kbd>0</kbd>
            </button>

            {members.map((member: any, index: number) => {
              const memberId = member.user_id
              const memberUsername = member.username || member.user?.username || '未知用户'
              const memberAvatar = member.avatar || member.user?.avatar
              const isActive = assigneeId === memberId

              return (
                <button
                  className={clsx('task-linear-menu-option task-detail-assignee-option', isActive && 'is-active')}
                  key={memberId}
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
                    void onChange(memberId)
                  }}
                >
                  <span className="task-detail-assignee-avatar">
                    <Avatar
                      user={{
                        username: memberUsername,
                        avatar: memberAvatar,
                      }}
                      size="sm"
                    />
                  </span>
                  <span className="task-detail-assignee-name">{memberUsername}</span>
                  <span className="task-detail-assignee-check">{isActive ? '✓' : ''}</span>
                  <kbd>{index + 1}</kbd>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </span>
  )
}

// ==================== 图标组件 ====================

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}

function ParentTaskIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ProjectIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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

// ==================== 执行人选择器组件 ====================

interface AssigneeSelectorProps {
  members: any[]
  value: number | undefined
  onChange: (value: number | undefined) => void
  onSave: () => Promise<void>
  onCancel: () => void
  error?: string
  loading?: boolean
}

function AssigneeSelector({ members, value, onChange, onSave, onCancel, error, loading }: AssigneeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const selectedMember = members.find((m: any) => m.user_id === value)
  const selectedUsername = selectedMember?.username || selectedMember?.user?.username || (value === undefined ? '未分配' : '未知用户')

  // 计算下拉菜单位置
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const menuHeight = Math.min(320, (members.length + 1) * 48 + 8) // 估算菜单高度
      const menuWidth = 280

      // 计算垂直位置：优先向下
      let top = buttonRect.bottom + 4
      if (top + menuHeight > viewportHeight) {
        top = buttonRect.top - menuHeight - 4
      }

      // 计算水平位置：优先左对齐
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
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2.5 py-1 text-sm border border-border rounded-md bg-surface-elevated text-foreground hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-w-[200px] justify-between h-8"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {value !== undefined ? (
              <>
                <Avatar
                  user={{
                    username: selectedMember?.username || selectedMember?.user?.username,
                    avatar: selectedMember?.avatar || selectedMember?.user?.avatar
                  }}
                  size="sm"
                />
                <span className="truncate">{selectedUsername}</span>
              </>
            ) : (
              <span className="text-foreground-secondary">未分配</span>
            )}
          </div>
          <svg className="w-4 h-4 text-foreground-tertiary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          className="p-2 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="保存"
          title="保存"
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="p-2 rounded-md bg-surface-active text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="取消"
          title="取消"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="mt-2 bg-error-light border border-error rounded-md p-2">
          <p className="text-xs text-error">{error}</p>
        </div>
      )}

      {isOpen && menuPosition && createPortal(
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={menuRef}
            className="fixed z-[101] w-[280px] rounded-lg shadow-lg border border-border py-1 max-h-80 overflow-auto"
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
                'w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-surface-hover transition-colors text-sm',
                value === undefined && 'bg-surface-active',
                'border-b-0'
              )}
              style={{ borderBottom: 'none' }}
            >
              <span className="text-sm text-foreground-secondary">未分配</span>
            </button>
            {members.map((member: any) => {
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
                    'w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-surface-hover transition-colors text-sm',
                    isSelected && 'bg-surface-active'
                  )}
                  style={{ borderBottom: 'none' }}
                >
                  <Avatar
                    user={{
                      username: memberUsername,
                      avatar: member.avatar || member.user?.avatar
                    }}
                    size="sm"
                  />
                  <span className="text-sm text-foreground flex-1">{memberUsername}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
