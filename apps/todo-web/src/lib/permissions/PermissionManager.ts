/**
 * 权限管理器（单例模式）
 * 统一管理所有权限检查逻辑
 */

import { TaskPermission } from './modules/TaskPermission'
import { ProjectPermission } from './modules/ProjectPermission'

export class PermissionManager {
  private static instance: PermissionManager | null = null
  
  // 权限模块
  public readonly task: TaskPermission
  public readonly project: ProjectPermission
  
  private constructor() {
    this.task = new TaskPermission()
    this.project = new ProjectPermission()
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager()
    }
    return PermissionManager.instance
  }
  
  /**
   * 重置实例（主要用于测试）
   */
  public static resetInstance(): void {
    PermissionManager.instance = null
  }
}
