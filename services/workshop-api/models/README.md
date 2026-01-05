# 数据模型说明

## 依赖安装

模型使用了以下Go包，需要先安装：

```bash
# GORM - ORM框架（用于数据库操作和模型标签）
go get -u gorm.io/gorm
go get -u gorm.io/driver/mysql  # 如果使用MySQL
go get -u gorm.io/driver/postgres  # 如果使用PostgreSQL
go get -u gorm.io/driver/sqlite  # 如果使用SQLite

# UUID生成
go get -u github.com/google/uuid
```

## 模型结构

- `user.go`: 用户模型和相关关联
- `team.go`: 团队模型和用户-团队关联表
- `project.go`: 项目模型和关联表（用户-项目、团队-项目）
- `task.go`: 任务模型，支持层级结构

## 使用示例

```go
import "todo/models"

// 创建用户
user := models.User{
    UUID: "自动生成或手动设置",
    Username: "张三",
    Avatar: "https://example.com/avatar.jpg",
}

// 创建任务
task := models.Task{
    ProjectID: 1,
    Content: "完成任务模型设计",
    State: models.TaskStatePending,
    CreatorID: 1,
}
```

## 注意事项

1. 所有模型使用了GORM标签，可以直接用于GORM自动迁移
2. UUID字段在BeforeCreate钩子中会自动生成（需要GORM）
3. 时间字段使用GORM的autoCreateTime和autoUpdateTime自动管理
4. 关联关系已定义，可以直接使用GORM的预加载功能

