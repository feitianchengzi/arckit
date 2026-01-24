/**
 * CreateTaskDialog - 创建待办对话框组件
 */

import { useState, useEffect } from 'react'
import { Dialog, Button, TextField, Avatar } from '@/components/ui'
import { TagSelector, PrioritySelector } from '@/components/features'
import { useCreateTask, useTaskList } from '@/hooks/useTasks'
import { useProjectMembers } from '@/hooks/useProjects'
import { useTagStore } from '@/store/tagStore'
import { buildTaskTags, parseTaskTags } from '@/lib/utils/tagUtils'
import { ChevronDownIcon } from '@/components/ui/icons'
import clsx from 'clsx'

export interface CreateTaskDialogProps {
  open: boolean
  onClose: () => void
  projectId: string
  parentId?: number // 父待办ID（可选，用于创建子待办）
  onSuccess?: (taskId: number) => void // 创建成功后的回调
}

export function CreateTaskDialog({
  open,
  onClose,
  projectId,
  parentId,
  onSuccess,
}: CreateTaskDialogProps) {
  const [content, setContent] = useState('')
  const [parentIdState, setParentIdState] = useState<number | undefined>(parentId)
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined)
  const [priority, setPriority] = useState<number | null>(null)
  const [tagsString, setTagsString] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isEditingAssignee, setIsEditingAssignee] = useState(false)
  
  const { data: tasks } = useTaskList(projectId)
  const { data: members } = useProjectMembers(projectId)
  const createTask = useCreateTask(projectId)
  const { loadProjectTags } = useTagStore()
  
  // 当parentId prop变化时，更新state（如果parentId存在，锁定为父待办）
  useEffect(() => {
    if (parentId !== undefined) {
      setParentIdState(parentId)
    }
  }, [parentId])
  
  // 加载项目标签
  useEffect(() => {
    if (open && projectId) {
      loadProjectTags(projectId).catch(console.error)
    }
  }, [open, projectId, loadProjectTags])
  
  // 重置表单
  useEffect(() => {
    if (!open) {
      setContent('')
      setParentIdState(parentId) // 保持parentId（如果存在）
      setAssigneeId(undefined)
      setPriority(null)
      setTagsString(null)
      setError('')
      setIsEditingAssignee(false)
    }
  }, [open, parentId])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // 验证
    if (!content.trim()) {
      setError('请输入待办内容')
      return
    }
    
    try {
      const newTask = await createTask.mutateAsync({
        content: content.trim(),
        projectId: parseInt(projectId),
        parentId: parentIdState,
        assigneeId: assigneeId,
        priority: priority !== null ? priority : undefined,
        tags: tagsString || undefined,
      })
      
      // 创建成功后调用回调
      if (onSuccess) {
        onSuccess(newTask.id)
      }
      
      // 关闭对话框
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || '创建失败，请重试')
    }
  }
  
  // 过滤掉当前任务及其子任务（避免循环引用）
  const availableParentTasks = tasks?.filter(task => {
    if (!parentIdState) return true
    // 如果正在编辑一个任务，不能选择自己作为父任务
    return task.id !== parentIdState
  }) || []
  
  // 如果传入了parentId，说明是创建子待办，需要锁定父待办选择器
  const isCreatingSubtask = parentId !== undefined && parentId !== null
  const parentTask = isCreatingSubtask ? tasks?.find(t => t.id === parentId) : null
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isCreatingSubtask ? "创建子待办" : "创建待办"}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 父待办选择（可选） */}
        {isCreatingSubtask ? (
          // 创建子待办：显示锁定的父待办信息
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              父待办
            </label>
            <div className={clsx(
              'w-full px-3 py-2 text-base',
              'border border-border rounded-md',
              'bg-surface-disabled text-foreground-secondary',
              'cursor-not-allowed'
            )}>
              {parentTask ? (
                <span>{parentTask.title || parentTask.content.substring(0, 50)}</span>
              ) : (
                <span>加载中...</span>
              )}
            </div>
            <p className="text-sm text-foreground-secondary">
              此待办将作为子待办创建，父待办已锁定
            </p>
          </div>
        ) : availableParentTasks.length > 0 ? (
          // 创建独立待办：显示可选择的父待办选择器
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              父待办（可选）
            </label>
            <select
              value={parentIdState || ''}
              onChange={(e) => setParentIdState(e.target.value ? parseInt(e.target.value) : undefined)}
              className={clsx(
                'w-full px-3 py-2 text-base',
                'border border-border rounded-md',
                'focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50',
                'transition-colors',
                'bg-surface-elevated text-foreground'
              )}
            >
              <option value="">无（创建独立待办）</option>
              {availableParentTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
            <p className="text-sm text-foreground-secondary">
              选择父待办后，此待办将作为子待办创建
            </p>
          </div>
        ) : null}

        {/* 分配给成员（可选） */}
        {members && members.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              分配给成员（可选）
            </label>
            <div className="flex items-center gap-2">
              {assigneeId !== undefined ? (
                <div className="flex items-center gap-2 flex-1">
                  <Avatar
                    user={{
                      username: members.find((m: any) => m.user_id === assigneeId)?.username || members.find((m: any) => m.user_id === assigneeId)?.user?.username || '未知用户',
                      avatar: members.find((m: any) => m.user_id === assigneeId)?.avatar || members.find((m: any) => m.user_id === assigneeId)?.user?.avatar
                    }}
                    size="sm"
                  />
                  <span className="text-sm text-foreground">
                    {members.find((m: any) => m.user_id === assigneeId)?.username || members.find((m: any) => m.user_id === assigneeId)?.user?.username || '未知用户'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditingAssignee) {
                        setIsEditingAssignee(false)
                      } else {
                        setIsEditingAssignee(true)
                      }
                    }}
                    className="p-1 rounded-md hover:bg-surface-hover transition-colors text-foreground-secondary hover:text-foreground flex-shrink-0 ml-0.5"
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
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm text-foreground-tertiary">未分配</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditingAssignee) {
                        setIsEditingAssignee(false)
                      } else {
                        setIsEditingAssignee(true)
                      }
                    }}
                    className="p-1 rounded-md hover:bg-surface-hover transition-colors text-foreground-secondary hover:text-foreground flex-shrink-0 ml-0.5"
                    aria-label={isEditingAssignee ? "收起" : "展开"}
                    title={isEditingAssignee ? "展开" : "收起"}
                  >
                    <ChevronDownIcon 
                      className={clsx(
                        "w-4 h-4 transition-transform",
                        isEditingAssignee && "transform rotate-180"
                      )} 
                    />
                  </button>
                </div>
              )}
            </div>
            {/* 成员选择区域 - 点击更换后展开 */}
            <div
              className={clsx(
                'transition-all duration-300 ease-in-out',
                isEditingAssignee ? 'max-h-[500px] opacity-100 mt-2 pt-2 border-t border-divider' : 'max-h-0 opacity-0'
              )}
              style={{ overflow: isEditingAssignee ? 'visible' : 'hidden' }}
            >
              <div className="flex flex-wrap gap-x-1 gap-y-1.5">
                {/* 成员列表 */}
                {members.map((member: any) => {
                  const memberId = member.user_id
                  const isSelected = assigneeId === memberId
                  const memberUsername = member.username || member.user?.username || '未知用户'
                  const memberAvatar = member.avatar || member.user?.avatar
                  
                  return (
                    <button
                      key={memberId}
                      type="button"
                      onClick={() => {
                        setAssigneeId(memberId)
                        setIsEditingAssignee(false)
                      }}
                      className={clsx(
                        "relative flex flex-col items-center gap-0.5 px-1 py-1 transition-all hover:shadow-lg bg-surface-elevated rounded border border-border shadow focus:outline-none focus:ring-0 w-[60px]",
                        isSelected && "ring-2 ring-primary"
                      )}
                    >
                      <Avatar
                        user={{
                          username: memberUsername,
                          avatar: memberAvatar
                        }}
                        size="sm"
                      />
                      <span className="text-[10px] text-foreground text-center truncate w-full" title={memberUsername}>{memberUsername}</span>
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg border border-white/50 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 优先级选择 */}
        <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              优先级（可选）
            </label>
          <PrioritySelector
            value={priority}
            onChange={setPriority}
          />
        </div>

        {/* 标签选择 */}
        <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              标签（可选）
            </label>
          <TagSelector
            projectId={projectId}
            currentTags={tagsString || undefined}
            onTagsChange={(newTagsString) => {
              setTagsString(newTagsString || null)
            }}
            showCreateButton={true}
            size="md"
          />
        </div>

        {/* 待办内容 */}
        <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              待办内容 <span className="text-error">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入待办内容..."
              rows={6}
              className={clsx(
                'w-full px-3 py-2 text-base',
                'border border-border rounded-md',
                'bg-surface-elevated text-foreground',
                'focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50',
                'transition-colors',
                'placeholder:text-foreground-tertiary',
                'resize-none'
              )}
              required
            />
            <p className="text-sm text-foreground-secondary">
              支持多行文本，前 50 个字符将作为待办标题
            </p>
        </div>
        
        {/* 错误提示 */}
        {error && (
          <div className="bg-error-light border border-error rounded-md p-3">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}
        
        {/* 按钮组 */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={createTask.isPending}
          >
            取消
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={createTask.isPending}
            disabled={createTask.isPending}
          >
            {createTask.isPending ? '创建中...' : '创建待办'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

