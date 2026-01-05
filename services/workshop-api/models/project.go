package models

import (
	"time"
)

// Project 项目表
// 一个项目只对应一个团队
type Project struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`              // 主键
	TeamID    uint      `json:"team_id" gorm:"not null;index"`                   // 外键：所属团队ID（一个项目只属于一个团队）
	GitURL    string    `json:"git_url" gorm:"type:varchar(500);not null;index"` // 项目Git地址
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`                // 创建时间
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`                // 更新时间

	// 关联关系
	Team  Team   `json:"team,omitempty" gorm:"foreignKey:TeamID"`     // 所属团队
	Tasks []Task `json:"tasks,omitempty" gorm:"foreignKey:ProjectID"` // 项目下的任务
}

// TableName 指定表名
func (Project) TableName() string {
	return "projects"
}
