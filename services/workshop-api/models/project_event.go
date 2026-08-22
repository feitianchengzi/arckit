package models

import "time"

// ProjectEvent is the durable invalidation log consumed by websocket and replay clients.
// It intentionally has no foreign key to projects so a project.deleted event survives
// the project row's lifecycle for the retention window.
type ProjectEvent struct {
	ID            uint64    `json:"id" gorm:"primaryKey;autoIncrement"`
	SchemaVersion int16     `json:"schema_version" gorm:"not null;default:1"`
	ProjectID     uint      `json:"project_id" gorm:"not null;index:idx_project_events_project_id_id,priority:1"`
	Event         string    `json:"event" gorm:"type:varchar(100);not null"`
	Entity        string    `json:"entity,omitempty" gorm:"type:varchar(50);not null;default:''"`
	SubjectID     string    `json:"subject_id,omitempty" gorm:"type:varchar(100);not null;default:''"`
	ActorID       uint      `json:"actor_id" gorm:"not null;default:0"`
	ActorUsername string    `json:"actor_username,omitempty" gorm:"type:varchar(200);not null;default:''"`
	ActorAvatar   string    `json:"actor_avatar,omitempty" gorm:"type:text;not null;default:''"`
	Data          []byte    `json:"-" gorm:"type:jsonb;not null;default:'{}'"`
	CreatedAt     time.Time `json:"created_at" gorm:"autoCreateTime;index"`
}

func (ProjectEvent) TableName() string { return "project_events" }
