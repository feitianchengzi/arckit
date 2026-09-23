package database

import (
	"os"
	"strings"
	"testing"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// 知识库检索"未命中"的结构性缺口：Migrate 从不建 code_index.code_chunks，
// SQL 迁移文件也从未被应用。检索与索引写入全部落空，前端只能显示"未命中"。
func TestMigrateCreatesCodeIndexChunksTable(t *testing.T) {
	dsn := strings.TrimSpace(os.Getenv("WORKSHOP_TEST_POSTGRES_DSN"))
	if dsn == "" {
		t.Skip("WORKSHOP_TEST_POSTGRES_DSN is not configured")
	}

	admin, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: logger.Discard})
	if err != nil {
		t.Fatalf("connect: %v", err)
	}

	// 模拟坏环境：表缺失（线上真实状态）。与 handler 包并行测试共享物理表，
	// 必须持排他 DDL 锁，否则 CREATE/RENAME 互相踩踏（duplicate key / 假未命中）。
	if err := WithKnowledgeDDLLock(admin, func() error {
		if err := admin.Exec(`DROP TABLE IF EXISTS code_index.code_chunks`).Error; err != nil {
			return err
		}
		if err := admin.Exec(`CREATE SCHEMA IF NOT EXISTS code_index`).Error; err != nil {
			return err
		}
		if err := Migrate(admin); err != nil {
			return err
		}
		return nil
	}); err != nil {
		t.Fatalf("locked drop+migrate: %v", err)
	}

	var regclass *string
	if err := admin.Raw(`SELECT to_regclass('code_index.code_chunks')`).Scan(&regclass).Error; err != nil {
		t.Fatalf("query to_regclass: %v", err)
	}
	if regclass == nil || *regclass != "code_index.code_chunks" {
		t.Fatalf("Migrate 后 code_index.code_chunks 仍不存在: %v", regclass)
	}
}

// KnowledgeSource 不在 AutoMigrate 列表，索引状态无处落库。
func TestMigrateCreatesKnowledgeSourceTable(t *testing.T) {
	dsn := strings.TrimSpace(os.Getenv("WORKSHOP_TEST_POSTGRES_DSN"))
	if dsn == "" {
		t.Skip("WORKSHOP_TEST_POSTGRES_DSN is not configured")
	}

	admin, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: logger.Discard})
	if err != nil {
		t.Fatalf("connect: %v", err)
	}

	if err := WithKnowledgeDDLLock(admin, func() error {
		if err := admin.Exec(`DROP TABLE IF EXISTS knowledge_sources`).Error; err != nil {
			return err
		}
		return Migrate(admin)
	}); err != nil {
		t.Fatalf("locked drop+migrate knowledge_sources: %v", err)
	}

	var exists bool
	if err := admin.Raw(`SELECT to_regclass('knowledge_sources') IS NOT NULL`).Scan(&exists).Error; err != nil {
		t.Fatalf("query: %v", err)
	}
	if !exists {
		t.Fatal("Migrate 后 knowledge_sources 仍不存在")
	}
}
