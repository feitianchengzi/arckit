# 数据模型说明

## 概述

团队共享任务系统的数据模型，采用项目成员表直接管理项目权限，去除了团队概念的冗余设计。

---

## 数据表结构

### 核心表

1. **users** - 用户表
2. **projects** - 项目表
3. **project_members** - 项目成员表（包含角色）
4. **tasks** - 任务表

### 数据关系

```
users ←→ projects (多对多，通过 project_members，包含角色)
         ↓
      tasks
```

---

## 模型文件

### user.go - 用户模型

**字段：**
- `ID` - 主键
- `UUID` - 唯一标识（**由网关提供**，通过Header传递）
- `Username` - 用户名
- `Avatar` - 头像地址
- `CreatedAt`, `UpdatedAt` - 时间戳

**用户识别：**
- 用户UUID由网关通过Header传递给业务服务
- 系统使用网关提供的UUID进行用户识别
- 如果用户不存在，使用网关提供的UUID创建新用户

**关联关系：**
- `ProjectMembers` - 用户参与的项目成员关系
- `CreatedProjects` - 创建的项目
- `CreatedTasks` - 创建的任务
- `ExecutedTasks` - 执行的任务

**注意事项：**
- ⚠️ 即使用户离职，关联的外键ID（creator_id、executor_id等）仍然保留，用于历史记录追踪

---

### project.go - 项目和项目成员模型

#### Project 项目表

**字段：**
- `ID` - 主键
- `Name` - 项目名称
- `GitURL` - Git地址
- `CreatorID` - 创建者ID（保留历史记录）
- `CreatedAt`, `UpdatedAt` - 时间戳

**关联关系：**
- `Creator` - 创建者
- `Members` - 项目成员列表
- `Tasks` - 项目下的任务

#### ProjectMember 项目成员表

**字段：**
- `ID` - 主键
- `ProjectID` - 项目ID
- `UserID` - 用户ID
- `Role` - 角色（owner/admin/member）
- `CreatedAt`, `UpdatedAt` - 时间戳

**角色常量：**
- `ProjectRoleOwner` - 所有者（项目创建者）
- `ProjectRoleAdmin` - 管理员
- `ProjectRoleMember` - 成员

**唯一约束：**
- `UNIQUE(project_id, user_id)` - 防止重复加入

---

### task.go - 任务模型

**字段：**
- `ID` - 主键
- `ProjectID` - 项目ID
- `FatherID` - 父任务ID（支持层级结构）
- `Content` - 任务内容
- `State` - 任务状态
- `CreatorID` - 创建者ID（保留历史记录）
- `ExecutorID` - 执行者ID（可为空，保留历史记录）
- `CreatedAt`, `UpdatedAt`, `CompletionAt` - 时间戳

**任务状态常量：**
- `TaskStatePending` - 待处理
- `TaskStateInProgress` - 进行中
- `TaskStatePendingReview` - 待评审
- `TaskStateCompleted` - 已完成
- `TaskStateAccepted` - 已验收
- `TaskStateCancelled` - 已取消
- `TaskStateBlocked` - 已阻塞

**关联关系：**
- `Project` - 所属项目
- `Parent` - 父任务
- `Children` - 子任务列表
- `Creator` - 创建者（保留历史记录）
- `Executor` - 执行者（保留历史记录）

---

## 核心业务流程

### 场景一：创建新项目

**流程：**
1. 从网关Header获取用户UUID（`X-User-ID`）
2. 使用UUID查询用户，不存在则使用网关提供的UUID创建新用户
3. **事务操作：**
   - 创建项目（`projects` 表）
   - 将创建者加入项目成员（`project_members` 表，role=owner）

**涉及表：**
- `users` - 查询或插入新用户（使用网关提供的UUID）
- `projects` - 插入新项目
- `project_members` - 插入创建者成员关系

**网关Header信息：**
- `X-User-ID` - 用户UUID（网关提供，用于用户识别）
- `X-User-Username` - 用户名

---

### 场景二：邀请成员加入项目

**流程：**
1. 获取被邀请用户的UUID（由邀请者提供或从Header获取）
2. 使用UUID查询用户，不存在则使用提供的UUID创建新用户
3. 将用户加入项目成员（`project_members` 表）

**涉及表：**
- `users` - 查询或插入新用户（使用UUID）
- `project_members` - 插入新成员关系

**注意事项：**
- 需要防止重复邀请（唯一约束：`UNIQUE(project_id, user_id)`）
- 用户UUID由网关提供或通过邀请参数传递

---

### 场景三：创建任务和权限控制

**任务创建：**
- 插入 `tasks` 表
- 用户必须是项目成员（通过 `project_members` 表验证）

**权限规则：**

1. **任务创建权限**
   - 项目成员都可以创建任务

2. **任务修改权限**
   - `owner` / `admin`：可以修改任意任务
   - `member`：只能修改自己创建或分配给自己执行的任务

**权限判断逻辑：**
```
1. 查询 project_members 表，获取用户在项目中的角色
2. 如果角色是 owner 或 admin → 可以修改任意任务
3. 如果角色是 member：
   - 检查任务 creator_id 是否等于用户ID
   - 检查任务 executor_id 是否等于用户ID
   - 只有满足以上条件之一才能修改
```

---

## 设计要点

### 简化设计

**去除团队概念：**
- 每个项目都有专属团队（一对一关系）时，团队表是冗余的
- 直接使用 `project_members` 表管理项目成员和权限
- 减少1张表，简化查询和业务流程

**优势：**
- ✅ 减少数据表数量
- ✅ 简化查询（权限判断直接查 `project_members`）
- ✅ 简化创建流程（不需要先创建团队）
- ✅ 提高性能（减少JOIN操作）

---

## 数据保留策略

**重要说明：**
- 即使用户离职或被删除，以下外键ID仍然会保留：
  - `projects.creator_id` - 项目创建者
  - `tasks.creator_id` - 任务创建者
  - `tasks.executor_id` - 任务执行者

**原因：**
- 保证历史记录的完整性
- 便于数据分析和审计追踪
- 避免因用户删除导致的级联删除影响业务数据

**建议：**
- 使用软删除（status字段）而非物理删除
- 查询时需要处理用户可能不存在的情况

---

## 依赖安装

```bash
# GORM - ORM框架
go get -u gorm.io/gorm
go get -u gorm.io/driver/postgres  # PostgreSQL驱动

# UUID生成（用于创建时生成UUID，但实际用户UUID由网关提供）
go get -u github.com/google/uuid
```

---

## 使用示例

```go
import (
    "todo/models"
    "todo/middleware"
)

// 从网关Header获取用户UUID
headerInfo := middleware.GetHeaderInfo(c)
userUUID := headerInfo.UserID  // 网关提供的UUID

// 查询或创建用户（使用网关提供的UUID）
var user models.User
err := db.Where("uuid = ?", userUUID).First(&user).Error
if err != nil {
    // 用户不存在，使用网关提供的UUID创建
    user = models.User{
        UUID:     userUUID,  // 使用网关提供的UUID
        Username: headerInfo.Username,
        Avatar:   "",  // 可从Header或其他来源获取
    }
    db.Create(&user)
}

// 创建项目（在事务中）
project := models.Project{
    Name:      "电商平台开发",
    GitURL:    "https://github.com/team/ecommerce.git",
    CreatorID: user.ID,
}

// 添加项目成员
member := models.ProjectMember{
    ProjectID: project.ID,
    UserID:    user.ID,
    Role:      models.ProjectRoleOwner,
}

// 创建任务
task := models.Task{
    ProjectID: project.ID,
    Content:   "完成任务设计",
    State:     models.TaskStatePending,
    CreatorID: user.ID,
}

// 验证状态和角色
if models.IsValidState(task.State) {
    // 状态有效
}
if models.IsValidProjectRole(member.Role) {
    // 角色有效
}
```

---

## 注意事项

1. **数据库：PostgreSQL** - 使用PostgreSQL作为数据存储
2. **用户UUID由网关提供**：
   - 网关通过Header `X-User-ID` 传递用户UUID
   - 系统使用该UUID进行用户识别和创建
   - 用户创建时使用网关提供的UUID，而不是自动生成
3. **模型使用GORM标签**：可直接用于自动迁移
4. **UUID备用生成**：BeforeCreate钩子中可作为备用方案自动生成（当UUID未提供时）
5. **时间字段**：使用GORM的autoCreateTime和autoUpdateTime自动管理
6. **关联关系**：已定义，可直接使用GORM的预加载功能

---

## 网关集成

**Header信息：**
- `X-User-ID` - 用户UUID（必需，网关提供）
- `X-User-Username` - 用户名
- `X-User-AppID` - 应用ID
- `X-User-SessionID` - 会话ID

**用户识别流程：**
1. 网关验证用户身份后，在Header中传递 `X-User-ID`
2. 业务服务从Header获取UUID
3. 使用UUID查询用户，不存在则创建（使用网关提供的UUID）
4. 后续操作使用用户ID进行关联
