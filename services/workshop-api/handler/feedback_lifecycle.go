package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"
	feedbackdomain "todo/domain/feedback"
	"todo/middleware"
	"todo/models"
	"todo/response"
)

type FeedbackLifecycleEvent struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Status    string    `json:"status,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}
type FeedbackDetailResponse struct {
	Feedback    FeedbackResponse                    `json:"feedback"`
	Events      []FeedbackLifecycleEvent            `json:"events"`
	Conclusions []models.FeedbackConclusion         `json:"conclusions"`
	Responses   []models.FeedbackConclusionResponse `json:"responses"`
}

func authorizeFeedbackLifecycle(c *gin.Context, session bool) (*gorm.DB, models.Feedback, bool) {
	var fb models.Feedback
	id, ok := parseFeedbackIDParam(c)
	if !ok {
		return nil, fb, false
	}
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(500, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return nil, fb, false
	}
	if session {
		scoped, _, valid := requireScopedFeedback(c, db, id)
		if !valid {
			return nil, fb, false
		}
		return db, scoped, true
	}
	fb, ok = loadFeedbackByID(c, db, id)
	if !ok {
		return nil, fb, false
	}
	if _, ok = requireFeedbackProjectMember(c, db, fb.ProjectID, "查看反馈生命周期"); !ok {
		return nil, fb, false
	}
	if isAPIKeyRequest(c) {
		if _, ok = requireCustomerFeedbackAccess(c, fb, c.Query("custom_user_id")); !ok {
			return nil, fb, false
		}
	}
	return db, fb, true
}
func GetFeedbackDetail(c *gin.Context)            { getFeedbackDetail(c, false) }
func GetFeedbackDetailFromSession(c *gin.Context) { getFeedbackDetail(c, true) }
func getFeedbackDetail(c *gin.Context, session bool) {
	db, fb, ok := authorizeFeedbackLifecycle(c, session)
	if !ok {
		return
	}
	detail, err := loadFeedbackDetail(db, fb)
	if err != nil {
		lifecycleError(c, err)
		return
	}
	c.JSON(200, response.NewSuccessResponse(detail))
}
func loadFeedbackDetail(db *gorm.DB, fb models.Feedback) (FeedbackDetailResponse, error) {
	detail := FeedbackDetailResponse{Feedback: buildFeedbackResponse(fb), Events: []FeedbackLifecycleEvent{{ID: "submitted", Type: "submitted", Title: "客户提交反馈", Status: "submitted", CreatedAt: fb.CreatedAt}}, Conclusions: []models.FeedbackConclusion{}, Responses: []models.FeedbackConclusionResponse{}}
	if err := db.Where("feedback_id = ?", fb.ID).Order("version DESC").Find(&detail.Conclusions).Error; err != nil {
		return detail, err
	}
	if err := db.Where("feedback_id = ?", fb.ID).Order("created_at ASC, id ASC").Find(&detail.Responses).Error; err != nil {
		return detail, err
	}
	var records []models.FeedbackMessage
	if err := db.Where("feedback_id = ? AND state = ? AND message_type IN ?", fb.ID, models.FeedbackMessageStateSent, []string{models.FeedbackMessageTypeStatusChange, models.FeedbackMessageTypeTaskLink, models.FeedbackMessageTypeSystem}).Order("created_at ASC, id ASC").Find(&records).Error; err != nil {
		return detail, err
	}
	for _, m := range records {
		meta := map[string]interface{}{}
		if m.Metadata != nil {
			_ = json.Unmarshal([]byte(*m.Metadata), &meta)
		}
		kind, _ := meta["type"].(string)
		title := ""
		state := ""
		switch {
		case m.MessageType == models.FeedbackMessageTypeStatusChange:
			title = "卡片处理状态更新"
			for _, key := range []string{"new_status", "status", "feedback_status", "to_status", "triage_status"} {
				if v, ok := meta[key].(string); ok {
					state = v
					break
				}
			}
			switch state {
			case "pending":
				title = "卡片恢复待处理"
			case "accepted", "converted":
				title = "团队已受理，进入处理流程"
			case "in_progress":
				title = "正在开发或修复"
			case "completed":
				title = "实现完成，等待交付或验证"
			case "released":
				title = "已发布交付"
			case "ignored":
				title = "团队暂不处理，保留后续沟通"
			}
		case m.MessageType == models.FeedbackMessageTypeTaskLink:
			title = "团队受理并关联处理任务"
		case kind == "delivery_notification":
			title = "团队发布交付结果"
		default:
			continue
		}
		detail.Events = append(detail.Events, FeedbackLifecycleEvent{ID: fmt.Sprintf("message:%d", m.ID), Type: m.MessageType, Title: title, Status: state, CreatedAt: m.CreatedAt})
	}
	for _, x := range detail.Conclusions {
		detail.Events = append(detail.Events, FeedbackLifecycleEvent{ID: fmt.Sprintf("conclusion:%d", x.ID), Type: "conclusion_published", Title: fmt.Sprintf("团队发布处理结论 · v%d", x.Version), CreatedAt: x.CreatedAt})
	}
	for _, x := range detail.Responses {
		title := "客户确认已解决"
		if x.Response == "needs_review" {
			title = "客户补充问题，请求复核"
		}
		detail.Events = append(detail.Events, FeedbackLifecycleEvent{ID: fmt.Sprintf("response:%d", x.ID), Type: x.Response, Title: title, CreatedAt: x.CreatedAt})
	}
	sort.SliceStable(detail.Events, func(i, j int) bool { return detail.Events[i].CreatedAt.Before(detail.Events[j].CreatedAt) })
	return detail, nil
}
func GetFeedbackConclusions(c *gin.Context)            { getFeedbackConclusions(c, false) }
func GetFeedbackConclusionsFromSession(c *gin.Context) { getFeedbackConclusions(c, true) }
func getFeedbackConclusions(c *gin.Context, session bool) {
	db, fb, ok := authorizeFeedbackLifecycle(c, session)
	if !ok {
		return
	}
	list := []models.FeedbackConclusion{}
	if err := db.Where("feedback_id = ?", fb.ID).Order("version DESC").Find(&list).Error; err != nil {
		lifecycleError(c, err)
		return
	}
	c.JSON(200, response.NewSuccessResponse(list))
}

type PublishFeedbackConclusionRequest struct {
	Kind            string `json:"kind"`
	Title           string `json:"title"`
	Body            string `json:"body"`
	ArtifactURL     string `json:"artifact_url"`
	VersionLabel    string `json:"version_label"`
	ExpectedVersion *int   `json:"expected_version"`
}

func PublishFeedbackConclusion(c *gin.Context) {
	if isAPIKeyRequest(c) {
		c.JSON(403, response.NewErrorResponse(response.CodeForbidden, "仅内部项目成员可发布正式结论", nil))
		return
	}
	db, fb, ok := authorizeFeedbackLifecycle(c, false)
	if !ok {
		return
	}
	user, ok := requireFeedbackTriagePermission(c, db, fb.ProjectID, "发布处理结论")
	if !ok {
		return
	}
	var req PublishFeedbackConclusionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误", nil))
		return
	}
	policy := feedbackdomain.Conclusion{Kind: req.Kind, Title: req.Title, Body: req.Body, ArtifactURL: req.ArtifactURL, VersionLabel: req.VersionLabel}
	if err := policy.Validate(); err != nil {
		c.JSON(400, response.NewErrorResponse(response.CodeBadRequest, err.Error(), nil))
		return
	}
	var created models.FeedbackConclusion
	var message models.FeedbackMessage
	var stale bool
	err := db.Transaction(func(tx *gorm.DB) error {
		var locked models.Feedback
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&locked, fb.ID).Error; err != nil {
			return err
		}
		var version int
		if err := tx.Model(&models.FeedbackConclusion{}).Where("feedback_id = ?", fb.ID).Select("COALESCE(MAX(version),0)").Scan(&version).Error; err != nil {
			return err
		}
		if req.ExpectedVersion != nil && *req.ExpectedVersion != version {
			stale = true
			return errors.New("结论已更新，请刷新后重新发布")
		}
		created = models.FeedbackConclusion{FeedbackID: fb.ID, ProjectID: fb.ProjectID, Version: version + 1, Kind: req.Kind, Title: strings.TrimSpace(req.Title), Body: strings.TrimSpace(req.Body), ArtifactURL: req.ArtifactURL, VersionLabel: req.VersionLabel, PublishedBy: user}
		if err := tx.Create(&created).Error; err != nil {
			return err
		}
		meta, _ := json.Marshal(gin.H{"type": "conclusion_published", "conclusion_id": created.ID, "version": created.Version})
		str := string(meta)
		var err error
		message, err = createFeedbackMessageRecord(tx, fb, models.FeedbackMessageSenderDeveloper, &user, nil, nil, models.FeedbackMessageTypeSystem, "处理结论："+created.Title+"\n"+created.Body, &str, nil)
		if err != nil {
			return err
		}
		return createFeedbackNotificationsForMessage(tx, fb, message)
	})
	if err != nil {
		if stale {
			c.JSON(409, response.NewErrorResponse(response.CodeBadRequest, err.Error(), nil))
			return
		}
		lifecycleError(c, err)
		return
	}
	notifyLifecycleChange(c, db, fb, message)
	c.JSON(201, response.NewSuccessResponse(created))
}

type FeedbackConclusionResponseRequest struct {
	Response        string `json:"response"`
	Content         string `json:"content"`
	ClientMessageID string `json:"client_message_id"`
}

func RespondFeedbackConclusion(c *gin.Context)            { respondFeedbackConclusion(c, false) }
func RespondFeedbackConclusionFromSession(c *gin.Context) { respondFeedbackConclusion(c, true) }
func respondFeedbackConclusion(c *gin.Context, session bool) {
	db, fb, ok := authorizeFeedbackLifecycle(c, session)
	if !ok {
		return
	}
	if !session && !isAPIKeyRequest(c) {
		c.JSON(403, response.NewErrorResponse(response.CodeForbidden, "仅反馈所属客户可提交验收或复核请求", nil))
		return
	}
	custom := ""
	if session {
		scope, _ := middleware.RequireFeedbackSessionScope(c)
		custom = scope.CustomUserID
	} else {
		custom = strings.TrimSpace(c.Query("custom_user_id"))
	}
	id, err := strconv.ParseUint(c.Param("conclusionId"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(400, response.NewErrorResponse(response.CodeBadRequest, "无效结论ID", nil))
		return
	}
	var req FeedbackConclusionResponseRequest
	if c.ShouldBindJSON(&req) != nil || strings.TrimSpace(req.ClientMessageID) == "" || len(req.ClientMessageID) > 128 || len([]rune(req.Content)) > 20000 {
		c.JSON(400, response.NewErrorResponse(response.CodeBadRequest, "请提供有效client_message_id与响应内容", nil))
		return
	}
	var created models.FeedbackConclusionResponse
	var message models.FeedbackMessage
	var conflict, bad bool
	err = db.Transaction(func(tx *gorm.DB) error {
		var locked models.Feedback
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&locked, fb.ID).Error; err != nil {
			return err
		}
		existing := tx.Where("scope_feedback_id = ? AND scope_custom_user_id = ? AND client_message_id = ?", fb.ID, custom, req.ClientMessageID).First(&created).Error
		if existing == nil {
			if created.ConclusionID != uint(id) || created.Response != req.Response || created.Content != strings.TrimSpace(req.Content) {
				conflict = true
				return errors.New("幂等键已用于其他验收请求")
			}
			return nil
		}
		if !errors.Is(existing, gorm.ErrRecordNotFound) {
			return existing
		}
		var current models.FeedbackConclusion
		if err := tx.Where("feedback_id = ?", fb.ID).Order("version DESC").First(&current).Error; err != nil {
			return err
		}
		if current.ID != uint(id) {
			conflict = true
			return errors.New("结论已更新，请阅读最新版本后重新提交")
		}
		if err := feedbackdomain.ValidateResponse(req.Response, current.Version, current.Version, current.Kind); err != nil {
			bad = true
			return err
		}
		created = models.FeedbackConclusionResponse{FeedbackID: fb.ID, ConclusionID: uint(id), CustomUserID: custom, Response: req.Response, Content: strings.TrimSpace(req.Content), ClientMessageID: req.ClientMessageID, ScopeFeedbackID: fb.ID, ScopeCustomUserID: custom}
		if err := tx.Create(&created).Error; err != nil {
			return err
		}
		text := "客户确认已解决"
		if req.Response == "needs_review" {
			text = "客户请求复核"
		}
		if created.Content != "" {
			text += "：" + created.Content
		}
		meta, _ := json.Marshal(gin.H{"type": "conclusion_response", "conclusion_id": uint(id), "response": req.Response})
		str := string(meta)
		var err error
		message, err = createFeedbackMessageRecord(tx, fb, models.FeedbackMessageSenderCustomer, nil, &custom, nil, models.FeedbackMessageTypeText, text, &str, nil)
		if err != nil {
			return err
		}
		return createFeedbackNotificationsForMessage(tx, fb, message)
	})
	if err != nil {
		if conflict {
			c.JSON(409, response.NewErrorResponse(response.CodeBadRequest, err.Error(), nil))
		} else if bad {
			c.JSON(400, response.NewErrorResponse(response.CodeBadRequest, err.Error(), nil))
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(404, response.NewErrorResponse(response.CodeNotFound, "结论不存在", nil))
		} else {
			lifecycleError(c, err)
		}
		return
	}
	if message.ID > 0 {
		notifyLifecycleChange(c, db, fb, message)
	}
	c.JSON(200, response.NewSuccessResponse(created))
}
func lifecycleError(c *gin.Context, err error) {
	_ = c.Error(err)
	c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeFeedbackQueryFailed, "反馈生命周期处理失败", nil))
}
func notifyLifecycleChange(c *gin.Context, db *gorm.DB, fb models.Feedback, m models.FeedbackMessage) {
	notifyProjectEvent(c, db, fb.ProjectID, 0, "feedback.message.created", gin.H{"feedback_id": fb.ID, "message_id": m.ID})
}
