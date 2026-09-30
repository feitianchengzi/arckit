package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"todo/database"
	"todo/feedbackemail"
	"todo/handler"
	"todo/realtime"
	"todo/router"
)

func main() {
	migrationOnly := len(os.Args) == 2 && os.Args[1] == "migrate"
	if len(os.Args) > 1 && !migrationOnly {
		log.Fatalf("未知命令 %q；支持的命令：migrate", os.Args[1])
	}

	// 初始化数据库连接
	var initErr error
	if migrationOnly {
		initErr = database.InitDBForMigration()
	} else {
		initErr = database.InitDB()
	}
	if initErr != nil {
		log.Fatal("数据库初始化失败:", initErr)
	}
	if migrationOnly {
		log.Println("数据库迁移与运行时 schema 验证成功")
		return
	}

	realtime.ConfigureStore(database.GetDB())
	broker := realtime.NewBroker(database.GetDB(), database.ConnectionString(), realtime.DefaultHub)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	if err := broker.Start(ctx); err != nil {
		log.Fatal("实时事件 Broker 初始化失败:", err)
	}
	handler.ConfigureHealthReadiness(broker.Ready)

	emailConfig, err := feedbackemail.LoadConfigFromEnv()
	if err != nil {
		log.Fatal("反馈邮件通知配置无效:", err)
	}
	if emailConfig.Enabled {
		emailWorker := feedbackemail.NewWorker(database.GetDB(), emailConfig)
		go emailWorker.Run(ctx)
	}

	// 从环境变量读取端口，如果不存在则报错退出
	port := os.Getenv("PORT")
	if port == "" {
		log.Fatal("环境变量 PORT 未设置")
	}
	// 从环境变量读取主机，如果不存在则报错退出
	host := os.Getenv("HOST")
	if host == "" {
		log.Fatal("环境变量 HOST 未设置")
	}
	// 从环境变量读取服务名称，如果不存在则报错退出
	serviceName := os.Getenv("SERVICE_NAME")
	if serviceName == "" {
		log.Fatal("环境变量 SERVICE_NAME 未设置")
	}

	r := router.SetupRouter(serviceName)

	addr := host + ":" + port
	log.Printf("Server starting on %s", addr)
	log.Printf("Gateway route format: /{service}/{version}/{auth_level}/{path}")
	log.Printf("Available auth levels: public, user, apikey")

	srv := &http.Server{
		Addr:    addr,
		Handler: r,
		// 读超时保持紧凑（请求体很小）；写超时放宽以支撑 Agent 问答等
		// 同步 LLM 长调用（OpenHands + DeepSeek 可达 1-2 分钟）。
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 300 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// 优雅关闭：监听 SIGTERM/SIGINT
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	sig := <-quit
	log.Printf("Received signal %v, shutting down gracefully...", sig)

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer shutdownCancel()

	cancel() // 停止后台 goroutine
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server forced shutdown: %v", err)
	}

	log.Println("Server exited cleanly")
}
