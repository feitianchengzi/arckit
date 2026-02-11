
/**
 * 待办详情页面（客户端组件）
 */

import { useState, useMemo } from 'react'
import type React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, LoadingView, ErrorView, StatusBadge, StatusSelect, ConfirmDialog } from '@/components/ui'
import { SubtaskList, StatusHistory, TagSelector, PrioritySelector, PriorityBadge, CreateTaskDialog, TagDisplay } from '@/components/features'
import { useTask, useUpdateTask, useDeleteTask, useUpdateTaskStatus } from '@/hooks/useTasks'
import { useTaskHistory } from '@/hooks/useHistory'
import { useProject, useProjectMembers } from '@/hooks/useProjects'
import { useAuthStore } from '@/store/authStore'
import type { TodoStatus } from '@/types'
import ReactMarkdown from 'react-markdown'
import { normalizeMarkdown } from '@/lib/utils/markdown'
import { permissionManager } from '@/lib/permissions'
import { isAssigneeUnassigned } from '@/lib/permissions/utils'
import type { TaskInfo } from '@/lib/permissions'
import { parseTaskTags } from '@/lib/utils/tagUtils'
import { useTagStore } from '@/store/tagStore'
import { buildProjectPath, decodeProjectId } from '@/lib/utils/projectRouting'

export default function TaskDetailPage() {
  const navigate = useNavigate()
  const params = useParams()
  const projectSlug = params.id ?? ''
  const decodedProjectId = decodeProjectId(projectSlug)
  const projectId = decodedProjectId ?? projectSlug
  const taskId = params.taskId!
  
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
  const [createSubtaskDialogOpen, setCreateSubtaskDialogOpen] = useState(false)
  
  const { data: members } = useProjectMembers(projectId)
  const currentUser = useAuthStore((state) => state.user)
  const { getProjectTags } = useTagStore()
  
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
  
  // 判断执行者是否未分配（用于显示和提示）
  const isAssigneeUnassignedLocal = !todo?.assigneeId || executorUsername === '未分配'
  
  // 权限检查：编辑任务内容
  // 当状态为"进行中"时，只有执行人、管理员、owner可以编辑
  // 非"进行中"的任何项目角色都可以编辑
  const canEditContent = useMemo(() => {
    if (!todo) return false
    const taskInfo: TaskInfo = {
      id: todo.id,
      creatorId: todo.creatorId,
      assigneeId: todo.assigneeId,
      status: todo.status,
      projectId: todo.projectId
    }
    const isProjectMember = !!currentUserMember
    return permissionManager.task.hasEditPermission(
      taskInfo,
      currentUserRole,
      currentUserId,
      isProjectMember
    )
  }, [todo, currentUserRole, currentUserId, currentUserMember])

  const canDelete = useMemo(() => {
    if (!todo) return false
    const isOwnerOrAdmin = currentUserRole === 'owner' || currentUserRole === 'admin'
    const isCreator = currentUserId !== null && currentUserId !== undefined && todo.creatorId === currentUserId
    return isOwnerOrAdmin || isCreator
  }, [todo, currentUserRole, currentUserId])
  
  // 权限检查：分配执行者
  // 规则：
  // - 当状态为"进行中"时，只有执行人、管理员、owner可以分配执行人
  // - 非"进行中"的任何项目角色都可以分配执行人
  const canEditAssignee = useMemo(() => {
    if (!todo) return false
    
    const taskInfo: TaskInfo = {
      id: todo.id,
      creatorId: todo.creatorId,
      assigneeId: todo.assigneeId,
      status: todo.status,
      projectId: todo.projectId
    }
    const isUnassigned = isAssigneeUnassigned(todo.assigneeId)
    const isProjectMember = !!currentUserMember
    
    return permissionManager.task.hasAssignAssigneePermission(
      taskInfo,
      currentUserRole,
      currentUserId,
      isUnassigned,
      isProjectMember
    )
  }, [todo, currentUserRole, currentUserId, currentUserMember])
  
  // 权限检查：修改状态
  // 当状态为"进行中"时，只有执行人、管理员、owner可以修改
  // 非"进行中"的任何项目角色都可以修改
  const canChangeStatus = useMemo(() => {
    if (!todo) return false
    const taskInfo: TaskInfo = {
      id: todo.id,
      creatorId: todo.creatorId,
      assigneeId: todo.assigneeId,
      status: todo.status,
      projectId: todo.projectId
    }
    const isProjectMember = !!currentUserMember
    return permissionManager.task.hasStatusChangePermission(
      taskInfo,
      currentUserRole,
      currentUserId,
      isProjectMember
    )
  }, [todo, currentUserRole, currentUserId, currentUserMember])
  
  // 权限检查：编辑优先级
  // 当状态为"进行中"时，只有执行人、管理员、owner可以编辑优先级
  // 非"进行中"的任何项目角色都可以编辑优先级
  const canEditPriority = useMemo(() => {
    if (!todo) return false
    const taskInfo: TaskInfo = {
      id: todo.id,
      creatorId: todo.creatorId,
      assigneeId: todo.assigneeId,
      status: todo.status,
      projectId: todo.projectId
    }
    const isProjectMember = !!currentUserMember
    return permissionManager.task.hasEditPriorityPermission(
      taskInfo,
      currentUserRole,
      currentUserId,
      isProjectMember
    )
  }, [todo, currentUserRole, currentUserId, currentUserMember])
  
  // 权限检查：编辑标签
  // 当状态为"进行中"时，只有执行人、管理员、owner可以编辑标签
  // 非"进行中"的任何项目角色都可以编辑标签
  const canEditTags = useMemo(() => {
    if (!todo) return false
    const taskInfo: TaskInfo = {
      id: todo.id,
      creatorId: todo.creatorId,
      assigneeId: todo.assigneeId,
      status: todo.status,
      projectId: todo.projectId
    }
    const isProjectMember = !!currentUserMember
    return permissionManager.task.hasEditTagsPermission(
      taskInfo,
      currentUserRole,
      currentUserId,
      isProjectMember
    )
  }, [todo, currentUserRole, currentUserId, currentUserMember])
  
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
      return // 状态未改变
    }
    
    // 权限检查：使用权限管理器检查是否有权限修改状态
    if (!canChangeStatus) {
      setStatusUpdateError('没有权限修改此任务的状态')
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
      navigate(buildProjectPath(projectId))
    } catch (err: any) {
      alert(err.response?.data?.message || '删除失败，请重试')
      setShowDeleteConfirm(false)
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="flex items-center gap-2 md:gap-3">
          {/* 返回按钮 */}
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="返回上一页"
            aria-label="返回上一页"
          >
            <BackIcon className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
          {/* 父任务图标（如果有） */}
          {parentTask && (
            <button
              onClick={() => navigate(buildProjectPath(projectId, `tasks/${parentTask.id}`))}
              className="text-gray-600 hover:text-gray-900 relative group min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="查看父任务"
            >
              <ParentTaskIcon className="w-5 h-5 md:w-6 md:h-6" />
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
            onClick={() => navigate(buildProjectPath(projectId))}
            className="text-gray-600 hover:text-gray-900 relative group min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="查看项目详情"
          >
            <ProjectIcon className="w-5 h-5 md:w-6 md:h-6" />
            {/* Tooltip */}
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
        
        {!isEditing && (canEditContent || canDelete) && (
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
      
      {/* 待办内容 */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* 状态、标签、优先级 - 一行显示 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* 状态 - 左侧 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 whitespace-nowrap">状态：</span>
              {!isEditing ? (
                <div className="relative group">
                  <StatusSelect
                    value={todo.status}
                    onChange={handleStatusChange}
                    disabled={updateStatus.isPending || !canChangeStatus}
                  />
                  {!canChangeStatus && todo.status === 'IN_PROGRESS' && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-10 pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs rounded py-1.5 px-2.5 whitespace-nowrap shadow-lg">
                        只有执行人、管理员或所有者可以修改"进行中"状态的任务
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <StatusBadge status={todo.status} />
              )}
            </div>
            
            {/* 标签和优先级 - 右侧 */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* 标签 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 whitespace-nowrap">标签：</span>
                {canEditTags ? (
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
                ) : (
                  <div className="flex items-center gap-1 flex-wrap">
                    {todo.tags ? (
                      parseTaskTags(todo.tags).map((tagId) => {
                        const tag = getProjectTags(projectId).find(t => t.id === tagId)
                        return tag ? <TagDisplay key={tagId} tag={tag} size="sm" /> : null
                      })
                    ) : (
                      <span className="text-sm text-gray-500">无标签</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* 优先级 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 whitespace-nowrap">优先级：</span>
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
                    disabled={updateTask.isPending || !canEditPriority}
                  />
                ) : (
                  <PriorityBadge value={todo.priority ?? null} />
                )}
              </div>
            </div>
          </div>
          {statusUpdateError && (
            <p className="text-sm text-error">{statusUpdateError}</p>
          )}
        </div>
        
        {/* 分割线 */}
        <div className="border-t border-gray-200"></div>
        
        {/* 内容 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">待办内容</h2>
            {!isEditing && canEditContent && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEdit}
                className="flex items-center gap-1.5"
              >
                <EditIcon className="w-4 h-4" />
                编辑
              </Button>
            )}
          </div>
          
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
              className="bg-gray-800 text-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto prose prose-invert prose-sm max-w-none"
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
              }}
            >
              <ReactMarkdown
                components={{
                  // 自定义样式组件
                  p: ({ children }: { children?: React.ReactNode }) => <p className="text-gray-100 mb-3 last:mb-0">{children}</p>,
                  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-xl font-bold text-gray-100 mb-3 mt-4 first:mt-0">{children}</h1>,
                  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-lg font-bold text-gray-100 mb-2 mt-4 first:mt-0">{children}</h2>,
                  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-base font-bold text-gray-100 mb-2 mt-3 first:mt-0">{children}</h3>,
                  code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) => 
                    inline ? (
                      <code className="bg-gray-700 text-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                    ) : (
                      <code className="block bg-gray-700 text-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto mb-3">{children}</code>
                    ),
                  pre: ({ children }: { children?: React.ReactNode }) => <pre className="bg-gray-700 text-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto mb-3">{children}</pre>,
                  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc list-inside mb-3 space-y-1 text-gray-100">{children}</ul>,
                  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-100">{children}</ol>,
                  li: ({ children }: { children?: React.ReactNode }) => <li className="text-gray-100">{children}</li>,
                  blockquote: ({ children }: { children?: React.ReactNode }) => <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-300 mb-3">{children}</blockquote>,
                  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold text-gray-100">{children}</strong>,
                  em: ({ children }: { children?: React.ReactNode }) => <em className="italic text-gray-100">{children}</em>,
                  hr: () => <hr className="border-gray-600 my-4" />,
                  table: ({ children }: { children?: React.ReactNode }) => <div className="overflow-x-auto mb-3"><table className="min-w-full border-collapse border border-gray-600">{children}</table></div>,
                  th: ({ children }: { children?: React.ReactNode }) => <th className="border border-gray-600 px-3 py-2 bg-gray-700 text-gray-100 font-semibold text-left">{children}</th>,
                  td: ({ children }: { children?: React.ReactNode }) => <td className="border border-gray-600 px-3 py-2 text-gray-100">{children}</td>,
                }}
              >
                {normalizeMarkdown(todo.content)}
              </ReactMarkdown>
            </div>
          )}
        </div>
        
        {/* 分割线 */}
        <div className="border-t border-gray-200"></div>
        
        {/* 元信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">创建者</h2>
            <p className="text-sm text-gray-700">
              {creatorUsername}
            </p>
          </div>
          
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">执行者</h2>
            {isEditingAssignee ? (
              <div className="space-y-2">
                <select
                  value={newAssigneeId || ''}
                  onChange={(e) => setNewAssigneeId(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                >
                  <option value="">未分配</option>
                  {Array.isArray(members) && members.map((member: any) => (
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
                       if (isAssigneeUnassignedLocal) {
                         setUpdateError('您没有权限分配此任务，只有项目成员可以分配未分配的任务')
                       } else {
                         setUpdateError('您没有权限分配此任务，只有任务创建者、执行者、项目管理员或所有者可以分配任务')
                       }
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
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-700">
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
                  todo.status === 'IN_PROGRESS' && (
                    <span 
                      className="text-xs text-gray-500 relative group cursor-help"
                    >
                      {isAssigneeUnassignedLocal ? '仅项目成员可编辑' : '仅创建者/执行者/管理员可编辑'}
                      {/* Tooltip */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-10 pointer-events-none">
                        <div className="bg-gray-900 text-white text-xs rounded py-1.5 px-2.5 whitespace-nowrap shadow-lg">
                          {isAssigneeUnassignedLocal 
                            ? '未分配状态时，任何项目成员都可以分配任务'
                            : '只有任务创建者、执行者、项目管理员或所有者可以分配任务'}
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </span>
                  )
                )}
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">创建时间</h2>
            <p className="text-sm text-gray-700">
              {new Date(todo.createdAt).toLocaleString('zh-CN')}
            </p>
          </div>
          
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">更新时间</h2>
            <p className="text-sm text-gray-700">
              {new Date(todo.updatedAt).toLocaleString('zh-CN')}
            </p>
          </div>
        </div>
      </div>
      
      {/* 子待办 */}
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
