package models

import "time"

// FeedbackConclusion is an immutable, published customer-visible result. A new
// row supersedes the preceding version; publication never drives task state.
type FeedbackConclusion struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	FeedbackID   uint      `json:"feedback_id" gorm:"not null;uniqueIndex:uniq_feedback_conclusion_version,priority:1;index"`
	ProjectID    uint      `json:"project_id" gorm:"not null;index"`
	Version      int       `json:"version" gorm:"not null;uniqueIndex:uniq_feedback_conclusion_version,priority:2"`
	Kind         string    `json:"kind" gorm:"type:varchar(32);not null"`
	Title        string    `json:"title" gorm:"type:varchar(200);not null"`
	Body         string    `json:"body" gorm:"type:text;not null"`
	ArtifactURL  string    `json:"artifact_url,omitempty" gorm:"type:text"`
	VersionLabel string    `json:"version_label,omitempty" gorm:"type:varchar(200)"`
	PublishedBy  uint      `json:"published_by" gorm:"not null"`
	CreatedAt    time.Time `json:"created_at" gorm:"autoCreateTime"`
}

func (FeedbackConclusion) TableName() string { return "feedback_conclusions" }

// FeedbackConclusionResponse retains every customer acceptance/review request;
// it is not the internal task acceptance command.
type FeedbackConclusionResponse struct {
	ID                uint      `json:"id" gorm:"primaryKey"`
	FeedbackID        uint      `json:"feedback_id" gorm:"not null;index"`
	ConclusionID      uint      `json:"conclusion_id" gorm:"not null;index"`
	CustomUserID      string    `json:"-" gorm:"type:varchar(128);not null"`
	Response          string    `json:"response" gorm:"type:varchar(32);not null"`
	Content           string    `json:"content" gorm:"type:text"`
	ClientMessageID   string    `json:"client_message_id" gorm:"type:varchar(128);not null;uniqueIndex:uniq_feedback_conclusion_response,priority:3"`
	ScopeFeedbackID   uint      `json:"-" gorm:"column:scope_feedback_id;not null;uniqueIndex:uniq_feedback_conclusion_response,priority:1"`
	ScopeCustomUserID string    `json:"-" gorm:"column:scope_custom_user_id;type:varchar(128);not null;uniqueIndex:uniq_feedback_conclusion_response,priority:2"`
	CreatedAt         time.Time `json:"created_at" gorm:"autoCreateTime"`
}

func (FeedbackConclusionResponse) TableName() string { return "feedback_conclusion_responses" }
