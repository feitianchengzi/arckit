package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"
	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// filePathRegex 匹配回复文本中的代码文件路径（如 handler/retrieve.go、apps/todo-web/src/main.ts）
var filePathRegex = regexp.MustCompile(`[\w./-]+\.(go|ts|tsx|js|jsx|py|java|sql|json|yaml|yml|md|swift)`)

// RetrieveRequest 检索请求
type RetrieveRequest struct {
	ProjectID      uint   `json:"project_id" binding:"required"`
	Query          string `json:"query" binding:"required"`
	ConversationID string `json:"conversation_id,omitempty"`
}

// RetrieveResponse 检索响应
type RetrieveResponse struct {
	Hits           []RetrievalHit `json:"hits"`
	Confidence     float64        `json:"confidence"`
	DraftReply     string         `json:"draft_reply,omitempty"`
	NeedCollect    bool           `json:"need_collect"`
	ConversationID string         `json:"conversation_id,omitempty"`
	// Degraded true 表示 Agent 层调用失败/超时的降级响应，与"真未命中"区分：
	// 前端据此保留上次结果（stale）并提示服务暂不可用，而非显示"未命中知识库"。
	Degraded bool `json:"degraded"`
}

// degradedRetrieveResponse Agent 层失败且本地无命中时的降级响应。
func degradedRetrieveResponse() RetrieveResponse {
	return RetrieveResponse{
		Hits:        []RetrievalHit{},
		NeedCollect: true,
		Degraded:    true,
	}
}

// RetrievalHit 检索命中
type RetrievalHit struct {
	Source    string  `json:"source"`
	Type      string  `json:"type"`
	Title     string  `json:"title"`
	Snippet   string  `json:"snippet"`
	Score     float64 `json:"score"`
	SourceRef string  `json:"source_ref,omitempty"`
}

// OpenHandsAgent OpenHands Agent Server 配置
type OpenHandsAgent struct {
	ID                   uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID            uint      `json:"project_id" gorm:"not null;index"`
	URL                  string    `json:"url" gorm:"type:varchar(500);not null"`
	APIKey               string    `json:"api_key" gorm:"type:varchar(500);not null"`
	Status               string    `json:"status" gorm:"type:varchar(32);not null;default:'active'"`
	LLMModel             string    `json:"llm_model" gorm:"type:varchar(200);default:'anthropic/claude-sonnet-4-5-20250929'"`
	LLMTemperature       float64   `json:"llm_temperature" gorm:"default:0.0"`
	MaxIterations        int       `json:"max_iterations" gorm:"default:50"`
	ConfidenceThreshold  float64   `json:"confidence_threshold" gorm:"default:0.75"`
	TimeoutMs            int       `json:"timeout_ms" gorm:"default:10000"`
	PersonaFile          string    `json:"persona_file" gorm:"type:varchar(500)"`
	SandboxRuntime       string    `json:"sandbox_runtime" gorm:"type:varchar(32);default:'docker'"`
	SandboxBaseImage     string    `json:"sandbox_base_image" gorm:"type:varchar(500);default:'ghcr.io/openhands/agent-server:latest-python'"`
	CreatedAt            time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt            time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

func (OpenHandsAgent) TableName() string {
	return "openhands_agents"
}

// CustomerCodeRepo 客户代码仓库配置
type CustomerCodeRepo struct {
	ID           uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID    uint      `json:"project_id" gorm:"not null;index"`
	CustomerID   string    `json:"customer_id" gorm:"type:varchar(128);not null;index"`
	RepoPath     string    `json:"repo_path" gorm:"type:varchar(500)"`
	RepoURL      string    `json:"repo_url" gorm:"type:varchar(500)"`
	Branch       string    `json:"branch" gorm:"type:varchar(100);not null;default:'main'"`
	AutoSync     bool      `json:"auto_sync" gorm:"not null;default:false"`
	LastSyncedAt time.Time `json:"last_synced_at"`
	Status       string    `json:"status" gorm:"type:varchar(32);not null;default:'ready'"`
	CreatedAt    time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

func (CustomerCodeRepo) TableName() string {
	return "customer_code_repos"
}

// RetrieveHandler 智能客服检索接口
// POST /api/v1/feedbacks/retrieve
func RetrieveHandler(c *gin.Context) {
	startTime := time.Now()

	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "读取请求体失败: "+err.Error(), nil))
		return
	}

	var req RetrieveRequest
	if err := json.Unmarshal(bodyBytes, &req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}

	projectID := req.ProjectID
	if projectID == 0 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "缺少项目ID参数", nil))
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 鉴权 + 项目隔离
	userID, ok := requireFeedbackProjectMember(c, db, projectID, "检索")
	if !ok {
		return
	}
	_ = userID // 用于日志追踪

	// 查询该项目的 OpenHands Agent Server 地址
	// 未配置 Agent 时 PRD F-03 的本地层（客户代码索引）仍可用，仅跳过 Agent 层。
	agent := getAgentServerByProject(db, projectID)

	// 两层检索：先本地代码搜索，再 OpenHands Agent
	var localHits []RetrievalHit
	degraded := false
	localResults, localErr := searchCodeChunksBySQL(db, projectID, req.Query, 5)
	if localErr != nil {
		// 本地索引表故障：标记 degraded，不得伪装成"真未命中"
		log.Printf("[retrieve] project=%d local_search_failed query_len=%d err=%v",
			projectID, len(req.Query), localErr)
		degraded = true
	}
	for _, r := range localResults {
		localHits = append(localHits, RetrievalHit{
			Source:    "customer_code",
			Type:      "code",
			Title:     fmt.Sprintf("%s:%d-%d (%s)", r.FilePath, r.StartLine, r.EndLine, r.SymbolName),
			Snippet:   r.Snippet,
			Score:     r.Score,
			SourceRef: r.FilePath,
		})
	}

	// 调用 OpenHands Agent Server（未配置时跳过）
	var agentResp *RetrieveResponse
	if agent != nil {
		var err error
		agentResp, err = callOpenHandsAgent(agent, req.Query, req.ConversationID)
		if err != nil {
			// 降级与"真未命中"必须可区分：日志 + degraded 字段
			log.Printf("[retrieve] project=%d agent_failed local_hits=%d query_len=%d err=%v",
				projectID, len(localHits), len(req.Query), err)
			if len(localHits) == 0 {
				// 降级：转追问收集
				c.JSON(200, gin.H{
					"code":    0,
					"data":    degradedRetrieveResponse(),
					"message": "我先帮你记录下来转团队跟进",
				})
				return
			}
			degraded = true
		}
	}

	// 合并两层检索结果
	var allHits []RetrievalHit
	allHits = append(allHits, localHits...)
	if agentResp != nil {
		allHits = append(allHits, agentResp.Hits...)
	}

	// 使用置信度合并算法计算最终置信度
	confidence, mergedHits := mergeHitsAndComputeConfidence(allHits)

	// 生成草稿
	draftReply := ""
	if len(mergedHits) > 0 {
		draftReply = buildDraftContentFromHits(mergedHits, req.Query)
	}

	// 判断是否需要收集
	threshold := 0.75
	if agent != nil && agent.ConfidenceThreshold > 0 {
		threshold = agent.ConfidenceThreshold
	}
	needCollect := confidence < threshold

	// 记录请求耗时
	elapsed := time.Since(startTime).Seconds()

	convID := ""
	if agentResp != nil {
		convID = agentResp.ConversationID
	}

	log.Printf("[retrieve] project=%d local_hits=%d agent_hits=%d degraded=%v confidence=%.2f elapsed=%.2fs",
		projectID, len(localHits), len(allHits)-len(localHits), degraded, confidence, elapsed)

	c.JSON(200, gin.H{
		"code": 0,
		"data": RetrieveResponse{
			Hits:           mergedHits,
			Confidence:     confidence,
			DraftReply:     draftReply,
			NeedCollect:    needCollect,
			ConversationID: convID,
			Degraded:       degraded,
		},
		"meta": gin.H{
			"elapsed_seconds": elapsed,
			"project_id":      projectID,
			"local_hits":      len(localHits),
			"agent_hits":      len(allHits) - len(localHits),
		},
	})
}

// getAgentServerByProject 查询项目的 OpenHands Agent Server
func getAgentServerByProject(db *gorm.DB, projectID uint) *OpenHandsAgent {
	var agent OpenHandsAgent
	if err := db.Where("project_id = ? AND status = ?", projectID, "active").First(&agent).Error; err != nil {
		return nil
	}
	return &agent
}

// callOpenHandsAgent 调用 OpenHands Agent Server（真实契约：建会话→run→轮询→取回复）
func callOpenHandsAgent(agent *OpenHandsAgent, query, conversationID string) (*RetrieveResponse, error) {
	result, err := callOpenHandsAgentSync(agent, query, conversationID, nil)
	if err != nil {
		return nil, err
	}

	// 从 agent 回复中提取引用的文件路径，作为检索命中
	hits := []RetrievalHit{}
	for _, file := range extractFilePaths(result.Content) {
		hits = append(hits, RetrievalHit{
			Source:    "customer_code",
			Type:      "code",
			Title:     file,
			Snippet:   truncateStr(result.Content, 200),
			Score:     0.9,
			SourceRef: file,
		})
	}

	return &RetrieveResponse{
		Hits:           hits,
		Confidence:     0.9,
		DraftReply:     result.Content,
		NeedCollect:    false,
		ConversationID: result.ConversationID,
	}, nil
}

// extractFilePaths 从文本中提取代码文件路径
func extractFilePaths(content string) []string {
	seen := map[string]bool{}
	var paths []string
	for _, m := range filePathRegex.FindAllString(content, -1) {
		if !seen[m] {
			seen[m] = true
			paths = append(paths, m)
		}
	}
	if len(paths) > 5 {
		paths = paths[:5]
	}
	return paths
}

// parseProjectIDParam 解析项目ID参数
func parseProjectIDParam(c *gin.Context) (uint, bool) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "缺少项目ID参数", nil))
		return 0, false
	}

	var id uint
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的项目ID", nil))
		return 0, false
	}

	return id, true
}

// ConfirmDraftHandler 确认草稿发送
// POST /api/v1/feedbacks/:id/messages/:messageId/confirm
func ConfirmDraftHandler(c *gin.Context) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 查询反馈获取 projectID
	var feedback models.Feedback
	if err := db.Where("id = ?", feedbackID).First(&feedback).Error; err != nil {
		if gorm.ErrRecordNotFound == err {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeFeedbackNotFound, "反馈不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈失败: "+err.Error(), nil))
		return
	}
	projectID := feedback.ProjectID

	// 鉴权 + 角色检查
	userID, ok := requireFeedbackTriagePermission(c, db, projectID, "确认草稿")
	if !ok {
		return
	}
	_ = userID

	// 解析消息ID
	messageIDStr := c.Param("messageId")
	if messageIDStr == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "缺少消息ID参数", nil))
		return
	}

	var messageID uint
	if _, err := fmt.Sscanf(messageIDStr, "%d", &messageID); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的消息ID", nil))
		return
	}

	// 查询消息
	var message models.FeedbackMessage
	if err := db.Where("id = ? AND feedback_id = ? AND project_id = ? AND sender_type = ? AND state = ?",
		messageID, feedbackID, projectID, models.FeedbackMessageSenderSystem, models.FeedbackMessageStatePendingReview).
		First(&message).Error; err != nil {
		if gorm.ErrRecordNotFound == err {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeFeedbackNotFound, "草稿不存在或已发送", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询草稿失败: "+err.Error(), nil))
		return
	}

	// 更新消息状态为已发送
	if err := db.Model(&message).Update("state", models.FeedbackMessageStateSent).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackUpdateFailed, "更新草稿状态失败: "+err.Error(), nil))
		return
	}

	// 创建通知
	notifyProjectEvent(c, db, projectID, userID, "feedback.message.confirmed", map[string]interface{}{
		"message_id": messageID,
		"feedback_id": feedbackID,
	})

	c.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
		"message_id": messageID,
		"state":      models.FeedbackMessageStateSent,
	}))
}

// RejectDraftHandler 驳回草稿
// POST /api/v1/feedbacks/:id/messages/:messageId/reject
func RejectDraftHandler(c *gin.Context) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 查询反馈获取 projectID
	var feedback models.Feedback
	if err := db.Where("id = ?", feedbackID).First(&feedback).Error; err != nil {
		if gorm.ErrRecordNotFound == err {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeFeedbackNotFound, "反馈不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈失败: "+err.Error(), nil))
		return
	}
	projectID := feedback.ProjectID

	// 鉴权 + 角色检查
	userID, ok := requireFeedbackTriagePermission(c, db, projectID, "驳回草稿")
	if !ok {
		return
	}
	_ = userID

	// 解析消息ID
	messageIDStr := c.Param("messageId")
	if messageIDStr == "" {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "缺少消息ID参数", nil))
		return
	}

	var messageID uint
	if _, err := fmt.Sscanf(messageIDStr, "%d", &messageID); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "无效的消息ID", nil))
		return
	}

	// 查询消息
	var message models.FeedbackMessage
	if err := db.Where("id = ? AND feedback_id = ? AND project_id = ? AND sender_type = ? AND state = ?",
		messageID, feedbackID, projectID, models.FeedbackMessageSenderSystem, models.FeedbackMessageStatePendingReview).
		First(&message).Error; err != nil {
		if gorm.ErrRecordNotFound == err {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeFeedbackNotFound, "草稿不存在或已发送", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询草稿失败: "+err.Error(), nil))
		return
	}

	// 删除草稿消息
	if err := db.Delete(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackUpdateFailed, "删除草稿失败: "+err.Error(), nil))
		return
	}

	// 创建通知
	notifyProjectEvent(c, db, projectID, userID, "feedback.message.rejected", map[string]interface{}{
		"message_id": messageID,
		"feedback_id": feedbackID,
	})

	c.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
		"message_id": messageID,
		"status":     "rejected",
	}))
}

// CreateDraftHandler 创建草稿（供 runtime 回写）
// POST /api/v1/projects/{projectId}/feedbacks/{feedbackId}/drafts
func CreateDraftHandler(c *gin.Context) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 鉴权（这里需要 API Key 认证，用于 runtime 回写）
	if !isAPIKeyRequest(c) {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeFeedbackNoPermission, "仅允许 API Key 认证", nil))
		return
	}

	var req struct {
		ProjectID   uint     `json:"project_id" binding:"required"`
		Content     string   `json:"content" binding:"required"`
		TaskID      uint     `json:"task_id"`
		SourceFiles []string `json:"source_files,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}

	projectID := req.ProjectID

	// 验证反馈存在
	var feedback models.Feedback
	if err := db.Where("id = ? AND project_id = ?", feedbackID, projectID).First(&feedback).Error; err != nil {
		if gorm.ErrRecordNotFound == err {
			c.JSON(http.StatusNotFound, response.NewErrorResponse(response.CodeFeedbackNotFound, "反馈不存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询反馈失败: "+err.Error(), nil))
		return
	}

	// 构造元数据
	metadata := map[string]interface{}{
		"source_files": req.SourceFiles,
		"task_id":      req.TaskID,
	}
	metadataBytes, _ := json.Marshal(metadata)
	metadataStr := string(metadataBytes)

	// 创建草稿消息
	message := models.FeedbackMessage{
		FeedbackID:  feedbackID,
		ProjectID:   projectID,
		SenderType:  models.FeedbackMessageSenderSystem,
		MessageType: models.FeedbackMessageTypeSystem,
		State:       models.FeedbackMessageStatePendingReview,
		Content:     req.Content,
		Metadata:    &metadataStr,
	}

	if err := db.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackCreateFailed, "创建草稿失败: "+err.Error(), nil))
		return
	}

	c.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
		"message_id": message.ID,
		"state":      models.FeedbackMessageStatePendingReview,
	}))
}

// GetOpenHandsConfigHandler 查询项目的 OpenHands 配置
// GET /api/v1/projects/{projectId}/openhands-config
func GetOpenHandsConfigHandler(c *gin.Context) {
	projectID, ok := parseProjectIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 鉴权
	_, ok = requireFeedbackProjectMember(c, db, projectID, "查询 OpenHands 配置")
	if !ok {
		return
	}

	agent := getAgentServerByProject(db, projectID)
	if agent == nil {
		c.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
			"enabled": false,
			"message": "该项目未配置 OpenHands Agent",
		}))
		return
	}

	c.JSON(http.StatusOK, response.NewSuccessResponse(agent))
}

// UpdateOpenHandsConfigHandler 更新项目的 OpenHands 配置
// PUT /api/v1/projects/{projectId}/openhands-config
func UpdateOpenHandsConfigHandler(c *gin.Context) {
	projectID, ok := parseProjectIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	// 鉴权 + 角色检查
	userID, ok := requireFeedbackTriagePermission(c, db, projectID, "更新 OpenHands 配置")
	if !ok {
		return
	}
	_ = userID

	var req struct {
		URL                  string  `json:"url" binding:"required"`
		APIKey               string  `json:"api_key" binding:"required"`
		LLMModel             string  `json:"llm_model"`
		LLMTemperature       float64 `json:"llm_temperature"`
		MaxIterations        int     `json:"max_iterations"`
		ConfidenceThreshold  float64 `json:"confidence_threshold"`
		TimeoutMs            int     `json:"timeout_ms"`
		PersonaFile          string  `json:"persona_file"`
		SandboxRuntime       string  `json:"sandbox_runtime"`
		SandboxBaseImage     string  `json:"sandbox_base_image"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误: "+err.Error(), nil))
		return
	}

	// 查找现有配置或创建新配置
	var agent OpenHandsAgent
	if err := db.Where("project_id = ?", projectID).First(&agent).Error; err != nil {
		// 创建新配置
		agent = OpenHandsAgent{
			ProjectID:           projectID,
			URL:                 req.URL,
			APIKey:              req.APIKey,
			Status:              "active",
			LLMModel:            req.LLMModel,
			LLMTemperature:      req.LLMTemperature,
			MaxIterations:       req.MaxIterations,
			ConfidenceThreshold: req.ConfidenceThreshold,
			TimeoutMs:           req.TimeoutMs,
			PersonaFile:         req.PersonaFile,
			SandboxRuntime:      req.SandboxRuntime,
			SandboxBaseImage:    req.SandboxBaseImage,
		}
		if err := db.Create(&agent).Error; err != nil {
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackCreateFailed, "创建 OpenHands 配置失败: "+err.Error(), nil))
			return
		}
	} else {
		// 更新现有配置
		agent.URL = req.URL
		agent.APIKey = req.APIKey
		if req.LLMModel != "" {
			agent.LLMModel = req.LLMModel
		}
		if req.LLMTemperature > 0 {
			agent.LLMTemperature = req.LLMTemperature
		}
		if req.MaxIterations > 0 {
			agent.MaxIterations = req.MaxIterations
		}
		if req.ConfidenceThreshold > 0 {
			agent.ConfidenceThreshold = req.ConfidenceThreshold
		}
		if req.TimeoutMs > 0 {
			agent.TimeoutMs = req.TimeoutMs
		}
		if req.PersonaFile != "" {
			agent.PersonaFile = req.PersonaFile
		}
		if req.SandboxRuntime != "" {
			agent.SandboxRuntime = req.SandboxRuntime
		}
		if req.SandboxBaseImage != "" {
			agent.SandboxBaseImage = req.SandboxBaseImage
		}
		if err := db.Save(&agent).Error; err != nil {
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackUpdateFailed, "更新 OpenHands 配置失败: "+err.Error(), nil))
			return
		}
	}

	c.JSON(http.StatusOK, response.NewSuccessResponse(agent))
}

// --- 置信度合并算法 ---

// 来源权重：FAQ 精确匹配 > 产品 facts > 客户文档 > 客户代码
const (
	sourceWeightProductFAQ     = 1.2
	sourceWeightProductFacts   = 1.0
	sourceWeightCustomerDoc    = 0.9
	sourceWeightCustomerCode   = 0.8
)

// sourceWeight 返回来源对应的权重
func sourceWeight(source string) float64 {
	switch source {
	case "product_faq":
		return sourceWeightProductFAQ
	case "product_facts":
		return sourceWeightProductFacts
	case "customer_doc":
		return sourceWeightCustomerDoc
	case "customer_code":
		return sourceWeightCustomerCode
	default:
		return 0.8
	}
}

// normalizeHitSource 标准化来源名称
func normalizeHitSource(source string) string {
	switch source {
	case "product_faq", "faq":
		return "product_faq"
	case "product_facts":
		return "product_facts"
	case "customer_doc", "doc":
		return "customer_doc"
	case "customer_code", "code":
		return "customer_code"
	default:
		return "customer_doc"
	}
}

// mergeHitsAndComputeConfidence 合并检索命中并计算置信度
// 置信度 = max(hit.score * weight[hit.source])，取最高加权分
func mergeHitsAndComputeConfidence(hits []RetrievalHit) (float64, []RetrievalHit) {
	normalized := make([]RetrievalHit, len(hits))
	maxConfidence := 0.0

	for i, hit := range hits {
		hit.Source = normalizeHitSource(hit.Source)
		normalized[i] = hit
		weighted := hit.Score * sourceWeight(hit.Source)
		if weighted > maxConfidence {
			maxConfidence = weighted
		}
	}

	return maxConfidence, normalized
}

// buildDraftContentFromHits 根据检索命中生成草稿内容
func buildDraftContentFromHits(hits []RetrievalHit, query string) string {
	var sb strings.Builder
	sb.WriteString("根据知识库检索，找到以下相关信息：\n\n")

	for i, hit := range hits {
		sourceLabel := ""
		switch hit.Source {
		case "product_faq":
			sourceLabel = "产品FAQ"
		case "product_facts":
			sourceLabel = "产品规格"
		case "customer_doc":
			sourceLabel = "项目文档"
		case "customer_code":
			sourceLabel = "代码实现"
		default:
			sourceLabel = "知识库"
		}

		sb.WriteString(fmt.Sprintf("%d. [%s] %s\n", i+1, sourceLabel, hit.Title))
		sb.WriteString(fmt.Sprintf("   %s\n", hit.Snippet))
		if hit.SourceRef != "" {
			sb.WriteString(fmt.Sprintf("   来源: %s\n", hit.SourceRef))
		}
		sb.WriteString("\n")
	}

	sb.WriteString("以上为自动检索结果，经处理人确认后回复。")
	return sb.String()
}

// CheckOpenHandsHealthHandler 检查 OpenHands Agent 健康状态
// GET /api/v1/projects/{projectId}/openhands-health
func CheckOpenHandsHealthHandler(c *gin.Context) {
	projectID, ok := parseProjectIDParam(c)
	if !ok {
		return
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	agent := getAgentServerByProject(db, projectID)
	if agent == nil {
		c.JSON(200, gin.H{
			"status":  "unavailable",
			"message": "该项目未配置 OpenHands Agent",
		})
		return
	}

	// 健康检查
	healthURL := agent.URL + "/health"
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(healthURL)
	if err != nil {
		c.JSON(200, gin.H{
			"status":  "unavailable",
			"message": "OpenHands Agent 不可达",
			"error":   err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		c.JSON(200, gin.H{
			"status":  "available",
			"message": "OpenHands Agent 正常运行",
		})
	} else {
		c.JSON(200, gin.H{
			"status":  "degraded",
			"message": "OpenHands Agent 状态异常",
			"code":    resp.StatusCode,
		})
	}
}
