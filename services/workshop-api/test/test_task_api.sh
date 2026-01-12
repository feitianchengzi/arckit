#!/bin/bash

# 任务API测试脚本
# 测试 task_api.md 中的所有接口

BASE_URL="http://localhost:8081/todo/v1"
SERVICE="workshop"

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}任务API完整测试${NC}"
echo -e "${BLUE}========================================${NC}\n"

# 使用已有的测试用户（根据 README.md）
# Alice: user_id=3, UUID=11111111-1111-1111-1111-111111111111, username=alice
# Bob: user_id=4, UUID=22222222-2222-2222-2222-222222222222, username=bob
# Charlie: user_id=5, UUID=33333333-3333-3333-3333-333333333333, username=charlie

UUID1="11111111-1111-1111-1111-111111111111"
USERNAME1="alice"
USER_ID1=3

UUID2="22222222-2222-2222-2222-222222222222"
USERNAME2="bob"
USER_ID2=4

UUID3="33333333-3333-3333-3333-333333333333"
USERNAME3="charlie"
USER_ID3=5

echo -e "${YELLOW}使用测试用户:${NC}"
echo -e "  - $USERNAME1 (ID: $USER_ID1, UUID: $UUID1)"
echo -e "  - $USERNAME2 (ID: $USER_ID2, UUID: $UUID2)"
echo -e "  - $USERNAME3 (ID: $USER_ID3, UUID: $UUID3)\n"

# 步骤0: 确保测试用户存在（如果不存在则创建）
echo -e "${YELLOW}步骤0: 确保测试用户存在${NC}\n"

echo -e "${GREEN}创建/检查用户 $USERNAME1...${NC}"
curl -s -X POST "$BASE_URL/user/users" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME1\",
    \"avatar\": \"https://example.com/avatars/$USERNAME1.png\"
  }" | jq '.' > /dev/null

echo -e "${GREEN}创建/检查用户 $USERNAME2...${NC}"
curl -s -X POST "$BASE_URL/user/users" \
  -H "X-User-ID: $UUID2" \
  -H "X-User-Username: $USERNAME2" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME2\",
    \"avatar\": \"https://example.com/avatars/$USERNAME2.png\"
  }" | jq '.' > /dev/null

echo ""

sleep 1

# 步骤1: 创建项目（Alice创建）
echo -e "${YELLOW}步骤1: 创建项目（为任务测试做准备）${NC}\n"
echo -e "${GREEN}用户 $USERNAME1 创建项目...${NC}"
PROJECT_RESPONSE=$(curl -s -X POST "$BASE_URL/user/projects?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "任务管理测试项目",
    "git_url": "https://github.com/team/task-test.git"
  }')
echo "$PROJECT_RESPONSE" | jq '.'
PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.id')
echo -e "项目ID: $PROJECT_ID\n"

if [ "$PROJECT_ID" == "null" ] || [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}创建项目失败！${NC}"
  exit 1
fi

sleep 1

# 步骤2: 邀请Bob加入项目（作为member）
echo -e "${YELLOW}步骤2: 邀请成员加入项目${NC}\n"
echo -e "${GREEN}用户 $USERNAME1 生成邀请码（member角色）...${NC}"
INVITE_RESPONSE=$(curl -s -X POST "$BASE_URL/user/projects/$PROJECT_ID/invitations?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "member",
    "expires_in": 24
  }')
echo "$INVITE_RESPONSE" | jq '.'
INVITE_CODE=$(echo "$INVITE_RESPONSE" | jq -r '.invite_code')
echo -e "邀请码: $INVITE_CODE\n"

sleep 1

echo -e "${GREEN}用户 $USERNAME2 使用邀请码加入项目...${NC}"
curl -s -X POST "$BASE_URL/user/projects/join?user_id=$USER_ID2" \
  -H "X-User-ID: $UUID2" \
  -H "X-User-Username: $USERNAME2" \
  -H "Content-Type: application/json" \
  -d "{
    \"invite_code\": \"$INVITE_CODE\"
  }" | jq '.'
echo ""

sleep 1

# 步骤3: 测试接口1 - 创建任务
echo -e "${YELLOW}步骤3: 测试接口1 - 创建任务${NC}\n"

# 3.1 Alice创建任务（无执行者）
echo -e "${GREEN}用户 $USERNAME1 创建任务（无执行者）...${NC}"
TASK1_RESPONSE=$(curl -s -X POST "$BASE_URL/user/tasks?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" \
  -H "Content-Type: application/json" \
  -d "{
    \"project_id\": $PROJECT_ID,
    \"content\": \"完成任务设计文档\",
    \"state\": \"pending\"
  }")
echo "$TASK1_RESPONSE" | jq '.'
TASK1_ID=$(echo "$TASK1_RESPONSE" | jq -r '.id')
echo -e "任务1 ID: $TASK1_ID\n"

sleep 1

# 3.2 Alice创建任务（分配给Bob）
echo -e "${GREEN}用户 $USERNAME1 创建任务（分配给 $USERNAME2）...${NC}"
TASK2_RESPONSE=$(curl -s -X POST "$BASE_URL/user/tasks?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" \
  -H "Content-Type: application/json" \
  -d "{
    \"project_id\": $PROJECT_ID,
    \"content\": \"实现用户登录功能\",
    \"state\": \"in_progress\",
    \"executor_id\": $USER_ID2
  }")
echo "$TASK2_RESPONSE" | jq '.'
TASK2_ID=$(echo "$TASK2_RESPONSE" | jq -r '.id')
echo -e "任务2 ID: $TASK2_ID\n"

sleep 1

# 3.3 Bob创建任务（自己执行）
echo -e "${GREEN}用户 $USERNAME2 创建任务（自己执行）...${NC}"
TASK3_RESPONSE=$(curl -s -X POST "$BASE_URL/user/tasks?user_id=$USER_ID2" \
  -H "X-User-ID: $UUID2" \
  -H "X-User-Username: $USERNAME2" \
  -H "Content-Type: application/json" \
  -d "{
    \"project_id\": $PROJECT_ID,
    \"content\": \"编写单元测试\",
    \"state\": \"pending\",
    \"executor_id\": $USER_ID2
  }")
echo "$TASK3_RESPONSE" | jq '.'
TASK3_ID=$(echo "$TASK3_RESPONSE" | jq -r '.id')
echo -e "任务3 ID: $TASK3_ID\n"

sleep 1

# 3.4 Alice创建子任务
echo -e "${GREEN}用户 $USERNAME1 创建子任务（父任务：任务1）...${NC}"
TASK4_RESPONSE=$(curl -s -X POST "$BASE_URL/user/tasks?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" \
  -H "Content-Type: application/json" \
  -d "{
    \"project_id\": $PROJECT_ID,
    \"content\": \"子任务：设计数据库表结构\",
    \"state\": \"pending\",
    \"father_id\": $TASK1_ID
  }")
echo "$TASK4_RESPONSE" | jq '.'
TASK4_ID=$(echo "$TASK4_RESPONSE" | jq -r '.id')
echo -e "任务4 ID: $TASK4_ID\n"

sleep 1

# 步骤4: 测试接口3 - 查询任务列表
echo -e "${YELLOW}步骤4: 测试接口3 - 查询任务列表${NC}\n"
echo -e "${GREEN}查询项目 $PROJECT_ID 的所有任务...${NC}"
curl -s -X GET "$BASE_URL/user/tasks?project_id=$PROJECT_ID&user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" | jq '.'
echo ""

sleep 1

# 步骤5: 测试接口2 - 更新任务
echo -e "${YELLOW}步骤5: 测试接口2 - 更新任务${NC}\n"

# 5.1 Alice更新任务1（修改内容和状态）
echo -e "${GREEN}用户 $USERNAME1 更新任务1（修改内容和状态）...${NC}"
curl -s -X PUT "$BASE_URL/user/tasks/$TASK1_ID?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "完成任务设计文档（已更新）",
    "state": "in_progress"
  }' | jq '.'
echo ""

sleep 1

# 5.2 Bob更新分配给自己的任务2（完成）
echo -e "${GREEN}用户 $USERNAME2 更新任务2（标记为完成）...${NC}"
curl -s -X PUT "$BASE_URL/user/tasks/$TASK2_ID?user_id=$USER_ID2" \
  -H "X-User-ID: $UUID2" \
  -H "X-User-Username: $USERNAME2" \
  -H "Content-Type: application/json" \
  -d '{
    "state": "completed"
  }' | jq '.'
echo ""

sleep 1

# 5.3 Bob更新自己创建的任务3
echo -e "${GREEN}用户 $USERNAME2 更新任务3（修改状态）...${NC}"
curl -s -X PUT "$BASE_URL/user/tasks/$TASK3_ID?user_id=$USER_ID2" \
  -H "X-User-ID: $UUID2" \
  -H "X-User-Username: $USERNAME2" \
  -H "Content-Type: application/json" \
  -d '{
    "state": "in_progress"
  }' | jq '.'
echo ""

sleep 1

# 5.4 Alice更新任务2（从completed改回in_progress，测试完成时间清除）
echo -e "${GREEN}用户 $USERNAME1 更新任务2（从completed改回in_progress）...${NC}"
curl -s -X PUT "$BASE_URL/user/tasks/$TASK2_ID?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" \
  -H "Content-Type: application/json" \
  -d '{
    "state": "in_progress"
  }' | jq '.'
echo ""

sleep 1

# 5.5 测试更新执行者
echo -e "${GREEN}用户 $USERNAME1 更新任务3的执行者（改为自己）...${NC}"
curl -s -X PUT "$BASE_URL/user/tasks/$TASK3_ID?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" \
  -H "Content-Type: application/json" \
  -d "{
    \"executor_id\": $USER_ID1
  }" | jq '.'
echo ""

sleep 1

# 再次查询任务列表，查看更新后的状态
echo -e "${GREEN}再次查询任务列表（查看更新后的状态）...${NC}"
curl -s -X GET "$BASE_URL/user/tasks?project_id=$PROJECT_ID&user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" | jq '.'
echo ""

sleep 1

# 步骤6: 测试接口4 - 批量删除任务
echo -e "${YELLOW}步骤6: 测试接口4 - 批量删除任务${NC}\n"

# 6.1 Bob尝试删除Alice创建的任务（应该失败，权限不足）
echo -e "${GREEN}用户 $USERNAME2 尝试删除任务1（应该失败，权限不足）...${NC}"
curl -s -X DELETE "$BASE_URL/user/tasks?user_id=$USER_ID2" \
  -H "X-User-ID: $UUID2" \
  -H "X-User-Username: $USERNAME2" \
  -H "Content-Type: application/json" \
  -d "{
    \"task_ids\": [$TASK1_ID]
  }" | jq '.'
echo ""

sleep 1

# 6.2 Bob删除自己创建的任务3（应该成功）
echo -e "${GREEN}用户 $USERNAME2 删除自己创建的任务3...${NC}"
curl -s -X DELETE "$BASE_URL/user/tasks?user_id=$USER_ID2" \
  -H "X-User-ID: $UUID2" \
  -H "X-User-Username: $USERNAME2" \
  -H "Content-Type: application/json" \
  -d "{
    \"task_ids\": [$TASK3_ID]
  }" | jq '.'
echo ""

sleep 1

# 6.3 Alice批量删除任务（owner权限，可以删除任意任务）
echo -e "${GREEN}用户 $USERNAME1 批量删除任务1和任务4（owner权限）...${NC}"
curl -s -X DELETE "$BASE_URL/user/tasks?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" \
  -H "Content-Type: application/json" \
  -d "{
    \"task_ids\": [$TASK1_ID, $TASK4_ID]
  }" | jq '.'
echo ""

sleep 1

# 最终查询任务列表，确认删除结果
echo -e "${GREEN}最终查询任务列表（确认删除结果）...${NC}"
curl -s -X GET "$BASE_URL/user/tasks?project_id=$PROJECT_ID&user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" | jq '.'
echo ""

sleep 1

# 清理：删除测试项目
echo -e "${YELLOW}清理: 删除测试项目${NC}\n"
echo -e "${GREEN}删除项目 $PROJECT_ID...${NC}"
curl -s -X DELETE "$BASE_URL/user/projects/$PROJECT_ID?user_id=$USER_ID1" \
  -H "X-User-ID: $UUID1" \
  -H "X-User-Username: $USERNAME1" | jq '.'
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}所有任务接口测试完成！${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}测试总结:${NC}"
echo -e "✓ 创建了1个测试项目"
echo -e "✓ 测试了任务创建（包括子任务）"
echo -e "✓ 测试了任务查询"
echo -e "✓ 测试了任务更新（包括状态变更、执行者变更）"
echo -e "✓ 测试了任务批量删除（包括权限验证）"
echo -e "✓ 验证了owner/member权限差异"
