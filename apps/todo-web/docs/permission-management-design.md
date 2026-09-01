# 权限管理架构设计方案

## 一、设计目标

1. **统一管理**：所有权限检查逻辑集中在一个地方，避免重复代码
2. **结构化组织**：按功能模块划分（Task、Project等），便于维护
3. **易于扩展**：新增权限只需添加函数，不影响现有代码
4. **类型安全**：充分利用 TypeScript 的类型检查
5. **单例模式**：全局唯一实例，确保权限逻辑一致性

## 二、架构设计

### 2.1 目录结构

```
frontend/src/lib/permissions/
├── index.ts                    # 导出入口，单例实例
├── PermissionManager.ts        # 权限管理器主类（单例）
├── types.ts                    # 权限相关的类型定义
├── modules/
│   ├── TaskPermission.ts      # 任务相关权限模块
│   ├── ProjectPermission.ts    # 项目相关权限模块
│   └── MemberPermission.ts    # 成员相关权限模块（可选）
└── utils.ts                    # 权限检查的辅助工具函数
```

### 2.2 核心设计

#### 类型定义 (types.ts)

```typescript
// 项目角色
export type ProjectRole = 'owner' | 'admin' | 'member'

// 任务信息（用于权限检查）
export interface TaskInfo {
  id: number
  creatorId: number
  assigneeId?: number | null  // null 或 undefined 表示未分配
  status: TodoStatus
  projectId: number
}

// 用户上下文（当前用户信息）
export interface UserContext {
  userId: number | null
  role: ProjectRole | null
}

// 权限检查上下文
export interface PermissionContext {
  task?: TaskInfo
  user: UserContext
  projectId?: string | number
}

// 认领待办的上下文信息
export interface ClaimTaskContext {
  taskInfo: TaskInfo
  userId: number
  isProjectMember: boolean
  userRole?: ProjectRole | null  // 可选，认领不依赖角色
}
```

## 三、权限模块详细设计

### 3.1 任务权限模块 (TaskPermission.ts)

#### 3.1.1 修改任务状态权限

**函数名**：`hasStatusChangePermission`

**规则**：
- 当状态为 `IN_PROGRESS`（进行中）时：
  - ✅ 执行人（assignee）可以修改
  - ✅ 管理员（admin）可以修改
  - ✅ 所有者（owner）可以修改
  - ❌ 其他角色不能修改
- 当状态不是 `IN_PROGRESS` 时：
  - ✅ 任何有基本编辑权限的角色都可以修改

**函数签名**：
```typescript
hasStatusChangePermission(
  taskInfo: TaskInfo,
  userRole: ProjectRole | null,
  userId: number | null
): boolean
```

#### 3.1.2 编辑任务内容权限

**函数名**：`hasEditPermission`

**规则**：
- ✅ owner/admin 可以编辑任意任务
- ✅ member 只能编辑自己创建或分配给自己执行的任务

**函数签名**：
```typescript
hasEditPermission(
  taskInfo: TaskInfo,
  userRole: ProjectRole | null,
  userId: number | null
): boolean
```

#### 3.1.3 删除任务权限

**函数名**：`hasDeletePermission`

**规则**：
- 与编辑权限相同（创建者、执行者、管理员或所有者可以删除）

**函数签名**：
```typescript
hasDeletePermission(
  taskInfo: TaskInfo,
  userRole: ProjectRole | null,
  userId: number | null
): boolean
```

#### 3.1.4 分配执行人权限

**函数名**：`hasAssignAssigneePermission`

**规则**：
- 如果执行人未分配：
  - ✅ 任何项目成员都可以分配（包括认领）
- 如果执行人已分配：
  - ✅ 创建人可以重新分配
  - ✅ 执行人可以重新分配
  - ✅ 管理员（admin）可以重新分配
  - ✅ 所有者（owner）可以重新分配
  - ❌ 普通成员（member）不能重新分配

**函数签名**：
```typescript
hasAssignAssigneePermission(
  taskInfo: TaskInfo,
  userRole: ProjectRole | null,
  userId: number | null,
  isAssigneeUnassigned: boolean
): boolean
```

#### 3.1.5 认领待办权限 ⭐ 新增

**函数名**：`hasClaimTaskPermission`

**规则**：
- ✅ 待办未分配 + 是项目成员 → 任何角色都可以认领
- ❌ 待办已分配 → 不能认领（但可以通过分配功能重新分配）
- ❌ 不是项目成员 → 不能认领

**说明**：
- 认领是指：当待办处于未分配状态时，任何项目成员都可以将自己设置为执行人
- 这是一个主动操作，与"分配执行人"（被动操作）不同

**函数签名**：
```typescript
hasClaimTaskPermission(
  taskInfo: TaskInfo,
  userRole: ProjectRole | null,
  userId: number | null,
  isProjectMember: boolean = true
): boolean
```

#### 3.1.6 编辑优先级权限

**函数名**：`hasEditPriorityPermission`

**规则**：
- ✅ owner/admin 可以编辑任意任务的优先级
- ✅ 创建人可以编辑自己创建的任务的优先级

**函数签名**：
```typescript
hasEditPriorityPermission(
  taskInfo: TaskInfo,
  userRole: ProjectRole | null,
  userId: number | null
): boolean
```

#### 3.1.7 编辑标签权限

**函数名**：`hasEditTagsPermission`

**规则**：
- 与编辑优先级权限相同

**函数签名**：
```typescript
hasEditTagsPermission(
  taskInfo: TaskInfo,
  userRole: ProjectRole | null,
  userId: number | null
): boolean
```

### 3.2 项目权限模块 (ProjectPermission.ts)

#### 3.2.1 添加成员权限

**函数名**：`hasAddMemberPermission`

**规则**：
- ✅ owner/admin 可以添加成员
- ❌ member 不能添加成员

**函数签名**：
```typescript
hasAddMemberPermission(userRole: ProjectRole | null): boolean
```

#### 3.2.2 管理项目权限

**函数名**：`hasManagePermission`

**规则**：
- ✅ owner/admin 可以管理项目
- ❌ member 不能管理项目

**函数签名**：
```typescript
hasManagePermission(userRole: ProjectRole | null): boolean
```

#### 3.2.3 删除项目权限

**函数名**：`hasDeleteProjectPermission`

**规则**：
- ✅ 只有 owner 可以删除项目
- ❌ admin/member 不能删除项目

**函数签名**：
```typescript
hasDeleteProjectPermission(userRole: ProjectRole | null): boolean
```

## 四、权限管理器主类 (PermissionManager.ts)

```typescript
import { TaskPermission } from './modules/TaskPermission'
import { ProjectPermission } from './modules/ProjectPermission'
import type { TaskInfo, ProjectRole } from './types'

/**
 * 权限管理器（单例模式）
 * 统一管理所有权限检查逻辑
 */
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
```

## 五、导出入口 (index.ts)

```typescript
import { PermissionManager } from './PermissionManager'

// 导出单例实例
export const permissionManager = PermissionManager.getInstance()

// 导出类型
export type { TaskInfo, UserContext, PermissionContext, ClaimTaskContext } from './types'
export type { ProjectRole } from './types'

// 导出管理器类（用于测试或特殊场景）
export { PermissionManager }
```

## 六、使用方式

### 6.1 在组件中使用

```typescript
import { permissionManager } from '@/lib/permissions'
import type { TaskInfo } from '@/lib/permissions'

// 在组件中
const canChangeStatus = permissionManager.task.hasStatusChangePermission(
  {
    id: todo.id,
    creatorId: todo.creatorId,
    assigneeId: todo.assigneeId,
    status: todo.status,
    projectId: todo.projectId
  },
  currentUserRole,
  currentUserId
)

// 检查认领权限
const canClaim = permissionManager.task.hasClaimTaskPermission(
  {
    id: todo.id,
    creatorId: todo.creatorId,
    assigneeId: todo.assigneeId,
    status: todo.status,
    projectId: todo.projectId
  },
  currentUserRole,
  currentUserId,
  !!currentUserMember  // 是否是项目成员
)
```

### 6.2 创建 Helper Hook

```typescript
// hooks/useTaskPermission.ts
import { useMemo } from 'react'
import { permissionManager } from '@/lib/permissions'
import type { Todo } from '@/types'
import type { ProjectRole } from '@/lib/permissions'

export function useTaskPermission(
  todo: Todo,
  userRole: ProjectRole | null,
  userId: number | null,
  isProjectMember: boolean = true
) {
  return useMemo(() => {
    const taskInfo = {
      id: todo.id,
      creatorId: todo.creatorId,
      assigneeId: todo.assigneeId,
      status: todo.status,
      projectId: todo.projectId
    }
    
    const isUnassigned = !todo.assigneeId || todo.assigneeId === null
    
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
        isUnassigned
      ),
      
      // 其他权限
      canEditPriority: permissionManager.task.hasEditPriorityPermission(taskInfo, userRole, userId),
      canEditTags: permissionManager.task.hasEditTagsPermission(taskInfo, userRole, userId),
    }
  }, [todo, userRole, userId, isProjectMember])
}
```

### 6.3 认领操作实现示例

```typescript
// 认领待办的 handler
const handleClaimTask = async (taskId: number) => {
  // 检查权限
  const canClaim = permissionManager.task.hasClaimTaskPermission(
    {
      id: todo.id,
      creatorId: todo.creatorId,
      assigneeId: todo.assigneeId,
      status: todo.status,
      projectId: todo.projectId
    },
    currentUserRole,
    currentUserId,
    !!currentUserMember
  )
  
  if (!canClaim) {
    alert('您没有权限认领此待办')
    return
  }
  
  // 调用 API，将自己设置为执行人
  try {
    await tasksApi.update(projectId, String(taskId), {
      assigneeId: currentUserId
    })
    // 刷新数据
    refetch()
  } catch (error) {
    console.error('认领待办失败:', error)
  }
}
```

## 七、权限规则总结表

### 7.1 任务相关权限

| 权限 | 未分配状态 | 已分配状态 | 特殊规则 |
|------|-----------|-----------|---------|
| **认领待办** | ✅ 任何项目成员 | ❌ 不能认领 | 不依赖角色 |
| **分配执行人** | ✅ 任何项目成员 | ✅ 创建人/执行人/admin/owner | - |
| **修改状态（进行中）** | - | ✅ 执行人/admin/owner | 仅限进行中状态 |
| **修改状态（其他）** | ✅ 有编辑权限 | ✅ 有编辑权限 | - |
| **编辑内容** | ✅ owner/admin/创建人/执行人 | ✅ owner/admin/创建人/执行人 | - |
| **删除任务** | ✅ owner/admin/创建人/执行人 | ✅ owner/admin/创建人/执行人 | - |
| **编辑优先级** | ✅ owner/admin/创建人 | ✅ owner/admin/创建人 | - |
| **编辑标签** | ✅ owner/admin/创建人 | ✅ owner/admin/创建人 | - |

### 7.2 项目相关权限

| 权限 | owner | admin | member |
|------|-------|-------|--------|
| **添加成员** | ✅ | ✅ | ❌ |
| **管理项目** | ✅ | ✅ | ❌ |
| **删除项目** | ✅ | ❌ | ❌ |

## 八、实现计划

### 阶段一：创建权限管理模块
1. 创建目录结构
2. 实现类型定义 (`types.ts`)
3. 实现 `TaskPermission` 类
4. 实现 `ProjectPermission` 类
5. 实现 `PermissionManager` 单例类
6. 创建导出入口 (`index.ts`)

### 阶段二：逐步迁移
1. 创建 `useTaskPermission` Hook
2. 在 1-2 个组件中使用新权限管理器
3. 验证功能正常
4. 逐步替换其他组件中的权限检查逻辑

### 阶段三：清理旧代码
1. 删除组件中的重复权限检查逻辑
2. 统一使用权限管理器
3. 添加单元测试

## 九、优势

1. **集中管理**：所有权限逻辑集中在一个地方，易于维护
2. **模块化**：按功能划分（Task、Project等），结构清晰
3. **类型安全**：充分利用 TypeScript 的类型检查
4. **易于测试**：单例模式便于 mock 和测试
5. **易于维护**：新增权限只需添加函数，不影响现有代码
6. **代码复用**：避免在多个组件中重复实现相同的权限逻辑
7. **可扩展性**：可以轻松添加新的权限模块（如 MemberPermission）

## 十、注意事项

1. **向后兼容**：迁移期间保持旧代码可用，逐步替换
2. **性能优化**：使用 `useMemo` 缓存权限检查结果，避免重复计算
3. **单元测试**：为每个权限函数编写单元测试，确保逻辑正确
4. **文档注释**：为每个权限函数添加详细的 JSDoc 注释，说明规则和参数
5. **错误处理**：权限检查失败时，提供清晰的错误提示

## 十一、扩展性考虑

未来可以添加的功能：

1. **权限缓存机制**：缓存权限检查结果，提高性能
2. **权限变更事件监听**：当权限发生变化时，通知相关组件
3. **权限审计日志**：记录权限检查的历史，便于调试和审计
4. **动态权限配置**：从后端获取权限规则，支持动态调整
5. **权限组合**：支持复杂的权限组合逻辑（如：A 或 B，且 C）

## 十二、代码示例

### 完整实现示例（TaskPermission.ts）

```typescript
import type { TaskInfo, ProjectRole } from '../types'
import type { TodoStatus } from '@/types'

/**
 * 任务权限模块
 * 所有任务相关的权限检查函数
 */
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
   * - 如果执行人未分配，任何项目成员都可以分配（包括认领）
   * - 如果执行人已分配，只有创建人、执行人、管理员或owner可以重新分配
   */
  hasAssignAssigneePermission(
    taskInfo: TaskInfo,
    userRole: ProjectRole | null,
    userId: number | null,
    isAssigneeUnassigned: boolean
  ): boolean {
    if (!userId || !userRole) return false
    
    // 如果执行人未分配，任何项目成员都可以分配（包括认领）
    if (isAssigneeUnassigned) {
      return true
    }
    
    // 已分配时：只有创建人、执行人、管理员或owner可以重新分配
    return (
      taskInfo.creatorId === userId ||
      taskInfo.assigneeId === userId ||
      userRole === 'admin' ||
      userRole === 'owner'
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
   */
  hasEditTagsPermission(
    taskInfo: TaskInfo,
    userRole: ProjectRole | null,
    userId: number | null
  ): boolean {
    return this.hasEditPriorityPermission(taskInfo, userRole, userId)
  }
}
```

---

**文档版本**：v1.0  
**最后更新**：2026-01-26  
**维护者**：开发团队
