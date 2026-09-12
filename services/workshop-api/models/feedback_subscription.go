package models

import "time"

const (
	FeedbackEmailDeliveryPending    = "pending"
	FeedbackEmailDeliveryProcessing = "processing"
	FeedbackEmailDeliverySent       = "sent"
	FeedbackEmailDeliveryFailed     = "failed"

	FeedbackEmailEventNewFeedback   = "new_feedback"
	FeedbackEmailEventCustomerReply = "customer_reply"
)

// FeedbackSubscription stores a project member's own notification choices.
// Email delivery is opt-in and therefore defaults to disabled.
type FeedbackSubscription struct {
	ID                    uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID             uint      `json:"project_id" gorm:"not null;index;uniqueIndex:uniq_feedback_subscription_project_user,priority:1"`
	UserID                uint      `json:"user_id" gorm:"not null;index;uniqueIndex:uniq_feedback_subscription_project_user,priority:2"`
	EmailEnabled          bool      `json:"email_enabled" gorm:"not null;default:false"`
	NotifyNewFeedback     bool      `json:"notify_new_feedback" gorm:"not null;default:true"`
	NotifyCustomerReplies bool      `json:"notify_customer_replies" gorm:"not null;default:true"`
	CreatedAt             time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt             time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	Project Project `json:"-" gorm:"foreignKey:ProjectID;references:ID;constraint:OnDelete:CASCADE"`
	User    User    `json:"-" gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE"`
}

func (FeedbackSubscription) TableName() string {
	return "feedback_subscriptions"
}

// FeedbackEmailDelivery is a durable outbox row. Feedback creation commits
// independently from SMTP; a worker claims and retries these rows afterward.
type FeedbackEmailDelivery struct {
	ID              uint       `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID       uint       `json:"project_id" gorm:"not null;index"`
	FeedbackID      uint       `json:"feedback_id" gorm:"not null;index"`
	MessageID       uint       `json:"message_id" gorm:"not null;index;uniqueIndex:uniq_feedback_email_delivery_message_user,priority:1"`
	RecipientUserID uint       `json:"recipient_user_id" gorm:"not null;index;uniqueIndex:uniq_feedback_email_delivery_message_user,priority:2"`
	EventType       string     `json:"event_type" gorm:"type:varchar(32);not null"`
	Status          string     `json:"status" gorm:"type:varchar(32);not null;default:'pending';index:idx_feedback_email_deliveries_due,priority:1"`
	AttemptCount    int        `json:"attempt_count" gorm:"not null;default:0"`
	NextAttemptAt   time.Time  `json:"next_attempt_at" gorm:"not null;index:idx_feedback_email_deliveries_due,priority:2"`
	LockedAt        *time.Time `json:"locked_at,omitempty" gorm:"index"`
	LastError       *string    `json:"last_error,omitempty" gorm:"type:text"`
	SentAt          *time.Time `json:"sent_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt       time.Time  `json:"updated_at" gorm:"autoUpdateTime"`

	Project   Project         `json:"-" gorm:"foreignKey:ProjectID;references:ID;constraint:OnDelete:CASCADE"`
	Feedback  Feedback        `json:"-" gorm:"foreignKey:FeedbackID;references:ID;constraint:OnDelete:CASCADE"`
	Message   FeedbackMessage `json:"-" gorm:"foreignKey:MessageID;references:ID;constraint:OnDelete:CASCADE"`
	Recipient User            `json:"-" gorm:"foreignKey:RecipientUserID;references:ID;constraint:OnDelete:CASCADE"`
}

func (FeedbackEmailDelivery) TableName() string {
	return "feedback_email_deliveries"
}
