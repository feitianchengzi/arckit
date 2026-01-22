
/**
 * 项目详情页面（客户端组件）
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, LoadingView, ErrorView, EmptyStateView, ConfirmDialog, TextField, Dialog } from '@/components/ui'
import { TodoTreeItem } from '@/components/features/TodoTreeItem'
import { buildTaskTree } from '@/lib/utils/taskTree'
import { useProject, useDeleteProject, useUpdateProject, useProjectMembers } from '@/hooks/useProjects'
import { useTaskList, useUpdateTaskStatus } from '@/hooks/useTasks'
import { useAuthStore } from '@/store/authStore'
import { useTagStore } from '@/store/tagStore'
import { parseTaskTags } from '@/lib/utils/tagUtils'
import { saveProjectFilterState, loadProjectFilterState } from '@/lib/utils/filterStorage'
import type { TodoStatus } from '@/types'
import clsx from 'clsx'

export default function ProjectDetailPage() {
  const navigate = useNavigate()
  const params = useParams()
  const projectId = Number(params.id!)
  
  const currentUser = useAuthStore((state) => state.user)
  const [showScrollTop, setShowScrollTop] = useState(false)
  
  // 回到顶部
  const scrollToTop = () => {
    const main = document.querySelector('main') as HTMLElement
    if (main && main.scrollHeight > main.clientHeight) {
      console.log('回到顶部 (main)')
      main.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      console.log('回到顶部 (window)')
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
  
  // 当筛选条件改变时保存到本地存储
  useEffect(() => {
    saveProjectFilterState(String(projectId), {
      statusFilter,
      creatorFilter,
      executorFilter,
      tagFilter: tagFilter as number | null,
      priorityFilter,
    })
  }, [projectId, statusFilter, creatorFilter, executorFilter, tagFilter, priorityFilter])
  
  // 如果正在删除项目，禁用待办列表查询
  const { data: todos, isLoading: todosLoading, error: todosError, refetch: refetchTodos } = useTaskList(String(projectId), {
    enabled: !isDeleting && !!project, // 正在删除或项目不存在时不查询
  })
  const { data: members } = useProjectMembers(String(projectId))
  const updateStatus = useUpdateTaskStatus(String(projectId))
  
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
  
  // 构建树形结构
  const taskTree = useMemo(() => {
    if (!todos) return []
    return buildTaskTree(todos)
  }, [todos])
  
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
    
    // 筛选函数：检查任务是否匹配筛选条件
    const matchesFilters = (todo: typeof taskTree[0]): boolean => {
      // 状态筛选
      const statusMatch = statusFilter === 'ALL' || todo.status === statusFilter
      
      // 创建人筛选
      let creatorMatch = true
      if (creatorFilter !== null) {
        if (creatorFilter === 'ME') {
          creatorMatch = todo.creatorId === currentUserId
        } else {
          creatorMatch = todo.creatorId === creatorFilter
        }
      }
      
      // 执行人筛选
      let executorMatch = true
      if (executorFilter !== null) {
        if (executorFilter === 'ME') {
          executorMatch = todo.assigneeId === currentUserId
        } else if (executorFilter === 'UNASSIGNED') {
          // assigneeId 类型是 number | undefined，检查未分配
          executorMatch = todo.assigneeId === undefined || todo.assigneeId === null
        } else {
          executorMatch = todo.assigneeId === executorFilter
        }
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
      
      return statusMatch && creatorMatch && executorMatch && tagMatch && priorityMatch
    }
    
    // 递归筛选树形结构
    const filterTree = (tasks: typeof taskTree): typeof taskTree => {
      return tasks
        .filter(todo => {
          // 如果任务本身匹配筛选条件，或者有子任务匹配筛选条件，则保留
          if (matchesFilters(todo)) {
            return true
          }
          // 如果有子任务，递归检查子任务
          if (todo.children && todo.children.length > 0) {
            const filteredChildren = filterTree(todo.children)
            if (filteredChildren.length > 0) {
              // 保留父任务，但只显示匹配的子任务
              return true
            }
          }
          return false
        })
        .map(todo => {
          // 如果任务本身不匹配，但子任务匹配，只显示子任务
          if (!matchesFilters(todo) && todo.children && todo.children.length > 0) {
            const filteredChildren = filterTree(todo.children)
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
    
    return filterTree(taskTree)
  }, [taskTree, statusFilter, creatorFilter, executorFilter, tagFilter, priorityFilter, currentUserId])
  
  // 监听主内容区滚动
  useEffect(() => {
    let scrollElement: HTMLElement | null = null
    let cleanup: (() => void) | null = null
    
    const setupScrollListener = () => {
      // 先尝试 main 元素
      const main = document.querySelector('main') as HTMLElement
      if (main) {
        const canScroll = main.scrollHeight > main.clientHeight
        console.log('检查 main 元素:', { 
          scrollHeight: main.scrollHeight, 
          clientHeight: main.clientHeight,
          canScroll,
          scrollTop: main.scrollTop 
        })
        
        if (canScroll) {
          scrollElement = main
        } else {
          // 如果 main 不能滚动，检查 body 或 window
          const body = document.body
          const html = document.documentElement
          const windowCanScroll = html.scrollHeight > html.clientHeight || body.scrollHeight > body.clientHeight
          console.log('检查 window 滚动:', {
            htmlScrollHeight: html.scrollHeight,
            htmlClientHeight: html.clientHeight,
            bodyScrollHeight: body.scrollHeight,
            bodyClientHeight: body.clientHeight,
            windowCanScroll
          })
          
          if (windowCanScroll) {
            scrollElement = null // 使用 window
          }
        }
      }
      
      const handleScroll = () => {
        if (scrollElement) {
          const scrollTop = scrollElement.scrollTop
          const shouldShow = scrollTop > 150
          console.log('滚动检测 (main):', { scrollTop, shouldShow })
          setShowScrollTop(shouldShow)
        } else {
          // 使用 window 滚动
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop
          const shouldShow = scrollTop > 150
          console.log('滚动检测 (window):', { scrollTop, shouldShow })
          setShowScrollTop(shouldShow)
        }
      }
      
      if (scrollElement) {
        console.log('绑定 main 滚动事件')
        scrollElement.addEventListener('scroll', handleScroll, { passive: true })
        handleScroll() // 初始检查
        cleanup = () => {
          scrollElement?.removeEventListener('scroll', handleScroll)
        }
      } else {
        console.log('绑定 window 滚动事件')
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
  
  // 判断是否有权限修改任务（owner/admin 可以修改任意任务，member 只能修改自己创建或分配给自己执行的任务）- 必须在早期返回之前调用
  const canEditTask = useCallback((todo: any) => {
    if (!currentUserId || !currentUserRole) return false
    
    // owner 或 admin 可以修改任意任务
    if (currentUserRole === 'owner' || currentUserRole === 'admin') {
      return true
    }
    
    // member 只能修改自己创建或分配给自己执行的任务
    return todo.creatorId === currentUserId || todo.assigneeId === currentUserId
  }, [currentUserId, currentUserRole])
  
  // 点击外部关闭更多菜单 - 必须在早期返回之前调用
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false)
      }
    }
    
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMoreMenu])
  
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 max-w-[calc(100%-200px)] md:max-w-none">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate" title={project.name}>
            {project.name}
          </h1>
          {project.git_url && (
            <p className="mt-1 text-xs md:text-base text-gray-600 truncate" title={project.git_url}>
              {project.git_url}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {/* 成员按钮 - 图标按钮 */}
          <IconButton
            icon={<MembersIcon />}
            label="成员"
            onClick={() => navigate(`/projects/${projectId}/members`)}
            variant="secondary"
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          
          {/* 创建待办按钮 - 图标按钮 */}
          <IconButton
            icon={<CreateTodoIcon />}
            label="创建待办"
            onClick={() => navigate(`/projects/${projectId}/tasks/new`)}
            variant="primary"
          />
          
          {/* 更多菜单 - 只有项目所有者才能看到 */}
          {isOwner && (
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
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <button
                    onClick={() => {
                      handleEditClick()
                      setShowMoreMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <EditIcon className="w-4 h-4" />
                    <span>编辑项目</span>
                  </button>
                  
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* 统计卡片 - 移动端横向滚动，桌面端网格布局 */}
      <div className="-mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-6 overflow-x-auto overflow-y-visible py-4 md:py-0 scrollbar-hide">
          <StatCard
            title="待办"
            value={stats.pending}
            icon={<TaskIcon />}
            isActive={statusFilter === 'PENDING'}
            onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
            className="min-w-[140px] md:min-w-0 flex-shrink-0"
          />
          
          <StatCard
            title="进行中"
            value={stats.inProgress}
            icon={<ProgressIcon />}
            isActive={statusFilter === 'IN_PROGRESS'}
            onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
            className="min-w-[140px] md:min-w-0 flex-shrink-0"
          />
          
          <StatCard
            title="已完成"
            value={stats.completed}
            icon={<CheckIcon />}
            isActive={statusFilter === 'COMPLETED'}
            onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
            className="min-w-[140px] md:min-w-0 flex-shrink-0"
          />
        </div>
      </div>
      
      {/* 待办列表 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">待办列表</h2>
        
        {/* 筛选器 */}
        <div className="mb-4 space-y-3">
          {/* 筛选器组 */}
          <div className="flex flex-wrap gap-6 items-center">
            {/* 状态筛选 */}
            <div className="flex items-center gap-2">
              <label className={clsx(
                "flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap",
                statusFilter !== 'ALL' ? "text-orange-600" : "text-gray-600"
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
                    "px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                    statusFilter !== 'ALL' ? "text-orange-600 font-medium" : "text-gray-900"
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
            <div className="flex items-center gap-2">
              <label className={clsx(
                "flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap",
                creatorFilter !== null ? "text-orange-600" : "text-gray-600"
              )}>
                <CreatorFilterIcon className={clsx(
                  "w-4 h-4",
                  creatorFilter !== null ? "text-orange-500" : "text-gray-500"
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
                    "px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                    creatorFilter !== null ? "text-orange-600 font-medium" : "text-gray-900"
                  )}
                >
                  <option value="">全部</option>
                  {currentUserId && (
                    <option value="ME">我创建的</option>
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
            <div className="flex items-center gap-2">
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
                    "px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                    executorFilter !== null ? "text-orange-600 font-medium" : "text-gray-900"
                  )}
                >
                  <option value="">全部</option>
                  <option value="UNASSIGNED">未分配</option>
                  {currentUserId && (
                    <option value="ME">我执行的</option>
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
            <div className="flex items-center gap-2">
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
                    "px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                    tagFilter !== null ? "text-orange-600 font-medium" : "text-gray-900"
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
            <div className="flex items-center gap-2">
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
                    "px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                    priorityFilter !== null ? "text-orange-600 font-medium" : "text-gray-900"
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
            
            {/* 清除所有筛选 */}
            {(statusFilter !== 'ALL' || creatorFilter !== null || executorFilter !== null || tagFilter !== null || priorityFilter !== null) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('ALL')
                  setCreatorFilter(null)
                  setExecutorFilter(null)
                  setTagFilter(null)
                  setPriorityFilter(null)
                }}
              >
                清除所有筛选
              </Button>
            )}
          </div>
        </div>
        
        {!todos || todos.length === 0 ? (
          <EmptyStateView
            title="还没有待办"
            message="创建第一个待办开始工作"
            actionLabel="创建待办"
            onAction={() => navigate(`/projects/${projectId}/tasks/new`)}
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
                : () => navigate(`/projects/${projectId}/tasks/new`)
            }
          />
        ) : (
          <div>
            {filteredTodos.map((todo) => (
              <TodoTreeItem
                key={todo.id}
                todo={todo}
                projectId={projectId}
                onStatusChange={canEditTask(todo) ? handleStatusChange : undefined}
                currentUserId={currentUserId}
                canEdit={canEditTask(todo)}
              />
            ))}
          </div>
        )}
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
        'bg-white rounded-lg shadow p-4 md:p-6 cursor-pointer transition-all',
        {
          'border-2 border-primary-500 shadow-lg': isActive,
          'border-2 border-transparent': !isActive, // 保持相同大小，避免布局跳动
          'hover:shadow-md': !isActive,
        },
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 md:gap-4">
        <div className={clsx(
          'w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0',
          {
            'bg-primary-500 text-white': isActive,
            'bg-primary-50 text-primary': !isActive,
          }
        )}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className={clsx(
            'text-xs md:text-sm truncate',
            {
              'text-primary-600 font-medium': isActive,
              'text-gray-600': !isActive,
            }
          )}>{title}</p>
          <p className={clsx(
            'text-xl md:text-2xl font-bold',
            {
              'text-primary-600': isActive,
              'text-gray-900': !isActive,
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
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'relative group min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        // 如果有自定义背景色，使用自定义背景色，否则使用 variant 的默认样式
        iconBgColor 
          ? clsx(iconBgColor, iconColor || 'text-gray-700', 'hover:opacity-80', 'focus:ring-gray-500')
          : {
              'bg-primary text-white hover:bg-primary-700 focus:ring-primary': variant === 'primary',
              'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500': variant === 'secondary' && !isActive,
              'bg-gray-300 text-gray-900 focus:ring-gray-500': variant === 'secondary' && isActive,
              'bg-error text-white hover:bg-red-600 focus:ring-error': variant === 'danger',
            },
        {
          'opacity-50 cursor-not-allowed': disabled,
        }
      )}
      title={label}
      aria-label={label}
    >
      <span className={clsx('w-5 h-5', iconColor && !iconBgColor ? iconColor : '')}>{icon}</span>
      
      {/* Tooltip - 桌面端显示，在按钮下方 */}
      <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
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

