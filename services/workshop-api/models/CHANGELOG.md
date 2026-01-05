# 模型变更日志

## 2024 - 项目归属模型优化

### 变更内容

**优化目标：** 简化项目归属关系，一个项目只对应一个团队

### 具体变更

#### 1. 项目表 (projects)
- ✅ **新增** `TeamID` 字段：项目直接通过外键关联团队
- ✅ **移除** 多对多关联关系

#### 2. 移除的关联表
- ❌ **删除** `user_projects` 表：用户不再直接关联项目
- ❌ **删除** `team_projects` 表：改为在项目表中直接使用 `TeamID` 外键

#### 3. 用户模型 (User)
- ✅ **移除** `Projects` 关联字段
- ℹ️ 用户现在通过所属团队间接访问项目

#### 4. 团队模型 (Team)
- ✅ **更新** `Projects` 关联：从多对多改为一对多（`hasMany`）

### 优势

1. **权限模型更清晰**
   - 项目只属于团队，权限判断更简单
   - 用户通过团队角色访问项目，符合实际业务场景

2. **数据库结构更简洁**
   - 减少了两个关联表
   - 减少了数据冗余和复杂性

3. **查询性能更好**
   - 减少了JOIN操作
   - 查询项目时直接通过 `team_id` 索引即可

### 数据迁移建议

如果已有旧数据，需要进行数据迁移：

```sql
-- 1. 添加 team_id 字段
ALTER TABLE projects ADD COLUMN team_id INT NOT NULL;

-- 2. 从 team_projects 表迁移数据
UPDATE projects p
INNER JOIN team_projects tp ON p.id = tp.project_id
SET p.team_id = tp.team_id
WHERE tp.id = (
    SELECT MIN(id) FROM team_projects 
    WHERE project_id = p.id
);

-- 3. 添加外键约束
ALTER TABLE projects ADD CONSTRAINT fk_projects_team 
    FOREIGN KEY (team_id) REFERENCES teams(id);

-- 4. 删除旧表
DROP TABLE IF EXISTS user_projects;
DROP TABLE IF EXISTS team_projects;
```

### 使用示例

**创建项目：**
```go
project := models.Project{
    TeamID: 1,  // 直接指定所属团队
    GitURL: "https://github.com/team/project.git",
}
```

**查询团队的项目：**
```go
var team models.Team
db.Preload("Projects").First(&team, teamID)
// team.Projects 包含该团队的所有项目
```

**查询用户可访问的项目：**
```go
// 1. 查询用户所属的团队
var userTeams []models.Team
db.Model(&user).Association("Teams").Find(&userTeams)

// 2. 查询这些团队的项目
var teamIDs []uint
for _, team := range userTeams {
    teamIDs = append(teamIDs, team.ID)
}

var projects []models.Project
db.Where("team_id IN ?", teamIDs).Find(&projects)
```

### 影响范围

- ✅ 模型文件：`project.go`, `user.go`, `team.go`
- ✅ 文档文件：`DESIGN_REVIEW.md`, `SUMMARY.md`
- ⚠️ 需要更新：业务逻辑层、API层、数据访问层

---

## 后续优化建议

1. 考虑为项目表添加 `Name` 和 `Description` 字段
2. 考虑添加项目状态字段（active/archived）
3. 为 `user_teams` 表添加唯一约束

