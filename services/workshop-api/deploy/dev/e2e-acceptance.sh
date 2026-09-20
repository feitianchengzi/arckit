#!/bin/bash
# 客户支持通道 — 真实端到端验收（模型依赖走降级/mock 路径）
# 用法: ./e2e-acceptance.sh [BASE_URL] [USER_UUID] [PROJECT_ID]
# 默认: http://127.0.0.1:8091  11111111-1111-1111-1111-111111111111  11
# 依赖: curl, jq, docker(仅 DB 级断言), node(WS 广播监听)
#
# 链路: 健康检查 → 客户提交反馈 → 智能检索(降级) → AI分诊初判 → 分诊转任务(桥1)
#       → 越权拒绝 → 认领 → 客户追问+WS事件(桥3输入) → 草稿回写/确认/驳回(桥2)
#       → 验收+产物交付 → 知识库/代码索引(降级) → DB 级断言

BASE="${1:-http://127.0.0.1:8091}"
USER_UUID="${2:-11111111-1111-1111-1111-111111111111}"
PROJECT_ID="${3:-11}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CUSTOMER_ID="e2e-customer-$(date +%s)"
AUTH=( -H "X-User-ID: ${USER_UUID}" -H "Content-Type: application/json" )
PSQL="docker exec todo-postgres-dev psql -U postgres -d todo -tA -c"

PASS=0; FAIL=0; FAILED_STEPS=()

check() { # check <名称> <退出码>
  if [ "$2" -eq 0 ]; then
    echo "  ✅ $1"; PASS=$((PASS+1))
  else
    echo "  ❌ $1"; FAIL=$((FAIL+1)); FAILED_STEPS+=("$1")
  fi
}

expect_contains() { # expect_contains <名称> <实际串> <子串>
  if [[ "$2" == *"$3"* ]]; then
    check "$1" 0
  else
    echo "    实际: $(echo "$2" | tr -d '\n' | head -c 300)"; check "$1" 1
  fi
}

expect_matches() { # expect_matches <名称> <实际串> <glob模式>
  if [[ "$2" == $3 ]]; then
    check "$1" 0
  else
    echo "    实际: $(echo "$2" | tr -d '\n' | head -c 300)"; check "$1" 1
  fi
}

echo "════════════════════════════════════════════════════"
echo "客户支持通道 E2E 验收 @ ${BASE} (project=${PROJECT_ID})"
echo "════════════════════════════════════════════════════"

# ── 0. 健康检查 ──────────────────────────────────────
echo "[0] 服务健康检查"
HEALTH=$(curl -s "${BASE}/workshop/v1/public/health")
expect_contains "health 端点返回 ok" "$HEALTH" '"status":"ok"'

# ── 1. 客户提交反馈（SDK 对话式反馈 F-01）────────────
echo "[1] 客户提交反馈（结构化 position/phenomenon/expect）"
DATA='{"priority":"P2","structured":{"position":"登录页","phenomenon":"点击登录无响应","expect":"正常登录"}}'
CREATE_RESP=$(curl -s -X POST "${BASE}/workshop/v2/user/feedbacks" "${AUTH[@]}" -d "{
  \"project_id\": ${PROJECT_ID},
  \"title\": \"E2E-登录无响应\",
  \"content\": \"E2E 验收：登录页点击登录按钮无任何响应，期望正常进入系统。\",
  \"custom_user_id\": \"${CUSTOMER_ID}\",
  \"data\": $(jq -Rn --arg d "$DATA" '$d')
}")
FB_ID=$(echo "$CREATE_RESP" | jq -r '.data.id // empty')
expect_matches "创建反馈返回 id" "id=${FB_ID}" 'id=[0-9]*'
expect_contains "反馈 status=pending" "$(echo "$CREATE_RESP" | jq -r '.data.status // empty')" "pending"
expect_contains "反馈 triage_status=pending" "$(echo "$CREATE_RESP" | jq -r '.data.triage_status // empty')" "pending"

# ── 2. 智能客服检索（F-03，OpenHands 关闭 → 降级路径）──
echo "[2] 智能客服检索（降级：本地检索兜底）"
RETRIEVE_RESP=$(curl -s -X POST "${BASE}/workshop/v2/user/feedbacks/retrieve" "${AUTH[@]}" \
  -d "{\"project_id\": ${PROJECT_ID}, \"query\": \"登录页面无响应怎么办\", \"conversation_id\": \"\"}")
expect_contains "检索返回 code=0" "$(echo "$RETRIEVE_RESP" | jq -r '.code // empty')" "0"
expect_contains "检索返回 hits/draft_reply/need_collect 结构" "$(echo "$RETRIEVE_RESP" | jq -c '.data | keys // []')" "hits"

# ── 3. AI 分诊初判（UI 数据源 data.triage）───────────
echo "[3] AI 分诊初判（写入 data.triage）"
TRIAGE_RESP=$(curl -s -X POST "${BASE}/workshop/v2/user/feedbacks/${FB_ID}/triage" "${AUTH[@]}")
TRIAGE_TYPE=$(echo "$TRIAGE_RESP" | jq -r '.data.triage.type // empty')
[ -n "${TRIAGE_TYPE}" ]; check "分诊返回 triage.type（实际 ${TRIAGE_TYPE}）" $?
TRIAGE_PERSISTED=$(curl -s "${BASE}/workshop/v2/user/feedbacks/${FB_ID}" "${AUTH[@]}" | jq -r '.data.data | fromjson? | .triage.type // empty')
[ -n "${TRIAGE_PERSISTED}" ]; check "feedback.data.triage 已持久化（实际 ${TRIAGE_PERSISTED}）" $?

# ── 4. 分诊转任务（F-04，桥1 建立追溯）───────────────
echo "[4] 分诊转任务（桥1：FeedbackTaskLink + source_feedback_id）"
CONVERT_RESP=$(curl -s -X POST "${BASE}/workshop/v2/user/feedbacks/${FB_ID}/convert-to-task" "${AUTH[@]}" \
  -d "{\"content\": \"修复登录页无响应问题（来自反馈 ${FB_ID}）\", \"executor_id\": 1, \"priority\": 2}")
TASK_ID=$(echo "$CONVERT_RESP" | jq -r '.data.task.id // empty')
expect_matches "转换返回 task_id" "t=${TASK_ID}" 't=[0-9]*'
expect_contains "反馈 status=converted" "$(echo "$CONVERT_RESP" | jq -r '.data.feedback.status // empty')" "converted"
TASK_JSON=$(curl -s "${BASE}/workshop/v2/user/tasks?project_id=${PROJECT_ID}" "${AUTH[@]}" | jq -r --argjson tid "${TASK_ID}" '.data.tasks[] | select(.id == $tid)')
expect_contains "task.source_feedback_id 回填" "$(echo "$TASK_JSON" | jq -r '.source_feedback_id // empty')" "${FB_ID}"

LINKS_FB=$(curl -s "${BASE}/workshop/v2/user/feedbacks/${FB_ID}/task-links" "${AUTH[@]}")
expect_contains "feedback→task links 返回 converted_to" "$(echo "$LINKS_FB" | jq -r '.data[0].relation_type // empty')" "converted_to"
LINKS_TASK=$(curl -s "${BASE}/workshop/v2/user/tasks/${TASK_ID}/feedback-links" "${AUTH[@]}")
expect_contains "task→feedback links 返回反馈ID" "$(echo "$LINKS_TASK" | jq -r '.data[0].feedback_id // empty')" "${FB_ID}"

# ── 5. 越权拒绝（AC-F04 安全验收）────────────────────
echo "[5] 越权与鉴权负例"
NO_AUTH=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE}/workshop/v2/user/feedbacks/${FB_ID}/convert-to-task" \
  -H "Content-Type: application/json" -d '{}')
[ "${NO_AUTH}" = "401" ] || [ "${NO_AUTH}" = "403" ]; check "无身份调用 convert → 拒绝(${NO_AUTH})" $?

docker exec todo-postgres-dev psql -U postgres -d todo -c "
INSERT INTO users (uuid, username) VALUES ('22222222-2222-2222-2222-222222222222', 'e2e-member')
ON CONFLICT (uuid) DO NOTHING;" >/dev/null 2>&1
MEMBER_UID=$(${PSQL} "SELECT id FROM users WHERE uuid='22222222-2222-2222-2222-222222222222';")
${PSQL} "INSERT INTO project_members (project_id, user_id, role) VALUES (${PROJECT_ID}, ${MEMBER_UID}, 'member')
ON CONFLICT DO NOTHING;" >/dev/null 2>&1
MEMBER_FB=$(curl -s -X POST "${BASE}/workshop/v2/user/feedbacks" "${AUTH[@]}" -d "{
  \"project_id\": ${PROJECT_ID}, \"title\": \"E2E-门控\", \"content\": \"member 越权分诊测试\", \"custom_user_id\": \"${CUSTOMER_ID}\"}" | jq -r '.data.id // empty')
MEMBER_TRIAGE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE}/workshop/v2/user/feedbacks/${MEMBER_FB}/triage" \
  -H "X-User-ID: 22222222-2222-2222-2222-222222222222" -H "Content-Type: application/json")
[ "${MEMBER_TRIAGE}" = "403" ]; check "member 调用分诊 → 403（role 门控）" $?

# ── 6. 认领任务（US-05）──────────────────────────────
echo "[6] 认领任务进 loop"
CLAIM=$(curl -s -X PUT "${BASE}/workshop/v2/user/tasks/${TASK_ID}" "${AUTH[@]}" -d '{"state": "in_progress"}')
expect_contains "task state=in_progress" "$(echo "$CLAIM" | jq -r '.data.task.state // .data.state // .data // empty' | head -c 60)" "in_progress"

# ── 7. 客户追问 + WebSocket 广播（桥3 输入端）─────────
echo "[7] 客户追问触发 feedback.message.created WS 广播"
# 客户消息必须携带反馈自身的 custom_user_id（客户身份校验）。
node "${SCRIPT_DIR}/e2e-ws-listener.cjs" "${BASE}" "${USER_UUID}" "${PROJECT_ID}" "${FB_ID}" "${CUSTOMER_ID}"
check "WS 收到客户消息广播事件" $?

# ── 8. 桥2：草稿回写 → 确认发送 / 驳回 ────────────────
echo "[8] 桥2：closeout 草稿回写与确认（pending_review→sent）"
DRAFT_RESP=$(curl -s -X POST "${BASE}/workshop/v2/apikey/feedbacks/${FB_ID}/drafts" "${AUTH[@]}" -d "{
  \"project_id\": ${PROJECT_ID}, \"content\": \"【进展草稿】已完成登录按钮事件绑定修复，正在验证。\", \"task_id\": ${TASK_ID}, \"source_files\": [\"src/auth/login.ts\"]}")
DRAFT_MID=$(echo "$DRAFT_RESP" | jq -r '.data.message_id // empty')
expect_contains "草稿创建 state=pending_review" "$(echo "$DRAFT_RESP" | jq -r '.data.state // empty')" "pending_review"
CONFIRM=$(curl -s -X POST "${BASE}/workshop/v2/user/feedbacks/${FB_ID}/messages/${DRAFT_MID}/confirm" "${AUTH[@]}" \
  -d '{"content": "【进展】登录问题已修复，正在做最终验证。"}')
expect_contains "草稿确认 state=sent" "$(echo "$CONFIRM" | jq -r '.data.state // .data.message.state // empty')" "sent"

DRAFT2=$(curl -s -X POST "${BASE}/workshop/v2/apikey/feedbacks/${FB_ID}/drafts" "${AUTH[@]}" -d "{
  \"project_id\": ${PROJECT_ID}, \"content\": \"【草稿2】待驳回验证。\", \"task_id\": ${TASK_ID}}")
DRAFT2_MID=$(echo "$DRAFT2" | jq -r '.data.message_id // empty')
REJECT=$(curl -s -X POST "${BASE}/workshop/v2/user/feedbacks/${FB_ID}/messages/${DRAFT2_MID}/reject" "${AUTH[@]}")
expect_contains "草稿驳回 rejected" "$(echo "$REJECT" | jq -r '.data.status // .data.message.status // .data.state // empty')" "reject"

# ── 9. 验收 + 产物交付（US-07）───────────────────────
echo "[9] 任务验收 → 产物交付回写"
for STATE in completed pending_review accepted; do
  curl -s -X PUT "${BASE}/workshop/v2/user/tasks/${TASK_ID}" "${AUTH[@]}" -d "{\"state\": \"${STATE}\"}" >/dev/null
done
TASK_STATE=$(${PSQL} "SELECT state FROM tasks WHERE id=${TASK_ID};")
[ "${TASK_STATE}" = "accepted" ]; check "task 推进到 accepted（实际 ${TASK_STATE}）" $?

ARTIFACT=$(curl -s -X POST "${BASE}/workshop/v2/user/tasks/${TASK_ID}/artifact" "${AUTH[@]}" -d "{
  \"artifact_url\": \"https://artifacts.e2e.local/login-fix-${TASK_ID}.zip\", \"build_id\": \"e2e-build-${TASK_ID}\"}")
expect_contains "artifact 回写返回产物地址" "$(echo "$ARTIFACT" | jq -r '.data.artifact_url // empty')" "login-fix-${TASK_ID}"
ART_URL=$(${PSQL} "SELECT artifact_url FROM tasks WHERE id=${TASK_ID};")
expect_contains "DB 中 artifact_url 已持久化" "${ART_URL}" "login-fix-${TASK_ID}"

# ── 10. 知识库与代码索引（F-09，降级伪 embedding）─────
echo "[10] 客户代码仓库 + 索引 + 检索测试"
mkdir -p /tmp/e2e-customer-repo/src
printf 'package auth\n\nfunc LoginUser(name string) bool { return name != "" }\n' > /tmp/e2e-customer-repo/src/auth.go
REPO=$(curl -s -X POST "${BASE}/workshop/v2/user/projects/${PROJECT_ID}/code-repos" "${AUTH[@]}" -d "{
  \"customer_id\": \"${CUSTOMER_ID}\", \"repo_path\": \"/tmp/e2e-customer-repo\", \"branch\": \"main\"}")
REPO_ID=$(echo "$REPO" | jq -r '.data.id // empty')
expect_matches "代码仓库创建成功" "r=${REPO_ID}" 'r=[0-9]*'
curl -s -X POST "${BASE}/workshop/v2/user/projects/${PROJECT_ID}/code-repos/${REPO_ID}/sync" "${AUTH[@]}" >/dev/null
curl -s -X POST "${BASE}/workshop/v2/user/projects/${PROJECT_ID}/code-repos/${REPO_ID}/index" "${AUTH[@]}" >/dev/null
sleep 3
SEARCH=$(curl -s -X POST "${BASE}/workshop/v2/user/projects/${PROJECT_ID}/knowledge/search-code" "${AUTH[@]}" \
  -d '{"query": "LoginUser"}')
HITS=$(echo "$SEARCH" | jq -r '.data | length // 0')
[ "${HITS}" -ge 1 ]; check "代码检索命中 ≥1（实际 ${HITS}）" $?
RETRIEVE2=$(curl -s -X POST "${BASE}/workshop/v2/user/feedbacks/retrieve" "${AUTH[@]}" \
  -d "{\"project_id\": ${PROJECT_ID}, \"query\": \"LoginUser\", \"conversation_id\": \"\"}")
expect_contains "智能检索可命中已索引代码" "$(echo "$RETRIEVE2" | jq -c '.data.hits // []')" "LoginUser"
expect_contains "检索命中标注来源文件路径（PRD F-03 来源标注）" "$(echo "$RETRIEVE2" | jq -r '.data.hits[0].title // empty')" "src/auth.go"

# ── 11. DB 级一致性断言 ──────────────────────────────
echo "[11] DB 级一致性断言"
LINK_COUNT=$(${PSQL} "SELECT COUNT(*) FROM feedback_task_links WHERE feedback_id=${FB_ID} AND task_id=${TASK_ID} AND relation_type='converted_to';")
[ "${LINK_COUNT}" = "1" ]; check "feedback_task_links 恰好一条 converted_to" $?
FB_STATUS=$(${PSQL} "SELECT status FROM feedbacks WHERE id=${FB_ID};")
[ "${FB_STATUS}" = "completed" ]; check "feedback 终态 completed（实际 ${FB_STATUS}）" $?
MSG_SENT=$(${PSQL} "SELECT COUNT(*) FROM feedback_messages WHERE feedback_id=${FB_ID} AND state='sent';")
[ "${MSG_SENT}" -ge 1 ]; check "至少一条 sent 状态草稿消息" $?
EVENT_COUNT=$(${PSQL} "SELECT COUNT(*) FROM project_events WHERE project_id=${PROJECT_ID} AND event='feedback.message.created';")
[ "${EVENT_COUNT}" -ge 1 ]; check "project_events 记录了消息事件（桥3 可重放）" $?
CHUNK_COUNT=$(${PSQL} "SELECT COUNT(*) FROM code_index.code_chunks WHERE project_id=${PROJECT_ID};")
[ "${CHUNK_COUNT}" -ge 1 ]; check "code_index.code_chunks 已落库（实际 ${CHUNK_COUNT}）" $?

# ── 汇总 ─────────────────────────────────────────────
echo "════════════════════════════════════════════════════"
echo "验收结果: PASS=${PASS} FAIL=${FAIL}"
if [ ${FAIL} -gt 0 ]; then
  printf '失败项:\n'; for s in "${FAILED_STEPS[@]}"; do echo "  - $s"; done
  exit 1
fi
echo "全部通过 ✅"
