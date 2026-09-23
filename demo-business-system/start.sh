#!/bin/bash

# ArcOrbit 演示系统启动脚本

set -e

echo "========================================="
echo "  ArcOrbit 演示系统启动"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 项目根目录
PROJECT_ROOT="/Users/zqs/Downloads/project/arckit"
DEMO_DIR="$PROJECT_ROOT/demo-business-system"

# 1. 检查 PostgreSQL
echo -e "${YELLOW}1. 检查 PostgreSQL${NC}"
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
  echo -e "${GREEN}✓ PostgreSQL 已运行${NC}"
else
  echo -e "${RED}✗ PostgreSQL 未运行，请先启动${NC}"
  exit 1
fi

# 2. 检查 Docker 容器
echo -e "${YELLOW}2. 检查 Docker 容器${NC}"

# 检查 todo-service
if docker ps | grep -q "todo-service"; then
  echo -e "${GREEN}✓ workshop-api 已运行${NC}"
else
  echo -e "${YELLOW}⚠ 启动 workshop-api...${NC}"
  cd "$PROJECT_ROOT/services/workshop-api"
  docker compose -f deploy/dev/docker-compose.dev.yml up -d
  sleep 5
fi

# 检查 openhands-agent
if docker ps | grep -q "openhands-agent"; then
  echo -e "${GREEN}✓ OpenHands Agent 已运行${NC}"
else
  echo -e "${YELLOW}⚠ 启动 OpenHands Agent...${NC}"
  cd "$PROJECT_ROOT/services/workshop-api"
  docker compose -f deploy/dev/docker-compose.openhands.yml up -d
  sleep 5
fi

# 3. 启动 SDK 开发服务器
echo -e "${YELLOW}3. 启动 Feedback SDK${NC}"
if curl -s http://localhost:3100/sdk/ > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Feedback SDK 已运行${NC}"
else
  echo -e "${YELLOW}⚠ 启动 Feedback SDK...${NC}"
  cd "$PROJECT_ROOT/packages/feedback-sdk-web"
  nohup npm run dev > /tmp/sdk-dev.log 2>&1 &
  sleep 5
  if curl -s http://localhost:3100/sdk/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Feedback SDK 启动成功${NC}"
  else
    echo -e "${RED}✗ Feedback SDK 启动失败${NC}"
    echo "  查看日志: cat /tmp/sdk-dev.log"
  fi
fi

# 4. 启动演示系统
echo -e "${YELLOW}4. 启动演示系统${NC}"
if curl -s http://localhost:8082/ > /dev/null 2>&1; then
  echo -e "${GREEN}✓ 演示系统已运行${NC}"
else
  echo -e "${YELLOW}⚠ 启动演示系统...${NC}"
  cd "$DEMO_DIR"
  nohup python3 -m http.server 8082 > /tmp/demo-server.log 2>&1 &
  sleep 2
  if curl -s http://localhost:8082/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 演示系统启动成功${NC}"
  else
    echo -e "${RED}✗ 演示系统启动失败${NC}"
    echo "  查看日志: cat /tmp/demo-server.log"
  fi
fi

echo ""
echo "========================================="
echo -e "${GREEN}  所有服务启动完成${NC}"
echo "========================================="
echo ""
echo "访问地址:"
echo "  - 演示系统: http://localhost:8082"
echo "  - Feedback SDK: http://localhost:3100/sdk/"
echo "  - workshop-api: http://localhost:8081/workshop/"
echo ""
echo "使用说明:"
echo "  1. 打开浏览器访问 http://localhost:8082"
echo "  2. 点击右下角的紫色反馈按钮"
echo "  3. 填写反馈信息并提交"
echo "  4. 在反馈窗口中与智能客服对话"
echo ""
echo "停止服务:"
echo "  pkill -f 'python3 -m http.server 8082'"
echo "  pkill -f 'vite'"
echo ""
