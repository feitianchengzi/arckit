package models

import (
	"time"

	"gorm.io/gorm"
)

// KnowledgeWorkspace 知识库工作空间绑定表
// 每个项目绑定一个 WeKnora workspace（客户私有）或共享产品 workspace
type KnowledgeWorkspace struct {
	ID                uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID         *uint          `json:"project_id,omitempty" gorm:"uniqueIndex:uniq_knowledge_workspace_project,where:delete_at IS NULL"`
	WeknoraWorkspaceID string        `json:"weknora_workspace_id" gorm:"type:varchar(128);not null"`
	ScopedAPIKey      string         `json:"scoped_api_key" gorm:"type:varchar(500);not null"` // AES-256 加密存储
	Scope             string         `json:"scope" gorm:"type:varchar(32);not null;index"`
	CreatedAt         time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt         gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index;column:delete_at"`

	Project *Project `json:"project,omitempty" gorm:"foreignKey:ProjectID;references:ID"`
}

func (KnowledgeWorkspace) TableName() string {
	return "knowledge_workspaces"
}

// KnowledgeScope 常量
const (
	KnowledgeScopeProject = "project" // 客户私有 workspace
	KnowledgeScopePublic  = "public"  // 共享产品 workspace
)

// IsValidKnowledgeScope 验证 scope 是否有效
func IsValidKnowledgeScope(scope string) bool {
	switch scope {
	case KnowledgeScopeProject, KnowledgeScopePublic:
		return true
	default:
		return false
	}
}

// KnowledgeSource 知识源表
// 管理各类知识源（代码仓库、项目文档、FAQ、公共知识）的同步状态
type KnowledgeSource struct {
	ID             uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID      *uint          `json:"project_id,omitempty" gorm:"index;uniqueIndex:uniq_knowledge_source_project_name,where:delete_at IS NULL"`
	Name           string         `json:"name" gorm:"type:varchar(200);not null;uniqueIndex:uniq_knowledge_source_project_name,where:delete_at IS NULL"`
	SourceType     string         `json:"source_type" gorm:"type:varchar(32);not null;index"`
	Status         string         `json:"status" gorm:"type:varchar(32);not null;default:'not_synced';index"`
	Scope          string         `json:"scope" gorm:"type:varchar(32);not null;index"`
	// 代码仓库特有字段
	RepoURL        *string        `json:"repo_url,omitempty" gorm:"type:varchar(500)"`
	Branch         *string        `json:"branch,omitempty" gorm:"type:varchar(100)"`
	LastIndexedAt  *time.Time     `json:"last_indexed_at,omitempty"`
	LastIndexError *string        `json:"last_index_error,omitempty" gorm:"type:text"`
	// WeKnora 连接器特有字段
	WeknoraConnectorID *string     `json:"weknora_connector_id,omitempty" gorm:"type:varchar(128)"`
	CreatedAt      time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt      time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt      gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index;column:delete_at"`

	Project *Project `json:"project,omitempty" gorm:"foreignKey:ProjectID;references:ID"`
}

func (KnowledgeSource) TableName() string {
	return "knowledge_sources"
}

// KnowledgeSourceType 常量
const (
	KnowledgeSourceTypeCodeRepo        = "code_repo"
	KnowledgeSourceTypeProjectDoc      = "project_doc"
	KnowledgeSourceTypeFAQ             = "faq"
	KnowledgeSourceTypePublicKnowledge = "public_knowledge"
)

// IsValidKnowledgeSourceType 验证知识源类型
func IsValidKnowledgeSourceType(t string) bool {
	switch t {
	case KnowledgeSourceTypeCodeRepo,
		KnowledgeSourceTypeProjectDoc,
		KnowledgeSourceTypeFAQ,
		KnowledgeSourceTypePublicKnowledge:
		return true
	default:
		return false
	}
}

// KnowledgeSourceStatus 常量
const (
	KnowledgeSourceStatusSynced    = "synced"
	KnowledgeSourceStatusIndexing  = "indexing"
	KnowledgeSourceStatusNotSynced = "not_synced"
	KnowledgeSourceStatusSyncFailed = "sync_failed"
)

// IsValidKnowledgeSourceStatus 验证知识源状态
func IsValidKnowledgeSourceStatus(s string) bool {
	switch s {
	case KnowledgeSourceStatusSynced,
		KnowledgeSourceStatusIndexing,
		KnowledgeSourceStatusNotSynced,
		KnowledgeSourceStatusSyncFailed:
		return true
	default:
		return false
	}
}

// CodeChunk 代码语义分块表
// 存储 tree-sitter 分块后的代码片段及其 embedding 向量
type CodeChunk struct {
	ID         uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID  uint      `json:"project_id" gorm:"not null;index;uniqueIndex:idx_code_chunks_project_file,priority:1"`
	SourceID   uint      `json:"source_id" gorm:"not null;index"`
	FilePath   string    `json:"file_path" gorm:"type:text;not null;uniqueIndex:idx_code_chunks_project_file,priority:2"`
	SymbolType string    `json:"symbol_type" gorm:"type:varchar(32);index"`
	SymbolName string    `json:"symbol_name" gorm:"type:varchar(200);index"`
	StartLine  int       `json:"start_line" gorm:"not null"`
	EndLine    int       `json:"end_line" gorm:"not null"`
	ChunkText  string    `json:"chunk_text" gorm:"type:text;not null"`
	Embedding  string    `json:"embedding" gorm:"type:text;not null"` // pgvector VECTOR(1024) 序列化为 text
	CommitSHA  string    `json:"commit_sha" gorm:"type:varchar(64)"`
	CreatedAt  time.Time `json:"created_at" gorm:"autoCreateTime"`
}

func (CodeChunk) TableName() string {
	// 迁移把 code_chunks 建在独立 code_index schema（与业务表隔离），
	// 必须带 schema 限定，否则 GORM 会写入 public.code_chunks 并报错。
	return "code_index.code_chunks"
}

// CodeChunkSymbolType 常量
const (
	CodeChunkSymbolFunction = "function"
	CodeChunkSymbolClass    = "class"
	CodeChunkSymbolMethod   = "method"
	CodeChunkSymbolModule   = "module"
)

// IsValidCodeChunkSymbolType 验证代码分块符号类型
func IsValidCodeChunkSymbolType(t string) bool {
	switch t {
	case CodeChunkSymbolFunction,
		CodeChunkSymbolClass,
		CodeChunkSymbolMethod,
		CodeChunkSymbolModule:
		return true
	default:
		return false
	}
}
