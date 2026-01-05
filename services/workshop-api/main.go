package main

import (
	"log"
	"net/http"
	"os"

	"todo/router"
)

func main() {
	r := router.SetupRouter()

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

	addr := host + ":" + port
	log.Printf("Server starting on %s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
