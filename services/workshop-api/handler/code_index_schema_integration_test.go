package handler

import (
	"encoding/json"
	"os"
	"strings"
	"testing"

	"todo/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// 端到端验收发现的缺陷回归测试：code_chunks 表位于 code_index schema，
// 但 CodeChunk.TableName 未带 schema 限定，写入会落到不存在的 public.code_chunks
// 且错误被吞掉，导致代码索引永远无法持久化、检索永远为空。
func TestCodeIndexChunksPersistToCodeIndexSchema(t *testing.T) {
	dsn := strings.TrimSpace(os.Getenv("WORKSHOP_TEST_POSTGRES_DSN"))
	if dsn == "" {
		t.Skip("WORKSHOP_TEST_POSTGRES_DSN is not configured")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: logger.Discard})
	if err != nil {
		t.Fatalf("connect test postgres: %v", err)
	}

	if err := db.Exec(`CREATE SCHEMA IF NOT EXISTS code_index`).Error; err != nil {
		t.Fatalf("create code_index schema: %v", err)
	}
	// 只确保表存在，绝不 DROP 共享表（DROP 曾把线上检索表删没）。
	if err := db.Exec(`CREATE TABLE IF NOT EXISTS code_index.code_chunks (
		id BIGSERIAL PRIMARY KEY,
		project_id BIGINT NOT NULL,
		source_id BIGINT NOT NULL,
		file_path TEXT NOT NULL,
		symbol_type VARCHAR(32),
		symbol_name VARCHAR(200),
		start_line INT NOT NULL,
		end_line INT NOT NULL,
		chunk_text TEXT NOT NULL,
		embedding TEXT NOT NULL,
		commit_sha VARCHAR(64),
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	)`).Error; err != nil {
		t.Fatalf("ensure code_chunks: %v", err)
	}
	_ = db.Exec(`CREATE INDEX IF NOT EXISTS idx_code_chunks_project_file ON code_index.code_chunks(project_id, file_path)`).Error
	_ = db.Exec(`DELETE FROM code_index.code_chunks WHERE project_id = 9901`).Error

	chunk := models.CodeChunk{
		ProjectID:  9901,
		SourceID:   1,
		FilePath:   "src/auth.go",
		SymbolType: models.CodeChunkSymbolFunction,
		SymbolName: "LoginUser",
		StartLine:  3,
		EndLine:    3,
		ChunkText:  "func LoginUser(name string) bool { return name != \"\" }",
	}
	emb := make([]float64, 4)
	for i := range emb {
		emb[i] = float64(i) / 4
	}
	embJSON, _ := json.Marshal(emb)
	chunk.Embedding = string(embJSON)

	// 与 runCodeIndexPipeline 相同的写入路径（错误不得被吞掉）。
	if err := db.Create(&chunk).Error; err != nil {
		t.Fatalf("persist code chunk: %v", err)
	}

	results, searchErr := searchCodeChunksBySQL(db, 9901, "LoginUser", 5)
	if searchErr != nil {
		t.Fatalf("search after persist must not error: %v", searchErr)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 search hit after persist, got %d", len(results))
	}
	if results[0].SymbolName != "LoginUser" {
		t.Fatalf("expected symbol LoginUser, got %q", results[0].SymbolName)
	}

	var count int64
	if err := db.Raw(`SELECT COUNT(*) FROM code_index.code_chunks WHERE project_id = ?`, 9901).Scan(&count).Error; err != nil {
		t.Fatalf("count chunks in code_index schema: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected 1 row in code_index.code_chunks, got %d", count)
	}

	// 不得 DROP 共享库的 code_index.code_chunks：此前 cleanup 删表导致线上检索表缺失。
	// 只清理本测试写入的行，保留表结构。
	t.Cleanup(func() {
		_ = db.Exec(`DELETE FROM code_index.code_chunks WHERE project_id = 9901`).Error
	})
}
