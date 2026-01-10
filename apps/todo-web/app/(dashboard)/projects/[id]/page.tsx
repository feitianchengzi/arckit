'use client'

/**
 * 项目详情页面（集成任务列表）
 */

import { useParams, useRouter } from 'next/navigation'
import { Button, LoadingView, ErrorView, EmptyStateView } from '@/components/ui'
import { TodoItem } from '@/components/features'
import { useProject } from '@/hooks/useProjects'
import { useTaskList, useUpdateTaskStatus } from '@/hooks/useTasks'
import { useMemo } from 'react'

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const { data: project, isLoading: projectLoading, error: projectError, refetch: refetchProject } = useProject(projectId)
  const { data: todos, isLoading: todosLoading, error: todosError, refetch: refetchTodos } = useTaskList(projectId)
  const updateStatus = useUpdateTaskStatus(projectId)
  
  // 统计数据
  const stats = useMemo(() => {
    if (!todos) return { pending: 0, inProgress: 0, completed: 0 }
    
    return {
      pending: todos.filter(t => t.status === 'PENDING').length,
      inProgress: todos.filter(t => t.status === 'IN_PROGRESS').length,
      completed: todos.filter(t => t.status === 'COMPLETED').length,
    }
  }, [todos])
  
  // 加载状态
  if (projectLoading || todosLoading) {
    return <LoadingView size="lg" text="加载项目详情..." />
  }
  
  // 错误状态
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
  
  // 处理状态变更
  const handleStatusChange = async (todoId: number, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ taskId: todoId.toString(), status: newStatus })
    } catch (error) {
      console.error('更新状态失败:', error)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <BackIcon className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <p className="mt-1 text-gray-600">{project.git_url}</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => router.push(`/projects/${projectId}/invite`)}
          >
            邀请成员
          </Button>
          
          <Button
            variant="primary"
            onClick={() => router.push(`/projects/${projectId}/tasks/new`)}
          >
            创建任务
          </Button>
        </div>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="待办任务"
          value={stats.pending}
          icon={<TaskIcon />}
        />
        
        <StatCard
          title="进行中"
          value={stats.inProgress}
          icon={<ProgressIcon />}
        />
        
        <StatCard
          title="已完成"
          value={stats.completed}
          icon={<CheckIcon />}
        />
      </div>
      
      {/* 任务列表 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">任务列表</h2>
        
        {!todos || todos.length === 0 ? (
          <EmptyStateView
            title="还没有任务"
            message="创建第一个任务开始工作"
            actionLabel="创建任务"
            onAction={() => router.push(`/projects/${projectId}/tasks/new`)}
          />
        ) : (
          <div className="space-y-3">
            {/* 只显示根任务（没有父任务的任务），子任务在任务详情页显示 */}
            {todos
              .filter(todo => !todo.parentId)
              .map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  projectId={projectId}
                  onStatusChange={handleStatusChange}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== 子组件 ====================

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
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

