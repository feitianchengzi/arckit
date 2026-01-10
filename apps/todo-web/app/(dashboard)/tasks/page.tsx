'use client'

/**
 * 我的任务页面
 * 显示当前用户分配的所有任务（跨项目）
 */

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, LoadingView, ErrorView, EmptyStateView } from '@/components/ui'
import { TodoItem } from '@/components/features'
import { useProjectList } from '@/hooks/useProjects'
import { tasksApi } from '@/lib/api/endpoints/tasks'
import { tasksToTodos } from '@/lib/utils/taskMapper'
import { useAuthStore } from '@/store/authStore'
import type { Todo } from '@/types'

export default function MyTasksPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const { data: projects, isLoading: projectsLoading, error: projectsError } = useProjectList()
  
  const [myTasks, setMyTasks] = useState<Array<Todo & { projectId: string; projectName: string }>>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState<Error | null>(null)
  
  // 获取所有项目的任务
  useEffect(() => {
    if (!projects || !user || projectsLoading) return
    
    const fetchAllTasks = async () => {
      setTasksLoading(true)
      setTasksError(null)
      
      try {
        const allTasks: Array<Todo & { projectId: string; projectName: string }> = []
        
        // 并发获取所有项目的任务
        const taskPromises = projects.map(async (project) => {
          try {
            const tasks = await tasksApi.listByProject(project.id.toString())
            const todos = tasksToTodos(tasks)
            
            // 筛选出分配给当前用户的任务（或者是当前用户创建的任务）
            const userTasks = todos
              .filter(todo => todo.executorId === user.id || todo.creatorId === user.id)
              .map(todo => ({
                ...todo,
                projectId: project.id.toString(),
                projectName: project.name,
              }))
            
            return userTasks
          } catch (err) {
            console.error(`获取项目 ${project.id} 的任务失败:`, err)
            return []
          }
        })
        
        const results = await Promise.all(taskPromises)
        const flattened = results.flat()
        setMyTasks(flattened)
      } catch (err) {
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
          onAction={() => router.push('/projects')}
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
                  todo={task}
                  projectId={projectId}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

