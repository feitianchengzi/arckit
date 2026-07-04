
/**
 * 项目详情页面（客户端组件）
 */

import { useState, useMemo, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Avatar, Button, LoadingView, ErrorView, EmptyStateView, ConfirmDialog, TextField, Dialog } from '@/components/ui'
import { TodoTreeItem } from '@/components/features/TodoTreeItem'
import { getLinearPriorityOption, getLinearStatusOption, LinearPriorityMarker, LinearStatusMarker } from '@/components/features/TodoItem'
import { ProjectMemberList, TaskDetailContent, CreateTaskDialog, ExportTodosDialog, DateRangeFilter, FilterMultiSelect, FeedbackDialog } from '@/components/features'
import { flattenTaskTree } from '@/lib/utils/taskTree'
import { enrichTodosWithMembers } from '@/lib/utils/enrichTodosWithMembers'
import { getDefaultTaskDateRange, isSameTaskDateRange, normalizeTaskDateRange, taskDateRangeToTimeFilters } from '@/lib/utils/taskDateRange'
import { argbToCssColor } from '@/lib/utils/tagUtils'
import { useProject, useDeleteProject, useUpdateProject, useProjectMembers } from '@/hooks/useProjects'
import { useTaskList, useUpdateTaskStatus } from '@/hooks/useTasks'
import { useProjectWebSocket, type ProjectSocketEvent } from '@/hooks/useProjectWebSocket'
import { tasksApi } from '@/lib/api/endpoints/tasks'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useTagStore } from '@/store/tagStore'
import { useDashboardLayout } from '@/layouts/DashboardLayoutContext'
import { showGlobalToast } from '@/components/ui/Toast'
import { type DateRange } from '@/lib/utils/filterStorage'
import { buildProjectPath, decodeProjectId } from '@/lib/utils/projectRouting'
import { LinkIcon, PlusIcon } from '@/components/ui/icons'
import type { TodoStatus, ProjectMember } from '@/types'
import clsx from 'clsx'
import { permissionManager } from '@/lib/permissions'
import { todoToTaskInfo, isAssigneeUnassigned } from '@/lib/permissions/utils'
import type { TaskInfo } from '@/lib/permissions'

const LOCAL_STATUS_EVENT_SUPPRESS_MS = 5000

const extractSocketTaskId = (payload: ProjectSocketEvent): number | null => {
  const data = payload.data
  if (!data || typeof data !== 'object') return null

  const record = data as Record<string, unknown>
  const candidates = [record.task_id, record.taskId, record.id]
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
    if (typeof candidate === 'string') {
      const parsed = Number(candidate)
      if (Number.isFinite(parsed)) return parsed
    }
  }

  const task = record.task
  if (task && typeof task === 'object') {
    const taskRecord = task as Record<string, unknown>
    const taskCandidates = [taskRecord.task_id, taskRecord.taskId, taskRecord.id]
    for (const candidate of taskCandidates) {
      if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
      if (typeof candidate === 'string') {
        const parsed = Number(candidate)
        if (Number.isFinite(parsed)) return parsed
      }
    }
  }

  return null
}

export default function ProjectDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useParams()
  const projectSlug = params.id ?? ''
  const decodedProjectId = decodeProjectId(projectSlug)
  const projectIdParam = decodedProjectId ?? projectSlug
  const projectId = Number(projectIdParam)
  
  const currentUser = useAuthStore((state) => state.user)
  const { isProjectSidebarCollapsed, collapseProjectSidebar, expandProjectSidebar } = useDashboardLayout()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const hasInitializedTaskRouteRef = useRef(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false)
  const [createSubtaskParentId, setCreateSubtaskParentId] = useState<number | null>(null)
  const [taskDetailFullscreenOpen, setTaskDetailFullscreenOpen] = useState(false)
  const createTaskButtonRef = useRef<HTMLButtonElement>(null)
  const [taskHistory, setTaskHistory] = useState<Array<{ taskId: string; projectId: string; parentTaskId: number | null }>>([])
  const [parentSelectTaskId, setParentSelectTaskId] = useState<string | null>(null)
  const parseTaskIdFromHash = (hash: string): string | null => {
    if (!hash) return null
    const cleaned = hash.startsWith('#') ? hash.slice(1) : hash
    if (!cleaned) return null
    const params = new URLSearchParams(cleaned.startsWith('?') ? cleaned.slice(1) : cleaned)
    return params.get('task')
  }
  const taskIdFromHash = useMemo(() => parseTaskIdFromHash(location.hash), [location.hash])
  const taskIdFromSearch = searchParams.get('task')
  const taskIdFromUrl = taskIdFromSearch ?? taskIdFromHash
  const setTaskRoute = useCallback((taskId: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (taskId) {
        next.set('task', taskId)
      } else {
        next.delete('task')
      }
      return next
    })
    if (taskIdFromHash) {
      navigate({ hash: '' }, { replace: true })
    }
  }, [navigate, setSearchParams, taskIdFromHash])

  const closeTaskDetail = useCallback(() => {
    setTaskHistory([])
    setTaskRoute(null)
  }, [setTaskRoute])

  const handleProjectSidebarToggle = useCallback(() => {
    if (isProjectSidebarCollapsed) {
      closeTaskDetail()
      expandProjectSidebar()
      return
    }

    collapseProjectSidebar()
  }, [collapseProjectSidebar, closeTaskDetail, expandProjectSidebar, isProjectSidebarCollapsed])

  const handleOpenTaskDetail = useCallback((todoId: number) => {
    setTaskHistory([])
    collapseProjectSidebar()
    setTaskRoute(String(todoId))
  }, [collapseProjectSidebar, setTaskRoute])

  const handleCopySelectedTaskLink = useCallback(async () => {
    if (!selectedTaskId) return

    try {
      const detailUrl = `${window.location.origin}${buildProjectPath(projectIdParam, `tasks/${selectedTaskId}`)}`
      await navigator.clipboard.writeText(detailUrl)
      showGlobalToast('详情链接已复制', 'success', 2000)
    } catch (error) {
      console.error('复制详情链接失败:', error)
      showGlobalToast('复制失败，请手动复制', 'error', 2500)
    }
  }, [projectIdParam, selectedTaskId])
  
  // 回到顶部
  const scrollToTop = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const main = document.querySelector('main') as HTMLElement
    if (main && main.scrollHeight > main.clientHeight) {
      main.scrollTo({ top: 0, behavior })
    } else {
      window.scrollTo({ top: 0, behavior })
    }
  }, [])
  
  useEffect(() => {
    if (!hasInitializedTaskRouteRef.current) {
      hasInitializedTaskRouteRef.current = true
      setDrawerOpen(false)
      setSelectedTaskId(null)
      setTaskHistory([])

      if (taskIdFromUrl) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          next.delete('task')
          return next
        }, { replace: true })
        if (taskIdFromHash) {
          navigate({ hash: '' }, { replace: true })
        }
      }
      return
    }

    if (taskIdFromUrl) {
      setSelectedTaskId(taskIdFromUrl)
      setDrawerOpen(true)
      return
    }
    setDrawerOpen(false)
    setSelectedTaskId(null)
    setTaskHistory([])
  }, [navigate, setSearchParams, taskIdFromHash, taskIdFromUrl])

  useEffect(() => {
    if (!drawerOpen || !selectedTaskId) {
      setTaskDetailFullscreenOpen(false)
    }
  }, [drawerOpen, selectedTaskId])
  const { data: project, isLoading: projectLoading, error: projectError, refetch: refetchProject } = useProject(projectIdParam)
  const deleteProject = useDeleteProject()
  const updateProject = useUpdateProject(projectIdParam)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // 编辑项目相关状态
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editName, setEditName] = useState('')
  const [editGitUrl, setEditGitUrl] = useState('')
  const [editError, setEditError] = useState('')
  const [projectInfoName, setProjectInfoName] = useState('')
  const [projectInfoGitUrl, setProjectInfoGitUrl] = useState('')
  const [projectInfoError, setProjectInfoError] = useState('')
  const [isSavingProjectInfo, setIsSavingProjectInfo] = useState(false)
  const [showProjectInfoDialog, setShowProjectInfoDialog] = useState(false)
  
  // 更多菜单状态
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const moreMenuButtonRef = useRef<HTMLButtonElement>(null)
  
  // 导出待办对话框状态
  const [showExportDialog, setShowExportDialog] = useState(false)
  // 反馈对话框状态
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)

  // 迁移项目状态
  const [showMigrateDialog, setShowMigrateDialog] = useState(false)
  const [migrateOrgId, setMigrateOrgId] = useState('')
  const [migrateError, setMigrateError] = useState('')
  
  const statusOptions = ([
    'PENDING_REVIEW',
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'ACCEPTED',
    'CANCELLED',
    'BLOCKED',
  ] as TodoStatus[]).map((status) => ({
    value: status,
    label: getLinearStatusOption(status).label,
    icon: <LinearStatusMarker status={status} />,
  }))
  const priorityOptions = ([0, 1, 2, 3] as const).map((priority) => ({
    value: priority,
    label: getLinearPriorityOption(priority).label,
    icon: <LinearPriorityMarker priority={priority} variant="menu" />,
  }))
  const statusValues = statusOptions.map(option => option.value)
  
  const [statusFilter, setStatusFilter] = useState<TodoStatus[]>([])
  const [creatorFilter, setCreatorFilter] = useState<number[]>([])
  const [executorFilter, setExecutorFilter] = useState<number[]>([])
  const [tagFilter, setTagFilter] = useState<number[]>([])
  const [priorityFilter, setPriorityFilter] = useState<number[]>([])

  // 日期范围筛选：任务树接口要求必传时间范围，默认查“明天往前 30 天”。
  const defaultDateRange = useMemo(() => getDefaultTaskDateRange(), [])
  const [dateRange, setDateRangeState] = useState<DateRange>(() => getDefaultTaskDateRange())
  const setDateRange = useCallback((range: DateRange) => {
    setDateRangeState(normalizeTaskDateRange(range))
  }, [])
  const resetDateRange = useCallback(() => {
    setDateRangeState(getDefaultTaskDateRange())
  }, [])
  // 搜索状态
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showSearchBar, setShowSearchBar] = useState(false)
  const [filterContextProjectId, setFilterContextProjectId] = useState(projectIdParam)
  
  const isStatusSelected = (status: TodoStatus) =>
    statusFilter.length === 0 || statusFilter.includes(status)

  const toggleStatusFilter = (status: TodoStatus) => {
    if (statusFilter.length === 0) {
      setStatusFilter(statusValues.filter(value => value !== status))
      return
    }
    if (statusFilter.includes(status)) {
      const next = statusFilter.filter(item => item !== status)
      setStatusFilter(next)
      return
    }
    setStatusFilter([...statusFilter, status])
  }
  
  // 切换项目后重置筛选，避免跨项目和跨组织继承筛选条件
  useEffect(() => {
    if (filterContextProjectId === projectIdParam) return

    setStatusFilter([])
    setCreatorFilter([])
    setExecutorFilter([])
    setTagFilter([])
    setPriorityFilter([])
    resetDateRange()
    setSearchQuery('')
    setShowSearchBar(false)
    setFilterContextProjectId(projectIdParam)
  }, [filterContextProjectId, projectIdParam, resetDateRange])
  
  const { data: members } = useProjectMembers(projectIdParam)
  const updateStatus = useUpdateTaskStatus(projectIdParam)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!project) return
    setProjectInfoName(project.name)
    setProjectInfoGitUrl(project.git_url || '')
    setProjectInfoError('')
  }, [project?.id, project?.name, project?.git_url])
  
  // 加载项目标签
  const { loadProjectTags, getProjectTags } = useTagStore()
  useEffect(() => {
    if (projectIdParam) {
      loadProjectTags(projectIdParam).catch(console.error)
    }
  }, [projectIdParam, loadProjectTags])
  const projectTags = getProjectTags(projectIdParam)
  const realtimePendingRef = useRef({
    tasks: false,
    tags: false,
    members: false,
    project: false,
    invitations: false,
  })
  const realtimeTimerRef = useRef<number | null>(null)
  const localStatusUpdateExpiresRef = useRef<Map<number, number>>(new Map())

  const flushRealtimeRefresh = useCallback(() => {
    const pending = realtimePendingRef.current
    if (pending.tasks) {
      queryClient.invalidateQueries({ queryKey: ['projects', projectIdParam, 'tasks'] })
    }
    if (pending.members) {
      queryClient.invalidateQueries({ queryKey: ['projects', projectIdParam, 'members'] })
    }
    if (pending.project) {
      queryClient.invalidateQueries({ queryKey: ['projects', projectIdParam] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
    if (pending.invitations) {
      queryClient.invalidateQueries({ queryKey: ['projects', projectIdParam, 'invitations'] })
    }
    if (pending.tags) {
      loadProjectTags(projectIdParam).catch(console.error)
    }
    realtimePendingRef.current = {
      tasks: false,
      tags: false,
      members: false,
      project: false,
      invitations: false,
    }
  }, [projectIdParam, queryClient, loadProjectTags])

  const scheduleRealtimeRefresh = useCallback(
    (targets: Array<keyof typeof realtimePendingRef.current>) => {
      targets.forEach((target) => {
        realtimePendingRef.current[target] = true
      })
      if (realtimeTimerRef.current !== null) return
      realtimeTimerRef.current = window.setTimeout(() => {
        realtimeTimerRef.current = null
        flushRealtimeRefresh()
      }, 300)
    },
    [flushRealtimeRefresh]
  )

  const markLocalStatusUpdate = useCallback((taskId: number) => {
    localStatusUpdateExpiresRef.current.set(taskId, Date.now() + LOCAL_STATUS_EVENT_SUPPRESS_MS)
  }, [])

  const shouldSuppressTaskRefresh = useCallback((payload: ProjectSocketEvent) => {
    const now = Date.now()
    localStatusUpdateExpiresRef.current.forEach((expiresAt, taskId) => {
      if (expiresAt <= now) {
        localStatusUpdateExpiresRef.current.delete(taskId)
      }
    })

    const taskId = extractSocketTaskId(payload)
    if (taskId !== null) {
      return (localStatusUpdateExpiresRef.current.get(taskId) ?? 0) > now
    }

    return Array.from(localStatusUpdateExpiresRef.current.values()).some((expiresAt) => expiresAt > now)
  }, [])

  useEffect(() => {
    return () => {
      if (realtimeTimerRef.current !== null) {
        window.clearTimeout(realtimeTimerRef.current)
      }
    }
  }, [])

  const handleSocketEvent = useCallback(
    (payload: ProjectSocketEvent) => {
      if (!payload?.event || payload.event === 'system.connected') return
      if (payload.project_id && payload.project_id !== projectId) return

      const eventName = payload.event
      const targets: Array<keyof typeof realtimePendingRef.current> = []

      if (eventName.startsWith('task.') || eventName.startsWith('task_attachment.')) {
        if (!eventName.startsWith('task.') || !shouldSuppressTaskRefresh(payload)) {
          targets.push('tasks')
        }
      }
      if (eventName.startsWith('tag.')) {
        targets.push('tags')
      }
      if (eventName.startsWith('project_member.')) {
        targets.push('members', 'project')
      }
      if (eventName.startsWith('project_invitation.')) {
        targets.push('invitations')
      }
      if (eventName.startsWith('project.')) {
        targets.push('project')
      }

      if (targets.length > 0) {
        scheduleRealtimeRefresh([...new Set(targets)])
      }
    },
    [projectId, scheduleRealtimeRefresh, shouldSuppressTaskRefresh]
  )

  useProjectWebSocket({
    projectId: projectIdParam,
    enabled: !!projectIdParam && !isDeleting,
    onEvent: handleSocketEvent,
  })

  const memberIds = useMemo(
    () => (members ? members.map(member => member.user_id).filter((id): id is number => typeof id === 'number') : []),
    [members]
  )
  const tagIds = useMemo(() => projectTags.map(tag => tag.id), [projectTags])
  const priorityValues = useMemo(() => priorityOptions.map(option => option.value), [priorityOptions])

  const taskListFilters = useMemo(() => {
    const normalizeSelection = <T,>(selected: T[], allValues: T[]) => {
      if (selected.length === 0) return []
      if (allValues.length > 0 && selected.length === allValues.length && allValues.every(value => selected.includes(value))) {
        return []
      }
      return selected
    }

    const { startTime, endTime } = taskDateRangeToTimeFilters(dateRange)
    const searchKey = searchQuery.trim() || undefined

    return {
      status: normalizeSelection(statusFilter, statusValues),
      creatorIds: normalizeSelection(creatorFilter, memberIds),
      executorIds: normalizeSelection(executorFilter, memberIds),
      tagIds: normalizeSelection(tagFilter, tagIds),
      priorities: normalizeSelection(priorityFilter, priorityValues),
      startTime,
      endTime,
      searchKey,
    }
  }, [
    statusFilter,
    creatorFilter,
    executorFilter,
    tagFilter,
    priorityFilter,
    dateRange,
    searchQuery,
    statusValues,
    memberIds,
    tagIds,
    priorityValues,
  ])

  const isFilterActive = <T,>(selected: T[], allValues: T[]) => {
    if (selected.length === 0) return false
    if (allValues.length > 1 && selected.length === allValues.length && allValues.every(value => selected.includes(value))) {
      return false
    }
    return true
  }

  const isStatusFilterActive = isFilterActive(statusFilter, statusValues)
  const isCreatorFilterActive = isFilterActive(creatorFilter, memberIds)
  const isExecutorFilterActive = isFilterActive(executorFilter, memberIds)
  const isTagFilterActive = isFilterActive(tagFilter, tagIds)
  const isPriorityFilterActive = isFilterActive(priorityFilter, priorityValues)
  const isDateRangeActive = !isSameTaskDateRange(dateRange, defaultDateRange)
  const isSearchActive = !!searchQuery.trim()
  const hasActiveFilters =
    isStatusFilterActive ||
    isCreatorFilterActive ||
    isExecutorFilterActive ||
    isTagFilterActive ||
    isPriorityFilterActive ||
    isDateRangeActive ||
    isSearchActive

  // 如果正在删除项目，禁用待办列表查询
  const { data: taskListData, isLoading: todosLoading, error: todosError, refetch: refetchTodos } = useTaskList(projectIdParam, {
    enabled: !isDeleting && !!projectIdParam && filterContextProjectId === projectIdParam, // 切项目后等待筛选重置完成
    filters: taskListFilters,
  })
  const todos = taskListData?.todos ?? []
  const totalTasks = taskListData?.total ?? todos.length
  
  // 验证并修复筛选条件（数据加载完成后）
  useEffect(() => {
    if (todosLoading || !members) return
    
    let needUpdate = false
    const updates: Partial<{
      creatorFilter: number[]
      executorFilter: number[]
      tagFilter: number[]
    }> = {}
    
    // 验证创建人筛选
    if (creatorFilter.length > 0) {
      const validCreators = creatorFilter.filter(id => members.some(m => m.user_id === id))
      if (validCreators.length !== creatorFilter.length) {
        updates.creatorFilter = validCreators
        needUpdate = true
      }
    }
    
    // 验证执行人筛选
    if (executorFilter.length > 0) {
      const validExecutors = executorFilter.filter(id => members.some(m => m.user_id === id))
      if (validExecutors.length !== executorFilter.length) {
        updates.executorFilter = validExecutors
        needUpdate = true
      }
    }
    
    // 验证标签筛选
    if (tagFilter.length > 0) {
      const validTags = tagFilter.filter(id => projectTags.some(tag => tag.id === id))
      if (validTags.length !== tagFilter.length) {
        updates.tagFilter = validTags
        needUpdate = true
      }
    }
    
    // 应用修复
    if (needUpdate) {
      if (updates.creatorFilter !== undefined) setCreatorFilter(updates.creatorFilter)
      if (updates.executorFilter !== undefined) setExecutorFilter(updates.executorFilter)
      if (updates.tagFilter !== undefined) setTagFilter(updates.tagFilter)
    }
  }, [todosLoading, members, projectTags, creatorFilter, executorFilter, tagFilter])
  
  // 获取当前用户的 user_id（通过 is_me 字段）
  const currentUserId = useMemo(() => {
    if (!members) return null
    const currentMember = members.find(m => m.is_me === true)
    return currentMember?.user_id || null
  }, [members])

  const memberOptions = useMemo(() => {
    if (!members) return []
    return members
      .filter(member => typeof member.user_id === 'number')
      .map(member => {
        const username = member.username || member.user?.username || `用户${member.user_id}`
        const avatar = member.avatar || member.user?.avatar

        return {
          value: member.user_id as number,
          label: username,
          icon: <Avatar user={{ username, avatar }} size="sm" />,
        }
      })
  }, [members])

  const creatorOptions = useMemo(() => {
    if (!currentUserId) return memberOptions
    const others = memberOptions.filter(option => option.value !== currentUserId)
    const current = memberOptions.find(option => option.value === currentUserId)
    return current ? [{ ...current, label: '我' }, ...others] : memberOptions
  }, [memberOptions, currentUserId])

  const executorOptions = creatorOptions

  const tagOptions = useMemo(
    () => projectTags.map(tag => ({
      value: tag.id,
      label: tag.displayName,
      icon: null,
      content: (
        <span className="task-list-label filter-option-tag-label" title={tag.displayName}>
          <span className="task-list-label-dot" style={{ background: argbToCssColor(tag.color) }} />
          <span>{tag.displayName}</span>
        </span>
      ),
    })),
    [projectTags]
  )
  
  // 使用成员信息丰富待办项的用户信息（创建人和执行人）
  const enrichedTaskTree = useMemo(() => {
    const tree = taskListData?.todoTree ?? []
    if (!tree || !members) return tree || []
    return enrichTodosWithMembers(tree, members)
  }, [taskListData?.todoTree, members])

  // 接口已经返回父子层级，这里只做成员信息补齐，不再重新分析 father_id。
  const taskTree = useMemo(() => {
    return enrichedTaskTree
  }, [enrichedTaskTree])

  const enrichedTodos = useMemo(() => flattenTaskTree(taskTree), [taskTree])

  const selectedTask = useMemo(() => {
    if (!selectedTaskId || !enrichedTodos) return null
    return enrichedTodos.find(todo => todo.id.toString() === selectedTaskId) || null
  }, [enrichedTodos, selectedTaskId])

  const parentSelectTask = useMemo(() => {
    if (!parentSelectTaskId || !enrichedTodos) return null
    return enrichedTodos.find(todo => todo.id.toString() === parentSelectTaskId) || null
  }, [parentSelectTaskId, enrichedTodos])

  const parentSelectTitle = useMemo(() => {
    if (!parentSelectTask) return '待办'
    return parentSelectTask.title || parentSelectTask.content?.slice(0, 30) || '待办'
  }, [parentSelectTask])

  const parentSelectBlockedIds = useMemo(() => {
    const blocked = new Set<number>()
    if (!parentSelectTaskId) return blocked
    const targetId = Number(parentSelectTaskId)
    if (!Number.isFinite(targetId)) return blocked
    const findNode = (nodes: any[]): any | null => {
      for (const node of nodes) {
        if (node.id === targetId) return node
        if (node.children) {
          const found = findNode(node.children)
          if (found) return found
        }
      }
      return null
    }
    const collect = (node: any) => {
      blocked.add(node.id)
      if (node.children) {
        node.children.forEach((child: any) => collect(child))
      }
    }
    const targetNode = findNode(taskTree)
    if (targetNode) {
      collect(targetNode)
    } else {
      blocked.add(targetId)
    }
    return blocked
  }, [parentSelectTaskId, taskTree])

  const isSelectingParent = !!parentSelectTaskId
  const [isUpdatingParent, setIsUpdatingParent] = useState(false)
  const [parentSelectError, setParentSelectError] = useState('')
  const [pendingParentId, setPendingParentId] = useState<number | null>(null)
  const listContainerRef = useRef<HTMLDivElement>(null)
  const [parentBannerStyle, setParentBannerStyle] = useState<React.CSSProperties>({})
  const handleExitParentSelect = useCallback(() => {
    setParentSelectError('')
    setParentSelectTaskId(null)
  }, [setParentSelectError, setParentSelectTaskId])
  useEffect(() => {
    if (isSelectingParent) {
      setShowSearchBar(false)
    }
  }, [isSelectingParent])
  useEffect(() => {
    if (!isSelectingParent) {
      setPendingParentId(null)
    }
  }, [isSelectingParent])
  useLayoutEffect(() => {
    if (!isSelectingParent) return
    const topMargin = 12
    const bottomGap = 12
    const minHeight = 88
    const updateBanner = () => {
      const rect = listContainerRef.current?.getBoundingClientRect()
      if (!rect) return
      const left = Math.max(0, Math.round(rect.left))
      const width = Math.max(0, Math.round(rect.width))
      const availableHeight = Math.max(0, Math.round(rect.top) - topMargin - bottomGap)
      const height = Math.max(availableHeight, minHeight)
      setParentBannerStyle({
        top: `${topMargin}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`,
      })
    }
    const main = document.querySelector('main')
    updateBanner()
    const raf = requestAnimationFrame(updateBanner)
    const observer = listContainerRef.current ? new ResizeObserver(updateBanner) : null
    if (listContainerRef.current && observer) {
      observer.observe(listContainerRef.current)
    }
    window.addEventListener('resize', updateBanner)
    window.addEventListener('scroll', updateBanner, true)
    main?.addEventListener('scroll', updateBanner)
    return () => {
      cancelAnimationFrame(raf)
      observer?.disconnect()
      window.removeEventListener('resize', updateBanner)
      window.removeEventListener('scroll', updateBanner, true)
      main?.removeEventListener('scroll', updateBanner)
    }
  }, [isSelectingParent])

  const handleStartParentSelect = useCallback((taskId: string) => {
    setParentSelectError('')
    setTaskHistory([])
    setTaskRoute(null)
    setParentSelectTaskId(taskId)
    scrollToTop('auto')
  }, [setTaskRoute, scrollToTop])

  const handleSelectParent = useCallback(async (newParentId: number) => {
    if (!parentSelectTaskId) return
    if (parentSelectBlockedIds.has(newParentId)) return
    setIsUpdatingParent(true)
    setParentSelectError('')
    try {
      const payload = { father_id: newParentId }
      console.info(
        `[parent-select] PUT /projects/${projectIdParam}/tasks/${parentSelectTaskId}`,
        payload
      )
      console.info('[parent-select] payload', payload)
      await tasksApi.update(projectIdParam, parentSelectTaskId, { parentId: newParentId })
      await refetchTodos()
      const currentTaskId = parentSelectTaskId
      setParentSelectTaskId(null)
      setTaskRoute(currentTaskId)
    } catch (err: any) {
      console.error('更新父待办失败:', err)
      setParentSelectError(err?.response?.data?.message || err?.message || '更新父待办失败')
    } finally {
      setIsUpdatingParent(false)
    }
  }, [parentSelectTaskId, parentSelectBlockedIds, projectIdParam, refetchTodos, setTaskRoute])
  const handleRequestParentSelect = useCallback((newParentId: number) => {
    if (parentSelectBlockedIds.has(newParentId)) return
    setPendingParentId(newParentId)
  }, [parentSelectBlockedIds])
  const handleConfirmParentSelect = useCallback(() => {
    if (!pendingParentId) return
    handleSelectParent(pendingParentId)
    setPendingParentId(null)
  }, [pendingParentId, handleSelectParent])
  const pendingParentTitle = useMemo(() => {
    if (!pendingParentId) return ''
    const findInTree = (nodes: any[]): any | null => {
      for (const node of nodes) {
        if (node.id === pendingParentId) return node
        if (node.children) {
          const found = findInTree(node.children)
          if (found) return found
        }
      }
      return null
    }
    const target = findInTree(taskTree)
    return target?.title || target?.content?.slice(0, 30) || '待办'
  }, [pendingParentId, taskTree])
  
  // 统计数据（基于树形结构，只统计根任务）
  const stats = useMemo(() => {
    if (!taskTree || taskTree.length === 0) {
      return { pending: 0, inProgress: 0, completed: 0, accepted: 0 }
    }
    
    return {
      pending: taskTree.filter(t => t.status === 'PENDING' || t.status === 'PENDING_REVIEW').length,
      inProgress: taskTree.filter(t => t.status === 'IN_PROGRESS').length,
      completed: taskTree.filter(t => t.status === 'COMPLETED').length,
      accepted: taskTree.filter(t => t.status === 'ACCEPTED').length,
    }
  }, [taskTree])
  
  // 服务端已处理筛选，直接使用当前页数据
  const filteredTodos = useMemo(() => taskTree || [], [taskTree])
  
  // 初始化编辑表单
  const handleEditClick = () => {
    if (project) {
      setEditName(project.name)
      setEditGitUrl(project.git_url || '')
      setEditError('')
      setShowEditDialog(true)
    }
  }

  // 处理迁移项目
  const handleMigrateProject = async () => {
    if (!migrateOrgId.trim()) {
      setMigrateError('请输入组织ID')
      return
    }
    const orgId = parseInt(migrateOrgId)
    if (isNaN(orgId)) {
      setMigrateError('组织ID必须是数字')
      return
    }
    
    try {
      setMigrateError('')
      await updateProject.mutateAsync({ organization_id: orgId })
      setShowMigrateDialog(false)
      setMigrateOrgId('')
      // 成功后可能需要提示用户
    } catch (err: any) {
      console.error('迁移项目失败:', err)
      setMigrateError(err.message || '迁移项目失败')
    }
  }
  
  // 获取当前用户在项目中的角色 - 必须在早期返回之前调用
  const currentUserRole = useMemo(() => {
    if (!currentUser?.username || !members) return null
    const currentMember = members.find(m => m.username === currentUser.username)
    return currentMember?.role || null
  }, [currentUser?.username, members])

  const canAdjustSelectedParent = useMemo(() => {
    if (!selectedTask) return false
    const isOwnerOrAdmin = currentUserRole === 'owner' || currentUserRole === 'admin'
    const isCreator = currentUserId !== null && currentUserId !== undefined && selectedTask.creatorId === currentUserId
    const isAssignee = currentUserId !== null && currentUserId !== undefined && selectedTask.assigneeId === currentUserId
    return isOwnerOrAdmin || isCreator || isAssignee
  }, [currentUserId, currentUserRole, selectedTask])

  const handleCreateSelectedSubtask = useCallback(() => {
    if (!selectedTask) return
    setCreateSubtaskParentId(selectedTask.id)
  }, [selectedTask])

  const handleCloseCreateSubtaskDialog = useCallback(() => {
    setCreateSubtaskParentId(null)
  }, [])

  const handleCreateSelectedSubtaskSuccess = useCallback(() => {
    setCreateSubtaskParentId(null)
    refetchTodos()
  }, [refetchTodos])

  const handleAdjustSelectedParent = useCallback(() => {
    if (!selectedTask || !canAdjustSelectedParent) return
    setTaskDetailFullscreenOpen(false)
    handleStartParentSelect(String(selectedTask.id))
  }, [canAdjustSelectedParent, handleStartParentSelect, selectedTask])

  const handleOpenTaskDetailFullscreen = useCallback(() => {
    if (!selectedTaskId) return
    setTaskDetailFullscreenOpen(true)
  }, [selectedTaskId])

  const handleCloseTaskDetailFullscreen = useCallback(() => {
    setTaskDetailFullscreenOpen(false)
  }, [])

  const handleNavigateSelectedSubtask = useCallback((subtaskId: number) => {
    if (!selectedTaskId) return
    const currentTask = enrichedTodos?.find(t => t.id.toString() === selectedTaskId)
    const parentTaskId = currentTask?.parentId || null
    setTaskHistory(prev => [...prev, { taskId: selectedTaskId, projectId: projectIdParam, parentTaskId }])
    setTaskRoute(String(subtaskId))
  }, [enrichedTodos, projectIdParam, selectedTaskId, setTaskRoute])

  const handleSelectedTaskDelete = useCallback(() => {
    setTaskDetailFullscreenOpen(false)
    closeTaskDetail()
    refetchTodos()
  }, [closeTaskDetail, refetchTodos])
  
  // 判断是否可以修改状态
  // 当状态为"进行中"时，只有执行人、管理员、owner可以修改
  // 非"进行中"的任何角色都可以修改
  const canChangeStatus = useCallback((todo: any) => {
    const taskInfo: TaskInfo = todoToTaskInfo(todo)
    return permissionManager.task.hasStatusChangePermission(
      taskInfo,
      currentUserRole,
      currentUserId
    )
  }, [currentUserId, currentUserRole])
  
  // 判断是否可以分配执行人
  // 规则：
  // - 如果执行人未分配（初始状态），任何项目成员都可以认领（不限制角色）
  // - 如果执行人已分配，只有 owner/admin/当前执行人/创建人 可以重新设置
  const canAssignAssignee = useCallback((todo: any) => {
    const taskInfo: TaskInfo = {
      id: todo.id,
      creatorId: todo.creatorId,
      assigneeId: todo.assigneeId,
      status: todo.status,
      projectId: todo.projectId
    }
    const isUnassigned = isAssigneeUnassigned(todo.assigneeId)
    // 检查是否是项目成员
    const isProjectMember = members ? members.some((m: any) => m.user_id === currentUserId || m.is_me === true) : false
    
    return permissionManager.task.hasAssignAssigneePermission(
      taskInfo,
      currentUserRole,
      currentUserId,
      isUnassigned,
      isProjectMember
    )
  }, [currentUserId, currentUserRole, members])
  
  // 判断是否可以编辑优先级（owner/admin/创建人）
  const canEditPriority = useCallback((todo: any) => {
    const taskInfo: TaskInfo = todoToTaskInfo(todo)
    return permissionManager.task.hasEditPriorityPermission(
      taskInfo,
      currentUserRole,
      currentUserId
    )
  }, [currentUserId, currentUserRole])
  
  // 处理更新执行人
  const handleUpdateAssignee = useCallback(async (taskId: number, assigneeId: number | null) => {
    await tasksApi.update(projectIdParam, String(taskId), { assigneeId: assigneeId || undefined })
    queryClient.invalidateQueries({ queryKey: ['projects', projectIdParam, 'tasks'] })
    queryClient.refetchQueries({ queryKey: ['projects', projectIdParam, 'tasks'] })
  }, [projectIdParam, queryClient])
  
  // 处理更新优先级
  const handleUpdatePriority = useCallback(async (taskId: number, priority: number | null) => {
    await tasksApi.update(projectIdParam, String(taskId), { priority: priority !== null ? priority : undefined })
    queryClient.invalidateQueries({ queryKey: ['projects', projectIdParam, 'tasks'] })
    queryClient.refetchQueries({ queryKey: ['projects', projectIdParam, 'tasks'] })
  }, [projectIdParam, queryClient])

  const canEditTags = useCallback((todo: any) => {
    const taskInfo: TaskInfo = todoToTaskInfo(todo)
    return permissionManager.task.hasEditTagsPermission(
      taskInfo,
      currentUserRole,
      currentUserId
    )
  }, [currentUserId, currentUserRole])

  const handleUpdateTags = useCallback(async (taskId: number, tagsString: string) => {
    await tasksApi.update(projectIdParam, String(taskId), { tags: tagsString })
    queryClient.invalidateQueries({ queryKey: ['projects', projectIdParam, 'tasks'] })
    queryClient.refetchQueries({ queryKey: ['projects', projectIdParam, 'tasks'] })
  }, [projectIdParam, queryClient])
  
  // 搜索框引用
  const searchBarRef = useRef<HTMLDivElement>(null)
  
  // 点击外部关闭更多菜单和搜索框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | PointerEvent) => {
      try {
        const target = event.target as Node
        
        if (showMoreMenu && moreMenuRef.current && !moreMenuRef.current.contains(target)) {
          setShowMoreMenu(false)
        }
        // 点击外部关闭搜索框 - 如果有搜索内容，不能关闭
        if (showSearchBar && searchBarRef.current && !searchBarRef.current.contains(target)) {
          if (!searchQuery.trim()) {
            setShowSearchBar(false)
          }
        }
      } catch (error) {
        // 忽略扩展相关的错误
        console.warn('点击外部处理错误（可能是浏览器扩展问题）:', error)
      }
    }
    
    if (showMoreMenu || showSearchBar) {
      // 使用捕获阶段，避免被扩展拦截
      document.addEventListener('pointerdown', handleClickOutside, true)
      // 也监听 click 事件作为备用
      document.addEventListener('click', handleClickOutside, true)
    }
    
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside, true)
      document.removeEventListener('click', handleClickOutside, true)
    }
  }, [searchQuery, showMoreMenu, showSearchBar])
  
  // 保存编辑
  const handleEditSave = async () => {
    setEditError('')
    
    // 验证
    const trimmedName = editName.trim()
    const trimmedGitUrl = editGitUrl.trim()

    if (!trimmedName) {
      setEditError('请输入项目名称')
      return
    }
    
    // 简单的 URL 验证
    if (trimmedGitUrl) {
      try {
        new URL(trimmedGitUrl)
      } catch {
        setEditError('请输入有效的 Git 地址')
        return
      }
    }
    
    try {
      await updateProject.mutateAsync({
        name: trimmedName,
        git_url: trimmedGitUrl,
      })
      setShowEditDialog(false)
    } catch (err: any) {
      setEditError(err?.response?.data?.error || err?.response?.data?.message || err?.message || '更新失败，请重试')
    }
  }
  
  // 递归查找任务（包括子任务）
  const findTaskInTree = (tasks: typeof taskTree, todoId: number): typeof taskTree[0] | null => {
    for (const task of tasks) {
      if (task.id === todoId) {
        return task
      }
      // 递归查找子任务
      if (task.children && task.children.length > 0) {
        const found = findTaskInTree(task.children, todoId)
        if (found) return found
      }
    }
    return null
  }

  // 处理状态变更
  const handleStatusChange = async (todoId: number, newStatus: string) => {
    // 查找对应的任务（包括子任务）
    const todo = findTaskInTree(taskTree, todoId)
    if (!todo) {
      console.error('找不到对应的任务')
      return
    }
    
    // 权限检查：使用权限管理器检查是否有权限修改状态
    if (!canChangeStatus(todo)) {
      console.error('没有权限修改此任务的状态')
      return
    }
    
    try {
      markLocalStatusUpdate(todoId)
      await updateStatus.mutateAsync({ taskId: todoId.toString(), status: newStatus })
    } catch (error) {
      localStatusUpdateExpiresRef.current.delete(todoId)
      console.error('更新状态失败:', error)
    }
  }
  
  // 处理删除项目
  const handleDeleteProject = async () => {
    try {
      setIsDeleting(true) // 立即禁用待办列表查询，防止继续请求
      setShowDeleteConfirm(false) // 先关闭对话框
      await deleteProject.mutateAsync({
        projectId: projectIdParam,
        organizationId: project.organization_id ?? null,
      })
      // 删除成功后会通过 useDeleteProject hook 自动跳转到项目列表
    } catch (error) {
      console.error('删除项目失败:', error)
      setIsDeleting(false) // 删除失败，恢复查询
      setShowDeleteConfirm(true) // 删除失败，重新显示对话框
    }
  }
  
  // 加载状态 - 必须在所有 Hook 之后
  if (projectLoading) {
    return <LoadingView size="lg" text="加载项目详情..." />
  }
  
  // 错误状态 - 必须在所有 Hook 之后
  if (projectError || !project) {
    console.log(`######- projectError ${projectError} , project:`,project);
    return (
      <ErrorView
        title="加载失败"
        message="无法获取项目详情，请稍后重试"
        onRetry={refetchProject}
      />
    )
  }
  
  // 判断当前用户是否是项目所有者
  const isOwner =
    currentUserRole === 'owner' ||
    project?.creator_id === currentUser?.id ||
    project?.creator?.username === currentUser?.username ||
    project?.members?.some((m: ProjectMember) => m.username === currentUser?.username && m.role === 'owner')

  const canEditProjectInfo = isOwner
  const projectInfoDirty =
    projectInfoName.trim() !== project.name ||
    projectInfoGitUrl.trim() !== (project.git_url || '')

  const handleProjectInfoSave = async () => {
    if (!canEditProjectInfo || isSavingProjectInfo) return

    const trimmedName = projectInfoName.trim()
    const trimmedGitUrl = projectInfoGitUrl.trim()

    setProjectInfoError('')

    if (!trimmedName) {
      setProjectInfoName(project.name)
      setProjectInfoError('请输入项目名称')
      return
    }

    if (trimmedGitUrl) {
      try {
        new URL(trimmedGitUrl)
      } catch {
        setProjectInfoError('请输入有效的 Git 地址')
        return
      }
    }

    if (!projectInfoDirty) {
      setProjectInfoName(project.name)
      setProjectInfoGitUrl(project.git_url || '')
      return
    }

    setIsSavingProjectInfo(true)

    try {
      await updateProject.mutateAsync({
        name: trimmedName,
        git_url: trimmedGitUrl,
      })
      setProjectInfoName(trimmedName)
      setProjectInfoGitUrl(trimmedGitUrl)
      showGlobalToast('项目信息已更新', 'success', 2000)
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.response?.data?.message || err?.message || '更新失败，请重试'
      setProjectInfoError(message)
      showGlobalToast(message, 'error', 2500)
    } finally {
      setIsSavingProjectInfo(false)
    }
  }

  const handleCloseProjectInfoDialog = () => {
    setShowProjectInfoDialog(false)
    window.setTimeout(() => {
      moreMenuButtonRef.current?.blur()
    }, 0)
  }

  const handleCloseCreateTaskDialog = () => {
    setShowCreateTaskDialog(false)
    window.setTimeout(() => {
      createTaskButtonRef.current?.blur()
    }, 0)
  }

  const showStatusTabs = false
  const parentSelectBanner = isSelectingParent ? (
    <div className="parent-select-banner" style={parentBannerStyle} role="status" aria-live="polite">
      <div className="parent-select-banner__content">
        <div className="parent-select-banner__left">
          <div className="parent-select-banner__icon">
            <RelationBannerIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="parent-select-banner__title">选择父待办</div>
            <div className="parent-select-banner__subtitle">
              正在为「{parentSelectTitle}」选择新的父待办
            </div>
          </div>
        </div>
          <div className="parent-select-banner__search">
            <SearchIcon className="w-4 h-4 text-foreground-tertiary" />
            <input
              type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索待办内容..."
            aria-label="搜索待办内容"
          />
          {searchQuery.trim() && (
            <button
              type="button"
              className="parent-select-banner__clear"
              onClick={() => setSearchQuery('')}
              aria-label="清除搜索"
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>
          <div className="parent-select-banner__right">
            {parentSelectError && (
              <span className="parent-select-banner__error text-error">{parentSelectError}</span>
            )}
          <button
            type="button"
            className="parent-select-banner__cancel"
            onClick={handleExitParentSelect}
            disabled={isUpdatingParent}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  ) : null

  const taskDetailPanel = drawerOpen && selectedTaskId ? (
    <aside className="project-task-detail-sidebar" aria-label="待办详情">
      <div className="project-task-detail-toolbar">
        <div className="flex min-w-0 items-center gap-1">
          {taskHistory.length > 0 && (
            <button
              type="button"
              className="project-task-detail-icon-button"
              onClick={() => {
                const previous = taskHistory[taskHistory.length - 1]
                setTaskHistory(prev => prev.slice(0, -1))
                setTaskRoute(previous.taskId)
              }}
              aria-label="返回上一个待办"
              title="返回"
            >
              <BackIcon className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            className="project-task-detail-icon-button"
            onClick={handleOpenTaskDetailFullscreen}
            aria-label="全屏显示待办详情"
            title="全屏显示"
          >
            <FullscreenIcon className="h-4 w-4" />
          </button>
          <span className="truncate text-sm font-medium text-foreground-secondary">待办详情</span>
        </div>
        <div className="project-task-detail-toolbar-actions">
          <button
            type="button"
            className={clsx('project-task-detail-icon-button', !selectedTask && 'is-disabled')}
            onClick={handleCreateSelectedSubtask}
            aria-disabled={!selectedTask}
            aria-label="创建子任务"
            title="创建子任务"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={clsx('project-task-detail-icon-button', (!selectedTask || !canAdjustSelectedParent) && 'is-disabled')}
            onClick={handleAdjustSelectedParent}
            aria-disabled={!selectedTask || !canAdjustSelectedParent}
            aria-label="调整父任务"
            title={!canAdjustSelectedParent ? '没有权限调整父任务' : '调整父任务'}
          >
            <RelationBannerIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="project-task-detail-icon-button"
            onClick={handleCopySelectedTaskLink}
            aria-label="复制待办详情链接"
            title="复制链接"
          >
            <LinkIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="project-task-detail-icon-button"
            onClick={closeTaskDetail}
            aria-label="关闭待办详情"
            title="关闭"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="project-task-detail-body">
        {!taskDetailFullscreenOpen && (
          <TaskDetailContent
            projectId={projectIdParam}
            taskId={selectedTaskId}
            showHeader={false}
            hideCopyLinkButton
            parentTaskId={taskHistory.length > 0 ? taskHistory[taskHistory.length - 1].parentTaskId : null}
            onNavigateToSubtask={handleNavigateSelectedSubtask}
            onStatusMutationStart={markLocalStatusUpdate}
            onClose={closeTaskDetail}
            onDelete={handleSelectedTaskDelete}
          />
        )}
      </div>
    </aside>
  ) : null

  const taskDetailFullscreenDialog = selectedTaskId ? (
    <Dialog
      open={taskDetailFullscreenOpen}
      onClose={handleCloseTaskDetailFullscreen}
      maxWidth="2xl"
      showCloseButton={false}
      panelClassName="project-task-detail-fullscreen-panel"
      bodyClassName="project-task-detail-fullscreen-body"
      panelStyle={{
        maxWidth: 'calc(100vw - 32px)',
        height: 'calc(100dvh - 32px)',
      }}
    >
      <div className="project-task-detail-toolbar project-task-detail-fullscreen-toolbar">
        <div className="flex min-w-0 items-center gap-1">
          {taskHistory.length > 0 && (
            <button
              type="button"
              className="project-task-detail-icon-button"
              onClick={() => {
                const previous = taskHistory[taskHistory.length - 1]
                setTaskHistory(prev => prev.slice(0, -1))
                setTaskRoute(previous.taskId)
              }}
              aria-label="返回上一个待办"
              title="返回"
            >
              <BackIcon className="h-4 w-4" />
            </button>
          )}
          <span className="truncate text-sm font-medium text-foreground-secondary">待办详情</span>
        </div>
        <div className="project-task-detail-toolbar-actions">
          <button
            type="button"
            className={clsx('project-task-detail-icon-button', !selectedTask && 'is-disabled')}
            onClick={handleCreateSelectedSubtask}
            aria-disabled={!selectedTask}
            aria-label="创建子任务"
            title="创建子任务"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={clsx('project-task-detail-icon-button', (!selectedTask || !canAdjustSelectedParent) && 'is-disabled')}
            onClick={handleAdjustSelectedParent}
            aria-disabled={!selectedTask || !canAdjustSelectedParent}
            aria-label="调整父任务"
            title={!canAdjustSelectedParent ? '没有权限调整父任务' : '调整父任务'}
          >
            <RelationBannerIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="project-task-detail-icon-button"
            onClick={handleCopySelectedTaskLink}
            aria-label="复制待办详情链接"
            title="复制链接"
          >
            <LinkIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="project-task-detail-icon-button"
            onClick={handleCloseTaskDetailFullscreen}
            aria-label="退出全屏"
            title="退出全屏"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="project-task-detail-fullscreen-content">
        <TaskDetailContent
          projectId={projectIdParam}
          taskId={selectedTaskId}
          showHeader={false}
          hideCopyLinkButton
          parentTaskId={taskHistory.length > 0 ? taskHistory[taskHistory.length - 1].parentTaskId : null}
          onNavigateToSubtask={handleNavigateSelectedSubtask}
          onStatusMutationStart={markLocalStatusUpdate}
          onClose={handleCloseTaskDetailFullscreen}
          onDelete={handleSelectedTaskDelete}
        />
      </div>
    </Dialog>
  ) : null
  
  return (
    <div className="project-detail-page">
      {parentSelectBanner && typeof document !== 'undefined'
        ? createPortal(parentSelectBanner, document.body)
        : null}
      {taskDetailFullscreenDialog}
      <div className="project-linear-workspace">
      {/* 页面头部 */}
      <div className="project-linear-header flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-8" style={{ visibility: isSelectingParent ? 'hidden' : 'visible' }}>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-5 lg:gap-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={handleProjectSidebarToggle}
              className={clsx(
                'hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-transparent text-foreground-secondary transition-colors lg:flex',
                'hover:bg-surface-hover hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                isProjectSidebarCollapsed && 'bg-surface-hover text-foreground'
              )}
              title={isProjectSidebarCollapsed ? '展开项目列表' : '折叠项目列表'}
              aria-label={isProjectSidebarCollapsed ? '展开项目列表' : '折叠项目列表'}
              aria-pressed={isProjectSidebarCollapsed}
            >
              <ProjectSidebarToggleIcon
                collapsed={isProjectSidebarCollapsed}
                className="h-5 w-5"
              />
            </button>
            <h1 className="project-linear-title min-w-0 truncate text-foreground" title={project.name}>
              {project.name}
            </h1>

            {/* 更多菜单 - 跟随项目名称伸缩 */}
            <div className="relative shrink-0" ref={moreMenuRef}>
              <HeaderIconButton
                icon={<MoreIcon />}
                label="更多"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                isActive={showMoreMenu}
                buttonRef={moreMenuButtonRef}
              />

              {/* 下拉菜单 */}
              {showMoreMenu && (
                <div
                  className="absolute right-0 top-full z-50 mt-2 flex w-44 flex-col overflow-hidden rounded-xl border border-border bg-surface-elevated py-1 shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
                  role="menu"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setProjectInfoName(project.name)
                      setProjectInfoGitUrl(project.git_url || '')
                      setProjectInfoError('')
                      moreMenuButtonRef.current?.blur()
                      setShowProjectInfoDialog(true)
                      setShowMoreMenu(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-surface-hover focus:outline-none focus-visible:bg-surface-hover"
                    role="menuitem"
                  >
                    <ProjectInfoIcon className="h-4 w-4 shrink-0" />
                    <span>项目信息</span>
                  </button>

                  {/* 新增反馈 - 所有用户可见 */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowFeedbackDialog(true)
                      setShowMoreMenu(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-surface-hover focus:outline-none focus-visible:bg-surface-hover"
                    role="menuitem"
                  >
                    <FeedbackIcon className="h-4 w-4 shrink-0" />
                    <span>新增反馈</span>
                  </button>

                  {/* 导出待办 - 所有用户可见 */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportDialog(true)
                      setShowMoreMenu(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-surface-hover focus:outline-none focus-visible:bg-surface-hover"
                    role="menuitem"
                  >
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                    </svg>
                    <span>导出待办</span>
                  </button>

                  {/* 编辑项目 - 只有所有者可见 */}
                  {isOwner && (
                    <button
                      onClick={() => {
                        handleEditClick()
                        setShowMoreMenu(false)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-surface-hover focus:outline-none focus-visible:bg-surface-hover"
                      role="menuitem"
                    >
                      <EditIcon className="h-4 w-4 shrink-0" />
                      <span>编辑项目</span>
                    </button>
                  )}

                  {/* 删除项目 - 只有所有者可见 */}
                  {isOwner && (
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(true)
                        setShowMoreMenu(false)
                      }}
                      disabled={deleteProject.isPending}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-error transition-colors hover:bg-surface-hover focus:outline-none focus-visible:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                      role="menuitem"
                    >
                      {deleteProject.isPending ? (
                        <LoadingSpinner className="h-4 w-4 shrink-0" />
                      ) : (
                        <DeleteIcon className="h-4 w-4 shrink-0" />
                      )}
                      <span>删除项目</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* 操作按钮 - 顶部右对齐 */}
          <div className="flex shrink-0 items-center gap-2">
            {/* 搜索区域 - 搜索按钮和搜索框共用位置 */}
            <div
              className={clsx(
                'relative flex h-10 items-center justify-end transition-[width] duration-300 ease-in-out',
                showSearchBar ? 'w-[300px]' : 'w-10'
              )}
              ref={searchBarRef}
            >
              {/* 搜索按钮 - 搜索框显示时隐藏 */}
              <div className={clsx(
                "transition-all duration-300 ease-in-out",
                showSearchBar ? "opacity-0 scale-0 pointer-events-none absolute right-0" : "opacity-100 scale-100"
              )}>
                <HeaderIconButton
                  icon={<SearchIcon />}
                  label="搜索"
                  onClick={() => {
                    setShowSearchBar(true)
                  }}
                />
              </div>
              
              {/* 搜索栏 - 从搜索按钮位置向左展开 */}
              <div className={clsx(
                "absolute right-0 transition-all duration-300 ease-in-out flex items-center",
                showSearchBar 
                  ? "opacity-100 translate-x-0 pointer-events-auto" 
                  : "opacity-0 translate-x-4 pointer-events-none"
              )}>
                <div className={clsx(
                  "flex h-10 items-center overflow-hidden rounded-md border border-border bg-surface-elevated shadow-sm transition-all duration-300 ease-in-out",
                  showSearchBar ? "w-[300px]" : "w-0"
                )}
                style={{ backgroundColor: 'var(--color-surface-elevated)' }}
                >
                  <div className="flex items-center px-3 py-2 flex-shrink-0">
                    <SearchIcon className="w-4 h-4 text-foreground-tertiary" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索待办内容..."
                    className="flex-1 px-2 py-2 text-sm focus:outline-none focus:ring-0 border-0 bg-transparent text-foreground placeholder:text-foreground-tertiary min-w-0 h-full"
                    autoFocus={showSearchBar}
                  />
                  {/* X按钮 - 有内容时清除内容，无内容时关闭搜索框 */}
                  <button
                    onClick={() => {
                      if (searchQuery.trim()) {
                        setSearchQuery('')
                      } else {
                        setShowSearchBar(false)
                      }
                    }}
                    className="p-1.5 rounded-md hover:bg-surface-hover transition-colors text-foreground-tertiary hover:text-foreground mr-1 flex-shrink-0"
                    title={searchQuery.trim() ? "清除搜索" : "关闭搜索"}
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <button
              ref={createTaskButtonRef}
              type="button"
              onClick={() => {
                setShowCreateTaskDialog(true)
              }}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              创建待办
            </button>

          </div>
        </div>
      </div>

      <div className="project-filter-toolbar" style={{ visibility: isSelectingParent ? 'hidden' : 'visible' }}>
        <div className="task-filter-bar" aria-label="任务筛选">
          <div className="task-filter-chips">
            <FilterMultiSelect
              label="状态"
              variant="linearChip"
              icon={
                <StatusFilterIcon
                  className={clsx(
                    'icon',
                    isStatusFilterActive ? 'text-primary' : 'text-foreground-tertiary'
                  )}
                />
              }
              value={statusFilter}
              options={statusOptions}
              onChange={setStatusFilter}
              active={isStatusFilterActive}
              maxLabelCount={2}
            />

            <FilterMultiSelect
              label="创建人"
              variant="linearChip"
              icon={
                <CreatorFilterIcon
                  className={clsx(
                    'icon',
                    isCreatorFilterActive ? 'text-primary' : 'text-foreground-tertiary'
                  )}
                />
              }
              value={creatorFilter}
              options={creatorOptions}
              onChange={setCreatorFilter}
              active={isCreatorFilterActive}
              disabled={creatorOptions.length === 0}
              maxLabelCount={1}
            />

            <FilterMultiSelect
              label="执行人"
              variant="linearChip"
              icon={
                <ExecutorFilterIcon
                  className={clsx(
                    'icon',
                    isExecutorFilterActive ? 'text-primary' : 'text-foreground-tertiary'
                  )}
                />
              }
              value={executorFilter}
              options={executorOptions}
              onChange={setExecutorFilter}
              active={isExecutorFilterActive}
              disabled={executorOptions.length === 0}
              maxLabelCount={1}
            />

            <FilterMultiSelect
              label="标签"
              variant="linearChip"
              icon={
                <TagFilterIcon
                  className={clsx(
                    'icon',
                    isTagFilterActive ? 'text-primary' : 'text-foreground-tertiary'
                  )}
                />
              }
              value={tagFilter}
              options={tagOptions}
              onChange={setTagFilter}
              active={isTagFilterActive}
              disabled={tagOptions.length === 0}
              maxLabelCount={1}
            />

            <FilterMultiSelect
              label="优先级"
              variant="linearChip"
              icon={
                <PriorityFilterIcon
                  className={clsx(
                    'icon',
                    isPriorityFilterActive ? 'text-primary' : 'text-foreground-tertiary'
                  )}
                />
              }
              value={priorityFilter}
              options={priorityOptions}
              onChange={setPriorityFilter}
              active={isPriorityFilterActive}
              maxLabelCount={2}
            />

            <DateRangeFilter
              value={dateRange}
              onChange={setDateRange}
              variant="linearChip"
              label="日期"
              icon={<DateFilterIcon className="icon text-foreground-tertiary" />}
              active
              allowClear={false}
              onClear={resetDateRange}
            />

            {searchQuery.trim() && (
              <div className="task-filter-chip-wrap">
                <div className="task-filter-chip has-selection">
                  <button className="filter-chip-main" type="button" onClick={() => setShowSearchBar(true)}>
                    <span className="filter-chip-segment filter-chip-field">
                      <SearchIcon className="icon text-primary" />
                      搜索
                    </span>
                    <span className="filter-chip-segment filter-chip-value" title={searchQuery}>
                      {searchQuery}
                    </span>
                  </button>
                  <span className="filter-chip-divider" aria-hidden="true" />
                  <button
                    className="filter-chip-remove"
                    type="button"
                    aria-label="清除搜索"
                    title="清除搜索"
                    onClick={() => {
                      setSearchQuery('')
                      setShowSearchBar(false)
                    }}
                  >
                    <XIcon className="icon" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <div className="task-filter-actions">
              <button
                className="filter-clear-button"
                type="button"
                onClick={() => {
                  setStatusFilter([])
                  setCreatorFilter([])
                  setExecutorFilter([])
                  setTagFilter([])
                  setPriorityFilter([])
                  resetDateRange()
                  setSearchQuery('')
                  setShowSearchBar(false)
                }}
              >
                清除
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className={clsx(
          'project-task-content',
          taskDetailPanel && 'has-detail-sidebar',
          showStatusTabs && 'has-status-tabs'
        )}
      >
        <section className="project-task-list-pane">
      <div className="project-task-list-stack">
          {/* 统计卡片 - 直接放在外层，移除父容器 */}
          {showStatusTabs && (
            <div className="grid grid-cols-4 gap-4" style={{ visibility: isSelectingParent ? 'hidden' : 'visible' }}>
              <StatCard
                title="待办"
                value={stats.pending}
                icon={<TaskIcon />}
                isActive={isStatusSelected('PENDING')}
                onClick={() => toggleStatusFilter('PENDING')}
                className="h-16"
              />
              
              <StatCard
                title="进行中"
                value={stats.inProgress}
                icon={<ProgressIcon />}
                isActive={isStatusSelected('IN_PROGRESS')}
                onClick={() => toggleStatusFilter('IN_PROGRESS')}
                className="h-16"
              />
              
              <StatCard
                title="已完成"
                value={stats.completed}
                icon={<CheckIcon />}
                isActive={isStatusSelected('COMPLETED')}
                onClick={() => toggleStatusFilter('COMPLETED')}
                className="h-16"
              />

              <StatCard
                title="已验收"
                value={stats.accepted}
                icon={<AcceptedIcon />}
                isActive={isStatusSelected('ACCEPTED')}
                onClick={() => toggleStatusFilter('ACCEPTED')}
                className="h-16"
              />
            </div>
          )}

          {/* 待办列表内容 */}
          <div
            ref={listContainerRef}
            className="project-task-list-card relative"
          >
            <div className="project-task-list-scroll">
              {todosLoading ? (
                <div className="py-12">
                  <LoadingView text="加载任务列表..." />
                </div>
              ) : todosError ? (
                <div className="py-12">
                  <ErrorView
                    message="无法获取任务列表"
                    onRetry={refetchTodos}
                  />
                </div>
              ) : !todos || todos.length === 0 ? (
                <EmptyStateView
                  title={hasActiveFilters ? "没有匹配的待办" : "还没有待办"}
                  message={hasActiveFilters ? "尝试切换其他筛选条件" : "创建第一个待办开始工作"}
                  actionLabel={hasActiveFilters ? undefined : "创建待办"}
                  onAction={hasActiveFilters ? undefined : () => setShowCreateTaskDialog(true)}
                />
              ) : filteredTodos.length === 0 ? (
                <EmptyStateView
                  title="没有匹配的待办"
                  message={hasActiveFilters ? '尝试切换其他筛选条件' : '创建第一个待办开始工作'}
                  actionLabel={hasActiveFilters ? undefined : '创建待办'}
                  onAction={hasActiveFilters ? undefined : () => setShowCreateTaskDialog(true)}
                />
              ) : (
                <div className="space-y-4">
                  <div>
                    {filteredTodos.map((todo) => (
                      <TodoTreeItem
                        key={todo.id}
                        todo={todo}
                        projectId={projectIdParam}
                        onStatusChange={!isSelectingParent && canChangeStatus(todo) ? handleStatusChange : undefined}
                        currentUserId={currentUserId}
                        canEdit={!isSelectingParent && canChangeStatus(todo)}
                        members={members || []}
                        canAssignAssignee={!isSelectingParent && canAssignAssignee(todo)}
                        onUpdateAssignee={isSelectingParent ? undefined : handleUpdateAssignee}
                        canEditPriority={!isSelectingParent && canEditPriority(todo)}
                        onUpdatePriority={isSelectingParent ? undefined : handleUpdatePriority}
                        canEditTags={!isSelectingParent && canEditTags(todo)}
                        onUpdateTags={isSelectingParent ? undefined : handleUpdateTags}
                        currentUserRole={currentUserRole}
                        selectedTaskId={selectedTaskId}
                        onClick={(todoId) => {
                          handleOpenTaskDetail(todoId)
                        }}
                        selectionMode={isSelectingParent}
                        selectionDisabled={isSelectingParent && parentSelectBlockedIds.has(todo.id)}
                        selectionDisabledIds={isSelectingParent ? parentSelectBlockedIds : undefined}
                        onSelectParent={isSelectingParent ? handleRequestParentSelect : undefined}
                      />
                    ))}
                  </div>
                </div>
              )}
              </div>
              {totalTasks > 0 && (
                <div className="project-task-list-footer">
                  共 {totalTasks} 条
                </div>
              )}
          </div>
        </div>
        </section>
        {taskDetailPanel}
      </div>
      </div>

      {/* 项目信息弹窗 */}
      <Dialog
        open={showProjectInfoDialog}
        onClose={handleCloseProjectInfoDialog}
        title="项目信息"
        maxWidth="2xl"
        panelClassName="flex flex-col"
        panelStyle={{ maxWidth: '820px', height: '80vh', maxHeight: '820px' }}
        bodyClassName="min-h-0 flex-1 overflow-y-auto px-6 py-5"
      >
        <div className="space-y-8">
          <div className="overflow-hidden rounded-lg border border-border bg-surface-elevated">
            <div className="grid gap-3 border-b border-divider px-4 py-4 md:grid-cols-[minmax(120px,1fr)_minmax(260px,360px)] md:items-center md:px-5">
              <label htmlFor="project-info-name" className="text-sm font-medium text-foreground">
                项目名称
              </label>
              <input
                id="project-info-name"
                value={projectInfoName}
                onChange={(event) => setProjectInfoName(event.target.value)}
                onBlur={handleProjectInfoSave}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur()
                  }
                }}
                className="h-9 w-full rounded-md border border-border bg-surface-elevated px-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-tertiary focus:border-foreground-tertiary focus:ring-1 focus:ring-foreground-tertiary/15 disabled:cursor-not-allowed disabled:bg-surface-disabled"
                placeholder="请输入项目名称"
                disabled={!canEditProjectInfo || isSavingProjectInfo}
                maxLength={50}
              />
            </div>

            <div className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(120px,1fr)_minmax(260px,360px)] md:items-center md:px-5">
              <label htmlFor="project-info-git-url" className="text-sm font-medium text-foreground">
                Git 地址
              </label>
              <input
                id="project-info-git-url"
                value={projectInfoGitUrl}
                onChange={(event) => setProjectInfoGitUrl(event.target.value)}
                onBlur={handleProjectInfoSave}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur()
                  }
                }}
                className="h-9 w-full rounded-md border border-border bg-surface-elevated px-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-tertiary focus:border-foreground-tertiary focus:ring-1 focus:ring-foreground-tertiary/15 disabled:cursor-not-allowed disabled:bg-surface-disabled"
                placeholder="https://github.com/username/repo"
                disabled={!canEditProjectInfo || isSavingProjectInfo}
              />
            </div>
          </div>

          {projectInfoError && (
            <p className="-mt-5 text-sm text-error">{projectInfoError}</p>
          )}

          <section>
            <h3 className="text-lg font-semibold text-foreground">项目成员</h3>
            <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface-elevated p-4 md:p-5">
              <ProjectMemberList
                members={members || []}
                projectId={projectId}
                canAddMember={true}
                canManage={isOwner || currentUserRole === 'admin'}
              />
            </div>
          </section>
        </div>
      </Dialog>
      
      {/* 编辑项目对话框 */}
      <Dialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        title="编辑项目"
      >
        <div className="space-y-4">
          <TextField
            id="edit-name"
            label="项目名称"
            placeholder="例如：待办管理系统"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            fullWidth
            required
            helperText="项目的显示名称"
          />
          
          <TextField
            id="edit-git-url"
            label="Git 地址"
            placeholder="https://github.com/username/repo"
            value={editGitUrl}
            onChange={(e) => setEditGitUrl(e.target.value)}
            fullWidth
            helperText="项目的 Git 仓库地址（可选）"
          />
          
          {editError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{editError}</p>
            </div>
          )}
          
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowEditDialog(false)}
              disabled={updateProject.isPending}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleEditSave}
              loading={updateProject.isPending}
              disabled={updateProject.isPending}
            >
              保存
            </Button>
          </div>
        </div>
      </Dialog>
      
      {/* 删除项目确认对话框 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="删除项目"
        message={`确定要删除项目 "${project.name}" 吗？此操作将删除项目及其所有任务和成员，且无法撤销。`}
        confirmLabel="删除"
        cancelLabel="取消"
        variant="danger"
        onConfirm={handleDeleteProject}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* 选择父待办确认对话框 */}
      <ConfirmDialog
        open={pendingParentId !== null}
        title="确认选择父待办"
        message={`确定选择「${pendingParentTitle}」作为新的父待办吗？`}
        confirmLabel="确定"
        cancelLabel="取消"
        variant="primary"
        onConfirm={handleConfirmParentSelect}
        onCancel={() => setPendingParentId(null)}
      />
      
      {/* 创建待办对话框 */}
      <CreateTaskDialog
        open={showCreateTaskDialog}
        onClose={handleCloseCreateTaskDialog}
        projectId={projectIdParam}
        onSuccess={() => {
          handleCloseCreateTaskDialog()
          refetchTodos()
        }}
      />

      {/* 创建子待办对话框 */}
      <CreateTaskDialog
        open={createSubtaskParentId !== null}
        onClose={handleCloseCreateSubtaskDialog}
        projectId={projectIdParam}
        parentId={createSubtaskParentId ?? undefined}
        onSuccess={handleCreateSelectedSubtaskSuccess}
      />

      {/* 提交反馈对话框 */}
      <FeedbackDialog
        open={showFeedbackDialog}
        onClose={() => setShowFeedbackDialog(false)}
        projectId={projectId}
        projectName={project?.name}
      />
      
      {/* 导出待办对话框 */}
      {todos && members && currentUserId && project && (
        <ExportTodosDialog
          open={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          todos={todos}
          members={members}
          currentUserId={currentUserId}
          projectId={projectId}
          projectName={project.name}
        />
      )}

      {/* 迁移项目对话框 */}
      <Dialog
        open={showMigrateDialog}
        onClose={() => {
          setShowMigrateDialog(false)
          setMigrateOrgId('')
          setMigrateError('')
        }}
        title="迁移项目到组织"
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground-secondary">
            请输入目标组织的ID。迁移后，该项目将归属于指定组织。
          </p>
          <TextField
            label="组织ID"
            value={migrateOrgId}
            onChange={(e) => {
              setMigrateOrgId(e.target.value)
              setMigrateError('')
            }}
            error={migrateError}
            placeholder="例如: 123"
            autoFocus
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowMigrateDialog(false)
                setMigrateOrgId('')
                setMigrateError('')
              }}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleMigrateProject}
              disabled={updateProject.isPending}
              loading={updateProject.isPending}
            >
              迁移
            </Button>
          </div>
        </div>
      </Dialog>
      
    </div>
  )
}

// ==================== 子组件 ====================

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  isActive?: boolean
  onClick?: () => void
  className?: string
}

function StatCard({ title, value, icon, isActive = false, onClick, className }: StatCardProps) {
  return (
    <div
      className={clsx(
        'bg-surface-elevated rounded-lg border border-border p-3 md:p-4 cursor-pointer transition-all flex items-center',
        {
          'ring-2 ring-primary-500': isActive,
          'hover:bg-surface-hover': !isActive,
        },
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 md:gap-3">
        <div className={clsx(
          'w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0',
          {
            'bg-primary-500 text-white': isActive,
            'bg-primary-50 text-primary': !isActive,
          }
        )}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className={clsx(
            'text-xs truncate',
            {
              'text-primary-600 font-medium': isActive,
              'text-foreground-secondary': !isActive,
            }
          )}>{title}</p>
          <p className={clsx(
            'text-lg md:text-xl font-bold',
            {
              'text-primary-600': isActive,
              'text-foreground': !isActive,
            }
          )}>{value}</p>
        </div>
      </div>
    </div>
  )
}

// ==================== 图标按钮组件 ====================

interface HeaderIconButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  buttonRef?: React.Ref<HTMLButtonElement>
}

function HeaderIconButton({
  icon,
  label,
  onClick,
  isActive = false,
  disabled = false,
  buttonRef,
}: HeaderIconButtonProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-transparent text-foreground-secondary transition-colors',
        'hover:bg-surface-hover hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isActive && 'bg-surface-hover text-foreground',
        disabled && 'cursor-not-allowed opacity-50'
      )}
      title={label}
      aria-label={label}
      aria-pressed={isActive}
    >
      <span className="h-5 w-5 shrink-0 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
    </button>
  )
}

// ==================== 图标组件 ====================

function ProjectSidebarToggleIcon({
  collapsed,
  className,
}: {
  collapsed: boolean
  className?: string
}) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5v-13Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v18" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={collapsed ? 'm13 9 3 3-3 3' : 'm16 9-3 3 3 3'}
      />
    </svg>
  )
}

function MembersIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function FeedbackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1138 1024" fill="currentColor" aria-hidden="true">
      <path d="M1055.738 57.594c-45.439-36.351-154.492-27.262-304.439 86.333-213.562 159.036-308.983 368.052-445.298 572.527-22.719 31.807 13.632 49.983 40.895 36.351l86.333-49.983c13.632-4.544 18.175-4.544 13.632-27.262-9.088-68.158 18.176-131.772 59.070-186.298v0c149.947 63.614 331.702 27.262 395.317-154.492 81.789-18.176 159.036-109.053 172.667-172.666 13.632-45.439 9.088-86.333-18.175-104.509zM142.422 716.454c122.684 213.562 390.773 286.263 604.333 163.58 140.859-81.789 218.105-227.193 222.649-377.14 0-49.983-59.070-45.439-59.070 0 0 131.772-68.158 254.457-190.842 327.158-186.298 104.509-422.579 40.895-527.088-140.859-109.053-186.298-45.439-422.579 140.859-527.088 99.965-59.070 222.649-68.158 322.614-27.262 40.895 13.632 59.070-40.895 18.175-54.527-118.141-40.895-249.911-36.351-368.052 31.807-213.562 122.684-286.263 395.317-163.58 604.333z" />
    </svg>
  )
}

function ProjectInfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  )
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function DeleteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={clsx('animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}

function FullscreenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3" />
    </svg>
  )
}

function TaskIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

function ProgressIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function AcceptedIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l7 4v5c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V7l7-4z" />
    </svg>
  )
}

// ==================== 筛选器图标组件 ====================

function StatusFilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )
}

function CreatorFilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function ExecutorFilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}

function TagFilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  )
}

function PriorityFilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  )
}

function DateFilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function RelationBannerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
      <path d="M608 128a48 48 0 0 1 48 48V368a48 48 0 0 1-48 48H530.112v54.016h253.568c9.92 0 17.92 8.064 17.92 17.92v120.064h46.592c26.496 0 48 21.44 47.872 48v192a48 48 0 0 1-48 47.936h-192a48 48 0 0 1-48-48v-192a48 48 0 0 1 48-48h109.632V506.112H258.56V608h109.44a48 48 0 0 1 48 48v191.872a48 48 0 0 1-48 48h-192a48 48 0 0 1-48-48v-192a48 48 0 0 1 48-48h46.592V487.936c0-9.92 8.064-17.92 17.984-17.92h253.44v-54.08H416.128a48 48 0 0 1-48-48v-192A48 48 0 0 1 416.064 128z m-275.2 534.4H211.2a28.8 28.8 0 0 0-28.8 28.8v121.6c0 15.936 12.864 28.8 28.8 28.8h121.6a28.8 28.8 0 0 0 28.8-28.8v-121.6a28.8 28.8 0 0 0-28.8-28.8z m476.8 0h-115.2a32 32 0 0 0-32 32v115.2a32 32 0 0 0 32 32h115.2a32 32 0 0 0 32-32v-115.2a32 32 0 0 0-32-32zM571.52 185.6h-115.2a32 32 0 0 0-32 32v115.2a32 32 0 0 0 32 32h115.2a32 32 0 0 0 32-32V217.6a32 32 0 0 0-32-32z" />
    </svg>
  )
}
