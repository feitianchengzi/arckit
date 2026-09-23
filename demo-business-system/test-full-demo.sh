#!/bin/bash

# 完整演示链路测试脚本

echo "========================================="
echo "  ArcOrbit 完整演示链路测试"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. 检查服务状态
echo -e "${YELLOW}1. 检查服务状态${NC}"
echo "-----------------------------------------"

echo -n "PostgreSQL: "
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
  echo -e "${GREEN}✓ 运行中${NC}"
else
  echo -e "${RED}✗ 未运行${NC}"
  exit 1
fi

echo -n "workshop-api: "
API_HEALTH=$(curl -s http://localhost:8081/workshop/v1/public/health 2>/dev/null)
if echo "$API_HEALTH" | grep -q '"status":"ok"'; then
  echo -e "${GREEN}✓ 运行中${NC}"
else
  echo -e "${RED}✗ 未运行${NC}"
  exit 1
fi

echo -n "OpenHands: "
OH_HEALTH=$(curl -s http://localhost:8000/health 2>/dev/null)
if echo "$OH_HEALTH" | grep -q '"status":"ok"'; then
  echo -e "${GREEN}✓ 运行中${NC}"
else
  echo -e "${YELLOW}⚠ 未运行 (可选)${NC}"
fi

echo -n "feedback-console: "
if curl -s http://localhost:3000/ > /dev/null 2>&1; then
  echo -e "${GREEN}✓ 运行中${NC}"
else
  echo -e "${RED}✗ 未运行${NC}"
fi

echo -n "Demo system: "
if curl -s http://localhost:8082/ > /dev/null 2>&1; then
  echo -e "${GREEN}✓ 运行中${NC}"
else
  echo -e "${RED}✗ 未运行${NC}"
fi

echo ""

# 2. 测试创建反馈
echo -e "${YELLOW}2. 测试创建反馈${NC}"
echo "-----------------------------------------"

echo -n "创建反馈: "
FEEDBACK=$(curl -s -X POST "http://localhost:8081/workshop/v1/user/feedbacks" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: demo-user" \
  -d '{
    "project_id": 11,
    "custom_user_id": "user_demo_001",
    "title": "测试：订单系统重构进度",
    "content": "你好，我想咨询一下订单系统重构的进度，目前进展如何？",
    "url": "http://localhost:8082/tasks",
    "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "screen_width": 1920,
    "screen_height": 1080
  }')

if echo "$FEEDBACK" | grep -q '"code":"OK"'; then
  echo -e "${GREEN}✓ 成功${NC}"
  FEEDBACK_ID=$(echo "$FEEDBACK" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
  FEEDBACK_SHORT_ID=$(echo "$FEEDBACK" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['short_id'])" 2>/dev/null)
  echo "  反馈 ID: $FEEDBACK_ID"
  echo "  反馈 Short ID: $FEEDBACK_SHORT_ID"
else
  echo -e "${RED}✗ 失败${NC}"
  echo "  响应: $FEEDBACK"
  exit 1
fi

echo ""

# 3. 测试 Agent 消息处理
echo -e "${YELLOW}3. 测试 Agent 消息处理（可能需要 30-60 秒）${NC}"
echo "-----------------------------------------"

echo -n "发送消息给 Agent: "
AGENT_RESPONSE=$(curl -s -X POST "http://localhost:8081/workshop/v1/user/feedbacks/$FEEDBACK_ID/agent-message" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: demo-user" \
  -d '{
    "content": "你好，我想咨询一下订单系统重构的进度，目前进展如何？"
  }' \
  --max-time 120)

if echo "$AGENT_RESPONSE" | grep -q '"code":"OK"'; then
  echo -e "${GREEN}✓ 成功${NC}"
  AGENT_CONTENT=$(echo "$AGENT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['content'])" 2>/dev/null)
  CONFIDENCE=$(echo "$AGENT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data'].get('confidence', 'N/A'))" 2>/dev/null)
  NEED_COLLECT=$(echo "$AGENT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data'].get('need_collect', 'N/A'))" 2>/dev/null)
  echo ""
  echo -e "${BLUE}Agent 回复:${NC}"
  echo "$AGENT_CONTENT" | head -20
  echo ""
  echo -e "置信度: $CONFIDENCE"
  echo -e "需要收集: $NEED_COLLECT"
else
  echo -e "${RED}✗ 失败${NC}"
  echo "  响应: $AGENT_RESPONSE"
fi

echo ""

# 4. 输出访问信息
echo -e "${YELLOW}4. 访问信息${NC}"
echo "-----------------------------------------"
echo ""
echo -e "${BLUE}客户端（内部管理台）:${NC}"
echo "  地址: http://localhost:3000"
echo "  用途: 查看反馈列表、处理流转到内部的反馈"
echo ""
echo -e "${BLUE}客户侧（演示系统）:${NC}"
echo "  地址: http://localhost:8082"
echo "  用途: 模拟客户提交反馈、与智能客服对话"
echo ""
echo -e "${BLUE}智能客服对话窗口:${NC}"
echo "  地址: http://localhost:8082/chat-widget.html"
echo "  用途: 与智能客服实时对话"
echo ""
echo "========================================="
echo "  完整演示链路"
echo "========================================="
echo ""
echo "1. 客户在演示系统提交反馈"
echo "   → http://localhost:8082/chat-widget.html"
echo ""
echo "2. 智能客服基于代码库回答"
echo "   → OpenHands Agent + DeepSeek LLM"
echo ""
echo "3. 无法回答时流转到内部"
echo "   → feedback-console 可见"
echo ""
echo "4. 内部人员在客户端处理"
echo "   → http://localhost:3000"
echo ""
echo "========================================="
