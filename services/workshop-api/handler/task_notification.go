package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"todo/middleware"
	"todo/models"
	"todo/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	taskNotificationTemplate     = "workshop.task_event"
	taskNotificationSecretHeader = "X-Nebula-Internal-Secret"
)

var taskNotificationTimeZone = time.FixedZone("Asia/Shanghai", 8*60*60)

type taskNotificationPreferenceRequest struct {
	EmailEnabled          bool `json:"email_enabled"`
	NotifyAssignedToMe    bool `json:"notify_assigned_to_me"`
	NotifyAssigneeChanged bool `json:"notify_assignee_changed"`
	NotifyTaskCreated     bool `json:"notify_task_created"`
	NotifyStatusChanged   bool `json:"notify_status_changed"`
	NotifyPriorityChanged bool `json:"notify_priority_changed"`
	NotifyContentChanged  bool `json:"notify_content_changed"`
	NotifyTagsChanged     bool `json:"notify_tags_changed"`
}

type taskNotificationPreferenceResponse struct {
	ProjectID             uint `json:"project_id"`
	EmailEnabled          bool `json:"email_enabled"`
	NotifyAssignedToMe    bool `json:"notify_assigned_to_me"`
	NotifyAssigneeChanged bool `json:"notify_assignee_changed"`
	NotifyTaskCreated     bool `json:"notify_task_created"`
	NotifyStatusChanged   bool `json:"notify_status_changed"`
	NotifyPriorityChanged bool `json:"notify_priority_changed"`
	NotifyContentChanged  bool `json:"notify_content_changed"`
	NotifyTagsChanged     bool `json:"notify_tags_changed"`
	DeliveryAvailable     bool `json:"delivery_available"`
}

func taskNotificationPreferencePayload(preference models.TaskNotificationPreference) taskNotificationPreferenceResponse {
	return taskNotificationPreferenceResponse{
		ProjectID:             preference.ProjectID,
		EmailEnabled:          preference.EmailEnabled,
		NotifyAssignedToMe:    preference.NotifyAssignedToMe,
		NotifyAssigneeChanged: preference.NotifyAssigneeChanged,
		NotifyTaskCreated:     preference.NotifyTaskCreated,
		NotifyStatusChanged:   preference.NotifyStatusChanged,
		NotifyPriorityChanged: preference.NotifyPriorityChanged,
		NotifyContentChanged:  preference.NotifyContentChanged,
		NotifyTagsChanged:     preference.NotifyTagsChanged,
		DeliveryAvailable:     taskNotificationDeliveryAvailable(),
	}
}

func taskNotificationProjectID(c *gin.Context) (uint, bool) {
	value := strings.TrimSpace(c.Query("project_id"))
	parsed, err := strconv.ParseUint(value, 10, 64)
	if err != nil || parsed == 0 {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "project_id 格式无效", nil))
		return 0, false
	}
	return uint(parsed), true
}

func requireTaskNotificationProjectMember(c *gin.Context, db *gorm.DB, projectID, userID uint) bool {
	var count int64
	if err := db.Model(&models.ProjectMember{}).
		Where("project_id = ? AND user_id = ?", projectID, userID).
		Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "验证项目成员身份失败", nil))
		return false
	}
	if count == 0 {
		c.JSON(http.StatusForbidden, response.NewErrorResponse(response.CodeTaskNotMember, "您不是该项目的成员", nil))
		return false
	}
	return true
}

// GetTaskNotificationPreference returns persisted choices or the documented
// defaults when this member has never saved a preference for the project.
func GetTaskNotificationPreference(c *gin.Context) {
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}
	projectID, ok := taskNotificationProjectID(c)
	if !ok || !requireTaskNotificationProjectMember(c, db, projectID, userID) {
		return
	}

	preference := models.DefaultTaskNotificationPreference(projectID, userID)
	if err := db.Where("project_id = ? AND user_id = ?", projectID, userID).First(&preference).Error; err != nil && err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "查询待办通知设置失败", nil))
		return
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(taskNotificationPreferencePayload(preference)))
}

// UpdateTaskNotificationPreference replaces all event switches atomically.
func UpdateTaskNotificationPreference(c *gin.Context) {
	db := middleware.GetDB(c)
	if db == nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeDatabaseNotInit, "数据库连接未初始化", nil))
		return
	}
	userID, ok := middleware.RequireUserID(c)
	if !ok {
		return
	}
	projectID, ok := taskNotificationProjectID(c)
	if !ok || !requireTaskNotificationProjectMember(c, db, projectID, userID) {
		return
	}
	var request taskNotificationPreferenceRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, "请求参数错误", nil))
		return
	}

	now := time.Now()
	values := map[string]interface{}{
		"project_id":              projectID,
		"user_id":                 userID,
		"email_enabled":           request.EmailEnabled,
		"notify_assigned_to_me":   request.NotifyAssignedToMe,
		"notify_assignee_changed": request.NotifyAssigneeChanged,
		"notify_task_created":     request.NotifyTaskCreated,
		"notify_status_changed":   request.NotifyStatusChanged,
		"notify_priority_changed": request.NotifyPriorityChanged,
		"notify_content_changed":  request.NotifyContentChanged,
		"notify_tags_changed":     request.NotifyTagsChanged,
		"created_at":              now,
		"updated_at":              now,
	}
	columns := []string{
		"email_enabled", "notify_assigned_to_me", "notify_assignee_changed",
		"notify_task_created", "notify_status_changed", "notify_priority_changed",
		"notify_content_changed", "notify_tags_changed", "updated_at",
	}
	if err := db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "project_id"}, {Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns(columns),
	}).Table("task_notification_preferences").Create(values).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskUpdateFailed, "保存待办通知设置失败", nil))
		return
	}
	preference := models.DefaultTaskNotificationPreference(projectID, userID)
	if err := db.Where("project_id = ? AND user_id = ?", projectID, userID).First(&preference).Error; err != nil {
		c.JSON(http.StatusInternalServerError, response.NewErrorResponse(response.CodeTaskQueryFailed, "读取待办通知设置失败", nil))
		return
	}
	c.JSON(http.StatusOK, response.NewSuccessResponse(taskNotificationPreferencePayload(preference)))
}

type taskNotificationMutation struct {
	Task         models.Task
	PreviousTask *models.Task
	Created      bool
	ActorUserID  uint
}

type taskNotificationRecipient struct {
	models.TaskNotificationPreference `gorm:"embedded"`
	UserUUID                          string `gorm:"column:user_uuid"`
}

type taskNotificationEmailRequest struct {
	RecipientUserID string                    `json:"recipient_user_id"`
	Template        string                    `json:"template"`
	IdempotencyKey  string                    `json:"idempotency_key"`
	Data            taskNotificationEmailData `json:"data"`
}

type taskNotificationEmailData struct {
	EventType     string `json:"event_type"`
	ProjectName   string `json:"project_name"`
	TaskID        string `json:"task_id"`
	TaskContent   string `json:"task_content"`
	ActorName     string `json:"actor_name"`
	ChangeSummary string `json:"change_summary"`
	TaskURL       string `json:"task_url"`
	OccurredAt    string `json:"occurred_at"`
}

func queueTaskNotificationDelivery(db *gorm.DB, mutation taskNotificationMutation) {
	if db == nil || !taskNotificationDeliveryAvailable() {
		return
	}
	go func() {
		if err := deliverTaskNotifications(context.Background(), db, mutation); err != nil {
			log.Printf("deliver task notification for task %d: %v", mutation.Task.ID, err)
		}
	}()
}

func taskNotificationDeliveryAvailable() bool {
	enabled, _ := strconv.ParseBool(taskNotificationConfig("TASK_NOTIFICATION_EMAILS_ENABLED", "FEEDBACK_EMAIL_NOTIFICATIONS_ENABLED"))
	endpoint := taskNotificationConfig("TASK_NOTIFICATION_EMAIL_ENDPOINT", "FEEDBACK_NOTIFICATION_EMAIL_URL")
	secret := taskNotificationConfig("NOTIFICATION_INTERNAL_SHARED_SECRET", "FEEDBACK_NOTIFICATION_SHARED_SECRET")
	webURL := taskNotificationConfig("WORKSHOP_WEB_URL")
	endpointURL, endpointErr := url.ParseRequestURI(endpoint)
	publicURL, publicErr := url.ParseRequestURI(webURL)
	return enabled && len(secret) >= 32 && endpointErr == nil && endpointURL.Host != "" &&
		(endpointURL.Scheme == "http" || endpointURL.Scheme == "https") &&
		publicErr == nil && publicURL.Scheme == "https" && publicURL.Host != ""
}

func deliverTaskNotifications(ctx context.Context, db *gorm.DB, mutation taskNotificationMutation) error {
	var project models.Project
	if err := db.Select("id", "name").First(&project, mutation.Task.ProjectID).Error; err != nil {
		return fmt.Errorf("query project: %w", err)
	}
	actorName := "项目成员"
	if mutation.ActorUserID != 0 {
		var actor models.User
		if err := db.Select("username").First(&actor, mutation.ActorUserID).Error; err == nil && strings.TrimSpace(actor.Username) != "" {
			actorName = strings.TrimSpace(actor.Username)
		}
	}

	var recipients []taskNotificationRecipient
	err := db.Table("task_notification_preferences AS preference").
		Select("preference.*, users.uuid AS user_uuid").
		Joins("JOIN project_members AS member ON member.project_id = preference.project_id AND member.user_id = preference.user_id AND member.delete_at IS NULL").
		Joins("JOIN users ON users.id = preference.user_id AND users.delete_at IS NULL").
		Where("preference.project_id = ? AND preference.email_enabled = ?", mutation.Task.ProjectID, true).
		Scan(&recipients).Error
	if err != nil {
		return fmt.Errorf("query notification recipients: %w", err)
	}

	changeSummary := describeTaskChanges(mutation)
	for _, recipient := range recipients {
		if recipient.UserID == mutation.ActorUserID {
			continue
		}
		eventType := selectTaskNotificationEvent(recipient.TaskNotificationPreference, mutation, recipient.UserID)
		if eventType == "" || strings.TrimSpace(recipient.UserUUID) == "" {
			continue
		}
		request := taskNotificationEmailRequest{
			RecipientUserID: recipient.UserUUID,
			Template:        taskNotificationTemplate,
			IdempotencyKey:  taskNotificationIdempotencyKey(mutation, recipient.UserID, eventType),
			Data: taskNotificationEmailData{
				EventType:     eventType,
				ProjectName:   project.Name,
				TaskID:        strconv.FormatUint(uint64(mutation.Task.ID), 10),
				TaskContent:   truncateRunes(strings.TrimSpace(mutation.Task.Content), 500),
				ActorName:     truncateRunes(actorName, 100),
				ChangeSummary: changeSummary,
				TaskURL:       taskNotificationURL(mutation.Task.ProjectID, mutation.Task.ID),
				OccurredAt:    mutation.Task.UpdatedAt.In(taskNotificationTimeZone).Format("2006-01-02 15:04"),
			},
		}
		if err := sendTaskNotificationEmail(ctx, request); err != nil {
			log.Printf("send task notification %s for task %d to user %d: %v", eventType, mutation.Task.ID, recipient.UserID, err)
		}
	}
	return nil
}

func selectTaskNotificationEvent(preference models.TaskNotificationPreference, mutation taskNotificationMutation, recipientUserID uint) string {
	if mutation.Created {
		if pointsToUser(mutation.Task.ExecutorID, recipientUserID) && preference.NotifyAssignedToMe {
			return "assigned_to_me"
		}
		if preference.NotifyTaskCreated {
			return "task_created"
		}
		return ""
	}
	if mutation.PreviousTask == nil {
		return ""
	}
	previous := *mutation.PreviousTask
	if !uintPointersEqual(previous.ExecutorID, mutation.Task.ExecutorID) {
		if pointsToUser(mutation.Task.ExecutorID, recipientUserID) && preference.NotifyAssignedToMe {
			return "assigned_to_me"
		}
		if preference.NotifyAssigneeChanged {
			return "assignee_changed"
		}
	}
	if previous.State != mutation.Task.State && preference.NotifyStatusChanged {
		return "status_changed"
	}
	if !intPointersEqual(previous.Priority, mutation.Task.Priority) && preference.NotifyPriorityChanged {
		return "priority_changed"
	}
	if previous.Content != mutation.Task.Content && preference.NotifyContentChanged {
		return "content_changed"
	}
	if !stringPointersEqual(previous.Tags, mutation.Task.Tags) && preference.NotifyTagsChanged {
		return "tags_changed"
	}
	return ""
}

func describeTaskChanges(mutation taskNotificationMutation) string {
	if mutation.Created || mutation.PreviousTask == nil {
		return "创建了待办"
	}
	previous := *mutation.PreviousTask
	changes := make([]string, 0, 5)
	if !uintPointersEqual(previous.ExecutorID, mutation.Task.ExecutorID) {
		changes = append(changes, "执行人")
	}
	if previous.State != mutation.Task.State {
		changes = append(changes, "状态")
	}
	if !intPointersEqual(previous.Priority, mutation.Task.Priority) {
		changes = append(changes, "优先级")
	}
	if previous.Content != mutation.Task.Content {
		changes = append(changes, "内容")
	}
	if !stringPointersEqual(previous.Tags, mutation.Task.Tags) {
		changes = append(changes, "标签")
	}
	if len(changes) == 0 {
		return "更新了待办"
	}
	return "更新了" + strings.Join(changes, "、")
}

func taskNotificationIdempotencyKey(mutation taskNotificationMutation, recipientUserID uint, eventType string) string {
	stamp := mutation.Task.UpdatedAt.UTC().Format("20060102T150405.000000000Z")
	return fmt.Sprintf("workshop-task:%d:%s:%s:user:%d", mutation.Task.ID, eventType, stamp, recipientUserID)
}

func taskNotificationURL(projectID, taskID uint) string {
	base := strings.TrimRight(taskNotificationConfig("WORKSHOP_WEB_URL"), "/")
	return fmt.Sprintf("%s/projects/%d/tasks/%d", base, projectID, taskID)
}

func sendTaskNotificationEmail(ctx context.Context, request taskNotificationEmailRequest) error {
	payload, err := json.Marshal(request)
	if err != nil {
		return err
	}
	endpoint := taskNotificationConfig("TASK_NOTIFICATION_EMAIL_ENDPOINT", "FEEDBACK_NOTIFICATION_EMAIL_URL")
	parsed, err := url.ParseRequestURI(endpoint)
	if err != nil || parsed.Host == "" || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		return fmt.Errorf("TASK_NOTIFICATION_EMAIL_ENDPOINT is invalid")
	}
	requestContext, cancel := context.WithTimeout(ctx, 8*time.Second)
	defer cancel()
	httpRequest, err := http.NewRequestWithContext(requestContext, http.MethodPost, endpoint, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	httpRequest.Header.Set("Content-Type", "application/json")
	httpRequest.Header.Set(taskNotificationSecretHeader, taskNotificationConfig("NOTIFICATION_INTERNAL_SHARED_SECRET", "FEEDBACK_NOTIFICATION_SHARED_SECRET"))
	httpResponse, err := http.DefaultClient.Do(httpRequest)
	if err != nil {
		return err
	}
	defer httpResponse.Body.Close()
	if httpResponse.StatusCode < 200 || httpResponse.StatusCode >= 300 {
		return fmt.Errorf("notification gateway returned %s", httpResponse.Status)
	}
	return nil
}

func taskNotificationConfig(keys ...string) string {
	for _, key := range keys {
		if value := strings.TrimSpace(os.Getenv(key)); value != "" {
			return value
		}
	}
	return ""
}

func pointsToUser(value *uint, userID uint) bool {
	return value != nil && *value == userID
}

func uintPointersEqual(left, right *uint) bool {
	return (left == nil && right == nil) || (left != nil && right != nil && *left == *right)
}

func intPointersEqual(left, right *int) bool {
	return (left == nil && right == nil) || (left != nil && right != nil && *left == *right)
}

func stringPointersEqual(left, right *string) bool {
	return (left == nil && right == nil) || (left != nil && right != nil && *left == *right)
}

func truncateRunes(value string, limit int) string {
	if limit <= 0 || utf8.RuneCountInString(value) <= limit {
		return value
	}
	runes := []rune(value)
	return string(runes[:limit-1]) + "…"
}
