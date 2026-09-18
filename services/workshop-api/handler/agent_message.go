package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

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
}

// AgentMessageHandler 处理客户消息，触发 Agent 响应
// POST /api/v1/projects/{projectId}/feedbacks/{feedbackId}/agent-message
func AgentMessageHandler(c *gin.Context) {
	projectID, ok := parseProjectIDParam(c)
	if !ok {
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

	// 验证反馈存在
	var feedback models.Feedback
	if err := db.Where("id = ? AND project_id = ?", feedbackID, projectID).First(&feedback).Error; err != nil {
		c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeFeedbackNotFound, "反馈不存在", nil))
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
	agentResponse, err := processWithAgent(c, db, projectID, feedbackID, req.Content, history, conv.ID)
	if err != nil {
		// Agent 失败时降级为转人工
		agentResponse = &AgentResponse{
			Content:    "抱歉，我暂时无法回答您的问题。已记录您的问题，会有专人跟进处理。",
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
	}))
}

// AgentResponse Agent 响应
type AgentResponse struct {
	Content     string     `json:"content"`
	ToolCalls   []ToolCall `json:"tool_calls,omitempty"`
	Confidence  float64    `json:"confidence"`
	NeedCollect bool       `json:"need_collect"`
}

// processWithAgent 使用 Agent 处理消息
func processWithAgent(c *gin.Context, db *gorm.DB, projectID, feedbackID uint, query string, history []AgentMessageRecord, conversationID string) (*AgentResponse, error) {
	// 获取 Agent 配置
	agent := getAgentServerByProject(db, projectID)
	if agent == nil {
		// 没有配置 Agent，使用本地 LLM 或降级
		return processWithLocalLLM(db, projectID, query, history)
	}

	// 调用 OpenHands Agent Server
	return callOpenHandsAgentForChat(c, agent, query, conversationID, history)
}

// callOpenHandsAgentForChat 调用 OpenHands Agent 进行对话
func callOpenHandsAgentForChat(c *gin.Context, agent *OpenHandsAgent, query, conversationID string, history []AgentMessageRecord) (*AgentResponse, error) {
	// 构建消息历史
	messages := []map[string]string{}
	for _, h := range history {
		role := "user"
		if h.SenderType == "agent" || h.SenderType == "system" {
			role = "assistant"
		}
		messages = append(messages, map[string]string{
			"role":    role,
			"content": h.Content,
		})
	}
	messages = append(messages, map[string]string{
		"role":    "user",
		"content": query,
	})

	// 构建请求体
	payload := map[string]interface{}{
		"messages": messages,
		"tools":    GetAgentTools(0, nil),
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("序列化请求失败: %w", err)
	}

	// 确定 API 端点
	url := agent.URL + "/api/chat"
	if conversationID != "" {
		url = agent.URL + "/api/conversations/" + conversationID + "/messages"
	}

	req, err := http.NewRequest("POST", url, strings.NewReader(string(jsonPayload)))
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Session-API-Key", agent.APIKey)

	// 使用配置的超时时间
	timeoutMs := agent.TimeoutMs
	if timeoutMs <= 0 {
		timeoutMs = 30000 // Agent 响应可能需要更长时间
	}
	client := &http.Client{
		Timeout: time.Duration(timeoutMs) * time.Millisecond,
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("调用 OpenHands Agent 失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	// 解析响应
	var agentResp struct {
		Content    string     `json:"content"`
		ToolCalls  []ToolCall `json:"tool_calls,omitempty"`
		Confidence float64    `json:"confidence"`
	}

	if err := json.Unmarshal(body, &agentResp); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	// 如果 Agent 返回了工具调用，执行它们
	if len(agentResp.ToolCalls) > 0 {
		var toolResults []ToolResult
		for _, tc := range agentResp.ToolCalls {
			// 从消息历史中获取 projectID（如果有）
			projectID := uint(0)
			result := ExecuteTool(c, projectID, tc)
			toolResults = append(toolResults, result)
		}

		// 将工具结果发送回 Agent 获取最终回复
		toolResultsContent := ToolCallsToContent(toolResults)
		finalResponse, err := callAgentWithToolResults(agent, messages, toolResultsContent)
		if err == nil {
			return finalResponse, nil
		}
	}

	return &AgentResponse{
		Content:    agentResp.Content,
		ToolCalls:  agentResp.ToolCalls,
		Confidence: agentResp.Confidence,
	}, nil
}

// callAgentWithToolResults 将工具结果发送回 Agent
func callAgentWithToolResults(agent *OpenHandsAgent, messages []map[string]string, toolResults string) (*AgentResponse, error) {
	// 添加工具结果到消息
	messages = append(messages, map[string]string{
		"role":    "tool",
		"content": toolResults,
	})

	payload := map[string]interface{}{
		"messages": messages,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	url := agent.URL + "/api/chat"
	req, err := http.NewRequest("POST", url, strings.NewReader(string(jsonPayload)))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Session-API-Key", agent.APIKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var agentResp struct {
		Content    string  `json:"content"`
		Confidence float64 `json:"confidence"`
	}

	if err := json.Unmarshal(body, &agentResp); err != nil {
		return nil, err
	}

	return &AgentResponse{
		Content:    agentResp.Content,
		Confidence: agentResp.Confidence,
	}, nil
}

// processWithLocalLLM 使用本地 LLM 处理（降级方案）
func processWithLocalLLM(db *gorm.DB, projectID uint, query string, history []AgentMessageRecord) (*AgentResponse, error) {
	// 本地代码搜索
	results := searchCodeChunksBySQL(db, projectID, query, 5)

	if len(results) == 0 {
		return &AgentResponse{
			Content:    "抱歉，我暂时无法找到相关信息。已记录您的问题，会有专人跟进处理。",
			Confidence: 0,
			NeedCollect: true,
		}, nil
	}

	// 构建回复
	var sb strings.Builder
	sb.WriteString("根据代码搜索，找到以下相关信息：\n\n")

	for i, r := range results {
		sb.WriteString(fmt.Sprintf("%d. **%s** (%s)\n", i+1, r.FilePath, r.SymbolName))
		sb.WriteString(fmt.Sprintf("   代码片段:\n```\n%s\n```\n\n", r.Snippet))
	}

	sb.WriteString("如需更多信息，请告诉我具体想了解哪个部分。")

	return &AgentResponse{
		Content:    sb.String(),
		Confidence: 0.7,
	}, nil
}

// GetAgentConversationsHandler 获取反馈关联的对话列表
// GET /api/v1/projects/{projectId}/feedbacks/{feedbackId}/agent-conversations
func GetAgentConversationsHandler(c *gin.Context) {
	projectID, ok := parseProjectIDParam(c)
	if !ok {
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

	_, ok = requireFeedbackProjectMember(c, db, projectID, "查看对话")
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
// GET /api/v1/projects/{projectId}/agent-conversations/{conversationId}/messages
func GetAgentConversationMessagesHandler(c *gin.Context) {
	projectID, ok := parseProjectIDParam(c)
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

	_, ok = requireFeedbackProjectMember(c, db, projectID, "查看消息")
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
