#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://localhost:8081/workshop/v1"

USER1_ID="11111111-1111-1111-1111-111111111111"
USER1_NAME="alice"
USER2_ID="22222222-2222-2222-2222-222222222222"
USER2_NAME="bob"
USER3_ID="33333333-3333-3333-3333-333333333333"
USER3_NAME="carol"

pass=0
fail=0

check_code() {
  local label="$1"
  local expected="$2"
  local resp="$3"
  local code
  code=$(echo "$resp" | jq -r '.code // empty')
  if [[ "$code" == "$expected" ]]; then
    echo "PASS: $label"
    pass=$((pass + 1))
  else
    echo "FAIL: $label (expected=$expected got=$code)"
    echo "$resp" | jq -c '.' 2>/dev/null || echo "$resp"
    fail=$((fail + 1))
  fi
}

req() {
  local user="$1"
  local method="$2"
  local url="$3"
  local data="${4-}"
  local uid=""
  local uname=""
  case "$user" in
    u1) uid="$USER1_ID"; uname="$USER1_NAME";;
    u2) uid="$USER2_ID"; uname="$USER2_NAME";;
    u3) uid="$USER3_ID"; uname="$USER3_NAME";;
    *) echo "unknown user: $user"; return 1;;
  esac

  if [[ -n "$data" ]]; then
    curl -sS -X "$method" "$url" \
      -H "X-User-ID: $uid" \
      -H "X-User-Username: $uname" \
      -H "Content-Type: application/json" \
      -d "$data"
  else
    curl -sS -X "$method" "$url" \
      -H "X-User-ID: $uid" \
      -H "X-User-Username: $uname"
  fi
}

echo "== Health =="
resp=$(curl -sS -X GET "$BASE_URL/public/health")
check_code "health" "OK" "$resp"

resp=$(req u1 GET "$BASE_URL/user/header-info")
check_code "header-info user" "OK" "$resp"

resp=$(req u1 GET "$BASE_URL/apikey/header-info")
check_code "header-info apikey" "OK" "$resp"


echo "== Users =="
resp=$(req u1 POST "$BASE_URL/user/users" '{"username":"alice","avatar":"https://example.com/alice.png"}')
check_code "create user1" "OK" "$resp"

resp=$(req u2 POST "$BASE_URL/user/users" '{"username":"bob","avatar":"https://example.com/bob.png"}')
check_code "create user2" "OK" "$resp"

resp=$(req u3 POST "$BASE_URL/user/users" '{"username":"carol","avatar":"https://example.com/carol.png"}')
check_code "create user3" "OK" "$resp"

resp=$(req u1 GET "$BASE_URL/user/users")
check_code "get user1" "OK" "$resp"

resp=$(req u1 PUT "$BASE_URL/user/users" '{"avatar":"https://example.com/alice2.png"}')
check_code "update user1" "OK" "$resp"

resp=$(req u1 PUT "$BASE_URL/user/users" '{}')
check_code "update user1 missing fields" "USER_MISSING_FIELDS" "$resp"

resp=$(req u1 GET "$BASE_URL/user/oss/credentials")
if [[ $(echo "$resp" | jq -r '.code // empty') == "OK" ]]; then
  echo "PASS: get oss credentials"
  pass=$((pass + 1))
else
  echo "WARN: get oss credentials failed"
  echo "$resp" | jq -c '.' 2>/dev/null || echo "$resp"
fi


echo "== Organization =="
resp=$(req u1 POST "$BASE_URL/user/organizations" '{"name":"Test Org","description":"Org for API tests"}')
check_code "create organization" "OK" "$resp"
ORG_ID=$(echo "$resp" | jq -r '.data.id')
echo "ORG_ID=$ORG_ID"

resp=$(req u1 GET "$BASE_URL/user/organizations?page=1&page_size=10")
check_code "list organizations" "OK" "$resp"

resp=$(req u1 GET "$BASE_URL/user/organizations/$ORG_ID/members?page=1&page_size=10")
check_code "list org members" "OK" "$resp"
ORG_MEMBER_ID_U1=$(echo "$resp" | jq -r '.data.members[] | select(.is_me==true) | .id')
USER1_NUM_ID=$(echo "$resp" | jq -r '.data.members[] | select(.is_me==true) | .user_id')

echo "ORG_MEMBER_ID_U1=$ORG_MEMBER_ID_U1 USER1_NUM_ID=$USER1_NUM_ID"

resp=$(req u1 PUT "$BASE_URL/user/organizations/$ORG_ID" '{"name":"Test Org Updated","description":"Updated"}')
check_code "update organization" "OK" "$resp"

resp=$(req u1 POST "$BASE_URL/user/organizations/$ORG_ID/invitations" '{"role":"member","expires_in":24,"max_uses":2}')
check_code "invite org member" "OK" "$resp"
ORG_INVITE_CODE=$(echo "$resp" | jq -r '.data.invite_code')

echo "ORG_INVITE_CODE=$ORG_INVITE_CODE"

resp=$(req u2 POST "$BASE_URL/user/organizations/join" "{\"invite_code\":\"$ORG_INVITE_CODE\"}")
check_code "join org user2" "OK" "$resp"
ORG_MEMBER_ID_U2=$(echo "$resp" | jq -r '.data.id')
USER2_NUM_ID=$(echo "$resp" | jq -r '.data.user_id')

echo "ORG_MEMBER_ID_U2=$ORG_MEMBER_ID_U2 USER2_NUM_ID=$USER2_NUM_ID"

resp=$(req u1 POST "$BASE_URL/user/organizations/$ORG_ID/invitations" '{"role":"member","expires_in":24,"max_uses":1}')
check_code "invite org member 2" "OK" "$resp"
ORG_INVITE_CODE2=$(echo "$resp" | jq -r '.data.invite_code')

echo "ORG_INVITE_CODE2=$ORG_INVITE_CODE2"

resp=$(req u3 POST "$BASE_URL/user/organizations/join" "{\"invite_code\":\"$ORG_INVITE_CODE2\"}")
check_code "join org user3" "OK" "$resp"
ORG_MEMBER_ID_U3=$(echo "$resp" | jq -r '.data.id')
USER3_NUM_ID=$(echo "$resp" | jq -r '.data.user_id')

echo "ORG_MEMBER_ID_U3=$ORG_MEMBER_ID_U3 USER3_NUM_ID=$USER3_NUM_ID"

resp=$(req u1 PUT "$BASE_URL/user/organizations/$ORG_ID/members/role" "{\"target_user_id\":$USER2_NUM_ID,\"role\":\"admin\"}")
check_code "set org role user2 admin" "OK" "$resp"

resp=$(req u2 PUT "$BASE_URL/user/organizations/$ORG_ID/members/role" "{\"target_user_id\":$USER3_NUM_ID,\"role\":\"admin\"}")
check_code "org role update by non-owner" "ORGANIZATION_NO_PERMISSION" "$resp"


echo "== Project =="
resp=$(req u1 POST "$BASE_URL/user/projects" "{\"name\":\"API Test Project\",\"git_url\":\"https://github.com/example/repo.git\",\"organization_id\":$ORG_ID}")
check_code "create project" "OK" "$resp"
PROJECT_ID=$(echo "$resp" | jq -r '.data.id')

echo "PROJECT_ID=$PROJECT_ID"

resp=$(req u1 GET "$BASE_URL/user/projects?page=1&page_size=10")
check_code "list user projects" "OK" "$resp"

resp=$(req u1 PUT "$BASE_URL/user/projects/$PROJECT_ID" '{"name":"API Test Project Updated","git_url":"https://github.com/example/repo2.git"}')
check_code "update project" "OK" "$resp"

resp=$(req u1 POST "$BASE_URL/user/projects/$PROJECT_ID/invitations" '{"role":"member","expires_in":24,"max_uses":1}')
check_code "invite project member" "OK" "$resp"
PROJ_INVITE_CODE=$(echo "$resp" | jq -r '.data.invite_code')

echo "PROJ_INVITE_CODE=$PROJ_INVITE_CODE"

resp=$(req u2 POST "$BASE_URL/user/projects/join" "{\"invite_code\":\"$PROJ_INVITE_CODE\"}")
check_code "join project user2" "OK" "$resp"

resp=$(req u1 POST "$BASE_URL/user/projects/$PROJECT_ID/members" "{\"organization_member_id\":$ORG_MEMBER_ID_U3}")
check_code "add project member by org member id" "OK" "$resp"

resp=$(req u1 PUT "$BASE_URL/user/projects/$PROJECT_ID/members/role" "{\"target_user_id\":$USER2_NUM_ID,\"role\":\"admin\"}")
check_code "set project role user2 admin" "OK" "$resp"

resp=$(req u2 PUT "$BASE_URL/user/projects/$PROJECT_ID/members/role" "{\"target_user_id\":$USER3_NUM_ID,\"role\":\"admin\"}")
check_code "project role update by non-owner" "PROJECT_NO_PERMISSION" "$resp"

resp=$(req u2 GET "$BASE_URL/user/organization/projects?organization_id=$ORG_ID&page=1&page_size=10")
check_code "list org projects by admin" "OK" "$resp"


echo "== Tags =="
resp=$(req u1 POST "$BASE_URL/user/projects/$PROJECT_ID/tags" "{\"project_id\":$PROJECT_ID,\"name\":\"urgent\"}")
check_code "create tag" "OK" "$resp"
TAG_ID=$(echo "$resp" | jq -r '.data.id')

echo "TAG_ID=$TAG_ID"

resp=$(req u1 GET "$BASE_URL/user/projects/$PROJECT_ID/tags?page=1&page_size=10")
check_code "list tags" "OK" "$resp"

resp=$(req u1 PUT "$BASE_URL/user/tags/$TAG_ID" '{"name":"urgent-updated"}')
check_code "update tag" "OK" "$resp"

resp=$(req u1 DELETE "$BASE_URL/user/tags/$TAG_ID")
check_code "delete tag" "OK" "$resp"

resp=$(req u1 GET "$BASE_URL/user/projects/$PROJECT_ID/tags?include_deleted=true&page=1&page_size=10")
check_code "list tags include deleted" "OK" "$resp"


echo "== Tasks =="
resp=$(req u1 POST "$BASE_URL/user/tasks" "{\"project_id\":$PROJECT_ID,\"content\":\"Top task\",\"state\":\"pending\",\"executor_id\":$USER2_NUM_ID,\"priority\":0,\"tags\":\"alpha,beta\"}")
check_code "create task" "OK" "$resp"
TASK_ID=$(echo "$resp" | jq -r '.data.id')

echo "TASK_ID=$TASK_ID"

resp=$(req u1 POST "$BASE_URL/user/tasks" "{\"project_id\":$PROJECT_ID,\"content\":\"Child task\",\"father_id\":$TASK_ID,\"state\":\"pending\"}")
check_code "create child task" "OK" "$resp"
CHILD_TASK_ID=$(echo "$resp" | jq -r '.data.id')

echo "CHILD_TASK_ID=$CHILD_TASK_ID"

resp=$(req u1 PUT "$BASE_URL/user/tasks/$TASK_ID" "{\"state\":\"in_progress\",\"executor_id\":$USER2_NUM_ID}")
check_code "update task to in_progress" "OK" "$resp"

resp=$(req u3 PUT "$BASE_URL/user/tasks/$TASK_ID" '{"content":"try update by member"}')
check_code "update in_progress task by non-executor" "TASK_NO_PERMISSION" "$resp"

resp=$(req u2 PUT "$BASE_URL/user/tasks/$TASK_ID" '{"state":"completed"}')
check_code "update task by executor" "OK" "$resp"

resp=$(req u1 GET "$BASE_URL/user/tasks?project_id=$PROJECT_ID&page=1&page_size=10")
check_code "list tasks" "OK" "$resp"

resp=$(req u1 GET "$BASE_URL/user/tasks?project_id=$PROJECT_ID&father_id=0&page=1&page_size=10")
check_code "list top-level tasks" "OK" "$resp"

resp=$(req u1 GET "$BASE_URL/user/tasks?project_id=$PROJECT_ID&father_id=$TASK_ID&page=1&page_size=10")
check_code "list child tasks" "OK" "$resp"


echo "== Task Attachments =="
resp=$(req u1 POST "$BASE_URL/user/tasks/attachments" "{\"task_id\":$TASK_ID,\"type\":\"text\",\"content\":\"note 1\"}")
check_code "create attachment text" "OK" "$resp"
ATTACH_ID=$(echo "$resp" | jq -r '.data.id')

echo "ATTACH_ID=$ATTACH_ID"

resp=$(req u1 POST "$BASE_URL/user/tasks/attachments" "{\"task_id\":$TASK_ID,\"type\":\"url\",\"content\":\"https://example.com/doc\"}")
check_code "create attachment url" "OK" "$resp"

resp=$(req u1 GET "$BASE_URL/user/tasks/attachments?task_id=$TASK_ID&page=1&page_size=10")
check_code "list attachments" "OK" "$resp"

resp=$(req u1 PUT "$BASE_URL/user/tasks/attachments/$ATTACH_ID" '{"content":"note 1 updated"}')
check_code "update attachment" "OK" "$resp"

resp=$(req u2 PUT "$BASE_URL/user/tasks/attachments/$ATTACH_ID" '{"content":"update by non-creator"}')
if [[ $(echo "$resp" | jq -r '.code // empty') == "OK" ]]; then
  echo "WARN: update attachment by non-creator succeeded"
  fail=$((fail + 1))
else
  echo "PASS: update attachment by non-creator blocked"
  pass=$((pass + 1))
fi

resp=$(req u1 DELETE "$BASE_URL/user/tasks/attachments/$ATTACH_ID")
check_code "delete attachment" "OK" "$resp"

resp=$(req u1 GET "$BASE_URL/user/tasks/attachments?task_id=$TASK_ID&include_deleted=true&page=1&page_size=10")
check_code "list attachments include deleted" "OK" "$resp"


echo "== Task Deletions =="
resp=$(req u1 POST "$BASE_URL/user/tasks" "{\"project_id\":$PROJECT_ID,\"content\":\"Temp in progress\",\"state\":\"in_progress\"}")
check_code "create temp in_progress task" "OK" "$resp"
TEMP_TASK_ID=$(echo "$resp" | jq -r '.data.id')

echo "TEMP_TASK_ID=$TEMP_TASK_ID"

resp=$(req u3 DELETE "$BASE_URL/user/tasks/$TEMP_TASK_ID")
check_code "delete in_progress task by non-executor" "TASK_NO_PERMISSION" "$resp"

resp=$(req u1 DELETE "$BASE_URL/user/tasks/$TEMP_TASK_ID")
check_code "delete in_progress task by owner" "OK" "$resp"

resp=$(req u1 DELETE "$BASE_URL/user/tasks/$CHILD_TASK_ID")
check_code "delete child task" "OK" "$resp"

resp=$(req u1 DELETE "$BASE_URL/user/tasks/$TASK_ID")
check_code "delete main task" "OK" "$resp"

resp=$(req u1 GET "$BASE_URL/user/tasks?project_id=$PROJECT_ID&include_deleted=true&page=1&page_size=10")
check_code "list tasks include deleted" "OK" "$resp"


echo "== Project Cleanup =="
resp=$(req u2 DELETE "$BASE_URL/user/projects/$PROJECT_ID")
check_code "delete project by non-owner" "PROJECT_NO_PERMISSION" "$resp"

resp=$(req u1 DELETE "$BASE_URL/user/projects/$PROJECT_ID")
check_code "delete project by owner" "OK" "$resp"


echo "== Organization Cleanup =="
resp=$(req u2 DELETE "$BASE_URL/user/organizations/$ORG_ID")
check_code "delete org by non-owner" "ORGANIZATION_NO_PERMISSION" "$resp"

resp=$(req u1 DELETE "$BASE_URL/user/organizations/$ORG_ID")
check_code "delete org by owner" "OK" "$resp"


echo "== Summary =="
echo "PASS=$pass FAIL=$fail"

exit 0
