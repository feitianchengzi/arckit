/**
 * 权限管理模块导出入口
 */

import { PermissionManager } from './PermissionManager'

// 导出单例实例
export const permissionManager = PermissionManager.getInstance()

// 导出类型
export type { 
  TaskInfo, 
  UserContext, 
  PermissionContext, 
  ClaimTaskContext,
  ProjectRole 
} from './types'

// 导出管理器类（用于测试或特殊场景）
export { PermissionManager }

// 导出权限模块类（用于测试或特殊场景）
export { TaskPermission } from './modules/TaskPermission'
export { ProjectPermission } from './modules/ProjectPermission'
