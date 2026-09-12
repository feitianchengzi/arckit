package models

import "time"

// TaskNotificationPreference stores one member's email notification choices
// for a project. The two assignment-related choices intentionally default to
// true; email delivery itself remains opt-in through EmailEnabled.
type TaskNotificationPreference struct {
	ID                    uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID             uint      `json:"project_id" gorm:"not null;uniqueIndex:uniq_task_notification_project_user,priority:1;index:idx_task_notification_preferences_enabled,priority:1"`
	UserID                uint      `json:"user_id" gorm:"not null;uniqueIndex:uniq_task_notification_project_user,priority:2;index:idx_task_notification_preferences_enabled,priority:3"`
	EmailEnabled          bool      `json:"email_enabled" gorm:"not null;default:false;index:idx_task_notification_preferences_enabled,priority:2"`
	NotifyAssignedToMe    bool      `json:"notify_assigned_to_me" gorm:"not null;default:true"`
	NotifyAssigneeChanged bool      `json:"notify_assignee_changed" gorm:"not null;default:true"`
	NotifyTaskCreated     bool      `json:"notify_task_created" gorm:"not null;default:false"`
	NotifyStatusChanged   bool      `json:"notify_status_changed" gorm:"not null;default:false"`
	NotifyPriorityChanged bool      `json:"notify_priority_changed" gorm:"not null;default:false"`
	NotifyContentChanged  bool      `json:"notify_content_changed" gorm:"not null;default:false"`
	NotifyTagsChanged     bool      `json:"notify_tags_changed" gorm:"not null;default:false"`
	CreatedAt             time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt             time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	Project Project `json:"-" gorm:"foreignKey:ProjectID;references:ID;constraint:OnDelete:CASCADE"`
	User    User    `json:"-" gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE"`
}

func (TaskNotificationPreference) TableName() string {
	return "task_notification_preferences"
}

func DefaultTaskNotificationPreference(projectID, userID uint) TaskNotificationPreference {
	return TaskNotificationPreference{
		ProjectID:             projectID,
		UserID:                userID,
		NotifyAssignedToMe:    true,
		NotifyAssigneeChanged: true,
	}
}
