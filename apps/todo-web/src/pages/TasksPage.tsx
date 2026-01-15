
/**
 * 我的任务页面
 * 显示当前用户分配的所有任务（跨项目）
 */

import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, LoadingView, ErrorView, EmptyStateView } from '@/components/ui'
import { TodoItem } from '@/components/features'
import { useProjectList } from '@/hooks/useProjects'
import { tasksApi } from '@/lib/api/endpoints/tasks'
import { projectsApi } from '@/lib/api/endpoints/projects'
import { tasksToTodos } from '@/lib/utils/taskMapper'
import { useAuthStore } from '@/store/authStore'
import type { Todo } from '@/types'

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
        console.log('📥 开始获取所有项目的任务...')
        const allTasks: Array<Omit<Todo, 'projectId'> & { projectId: string; projectName: string }> = []
        
        // 并发获取所有项目的任务和成员
        const taskPromises = projects.map(async (project) => {
          try {
            console.log(`📋 获取项目 ${project.name} (ID: ${project.id}) 的任务和成员...`)
            
            // 获取任务列表
            const tasks = await tasksApi.listByProject(project.id.toString())
            const todos = tasksToTodos(tasks)
            console.log(`✅ 项目 ${project.name}: 获取到 ${todos.length} 个任务`)
            
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
            
            // 筛选出分配给当前用户的任务（或者是当前用户创建的任务）
            // 注意：现在通过 user_id 在成员列表中查找 username，然后与当前用户的 username 比较
            const userTasks = todos
              .filter(todo => {
                // 获取任务创建者和执行者的 username
                const creatorUsername = todo.creatorId ? userIdToUsername.get(todo.creatorId) : undefined
                const executorUsername = todo.assigneeId ? userIdToUsername.get(todo.assigneeId) : undefined
                
                // 检查是否是当前用户创建或被分配的任务
                const isCreator = creatorUsername === user.username
                const isAssignee = executorUsername === user.username
                
                console.log(`任务 ${todo.id}:`, {
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
            
            console.log(`✅ 项目 ${project.name}: 当前用户有 ${userTasks.length} 个相关任务`)
            return userTasks
          } catch (err) {
            console.error(`❌ 获取项目 ${project.id} 的任务失败:`, err)
            return []
          }
        })
        
        const results = await Promise.all(taskPromises)
        const flattened = results.flat()
        console.log(`✅ 总共找到 ${flattened.length} 个任务`)
        setMyTasks(flattened)
      } catch (err) {
        console.error('❌ 获取任务列表失败:', err)
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
  
  // 按项目分组
  const tasksByProject = useMemo(() => {
    const grouped = new Map<string, typeof filteredTasks>()
    filteredTasks.forEach(task => {
      if (!grouped.has(task.projectId)) {
        grouped.set(task.projectId, [])
      }
      grouped.get(task.projectId)!.push(task)
    })
    return grouped
  }, [filteredTasks])
  
  // 加载状态
  if (allTasksLoading) {
    return <LoadingView size="lg" text="加载任务列表..." />
  }
  
  // 错误状态
  if (allTasksError) {
    return (
      <ErrorView
        title="加载失败"
        message={allTasksError instanceof Error ? allTasksError.message : '无法获取任务列表，请稍后重试'}
        onRetry={() => window.location.reload()}
      />
    )
  }
  
  // 空状态（需要等待加载完成）
  if (!allTasksLoading && myTasks.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">我的任务</h1>
          <p className="mt-2 text-gray-600">查看分配给您的任务</p>
        </div>
        
        <EmptyStateView
          title="还没有任务"
          message="您目前没有被分配的任务"
          actionLabel="查看项目"
          onAction={() => navigate('/projects')}
        />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">我的任务</h1>
          <p className="mt-2 text-gray-600">
            共 {filteredTasks.length} 个任务
          </p>
        </div>
      </div>
      
      {/* 状态筛选 */}
      <div className="flex gap-2">
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
      
      {/* 任务列表（按项目分组） */}
      <div className="space-y-6">
        {Array.from(tasksByProject.entries()).map(([projectId, tasks]) => (
          <div key={projectId} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {tasks[0]?.projectName || '未知项目'}
              </h2>
              <span className="text-sm text-gray-500">
                {tasks.length} 个任务
              </span>
            </div>
            
            <div className="space-y-3">
              {tasks.map((task) => (
                <TodoItem
                  key={task.id}
                  todo={{
                    ...task,
                    projectId: parseInt(task.projectId), // 转换为 number 以匹配 Todo 类型
                  }}
                  projectId={task.projectId}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

