package models

import (
	"time"

	"gorm.io/gorm"
)

const (
	FeedbackStatusPending    = "pending"     // 待处理
	FeedbackStatusAccepted   = "accepted"    // 已确认
	FeedbackStatusConverted  = "converted"   // 已流转为待办
	FeedbackStatusInProgress = "in_progress" // 开发中
	FeedbackStatusCompleted  = "completed"   // 已完成
	FeedbackStatusIgnored    = "ignored"     // 已忽略
	FeedbackStatusReleased   = "released"    // 已上线
)

const (
	FeedbackMessageSenderCustomer  = "customer"
	FeedbackMessageSenderDeveloper = "developer"
	FeedbackMessageSenderSystem    = "system"
)

const (
	FeedbackMessageTypeText         = "text"
	FeedbackMessageTypeStatusChange = "status_change"
	FeedbackMessageTypeTaskLink     = "task_link"
	FeedbackMessageTypeSystem       = "system"
)

const (
	FeedbackAttachmentTypeImage = "image"
	FeedbackAttachmentTypeFile  = "file"
	FeedbackAttachmentTypeURL   = "url"
)

const (
	FeedbackTaskRelationConvertedTo = "converted_to"
	FeedbackTaskRelationRelated     = "related"
	FeedbackTaskRelationDuplicate   = "duplicate"
)

// FeedbackMessage 反馈沟通消息表
type FeedbackMessage struct {
	ID                 uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	FeedbackID         uint           `json:"feedback_id" gorm:"not null;index;index:idx_feedback_messages_feedback_created,priority:1;uniqueIndex:uniq_feedback_messages_customer_client_active,priority:1,where:sender_type = 'customer' AND sender_custom_user_id IS NOT NULL AND client_message_id IS NOT NULL AND delete_at IS NULL"`
	ProjectID          uint           `json:"project_id" gorm:"not null;index;index:idx_feedback_messages_project_created,priority:1"`
	SenderType         string         `json:"sender_type" gorm:"type:varchar(32);not null;index"`
	SenderUserID       *uint          `json:"sender_user_id,omitempty" gorm:"index"`
	SenderCustomUserID *string        `json:"sender_custom_user_id,omitempty" gorm:"type:varchar(128);index;uniqueIndex:uniq_feedback_messages_customer_client_active,priority:2,where:sender_type = 'customer' AND sender_custom_user_id IS NOT NULL AND client_message_id IS NOT NULL AND delete_at IS NULL"`
	ClientMessageID    *string        `json:"client_message_id,omitempty" gorm:"type:varchar(128);index;uniqueIndex:uniq_feedback_messages_customer_client_active,priority:3,where:sender_type = 'customer' AND sender_custom_user_id IS NOT NULL AND client_message_id IS NOT NULL AND delete_at IS NULL"`
	MessageType        string         `json:"message_type" gorm:"type:varchar(32);not null;default:'text';index"`
	Content            string         `json:"content" gorm:"type:text;not null;default:''"`
	Metadata           *string        `json:"metadata,omitempty" gorm:"type:jsonb"`
	CreatedAt          time.Time      `json:"created_at" gorm:"autoCreateTime;index:idx_feedback_messages_feedback_created,priority:3;index:idx_feedback_messages_project_created,priority:3"`
	UpdatedAt          time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt          gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index;column:delete_at;index:idx_feedback_messages_feedback_created,priority:2;index:idx_feedback_messages_project_created,priority:2"`

	Feedback    Feedback                    `json:"feedback,omitempty" gorm:"foreignKey:FeedbackID;references:ID;constraint:OnDelete:CASCADE"`
	Project     Project                     `json:"project,omitempty" gorm:"foreignKey:ProjectID;references:ID;constraint:OnDelete:CASCADE"`
	SenderUser  *User                       `json:"sender_user,omitempty" gorm:"foreignKey:SenderUserID;references:ID"`
	Attachments []FeedbackMessageAttachment `json:"attachments,omitempty" gorm:"foreignKey:MessageID;references:ID;constraint:OnDelete:CASCADE"`
}

func (FeedbackMessage) TableName() string {
	return "feedback_messages"
}

// FeedbackMessageAttachment 反馈消息附件表
type FeedbackMessageAttachment struct {
	ID         uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	MessageID  uint           `json:"message_id" gorm:"not null;index;index:idx_feedback_message_attachments_message,priority:1"`
	FeedbackID uint           `json:"feedback_id" gorm:"not null;index;index:idx_feedback_message_attachments_feedback,priority:1"`
	Type       string         `json:"type" gorm:"type:varchar(32);not null;index"`
	ObjectKey  *string        `json:"object_key,omitempty" gorm:"type:varchar(500)"`
	URL        *string        `json:"url,omitempty" gorm:"type:text"`
	FileName   *string        `json:"file_name,omitempty" gorm:"type:varchar(255)"`
	MimeType   *string        `json:"mime_type,omitempty" gorm:"type:varchar(128)"`
	Size       *int64         `json:"size,omitempty"`
	CreatedAt  time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt  time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt  gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index;column:delete_at;index:idx_feedback_message_attachments_message,priority:2;index:idx_feedback_message_attachments_feedback,priority:2"`

	Message  FeedbackMessage `json:"message,omitempty" gorm:"foreignKey:MessageID;references:ID;constraint:OnDelete:CASCADE"`
	Feedback Feedback        `json:"feedback,omitempty" gorm:"foreignKey:FeedbackID;references:ID;constraint:OnDelete:CASCADE"`
}

func (FeedbackMessageAttachment) TableName() string {
	return "feedback_message_attachments"
}

// FeedbackTaskLink 反馈与待办关联表
type FeedbackTaskLink struct {
	ID           uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	FeedbackID   uint           `json:"feedback_id" gorm:"not null;index;index:idx_feedback_task_links_feedback,priority:1;uniqueIndex:uniq_feedback_task_relation_active,priority:1,where:delete_at IS NULL"`
	ProjectID    uint           `json:"project_id" gorm:"not null;index"`
	TaskID       uint           `json:"task_id" gorm:"not null;index;index:idx_feedback_task_links_task,priority:1;uniqueIndex:uniq_feedback_task_relation_active,priority:2,where:delete_at IS NULL"`
	RelationType string         `json:"relation_type" gorm:"type:varchar(32);not null;default:'converted_to';index;uniqueIndex:uniq_feedback_task_relation_active,priority:3,where:delete_at IS NULL"`
	IsPrimary    bool           `json:"is_primary" gorm:"not null;default:false;index"`
	CreatedBy    *uint          `json:"created_by,omitempty" gorm:"index"`
	CreatedAt    time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt    gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index;column:delete_at;index:idx_feedback_task_links_feedback,priority:2;index:idx_feedback_task_links_task,priority:2"`

	Feedback Feedback `json:"feedback,omitempty" gorm:"foreignKey:FeedbackID;references:ID;constraint:OnDelete:CASCADE"`
	Project  Project  `json:"project,omitempty" gorm:"foreignKey:ProjectID;references:ID;constraint:OnDelete:CASCADE"`
	Task     Task     `json:"task,omitempty" gorm:"foreignKey:TaskID;references:ID;constraint:OnDelete:CASCADE"`
	Creator  *User    `json:"creator,omitempty" gorm:"foreignKey:CreatedBy;references:ID"`
}

func (FeedbackTaskLink) TableName() string {
	return "feedback_task_links"
}

func IsValidFeedbackStatus(status string) bool {
	switch status {
	case FeedbackStatusPending,
		FeedbackStatusAccepted,
		FeedbackStatusConverted,
		FeedbackStatusInProgress,
		FeedbackStatusCompleted,
		FeedbackStatusIgnored,
		FeedbackStatusReleased:
		return true
	default:
		return false
	}
}

func IsValidFeedbackMessageSenderType(senderType string) bool {
	switch senderType {
	case FeedbackMessageSenderCustomer,
		FeedbackMessageSenderDeveloper,
		FeedbackMessageSenderSystem:
		return true
	default:
		return false
	}
}

func IsValidFeedbackMessageType(messageType string) bool {
	switch messageType {
	case FeedbackMessageTypeText,
		FeedbackMessageTypeStatusChange,
		FeedbackMessageTypeTaskLink,
		FeedbackMessageTypeSystem:
		return true
	default:
		return false
	}
}

func IsValidFeedbackAttachmentType(attachmentType string) bool {
	switch attachmentType {
	case FeedbackAttachmentTypeImage,
		FeedbackAttachmentTypeFile,
		FeedbackAttachmentTypeURL:
		return true
	default:
		return false
	}
}

func IsValidFeedbackTaskRelationType(relationType string) bool {
	switch relationType {
	case FeedbackTaskRelationConvertedTo,
		FeedbackTaskRelationRelated,
		FeedbackTaskRelationDuplicate:
		return true
	default:
		return false
	}
}
