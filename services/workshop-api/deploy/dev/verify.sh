#!/bin/bash
# 智能客服全链路本地验证脚本
# 用法: ./verify.sh [all|db|api|openhands|chain]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
WORKSHOP_PORT=${PORT:-8081}
OPENHANDS_PORT=${OPENHANDS_PORT:-8000}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5433}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-todo}
BASE_URL="http://localhost:${WORKSHOP_PORT}/workshop/v1"

# 工具函数
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# 1. 检查 Docker 服务状态
check_docker_services() {
  log_info "检查 Docker 服务状态..."
  
  if ! docker info > /dev/null 2>&1; then
    log_error "Docker 未运行"
    return 1
  fi
  
  log_success "Docker 运行正常"
  
  # 检查容器状态
  docker compose -f services/workshop-api/deploy/dev/docker-compose.dev.yml ps
}

# 2. 检查数据库连接
check_database() {
  log_info "检查数据库连接..."
  
  if command -v psql > /dev/null 2>&1; then
    if PGPASSWORD=postgres psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "SELECT 1" > /dev/null 2>&1; then
      log_success "数据库连接正常"
      
      # 检查 openhands_agents 表
      if PGPASSWORD=postgres psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "SELECT COUNT(*) FROM openhands_agents" > /dev/null 2>&1; then
        log_success "openhands_agents 表存在"
      else
        log_warn "openhands_agents 表不存在，需要执行迁移"
        log_info "执行: psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f services/workshop-api/database/migrations/20260917_openhands_config_up.sql"
      fi
      
      # 检查 customer_code_repos 表
      if PGPASSWORD=postgres psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "SELECT COUNT(*) FROM customer_code_repos" > /dev/null 2>&1; then
        log_success "customer_code_repos 表存在"
      else
        log_warn "customer_code_repos 表不存在，需要执行迁移"
      fi
      
      return 0
    else
      log_error "数据库连接失败"
      return 1
    fi
  else
    log_warn "psql 未安装，跳过数据库检查"
    return 0
  fi
}

# 3. 执行数据库迁移
run_migration() {
  log_info "执行数据库迁移..."
  
  if ! command -v psql > /dev/null 2>&1; then
    log_error "psql 未安装，无法执行迁移"
    return 1
  fi
  
  PGPASSWORD=postgres psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f services/workshop-api/database/migrations/20260917_openhands_config_up.sql
  
  if [ $? -eq 0 ]; then
    log_success "迁移执行成功"
  else
    log_error "迁移执行失败"
    return 1
  fi
}

# 4. 检查 OpenHands Agent Server
check_openhands() {
  log_info "检查 OpenHands Agent Server..."
  
  if curl -s -f http://localhost:${OPENHANDS_PORT}/health > /dev/null 2>&1; then
    log_success "OpenHands Agent Server 运行正常"
    
    # 检查 /server_info
    curl -s http://localhost:${OPENHANDS_PORT}/server_info | head -5
    return 0
  else
    log_warn "OpenHands Agent Server 未运行或不可达"
    log_info "启动命令: docker compose -f services/workshop-api/deploy/dev/docker-compose.dev.yml -f services/workshop-api/deploy/dev/docker-compose.openhands.yml up -d openhands-agent"
    return 1
  fi
}

# 5. 检查 Workshop API
check_workshop_api() {
  log_info "检查 Workshop API..."
  
  # 健康检查
  if curl -s -f "${BASE_URL}/public/health" > /dev/null 2>&1; then
    log_success "Workshop API 运行正常"
  else
    log_warn "Workshop API 未运行或不可达"
    log_info "启动命令: docker compose -f services/workshop-api/deploy/dev/docker-compose.dev.yml -f services/workshop-api/deploy/dev/docker-compose.openhands.yml up -d"
    return 1
  fi
  
  # OpenHands 健康检查
  log_info "检查 OpenHands 健康端点..."
  response=$(curl -s "${BASE_URL}/user/projects/1/openhands-health" 2>/dev/null)
  if echo "$response" | grep -q "status"; then
    log_success "OpenHands 健康端点可用"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
  else
    log_warn "OpenHands 健康端点不可用"
  fi
}

# 6. 检查 OpenHands 配置
check_openhands_config() {
  log_info "检查 OpenHands 配置..."
  
  response=$(curl -s "${BASE_URL}/user/projects/1/openhands-config" 2>/dev/null)
  if echo "$response" | grep -q "enabled"; then
    log_success "OpenHands 配置端点可用"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
  else
    log_warn "OpenHands 配置端点不可用"
  fi
}

# 7. 测试智能客服检索
test_retrieve() {
  log_info "测试智能客服检索..."
  
  response=$(curl -s -X POST "${BASE_URL}/user/feedbacks/retrieve" \
    -H "Content-Type: application/json" \
    -H "X-User-ID: 11111111-1111-1111-1111-111111111111" \
    -d '{"query": "test query", "conversation_id": ""}' 2>/dev/null)
  
  if echo "$response" | grep -q "code"; then
    log_success "智能客服检索端点可用"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
  else
    log_warn "智能客服检索端点不可用"
  fi
}

# 8. 测试客户代码仓库
test_code_repos() {
  log_info "测试客户代码仓库管理..."
  
  response=$(curl -s "${BASE_URL}/user/projects/1/code-repos" \
    -H "X-User-ID: 11111111-1111-1111-1111-111111111111" 2>/dev/null)
  
  if echo "$response" | grep -q "code"; then
    log_success "客户代码仓库端点可用"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
  else
    log_warn "客户代码仓库端点不可用"
  fi
}

# 9. 全链路验证
test_full_chain() {
  log_info "开始全链路验证..."
  
  # 1. 检查 Docker 服务
  check_docker_services
  if [ $? -ne 0 ]; then
    log_error "Docker 服务检查失败"
    return 1
  fi
  
  # 2. 检查数据库
  check_database
  
  # 3. 检查 OpenHands
  check_openhands
  
  # 4. 检查 Workshop API
  check_workshop_api
  
  # 5. 测试端点
  check_openhands_config
  test_retrieve
  test_code_repos
  
  log_success "全链路验证完成"
}

# 10. 生成验证报告
generate_report() {
  log_info "生成验证报告..."
  
  report_file="verify_report_$(date +%Y%m%d_%H%M%S).md"
  
  cat > "$report_file" << EOF
# 智能客服全链路验证报告

**生成时间**: $(date '+%Y-%m-%d %H:%M:%S')

## 服务状态

| 服务 | 状态 | 端口 |
|------|------|------|
| PostgreSQL | $(docker compose -f services/workshop-api/deploy/dev/docker-compose.dev.yml ps postgres 2>/dev/null | grep -q "Up" && echo "运行中" || echo "未运行") | ${DB_PORT} |
| Workshop API | $(curl -s -f "${BASE_URL}/public/health" > /dev/null 2>&1 && echo "运行中" || echo "未运行") | ${WORKSHOP_PORT} |
| OpenHands Agent | $(curl -s -f "http://localhost:${OPENHANDS_PORT}/health" > /dev/null 2>&1 && echo "运行中" || echo "未运行") | ${OPENHANDS_PORT} |

## 数据库表

| 表名 | 状态 |
|------|------|
| openhands_agents | $(PGPASSWORD=postgres psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "SELECT COUNT(*) FROM openhands_agents" > /dev/null 2>&1 && echo "存在" || echo "不存在") |
| customer_code_repos | $(PGPASSWORD=postgres psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "SELECT COUNT(*) FROM customer_code_repos" > /dev/null 2>&1 && echo "存在" || echo "不存在") |

## API 端点测试

| 端点 | 状态 |
|------|------|
| GET /openhands-config | $(curl -s "${BASE_URL}/user/projects/1/openhands-config" 2>/dev/null | grep -q "enabled" && echo "可用" || echo "不可用") |
| GET /openhands-health | $(curl -s "${BASE_URL}/user/projects/1/openhands-health" 2>/dev/null | grep -q "status" && echo "可用" || echo "不可用") |
| POST /feedbacks/retrieve | $(curl -s -X POST "${BASE_URL}/user/feedbacks/retrieve" -H "Content-Type: application/json" -H "X-User-ID: 11111111-1111-1111-1111-111111111111" -d '{"query":"test"}' 2>/dev/null | grep -q "code" && echo "可用" || echo "不可用") |
| GET /code-repos | $(curl -s "${BASE_URL}/user/projects/1/code-repos" -H "X-User-ID: 11111111-1111-1111-1111-111111111111" 2>/dev/null | grep -q "code" && echo "可用" || echo "不可用") |

## 结论

$(test_full_chain > /dev/null 2>&1 && echo "全链路验证通过" || echo "存在部分问题，请查看上方输出")

EOF
  
  log_success "验证报告已生成: $report_file"
}

# 主函数
main() {
  case "${1:-all}" in
    "docker")
      check_docker_services
      ;;
    "db")
      check_database
      ;;
    "migration")
      run_migration
      ;;
    "openhands")
      check_openhands
      ;;
    "api")
      check_workshop_api
      ;;
    "config")
      check_openhands_config
      ;;
    "retrieve")
      test_retrieve
      ;;
    "repos")
      test_code_repos
      ;;
    "chain")
      test_full_chain
      ;;
    "report")
      generate_report
      ;;
    "all")
      test_full_chain
      ;;
    *)
      echo "用法: $0 [all|db|api|openhands|chain|report]"
      echo ""
      echo "命令:"
      echo "  all       - 执行全链路验证（默认）"
      echo "  docker    - 检查 Docker 服务"
      echo "  db        - 检查数据库连接"
      echo "  migration - 执行数据库迁移"
      echo "  openhands - 检查 OpenHands Agent"
      echo "  api       - 检查 Workshop API"
      echo "  config    - 检查 OpenHands 配置"
      echo "  retrieve  - 测试智能客服检索"
      echo "  repos     - 测试客户代码仓库"
      echo "  chain     - 全链路验证"
      echo "  report    - 生成验证报告"
      ;;
  esac
}

main "$@"
