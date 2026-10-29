package handler

import (
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
	"todo/middleware"
	"todo/models"
)

func TestFeedbackLifecyclePublicationAndCustomerResponse(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)
	fx := seedFeedbackWorkflowFixture(t, db)
	fb := fx.createFeedback(t, models.FeedbackStatusCompleted)
	owner := "customer-1"
	fb.CustomUserID = &owner
	db.Save(&fb)
	pub := performFeedbackWorkflowRequest(db, fx.user.ID, "POST", "/workshop/v2/user/feedbacks/1/conclusions", fb.ID, `{"kind":"delivery","title":"修复权限问题","body":"请刷新后验证","version_label":"2.8.0"}`, PublishFeedbackConclusion)
	if pub.Code != 201 {
		t.Fatalf("publish status=%d %s", pub.Code, pub.Body)
	}
	var envelope struct {
		Data models.FeedbackConclusion `json:"data"`
	}
	if err := json.Unmarshal(pub.Body.Bytes(), &envelope); err != nil {
		t.Fatal(err)
	}
	con := envelope.Data
	request := func(customer, action, key string, id uint) *httptest.ResponseRecorder {
		r := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(r)
		c.Request = httptest.NewRequest("POST", "/workshop/v2/feedback/feedbacks/1/conclusions/1/response", strings.NewReader(fmt.Sprintf(`{"response":%q,"client_message_id":%q,"content":"验证结果"}`, action, key)))
		c.Request.Header.Set("Content-Type", "application/json")
		c.Params = gin.Params{{Key: "id", Value: fmt.Sprint(fb.ID)}, {Key: "conclusionId", Value: fmt.Sprint(id)}}
		c.Set("db", db)
		c.Set("feedbackSessionScope", middleware.FeedbackSessionScope{ProjectID: fb.ProjectID, CustomUserID: customer, SessionID: "test"})
		RespondFeedbackConclusionFromSession(c)
		return r
	}
	if r := request("other", "accepted", "cross", con.ID); r.Code != http.StatusForbidden {
		t.Fatalf("cross-customer=%d %s", r.Code, r.Body)
	}
	if r := request(owner, "accepted", "accept-1", con.ID); r.Code != 200 {
		t.Fatalf("accept=%d %s", r.Code, r.Body)
	}
	if r := request(owner, "accepted", "accept-1", con.ID); r.Code != 200 {
		t.Fatalf("replay=%d %s", r.Code, r.Body)
	}
	var count int64
	db.Model(&models.FeedbackConclusionResponse{}).Where("feedback_id = ?", fb.ID).Count(&count)
	if count != 1 {
		t.Fatalf("duplicate response count=%d", count)
	}
	var persisted models.Feedback
	db.First(&persisted, fb.ID)
	if persisted.Status != models.FeedbackStatusCompleted {
		t.Fatal("customer acceptance bypassed task state")
	}
	pub2 := performFeedbackWorkflowRequest(db, fx.user.ID, "POST", "/workshop/v2/user/feedbacks/1/conclusions", fb.ID, `{"kind":"delivery","title":"补充说明","body":"更新后的处理结果"}`, PublishFeedbackConclusion)
	if pub2.Code != 201 {
		t.Fatalf("publish2=%d %s", pub2.Code, pub2.Body)
	}
	if r := request(owner, "accepted", "stale", con.ID); r.Code != 409 {
		t.Fatalf("stale acceptance=%d", r.Code)
	}
	detail, err := loadFeedbackDetail(db, fb)
	if err != nil {
		t.Fatal(err)
	}
	if len(detail.Conclusions) != 2 || detail.Conclusions[0].Version != 2 || len(detail.Responses) != 1 {
		t.Fatalf("invalid detail=%+v", detail)
	}
}
func TestFeedbackSearchKeepsScopeAndIncludesVisibleConversation(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)
	fx := seedFeedbackWorkflowFixture(t, db)
	a := fx.createFeedback(t, "pending")
	owner := "a"
	a.CustomUserID = &owner
	db.Save(&a)
	b := fx.createFeedback(t, "pending")
	other := "b"
	b.CustomUserID = &other
	db.Save(&b)
	for _, id := range []uint{a.ID, b.ID} {
		db.Create(&models.FeedbackMessage{FeedbackID: id, ProjectID: a.ProjectID, SenderType: "developer", State: "sent", Content: "Chrome130 export"})
	}
	r := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(r)
	c.Request = httptest.NewRequest("GET", "/workshop/v2/feedback/feedbacks?q=Chrome130&page=1&page_size=20", nil)
	c.Set("db", db)
	c.Set("feedbackSessionScope", middleware.FeedbackSessionScope{ProjectID: a.ProjectID, CustomUserID: owner, SessionID: "s"})
	GetFeedbacksFromSession(c)
	if r.Code != 200 {
		t.Fatalf("search=%d %s", r.Code, r.Body)
	}
	var body struct {
		Data []FeedbackResponse `json:"data"`
	}
	json.Unmarshal(r.Body.Bytes(), &body)
	if len(body.Data) != 1 || body.Data[0].ID != a.ID {
		t.Fatalf("scope leak: %s", r.Body)
	}
}
func TestUnifiedConversationDoesNotExposeDrafts(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)
	fx := seedFeedbackWorkflowFixture(t, db)
	fb := fx.createFeedback(t, "pending")
	db.Create(&models.FeedbackMessage{FeedbackID: fb.ID, ProjectID: fb.ProjectID, SenderType: "developer", State: "pending_review", Content: "private draft", CreatedAt: time.Now()})
	views, err := loadConversationMessages(db, fb.ID)
	if err != nil {
		t.Fatal(err)
	}
	for _, v := range views {
		if v.Content == "private draft" {
			t.Fatal("draft leaked to customer")
		}
	}
}

func TestV2DeliveryCannotCompleteAnUnfinishedTask(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)
	fx := seedFeedbackWorkflowFixture(t, db)
	fb := fx.createFeedback(t, "in_progress")
	r := performFeedbackWorkflowRequest(db, fx.user.ID, "POST", "/workshop/v2/user/feedbacks/1/delivery-notify", fb.ID, `{"artifact_url":"https://example.com/release","message":"交付"}`, NotifyDeliveryHandler)
	if r.Code != 409 {
		t.Fatalf("delivery prematurely completed work: %d %s", r.Code, r.Body)
	}
}

func TestUnifiedConversationPageIsCompleteAndStable(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)
	fx := seedFeedbackWorkflowFixture(t, db)
	fb := fx.createFeedback(t, "pending")
	stamp := time.Now().Truncate(time.Second)
	for i := 0; i < 121; i++ {
		if err := db.Create(&models.FeedbackMessage{FeedbackID: fb.ID, ProjectID: fb.ProjectID, SenderType: "customer", State: "sent", Content: fmt.Sprint(i), CreatedAt: stamp}).Error; err != nil {
			t.Fatal(err)
		}
	}
	page, total, err := loadConversationPage(db, fb.ID, 100, 20)
	if err != nil {
		t.Fatal(err)
	}
	if total != 121 || len(page) != 20 || page[0].Content != "100" {
		t.Fatalf("bad page total=%d count=%d %+v", total, len(page), page)
	}
	last, total, err := loadConversationPage(db, fb.ID, 120, 20)
	if err != nil || total != 121 || len(last) != 1 || last[0].Content != "120" {
		t.Fatalf("bad final page total=%d count=%d error=%v", total, len(last), err)
	}
	if err := db.Migrator().DropTable(&models.FeedbackMessageAttachment{}); err != nil {
		t.Fatal(err)
	}
	if _, _, err := loadConversationPage(db, fb.ID, 0, 20); err == nil {
		t.Fatal("attachment repository failure was swallowed")
	}
}

func TestDeliveryMessageCreatesCustomerNotificationType(t *testing.T) {
	metadata := `{"type":"delivery_notification"}`
	m := models.FeedbackMessage{SenderType: models.FeedbackMessageSenderSystem, MessageType: models.FeedbackMessageTypeSystem, Metadata: &metadata}
	if actual := feedbackNotificationTypeForMessage(m); actual != models.FeedbackNotificationTypeStatusChange {
		t.Fatalf("delivery has no customer notification type: %s", actual)
	}
}

func TestCustomerMessageEndpointDoesNotExposeDrafts(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)
	fx := seedFeedbackWorkflowFixture(t, db)
	fb := fx.createFeedback(t, "pending")
	owner := "draft-owner"
	fb.CustomUserID = &owner
	db.Save(&fb)
	db.Create(&models.FeedbackMessage{FeedbackID: fb.ID, ProjectID: fb.ProjectID, SenderType: "developer", State: "pending_review", Content: "private-unconfirmed-reply"})
	r := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(r)
	c.Request = httptest.NewRequest("GET", "/workshop/v2/feedback/feedbacks/1/messages", nil)
	c.Params = gin.Params{{Key: "id", Value: fmt.Sprint(fb.ID)}}
	c.Set("db", db)
	c.Set("feedbackSessionScope", middleware.FeedbackSessionScope{ProjectID: fb.ProjectID, CustomUserID: owner, SessionID: "s"})
	GetFeedbackMessagesFromSession(c)
	if r.Code != 200 || strings.Contains(r.Body.String(), "private-unconfirmed-reply") {
		t.Fatalf("customer private draft leak: %d %s", r.Code, r.Body)
	}
}
