package models

import (
	"testing"
)

func TestKnowledgeWorkspaceScope(t *testing.T) {
	cases := []struct {
		name      string
		scope     string
		wantValid bool
	}{
		{"project scope is valid", KnowledgeScopeProject, true},
		{"public scope is valid", KnowledgeScopePublic, true},
		{"empty scope is invalid", "", false},
		{"unknown scope is invalid", "invalid", false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := IsValidKnowledgeScope(tc.scope); got != tc.wantValid {
				t.Errorf("IsValidKnowledgeScope(%q) = %v, want %v", tc.scope, got, tc.wantValid)
			}
		})
	}
}

func TestKnowledgeSourceType(t *testing.T) {
	cases := []struct {
		name      string
		sourceType string
		wantValid bool
	}{
		{"code repo is valid", KnowledgeSourceTypeCodeRepo, true},
		{"project doc is valid", KnowledgeSourceTypeProjectDoc, true},
		{"faq is valid", KnowledgeSourceTypeFAQ, true},
		{"public knowledge is valid", KnowledgeSourceTypePublicKnowledge, true},
		{"empty type is invalid", "", false},
		{"unknown type is invalid", "unknown", false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := IsValidKnowledgeSourceType(tc.sourceType); got != tc.wantValid {
				t.Errorf("IsValidKnowledgeSourceType(%q) = %v, want %v", tc.sourceType, got, tc.wantValid)
			}
		})
	}
}

func TestKnowledgeSourceStatus(t *testing.T) {
	cases := []struct {
		name      string
		status    string
		wantValid bool
	}{
		{"synced is valid", KnowledgeSourceStatusSynced, true},
		{"indexing is valid", KnowledgeSourceStatusIndexing, true},
		{"not synced is valid", KnowledgeSourceStatusNotSynced, true},
		{"sync failed is valid", KnowledgeSourceStatusSyncFailed, true},
		{"empty status is invalid", "", false},
		{"unknown status is invalid", "bad", false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := IsValidKnowledgeSourceStatus(tc.status); got != tc.wantValid {
				t.Errorf("IsValidKnowledgeSourceStatus(%q) = %v, want %v", tc.status, got, tc.wantValid)
			}
		})
	}
}

func TestCodeChunkSymbolType(t *testing.T) {
	cases := []struct {
		name      string
		symType   string
		wantValid bool
	}{
		{"function is valid", CodeChunkSymbolFunction, true},
		{"class is valid", CodeChunkSymbolClass, true},
		{"method is valid", CodeChunkSymbolMethod, true},
		{"module is valid", CodeChunkSymbolModule, true},
		{"empty is invalid", "", false},
		{"unknown is invalid", "variable", false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := IsValidCodeChunkSymbolType(tc.symType); got != tc.wantValid {
				t.Errorf("IsValidCodeChunkSymbolType(%q) = %v, want %v", tc.symType, got, tc.wantValid)
			}
		})
	}
}

func TestKnowledgeWorkspaceTableName(t *testing.T) {
	ws := KnowledgeWorkspace{}
	if got := ws.TableName(); got != "knowledge_workspaces" {
		t.Errorf("TableName() = %q, want %q", got, "knowledge_workspaces")
	}
}

func TestKnowledgeSourceTableName(t *testing.T) {
	src := KnowledgeSource{}
	if got := src.TableName(); got != "knowledge_sources" {
		t.Errorf("TableName() = %q, want %q", got, "knowledge_sources")
	}
}

func TestCodeChunkTableName(t *testing.T) {
	chunk := CodeChunk{}
	// code_chunks 建在独立 code_index schema，表名必须带 schema 限定，
	// 否则 GORM 写入 public.code_chunks 报错且索引数据永远无法落库。
	if got := chunk.TableName(); got != "code_index.code_chunks" {
		t.Errorf("TableName() = %q, want %q", got, "code_index.code_chunks")
	}
}
