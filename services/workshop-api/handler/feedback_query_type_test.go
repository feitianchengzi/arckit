package handler

import (
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"todo/models"
)

// List filtering by request_type is a server-side contract: the SDK must not
// filter one client page, and untyped (raw/manual) cards stay reachable as none.
func TestApplyFeedbackSearchFiltersRequestType(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)
	fx := seedFeedbackWorkflowFixture(t, db)

	featureData := `{"structured":{"request_type":"feature","position":"列表","phenomenon":"希望批量导出","expect":"一次导出"}}`
	bugData := `{"structured":{"request_type":"bug","position":"导出页","phenomenon":"403","expect":"导出成功"}}`
	for _, row := range []struct {
		title string
		data  *string
	}{
		{"feature card", &featureData},
		{"bug card", &bugData},
		{"raw card", nil},
	} {
		fb := models.Feedback{ProjectID: fx.project.ID, ShortID: "tf-" + row.title, Title: row.title, Content: row.title, Status: "pending", Data: row.data}
		if err := db.Create(&fb).Error; err != nil {
			t.Fatalf("seed: %v", err)
		}
	}

	list := func(requestType string) []models.Feedback {
		c, _ := gin.CreateTestContext(httptest.NewRecorder())
		c.Request = httptest.NewRequest("GET", "/feedbacks?request_type="+requestType, nil)
		query := db.Model(&models.Feedback{}).Where("project_id = ?", fx.project.ID)
		query, ok := applyFeedbackSearch(c, query)
		if !ok {
			t.Fatalf("search rejected for %q", requestType)
		}
		var rows []models.Feedback
		if err := query.Find(&rows).Error; err != nil {
			t.Fatalf("query: %v", err)
		}
		return rows
	}

	featureRows := list("feature")
	if len(featureRows) != 1 || featureRows[0].Title != "feature card" {
		t.Fatalf("feature filter mismatch: %+v", titles(featureRows))
	}
	bugRows := list("bug")
	if len(bugRows) != 1 || bugRows[0].Title != "bug card" {
		t.Fatalf("bug filter mismatch: %+v", titles(bugRows))
	}
	noneRows := list("none")
	if len(noneRows) != 1 || noneRows[0].Title != "raw card" {
		t.Fatalf("none filter mismatch: %+v", titles(noneRows))
	}
	allRows := list("")
	if len(allRows) != 3 {
		t.Fatalf("empty filter must return all seeded cards, got %d", len(allRows))
	}

	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest("GET", "/feedbacks?request_type=bogus", nil)
	if _, ok := applyFeedbackSearch(c, db.Model(&models.Feedback{})); ok {
		t.Fatalf("invalid request_type must be rejected")
	}
}

func titles(rows []models.Feedback) []string {
	out := make([]string, 0, len(rows))
	for _, row := range rows {
		out = append(out, row.Title)
	}
	return out
}
