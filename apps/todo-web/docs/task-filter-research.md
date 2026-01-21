# 待办列表筛选功能调研报告

## 📋 需求概述

在待办列表中添加筛选功能，筛选条件包括：
1. **创建人**：可以从项目所有成员中选择，有快捷入口"我创建的"
2. **执行人**：可以从项目所有成员中选择，有快捷入口"我执行的"

## 🔍 API 调研结果

### 1. 待办列表 API 响应体结构

**接口**: `GET /workshop/v1/user/tasks?project_id={projectId}`

**响应体示例**:
```json
{
  "code": "OK",
  "data": {
    "tasks": [
      {
        "id": 1,
        "project_id": 1,
        "father_id": null,
        "content": "完成任务设计",
        "state": "pending",
        "creator_id": 10,        // ✅ 包含创建人ID（数字）
        "executor_id": 2,         // ✅ 包含执行人ID（数字，可为null）
        "priority": 0,
        "tags": "重要,紧急",
        "created_at": "2024-01-01T12:00:00Z",
        "updated_at": "2024-01-01T12:00:00Z",
        "completion_at": null
      }
    ],
    "total": 2
  }
}
```

**结论**：
- ✅ **响应体包含 `creator_id` 和 `executor_id`**（数字ID）
- ⚠️ **响应体不包含 `creator` 和 `executor` 对象**（不包含用户名、头像等信息）
- ⚠️ **需要额外查询项目成员信息来显示用户名和头像**

### 2. API 筛选参数支持

**当前支持的查询参数**：
- `project_id` (必填): 项目ID
- `updated_after` (可选): 最后更新时间
- `father_id` (可选): 父任务ID过滤

**不支持的参数**：
- ❌ `creator_id`: 不支持按创建人筛选
- ❌ `executor_id`: 不支持按执行人筛选

**结论**：
- ⚠️ **后端API目前不支持按创建人和执行人筛选**
- 💡 **需要前端实现筛选逻辑**（获取所有任务后，在前端过滤）

### 3. 项目成员 API

**接口**: 通过 `projectsApi.getMembers(projectId)` 获取

**响应体结构**:
```typescript
interface ProjectMember {
  id: number
  project_id: number
  user_id: number        // ✅ 成员的数字ID（与任务的creator_id/executor_id对应）
  role: 'owner' | 'admin' | 'member'
  username?: string      // ✅ 用户名
  avatar?: string       // ✅ 头像URL
  created_at: string
  updated_at: string
}
```

**结论**：
- ✅ **可以获取项目所有成员列表**（包括owner、admin、member）
- ✅ **成员对象包含 `user_id`、`username`、`avatar`**，满足筛选下拉框需求

### 4. 当前用户ID获取

**问题**：需要获取当前用户的数字ID（用于"我创建的"和"我执行的"快捷筛选）

**方案1：通过 header-info 接口**
- 接口: `GET /workshop/v1/user/header-info`
- 返回: `userID` (UUID格式，如 `"1a5ceb31-fdc7-49d2-92ad-f2b7d3b90baf"`)
- ⚠️ **问题**：返回的是UUID，而任务的 `creator_id` 和 `executor_id` 是数字ID

**方案2：通过项目成员列表匹配**
- 获取项目成员列表
- 通过 `username` 或其他唯一标识匹配当前用户
- ✅ **推荐**：从项目成员列表中查找当前用户对应的 `user_id`（数字ID）

**当前用户信息获取**：
- `useAuthStore().user` 包含 `username` 和 `avatar`
- 但不包含数字ID（`id` 字段为0）

## ✅ 满足需求情况

### 已满足的部分

1. ✅ **响应体包含创建人和执行人ID**
   - `creator_id`: 数字ID，可用于筛选
   - `executor_id`: 数字ID（可为null），可用于筛选

2. ✅ **可以获取项目所有成员列表**
   - 包含所有成员（owner、admin、member）
   - 包含成员的用户名、头像等信息

3. ✅ **可以获取当前用户信息**
   - 可以通过 `useAuthStore().user.username` 获取当前用户名
   - 可以通过项目成员列表匹配获取当前用户的数字ID

### 不满足的部分

1. ❌ **后端不支持按创建人和执行人筛选**
   - 需要前端实现筛选逻辑
   - 需要获取所有任务后，在前端进行过滤

2. ⚠️ **响应体不包含创建人和执行人的详细信息**
   - 需要额外查询项目成员信息来显示用户名和头像
   - 可以通过 `user_id` 匹配项目成员列表来获取

## 💡 实现方案建议

### 方案1：前端筛选（推荐）

**优点**：
- 不需要修改后端API
- 实现简单快速
- 用户体验好（即时筛选）

**缺点**：
- 需要加载所有任务数据
- 数据量大时可能有性能问题

**实现步骤**：
1. 获取项目所有任务列表
2. 获取项目所有成员列表
3. 获取当前用户信息（通过项目成员列表匹配获取数字ID）
4. 在前端实现筛选逻辑：
   - 按 `creator_id` 筛选
   - 按 `executor_id` 筛选
   - "我创建的"：筛选 `creator_id === 当前用户ID`
   - "我执行的"：筛选 `executor_id === 当前用户ID`

### 方案2：后端支持筛选（长期方案）

**优点**：
- 性能更好（只返回筛选后的数据）
- 减少前端数据处理

**缺点**：
- 需要后端API支持
- 开发周期较长

**需要的API修改**：
```typescript
GET /workshop/v1/user/tasks?project_id={projectId}&creator_id={creatorId}&executor_id={executorId}
```

## 📝 总结

### 当前API响应体是否满足需求？

**部分满足**：
- ✅ 响应体包含 `creator_id` 和 `executor_id`，可以用于筛选
- ⚠️ 但不包含创建人和执行人的详细信息（用户名、头像），需要额外查询
- ❌ 后端不支持筛选参数，需要前端实现筛选逻辑

### 推荐实现方案

1. **短期方案**：前端实现筛选功能
   - 获取所有任务和成员列表
   - 在前端实现筛选逻辑
   - 通过 `user_id` 匹配成员信息显示用户名和头像

2. **长期方案**：后端支持筛选参数
   - 添加 `creator_id` 和 `executor_id` 查询参数
   - 后端返回筛选后的任务列表
   - 提升性能和用户体验

### 需要解决的技术问题

1. **如何获取当前用户的数字ID？**
   - 方案：从项目成员列表中通过 `username` 匹配当前用户，获取对应的 `user_id`

2. **如何显示创建人和执行人的用户名和头像？**
   - 方案：通过 `creator_id` 和 `executor_id` 匹配项目成员列表，获取对应的 `username` 和 `avatar`

3. **如何处理执行人为null的情况？**
   - 方案：在筛选器中添加"未分配"选项，筛选 `executor_id === null` 的任务

