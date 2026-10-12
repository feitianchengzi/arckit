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

// 独立智能客服会话：不绑定 feedback（feedback_id 固定为 0），
// 按 (project_id, custom_user_id) 作用域隔离，供「反馈建议」页的客服入口使用。
//
// 路由（session / apikey 两种鉴权，路径前缀不同、相对路径一致）：
//   POST /agent-chats/messages
//   GET  /agent-chats/conversations
//   GET  /agent-chats/conversations/:conversationId/messages
// 作用域统一用 query 传递：session 模式忽略 query 由 token 决定，apikey 模式取 project_id + custom_user_id。

type standaloneScope struct {
	ProjectID    uint
	CustomUserID string
}

// standaloneScopeQuery apikey 模式下从 query 解析作用域。
type standaloneScopeQuery struct {
	ProjectID    uint   `form:"project_id"`
	CustomUserID string `form:"custom_user_id"`
}

func parseStandaloneScopeQuery(c *gin.Context) (standaloneScope, bool) {
	var q standaloneScopeQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "参数绑定失败: "+err.Error(), nil))
		return standaloneScope{}, false
	}
	customUserID := strings.TrimSpace(q.CustomUserID)
	if q.ProjectID == 0 || customUserID == "" || len(customUserID) > 128 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "project_id 和 custom_user_id 为必填项，custom_user_id 最大长度为 128", nil))
		return standaloneScope{}, false
	}
	return standaloneScope{ProjectID: q.ProjectID, CustomUserID: customUserID}, true
}

// requireStandaloneScopeFromSession session 模式：作用域由 feedback session token 决定。
func requireStandaloneScopeFromSession(c *gin.Context) (standaloneScope, bool) {
	scope, ok := middleware.RequireFeedbackSessionScope(c)
	if !ok {
		return standaloneScope{}, false
	}
	if scope.ProjectID == 0 || strings.TrimSpace(scope.CustomUserID) == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "session 缺少 project / custom_user 作用域", nil))
		return standaloneScope{}, false
	}
	return standaloneScope{ProjectID: scope.ProjectID, CustomUserID: strings.TrimSpace(scope.CustomUserID)}, true
}

// requireStandaloneScopeByAPIKey apikey 模式：query 指定作用域，并校验调用方是该项目成员。
func requireStandaloneScopeByAPIKey(c *gin.Context) (standaloneScope, bool) {
	scope, ok := parseStandaloneScopeQuery(c)
	if !ok {
		return standaloneScope{}, false
	}
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return standaloneScope{}, false
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return standaloneScope{}, false
	}
	var member models.ProjectMember
	if err := db.Where("project_id = ? AND user_id = ?", scope.ProjectID, userID).First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNotMember, "您不是该项目的成员，无法使用智能客服", nil))
			return standaloneScope{}, false
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "验证项目成员身份失败: "+err.Error(), nil))
		return standaloneScope{}, false
	}
	return scope, true
}

// runStandaloneAgentMessage 处理独立会话的一轮问答（两种鉴权共用）。
func runStandaloneAgentMessage(c *gin.Context, scope standaloneScope) {
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	var req AgentMessageRequestSession
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}
	if strings.TrimSpace(req.Content) == "" && len(req.Attachments) == 0 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "消息内容不能为空", nil))
		return
	}

	conv, err := GetOrCreateStandaloneConversation(db, req.ConversationID, scope.ProjectID, scope.CustomUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "创建对话失败: "+err.Error(), nil))
		return
	}

	customerMsg := &AgentMessageRecord{
		ConversationID: conv.ID,
		FeedbackID:     standaloneConversationFeedbackID,
		ProjectID:      scope.ProjectID,
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

	imageUrls := make([]string, 0, len(req.Attachments))
	for _, att := range req.Attachments {
		if strings.EqualFold(strings.TrimSpace(att.Type), "image") {
			if u := strings.TrimSpace(att.URL); u != "" {
				imageUrls = append(imageUrls, u)
			}
		}
	}

	agentResponse, err := processWithAgent(c, db, scope.ProjectID, standaloneConversationFeedbackID, req.Content, history, conv.ID, imageUrls)
	if err != nil {
		log.Printf("[agent-chat-standalone] processWithAgent 失败 project=%d user=%s: %v", scope.ProjectID, scope.CustomUserID, err)
		agentResponse = &AgentResponse{
			Content:     arcOrbitAgentUnavailableReply(),
			Confidence:  0,
			NeedCollect: true,
		}
	}

	agentMsg := &AgentMessageRecord{
		ConversationID: conv.ID,
		FeedbackID:     standaloneConversationFeedbackID,
		ProjectID:      scope.ProjectID,
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

	c.JSON(http.StatusOK, response.NewSuccessResponse(AgentMessageResponse{
		MessageID:      agentMsg.ID,
		ConversationID: conv.ID,
		Content:        agentResponse.Content,
		SenderType:     "agent",
		ToolCalls:      agentResponse.ToolCalls,
		Confidence:     agentResponse.Confidence,
		NeedCollect:    agentResponse.NeedCollect,
		Structured:     agentResponse.Structured,
	}))
}

// listStandaloneConversations 列出该客户的独立会话。
func listStandaloneConversations(c *gin.Context, scope standaloneScope) {
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	convs, err := GetStandaloneConversations(db, scope.ProjectID, scope.CustomUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "获取对话列表失败: "+err.Error(), nil))
		return
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(convs))
}

// listStandaloneMessages 列出独立会话的消息，并校验归属。
func listStandaloneMessages(c *gin.Context, scope standaloneScope) {
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

	var conversation AgentConversation
	err := db.Where("id = ? AND project_id = ? AND custom_user_id = ? AND feedback_id = ?",
		conversationID, scope.ProjectID, scope.CustomUserID, standaloneConversationFeedbackID).
		First(&conversation).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeBadRequest, "对话不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "查询对话失败: "+err.Error(), nil))
		return
	}

	messages, err := GetConversationMessages(db, conversationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "获取消息列表失败: "+err.Error(), nil))
		return
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(messages))
}

// ---- session 模式入口 ----

// StandaloneAgentMessageFromSession POST /workshop/v2/feedback/agent-chats/messages
func StandaloneAgentMessageFromSession(c *gin.Context) {
	scope, ok := requireStandaloneScopeFromSession(c)
	if !ok {
		return
	}
	runStandaloneAgentMessage(c, scope)
}

// GetStandaloneConversationsFromSession GET /workshop/v2/feedback/agent-chats/conversations
func GetStandaloneConversationsFromSession(c *gin.Context) {
	scope, ok := requireStandaloneScopeFromSession(c)
	if !ok {
		return
	}
	listStandaloneConversations(c, scope)
}

// GetStandaloneMessagesFromSession GET /workshop/v2/feedback/agent-chats/conversations/:conversationId/messages
func GetStandaloneMessagesFromSession(c *gin.Context) {
	scope, ok := requireStandaloneScopeFromSession(c)
	if !ok {
		return
	}
	listStandaloneMessages(c, scope)
}

// ---- apikey 模式入口 ----

// StandaloneAgentMessageByAPIKey POST /workshop/v2/apikey/agent-chats/messages
func StandaloneAgentMessageByAPIKey(c *gin.Context) {
	scope, ok := requireStandaloneScopeByAPIKey(c)
	if !ok {
		return
	}
	runStandaloneAgentMessage(c, scope)
}

// GetStandaloneConversationsByAPIKey GET /workshop/v2/apikey/agent-chats/conversations
func GetStandaloneConversationsByAPIKey(c *gin.Context) {
	scope, ok := requireStandaloneScopeByAPIKey(c)
	if !ok {
		return
	}
	listStandaloneConversations(c, scope)
}

// GetStandaloneMessagesByAPIKey GET /workshop/v2/apikey/agent-chats/conversations/:conversationId/messages
func GetStandaloneMessagesByAPIKey(c *gin.Context) {
	scope, ok := requireStandaloneScopeByAPIKey(c)
	if !ok {
		return
	}
	listStandaloneMessages(c, scope)
}
