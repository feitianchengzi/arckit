package handler

import (
	"encoding/json"
	"fmt"
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
	Content         string                 `json:"content"`
	ClientMessageID string                 `json:"client_message_id,omitempty"`
	NewConversation bool                   `json:"new_conversation,omitempty"`
	ConversationID  string                 `json:"conversation_id,omitempty"`
	Attachments     []AgentAttachmentInput `json:"attachments,omitempty"`
}

// AgentAttachmentInput 智能客服消息的图片附件输入（已上传到 OSS 后的引用）。
type AgentAttachmentInput struct {
	Type       string `json:"type"`                 // image
	ObjectKey  string `json:"object_key,omitempty"` // OSS object key
	URL        string `json:"url,omitempty"`        // 可直接访问的 URL（多模态时传给 LLM）
	FileName   string `json:"file_name,omitempty"`
	MimeType   string `json:"mime_type,omitempty"`
	Size       int64  `json:"size,omitempty"`
	DurationMS int64  `json:"duration_ms,omitempty"`
}

// AgentMessageFromSession session 模式：客户向智能客服发送消息。
// POST /workshop/v2/feedback/feedbacks/:id/agent-message
func AgentMessageFromSession(c *gin.Context) {
	scope, ok := middleware.RequireFeedbackSessionScope(c)
	if !ok {
		return
	}
	runBoundAgentMessage(c, scope)
}

func runBoundAgentMessage(c *gin.Context, scope middleware.FeedbackSessionScope) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
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

	turn, err := beginSupportTurn(db, fmt.Sprintf("%d/%s/feedback/%d", projectID, scope.CustomUserID, feedbackID), req)
	if err != nil {
		c.JSON(409, response.NewErrorResponse(response.CodeBadRequest, err.Error(), nil))
		return
	}
	defer turn.Rollback()
	if turn.Replay != nil {
		c.JSON(200, response.NewSuccessResponse(turn.Replay))
		return
	}
	db = turn.DB
	if err := validateAgentMedia(req.Content, req.Attachments, feedbackAttachmentPrefix(projectID, scope.CustomUserID)); err != nil {
		c.JSON(400, response.NewErrorResponse(response.CodeBadRequest, err.Error(), nil))
		return
	}
	for index := range req.Attachments {
		req.Attachments[index].MimeType = strings.Split(req.Attachments[index].MimeType, ";")[0]
	}
	imageUrls, audioUnderstanding, err := prepareAgentMedia(c.Request.Context(), &req)
	if err != nil {
		c.JSON(503, response.NewErrorResponse(response.CodeInternalError, err.Error(), nil))
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
		attJSON, _ := json.Marshal(map[string]interface{}{"attachments": req.Attachments, "audio_understanding": audioUnderstanding})
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
	if len(imageUrls) == 0 {
		imageUrls = historicalAgentImages(history, feedbackAttachmentPrefix(scope.ProjectID, scope.CustomUserID))
	}
	agentResponse, err := processWithAgent(c, db, projectID, feedbackID, req.Content, history, conv.ID, imageUrls)
	if err != nil {
		log.Printf("[agent-message-session] processWithAgent 失败 project=%d feedback=%d: %v", projectID, feedbackID, err)
		agentResponse = &AgentResponse{
			Content:     arcOrbitAgentUnavailableReply(),
			Confidence:  0,
			NeedCollect: true,
		}
	}

	applyClarification(agentResponse, history)
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
	persistClarificationMetadata(agentMsg, agentResponse.Clarification)
	persistAgentSources(agentMsg, agentResponse.Sources)

	if err := SaveMessage(db, agentMsg); err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "保存Agent回复失败: "+err.Error(), nil))
		return
	}

	// session 模式无内部 userID，不触发面向内部用户的 need_collect 事件；
	// 低置信兜底由前端依据 NeedCollect 字段处理。
	result := AgentMessageResponse{
		MessageID:         agentMsg.ID,
		CustomerMessageID: customerMsg.ID,
		ConversationID:    conv.ID,
		Content:           agentResponse.Content,
		SenderType:        "agent",
		ToolCalls:         agentResponse.ToolCalls,
		Confidence:        agentResponse.Confidence,
		NeedCollect:       agentResponse.NeedCollect,
		Structured:        agentResponse.Structured,
		Clarification:     agentResponse.Clarification,
		Sources:           agentResponse.Sources,
	}
	if err := turn.Complete(result); err != nil {
		c.JSON(500, response.NewErrorResponse(response.CodeInternalError, "保存完整会话失败，请重试", nil))
		return
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(result))
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
	if conversation.FeedbackID == 0 {
		if conversation.CustomUserID != scope.CustomUserID {
			c.JSON(404, response.NewErrorResponse(response.CodeNotFound, "会话不存在", nil))
			return
		}
	} else {
		if _, ok := loadFeedbackForSession(c, db, conversation.FeedbackID, scope); !ok {
			return
		}
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
