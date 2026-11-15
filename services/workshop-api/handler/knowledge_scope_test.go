package handler

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"todo/models"
)

func TestKnowledgeSourceRepositoryRequiresOwnMatchingRepository(t *testing.T) {
	project := uint(7)
	url, branch := "https://example.test/a.git", "main"
	src := models.KnowledgeSource{ProjectID: &project, Name: "selected", SourceType: models.KnowledgeSourceTypeCodeRepo, RepoURL: &url, Branch: &branch}
	repos := []CustomerCodeRepo{{ID: 1, ProjectID: 8, RepoURL: url, Branch: branch}, {ID: 2, ProjectID: 7, RepoURL: "https://example.test/b.git", Branch: branch}, {ID: 3, ProjectID: 7, RepoURL: url, Branch: "dev"}, {ID: 4, ProjectID: 7, RepoURL: url, Branch: branch}}
	got, err := knowledgeSourceRepository(src, repos)
	if err != nil || got.ID != 4 {
		t.Fatalf("selected=%+v err=%v", got, err)
	}
	for _, kind := range []string{models.KnowledgeSourceTypeFAQ, models.KnowledgeSourceTypeProjectDoc, models.KnowledgeSourceTypePublicKnowledge} {
		unsupported := src
		unsupported.SourceType = kind
		if _, err := knowledgeSourceRepository(unsupported, repos); err == nil {
			t.Fatalf("%s must not index unrelated code", kind)
		}
	}
	if _, err := knowledgeSourceRepository(src, nil); err == nil {
		t.Fatal("missing repo must not sync")
	}
	repos = append(repos, repos[3])
	if _, err := knowledgeSourceRepository(src, repos); err == nil {
		t.Fatal("ambiguous repo must not sync")
	}
}

func TestProjectRepositoryWorkspaceCoversAllOwnRepositories(t *testing.T) {
	root := t.TempDir()
	t.Setenv("OH_REPO_ROOT", root)
	first, second := t.TempDir(), t.TempDir()
	repos := []CustomerCodeRepo{{ID: 1, ProjectID: 7, RepoPath: first, Status: "ready"}, {ID: 2, ProjectID: 7, RepoPath: second, Status: "ready"}}
	workspace, err := projectRepositoryWorkspace(7, repos)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.HasPrefix(workspace, filepath.Join(root, ".agent-workspaces", "7")) {
		t.Fatalf("unscoped %s", workspace)
	}
	entries, err := os.ReadDir(workspace)
	if err != nil || len(entries) != 2 {
		t.Fatalf("entries=%v err=%v", entries, err)
	}
	for index, entry := range entries {
		path, err := filepath.EvalSymlinks(filepath.Join(workspace, entry.Name()))
		if err != nil {
			t.Fatal(err)
		}
		expected := []string{first, second}[index]
		expected, _ = filepath.EvalSymlinks(expected)
		if path != expected {
			t.Fatalf("mapping=%s want %s", path, expected)
		}
	}
	again, err := projectRepositoryWorkspace(7, repos)
	if err != nil || again != workspace {
		t.Fatalf("unstable mapping %s %v", again, err)
	}
	other := append([]CustomerCodeRepo(nil), repos...)
	other[1].ProjectID = 8
	if _, err := projectRepositoryWorkspace(7, other); err == nil {
		t.Fatal("cross-project repository accepted")
	}
	repos[1].Status = "syncing"
	if _, err := projectRepositoryWorkspace(7, repos); err == nil {
		t.Fatal("partial workspace accepted")
	}
}

func TestProjectRepositoryWorkspaceRejectsSharedAndMissingPaths(t *testing.T) {
	root := t.TempDir()
	t.Setenv("OH_REPO_ROOT", root)
	t.Setenv("OH_WORKSPACE_DIR", root)
	if _, err := projectRepositoryWorkspace(7, nil); err == nil {
		t.Fatal("missing repo accepted")
	}
	if _, err := projectRepositoryWorkspace(7, []CustomerCodeRepo{{ID: 1, ProjectID: 7, RepoPath: root, Status: "ready"}}); err == nil {
		t.Fatal("shared root accepted")
	}
	if _, err := projectRepositoryWorkspace(7, []CustomerCodeRepo{{ID: 1, ProjectID: 7, RepoPath: filepath.Join(root, "missing"), Status: "ready"}}); err == nil {
		t.Fatal("missing path accepted")
	}
}
