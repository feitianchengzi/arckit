package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func captureOpenHandsConversations(t *testing.T, payload *map[string]any) *httptest.Server {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/api/conversations" {
			t.Errorf("unexpected request %s %s", r.Method, r.URL.Path)
		}
		var body map[string]any
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Errorf("decode OpenHands payload: %v", err)
		}
		*payload = body
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte(`{"id":"conv-42"}`))
	}))
	t.Cleanup(server.Close)
	return server
}

func TestOhCreateConversationUsesGivenWorkingDir(t *testing.T) {
	t.Setenv("LLM_API_KEY", "test-key")
	t.Setenv("OH_WORKSPACE_DIR", "/projects")

	var payload map[string]any
	server := captureOpenHandsConversations(t, &payload)

	agent := &OpenHandsAgent{URL: server.URL, APIKey: "k"}
	id, err := ohCreateConversation(agent, "hello", "/data/repos/11")
	if err != nil {
		t.Fatalf("ohCreateConversation: %v", err)
	}
	if id != "conv-42" {
		t.Fatalf("conversation id = %q, want conv-42", id)
	}

	workspace, ok := payload["workspace"].(map[string]any)
	if !ok {
		t.Fatalf("payload workspace missing: %#v", payload)
	}
	if got := workspace["working_dir"]; got != "/data/repos/11" {
		t.Fatalf("working_dir = %v, want /data/repos/11", got)
	}
}

func TestOhCreateConversationRejectsMissingWorkspace(t *testing.T) {
	t.Setenv("LLM_API_KEY", "test-key")
	agent := &OpenHandsAgent{URL: "http://unused.invalid", APIKey: "k"}
	if _, err := ohCreateConversation(agent, "hello", ""); err == nil {
		t.Fatal("missing project workspace must be rejected")
	}
}

func TestOhRepoRootDefaultsAndOverride(t *testing.T) {
	t.Setenv("OH_REPO_ROOT", "")
	if got := ohRepoRoot(); got != "/workspace/customer-repos" {
		t.Fatalf("ohRepoRoot() = %q, want /workspace/customer-repos", got)
	}

	t.Setenv("OH_REPO_ROOT", "/data/repos")
	if got := ohRepoRoot(); got != "/data/repos" {
		t.Fatalf("ohRepoRoot() = %q, want /data/repos", got)
	}
}

func TestOhClonedRepoDirIsProjectScoped(t *testing.T) {
	t.Setenv("OH_REPO_ROOT", "/data/repos")
	want := filepath.Join("/data/repos", "11")
	if got := ohClonedRepoDir(11); got != want {
		t.Fatalf("ohClonedRepoDir(11) = %q, want %q", got, want)
	}
}

func TestResolveProjectWorkspaceDirWithoutDatabase(t *testing.T) {
	t.Setenv("OH_WORKSPACE_DIR", "/projects")
	if got := resolveProjectWorkspaceDir(nil, 11); got != "" {
		t.Fatalf("resolveProjectWorkspaceDir(nil, 11) = %q, want empty (fail closed)", got)
	}
}

func TestResolveProjectWorkspaceDirWithDatabase(t *testing.T) {
	db := openFeedbackWorkflowPostgres(t)
	if err := db.AutoMigrate(&CustomerCodeRepo{}); err != nil {
		t.Fatalf("migrate customer_code_repos: %v", err)
	}

	existingPath := t.TempDir()
	existingPath, _ = filepath.EvalSymlinks(existingPath)
	t.Setenv("OH_WORKSPACE_DIR", "/projects")
	t.Setenv("OH_REPO_ROOT", filepath.Join(t.TempDir(), "repos"))

	t.Run("explicit existing repo path wins", func(t *testing.T) {
		repo := CustomerCodeRepo{ProjectID: 901, CustomerID: "c1", RepoPath: existingPath, Branch: "main", Status: "ready"}
		if err := db.Create(&repo).Error; err != nil {
			t.Fatalf("create repo: %v", err)
		}
		if got := resolveProjectWorkspaceDir(db, 901); got != existingPath {
			t.Fatalf("resolveProjectWorkspaceDir = %q, want %q", got, existingPath)
		}
	})

	t.Run("missing repo path is skipped in favor of clone dir", func(t *testing.T) {
		cloneDir := filepath.Join(t.TempDir(), "repos", "902")
		t.Setenv("OH_REPO_ROOT", filepath.Dir(cloneDir))
		if err := os.MkdirAll(cloneDir, 0o755); err != nil {
			t.Fatalf("prepare clone dir: %v", err)
		}
		repo := CustomerCodeRepo{ProjectID: 902, CustomerID: "c1", RepoPath: "/nonexistent/repo/path", Branch: "main", Status: "ready"}
		if err := db.Create(&repo).Error; err != nil {
			t.Fatalf("create repo: %v", err)
		}
		resolvedClone, _ := filepath.EvalSymlinks(cloneDir)
		if got := resolveProjectWorkspaceDir(db, 902); got != resolvedClone {
			t.Fatalf("resolveProjectWorkspaceDir = %q, want %q", got, cloneDir)
		}
	})

	t.Run("partial repository coverage is rejected", func(t *testing.T) {
		syncingPath := t.TempDir()
		readyRepo := CustomerCodeRepo{ProjectID: 903, CustomerID: "a", RepoPath: existingPath, Branch: "main", Status: "ready"}
		syncingRepo := CustomerCodeRepo{ProjectID: 903, CustomerID: "b", RepoPath: syncingPath, Branch: "main", Status: "syncing"}
		if err := db.Create(&syncingRepo).Error; err != nil {
			t.Fatalf("create syncing repo: %v", err)
		}
		if err := db.Create(&readyRepo).Error; err != nil {
			t.Fatalf("create ready repo: %v", err)
		}
		if got := resolveProjectWorkspaceDir(db, 903); got != "" {
			t.Fatalf("resolveProjectWorkspaceDir = %q, want unavailable while one repo is syncing", got)
		}
	})

	t.Run("unknown project falls back to global workspace", func(t *testing.T) {
		if got := resolveProjectWorkspaceDir(db, 904); got != "" {
			t.Fatalf("resolveProjectWorkspaceDir = %q, want empty (fail closed)", got)
		}
	})
}

// captureOpenHandsLifecycle 模拟 OpenHands 全生命周期：
// POST /api/conversations 建会话（捕获 payload）、GET /api/conversations/:id 轮询执行状态、
// GET /api/conversations/:id/events/search 取 agent 回复。
func captureOpenHandsLifecycle(t *testing.T, payload *map[string]any) *httptest.Server {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodPost && r.URL.Path == "/api/conversations":
			var body map[string]any
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
				t.Errorf("decode payload: %v", err)
			}
			*payload = body
			w.WriteHeader(http.StatusCreated)
			_, _ = w.Write([]byte(`{"id":"conv-42"}`))
		case r.Method == http.MethodGet && r.URL.Path == "/api/conversations/conv-42":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"execution_status":"finished"}`))
		case r.Method == http.MethodGet && strings.HasPrefix(r.URL.Path, "/api/conversations/conv-42/events/search"):
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"items":[{"id":"e1","source":"agent","llm_message":{"content":[{"text":"已定位到导出相关代码。 [confidence:0.90]"}]}}]}`))
		default:
			t.Errorf("unexpected request %s %s", r.Method, r.URL.Path)
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	t.Cleanup(server.Close)
	return server
}

// TestCallOpenHandsAgentForChatThreadsWorkingDir 验证 chat 链路把 workingDir 透传到
// OpenHands 建会话 payload 的 workspace.working_dir，且 confidence/structured 解析仍正确。
// callOpenHandsAgentForChat 不使用 gin.Context，传 nil 即可。
func TestCallOpenHandsAgentForChatThreadsWorkingDir(t *testing.T) {
	t.Setenv("LLM_API_KEY", "test-key")

	var payload map[string]any
	server := captureOpenHandsLifecycle(t, &payload)

	agent := &OpenHandsAgent{URL: server.URL, APIKey: "k"}
	resp, err := callOpenHandsAgentForChat(nil, agent, "导出乱码", "", nil, nil, "/data/repos/11")
	if err != nil {
		t.Fatalf("callOpenHandsAgentForChat: %v", err)
	}

	workspace, ok := payload["workspace"].(map[string]any)
	if !ok {
		t.Fatalf("payload workspace missing: %#v", payload)
	}
	if got := workspace["working_dir"]; got != "/data/repos/11" {
		t.Fatalf("working_dir = %v, want /data/repos/11", got)
	}
	if resp.Confidence != 0.90 {
		t.Fatalf("confidence = %v, want 0.90", resp.Confidence)
	}
	if resp.NeedCollect {
		t.Fatalf("need_collect = true, want false")
	}
}
