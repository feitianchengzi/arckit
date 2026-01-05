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
	Teams         []Team `json:"teams,omitempty" gorm:"many2many:user_teams;"`          // 用户所属的团队（通过团队访问项目）
	CreatedTasks  []Task `json:"created_tasks,omitempty" gorm:"foreignKey:CreatorID"`   // 创建的任务
	ExecutedTasks []Task `json:"executed_tasks,omitempty" gorm:"foreignKey:ExecutorID"` // 执行的任务
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
