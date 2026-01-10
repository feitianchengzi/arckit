package main

import (
	"log"
	"os"

	"todo/database"
	"todo/router"
)

func main() {
	// 环境变量由 Docker Compose 通过 env_file 注入
	// 开发环境：docker-compose.dev.yml -> .env.development
	// 生产环境：docker-compose.prod.yml -> .env.production

	// 初始化数据库连接
	if err := database.InitDB(); err != nil {
		log.Fatal("数据库初始化失败:", err)
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

	if err := r.Run(addr); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
