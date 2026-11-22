package models

import "time"

// AgentTurn is the durable lifecycle record for one customer message handled
// by the support Agent. The public turn id is scoped by project and customer
// before it is hashed into ID, so clients never address OpenHands directly.
type AgentTurn struct {
	ID                      string     `gorm:"primaryKey;type:varchar(64)"`
	ClientMessageID         string     `gorm:"not null;type:varchar(128);index"`
	RequestHash             string     `gorm:"not null;type:varchar(64)"`
	ProjectID               uint       `gorm:"not null;index"`
	CustomUserID            string     `gorm:"not null;type:varchar(255);index"`
	FeedbackID              uint       `gorm:"not null;default:0;index"`
	ConversationID          string     `gorm:"type:varchar(255);index"`
	OpenHandsConversationID string     `gorm:"type:varchar(255);index"`
	CustomerMessageID       uint       `gorm:"not null;default:0"`
	State                   string     `gorm:"not null;type:varchar(32);index"`
	Response                string     `gorm:"type:jsonb;not null;default:'null'"`
	Error                   string     `gorm:"type:text"`
	StopRequestedAt         *time.Time `gorm:"index"`
	CompletedAt             *time.Time
	CreatedAt               time.Time `gorm:"autoCreateTime;index"`
	UpdatedAt               time.Time `gorm:"autoUpdateTime"`
}

func (AgentTurn) TableName() string { return "agent_turns" }
