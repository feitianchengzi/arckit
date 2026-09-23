#!/bin/bash

# ArcOrbit 演示系统停止脚本

echo "========================================="
echo "  ArcOrbit 演示系统停止"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. 停止演示系统
echo -e "${YELLOW}1. 停止演示系统${NC}"
if lsof -i :8082 > /dev/null 2>&1; then
  pkill -f 'python3 -m http.server 8082'
  echo -e "${GREEN}✓ 演示系统已停止${NC}"
else
  echo -e "${GREEN}✓ 演示系统未运行${NC}"
fi

# 2. 停止 SDK
echo -e "${YELLOW}2. 停止 Feedback SDK${NC}"
if lsof -i :3100 > /dev/null 2>&1; then
  pkill -f 'vite'
  echo -e "${GREEN}✓ Feedback SDK 已停止${NC}"
else
  echo -e "${GREEN}✓ Feedback SDK 未运行${NC}"
fi

# 3. 停止 Docker 容器（可选）
echo -e "${YELLOW}3. Docker 容器${NC}"
echo "  Docker 容器继续运行，如需停止请执行："
echo "  docker stop todo-service openhands-agent-dev"
echo ""

echo "========================================="
echo -e "${GREEN}  服务停止完成${NC}"
echo "========================================="
echo ""
echo "如需重新启动，执行："
echo "  ./start.sh"
echo ""
