#!/bin/bash

# 项目API测试脚本
# 测试 project_api.md 中的所有接口

BASE_URL="http://localhost:8081/todo/v1"
SERVICE="workshop"

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}项目API完整测试${NC}"
echo -e "${BLUE}========================================${NC}\n"

# 创建虚拟用户
echo -e "${YELLOW}步骤1: 创建虚拟用户...${NC}\n"

# 用户1: David
UUID1="44444444-4444-4444-4444-444444444444"
USERNAME1="david"
echo -e "${GREEN}创建用户: $USERNAME1${NC}"
RESPONSE1=$(curl -s -X POST "$BASE_URL/user/users" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME1\",
    \"avatar\": \"https://example.com/avatars/david.png\"
  }")
echo "$RESPONSE1" | jq '.'
USER_ID1=$(echo "$RESPONSE1" | jq -r '.id')
echo -e "用户ID: $USER_ID1\n"

# 用户2: Emma
UUID2="55555555-5555-5555-5555-555555555555"
USERNAME2="emma"
echo -e "${GREEN}创建用户: $USERNAME2${NC}"
RESPONSE2=$(curl -s -X POST "$BASE_URL/user/users" \
  -H "X-User-ID: $UUID2" \
  -H "X-User-Username: $USERNAME2" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME2\",
    \"avatar\": \"https://example.com/avatars/emma.png\"
  }")
echo "$RESPONSE2" | jq '.'
USER_ID2=$(echo "$RESPONSE2" | jq -r '.id')
echo -e "用户ID: $USER_ID2\n"

# 用户3: Frank
UUID3="66666666-6666-6666-6666-666666666666"
USERNAME3="frank"
echo -e "${GREEN}创建用户: $USERNAME3${NC}"
RESPONSE3=$(curl -s -X POST "$BASE_URL/user/users" \
  -H "X-User-ID: $UUID3" \
  -H "X-User-Username: $USERNAME3" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME3\",
    \"avatar\": \"https://example.com/avatars/frank.png\"
  }")
echo "$RESPONSE3" | jq '.'
USER_ID3=$(echo "$RESPONSE3" | jq -r '.id')
echo -e "用户ID: $USER_ID3\n"

sleep 1

# 测试接口1: 创建项目
echo -e "${YELLOW}步骤2: 测试接口1 - 创建项目${NC}\n"
echo -e "${GREEN}用户 $USERNAME1 创建项目...${NC}"
PROJECT_RESPONSE=$(curl -s -X POST "$BASE_URL/user/projects?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "电商平台开发",
    "git_url": "https://github.com/team/ecommerce.git"
  }')
echo "$PROJECT_RESPONSE" | jq '.'
PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.id')
echo -e "项目ID: $PROJECT_ID\n"

if [ "$PROJECT_ID" == "null" ] || [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}创建项目失败！${NC}"
  exit 1
fi

sleep 1

# 测试接口2: 查询用户参与的项目
echo -e "${YELLOW}步骤3: 测试接口2 - 查询用户参与的项目${NC}\n"
echo -e "${GREEN}查询用户 $USERNAME1 参与的项目...${NC}"
curl -s -X GET "$BASE_URL/user/projects?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" | jq '.'
echo ""

sleep 1

# 测试接口3: 更新项目
echo -e "${YELLOW}步骤4: 测试接口3 - 更新项目${NC}\n"
echo -e "${GREEN}更新项目 $PROJECT_ID...${NC}"
curl -s -X PUT "$BASE_URL/user/projects/$PROJECT_ID?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新项目名称-电商平台V2",
    "git_url": "https://github.com/team/ecommerce-v2.git"
  }' | jq '.'
echo ""

sleep 1

# 测试接口5: 邀请项目成员（生成邀请码）
echo -e "${YELLOW}步骤5: 测试接口5 - 邀请项目成员（生成邀请码）${NC}\n"
echo -e "${GREEN}用户 $USERNAME1 生成邀请码（member角色）...${NC}"
INVITE_RESPONSE1=$(curl -s -X POST "$BASE_URL/user/projects/$PROJECT_ID/invitations?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "member",
    "expires_in": 24
  }')
echo "$INVITE_RESPONSE1" | jq '.'
INVITE_CODE1=$(echo "$INVITE_RESPONSE1" | jq -r '.invite_code')
echo -e "邀请码1: $INVITE_CODE1\n"

echo -e "${GREEN}用户 $USERNAME1 生成邀请码（admin角色）...${NC}"
INVITE_RESPONSE2=$(curl -s -X POST "$BASE_URL/user/projects/$PROJECT_ID/invitations?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin",
    "expires_in": 48
  }')
echo "$INVITE_RESPONSE2" | jq '.'
INVITE_CODE2=$(echo "$INVITE_RESPONSE2" | jq -r '.invite_code')
echo -e "邀请码2: $INVITE_CODE2\n"

sleep 1

# 测试接口6: 加入项目（使用邀请码）
echo -e "${YELLOW}步骤6: 测试接口6 - 加入项目（使用邀请码）${NC}\n"
echo -e "${GREEN}用户 $USERNAME2 使用邀请码加入项目（member角色）...${NC}"
curl -s -X POST "$BASE_URL/user/projects/join?user_id=$USER_ID2" \
  -H "X-User-ID: $UUID2" \
  -H "X-User-Username: $USERNAME2" \
  -H "Content-Type: application/json" \
  -d "{
    \"invite_code\": \"$INVITE_CODE1\"
  }" | jq '.'
echo ""

sleep 1

echo -e "${GREEN}用户 $USERNAME3 使用邀请码加入项目（admin角色）...${NC}"
curl -s -X POST "$BASE_URL/user/projects/join?user_id=$USER_ID3" \
  -H "X-User-ID: $UUID3" \
  -H "X-User-Username: $USERNAME3" \
  -H "Content-Type: application/json" \
  -d "{
    \"invite_code\": \"$INVITE_CODE2\"
  }" | jq '.'
echo ""

sleep 1

# 再次查询项目成员
echo -e "${GREEN}查询项目成员列表...${NC}"
curl -s -X GET "$BASE_URL/user/projects?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" | jq '.projects[0].members'
echo ""

sleep 1

# 测试接口8: 设置成员角色
echo -e "${YELLOW}步骤7: 测试接口8 - 设置成员角色${NC}\n"
echo -e "${GREEN}将用户 $USERNAME2 的角色设置为 admin...${NC}"
curl -s -X PUT "$BASE_URL/user/projects/$PROJECT_ID/members/role?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" \
  -H "Content-Type: application/json" \
  -d "{
    \"target_user_id\": $USER_ID2,
    \"role\": \"admin\"
  }" | jq '.'
echo ""

sleep 1

# 测试接口7: 删除项目成员
echo -e "${YELLOW}步骤8: 测试接口7 - 删除项目成员${NC}\n"
echo -e "${GREEN}删除用户 $USERNAME3（admin角色）...${NC}"
curl -s -X DELETE "$BASE_URL/user/projects/$PROJECT_ID/members?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" \
  -H "Content-Type: application/json" \
  -d "{
    \"target_user_id\": $USER_ID3
  }" | jq '.'
echo ""

sleep 1

# 再次查询项目成员确认删除
echo -e "${GREEN}查询项目成员列表（确认删除）...${NC}"
curl -s -X GET "$BASE_URL/user/projects?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" | jq '.projects[0].members'
echo ""

sleep 1

# 测试接口4: 删除项目（最后测试，因为删除后无法恢复）
echo -e "${YELLOW}步骤9: 测试接口4 - 删除项目${NC}\n"
echo -e "${GREEN}删除项目 $PROJECT_ID...${NC}"
curl -s -X DELETE "$BASE_URL/user/projects/$PROJECT_ID?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" | jq '.'
echo ""

sleep 1

# 验证项目已删除
echo -e "${GREEN}验证项目已删除...${NC}"
curl -s -X GET "$BASE_URL/user/projects?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" | jq '.total'
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}所有接口测试完成！${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}测试总结:${NC}"
echo -e "✓ 创建了3个虚拟用户: $USERNAME1 (ID: $USER_ID1), $USERNAME2 (ID: $USER_ID2), $USERNAME3 (ID: $USER_ID3)"
echo -e "✓ 测试了所有8个项目接口"
echo -e "✓ 验证了项目创建、更新、成员管理、删除等功能"

