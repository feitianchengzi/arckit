
/**
 * 任务详情页面（客户端组件）
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, LoadingView, ErrorView, StatusBadge, StatusSelect, ConfirmDialog } from '@/components/ui'
import { SubtaskList, StatusHistory } from '@/components/features'
import { useTask, useUpdateTask, useDeleteTask, useUpdateTaskStatus } from '@/hooks/useTasks'
import { useTaskHistory } from '@/hooks/useHistory'
import { useProject, useProjectMembers } from '@/hooks/useProjects'
import { useAuthStore } from '@/store/authStore'
import type { TodoStatus } from '@/types'

export default function TaskDetailPage() {
  const navigate = useNavigate()
  const params = useParams()
  const projectId = Number(params.id!)
  const taskId = Number(params.taskId!)
  
  const { data: project } = useProject(String(projectId))
  const { data: todo, isLoading, error, refetch } = useTask(String(projectId), String(taskId))
  
  // 获取父任务信息（如果有）
  const parentTask = (todo as any)?.parentTask
  const { data: history, isLoading: historyLoading } = useTaskHistory(String(projectId), String(taskId))
  const updateTask = useUpdateTask(String(projectId), String(taskId))
  const deleteTask = useDeleteTask(projectId)
  const updateStatus = useUpdateTaskStatus(String(projectId))
  
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [updateError, setUpdateError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [statusUpdateError, setStatusUpdateError] = useState('')
  const [isEditingAssignee, setIsEditingAssignee] = useState(false)
  const [newAssigneeId, setNewAssigneeId] = useState<number | undefined>(undefined)
  
  const { data: members } = useProjectMembers(String(projectId))
  const currentUser = useAuthStore((state) => state.user)
  
  // 从成员列表中查找创建者和执行者信息
  const creatorInfo = members?.find(m => m.user_id === todo?.creatorId)
  const executorInfo = members?.find(m => m.user_id === todo?.assigneeId)
  
  // 获取创建者和执行者的用户名
  const creatorUsername = todo?.creator?.username || creatorInfo?.username || creatorInfo?.user?.username || '未知'
  const executorUsername = todo?.assignee?.username || executorInfo?.username || executorInfo?.user?.username || '未分配'
  
  // 检查当前用户是否是任务创建者或执行者（通过 username 比较）
  const isCreator = creatorUsername === currentUser?.username
  const isAssignee = executorUsername === currentUser?.username && executorUsername !== '未分配'
  
  // 只有创建者或执行者可以分配任务（后端逻辑：非创建者且非执行者才返回 403）
  const canEditAssignee = isCreator || isAssignee
  
  // 加载状态
  if (isLoading) {
    return <LoadingView size="lg" text="加载任务详情..." />
  }
  
  // 错误状态
  if (error || !todo) {
    return (
      <ErrorView
        title="加载失败"
        message="无法获取任务详情，请稍后重试"
        onRetry={() => refetch()}
      />
    )
  }
  
  // 进入编辑模式
  const handleEdit = () => {
    setEditContent(todo.content)
    setIsEditing(true)
    setUpdateError('')
  }
  
  // 保存编辑
  const handleSave = async () => {
    setUpdateError('')
    
    if (!editContent.trim()) {
      setUpdateError('任务内容不能为空')
      return
    }
    
    try {
      await updateTask.mutateAsync({ content: editContent.trim() })
      setIsEditing(false)
    } catch (err: any) {
      setUpdateError(err.response?.data?.message || '更新失败，请重试')
    }
  }
  
  // 取消编辑
  const handleCancel = () => {
    setIsEditing(false)
    setEditContent('')
    setUpdateError('')
  }
  
  // 删除任务
  const handleDelete = async () => {
    try {
      await deleteTask.mutateAsync(taskId)
      navigate(`/projects/${projectId}`)
    } catch (err: any) {
      alert(err.response?.data?.message || '删除失败，请重试')
      setShowDeleteConfirm(false)
    }
  }

  // 处理子任务状态变更
  const handleSubtaskStatusChange = async (subtaskId: number, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ taskId: subtaskId.toString(), status: newStatus })
    } catch (error) {
      console.error('更新子任务状态失败:', error)
    }
  }

  // 创建子任务
  const handleCreateSubtask = () => {
    navigate(`/projects/${projectId}/tasks/new?parentId=${taskId}`)
  }

  // 处理状态变更
  const handleStatusChange = async (newStatus: TodoStatus) => {
    setStatusUpdateError('')
    
    if (newStatus === todo.status) {
      return // 状态未改变
    }
    
    try {
      await updateStatus.mutateAsync({ taskId, status: newStatus })
    } catch (err: any) {
      setStatusUpdateError(err.response?.data?.message || '状态更新失败，请重试')
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 返回按钮 */}
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900"
            title="返回上一页"
          >
            <BackIcon className="w-6 h-6" />
          </button>
          
          {/* 父任务图标（如果有） */}
          {parentTask && (
            <button
              onClick={() => navigate(`/projects/${projectId}/tasks/${parentTask.id}`)}
              className="text-gray-600 hover:text-gray-900 relative group"
            >
              <ParentTaskIcon className="w-6 h-6" />
              {/* Tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-10 pointer-events-none">
                <div className="bg-gray-900 text-white text-xs rounded py-1.5 px-2.5 whitespace-nowrap shadow-lg">
                  父任务：{parentTask.title || parentTask.content.substring(0, 30)}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </button>
          )}
          
          {/* 项目详情图标 */}
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="text-gray-600 hover:text-gray-900 relative group"
          >
            <ProjectIcon className="w-6 h-6" />
            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-10 pointer-events-none">
              <div className="bg-gray-900 text-white text-xs rounded py-1.5 px-2.5 whitespace-nowrap shadow-lg">
                项目详情：{project?.name || '项目'}
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">任务详情</h1>
            {project && (
              <p className="mt-1 text-gray-600">项目：{project.name}</p>
            )}
          </div>
        </div>
        
        {!isEditing && (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handleEdit}
            >
              编辑
            </Button>
            
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              loading={deleteTask.isPending}
            >
              删除
            </Button>
          </div>
        )}
      </div>
      
      {/* 任务内容 */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* 状态 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">状态</label>
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <StatusSelect
                value={todo.status}
                onChange={handleStatusChange}
                disabled={updateStatus.isPending}
              />
            ) : (
              <StatusBadge status={todo.status} />
            )}
          </div>
          {statusUpdateError && (
            <p className="text-sm text-error">{statusUpdateError}</p>
          )}
        </div>
        
        {/* 内容 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">任务内容</label>
          
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:border-primary focus:ring-2 focus:ring-primary"
              />
              
              {updateError && (
                <div className="bg-error-light border border-error rounded-md p-3">
                  <p className="text-sm text-error">{updateError}</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={updateTask.isPending}
                >
                  保存
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={updateTask.isPending}
                >
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-base text-gray-900 whitespace-pre-wrap">
              {todo.content}
            </div>
          )}
        </div>
        
        {/* 元信息 */}
        <div className="grid grid-cols-2 gap-4 pt-6 border-t">
          <div>
            <p className="text-sm font-medium text-gray-700">创建者</p>
            <p className="mt-1 text-sm text-gray-900">
              {creatorUsername}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700">执行者</p>
            {isEditingAssignee ? (
              <div className="mt-1 space-y-2">
                <select
                  value={newAssigneeId || ''}
                  onChange={(e) => setNewAssigneeId(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                >
                  <option value="">未分配</option>
                  {members?.map((member: any) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.username || member.user?.username || '未知用户'}
                    </option>
                  ))}
                </select>
                {updateError && (
                  <div className="bg-error-light border border-error rounded-md p-2">
                    <p className="text-xs text-error">{updateError}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={async () => {
                      try {
                        setUpdateError('')
                        await updateTask.mutateAsync({ assigneeId: newAssigneeId })
                        setIsEditingAssignee(false)
                        setNewAssigneeId(undefined)
                      } catch (err: any) {
                        console.error('分配任务失败:', err)
                        
                       // 处理 403 权限错误
                       if (err?.response?.status === 403) {
                         setUpdateError('您没有权限分配此任务，只有任务创建者或执行者可以分配任务')
                        } else {
                          // 提取错误消息
                          const errorData = err?.response?.data
                          let errorMsg = '更新失败，请重试'
                          
                          if (errorData) {
                            // 新格式：{ code: 'ERROR', error: { message: '...' } }
                            if (errorData.error && errorData.error.message) {
                              errorMsg = errorData.error.message
                            } else if (errorData.message) {
                              errorMsg = errorData.message
                            } else if (errorData.error && typeof errorData.error === 'string') {
                              errorMsg = errorData.error
                            }
                          } else if (err?.message) {
                            errorMsg = err.message
                          }
                          
                          setUpdateError(errorMsg)
                        }
                      }
                    }}
                    loading={updateTask.isPending}
                  >
                    保存
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setIsEditingAssignee(false)
                      setNewAssigneeId(undefined)
                    }}
                    disabled={updateTask.isPending}
                  >
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <p className="text-sm text-gray-900">
                  {executorUsername}
                </p>
                {canEditAssignee ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingAssignee(true)
                      setNewAssigneeId(todo.assigneeId)
                    }}
                  >
                    编辑
                  </Button>
                ) : (
                  <span 
                    className="text-xs text-gray-500 relative group cursor-help"
                  >
                    仅创建者/执行者可编辑
                    {/* Tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-10 pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs rounded py-1.5 px-2.5 whitespace-nowrap shadow-lg">
                        只有任务创建者或执行者可以分配任务
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700">创建时间</p>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(todo.createdAt).toLocaleString('zh-CN')}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700">更新时间</p>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(todo.updatedAt).toLocaleString('zh-CN')}
            </p>
          </div>
        </div>
      </div>
      
      {/* 子任务 */}
      <div className="bg-white rounded-lg shadow p-6">
        <SubtaskList
          subtasks={todo.children || []}
          projectId={projectId}
          parentTaskId={todo.id}
          onCreateSubtask={handleCreateSubtask}
          onStatusChange={handleSubtaskStatusChange}
        />
      </div>

      {/* 状态历史 */}
      <div className="bg-white rounded-lg shadow p-6">
        {historyLoading ? (
          <div className="text-sm text-gray-500">加载状态历史中...</div>
        ) : (
          <StatusHistory history={history || []} />
        )}
      </div>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="删除任务"
        message={
          todo.children && todo.children.length > 0
            ? `确定要删除这个任务吗？此任务有 ${todo.children.length} 个子任务，删除后子任务也会被删除。`
            : '确定要删除这个任务吗？此操作不可撤销。'
        }
        confirmLabel="删除"
        cancelLabel="取消"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
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

function ParentTaskIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ProjectIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )
}

