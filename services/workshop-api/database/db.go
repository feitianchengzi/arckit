package database

import (
	"fmt"
	"log"
	"os"
	"time"

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

	// 获取底层 sql.DB 连接池并配置连接池参数
	// RDS 最大连接数 400，预留 1/4 给其他业务，可用 300 连接
	// 2核4G 资源，配置合理的连接池大小
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	// 设置最大打开连接数：200
	// 充分利用可用的300连接，留100作为安全缓冲，避免连接耗尽
	// 如果应用服务器是多实例部署，需要根据实例数量调整（例如：2个实例各150）
	sqlDB.SetMaxOpenConns(200)

	// 设置最大空闲连接数：50
	// 保持一定数量的空闲连接可以快速响应请求，减少连接建立延迟
	// 通常设置为 MaxOpenConns 的 20-30% 较为合理
	sqlDB.SetMaxIdleConns(50)

	// 设置连接最大生命周期：1小时
	// 定期重新建立连接可以避免长时间连接可能导致的网络问题
	// 同时确保连接的健康状态，避免使用已失效的连接
	sqlDB.SetConnMaxLifetime(time.Hour)

	// 设置空闲连接最大空闲时间：30分钟
	// 及时回收长时间未使用的空闲连接，释放数据库和应用服务器的资源
	// 在低峰期可以自动缩减连接数，节省资源
	sqlDB.SetConnMaxIdleTime(30 * time.Minute)

	// 测试连接池是否正常
	if err := sqlDB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	log.Printf("Database connection pool configured: MaxOpenConns=200, MaxIdleConns=50, ConnMaxLifetime=1h, ConnMaxIdleTime=30m")
	log.Printf("RDS connection limit: 400 (available: 300 for this service, reserved: 100 for other services)")

	// 自动迁移（创建表结构）
	err = DB.AutoMigrate(
		&models.User{},
		&models.Organization{},
		&models.OrganizationMember{},
		&models.Project{},
		&models.ProjectMember{},
		&models.ProjectInvitation{},
		&models.Task{},
		&models.Tag{},
		&models.TaskAttachment{},
	)
	if err != nil {
		return fmt.Errorf("failed to auto migrate: %w", err)
	}

	log.Println("Database connected and migrated successfully with correct cascade delete constraints")
	return nil
}

// GetDB 获取数据库连接
func GetDB() *gorm.DB {
	return DB
}
