package feedbackemail

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"todo/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	templateFeedbackCustomerMessage = "feedback.customer_message"
	internalSecretHeader            = "X-Nebula-Internal-Secret"
)

type Config struct {
	Enabled        bool
	Endpoint       string
	SharedSecret   string
	ConsoleBaseURL string
	PollInterval   time.Duration
	RequestTimeout time.Duration
	MaxAttempts    int
}

type Worker struct {
	db     *gorm.DB
	config Config
	client *http.Client
}

type gatewayRequest struct {
	RecipientUserID string          `json:"recipient_user_id"`
	Template        string          `json:"template"`
	IdempotencyKey  string          `json:"idempotency_key"`
	Data            gatewayFeedback `json:"data"`
}

type gatewayFeedback struct {
	EventType       string `json:"event_type"`
	ProjectName     string `json:"project_name"`
	FeedbackShortID string `json:"feedback_short_id"`
	FeedbackTitle   string `json:"feedback_title"`
	MessagePreview  string `json:"message_preview"`
	ConsoleURL      string `json:"console_url"`
	OccurredAt      string `json:"occurred_at"`
	AttachmentCount int    `json:"attachment_count"`
}

type deliveryData struct {
	Delivery        models.FeedbackEmailDelivery
	ProjectName     string
	FeedbackTitle   string
	FeedbackShort   string
	MessageContent  string
	MessageAt       time.Time
	RecipientUUID   string
	AttachmentCount int
}

type deliveryError struct {
	err       error
	permanent bool
}

func (e *deliveryError) Error() string { return e.err.Error() }
func (e *deliveryError) Unwrap() error { return e.err }

func LoadConfigFromEnv() (Config, error) {
	enabled, _ := strconv.ParseBool(strings.TrimSpace(os.Getenv("FEEDBACK_EMAIL_NOTIFICATIONS_ENABLED")))
	config := Config{
		Enabled:        enabled,
		Endpoint:       strings.TrimSpace(os.Getenv("FEEDBACK_NOTIFICATION_EMAIL_URL")),
		SharedSecret:   strings.TrimSpace(os.Getenv("FEEDBACK_NOTIFICATION_SHARED_SECRET")),
		ConsoleBaseURL: strings.TrimRight(strings.TrimSpace(os.Getenv("FEEDBACK_CONSOLE_BASE_URL")), "/"),
		PollInterval:   envDuration("FEEDBACK_EMAIL_POLL_INTERVAL", 5*time.Second),
		RequestTimeout: envDuration("FEEDBACK_EMAIL_REQUEST_TIMEOUT", 12*time.Second),
		MaxAttempts:    envInt("FEEDBACK_EMAIL_MAX_ATTEMPTS", 8),
	}
	if !config.Enabled {
		return config, nil
	}
	if parsed, err := url.ParseRequestURI(config.Endpoint); err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" {
		return Config{}, fmt.Errorf("FEEDBACK_NOTIFICATION_EMAIL_URL 必须是有效的 HTTP(S) 地址")
	}
	if len(config.SharedSecret) < 32 {
		return Config{}, fmt.Errorf("FEEDBACK_NOTIFICATION_SHARED_SECRET 至少需要 32 个字符")
	}
	if parsed, err := url.ParseRequestURI(config.ConsoleBaseURL); err != nil || parsed.Scheme != "https" || parsed.Host == "" {
		return Config{}, fmt.Errorf("FEEDBACK_CONSOLE_BASE_URL 必须是有效的 HTTPS 地址")
	}
	if config.PollInterval < time.Second || config.RequestTimeout < time.Second || config.MaxAttempts < 1 || config.MaxAttempts > 50 {
		return Config{}, fmt.Errorf("反馈邮件 worker 参数超出安全范围")
	}
	return config, nil
}

func NewWorker(db *gorm.DB, config Config) *Worker {
	return &Worker{
		db:     db,
		config: config,
		client: &http.Client{Timeout: config.RequestTimeout},
	}
}

// Run processes the durable outbox. It is safe to run in multiple service
// instances because each row is claimed with FOR UPDATE SKIP LOCKED.
func (w *Worker) Run(ctx context.Context) {
	if w == nil || !w.config.Enabled {
		return
	}
	log.Println("反馈邮件通知 worker 已启动")
	w.recoverStale(ctx)
	w.drain(ctx)
	ticker := time.NewTicker(w.config.PollInterval)
	defer ticker.Stop()
	recoveryTicker := time.NewTicker(time.Minute)
	defer recoveryTicker.Stop()
	for {
		select {
		case <-ctx.Done():
			log.Println("反馈邮件通知 worker 已停止")
			return
		case <-ticker.C:
			w.drain(ctx)
		case <-recoveryTicker.C:
			w.recoverStale(ctx)
		}
	}
}

func (w *Worker) drain(ctx context.Context) {
	for processed := 0; processed < 20; processed++ {
		found, err := w.processOne(ctx)
		if err != nil {
			log.Printf("反馈邮件通知处理失败: %v", err)
		}
		if !found || ctx.Err() != nil {
			return
		}
	}
}

func (w *Worker) processOne(ctx context.Context) (bool, error) {
	delivery, found, err := w.claim(ctx)
	if err != nil || !found {
		return found, err
	}
	data, err := w.loadDeliveryData(ctx, delivery)
	if err == nil {
		err = w.send(ctx, data)
	}
	if err == nil {
		now := time.Now().UTC()
		return true, w.db.WithContext(ctx).Model(&models.FeedbackEmailDelivery{}).
			Where("id = ? AND status = ?", delivery.ID, models.FeedbackEmailDeliveryProcessing).
			Updates(map[string]interface{}{
				"status":     models.FeedbackEmailDeliverySent,
				"sent_at":    now,
				"locked_at":  nil,
				"last_error": nil,
			}).Error
	}

	permanent := false
	var typed *deliveryError
	if errors.As(err, &typed) {
		permanent = typed.permanent
	}
	return true, w.markFailed(ctx, delivery, err, permanent)
}

func (w *Worker) claim(ctx context.Context) (models.FeedbackEmailDelivery, bool, error) {
	var delivery models.FeedbackEmailDelivery
	now := time.Now().UTC()
	tx := w.db.WithContext(ctx).Begin()
	if tx.Error != nil {
		return delivery, false, tx.Error
	}
	defer func() {
		if tx != nil {
			tx.Rollback()
		}
	}()
	err := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "SKIP LOCKED"}).
		Where("status = ? AND next_attempt_at <= ?", models.FeedbackEmailDeliveryPending, now).
		Order("next_attempt_at ASC, id ASC").
		First(&delivery).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		rollbackErr := tx.Rollback().Error
		tx = nil
		return delivery, false, rollbackErr
	}
	if err != nil {
		return delivery, false, err
	}
	lockedAt := now
	if err := tx.Model(&models.FeedbackEmailDelivery{}).Where("id = ?", delivery.ID).Updates(map[string]interface{}{
		"status":        models.FeedbackEmailDeliveryProcessing,
		"attempt_count": gorm.Expr("attempt_count + 1"),
		"locked_at":     lockedAt,
	}).Error; err != nil {
		return delivery, false, err
	}
	if err := tx.Commit().Error; err != nil {
		return delivery, false, err
	}
	tx = nil
	delivery.Status = models.FeedbackEmailDeliveryProcessing
	delivery.AttemptCount++
	delivery.LockedAt = &lockedAt
	return delivery, true, nil
}

func (w *Worker) loadDeliveryData(ctx context.Context, delivery models.FeedbackEmailDelivery) (deliveryData, error) {
	var row struct {
		ProjectName    string
		FeedbackTitle  string
		FeedbackShort  string
		MessageContent string
		MessageAt      time.Time
		RecipientUUID  string
	}
	err := w.db.WithContext(ctx).Table("feedback_email_deliveries AS delivery").
		Select(`projects.name AS project_name,
			feedbacks.title AS feedback_title,
			feedbacks.short_id AS feedback_short,
			feedback_messages.content AS message_content,
			feedback_messages.created_at AS message_at,
			users.uuid AS recipient_uuid`).
		Joins("JOIN projects ON projects.id = delivery.project_id AND projects.delete_at IS NULL").
		Joins("JOIN feedbacks ON feedbacks.id = delivery.feedback_id AND feedbacks.delete_at IS NULL").
		Joins("JOIN feedback_messages ON feedback_messages.id = delivery.message_id AND feedback_messages.delete_at IS NULL").
		Joins("JOIN users ON users.id = delivery.recipient_user_id AND users.delete_at IS NULL").
		Joins("JOIN project_members ON project_members.project_id = delivery.project_id AND project_members.user_id = delivery.recipient_user_id AND project_members.delete_at IS NULL").
		Joins("JOIN feedback_subscriptions ON feedback_subscriptions.project_id = delivery.project_id AND feedback_subscriptions.user_id = delivery.recipient_user_id AND feedback_subscriptions.email_enabled = TRUE").
		Where("delivery.id = ?", delivery.ID).
		Where("(delivery.event_type = ? AND feedback_subscriptions.notify_new_feedback = TRUE) OR (delivery.event_type = ? AND feedback_subscriptions.notify_customer_replies = TRUE)", models.FeedbackEmailEventNewFeedback, models.FeedbackEmailEventCustomerReply).
		Take(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return deliveryData{}, &deliveryError{err: fmt.Errorf("邮件通知关联数据已不存在"), permanent: true}
	}
	if err != nil {
		return deliveryData{}, err
	}
	var attachmentCount int64
	if err := w.db.WithContext(ctx).Model(&models.FeedbackMessageAttachment{}).
		Where("message_id = ?", delivery.MessageID).
		Count(&attachmentCount).Error; err != nil {
		return deliveryData{}, err
	}
	return deliveryData{
		Delivery:        delivery,
		ProjectName:     row.ProjectName,
		FeedbackTitle:   row.FeedbackTitle,
		FeedbackShort:   row.FeedbackShort,
		MessageContent:  row.MessageContent,
		MessageAt:       row.MessageAt,
		RecipientUUID:   row.RecipientUUID,
		AttachmentCount: int(attachmentCount),
	}, nil
}

func (w *Worker) send(ctx context.Context, data deliveryData) error {
	payload := gatewayRequest{
		RecipientUserID: data.RecipientUUID,
		Template:        templateFeedbackCustomerMessage,
		IdempotencyKey:  fmt.Sprintf("feedback-email-delivery:%d", data.Delivery.ID),
		Data: gatewayFeedback{
			EventType:       data.Delivery.EventType,
			ProjectName:     data.ProjectName,
			FeedbackShortID: data.FeedbackShort,
			FeedbackTitle:   data.FeedbackTitle,
			MessagePreview:  preview(data.MessageContent, 500),
			ConsoleURL:      w.feedbackURL(data.Delivery.FeedbackID),
			OccurredAt:      data.MessageAt.Format(time.RFC3339),
			AttachmentCount: data.AttachmentCount,
		},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return &deliveryError{err: fmt.Errorf("构建邮件通知请求失败: %w", err), permanent: true}
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, w.config.Endpoint, bytes.NewReader(body))
	if err != nil {
		return &deliveryError{err: fmt.Errorf("创建邮件通知请求失败: %w", err), permanent: true}
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set(internalSecretHeader, w.config.SharedSecret)
	response, err := w.client.Do(request)
	if err != nil {
		return fmt.Errorf("调用邮件通知服务失败: %w", err)
	}
	defer response.Body.Close()
	limited, _ := io.ReadAll(io.LimitReader(response.Body, 2048))
	if response.StatusCode >= 200 && response.StatusCode < 300 {
		return nil
	}
	message := strings.TrimSpace(string(limited))
	if message == "" {
		message = http.StatusText(response.StatusCode)
	}
	permanent := response.StatusCode == http.StatusBadRequest || response.StatusCode == http.StatusUnprocessableEntity || response.StatusCode == http.StatusRequestEntityTooLarge
	return &deliveryError{
		err:       fmt.Errorf("邮件通知服务返回 %d: %s", response.StatusCode, preview(message, 300)),
		permanent: permanent,
	}
}

func (w *Worker) feedbackURL(feedbackID uint) string {
	return fmt.Sprintf("%s/feedbacks/email/%d", w.config.ConsoleBaseURL, feedbackID)
}

func (w *Worker) markFailed(ctx context.Context, delivery models.FeedbackEmailDelivery, deliveryErr error, permanent bool) error {
	status := models.FeedbackEmailDeliveryPending
	nextAttempt := time.Now().UTC().Add(retryDelay(delivery.AttemptCount))
	if permanent || delivery.AttemptCount >= w.config.MaxAttempts {
		status = models.FeedbackEmailDeliveryFailed
	}
	errorMessage := preview(deliveryErr.Error(), 1000)
	updates := map[string]interface{}{
		"status":     status,
		"locked_at":  nil,
		"last_error": errorMessage,
	}
	if status == models.FeedbackEmailDeliveryPending {
		updates["next_attempt_at"] = nextAttempt
	}
	if err := w.db.WithContext(ctx).Model(&models.FeedbackEmailDelivery{}).
		Where("id = ? AND status = ?", delivery.ID, models.FeedbackEmailDeliveryProcessing).
		Updates(updates).Error; err != nil {
		return fmt.Errorf("记录邮件通知失败状态失败: %w（原错误: %v）", err, deliveryErr)
	}
	return deliveryErr
}

func (w *Worker) recoverStale(ctx context.Context) {
	cutoff := time.Now().UTC().Add(-10 * time.Minute)
	if err := w.db.WithContext(ctx).Model(&models.FeedbackEmailDelivery{}).
		Where("status = ? AND locked_at < ?", models.FeedbackEmailDeliveryProcessing, cutoff).
		Updates(map[string]interface{}{
			"status":          models.FeedbackEmailDeliveryPending,
			"locked_at":       nil,
			"next_attempt_at": time.Now().UTC(),
		}).Error; err != nil && ctx.Err() == nil {
		log.Printf("恢复超时反馈邮件任务失败: %v", err)
	}
}

func retryDelay(attempt int) time.Duration {
	if attempt < 1 {
		attempt = 1
	}
	delay := time.Minute << min(attempt-1, 6)
	if delay > time.Hour {
		return time.Hour
	}
	return delay
}

func preview(value string, limit int) string {
	compact := strings.Join(strings.Fields(value), " ")
	runes := []rune(compact)
	if len(runes) <= limit {
		return compact
	}
	return string(runes[:limit]) + "..."
}

func envDuration(key string, fallback time.Duration) time.Duration {
	if value, err := time.ParseDuration(strings.TrimSpace(os.Getenv(key))); err == nil && value > 0 {
		return value
	}
	return fallback
}

func envInt(key string, fallback int) int {
	if value, err := strconv.Atoi(strings.TrimSpace(os.Getenv(key))); err == nil {
		return value
	}
	return fallback
}
