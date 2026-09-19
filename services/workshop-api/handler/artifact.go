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

// ArtifactDeliveryRequest 产物交付请求
type ArtifactDeliveryRequest struct {
	ArtifactURL string `json:"artifact_url" binding:"required"`
	BuildID     string `json:"build_id"`
}

// ArtifactDeliveryHandler 产物交付回写
// POST /api/v1/tasks/{id}/artifact
// 仅接受状态为 accepted 的 Task，回写 artifact_url
func ArtifactDeliveryHandler(c *gin.Context) {
	taskIDStr := c.Param("id")
	if taskIDStr == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "缺少任务ID参数", nil))
		return
	}

	var taskID uint
	if _, err := fmt.Sscanf(taskIDStr, "%d", &taskID); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的任务ID", nil))
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 鉴权
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}

	var req ArtifactDeliveryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}

	// 查询 Task
	var task models.Task
	if err := db.First(&task, taskID).Error; err != nil {
		if gorm.ErrRecordNotFound == err {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeTaskNotFound, "任务不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "查询任务失败: "+err.Error(), nil))
		return
	}

	// 验证权限：必须是任务所在项目的 admin/owner
	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", task.ProjectID, userID).First(&member).Error; err != nil {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTaskNoPermission, "无权限交付产物", nil))
		return
	}
	if member.Role != models.ProjectRoleOwner && member.Role != models.ProjectRoleAdmin {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTaskNoPermission, "需要管理员或所有者权限", nil))
		return
	}

	// 只有 accepted 状态的 Task 才能回写产物
	if task.State != models.TaskStateAccepted {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeTaskInvalidState,
			fmt.Sprintf("任务状态为 %s，只有 accepted 状态才能交付产物", task.State), nil))
		return
	}

	// 回写 artifact_url
	if err := db.Model(&task).Update("artifact_url", req.ArtifactURL).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskUpdateFailed, "回写产物地址失败: "+err.Error(), nil))
		return
	}

	// 自动触发交付通知：如果 Task 关联了 Feedback，通知客户
	if task.SourceFeedbackID != nil && *task.SourceFeedbackID > 0 {
		go autoNotifyDelivery(db, *task.SourceFeedbackID, req.ArtifactURL)
	}

	c.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
		"task_id":      taskID,
		"artifact_url": req.ArtifactURL,
		"build_id":     req.BuildID,
	}))
}

// autoNotifyDelivery 自动触发交付通知
func autoNotifyDelivery(db *gorm.DB, feedbackID uint, artifactURL string) {
	// 更新反馈状态
	db.Model(&models.Feedback{}).Where("id = ?", feedbackID).Update("status", models.FeedbackStatusCompleted)

	// 创建系统消息
	notifyContent := fmt.Sprintf("您的反馈已处理完成。\n\n产物链接: %s", artifactURL)
	metadata := map[string]interface{}{
		"type":         "delivery_notification",
		"artifact_url": artifactURL,
	}
	metadataBytes, _ := json.Marshal(metadata)
	metadataStr := string(metadataBytes)

	// 查询反馈获取 projectID
	var feedback models.Feedback
	if err := db.First(&feedback, feedbackID).Error; err != nil {
		return
	}

	message := models.FeedbackMessage{
		FeedbackID:  feedbackID,
		ProjectID:   feedback.ProjectID,
		SenderType:  models.FeedbackMessageSenderSystem,
		MessageType: models.FeedbackMessageTypeSystem,
		State:       models.FeedbackMessageStateSent,
		Content:     notifyContent,
		Metadata:    &metadataStr,
	}
	db.Create(&message)
}
