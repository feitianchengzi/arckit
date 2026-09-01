package main

import (
	"context"
	"log"
	"os"

	"todo/database"
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
	if err := broker.Start(context.Background()); err != nil {
		log.Fatal("实时事件 Broker 初始化失败:", err)
	}
	handler.ConfigureHealthReadiness(broker.Ready)

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

	if err := r.Run(addr); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
