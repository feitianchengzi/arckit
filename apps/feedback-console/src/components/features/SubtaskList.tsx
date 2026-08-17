'use client'

/**
 * SubtaskList - 子待办列表组件
 */

import { useNavigate } from 'react-router-dom'
import { TodoItem } from './TodoItem'
import { Button, EmptyStateView } from '@/components/ui'
import type { Todo, ProjectMember } from '@/types'

export interface SubtaskListProps {
  subtasks: Todo[]
  projectId: string
  parentTaskId: number
  onCreateSubtask?: () => void
  onStatusChange?: (todoId: number, newStatus: string) => void
  onSubtaskClick?: (subtaskId: number) => void
  members?: ProjectMember[] // 项目成员列表
  currentUserId?: number | null // 当前用户的 user_id
  currentUserRole?: 'owner' | 'admin' | 'member' | null // 当前用户在项目中的角色
  canAssignAssignee?: boolean // 是否可以分配执行人
  onUpdateAssignee?: (taskId: number, assigneeId: number | null) => Promise<void> // 更新执行人的回调
  canEditPriority?: boolean // 是否可以编辑优先级
  onUpdatePriority?: (taskId: number, priority: number | null) => Promise<void> // 更新优先级的回调
  canEditTags?: boolean // 是否可以编辑标签
  onUpdateTags?: (taskId: number, tagsString: string) => Promise<void> // 更新标签的回调
}

export function SubtaskList({
  subtasks,
  projectId,
  parentTaskId,
  onCreateSubtask,
  onStatusChange,
  onSubtaskClick,
  members = [],
  currentUserId = null,
  currentUserRole = null,
  canAssignAssignee = false,
  onUpdateAssignee,
  canEditPriority = false,
  onUpdatePriority,
  canEditTags = false,
  onUpdateTags,
}: SubtaskListProps) {
  const navigate = useNavigate()

  if (!subtasks || subtasks.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">子待办</h3>
          {onCreateSubtask && (
            <Button
              variant="primary"
              size="sm"
              onClick={onCreateSubtask}
            >
              创建子待办
            </Button>
          )}
        </div>
        
        <EmptyStateView
          title="还没有子待办"
          message="创建第一个子待办来分解待办"
          actionLabel="创建子待办"
          onAction={onCreateSubtask}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          子待办 ({subtasks.length})
        </h3>
        {onCreateSubtask && (
          <Button
            variant="primary"
            size="sm"
            onClick={onCreateSubtask}
          >
            创建子待办
          </Button>
        )}
      </div>
      
      <div className="space-y-2 pl-4 border-l-2 border-divider">
        {subtasks.map((subtask) => (
          <TodoItem
            key={subtask.id}
            todo={subtask}
            projectId={projectId}
            onStatusChange={onStatusChange}
            onClick={onSubtaskClick ? () => onSubtaskClick(subtask.id) : undefined}
            className="ml-0"
            members={members}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            canAssignAssignee={canAssignAssignee}
            onUpdateAssignee={onUpdateAssignee}
            canEditPriority={canEditPriority}
            onUpdatePriority={onUpdatePriority}
            canEditTags={canEditTags}
            onUpdateTags={onUpdateTags}
          />
        ))}
      </div>
    </div>
  )
}



