package database

import (
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	"todo/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func TestPostgresMigrationAddsRequiredEventSchemaWithoutChangingExistingData(t *testing.T) {
	dsn := os.Getenv("WORKSHOP_TEST_POSTGRES_DSN")
	if dsn == "" {
		t.Skip("WORKSHOP_TEST_POSTGRES_DSN is not configured")
	}
	admin, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	schema := fmt.Sprintf("workshop_migration_%d_%d", os.Getpid(), time.Now().UnixNano())
	if err := admin.Exec(`CREATE SCHEMA "` + schema + `"`).Error; err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = admin.Exec(`DROP SCHEMA "` + schema + `" CASCADE`).Error })

	db, err := gorm.Open(postgres.Open(dsn+" search_path="+schema), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(
		&models.User{},
		&models.Organization{},
		&models.OrganizationMember{},
		&models.OrganizationInvitation{},
		&models.Project{},
		&models.ProjectMember{},
		&models.ProjectInvitation{},
		&models.Task{},
		&models.Tag{},
		&models.TaskAttachment{},
		&models.Feedback{},
		&models.ProjectFeedbackAccessKey{},
	); err != nil {
		t.Fatal(err)
	}
	user := models.User{UUID: "11111111-1111-1111-1111-111111111111", Username: "migration-guard"}
	if err := db.Create(&user).Error; err != nil {
		t.Fatal(err)
	}
	if err := ValidateRuntimeSchema(db); err == nil {
		t.Fatal("legacy schema unexpectedly satisfied the required event contract")
	}

	if err := Migrate(db); err != nil {
		t.Fatal(err)
	}
	if err := ValidateRuntimeSchema(db); err != nil {
		t.Fatal(err)
	}
	var count int64
	if err := db.Model(&models.User{}).Where("id = ?", user.ID).Count(&count).Error; err != nil || count != 1 {
		t.Fatalf("existing business row changed during migration: count=%d err=%v", count, err)
	}
	var indexDefinition string
	if err := db.Raw("SELECT indexdef FROM pg_indexes WHERE schemaname = ? AND tablename = 'project_events' AND indexname = 'idx_project_events_project_cursor'", schema).Scan(&indexDefinition).Error; err != nil {
		t.Fatal(err)
	}
	normalizedIndex := strings.ReplaceAll(strings.ToLower(indexDefinition), " ", "")
	if !strings.Contains(normalizedIndex, "(project_id,id)") {
		t.Fatalf("project cursor index is not composite: %s", indexDefinition)
	}
}
