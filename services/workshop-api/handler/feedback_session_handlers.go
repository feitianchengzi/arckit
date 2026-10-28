package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"

	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CreateFeedbackFromSessionRequest struct {
	Title       string                           `json:"title" binding:"required"`
	Content     string                           `json:"content" binding:"required"`
	Data        json.RawMessage                  `json:"data,omitempty"`
	Attachments []FeedbackMessageAttachmentInput `json:"attachments,omitempty"`
	// ConversationID 提交反馈前客户与智能客服的独立会话 ID（feedback_id=0）。
	// 传入后把该会话关联到新建反馈，使咨询上下文延续到反馈跟进阶段；校验不通过则静默跳过。
	ConversationID string `json:"conversation_id,omitempty"`
}

func requireScopedFeedback(c *gin.Context, db *gorm.DB, feedbackID uint) (models.Feedback, middleware.FeedbackSessionScope, bool) {
	scope, ok := middleware.RequireFeedbackSessionScope(c)
	if !ok {
		return models.Feedback{}, scope, false
	}
	feedback, ok := loadFeedbackByID(c, db, feedbackID)
	if !ok {
		return feedback, scope, false
	}
	if feedback.ProjectID != scope.ProjectID || feedback.CustomUserID == nil || strings.TrimSpace(*feedback.CustomUserID) != scope.CustomUserID {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNoPermission, "您无权访问该反馈会话", nil))
		return feedback, scope, false
	}
	return feedback, scope, true
}

func CreateFeedbackFromSession(c *gin.Context) {
	scope, ok := middleware.RequireFeedbackSessionScope(c)
	if !ok {
		return
	}
	var req CreateFeedbackFromSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}
	req.Title = strings.TrimSpace(req.Title)
	req.Content = strings.TrimSpace(req.Content)
	if req.Title == "" || len(req.Title) > 200 || req.Content == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "标题不能为空且不能超过 200 字符，反馈内容不能为空", nil))
		return
	}

	data, validData := normalizeMetadata(req.Data)
	if !validData {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "data 必须是合法 JSON", nil))
		return
	}
	if err := validateFeedbackClarification(data); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, err.Error(), nil))
		return
	}

	attachments, err := buildFeedbackMessageAttachments(req.Attachments, feedbackAttachmentPrefix(scope.ProjectID, scope.CustomUserID))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, err.Error(), nil))
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	shortID, err := ensureFeedbackShortID(db, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackCreateFailed, "生成短 ID 失败: "+err.Error(), nil))
		return
	}

	customUserID := scope.CustomUserID
	feedback := models.Feedback{
		ProjectID:    scope.ProjectID,
		ShortID:      shortID,
		Title:        req.Title,
		Content:      req.Content,
		Status:       feedbackStatusFromData(data, models.FeedbackStatusPending),
		CustomUserID: &customUserID,
		Data:         data,
	}
	var initialMessage models.FeedbackMessage
	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&feedback).Error; err != nil {
			if isUniqueViolation(err, "uniq_feedback_short_id") {
				return errFeedbackShortIDExists
			}
			return err
		}
		var err error
		initialMessage, err = createFeedbackMessageRecord(
			tx,
			feedback,
			models.FeedbackMessageSenderCustomer,
			nil,
			&customUserID,
			nil,
			models.FeedbackMessageTypeText,
			req.Content,
			initialFeedbackMessageMetadata(false),
			attachments,
		)
		if err != nil {
			return err
		}
		return createFeedbackNotificationsForMessage(tx, feedback, initialMessage)
	}); err != nil {
		if errors.Is(err, errFeedbackShortIDExists) {
			c.JSON(http.StatusConflict, response.NewErrorResponse(response.CodeBadRequest, "短 ID 冲突，请重试", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackCreateFailed, "创建反馈失败: "+err.Error(), nil))
		return
	}

	feedbackResponse := buildFeedbackResponse(feedback)
	notifyProjectEvent(c, db, feedback.ProjectID, 0, "feedback.created", feedbackResponse)
	notifyProjectEvent(c, db, feedback.ProjectID, 0, "feedback.message.created", buildFeedbackMessageResponse(initialMessage))
	// 关联提交前的独立智能客服会话到该反馈，咨询上下文延续到跟进阶段；校验不通过静默跳过。
	if err := linkStandaloneConversationToFeedback(db, req.ConversationID, feedback.ID, scope.ProjectID, scope.CustomUserID); err != nil {
		log.Printf("[feedback-session] link standalone conversation failed feedback=%d conv=%s: %v", feedback.ID, req.ConversationID, err)
	}
	c.JSON(http.StatusCreated, response.NewSuccessResponse(feedbackResponse))
}

func GetFeedbacksFromSession(c *gin.Context) {
	scope, ok := middleware.RequireFeedbackSessionScope(c)
	if !ok {
		return
	}
	if suppliedProjectID := strings.TrimSpace(c.Query("project_id")); suppliedProjectID != "" && suppliedProjectID != "0" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "反馈会话不接受 project_id 查询参数，项目范围由 token 决定", nil))
		return
	}
	if suppliedCustomUserID := strings.TrimSpace(c.Query("custom_user_id")); suppliedCustomUserID != "" && suppliedCustomUserID != scope.CustomUserID {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNoPermission, "custom_user_id 与反馈会话范围不匹配", nil))
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	pagination, _ := ParsePagination(c)
	query := db.Model(&models.Feedback{}).
		Where("project_id = ? AND custom_user_id = ?", scope.ProjectID, scope.CustomUserID).
		Order("created_at DESC").
		Order("id DESC")

	var total int64
	if err := query.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈总数失败: "+err.Error(), nil))
		return
	}
	var feedbacks []models.Feedback
	if err := query.Offset(pagination.Offset).Limit(pagination.Limit).Find(&feedbacks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈失败: "+err.Error(), nil))
		return
	}
	items := make([]FeedbackResponse, 0, len(feedbacks))
	for _, feedback := range feedbacks {
		items = append(items, buildFeedbackResponse(feedback))
	}
	c.JSON(http.StatusOK, response.NewSuccessResponseWithMeta(items, response.Meta{
		Page:     pagination.Page,
		PageSize: pagination.PageSize,
		Total:    int(total),
	}))
}

func GetFeedbackMessagesFromSession(c *gin.Context) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	feedback, scope, ok := requireScopedFeedback(c, db, feedbackID)
	if !ok {
		return
	}
	if suppliedCustomUserID := strings.TrimSpace(c.Query("custom_user_id")); suppliedCustomUserID != "" && suppliedCustomUserID != scope.CustomUserID {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNoPermission, "custom_user_id 与反馈会话范围不匹配", nil))
		return
	}

	pagination, _ := ParsePagination(c)
	query := db.Model(&models.FeedbackMessage{}).
		Where("feedback_id = ?", feedback.ID).
		Order("created_at ASC").
		Order("id ASC")
	var total int64
	if err := query.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈消息总数失败: "+err.Error(), nil))
		return
	}
	var messages []models.FeedbackMessage
	if err := query.Preload("Attachments", func(db *gorm.DB) *gorm.DB {
		return db.Order("created_at ASC").Order("id ASC")
	}).Offset(pagination.Offset).Limit(pagination.Limit).Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈消息失败: "+err.Error(), nil))
		return
	}
	items := make([]FeedbackMessageResponse, 0, len(messages))
	for _, message := range messages {
		items = append(items, buildFeedbackMessageResponse(message))
	}
	c.JSON(http.StatusOK, response.NewSuccessResponseWithMeta(items, response.Meta{
		Page:     pagination.Page,
		PageSize: pagination.PageSize,
		Total:    int(total),
	}))
}

// GetConversationMessagesFromSession 返回某反馈的统一会话视图：
// 聚合 agent_message_records（客户与智能客服的咨询/Agent 回答/P3 同步的客服回复）
// 与 feedback_messages（客户首条反馈/客服 developer 回复/system 消息），按时间升序。
// 客户在反馈详情会话看到完整对话流，不必在智能客服面板与反馈消息间来回切换。
// GET /workshop/v2/feedback/feedbacks/:id/conversation-messages
func GetConversationMessagesFromSession(c *gin.Context) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	feedback, _, ok := requireScopedFeedback(c, db, feedbackID)
	if !ok {
		return
	}
	views := aggregateConversationMessages(db, feedback.ID)
	c.JSON(http.StatusOK, response.NewSuccessResponse(views))
}

func CreateFeedbackMessageFromSession(c *gin.Context) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}
	var req CreateFeedbackMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}
	content := strings.TrimSpace(req.Content)
	if content == "" && len(req.Attachments) == 0 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "消息内容或附件不能为空", nil))
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	feedback, scope, ok := requireScopedFeedback(c, db, feedbackID)
	if !ok {
		return
	}
	if req.CustomUserID != nil && strings.TrimSpace(*req.CustomUserID) != scope.CustomUserID {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNoPermission, "custom_user_id 与反馈会话范围不匹配", nil))
		return
	}
	metadata, ok := normalizeMetadata(req.Metadata)
	if !ok {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "metadata 必须是合法 JSON", nil))
		return
	}
	if err := validateFeedbackClarification(metadata); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, err.Error(), nil))
		return
	}

	attachments, err := buildFeedbackMessageAttachments(req.Attachments, feedbackAttachmentPrefix(scope.ProjectID, scope.CustomUserID))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, err.Error(), nil))
		return
	}
	clientMessageID := trimStringPtr(req.ClientMessageID)
	if clientMessageID == nil || len(*clientMessageID) > 128 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "反馈会话消息必须提供不超过 128 字符的 client_message_id", nil))
		return
	}

	customUserID := scope.CustomUserID
	var message models.FeedbackMessage
	created := true
	var taskComments []models.TaskAttachment
	if err := db.Transaction(func(tx *gorm.DB) error {
		var err error
		message, created, err = createCustomerMessageWithIdempotency(tx, feedback, &customUserID, clientMessageID, content, metadata, attachments)
		if err != nil {
			return err
		}
		if created {
			taskComments, err = createCustomerFeedbackTaskComments(tx, feedback, message)
			if err != nil {
				return err
			}
			return createFeedbackNotificationsForMessage(tx, feedback, message)
		}
		return nil
	}); err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackCreateFailed, "创建反馈消息失败: "+err.Error(), nil))
		return
	}

	result := buildFeedbackMessageResponse(message)
	if created {
		notifyProjectEvent(c, db, feedback.ProjectID, 0, "feedback.message.created", result)
		notifyFeedbackTaskAttachmentCreated(c, db, feedback.ProjectID, 0, taskComments)
		c.JSON(http.StatusCreated, response.NewSuccessResponse(result))
		return
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(result))
}
