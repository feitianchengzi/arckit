
/**
 * 项目详情页面（客户端组件）
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, LoadingView, ErrorView, EmptyStateView, ConfirmDialog, TextField, Dialog, Drawer } from '@/components/ui'
import { TodoTreeItem } from '@/components/features/TodoTreeItem'
import { ProjectMemberList, TaskDetailContent, CreateTaskDialog, ExportTodosDialog } from '@/components/features'
import { buildTaskTree } from '@/lib/utils/taskTree'
import { enrichTodosWithMembers } from '@/lib/utils/enrichTodosWithMembers'
import { useProject, useDeleteProject, useUpdateProject, useProjectMembers } from '@/hooks/useProjects'
import { useTaskList, useUpdateTaskStatus } from '@/hooks/useTasks'
import { tasksApi } from '@/lib/api/endpoints/tasks'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useTagStore } from '@/store/tagStore'
import { parseTaskTags } from '@/lib/utils/tagUtils'
import { saveProjectFilterState, loadProjectFilterState, type DateRange } from '@/lib/utils/filterStorage'
import { DateRangeFilter } from '@/components/features/DateRangeFilter'
import type { TodoStatus } from '@/types'
import clsx from 'clsx'
import { permissionManager } from '@/lib/permissions'
import { todoToTaskInfo, isAssigneeUnassigned } from '@/lib/permissions/utils'
import type { TaskInfo } from '@/lib/permissions'

export default function ProjectDetailPage() {
  const navigate = useNavigate()
  const params = useParams()
  const projectId = Number(params.id!)
  
  const currentUser = useAuthStore((state) => state.user)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false)
  const [taskHistory, setTaskHistory] = useState<Array<{ taskId: string; projectId: string; parentTaskId: number | null }>>([])
  
  // 回到顶部
  const scrollToTop = () => {
    const main = document.querySelector('main') as HTMLElement
    if (main && main.scrollHeight > main.clientHeight) {
      main.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  const { data: project, isLoading: projectLoading, error: projectError, refetch: refetchProject } = useProject(String(projectId))
  const deleteProject = useDeleteProject()
  const updateProject = useUpdateProject(String(projectId))
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
  
  // 筛选器"更多"菜单状态
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const moreFiltersRef = useRef<HTMLDivElement>(null)
  const moreFiltersMenuRef = useRef<HTMLDivElement>(null)
  const filterContainerRef = useRef<HTMLDivElement>(null)
  const [visibleFilters, setVisibleFilters] = useState<string[]>(['status', 'creator', 'executor', 'tag', 'priority', 'dateRange'])
  const [hiddenFilters, setHiddenFilters] = useState<string[]>([])
  const [moreFiltersPosition, setMoreFiltersPosition] = useState<{ top: number; left: number } | null>(null)
  const [searchFilterInMoreMenu, setSearchFilterInMoreMenu] = useState(false)
  
  // 从本地存储恢复筛选条件（按项目ID）
  const savedFilters = loadProjectFilterState(String(projectId))
  
  // 任务筛选状态（默认选中"待办任务"）
  const [statusFilter, setStatusFilter] = useState<TodoStatus | 'ALL'>(
    (savedFilters?.statusFilter as TodoStatus | 'ALL') || 'PENDING'
  )
  // 创建人和执行人筛选
  const [creatorFilter, setCreatorFilter] = useState<number | 'ME' | null>(
    savedFilters?.creatorFilter ?? null
  )
  const [executorFilter, setExecutorFilter] = useState<number | 'ME' | 'UNASSIGNED' | null>(
    savedFilters?.executorFilter ?? null
  )
  // 标签和优先级筛选
  const [tagFilter, setTagFilter] = useState<number | null>(
    (savedFilters?.tagFilter as number) ?? null
  )
  const [priorityFilter, setPriorityFilter] = useState<number | null | 'ALL' | 'NONE'>(
    savedFilters?.priorityFilter ?? null
  )
  // 日期范围筛选
  const [dateRange, setDateRange] = useState<DateRange>(
    savedFilters?.dateRange ?? { startDate: null, endDate: null }
  )
  // 搜索状态
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showSearchBar, setShowSearchBar] = useState(false)
  
  // 当筛选条件改变时保存到本地存储
  useEffect(() => {
    saveProjectFilterState(String(projectId), {
      statusFilter,
      creatorFilter,
      executorFilter,
      tagFilter: tagFilter as number | null,
      priorityFilter,
      dateRange,
    })
  }, [projectId, statusFilter, creatorFilter, executorFilter, tagFilter, priorityFilter, dateRange])
  
  // 如果正在删除项目，禁用待办列表查询
  const { data: todos, isLoading: todosLoading, error: todosError, refetch: refetchTodos } = useTaskList(String(projectId), {
    enabled: !isDeleting && !!project, // 正在删除或项目不存在时不查询
  })
  const { data: members } = useProjectMembers(String(projectId))
  const updateStatus = useUpdateTaskStatus(String(projectId))
  const queryClient = useQueryClient()
  
  // 加载项目标签
  const { loadProjectTags, getProjectTags } = useTagStore()
  useEffect(() => {
    if (projectId) {
      loadProjectTags(String(projectId)).catch(console.error)
    }
  }, [projectId, loadProjectTags])
  const projectTags = getProjectTags(String(projectId))
  
  // 验证并修复筛选条件（数据加载完成后）
  useEffect(() => {
    if (todosLoading || !members) return
    
    let needUpdate = false
    const updates: Partial<{
      creatorFilter: number | 'ME' | null
      executorFilter: number | 'ME' | 'UNASSIGNED' | null
      tagFilter: number | null
    }> = {}
    
    // 验证创建人筛选
    if (creatorFilter !== null && creatorFilter !== 'ME') {
      const memberExists = members.some(m => m.user_id === creatorFilter)
      if (!memberExists) {
        updates.creatorFilter = null
        needUpdate = true
      }
    }
    
    // 验证执行人筛选
    if (executorFilter !== null && executorFilter !== 'ME' && executorFilter !== 'UNASSIGNED') {
      const memberExists = members.some(m => m.user_id === executorFilter)
      if (!memberExists) {
        updates.executorFilter = null
        needUpdate = true
      }
    }
    
    // 验证标签筛选
    if (tagFilter !== null) {
      const tagExists = projectTags.some(t => t.id === tagFilter)
      if (!tagExists) {
        updates.tagFilter = null
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
  
  // 统计数据（基于树形结构，只统计根任务）
  const stats = useMemo(() => {
    if (!taskTree || taskTree.length === 0) return { pending: 0, inProgress: 0, completed: 0 }
    
    return {
      pending: taskTree.filter(t => t.status === 'PENDING').length,
      inProgress: taskTree.filter(t => t.status === 'IN_PROGRESS').length,
      completed: taskTree.filter(t => t.status === 'COMPLETED').length,
    }
  }, [taskTree])
  
  // 筛选后的待办列表（树形结构）
  const filteredTodos = useMemo(() => {
    if (!taskTree || taskTree.length === 0) return []
    
    // 检查是否同时筛选了创建人和执行人
    const hasBothFilters = creatorFilter !== null && executorFilter !== null
    
    // 创建人匹配函数
    const checkCreatorMatch = (todo: typeof taskTree[0]): boolean => {
      if (creatorFilter === null) return true
      if (creatorFilter === 'ME') {
        return todo.creatorId === currentUserId
      }
      return todo.creatorId === creatorFilter
    }
    
    // 执行人匹配函数
    const checkExecutorMatch = (todo: typeof taskTree[0]): boolean => {
      if (executorFilter === null) return true
      if (executorFilter === 'ME') {
        return todo.assigneeId === currentUserId
      } else if (executorFilter === 'UNASSIGNED') {
        return todo.assigneeId === undefined || todo.assigneeId === null
      }
      return todo.assigneeId === executorFilter
    }
    
    // 筛选函数：检查任务是否匹配筛选条件
    const matchesFilters = (todo: typeof taskTree[0], useOrLogic: boolean = false): boolean => {
      // 状态筛选
      const statusMatch = statusFilter === 'ALL' || todo.status === statusFilter
      
      // 创建人筛选
      const creatorMatch = checkCreatorMatch(todo)
      
      // 执行人筛选
      const executorMatch = checkExecutorMatch(todo)
      
      // 如果同时筛选创建人和执行人，且使用OR逻辑
      let creatorExecutorMatch = true
      if (hasBothFilters && useOrLogic) {
        // OR逻辑：创建人匹配 OR 执行人匹配
        creatorExecutorMatch = creatorMatch || executorMatch
      } else {
        // AND逻辑：创建人匹配 AND 执行人匹配
        creatorExecutorMatch = creatorMatch && executorMatch
      }
      
      // 标签筛选
      let tagMatch = true
      if (tagFilter !== null) {
        const taskTagIds = parseTaskTags(todo.tags)
        tagMatch = taskTagIds.includes(tagFilter)
      }
      
      // 优先级筛选
      let priorityMatch = true
      if (priorityFilter !== null) {
        if (priorityFilter === 'ALL') {
          // 'ALL' 表示筛选"有优先级"（任意优先级）
          priorityMatch = todo.priority !== null && todo.priority !== undefined
        } else if (priorityFilter === 'NONE') {
          // 'NONE' 表示筛选"无优先级"
          priorityMatch = todo.priority === null || todo.priority === undefined
        } else {
          // 数字表示筛选特定优先级
          priorityMatch = todo.priority === priorityFilter
        }
      }
      // priorityFilter === null 表示不筛选优先级
      
      // 日期范围筛选（基于创建时间）
      let dateMatch = true
      if (dateRange && (dateRange.startDate || dateRange.endDate)) {
        const taskDate = new Date(todo.createdAt)
        taskDate.setHours(0, 0, 0, 0)
        
        if (dateRange.startDate) {
          const startDate = new Date(dateRange.startDate)
          startDate.setHours(0, 0, 0, 0)
          if (taskDate < startDate) {
            dateMatch = false
          }
        }
        
        if (dateRange.endDate && dateMatch) {
          const endDate = new Date(dateRange.endDate)
          endDate.setHours(23, 59, 59, 999)
          if (taskDate > endDate) {
            dateMatch = false
          }
        }
      }
      
      // 搜索匹配（模糊匹配待办内容、标题和创建人/执行人用户名）
      let searchMatch = true
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase()
        const content = (todo.content || '').toLowerCase()
        const title = (todo.title || '').toLowerCase()
        
        // 检查内容或标题匹配
        let contentMatch = content.includes(query) || title.includes(query)
        
        // 检查创建人用户名匹配
        let creatorNameMatch = false
        if (members) {
          const creatorMember = members.find(m => m.user_id === todo.creatorId)
          if (creatorMember) {
            const creatorName = (creatorMember.username || creatorMember.user?.username || '').toLowerCase()
            creatorNameMatch = creatorName.includes(query)
          }
        }
        
        // 检查执行人用户名匹配
        let executorNameMatch = false
        if (members && todo.assigneeId) {
          const executorMember = members.find(m => m.user_id === todo.assigneeId)
          if (executorMember) {
            const executorName = (executorMember.username || executorMember.user?.username || '').toLowerCase()
            executorNameMatch = executorName.includes(query)
          }
        }
        
        searchMatch = contentMatch || creatorNameMatch || executorNameMatch
      }
      
      return statusMatch && creatorExecutorMatch && tagMatch && priorityMatch && dateMatch && searchMatch
    }
    
    // 递归筛选树形结构
    const filterTree = (tasks: typeof taskTree, useOrLogic: boolean = false): typeof taskTree => {
      return tasks
        .filter(todo => {
          // 如果任务本身匹配筛选条件，或者有子任务匹配筛选条件，则保留
          if (matchesFilters(todo, useOrLogic)) {
            return true
          }
          // 如果有子任务，递归检查子任务
          if (todo.children && todo.children.length > 0) {
            const filteredChildren = filterTree(todo.children, useOrLogic)
            if (filteredChildren.length > 0) {
              // 保留父任务，但只显示匹配的子任务
              return true
            }
          }
          return false
        })
        .map(todo => {
          // 如果任务本身不匹配，但子任务匹配，只显示子任务
          if (!matchesFilters(todo, useOrLogic) && todo.children && todo.children.length > 0) {
            const filteredChildren = filterTree(todo.children, useOrLogic)
            if (filteredChildren.length > 0) {
              return {
                ...todo,
                children: filteredChildren,
              }
            }
          }
          return todo
        })
    }
    
    // 如果同时筛选了创建人和执行人，优先显示AND结果，然后显示OR结果
    if (hasBothFilters) {
      // 先获取AND逻辑的结果（创建人&执行人）
      const andResults = filterTree(taskTree, false)
      
      // 获取OR逻辑的结果（创建人 OR 执行人）
      const orResults = filterTree(taskTree, true)
      
      // 创建一个函数来检查任务是否在结果列表中（通过ID比较）
      const isTodoInResults = (todo: typeof taskTree[0], results: typeof taskTree): boolean => {
        // 检查当前任务
        if (results.some(r => r.id === todo.id)) {
          return true
        }
        // 递归检查子任务
        if (todo.children && todo.children.length > 0) {
          return todo.children.some(child => isTodoInResults(child, results))
        }
        return false
      }
      
      // 从OR结果中排除已经在AND结果中的任务
      const filteredOrResults = orResults.filter(todo => !isTodoInResults(todo, andResults))
      
      // 合并结果：AND结果在前，OR结果在后
      // 对AND结果按日期排序（最新的在前）
      const sortedAndResults = [...andResults].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateB - dateA // 降序，最新的在前
      })
      
      // 对OR结果也按日期排序（最新的在前）
      const sortedOrResults = [...filteredOrResults].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateB - dateA // 降序，最新的在前
      })
      
      return [...sortedAndResults, ...sortedOrResults]
    }
    
    // 否则使用原来的逻辑
    return filterTree(taskTree)
  }, [taskTree, statusFilter, creatorFilter, executorFilter, tagFilter, priorityFilter, dateRange, searchQuery, currentUserId, members])
  
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
    await tasksApi.update(String(projectId), String(taskId), { assigneeId: assigneeId || undefined })
    // 刷新待办列表缓存
    queryClient.invalidateQueries({ queryKey: ['projects', String(projectId), 'tasks'] })
    queryClient.refetchQueries({ queryKey: ['projects', String(projectId), 'tasks'] })
  }, [projectId, queryClient])
  
  // 处理更新优先级
  const handleUpdatePriority = useCallback(async (taskId: number, priority: number | null) => {
    await tasksApi.update(String(projectId), String(taskId), { priority: priority !== null ? priority : undefined })
    // 刷新待办列表缓存
    queryClient.invalidateQueries({ queryKey: ['projects', String(projectId), 'tasks'] })
    queryClient.refetchQueries({ queryKey: ['projects', String(projectId), 'tasks'] })
  }, [projectId, queryClient])

  const canEditTags = useCallback((todo: any) => {
    const taskInfo: TaskInfo = todoToTaskInfo(todo)
    return permissionManager.task.hasEditTagsPermission(
      taskInfo,
      currentUserRole,
      currentUserId
    )
  }, [currentUserId, currentUserRole])

  const handleUpdateTags = useCallback(async (taskId: number, tagsString: string) => {
    await tasksApi.update(String(projectId), String(taskId), { tags: tagsString })
    // 刷新待办列表缓存
    queryClient.invalidateQueries({ queryKey: ['projects', String(projectId), 'tasks'] })
    queryClient.refetchQueries({ queryKey: ['projects', String(projectId), 'tasks'] })
  }, [projectId, queryClient])
  
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
        
        // 检查是否点击在 DateRangeFilter 的 picker 内部
        // DateRangeFilter 的 picker 使用 Portal 渲染，具有 z-[100] 和特定的样式
        const targetElement = target as Element
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
    if (!editName.trim()) {
      setEditError('请输入项目名称')
      return
    }
    
    if (!editGitUrl.trim()) {
      setEditError('请输入 Git 地址')
      return
    }
    
    // 简单的 URL 验证
    try {
      new URL(editGitUrl.trim())
    } catch {
      setEditError('请输入有效的 Git 地址')
      return
    }
    
    try {
      await updateProject.mutateAsync({
        name: editName.trim(),
        git_url: editGitUrl.trim(),
      })
      setShowEditDialog(false)
    } catch (err: any) {
      setEditError(err?.response?.data?.error || err?.response?.data?.message || err?.message || '更新失败，请重试')
    }
  }
  
  // 处理状态变更
  const handleStatusChange = async (todoId: number, newStatus: string) => {
    // 查找对应的任务
    const todo = taskTree.find(t => t.id === todoId)
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
      await deleteProject.mutateAsync(String(projectId))
      // 删除成功后会通过 useDeleteProject hook 自动跳转到项目列表
    } catch (error) {
      console.error('删除项目失败:', error)
      setIsDeleting(false) // 删除失败，恢复查询
      setShowDeleteConfirm(true) // 删除失败，重新显示对话框
    }
  }
  
  // 加载状态 - 必须在所有 Hook 之后
  if (projectLoading || todosLoading) {
    return <LoadingView size="lg" text="加载项目详情..." />
  }
  
  // 错误状态 - 必须在所有 Hook 之后
  if (projectError || todosError || !project) {
    return (
      <ErrorView
        title="加载失败"
        message="无法获取项目详情，请稍后重试"
        onRetry={() => {
          refetchProject()
          refetchTodos()
        }}
      />
    )
  }
  
  // 判断当前用户是否是项目所有者
  const isOwner = project?.creator?.username === currentUser?.username || 
    project?.members?.some(m => m.username === currentUser?.username && m.role === 'owner')
  
  return (
    <div className="space-y-4 md:space-y-6">
      {/* 页面头部 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-4 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground truncate" title={project.name}>
              {project.name}
            </h1>
            {project.git_url && (
              <p className="mt-1 text-xs md:text-base text-foreground-secondary truncate" title={project.git_url}>
                {project.git_url}
              </p>
            )}
          </div>
          
          {/* 操作按钮 - 右对齐待办列表右侧 */}
          <div className="flex items-center gap-2 shrink-0">
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
            
            {/* 更多菜单 - 所有用户都可以看到 */}
            <div className="relative" ref={moreMenuRef}>
              <IconButton
                icon={<MoreIcon />}
                label="更多"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                variant="secondary"
                isActive={showMoreMenu}
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
        {/* 占位，保持布局一致 */}
        <div className="hidden lg:block"></div>
      </div>
      
      {/* 待办列表和成员列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 待办列表（占 4/5） */}
        <div className="lg:col-span-4 space-y-6">
          {/* 统计卡片 - 移动端横向滚动，桌面端网格布局 */}
          <div className="bg-surface-elevated rounded-lg shadow-md border border-border p-4 md:p-6" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex md:grid md:grid-cols-3 gap-2 md:gap-4 overflow-x-auto overflow-y-visible py-2 md:py-2 scrollbar-hide" style={{ paddingLeft: '4px', paddingRight: '4px' }}>
              <StatCard
                title="待办"
                value={stats.pending}
                icon={<TaskIcon />}
                isActive={statusFilter === 'PENDING'}
                onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
                className="min-w-[120px] md:min-w-0 flex-shrink-0"
              />
              
              <StatCard
                title="进行中"
                value={stats.inProgress}
                icon={<ProgressIcon />}
                isActive={statusFilter === 'IN_PROGRESS'}
                onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
                className="min-w-[120px] md:min-w-0 flex-shrink-0"
              />
              
              <StatCard
                title="已完成"
                value={stats.completed}
                icon={<CheckIcon />}
                isActive={statusFilter === 'COMPLETED'}
                onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
                className="min-w-[120px] md:min-w-0 flex-shrink-0"
              />
            </div>
          </div>

          {/* 待办列表内容 */}
          <div className="bg-surface-elevated rounded-lg shadow-md border border-border relative overflow-visible" style={{ padding: '24px', paddingTop: '28px', paddingBottom: '28px', borderColor: 'var(--color-border)' }}>
            {/* 筛选器 */}
            <div className="mb-4" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
          {/* 筛选器组 - 单行，不换行 */}
          <div ref={filterContainerRef} className="flex items-center gap-4 flex-nowrap" style={{ overflowX: 'hidden', overflowY: 'visible', paddingTop: '6px', paddingBottom: '6px' }}>
            {/* 状态筛选 */}
            <div data-filter-key="status" className="flex items-center gap-2 flex-shrink-0">
              <label className={clsx(
                "flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap",
                statusFilter !== 'ALL' ? "text-warning" : "text-foreground-secondary"
              )}>
                <StatusFilterIcon className={clsx(
                  "w-4 h-4",
                  statusFilter !== 'ALL' ? "text-orange-500" : "text-gray-500"
                )} />
                状态:
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    const value = e.target.value
                    setStatusFilter(value as TodoStatus | 'ALL')
                  }}
                  className={clsx(
                    "px-2 py-1 text-sm border border-border rounded-md bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary max-w-[120px]",
                    statusFilter !== 'ALL' ? "text-warning font-medium" : "text-foreground"
                  )}
                >
                  <option value="ALL">全部</option>
                  <option value="PENDING">待办</option>
                  <option value="IN_PROGRESS">进行中</option>
                  <option value="COMPLETED">已完成</option>
                  <option value="CANCELLED">已取消</option>
                  <option value="BLOCKED">已阻塞</option>
                </select>
              </div>
            </div>
            
            {/* 创建人筛选 */}
            <div data-filter-key="creator" className="flex items-center gap-2 flex-shrink-0">
              <label className={clsx(
                "flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap",
                creatorFilter !== null ? "text-warning" : "text-foreground-secondary"
              )}>
                <CreatorFilterIcon className={clsx(
                  "w-4 h-4",
                  creatorFilter !== null ? "text-warning" : "text-foreground-tertiary"
                )} />
                创建人:
              </label>
              <div className="relative">
                <select
                  value={
                    creatorFilter === null
                      ? ''
                      : creatorFilter === 'ME'
                      ? 'ME'
                      : String(creatorFilter)
                  }
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setCreatorFilter(null)
                    } else if (value === 'ME') {
                      setCreatorFilter('ME')
                    } else {
                      const numValue = Number(value)
                      if (!isNaN(numValue)) {
                        setCreatorFilter(numValue)
                      }
                    }
                  }}
                  className={clsx(
                    "px-2 py-1 text-sm border border-border rounded-md bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary max-w-[120px]",
                    creatorFilter !== null ? "text-warning font-medium" : "text-foreground"
                  )}
                >
                  <option value="">全部</option>
                  {currentUserId && (
                    <option value="ME">我</option>
                  )}
                  {members?.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.username || member.user?.username || `用户${member.user_id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* 执行人筛选 */}
            <div data-filter-key="executor" className="flex items-center gap-2 flex-shrink-0">
              <label className={clsx(
                "flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap",
                executorFilter !== null ? "text-warning" : "text-foreground-secondary"
              )}>
                <ExecutorFilterIcon className={clsx(
                  "w-4 h-4",
                  executorFilter !== null ? "text-warning" : "text-foreground-tertiary"
                )} />
                执行人:
              </label>
              <div className="relative">
                <select
                  value={
                    executorFilter === null
                      ? ''
                      : executorFilter === 'ME'
                      ? 'ME'
                      : executorFilter === 'UNASSIGNED'
                      ? 'UNASSIGNED'
                      : String(executorFilter)
                  }
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setExecutorFilter(null)
                    } else if (value === 'ME') {
                      setExecutorFilter('ME')
                    } else if (value === 'UNASSIGNED') {
                      setExecutorFilter('UNASSIGNED')
                    } else {
                      const numValue = Number(value)
                      if (!isNaN(numValue)) {
                        setExecutorFilter(numValue)
                      }
                    }
                  }}
                  className={clsx(
                    "px-2 py-1 text-sm border border-border rounded-md bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary max-w-[120px]",
                    executorFilter !== null ? "text-warning font-medium" : "text-foreground"
                  )}
                >
                  <option value="">全部</option>
                  <option value="UNASSIGNED">未分配</option>
                  {currentUserId && (
                    <option value="ME">我</option>
                  )}
                  {members?.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.username || member.user?.username || `用户${member.user_id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* 标签筛选 */}
            <div data-filter-key="tag" className="flex items-center gap-2 flex-shrink-0">
              <label className={clsx(
                "flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap",
                tagFilter !== null ? "text-warning" : "text-foreground-secondary"
              )}>
                <TagFilterIcon className={clsx(
                  "w-4 h-4",
                  tagFilter !== null ? "text-warning" : "text-foreground-tertiary"
                )} />
                标签:
              </label>
              <div className="relative">
                <select
                  value={tagFilter === null ? '' : String(tagFilter)}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setTagFilter(null)
                    } else {
                      const numValue = Number(value)
                      if (!isNaN(numValue)) {
                        setTagFilter(numValue)
                      }
                    }
                  }}
                  className={clsx(
                    "px-2 py-1 text-sm border border-border rounded-md bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary max-w-[120px]",
                    tagFilter !== null ? "text-warning font-medium" : "text-foreground"
                  )}
                >
                  <option value="">全部</option>
                  {projectTags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* 优先级筛选 */}
            <div data-filter-key="priority" className="flex items-center gap-2 flex-shrink-0">
              <label className={clsx(
                "flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap",
                priorityFilter !== null ? "text-warning" : "text-foreground-secondary"
              )}>
                <PriorityFilterIcon className={clsx(
                  "w-4 h-4",
                  priorityFilter !== null ? "text-warning" : "text-foreground-tertiary"
                )} />
                优先级:
              </label>
              <div className="relative">
                <select
                  value={
                    priorityFilter === null
                      ? ''
                      : priorityFilter === 'ALL'
                      ? 'ALL'
                      : priorityFilter === 'NONE'
                      ? 'NONE'
                      : String(priorityFilter)
                  }
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setPriorityFilter(null)
                    } else if (value === 'ALL') {
                      setPriorityFilter('ALL')
                    } else if (value === 'NONE') {
                      setPriorityFilter('NONE')
                    } else {
                      const numValue = Number(value)
                      if (!isNaN(numValue)) {
                        setPriorityFilter(numValue)
                      }
                    }
                  }}
                  className={clsx(
                    "px-2 py-1 text-sm border border-border rounded-md bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary max-w-[120px]",
                    priorityFilter !== null ? "text-warning font-medium" : "text-foreground"
                  )}
                >
                  <option value="">全部</option>
                  <option value="ALL">有优先级</option>
                  <option value="0">🔴 最高</option>
                  <option value="1">🟠 高</option>
                  <option value="2">🟡 中</option>
                  <option value="3">🟢 低</option>
                  <option value="NONE">无优先级</option>
                </select>
              </div>
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
                >
                  更多
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
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-foreground-secondary">
                          <CreatorFilterIcon className="w-4 h-4 text-gray-500" />
                          创建人:
                        </label>
                        <select
                          value={
                            creatorFilter === null
                              ? ''
                              : creatorFilter === 'ME'
                              ? 'ME'
                              : String(creatorFilter)
                          }
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '') {
                              setCreatorFilter(null)
                            } else if (value === 'ME') {
                              setCreatorFilter('ME')
                            } else {
                              const numValue = Number(value)
                              if (!isNaN(numValue)) {
                                setCreatorFilter(numValue)
                              }
                            }
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="">全部</option>
                          {currentUserId && (
                            <option value="ME">我</option>
                          )}
                          {members?.map((member) => (
                            <option key={member.user_id} value={member.user_id}>
                              {member.username || member.user?.username || `用户${member.user_id}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {hiddenFilters.includes('executor') && (
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-foreground-secondary">
                          <ExecutorFilterIcon className="w-4 h-4 text-gray-500" />
                          执行人:
                        </label>
                        <select
                          value={
                            executorFilter === null
                              ? ''
                              : executorFilter === 'ME'
                              ? 'ME'
                              : executorFilter === 'UNASSIGNED'
                              ? 'UNASSIGNED'
                              : String(executorFilter)
                          }
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '') {
                              setExecutorFilter(null)
                            } else if (value === 'ME') {
                              setExecutorFilter('ME')
                            } else if (value === 'UNASSIGNED') {
                              setExecutorFilter('UNASSIGNED')
                            } else {
                              const numValue = Number(value)
                              if (!isNaN(numValue)) {
                                setExecutorFilter(numValue)
                              }
                            }
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="">全部</option>
                          <option value="UNASSIGNED">未分配</option>
                          {currentUserId && (
                            <option value="ME">我</option>
                          )}
                          {members?.map((member) => (
                            <option key={member.user_id} value={member.user_id}>
                              {member.username || member.user?.username || `用户${member.user_id}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {hiddenFilters.includes('tag') && (
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-foreground-secondary">
                          <TagFilterIcon className="w-4 h-4 text-gray-500" />
                          标签:
                        </label>
                        <select
                          value={tagFilter === null ? '' : String(tagFilter)}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '') {
                              setTagFilter(null)
                            } else {
                              const numValue = Number(value)
                              if (!isNaN(numValue)) {
                                setTagFilter(numValue)
                              }
                            }
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="">全部</option>
                          {projectTags.map((tag) => (
                            <option key={tag.id} value={tag.id}>
                              {tag.displayName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {hiddenFilters.includes('priority') && (
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-foreground-secondary">
                          <PriorityFilterIcon className="w-4 h-4 text-gray-500" />
                          优先级:
                        </label>
                        <select
                          value={
                            priorityFilter === null
                              ? ''
                              : priorityFilter === 'ALL'
                              ? 'ALL'
                              : priorityFilter === 'NONE'
                              ? 'NONE'
                              : String(priorityFilter)
                          }
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '') {
                              setPriorityFilter(null)
                            } else if (value === 'ALL') {
                              setPriorityFilter('ALL')
                            } else if (value === 'NONE') {
                              setPriorityFilter('NONE')
                            } else {
                              const numValue = Number(value)
                              if (!isNaN(numValue)) {
                                setPriorityFilter(numValue)
                              }
                            }
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="">全部</option>
                          <option value="ALL">有优先级</option>
                          <option value="0">🔴 最高</option>
                          <option value="1">🟠 高</option>
                          <option value="2">🟡 中</option>
                          <option value="3">🟢 低</option>
                          <option value="NONE">无优先级</option>
                        </select>
                      </div>
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
            {(statusFilter !== 'ALL' || creatorFilter !== null || executorFilter !== null || tagFilter !== null || priorityFilter !== null || (dateRange && (dateRange.startDate || dateRange.endDate)) || searchQuery.trim()) && (
              <div data-filter-key="reset" className="flex-shrink-0 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('ALL')
                    setCreatorFilter(null)
                    setExecutorFilter(null)
                    setTagFilter(null)
                    setPriorityFilter(null)
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
        
        {!todos || todos.length === 0 ? (
          <EmptyStateView
            title="还没有待办"
            message="创建第一个待办开始工作"
            actionLabel="创建待办"
            onAction={() => setCreateTaskDialogOpen(true)}
          />
        ) : filteredTodos.length === 0 ? (
          <EmptyStateView
            title="没有匹配的待办"
            message={
              statusFilter !== 'ALL' || creatorFilter !== null || executorFilter !== null || tagFilter !== null || priorityFilter !== null
                ? '尝试切换其他筛选条件'
                : '创建第一个待办开始工作'
            }
            actionLabel={
              statusFilter !== 'ALL' || creatorFilter !== null || executorFilter !== null || tagFilter !== null || priorityFilter !== null
                ? undefined
                : '创建待办'
            }
            onAction={
              statusFilter !== 'ALL' || creatorFilter !== null || executorFilter !== null || tagFilter !== null || priorityFilter !== null
                ? undefined
                : () => setShowCreateTaskDialog(true)
            }
          />
        ) : (
          <div>
            {filteredTodos.map((todo) => (
              <TodoTreeItem
                key={todo.id}
                todo={todo}
                projectId={projectId}
                onStatusChange={canChangeStatus(todo) ? handleStatusChange : undefined}
                currentUserId={currentUserId}
                canEdit={canChangeStatus(todo)}
                members={members || []}
                canAssignAssignee={canAssignAssignee(todo)}
                onUpdateAssignee={handleUpdateAssignee}
                canEditPriority={canEditPriority(todo)}
                onUpdatePriority={handleUpdatePriority}
                canEditTags={canEditTags(todo)}
                onUpdateTags={handleUpdateTags}
                currentUserRole={currentUserRole}
                onClick={() => {
                  setSelectedTaskId(String(todo.id))
                  setDrawerOpen(true)
                }}
              />
            ))}
          </div>
        )}
          </div>
        </div>

        {/* 成员列表（占 1/4，宽度减小） */}
        <div className="lg:col-span-1">
          <div className="bg-surface-elevated rounded-lg shadow-md border border-border p-4" style={{ borderColor: 'var(--color-border)' }}>
            <ProjectMemberList
              members={members || []}
              projectId={projectId}
              canAddMember={isOwner || currentUserRole === 'admin'}
              canManage={isOwner || currentUserRole === 'admin'}
              onMemberClick={(member) => {
                // 点击成员时，同时设置创建人和执行人筛选为这个成员（不分角色权限）
                setCreatorFilter(member.user_id)
                setExecutorFilter(member.user_id)
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
            required
            helperText="项目的 Git 仓库地址"
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
      
      {/* 待办详情抽屉 */}
      <Drawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedTaskId(null)
          setTaskHistory([])
        }}
        width="w-full md:w-[600px] lg:w-[700px]"
        showBackButton={taskHistory.length > 0}
        onBack={() => {
          if (taskHistory.length > 0) {
            // 如果有历史记录，返回上一个任务
            const previous = taskHistory[taskHistory.length - 1]
            setTaskHistory(prev => prev.slice(0, -1))
            setSelectedTaskId(previous.taskId)
          }
        }}
      >
        {selectedTaskId && (
          <TaskDetailContent
            projectId={String(projectId)}
            taskId={selectedTaskId}
            showHeader={false}
            parentTaskId={taskHistory.length > 0 ? taskHistory[taskHistory.length - 1].parentTaskId : null}
            onNavigateToSubtask={(subtaskId) => {
              // 获取当前任务的父任务ID
              const currentTask = enrichedTodos?.find(t => t.id.toString() === selectedTaskId)
              const parentTaskId = currentTask?.parentId || null
              
              // 添加到历史记录
              setTaskHistory(prev => [...prev, { taskId: selectedTaskId, projectId: String(projectId), parentTaskId }])
              
              // 导航到子待办
              setSelectedTaskId(String(subtaskId))
            }}
            onClose={() => {
              // 关闭抽屉（回退逻辑已在 Drawer 的 onBack 中处理）
              setDrawerOpen(false)
              setSelectedTaskId(null)
            }}
            onDelete={() => {
              setDrawerOpen(false)
              setSelectedTaskId(null)
              setTaskHistory([])
              refetchTodos()
            }}
          />
        )}
      </Drawer>
      
      {/* 创建待办对话框 */}
      <CreateTaskDialog
        open={showCreateTaskDialog}
        onClose={() => setShowCreateTaskDialog(false)}
        projectId={String(projectId)}
        onSuccess={() => {
          setShowCreateTaskDialog(false)
          refetchTodos()
        }}
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
          showScrollTop 
            ? 'opacity-100 translate-y-0 pointer-events-auto visible' 
            : 'opacity-0 translate-y-4 pointer-events-none invisible'
        )}
        aria-label="回到顶部"
        tabIndex={showScrollTop ? 0 : -1}
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
        'bg-surface-elevated rounded-lg shadow-md p-3 md:p-4 cursor-pointer transition-all',
        {
          'ring-2 ring-primary-500 shadow-lg': isActive,
          'ring-2 ring-transparent': !isActive, // 使用 ring 而不是 border，避免被 overflow 裁切
          'hover:shadow-md': !isActive,
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
}

function IconButton({ icon, label, onClick, variant = 'secondary', isActive = false, disabled = false, iconBgColor, iconColor }: IconButtonProps) {
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
      <span className="hidden sm:inline text-sm font-medium">{label}</span>
      
      {/* Tooltip - 移动端显示，在按钮下方 */}
      <div className="sm:hidden absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
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

