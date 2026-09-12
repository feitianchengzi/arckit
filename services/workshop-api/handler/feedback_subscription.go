package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type FeedbackSubscriptionQuery struct {
	ProjectID uint `form:"project_id"`
}

type UpdateFeedbackSubscriptionRequest struct {
	ProjectID             uint  `json:"project_id"`
	EmailEnabled          bool  `json:"email_enabled"`
	NotifyNewFeedback     *bool `json:"notify_new_feedback,omitempty"`
	NotifyCustomerReplies *bool `json:"notify_customer_replies,omitempty"`
}

type FeedbackSubscriptionResponse struct {
	ProjectID             uint   `json:"project_id"`
	EmailEnabled          bool   `json:"email_enabled"`
	NotifyNewFeedback     bool   `json:"notify_new_feedback"`
	NotifyCustomerReplies bool   `json:"notify_customer_replies"`
	DeliveryAvailable     bool   `json:"delivery_available"`
	UpdatedAt             string `json:"updated_at,omitempty"`
}

func feedbackEmailNotificationsEnabled() bool {
	enabled, err := strconv.ParseBool(strings.TrimSpace(os.Getenv("FEEDBACK_EMAIL_NOTIFICATIONS_ENABLED")))
	return err == nil && enabled
}

func defaultFeedbackSubscription(projectID, userID uint) models.FeedbackSubscription {
	return models.FeedbackSubscription{
		ProjectID:             projectID,
		UserID:                userID,
		EmailEnabled:          false,
		NotifyNewFeedback:     true,
		NotifyCustomerReplies: true,
	}
}

func feedbackSubscriptionResponse(subscription models.FeedbackSubscription) FeedbackSubscriptionResponse {
	updatedAt := ""
	if !subscription.UpdatedAt.IsZero() {
		updatedAt = subscription.UpdatedAt.Format(time.RFC3339)
	}
	return FeedbackSubscriptionResponse{
		ProjectID:             subscription.ProjectID,
		EmailEnabled:          subscription.EmailEnabled,
		NotifyNewFeedback:     subscription.NotifyNewFeedback,
		NotifyCustomerReplies: subscription.NotifyCustomerReplies,
		DeliveryAvailable:     feedbackEmailNotificationsEnabled(),
		UpdatedAt:             updatedAt,
	}
}

// GetFeedbackSubscription returns the current project member's own settings.
// A missing row is an intentional, disabled-by-default subscription.
func GetFeedbackSubscription(c *gin.Context) {
	var query FeedbackSubscriptionQuery
	if err := c.ShouldBindQuery(&query); err != nil || query.ProjectID == 0 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "project_id 为必填项", nil))
		return
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	userID, ok := requireFeedbackProjectMember(c, db, query.ProjectID, "查看反馈订阅")
	if !ok {
		return
	}

	subscription := defaultFeedbackSubscription(query.ProjectID, userID)
	if err := db.Where("project_id = ? AND user_id = ?", query.ProjectID, userID).First(&subscription).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈订阅失败: "+err.Error(), nil))
		return
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(feedbackSubscriptionResponse(subscription)))
}

// UpdateFeedbackSubscription changes only the authenticated member's own
// project subscription. No owner/admin permission is needed.
func UpdateFeedbackSubscription(c *gin.Context) {
	var request UpdateFeedbackSubscriptionRequest
	if err := c.ShouldBindJSON(&request); err != nil || request.ProjectID == 0 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误，project_id 为必填项", nil))
		return
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	userID, ok := requireFeedbackProjectMember(c, db, request.ProjectID, "更新反馈订阅")
	if !ok {
		return
	}

	subscription := defaultFeedbackSubscription(request.ProjectID, userID)
	if request.NotifyNewFeedback != nil {
		subscription.NotifyNewFeedback = *request.NotifyNewFeedback
	}
	if request.NotifyCustomerReplies != nil {
		subscription.NotifyCustomerReplies = *request.NotifyCustomerReplies
	}
	subscription.EmailEnabled = request.EmailEnabled

	// Use an explicit upsert so false values are preserved on first insert.
	// GORM otherwise replaces a false bool carrying `default:true` with true.
	now := time.Now().UTC()
	err := db.Exec(`
		INSERT INTO feedback_subscriptions (
			project_id, user_id, email_enabled,
			notify_new_feedback, notify_customer_replies,
			created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT (project_id, user_id) DO UPDATE SET
			email_enabled = EXCLUDED.email_enabled,
			notify_new_feedback = EXCLUDED.notify_new_feedback,
			notify_customer_replies = EXCLUDED.notify_customer_replies,
			updated_at = EXCLUDED.updated_at
	`,
		subscription.ProjectID,
		subscription.UserID,
		subscription.EmailEnabled,
		subscription.NotifyNewFeedback,
		subscription.NotifyCustomerReplies,
		now,
		now,
	).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackUpdateFailed, "更新反馈订阅失败: "+err.Error(), nil))
		return
	}
	if err := db.Where("project_id = ? AND user_id = ?", request.ProjectID, userID).First(&subscription).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "读取反馈订阅失败: "+err.Error(), nil))
		return
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(feedbackSubscriptionResponse(subscription)))
}

func feedbackEmailEventType(message models.FeedbackMessage) string {
	if message.Metadata != nil {
		var metadata struct {
			Source string `json:"source"`
		}
		if json.Unmarshal([]byte(*message.Metadata), &metadata) == nil && metadata.Source == "feedback_initial" {
			return models.FeedbackEmailEventNewFeedback
		}
	}
	return models.FeedbackEmailEventCustomerReply
}

func enqueueFeedbackEmailDeliveries(tx *gorm.DB, feedback models.Feedback, message models.FeedbackMessage) error {
	if !feedbackEmailNotificationsEnabled() || message.SenderType != models.FeedbackMessageSenderCustomer {
		return nil
	}
	eventType := feedbackEmailEventType(message)
	query := tx.Model(&models.FeedbackSubscription{}).
		Joins("JOIN project_members ON project_members.project_id = feedback_subscriptions.project_id AND project_members.user_id = feedback_subscriptions.user_id AND project_members.delete_at IS NULL").
		Where("feedback_subscriptions.project_id = ? AND feedback_subscriptions.email_enabled = TRUE", feedback.ProjectID)
	if eventType == models.FeedbackEmailEventNewFeedback {
		query = query.Where("feedback_subscriptions.notify_new_feedback = TRUE")
	} else {
		query = query.Where("feedback_subscriptions.notify_customer_replies = TRUE")
	}
	var subscriptions []models.FeedbackSubscription
	if err := query.Find(&subscriptions).Error; err != nil {
		return err
	}
	if len(subscriptions) == 0 {
		return nil
	}

	now := time.Now().UTC()
	deliveries := make([]models.FeedbackEmailDelivery, 0, len(subscriptions))
	for _, subscription := range subscriptions {
		deliveries = append(deliveries, models.FeedbackEmailDelivery{
			ProjectID:       feedback.ProjectID,
			FeedbackID:      feedback.ID,
			MessageID:       message.ID,
			RecipientUserID: subscription.UserID,
			EventType:       eventType,
			Status:          models.FeedbackEmailDeliveryPending,
			NextAttemptAt:   now,
		})
	}
	return tx.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "message_id"}, {Name: "recipient_user_id"}},
		DoNothing: true,
	}).Create(&deliveries).Error
}
