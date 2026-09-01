# 权限管理模块

统一管理项目中所有权限检查逻辑的模块。

## 目录结构

```
permissions/
├── index.ts                    # 导出入口，单例实例
├── PermissionManager.ts        # 权限管理器主类（单例）
├── types.ts                    # 权限相关的类型定义
├── utils.ts                    # 权限检查的辅助工具函数
├── modules/
│   ├── TaskPermission.ts      # 任务相关权限模块
│   └── ProjectPermission.ts    # 项目相关权限模块
└── README.md                   # 本文件
```

## 快速开始

### 基础使用

```typescript
import { permissionManager } from '@/lib/permissions'
import type { TaskInfo } from '@/lib/permissions'

// 检查是否可以修改任务状态
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

// 使用权限
{permissions.canEdit && <EditButton />}
{permissions.canClaim && <ClaimButton />}
```

## 权限函数列表

### 任务权限 (TaskPermission)

- `hasStatusChangePermission` - 检查是否可以修改任务状态
- `hasEditPermission` - 检查是否可以编辑任务内容
- `hasDeletePermission` - 检查是否可以删除任务
- `hasAssignAssigneePermission` - 检查是否可以分配执行人
- `hasClaimTaskPermission` - 检查是否可以认领待办 ⭐ 新增
- `hasEditPriorityPermission` - 检查是否可以编辑优先级
- `hasEditTagsPermission` - 检查是否可以编辑标签

### 项目权限 (ProjectPermission)

- `hasAddMemberPermission` - 检查是否可以添加成员
- `hasManagePermission` - 检查是否可以管理项目
- `hasDeleteProjectPermission` - 检查是否可以删除项目

## 详细文档

请参考 [权限管理架构设计方案](../../../docs/permission-management-design.md)
