package models

import "time"

// SupportTurn is an application idempotency receipt, not a customer-visible message.
// Scope and request hashes prevent one client's retry from affecting another.
type SupportTurn struct {
	ID          string    `gorm:"primaryKey;type:varchar(64)"`
	RequestHash string    `gorm:"not null;type:varchar(64)"`
	Response    string    `gorm:"type:jsonb;not null;default:'null'"`
	CreatedAt   time.Time `gorm:"autoCreateTime;index"`
}

func (SupportTurn) TableName() string { return "support_turns" }
