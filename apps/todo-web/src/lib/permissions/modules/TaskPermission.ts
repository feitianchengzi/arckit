/**
 * 任务权限模块
 * 所有任务相关的权限检查函数
 */

import type { TaskInfo, ProjectRole } from '../types'

export class TaskPermission {
  /**
   * 检查是否可以修改任务状态
   * 
   * 规则：
   * - 当状态为"进行中"时，只有执行人、管理员、owner可以修改
   * - 非"进行中"的任何角色都可以修改（需要基本编辑权限）
   * 
   * @param taskInfo 任务信息
   * @param userRole 用户在项目中的角色
   * @param userId 当前用户ID
   * @returns 是否有权限
   */
  hasStatusChangePermission(
    taskInfo: TaskInfo,
    userRole: ProjectRole | null,
    userId: number | null
  ): boolean {
    // 基础检查
    if (!userId || !userRole) return false
    
    // 特殊规则：进行中状态需要特殊权限
    if (taskInfo.status === 'IN_PROGRESS') {
      return (
        taskInfo.assigneeId === userId ||
        userRole === 'admin' ||
        userRole === 'owner'
      )
    }
    
    // 非进行中状态：需要基本编辑权限
    return this.hasEditPermission(taskInfo, userRole, userId)
  }
  
  /**
   * 检查是否可以编辑任务内容
   * 
   * 规则：
   * - owner/admin 可以编辑任意任务
   * - member 只能编辑自己创建或分配给自己执行的任务
   * 
   * @param taskInfo 任务信息
   * @param userRole 用户在项目中的角色
   * @param userId 当前用户ID
   * @returns 是否有权限
   */
  hasEditPermission(
    taskInfo: TaskInfo,
    userRole: ProjectRole | null,
    userId: number | null
  ): boolean {
    if (!userId || !userRole) return false
    
    // owner/admin 可以编辑任意任务
    if (userRole === 'owner' || userRole === 'admin') {
      return true
    }
    
    // member 只能编辑自己创建或分配给自己执行的任务
    return (
      taskInfo.creatorId === userId ||
      taskInfo.assigneeId === userId
    )
  }
  
  /**
   * 检查是否可以删除任务
   * 
   * 规则：与编辑权限相同
   * 
   * @param taskInfo 任务信息
   * @param userRole 用户在项目中的角色
   * @param userId 当前用户ID
   * @returns 是否有权限
   */
  hasDeletePermission(
    taskInfo: TaskInfo,
    userRole: ProjectRole | null,
    userId: number | null
  ): boolean {
    return this.hasEditPermission(taskInfo, userRole, userId)
  }
  
  /**
   * 检查是否可以分配执行人
   * 
   * 规则：
   * - 如果执行人未分配（初始状态），任何项目成员都可以认领（不限制角色）
   * - 如果执行人已分配，只有以下角色可以重新设置执行人：
   *   - owner（所有者）
   *   - admin（管理员）
   *   - 当前执行人（执行者）
   *   - 创建人
   * 
   * @param taskInfo 任务信息
   * @param userRole 用户在项目中的角色（未分配时可以为null）
   * @param userId 当前用户ID
   * @param isAssigneeUnassigned 执行人是否未分配
   * @param isProjectMember 是否是项目成员（用于未分配时的检查，默认为true）
   * @returns 是否有权限
   */
  hasAssignAssigneePermission(
    taskInfo: TaskInfo,
    userRole: ProjectRole | null,
    userId: number | null,
    isAssigneeUnassigned: boolean,
    isProjectMember: boolean = true
  ): boolean {
    // 基础检查：必须有用户ID
    if (!userId) return false
    
    // 如果执行人未分配（初始状态），任何项目成员都可以认领
    if (isAssigneeUnassigned) {
      // 只需要是项目成员即可，不限制角色
      return isProjectMember
    }
    
    // 已分配时：需要检查角色和身份
    if (!userRole) return false
    
    // 只有以下角色可以重新设置执行人：
    // 1. owner（所有者）
    // 2. admin（管理员）
    // 3. 当前执行人（执行者）
    // 4. 创建人
    return (
      userRole === 'owner' ||
      userRole === 'admin' ||
      taskInfo.assigneeId === userId ||
      taskInfo.creatorId === userId
    )
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
    userRole: ProjectRole | null,
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
   * - owner/admin 可以编辑任意任务的优先级
   * - 创建人可以编辑自己创建的任务的优先级
   * 
   * @param taskInfo 任务信息
   * @param userRole 用户在项目中的角色
   * @param userId 当前用户ID
   * @returns 是否有权限
   */
  hasEditPriorityPermission(
    taskInfo: TaskInfo,
    userRole: ProjectRole | null,
    userId: number | null
  ): boolean {
    if (!userId || !userRole) return false
    
    // owner/admin 可以编辑任意任务的优先级
    if (userRole === 'owner' || userRole === 'admin') {
      return true
    }
    
    // 创建人可以编辑自己创建的任务的优先级
    return taskInfo.creatorId === userId
  }
  
  /**
   * 检查是否可以编辑标签
   * 
   * 规则：与编辑优先级权限相同
   * 
   * @param taskInfo 任务信息
   * @param userRole 用户在项目中的角色
   * @param userId 当前用户ID
   * @returns 是否有权限
   */
  hasEditTagsPermission(
    taskInfo: TaskInfo,
    userRole: ProjectRole | null,
    userId: number | null
  ): boolean {
    return this.hasEditPriorityPermission(taskInfo, userRole, userId)
  }
}
