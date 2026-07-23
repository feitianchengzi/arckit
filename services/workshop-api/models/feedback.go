package models

import (
	"time"

	"gorm.io/gorm"
)

// Feedback 反馈表
type Feedback struct {
	ID           uint   `json:"id" gorm:"primaryKey;autoIncrement;index:idx_feedbacks_project_created,priority:4,sort:desc;index:idx_feedbacks_project_custom_user_created,priority:5,sort:desc;index:idx_feedbacks_project_email_created,priority:5,sort:desc;index:idx_feedbacks_project_phone_created,priority:5,sort:desc"` // 主键
	ProjectID    uint   `json:"project_id" gorm:"not null;index;index:idx_feedbacks_project_created,priority:1;index:idx_feedbacks_project_custom_user_created,priority:1;index:idx_feedbacks_project_email_created,priority:1;index:idx_feedbacks_project_phone_created,priority:1"`                                           // 外键：项目ID
	ShortID      string `json:"short_id" gorm:"type:varchar(64);not null;uniqueIndex:uniq_feedback_short_id,where:delete_at IS NULL"`                                                                                                                                                                                           // 短ID（唯一，用于查询）
	Title        string `json:"title" gorm:"type:varchar(200);not null"`                                                                                                                                                                                                                                                        // 标题
	Content      string `json:"content" gorm:"type:text;not null"`                                                                                                                                                                                                                                                              // 内容
	Status       string `json:"status" gorm:"type:varchar(32);not null;default:'pending';index"`                                                                                                                                                                                                                                // 反馈状态
	TriageStatus string `json:"triage_status" gorm:"type:varchar(32);not null;default:'pending';index"`                                                                                                                                                                                                                         // Console 受理状态

	CustomUserID *string `json:"custom_user_id,omitempty" gorm:"type:varchar(128);index;index:idx_feedbacks_project_custom_user_created,priority:2"` // 自定义用户ID（可选）
	UserPhone    *string `json:"user_phone,omitempty" gorm:"type:varchar(32);index;index:idx_feedbacks_project_phone_created,priority:2"`            // 用户手机号（可选）
	UserEmail    *string `json:"user_email,omitempty" gorm:"type:varchar(128);index;index:idx_feedbacks_project_email_created,priority:2"`           // 用户邮箱（可选）
	File         *string `json:"file,omitempty" gorm:"type:varchar(500)"`                                                                            // 附件文件地址（可选）
	Data         *string `json:"data,omitempty" gorm:"type:text"`                                                                                    // JSON字符串（可选）

	CreatedAt time.Time      `json:"created_at" gorm:"autoCreateTime;index:idx_feedbacks_project_created,priority:3,sort:desc;index:idx_feedbacks_project_custom_user_created,priority:4,sort:desc;index:idx_feedbacks_project_email_created,priority:4,sort:desc;index:idx_feedbacks_project_phone_created,priority:4,sort:desc"` // 创建时间
	UpdatedAt time.Time      `json:"updated_at" gorm:"autoUpdateTime"`                                                                                                                                                                                                                                                             // 更新时间
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index;column:delete_at;index:idx_feedbacks_project_created,priority:2;index:idx_feedbacks_project_custom_user_created,priority:3;index:idx_feedbacks_project_email_created,priority:3;index:idx_feedbacks_project_phone_created,priority:3"`                       // 软删除时间

	LastMessageAt          *time.Time `json:"last_message_at,omitempty" gorm:"index"`           // 最近消息时间
	LastCustomerMessageAt  *time.Time `json:"last_customer_message_at,omitempty" gorm:"index"`  // 最近用户消息时间
	LastDeveloperMessageAt *time.Time `json:"last_developer_message_at,omitempty" gorm:"index"` // 最近开发者消息时间

	// belongs to：项目关联（级联删除）
	Project Project `json:"project,omitempty" gorm:"foreignKey:ProjectID;references:ID"`

	// 反馈工作流关联
	Messages  []FeedbackMessage  `json:"messages,omitempty" gorm:"foreignKey:FeedbackID;references:ID;constraint:OnDelete:CASCADE"`
	TaskLinks []FeedbackTaskLink `json:"task_links,omitempty" gorm:"foreignKey:FeedbackID;references:ID;constraint:OnDelete:CASCADE"`
}

// TableName 指定表名
func (Feedback) TableName() string {
	return "feedbacks"
}
