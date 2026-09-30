#!/bin/bash

# 端到端业务链路测试脚本

echo "========================================="
echo "  小橙 · ArcOrbit 智能客服对话测试"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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

echo -n "Demo System: "
if curl -s http://localhost:8082/ > /dev/null 2>&1; then
  echo -e "${GREEN}✓ 运行中${NC}"
else
  echo -e "${RED}✗ 未运行${NC}"
fi

echo ""

# 2. 测试 API 接口
echo -e "${YELLOW}2. 测试 API 接口${NC}"
echo "-----------------------------------------"

echo -n "获取项目列表: "
PROJECTS=$(curl -s "http://localhost:8081/workshop/v1/user/projects" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: demo-user")
if echo "$PROJECTS" | grep -q '"code":"OK"'; then
  echo -e "${GREEN}✓ 成功${NC}"
  PROJECT_ID=$(echo "$PROJECTS" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['projects'][0]['id'])" 2>/dev/null)
  echo "  项目 ID: $PROJECT_ID"
else
  echo -e "${RED}✗ 失败${NC}"
fi

echo ""

# 3. 测试创建反馈
echo -e "${YELLOW}3. 测试创建反馈${NC}"
echo "-----------------------------------------"

echo -n "创建反馈: "
FEEDBACK=$(curl -s -X POST "http://localhost:8081/workshop/v1/user/feedbacks" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
  -H "X-User-Username: demo-user" \
  -d '{
    "project_id": 11,
    "custom_user_id": "user_demo_001",
    "title": "测试：页面加载缓慢",
    "content": "在使用订单管理功能时，页面加载时间超过 5 秒，影响工作效率。",
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
fi

echo ""

# 4. 测试发送消息
echo -e "${YELLOW}4. 测试发送消息${NC}"
echo "-----------------------------------------"

if [ ! -z "$FEEDBACK_ID" ]; then
  echo -n "发送消息（agent-message 链路）: "
  MESSAGE=$(curl -s -X POST "http://localhost:8081/workshop/v2/user/feedbacks/$FEEDBACK_ID/agent-message" \
    -H "Content-Type: application/json" \
    -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
    -H "X-User-Username: demo-user" \
    --max-time 150 \
    -d '{
      "content": "你好，我想咨询一下订单系统重构的进度"
    }')
  if echo "$MESSAGE" | grep -q '"code":"OK"'; then
    echo -e "${GREEN}✓ 成功${NC}"
    REPLY=$(echo "$MESSAGE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data'].get('content',''))" 2>/dev/null)
    echo "  回复: ${REPLY:0:120}"
    # 负例：回复不得是历史固定兜底文案（智能客服人设/白名单/Agent 三路径都不允许）
    if echo "$REPLY" | grep -qF "您好！请问有什么可以帮您的？"; then
      echo -e "${RED}✗ 负例失败：命中固定兜底文案${NC}"
      exit 1
    fi
    if echo "$REPLY" | grep -qF "抱歉，我暂时无法回答您的问题"; then
      echo -e "${RED}✗ 负例失败：命中旧无身份兜底文案${NC}"
      exit 1
    fi
    if ! echo "$REPLY" | grep -qF "小橙"; then
      echo -e "${YELLOW}⚠ 警告：回复未声明客服姓名小橙${NC}"
    else
      echo -e "${GREEN}✓ 负例通过：无固定兜底，且带身份小橙${NC}"
    fi
  else
    echo -e "${RED}✗ 失败${NC}"
    echo "  响应: $MESSAGE"
    exit 1
  fi
fi

echo ""

# 5. 输出访问信息
echo -e "${YELLOW}5. 访问信息${NC}"
echo "-----------------------------------------"
echo ""
echo "演示系统地址: http://localhost:8082"
echo "对话窗口地址: http://localhost:8082/chat-widget.html"
echo ""
echo "操作步骤："
echo "1. 打开浏览器访问 http://localhost:8082"
echo "2. 点击右下角的智能客服按钮（紫色圆形按钮）"
echo "3. 在弹出的对话窗口中输入问题"
echo "4. 智能客服会基于代码库进行回答"
echo ""
echo "测试场景："
echo "  - 代码相关问题：这个项目的代码结构是怎样的？"
echo "  - 功能咨询：如何使用项目管理功能？"
echo "  - Bug 反馈：登录页面样式错乱"
echo "  - 功能建议：希望增加导出功能"
echo ""
echo "========================================="
echo "  测试完成"
echo "========================================="
