/**
 * 任务权限模块
 * 所有任务相关的权限检查函数
 */

import type { TaskInfo, ProjectRole } from '../types'

export class TaskPermission {
  /**
   * 检查在 IN_PROGRESS 状态下是否有权限操作
   * 只有 管理员/owner/执行人 可以操作
   * 
   * @param taskInfo 任务信息
   * @param userRole 用户在项目中的角色
   * @param userId 当前用户ID
   * @returns 是否有权限
   */
  private hasInProgressPermission(
    taskInfo: TaskInfo,
    userRole: ProjectRole | null,
    userId: number | null
  ): boolean {
    if (!userId || !userRole) return false
    
    return (
      taskInfo.assigneeId === userId ||
      userRole === 'admin' ||
      userRole === 'owner'
    )
  }
  
  /**
   * 检查是否可以修改任务状态
   * 
   * 规则：
   * - 当状态为"进行中"时，只有执行人、管理员、owner可以修改
   * - 非"进行中"的任何项目角色都可以修改
   * 
   * @param taskInfo 任务信息
   * @param userRole 用户在项目中的角色
   * @param userId 当前用户ID
   * @param isProjectMember 是否是项目成员（用于非进行中状态的检查，默认为true）
   * @returns 是否有权限
   */
  hasStatusChangePermission(
    taskInfo: TaskInfo,
    userRole: ProjectRole | null,
    userId: number | null,
    isProjectMember: boolean = true
  ): boolean {
    // 基础检查
    if (!userId) return false
    
    // 特殊规则：进行中状态需要特殊权限
    if (taskInfo.status === 'IN_PROGRESS') {
      return this.hasInProgressPermission(taskInfo, userRole, userId)
    }
    
    // 非进行中状态：任何项目角色都可以修改
    return isProjectMember
  }
  
  /**
   * 检查是否可以编辑任务内容
   * 
   * 规则：
   * - 当状态为"进行中"时，只有执行人、管理员、owner可以编辑
   * - 非"进行中"的任何项目角色都可以编辑
   * 
   * @param taskInfo 任务信息
   * @param userRole 用户在项目中的角色
   * @param userId 当前用户ID
   * @param isProjectMember 是否是项目成员（用于非进行中状态的检查，默认为true）
   * @returns 是否有权限
   */
  hasEditPermission(
    taskInfo: TaskInfo,
    userRole: ProjectRole | null,
    userId: number | null,
    isProjectMember: boolean = true
  ): boolean {
    if (!userId) return false
    
    // 特殊规则：进行中状态需要特殊权限
    if (taskInfo.status === 'IN_PROGRESS') {
      return this.hasInProgressPermission(taskInfo, userRole, userId)
    }
    
    // 非进行中状态：任何项目角色都可以编辑
    return isProjectMember
  }
  
  /**
   * 检查是否可以删除任务
   * 
   * 规则：
   * - 当状态为"进行中"时，只有执行人、管理员、owner可以删除
   * - 非"进行中"的任何项目角色都可以删除
   * 
   * @param taskInfo 任务信息
   * @param userRole 用户在项目中的角色
   * @param userId 当前用户ID
   * @param isProjectMember 是否是项目成员（用于非进行中状态的检查，默认为true）
   * @returns 是否有权限
   */
  hasDeletePermission(
    taskInfo: TaskInfo,
    userRole: ProjectRole | null,
    userId: number | null,
    isProjectMember: boolean = true
  ): boolean {
    // 基础检查：必须有用户ID
    if (!userId) return false
    
    // 特殊规则：进行中状态需要特殊权限检查
    if (taskInfo.status === 'IN_PROGRESS') {
      return this.hasInProgressPermission(taskInfo, userRole, userId)
    }
    
    // 非进行中状态：任何项目角色都可以删除
    return isProjectMember
  }
  
  /**
   * 检查是否可以分配执行人
   * 
   * 规则：
   * - 当状态为"进行中"时，只有执行人、管理员、owner可以分配执行人
   * - 非"进行中"的任何项目角色都可以分配执行人
   * 
   * @param taskInfo 任务信息
   * @param userRole 用户在项目中的角色
   * @param userId 当前用户ID
   * @param isAssigneeUnassigned 执行人是否未分配（已废弃，保留以兼容旧代码）
   * @param isProjectMember 是否是项目成员（用于非进行中状态的检查，默认为true）
   * @returns 是否有权限
   */
  hasAssignAssigneePermission(
    taskInfo: TaskInfo,
    userRole: ProjectRole | null,
    userId: number | null,
    _isAssigneeUnassigned: boolean, // 保留参数以兼容旧代码，但不再使用
    isProjectMember: boolean = true
  ): boolean {
    // 基础检查：必须有用户ID
    if (!userId) return false
    
    // 特殊规则：进行中状态需要特殊权限
    if (taskInfo.status === 'IN_PROGRESS') {
      return this.hasInProgressPermission(taskInfo, userRole, userId)
    }
    
    // 非进行中状态：任何项目角色都可以分配执行人
    return isProjectMember
  }
  
  /**
   * 检查是否可以认领待办（将自己设置为执行人）
   * 
   * 规则：
   * - 当待办处于未分配状态时，任何项目成员都可以认领
   * - 已分配的待办不能认领（但可以通过分配功能重新分配）
   * 
   * @param taskInfo 任务信息
   * @param userRole 用户在项目中的角色（可以为null，只要用户是项目成员即可）
   * @param userId 当前用户ID
   * @param isProjectMember 是否是项目成员（用于判断是否有基本权限）
   * @returns 是否有权限认领
   */
  hasClaimTaskPermission(
    taskInfo: TaskInfo,
    _userRole: ProjectRole | null, // 保留参数以兼容旧代码，但不再使用
    userId: number | null,
    isProjectMember: boolean = true
  ): boolean {
    // 基础检查：必须是项目成员且有用户ID
    if (!userId || !isProjectMember) {
      return false
    }
    
    // 核心规则：只有未分配的待办才能被认领
    const isUnassigned = !taskInfo.assigneeId || taskInfo.assigneeId === null
    
    if (!isUnassigned) {
      // 已分配的待办不能认领（但可以通过分配功能重新分配）
      return false
    }
    
    // 未分配的待办：任何项目成员都可以认领（不限制角色）
    return true
  }
  
  /**
   * 检查是否可以编辑优先级
   * 
   * 规则：
   * - 当状态为"进行中"时，只有执行人、管理员、owner可以编辑优先级
   * - 非"进行中"的任何项目角色都可以编辑优先级
   * 
   * @param taskInfo 任务信息
   * @param userRole 用户在项目中的角色
   * @param userId 当前用户ID
   * @param isProjectMember 是否是项目成员（用于非进行中状态的检查，默认为true）
   * @returns 是否有权限
   */
  hasEditPriorityPermission(
    taskInfo: TaskInfo,
    userRole: ProjectRole | null,
    userId: number | null,
    isProjectMember: boolean = true
  ): boolean {
    if (!userId) return false
    
    // 特殊规则：进行中状态需要特殊权限
    if (taskInfo.status === 'IN_PROGRESS') {
      return this.hasInProgressPermission(taskInfo, userRole, userId)
    }
    
    // 非进行中状态：任何项目角色都可以编辑优先级
    return isProjectMember
  }
  
  /**
   * 检查是否可以编辑标签
   * 
   * 规则：
   * - 当状态为"进行中"时，只有执行人、管理员、owner可以编辑标签
   * - 非"进行中"的任何项目角色都可以编辑标签
   * 
   * @param taskInfo 任务信息
   * @param userRole 用户在项目中的角色
   * @param userId 当前用户ID
   * @param isProjectMember 是否是项目成员（用于非进行中状态的检查，默认为true）
   * @returns 是否有权限
   */
  hasEditTagsPermission(
    taskInfo: TaskInfo,
    userRole: ProjectRole | null,
    userId: number | null,
    isProjectMember: boolean = true
  ): boolean {
    return this.hasEditPriorityPermission(taskInfo, userRole, userId, isProjectMember)
  }
  
  /**
   * 检查是否可以创建评论
   * 
   * 规则：任何项目成员都可以创建评论
   * 
   * @param isProjectMember 是否是项目成员
   * @returns 是否有权限
   */
  hasCreateCommentPermission(
    isProjectMember: boolean
  ): boolean {
    return isProjectMember
  }
  
  /**
   * 检查是否可以编辑评论
   * 
   * 规则：只有评论创建者可以编辑自己的评论
   * 
   * @param commentCreatorId 评论创建者ID
   * @param userId 当前用户ID
   * @returns 是否有权限
   */
  hasEditCommentPermission(
    commentCreatorId: number | null | undefined,
    userId: number | null
  ): boolean {
    if (!userId || !commentCreatorId) return false
    return commentCreatorId === userId
  }
  
  /**
   * 检查是否可以删除评论
   * 
   * 规则：
   * - 评论创建者可以删除自己的评论
   * - 任务创建者可以删除任务下的任何评论
   * - 项目管理员/所有者可以删除任务下的任何评论
   * 
   * @param commentCreatorId 评论创建者ID
   * @param taskInfo 任务信息
   * @param userRole 用户在项目中的角色
   * @param userId 当前用户ID
   * @returns 是否有权限
   */
  hasDeleteCommentPermission(
    commentCreatorId: number | null | undefined,
    taskInfo: TaskInfo,
    userRole: ProjectRole | null,
    userId: number | null
  ): boolean {
    if (!userId || !commentCreatorId) return false
    
    // 评论创建者可以删除
    if (commentCreatorId === userId) return true
    
    // 任务创建者可以删除
    if (taskInfo.creatorId === userId) return true
    
    // 管理员/所有者可以删除
    if (userRole === 'admin' || userRole === 'owner') return true
    
    return false
  }
}
