package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AgentMessageRequestSession 是 session 模式（嵌入 SDK）下的客户发消息请求。
// 与 AgentMessageRequest 一致，attachments 为图片附件引用（本期落库 + 多模态预留）。
type AgentMessageRequestSession struct {
	Content        string                  `json:"content" binding:"required"`
	ConversationID string                  `json:"conversation_id,omitempty"`
	Attachments    []AgentAttachmentInput  `json:"attachments,omitempty"`
}

// AgentAttachmentInput 智能客服消息的图片附件输入（已上传到 OSS 后的引用）。
type AgentAttachmentInput struct {
	Type      string `json:"type"`                 // image
	ObjectKey string `json:"object_key,omitempty"` // OSS object key
	URL       string `json:"url,omitempty"`        // 可直接访问的 URL（多模态时传给 LLM）
	FileName  string `json:"file_name,omitempty"`
	MimeType  string `json:"mime_type,omitempty"`
}

// AgentMessageFromSession session 模式：客户向智能客服发送消息。
// POST /workshop/v2/feedback/feedbacks/:id/agent-message
func AgentMessageFromSession(c *gin.Context) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	scope, ok := middleware.RequireFeedbackSessionScope(c)
	if !ok {
		return
	}

	fb, ok := loadFeedbackForSession(c, db, feedbackID, scope)
	if !ok {
		return
	}
	projectID := fb.ProjectID

	var req AgentMessageRequestSession
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}

	conv, err := GetOrCreateConversation(db, req.ConversationID, feedbackID, projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "创建对话失败: "+err.Error(), nil))
		return
	}

	// 客户消息落库；图片附件以 metadata jsonb 形式持久化（本期落库）
	customerMsg := &AgentMessageRecord{
		ConversationID: conv.ID,
		FeedbackID:     feedbackID,
		ProjectID:      projectID,
		SenderType:     "customer",
		Content:        req.Content,
	}
	if len(req.Attachments) > 0 {
		attJSON, _ := json.Marshal(map[string]interface{}{"attachments": req.Attachments})
		attStr := string(attJSON)
		customerMsg.Metadata = &attStr
	}
	if err := SaveMessage(db, customerMsg); err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "保存消息失败: "+err.Error(), nil))
		return
	}

	history, err := GetConversationHistory(db, conv.ID, 20)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "获取对话历史失败: "+err.Error(), nil))
		return
	}

	// 收集图片附件的可访问 URL；仅当启用多模态（AGENT_VISION_ENABLED）时传给 Agent 真实看图。
	imageUrls := make([]string, 0, len(req.Attachments))
	for _, att := range req.Attachments {
		if strings.EqualFold(strings.TrimSpace(att.Type), "image") {
			if u := strings.TrimSpace(att.URL); u != "" {
				imageUrls = append(imageUrls, u)
			}
		}
	}

	// 调用 Agent 处理（图片附件以 image_url part 传入，多模态模型可真实看图）
	agentResponse, err := processWithAgent(c, db, projectID, feedbackID, req.Content, history, conv.ID, imageUrls)
	if err != nil {
		log.Printf("[agent-message-session] processWithAgent 失败 project=%d feedback=%d: %v", projectID, feedbackID, err)
		agentResponse = &AgentResponse{
			Content:    arcOrbitAgentUnavailableReply(),
			Confidence: 0,
			NeedCollect: true,
		}
	}

	agentMsg := &AgentMessageRecord{
		ConversationID: conv.ID,
		FeedbackID:     feedbackID,
		ProjectID:      projectID,
		SenderType:     "agent",
		Content:        agentResponse.Content,
		Confidence:     &agentResponse.Confidence,
	}
	if len(agentResponse.ToolCalls) > 0 {
		toolCallsJSON, _ := json.Marshal(agentResponse.ToolCalls)
		toolCallsStr := string(toolCallsJSON)
		agentMsg.ToolCalls = &toolCallsStr
	}
	if agentResponse.OHConversationID != "" {
		metaJSON, _ := json.Marshal(map[string]string{
			"openhands_conversation_id": agentResponse.OHConversationID,
		})
		metaStr := string(metaJSON)
		agentMsg.Metadata = &metaStr
	}
	applyAgentMessageUnresolvedMetadata(agentMsg, agentResponse.Confidence, agentResponse.Content)

	if err := SaveMessage(db, agentMsg); err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "保存Agent回复失败: "+err.Error(), nil))
		return
	}

	// session 模式无内部 userID，不触发面向内部用户的 need_collect 事件；
	// 低置信兜底由前端依据 NeedCollect 字段处理。
	c.JSON(http.StatusOK, response.NewSuccessResponse(AgentMessageResponse{
		MessageID:      agentMsg.ID,
		ConversationID: conv.ID,
		Content:        agentResponse.Content,
		SenderType:     "agent",
		ToolCalls:      agentResponse.ToolCalls,
		Confidence:     agentResponse.Confidence,
		NeedCollect:     agentResponse.NeedCollect,
	}))
}

// GetAgentConversationsFromSession session 模式：获取反馈关联的智能客服对话列表。
// GET /workshop/v2/feedback/feedbacks/:id/agent-conversations
func GetAgentConversationsFromSession(c *gin.Context) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	scope, ok := middleware.RequireFeedbackSessionScope(c)
	if !ok {
		return
	}
	if _, ok := loadFeedbackForSession(c, db, feedbackID, scope); !ok {
		return
	}
	convs, err := GetFeedbackConversations(db, feedbackID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "获取对话列表失败: "+err.Error(), nil))
		return
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(convs))
}

// GetAgentConversationMessagesFromSession session 模式：获取对话消息列表。
// GET /workshop/v2/feedback/agent-conversations/:conversationId/messages
func GetAgentConversationMessagesFromSession(c *gin.Context) {
	conversationID := c.Param("conversationId")
	if conversationID == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "缺少对话ID", nil))
		return
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	scope, ok := middleware.RequireFeedbackSessionScope(c)
	if !ok {
		return
	}
	var conversation AgentConversation
	if err := db.Where("id = ?", conversationID).First(&conversation).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeBadRequest, "对话不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "查询对话失败: "+err.Error(), nil))
		return
	}
	// 对话必须属于 session scope 的项目
	if conversation.ProjectID != scope.ProjectID {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNoPermission, "您无权访问该对话", nil))
		return
	}
	messages, err := GetConversationMessages(db, conversationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "获取消息列表失败: "+err.Error(), nil))
		return
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(messages))
}

// loadFeedbackForSession 加载反馈并校验其属于 session scope（project + custom_user_id）。
func loadFeedbackForSession(c *gin.Context, db *gorm.DB, feedbackID uint, scope middleware.FeedbackSessionScope) (*models.Feedback, bool) {
	var fb models.Feedback
	if err := db.First(&fb, feedbackID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeFeedbackNotFound, "反馈不存在", nil))
			return nil, false
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈失败: "+err.Error(), nil))
		return nil, false
	}
	if fb.ProjectID != scope.ProjectID {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNoPermission, "您无权访问该反馈", nil))
		return nil, false
	}
	if _, ok := requireCustomerFeedbackAccess(c, fb, scope.CustomUserID); !ok {
		return nil, false
	}
	return &fb, true
}
