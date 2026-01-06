package models

import (
	"time"

	"github.com/google/uuid"
)

// User 用户表
type User struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`                // 主键
	UUID      string    `json:"uuid" gorm:"type:varchar(36);uniqueIndex;not null"` // UUID，唯一索引
	Username  string    `json:"username" gorm:"type:varchar(100);not null;index"`  // 用户名
	Avatar    string    `json:"avatar" gorm:"type:varchar(500)"`                   // 头像地址
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`                  // 创建时间
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`                  // 更新时间

	// 关联关系
	ProjectMembers  []ProjectMember `json:"project_members,omitempty" gorm:"foreignKey:UserID"`     // 用户参与的项目成员关系（通过此表访问项目）
	CreatedProjects []Project       `json:"created_projects,omitempty" gorm:"foreignKey:CreatorID"` // 创建的项目
	CreatedTasks    []Task          `json:"created_tasks,omitempty" gorm:"foreignKey:CreatorID"`    // 创建的任务
	ExecutedTasks   []Task          `json:"executed_tasks,omitempty" gorm:"foreignKey:ExecutorID"`  // 执行的任务

	// ⚠️ 重要说明：数据保留策略
	// 即使用户离职或被删除，以下关联关系中的外键ID仍然会保留，用于历史记录追踪：
	// 1. CreatedProjects（创建的项目）：项目的 creator_id 字段会永久保留创建者的用户ID
	// 2. CreatedTasks（创建的任务）：任务的 creator_id 字段会永久保留创建者的用户ID
	// 3. ExecutedTasks（执行的任务）：任务的 executor_id 字段会永久保留执行者的用户ID
	//
	// 设计原因：
	// - 保证项目/任务历史记录的完整性，不会因为用户离职而丢失创建者/执行者信息
	// - 便于后续的数据分析和审计追踪
	// - 避免因用户删除导致的级联删除影响业务数据
	//
	// 注意事项：
	// - 短期不会实现用户删除时的级联清理逻辑
	// - 如果需要支持用户删除功能，建议使用软删除（添加 status 字段标记为已删除）而非物理删除
	// - 或者在业务层实现数据归档机制，而非数据库层面的级联删除
	// - 查询时需要处理用户可能不存在的情况（例如：用户已离职但历史记录仍保留）
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}

// BeforeCreate 创建前钩子，自动生成UUID
// 注意：此方法需要GORM支持，如果未使用GORM，请手动设置UUID
func (u *User) BeforeCreate() error {
	if u.UUID == "" {
		u.UUID = uuid.New().String()
	}
	return nil
}

// SetUUIDIfEmpty 如果UUID为空则生成新的UUID（不依赖GORM钩子）
func (u *User) SetUUIDIfEmpty() {
	if u.UUID == "" {
		u.UUID = uuid.New().String()
	}
}
