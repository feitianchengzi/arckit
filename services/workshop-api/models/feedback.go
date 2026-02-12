package models

import (
	"time"

	"gorm.io/gorm"
)

// Feedback 反馈表
type Feedback struct {
	ID        uint   `json:"id" gorm:"primaryKey;autoIncrement"`                                                                   // 主键
	ProjectID uint   `json:"project_id" gorm:"not null;index"`                                                                     // 外键：项目ID
	ShortID   string `json:"short_id" gorm:"type:varchar(64);not null;uniqueIndex:uniq_feedback_short_id,where:delete_at IS NULL"` // 短ID（唯一，用于查询）
	Title     string `json:"title" gorm:"type:varchar(200);not null"`                                                              // 标题
	Content   string `json:"content" gorm:"type:text;not null"`                                                                    // 内容

	CustomUserID *string `json:"custom_user_id,omitempty" gorm:"type:varchar(128);index"` // 自定义用户ID（可选）
	UserPhone    *string `json:"user_phone,omitempty" gorm:"type:varchar(32);index"`      // 用户手机号（可选）
	UserEmail    *string `json:"user_email,omitempty" gorm:"type:varchar(128);index"`     // 用户邮箱（可选）
	File         *string `json:"file,omitempty" gorm:"type:varchar(500)"`                 // 附件文件地址（可选）
	Data         *string `json:"data,omitempty" gorm:"type:text"`                         // JSON字符串（可选）

	CreatedAt time.Time      `json:"created_at" gorm:"autoCreateTime"`                   // 创建时间
	UpdatedAt time.Time      `json:"updated_at" gorm:"autoUpdateTime"`                   // 更新时间
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index;column:delete_at"` // 软删除时间

	// belongs to：项目关联（级联删除）
	Project Project `json:"project,omitempty" gorm:"foreignKey:ProjectID;references:ID"`
}

// TableName 指定表名
func (Feedback) TableName() string {
	return "feedbacks"
}
