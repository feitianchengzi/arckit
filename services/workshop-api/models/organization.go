package models

import (
	"time"

	"gorm.io/gorm"
)

// Organization 组织表
type Organization struct {
	ID          uint      `json:"id" gorm:"primaryKey;autoIncrement"`                    // 主键
	Name        string    `json:"name" gorm:"type:varchar(200);not null;index"`          // 组织名称
	Description string    `json:"description" gorm:"type:text"`                         // 组织描述（可选）
	CreatorID   uint      `json:"creator_id" gorm:"not null;index"`                      // 外键：创建者ID（保留历史记录，不级联删除）
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`                      // 创建时间
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`                      // 更新时间
	DeletedAt   gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index;column:delete_at"` // 软删除时间

	// has many：级联删除约束
	Creator User                `json:"creator,omitempty" gorm:"foreignKey:CreatorID;references:ID"`
	Members []OrganizationMember `json:"members,omitempty" gorm:"foreignKey:OrganizationID;references:ID;constraint:OnDelete:CASCADE"`
	Projects []Project            `json:"projects,omitempty" gorm:"foreignKey:OrganizationID;references:ID;constraint:OnDelete:CASCADE"`
}

// TableName 指定表名
func (Organization) TableName() string {
	return "organizations"
}
