package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"
	"unicode"

	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// EscalateFeedbackRequest 客户/开发者触发反馈升级人工流转
type EscalateFeedbackRequest struct {
	// apikey 通道必填：客户身份归属校验
	CustomUserID string `json:"custom_user_id,omitempty"`
	// 可选：升级原因（默认取最近一次低置信 Agent 回复说明）
	Reason *string `json:"reason,omitempty"`
}

// EscalateFeedbackResponse 升级结果
type EscalateFeedbackResponse struct {
	FeedbackID         uint         `json:"feedback_id"`
	Triage             TriageResult `json:"triage"`
	TaskID             *uint        `json:"task_id,omitempty"`
	AlreadyEscalated   bool         `json:"already_escalated"`
	Message            string       `json:"message"`
	CreatedFeedbackIDs []uint       `json:"created_feedback_ids,omitempty"`
	ProblemCount       int          `json:"problem_count"`
}

// escalationProblem 智能客服无法解决的单个问题（确定性抽取，不依赖 LLM）。
type escalationProblem struct {
	Title              string
	Content            string
	CustomerMessages   []string
	AgentMessages      []string
	EvidenceMessageIDs []uint
	Fingerprint        string
	Triage             TriageResult
}

// EscalateFeedbackHandler 一键升级反馈进入内部流转（分诊→待办→回写）。
//
// 客户在 SDK 中点击"转人工"（或 Agent 低置信自动提示升级）时调用：
//  1. 仅记录智能客服无法解决的问题：低置信/兜底句轮次；多问题拆多条新反馈+各自待办；
//  2. 标题按问题归纳生成（类型前缀+核心意图），不直接用客户消息原文；
//  3. 会话容器（agent_session）保持隐藏，不改写为整段对话标题。
//
// 非会话容器的普通反馈走原单条升级路径。
// 幂等：问题指纹已存在或普通反馈已有主待办时不再重复创建。
func EscalateFeedbackHandler(c *gin.Context) {
	feedbackID, ok := parseFeedbackIDParam(c)
	if !ok {
		return
	}

	var req EscalateFeedbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		req = EscalateFeedbackRequest{}
	}

	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}

	feedback, ok := loadFeedbackByID(c, db, feedbackID)
	if !ok {
		return
	}

	var actorUserID uint
	var customerCustomID *string
	if isAPIKeyRequest(c) {
		customID, ok := requireCustomerFeedbackAccess(c, feedback, req.CustomUserID)
		if !ok {
			return
		}
		customerCustomID = customID
		ownerID, ok := resolveProjectOwnerID(c, db, feedback.ProjectID)
		if !ok {
			return
		}
		actorUserID = ownerID
	} else {
		userID, ok := requireFeedbackTriagePermission(c, db, feedback.ProjectID, "升级反馈")
		if !ok {
			return
		}
		actorUserID = userID
	}

	if feedbackTriageStatus(feedback) == models.FeedbackTriageIgnored {
		c.JSON(http.StatusConflict, response.NewErrorResponse(response.CodeBadRequest, "反馈已标记为暂不处理，不能升级流转", nil))
		return
	}

	payload := parseFeedbackPayload(feedback.Data)
	if payloadBool(payload, "agent_session") {
		escalateAgentSessionFeedback(c, db, feedback, req, actorUserID, customerCustomID)
		return
	}
	escalateSingleFeedback(c, db, feedback, req, actorUserID, customerCustomID)
}

func escalateAgentSessionFeedback(c *gin.Context, db *gorm.DB, feedback models.Feedback, req EscalateFeedbackRequest, actorUserID uint, customerCustomID *string) {
	var messages []AgentMessageRecord
	if err := db.Where("feedback_id = ?", feedback.ID).
		Order("created_at ASC, id ASC").
		Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询会话消息失败: "+err.Error(), nil))
		return
	}

	problems := extractUnresolvedProblems(messages, req.Reason, feedback.Title, feedback.Content)
	containerData := parseFeedbackPayload(feedback.Data)
	existingFps := stringSliceFromPayload(containerData, "escalated_problem_fingerprints")
	already := len(existingFps) > 0

	createdIDs := make([]uint, 0, len(problems))
	var firstTriage TriageResult
	var firstTaskID *uint

	err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&feedback, feedback.ID).Error; err != nil {
			return err
		}
		if feedbackTriageStatus(feedback) == models.FeedbackTriageIgnored {
			return errFeedbackIgnored
		}
		containerData = parseFeedbackPayload(feedback.Data)
		existingFps = stringSliceFromPayload(containerData, "escalated_problem_fingerprints")
		existingSet := make(map[string]struct{}, len(existingFps))
		for _, fp := range existingFps {
			existingSet[fp] = struct{}{}
		}

		newFps := append([]string{}, existingFps...)
		createdAny := false
		for _, problem := range problems {
			if _, ok := existingSet[problem.Fingerprint]; ok {
				already = true
				continue
			}

			shortID, err := ensureFeedbackShortID(tx, "")
			if err != nil {
				return err
			}

			problemData := map[string]interface{}{
				"feedback_state":                models.FeedbackTriagePending,
				"status":                        sdkStatusFromFeedbackStatus(models.FeedbackTriagePending),
				"source":                        "agent_chat",
				"escalated":                     true,
				"escalated_at":                  time.Now().Format(time.RFC3339),
				"from_conversation_feedback_id": feedback.ID,
				"evidence_message_ids":          problem.EvidenceMessageIDs,
				"problem_fingerprint":           problem.Fingerprint,
				"triage":                        problem.Triage,
			}
			rawData, err := json.Marshal(problemData)
			if err != nil {
				return err
			}
			text := string(rawData)

			problemFeedback := models.Feedback{
				ProjectID:    feedback.ProjectID,
				ShortID:      shortID,
				Title:        problem.Title,
				Content:      problem.Content,
				Status:       models.FeedbackTriagePending,
				TriageStatus: models.FeedbackTriagePending,
				CustomUserID: feedback.CustomUserID,
				UserPhone:    feedback.UserPhone,
				UserEmail:    feedback.UserEmail,
				Data:         &text,
			}
			if err := tx.Create(&problemFeedback).Error; err != nil {
				if isUniqueViolation(err, "uniq_feedback_short_id") {
					return errFeedbackShortIDExists
				}
				return err
			}

			task := models.Task{
				ProjectID:        feedback.ProjectID,
				Content:          buildEscalatedTaskContent(problemFeedback, req.Reason),
				State:            models.TaskStatePendingReview,
				CreatorID:        actorUserID,
				SourceFeedbackID: &problemFeedback.ID,
			}
			if err := tx.Create(&task).Error; err != nil {
				return err
			}
			createdBy := actorUserID
			link := models.FeedbackTaskLink{
				FeedbackID:   problemFeedback.ID,
				ProjectID:    feedback.ProjectID,
				TaskID:       task.ID,
				RelationType: models.FeedbackTaskRelationConvertedTo,
				IsPrimary:    true,
				CreatedBy:    &createdBy,
			}
			if err := tx.Create(&link).Error; err != nil {
				return err
			}
			if err := tx.Model(&problemFeedback).Update("triage_status", models.FeedbackTriageAccepted).Error; err != nil {
				return err
			}
			problemFeedback.TriageStatus = models.FeedbackTriageAccepted
			nextStatus := mapTaskStateToFeedbackStatus(task.State)
			if err := updateFeedbackStatusFields(tx, &problemFeedback, nextStatus, map[string]interface{}{
				"converted_task_id": task.ID,
				"converted_at":      time.Now().Format(time.RFC3339),
				"task_state":        task.State,
				"escalated":         true,
				"escalated_at":      time.Now().Format(time.RFC3339),
			}); err != nil {
				return err
			}

			metadataBytes, _ := json.Marshal(map[string]interface{}{
				"task_id":                      task.ID,
				"feedback_id":                  problemFeedback.ID,
				"escalated":                    true,
				"from_conversation_feedback_id": feedback.ID,
				"triage_type":                  problem.Triage.Type,
				"triage_priority":              problem.Triage.Priority,
			})
			metadata := string(metadataBytes)
			sysMessage, err := createFeedbackMessageRecord(
				tx,
				problemFeedback,
				models.FeedbackMessageSenderSystem,
				&actorUserID,
				customerCustomID,
				nil,
				models.FeedbackMessageTypeTaskLink,
				fmt.Sprintf("%s未能解决该问题，已升级人工处理（待办 #%d），我们会尽快跟进。", arcOrbitAgentName, task.ID),
				&metadata,
				nil,
			)
			if err != nil {
				return err
			}
			if err := createFeedbackNotificationsForMessage(tx, problemFeedback, sysMessage); err != nil {
				return err
			}

			createdIDs = append(createdIDs, problemFeedback.ID)
			newFps = append(newFps, problem.Fingerprint)
			createdAny = true
			already = false
			if firstTriage.Type == "" {
				firstTriage = problem.Triage
				taskID := task.ID
				firstTaskID = &taskID
			}
		}

		// 容器只记录已拆出的问题指纹，不写 escalated（保持列表隐藏）
		merged := uniqueStrings(newFps)
		containerExtra := map[string]interface{}{
			"escalated_problem_fingerprints": merged,
		}
		if createdAny {
			containerExtra["escalated_at"] = time.Now().Format(time.RFC3339)
		}
		data := mergeFeedbackData(feedback.Data, feedbackTriageStatus(feedback), containerExtra)
		if err := tx.Model(&feedback).Update("data", data).Error; err != nil {
			return err
		}
		feedback.Data = data

		// 无未解决轮次但有显式原因时已抽出兜底问题；两者皆无则容器空升级
		if len(problems) == 0 && len(merged) > 0 {
			already = true
		}
		return nil
	})
	if err != nil {
		if errors.Is(err, errFeedbackIgnored) {
			c.JSON(http.StatusConflict, response.NewErrorResponse(response.CodeBadRequest, "反馈已标记为暂不处理，不能升级流转", nil))
			return
		}
		if errors.Is(err, errFeedbackShortIDExists) {
			c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "短ID已存在", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackCreateFailed, "升级反馈失败: "+err.Error(), nil))
		return
	}

	if firstTriage.Type == "" {
		firstTriage = analyzeFeedback(feedback.Title, feedback.Content)
	}

	if len(createdIDs) > 0 {
		notifyProjectEvent(c, db, feedback.ProjectID, actorUserID, "feedback.escalated", map[string]interface{}{
			"feedback_id":          feedback.ID,
			"created_feedback_ids": createdIDs,
			"problem_count":        len(createdIDs),
			"task_id":              firstTaskID,
			"triage":               firstTriage,
		})
	}

	messageText := fmt.Sprintf("已拆分 %d 个未解决问题并升级人工处理", len(createdIDs))
	if len(createdIDs) == 0 {
		messageText = "该会话未解决问题已升级处理中"
	}

	c.JSON(http.StatusOK, response.NewSuccessResponse(EscalateFeedbackResponse{
		FeedbackID:         feedback.ID,
		Triage:             firstTriage,
		TaskID:             firstTaskID,
		AlreadyEscalated:   len(createdIDs) == 0 && already,
		Message:            messageText,
		CreatedFeedbackIDs: createdIDs,
		ProblemCount:       len(createdIDs),
	}))
}

func escalateSingleFeedback(c *gin.Context, db *gorm.DB, feedback models.Feedback, req EscalateFeedbackRequest, actorUserID uint, customerCustomID *string) {
	var messages []AgentMessageRecord
	if err := db.Where("feedback_id = ?", feedback.ID).
		Order("created_at ASC, id ASC").
		Find(&messages).Error; err != nil {
		messages = nil
	}
	problems := extractUnresolvedProblems(messages, req.Reason, feedback.Title, feedback.Content)
	summaryTitle := feedback.Title
	summaryContent := feedback.Content
	var triage TriageResult
	if len(problems) > 0 {
		summaryTitle = problems[0].Title
		summaryContent = problems[0].Content
		triage = problems[0].Triage
	} else {
		triage = analyzeFeedback(summaryTitle, summaryContent)
	}

	var taskID *uint
	var alreadyEscalated bool
	var sysMessage models.FeedbackMessage
	err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&feedback, feedback.ID).Error; err != nil {
			return err
		}
		if feedbackTriageStatus(feedback) == models.FeedbackTriageIgnored {
			return errFeedbackIgnored
		}

		var existing models.FeedbackTaskLink
		if err := tx.Where("feedback_id = ? AND is_primary = ?", feedback.ID, true).First(&existing).Error; err == nil {
			alreadyEscalated = true
			taskID = &existing.TaskID
			return nil
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}

		data := parseFeedbackPayload(feedback.Data)
		data["triage"] = triage
		raw, err := json.Marshal(data)
		if err != nil {
			return err
		}
		text := string(raw)
		if err := tx.Model(&feedback).Updates(map[string]interface{}{
			"data":    &text,
			"title":   summaryTitle,
			"content": summaryContent,
		}).Error; err != nil {
			return err
		}
		feedback.Data = &text
		feedback.Title = summaryTitle
		feedback.Content = summaryContent

		task := models.Task{
			ProjectID:        feedback.ProjectID,
			Content:          buildEscalatedTaskContent(feedback, req.Reason),
			State:            models.TaskStatePendingReview,
			CreatorID:        actorUserID,
			SourceFeedbackID: &feedback.ID,
		}
		if err := tx.Create(&task).Error; err != nil {
			return err
		}

		createdBy := actorUserID
		link := models.FeedbackTaskLink{
			FeedbackID:   feedback.ID,
			ProjectID:    feedback.ProjectID,
			TaskID:       task.ID,
			RelationType: models.FeedbackTaskRelationConvertedTo,
			IsPrimary:    true,
			CreatedBy:    &createdBy,
		}
		if err := tx.Create(&link).Error; err != nil {
			return err
		}
		if err := tx.Model(&feedback).Update("triage_status", models.FeedbackTriageAccepted).Error; err != nil {
			return err
		}
		feedback.TriageStatus = models.FeedbackTriageAccepted

		nextStatus := mapTaskStateToFeedbackStatus(task.State)
		if err := updateFeedbackStatusFields(tx, &feedback, nextStatus, map[string]interface{}{
			"converted_task_id": task.ID,
			"converted_at":      time.Now().Format(time.RFC3339),
			"task_state":        task.State,
			"escalated":         true,
			"escalated_at":      time.Now().Format(time.RFC3339),
		}); err != nil {
			return err
		}

		metadataBytes, _ := json.Marshal(map[string]interface{}{
			"task_id":         task.ID,
			"feedback_id":     feedback.ID,
			"escalated":       true,
			"triage_type":     triage.Type,
			"triage_priority": triage.Priority,
		})
		metadata := string(metadataBytes)
		sysMessage, err = createFeedbackMessageRecord(
			tx,
			feedback,
			models.FeedbackMessageSenderSystem,
			&actorUserID,
			customerCustomID,
			nil,
			models.FeedbackMessageTypeTaskLink,
			fmt.Sprintf("%s未能解决该问题，已升级人工处理（待办 #%d），我们会尽快跟进。", arcOrbitAgentName, task.ID),
			&metadata,
			nil,
		)
		if err != nil {
			return err
		}
		taskID = &task.ID
		return createFeedbackNotificationsForMessage(tx, feedback, sysMessage)
	})
	if err != nil {
		if errors.Is(err, errFeedbackIgnored) {
			c.JSON(http.StatusConflict, response.NewErrorResponse(response.CodeBadRequest, "反馈已标记为暂不处理，不能升级流转", nil))
			return
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackCreateFailed, "升级反馈失败: "+err.Error(), nil))
		return
	}

	if !alreadyEscalated {
		notifyProjectEvent(c, db, feedback.ProjectID, actorUserID, "feedback.escalated", map[string]interface{}{
			"feedback_id": feedback.ID,
			"task_id":     taskID,
			"triage":      triage,
		})
		if sysMessage.ID != 0 {
			notifyProjectEvent(c, db, feedback.ProjectID, actorUserID, "feedback.message.created", buildFeedbackMessageResponse(sysMessage))
		}
	}

	messageText := "已升级人工处理"
	if alreadyEscalated {
		messageText = fmt.Sprintf("该反馈已在处理中（待办 #%d）", *taskID)
	}

	createdIDs := []uint{}
	if !alreadyEscalated && taskID != nil {
		createdIDs = []uint{feedback.ID}
	}

	c.JSON(http.StatusOK, response.NewSuccessResponse(EscalateFeedbackResponse{
		FeedbackID:         feedback.ID,
		Triage:             triage,
		TaskID:             taskID,
		AlreadyEscalated:   alreadyEscalated,
		Message:            messageText,
		CreatedFeedbackIDs: createdIDs,
		ProblemCount:       len(createdIDs),
	}))
}

// buildEscalatedTaskContent 升级待办正文：保留反馈原文 + 升级原因
func buildEscalatedTaskContent(feedback models.Feedback, reason *string) string {
	content := buildFeedbackTaskContent(feedback)
	if reason != nil && len([]rune(*reason)) > 0 {
		content += fmt.Sprintf("\n\n升级原因：%s", *reason)
	}
	return content
}

// extractUnresolvedProblems 从会话消息中抽取智能客服无法解决的问题列表。
// 仅未解决轮次成条；显式升级原因在无未解决轮次时兜底为单条问题。
func extractUnresolvedProblems(messages []AgentMessageRecord, reason *string, fallbackTitle, fallbackContent string) []escalationProblem {
	type pendingTurn struct {
		customer AgentMessageRecord
		agent    *AgentMessageRecord
	}

	var turns []pendingTurn
	var openCustomer *AgentMessageRecord
	for i := range messages {
		msg := messages[i]
		switch msg.SenderType {
		case "customer":
			if openCustomer != nil {
				turns = append(turns, pendingTurn{customer: *openCustomer})
			}
			c := msg
			openCustomer = &c
		case "agent":
			if openCustomer != nil {
				a := msg
				turns = append(turns, pendingTurn{customer: *openCustomer, agent: &a})
				openCustomer = nil
			} else if len(turns) > 0 && turns[len(turns)-1].agent == nil {
				a := msg
				turns[len(turns)-1].agent = &a
			}
		}
	}
	if openCustomer != nil {
		turns = append(turns, pendingTurn{customer: *openCustomer})
	}

	var problems []escalationProblem
	var current *escalationProblem

	flush := func() {
		if current == nil {
			return
		}
		current.Finish(reason)
		problems = append(problems, *current)
		current = nil
	}

	for _, turn := range turns {
		if turn.agent == nil || !isUnresolvedAgentMessage(*turn.agent) {
			flush()
			continue
		}
		if current == nil {
			current = newEscalationProblem(turn.customer, *turn.agent)
			continue
		}
		if shareProblemTopic(current.CustomerMessages, turn.customer.Content) {
			current.Merge(turn.customer, *turn.agent)
			continue
		}
		flush()
		current = newEscalationProblem(turn.customer, *turn.agent)
	}
	flush()

	reasonText := ""
	if reason != nil {
		reasonText = strings.TrimSpace(*reason)
	}
	if len(problems) == 0 {
		if reasonText == "" {
			return nil
		}
		triage := analyzeFeedback(fallbackTitle, fallbackContent+"\n"+reasonText)
		title := buildEscalationProblemTitle([]string{fallbackContent}, []string{}, triage)
		content := buildEscalationProblemContent([]string{fallbackContent}, []string{}, &reasonText)
		return []escalationProblem{{
			Title:       title,
			Content:     content,
			Triage:      triage,
			Fingerprint: fingerprintProblem(title, content),
		}}
	}
	if reasonText != "" {
		for i := range problems {
			if strings.Contains(problems[i].Content, "升级原因："+reasonText) {
				continue
			}
			problems[i].Content = strings.TrimSpace(problems[i].Content + "\n升级原因：" + reasonText)
			problems[i].Fingerprint = fingerprintProblem(problems[i].Title, joinUints(problems[i].EvidenceMessageIDs), reasonText)
		}
	}
	return problems
}

func isUnresolvedAgentMessage(msg AgentMessageRecord) bool {
	if metaUnresolved(msg.Metadata) {
		return true
	}
	confidence := defaultAgentConfidence
	if msg.Confidence != nil {
		confidence = *msg.Confidence
	}
	return shouldMarkAgentMessageUnresolved(confidence, msg.Content)
}

func metaUnresolved(metadata *string) bool {
	if metadata == nil || strings.TrimSpace(*metadata) == "" {
		return false
	}
	var meta map[string]interface{}
	if json.Unmarshal([]byte(*metadata), &meta) != nil {
		return false
	}
	unresolved, _ := meta["unresolved"].(bool)
	return unresolved
}

func newEscalationProblem(customer, agent AgentMessageRecord) *escalationProblem {
	p := &escalationProblem{}
	p.Merge(customer, agent)
	return p
}

func (p *escalationProblem) Merge(customer, agent AgentMessageRecord) {
	if c := strings.TrimSpace(customer.Content); c != "" {
		p.CustomerMessages = append(p.CustomerMessages, c)
	}
	if a := strings.TrimSpace(agent.Content); a != "" {
		p.AgentMessages = append(p.AgentMessages, a)
	}
	p.EvidenceMessageIDs = append(p.EvidenceMessageIDs, customer.ID, agent.ID)
}

func (p *escalationProblem) Finish(reason *string) {
	triageInput := strings.Join(p.CustomerMessages, "\n")
	p.Triage = analyzeFeedback("", triageInput)
	p.Title = buildEscalationProblemTitle(p.CustomerMessages, p.AgentMessages, p.Triage)
	p.Content = buildEscalationProblemContent(p.CustomerMessages, p.AgentMessages, reason)
	p.Fingerprint = fingerprintProblem(p.Title, joinUints(p.EvidenceMessageIDs))
}

// shareProblemTopic 确定性主题相似：共享 2 字以上连续中文片段。
func shareProblemTopic(existing []string, candidate string) bool {
	base := strings.Join(existing, "\n")
	baseRunes := []rune(normalizeProblemPhrase(base))
	candRunes := []rune(normalizeProblemPhrase(candidate))
	if len(baseRunes) < 2 || len(candRunes) < 2 {
		return false
	}
	for n := 6; n >= 2; n-- {
		if n > len(baseRunes) || n > len(candRunes) {
			continue
		}
		seen := make(map[string]struct{})
		for i := 0; i+n <= len(baseRunes); i++ {
			seg := string(baseRunes[i : i+n])
			if hasCJK(seg) {
				seen[seg] = struct{}{}
			}
		}
		for i := 0; i+n <= len(candRunes); i++ {
			seg := string(candRunes[i : i+n])
			if _, ok := seen[seg]; ok {
				return true
			}
		}
	}
	return false
}

// buildEscalationProblemTitle 按问题归纳生成标题：类型前缀 + 核心意图，禁止客户消息原文直出。
func buildEscalationProblemTitle(customerMsgs, agentMsgs []string, triage TriageResult) string {
	core := extractProblemCorePhrase(customerMsgs, agentMsgs)
	if core == "" {
		core = "待人工确认问题"
	}
	label := triageTypeLabel(triage.Type, core)
	title := label + "：" + core
	return truncateRunes(title, 24)
}

func buildEscalationProblemContent(customerMsgs, agentMsgs []string, reason *string) string {
	var builder strings.Builder
	customers := nonEmptyTrimmed(customerMsgs)
	agents := nonEmptyTrimmed(agentMsgs)

	if len(customers) == 0 {
		builder.WriteString("客户问题待确认。")
	} else {
		builder.WriteString("问题描述：\n")
		for i, q := range customers {
			fmt.Fprintf(&builder, "%d. %s\n", i+1, truncateRunes(q, 200))
		}
	}
	if len(agents) > 0 {
		builder.WriteString("\n智能客服回复要点：\n")
		for i, a := range agents {
			fmt.Fprintf(&builder, "%d. %s\n", i+1, truncateRunes(a, 200))
		}
		builder.WriteString("\n未解决依据：智能客服未能给出可靠结论。")
	}
	if reason != nil && strings.TrimSpace(*reason) != "" {
		builder.WriteString("\n升级原因：" + strings.TrimSpace(*reason))
	}
	return strings.TrimSpace(builder.String())
}

func extractProblemCorePhrase(customerMsgs, agentMsgs []string) string {
	for _, msg := range customerMsgs {
		cleaned := cleanProblemPhrase(msg)
		if cleaned != "" {
			return cleaned
		}
	}
	for _, msg := range agentMsgs {
		cleaned := cleanProblemPhrase(msg)
		if cleaned != "" {
			return cleaned
		}
	}
	return ""
}

var problemGreetingRe = regexp.MustCompile(`^(在吗|在不在|你好|您好|hello|hi|哈喽|喂|hihi)[!！。?？~\s]*$`)

var problemFillerWords = []string{
	"你就是有点", "反正就是", "反正", "就是有点", "有点", "就是",
	"希望", "能不能", "麻烦", "请问", "我想", "我要", "我觉得",
	"不好意思", "打扰一下", "那个", "这个",
}

func cleanProblemPhrase(raw string) string {
	text := strings.TrimSpace(raw)
	if text == "" {
		return ""
	}
	if problemGreetingRe.MatchString(text) {
		return ""
	}
	for _, filler := range problemFillerWords {
		text = strings.ReplaceAll(text, filler, "")
	}
	text = strings.TrimSpace(text)
	text = strings.Trim(text, "，,。.！!？?；;")
	text = strings.TrimSpace(text)
	if text == "" || problemGreetingRe.MatchString(text) {
		return ""
	}
	for _, sep := range []string{"。", "！", "？", "\n"} {
		if idx := strings.Index(text, sep); idx > 0 {
			text = text[:idx]
		}
	}
	return strings.TrimSpace(text)
}

func triageTypeLabel(issueType, core string) string {
	if issueType == "bug" {
		return "故障"
	}
	// 延迟/卡顿类体验问题优先于 feature/question 前缀（"体验"本身是 feature 关键词，不能反过来吃掉体验标签）
	lower := strings.ToLower(core)
	if strings.Contains(lower, "慢") || strings.Contains(core, "延迟") || strings.Contains(core, "等待") ||
		strings.Contains(core, "卡顿") || strings.Contains(core, "超时") {
		return "体验"
	}
	switch issueType {
	case "feature":
		return "需求"
	case "question":
		return "咨询"
	}
	return "问题"
}

func fingerprintProblem(parts ...string) string {
	h := sha256.New()
	for _, part := range parts {
		h.Write([]byte(part))
		h.Write([]byte{0})
	}
	return hex.EncodeToString(h.Sum(nil))
}

func uniqueStrings(values []string) []string {
	seen := make(map[string]struct{}, len(values))
	out := make([]string, 0, len(values))
	for _, v := range values {
		if v == "" {
			continue
		}
		if _, ok := seen[v]; ok {
			continue
		}
		seen[v] = struct{}{}
		out = append(out, v)
	}
	return out
}

func stringSliceFromPayload(payload map[string]interface{}, key string) []string {
	raw, ok := payload[key]
	if !ok || raw == nil {
		return nil
	}
	switch v := raw.(type) {
	case []string:
		return v
	case []interface{}:
		out := make([]string, 0, len(v))
		for _, item := range v {
			if s, ok := item.(string); ok {
				out = append(out, s)
			}
		}
		return out
	}
	return nil
}

func payloadBool(payload map[string]interface{}, key string) bool {
	value, _ := payload[key].(bool)
	return value
}

func nonEmptyTrimmed(values []string) []string {
	out := make([]string, 0, len(values))
	for _, v := range values {
		if trimmed := strings.TrimSpace(v); trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}

func hasCJK(s string) bool {
	for _, r := range s {
		if unicode.Is(unicode.Han, r) {
			return true
		}
	}
	return false
}

func normalizeProblemPhrase(s string) string {
	var b strings.Builder
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.Is(unicode.Han, r) || unicode.IsDigit(r) {
			b.WriteRune(unicode.ToLower(r))
		}
	}
	return b.String()
}

func joinUints(values []uint) string {
	parts := make([]string, 0, len(values))
	for _, v := range values {
		parts = append(parts, fmt.Sprintf("%d", v))
	}
	return strings.Join(parts, ",")
}

// resolveProjectOwnerID 查项目 owner（客户升级时以 owner 身份创建内部待办）
func resolveProjectOwnerID(c *gin.Context, db *gorm.DB, projectID uint) (uint, bool) {
	var member models.ProjectMember
	if err := db.Where("project_id = ? AND role = ?", projectID, models.ProjectRoleOwner).First(&member).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeInternalError, "项目没有所有者，无法升级流转", nil))
			return 0, false
		}
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "查询项目所有者失败: "+err.Error(), nil))
		return 0, false
	}
	return member.UserID, true
}
