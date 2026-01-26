
/**
 * 我的待办页面
 * 显示当前用户分配的所有待办（跨项目）
 */

import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button, LoadingView, ErrorView, EmptyStateView, Drawer } from '@/components/ui'
import { TodoTreeItem, TaskDetailContent } from '@/components/features'
import { useProjectList } from '@/hooks/useProjects'
import { tasksApi } from '@/lib/api/endpoints/tasks'
import { projectsApi } from '@/lib/api/endpoints/projects'
import { tasksToTodos } from '@/lib/utils/taskMapper'
import { buildTaskTree } from '@/lib/utils/taskTree'
import { enrichTodosWithMembers } from '@/lib/utils/enrichTodosWithMembers'
import { useAuthStore } from '@/store/authStore'
import { useTagStore } from '@/store/tagStore'
import { parseTaskTags } from '@/lib/utils/tagUtils'
import { saveTaskFilterState, loadTaskFilterState, type DateRange } from '@/lib/utils/filterStorage'
import { DateRangeFilter } from '@/components/features/DateRangeFilter'
import type { Todo, TodoStatus, ProjectMember } from '@/types'
import clsx from 'clsx'

export default function MyTasksPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [taskHistory, setTaskHistory] = useState<Array<{ taskId: string; projectId: string; parentTaskId?: number | null }>>([]) // 任务导航历史
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false)
  const [createTaskProjectId, setCreateTaskProjectId] = useState<string | null>(null)
  const [createTaskParentId, setCreateTaskParentId] = useState<number | undefined>(undefined)
  
  // 回到顶部
  const scrollToTop = () => {
    const main = document.querySelector('main') as HTMLElement
    if (main && main.scrollHeight > main.clientHeight) {
      main.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  const { data: projects, isLoading: projectsLoading, error: projectsError, refetch: refetchProjects } = useProjectList()
  
  const [myTasks, setMyTasks] = useState<Array<Omit<Todo, 'projectId'> & { projectId: string; projectName: string }>>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState<Error | null>(null)
  
  // 从本地存储恢复筛选条件
  const savedFilters = loadTaskFilterState()
  
  // 筛选器状态（初始值从本地存储恢复）
  const [statusFilter, setStatusFilter] = useState<TodoStatus | 'ALL'>(
    (savedFilters?.statusFilter as TodoStatus | 'ALL') || 'ALL'
  )
  const [creatorFilter, setCreatorFilter] = useState<number | 'ME' | null>(
    savedFilters?.creatorFilter ?? null
  )
  const [executorFilter, setExecutorFilter] = useState<number | 'ME' | 'UNASSIGNED' | null>(
    savedFilters?.executorFilter ?? null
  )
  const [tagFilter, setTagFilter] = useState<{ projectId: string; tagId: number } | null>(
    (savedFilters?.tagFilter as { projectId: string; tagId: number } | null) ?? null
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
  
  // 筛选器"更多"菜单状态
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const moreFiltersRef = useRef<HTMLDivElement>(null)
  const moreFiltersMenuRef = useRef<HTMLDivElement>(null)
  const filterContainerRef = useRef<HTMLDivElement>(null)
  const [visibleFilters, setVisibleFilters] = useState<string[]>(['status', 'creator', 'executor', 'tag', 'priority', 'dateRange'])
  const [hiddenFilters, setHiddenFilters] = useState<string[]>([])
  const [moreFiltersPosition, setMoreFiltersPosition] = useState<{ top: number; left: number } | null>(null)
  const searchBarRef = useRef<HTMLDivElement>(null)
  
  // 当筛选条件改变时保存到本地存储
  useEffect(() => {
    saveTaskFilterState({
      statusFilter,
      creatorFilter,
      executorFilter,
      tagFilter,
      priorityFilter,
      dateRange,
    })
  }, [statusFilter, creatorFilter, executorFilter, tagFilter, priorityFilter, dateRange])
  
  // 所有项目的成员和标签信息
  const [allMembers, setAllMembers] = useState<Map<string, Array<{ user_id: number; username: string }>>>(new Map())
  // 存储完整的项目成员信息（包括角色）
  const [projectMembersMap, setProjectMembersMap] = useState<Map<string, ProjectMember[]>>(new Map())
  const queryClient = useQueryClient()
  const { loadProjectTags, getProjectTags } = useTagStore()
  
  // 获取所有项目的任务、成员和标签
  useEffect(() => {
    if (!projects || !user || projectsLoading) return
    
    const fetchAllTasks = async () => {
      setTasksLoading(true)
      setTasksError(null)
      
      try {
        const allTasks: Array<Omit<Todo, 'projectId'> & { projectId: string; projectName: string }> = []
        const membersMap = new Map<string, Array<{ user_id: number; username: string }>>()
        const fullMembersMap = new Map<string, ProjectMember[]>()
        
        // 并发获取所有项目的待办、成员和标签
        const taskPromises = projects.map(async (project) => {
          try {
            // 获取待办列表
            const tasks = await tasksApi.listByProject(project.id.toString())
            let todos = tasksToTodos(tasks)
            
            // 获取项目成员列表
            const members = await projectsApi.getMembers(project.id.toString())
            
            // 使用成员信息丰富待办项的用户信息（创建人和执行人）
            todos = enrichTodosWithMembers(todos, members)
            
            // 存储成员信息（用于筛选）
            const memberList = members
              .filter(m => m.user_id && m.username)
              .map(m => ({
                user_id: m.user_id!,
                username: m.username!,
              }))
            membersMap.set(project.id.toString(), memberList)
            
            // 存储完整的成员信息（包括角色）
            fullMembersMap.set(project.id.toString(), members)
            
            // 加载项目标签
            try {
              await loadProjectTags(project.id.toString())
            } catch (err) {
              console.warn(`⚠️ 加载项目 ${project.id} 的标签失败:`, err)
            }
            
            // 创建 user_id -> username 的映射
            const userIdToUsername = new Map<number, string>()
            members.forEach(member => {
              if (member.user_id && member.username) {
                userIdToUsername.set(member.user_id, member.username)
              }
            })
            
            // 筛选出分配给当前用户的待办（或者是当前用户创建的待办）
            const userTasks = todos
              .filter(todo => {
                // 获取待办创建者和执行者的 username
                const creatorUsername = todo.creator?.username || (todo.creatorId ? userIdToUsername.get(todo.creatorId) : undefined)
                const executorUsername = todo.assignee?.username || (todo.assigneeId ? userIdToUsername.get(todo.assigneeId) : undefined)
                
                // 检查是否是当前用户创建或被分配的待办
                const isCreator = creatorUsername === user.username
                const isAssignee = executorUsername === user.username
                
                return isCreator || isAssignee
              })
              .map(todo => ({
                ...todo,
                projectId: project.id.toString(), // 转换为 string 类型
                projectName: project.name,
              }))
            
            return userTasks
          } catch (err) {
            console.error(`❌ 获取项目 ${project.id} 的待办失败:`, err)
            return []
          }
        })
        
        const results = await Promise.all(taskPromises)
        const flattened = results.flat()
        setMyTasks(flattened)
        setAllMembers(membersMap)
        setProjectMembersMap(fullMembersMap)
      } catch (err) {
        console.error('❌ 获取待办列表失败:', err)
        setTasksError(err as Error)
      } finally {
        setTasksLoading(false)
      }
    }
    
    fetchAllTasks()
  }, [projects, user, projectsLoading, loadProjectTags])
  
  const allTasksLoading = projectsLoading || tasksLoading
  const allTasksError = projectsError || tasksError
  
  // 获取当前用户的 user_id（从所有成员中查找）
  const currentUserId = useMemo(() => {
    if (!user?.username || allMembers.size === 0) return null
    for (const members of allMembers.values()) {
      const member = members.find(m => m.username === user.username)
      if (member) {
        return member.user_id
      }
    }
    return null
  }, [user?.username, allMembers])
  
  // 合并所有项目的成员列表（去重）
  const allMembersList = useMemo(() => {
    const memberMap = new Map<number, { user_id: number; username: string }>()
    allMembers.forEach(members => {
      members.forEach(member => {
        if (!memberMap.has(member.user_id)) {
          memberMap.set(member.user_id, member)
        }
      })
    })
    return Array.from(memberMap.values())
  }, [allMembers])
  
  // 合并所有项目的标签列表（按项目分组）
  const allTagsByProject = useMemo(() => {
    if (!projects) return new Map<string, ReturnType<typeof getProjectTags>>()
    const tagsMap = new Map<string, ReturnType<typeof getProjectTags>>()
    projects.forEach(project => {
      const tags = getProjectTags(project.id.toString())
      if (tags.length > 0) {
        tagsMap.set(project.id.toString(), tags)
      }
    })
    return tagsMap
  }, [projects, getProjectTags])
  
  // 验证并修复筛选条件（数据加载完成后）
  useEffect(() => {
    // 如果还在加载中，不进行验证
    if (allTasksLoading) return
    
    let needUpdate = false
    const updates: Partial<{
      creatorFilter: number | 'ME' | null
      executorFilter: number | 'ME' | 'UNASSIGNED' | null
      tagFilter: { projectId: string; tagId: number } | null
    }> = {}
    
    // 验证创建人筛选
    if (creatorFilter !== null && creatorFilter !== 'ME') {
      // 如果成员列表为空，或者该成员不存在，重置为 null
      if (allMembersList.length === 0 || !allMembersList.some(m => m.user_id === creatorFilter)) {
        updates.creatorFilter = null
        needUpdate = true
      }
    }
    
    // 验证执行人筛选
    if (executorFilter !== null && executorFilter !== 'ME' && executorFilter !== 'UNASSIGNED') {
      // 如果成员列表为空，或者该成员不存在，重置为 null
      if (allMembersList.length === 0 || !allMembersList.some(m => m.user_id === executorFilter)) {
        updates.executorFilter = null
        needUpdate = true
      }
    }
    
    // 验证标签筛选
    if (tagFilter !== null) {
      const projectTags = allTagsByProject.get(tagFilter.projectId)
      // 如果项目不存在，或者项目没有标签，或者该标签不存在，重置为 null
      if (!projectTags || projectTags.length === 0 || !projectTags.some(t => t.id === tagFilter.tagId)) {
        updates.tagFilter = null
        needUpdate = true
      }
    }
    
    // 应用修复（静默处理，不报错）
    if (needUpdate) {
      if (updates.creatorFilter !== undefined) setCreatorFilter(updates.creatorFilter)
      if (updates.executorFilter !== undefined) setExecutorFilter(updates.executorFilter)
      if (updates.tagFilter !== undefined) setTagFilter(updates.tagFilter)
    }
  }, [allTasksLoading, allMembersList, allTagsByProject, creatorFilter, executorFilter, tagFilter])
  
  // 筛选后的待办列表
  const filteredTasks = useMemo(() => {
    if (!myTasks.length) return []
    
    return myTasks.filter(task => {
      // 状态筛选
      const statusMatch = statusFilter === 'ALL' || task.status === statusFilter
      
      // 创建人筛选
      let creatorMatch = true
      if (creatorFilter !== null) {
        if (creatorFilter === 'ME') {
          creatorMatch = task.creatorId === currentUserId
        } else {
          creatorMatch = task.creatorId === creatorFilter
        }
      }
      
      // 执行人筛选
      let executorMatch = true
      if (executorFilter !== null) {
        if (executorFilter === 'ME') {
          executorMatch = task.assigneeId === currentUserId
        } else if (executorFilter === 'UNASSIGNED') {
          executorMatch = task.assigneeId === undefined || task.assigneeId === null
        } else {
          executorMatch = task.assigneeId === executorFilter
        }
      }
      
      // 标签筛选（需要指定项目和标签ID）
      let tagMatch = true
      if (tagFilter !== null) {
        if (tagFilter.projectId === task.projectId) {
          const taskTagIds = parseTaskTags(task.tags)
          tagMatch = taskTagIds.includes(tagFilter.tagId)
        } else {
          // 不同项目的任务，标签筛选不匹配
          tagMatch = false
        }
      }
      
      // 优先级筛选
      let priorityMatch = true
      if (priorityFilter !== null) {
        if (priorityFilter === 'ALL') {
          priorityMatch = task.priority !== null && task.priority !== undefined
        } else if (priorityFilter === 'NONE') {
          priorityMatch = task.priority === null || task.priority === undefined
        } else {
          priorityMatch = task.priority === priorityFilter
        }
      }
      
      // 日期范围筛选（基于创建时间）
      let dateMatch = true
      if (dateRange && (dateRange.startDate || dateRange.endDate)) {
        const taskDate = new Date(task.createdAt)
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
        const content = (task.content || '').toLowerCase()
        const title = (task.title || '').toLowerCase()
        
        // 检查内容或标题匹配
        let contentMatch = content.includes(query) || title.includes(query)
        
        // 检查创建人用户名匹配
        let creatorNameMatch = false
        if (allMembersList.length > 0) {
          const creatorMember = allMembersList.find(m => m.user_id === task.creatorId)
          if (creatorMember) {
            const creatorName = (creatorMember.username || '').toLowerCase()
            creatorNameMatch = creatorName.includes(query)
          }
        }
        
        // 检查执行人用户名匹配
        let executorNameMatch = false
        if (allMembersList.length > 0 && task.assigneeId) {
          const executorMember = allMembersList.find(m => m.user_id === task.assigneeId)
          if (executorMember) {
            const executorName = (executorMember.username || '').toLowerCase()
            executorNameMatch = executorName.includes(query)
          }
        }
        
        searchMatch = contentMatch || creatorNameMatch || executorNameMatch
      }
      
      return statusMatch && creatorMatch && executorMatch && tagMatch && priorityMatch && dateMatch && searchMatch
    })
  }, [myTasks, statusFilter, creatorFilter, executorFilter, tagFilter, priorityFilter, dateRange, searchQuery, currentUserId, allMembersList])
  
  // 按项目分组并构建树形结构
  const tasksByProject = useMemo(() => {
    const grouped = new Map<string, typeof filteredTasks>()
    filteredTasks.forEach(task => {
      if (!grouped.has(task.projectId)) {
        grouped.set(task.projectId, [])
      }
      grouped.get(task.projectId)!.push(task)
    })
    
    // 为每个项目的任务构建树形结构
    const treeMap = new Map<string, Todo[]>()
    grouped.forEach((tasks, projectId) => {
      // 转换为完整的 Todo 类型（包含 projectId 作为 number）
      const fullTasks: Todo[] = tasks.map(task => ({
        ...task,
        projectId: parseInt(task.projectId),
      }))
      // 构建树形结构
      const tree = buildTaskTree(fullTasks)
      treeMap.set(projectId, tree)
    })
    
    return { grouped, treeMap }
  }, [filteredTasks])

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
          const html = document.documentElement
          const body = document.body
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
  }, [myTasks, filteredTasks]) // 当数据加载完成后重新绑定

  // 折叠状态管理（每个项目组）
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const initializedRef = useRef(false)
  
  // 初始化时展开所有项目组
  useEffect(() => {
    const projectIds = Array.from(tasksByProject.grouped.keys())
    if (projectIds.length > 0 && !initializedRef.current) {
      setExpandedProjects(new Set(projectIds))
      initializedRef.current = true
    }
  }, [tasksByProject])
  
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

  // 点击外部关闭更多菜单和搜索框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      try {
        if (moreFiltersRef.current && !moreFiltersRef.current.contains(event.target as Node) &&
            moreFiltersMenuRef.current && !moreFiltersMenuRef.current.contains(event.target as Node)) {
          setShowMoreFilters(false)
        }
        // 点击外部关闭搜索框
        if (showSearchBar && searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
          setShowSearchBar(false)
        }
      } catch (error) {
        // 忽略扩展相关的错误
        console.warn('点击外部处理错误（可能是浏览器扩展问题）:', error)
      }
    }
    
    if (showMoreFilters || showSearchBar) {
      // 使用捕获阶段，避免被扩展拦截
      document.addEventListener('mousedown', handleClickOutside, true)
      // 也监听 click 事件作为备用
      document.addEventListener('click', handleClickOutside, true)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true)
      document.removeEventListener('click', handleClickOutside, true)
    }
  }, [showMoreFilters, showSearchBar])

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

      // 获取"重置"按钮的宽度（如果存在）
      const resetButton = children.find(child => child.dataset.filterKey === 'reset')
      const resetButtonWidth = resetButton ? resetButton.offsetWidth + 16 : 0 // 16px gap
      
      // 按顺序计算哪些筛选器可以显示
      const filterOrder = ['status', 'creator', 'executor', 'tag', 'priority', 'dateRange']
      let totalWidth = 0
      const filterKeys: string[] = []
      
      // 预留"更多"按钮的空间（约80px，如果后续有隐藏的筛选器）
      const moreButtonWidth = 80 + 16 // 16px gap
      
      for (const filterKey of filterOrder) {
        const child = children.find(c => c.dataset.filterKey === filterKey) as HTMLElement
        if (!child) continue
        
        const width = child.offsetWidth + 16 // 16px gap
        
        // 检查是否还有更多筛选器需要隐藏
        const remainingFilters = filterOrder.slice(filterOrder.indexOf(filterKey) + 1)
        const needsMoreButton = remainingFilters.length > 0
        
        // 计算需要的总宽度
        const neededWidth = totalWidth + width + resetButtonWidth + (needsMoreButton ? moreButtonWidth : 0)
        
        if (neededWidth <= containerWidth) {
          totalWidth += width
          filterKeys.push(filterKey)
        } else {
          break
        }
      }

      // 设置可见和隐藏的筛选器
      const allFilterKeys = ['status', 'creator', 'executor', 'tag', 'priority', 'dateRange']
      setVisibleFilters(filterKeys)
      setHiddenFilters(allFilterKeys.filter(key => !filterKeys.includes(key)))
      
      // 隐藏超出容器的筛选器
      children.forEach((child) => {
        if (child.dataset.filterKey && child.dataset.filterKey !== 'reset' && child.dataset.filterKey !== 'more') {
          if (!filterKeys.includes(child.dataset.filterKey)) {
            child.style.display = 'none'
          }
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
  }, [statusFilter, creatorFilter, executorFilter, tagFilter, priorityFilter, dateRange, allMembersList, allTagsByProject, projects])

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      
      if (next.has(projectId)) {
        // 折叠项目组
        next.delete(projectId)
      } else {
        // 展开项目组
        next.add(projectId)
      }
      return next
    })
  }
  
  const handleProjectNameClick = (projectId: string) => {
    navigate(`/projects/${projectId}`)
  }
  
  const handleAddTaskClick = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation() // 阻止事件冒泡，避免触发项目名称点击
    setCreateTaskProjectId(projectId)
    setCreateTaskParentId(undefined)
    setCreateTaskDialogOpen(true)
  }
  
  const handleCreateTaskSuccess = (taskId: number) => {
    // 创建成功后刷新待办列表
    queryClient.invalidateQueries({ queryKey: ['projects'] })
    // 可以选择打开新创建的待办详情
    // setSelectedTaskId(String(taskId))
    // setSelectedProjectId(createTaskProjectId)
    // setDrawerOpen(true)
  }
  
  // 获取用户在项目中的角色
  const getUserRoleInProject = useCallback((projectId: string): 'owner' | 'admin' | 'member' | null => {
    if (!user?.username) return null
    const members = projectMembersMap.get(projectId)
    if (!members) return null
    
    const currentMember = members.find(m => 
      (m.username === user.username) || (m.user?.username === user.username) || (m.is_me === true)
    )
    
    if (currentMember) {
      return currentMember.role
    }
    
    // 如果成员列表中没有找到，检查是否是项目创建者
    const project = projects?.find(p => p.id.toString() === projectId)
    if (project?.creator?.username === user.username) {
      return 'owner'
    }
    
    return null
  }, [user?.username, projectMembersMap, projects])
  
  // 判断是否可以分配执行人（owner/admin/创建人）
  const canAssignAssignee = useCallback((todo: any, projectId: string) => {
    if (!currentUserId) return false
    
    const userRole = getUserRoleInProject(projectId)
    
    // owner 或 admin 可以分配任意任务的执行人
    if (userRole === 'owner' || userRole === 'admin') {
      return true
    }
    
    // 创建人可以分配自己创建的任务的执行人
    return todo.creatorId === currentUserId
  }, [currentUserId, getUserRoleInProject])
  
  // 判断是否可以编辑优先级（owner/admin/创建人）
  const canEditPriority = useCallback((todo: any, projectId: string) => {
    if (!currentUserId) return false
    
    const userRole = getUserRoleInProject(projectId)
    
    // owner 或 admin 可以编辑任意任务的优先级
    if (userRole === 'owner' || userRole === 'admin') {
      return true
    }
    
    // 创建人可以编辑自己创建的任务的优先级
    return todo.creatorId === currentUserId
  }, [currentUserId, getUserRoleInProject])

  const canEditTags = useCallback((todo: any, projectId: string) => {
    if (!currentUserId) return false
    
    const userRole = getUserRoleInProject(projectId)
    
    // owner 或 admin 可以编辑任意任务的标签
    if (userRole === 'owner' || userRole === 'admin') {
      return true
    }
    
    // 创建人可以编辑自己创建的任务的标签
    return todo.creatorId === currentUserId
  }, [currentUserId, getUserRoleInProject])
  
  // 判断是否可以编辑任务（owner/admin 可以修改任意任务，member 只能修改自己创建或分配给自己执行的任务）
  const canEditTask = useCallback((todo: any, projectId: string) => {
    if (!currentUserId) return false
    
    const userRole = getUserRoleInProject(projectId)
    
    // owner 或 admin 可以修改任意任务
    if (userRole === 'owner' || userRole === 'admin') {
      return true
    }
    
    // member 只能修改自己创建或分配给自己执行的任务
    return todo.creatorId === currentUserId || todo.assigneeId === currentUserId
  }, [currentUserId, getUserRoleInProject])
  
  // 判断是否可以修改状态
  // 当状态为"进行中"时，只有执行人、管理员、owner可以修改
  // 非"进行中"的任何角色都可以修改
  const canChangeStatus = useCallback((todo: any, projectId: string) => {
    if (!currentUserId) return false
    
    const userRole = getUserRoleInProject(projectId)
    
    // 如果状态是"进行中"，需要特殊权限检查
    if (todo.status === 'IN_PROGRESS') {
      // 只有执行人、管理员、owner可以修改
      return todo.assigneeId === currentUserId || userRole === 'admin' || userRole === 'owner'
    }
    
    // 非"进行中"状态，任何角色都可以修改（但需要基本的编辑权限）
    return canEditTask(todo, projectId)
  }, [currentUserId, getUserRoleInProject, canEditTask])
  
  // 处理状态更改
  const handleStatusChange = useCallback(async (taskId: number, newStatus: TodoStatus, projectId: string) => {
    // 查找对应的任务
    const task = myTasks.find(t => t.id === taskId && t.projectId === projectId)
    if (!task) {
      console.error('找不到对应的任务')
      return
    }
    
    // 权限检查：如果当前状态是"进行中"，需要验证权限
    if (task.status === 'IN_PROGRESS' && !canChangeStatus(task, projectId)) {
      console.error('只有执行人、管理员或所有者可以修改"进行中"状态的任务')
      return
    }
    
    try {
      // 直接调用 API 更新状态
      await tasksApi.update(projectId, String(taskId), { status: newStatus })
      // 刷新对应项目的任务列表
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] })
      // 更新本地状态
      setMyTasks(prev => prev.map(task => 
        task.id === taskId && task.projectId === projectId
          ? { ...task, status: newStatus }
          : task
      ))
    } catch (error) {
      console.error('更新任务状态失败:', error)
    }
  }, [queryClient, myTasks, canChangeStatus])
  
  // 处理更新执行人
  const handleUpdateAssignee = useCallback(async (taskId: number, assigneeId: number | null, projectId: string) => {
    await tasksApi.update(projectId, String(taskId), { assigneeId: assigneeId || undefined })
    // 刷新对应项目的任务列表
    queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] })
    // 由于数据是在useEffect中手动获取的，需要手动更新本地状态
    // 更新对应任务的执行人信息
    setMyTasks(prev => prev.map(task => {
      if (task.id === taskId && task.projectId === projectId) {
        // 从项目成员中查找新的执行人信息
        const members = projectMembersMap.get(projectId) || []
        const newAssignee = assigneeId ? members.find(m => m.user_id === assigneeId) : null
        return {
          ...task,
          assigneeId: assigneeId || undefined,
          assignee: newAssignee ? {
            username: newAssignee.username || newAssignee.user?.username || '未知用户',
            avatar: newAssignee.avatar || newAssignee.user?.avatar
          } : undefined
        }
      }
      return task
    }))
  }, [queryClient, projectMembersMap])
  
  // 处理更新优先级
  const handleUpdatePriority = useCallback(async (taskId: number, priority: number | null, projectId: string) => {
    await tasksApi.update(projectId, String(taskId), { priority: priority !== null ? priority : undefined })
    // 刷新对应项目的任务列表
    queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] })
    // 更新本地状态
    setMyTasks(prev => prev.map(task => 
      task.id === taskId && task.projectId === projectId
        ? { ...task, priority: priority !== null ? priority : undefined }
        : task
    ))
  }, [queryClient])

  // 处理更新标签
  const handleUpdateTags = useCallback(async (taskId: number, tagsString: string, projectId: string) => {
    await tasksApi.update(projectId, String(taskId), { tags: tagsString })
    // 刷新对应项目的任务列表
    queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] })
    // 更新本地状态
    setMyTasks(prev => prev.map(task => 
      task.id === taskId && task.projectId === projectId
        ? { ...task, tags: tagsString }
        : task
    ))
  }, [queryClient])
  
  // 加载状态
  if (allTasksLoading) {
    return <LoadingView size="lg" text="加载待办列表..." />
  }
  
  // 错误状态
  if (allTasksError) {
    return (
      <ErrorView
        title="加载失败"
        message={allTasksError instanceof Error ? allTasksError.message : '无法获取待办列表，请稍后重试'}
        onRetry={() => window.location.reload()}
      />
    )
  }
  
  // 空状态（需要等待加载完成）
  if (!allTasksLoading && myTasks.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">我的待办</h1>
          <p className="mt-2 text-foreground-secondary">查看分配给您的待办</p>
        </div>
        
          <EmptyStateView
            title="还没有待办"
            message="您目前没有被分配的待办"
            actionLabel="查看项目"
            onAction={() => navigate('/projects')}
          />
      </div>
    )
  }
  
  return (
    <div className="space-y-4 md:space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">我的待办</h1>
          <p className="mt-1 md:mt-2 text-sm md:text-base text-foreground-secondary">
            共 {filteredTasks.length} 个待办
          </p>
        </div>
        
        {/* 搜索区域 - 搜索按钮和搜索框共用位置 */}
        <div className="relative flex items-center" ref={searchBarRef}>
          {/* 搜索按钮 - 搜索框显示时隐藏 */}
          <div className={clsx(
            "transition-all duration-300 ease-in-out",
            showSearchBar ? "opacity-0 scale-0 pointer-events-none absolute" : "opacity-100 scale-100"
          )}>
            <button
              onClick={() => {
                setShowSearchBar(true)
              }}
              className="p-2 rounded-md hover:bg-surface-hover transition-colors text-foreground-secondary hover:text-foreground"
              title="搜索"
            >
              <SearchIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* 搜索栏 - 从搜索按钮位置向左展开 */}
          <div className={clsx(
            "absolute right-0 transition-all duration-300 ease-in-out flex items-center",
            showSearchBar 
              ? "opacity-100 translate-x-0 pointer-events-auto" 
              : "opacity-0 translate-x-4 pointer-events-none"
          )}>
            <div className={clsx(
              "flex items-center bg-surface-elevated border border-border rounded-md shadow-sm overflow-hidden transition-all duration-300 ease-in-out h-[40px]",
              showSearchBar ? "w-[320px]" : "w-0"
            )}>
              <div className="flex items-center px-3 py-2 flex-shrink-0">
                <SearchIcon className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索待办内容..."
                className="flex-1 px-2 py-2 text-sm focus:outline-none focus:ring-0 border-0 bg-transparent min-w-0 h-full"
                autoFocus={showSearchBar}
              />
              {/* X按钮 - 有内容时清除内容，无内容时关闭搜索框 */}
              <button
                onClick={() => {
                  if (searchQuery) {
                    setSearchQuery('')
                  } else {
                    setShowSearchBar(false)
                  }
                }}
                className="p-1.5 rounded-md hover:bg-surface-hover transition-colors text-foreground-secondary hover:text-foreground mr-1 flex-shrink-0"
                title={searchQuery ? "清除搜索" : "关闭搜索"}
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 待办列表 - 使用和项目详情页相同的样式 */}
      <div className="bg-surface-elevated rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">待办列表</h2>
          
          {/* 全部折叠/展开按钮 */}
          {filteredTasks.length > 0 && (() => {
            const allProjectIds = Array.from(tasksByProject.grouped.keys())
            const allExpanded = allProjectIds.length > 0 && allProjectIds.every(id => expandedProjects.has(id))
            
            return (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (allExpanded) {
                    // 全部折叠
                    setExpandedProjects(new Set())
                  } else {
                    // 全部展开
                    setExpandedProjects(new Set(allProjectIds))
                  }
                }}
              >
                {allExpanded ? (
                  <>
                    <CollapseAllIcon className="w-4 h-4 mr-1" />
                    全部折叠
                  </>
                ) : (
                  <>
                    <ExpandAllIcon className="w-4 h-4 mr-1" />
                    全部展开
                  </>
                )}
              </Button>
            )
          })()}
        </div>
        
        {/* 筛选器 */}
        <div className="mb-4">
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
                  {allMembersList.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* 执行人筛选 */}
            <div data-filter-key="executor" className="flex items-center gap-2 flex-shrink-0">
              <label className={clsx(
                "flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap",
                executorFilter !== null ? "text-orange-600" : "text-gray-600"
              )}>
                <ExecutorFilterIcon className={clsx(
                  "w-4 h-4",
                  executorFilter !== null ? "text-orange-500" : "text-gray-500"
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
                  {allMembersList.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* 标签筛选 */}
            <div data-filter-key="tag" className="flex items-center gap-2 flex-shrink-0">
              <label className={clsx(
                "flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap",
                tagFilter !== null ? "text-orange-600" : "text-gray-600"
              )}>
                <TagFilterIcon className={clsx(
                  "w-4 h-4",
                  tagFilter !== null ? "text-orange-500" : "text-gray-500"
                )} />
                标签:
              </label>
              <div className="relative">
                <select
                  value={
                    tagFilter === null
                      ? ''
                      : `${tagFilter.projectId}-${tagFilter.tagId}`
                  }
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setTagFilter(null)
                    } else {
                      const [projectId, tagIdStr] = value.split('-')
                      const tagId = Number(tagIdStr)
                      if (!isNaN(tagId)) {
                        setTagFilter({ projectId, tagId })
                      }
                    }
                  }}
                  className={clsx(
                    "px-2 py-1 text-sm border border-border rounded-md bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary max-w-[120px]",
                    tagFilter !== null ? "text-warning font-medium" : "text-foreground"
                  )}
                >
                  <option value="">全部</option>
                  {Array.from(allTagsByProject.entries()).map(([projectId, tags]) => {
                    const projectName = projects?.find(p => p.id.toString() === projectId)?.name || '未知项目'
                    return (
                      <optgroup key={projectId} label={`${projectName}的标签`}>
                        {tags.map((tag) => (
                          <option key={`${projectId}-${tag.id}`} value={`${projectId}-${tag.id}`}>
                            {tag.displayName}
                          </option>
                        ))}
                      </optgroup>
                    )
                  })}
                </select>
              </div>
            </div>
            
            {/* 优先级筛选 */}
            <div data-filter-key="priority" className="flex items-center gap-2 flex-shrink-0">
              <label className={clsx(
                "flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap",
                priorityFilter !== null ? "text-orange-600" : "text-gray-600"
              )}>
                <PriorityFilterIcon className={clsx(
                  "w-4 h-4",
                  priorityFilter !== null ? "text-orange-500" : "text-gray-500"
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
            {hiddenFilters.length > 0 && (
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
                    style={{ backgroundColor: 'var(--color-surface-elevated)' }} 
                    style={{ 
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
                          className="flex-1 px-2 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="">全部</option>
                          {currentUserId && (
                            <option value="ME">我</option>
                          )}
                          {allMembersList.map((member) => (
                            <option key={member.user_id} value={member.user_id}>
                              {member.username}
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
                          className="flex-1 px-2 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="">全部</option>
                          <option value="UNASSIGNED">未分配</option>
                          {currentUserId && (
                            <option value="ME">我</option>
                          )}
                          {allMembersList.map((member) => (
                            <option key={member.user_id} value={member.user_id}>
                              {member.username}
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
                          value={
                            tagFilter === null
                              ? ''
                              : `${tagFilter.projectId}-${tagFilter.tagId}`
                          }
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '') {
                              setTagFilter(null)
                            } else {
                              const [projectId, tagIdStr] = value.split('-')
                              const tagId = Number(tagIdStr)
                              if (!isNaN(tagId)) {
                                setTagFilter({ projectId, tagId })
                              }
                            }
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="">全部</option>
                          {Array.from(allTagsByProject.entries()).map(([projectId, tags]) => {
                            const projectName = projects?.find(p => p.id.toString() === projectId)?.name || '未知项目'
                            return (
                              <optgroup key={projectId} label={`${projectName}的标签`}>
                                {tags.map((tag) => (
                                  <option key={`${projectId}-${tag.id}`} value={`${projectId}-${tag.id}`}>
                                    {tag.displayName}
                                  </option>
                                ))}
                              </optgroup>
                            )
                          })}
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
                          className="flex-1 px-2 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
                  </div>,
                  document.body
                )}
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
        
        {/* 空状态 */}
        {filteredTasks.length === 0 && (
          <EmptyStateView
            title={myTasks.length === 0 ? "还没有待办" : "没有匹配的待办"}
            message={
              myTasks.length === 0
                ? "您目前没有被分配的待办"
                : statusFilter !== 'ALL' || creatorFilter !== null || executorFilter !== null || tagFilter !== null || priorityFilter !== null || (dateRange && (dateRange.startDate || dateRange.endDate)) || searchQuery.trim()
                ? '尝试切换其他筛选条件'
                : '创建第一个待办开始工作'
            }
            actionLabel={
              myTasks.length === 0
                ? '查看项目'
                : statusFilter !== 'ALL' || creatorFilter !== null || executorFilter !== null || tagFilter !== null || priorityFilter !== null || (dateRange && (dateRange.startDate || dateRange.endDate)) || searchQuery.trim()
                ? undefined
                : '创建待办'
            }
            onAction={
              myTasks.length === 0
                ? () => navigate('/projects')
                : statusFilter !== 'ALL' || creatorFilter !== null || executorFilter !== null || tagFilter !== null || priorityFilter !== null || (dateRange && (dateRange.startDate || dateRange.endDate)) || searchQuery.trim()
                ? undefined
                : () => navigate('/projects')
            }
          />
        )}
      
        {/* 待办列表（按项目分组） */}
        {filteredTasks.length > 0 && (
          <div className="space-y-6">
            {Array.from(tasksByProject.grouped.entries()).map(([projectId, tasks]) => {
              const isExpanded = expandedProjects.has(projectId)
              const taskTree = tasksByProject.treeMap.get(projectId) || []
              
              return (
                <div key={projectId}>
                  {/* 项目头部 - 可点击折叠/展开 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* 折叠/展开按钮 */}
                      <button
                        onClick={() => toggleProject(projectId)}
                        className="flex-shrink-0 p-1 rounded transition-colors hover:bg-gray-100 cursor-pointer"
                        aria-label={isExpanded ? '折叠' : '展开'}
                        title={isExpanded ? '点击折叠' : '点击展开'}
                      >
                        <ChevronIcon isExpanded={isExpanded} disabled={false} />
                      </button>
                      
                      {/* 项目名称 - 可点击进入项目详情 */}
                      <button
                        onClick={() => handleProjectNameClick(projectId)}
                        className="group flex items-center gap-2 text-xl font-semibold text-gray-900 hover:text-primary transition-colors text-left truncate flex-1 min-w-0"
                        title={`点击进入项目详情: ${tasks[0]?.projectName || '未知项目'}`}
                      >
                        <ProjectFolderIcon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
                        <span className="truncate">{tasks[0]?.projectName || '未知项目'}</span>
                        <ExternalLinkIcon className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* 待办数量 */}
                      <span className="text-sm text-gray-500">
                        {tasks.length} 个待办
                      </span>
                      
                      {/* 添加新待办按钮 */}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => handleAddTaskClick(projectId, e)}
                        title={`为项目"${tasks[0]?.projectName || '未知项目'}"添加新待办`}
                      >
                        <CreateTodoIcon className="w-4 h-4 mr-1" />
                        添加待办
                      </Button>
                    </div>
                  </div>
                  
                  {/* 待办列表 - 根据折叠状态显示/隐藏（树形结构） */}
                  {isExpanded && (
                    <div>
                      {taskTree.map((task) => {
                        const members = projectMembersMap.get(projectId) || []
                        return (
                          <TodoTreeItem
                            key={task.id}
                            todo={task}
                            projectId={projectId}
                            currentUserId={currentUserId}
                            members={members}
                            canEdit={canChangeStatus(task, projectId)}
                            onStatusChange={canChangeStatus(task, projectId) ? (taskId, newStatus) => handleStatusChange(taskId, newStatus as TodoStatus, projectId) : undefined}
                            canAssignAssignee={canAssignAssignee(task, projectId)}
                            onUpdateAssignee={async (taskId, assigneeId) => handleUpdateAssignee(taskId, assigneeId, projectId)}
                            canEditPriority={canEditPriority(task, projectId)}
                            onUpdatePriority={async (taskId, priority) => handleUpdatePriority(taskId, priority, projectId)}
                            canEditTags={canEditTags(task, projectId)}
                            onUpdateTags={async (taskId, tagsString) => handleUpdateTags(taskId, tagsString, projectId)}
                            currentUserRole={getUserRoleInProject(projectId)}
                            onClick={() => {
                              setSelectedTaskId(String(task.id))
                              setSelectedProjectId(projectId)
                              setDrawerOpen(true)
                            }}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* 待办详情抽屉 */}
      <Drawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedTaskId(null)
          setSelectedProjectId(null)
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
            setSelectedProjectId(previous.projectId)
          }
        }}
      >
        {selectedTaskId && selectedProjectId && (
          <TaskDetailContent
            projectId={selectedProjectId}
            taskId={selectedTaskId}
            showHeader={false}
            parentTaskId={taskHistory.length > 0 ? taskHistory[taskHistory.length - 1].parentTaskId : null}
            onNavigateToSubtask={(subtaskId) => {
              // 获取当前任务的父任务ID
              const currentTask = myTasks.find(t => t.id.toString() === selectedTaskId && t.projectId === selectedProjectId)
              const parentTaskId = currentTask?.parentId || null
              
              // 添加到历史记录
              setTaskHistory(prev => [...prev, { taskId: selectedTaskId, projectId: selectedProjectId, parentTaskId }])
              
              // 导航到子待办
              setSelectedTaskId(String(subtaskId))
              setSelectedProjectId(selectedProjectId)
            }}
            onClose={() => {
              // 关闭抽屉（回退逻辑已在 Drawer 的 onBack 中处理）
              setDrawerOpen(false)
              setSelectedTaskId(null)
              setSelectedProjectId(null)
            }}
            onDelete={() => {
              setDrawerOpen(false)
              setSelectedTaskId(null)
              setSelectedProjectId(null)
              setTaskHistory([])
              // 刷新待办列表
              queryClient.invalidateQueries({ queryKey: ['projects'] })
            }}
          />
        )}
      </Drawer>
      
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

// ==================== 图标组件 ====================

function ChevronIcon({ isExpanded, disabled }: { isExpanded: boolean; disabled?: boolean }) {
  return (
    <svg
      className={clsx('w-5 h-5 transition-transform', {
        'transform rotate-90': isExpanded,
        'text-gray-600': !disabled,
        'text-gray-400': disabled,
      })}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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

function ProjectFolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )
}

function ExpandAllIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  )
}

function CollapseAllIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16M4 4h16" />
    </svg>
  )
}

function CreateTodoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {/* 待办列表 */}
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      {/* + 号在右上角，使用圆形背景 */}
      <circle cx="17" cy="7" r="3.5" fill="currentColor" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 5.5v3M15.5 7h3" strokeWidth={1.5} stroke="white" fill="white" />
    </svg>
  )
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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

