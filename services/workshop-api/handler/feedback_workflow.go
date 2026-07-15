package handler

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
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
	Content      string                           `json:"content,omitempty"`
	CustomUserID *string                          `json:"custom_user_id,omitempty"`
	Metadata     json.RawMessage                  `json:"metadata,omitempty"`
	Attachments  []FeedbackMessageAttachmentInput `json:"attachments,omitempty"`
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

func buildFeedbackMessageAttachment(input FeedbackMessageAttachmentInput) (models.FeedbackMessageAttachment, error) {
	attachmentType := strings.ToLower(strings.TrimSpace(input.Type))
	if !models.IsValidFeedbackAttachmentType(attachmentType) {
		return models.FeedbackMessageAttachment{}, fmt.Errorf("无效的附件类型")
	}
	objectKey := trimStringPtr(input.ObjectKey)
	urlValue := trimStringPtr(input.URL)
	if objectKey == nil && urlValue == nil {
		return models.FeedbackMessageAttachment{}, fmt.Errorf("附件必须提供 object_key 或 url")
	}
	if input.Size != nil && *input.Size < 0 {
		return models.FeedbackMessageAttachment{}, fmt.Errorf("附件大小不能为负数")
	}
	return models.FeedbackMessageAttachment{
		Type:      attachmentType,
		ObjectKey: objectKey,
		URL:       urlValue,
		FileName:  trimStringPtr(input.FileName),
		MimeType:  trimStringPtr(input.MimeType),
		Size:      input.Size,
	}, nil
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

func createFeedbackMessageRecord(tx *gorm.DB, feedback models.Feedback, senderType string, senderUserID *uint, senderCustomUserID *string, messageType string, content string, metadata *string, attachments []models.FeedbackMessageAttachment) (models.FeedbackMessage, error) {
	message := models.FeedbackMessage{
		FeedbackID:         feedback.ID,
		ProjectID:          feedback.ProjectID,
		SenderType:         senderType,
		SenderUserID:       senderUserID,
		SenderCustomUserID: senderCustomUserID,
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

	attachments := make([]models.FeedbackMessageAttachment, 0, len(req.Attachments))
	for _, item := range req.Attachments {
		attachment, err := buildFeedbackMessageAttachment(item)
		if err != nil {
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, err.Error(), nil))
			return
		}
		attachments = append(attachments, attachment)
	}

	var message models.FeedbackMessage
	if err := db.Transaction(func(tx *gorm.DB) error {
		var err error
		message, err = createFeedbackMessageRecord(tx, feedback, senderType, senderUserID, senderCustomUserID, models.FeedbackMessageTypeText, content, metadata, attachments)
		return err
	}); err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackCreateFailed, "创建反馈消息失败: "+err.Error(), nil))
		return
	}

	resp := buildFeedbackMessageResponse(message)
	notifyProjectEvent(c, db, feedback.ProjectID, userID, "feedback.message.created", resp)
	c.JSON(http.StatusCreated, response.NewSuccessResponse(resp))
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
		var err error
		message, err = createFeedbackMessageRecord(
			tx,
			feedback,
			models.FeedbackMessageSenderSystem,
			&userID,
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
