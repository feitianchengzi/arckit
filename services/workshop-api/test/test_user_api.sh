#!/bin/bash

# 用户API测试脚本
# 测试 user_api.md 中的所有接口

BASE_URL="http://localhost:8081/todo/v1"
SERVICE="workshop"

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}用户API完整测试${NC}"
echo -e "${BLUE}========================================${NC}\n"

# 使用测试用户
UUID1="11111111-1111-1111-1111-111111111111"
USERNAME1="alice"

UUID2="22222222-2222-2222-2222-222222222222"
USERNAME2="bob"

echo -e "${YELLOW}使用测试用户:${NC}"
echo -e "  - $USERNAME1 (UUID: $UUID1)"
echo -e "  - $USERNAME2 (UUID: $UUID2)\n"

# 步骤1: 测试接口1 - 创建用户
echo -e "${YELLOW}步骤1: 测试接口1 - 创建用户${NC}\n"

# 1.1 创建用户1 (Alice)
echo -e "${GREEN}创建用户 $USERNAME1...${NC}"
CREATE_RESPONSE1=$(curl -s -X POST "$BASE_URL/user/users" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME1\",
    \"avatar\": \"https://example.com/avatars/$USERNAME1.png\"
  }")
echo "$CREATE_RESPONSE1" | jq '.'
echo ""

sleep 1

# 1.2 再次创建相同UUID的用户（应该返回现有用户）
echo -e "${GREEN}再次创建相同UUID的用户（应该返回现有用户）...${NC}"
CREATE_RESPONSE1_AGAIN=$(curl -s -X POST "$BASE_URL/user/users" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME1_updated\",
    \"avatar\": \"https://example.com/avatars/$USERNAME1_v2.png\"
  }")
echo "$CREATE_RESPONSE1_AGAIN" | jq '.'
echo ""

sleep 1

# 1.3 测试错误情况：两个字段都为空（应该返回400错误）
echo -e "${GREEN}测试错误情况：创建用户时两个字段都为空（应该返回400错误）...${NC}"
UUID_TEST="77777777-7777-7777-7777-777777777777"
ERROR_RESPONSE=$(curl -s -X POST "$BASE_URL/user/users" \
  -H "X-User-ID: $UUID_TEST" \
  -H "X-User-Username: test" \
  -H "Content-Type: application/json" \
  -d '{}')
echo "$ERROR_RESPONSE" | jq '.'
if echo "$ERROR_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  ERROR_MSG=$(echo "$ERROR_RESPONSE" | jq -r '.error')
  if [[ "$ERROR_MSG" == *"至少需要提供一个字段"* ]]; then
    echo -e "${GREEN}✓ 错误处理正确：返回了预期的错误信息${NC}\n"
  else
    echo -e "${RED}✗ 错误信息不符合预期${NC}\n"
  fi
else
  echo -e "${RED}✗ 未返回预期的错误信息${NC}\n"
fi

sleep 1

# 1.4 创建用户2 (Bob)
echo -e "${GREEN}创建用户 $USERNAME2...${NC}"
CREATE_RESPONSE2=$(curl -s -X POST "$BASE_URL/user/users" \
  -H "X-User-ID: $UUID2" \
  -H "X-User-Username: $USERNAME2" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME2\",
    \"avatar\": \"https://example.com/avatars/$USERNAME2.png\"
  }")
echo "$CREATE_RESPONSE2" | jq '.'
echo ""

sleep 1

# 步骤2: 测试接口2 - 查询用户
echo -e "${YELLOW}步骤2: 测试接口2 - 查询用户${NC}\n"

# 2.1 根据UUID查询用户1
echo -e "${GREEN}根据UUID查询用户 $USERNAME1...${NC}"
curl -s -X GET "$BASE_URL/user/users/$UUID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" | jq '.'
echo ""

sleep 1

# 2.2 根据UUID查询用户2
echo -e "${GREEN}根据UUID查询用户 $USERNAME2...${NC}"
curl -s -X GET "$BASE_URL/user/users/$UUID2" \
  -H "X-User-ID: $UUID2" \
  -H "X-User-Username: $USERNAME2" | jq '.'
echo ""

sleep 1

# 2.3 查询不存在的用户（应该返回404）
echo -e "${GREEN}查询不存在的用户（应该返回404）...${NC}"
curl -s -X GET "$BASE_URL/user/users/00000000-0000-0000-0000-000000000000" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" | jq '.'
echo ""

sleep 1

# 步骤3: 测试接口3 - 更新用户
echo -e "${YELLOW}步骤3: 测试接口3 - 更新用户${NC}\n"

# 3.1 更新用户1（同时更新username和avatar）
echo -e "${GREEN}更新用户 $USERNAME1（同时更新username和avatar）...${NC}"
curl -s -X PUT "$BASE_URL/user/users" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_new",
    "avatar": "https://example.com/avatars/alice_new.png"
  }' | jq '.'
echo ""

sleep 1

# 3.2 仅更新用户名
echo -e "${GREEN}仅更新用户名...${NC}"
curl -s -X PUT "$BASE_URL/user/users" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: alice_new" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_updated"
  }' | jq '.'
echo ""

sleep 1

# 3.3 仅更新头像
echo -e "${GREEN}仅更新头像...${NC}"
curl -s -X PUT "$BASE_URL/user/users" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: alice_updated" \
  -H "Content-Type: application/json" \
  -d '{
    "avatar": "https://example.com/avatars/alice_v2.png"
  }' | jq '.'
echo ""

sleep 1

# 3.4 测试错误情况：两个参数都为空（应该返回400错误）
echo -e "${GREEN}测试错误情况：两个参数都为空（应该返回400错误）...${NC}"
ERROR_RESPONSE=$(curl -s -X PUT "$BASE_URL/user/users" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: alice_updated" \
  -H "Content-Type: application/json" \
  -d '{}')
echo "$ERROR_RESPONSE" | jq '.'
if echo "$ERROR_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  ERROR_MSG=$(echo "$ERROR_RESPONSE" | jq -r '.error')
  if [[ "$ERROR_MSG" == *"至少需要提供一个更新字段"* ]]; then
    echo -e "${GREEN}✓ 错误处理正确：返回了预期的错误信息${NC}\n"
  else
    echo -e "${RED}✗ 错误信息不符合预期${NC}\n"
  fi
else
  echo -e "${RED}✗ 未返回预期的错误信息${NC}\n"
fi

sleep 1

# 3.5 更新用户2
echo -e "${GREEN}更新用户 $USERNAME2...${NC}"
curl -s -X PUT "$BASE_URL/user/users" \
  -H "X-User-ID: $UUID2" \
  -H "X-User-Username: $USERNAME2" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bob_updated",
    "avatar": "https://example.com/avatars/bob_v2.png"
  }' | jq '.'
echo ""

sleep 1

# 验证更新后的用户信息
echo -e "${YELLOW}步骤4: 验证更新后的用户信息${NC}\n"

# 4.1 查询更新后的用户1
echo -e "${GREEN}查询更新后的用户 $USERNAME1...${NC}"
curl -s -X GET "$BASE_URL/user/users/$UUID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: alice_updated" | jq '.'
echo ""

sleep 1

# 4.2 查询更新后的用户2
echo -e "${GREEN}查询更新后的用户 $USERNAME2...${NC}"
curl -s -X GET "$BASE_URL/user/users/$UUID2" \
  -H "X-User-ID: $UUID2" \
  -H "X-User-Username: bob_updated" | jq '.'
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}所有用户接口测试完成！${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}测试总结:${NC}"
echo -e "✓ 测试了创建用户接口（包括重复创建场景、两个参数都为空时的错误处理）"
echo -e "✓ 测试了查询用户接口（包括查询不存在用户）"
echo -e "✓ 测试了更新用户接口（包括完整更新、部分更新、错误处理）"
echo -e "✓ 验证了用户信息更新后的查询结果"
echo -e "✓ 验证了参数验证逻辑（创建和更新时两个参数都为空时的错误处理）"
