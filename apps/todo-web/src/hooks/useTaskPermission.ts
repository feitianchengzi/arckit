/**
 * 任务权限检查 Hook
 * 提供便捷的任务权限检查功能
 */

import { useMemo } from 'react'
import { permissionManager } from '@/lib/permissions'
import { todoToTaskInfo, isAssigneeUnassigned } from '@/lib/permissions/utils'
import type { Todo } from '@/types'
import type { ProjectRole } from '@/lib/permissions'

/**
 * 任务权限检查结果
 */
export interface TaskPermissionResult {
  canEdit: boolean
  canDelete: boolean
  canChangeStatus: boolean
  canClaim: boolean
  canAssignAssignee: boolean
  canEditPriority: boolean
  canEditTags: boolean
}

/**
 * 任务权限检查 Hook
 * 
 * @param todo 待办任务
 * @param userRole 用户在项目中的角色
 * @param userId 当前用户ID
 * @param isProjectMember 是否是项目成员（默认为 true）
 * @returns 权限检查结果
 */
export function useTaskPermission(
  todo: Todo,
  userRole: ProjectRole | null,
  userId: number | null,
  isProjectMember: boolean = true
): TaskPermissionResult {
  return useMemo(() => {
    const taskInfo = todoToTaskInfo(todo)
    const isUnassigned = isAssigneeUnassigned(todo.assigneeId)
    
    return {
      // 基础权限
      canEdit: permissionManager.task.hasEditPermission(taskInfo, userRole, userId),
      canDelete: permissionManager.task.hasDeletePermission(taskInfo, userRole, userId),
      canChangeStatus: permissionManager.task.hasStatusChangePermission(taskInfo, userRole, userId),
      
      // 认领权限（新增）
      canClaim: permissionManager.task.hasClaimTaskPermission(
        taskInfo,
        userRole,
        userId,
        isProjectMember
      ),
      
      // 分配执行人权限（包括认领和重新分配）
      canAssignAssignee: permissionManager.task.hasAssignAssigneePermission(
        taskInfo,
        userRole,
        userId,
        isUnassigned,
        isProjectMember
      ),
      
      // 其他权限
      canEditPriority: permissionManager.task.hasEditPriorityPermission(taskInfo, userRole, userId),
      canEditTags: permissionManager.task.hasEditTagsPermission(taskInfo, userRole, userId),
    }
  }, [todo, userRole, userId, isProjectMember])
}
