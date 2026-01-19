
/**
 * 项目详情页面（客户端组件）
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, LoadingView, ErrorView, EmptyStateView, ConfirmDialog } from '@/components/ui'
import { TodoItem } from '@/components/features'
import { useProject, useDeleteProject } from '@/hooks/useProjects'
import { useTaskList, useUpdateTaskStatus } from '@/hooks/useTasks'
import { useAuthStore } from '@/store/authStore'
import { useMemo } from 'react'

export default function ProjectDetailPage() {
  const navigate = useNavigate()
  const params = useParams()
  const projectId = Number(params.id!)
  
  const currentUser = useAuthStore((state) => state.user)
  const { data: project, isLoading: projectLoading, error: projectError, refetch: refetchProject } = useProject(String(projectId))
  const deleteProject = useDeleteProject()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // 如果正在删除项目，禁用任务列表查询
  const { data: todos, isLoading: todosLoading, error: todosError, refetch: refetchTodos } = useTaskList(String(projectId), {
    enabled: !isDeleting && !!project, // 正在删除或项目不存在时不查询
  })
  const updateStatus = useUpdateTaskStatus(String(projectId))
  
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
  
  // 判断当前用户是否是项目所有者
  const isOwner = project?.creator?.username === currentUser?.username || 
    project?.members?.some(m => m.username === currentUser?.username && m.role === 'owner')
  
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
      setIsDeleting(true) // 立即禁用任务列表查询，防止继续请求
      setShowDeleteConfirm(false) // 先关闭对话框
      await deleteProject.mutateAsync(String(projectId))
      // 删除成功后会通过 useDeleteProject hook 自动跳转到项目列表
    } catch (error) {
      console.error('删除项目失败:', error)
      setIsDeleting(false) // 删除失败，恢复查询
      setShowDeleteConfirm(true) // 删除失败，重新显示对话框
    }
  }
  
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
        
        <div className="flex flex-col md:flex-row gap-2 shrink-0">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate(`/projects/${projectId}/members`)}
              className="min-h-[44px] text-sm md:text-base px-3 md:px-4"
            >
              成员
            </Button>
            
            <Button
              variant="primary"
              onClick={() => navigate(`/projects/${projectId}/tasks/new`)}
              className="min-h-[44px] text-sm md:text-base px-3 md:px-4"
            >
              创建任务
            </Button>
          </div>
          
          {/* 只有项目所有者才能看到删除按钮 */}
          {isOwner && (
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              className="min-h-[44px] text-sm md:text-base px-3 md:px-4"
              loading={deleteProject.isPending}
            >
              删除项目
            </Button>
          )}
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
            onAction={() => navigate(`/projects/${projectId}/tasks/new`)}
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
