#!/bin/bash
# 本地任务接口测试（基于 project 项目）
# 1. 创建项目（api/project.md）
# 2. 测试任务相关接口（api/task.md）
# 全程使用同一用户：X-User-ID: 11111111-1111-1111-1111-111111111111
#
# BASE_URL：统一使用 workshop，默认 http://localhost:8081/workshop/v1

set -e

BASE_URL="${BASE_URL:-http://localhost:8081/workshop/v1}"
X_USER_ID="11111111-1111-1111-1111-111111111111"
X_USER_USERNAME="alice"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

header() {
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${BLUE}$*${NC}"
  echo -e "${BLUE}========================================${NC}\n"
}

step() {
  echo -e "${YELLOW}$*${NC}"
}

ok() {
  echo -e "${GREEN}$*${NC}"
}

fail() {
  echo -e "${RED}$*${NC}"
}

# 统一 curl：所有请求均带 X-User-ID / X-User-Username
req() {
  curl -s -X "$1" "$BASE_URL$2" \
    -H "X-User-ID: $X_USER_ID" \
    -H "X-User-Username: $X_USER_USERNAME" \
    "${@:3}"
}

header "本地任务接口测试（创建项目 → 测任务接口）"
echo "BASE_URL=$BASE_URL"
echo "X-User-ID=$X_USER_ID"
echo "X-User-Username=$X_USER_USERNAME"
echo ""

# ------------------------------------------------------------------------------
step "0. 确保当前用户存在"
# ------------------------------------------------------------------------------
ok "POST /user/users ..."
req POST "/user/users" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$X_USER_USERNAME\", \"avatar\": \"https://example.com/avatar.png\"}" | jq '.'
echo ""

# ------------------------------------------------------------------------------
step "1. 创建项目（api/project.md）"
# ------------------------------------------------------------------------------
ok "POST /user/projects ..."
PROJECT_JSON=$(req POST "/user/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "任务接口测试项目",
    "git_url": "https://github.com/team/task-test.git"
  }')
echo "$PROJECT_JSON" | jq '.'

PROJECT_ID=$(echo "$PROJECT_JSON" | jq -r '.data.id')
CREATOR_ID=$(echo "$PROJECT_JSON" | jq -r '.data.creator_id')

if [ "$PROJECT_ID" = "null" ] || [ -z "$PROJECT_ID" ]; then
  fail "创建项目失败，无法继续"
  exit 1
fi

ok "项目ID: $PROJECT_ID, 创建者ID: $CREATOR_ID"
echo ""

# ------------------------------------------------------------------------------
step "2. 任务接口：创建任务（POST /user/tasks）"
# ------------------------------------------------------------------------------
ok "创建任务（无执行者）..."
TASK1_JSON=$(req POST "/user/tasks" \
  -H "Content-Type: application/json" \
  -d "{
    \"project_id\": $PROJECT_ID,
    \"content\": \"完成任务设计文档\",
    \"state\": \"pending\"
  }")
echo "$TASK1_JSON" | jq '.'
TASK1_ID=$(echo "$TASK1_JSON" | jq -r '.data.id')
if [ "$TASK1_ID" = "null" ] || [ -z "$TASK1_ID" ]; then
  fail "创建任务1失败"
  exit 1
fi
ok "任务1 ID: $TASK1_ID"
echo ""

ok "创建任务（指定执行者 = 自己）..."
TASK2_JSON=$(req POST "/user/tasks" \
  -H "Content-Type: application/json" \
  -d "{
    \"project_id\": $PROJECT_ID,
    \"content\": \"实现用户登录\",
    \"state\": \"in_progress\",
    \"executor_id\": $CREATOR_ID,
    \"priority\": 0,
    \"tags\": \"重要,紧急\"
  }")
echo "$TASK2_JSON" | jq '.'
TASK2_ID=$(echo "$TASK2_JSON" | jq -r '.data.id')
if [ "$TASK2_ID" = "null" ] || [ -z "$TASK2_ID" ]; then
  fail "创建任务2失败"
  exit 1
fi
ok "任务2 ID: $TASK2_ID"
echo ""

ok "创建子任务（father_id = 任务1）..."
TASK3_JSON=$(req POST "/user/tasks" \
  -H "Content-Type: application/json" \
  -d "{
    \"project_id\": $PROJECT_ID,
    \"content\": \"子任务：设计数据库表结构\",
    \"state\": \"pending\",
    \"father_id\": $TASK1_ID
  }")
echo "$TASK3_JSON" | jq '.'
TASK3_ID=$(echo "$TASK3_JSON" | jq -r '.data.id')
if [ "$TASK3_ID" = "null" ] || [ -z "$TASK3_ID" ]; then
  fail "创建子任务失败"
  exit 1
fi
ok "任务3（子任务） ID: $TASK3_ID"
echo ""

# ------------------------------------------------------------------------------
step "3. 任务接口：查询任务列表（GET /user/tasks?project_id=）"
# ------------------------------------------------------------------------------
ok "GET /user/tasks?project_id=$PROJECT_ID ..."
req GET "/user/tasks?project_id=$PROJECT_ID" | jq '.'
echo ""

# ------------------------------------------------------------------------------
step "4. 任务接口：更新任务（PUT /user/tasks/:id）"
# ------------------------------------------------------------------------------
ok "更新任务1（内容 + 状态）..."
req PUT "/user/tasks/$TASK1_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "完成任务设计文档（已更新）",
    "state": "in_progress"
  }' | jq '.'
echo ""

ok "更新任务2（标记完成）..."
req PUT "/user/tasks/$TASK2_ID" \
  -H "Content-Type: application/json" \
  -d '{"state": "completed"}' | jq '.'
echo ""

# ------------------------------------------------------------------------------
step "5. 再次查询任务列表（确认更新）"
# ------------------------------------------------------------------------------
ok "GET /user/tasks?project_id=$PROJECT_ID ..."
req GET "/user/tasks?project_id=$PROJECT_ID" | jq '.'
echo ""

# ------------------------------------------------------------------------------
step "5a. 任务附件接口（POST/GET/PUT/DELETE /user/tasks/attachments）"
# ------------------------------------------------------------------------------
# 在任务1上创建附件（text / file / url）
ok "创建附件 type=text ..."
ATT1_JSON=$(req POST "/user/tasks/attachments" \
  -H "Content-Type: application/json" \
  -d "{
    \"task_id\": $TASK1_ID,
    \"type\": \"text\",
    \"content\": \"这是文本附件内容\"
  }")
echo "$ATT1_JSON" | jq '.'
ATT1_ID=$(echo "$ATT1_JSON" | jq -r '.data.id')
if [ "$ATT1_ID" = "null" ] || [ -z "$ATT1_ID" ]; then
  fail "创建附件1失败"
  exit 1
fi
ok "附件1 ID: $ATT1_ID"
echo ""

ok "创建附件 type=file ..."
ATT2_JSON=$(req POST "/user/tasks/attachments" \
  -H "Content-Type: application/json" \
  -d "{
    \"task_id\": $TASK1_ID,
    \"type\": \"file\",
    \"content\": \"https://example.com/files/doc.pdf\"
  }")
echo "$ATT2_JSON" | jq '.'
ATT2_ID=$(echo "$ATT2_JSON" | jq -r '.data.id')
if [ "$ATT2_ID" = "null" ] || [ -z "$ATT2_ID" ]; then
  fail "创建附件2失败"
  exit 1
fi
ok "附件2 ID: $ATT2_ID"
echo ""

ok "创建附件 type=url ..."
ATT3_JSON=$(req POST "/user/tasks/attachments" \
  -H "Content-Type: application/json" \
  -d "{
    \"task_id\": $TASK1_ID,
    \"type\": \"url\",
    \"content\": \"https://example.com/wiki/task-spec\"
  }")
echo "$ATT3_JSON" | jq '.'
ATT3_ID=$(echo "$ATT3_JSON" | jq -r '.data.id')
if [ "$ATT3_ID" = "null" ] || [ -z "$ATT3_ID" ]; then
  fail "创建附件3失败"
  exit 1
fi
ok "附件3 ID: $ATT3_ID"
echo ""

ok "GET /user/tasks/attachments?task_id=$TASK1_ID ..."
req GET "/user/tasks/attachments?task_id=$TASK1_ID" | jq '.'
echo ""

ok "PUT 更新附件1 content ..."
req PUT "/user/tasks/attachments/$ATT1_ID" \
  -H "Content-Type: application/json" \
  -d '{"content": "更新后的文本附件内容"}' | jq '.'
echo ""

ok "GET 附件列表（确认更新）..."
req GET "/user/tasks/attachments?task_id=$TASK1_ID" | jq '.'
echo ""

ok "DELETE 附件2 ..."
req DELETE "/user/tasks/attachments/$ATT2_ID" | jq '.'
echo ""

ok "GET 附件列表（不含已删）..."
req GET "/user/tasks/attachments?task_id=$TASK1_ID" | jq '.'
echo ""

ok "GET 附件列表（include_deleted=true）..."
req GET "/user/tasks/attachments?task_id=$TASK1_ID&include_deleted=true" | jq '.'
echo ""

ok "DELETE 附件1、附件3 ..."
req DELETE "/user/tasks/attachments/$ATT1_ID" | jq '.'
req DELETE "/user/tasks/attachments/$ATT3_ID" | jq '.'
echo ""

ok "GET 附件列表（全部删除后）..."
req GET "/user/tasks/attachments?task_id=$TASK1_ID" | jq '.'
echo ""

# ------------------------------------------------------------------------------
step "6. 任务接口：删除任务（DELETE /user/tasks/:id）"
# ------------------------------------------------------------------------------
ok "删除子任务3..."
req DELETE "/user/tasks/$TASK3_ID" | jq '.'
echo ""

ok "删除任务2..."
req DELETE "/user/tasks/$TASK2_ID" | jq '.'
echo ""

ok "删除任务1..."
req DELETE "/user/tasks/$TASK1_ID" | jq '.'
echo ""

# ------------------------------------------------------------------------------
step "7. 再次查询任务列表（确认已删）"
# ------------------------------------------------------------------------------
ok "GET /user/tasks?project_id=$PROJECT_ID ..."
req GET "/user/tasks?project_id=$PROJECT_ID" | jq '.'
echo ""

# ------------------------------------------------------------------------------
step "8. 清理：删除测试项目"
# ------------------------------------------------------------------------------
ok "DELETE /user/projects/$PROJECT_ID ..."
req DELETE "/user/projects/$PROJECT_ID" | jq '.'
echo ""

header "任务接口测试完成"
ok "✓ 已创建项目并测完：创建任务、查询列表、更新任务、任务附件（创建/查询/更新/删除、include_deleted）、删除任务"
ok "✓ 全程使用同一用户 X-User-ID: $X_USER_ID"
