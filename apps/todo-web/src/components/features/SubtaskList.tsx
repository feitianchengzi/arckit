'use client'

/**
 * SubtaskList - 子任务列表组件
 */

import { useNavigate } from 'react-router-dom'
import { TodoItem } from './TodoItem'
import { Button, EmptyStateView } from '@/components/ui'
import type { Todo } from '@/types'

export interface SubtaskListProps {
  subtasks: Todo[]
  projectId: string
  parentTaskId: number
  onCreateSubtask?: () => void
  onStatusChange?: (todoId: number, newStatus: string) => void
}

export function SubtaskList({
  subtasks,
  projectId,
  parentTaskId,
  onCreateSubtask,
  onStatusChange,
}: SubtaskListProps) {
  const navigate = useNavigate()

  if (!subtasks || subtasks.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">子任务</h3>
          {onCreateSubtask && (
            <Button
              variant="primary"
              size="sm"
              onClick={onCreateSubtask}
            >
              创建子任务
            </Button>
          )}
        </div>
        
        <EmptyStateView
          title="还没有子任务"
          message="创建第一个子任务来分解任务"
          actionLabel="创建子任务"
          onAction={onCreateSubtask}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          子任务 ({subtasks.length})
        </h3>
        {onCreateSubtask && (
          <Button
            variant="primary"
            size="sm"
            onClick={onCreateSubtask}
          >
            创建子任务
          </Button>
        )}
      </div>
      
      <div className="space-y-2 pl-4 border-l-2 border-gray-200">
        {subtasks.map((subtask) => (
          <TodoItem
            key={subtask.id}
            todo={subtask}
            projectId={projectId}
            onStatusChange={onStatusChange}
            className="ml-0"
          />
        ))}
      </div>
    </div>
  )
}



