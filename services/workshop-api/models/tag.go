package models

import (
	"time"
)

// Tag 标签表
type Tag struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`           // 主键
	ProjectID uint      `json:"project_id" gorm:"not null;index"`             // 外键：关联的项目ID
	Name      string    `json:"name" gorm:"type:varchar(100);not null;index"` // 标签名称
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`             // 创建时间
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`             // 更新时间

	// belongs to：由fixForeignKeyConstraints函数创建正确的外键约束
	Project Project `json:"project,omitempty" gorm:"foreignKey:ProjectID;references:ID"`
}

// TableName 指定表名
func (Tag) TableName() string {
	return "tags"
}
