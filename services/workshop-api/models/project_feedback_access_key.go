package models

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ProjectFeedbackAccessKey 项目反馈访问密钥
// 用于 public 接口按 key 查询项目反馈
type ProjectFeedbackAccessKey struct {
	ID        uint           `json:"id" gorm:"primaryKey;autoIncrement"`                                                                              // 主键
	ProjectID uint           `json:"project_id" gorm:"not null;index"`                                                                                // 外键：项目ID
	ShortID   string         `json:"short_id" gorm:"type:varchar(32);not null;uniqueIndex:uniq_feedback_access_key_short_id,where:delete_at IS NULL"` // 访问短ID（唯一）
	CreatedAt time.Time      `json:"created_at" gorm:"autoCreateTime"`                                                                                // 创建时间
	UpdatedAt time.Time      `json:"updated_at" gorm:"autoUpdateTime"`                                                                                // 更新时间
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index;column:delete_at"`                                                              // 软删除时间

	Project Project `json:"project,omitempty" gorm:"foreignKey:ProjectID;references:ID"`
}

// TableName 指定表名
func (ProjectFeedbackAccessKey) TableName() string {
	return "project_feedback_access_keys"
}

// BeforeCreate 创建前钩子：自动生成短ID
func (k *ProjectFeedbackAccessKey) BeforeCreate(tx *gorm.DB) error {
	trimmed := strings.TrimSpace(k.ShortID)
	if trimmed != "" {
		k.ShortID = strings.ToUpper(trimmed)
		return nil
	}

	for i := 0; i < 5; i++ {
		candidate := generateProjectFeedbackAccessShortID()
		var count int64
		if err := tx.Model(&ProjectFeedbackAccessKey{}).Where("short_id = ?", candidate).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			k.ShortID = candidate
			return nil
		}
	}

	return errors.New("failed to generate unique project feedback access short_id")
}

func generateProjectFeedbackAccessShortID() string {
	raw := strings.ReplaceAll(uuid.New().String(), "-", "")
	raw = strings.ToUpper(raw)
	if len(raw) > 12 {
		return raw[:12]
	}
	return raw
}
