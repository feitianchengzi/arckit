package database

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"todo/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB
var connectionString string

func getEnvInt(key string, def int) int {
	raw := os.Getenv(key)
	if raw == "" {
		return def
	}
	val, err := strconv.Atoi(raw)
	if err != nil {
		return def
	}
	return val
}

func getEnvDuration(key string, def time.Duration) time.Duration {
	raw := os.Getenv(key)
	if raw == "" {
		return def
	}
	val, err := time.ParseDuration(raw)
	if err != nil {
		return def
	}
	return val
}

// InitDB 初始化数据库连接
func InitDB() error {
	return initDB(false)
}

// InitDBForMigration connects, runs the complete idempotent schema migration,
// and validates the runtime-required event schema even when automatic
// migration is disabled for normal service startup.
func InitDBForMigration() error {
	return initDB(true)
}

func initDB(forceMigration bool) error {
	// 从环境变量读取数据库配置
	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "localhost"
	}
	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}
	user := os.Getenv("DB_USER")
	if user == "" {
		user = "postgres"
	}
	password := os.Getenv("DB_PASSWORD")
	if password == "" {
		if forceMigration {
			password = "postgres"
		} else {
			return fmt.Errorf("DB_PASSWORD is required in production; set it in environment")
		}
	}
	dbname := os.Getenv("DB_NAME")
	if dbname == "" {
		dbname = "todo"
	}
	sslmode := os.Getenv("DB_SSLMODE")
	if sslmode == "" {
		sslmode = "disable"
	}

	// 构建 DSN
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbname, sslmode)
	connectionString = dsn

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// 获取底层 sql.DB 连接池并配置连接池参数
	// RDS 最大连接数 400，预留 1/4 给其他业务，可用 300 连接
	// 2核4G 资源，配置合理的连接池大小
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	// 连接池参数（支持环境变量覆盖）
	maxOpenConns := getEnvInt("DB_MAX_OPEN_CONNS", 200)
	maxIdleConns := getEnvInt("DB_MAX_IDLE_CONNS", 50)
	connMaxLifetime := getEnvDuration("DB_CONN_MAX_LIFETIME", time.Hour)
	connMaxIdleTime := getEnvDuration("DB_CONN_MAX_IDLE_TIME", 30*time.Minute)

	// 设置最大打开连接数
	sqlDB.SetMaxOpenConns(maxOpenConns)
	// 设置最大空闲连接数
	sqlDB.SetMaxIdleConns(maxIdleConns)
	// 设置连接最大生命周期
	sqlDB.SetConnMaxLifetime(connMaxLifetime)
	// 设置空闲连接最大空闲时间
	sqlDB.SetConnMaxIdleTime(connMaxIdleTime)

	// 测试连接池是否正常
	if err := sqlDB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	log.Printf("Database connection pool configured: MaxOpenConns=%d, MaxIdleConns=%d, ConnMaxLifetime=%s, ConnMaxIdleTime=%s", maxOpenConns, maxIdleConns, connMaxLifetime, connMaxIdleTime)
	log.Printf("RDS connection limit: 400 (available: 300 for this service, reserved: 100 for other services)")

	autoMigrateRaw := strings.ToLower(strings.TrimSpace(os.Getenv("DB_AUTO_MIGRATE")))
	autoMigrate := autoMigrateRaw == "" || autoMigrateRaw == "true" || autoMigrateRaw == "1" || autoMigrateRaw == "yes"
	if autoMigrate || forceMigration {
		if err = Migrate(DB); err != nil {
			return fmt.Errorf("failed to auto migrate: %w", err)
		}
		if err := backfillFeedbackTriageStatuses(DB); err != nil {
			return fmt.Errorf("failed to backfill feedback triage statuses: %w", err)
		}
		log.Println("Database connected and migrated successfully with correct cascade delete constraints")
	} else {
		log.Println("Database connected successfully (auto migrate disabled)")
	}
	if err := ValidateRuntimeSchema(DB); err != nil {
		return fmt.Errorf("database runtime schema is not ready: %w", err)
	}
	return nil
}

// Migrate applies the complete idempotent schema contract. It is exported so
// deployment automation can run migrations before replacing a serving binary.
func Migrate(db *gorm.DB) error {
	if db == nil {
		return gorm.ErrInvalidDB
	}
	// 知识库三张表用幂等 raw SQL：knowledge_workspaces 既有列级 UNIQUE 约束
	// 与模型 partial uniqueIndex 冲突时 GORM AutoMigrate 会 DROP 不存在的
	// uni_knowledge_workspaces_project_id 并整体失败，连带 code_chunks 建不出来。
	if err := WithKnowledgeDDLLock(db, func() error {
		return ensureKnowledgeSchema(db)
	}); err != nil {
		return err
	}
	return db.AutoMigrate(
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
		&models.FeedbackMessage{},
		&models.FeedbackMessageAttachment{},
		&models.FeedbackNotification{},
		&models.FeedbackSubscription{},
		&models.FeedbackEmailDelivery{},
		&models.FeedbackTaskLink{},
		&models.ProjectFeedbackAccessKey{},
		&models.ProjectEvent{},
		&models.TaskNotificationPreference{},
	)
}

// ensureKnowledgeSchema 幂等创建知识库表/索引，并修复历史约束冲突。
// 不依赖 AutoMigrate，保证任意既有库状态下检索链路可用。
func ensureKnowledgeSchema(db *gorm.DB) error {
	stmts := []string{
		`CREATE SCHEMA IF NOT EXISTS code_index`,
		`CREATE TABLE IF NOT EXISTS knowledge_workspaces (
			id BIGSERIAL PRIMARY KEY,
			project_id BIGINT,
			weknora_workspace_id VARCHAR(128) NOT NULL,
			scoped_api_key VARCHAR(500) NOT NULL,
			scope VARCHAR(32) NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			delete_at TIMESTAMPTZ
		)`,
		// 历史列级 UNIQUE 无 WHERE delete_at IS NULL，与模型 partial uniqueIndex 冲突。
		`ALTER TABLE knowledge_workspaces DROP CONSTRAINT IF EXISTS knowledge_workspaces_project_id_key`,
		`ALTER TABLE knowledge_workspaces DROP CONSTRAINT IF EXISTS uni_knowledge_workspaces_project_id`,
		`CREATE UNIQUE INDEX IF NOT EXISTS uniq_knowledge_workspace_project ON knowledge_workspaces(project_id) WHERE delete_at IS NULL`,
		`CREATE INDEX IF NOT EXISTS idx_knowledge_workspaces_project_id ON knowledge_workspaces(project_id)`,
		`CREATE INDEX IF NOT EXISTS idx_knowledge_workspaces_scope ON knowledge_workspaces(scope)`,
		`CREATE INDEX IF NOT EXISTS idx_knowledge_workspaces_deleted_at ON knowledge_workspaces(delete_at)`,
		`CREATE TABLE IF NOT EXISTS knowledge_sources (
			id BIGSERIAL PRIMARY KEY,
			project_id BIGINT,
			name VARCHAR(200) NOT NULL,
			source_type VARCHAR(32) NOT NULL,
			status VARCHAR(32) NOT NULL DEFAULT 'not_synced',
			scope VARCHAR(32) NOT NULL,
			repo_url VARCHAR(500),
			branch VARCHAR(100),
			last_indexed_at TIMESTAMPTZ,
			last_index_error TEXT,
			weknora_connector_id VARCHAR(128),
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			delete_at TIMESTAMPTZ
		)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS uniq_knowledge_source_project_name ON knowledge_sources(project_id, name) WHERE delete_at IS NULL`,
		`CREATE INDEX IF NOT EXISTS idx_knowledge_sources_project_id ON knowledge_sources(project_id)`,
		`CREATE INDEX IF NOT EXISTS idx_knowledge_sources_source_type ON knowledge_sources(source_type)`,
		`CREATE INDEX IF NOT EXISTS idx_knowledge_sources_status ON knowledge_sources(status)`,
		`CREATE INDEX IF NOT EXISTS idx_knowledge_sources_scope ON knowledge_sources(scope)`,
		`CREATE INDEX IF NOT EXISTS idx_knowledge_sources_deleted_at ON knowledge_sources(delete_at)`,
		`CREATE TABLE IF NOT EXISTS code_index.code_chunks (
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
		)`,
		`CREATE INDEX IF NOT EXISTS idx_code_chunks_project_file ON code_index.code_chunks(project_id, file_path)`,
		`CREATE INDEX IF NOT EXISTS idx_code_chunks_symbol_type ON code_index.code_chunks(symbol_type)`,
		`CREATE INDEX IF NOT EXISTS idx_code_chunks_symbol_name ON code_index.code_chunks(symbol_name)`,
		`CREATE INDEX IF NOT EXISTS idx_code_chunks_source_id ON code_index.code_chunks(source_id)`,
	}
	for _, stmt := range stmts {
		if err := db.Exec(stmt).Error; err != nil {
			return fmt.Errorf("knowledge schema: %w (stmt: %s)", err, stmt)
		}
	}
	return nil
}

// ValidateRuntimeSchema fails closed when the durable event contract required
// by every project mutation is unavailable.
func ValidateRuntimeSchema(db *gorm.DB) error {
	if db == nil {
		return gorm.ErrInvalidDB
	}
	migrator := db.Migrator()
	if !migrator.HasTable(&models.ProjectEvent{}) {
		return fmt.Errorf("required table project_events is missing; run the migrate command before starting the service")
	}
	for _, column := range []string{"id", "schema_version", "project_id", "event", "data", "created_at"} {
		if !migrator.HasColumn(&models.ProjectEvent{}, column) {
			return fmt.Errorf("required project_events column %s is missing; run the migrate command before starting the service", column)
		}
	}
	if !migrator.HasIndex(&models.ProjectEvent{}, "idx_project_events_project_cursor") {
		return fmt.Errorf("required project event cursor index is missing; run the migrate command before starting the service")
	}
	emailNotificationsEnabled, _ := strconv.ParseBool(strings.TrimSpace(os.Getenv("FEEDBACK_EMAIL_NOTIFICATIONS_ENABLED")))
	if emailNotificationsEnabled {
		for _, model := range []interface{}{&models.FeedbackSubscription{}, &models.FeedbackEmailDelivery{}} {
			if !migrator.HasTable(model) {
				return fmt.Errorf("feedback email notification schema is missing; run the migrate command before enabling FEEDBACK_EMAIL_NOTIFICATIONS_ENABLED")
			}
		}
		if !migrator.HasIndex(&models.FeedbackSubscription{}, "uniq_feedback_subscription_project_user") ||
			!migrator.HasIndex(&models.FeedbackEmailDelivery{}, "uniq_feedback_email_delivery_message_user") {
			return fmt.Errorf("feedback email notification indexes are missing; run the migrate command before enabling FEEDBACK_EMAIL_NOTIFICATIONS_ENABLED")
		}
	}
	return nil
}

func backfillFeedbackTriageStatuses(db *gorm.DB) error {
	return db.Exec(`
		UPDATE feedbacks AS f
		SET triage_status = CASE
			WHEN EXISTS (
				SELECT 1
				FROM feedback_task_links AS link
				WHERE link.feedback_id = f.id
					AND link.is_primary = TRUE
					AND link.delete_at IS NULL
			) THEN 'accepted'
			WHEN f.status = 'ignored' THEN 'ignored'
			WHEN f.status IN ('accepted', 'converted', 'in_progress', 'completed', 'released') THEN 'accepted'
			ELSE 'pending'
		END
		WHERE COALESCE(NULLIF(BTRIM(f.triage_status), ''), 'pending') = 'pending'
			AND (
				f.status IN ('accepted', 'converted', 'in_progress', 'completed', 'released', 'ignored')
				OR EXISTS (
					SELECT 1
					FROM feedback_task_links AS link
					WHERE link.feedback_id = f.id
						AND link.is_primary = TRUE
						AND link.delete_at IS NULL
				)
			)
	`).Error
}

// GetDB 获取数据库连接
func GetDB() *gorm.DB {
	return DB
}

// ConnectionString returns the configured PostgreSQL DSN for dedicated
// LISTEN connections. It must never be logged because it contains credentials.
func ConnectionString() string { return connectionString }
