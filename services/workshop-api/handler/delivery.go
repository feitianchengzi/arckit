package handler

import (
	"encoding/json"
	"fmt"
	"gorm.io/gorm/clause"
	"net/http"
	feedbackdomain "todo/domain/feedback"
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

	if err := (feedbackdomain.Conclusion{Kind: "delivery", Title: "处理结果已交付", Body: "请验证交付结果", ArtifactURL: req.ArtifactURL}).Validate(); err != nil {
		c.JSON(400, response.NewErrorResponse(response.CodeBadRequest, err.Error(), nil))
		return
	}
	var message models.FeedbackMessage
	var notReady bool
	err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&feedback, feedbackID).Error; err != nil {
			return err
		}
		// V2 delivery reports finished work; it cannot bypass task-driven progress.
		if isV2Request(c) && feedback.Status != models.FeedbackStatusCompleted && feedback.Status != models.FeedbackStatusReleased {
			notReady = true
			return fmt.Errorf("关联任务尚未完成，不能发送交付通知")
		}
		if !isV2Request(c) {
			if err := tx.Model(&feedback).Update("status", models.FeedbackStatusCompleted).Error; err != nil {
				return err
			}
		}
		notifyContent := fmt.Sprintf("您的反馈已处理完成。\n\n产物链接: %s", req.ArtifactURL)
		if req.Message != "" {
			notifyContent = req.Message + "\n\n" + notifyContent
		}
		var version int
		if err := tx.Model(&models.FeedbackConclusion{}).Where("feedback_id = ?", feedbackID).Select("COALESCE(MAX(version),0)").Scan(&version).Error; err != nil {
			return err
		}
		conclusion := models.FeedbackConclusion{FeedbackID: feedbackID, ProjectID: feedback.ProjectID, Version: version + 1, Kind: "delivery", Title: "处理结果已交付", Body: notifyContent, ArtifactURL: req.ArtifactURL, PublishedBy: userID}
		if err := tx.Create(&conclusion).Error; err != nil {
			return err
		}
		raw, _ := json.Marshal(map[string]interface{}{"type": "delivery_notification", "artifact_url": req.ArtifactURL, "conclusion_id": conclusion.ID})
		metadata := string(raw)
		var err error
		message, err = createFeedbackMessageRecord(tx, feedback, models.FeedbackMessageSenderSystem, &userID, nil, nil, models.FeedbackMessageTypeSystem, notifyContent, &metadata, nil)
		if err != nil {
			return err
		}
		return createFeedbackNotificationsForMessage(tx, feedback, message)
	})
	if err != nil {
		if notReady {
			c.JSON(409, response.NewErrorResponse(response.CodeBadRequest, err.Error(), nil))
		} else {
			lifecycleError(c, err)
		}
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

	if _, ok := requireFeedbackProjectMember(c, db, feedback.ProjectID, "查看交付状态"); !ok {
		return
	}
	if isAPIKeyRequest(c) {
		if _, ok := requireCustomerFeedbackAccess(c, feedback, c.Query("custom_user_id")); !ok {
			return
		}
	}
	// 查询关联的交付消息
	var messages []models.FeedbackMessage
	db.Where("feedback_id = ? AND sender_type = ? AND CAST(metadata AS TEXT) LIKE ?",
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
