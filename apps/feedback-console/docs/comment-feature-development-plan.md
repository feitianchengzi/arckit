# 任务评论功能开发方案

## 📋 需求概述

基于现有的任务附件功能，开发一个专门的任务评论功能，允许项目成员在任务下进行讨论和交流。

**重要说明**：
- 任务详情页已废弃，所有功能都在抽屉（`TaskDetailContent`）中实现
- 只负责前端开发，后端接口已开发完成
- 使用方案一：基于附件接口，`type: "comment"` 类型

## 🎯 功能需求

### 核心功能
1. **创建评论** - 任何项目成员都可以在任务下添加评论
2. **查看评论列表** - 按时间顺序显示所有评论
3. **编辑评论** - 评论创建者可以编辑自己的评论
4. **删除评论** - 评论创建者、任务创建者、管理员/所有者可以删除评论

### 权限规则
- **创建评论**：任何项目成员都可以创建评论
- **编辑评论**：只有评论创建者可以编辑自己的评论
- **删除评论**：
  - 评论创建者可以删除自己的评论
  - 任务创建者可以删除任务下的任何评论
  - 项目管理员/所有者可以删除任务下的任何评论

## 🏗️ 技术方案

### 基于附件接口实现（方案一）

**实现方式**：
- 使用附件接口，`type: "comment"` 类型
- 复用现有的附件 CRUD 接口
- 前端创建专门的评论组件
- 扩展权限模块支持评论权限检查

**接口设计**（后端已实现）：
```
POST /workshop/v1/user/tasks/attachments
{
  "task_id": 1,
  "type": "comment",
  "content": "这是评论内容，支持 Markdown"
}

GET /workshop/v1/user/tasks/attachments?task_id=1&type=comment

PUT /workshop/v1/user/tasks/attachments/:id
{
  "content": "更新后的评论内容"
}

DELETE /workshop/v1/user/tasks/attachments/:id
```

## 📐 数据模型设计

### 基于附件扩展（方案一）

```typescript
interface TaskAttachment {
  id: number
  task_id: number
  creator_id: number
  type: 'text' | 'file' | 'url' | 'comment'  // 新增 comment 类型
  content: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}
```

### 独立评论模型（方案二）

```typescript
interface TaskComment {
  id: number
  task_id: number
  creator_id: number
  content: string
  parent_id: number | null  // 用于回复功能
  created_at: string
  updated_at: string
  deleted_at: string | null
  // 关联数据
  creator?: {
    id: number
    username: string
    avatar_url: string | null
  }
  replies?: TaskComment[]  // 回复列表
}
```

## 🎨 前端实现方案

### 组件结构

```
frontend/src/components/features/
├── CommentSection.tsx          # 评论区域主组件
├── CommentList.tsx              # 评论列表
├── CommentItem.tsx              # 单个评论项
├── CommentEditor.tsx             # 评论编辑器
└── CommentActions.tsx           # 评论操作（编辑/删除）
```

### 集成位置

**只在任务详情抽屉中实现**：
- **任务详情抽屉** (`TaskDetailContent.tsx`)
  - 在任务详情内容中集成评论功能
  - 在状态历史下方添加评论区域
  - 显示评论列表和评论输入框

**注意**：任务详情页已废弃，不需要在 `TaskDetailPage.tsx` 中实现

### UI/UX 设计

1. **评论列表**
   - 按时间倒序排列（最新的在上）
   - 显示评论者头像、用户名、评论时间
   - 支持 Markdown 渲染
   - 显示编辑/删除按钮（根据权限）

2. **评论输入框**
   - 支持 Markdown 编辑
   - 实时预览（可选）
   - 提交按钮
   - 取消按钮（编辑模式）

3. **交互设计**
   - 评论提交后自动刷新列表
   - 编辑时展开编辑器
   - 删除时显示确认对话框
   - 加载状态提示

## 🔧 开发步骤

### 阶段一：基础功能实现

#### 1. 扩展权限模块
- [ ] 在 `TaskPermission.ts` 中添加评论权限检查方法
  - [ ] `hasCreateCommentPermission()` - 创建评论权限
  - [ ] `hasEditCommentPermission()` - 编辑评论权限
  - [ ] `hasDeleteCommentPermission()` - 删除评论权限
- [ ] 在 `PermissionManager.ts` 中导出评论权限方法
- [ ] 在 `useTaskPermission.ts` Hook 中添加评论权限（可选）

#### 2. 创建 API 接口封装
- [ ] 创建 `frontend/src/lib/api/endpoints/comments.ts`
  - [ ] `createComment()` - 创建评论（使用附件接口，type: "comment"）
  - [ ] `getComments()` - 获取评论列表（使用附件接口，过滤 type=comment）
  - [ ] `updateComment()` - 更新评论（使用附件接口）
  - [ ] `deleteComment()` - 删除评论（使用附件接口）

#### 3. 创建 Hooks
- [ ] 创建 `frontend/src/hooks/useTaskComments.ts`
  - [ ] `useTaskComments()` - 获取评论列表
  - [ ] `useCreateComment()` - 创建评论
  - [ ] `useUpdateComment()` - 更新评论
  - [ ] `useDeleteComment()` - 删除评论

#### 4. 创建评论组件
- [ ] `CommentSection.tsx` - 评论区域主组件
  - [ ] 包含评论列表和评论输入框
  - [ ] 处理加载和错误状态
- [ ] `CommentList.tsx` - 评论列表组件
  - [ ] 按时间倒序显示评论
  - [ ] 支持空状态
- [ ] `CommentItem.tsx` - 单个评论项组件
  - [ ] 显示评论者信息（头像、用户名、时间）
  - [ ] 支持 Markdown 渲染
  - [ ] 显示编辑/删除按钮（根据权限）
- [ ] `CommentEditor.tsx` - 评论编辑器组件
  - [ ] 支持 Markdown 编辑
  - [ ] 创建和编辑模式
  - [ ] 提交和取消按钮

#### 5. 集成到任务详情抽屉
- [ ] 在 `TaskDetailContent.tsx` 中集成评论功能
  - [ ] 在状态历史下方添加评论区域
  - [ ] 导入并使用 `CommentSection` 组件
  - [ ] 传递必要的 props（projectId, taskId, members 等）

#### 6. 样式和交互优化
- [ ] 评论列表样式
- [ ] 评论编辑器样式
- [ ] 加载和错误状态
- [ ] 动画效果（可选）

### 阶段二：优化和扩展（可选）

- [ ] 回复功能
  - [ ] 支持对评论进行回复
  - [ ] 嵌套评论显示
  - [ ] 回复通知（可选）
- [ ] 评论通知
  - [ ] @ 提及用户
  - [ ] 评论通知推送
- [ ] 评论搜索
  - [ ] 在任务中搜索评论
- [ ] 评论统计
  - [ ] 显示评论数量
  - [ ] 显示最后评论时间

## 📝 API 接口设计（方案一）

### 创建评论

```bash
POST /workshop/v1/user/tasks/attachments
{
  "task_id": 1,
  "type": "comment",
  "content": "这是评论内容，支持 Markdown"
}
```

### 查询评论列表

```bash
GET /workshop/v1/user/tasks/attachments?task_id=1&type=comment
```

### 更新评论

```bash
PUT /workshop/v1/user/tasks/attachments/:id
{
  "content": "更新后的评论内容"
}
```

### 删除评论

```bash
DELETE /workshop/v1/user/tasks/attachments/:id
```

## 🔐 权限管理

### 权限模块扩展

在 `TaskPermission.ts` 中添加评论权限检查方法：

```typescript
/**
 * 检查是否可以创建评论
 * 
 * 规则：任何项目成员都可以创建评论
 * 
 * @param taskInfo 任务信息
 * @param isProjectMember 是否是项目成员
 * @returns 是否有权限
 */
hasCreateCommentPermission(
  taskInfo: TaskInfo,
  isProjectMember: boolean
): boolean {
  return isProjectMember
}

/**
 * 检查是否可以编辑评论
 * 
 * 规则：只有评论创建者可以编辑自己的评论
 * 
 * @param comment 评论信息（附件对象，type=comment）
 * @param userId 当前用户ID
 * @returns 是否有权限
 */
hasEditCommentPermission(
  comment: { creator_id: number },
  userId: number | null
): boolean {
  if (!userId) return false
  return comment.creator_id === userId
}

/**
 * 检查是否可以删除评论
 * 
 * 规则：
 * - 评论创建者可以删除自己的评论
 * - 任务创建者可以删除任务下的任何评论
 * - 项目管理员/所有者可以删除任务下的任何评论
 * 
 * @param comment 评论信息（附件对象，type=comment）
 * @param taskInfo 任务信息
 * @param userRole 用户在项目中的角色
 * @param userId 当前用户ID
 * @returns 是否有权限
 */
hasDeleteCommentPermission(
  comment: { creator_id: number },
  taskInfo: TaskInfo,
  userRole: ProjectRole | null,
  userId: number | null
): boolean {
  if (!userId) return false
  
  // 评论创建者可以删除
  if (comment.creator_id === userId) return true
  
  // 任务创建者可以删除
  if (taskInfo.creatorId === userId) return true
  
  // 管理员/所有者可以删除
  if (userRole === 'admin' || userRole === 'owner') return true
  
  return false
}
```

### 在 PermissionManager 中导出

```typescript
// PermissionManager.ts
export class PermissionManager {
  task = new TaskPermission()
  // ... 其他模块
}
```

## 📦 文件清单

### 新增文件

```
frontend/src/
├── components/features/
│   ├── CommentSection.tsx
│   ├── CommentList.tsx
│   ├── CommentItem.tsx
│   └── CommentEditor.tsx
├── hooks/
│   ├── useTaskComments.ts
│   ├── useCreateComment.ts
│   ├── useUpdateComment.ts
│   └── useDeleteComment.ts
├── lib/api/endpoints/
│   └── comments.ts
└── lib/permissions/
    └── modules/
        └── CommentPermission.ts
```

### 修改文件

```
frontend/src/
├── components/features/
│   └── TaskDetailContent.tsx       # 添加评论区域（在状态历史下方）
└── lib/permissions/
    ├── modules/
    │   └── TaskPermission.ts       # 添加评论权限检查方法
    └── PermissionManager.ts         # 导出评论权限方法（如果需要）
```

## 🧪 测试计划

### 功能测试
- [ ] 创建评论
- [ ] 查看评论列表
- [ ] 编辑评论
- [ ] 删除评论
- [ ] 权限验证
- [ ] 错误处理

### UI/UX 测试
- [ ] 评论列表显示
- [ ] 评论编辑器交互
- [ ] 加载状态
- [ ] 错误提示
- [ ] 响应式设计

## 📅 开发时间估算

- **阶段一（基础功能）**：3-5 个工作日 ✅ 已完成
  - 组件开发：2 天 ✅
  - API 集成：1 天 ✅
  - 权限管理：0.5 天 ✅
  - 测试和优化：1-2 天（待测试）

- **阶段二（扩展功能）**：5-7 个工作日（待实现）
  - 回复功能：2-3 天
  - 通知功能：2-3 天
  - 其他优化：1 天

## 🚀 实施建议

1. **优先使用方案一**（基于附件扩展）
   - 快速实现，复用现有代码
   - 降低开发风险
   - 便于快速验证需求

2. **后续可考虑迁移到方案二**（独立接口）
   - 如果评论功能使用频繁
   - 需要更多扩展功能（回复、点赞等）
   - 需要更好的性能优化

3. **渐进式开发**
   - 先实现基础功能
   - 收集用户反馈
   - 根据反馈决定是否扩展

## 📚 参考资源

- 现有任务附件功能实现
- Markdown 编辑器组件（如果使用）
- 权限管理模块设计文档

---

## ✅ 实现状态

### 已完成（2026-01-26）

1. ✅ **权限模块扩展**
   - 在 `TaskPermission.ts` 中添加了评论权限检查方法
   - `hasCreateCommentPermission()` - 创建评论权限
   - `hasEditCommentPermission()` - 编辑评论权限
   - `hasDeleteCommentPermission()` - 删除评论权限

2. ✅ **API 接口封装**
   - 创建了 `commentsApi.ts`
   - 实现了创建、查询、更新、删除评论的接口
   - 基于附件接口，使用 `type: "comment"`

3. ✅ **Hooks 创建**
   - 创建了 `useTaskComments.ts`
   - 实现了 `useTaskComments`、`useCreateComment`、`useUpdateComment`、`useDeleteComment`

4. ✅ **组件开发**
   - `CommentSection.tsx` - 评论区域主组件
   - `CommentList.tsx` - 评论列表组件
   - `CommentItem.tsx` - 单个评论项组件
   - `CommentEditor.tsx` - 评论编辑器组件

5. ✅ **集成到任务详情抽屉**
   - 在 `TaskDetailContent.tsx` 中集成了评论功能
   - 评论区域位于状态历史下方
   - 支持权限控制显示

### 待测试

- [ ] 创建评论功能测试
- [ ] 查看评论列表测试
- [ ] 编辑评论功能测试
- [ ] 删除评论功能测试
- [ ] 权限验证测试
- [ ] UI/UX 测试

---

**文档版本**：v1.1  
**创建日期**：2026-01-26  
**最后更新**：2026-01-26
