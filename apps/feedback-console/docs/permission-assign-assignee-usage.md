# `hasAssignAssigneePermission` 权限应用位置

本文档列出了 `hasAssignAssigneePermission`（分配执行人权限）在代码中的所有应用位置。

> **注意**：本文档是专门针对分配执行人权限的详细说明。完整的迁移指南请参考：
> - `permission-migration-todo.md` - 所有权限的完整迁移 TODO

## 权限规则

**函数名**：`hasAssignAssigneePermission`

**规则**：
- **未分配状态（初始状态）**：任何项目成员都可以认领（不限制角色）
- **已分配状态**：只有以下角色可以重新设置执行人：
  - owner（所有者）
  - admin（管理员）
  - 当前执行人（执行者）
  - 创建人

## 应用位置清单

### 一、权限管理器定义

#### 1. `frontend/src/lib/permissions/modules/TaskPermission.ts`
- **行 109-139**：权限函数定义
- **状态**：✅ 已实现新逻辑

---

### 二、Hook 使用

#### 2. `frontend/src/hooks/useTaskPermission.ts`
- **行 59-65**：在 Hook 中调用权限管理器
- **返回**：`canAssignAssignee` 权限结果
- **状态**：✅ 已更新，传递了 `isProjectMember` 参数

```typescript
canAssignAssignee: permissionManager.task.hasAssignAssigneePermission(
  taskInfo,
  userRole,
  userId,
  isUnassigned,
  isProjectMember
)
```

---

### 三、页面组件（需要迁移）

#### 3. `frontend/src/pages/ProjectDetailPage.tsx`

**旧实现位置**：
- **行 545-555**：旧的 `canAssignAssignee` 函数定义
  ```typescript
  const canAssignAssignee = useCallback((todo: any) => {
    if (!currentUserId || !currentUserRole) return false
    // owner 或 admin 可以分配任意任务的执行人
    if (currentUserRole === 'owner' || currentUserRole === 'admin') {
      return true
    }
    // 创建人可以分配自己创建的任务的执行人
    return todo.creatorId === currentUserId
  }, [currentUserId, currentUserRole])
  ```

**使用位置**：
- **行 1694**：传递给 `TodoTreeItem` 组件
  ```typescript
  canAssignAssignee={canAssignAssignee(todo)}
  ```

**需要迁移**：
- [x] 替换旧的 `canAssignAssignee` 函数 ✅
- [x] 使用 `permissionManager.task.hasAssignAssigneePermission()` ✅
- [x] 需要传递 `isAssigneeUnassigned` 和 `isProjectMember` 参数 ✅

**迁移建议**：
```typescript
const canAssignAssignee = useCallback((todo: any) => {
  const taskInfo = {
    id: todo.id,
    creatorId: todo.creatorId,
    assigneeId: todo.assigneeId,
    status: todo.status,
    projectId: todo.projectId
  }
  const isUnassigned = !todo.assigneeId || todo.assigneeId === null
  return permissionManager.task.hasAssignAssigneePermission(
    taskInfo,
    currentUserRole,
    currentUserId,
    isUnassigned,
    !!currentUserMember
  )
}, [currentUserId, currentUserRole, currentUserMember])
```

---

#### 4. `frontend/src/pages/TasksPage.tsx`

**旧实现位置**：
- **行 717-729**：旧的 `canAssignAssignee` 函数定义
  ```typescript
  const canAssignAssignee = useCallback((todo: any, projectId: string) => {
    if (!currentUserId) return false
    const userRole = getUserRoleInProject(projectId)
    // owner 或 admin 可以分配任意任务的执行人
    if (userRole === 'owner' || userRole === 'admin') {
      return true
    }
    // 创建人可以分配自己创建的任务的执行人
    return todo.creatorId === currentUserId
  }, [currentUserId, getUserRoleInProject])
  ```

**使用位置**：
- **行 1627**：传递给 `TodoTreeItem` 组件
  ```typescript
  canAssignAssignee={canAssignAssignee(task, projectId)}
  ```

**需要迁移**：
- [x] 替换旧的 `canAssignAssignee` 函数 ✅
- [x] 使用 `permissionManager.task.hasAssignAssigneePermission()` ✅
- [x] 注意：此文件需要处理多个项目，需要为每个项目获取角色和成员信息 ✅

**迁移建议**：
```typescript
const canAssignAssignee = useCallback((todo: any, projectId: string) => {
  const taskInfo = {
    id: todo.id,
    creatorId: todo.creatorId,
    assigneeId: todo.assigneeId,
    status: todo.status,
    projectId: todo.projectId
  }
  const userRole = getUserRoleInProject(projectId)
  const members = projectMembersMap.get(projectId) || []
  const isProjectMember = members.some(m => m.user_id === currentUserId)
  const isUnassigned = !todo.assigneeId || todo.assigneeId === null
  
  return permissionManager.task.hasAssignAssigneePermission(
    taskInfo,
    userRole,
    currentUserId,
    isUnassigned,
    isProjectMember
  )
}, [currentUserId, getUserRoleInProject, projectMembersMap])
```

---

#### 5. `frontend/src/pages/TaskDetailPage.tsx`

**旧实现位置**：
- **行 73-75**：旧的 `canEditAssignee` 变量
  ```typescript
  const canEditAssignee = isAssigneeUnassigned 
    ? !!currentUserMember  // 未分配时，任何项目成员都可以分配
    : (isCreator || isAssignee || currentUserRole === 'admin' || currentUserRole === 'owner')
  ```

**使用位置**：
- **行 504**：控制执行人编辑功能显示

**需要迁移**：
- [x] 替换旧的 `canEditAssignee` 逻辑 ✅
- [x] 使用 `permissionManager.task.hasAssignAssigneePermission()` ✅

---

#### 6. `frontend/src/components/features/TaskDetailContent.tsx`

**旧实现位置**：
- **行 90-92**：旧的 `canEditAssignee` 变量
  ```typescript
  const canEditAssignee = isAssigneeUnassigned 
    ? !!currentUserMember
    : (isCreator || isAssignee || currentUserRole === 'admin' || currentUserRole === 'owner')
  ```

**使用位置**：
- **行 504**：控制执行人编辑功能显示

**需要迁移**：
- [x] 替换旧的 `canEditAssignee` 逻辑 ✅
- [x] 使用 `permissionManager.task.hasAssignAssigneePermission()` ✅

---

### 四、UI 组件（接收 prop）

#### 7. `frontend/src/components/features/TodoItem.tsx`

**接收 prop**：
- **行 27**：`canAssignAssignee?: boolean`
- **行 37**：函数参数中接收

**使用位置**：
- **行 274**：控制执行人编辑按钮显示（已分配时）
- **行 303**：控制执行人编辑按钮显示（未分配时）
- **行 335**：控制成员选择区域显示

**状态**：✅ 组件本身不需要修改，只需要接收正确的 prop 值

---

#### 8. `frontend/src/components/features/TodoTreeItem.tsx`

**接收 prop**：
- **行 32**：`canAssignAssignee?: boolean`
- **行 53**：函数参数中接收

**使用位置**：
- **行 151**：传递给 `TodoItem` 组件（深度过深时）
- **行 377**：控制执行人编辑功能显示
- **行 414**：控制执行人编辑按钮显示（已分配时）
- **行 432**：控制执行人编辑按钮显示（未分配时）
- **行 495**：传递给子 `TodoTreeItem` 组件

**状态**：✅ 组件本身不需要修改，只需要接收正确的 prop 值

---

## 迁移优先级

### 高优先级（直接影响功能）
1. ✅ `TaskPermission.ts` - 权限逻辑定义（已完成）
2. ✅ `useTaskPermission.ts` - Hook 使用（已完成）
3. ✅ `ProjectDetailPage.tsx` - 项目详情页（已完成迁移）
4. ✅ `TasksPage.tsx` - 我的任务页（已完成迁移）

### 中优先级（详情页）
5. ✅ `TaskDetailPage.tsx` - 任务详情页（已完成迁移）
6. ✅ `TaskDetailContent.tsx` - 任务详情内容组件（已完成迁移）

### 低优先级（UI 组件）
7. ✅ `TodoItem.tsx` - 待办项组件（只需接收 prop，无需修改）
8. ✅ `TodoTreeItem.tsx` - 树形待办项组件（只需接收 prop，无需修改）

---

## 迁移检查清单

### 对于需要迁移的文件：

- [ ] 导入权限管理器：`import { permissionManager } from '@/lib/permissions'`
- [ ] 导入工具函数：`import { todoToTaskInfo, isAssigneeUnassigned } from '@/lib/permissions/utils'`
- [ ] 导入类型：`import type { TaskInfo } from '@/lib/permissions'`
- [ ] 替换旧的权限检查函数
- [ ] 确保传递正确的参数：
  - `taskInfo`（TaskInfo 对象）
  - `userRole`（ProjectRole | null）
  - `userId`（number | null）
  - `isAssigneeUnassigned`（boolean）
  - `isProjectMember`（boolean）
- [ ] 测试未分配状态下的认领功能
- [ ] 测试已分配状态下的重新分配功能
- [ ] 验证不同角色的权限是否正确

---

## 注意事项

1. **未分配状态**：需要检查 `assigneeId` 是否为 `null` 或 `undefined`
2. **项目成员检查**：需要确认用户是否是项目成员（`isProjectMember`）
3. **多项目场景**：`TasksPage.tsx` 需要为每个项目单独获取角色和成员信息
4. **向后兼容**：迁移期间保持旧代码可用，逐步替换

---

**文档版本**：v1.0  
**创建日期**：2026-01-26  
**最后更新**：2026-01-26
