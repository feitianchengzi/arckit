
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
import type { Todo } from '@/types'
import clsx from 'clsx'

export default function MyTasksPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { data: projects, isLoading: projectsLoading, error: projectsError } = useProjectList()
  
  const [myTasks, setMyTasks] = useState<Array<Omit<Todo, 'projectId'> & { projectId: string; projectName: string }>>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState<Error | null>(null)
  
  // 获取所有项目的任务
  useEffect(() => {
    if (!projects || !user || projectsLoading) return
    
    const fetchAllTasks = async () => {
      setTasksLoading(true)
      setTasksError(null)
      
      try {
        console.log('📥 开始获取所有项目的待办...')
        const allTasks: Array<Omit<Todo, 'projectId'> & { projectId: string; projectName: string }> = []
        
        // 并发获取所有项目的待办和成员
        const taskPromises = projects.map(async (project) => {
          try {
            console.log(`📋 获取项目 ${project.name} (ID: ${project.id}) 的待办和成员...`)
            
            // 获取待办列表
            const tasks = await tasksApi.listByProject(project.id.toString())
            const todos = tasksToTodos(tasks)
            console.log(`✅ 项目 ${project.name}: 获取到 ${todos.length} 个待办`)
            
            // 获取项目成员列表（用于 ID -> username 映射）
            const members = await projectsApi.getMembers(project.id.toString())
            console.log(`✅ 项目 ${project.name}: 获取到 ${members.length} 个成员`)
            
            // 创建 user_id -> username 的映射
            const userIdToUsername = new Map<number, string>()
            members.forEach(member => {
              if (member.user_id && member.username) {
                userIdToUsername.set(member.user_id, member.username)
              }
            })
            
            // 筛选出分配给当前用户的待办（或者是当前用户创建的待办）
            // 注意：现在通过 user_id 在成员列表中查找 username，然后与当前用户的 username 比较
            const userTasks = todos
              .filter(todo => {
                // 获取待办创建者和执行者的 username
                const creatorUsername = todo.creatorId ? userIdToUsername.get(todo.creatorId) : undefined
                const executorUsername = todo.assigneeId ? userIdToUsername.get(todo.assigneeId) : undefined
                
                // 检查是否是当前用户创建或被分配的待办
                const isCreator = creatorUsername === user.username
                const isAssignee = executorUsername === user.username
                
                console.log(`待办 ${todo.id}:`, {
                  content: todo.content.substring(0, 30),
                  creatorId: todo.creatorId,
                  creatorUsername,
                  assigneeId: todo.assigneeId,
                  executorUsername,
                  currentUsername: user.username,
                  isCreator,
                  isAssignee,
                  matched: isCreator || isAssignee,
                })
                
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
      } catch (err) {
        console.error('❌ 获取待办列表失败:', err)
        setTasksError(err as Error)
      } finally {
        setTasksLoading(false)
      }
    }
    
    fetchAllTasks()
  }, [projects, user, projectsLoading])
  
  const allTasksLoading = projectsLoading || tasksLoading
  const allTasksError = projectsError || tasksError
  
  // 按状态筛选
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('all')
  
  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') return myTasks
    return myTasks.filter(task => task.status === statusFilter)
  }, [myTasks, statusFilter])
  
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
      const totalProjects = tasksByProject.size
      
      if (next.has(projectId)) {
        // 如果要折叠，检查当前展开的项目组数量
        // 如果总项目组数 > 2 且展开的项目组数量 <= 2，则不允许折叠（至少保留2个展开）
        if (totalProjects > 2 && next.size <= 2) {
          // 至少保留2个展开，不允许折叠
          return prev
        }
        // 如果总项目组数 <= 2，允许折叠（因为无法满足"至少2个"的要求）
        next.delete(projectId)
      } else {
        // 展开项目组（不受限制）
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
      
      {/* 状态筛选 */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          全部 ({myTasks.length})
        </Button>
        <Button
          variant={statusFilter === 'PENDING' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('PENDING')}
        >
          待处理 ({myTasks.filter(t => t.status === 'PENDING').length})
        </Button>
        <Button
          variant={statusFilter === 'IN_PROGRESS' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('IN_PROGRESS')}
        >
          进行中 ({myTasks.filter(t => t.status === 'IN_PROGRESS').length})
        </Button>
        <Button
          variant={statusFilter === 'COMPLETED' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('COMPLETED')}
        >
          已完成 ({myTasks.filter(t => t.status === 'COMPLETED').length})
        </Button>
      </div>
      
      {/* 待办列表（按项目分组） */}
      <div className="space-y-6">
        {Array.from(tasksByProject.grouped.entries()).map(([projectId, tasks]) => {
          const isExpanded = expandedProjects.has(projectId)
          const totalProjects = tasksByProject.grouped.size
          const expandedCount = expandedProjects.size
          const taskTree = tasksByProject.treeMap.get(projectId) || []
          
          // 计算是否可以折叠：
          // 1. 如果项目组已折叠，按钮可用（可以展开）
          // 2. 如果项目组已展开：
          //    - 如果总项目组数 <= 2，允许折叠（因为无法满足"至少2个"的要求）
          //    - 如果总项目组数 > 2，且展开的项目组数量 > 2，允许折叠
          //    - 如果总项目组数 > 2，且展开的项目组数量 <= 2，禁用折叠（至少保留2个展开）
          const canCollapse = !isExpanded || totalProjects <= 2 || expandedCount > 2
          const isDisabled = !canCollapse
          
          return (
            <div key={projectId} className="bg-white rounded-lg shadow p-6">
              {/* 项目头部 - 可点击折叠/展开 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* 折叠/展开按钮 */}
                  <button
                    onClick={() => {
                      if (canCollapse) {
                        toggleProject(projectId)
                      }
                    }}
                    disabled={isDisabled}
                    className={clsx(
                      'flex-shrink-0 p-1 rounded transition-colors',
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-100 cursor-pointer'
                    )}
                    aria-label={isExpanded ? '折叠' : '展开'}
                    title={isDisabled ? '至少需要保留2个项目组展开' : (isExpanded ? '点击折叠' : '点击展开')}
                  >
                    <ChevronIcon isExpanded={isExpanded} disabled={isDisabled} />
                  </button>
                  
                  {/* 项目名称 - 可点击进入项目详情 */}
                  <button
                    onClick={() => handleProjectNameClick(projectId)}
                    className="group flex items-center gap-2 text-xl font-semibold text-gray-900 hover:text-primary transition-colors text-left truncate flex-1 min-w-0"
                    title={`点击进入项目详情: ${tasks[0]?.projectName || '未知项目'}`}
                  >
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

