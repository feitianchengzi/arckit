
/**
 * 我的待办页面
 * 显示当前用户分配的所有待办（跨项目）
 */

import { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, LoadingView, ErrorView, EmptyStateView } from '@/components/ui'
import { TodoTreeItem } from '@/components/features/TodoTreeItem'
import { useProjectList } from '@/hooks/useProjects'
import { tasksApi } from '@/lib/api/endpoints/tasks'
import { projectsApi } from '@/lib/api/endpoints/projects'
import { tasksToTodos } from '@/lib/utils/taskMapper'
import { buildTaskTree } from '@/lib/utils/taskTree'
import { useAuthStore } from '@/store/authStore'
import { useTagStore } from '@/store/tagStore'
import { parseTaskTags } from '@/lib/utils/tagUtils'
import type { Todo, TodoStatus } from '@/types'
import clsx from 'clsx'

export default function MyTasksPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
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
  const { data: projects, isLoading: projectsLoading, error: projectsError } = useProjectList()
  
  const [myTasks, setMyTasks] = useState<Array<Omit<Todo, 'projectId'> & { projectId: string; projectName: string }>>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState<Error | null>(null)
  
  // 筛选器状态
  const [statusFilter, setStatusFilter] = useState<TodoStatus | 'ALL'>('ALL')
  const [creatorFilter, setCreatorFilter] = useState<number | 'ME' | null>(null)
  const [executorFilter, setExecutorFilter] = useState<number | 'ME' | 'UNASSIGNED' | null>(null)
  const [tagFilter, setTagFilter] = useState<{ projectId: string; tagId: number } | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<number | null | 'ALL' | 'NONE'>(null)
  
  // 所有项目的成员和标签信息
  const [allMembers, setAllMembers] = useState<Map<string, Array<{ user_id: number; username: string }>>>(new Map())
  const { loadProjectTags, getProjectTags } = useTagStore()
  
  // 获取所有项目的任务、成员和标签
  useEffect(() => {
    if (!projects || !user || projectsLoading) return
    
    const fetchAllTasks = async () => {
      setTasksLoading(true)
      setTasksError(null)
      
      try {
        console.log('📥 开始获取所有项目的待办...')
        const allTasks: Array<Omit<Todo, 'projectId'> & { projectId: string; projectName: string }> = []
        const membersMap = new Map<string, Array<{ user_id: number; username: string }>>()
        
        // 并发获取所有项目的待办、成员和标签
        const taskPromises = projects.map(async (project) => {
          try {
            console.log(`📋 获取项目 ${project.name} (ID: ${project.id}) 的待办、成员和标签...`)
            
            // 获取待办列表
            const tasks = await tasksApi.listByProject(project.id.toString())
            const todos = tasksToTodos(tasks)
            console.log(`✅ 项目 ${project.name}: 获取到 ${todos.length} 个待办`)
            
            // 获取项目成员列表
            const members = await projectsApi.getMembers(project.id.toString())
            console.log(`✅ 项目 ${project.name}: 获取到 ${members.length} 个成员`)
            
            // 存储成员信息
            const memberList = members
              .filter(m => m.user_id && m.username)
              .map(m => ({
                user_id: m.user_id!,
                username: m.username!,
              }))
            membersMap.set(project.id.toString(), memberList)
            
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
                const creatorUsername = todo.creatorId ? userIdToUsername.get(todo.creatorId) : undefined
                const executorUsername = todo.assigneeId ? userIdToUsername.get(todo.assigneeId) : undefined
                
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
            
            console.log(`✅ 项目 ${project.name}: 当前用户有 ${userTasks.length} 个相关待办`)
            return userTasks
          } catch (err) {
            console.error(`❌ 获取项目 ${project.id} 的待办失败:`, err)
            return []
          }
        })
        
        const results = await Promise.all(taskPromises)
        const flattened = results.flat()
        console.log(`✅ 总共找到 ${flattened.length} 个待办`)
        setMyTasks(flattened)
        setAllMembers(membersMap)
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
      
      return statusMatch && creatorMatch && executorMatch && tagMatch && priorityMatch
    })
  }, [myTasks, statusFilter, creatorFilter, executorFilter, tagFilter, priorityFilter, currentUserId])
  
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
          const html = document.documentElement
          const body = document.body
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
    navigate(`/projects/${projectId}/tasks/new`)
  }
  
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
          <h1 className="text-3xl font-bold text-gray-900">我的待办</h1>
          <p className="mt-2 text-gray-600">查看分配给您的待办</p>
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">我的待办</h1>
          <p className="mt-1 md:mt-2 text-sm md:text-base text-gray-600">
            共 {filteredTasks.length} 个待办
          </p>
        </div>
      </div>
      
      {/* 待办列表 - 使用和项目详情页相同的样式 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">待办列表</h2>
          
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
        <div className="mb-4 space-y-3">
          {/* 筛选器组 */}
          <div className="flex flex-wrap gap-6 items-center">
            {/* 状态筛选 */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 whitespace-nowrap">
                <StatusFilterIcon className="w-4 h-4 text-gray-500" />
                状态:
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    const value = e.target.value
                    setStatusFilter(value as TodoStatus | 'ALL')
                  }}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 whitespace-nowrap">
                <CreatorFilterIcon className="w-4 h-4 text-gray-500" />
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
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">全部</option>
                  {currentUserId && (
                    <option value="ME">我创建的</option>
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
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 whitespace-nowrap">
                <ExecutorFilterIcon className="w-4 h-4 text-gray-500" />
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
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">全部</option>
                  <option value="UNASSIGNED">未分配</option>
                  {currentUserId && (
                    <option value="ME">我执行的</option>
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
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 whitespace-nowrap">
                <TagFilterIcon className="w-4 h-4 text-gray-500" />
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
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 whitespace-nowrap">
                <PriorityFilterIcon className="w-4 h-4 text-gray-500" />
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
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
        
        {/* 空状态 */}
        {filteredTasks.length === 0 && (
          <EmptyStateView
            title={myTasks.length === 0 ? "还没有待办" : "没有匹配的待办"}
            message={
              myTasks.length === 0
                ? "您目前没有被分配的待办"
                : statusFilter !== 'ALL' || creatorFilter !== null || executorFilter !== null || tagFilter !== null || priorityFilter !== null
                ? '尝试切换其他筛选条件'
                : '创建第一个待办开始工作'
            }
            actionLabel={
              myTasks.length === 0
                ? '查看项目'
                : statusFilter !== 'ALL' || creatorFilter !== null || executorFilter !== null || tagFilter !== null || priorityFilter !== null
                ? undefined
                : '创建待办'
            }
            onAction={
              myTasks.length === 0
                ? () => navigate('/projects')
                : statusFilter !== 'ALL' || creatorFilter !== null || executorFilter !== null || tagFilter !== null || priorityFilter !== null
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
                      {taskTree.map((task) => (
                        <TodoTreeItem
                          key={task.id}
                          todo={task}
                          projectId={projectId}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      
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

