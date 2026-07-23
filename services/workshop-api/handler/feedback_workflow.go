package handler

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type FeedbackMessageAttachmentInput struct {
	Type      string  `json:"type" binding:"required"`
	ObjectKey *string `json:"object_key,omitempty"`
	URL       *string `json:"url,omitempty"`
	FileName  *string `json:"file_name,omitempty"`
	MimeType  *string `json:"mime_type,omitempty"`
	Size      *int64  `json:"size,omitempty"`
}

type CreateFeedbackMessageRequest struct {
	Content         string                           `json:"content,omitempty"`
	CustomUserID    *string                          `json:"custom_user_id,omitempty"`
	ClientMessageID *string                          `json:"client_message_id,omitempty"`
	Metadata        json.RawMessage                  `json:"metadata,omitempty"`
	Attachments     []FeedbackMessageAttachmentInput `json:"attachments,omitempty"`
}

type FeedbackMessageAttachmentResponse struct {
	ID        uint    `json:"id"`
	MessageID uint    `json:"message_id"`
	Type      string  `json:"type"`
	ObjectKey *string `json:"object_key,omitempty"`
	URL       *string `json:"url,omitempty"`
	FileName  *string `json:"file_name,omitempty"`
	MimeType  *string `json:"mime_type,omitempty"`
	Size      *int64  `json:"size,omitempty"`
	CreatedAt string  `json:"created_at"`
	UpdatedAt string  `json:"updated_at"`
}

type FeedbackMessageResponse struct {
	ID                 uint                                `json:"id"`
	FeedbackID         uint                                `json:"feedback_id"`
	ProjectID          uint                                `json:"project_id"`
	SenderType         string                              `json:"sender_type"`
	SenderUserID       *uint                               `json:"sender_user_id,omitempty"`
	SenderCustomUserID *string                             `json:"sender_custom_user_id,omitempty"`
	ClientMessageID    *string                             `json:"client_message_id,omitempty"`
	MessageType        string                              `json:"message_type"`
	Content            string                              `json:"content"`
	Metadata           interface{}                         `json:"metadata,omitempty"`
	Attachments        []FeedbackMessageAttachmentResponse `json:"attachments"`
	CreatedAt          string                              `json:"created_at"`
	UpdatedAt          string                              `json:"updated_at"`
}

type ConvertFeedbackToTaskRequest struct {
	Content    *string `json:"content,omitempty"`
	State      *string `json:"state,omitempty"`
	ExecutorID *uint   `json:"executor_id,omitempty"`
	FatherID   *uint   `json:"father_id,omitempty"`
	Priority   *int    `json:"priority,omitempty"`
	Tags       *string `json:"tags,omitempty"`
}

type FeedbackTaskLinkResponse struct {
	ID           uint   `json:"id"`
	FeedbackID   uint   `json:"feedback_id"`
	ProjectID    uint   `json:"project_id"`
	TaskID       uint   `json:"task_id"`
	RelationType string `json:"relation_type"`
	IsPrimary    bool   `json:"is_primary"`
	CreatedBy    *uint  `json:"created_by,omitempty"`
	CreatedAt    string `json:"created_at"`
	UpdatedAt    string `json:"updated_at"`
}

type ConvertFeedbackToTaskResponse struct {
	Feedback FeedbackResponse         `json:"feedback"`
	Task     TaskResponse             `json:"task"`
	Link     FeedbackTaskLinkResponse `json:"link"`
}

type feedbackWorkflowEvent struct {
	ProjectID uint
	Event     string
	Data      interface{}
}

var errFeedbackAlreadyConverted = errors.New("feedback already converted")

func isAPIKeyRequest(c *gin.Context) bool {
	return strings.Contains(c.FullPath(), "/apikey/") || strings.Contains(c.Request.URL.Path, "/apikey/")
}

func isV2Request(c *gin.Context) bool {
	return strings.Contains(c.FullPath(), "/v2/") || strings.Contains(c.Request.URL.Path, "/v2/")
}

func isV2APIKeyRequest(c *gin.Context) bool {
	return isV2Request(c) && isAPIKeyRequest(c)
}

func parseFeedbackIDParam(c *gin.Context) (uint, bool) {
	raw := strings.TrimSpace(c.Param("id"))
	if raw == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "反馈ID不能为空", nil))
		return 0, false
	}
	parsed, err := strconv.ParseUint(raw, 10, 64)
	if err != nil || parsed == 0 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的反馈ID", nil))
		return 0, false
	}
	return uint(parsed), true
}

func loadFeedbackByID(c *gin.Context, db *gorm.DB, feedbackID uint) (models.Feedback, bool) {
	var feedback models.Feedback
	if err := db.First(&feedback, feedbackID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeFeedbackNotFound, "反馈不存在", nil))
			return feedback, false
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈失败: "+err.Error(), nil))
		return feedback, false
	}
	return feedback, true
}

func requireFeedbackProjectMember(c *gin.Context, db *gorm.DB, projectID uint, action string) (uint, bool) {
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return 0, false
	}

	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", projectID, userID).First(&member).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNotMember, "您不是该项目的成员，无法"+action, nil))
			return 0, false
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
		return 0, false
	}

	return userID, true
}

func trimStringPtr(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func requireCustomerFeedbackAccess(c *gin.Context, feedback models.Feedback, customUserID string) (*string, bool) {
	trimmed := strings.TrimSpace(customUserID)
	if trimmed == "" {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNoPermission, "缺少 custom_user_id，无法访问该反馈消息", nil))
		return nil, false
	}
	if feedback.CustomUserID == nil || strings.TrimSpace(*feedback.CustomUserID) != trimmed {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNoPermission, "您无权访问该反馈消息", nil))
		return nil, false
	}
	return &trimmed, true
}

func normalizeMetadata(raw json.RawMessage) (*string, bool) {
	if len(raw) == 0 || bytes.Equal(raw, []byte("null")) {
		return nil, true
	}
	if !json.Valid(raw) {
		return nil, false
	}
	var compact bytes.Buffer
	if err := json.Compact(&compact, raw); err != nil {
		return nil, false
	}
	text := compact.String()
	return &text, true
}

func buildFeedbackMessageAttachment(input FeedbackMessageAttachmentInput, objectKeyPrefix string) (models.FeedbackMessageAttachment, error) {
	attachmentType := strings.ToLower(strings.TrimSpace(input.Type))
	if !models.IsValidFeedbackAttachmentType(attachmentType) {
		return models.FeedbackMessageAttachment{}, fmt.Errorf("无效的附件类型")
	}
	objectKey := trimStringPtr(input.ObjectKey)
	urlValue := trimStringPtr(input.URL)
	mimeType := trimStringPtr(input.MimeType)

	if attachmentType == models.FeedbackAttachmentTypeURL {
		if objectKey != nil || urlValue == nil {
			return models.FeedbackMessageAttachment{}, fmt.Errorf("url 类型附件必须且只能提供 https url")
		}
		parsed, err := url.Parse(*urlValue)
		if err != nil || parsed.Scheme != "https" || parsed.Host == "" {
			return models.FeedbackMessageAttachment{}, fmt.Errorf("外链附件必须使用有效的 https URL")
		}
		return models.FeedbackMessageAttachment{
			Type:     attachmentType,
			URL:      urlValue,
			FileName: trimStringPtr(input.FileName),
		}, nil
	}

	if objectKey == nil || urlValue != nil {
		return models.FeedbackMessageAttachment{}, fmt.Errorf("image/file 类型附件必须且只能提供 object_key")
	}
	if objectKeyPrefix != "" && !strings.HasPrefix(*objectKey, objectKeyPrefix) {
		return models.FeedbackMessageAttachment{}, fmt.Errorf("附件 object_key 不属于当前反馈会话范围")
	}
	if mimeType == nil {
		return models.FeedbackMessageAttachment{}, fmt.Errorf("image/file 类型附件必须提供 mime_type")
	}
	if input.Size == nil || *input.Size <= 0 {
		return models.FeedbackMessageAttachment{}, fmt.Errorf("image/file 类型附件必须提供大于 0 的 size")
	}
	normalizedMIME, err := validateFeedbackAttachmentMetadata(attachmentType, *mimeType, *input.Size)
	if err != nil {
		return models.FeedbackMessageAttachment{}, err
	}
	return models.FeedbackMessageAttachment{
		Type:      attachmentType,
		ObjectKey: objectKey,
		FileName:  trimStringPtr(input.FileName),
		MimeType:  &normalizedMIME,
		Size:      input.Size,
	}, nil
}

func validateFeedbackAttachmentMetadata(attachmentType, mimeType string, size int64) (string, error) {
	attachmentType = strings.ToLower(strings.TrimSpace(attachmentType))
	mimeType = strings.ToLower(strings.TrimSpace(mimeType))
	if size <= 0 {
		return "", fmt.Errorf("附件大小必须大于 0")
	}

	maxSize := feedbackFileMaxSize
	switch attachmentType {
	case models.FeedbackAttachmentTypeImage:
		allowed := map[string]bool{
			"image/jpeg": true,
			"image/png":  true,
			"image/webp": true,
			"image/gif":  true,
		}
		if !allowed[mimeType] {
			return "", fmt.Errorf("不支持的图片 MIME 类型")
		}
		maxSize = feedbackImageMaxSize
	case models.FeedbackAttachmentTypeFile:
		allowed := map[string]bool{
			"application/pdf": true,
			"text/plain":      true,
			"text/csv":        true,
			"application/zip": true,
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document":   true,
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":         true,
			"application/vnd.openxmlformats-officedocument.presentationml.presentation": true,
		}
		if !allowed[mimeType] {
			return "", fmt.Errorf("不支持的文件 MIME 类型")
		}
	default:
		return "", fmt.Errorf("仅 image/file 类型附件支持上传")
	}
	if size > maxSize {
		return "", fmt.Errorf("附件大小超过限制")
	}
	return mimeType, nil
}

func buildFeedbackMessageAttachments(inputs []FeedbackMessageAttachmentInput, objectKeyPrefix string) ([]models.FeedbackMessageAttachment, error) {
	if len(inputs) > 10 {
		return nil, fmt.Errorf("单条消息最多支持 10 个附件")
	}
	attachments := make([]models.FeedbackMessageAttachment, 0, len(inputs))
	var totalSize int64
	for _, input := range inputs {
		attachment, err := buildFeedbackMessageAttachment(input, objectKeyPrefix)
		if err != nil {
			return nil, err
		}
		if attachment.Size != nil {
			totalSize += *attachment.Size
		}
		attachments = append(attachments, attachment)
	}
	if totalSize > feedbackFileMaxSize {
		return nil, fmt.Errorf("单条消息的附件总大小超过限制")
	}
	return attachments, nil
}

func buildFeedbackMessageAttachmentResponse(attachment models.FeedbackMessageAttachment) FeedbackMessageAttachmentResponse {
	return FeedbackMessageAttachmentResponse{
		ID:        attachment.ID,
		MessageID: attachment.MessageID,
		Type:      attachment.Type,
		ObjectKey: attachment.ObjectKey,
		URL:       attachment.URL,
		FileName:  attachment.FileName,
		MimeType:  attachment.MimeType,
		Size:      attachment.Size,
		CreatedAt: attachment.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: attachment.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

func parseMetadataForResponse(metadata *string) interface{} {
	if metadata == nil || strings.TrimSpace(*metadata) == "" {
		return nil
	}
	var parsed interface{}
	if err := json.Unmarshal([]byte(*metadata), &parsed); err != nil {
		return *metadata
	}
	return parsed
}

func buildFeedbackMessageResponse(message models.FeedbackMessage) FeedbackMessageResponse {
	attachments := make([]FeedbackMessageAttachmentResponse, 0, len(message.Attachments))
	for _, attachment := range message.Attachments {
		attachments = append(attachments, buildFeedbackMessageAttachmentResponse(attachment))
	}

	return FeedbackMessageResponse{
		ID:                 message.ID,
		FeedbackID:         message.FeedbackID,
		ProjectID:          message.ProjectID,
		SenderType:         message.SenderType,
		SenderUserID:       message.SenderUserID,
		SenderCustomUserID: message.SenderCustomUserID,
		ClientMessageID:    message.ClientMessageID,
		MessageType:        message.MessageType,
		Content:            message.Content,
		Metadata:           parseMetadataForResponse(message.Metadata),
		Attachments:        attachments,
		CreatedAt:          message.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:          message.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

func buildFeedbackTaskLinkResponse(link models.FeedbackTaskLink) FeedbackTaskLinkResponse {
	return FeedbackTaskLinkResponse{
		ID:           link.ID,
		FeedbackID:   link.FeedbackID,
		ProjectID:    link.ProjectID,
		TaskID:       link.TaskID,
		RelationType: link.RelationType,
		IsPrimary:    link.IsPrimary,
		CreatedBy:    link.CreatedBy,
		CreatedAt:    link.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:    link.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

func updateFeedbackMessageTimestamps(tx *gorm.DB, feedbackID uint, senderType string, now time.Time) error {
	updates := map[string]interface{}{
		"last_message_at": now,
	}
	switch senderType {
	case models.FeedbackMessageSenderCustomer:
		updates["last_customer_message_at"] = now
	case models.FeedbackMessageSenderDeveloper:
		updates["last_developer_message_at"] = now
	}
	return tx.Model(&models.Feedback{}).Where("id = ?", feedbackID).Updates(updates).Error
}

func createFeedbackMessageRecord(tx *gorm.DB, feedback models.Feedback, senderType string, senderUserID *uint, senderCustomUserID *string, clientMessageID *string, messageType string, content string, metadata *string, attachments []models.FeedbackMessageAttachment) (models.FeedbackMessage, error) {
	message := models.FeedbackMessage{
		FeedbackID:         feedback.ID,
		ProjectID:          feedback.ProjectID,
		SenderType:         senderType,
		SenderUserID:       senderUserID,
		SenderCustomUserID: senderCustomUserID,
		ClientMessageID:    clientMessageID,
		MessageType:        messageType,
		Content:            content,
		Metadata:           metadata,
	}
	if err := tx.Create(&message).Error; err != nil {
		return message, err
	}

	for i := range attachments {
		attachments[i].MessageID = message.ID
		attachments[i].FeedbackID = feedback.ID
	}
	if len(attachments) > 0 {
		if err := tx.Create(&attachments).Error; err != nil {
			return message, err
		}
	}
	if err := updateFeedbackMessageTimestamps(tx, feedback.ID, senderType, time.Now()); err != nil {
		return message, err
	}
	if err := tx.Preload("Attachments", func(db *gorm.DB) *gorm.DB {
		return db.Order("created_at ASC").Order("id ASC")
	}).First(&message, message.ID).Error; err != nil {
		return message, err
	}
	return message, nil
}

func findCustomerMessageByClientID(tx *gorm.DB, feedbackID uint, customUserID string, clientMessageID string) (models.FeedbackMessage, bool, error) {
	var message models.FeedbackMessage
	err := tx.Where("feedback_id = ? AND sender_type = ? AND sender_custom_user_id = ? AND client_message_id = ?", feedbackID, models.FeedbackMessageSenderCustomer, customUserID, clientMessageID).
		Preload("Attachments", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC").Order("id ASC")
		}).
		First(&message).Error
	if err == nil {
		return message, true, nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return models.FeedbackMessage{}, false, nil
	}
	return models.FeedbackMessage{}, false, err
}

func createCustomerMessageWithIdempotency(tx *gorm.DB, feedback models.Feedback, customUserID *string, clientMessageID *string, content string, metadata *string, attachments []models.FeedbackMessageAttachment) (models.FeedbackMessage, bool, error) {
	if customUserID == nil {
		return models.FeedbackMessage{}, false, fmt.Errorf("缺少 customer 消息归属")
	}
	if clientMessageID != nil {
		if existing, found, err := findCustomerMessageByClientID(tx, feedback.ID, *customUserID, *clientMessageID); err != nil {
			return existing, false, err
		} else if found {
			return existing, false, nil
		}
	}

	message, err := createFeedbackMessageRecord(tx, feedback, models.FeedbackMessageSenderCustomer, nil, customUserID, clientMessageID, models.FeedbackMessageTypeText, content, metadata, attachments)
	if err == nil {
		return message, true, nil
	}
	if clientMessageID != nil && isUniqueViolation(err, "uniq_feedback_messages_customer_client_active") {
		existing, found, findErr := findCustomerMessageByClientID(tx, feedback.ID, *customUserID, *clientMessageID)
		if findErr != nil {
			return existing, false, findErr
		}
		if found {
			return existing, false, nil
		}
	}
	return message, false, err
}

func initialFeedbackMessageMetadata(legacy bool) *string {
	metadata, _ := json.Marshal(map[string]interface{}{
		"source": "feedback_initial",
		"legacy": legacy,
	})
	value := string(metadata)
	return &value
}

func createInitialFeedbackMessage(tx *gorm.DB, feedback models.Feedback, senderType string, senderUserID *uint, senderCustomUserID *string, attachments []models.FeedbackMessageAttachment) (models.FeedbackMessage, error) {
	return createFeedbackMessageRecord(
		tx,
		feedback,
		senderType,
		senderUserID,
		senderCustomUserID,
		nil,
		models.FeedbackMessageTypeText,
		feedback.Content,
		initialFeedbackMessageMetadata(false),
		attachments,
	)
}

// GetFeedbackMessages 查询反馈消息列表
func GetFeedbackMessages(c *gin.Context) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	feedback, ok := loadFeedbackByID(c, db, feedbackID)
	if !ok {
		return
	}

	if _, ok := requireFeedbackProjectMember(c, db, feedback.ProjectID, "查看反馈消息"); !ok {
		return
	}
	if isAPIKeyRequest(c) {
		if _, ok := requireCustomerFeedbackAccess(c, feedback, c.Query("custom_user_id")); !ok {
			return
		}
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
	if err := query.
		Preload("Attachments", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC").Order("id ASC")
		}).
		Offset(pagination.Offset).
		Limit(pagination.Limit).
		Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈消息失败: "+err.Error(), nil))
		return
	}

	respItems := make([]FeedbackMessageResponse, 0, len(messages))
	for _, message := range messages {
		respItems = append(respItems, buildFeedbackMessageResponse(message))
	}

	c.JSON(http.StatusOK, response.NewSuccessResponseWithMeta(respItems, response.Meta{
		Page:     pagination.Page,
		PageSize: pagination.PageSize,
		Total:    int(total),
	}))
}

// CreateFeedbackMessage 创建反馈消息
func CreateFeedbackMessage(c *gin.Context) {
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

	feedback, ok := loadFeedbackByID(c, db, feedbackID)
	if !ok {
		return
	}

	userID, ok := requireFeedbackProjectMember(c, db, feedback.ProjectID, "创建反馈消息")
	if !ok {
		return
	}

	senderType := models.FeedbackMessageSenderDeveloper
	var senderUserID *uint
	var senderCustomUserID *string
	if isAPIKeyRequest(c) {
		senderType = models.FeedbackMessageSenderCustomer
		customID := ""
		if req.CustomUserID != nil {
			customID = *req.CustomUserID
		}
		senderCustomUserID, ok = requireCustomerFeedbackAccess(c, feedback, customID)
		if !ok {
			return
		}
	} else {
		senderUserID = &userID
	}

	metadata, ok := normalizeMetadata(req.Metadata)
	if !ok {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "metadata 必须是合法 JSON", nil))
		return
	}

	objectKeyPrefix := ""
	if isV2APIKeyRequest(c) && senderCustomUserID != nil {
		objectKeyPrefix = feedbackAttachmentPrefix(feedback.ProjectID, *senderCustomUserID)
	} else if isV2Request(c) {
		objectKeyPrefix = feedbackDeveloperAttachmentPrefix(feedback.ProjectID, userID)
	}
	attachments, err := buildFeedbackMessageAttachments(req.Attachments, objectKeyPrefix)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, err.Error(), nil))
		return
	}

	clientMessageID := trimStringPtr(req.ClientMessageID)
	if clientMessageID != nil && len(*clientMessageID) > 128 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "client_message_id 最大长度为 128", nil))
		return
	}
	if clientMessageID != nil && senderType != models.FeedbackMessageSenderCustomer {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "client_message_id 仅支持 customer 消息", nil))
		return
	}

	var message models.FeedbackMessage
	created := true
	var taskComments []models.TaskAttachment
	if err := db.Transaction(func(tx *gorm.DB) error {
		var err error
		if senderType == models.FeedbackMessageSenderCustomer && clientMessageID != nil {
			message, created, err = createCustomerMessageWithIdempotency(tx, feedback, senderCustomUserID, clientMessageID, content, metadata, attachments)
		} else {
			message, err = createFeedbackMessageRecord(tx, feedback, senderType, senderUserID, senderCustomUserID, nil, models.FeedbackMessageTypeText, content, metadata, attachments)
		}
		if err != nil {
			return err
		}
		if created && senderType == models.FeedbackMessageSenderCustomer {
			taskComments, err = createCustomerFeedbackTaskComments(tx, feedback, message)
		}
		return err
	}); err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackCreateFailed, "创建反馈消息失败: "+err.Error(), nil))
		return
	}

	resp := buildFeedbackMessageResponse(message)
	if created {
		notifyProjectEvent(c, db, feedback.ProjectID, userID, "feedback.message.created", resp)
		notifyFeedbackTaskAttachmentCreated(c, db, feedback.ProjectID, userID, taskComments)
		c.JSON(http.StatusCreated, response.NewSuccessResponse(resp))
		return
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}

func parseFeedbackPayload(data *string) map[string]interface{} {
	if data == nil || strings.TrimSpace(*data) == "" {
		return map[string]interface{}{}
	}
	var payload map[string]interface{}
	if err := json.Unmarshal([]byte(*data), &payload); err != nil || payload == nil {
		return map[string]interface{}{
			"raw_data": *data,
		}
	}
	return payload
}

func canonicalFeedbackStatus(raw string) string {
	status := strings.ToLower(strings.TrimSpace(raw))
	switch status {
	case models.FeedbackStatusPending,
		models.FeedbackStatusAccepted,
		models.FeedbackStatusConverted,
		models.FeedbackStatusInProgress,
		models.FeedbackStatusCompleted,
		models.FeedbackStatusIgnored,
		models.FeedbackStatusReleased:
		return status
	case "developing", "processing", "inprogress":
		return models.FeedbackStatusInProgress
	case "done", "finished":
		return models.FeedbackStatusCompleted
	case "rejected":
		return models.FeedbackStatusIgnored
	case "confirmed":
		return models.FeedbackStatusAccepted
	default:
		return ""
	}
}

func canonicalFeedbackTriageStatus(raw string) string {
	status := strings.ToLower(strings.TrimSpace(raw))
	if models.IsValidFeedbackTriageStatus(status) {
		return status
	}
	return ""
}

func feedbackTriageStatus(feedback models.Feedback) string {
	if status := canonicalFeedbackTriageStatus(feedback.TriageStatus); status != "" {
		return status
	}

	switch canonicalFeedbackStatus(feedback.Status) {
	case models.FeedbackStatusIgnored:
		return models.FeedbackTriageIgnored
	case models.FeedbackStatusAccepted,
		models.FeedbackStatusConverted,
		models.FeedbackStatusInProgress,
		models.FeedbackStatusCompleted,
		models.FeedbackStatusReleased:
		return models.FeedbackTriageAccepted
	default:
		return models.FeedbackTriagePending
	}
}

func feedbackTaskIDFromPayload(value interface{}) *uint {
	var parsed uint64
	var err error
	switch typed := value.(type) {
	case float64:
		if typed <= 0 || typed != float64(uint64(typed)) {
			return nil
		}
		parsed = uint64(typed)
	case string:
		parsed, err = strconv.ParseUint(strings.TrimSpace(typed), 10, 64)
		if err != nil {
			return nil
		}
	case json.Number:
		parsed, err = strconv.ParseUint(string(typed), 10, 64)
		if err != nil {
			return nil
		}
	case uint:
		parsed = uint64(typed)
	case uint64:
		parsed = typed
	case int:
		if typed <= 0 {
			return nil
		}
		parsed = uint64(typed)
	default:
		return nil
	}
	if parsed == 0 || uint64(uint(parsed)) != parsed {
		return nil
	}
	result := uint(parsed)
	return &result
}

func feedbackTaskInfoFromData(data *string) (*uint, string) {
	payload := parseFeedbackPayload(data)
	taskID := feedbackTaskIDFromPayload(payload["converted_task_id"])
	taskState, _ := payload["task_state"].(string)
	return taskID, strings.TrimSpace(taskState)
}

func customerStatusFromFeedback(feedback models.Feedback) string {
	if feedbackTriageStatus(feedback) == models.FeedbackTriageIgnored {
		return "ignored"
	}

	switch canonicalFeedbackStatus(feedback.Status) {
	case models.FeedbackStatusAccepted, models.FeedbackStatusConverted:
		return "reviewing"
	case models.FeedbackStatusInProgress:
		return "developing"
	case models.FeedbackStatusCompleted:
		return "completed"
	case models.FeedbackStatusReleased:
		return "released"
	case models.FeedbackStatusIgnored:
		return "ignored"
	default:
		if feedbackTriageStatus(feedback) == models.FeedbackTriageAccepted {
			return "reviewing"
		}
		return "submitted"
	}
}

func feedbackStatusFromData(data *string, fallback string) string {
	payload := parseFeedbackPayload(data)
	for _, key := range []string{"feedback_state", "state", "status"} {
		if value, ok := payload[key].(string); ok {
			if status := canonicalFeedbackStatus(value); status != "" {
				return status
			}
		}
	}
	if status := canonicalFeedbackStatus(fallback); status != "" {
		return status
	}
	return models.FeedbackStatusPending
}

func sdkStatusFromFeedbackStatus(status string) string {
	switch canonicalFeedbackStatus(status) {
	case models.FeedbackStatusAccepted:
		return "reviewing"
	case models.FeedbackStatusConverted, models.FeedbackStatusInProgress:
		return "developing"
	case models.FeedbackStatusCompleted:
		return "completed"
	case models.FeedbackStatusIgnored:
		return "ignored"
	case models.FeedbackStatusReleased:
		return "released"
	default:
		return "analyzing"
	}
}

func mergeFeedbackData(data *string, status string, extra map[string]interface{}) *string {
	payload := parseFeedbackPayload(data)
	canonical := canonicalFeedbackStatus(status)
	if canonical == "" {
		canonical = models.FeedbackStatusPending
	}
	payload["feedback_state"] = canonical
	payload["status"] = sdkStatusFromFeedbackStatus(canonical)
	for key, value := range extra {
		payload[key] = value
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		return data
	}
	text := string(raw)
	return &text
}

func updateFeedbackStatusFields(tx *gorm.DB, feedback *models.Feedback, status string, extra map[string]interface{}) error {
	canonical := canonicalFeedbackStatus(status)
	if canonical == "" {
		return fmt.Errorf("invalid feedback status: %s", status)
	}
	data := mergeFeedbackData(feedback.Data, canonical, extra)
	if err := tx.Model(feedback).Updates(map[string]interface{}{
		"status": canonical,
		"data":   data,
	}).Error; err != nil {
		return err
	}
	feedback.Status = canonical
	feedback.Data = data
	return nil
}

func buildTaskResponseFromModel(task models.Task) TaskResponse {
	var completionAt *string
	if task.CompletionAt != nil {
		completionAtStr := task.CompletionAt.Format("2006-01-02T15:04:05Z07:00")
		completionAt = &completionAtStr
	}
	var deletedAt *string
	if task.DeletedAt.Valid {
		deletedAtStr := task.DeletedAt.Time.Format("2006-01-02T15:04:05Z07:00")
		deletedAt = &deletedAtStr
	}
	return TaskResponse{
		ID:           task.ID,
		ProjectID:    task.ProjectID,
		FatherID:     task.FatherID,
		Content:      task.Content,
		State:        task.State,
		CreatorID:    task.CreatorID,
		ExecutorID:   task.ExecutorID,
		Priority:     task.Priority,
		Tags:         task.Tags,
		CreatedAt:    task.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:    task.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		CompletionAt: completionAt,
		DeletedAt:    deletedAt,
	}
}

func buildFeedbackTaskContent(feedback models.Feedback) string {
	title := strings.TrimSpace(feedback.Title)
	content := strings.TrimSpace(feedback.Content)
	if title != "" && content != "" {
		return fmt.Sprintf("[反馈] %s\n%s", title, content)
	}
	if content != "" {
		return "[反馈] " + content
	}
	if title != "" {
		return "[反馈] " + title
	}
	return "[反馈]"
}

func isInitialFeedbackMessage(message models.FeedbackMessage) bool {
	if message.Metadata == nil || strings.TrimSpace(*message.Metadata) == "" {
		return false
	}
	var metadata struct {
		Source string `json:"source"`
	}
	return json.Unmarshal([]byte(*message.Metadata), &metadata) == nil && metadata.Source == "feedback_initial"
}

func buildFeedbackTaskAttachmentComment(feedback models.Feedback, message models.FeedbackMessage, attachments []models.FeedbackMessageAttachment) string {
	parts := make([]string, 0, len(attachments))
	seen := make(map[string]struct{})
	appendObject := func(marker, value string) {
		value = strings.TrimSpace(value)
		if value == "" {
			return
		}
		key := marker + "\x00" + value
		if _, exists := seen[key]; exists {
			return
		}
		seen[key] = struct{}{}
		parts = append(parts, fmt.Sprintf("[%s](%s)", marker, value))
	}

	for _, attachment := range attachments {
		if attachment.ObjectKey != nil {
			marker := "file"
			if attachment.Type == models.FeedbackAttachmentTypeImage {
				marker = "image"
			}
			appendObject(marker, *attachment.ObjectKey)
			continue
		}
		if attachment.URL != nil {
			appendObject("link", *attachment.URL)
		}
	}
	initialMessage := isInitialFeedbackMessage(message)
	content := strings.TrimSpace(message.Content)
	if len(parts) == 0 && (initialMessage || content == "") {
		return ""
	}
	shortID := strings.TrimSpace(feedback.ShortID)
	if shortID == "" {
		shortID = strconv.FormatUint(uint64(feedback.ID), 10)
	}

	heading := "反馈 #" + shortID + " 的附件："
	if initialMessage {
		heading = "来源反馈 #" + shortID + " 的附件："
	} else if message.SenderType == models.FeedbackMessageSenderCustomer {
		heading = "用户补充（反馈 #" + shortID + "）："
	} else if message.SenderType == models.FeedbackMessageSenderDeveloper {
		heading = "开发者回复（反馈 #" + shortID + "）："
	}

	lines := []string{heading}
	if !initialMessage && content != "" {
		lines = append(lines, content)
	}
	return strings.Join(append(lines, parts...), "\n")
}

func buildLegacyFeedbackTaskAttachmentComment(feedback models.Feedback) string {
	if feedback.File == nil || strings.TrimSpace(*feedback.File) == "" {
		return ""
	}
	file := strings.TrimSpace(*feedback.File)
	attachment := models.FeedbackMessageAttachment{Type: models.FeedbackAttachmentTypeFile}
	if strings.HasPrefix(strings.ToLower(file), "https://") {
		attachment.Type = models.FeedbackAttachmentTypeURL
		attachment.URL = &file
	} else {
		attachment.ObjectKey = &file
	}
	metadata := initialFeedbackMessageMetadata(true)
	return buildFeedbackTaskAttachmentComment(feedback, models.FeedbackMessage{
		SenderType: models.FeedbackMessageSenderCustomer,
		Metadata:   metadata,
	}, []models.FeedbackMessageAttachment{attachment})
}

func loadFeedbackTaskAttachmentComments(tx *gorm.DB, feedback models.Feedback) ([]string, error) {
	var messages []models.FeedbackMessage
	if err := tx.Where("feedback_id = ?", feedback.ID).
		Preload("Attachments", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC").Order("id ASC")
		}).
		Order("created_at ASC").
		Order("id ASC").
		Find(&messages).Error; err != nil {
		return nil, err
	}
	comments := make([]string, 0)
	for _, message := range messages {
		if message.SenderType == models.FeedbackMessageSenderSystem || len(message.Attachments) == 0 {
			continue
		}
		if content := buildFeedbackTaskAttachmentComment(feedback, message, message.Attachments); content != "" {
			comments = append(comments, content)
		}
	}
	if legacyContent := buildLegacyFeedbackTaskAttachmentComment(feedback); legacyContent != "" {
		comments = append(comments, legacyContent)
	}
	return comments, nil
}

// createCustomerFeedbackTaskComments mirrors a newly created customer follow-up
// into the primary converted task. The feedback message and task comment share
// one transaction, so a failed comment write never leaves a partial sync.
func createCustomerFeedbackTaskComments(tx *gorm.DB, feedback models.Feedback, message models.FeedbackMessage) ([]models.TaskAttachment, error) {
	if message.SenderType != models.FeedbackMessageSenderCustomer || isInitialFeedbackMessage(message) {
		return nil, nil
	}
	content := buildFeedbackTaskAttachmentComment(feedback, message, message.Attachments)
	if content == "" {
		return nil, nil
	}

	var links []models.FeedbackTaskLink
	if err := tx.Where("feedback_id = ? AND relation_type = ? AND is_primary = ?", feedback.ID, models.FeedbackTaskRelationConvertedTo, true).
		Order("id ASC").
		Find(&links).Error; err != nil {
		return nil, err
	}

	comments := make([]models.TaskAttachment, 0, len(links))
	for _, link := range links {
		var task models.Task
		if err := tx.First(&task, link.TaskID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				continue
			}
			return nil, err
		}

		creatorID := task.CreatorID
		if link.CreatedBy != nil && *link.CreatedBy != 0 {
			creatorID = *link.CreatedBy
		}
		comment := models.TaskAttachment{
			TaskID:    task.ID,
			CreatorID: creatorID,
			Type:      models.AttachmentTypeText,
			Content:   content,
		}
		if err := tx.Create(&comment).Error; err != nil {
			return nil, err
		}
		comments = append(comments, comment)
	}
	return comments, nil
}

func buildFeedbackTaskAttachmentCreatedResponse(attachment models.TaskAttachment) CreateTaskAttachmentResponse {
	return CreateTaskAttachmentResponse{
		ID:        attachment.ID,
		TaskID:    attachment.TaskID,
		CreatorID: attachment.CreatorID,
		Type:      attachment.Type,
		Content:   attachment.Content,
		CreatedAt: attachment.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: attachment.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

func notifyFeedbackTaskAttachmentCreated(c *gin.Context, db *gorm.DB, projectID, actorID uint, attachments []models.TaskAttachment) {
	for _, attachment := range attachments {
		notifyProjectEvent(c, db, projectID, actorID, "task_attachment.created", buildFeedbackTaskAttachmentCreatedResponse(attachment))
	}
}

func mapTaskStateToFeedbackStatus(taskState string) string {
	switch taskState {
	case models.TaskStatePending, models.TaskStatePendingReview:
		return models.FeedbackStatusConverted
	case models.TaskStateInProgress, models.TaskStateBlocked:
		return models.FeedbackStatusInProgress
	case models.TaskStateCompleted, models.TaskStateAccepted:
		return models.FeedbackStatusCompleted
	case models.TaskStateCancelled:
		return models.FeedbackStatusIgnored
	default:
		return models.FeedbackStatusConverted
	}
}

func syncLinkedFeedbacksFromTask(tx *gorm.DB, task models.Task, oldState string, actorID uint) ([]feedbackWorkflowEvent, error) {
	var links []models.FeedbackTaskLink
	if err := tx.Where("task_id = ?", task.ID).Find(&links).Error; err != nil {
		return nil, err
	}
	if len(links) == 0 {
		return nil, nil
	}

	events := make([]feedbackWorkflowEvent, 0, len(links)*2)
	nextStatus := mapTaskStateToFeedbackStatus(task.State)
	now := time.Now()

	for _, link := range links {
		var feedback models.Feedback
		if err := tx.First(&feedback, link.FeedbackID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				continue
			}
			return nil, err
		}

		extra := map[string]interface{}{
			"converted_task_id": task.ID,
			"task_state":        task.State,
			"task_updated_at":   now.Format(time.RFC3339),
		}
		if oldState != "" {
			extra["previous_task_state"] = oldState
		}
		if err := updateFeedbackStatusFields(tx, &feedback, nextStatus, extra); err != nil {
			return nil, err
		}

		metadataBytes, _ := json.Marshal(map[string]interface{}{
			"task_id":            task.ID,
			"old_state":          oldState,
			"new_state":          task.State,
			"feedback_status":    nextStatus,
			"feedback_task_link": link.ID,
		})
		metadata := string(metadataBytes)
		message, err := createFeedbackMessageRecord(
			tx,
			feedback,
			models.FeedbackMessageSenderSystem,
			&actorID,
			nil,
			nil,
			models.FeedbackMessageTypeStatusChange,
			fmt.Sprintf("关联待办 #%d 状态已更新为 %s", task.ID, task.State),
			&metadata,
			nil,
		)
		if err != nil {
			return nil, err
		}

		events = append(events,
			feedbackWorkflowEvent{
				ProjectID: feedback.ProjectID,
				Event:     "feedback.updated",
				Data:      buildFeedbackResponse(feedback),
			},
			feedbackWorkflowEvent{
				ProjectID: feedback.ProjectID,
				Event:     "feedback.message.created",
				Data:      buildFeedbackMessageResponse(message),
			},
		)
	}

	return events, nil
}

func validateFeedbackTaskTarget(c *gin.Context, db *gorm.DB, projectID uint, req ConvertFeedbackToTaskRequest) bool {
	if req.FatherID != nil {
		var parentTask models.Task
		if err := db.First(&parentTask, *req.FatherID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeTaskParentNotFound, "父任务不存在", nil))
				return false
			}
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "查询父任务失败: "+err.Error(), nil))
			return false
		}
		if parentTask.ProjectID != projectID {
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskParentMustSameProject, "父任务必须属于同一项目", nil))
			return false
		}
	}

	if req.ExecutorID != nil {
		var executorMember models.ProjectMember
		if err := db.Where("project_id = ? AND user_id = ?", projectID, *req.ExecutorID).First(&executorMember).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskExecutorNotMember, "指定的执行者不是该项目的成员", nil))
				return false
			}
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "验证执行者身份失败: "+err.Error(), nil))
			return false
		}
	}

	if req.State != nil && !models.IsValidState(*req.State) {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskInvalidState, "无效的任务状态", nil))
		return false
	}

	return true
}

// IgnoreFeedback 标记 V2 反馈为暂不处理。受理决定只允许在尚未流转待办时修改。
func IgnoreFeedback(c *gin.Context) {
	if isAPIKeyRequest(c) {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNoPermission, "API Key 认证不允许变更反馈受理决定", nil))
		return
	}

	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	feedback, ok := loadFeedbackByID(c, db, feedbackID)
	if !ok {
		return
	}
	userID, ok := requireFeedbackProjectMember(c, db, feedback.ProjectID, "忽略反馈")
	if !ok {
		return
	}

	var message models.FeedbackMessage
	changed := false
	if err := db.Transaction(func(tx *gorm.DB) error {
		var link models.FeedbackTaskLink
		err := tx.Where("feedback_id = ? AND is_primary = ?", feedback.ID, true).First(&link).Error
		if err == nil {
			return errFeedbackAlreadyConverted
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}

		if feedbackTriageStatus(feedback) == models.FeedbackTriageIgnored {
			return nil
		}
		if err := tx.Model(&feedback).Update("triage_status", models.FeedbackTriageIgnored).Error; err != nil {
			return err
		}
		feedback.TriageStatus = models.FeedbackTriageIgnored
		if err := updateFeedbackStatusFields(tx, &feedback, models.FeedbackStatusIgnored, nil); err != nil {
			return err
		}

		metadataBytes, _ := json.Marshal(map[string]interface{}{
			"triage_status": models.FeedbackTriageIgnored,
		})
		metadata := string(metadataBytes)
		var createErr error
		message, createErr = createFeedbackMessageRecord(
			tx,
			feedback,
			models.FeedbackMessageSenderSystem,
			&userID,
			nil,
			nil,
			models.FeedbackMessageTypeStatusChange,
			"反馈已标记为暂不处理",
			&metadata,
			nil,
		)
		if createErr != nil {
			return createErr
		}
		changed = true
		return nil
	}); err != nil {
		if errors.Is(err, errFeedbackAlreadyConverted) {
			c.JSON(http.StatusConflict, response.NewErrorResponse(response.CodeBadRequest, "反馈已流转为待办，不能再标记为忽略", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackUpdateFailed, "忽略反馈失败: "+err.Error(), nil))
		return
	}

	feedbackResp := buildFeedbackResponse(feedback)
	if changed {
		notifyProjectEvent(c, db, feedback.ProjectID, userID, "feedback.updated", feedbackResp)
		notifyProjectEvent(c, db, feedback.ProjectID, userID, "feedback.message.created", buildFeedbackMessageResponse(message))
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(feedbackResp))
}

// ConvertFeedbackToTask 将反馈原子流转为待办
func ConvertFeedbackToTask(c *gin.Context) {
	if isAPIKeyRequest(c) {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNoPermission, "API Key 认证不允许流转反馈为待办", nil))
		return
	}

	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}

	var req ConvertFeedbackToTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	feedback, ok := loadFeedbackByID(c, db, feedbackID)
	if !ok {
		return
	}

	userID, ok := requireFeedbackProjectMember(c, db, feedback.ProjectID, "流转反馈")
	if !ok {
		return
	}
	if feedbackTriageStatus(feedback) == models.FeedbackTriageIgnored {
		c.JSON(http.StatusConflict, response.NewErrorResponse(response.CodeBadRequest, "反馈已标记为暂不处理，不能流转待办", nil))
		return
	}
	if !validateFeedbackTaskTarget(c, db, feedback.ProjectID, req) {
		return
	}

	state := models.TaskStatePendingReview
	if req.State != nil && strings.TrimSpace(*req.State) != "" {
		state = strings.TrimSpace(*req.State)
	}
	content := buildFeedbackTaskContent(feedback)
	if req.Content != nil && strings.TrimSpace(*req.Content) != "" {
		content = strings.TrimSpace(*req.Content)
	}

	var task models.Task
	var link models.FeedbackTaskLink
	var message models.FeedbackMessage
	var taskAttachments []models.TaskAttachment
	var existingTaskID uint

	if err := db.Transaction(func(tx *gorm.DB) error {
		var existing models.FeedbackTaskLink
		if err := tx.Where("feedback_id = ? AND is_primary = ?", feedback.ID, true).First(&existing).Error; err == nil {
			existingTaskID = existing.TaskID
			return errFeedbackAlreadyConverted
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}

		task = models.Task{
			ProjectID:  feedback.ProjectID,
			FatherID:   req.FatherID,
			Content:    content,
			State:      state,
			CreatorID:  userID,
			ExecutorID: req.ExecutorID,
			Priority:   req.Priority,
			Tags:       req.Tags,
		}
		if models.IsDoneState(state) {
			now := time.Now()
			task.CompletionAt = &now
		}
		if err := tx.Create(&task).Error; err != nil {
			return err
		}

		createdBy := userID
		link = models.FeedbackTaskLink{
			FeedbackID:   feedback.ID,
			ProjectID:    feedback.ProjectID,
			TaskID:       task.ID,
			RelationType: models.FeedbackTaskRelationConvertedTo,
			IsPrimary:    true,
			CreatedBy:    &createdBy,
		}
		if err := tx.Create(&link).Error; err != nil {
			return err
		}
		if err := tx.Model(&feedback).Update("triage_status", models.FeedbackTriageAccepted).Error; err != nil {
			return err
		}
		feedback.TriageStatus = models.FeedbackTriageAccepted

		attachmentComments, err := loadFeedbackTaskAttachmentComments(tx, feedback)
		if err != nil {
			return err
		}
		for _, attachmentContent := range attachmentComments {
			attachment := models.TaskAttachment{
				TaskID:    task.ID,
				CreatorID: userID,
				Type:      models.AttachmentTypeText,
				Content:   attachmentContent,
			}
			if err := tx.Create(&attachment).Error; err != nil {
				return err
			}
			taskAttachments = append(taskAttachments, attachment)
		}

		extra := map[string]interface{}{
			"converted_task_id": task.ID,
			"converted_at":      time.Now().Format(time.RFC3339),
			"task_state":        task.State,
		}
		nextStatus := mapTaskStateToFeedbackStatus(task.State)
		if err := updateFeedbackStatusFields(tx, &feedback, nextStatus, extra); err != nil {
			return err
		}

		metadataBytes, _ := json.Marshal(map[string]interface{}{
			"task_id":         task.ID,
			"feedback_id":     feedback.ID,
			"relation_type":   link.RelationType,
			"feedback_status": nextStatus,
		})
		metadata := string(metadataBytes)
		message, err = createFeedbackMessageRecord(
			tx,
			feedback,
			models.FeedbackMessageSenderSystem,
			&userID,
			nil,
			nil,
			models.FeedbackMessageTypeTaskLink,
			fmt.Sprintf("反馈已流转为待办 #%d", task.ID),
			&metadata,
			nil,
		)
		return err
	}); err != nil {
		if errors.Is(err, errFeedbackAlreadyConverted) {
			c.JSON(http.StatusConflict, response.NewErrorResponse(response.CodeBadRequest, fmt.Sprintf("反馈已流转为待办 #%d", existingTaskID), nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackCreateFailed, "流转反馈失败: "+err.Error(), nil))
		return
	}

	feedbackResp := buildFeedbackResponse(feedback)
	taskResp := buildTaskResponseFromModel(task)
	linkResp := buildFeedbackTaskLinkResponse(link)
	messageResp := buildFeedbackMessageResponse(message)

	notifyProjectEvent(c, db, feedback.ProjectID, userID, "task.created", taskResp)
	notifyProjectEvent(c, db, feedback.ProjectID, userID, "feedback.updated", feedbackResp)
	notifyProjectEvent(c, db, feedback.ProjectID, userID, "feedback.task_link.created", linkResp)
	notifyProjectEvent(c, db, feedback.ProjectID, userID, "feedback.message.created", messageResp)
	notifyFeedbackTaskAttachmentCreated(c, db, feedback.ProjectID, userID, taskAttachments)

	c.JSON(http.StatusCreated, response.NewSuccessResponse(ConvertFeedbackToTaskResponse{
		Feedback: feedbackResp,
		Task:     taskResp,
		Link:     linkResp,
	}))
}

func notifyFeedbackWorkflowEvents(c *gin.Context, db *gorm.DB, actorID uint, events []feedbackWorkflowEvent) {
	for _, event := range events {
		if event.ProjectID == 0 || event.Event == "" {
			continue
		}
		notifyProjectEvent(c, db, event.ProjectID, actorID, event.Event, event.Data)
	}
}

func logFeedbackSyncError(context string, err error) {
	if err != nil {
		log.Printf("feedback workflow sync failed: %s: %v", context, err)
	}
}
