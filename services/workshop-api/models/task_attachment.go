package models

import (
	"time"

	"gorm.io/gorm"
)

// TaskAttachment 任务附件表
type TaskAttachment struct {
	ID        uint           `json:"id" gorm:"primaryKey;autoIncrement"`                 // 主键
	TaskID    uint           `json:"task_id" gorm:"not null;index"`                      // 外键：关联的任务ID
	CreatorID uint           `json:"creator_id" gorm:"not null;index"`                 // 外键：创建者ID（保留历史记录，不级联删除）
	Type      string         `json:"type" gorm:"type:varchar(20);not null;index"`        // 附件类型：text/file/url
	Content   string         `json:"content" gorm:"type:text;not null"`                  // 统一字段：文本内容或URL
	CreatedAt time.Time      `json:"created_at" gorm:"autoCreateTime"`                   // 创建时间
	UpdatedAt time.Time      `json:"updated_at" gorm:"autoUpdateTime"`                   // 更新时间
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index;column:delete_at"` // 软删除时间

	// belongs to：关联任务（级联删除）
	Task Task `json:"task,omitempty" gorm:"foreignKey:TaskID;references:ID"`

	// 用户关联（不级联删除，保留历史）
	Creator User `json:"creator,omitempty" gorm:"foreignKey:CreatorID;references:ID"`
}

// TableName 指定表名
func (TaskAttachment) TableName() string {
	return "task_attachments"
}

// 附件类型常量
const (
	AttachmentTypeText = "text" // 文本类型
	AttachmentTypeFile = "file" // 文件类型（URL string）
	AttachmentTypeURL  = "url"  // URL类型（URL string）
)

// IsValidAttachmentType 验证附件类型是否有效
func IsValidAttachmentType(attachmentType string) bool {
	validTypes := []string{
		AttachmentTypeText,
		AttachmentTypeFile,
		AttachmentTypeURL,
	}
	for _, validType := range validTypes {
		if attachmentType == validType {
			return true
		}
	}
	return false
}
