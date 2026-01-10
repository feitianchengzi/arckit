package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
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
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}

// BeforeCreate 创建前钩子，自动生成UUID（如果未设置）
// GORM 钩子方法签名：BeforeCreate(*gorm.DB) error
func (u *User) BeforeCreate(tx *gorm.DB) error {
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
