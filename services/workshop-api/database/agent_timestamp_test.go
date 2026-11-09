package database

import (
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"os"
	"testing"
	"time"
)

func TestLegacyAgentTimestampsPreserveInstants(t *testing.T) {
	dsn := os.Getenv("WORKSHOP_TEST_POSTGRES_DSN")
	if dsn == "" {
		t.Skip("WORKSHOP_TEST_POSTGRES_DSN is not configured")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	tx := db.Begin()
	defer tx.Rollback()
	schema := "agent_time_test_" + time.Now().Format("150405000000000")
	if err := tx.Exec("CREATE SCHEMA " + schema).Error; err != nil {
		t.Fatal(err)
	}
	if err := tx.Exec("SET LOCAL search_path TO " + schema).Error; err != nil {
		t.Fatal(err)
	}
	for _, statement := range []string{
		`CREATE TABLE agent_message_records (id int, created_at timestamp, delete_at timestamp)`,
		`CREATE TABLE agent_conversations (created_at timestamp, updated_at timestamp, delete_at timestamp)`,
		`INSERT INTO agent_message_records VALUES (1, '2026-11-09 21:54:48', NULL)`,
	} {
		if err := tx.Exec(statement).Error; err != nil {
			t.Fatal(err)
		}
	}
	t.Setenv("LEGACY_AGENT_TIMEZONE", "")
	if err := migrateAgentTimestamps(tx); err == nil {
		t.Fatal("must require original timezone")
	}
	t.Setenv("LEGACY_AGENT_TIMEZONE", "Asia/Shanghai")
	if err := migrateAgentTimestamps(tx); err != nil {
		t.Fatal(err)
	}
	if err := migrateAgentTimestamps(tx); err != nil {
		t.Fatalf("not idempotent: %v", err)
	}
	// A UTC reader must see the same instant as a Beijing writer.
	if err := tx.Exec(`SET LOCAL TIME ZONE 'UTC'`).Error; err != nil {
		t.Fatal(err)
	}
	var timestamp time.Time
	if err := tx.Raw(`SELECT created_at FROM agent_message_records WHERE id=1`).Scan(&timestamp).Error; err != nil {
		t.Fatal(err)
	}
	expected := time.Date(2026, 11, 9, 13, 54, 48, 0, time.UTC)
	if !timestamp.Equal(expected) {
		t.Fatalf("got %s, want %s", timestamp, expected)
	}
	if err := tx.Exec(`INSERT INTO agent_message_records (id,created_at) VALUES (2, '2026-11-09T22:00:00+08:00')`).Error; err != nil {
		t.Fatal(err)
	}
	if err := tx.Raw(`SELECT created_at FROM agent_message_records WHERE id=2`).Scan(&timestamp).Error; err != nil {
		t.Fatal(err)
	}
	if !timestamp.Equal(time.Date(2026, 11, 9, 14, 0, 0, 0, time.UTC)) {
		t.Fatalf("new timestamp shifted: %s", timestamp)
	}
}
