package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"todo/models"

	"github.com/gin-gonic/gin"
)

func TestOpenHandsLLMAPIKeyEncryptionRoundTripAndProjectBinding(t *testing.T) {
	t.Setenv(openHandsConfigEncryptionKeyEnv, strings.Repeat("master-secret-", 4))
	plaintext := "sk-private-provider-key"

	encrypted, err := encryptOpenHandsLLMAPIKey(42, plaintext)
	if err != nil {
		t.Fatalf("encryptOpenHandsLLMAPIKey: %v", err)
	}
	if strings.Contains(encrypted, plaintext) {
		t.Fatal("encrypted credential contains plaintext")
	}
	decrypted, err := decryptOpenHandsLLMAPIKey(42, encrypted)
	if err != nil {
		t.Fatalf("decryptOpenHandsLLMAPIKey: %v", err)
	}
	if decrypted != plaintext {
		t.Fatalf("decrypted = %q, want original", decrypted)
	}
	if _, err := decryptOpenHandsLLMAPIKey(43, encrypted); err == nil {
		t.Fatal("credential must not decrypt for another project")
	}
}

func TestOpenHandsLLMAPIKeyEncryptionRequiresMasterKey(t *testing.T) {
	t.Setenv(openHandsConfigEncryptionKeyEnv, "")
	if _, err := encryptOpenHandsLLMAPIKey(1, "sk-test"); err == nil {
		t.Fatal("encryption unexpectedly succeeded without master key")
	}
}

func TestOpenHandsLLMKeySource(t *testing.T) {
	t.Setenv("LLM_API_KEY", "")
	if got := openHandsLLMKeySource(nil); got != "none" {
		t.Fatalf("source = %q, want none", got)
	}
	t.Setenv("LLM_API_KEY", "server-key")
	if got := openHandsLLMKeySource(nil); got != "server" {
		t.Fatalf("source = %q, want server", got)
	}
	if got := openHandsLLMKeySource(&OpenHandsAgent{LLMAPIKeyEncrypted: "v1:anything"}); got != "project" {
		t.Fatalf("source = %q, want project", got)
	}
}

func TestOpenHandsConfigResponseNeverSerializesSecrets(t *testing.T) {
	t.Setenv("LLM_API_KEY", "server-secret")
	agent := &OpenHandsAgent{
		ProjectID:          8,
		URL:                "http://openhands-agent:8000",
		APIKey:             "session-secret",
		Status:             "active",
		LLMAPIKeyEncrypted: "v1:encrypted-secret",
		LLMModel:           "deepseek/deepseek-chat",
	}
	payload, err := json.Marshal(openHandsConfigResponse(agent, agent.ProjectID))
	if err != nil {
		t.Fatalf("marshal config response: %v", err)
	}
	serialized := string(payload)
	for _, secret := range []string{"server-secret", "session-secret", "encrypted-secret"} {
		if strings.Contains(serialized, secret) {
			t.Fatalf("config response exposed secret %q: %s", secret, serialized)
		}
	}
}

func TestUpdateOpenHandsConfigAllowsProjectMemberButRejectsOutsider(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupCustomerCodeRepoTestDB(t)
	defer teardownCustomerCodeRepoTestDB(t, db)
	if err := db.AutoMigrate(&OpenHandsAgent{}); err != nil {
		t.Fatalf("auto migrate OpenHands agent: %v", err)
	}
	t.Setenv(openHandsConfigEncryptionKeyEnv, strings.Repeat("member-config-key-", 3))

	owner := createCustomerCodeRepoTestUser(t, db, "openhands-owner")
	member := createCustomerCodeRepoTestUser(t, db, "openhands-member")
	outsider := createCustomerCodeRepoTestUser(t, db, "openhands-outsider")
	project := createCustomerCodeRepoTestProject(t, db, owner.ID, "openhands-member-config")
	createCustomerCodeRepoTestMember(t, db, project.ID, owner.ID, models.ProjectRoleOwner)
	createCustomerCodeRepoTestMember(t, db, project.ID, member.ID, models.ProjectRoleMember)

	requestBody := []byte(`{"url":"http://openhands-agent:8000","llm_model":"deepseek/deepseek-chat","llm_base_url":"https://api.deepseek.com","llm_api_key":"member-demo-key"}`)
	callUpdate := func(userID uint) *httptest.ResponseRecorder {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		context.Request = httptest.NewRequest(
			http.MethodPut,
			fmt.Sprintf("/workshop/v2/user/projects/%d/openhands-config", project.ID),
			bytes.NewReader(requestBody),
		)
		context.Request.Header.Set("Content-Type", "application/json")
		context.Params = gin.Params{{Key: "id", Value: fmt.Sprint(project.ID)}}
		context.Set("db", db)
		context.Set("userID", userID)
		UpdateOpenHandsConfigHandler(context)
		return recorder
	}

	if recorder := callUpdate(member.ID); recorder.Code != http.StatusOK {
		t.Fatalf("member update status = %d, body = %s", recorder.Code, recorder.Body.String())
	}
	var agent OpenHandsAgent
	if err := db.Where("project_id = ?", project.ID).First(&agent).Error; err != nil {
		t.Fatalf("load saved OpenHands config: %v", err)
	}
	decrypted, err := decryptOpenHandsLLMAPIKey(project.ID, agent.LLMAPIKeyEncrypted)
	if err != nil || decrypted != "member-demo-key" {
		t.Fatalf("member key was not encrypted and stored correctly: decrypted=%q err=%v", decrypted, err)
	}

	if recorder := callUpdate(outsider.ID); recorder.Code != http.StatusForbidden {
		t.Fatalf("outsider update status = %d, want 403; body = %s", recorder.Code, recorder.Body.String())
	}
}
