package handler

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"todo/domain/feedback"
	"todo/response"
)

// applyFeedbackSearch applies only predicates, after callers establish the
// authenticated scope. EXISTS avoids duplicate rows and pagination counts.
func applyFeedbackSearch(c *gin.Context, query *gorm.DB) (*gorm.DB, bool) {
	f, err := feedback.ParseSearch(c.Query("q"), c.Query("status"), c.Query("date_from"), c.Query("date_to"), c.Query("date_field"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.NewErrorResponse(response.CodeBadRequest, err.Error(), nil))
		return query, false
	}
	if f.Query != "" {
		p := f.Pattern()
		query = query.Where(`(feedbacks.title ILIKE ? OR feedbacks.content ILIKE ? OR feedbacks.short_id ILIKE ? OR EXISTS (SELECT 1 FROM feedback_messages fm WHERE fm.feedback_id = feedbacks.id AND fm.delete_at IS NULL AND fm.state = 'sent' AND fm.content ILIKE ?) OR EXISTS (SELECT 1 FROM agent_message_records am WHERE am.feedback_id = feedbacks.id AND am.delete_at IS NULL AND am.content ILIKE ?) OR EXISTS (SELECT 1 FROM feedback_conclusions fc WHERE fc.feedback_id = feedbacks.id AND (fc.title ILIKE ? OR fc.body ILIKE ?)))`, p, p, p, p, p, p, p)
	}
	if f.Status != "" {
		switch f.Status {
		case "submitted", "analyzing", "reviewing", "developing", "completed", "released", "ignored":
			status := f.Status
			if status == "analyzing" {
				status = "submitted"
			}
			query = query.Where(`(CASE WHEN feedbacks.triage_status='ignored' THEN 'ignored'
    WHEN feedbacks.status IN ('accepted','converted') THEN 'reviewing'
    WHEN feedbacks.status='in_progress' THEN 'developing' WHEN feedbacks.status='completed' THEN 'completed'
    WHEN feedbacks.status='released' THEN 'released' WHEN feedbacks.status='ignored' THEN 'ignored'
    WHEN feedbacks.triage_status='accepted' THEN 'reviewing' ELSE 'submitted' END) = ?`, status)
		default:
			query = query.Where("feedbacks.status = ?", f.Status)
		}
	}

	field := "feedbacks.created_at"
	if f.DateField == "updated" {
		field = "COALESCE(feedbacks.last_message_at, feedbacks.updated_at)"
	}
	if f.Start != nil {
		query = query.Where(field+" >= ?", *f.Start)
	}
	if f.End != nil {
		query = query.Where(field+" < ?", *f.End)
	}
	return query, true
}
