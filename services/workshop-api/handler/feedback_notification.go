package handler

import (
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

const maxFeedbackNotificationReadIDs = 100

// FEEDBACK_V2_NOTIFICATION_PROJECT_IDS is deliberately an opt-in server-side
// rollout gate. An empty value means deployed V2 clients retain their current
// behavior and no notification rows are written.
func feedbackNotificationsEnabledForProject(projectID uint) bool {
	if projectID == 0 {
		return false
	}
	for _, rawID := range strings.Split(os.Getenv("FEEDBACK_V2_NOTIFICATION_PROJECT_IDS"), ",") {
		parsed, err := strconv.ParseUint(strings.TrimSpace(rawID), 10, 64)
		if err == nil && uint(parsed) == projectID {
			return true
		}
	}
	return false
}

type feedbackNotificationRecipient struct {
	ProjectID     uint
	RecipientType string
	UserID        *uint
	CustomUserID  *string
}

type FeedbackNotificationListQuery struct {
	ProjectID    uint   `form:"project_id"`
	CustomUserID string `form:"custom_user_id"`
	FeedbackID   uint   `form:"feedback_id"`
	UnreadOnly   bool   `form:"unread_only"`
}

type MarkFeedbackNotificationsReadRequest struct {
	ProjectID       uint   `json:"project_id,omitempty"`
	CustomUserID    string `json:"custom_user_id,omitempty"`
	FeedbackID      *uint  `json:"feedback_id,omitempty"`
	NotificationIDs []uint `json:"notification_ids,omitempty"`
}

type FeedbackNotificationResponse struct {
	ID              uint    `json:"id"`
	ProjectID       uint    `json:"project_id"`
	FeedbackID      uint    `json:"feedback_id"`
	FeedbackShortID string  `json:"feedback_short_id,omitempty"`
	FeedbackTitle   string  `json:"feedback_title,omitempty"`
	MessageID       uint    `json:"message_id"`
	MessageType     string  `json:"message_type"`
	MessagePreview  string  `json:"message_preview"`
	SenderType      string  `json:"sender_type"`
	Type            string  `json:"type"`
	CreatedAt       string  `json:"created_at"`
	ReadAt          *string `json:"read_at,omitempty"`
}

type FeedbackNotificationListResponse struct {
	Notifications []FeedbackNotificationResponse `json:"notifications"`
	UnreadCount   int                            `json:"unread_count"`
}

type MarkFeedbackNotificationsReadResponse struct {
	MarkedCount int    `json:"marked_count"`
	ReadAt      string `json:"read_at"`
}

func feedbackNotificationTypeForMessage(message models.FeedbackMessage) string {
	switch message.SenderType {
	case models.FeedbackMessageSenderCustomer:
		return models.FeedbackNotificationTypeCustomerMessage
	case models.FeedbackMessageSenderDeveloper:
		return models.FeedbackNotificationTypeDeveloperMessage
	case models.FeedbackMessageSenderSystem:
		switch message.MessageType {
		case models.FeedbackMessageTypeStatusChange, models.FeedbackMessageTypeTaskLink:
			return models.FeedbackNotificationTypeStatusChange
		}
	}
	return ""
}

// createFeedbackNotificationsForMessage is called in the same transaction as
// the message write. A notification therefore can never point at a message
// that was rolled back, and retries remain safe through the partial indexes.
func createFeedbackNotificationsForMessage(tx *gorm.DB, feedback models.Feedback, message models.FeedbackMessage) error {
	if !feedbackNotificationsEnabledForProject(feedback.ProjectID) {
		return nil
	}
	notificationType := feedbackNotificationTypeForMessage(message)
	if notificationType == "" {
		return nil
	}

	notifications := make([]models.FeedbackNotification, 0)
	switch message.SenderType {
	case models.FeedbackMessageSenderCustomer:
		var members []models.ProjectMember
		if err := tx.Where("project_id = ?", feedback.ProjectID).Find(&members).Error; err != nil {
			return err
		}
		for _, member := range members {
			memberID := member.UserID
			notifications = append(notifications, models.FeedbackNotification{
				ProjectID:       feedback.ProjectID,
				FeedbackID:      feedback.ID,
				MessageID:       message.ID,
				RecipientType:   models.FeedbackNotificationRecipientDeveloper,
				RecipientUserID: &memberID,
				Type:            notificationType,
			})
		}
	case models.FeedbackMessageSenderDeveloper, models.FeedbackMessageSenderSystem:
		if feedback.CustomUserID == nil || strings.TrimSpace(*feedback.CustomUserID) == "" {
			return nil
		}
		customUserID := strings.TrimSpace(*feedback.CustomUserID)
		notifications = append(notifications, models.FeedbackNotification{
			ProjectID:             feedback.ProjectID,
			FeedbackID:            feedback.ID,
			MessageID:             message.ID,
			RecipientType:         models.FeedbackNotificationRecipientCustomer,
			RecipientCustomUserID: &customUserID,
			Type:                  notificationType,
		})
	}

	if len(notifications) == 0 {
		return nil
	}
	return tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&notifications).Error
}

func feedbackNotificationRecipientQuery(db *gorm.DB, recipient feedbackNotificationRecipient) *gorm.DB {
	query := db.Model(&models.FeedbackNotification{}).
		Where("project_id = ? AND recipient_type = ?", recipient.ProjectID, recipient.RecipientType)
	if recipient.UserID != nil {
		query = query.Where("recipient_user_id = ?", *recipient.UserID)
	}
	if recipient.CustomUserID != nil {
		query = query.Where("recipient_custom_user_id = ?", *recipient.CustomUserID)
	}
	return query
}

func requireFeedbackNotificationsEnabled(c *gin.Context, projectID uint) bool {
	if feedbackNotificationsEnabledForProject(projectID) {
		return true
	}
	c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeNotFound, "该项目尚未启用 V2 通知能力", nil))
	return false
}

func feedbackNotificationPreview(content string) string {
	compact := strings.Join(strings.Fields(content), " ")
	runes := []rune(compact)
	if len(runes) <= 140 {
		return compact
	}
	return string(runes[:140]) + "..."
}

func buildFeedbackNotificationResponse(notification models.FeedbackNotification) FeedbackNotificationResponse {
	var readAt *string
	if notification.ReadAt != nil {
		value := notification.ReadAt.Format(time.RFC3339)
		readAt = &value
	}
	return FeedbackNotificationResponse{
		ID:              notification.ID,
		ProjectID:       notification.ProjectID,
		FeedbackID:      notification.FeedbackID,
		FeedbackShortID: notification.Feedback.ShortID,
		FeedbackTitle:   notification.Feedback.Title,
		MessageID:       notification.MessageID,
		MessageType:     notification.Message.MessageType,
		MessagePreview:  feedbackNotificationPreview(notification.Message.Content),
		SenderType:      notification.Message.SenderType,
		Type:            notification.Type,
		CreatedAt:       notification.CreatedAt.Format(time.RFC3339),
		ReadAt:          readAt,
	}
}

func listFeedbackNotifications(c *gin.Context, db *gorm.DB, recipient feedbackNotificationRecipient, query FeedbackNotificationListQuery) {
	unreadQuery := feedbackNotificationRecipientQuery(db, recipient).Where("read_at IS NULL")
	var unreadCount int64
	if err := unreadQuery.Count(&unreadCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询未读反馈通知失败: "+err.Error(), nil))
		return
	}

	listQuery := feedbackNotificationRecipientQuery(db, recipient)
	if query.FeedbackID != 0 {
		listQuery = listQuery.Where("feedback_id = ?", query.FeedbackID)
	}
	if query.UnreadOnly {
		listQuery = listQuery.Where("read_at IS NULL")
	}

	pagination, _ := ParsePagination(c)
	var total int64
	if err := listQuery.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈通知总数失败: "+err.Error(), nil))
		return
	}

	var notifications []models.FeedbackNotification
	if err := listQuery.
		Preload("Feedback").
		Preload("Message").
		Order("feedback_notifications.created_at DESC").
		Order("feedback_notifications.id DESC").
		Offset(pagination.Offset).
		Limit(pagination.Limit).
		Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈通知失败: "+err.Error(), nil))
		return
	}

	items := make([]FeedbackNotificationResponse, 0, len(notifications))
	for _, notification := range notifications {
		items = append(items, buildFeedbackNotificationResponse(notification))
	}
	c.JSON(http.StatusOK, response.NewSuccessResponseWithMeta(FeedbackNotificationListResponse{
		Notifications: items,
		UnreadCount:   int(unreadCount),
	}, response.Meta{
		Page:     pagination.Page,
		PageSize: pagination.PageSize,
		Total:    int(total),
	}))
}

func normalizeFeedbackNotificationIDs(ids []uint) ([]uint, bool) {
	if len(ids) > maxFeedbackNotificationReadIDs {
		return nil, false
	}
	seen := make(map[uint]struct{}, len(ids))
	normalized := make([]uint, 0, len(ids))
	for _, id := range ids {
		if id == 0 {
			return nil, false
		}
		if _, exists := seen[id]; exists {
			continue
		}
		seen[id] = struct{}{}
		normalized = append(normalized, id)
	}
	return normalized, true
}

func markFeedbackNotificationsRead(c *gin.Context, db *gorm.DB, recipient feedbackNotificationRecipient, request MarkFeedbackNotificationsReadRequest) {
	if request.FeedbackID != nil && *request.FeedbackID == 0 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "feedback_id 必须是有效的反馈 ID", nil))
		return
	}
	notificationIDs, valid := normalizeFeedbackNotificationIDs(request.NotificationIDs)
	if !valid {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "notification_ids 最多 100 个，且必须是有效 ID", nil))
		return
	}
	if request.FeedbackID == nil && len(notificationIDs) == 0 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请提供 feedback_id 或 notification_ids", nil))
		return
	}

	query := feedbackNotificationRecipientQuery(db, recipient).Where("read_at IS NULL")
	if request.FeedbackID != nil {
		query = query.Where("feedback_id = ?", *request.FeedbackID)
	}
	if len(notificationIDs) > 0 {
		query = query.Where("id IN ?", notificationIDs)
	}
	now := time.Now().UTC()
	result := query.Update("read_at", now)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackUpdateFailed, "标记反馈通知已读失败: "+result.Error.Error(), nil))
		return
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(MarkFeedbackNotificationsReadResponse{
		MarkedCount: int(result.RowsAffected),
		ReadAt:      now.Format(time.RFC3339),
	}))
}

func requireFeedbackNotificationProjectMember(c *gin.Context, db *gorm.DB, projectID uint, action string) (feedbackNotificationRecipient, bool) {
	if projectID == 0 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "project_id 为必填项", nil))
		return feedbackNotificationRecipient{}, false
	}
	userID, ok := requireFeedbackProjectMember(c, db, projectID, action)
	if !ok {
		return feedbackNotificationRecipient{}, false
	}
	return feedbackNotificationRecipient{
		ProjectID:     projectID,
		RecipientType: models.FeedbackNotificationRecipientDeveloper,
		UserID:        &userID,
	}, true
}

func requireFeedbackNotificationAPIKeyRecipient(c *gin.Context, projectID uint, customUserID string) (feedbackNotificationRecipient, bool) {
	scope, ok := requireAPIKeyFeedbackAttachmentScope(c, projectID, customUserID)
	if !ok {
		return feedbackNotificationRecipient{}, false
	}
	customUserID = strings.TrimSpace(scope.CustomUserID)
	return feedbackNotificationRecipient{
		ProjectID:     scope.ProjectID,
		RecipientType: models.FeedbackNotificationRecipientCustomer,
		CustomUserID:  &customUserID,
	}, true
}

func requireFeedbackNotificationSessionRecipient(c *gin.Context) (feedbackNotificationRecipient, bool) {
	scope, ok := middleware.RequireFeedbackSessionScope(c)
	if !ok {
		return feedbackNotificationRecipient{}, false
	}
	customUserID := scope.CustomUserID
	return feedbackNotificationRecipient{
		ProjectID:     scope.ProjectID,
		RecipientType: models.FeedbackNotificationRecipientCustomer,
		CustomUserID:  &customUserID,
	}, true
}

// GetFeedbackNotifications returns a project member's V2 in-app feedback notifications.
func GetFeedbackNotifications(c *gin.Context) {
	var query FeedbackNotificationListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	recipient, ok := requireFeedbackNotificationProjectMember(c, db, query.ProjectID, "查看反馈通知")
	if !ok {
		return
	}
	if !requireFeedbackNotificationsEnabled(c, recipient.ProjectID) {
		return
	}
	listFeedbackNotifications(c, db, recipient, query)
}

// MarkFeedbackNotificationsRead marks a project member's selected feedback notifications as read.
func MarkFeedbackNotificationsRead(c *gin.Context) {
	var request MarkFeedbackNotificationsReadRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	recipient, ok := requireFeedbackNotificationProjectMember(c, db, request.ProjectID, "标记反馈通知已读")
	if !ok {
		return
	}
	if !requireFeedbackNotificationsEnabled(c, recipient.ProjectID) {
		return
	}
	markFeedbackNotificationsRead(c, db, recipient, request)
}

// GetFeedbackNotificationsByAPIKey supports direct V2 SDK mode. The gateway
// validates the API Key, while this handler requires the current key owner to
// remain a project member and scopes results to one customer identity.
func GetFeedbackNotificationsByAPIKey(c *gin.Context) {
	var query FeedbackNotificationListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}
	if strings.TrimSpace(query.CustomUserID) == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "V2 API Key 查询反馈通知时 custom_user_id 为必填项", nil))
		return
	}
	recipient, ok := requireFeedbackNotificationAPIKeyRecipient(c, query.ProjectID, query.CustomUserID)
	if !ok {
		return
	}
	if !requireFeedbackNotificationsEnabled(c, recipient.ProjectID) {
		return
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	listFeedbackNotifications(c, db, recipient, query)
}

func MarkFeedbackNotificationsReadByAPIKey(c *gin.Context) {
	var request MarkFeedbackNotificationsReadRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}
	if strings.TrimSpace(request.CustomUserID) == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "V2 API Key 标记反馈通知时 custom_user_id 为必填项", nil))
		return
	}
	recipient, ok := requireFeedbackNotificationAPIKeyRecipient(c, request.ProjectID, request.CustomUserID)
	if !ok {
		return
	}
	if !requireFeedbackNotificationsEnabled(c, recipient.ProjectID) {
		return
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	markFeedbackNotificationsRead(c, db, recipient, request)
}

func GetFeedbackNotificationsFromSession(c *gin.Context) {
	var query FeedbackNotificationListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}
	recipient, ok := requireFeedbackNotificationSessionRecipient(c)
	if !ok {
		return
	}
	if query.ProjectID != 0 && query.ProjectID != recipient.ProjectID {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNoPermission, "project_id 与反馈会话范围不匹配", nil))
		return
	}
	if customUserID := strings.TrimSpace(query.CustomUserID); customUserID != "" && recipient.CustomUserID != nil && customUserID != *recipient.CustomUserID {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNoPermission, "custom_user_id 与反馈会话范围不匹配", nil))
		return
	}
	if !requireFeedbackNotificationsEnabled(c, recipient.ProjectID) {
		return
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	listFeedbackNotifications(c, db, recipient, query)
}

func MarkFeedbackNotificationsReadFromSession(c *gin.Context) {
	var request MarkFeedbackNotificationsReadRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}
	recipient, ok := requireFeedbackNotificationSessionRecipient(c)
	if !ok {
		return
	}
	if request.ProjectID != 0 && request.ProjectID != recipient.ProjectID {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNoPermission, "project_id 与反馈会话范围不匹配", nil))
		return
	}
	if customUserID := strings.TrimSpace(request.CustomUserID); customUserID != "" && recipient.CustomUserID != nil && customUserID != *recipient.CustomUserID {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNoPermission, "custom_user_id 与反馈会话范围不匹配", nil))
		return
	}
	if !requireFeedbackNotificationsEnabled(c, recipient.ProjectID) {
		return
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	markFeedbackNotificationsRead(c, db, recipient, request)
}
