/**
 * TaskDetailContent - 待办详情内容组件
 * 可以在页面或抽屉中使用
 */

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Button, LoadingView, ErrorView, StatusBadge, StatusSelect, ConfirmDialog, Avatar } from '@/components/ui'
import { XIcon, ChevronDownIcon, TrashIcon } from '@/components/ui/icons'
import { SubtaskList, StatusHistory, TagSelector, PrioritySelector, PriorityBadge, CreateTaskDialog } from '@/components/features'
import { useTask, useUpdateTask, useDeleteTask, useUpdateTaskStatus } from '@/hooks/useTasks'
import { useTaskHistory } from '@/hooks/useHistory'
import { useProject, useProjectMembers } from '@/hooks/useProjects'
import { useAuthStore } from '@/store/authStore'
import type { TodoStatus } from '@/types'
import ReactMarkdown from 'react-markdown'
import clsx from 'clsx'

export interface TaskDetailContentProps {
  projectId: string
  taskId: string
  onDelete?: () => void // 删除后的回调
  showHeader?: boolean // 是否显示头部（返回按钮等）
  onClose?: () => void // 关闭回调（用于抽屉）
  parentTaskId?: number | null // 父任务ID（用于回退）
  onNavigateToSubtask?: (subtaskId: number) => void // 导航到子待办的回调
}

export function TaskDetailContent({ 
  projectId, 
  taskId, 
  onDelete,
  showHeader = true,
  onClose,
  parentTaskId,
  onNavigateToSubtask
}: TaskDetailContentProps) {
  const navigate = useNavigate()
  const { data: project } = useProject(projectId)
  const { data: todo, isLoading, error, refetch } = useTask(projectId, taskId)
  
  // 获取父任务信息（如果有）
  const parentTask = (todo as any)?.parentTask
  const { data: history, isLoading: historyLoading } = useTaskHistory(projectId, taskId)
  const updateTask = useUpdateTask(projectId, taskId)
  const deleteTask = useDeleteTask(projectId)
  const updateStatus = useUpdateTaskStatus(projectId)
  
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [updateError, setUpdateError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [statusUpdateError, setStatusUpdateError] = useState('')
  const [isEditingAssignee, setIsEditingAssignee] = useState(false)
  const [newAssigneeId, setNewAssigneeId] = useState<number | undefined>(undefined)
  const [isSavingAssignee, setIsSavingAssignee] = useState(false)
  const [createSubtaskDialogOpen, setCreateSubtaskDialogOpen] = useState(false)
  
  const { data: members } = useProjectMembers(projectId)
  const currentUser = useAuthStore((state) => state.user)
  
  // 从成员列表中查找创建者和执行者信息
  const creatorInfo = Array.isArray(members) ? members.find((m: any) => m.user_id === todo?.creatorId) : undefined
  const executorInfo = Array.isArray(members) ? members.find((m: any) => m.user_id === todo?.assigneeId) : undefined
  
  // 获取创建者和执行者的用户名
  const creatorUsername = todo?.creator?.username || creatorInfo?.username || creatorInfo?.user?.username || '未知'
  const executorUsername = todo?.assignee?.username || executorInfo?.username || executorInfo?.user?.username || '未分配'
  
  // 获取当前用户在项目中的角色（通过 is_me 字段）
  const currentUserMember = (members as any)?.find((m: any) => m.is_me === true)
  const currentUserRole = currentUserMember?.role || null
  const currentUserId = currentUserMember?.user_id || null
  
  // 检查当前用户是否是任务创建者或执行者（通过 user_id 比较，更可靠）
  const isCreator = todo?.creatorId !== undefined && todo?.creatorId !== null && currentUserId !== null && todo.creatorId === currentUserId
  const isAssignee = todo?.assigneeId !== undefined && todo?.assigneeId !== null && currentUserId !== null && todo.assigneeId === currentUserId
  
  // 判断执行者是否未分配
  const isAssigneeUnassigned = !todo?.assigneeId || executorUsername === '未分配'
  
  // 权限检查：编辑任务内容
  const canEditContent = currentUserRole === 'owner' || currentUserRole === 'admin' || isCreator || isAssignee
  
  // 权限检查：删除任务（创建者、执行者、管理员或所有者可以删除）
  const canDelete = currentUserRole === 'owner' || currentUserRole === 'admin' || isCreator || isAssignee
  
  // 权限检查：分配执行者
  const canEditAssignee = isAssigneeUnassigned 
    ? !!currentUserMember
    : (isCreator || isAssignee || currentUserRole === 'admin' || currentUserRole === 'owner')
  
  // 加载状态
  if (isLoading) {
    return <LoadingView size="lg" text="加载待办详情..." />
  }
  
  // 错误状态
  if (error || !todo) {
    return (
      <ErrorView
        title="加载失败"
        message="无法获取待办详情，请稍后重试"
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
      setUpdateError('待办内容不能为空')
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

  // 处理子待办状态变更
  const handleSubtaskStatusChange = async (subtaskId: number, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ taskId: subtaskId.toString(), status: newStatus })
    } catch (error) {
      console.error('更新子待办状态失败:', error)
    }
  }

  // 创建子待办
  const handleCreateSubtask = () => {
    setCreateSubtaskDialogOpen(true)
  }
  
  const handleCreateSubtaskSuccess = (newTaskId: number) => {
    // 创建成功后刷新任务详情
    refetch()
    setCreateSubtaskDialogOpen(false)
  }

  // 处理状态变更
  const handleStatusChange = async (newStatus: TodoStatus) => {
    setStatusUpdateError('')
    
    if (newStatus === todo.status) {
      return
    }
    
    try {
      await updateStatus.mutateAsync({ taskId, status: newStatus })
    } catch (err: any) {
      setStatusUpdateError(err.response?.data?.message || '状态更新失败，请重试')
    }
  }
  
  // 处理删除
  const handleDelete = async () => {
    try {
      await deleteTask.mutateAsync(taskId)
      if (onDelete) {
        onDelete()
      } else if (onClose) {
        onClose()
      } else {
        navigate(`/projects/${projectId}`)
      }
    } catch (err: any) {
      alert(err.response?.data?.message || '删除失败，请重试')
      setShowDeleteConfirm(false)
    }
  }
  
  return (
    <div className="space-y-4 md:space-y-6 p-6">
      {/* 页面头部 */}
      {showHeader && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 p-6 pb-4">
          <div className="flex items-center gap-2 md:gap-3">
            {/* 返回按钮 */}
            {onClose ? (
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-900 min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="关闭"
                aria-label="关闭"
              >
                <BackIcon className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            ) : (
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-900 min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="返回上一页"
                aria-label="返回上一页"
              >
                <BackIcon className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            )}
            
            {/* 父任务图标（如果有） */}
            {parentTask && (
              <button
                onClick={() => {
                  if (onClose) onClose()
                  navigate(`/projects/${projectId}/tasks/${parentTask.id}`)
                }}
                className="text-gray-600 hover:text-gray-900 relative group min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="查看父任务"
              >
                <ParentTaskIcon className="w-5 h-5 md:w-6 md:h-6" />
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
              onClick={() => {
                if (onClose) onClose()
                navigate(`/projects/${projectId}`)
              }}
              className="text-gray-600 hover:text-gray-900 relative group min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="查看项目详情"
            >
              <ProjectIcon className="w-5 h-5 md:w-6 md:h-6" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-10 pointer-events-none">
                <div className="bg-gray-900 text-white text-xs rounded py-1.5 px-2.5 whitespace-nowrap shadow-lg">
                  项目详情：{project?.name || '项目'}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </button>
            
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">待办详情</h1>
              {project && (
                <p className="mt-1 text-sm md:text-base text-gray-600">项目：{project.name}</p>
              )}
            </div>
          </div>
          
          {!isEditing && (
            <div className="flex gap-3">
              {canEditContent && (
                <Button
                  variant="secondary"
                  onClick={handleEdit}
                >
                  编辑
                </Button>
              )}
              
              {canDelete && (
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  loading={deleteTask.isPending}
                >
                  删除
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* 待办内容 */}
      <div className="bg-white rounded-lg border-t border-gray-200 p-6 space-y-4" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)' }}>
        {/* 创建者信息 - 左上方 */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-200">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar
              user={{
                username: creatorUsername,
                avatar: creatorInfo?.avatar || creatorInfo?.user?.avatar || todo?.creator?.avatar
              }}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900">
                {creatorUsername}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                创建于 {new Date(todo.createdAt).toLocaleString('zh-CN')}
              </div>
            </div>
          </div>
          {/* 操作按钮 - 放在最右侧 */}
          {!isEditing && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {canEditContent && (
                <button
                  onClick={handleEdit}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                  aria-label="编辑内容"
                  title="编辑内容"
                >
                  <EditIcon className="w-4 h-4" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleteTask.isPending}
                  className="p-2 rounded-md hover:bg-red-50 transition-colors text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="删除待办"
                  title="删除待办"
                >
                  {deleteTask.isPending ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <TrashIcon className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* 标签、优先级 - 一行显示 */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* 标签 */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-sm font-bold text-gray-900 whitespace-nowrap">
              <TagIcon className="w-4 h-4 text-gray-500" />
              标签：
            </span>
            <TagSelector
              projectId={projectId}
              currentTags={todo.tags}
              onTagsChange={async (tagsString: string) => {
                try {
                  await updateTask.mutateAsync({ tags: tagsString })
                } catch (err: any) {
                  console.error('更新标签失败:', err)
                  throw err
                }
              }}
              showCreateButton={true}
            />
          </div>
          
          {/* 优先级 */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-sm font-bold text-gray-900 whitespace-nowrap">
              <PriorityIcon className="w-4 h-4 text-gray-500" />
              优先级：
            </span>
            {!isEditing ? (
              <PrioritySelector
                value={todo.priority ?? null}
                onChange={async (priority) => {
                  try {
                    await updateTask.mutateAsync({ priority: priority ?? undefined })
                  } catch (err: any) {
                    console.error('更新优先级失败:', err)
                  }
                }}
                disabled={updateTask.isPending}
                size="sm"
              />
            ) : (
              <PriorityBadge value={todo.priority ?? null} size="sm" />
            )}
          </div>
        </div>
        
        {/* 内容 */}
        <div className="space-y-3">
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
            <div 
              className="bg-gray-100 text-gray-900 rounded p-4 max-h-96 overflow-y-auto prose prose-sm max-w-none"
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
              }}
            >
              <ReactMarkdown
                components={{
                  p: ({ children }: { children?: React.ReactNode }) => <p className="text-gray-900 mb-3 last:mb-0">{children}</p>,
                  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-xl font-bold text-gray-900 mb-3 mt-4 first:mt-0">{children}</h1>,
                  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-lg font-bold text-gray-900 mb-2 mt-4 first:mt-0">{children}</h2>,
                  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-base font-bold text-gray-900 mb-2 mt-3 first:mt-0">{children}</h3>,
                  code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) => 
                    inline ? (
                      <code className="bg-gray-200 text-gray-900 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                    ) : (
                      <code className="block bg-gray-200 text-gray-900 p-3 rounded text-sm font-mono overflow-x-auto mb-3">{children}</code>
                    ),
                  pre: ({ children }: { children?: React.ReactNode }) => <pre className="bg-gray-200 text-gray-900 p-3 rounded text-sm font-mono overflow-x-auto mb-3">{children}</pre>,
                  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc list-inside mb-3 space-y-1 text-gray-900">{children}</ul>,
                  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-900">{children}</ol>,
                  li: ({ children }: { children?: React.ReactNode }) => <li className="text-gray-900">{children}</li>,
                  blockquote: ({ children }: { children?: React.ReactNode }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 mb-3">{children}</blockquote>,
                  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => <a href={href} className="text-blue-600 hover:text-blue-700 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold text-gray-900">{children}</strong>,
                  em: ({ children }: { children?: React.ReactNode }) => <em className="italic text-gray-900">{children}</em>,
                  hr: () => <hr className="border-gray-300 my-4" />,
                  table: ({ children }: { children?: React.ReactNode }) => <div className="overflow-x-auto mb-3"><table className="min-w-full border-collapse border border-gray-300">{children}</table></div>,
                  th: ({ children }: { children?: React.ReactNode }) => <th className="border border-gray-300 px-3 py-2 bg-gray-200 text-gray-900 font-semibold text-left">{children}</th>,
                  td: ({ children }: { children?: React.ReactNode }) => <td className="border border-gray-300 px-3 py-2 text-gray-900">{children}</td>,
                }}
              >
                {todo.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        
        {/* 分割线 */}
        <div className="border-t border-gray-200"></div>
        
        {/* 元信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            {/* 执行人和状态选择器 - 同一行 */}
            <div className="flex items-center justify-between gap-4 w-full">
              {/* 执行人信息 - 左侧 */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Avatar
                    user={{
                      username: executorUsername,
                      avatar: executorInfo?.avatar || executorInfo?.user?.avatar || todo?.assignee?.avatar
                    }}
                    size="sm"
                  />
                  <p className="text-sm text-gray-700">
                    {executorUsername}
                  </p>
                  {canEditAssignee && (
                    <button
                      onClick={() => {
                        if (isEditingAssignee) {
                          setIsEditingAssignee(false)
                          setNewAssigneeId(undefined)
                          setUpdateError('')
                        } else {
                          setIsEditingAssignee(true)
                          setNewAssigneeId(todo.assigneeId)
                        }
                      }}
                      className="p-1 rounded-md hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900 flex-shrink-0 ml-0.5"
                      aria-label={isEditingAssignee ? "收起" : "展开"}
                      title={isEditingAssignee ? "收起" : "展开"}
                    >
                      <ChevronDownIcon 
                        className={clsx(
                          "w-4 h-4 transition-transform",
                          isEditingAssignee && "transform rotate-180"
                        )} 
                      />
                    </button>
                  )}
                </div>
                {!isEditingAssignee && !canEditAssignee && (
                  <span 
                    className="text-xs text-gray-500 relative group cursor-help"
                  >
                    {isAssigneeUnassigned ? '仅项目成员可编辑' : '仅创建者/执行者/管理员可编辑'}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-10 pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs rounded py-1.5 px-2.5 whitespace-nowrap shadow-lg">
                        {isAssigneeUnassigned 
                          ? '未分配状态时，任何项目成员都可以分配任务'
                          : '只有任务创建者、执行人、项目管理员或所有者可以分配任务'}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </span>
                )}
              </div>
              {/* 状态选择器 - 右侧 */}
              <div className="flex items-center gap-2 flex-shrink-0">
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
            </div>
            {statusUpdateError && (
              <p className="text-sm text-error mt-2">{statusUpdateError}</p>
            )}
            {updateError && (
              <p className="text-sm text-error mt-2">{updateError}</p>
            )}
            {/* 成员选择区域 - 点击更换后展开 */}
            <div
              className={clsx(
                'transition-all duration-300 ease-in-out',
                isEditingAssignee ? 'max-h-[500px] opacity-100 mt-4 pt-4 border-t border-gray-200' : 'max-h-0 opacity-0'
              )}
              style={{ overflow: isEditingAssignee ? 'visible' : 'hidden' }}
            >
              <div className="flex flex-wrap gap-x-1 gap-y-1.5">
                {/* 成员列表 */}
                {members?.map((member: any) => {
                  const memberId = member.user_id
                  const isSelected = newAssigneeId === memberId
                  const memberUsername = member.username || member.user?.username || '未知用户'
                  const memberAvatar = member.avatar || member.user?.avatar
                  
                  return (
                    <button
                      key={memberId}
                      type="button"
                      onClick={async () => {
                        // 如果正在保存或已选中，不处理
                        if (isSavingAssignee || isSelected) return
                        
                        // 如果点击的是当前选中的，不处理
                        if (newAssigneeId === memberId) return
                        
                        try {
                          setIsSavingAssignee(true)
                          setUpdateError('')
                          setNewAssigneeId(memberId)
                          await updateTask.mutateAsync({ assigneeId: memberId })
                          setIsEditingAssignee(false)
                        } catch (err: any) {
                          console.error('分配任务失败:', err)
                          
                          // 恢复之前的选择
                          setNewAssigneeId(todo.assigneeId)
                          
                          if (err?.response?.status === 403) {
                            if (isAssigneeUnassigned) {
                              setUpdateError('您没有权限分配此任务，只有项目成员可以分配未分配的任务')
                            } else {
                              setUpdateError('您没有权限分配此任务，只有任务创建者、执行人、项目管理员或所有者可以分配任务')
                            }
                          } else {
                            const errorData = err?.response?.data
                            let errorMsg = '更新失败，请重试'
                            
                            if (errorData) {
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
                        } finally {
                          setIsSavingAssignee(false)
                        }
                      }}
                      disabled={isSavingAssignee || updateTask.isPending}
                      className={clsx(
                        "relative flex flex-col items-center gap-0.5 px-1 py-1 transition-all hover:shadow-lg bg-white rounded border border-gray-200 shadow focus:outline-none focus:ring-0 w-[60px]",
                        (isSavingAssignee || updateTask.isPending) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Avatar
                        user={{
                          username: memberUsername,
                          avatar: memberAvatar
                        }}
                        size="sm"
                      />
                      <span className="text-[10px] text-gray-700 text-center truncate w-full" title={memberUsername}>{memberUsername}</span>
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/50 rounded border border-white/50 flex items-center justify-center">
                          {isSavingAssignee ? (
                            <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 子待办 */}
      <div className="bg-white rounded-lg border-t border-gray-200 p-6" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)' }}>
        <SubtaskList
          subtasks={todo.children || []}
          projectId={projectId}
          parentTaskId={todo.id}
          onCreateSubtask={handleCreateSubtask}
          onStatusChange={handleSubtaskStatusChange}
          onSubtaskClick={onNavigateToSubtask}
        />
      </div>

      {/* 状态历史 */}
      <div className="bg-white rounded-lg border-t border-gray-200 p-6" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)' }}>
        {historyLoading ? (
          <div className="text-sm text-gray-500">加载状态历史中...</div>
        ) : (
          <StatusHistory history={history || []} lastUpdatedAt={todo.updatedAt} />
        )}
      </div>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="删除待办"
        message={
          todo.children && todo.children.length > 0
            ? `确定要删除这个待办吗？此待办有 ${todo.children.length} 个子待办，删除后子待办也会被删除。`
            : '确定要删除这个待办吗？此操作不可撤销。'
        }
        confirmLabel="删除"
        cancelLabel="取消"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      
      {/* 创建子待办对话框 */}
      <CreateTaskDialog
        open={createSubtaskDialogOpen}
        onClose={() => setCreateSubtaskDialogOpen(false)}
        projectId={projectId}
        parentId={todo.id}
        onSuccess={handleCreateSubtaskSuccess}
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

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function ReplaceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  )
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  )
}

function PriorityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  )
}

// ==================== 执行人选择器组件 ====================

interface AssigneeSelectorProps {
  members: any[]
  value: number | undefined
  onChange: (value: number | undefined) => void
  onSave: () => Promise<void>
  onCancel: () => void
  error?: string
  loading?: boolean
}

function AssigneeSelector({ members, value, onChange, onSave, onCancel, error, loading }: AssigneeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const selectedMember = members.find((m: any) => m.user_id === value)
  const selectedUsername = selectedMember?.username || selectedMember?.user?.username || (value === undefined ? '未分配' : '未知用户')

  // 计算下拉菜单位置
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const menuHeight = Math.min(320, (members.length + 1) * 48 + 8) // 估算菜单高度
      const menuWidth = 280

      // 计算垂直位置：优先向下
      let top = buttonRect.bottom + 4
      if (top + menuHeight > viewportHeight) {
        top = buttonRect.top - menuHeight - 4
      }

      // 计算水平位置：优先左对齐
      let left = buttonRect.left
      if (left + menuWidth > viewportWidth) {
        left = viewportWidth - menuWidth - 8
      }
      if (left < 8) {
        left = 8
      }

      setMenuPosition({ top, left })
    } else {
      setMenuPosition(null)
    }
  }, [isOpen, members.length])

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2.5 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-w-[200px] justify-between h-8"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {value !== undefined ? (
              <>
                <Avatar
                  user={{
                    username: selectedMember?.username || selectedMember?.user?.username,
                    avatar: selectedMember?.avatar || selectedMember?.user?.avatar
                  }}
                  size="sm"
                />
                <span className="truncate">{selectedUsername}</span>
              </>
            ) : (
              <span className="text-gray-500">未分配</span>
            )}
          </div>
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          className="p-2 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="保存"
          title="保存"
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="p-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="取消"
          title="取消"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="mt-2 bg-error-light border border-error rounded-md p-2">
          <p className="text-xs text-error">{error}</p>
        </div>
      )}

      {isOpen && menuPosition && createPortal(
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={menuRef}
            className="fixed z-[101] w-[280px] bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-80 overflow-auto"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            <button
              type="button"
              onClick={() => {
                onChange(undefined)
                setIsOpen(false)
              }}
              className={clsx(
                'w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-gray-100 transition-colors text-sm',
                value === undefined && 'bg-gray-50',
                'border-b-0'
              )}
              style={{ borderBottom: 'none' }}
            >
              <span className="text-sm text-gray-500">未分配</span>
            </button>
            {members.map((member: any) => {
              const memberUsername = member.username || member.user?.username || '未知用户'
              const isSelected = member.user_id === value
              return (
                <button
                  key={member.user_id}
                  type="button"
                  onClick={() => {
                    onChange(member.user_id)
                    setIsOpen(false)
                  }}
                  className={clsx(
                    'w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-gray-100 transition-colors text-sm',
                    isSelected && 'bg-gray-50'
                  )}
                  style={{ borderBottom: 'none' }}
                >
                  <Avatar
                    user={{
                      username: memberUsername,
                      avatar: member.avatar || member.user?.avatar
                    }}
                    size="sm"
                  />
                  <span className="text-sm text-gray-900 flex-1">{memberUsername}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

