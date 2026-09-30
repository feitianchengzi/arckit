package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// DeliveryNotificationRequest 交付通知请求
type DeliveryNotificationRequest struct {
	ArtifactURL string `json:"artifact_url" binding:"required"`
	Message     string `json:"message"`
}

// NotifyDeliveryHandler 通知客户交付完成
// POST /api/v1/feedbacks/{id}/delivery-notify
func NotifyDeliveryHandler(c *gin.Context) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 先查询反馈获取 projectID，再执行鉴权
	var feedback models.Feedback
	if err := db.First(&feedback, feedbackID).Error; err != nil {
		if gorm.ErrRecordNotFound == err {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeFeedbackNotFound, "反馈不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈失败: "+err.Error(), nil))
		return
	}

	userID, ok := requireFeedbackTriagePermission(c, db, feedback.ProjectID, "发送交付通知")
	if !ok {
		return
	}
	_ = userID

	var req DeliveryNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}

	// 更新反馈状态为已完成
	if err := db.Model(&feedback).Update("status", models.FeedbackStatusCompleted).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackUpdateFailed, "更新反馈状态失败: "+err.Error(), nil))
		return
	}

	// 构建通知消息内容
	notifyContent := fmt.Sprintf("您的反馈已处理完成。\n\n产物链接: %s", req.ArtifactURL)
	if req.Message != "" {
		notifyContent = req.Message + "\n\n" + notifyContent
	}

	// 创建系统消息通知客户
	metadata := map[string]interface{}{
		"type":         "delivery_notification",
		"artifact_url": req.ArtifactURL,
	}
	metadataBytes, _ := json.Marshal(metadata)
	metadataStr := string(metadataBytes)

	message := models.FeedbackMessage{
		FeedbackID:  feedbackID,
		ProjectID:   feedback.ProjectID,
		SenderType:  models.FeedbackMessageSenderSystem,
		MessageType: models.FeedbackMessageTypeSystem,
		State:       models.FeedbackMessageStateSent,
		Content:     notifyContent,
		Metadata:    &metadataStr,
	}

	if err := db.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackCreateFailed, "创建通知消息失败: "+err.Error(), nil))
		return
	}

	// 发送 WebSocket 事件通知
	notifyProjectEvent(c, db, feedback.ProjectID, 0, "feedback.delivered", map[string]interface{}{
		"feedback_id":  feedbackID,
		"artifact_url": req.ArtifactURL,
		"message_id":   message.ID,
	})

	c.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
		"feedback_id":  feedbackID,
		"message_id":   message.ID,
		"artifact_url": req.ArtifactURL,
		"status":       "delivered",
	}))
}

// GetDeliveryStatusHandler 查询反馈交付状态
// GET /api/v1/feedbacks/{id}/delivery-status
func GetDeliveryStatusHandler(c *gin.Context) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	var feedback models.Feedback
	if err := db.First(&feedback, feedbackID).Error; err != nil {
		if gorm.ErrRecordNotFound == err {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeFeedbackNotFound, "反馈不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈失败: "+err.Error(), nil))
		return
	}

	// 查询关联的交付消息
	var messages []models.FeedbackMessage
	db.Where("feedback_id = ? AND sender_type = ? AND metadata LIKE ?",
		feedbackID, models.FeedbackMessageSenderSystem, "%delivery_notification%").
		Order("created_at DESC").Limit(1).Find(&messages)

	delivered := len(messages) > 0
	var artifactURL string
	if delivered {
		var meta map[string]interface{}
		if messages[0].Metadata != nil {
			json.Unmarshal([]byte(*messages[0].Metadata), &meta)
			artifactURL, _ = meta["artifact_url"].(string)
		}
	}

	c.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
		"feedback_id":  feedbackID,
		"status":       feedback.Status,
		"delivered":    delivered,
		"artifact_url": artifactURL,
	}))
}
