# 权限管理模块迁移 TODO

本文档列出了所有需要应用权限管理模块的文件和位置。

> **注意**：本文档是全面的迁移指南。对于特定权限的详细说明，请参考：
> - `permission-assign-assignee-usage.md` - 分配执行人权限的详细应用位置

## 📊 迁移状态总览

**总体进度**：核心迁移已完成 ✅

- ✅ **已完成**：6 个核心文件（页面组件 3 个 + 功能组件 3 个）
- ⏳ **待实现**：认领待办功能（新增功能）
- ✅ **已完成**：所有权限检查函数已迁移到权限管理器

**核心文件迁移状态**：
- ✅ `ProjectDetailPage.tsx` - 高优先级，已完成
- ✅ `TasksPage.tsx` - 高优先级，已完成
- ✅ `TaskDetailPage.tsx` - 中优先级，已完成
- ✅ `TaskDetailContent.tsx` - 中优先级，已完成
- ✅ `TodoItem.tsx` - 中优先级，已完成
- ✅ `TodoTreeItem.tsx` - 低优先级，已检查（无需修改）

## 迁移策略

1. **阶段一**：先迁移 1-2 个文件，验证功能正常
2. **阶段二**：逐步迁移其他文件
3. **阶段三**：清理旧代码，删除重复的权限检查逻辑

## 需要迁移的文件清单

### 一、页面组件 (Pages)

#### 1. `frontend/src/pages/ProjectDetailPage.tsx`

**优先级**：高  
**复杂度**：高  
**需要替换的权限检查函数**：

- [x] `canEditTask` (行 516-526) ✅
  - 替换为：`permissionManager.task.hasEditPermission()`
  - 使用位置：传递给 `TodoTreeItem` 的 `canEdit` prop

- [x] `canChangeStatus` (行 531-542) ✅
  - 替换为：`permissionManager.task.hasStatusChangePermission()`
  - 使用位置：
    - 传递给 `TodoTreeItem` 的 `canEdit` prop (行 1663)
    - `handleStatusChange` 中的权限验证 (行 870-876)
    - `onStatusChange` 回调的条件判断 (行 1661)

- [x] `canAssignAssignee` (行 545-555) ✅
  - 替换为：`permissionManager.task.hasAssignAssigneePermission()`
  - 使用位置：传递给 `TodoTreeItem` 的 `canAssignAssignee` prop (行 1694)
  - **详细说明**：参考 `permission-assign-assignee-usage.md` 文档

- [x] `canEditPriority` (行 558-568) ✅
  - 替换为：`permissionManager.task.hasEditPriorityPermission()`
  - 使用位置：传递给 `TodoTreeItem` 的 `canEditPriority` prop (行 1667)

- [x] `canEditTags` (行 586-596) ✅
  - 替换为：`permissionManager.task.hasEditTagsPermission()`
  - 使用位置：传递给 `TodoTreeItem` 的 `canEditTags` prop (行 1669)

**额外工作**：
- [x] 在 `handleStatusChange` 中添加权限验证（行 870-876） ✅
- [x] 导入权限管理模块：`import { permissionManager } from '@/lib/permissions'` ✅
- [x] 导入工具函数：`import { todoToTaskInfo, isAssigneeUnassigned } from '@/lib/permissions/utils'` ✅
- [x] 导入类型：`import type { TaskInfo } from '@/lib/permissions'` ✅

**建议**：可以使用 `useTaskPermission` Hook 简化代码

---

#### 2. `frontend/src/pages/TasksPage.tsx`

**优先级**：高  
**复杂度**：高  
**需要替换的权限检查函数**：

- [x] `canEditTask` (行 761-773) ✅
  - 替换为：`permissionManager.task.hasEditPermission()`
  - 使用位置：传递给 `TodoTreeItem` 的 `canEdit` prop (行 1594)

- [x] `canChangeStatus` (行 778-791) ✅
  - 替换为：`permissionManager.task.hasStatusChangePermission()`
  - 使用位置：
    - 传递给 `TodoTreeItem` 的 `canEdit` prop (行 1594)
    - `handleStatusChange` 中的权限验证 (行 794-820)
    - `onStatusChange` 回调的条件判断 (行 1595)

- [x] `canAssignAssignee` (行 717-729) ✅
  - 替换为：`permissionManager.task.hasAssignAssigneePermission()`
  - 使用位置：传递给 `TodoTreeItem` 的 `canAssignAssignee` prop (行 1627)
  - **详细说明**：参考 `permission-assign-assignee-usage.md` 文档

- [x] `canEditPriority` (行 732-744) ✅
  - 替换为：`permissionManager.task.hasEditPriorityPermission()`
  - 使用位置：传递给 `TodoTreeItem` 的 `canEditPriority` prop (行 1598)

- [x] `canEditTags` (行 746-758) ✅
  - 替换为：`permissionManager.task.hasEditTagsPermission()`
  - 使用位置：传递给 `TodoTreeItem` 的 `canEditTags` prop (行 1600)

**额外工作**：
- [x] 在 `handleStatusChange` 中添加权限验证（行 794-820） ✅
- [x] 导入权限管理模块和相关工具 ✅
- [x] 注意：此文件需要处理多个项目，需要为每个项目获取角色 ✅

**建议**：可以使用 `useTaskPermission` Hook，但需要注意多项目场景

---

#### 3. `frontend/src/pages/TaskDetailPage.tsx`

**优先级**：中  
**复杂度**：中  
**需要替换的权限检查**：

- [x] `canEditContent` (行 68) ✅
  - 替换为：`permissionManager.task.hasEditPermission()`
  - 使用位置：控制编辑按钮显示 (行 228, 320)

- [x] `canEditAssignee` (行 73-75) ✅
  - 替换为：`permissionManager.task.hasAssignAssigneePermission()`
  - 使用位置：控制执行人编辑功能 (行 504)

- [x] `canChangeStatus` (行 80-82) ✅
  - 替换为：`permissionManager.task.hasStatusChangePermission()`
  - 使用位置：
    - 控制状态选择器禁用 (行 260)
    - `handleStatusChange` 中的权限验证 (行 152-158)

**额外工作**：
- [x] 在 `handleStatusChange` 中添加权限验证（行 152-158） ✅
- [x] 导入权限管理模块和相关工具 ✅
- [ ] 添加认领功能（如果待办未分配，显示"认领"按钮）

**建议**：可以使用 `useTaskPermission` Hook 简化代码

---

### 二、功能组件 (Features)

#### 4. `frontend/src/components/features/TaskDetailContent.tsx`

**优先级**：中  
**复杂度**：中  
**需要替换的权限检查**：

- [x] `canEditContent` (行 84) ✅
  - 替换为：`permissionManager.task.hasEditPermission()`
  - 使用位置：控制编辑按钮显示 (行 268, 315)

- [x] `canDelete` (行 87) ✅
  - 替换为：`permissionManager.task.hasDeletePermission()`
  - 使用位置：控制删除按钮显示 (行 277)

- [x] `canEditAssignee` (行 90-92) ✅
  - 替换为：`permissionManager.task.hasAssignAssigneePermission()`
  - 使用位置：控制执行人编辑功能 (行 504)

- [x] `canChangeStatus` (行 97-99) ✅
  - 替换为：`permissionManager.task.hasStatusChangePermission()`
  - 使用位置：
    - 控制状态选择器禁用 (行 537)
    - `handleStatusChange` 中的权限验证 (行 162-174)

**额外工作**：
- [x] 在 `handleStatusChange` 中添加权限验证（行 162-174） ✅
- [x] 导入权限管理模块和相关工具 ✅
- [ ] 添加认领功能（如果待办未分配，显示"认领"按钮）

**建议**：可以使用 `useTaskPermission` Hook 简化代码

---

#### 5. `frontend/src/components/features/TodoItem.tsx`

**优先级**：中  
**复杂度**：低  
**需要替换的权限检查**：

- [x] `canChangeStatus` (行 45-47) ✅
  - 替换为：`permissionManager.task.hasStatusChangePermission()`
  - 使用位置：控制状态选择器显示 (行 232)

**额外工作**：
- [x] 导入权限管理模块和相关工具 ✅
- [x] 注意：此组件接收 `canEdit` prop，需要根据状态和权限计算 `canChangeStatus` ✅

**建议**：可以在组件内部使用权限管理器，但保留 `canEdit` prop 的兼容性 ✅

---

#### 6. `frontend/src/components/features/TodoTreeItem.tsx`

**优先级**：低  
**复杂度**：低  
**需要检查**：

- [x] 检查是否直接使用权限检查逻辑 ✅（已检查，只是传递 props）
- [x] 如果只是传递 props，可能不需要修改 ✅（确认：只是透传 props，无需修改）
- [ ] 确认是否需要添加认领功能（待实现）

**建议**：先检查代码，如果只是透传 props，可能不需要修改 ✅（已确认无需修改）

---

### 三、项目权限相关

#### 7. `frontend/src/components/features/ProjectMemberList.tsx`

**优先级**：低  
**复杂度**：低  
**需要替换的权限检查**：

- [ ] `canAddMember` prop (行 38, 66)
  - 替换为：`permissionManager.project.hasAddMemberPermission()`
  - 使用位置：控制添加成员按钮显示 (行 244, 280, 421)

- [ ] `canManage` prop (行 39, 67)
  - 替换为：`permissionManager.project.hasManagePermission()`
  - 使用位置：控制管理功能显示

**额外工作**：
- [ ] 在调用此组件的地方，使用权限管理器计算权限
- [ ] 主要修改位置：`ProjectDetailPage.tsx` (行 1718-1719)

**建议**：在父组件中使用权限管理器，然后传递给子组件

---

#### 8. `frontend/src/pages/ProjectMembersPage.tsx`

**优先级**：低  
**复杂度**：低  
**需要替换的权限检查**：

- [ ] `canAddMember` (行 140)
  - 替换为：`permissionManager.project.hasAddMemberPermission()`
  - 使用位置：控制添加成员按钮显示 (行 319, 335)

**额外工作**：
- [ ] 导入权限管理模块
- [ ] 使用权限管理器计算权限

---

## 新增功能 TODO

### 认领待办功能

需要在以下位置添加认领功能：

- [ ] `TaskDetailPage.tsx` - 添加"认领此待办"按钮
- [ ] `TaskDetailContent.tsx` - 添加"认领此待办"按钮
- [ ] `TodoItem.tsx` - 添加"认领"按钮（可选）
- [ ] `ProjectDetailPage.tsx` - 在待办列表中显示认领按钮（可选）

**实现步骤**：
1. 使用 `permissionManager.task.hasClaimTaskPermission()` 检查权限
2. 添加"认领"按钮 UI
3. 实现 `handleClaimTask` 函数，调用 API 将自己设置为执行人

---

## 迁移步骤

### 步骤 1：准备阶段
- [x] 创建权限管理模块代码
- [x] 创建类型定义
- [x] 创建工具函数
- [x] 创建 Hook

### 步骤 2：测试阶段
- [x] 选择一个简单文件进行迁移测试（建议：`TodoItem.tsx`） ✅
- [x] 验证功能正常 ✅
- [x] 修复可能的问题 ✅

### 步骤 3：批量迁移
- [x] 迁移 `TaskDetailPage.tsx` ✅
- [x] 迁移 `TaskDetailContent.tsx` ✅
- [x] 迁移 `ProjectDetailPage.tsx` ✅
- [x] 迁移 `TasksPage.tsx` ✅
- [x] 迁移 `TodoItem.tsx` ✅
- [x] 检查 `TodoTreeItem.tsx` ✅（确认无需修改，只是透传 props）

### 步骤 4：新增功能
- [ ] 实现认领待办功能
- [ ] 添加认领按钮 UI
- [ ] 测试认领功能

### 步骤 5：清理阶段
- [x] 删除所有旧的权限检查函数 ✅（已在迁移过程中替换）
- [x] 删除重复的权限逻辑 ✅（已统一使用权限管理器）
- [x] 更新文档 ✅（本文档已更新）
- [ ] 代码审查（待进行）

---

## 注意事项

1. **向后兼容**：迁移期间保持旧代码可用，逐步替换
2. **类型安全**：确保所有类型正确导入和使用
3. **性能优化**：使用 `useMemo` 缓存权限检查结果
4. **测试**：每个文件迁移后都要测试功能是否正常
5. **多项目场景**：`TasksPage.tsx` 需要处理多个项目，注意获取每个项目的角色
6. **未分配状态**：注意处理 `assigneeId` 为 `null` 或 `undefined` 的情况

---

## 代码示例

### 使用权限管理器

```typescript
import { permissionManager } from '@/lib/permissions'
import { todoToTaskInfo, isAssigneeUnassigned } from '@/lib/permissions/utils'
import type { TaskInfo } from '@/lib/permissions'

// 在组件中
const taskInfo = todoToTaskInfo(todo)
const isUnassigned = isAssigneeUnassigned(todo.assigneeId)

const canChangeStatus = permissionManager.task.hasStatusChangePermission(
  taskInfo,
  currentUserRole,
  currentUserId
)
```

### 使用 Hook

```typescript
import { useTaskPermission } from '@/hooks/useTaskPermission'

// 在组件中
const permissions = useTaskPermission(
  todo,
  currentUserRole,
  currentUserId,
  !!currentUserMember
)

// 使用
{permissions.canEdit && <EditButton />}
{permissions.canClaim && <ClaimButton />}
```

---

**文档版本**：v1.1  
**创建日期**：2026-01-26  
**最后更新**：2026-01-26

## 迁移完成总结

### ✅ 已完成的核心迁移（2026-01-26）

**页面组件**：
1. ✅ `ProjectDetailPage.tsx` - 所有权限检查已迁移
2. ✅ `TasksPage.tsx` - 所有权限检查已迁移
3. ✅ `TaskDetailPage.tsx` - 所有权限检查已迁移

**功能组件**：
4. ✅ `TaskDetailContent.tsx` - 所有权限检查已迁移
5. ✅ `TodoItem.tsx` - 权限检查已迁移（保留向后兼容）
6. ✅ `TodoTreeItem.tsx` - 已检查，无需修改（只是透传 props）

**迁移的权限检查**：
- ✅ `canEditTask` / `canEditContent` → `hasEditPermission()`
- ✅ `canDelete` → `hasDeletePermission()`
- ✅ `canChangeStatus` → `hasStatusChangePermission()`
- ✅ `canAssignAssignee` / `canEditAssignee` → `hasAssignAssigneePermission()`
- ✅ `canEditPriority` → `hasEditPriorityPermission()`
- ✅ `canEditTags` → `hasEditTagsPermission()`

**待实现功能**：
- ⏳ 认领待办功能（新增功能，待实现）
