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

// AgentMessageRequest Agent 消息请求
type AgentMessageRequest struct {
	Content        string `json:"content" binding:"required"`
	ConversationID string `json:"conversation_id,omitempty"`
}

// AgentMessageResponse Agent 消息响应
type AgentMessageResponse struct {
	MessageID      uint       `json:"message_id"`
	ConversationID string     `json:"conversation_id"`
	Content        string     `json:"content"`
	SenderType     string     `json:"sender_type"`
	ToolCalls      []ToolCall `json:"tool_calls,omitempty"`
	Confidence     float64    `json:"confidence"`
	// NeedCollect 置信度低于阈值（PRD F-03 低置信），提示客户端可升级人工流转。
	NeedCollect bool `json:"need_collect,omitempty"`
}

// AgentMessageHandler 处理客户消息，触发 Agent 响应
// POST /api/v1/projects/{projectId}/feedbacks/{feedbackId}/agent-message
func AgentMessageHandler(c *gin.Context) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 先查反馈取真实 project_id（路由 /feedbacks/:id/agent-message 中 :id 是 feedback id）
	var feedback models.Feedback
	if err := db.Where("id = ?", feedbackID).First(&feedback).Error; err != nil {
		c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeFeedbackNotFound, "反馈不存在", nil))
		return
	}
	projectID := feedback.ProjectID

	// 鉴权
	userID, ok := requireFeedbackProjectMember(c, db, projectID, "发送消息")
	if !ok {
		return
	}
	_ = userID

	var req AgentMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}

	// 获取或创建对话
	conv, err := GetOrCreateConversation(db, req.ConversationID, feedbackID, projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "创建对话失败: "+err.Error(), nil))
		return
	}

	// 存储客户消息
	customerMsg := &AgentMessageRecord{
		ConversationID: conv.ID,
		FeedbackID:     feedbackID,
		ProjectID:      projectID,
		SenderType:     "customer",
		Content:        req.Content,
	}
	if err := SaveMessage(db, customerMsg); err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "保存消息失败: "+err.Error(), nil))
		return
	}

	// 获取对话历史
	history, err := GetConversationHistory(db, conv.ID, 20)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "获取对话历史失败: "+err.Error(), nil))
		return
	}

	// 调用 Agent 处理
	agentResponse, err := processWithAgent(c, db, projectID, feedbackID, req.Content, history, conv.ID, nil)
	if err != nil {
		// Agent 失败时降级为带平台身份的兜底（保留跟进承诺）
		log.Printf("[agent-message] processWithAgent 失败 project=%d feedback=%d: %v", projectID, feedbackID, err)
		agentResponse = &AgentResponse{
			Content:    arcOrbitAgentUnavailableReply(),
			Confidence: 0,
			NeedCollect: true,
		}
	}

	// 存储 Agent 回复
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

	// 持久化 OpenHands 会话 ID 映射，供下轮对话续用同一 OpenHands 会话
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

	// 如果需要收集更多信息，创建 Feedback
	if agentResponse.NeedCollect {
		// 可以在这里触发创建 Feedback 的逻辑
		notifyProjectEvent(c, db, projectID, userID, "agent.need_collect", map[string]interface{}{
			"feedback_id":     feedbackID,
			"conversation_id": conv.ID,
			"agent_message":   agentResponse.Content,
		})
	}

	// 返回响应
	c.JSON(http.StatusOK, response.NewSuccessResponse(AgentMessageResponse{
		MessageID:      agentMsg.ID,
		ConversationID: conv.ID,
		Content:        agentResponse.Content,
		SenderType:     "agent",
		ToolCalls:      agentResponse.ToolCalls,
		Confidence:     agentResponse.Confidence,
		NeedCollect:    agentResponse.NeedCollect,
	}))
}

// AgentResponse Agent 响应
type AgentResponse struct {
	Content     string     `json:"content"`
	ToolCalls   []ToolCall `json:"tool_calls,omitempty"`
	Confidence  float64    `json:"confidence"`
	NeedCollect bool       `json:"need_collect"`
	// OHConversationID OpenHands 侧会话 ID，用于持久化映射
	OHConversationID string `json:"openhands_conversation_id,omitempty"`
}

// agentUnresolvedFallbackPhrases 硬失败兜底句：命中即无法解决。
// 不含"转交 ArcOrbit 平台团队/会有专人跟进"——中置信正常答复也会带跟进承诺，不能据此判未解决。
var agentUnresolvedFallbackPhrases = []string{
	"未找到可靠依据",
	"未找到可靠结论",
	"暂无法给出准确结论",
	"当前暂时无法完成本次回答",
	"我这边没有可靠依据",
	"无法完成本次回答",
	"建议转人工处理",
	"建议您转人工",
	"建议转人工",
}

// shouldMarkAgentMessageUnresolved 判定本轮 Agent 回复是否记为未解决。
// 低置信（PRD F-03 < 0.75）或命中硬失败兜底句即未解决。
func shouldMarkAgentMessageUnresolved(confidence float64, content string) bool {
	if confidence < agentConfidenceLowThreshold {
		return true
	}
	trimmed := strings.TrimSpace(content)
	if trimmed == "" {
		return false
	}
	for _, phrase := range agentUnresolvedFallbackPhrases {
		if strings.Contains(trimmed, phrase) {
			return true
		}
	}
	return false
}

// applyAgentMessageUnresolvedMetadata 在 Agent 消息 metadata 上打 unresolved=true（可与既有 metadata 合并）。
func applyAgentMessageUnresolvedMetadata(msg *AgentMessageRecord, confidence float64, content string) {
	if msg == nil || !shouldMarkAgentMessageUnresolved(confidence, content) {
		return
	}
	meta := map[string]interface{}{}
	if msg.Metadata != nil && strings.TrimSpace(*msg.Metadata) != "" {
		_ = json.Unmarshal([]byte(*msg.Metadata), &meta)
	}
	meta["unresolved"] = true
	raw, err := json.Marshal(meta)
	if err != nil {
		return
	}
	text := string(raw)
	msg.Metadata = &text
}

// processWithAgent 使用 Agent 处理消息。
// 本地仅做正向白名单命中（问候/感谢/能力咨询/提交引导等）直接回复；
// 未命中白名单的消息一律放行 OpenHands/LLM，禁止负向启发式截胡。
func processWithAgent(c *gin.Context, db *gorm.DB, projectID, feedbackID uint, query string, history []AgentMessageRecord, conversationID string, imageUrls []string) (*AgentResponse, error) {
	// 本地白名单：命中才直接回复（毫秒级），返回 nil 表示放行 Agent
	if localResp, _ := classifyAndRespond(query); localResp != nil {
		return localResp, nil
	}

	// OPENHANDS_ENABLED 总开关（默认开启）；关闭时降级为本地代码搜索
	if !openHandsEnabled() {
		return processWithLocalLLM(db, projectID, query, history)
	}

	// 未命中本地白名单 → OpenHands 检索/对话
	agent := getAgentServerByProject(db, projectID)
	if agent == nil {
		return processWithLocalLLM(db, projectID, query, history)
	}
	return callOpenHandsAgentForChat(c, agent, query, conversationID, history, imageUrls)
}

// callOpenHandsAgentForChat 调用 OpenHands Agent 进行对话（真实契约）。
// OpenHands 会话 ID 持久化在本地对话最近一条 agent 消息的 metadata 中，
// 用于跨请求复用同一 OpenHands 会话。会话过期时将历史上下文注入 query，
// 确保 Agent 在新会话中仍能记住之前的对话内容。
func callOpenHandsAgentForChat(c *gin.Context, agent *OpenHandsAgent, query, conversationID string, history []AgentMessageRecord, imageUrls []string) (*AgentResponse, error) {
	ohConvID := getOpenHandsConversationID(history)

	// 将历史对话注入到 query 中，确保即使 OpenHands 会话过期重建，Agent 仍拥有完整上下文
	queryWithContext := buildQueryWithHistory(query, history, 20)
	// 最外层注入 ArcOrbit 人设（身份/体验/严谨性），内层注入置信度自评要求（PRD F-03）。
	result, err := callOpenHandsAgentSync(agent, buildArcOrbitAgentPrompt(buildAgentQueryWithConfidenceInstruction(queryWithContext)), ohConvID, imageUrls)
	if err != nil {
		return nil, err
	}

	content, confidence := parseAgentConfidence(result.Content)
	return &AgentResponse{
		Content:           content,
		Confidence:        confidence,
		NeedCollect:       confidence < agentConfidenceLowThreshold,
		OHConversationID:  result.ConversationID,
	}, nil
}

// getOpenHandsConversationID 从消息记录中恢复 OpenHands 会话 ID
func getOpenHandsConversationID(history []AgentMessageRecord) string {
	for i := len(history) - 1; i >= 0; i-- {
		msg := history[i]
		if msg.SenderType != "agent" || msg.Metadata == nil {
			continue
		}
		var meta struct {
			OpenHandsConversationID string `json:"openhands_conversation_id"`
		}
		if json.Unmarshal([]byte(*msg.Metadata), &meta) == nil && meta.OpenHandsConversationID != "" {
			return meta.OpenHandsConversationID
		}
	}
	return ""
}

// processWithLocalLLM 使用本地 LLM 处理（降级方案）
func processWithLocalLLM(db *gorm.DB, projectID uint, query string, history []AgentMessageRecord) (*AgentResponse, error) {
	// 本地代码搜索（DB 故障上抛，不得吞成"无结果"）
	results, err := searchCodeChunksBySQL(db, projectID, query, 5)
	if err != nil {
		return nil, fmt.Errorf("本地代码检索失败: %w", err)
	}

	if len(results) == 0 {
		return &AgentResponse{
			Content:    arcOrbitAgentNoResultReply(),
			Confidence: 0,
			NeedCollect: true,
		}, nil
	}

	return &AgentResponse{
		Content:    buildLocalSearchReply(results),
		Confidence: 0.7,
	}, nil
}

// GetAgentConversationsHandler 获取反馈关联的对话列表
// GET /api/v1/projects/{projectId}/feedbacks/{feedbackId}/agent-conversations
func GetAgentConversationsHandler(c *gin.Context) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 路由 /feedbacks/:id/agent-conversations 的 :id 是 feedbackID，
	// 项目归属需从 feedback 记录取得后再鉴权。
	var feedback models.Feedback
	if err := db.First(&feedback, feedbackID).Error; err != nil {
		if gorm.ErrRecordNotFound == err {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeFeedbackNotFound, "反馈不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈失败: "+err.Error(), nil))
		return
	}

	_, ok = requireFeedbackProjectMember(c, db, feedback.ProjectID, "查看对话")
	if !ok {
		return
	}

	convs, err := GetFeedbackConversations(db, feedbackID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "获取对话列表失败: "+err.Error(), nil))
		return
	}

	c.JSON(http.StatusOK, response.NewSuccessResponse(convs))
}

// GetAgentConversationMessagesHandler 获取对话消息列表
// GET /feedbacks/:id/agent-conversations/:conversationId/messages
func GetAgentConversationMessagesHandler(c *gin.Context) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}

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

	// 对话必须归属当前反馈，项目归属从 feedback 取得后再鉴权。
	var conversation AgentConversation
	if err := db.Where("id = ? AND feedback_id = ?", conversationID, feedbackID).First(&conversation).Error; err != nil {
		if gorm.ErrRecordNotFound == err {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeBadRequest, "对话不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "查询对话失败: "+err.Error(), nil))
		return
	}

	_, ok = requireFeedbackProjectMember(c, db, conversation.ProjectID, "查看消息")
	if !ok {
		return
	}

	messages, err := GetConversationMessages(db, conversationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "获取消息列表失败: "+err.Error(), nil))
		return
	}

	c.JSON(http.StatusOK, response.NewSuccessResponse(messages))
}

// GetFeedbackAgentMessagesHandler 获取反馈关联的所有 Agent 消息（供 chat-widget 加载历史）
// GET /api/v2/feedbacks/:id/agent-messages
func GetFeedbackAgentMessagesHandler(c *gin.Context) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	var messages []AgentMessageRecord
	if err := db.Where("feedback_id = ?", feedbackID).
		Order("created_at ASC").
		Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "获取消息列表失败: "+err.Error(), nil))
		return
	}

	type MessageView struct {
		ID        uint    `json:"id"`
		Sender    string  `json:"sender"`
		Content   string  `json:"content"`
		CreatedAt string  `json:"created_at"`
		Confidence *float64 `json:"confidence,omitempty"`
	}

	views := make([]MessageView, 0, len(messages))
	for _, m := range messages {
		sender := "customer"
		switch m.SenderType {
		case "agent", "developer":
			sender = m.SenderType
		case "customer":
			sender = "customer"
		default:
			sender = m.SenderType
		}
		views = append(views, MessageView{
			ID:        m.ID,
			Sender:    sender,
			Content:   m.Content,
			CreatedAt: m.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			Confidence: m.Confidence,
		})
	}

	c.JSON(http.StatusOK, response.NewSuccessResponse(views))
}

// syncDeveloperReplyToAgentMessages 将开发者回复同步到 agent_message_records，
// 使 chat-widget 客户端能看到内部人员的回复。
func syncDeveloperReplyToAgentMessages(db *gorm.DB, feedback models.Feedback, content string) {
	// 查找该反馈最近的 conversation_id，复用同一个对话
	var lastRecord AgentMessageRecord
	conversationID := ""
	if err := db.Where("feedback_id = ?", feedback.ID).
		Order("id DESC").First(&lastRecord).Error; err == nil {
		conversationID = lastRecord.ConversationID
	}
	if conversationID == "" {
		conversationID = fmt.Sprintf("fb-%d", feedback.ID)
	}

	agentMsg := &AgentMessageRecord{
		ConversationID: conversationID,
		FeedbackID:     feedback.ID,
		ProjectID:      feedback.ProjectID,
		SenderType:     "developer",
		Content:        content,
	}
	db.Create(agentMsg)
}
