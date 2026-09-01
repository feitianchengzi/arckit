/**
 * 项目权限模块
 * 所有项目相关的权限检查函数
 */

import type { ProjectRole } from '../types'

export class ProjectPermission {
  /**
   * 检查是否可以添加成员
   * 
   * 规则：
   * - owner/admin 可以添加成员
   * - member 不能添加成员
   * 
   * @param userRole 用户在项目中的角色
   * @returns 是否有权限
   */
  hasAddMemberPermission(userRole: ProjectRole | null): boolean {
    return userRole === 'owner' || userRole === 'admin'
  }
  
  /**
   * 检查是否可以管理项目
   * 
   * 规则：
   * - owner/admin 可以管理项目
   * - member 不能管理项目
   * 
   * @param userRole 用户在项目中的角色
   * @returns 是否有权限
   */
  hasManagePermission(userRole: ProjectRole | null): boolean {
    return userRole === 'owner' || userRole === 'admin'
  }
  
  /**
   * 检查是否可以删除项目
   * 
   * 规则：
   * - 只有 owner 可以删除项目
   * - admin/member 不能删除项目
   * 
   * @param userRole 用户在项目中的角色
   * @returns 是否有权限
   */
  hasDeleteProjectPermission(userRole: ProjectRole | null): boolean {
    return userRole === 'owner'
  }
}
