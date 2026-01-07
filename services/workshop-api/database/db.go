package database

import (
	"fmt"
	"log"
	"os"

	"todo/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

// InitDB 初始化数据库连接
func InitDB() error {
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
		password = "postgres"
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

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// 自动迁移（创建表结构）
	err = DB.AutoMigrate(
		&models.User{},
		&models.Project{},
		&models.ProjectMember{},
		&models.ProjectInvitation{},
		&models.Task{},
	)
	if err != nil {
		return fmt.Errorf("failed to auto migrate: %w", err)
	}

	// 修复外键约束（GORM AutoMigrate 创建的约束可能不正确）
	log.Println("开始修复外键约束...")
	err = fixForeignKeyConstraints(DB)
	if err != nil {
		return fmt.Errorf("failed to fix foreign key constraints: %w", err)
	}
	log.Println("外键约束修复完成")

	log.Println("Database connected and migrated successfully with correct cascade delete constraints")
	return nil
}

// fixForeignKeyConstraints 修复所有外键约束，确保包含正确的级联删除规则
func fixForeignKeyConstraints(db *gorm.DB) error {
	// 1. 查询并删除所有现有的外键约束
	log.Println("查询并删除所有现有外键约束...")

	// 查询所有外键约束
	type ForeignKeyInfo struct {
		ConstraintName string
		TableName      string
		ColumnName     string
	}

	var fkConstraints []ForeignKeyInfo
	query := `
		SELECT
			tc.constraint_name,
			kcu.table_name,
			kcu.column_name
		FROM information_schema.table_constraints tc
		JOIN information_schema.key_column_usage kcu
			ON tc.constraint_name = kcu.constraint_name
		WHERE tc.constraint_type = 'FOREIGN KEY'
		ORDER BY kcu.table_name, kcu.column_name
	`

	if err := db.Raw(query).Scan(&fkConstraints).Error; err != nil {
		return fmt.Errorf("查询外键约束失败: %w", err)
	}

	// 删除所有找到的外键约束
	for _, fk := range fkConstraints {
		dropSQL := fmt.Sprintf("ALTER TABLE %s DROP CONSTRAINT IF EXISTS %s", fk.TableName, fk.ConstraintName)
		if err := db.Exec(dropSQL).Error; err != nil {
			return fmt.Errorf("删除约束 %s.%s (约束名: %s) 失败: %w", fk.TableName, fk.ColumnName, fk.ConstraintName, err)
		}
		log.Printf("  删除: %s.%s -> %s", fk.TableName, fk.ColumnName, fk.ConstraintName)
	}

	// 2. 创建正确的外键约束
	log.Println("创建正确的外键约束...")
	correctConstraints := []struct {
		sql      string
		table    string
		column   string
		expected string
	}{
		// ProjectMembers
		{
			"ALTER TABLE project_members ADD CONSTRAINT fk_project_members_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE RESTRICT",
			"project_members", "project_id", "CASCADE",
		},
		{
			"ALTER TABLE project_members ADD CONSTRAINT fk_project_members_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT",
			"project_members", "user_id", "CASCADE",
		},

		// Tasks
		{
			"ALTER TABLE tasks ADD CONSTRAINT fk_tasks_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE",
			"tasks", "project_id", "CASCADE",
		},
		{
			"ALTER TABLE tasks ADD CONSTRAINT fk_tasks_father_id FOREIGN KEY (father_id) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE",
			"tasks", "father_id", "CASCADE",
		},
		{
			"ALTER TABLE tasks ADD CONSTRAINT fk_tasks_creator_id FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT",
			"tasks", "creator_id", "RESTRICT",
		},
		{
			"ALTER TABLE tasks ADD CONSTRAINT fk_tasks_executor_id FOREIGN KEY (executor_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE RESTRICT",
			"tasks", "executor_id", "SET NULL",
		},

		// ProjectInvitations
		{
			"ALTER TABLE project_invitations ADD CONSTRAINT fk_project_invitations_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE",
			"project_invitations", "project_id", "CASCADE",
		},
		{
			"ALTER TABLE project_invitations ADD CONSTRAINT fk_project_invitations_inviter_id FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT",
			"project_invitations", "inviter_id", "RESTRICT",
		},

		// Projects
		{
			"ALTER TABLE projects ADD CONSTRAINT fk_projects_creator_id FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT",
			"projects", "creator_id", "RESTRICT",
		},
	}

	for _, constraint := range correctConstraints {
		if err := db.Exec(constraint.sql).Error; err != nil {
			return fmt.Errorf("创建约束 %s.%s 失败: %w", constraint.table, constraint.column, err)
		}
		log.Printf("  创建: %s.%s -> %s", constraint.table, constraint.column, constraint.expected)
	}

	return nil
}

// GetDB 获取数据库连接
func GetDB() *gorm.DB {
	return DB
}
