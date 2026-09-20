package handler

import (
	"encoding/json"
	"fmt"
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
	if err := db.Exec(`DROP TABLE IF EXISTS code_index.code_chunks`).Error; err != nil {
		t.Fatalf("drop stale table: %v", err)
	}
	if err := db.AutoMigrate(&models.CodeChunk{}); err != nil {
		t.Fatalf("migrate code_chunks into code_index schema: %v", err)
	}

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

	results := searchCodeChunksBySQL(db, 9901, "LoginUser", 5)
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

	t.Cleanup(func() {
		_ = db.Exec(fmt.Sprintf(`DROP TABLE IF EXISTS code_index.code_chunks`)).Error
	})
}
