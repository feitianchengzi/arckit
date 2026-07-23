package handler

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var errFeedbackShortIDExists = errors.New("feedback short_id already exists")

// CreateFeedbackRequest 创建反馈请求结构
type CreateFeedbackRequest struct {
	ProjectID    uint                             `json:"project_id" binding:"required"` // 项目ID（必填）
	Title        string                           `json:"title" binding:"required"`      // 标题（必填）
	Content      string                           `json:"content" binding:"required"`    // 内容（必填）
	Attachments  []FeedbackMessageAttachmentInput `json:"attachments,omitempty"`
	CustomUserID *string                          `json:"custom_user_id,omitempty"` // 自定义用户ID（可选）
	UserPhone    *string                          `json:"user_phone,omitempty"`     // 用户手机号（可选）
	UserEmail    *string                          `json:"user_email,omitempty"`     // 用户邮箱（可选）
	CallbackURL  *string                          `json:"callback_url,omitempty"`   // 回调地址（可选）
	File         *string                          `json:"file,omitempty"`           // 附件文件地址（可选）
	Data         *string                          `json:"data,omitempty"`           // JSON字符串（可选）
}

// UpdateFeedbackRequest 更新反馈请求结构
type UpdateFeedbackRequest struct {
	ShortID      *string `json:"short_id,omitempty"`       // 短ID（可选）
	Title        *string `json:"title,omitempty"`          // 标题（可选）
	Content      *string `json:"content,omitempty"`        // 内容（可选）
	Status       *string `json:"status,omitempty"`         // 反馈状态（可选）
	CustomUserID *string `json:"custom_user_id,omitempty"` // 自定义用户ID（可选）
	UserPhone    *string `json:"user_phone,omitempty"`     // 用户手机号（可选）
	UserEmail    *string `json:"user_email,omitempty"`     // 用户邮箱（可选）
	File         *string `json:"file,omitempty"`           // 附件文件地址（可选）
	Data         *string `json:"data,omitempty"`           // JSON字符串（可选）
}

// FeedbackResponse 反馈响应结构
type FeedbackResponse struct {
	ID             uint    `json:"id"`                   // 反馈ID
	ProjectID      uint    `json:"project_id"`           // 项目ID
	ShortID        string  `json:"short_id"`             // 短ID
	Title          string  `json:"title"`                // 标题
	Content        string  `json:"content"`              // 内容
	Status         string  `json:"status"`               // 反馈状态
	TriageStatus   string  `json:"triage_status"`        // Console 受理状态
	CustomerStatus string  `json:"customer_status"`      // SDK 面向用户的状态
	TaskID         *uint   `json:"task_id,omitempty"`    // 关联主待办 ID
	TaskState      string  `json:"task_state,omitempty"` // 关联主待办状态
	CustomUserID   *string `json:"custom_user_id"`       // 自定义用户ID
	UserPhone      *string `json:"user_phone"`           // 用户手机号
	UserEmail      *string `json:"user_email"`           // 用户邮箱
	File           *string `json:"file"`                 // 附件文件地址
	Data           *string `json:"data"`                 // JSON字符串
	CreatedAt      string  `json:"created_at"`           // 创建时间
	UpdatedAt      string  `json:"updated_at"`           // 更新时间
	DeletedAt      *string `json:"deleted_at,omitempty"` // 删除时间（如果存在）

	LastMessageAt          *string `json:"last_message_at,omitempty"`           // 最近消息时间
	LastCustomerMessageAt  *string `json:"last_customer_message_at,omitempty"`  // 最近用户消息时间
	LastDeveloperMessageAt *string `json:"last_developer_message_at,omitempty"` // 最近开发者消息时间
}

// GetFeedbacksRequest 查询反馈请求结构
type GetFeedbacksRequest struct {
	ProjectID      *uint  `form:"project_id"`      // 项目ID（可选）
	ShortID        string `form:"short_id"`        // 短ID（可选）
	UserPhone      string `form:"user_phone"`      // 用户手机号（可选）
	UserEmail      string `form:"user_email"`      // 用户邮箱（可选）
	CustomUserID   string `form:"custom_user_id"`  // 自定义用户ID（可选）
	IncludeDeleted bool   `form:"include_deleted"` // 是否包含已删除记录（可选，默认false）
	Page           int    `form:"page"`            // 页码（可选，默认1）
	PageSize       int    `form:"page_size"`       // 每页条数（可选，默认50，最大200）
}

// GetFeedbacksResponse 查询反馈响应结构
type GetFeedbacksResponse struct {
	Feedbacks []FeedbackResponse `json:"feedbacks"`
	Total     int64              `json:"total"`
}

func buildFeedbackResponse(feedback models.Feedback) FeedbackResponse {
	var deletedAt *string
	if feedback.DeletedAt.Valid {
		deletedAtStr := feedback.DeletedAt.Time.Format("2006-01-02T15:04:05Z07:00")
		deletedAt = &deletedAtStr
	}
	formatTimePtr := func(value *time.Time) *string {
		if value == nil {
			return nil
		}
		formatted := value.Format("2006-01-02T15:04:05Z07:00")
		return &formatted
	}
	status := canonicalFeedbackStatus(feedback.Status)
	if status == "" {
		status = feedbackStatusFromData(feedback.Data, models.FeedbackStatusPending)
	}
	triageStatus := feedbackTriageStatus(feedback)
	taskID, taskState := feedbackTaskInfoFromData(feedback.Data)

	return FeedbackResponse{
		ID:             feedback.ID,
		ProjectID:      feedback.ProjectID,
		ShortID:        feedback.ShortID,
		Title:          feedback.Title,
		Content:        feedback.Content,
		Status:         status,
		TriageStatus:   triageStatus,
		CustomerStatus: customerStatusFromFeedback(feedback),
		TaskID:         taskID,
		TaskState:      taskState,
		CustomUserID:   feedback.CustomUserID,
		UserPhone:      feedback.UserPhone,
		UserEmail:      feedback.UserEmail,
		File:           feedback.File,
		Data:           feedback.Data,
		CreatedAt:      feedback.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:      feedback.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		DeletedAt:      deletedAt,

		LastMessageAt:          formatTimePtr(feedback.LastMessageAt),
		LastCustomerMessageAt:  formatTimePtr(feedback.LastCustomerMessageAt),
		LastDeveloperMessageAt: formatTimePtr(feedback.LastDeveloperMessageAt),
	}
}

func generateFeedbackShortID() string {
	raw := strings.ReplaceAll(uuid.New().String(), "-", "")
	raw = strings.ToUpper(raw)
	if len(raw) > 12 {
		return raw[:12]
	}
	return raw
}

func ensureFeedbackShortID(db *gorm.DB, provided string) (string, error) {
	trimmed := strings.TrimSpace(provided)
	if trimmed != "" {
		var count int64
		if err := db.Model(&models.Feedback{}).Where("short_id = ?", trimmed).Count(&count).Error; err != nil {
			return "", err
		}
		if count > 0 {
			return "", errFeedbackShortIDExists
		}
		return trimmed, nil
	}

	for i := 0; i < 5; i++ {
		candidate := generateFeedbackShortID()
		var count int64
		if err := db.Model(&models.Feedback{}).Where("short_id = ?", candidate).Count(&count).Error; err != nil {
			return "", err
		}
		if count == 0 {
			return candidate, nil
		}
	}
	return "", fmt.Errorf("failed to generate unique short_id")
}

func callFeedbackCallback(callbackURL string, shortID string) error {
	parsed, err := url.Parse(strings.TrimSpace(callbackURL))
	if err != nil {
		return err
	}
	if parsed.Scheme == "" || parsed.Host == "" {
		return fmt.Errorf("invalid callback url")
	}

	query := parsed.Query()
	query.Set("short_id", shortID)
	parsed.RawQuery = query.Encode()

	req, err := http.NewRequest(http.MethodGet, parsed.String(), nil)
	if err != nil {
		return err
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return fmt.Errorf("callback returned status %d", resp.StatusCode)
	}
	return nil
}

// CreateFeedback 创建反馈
// 认证级别: user (需要JWT认证)
// 权限: 项目成员均可操作
func CreateFeedback(c *gin.Context) {
	var req CreateFeedbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}
	if isV2APIKeyRequest(c) {
		customUserID := trimStringPtr(req.CustomUserID)
		if customUserID == nil {
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "V2 API Key 创建反馈时 custom_user_id 为必填项", nil))
			return
		}
		req.CustomUserID = customUserID
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", req.ProjectID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNotMember, "您不是该项目的成员，无法创建反馈", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
		return
	}

	shortID, err := ensureFeedbackShortID(db, "")
	if err != nil {
		if errors.Is(err, errFeedbackShortIDExists) {
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "短ID已存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackCreateFailed, "生成短ID失败: "+err.Error(), nil))
		return
	}

	feedback := models.Feedback{
		ProjectID:    req.ProjectID,
		ShortID:      shortID,
		Title:        req.Title,
		Content:      req.Content,
		Status:       feedbackStatusFromData(req.Data, models.FeedbackStatusPending),
		CustomUserID: req.CustomUserID,
		UserPhone:    req.UserPhone,
		UserEmail:    req.UserEmail,
		File:         req.File,
		Data:         req.Data,
	}
	var initialMessageAttachments []models.FeedbackMessageAttachment
	if isV2APIKeyRequest(c) {
		customUserID := ""
		if req.CustomUserID != nil {
			customUserID = *req.CustomUserID
		}
		attachments, err := buildFeedbackMessageAttachments(req.Attachments, feedbackAttachmentPrefix(req.ProjectID, customUserID))
		if err != nil {
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, err.Error(), nil))
			return
		}
		initialMessageAttachments = attachments
	}

	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&feedback).Error; err != nil {
			if isUniqueViolation(err, "uniq_feedback_short_id") {
				return errFeedbackShortIDExists
			}
			return err
		}
		if isV2Request(c) {
			senderType := models.FeedbackMessageSenderDeveloper
			senderUserID := &userID
			var senderCustomUserID *string
			if isAPIKeyRequest(c) {
				senderType = models.FeedbackMessageSenderCustomer
				senderUserID = nil
				senderCustomUserID = req.CustomUserID
			}
			if _, err := createInitialFeedbackMessage(tx, feedback, senderType, senderUserID, senderCustomUserID, initialMessageAttachments); err != nil {
				return err
			}
		}
		if req.CallbackURL != nil && strings.TrimSpace(*req.CallbackURL) != "" {
			if err := callFeedbackCallback(*req.CallbackURL, shortID); err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		if errors.Is(err, errFeedbackShortIDExists) {
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "短ID已存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackCreateFailed, "创建反馈失败: "+err.Error(), nil))
		return
	}

	resp := buildFeedbackResponse(feedback)
	notifyProjectEvent(c, db, feedback.ProjectID, userID, "feedback.created", resp)
	c.JSON(http.StatusCreated, response.NewSuccessResponse(resp))
}

// UpdateFeedback 更新反馈
// 认证级别: user (需要JWT认证)
// 权限: 项目成员均可操作
func UpdateFeedback(c *gin.Context) {
	feedbackIDStr := c.Param("id")
	if feedbackIDStr == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "反馈ID不能为空", nil))
		return
	}

	var feedbackID uint
	if _, err := fmt.Sscanf(feedbackIDStr, "%d", &feedbackID); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的反馈ID", nil))
		return
	}

	var req UpdateFeedbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	var feedback models.Feedback
	if err := db.First(&feedback, feedbackID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeFeedbackNotFound, "反馈不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈失败: "+err.Error(), nil))
		return
	}

	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", feedback.ProjectID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNotMember, "您不是该项目的成员，无法更新反馈", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
		return
	}

	updates := make(map[string]interface{})
	if req.Title != nil {
		trimmed := strings.TrimSpace(*req.Title)
		if trimmed == "" {
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "标题不能为空", nil))
			return
		}
		updates["title"] = trimmed
	}
	if req.Content != nil {
		trimmed := strings.TrimSpace(*req.Content)
		if trimmed == "" {
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "内容不能为空", nil))
			return
		}
		updates["content"] = trimmed
	}
	if req.ShortID != nil {
		trimmed := strings.TrimSpace(*req.ShortID)
		if trimmed == "" {
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "短ID不能为空", nil))
			return
		}
		if trimmed != feedback.ShortID {
			var count int64
			if err := db.Model(&models.Feedback{}).Where("short_id = ?", trimmed).Count(&count).Error; err != nil {
				c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "检查短ID失败: "+err.Error(), nil))
				return
			}
			if count > 0 {
				c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "短ID已存在", nil))
				return
			}
		}
		updates["short_id"] = trimmed
	}

	if req.Status != nil {
		if isV2Request(c) {
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "V2 反馈状态由受理决策和关联待办自动维护，请使用忽略或流转接口", nil))
			return
		}
		status := canonicalFeedbackStatus(*req.Status)
		if status == "" {
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的反馈状态", nil))
			return
		}
		updates["status"] = status
		updates["data"] = mergeFeedbackData(feedback.Data, status, nil)
	}

	if req.CustomUserID != nil {
		trimmed := strings.TrimSpace(*req.CustomUserID)
		if trimmed == "" {
			updates["custom_user_id"] = nil
		} else {
			updates["custom_user_id"] = trimmed
		}
	}
	if req.UserPhone != nil {
		trimmed := strings.TrimSpace(*req.UserPhone)
		if trimmed == "" {
			updates["user_phone"] = nil
		} else {
			updates["user_phone"] = trimmed
		}
	}
	if req.UserEmail != nil {
		trimmed := strings.TrimSpace(*req.UserEmail)
		if trimmed == "" {
			updates["user_email"] = nil
		} else {
			updates["user_email"] = trimmed
		}
	}
	if req.File != nil {
		trimmed := strings.TrimSpace(*req.File)
		if trimmed == "" {
			updates["file"] = nil
		} else {
			updates["file"] = trimmed
		}
	}
	if req.Data != nil {
		trimmed := strings.TrimSpace(*req.Data)
		if trimmed == "" {
			updates["data"] = nil
		} else {
			if statusValue, statusSet := updates["status"]; statusSet {
				if statusText, ok := statusValue.(string); ok {
					updates["data"] = mergeFeedbackData(&trimmed, statusText, nil)
				} else {
					updates["data"] = trimmed
				}
			} else {
				updates["data"] = trimmed
				if !isV2Request(c) {
					updates["status"] = feedbackStatusFromData(&trimmed, feedback.Status)
				}
			}
		}
	}

	if len(updates) == 0 {
		resp := buildFeedbackResponse(feedback)
		c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
		return
	}

	if err := db.Model(&feedback).Updates(updates).Error; err != nil {
		if isUniqueViolation(err, "uniq_feedback_short_id") {
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "短ID已存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackUpdateFailed, "更新反馈失败: "+err.Error(), nil))
		return
	}

	if err := db.First(&feedback, feedback.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询更新后的反馈失败: "+err.Error(), nil))
		return
	}

	resp := buildFeedbackResponse(feedback)
	notifyProjectEvent(c, db, feedback.ProjectID, userID, "feedback.updated", resp)
	c.JSON(http.StatusOK, response.NewSuccessResponse(resp))
}

// DeleteFeedback 删除反馈
// 认证级别: user (需要JWT认证)
// 权限: 项目成员
func DeleteFeedback(c *gin.Context) {
	feedbackIDStr := c.Param("id")
	if feedbackIDStr == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "反馈ID不能为空", nil))
		return
	}

	var feedbackID uint
	if _, err := fmt.Sscanf(feedbackIDStr, "%d", &feedbackID); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的反馈ID", nil))
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	var feedback models.Feedback
	if err := db.First(&feedback, feedbackID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeFeedbackNotFound, "反馈不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈失败: "+err.Error(), nil))
		return
	}

	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", feedback.ProjectID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNotMember, "您不是该项目的成员，无法删除反馈", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
		return
	}

	deletedAt := time.Now()
	if err := db.Delete(&feedback).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackDeleteFailed, "删除反馈失败: "+err.Error(), nil))
		return
	}

	data := gin.H{
		"feedback_id": feedback.ID,
		"deleted_at":  deletedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	notifyProjectEvent(c, db, feedback.ProjectID, userID, "feedback.deleted", data)
	c.JSON(http.StatusOK, response.NewSuccessResponse(data))
}

// GetFeedbacks 查询反馈列表
// 认证级别: user (需要JWT认证)
// 权限: 项目成员均可操作
func GetFeedbacks(c *gin.Context) {
	var req GetFeedbacksRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "参数绑定失败: "+err.Error(), nil))
		return
	}
	if (req.ProjectID == nil || *req.ProjectID == 0) &&
		strings.TrimSpace(req.ShortID) == "" &&
		strings.TrimSpace(req.UserPhone) == "" &&
		strings.TrimSpace(req.UserEmail) == "" &&
		strings.TrimSpace(req.CustomUserID) == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "查询参数至少需要提供一个条件", nil))
		return
	}
	if isV2APIKeyRequest(c) && strings.TrimSpace(req.CustomUserID) == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "V2 API Key 查询反馈时 custom_user_id 为必填项", nil))
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	query := db.Model(&models.Feedback{})
	if req.IncludeDeleted {
		query = query.Unscoped()
	}

	if req.ProjectID != nil {
		var member models.ProjectMember
		if err := db.Where("project_id = ? AND user_id = ?", *req.ProjectID, userID).First(&member).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNotMember, "您不是该项目的成员，无法查看反馈", nil))
				return
			}
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "验证项目成员身份失败: "+err.Error(), nil))
			return
		}
		query = query.Where("project_id = ?", *req.ProjectID)
	} else {
		query = query.Joins("JOIN project_members pm ON pm.project_id = feedbacks.project_id").Where("pm.user_id = ?", userID)
	}

	if trimmed := strings.TrimSpace(req.ShortID); trimmed != "" {
		query = query.Where("short_id = ?", trimmed)
	}
	if trimmed := strings.TrimSpace(req.UserPhone); trimmed != "" {
		query = query.Where("user_phone = ?", trimmed)
	}
	if trimmed := strings.TrimSpace(req.UserEmail); trimmed != "" {
		query = query.Where("user_email = ?", trimmed)
	}
	if trimmed := strings.TrimSpace(req.CustomUserID); trimmed != "" {
		query = query.Where("custom_user_id = ?", trimmed)
	}

	pagination, _ := ParsePagination(c)

	var total int64
	countQuery := query.Session(&gorm.Session{})
	if err := countQuery.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈总数失败: "+err.Error(), nil))
		return
	}

	query = query.Order("created_at DESC").Order("id DESC").Offset(pagination.Offset).Limit(pagination.Limit)
	var feedbacks []models.Feedback
	if err := query.Find(&feedbacks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈失败: "+err.Error(), nil))
		return
	}

	respItems := make([]FeedbackResponse, len(feedbacks))
	for i, item := range feedbacks {
		respItems[i] = buildFeedbackResponse(item)
	}

	c.JSON(http.StatusOK, response.NewSuccessResponseWithMeta(respItems, response.Meta{
		Page:     pagination.Page,
		PageSize: pagination.PageSize,
		Total:    int(total),
	}))
}
