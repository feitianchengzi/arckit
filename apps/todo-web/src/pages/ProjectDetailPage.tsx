
/**
 * 项目详情页面（客户端组件）
 */

import { useState, useMemo, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Button, LoadingView, ErrorView, EmptyStateView, ConfirmDialog, TextField, Dialog, Drawer } from '@/components/ui'
import { TodoTreeItem } from '@/components/features/TodoTreeItem'
import { ProjectMemberList, TaskDetailContent, CreateTaskDialog, ExportTodosDialog, DateRangeFilter, FilterMultiSelect, FeedbackDialog } from '@/components/features'
import { buildTaskTree } from '@/lib/utils/taskTree'
import { enrichTodosWithMembers } from '@/lib/utils/enrichTodosWithMembers'
import { useProject, useDeleteProject, useUpdateProject, useProjectMembers } from '@/hooks/useProjects'
import { useTaskList, useUpdateTaskStatus } from '@/hooks/useTasks'
import { useProjectWebSocket, type ProjectSocketEvent } from '@/hooks/useProjectWebSocket'
import { tasksApi } from '@/lib/api/endpoints/tasks'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useTagStore } from '@/store/tagStore'
import { type DateRange } from '@/lib/utils/filterStorage'
import { decodeProjectId } from '@/lib/utils/projectRouting'
import type { TodoStatus, ProjectMember } from '@/types'
import clsx from 'clsx'
import { permissionManager } from '@/lib/permissions'
import { todoToTaskInfo, isAssigneeUnassigned } from '@/lib/permissions/utils'
import type { TaskInfo } from '@/lib/permissions'

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
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [hideScrollTopForDrawerTransition, setHideScrollTopForDrawerTransition] = useState(false)
  const hasDrawerOpenedRef = useRef(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false)
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
    if (taskIdFromUrl) {
      setSelectedTaskId(taskIdFromUrl)
      setDrawerOpen(true)
      return
    }
    setDrawerOpen(false)
    setSelectedTaskId(null)
    setTaskHistory([])
  }, [taskIdFromUrl])

  useEffect(() => {
    if (drawerOpen) {
      hasDrawerOpenedRef.current = true
      setHideScrollTopForDrawerTransition(false)
      return
    }
    if (!hasDrawerOpenedRef.current) return

    setHideScrollTopForDrawerTransition(true)
    const timer = window.setTimeout(() => {
      setHideScrollTopForDrawerTransition(false)
    }, 320)

    return () => window.clearTimeout(timer)
  }, [drawerOpen])
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
  
  // 更多菜单状态
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  
  // 导出待办对话框状态
  const [showExportDialog, setShowExportDialog] = useState(false)
  // 反馈对话框状态
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)

  // 迁移项目状态
  const [showMigrateDialog, setShowMigrateDialog] = useState(false)
  const [migrateOrgId, setMigrateOrgId] = useState('')
  const [migrateError, setMigrateError] = useState('')
  
  // 筛选器"更多"菜单状态
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const moreFiltersRef = useRef<HTMLDivElement>(null)
  const moreFiltersMenuRef = useRef<HTMLDivElement>(null)
  const filterContainerRef = useRef<HTMLDivElement>(null)
  const [visibleFilters, setVisibleFilters] = useState<string[]>(['status', 'creator', 'executor', 'tag', 'priority', 'dateRange'])
  const [hiddenFilters, setHiddenFilters] = useState<string[]>([])
  const [moreFiltersPosition, setMoreFiltersPosition] = useState<{ top: number; left: number } | null>(null)
  const [searchFilterInMoreMenu, setSearchFilterInMoreMenu] = useState(false)
  
  const statusOptions: Array<{ value: TodoStatus; label: string }> = [
    { value: 'PENDING_REVIEW', label: '待评审' },
    { value: 'PENDING', label: '待办' },
    { value: 'IN_PROGRESS', label: '进行中' },
    { value: 'COMPLETED', label: '已完成' },
    { value: 'ACCEPTED', label: '已验收' },
    { value: 'CANCELLED', label: '已取消' },
    { value: 'BLOCKED', label: '已阻塞' },
  ]
  const priorityOptions = [
    { value: 0, label: '🔴 最高' },
    { value: 1, label: '🟠 高' },
    { value: 2, label: '🟡 中' },
    { value: 3, label: '🟢 低' },
  ]
  const statusValues = statusOptions.map(option => option.value)
  
  const [statusFilter, setStatusFilter] = useState<TodoStatus[]>([])
  const [creatorFilter, setCreatorFilter] = useState<number[]>([])
  const [executorFilter, setExecutorFilter] = useState<number[]>([])
  const [tagFilter, setTagFilter] = useState<number[]>([])
  const [priorityFilter, setPriorityFilter] = useState<number[]>([])

  // 日期范围筛选
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null })
  // 搜索状态
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showSearchBar, setShowSearchBar] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
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
    setDateRange({ startDate: null, endDate: null })
    setSearchQuery('')
    setShowSearchBar(false)
    setPage(1)
    setFilterContextProjectId(projectIdParam)
  }, [filterContextProjectId, projectIdParam])

  // 筛选条件变化时回到第一页
  useEffect(() => {
    setPage(1)
  }, [statusFilter, creatorFilter, executorFilter, tagFilter, priorityFilter, dateRange, searchQuery, pageSize])
  
  const { data: members } = useProjectMembers(projectIdParam)
  const updateStatus = useUpdateTaskStatus(projectIdParam)
  const queryClient = useQueryClient()
  
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
        targets.push('tasks')
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
    [projectId, scheduleRealtimeRefresh]
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

    const startTime = dateRange?.startDate
      ? new Date(`${dateRange.startDate}T00:00:00`).toISOString()
      : undefined
    const endTime = dateRange?.endDate
      ? new Date(`${dateRange.endDate}T23:59:59`).toISOString()
      : undefined
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
  const isDateRangeActive = !!(dateRange && (dateRange.startDate || dateRange.endDate))
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
    page,
    pageSize,
  })
  const todos = taskListData?.todos ?? []
  const taskListMeta = taskListData?.meta
  const totalTasks = taskListData?.total ?? 0
  const totalPages = useMemo(() => {
    const effectivePageSize = taskListMeta?.page_size || pageSize || 1
    const total = taskListMeta?.total ?? totalTasks
    return Math.max(1, Math.ceil(total / effectivePageSize))
  }, [taskListMeta, totalTasks, pageSize])

  useEffect(() => {
    if (todosLoading || !taskListMeta) return
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages, todosLoading, taskListMeta])

  useEffect(() => {
    scrollToTop('auto')
  }, [page, pageSize, scrollToTop])
  
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
      .map(member => ({
        value: member.user_id as number,
        label: member.username || member.user?.username || `用户${member.user_id}`,
      }))
  }, [members])

  const creatorOptions = useMemo(() => {
    if (!currentUserId) return memberOptions
    const others = memberOptions.filter(option => option.value !== currentUserId)
    return [{ value: currentUserId, label: '我' }, ...others]
  }, [memberOptions, currentUserId])

  const executorOptions = creatorOptions

  const tagOptions = useMemo(
    () => projectTags.map(tag => ({ value: tag.id, label: tag.displayName })),
    [projectTags]
  )
  
  // 使用成员信息丰富待办项的用户信息（创建人和执行人）
  const enrichedTodos = useMemo(() => {
    if (!todos || !members) return todos || []
    return enrichTodosWithMembers(todos, members)
  }, [todos, members])

  // 构建树形结构
  const taskTree = useMemo(() => {
    if (!enrichedTodos) return []
    return buildTaskTree(enrichedTodos)
  }, [enrichedTodos])

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
  
  // 监听主内容区滚动
  useEffect(() => {
    let scrollElement: HTMLElement | null = null
    let cleanup: (() => void) | null = null
    
    const setupScrollListener = () => {
      // 先尝试 main 元素
      const main = document.querySelector('main') as HTMLElement
      if (main) {
        const canScroll = main.scrollHeight > main.clientHeight
        
        if (canScroll) {
          scrollElement = main
        } else {
          // 如果 main 不能滚动，检查 body 或 window
          const body = document.body
          const html = document.documentElement
          const windowCanScroll = html.scrollHeight > html.clientHeight || body.scrollHeight > body.clientHeight
          
          if (windowCanScroll) {
            scrollElement = null // 使用 window
          }
        }
      }
      
      const handleScroll = () => {
        if (scrollElement) {
          const scrollTop = scrollElement.scrollTop
          const shouldShow = scrollTop > 150
          setShowScrollTop(shouldShow)
        } else {
          // 使用 window 滚动
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop
          const shouldShow = scrollTop > 150
          setShowScrollTop(shouldShow)
        }
      }
      
      if (scrollElement) {
        scrollElement.addEventListener('scroll', handleScroll, { passive: true })
        handleScroll() // 初始检查
        cleanup = () => {
          scrollElement?.removeEventListener('scroll', handleScroll)
        }
      } else {
        window.addEventListener('scroll', handleScroll, { passive: true })
        handleScroll() // 初始检查
        cleanup = () => {
          window.removeEventListener('scroll', handleScroll)
        }
      }
    }
    
    // 延迟执行，确保 DOM 完全渲染
    const timer1 = setTimeout(() => {
      setupScrollListener()
    }, 300)
    
    // 使用 MutationObserver 监听 DOM 变化
    const observer = new MutationObserver(() => {
      // DOM 变化后重新检查
      setTimeout(() => {
        if (cleanup) cleanup()
        setupScrollListener()
      }, 100)
    })
    
    const main = document.querySelector('main')
    if (main) {
      observer.observe(main, { childList: true, subtree: true })
    }
    
    return () => {
      clearTimeout(timer1)
      observer.disconnect()
      if (cleanup) cleanup()
    }
  }, [todos, filteredTodos]) // 当数据加载完成后重新绑定
  
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
  
  // 计算"更多"菜单的位置
  useEffect(() => {
    if (showMoreFilters && moreFiltersRef.current) {
      const updatePosition = () => {
        if (!moreFiltersRef.current) return
        const rect = moreFiltersRef.current.getBoundingClientRect()
        const menuWidth = 256 // w-64 = 256px
        const left = Math.max(8, rect.right - menuWidth) // 确保不超出左边界
        setMoreFiltersPosition({
          top: rect.bottom + 8,
          left: left,
        })
      }
      
      updatePosition()
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    } else {
      setMoreFiltersPosition(null)
    }
  }, [showMoreFilters])

  // 搜索框引用
  const searchBarRef = useRef<HTMLDivElement>(null)
  
  // 点击外部关闭更多菜单和搜索框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      try {
        const target = event.target as Node
        const targetElement = target as Element

        // 点击在筛选下拉（Portal）内时不关闭
        if (targetElement?.closest('[data-filter-popover="true"]')) {
          return
        }
        
        // 检查是否点击在 DateRangeFilter 的 picker 内部
        // DateRangeFilter 的 picker 使用 Portal 渲染，具有 z-[100] 和特定的样式
        if (targetElement) {
          // 查找最近的具有 z-[100] 或 z-index: 100 的父元素
          let current: Element | null = targetElement
          while (current) {
            const style = window.getComputedStyle(current)
            const zIndex = style.zIndex
            // 检查是否是日期筛选器的 picker（z-index 为 100 且包含日期相关的类名或内容）
            if (zIndex === '100' && (
              current.classList.contains('fixed') ||
              current.getAttribute('style')?.includes('z-index: 100')
            )) {
              // 可能是日期筛选器，检查是否包含日期相关的元素
              const hasDateInput = current.querySelector('input[type="date"]') !== null
              const hasDateText = current.textContent?.includes('快捷选择') || 
                                  current.textContent?.includes('开始日期') ||
                                  current.textContent?.includes('结束日期')
              if (hasDateInput || hasDateText) {
                // 这是日期筛选器，不关闭"更多筛选"菜单
                return
              }
            }
            current = current.parentElement
          }
        }
        
        if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
          setShowMoreMenu(false)
        }
        if (moreFiltersRef.current && !moreFiltersRef.current.contains(target) &&
            moreFiltersMenuRef.current && !moreFiltersMenuRef.current.contains(target)) {
          setShowMoreFilters(false)
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
    
    if (showMoreMenu || showMoreFilters || showSearchBar) {
      // 使用捕获阶段，避免被扩展拦截
      document.addEventListener('mousedown', handleClickOutside, true)
      // 也监听 click 事件作为备用
      document.addEventListener('click', handleClickOutside, true)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true)
      document.removeEventListener('click', handleClickOutside, true)
    }
  }, [showMoreMenu, showMoreFilters, showSearchBar])

  // 计算哪些筛选器需要隐藏（响应式）
  useEffect(() => {
    const calculateVisibleFilters = () => {
      if (!filterContainerRef.current) return

      const container = filterContainerRef.current
      const containerWidth = container.offsetWidth
      const children = Array.from(container.children) as HTMLElement[]
      
      // 重置所有筛选器为可见
      children.forEach((child) => {
        if (child.dataset.filterKey && child.dataset.filterKey !== 'reset' && child.dataset.filterKey !== 'more') {
          child.style.display = ''
        }
      })

      // 获取"重置"按钮的宽度（始终显示，需要预留空间）
      const resetButton = children.find(child => child.dataset.filterKey === 'reset')
      // 如果重置按钮存在，使用实际宽度；如果不存在但应该显示，预留80px空间
      const resetButtonWidth = resetButton ? resetButton.offsetWidth + 16 : 80 + 16 // 16px gap
      
      // 获取搜索筛选器的宽度（如果有搜索内容，需要预留空间）
      const searchFilter = children.find(child => child.dataset.filterKey === 'search')
      const searchFilterWidth = searchFilter ? searchFilter.offsetWidth + 16 : 0 // 16px gap
      
      // 按顺序计算哪些筛选器可以显示
      const filterOrder = ['status', 'creator', 'executor', 'tag', 'priority', 'dateRange']
      let totalWidth = 0
      const filterKeys: string[] = []
      
      // 预留"更多"按钮的空间（约80px，如果后续有隐藏的筛选器）
      const moreButtonWidth = 80 + 16 // 16px gap
      
      // 首先尝试在主行显示搜索筛选器
      // 计算可用宽度（减去搜索和重置按钮的宽度）
      let availableWidth = containerWidth - resetButtonWidth - searchFilterWidth
      let searchFilterInMainRow = true
      
      // 如果搜索筛选器宽度为0（没有搜索内容），不需要预留空间
      if (searchFilterWidth === 0) {
        availableWidth = containerWidth - resetButtonWidth
        searchFilterInMainRow = false
        setSearchFilterInMoreMenu(false) // 没有搜索内容，不在"更多"菜单中显示
      }
      
      for (const filterKey of filterOrder) {
        const child = children.find(c => c.dataset.filterKey === filterKey) as HTMLElement
        if (!child) continue
        
        const width = child.offsetWidth + 16 // 16px gap
        
        // 检查是否还有更多筛选器需要隐藏
        const remainingFilters = filterOrder.slice(filterOrder.indexOf(filterKey) + 1)
        const needsMoreButton = remainingFilters.length > 0 || !searchFilterInMainRow
        
        // 计算需要的总宽度（使用可用宽度）
        const neededWidth = totalWidth + width + (needsMoreButton ? moreButtonWidth : 0)
        
        if (neededWidth <= availableWidth) {
          totalWidth += width
          filterKeys.push(filterKey)
        } else {
          break
        }
      }
      
      // 如果搜索筛选器在主行显示不下，将其隐藏，放到"更多"菜单中
      if (searchFilterWidth > 0) {
        const totalNeededWidth = totalWidth + searchFilterWidth + resetButtonWidth + (filterKeys.length < filterOrder.length ? moreButtonWidth : 0)
        if (totalNeededWidth > containerWidth) {
          searchFilterInMainRow = false
          // 重新计算可用宽度（不减去搜索筛选器宽度）
          availableWidth = containerWidth - resetButtonWidth
          totalWidth = 0
          filterKeys.length = 0
          
          // 重新计算哪些筛选器可以显示
          for (const filterKey of filterOrder) {
            const child = children.find(c => c.dataset.filterKey === filterKey) as HTMLElement
            if (!child) continue
            
            const width = child.offsetWidth + 16 // 16px gap
            const remainingFilters = filterOrder.slice(filterOrder.indexOf(filterKey) + 1)
            const needsMoreButton = remainingFilters.length > 0 || true // 搜索筛选器在"更多"中，所以总是需要"更多"按钮
            
            const neededWidth = totalWidth + width + (needsMoreButton ? moreButtonWidth : 0)
            
            if (neededWidth <= availableWidth) {
              totalWidth += width
              filterKeys.push(filterKey)
            } else {
              break
            }
          }
        }
      }

      // 设置可见和隐藏的筛选器
      const allFilterKeys = ['status', 'creator', 'executor', 'tag', 'priority', 'dateRange']
      setVisibleFilters(filterKeys)
      setHiddenFilters(allFilterKeys.filter(key => !filterKeys.includes(key)))
      
      // 隐藏超出容器的筛选器
      children.forEach((child) => {
        const filterKey = child.dataset.filterKey
        if (filterKey && filterKey !== 'reset' && filterKey !== 'more' && filterKey !== 'search') {
          if (!filterKeys.includes(filterKey)) {
            child.style.display = 'none'
          } else {
            child.style.display = ''
          }
        }
        // 确保重置按钮始终显示（如果有筛选条件）
        if (filterKey === 'reset') {
          child.style.display = ''
        }
        // 搜索筛选器：如果在主行显示，显示；否则隐藏（会在"更多"菜单中显示）
        if (filterKey === 'search') {
          child.style.display = searchFilterInMainRow ? '' : 'none'
          setSearchFilterInMoreMenu(!searchFilterInMainRow)
        }
      })
    }

    // 延迟执行，确保 DOM 已渲染
    const timeoutId = setTimeout(calculateVisibleFilters, 100)
    window.addEventListener('resize', calculateVisibleFilters)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', calculateVisibleFilters)
    }
  }, [statusFilter, creatorFilter, executorFilter, tagFilter, priorityFilter, dateRange, searchQuery, members, projectTags])
  
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
      await updateStatus.mutateAsync({ taskId: todoId.toString(), status: newStatus })
    } catch (error) {
      console.error('更新状态失败:', error)
    }
  }
  
  // 处理删除项目
  const handleDeleteProject = async () => {
    try {
      setIsDeleting(true) // 立即禁用待办列表查询，防止继续请求
      setShowDeleteConfirm(false) // 先关闭对话框
      await deleteProject.mutateAsync(projectIdParam)
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
  
  return (
    <div className="space-y-4 md:space-y-6">
      {parentSelectBanner && typeof document !== 'undefined'
        ? createPortal(parentSelectBanner, document.body)
        : null}
      {/* 页面头部 */}
      <div className="flex flex-col lg:flex-row gap-6" style={{ visibility: isSelectingParent ? 'hidden' : 'visible' }}>
        <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground truncate" title={project.name}>
              {project.name}
            </h1>
            {project.git_url ? (
              <p className="mt-1 text-xs md:text-base text-foreground-secondary truncate" title={project.git_url}>
                {project.git_url}
              </p>
            ) : (
              <p className="mt-1 text-xs md:text-base text-foreground-secondary">
                当前项目尚未关联任何 Git 仓库
              </p>
            )}
          </div>
          
          {/* 操作按钮 - 顶部右对齐 */}
          <div className="flex items-center gap-2 shrink-0 pt-1">
            {/* 搜索区域 - 搜索按钮和搜索框共用位置 */}
            <div className="relative flex items-center" ref={searchBarRef}>
              {/* 搜索按钮 - 搜索框显示时隐藏 */}
              <div className={clsx(
                "transition-all duration-300 ease-in-out",
                showSearchBar ? "opacity-0 scale-0 pointer-events-none absolute right-0" : "opacity-100 scale-100"
              )}>
                <IconButton
                  icon={<SearchIcon />}
                  label="搜索"
                  onClick={() => {
                    setShowSearchBar(true)
                  }}
                  variant="secondary"
                  iconBgColor="transparent"
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
                  "flex items-center bg-surface-elevated border border-border rounded-md shadow-sm overflow-hidden transition-all duration-300 ease-in-out h-[52px]",
                  showSearchBar ? "w-[320px]" : "w-0"
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
            
            {/* 创建待办按钮 */}
            <IconButton
              icon={<CreateTodoIcon />}
              label="创建待办"
              onClick={() => setShowCreateTaskDialog(true)}
              variant="primary"
            />

            {/* 新增反馈按钮 - 所有用户可见 */}
            <IconButton
              icon={
                <svg className="w-5 h-5" viewBox="0 0 1138 1024" fill="currentColor" aria-hidden="true">
                  <path d="M1055.738 57.594c-45.439-36.351-154.492-27.262-304.439 86.333-213.562 159.036-308.983 368.052-445.298 572.527-22.719 31.807 13.632 49.983 40.895 36.351l86.333-49.983c13.632-4.544 18.175-4.544 13.632-27.262-9.088-68.158 18.176-131.772 59.070-186.298v0c149.947 63.614 331.702 27.262 395.317-154.492 81.789-18.176 159.036-109.053 172.667-172.666 13.632-45.439 9.088-86.333-18.175-104.509zM142.422 716.454c122.684 213.562 390.773 286.263 604.333 163.58 140.859-81.789 218.105-227.193 222.649-377.14 0-49.983-59.070-45.439-59.070 0 0 131.772-68.158 254.457-190.842 327.158-186.298 104.509-422.579 40.895-527.088-140.859-109.053-186.298-45.439-422.579 140.859-527.088 99.965-59.070 222.649-68.158 322.614-27.262 40.895 13.632 59.070-40.895 18.175-54.527-118.141-40.895-249.911-36.351-368.052 31.807-213.562 122.684-286.263 395.317-163.58 604.333z" />
                </svg>
              }
              label="新增反馈"
              onClick={() => setShowFeedbackDialog(true)}
              variant="secondary"
              iconBgColor="bg-primary"
              iconColor="text-white"
              hideLabel
            />

            {/* 更多菜单 - 所有用户都可以看到 */}
            <div className="relative" ref={moreMenuRef}>
              <IconButton
                icon={<MoreIcon />}
                label="更多"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                variant="secondary"
                isActive={showMoreMenu}
                iconBgColor="bg-surface-active dark:bg-surface-hover"
              />
              
              {/* 下拉菜单 */}
              {showMoreMenu && (
                <div 
                  className="absolute right-0 top-full mt-1 w-40 border border-border rounded-md shadow-lg z-50"
                  style={{ backgroundColor: 'var(--color-surface-elevated)' }}
                >
                  {/* 导出待办 - 所有用户可见 */}
                  <button
                    onClick={() => {
                      setShowExportDialog(true)
                      setShowMoreMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-surface-hover flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                      className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-surface-hover flex items-center gap-2 transition-colors"
                    >
                      <EditIcon className="w-4 h-4" />
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
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteProject.isPending ? (
                        <LoadingSpinner className="w-4 h-4" />
                      ) : (
                        <DeleteIcon className="w-4 h-4" />
                      )}
                      <span>删除项目</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="lg:w-1/4 min-w-[200px] hidden lg:block" aria-hidden="true"></div>
      </div>

      {/* 待办列表和成员列表 */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 待办列表（自适应宽度） */}
        <div className="flex-1 min-w-0 space-y-6">
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
            className="bg-surface-elevated rounded-lg border border-border relative overflow-visible"
            style={{ padding: '24px', paddingTop: '5px', paddingBottom: '10px', borderColor: 'var(--color-border)' }}
          >
            {/* 筛选器 */}
            <div className="mb-4" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
          {/* 筛选器组 - 单行，不换行 */}
          <div ref={filterContainerRef} className="flex items-center gap-4 flex-nowrap" style={{ overflowX: 'visible', overflowY: 'visible', paddingTop: '6px', paddingBottom: '6px' }}>
            {/* 状态筛选 - 多选 */}
            <div data-filter-key="status" className="flex items-center gap-2 flex-shrink-0">
              <FilterMultiSelect
                label="状态:"
                icon={
                  <StatusFilterIcon
                    className={clsx(
                      'w-4 h-4',
                      isStatusFilterActive ? 'text-orange-500' : 'text-gray-500'
                    )}
                  />
                }
                value={statusFilter}
                options={statusOptions}
                onChange={setStatusFilter}
                active={isStatusFilterActive}
              />
            </div>

            {/* 创建人筛选 */}
            <div data-filter-key="creator" className="flex items-center gap-2 flex-shrink-0">
              <FilterMultiSelect
                label="创建人:"
                icon={
                  <CreatorFilterIcon
                    className={clsx(
                      'w-4 h-4',
                      isCreatorFilterActive ? 'text-warning' : 'text-foreground-tertiary'
                    )}
                  />
                }
                value={creatorFilter}
                options={creatorOptions}
                onChange={setCreatorFilter}
                active={isCreatorFilterActive}
                disabled={creatorOptions.length === 0}
              />
            </div>
            
            {/* 执行人筛选 */}
            <div data-filter-key="executor" className="flex items-center gap-2 flex-shrink-0">
              <FilterMultiSelect
                label="执行人:"
                icon={
                  <ExecutorFilterIcon
                    className={clsx(
                      'w-4 h-4',
                      isExecutorFilterActive ? 'text-warning' : 'text-foreground-tertiary'
                    )}
                  />
                }
                value={executorFilter}
                options={executorOptions}
                onChange={setExecutorFilter}
                active={isExecutorFilterActive}
                disabled={executorOptions.length === 0}
              />
            </div>
            
            {/* 标签筛选 */}
            <div data-filter-key="tag" className="flex items-center gap-2 flex-shrink-0">
              <FilterMultiSelect
                label="标签:"
                icon={
                  <TagFilterIcon
                    className={clsx(
                      'w-4 h-4',
                      isTagFilterActive ? 'text-warning' : 'text-foreground-tertiary'
                    )}
                  />
                }
                value={tagFilter}
                options={tagOptions}
                onChange={setTagFilter}
                active={isTagFilterActive}
                disabled={tagOptions.length === 0}
              />
            </div>
            
            {/* 优先级筛选 */}
            <div data-filter-key="priority" className="flex items-center gap-2 flex-shrink-0">
              <FilterMultiSelect
                label="优先级:"
                icon={
                  <PriorityFilterIcon
                    className={clsx(
                      'w-4 h-4',
                      isPriorityFilterActive ? 'text-warning' : 'text-foreground-tertiary'
                    )}
                  />
                }
                value={priorityFilter}
                options={priorityOptions}
                onChange={setPriorityFilter}
                active={isPriorityFilterActive}
              />
            </div>
            
            {/* 日期范围筛选 - 独立弹窗 */}
            <div data-filter-key="dateRange" className="flex-shrink-0">
              <DateRangeFilter
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
            
            {/* 更多筛选器按钮 */}
            {(hiddenFilters.length > 0 || searchFilterInMoreMenu) && (
              <div data-filter-key="more" className="relative flex-shrink-0" ref={moreFiltersRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowMoreFilters(!showMoreFilters)
                  }}
                  className="relative"
                >
                  更多
                  {/* 角标：当隐藏筛选器中有条件时显示 */}
                    {(() => {
                      // 检查隐藏筛选器中是否有条件
                      const hasHiddenCreator = hiddenFilters.includes('creator') && isCreatorFilterActive
                      const hasHiddenExecutor = hiddenFilters.includes('executor') && isExecutorFilterActive
                      const hasHiddenTag = hiddenFilters.includes('tag') && isTagFilterActive
                      const hasHiddenPriority = hiddenFilters.includes('priority') && isPriorityFilterActive
                      const hasHiddenDateRange = hiddenFilters.includes('dateRange') && isDateRangeActive
                      const hasActiveFilters = hasHiddenCreator || hasHiddenExecutor || hasHiddenTag || hasHiddenPriority || hasHiddenDateRange
                      
                      if (!hasActiveFilters) return null
                      
                      return (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-warning rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                          ·
                        </span>
                      )
                    })()}
                </Button>
                
                {/* 更多筛选器下拉菜单 - 使用 Portal 渲染到 body */}
                {showMoreFilters && moreFiltersPosition && createPortal(
                  <div 
                    ref={moreFiltersMenuRef}
                    className="fixed w-64 border-2 border-border rounded-md shadow-xl z-[100] p-4 space-y-3"
                    style={{ 
                      backgroundColor: 'var(--color-surface-elevated)',
                      top: `${moreFiltersPosition.top}px`,
                      left: `${moreFiltersPosition.left}px`,
                      maxHeight: 'calc(100vh - 100px)',
                      overflowY: 'auto'
                    }}
                  >
                    {hiddenFilters.includes('creator') && (
                      <FilterMultiSelect
                        className="w-full"
                        label="创建人:"
                        icon={<CreatorFilterIcon className="w-4 h-4 text-gray-500" />}
                        value={creatorFilter}
                        options={creatorOptions}
                        onChange={setCreatorFilter}
                        buttonClassName="w-full max-w-none"
                        active={isCreatorFilterActive}
                        disabled={creatorOptions.length === 0}
                      />
                    )}
                    
                    {hiddenFilters.includes('executor') && (
                      <FilterMultiSelect
                        className="w-full"
                        label="执行人:"
                        icon={<ExecutorFilterIcon className="w-4 h-4 text-gray-500" />}
                        value={executorFilter}
                        options={executorOptions}
                        onChange={setExecutorFilter}
                        buttonClassName="w-full max-w-none"
                        active={isExecutorFilterActive}
                        disabled={executorOptions.length === 0}
                      />
                    )}
                    
                    {hiddenFilters.includes('tag') && (
                      <FilterMultiSelect
                        className="w-full"
                        label="标签:"
                        icon={<TagFilterIcon className="w-4 h-4 text-gray-500" />}
                        value={tagFilter}
                        options={tagOptions}
                        onChange={setTagFilter}
                        buttonClassName="w-full max-w-none"
                        active={isTagFilterActive}
                        disabled={tagOptions.length === 0}
                      />
                    )}
                    
                    {hiddenFilters.includes('priority') && (
                      <FilterMultiSelect
                        className="w-full"
                        label="优先级:"
                        icon={<PriorityFilterIcon className="w-4 h-4 text-gray-500" />}
                        value={priorityFilter}
                        options={priorityOptions}
                        onChange={setPriorityFilter}
                        buttonClassName="w-full max-w-none"
                        active={isPriorityFilterActive}
                      />
                    )}
                    
                    {hiddenFilters.includes('dateRange') && (
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-foreground-secondary">
                          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          日期范围:
                        </label>
                        <div className="flex-1">
                          <DateRangeFilter
                            value={dateRange}
                            onChange={setDateRange}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* 如果搜索筛选器在主行显示不下，在"更多"菜单中显示 */}
                    {searchQuery.trim() && searchFilterInMoreMenu && (
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-warning">
                          <SearchIcon className="w-4 h-4 text-warning" />
                          搜索:
                        </label>
                        <div className="flex-1 px-2 py-1 text-sm border border-border rounded-md bg-surface-elevated text-warning font-medium truncate" title={searchQuery}>
                          {searchQuery.length > 10 ? `${searchQuery.slice(0, 10)}...` : searchQuery}
                        </div>
                        <button
                          onClick={() => {
                            setSearchQuery('')
                            setShowSearchBar(false)
                          }}
                          className="p-0.5 rounded-md hover:bg-surface-hover transition-colors text-foreground-tertiary hover:text-foreground flex-shrink-0"
                          title="清除搜索"
                        >
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    
                    {/* 清除所有隐藏筛选条件 */}
                    {(() => {
                      const hasHiddenCreator = hiddenFilters.includes('creator') && isCreatorFilterActive
                      const hasHiddenExecutor = hiddenFilters.includes('executor') && isExecutorFilterActive
                      const hasHiddenTag = hiddenFilters.includes('tag') && isTagFilterActive
                      const hasHiddenPriority = hiddenFilters.includes('priority') && isPriorityFilterActive
                      const hasHiddenDateRange = hiddenFilters.includes('dateRange') && isDateRangeActive
                      const hasActiveFilters = hasHiddenCreator || hasHiddenExecutor || hasHiddenTag || hasHiddenPriority || hasHiddenDateRange
                      
                      if (!hasActiveFilters) return null
                      
                      return (
                        <div className="pt-2 border-t border-border">
                          <button
                            onClick={() => {
                              // 清除所有隐藏筛选器中的条件
                              if (hiddenFilters.includes('creator')) setCreatorFilter([])
                              if (hiddenFilters.includes('executor')) setExecutorFilter([])
                              if (hiddenFilters.includes('tag')) setTagFilter([])
                              if (hiddenFilters.includes('priority')) setPriorityFilter([])
                              if (hiddenFilters.includes('dateRange')) setDateRange({ startDate: null, endDate: null })
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-foreground-secondary hover:text-warning hover:bg-surface-hover rounded-md transition-colors"
                          >
                            <XIcon className="w-4 h-4" />
                            清除所有隐藏筛选
                          </button>
                        </div>
                      )
                    })()}
                  </div>,
                  document.body
                )}
              </div>
            )}
            
            {/* 搜索筛选显示 - 紧挨着"重置筛选" */}
            {searchQuery.trim() && (
              <div data-filter-key="search" className="flex items-center gap-2 flex-shrink-0">
                <label className="flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-warning">
                  <SearchIcon className="w-4 h-4 text-warning" />
                  搜索:
                </label>
                <div className="px-2 py-1 text-sm border border-border rounded-md bg-surface-elevated text-warning font-medium max-w-[80px] truncate" title={searchQuery}>
                  {searchQuery.length > 5 ? `${searchQuery.slice(0, 5)}...` : searchQuery}
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setShowSearchBar(false)
                  }}
                  className="p-0.5 rounded-md hover:bg-surface-hover transition-colors text-foreground-tertiary hover:text-foreground flex-shrink-0"
                  title="清除搜索"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            
            {/* 重置筛选 - 始终显示在最后 */}
            {hasActiveFilters && (
              <div data-filter-key="reset" className="flex-shrink-0 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter([])
                    setCreatorFilter([])
                    setExecutorFilter([])
                    setTagFilter([])
                    setPriorityFilter([])
                    setDateRange({ startDate: null, endDate: null })
                    setSearchQuery('')
                    setShowSearchBar(false)
                  }}
                >
                  重置筛选
                </Button>
              </div>
            )}
          </div>
        </div>
        
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
                  onClick={(todoId) => {
                    setTaskHistory([])
                    setTaskRoute(String(todoId))
                  }}
                  selectionMode={isSelectingParent}
                  selectionDisabled={isSelectingParent && parentSelectBlockedIds.has(todo.id)}
                  selectionDisabledIds={isSelectingParent ? parentSelectBlockedIds : undefined}
                  onSelectParent={isSelectingParent ? handleRequestParentSelect : undefined}
                />
              ))}
            </div>
            {taskListMeta && taskListMeta.total > 0 && (
              <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-foreground-secondary">共 {taskListMeta.total} 条</div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-foreground-secondary">
                    第 {page} / {totalPages} 页
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  >
                    上一页
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  >
                    下一页
                  </Button>
                  <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                    <span>每页</span>
                    <select
                      value={pageSize}
                      onChange={(event) => setPageSize(Number(event.target.value))}
                      className="px-2 py-1 text-sm border border-border rounded-md bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      {[20, 50, 100].map(size => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    <span>条</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
          </div>
        </div>

        {/* 成员列表（占 1/4，宽度减小） */}
        <div className="lg:w-1/4 min-w-[200px]">
          <div className="bg-surface-elevated rounded-lg border border-border p-4" style={{ borderColor: 'var(--color-border)' }}>
            <ProjectMemberList
              members={members || []}
              projectId={projectId}
              canAddMember={true}
              canManage={isOwner || currentUserRole === 'admin'}
              creatorFilter={creatorFilter}
              executorFilter={executorFilter}
              onMemberClick={(member) => {
                const userId = member.user_id;
                
                // 重置其他成员的筛选状态
                const currentCreatorFilter = creatorFilter.includes(userId);
                const currentExecutorFilter = executorFilter.includes(userId);
                
                // 计算当前状态
                let currentState = 0;
                if (currentCreatorFilter && currentExecutorFilter) {
                  currentState = 3; // 两者
                } else if (currentCreatorFilter) {
                  currentState = 2; // 创建人
                } else if (currentExecutorFilter) {
                  currentState = 1; // 执行人
                }
                
                // 计算下一个状态（循环：0 → 1 → 2 → 3 → 0）
                const nextState = (currentState + 1) % 4;
                
                // 根据状态设置筛选
                switch (nextState) {
                  case 1: // 第一次点击 - 执行人
                    setExecutorFilter([userId]);
                    setCreatorFilter([]);
                    break;
                  case 2: // 第二次点击 - 创建人
                    setExecutorFilter([]);
                    setCreatorFilter([userId]);
                    break;
                  case 3: // 第三次点击 - 两者
                    setExecutorFilter([userId]);
                    setCreatorFilter([userId]);
                    break;
                  case 0: // 第四次点击 - 重置
                  default:
                    setExecutorFilter([]);
                    setCreatorFilter([]);
                    break;
                }
              }}
            />
          </div>
        </div>
      </div>
      
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
      
      {/* 待办详情抽屉 */}
      <Drawer
        open={drawerOpen}
        onClose={() => {
          setTaskRoute(null)
        }}
        width="w-full md:w-[600px] lg:w-[700px]"
        showBackButton={taskHistory.length > 0}
        onBack={() => {
          if (taskHistory.length > 0) {
            // 如果有历史记录，返回上一个任务
            const previous = taskHistory[taskHistory.length - 1]
            setTaskHistory(prev => prev.slice(0, -1))
            setTaskRoute(previous.taskId)
          }
        }}
      >
        {selectedTaskId && (
          <TaskDetailContent
            projectId={projectIdParam}
            taskId={selectedTaskId}
            showHeader={false}
            parentTaskId={taskHistory.length > 0 ? taskHistory[taskHistory.length - 1].parentTaskId : null}
            onNavigateToSubtask={(subtaskId) => {
              // 获取当前任务的父任务ID
              const currentTask = enrichedTodos?.find(t => t.id.toString() === selectedTaskId)
              const parentTaskId = currentTask?.parentId || null
              
              // 添加到历史记录
              setTaskHistory(prev => [...prev, { taskId: selectedTaskId, projectId: projectIdParam, parentTaskId }])
              
              // 导航到子待办
              setTaskRoute(String(subtaskId))
            }}
            onRequestParentSelect={(taskId) => {
              handleStartParentSelect(taskId)
            }}
            onClose={() => {
              // 关闭抽屉（回退逻辑已在 Drawer 的 onBack 中处理）
              setTaskRoute(null)
            }}
            onDelete={() => {
              setTaskRoute(null)
              refetchTodos()
            }}
          />
        )}
      </Drawer>
      
      {/* 创建待办对话框 */}
      <CreateTaskDialog
        open={showCreateTaskDialog}
        onClose={() => setShowCreateTaskDialog(false)}
        projectId={projectIdParam}
        onSuccess={() => {
          setShowCreateTaskDialog(false)
          refetchTodos()
        }}
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
      
      {/* 回到顶部按钮 */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          scrollToTop()
        }}
        type="button"
        className={clsx(
          'fixed bottom-6 right-6 z-[100]',
          'w-12 h-12 flex items-center justify-center',
          'bg-blue-400 text-white rounded-full shadow-lg',
          'hover:bg-blue-500 transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2',
          'cursor-pointer',
          showScrollTop && !drawerOpen && !hideScrollTopForDrawerTransition
            ? 'opacity-100 translate-y-0 pointer-events-auto visible' 
            : 'opacity-0 translate-y-4 pointer-events-none invisible'
        )}
        aria-label="回到顶部"
        tabIndex={showScrollTop && !drawerOpen && !hideScrollTopForDrawerTransition ? 0 : -1}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>
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

interface IconButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  isActive?: boolean
  disabled?: boolean
  iconBgColor?: string
  iconColor?: string
  hideLabel?: boolean
}

function IconButton({
  icon,
  label,
  onClick,
  variant = 'secondary',
  isActive = false,
  disabled = false,
  iconBgColor,
  iconColor,
  hideLabel = false,
}: IconButtonProps) {
  // 根据variant和isActive状态确定背景色
  const getBackgroundColor = () => {
    if (iconBgColor) return undefined // 使用自定义背景色类
    if (variant === 'primary') return 'var(--color-primary)'
    if (variant === 'danger') return 'var(--color-error)'
    if (variant === 'secondary') {
      return isActive ? 'var(--color-surface-hover)' : 'var(--color-surface-active)'
    }
    return 'var(--color-surface-active)'
  }

  const bgColor = getBackgroundColor()

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'relative group min-w-[52px] min-h-[52px] px-3 py-2.5 flex items-center justify-center gap-2 rounded-lg transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        // 如果有自定义背景色，使用自定义背景色，否则使用 variant 的默认样式
        iconBgColor 
          ? clsx(
              iconBgColor === 'transparent' ? 'bg-transparent' : iconBgColor, 
              iconColor || 'text-foreground', 
              iconBgColor === 'transparent' ? 'hover:bg-surface-hover' : 'hover:opacity-80', 
              'focus:ring-gray-500'
            )
          : {
              'text-white hover:opacity-90 focus:ring-primary': variant === 'primary',
              'text-foreground hover:opacity-90 focus:ring-gray-500': variant === 'secondary',
              'text-white hover:opacity-90 focus:ring-error': variant === 'danger',
            },
        {
          'opacity-50 cursor-not-allowed': disabled,
        }
      )}
      style={iconBgColor === 'transparent' ? { backgroundColor: 'transparent' } : bgColor ? { backgroundColor: bgColor } : undefined}
      title={label}
      aria-label={label}
    >
      <span className={clsx('w-5 h-5 flex-shrink-0', iconColor && !iconBgColor ? iconColor : '')}>{icon}</span>
      {!hideLabel && <span className="hidden sm:inline text-sm font-medium">{label}</span>}
      
      {/* Tooltip */}
      <div
        className={clsx(
          'absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50',
          hideLabel ? '' : 'sm:hidden'
        )}
      >
        <div className="bg-gray-900 text-white text-xs rounded py-1.5 px-2.5 whitespace-nowrap shadow-lg">
          {label}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
        </div>
      </div>
    </button>
  )
}

// ==================== 图标组件 ====================

function MembersIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function CreateTodoIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      {/* 待办列表 */}
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      {/* + 号在右上角，使用圆形背景 */}
      <circle cx="17" cy="7" r="3.5" fill="currentColor" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 5.5v3M15.5 7h3" strokeWidth={1.5} stroke="white" fill="white" />
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
