# 数据模型构建总结

## 已创建的模型文件

1. **user.go** - 用户模型
   - `User`: 用户表结构
   - 包含UUID自动生成功能

2. **team.go** - 团队模型
   - `Team`: 团队表结构
   - `UserTeam`: 用户-团队关联表
   - 团队角色常量（owner/admin/member）

3. **project.go** - 项目模型
   - `Project`: 项目表结构
   - `UserProject`: 用户-项目关联表
   - `TeamProject`: 团队-项目关联表

4. **task.go** - 任务模型
   - `Task`: 任务表结构
   - 支持父子任务层级关系
   - 任务状态常量（pending/in_progress/completed/cancelled/blocked）
   - 状态验证函数

## 数据关系图

```
┌─────────┐         ┌──────────────┐         ┌─────────┐
│  User   │────────▶│  UserTeam    │────────▶│  Team   │
└─────────┘         └──────────────┘         └─────────┘
                                                  │
                                                  │ (一对多)
                                                  ▼
                                          ┌──────────────┐
                                          │  Project     │
                                          │  (team_id)   │
                                          └──────────────┘
                                                  │
                                                  │ (一对多)
                                                  ▼
                                          ┌──────────────┐
                                          │     Task     │
                                          │              │
                                          │  (father_id) │◀─── 自引用（父子任务）
                                          └──────────────┘
```

**关系说明：**
- 用户 ↔ 团队：多对多（通过 `user_teams` 表）
- 团队 → 项目：一对多（一个团队可以有多个项目）
- 项目 → 任务：一对多（一个项目可以有多个任务）
- 任务 ↔ 任务：自引用（父子任务关系）

## 核心特性

### 1. 用户系统
- ✅ UUID唯一标识
- ✅ 用户名、头像支持
- ✅ 自动时间戳管理

### 2. 团队系统
- ✅ 多对多关系（用户-团队）
- ✅ 角色管理（owner/admin/member）
- ✅ 支持用户加入多个团队

### 3. 项目系统
- ✅ 清晰的项目归属（项目只属于一个团队）
- ✅ Git地址管理
- ✅ 简化的一对多关联（项目直接通过 `team_id` 外键关联团队）

### 4. 任务系统
- ✅ 项目关联
- ✅ 层级任务支持（父子任务）
- ✅ 创建者和执行者分离
- ✅ 任务状态管理
- ✅ 完整的时间追踪

## 表设计评估要点

### ✅ 优点
1. 关系设计清晰，支持复杂场景
2. 任务层级结构设计优秀
3. 角色管理完善
4. 时间字段完整

### ⚠️ 建议改进（详见 DESIGN_REVIEW.md）

**高优先级：**
1. 项目表缺少 `Name` 和 `Description` 字段
2. 关联表需要唯一约束（`user_teams` 表）

**✅ 已优化：**
- 权限模型已明确：项目只属于团队，用户通过团队访问项目

**中优先级：**
1. 团队表可添加 OwnerID
2. 任务表可添加 Priority、DueDate

## 下一步工作

1. **数据库迁移**
   - 使用GORM AutoMigrate生成表结构
   - 或手动编写SQL迁移脚本

2. **索引优化**
   - 根据查询场景添加复合索引
   - 优化关联查询性能

3. **数据验证**
   - 添加模型验证逻辑
   - 状态值校验

4. **业务逻辑**
   - 权限检查
   - 数据访问控制

## 使用建议

### 安装依赖
```bash
go get -u github.com/google/uuid
go get -u gorm.io/gorm
go get -u gorm.io/driver/mysql  # 根据使用的数据库选择
```

### 模型使用示例
```go
import "todo/models"

// 创建用户并设置UUID
user := models.User{
    Username: "张三",
    Avatar: "https://example.com/avatar.jpg",
}
user.SetUUIDIfEmpty()

// 创建任务
task := models.Task{
    ProjectID: 1,
    Content: "完成任务设计",
    State: models.TaskStatePending,
    CreatorID: 1,
}

// 验证状态
if models.IsValidState(task.State) {
    // 状态有效
}
```

## 设计变更说明

**最新优化（2024）：**
- ✅ 简化项目归属模型：一个项目只对应一个团队
- ✅ 移除 `user_projects` 关联表（用户不再直接关联项目）
- ✅ 移除 `team_projects` 关联表（改为在项目表中直接使用 `team_id` 外键）
- ✅ 权限模型更清晰：用户通过所属团队访问团队下的项目

## 文件清单

- `models/user.go` - 用户模型
- `models/team.go` - 团队模型和用户-团队关联表
- `models/project.go` - 项目模型（已简化，直接关联团队）
- `models/task.go` - 任务模型
- `models/models.go` - 导出文件
- `models/README.md` - 使用说明
- `models/DESIGN_REVIEW.md` - 详细设计评估
- `models/SUMMARY.md` - 本文件

