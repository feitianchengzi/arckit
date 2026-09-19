#!/bin/bash
# 智能客服本地快速启动脚本
# 用法: ./start.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 检查环境
check_environment() {
  log_info "检查环境..."
  
  # 检查 Docker
  if ! docker info > /dev/null 2>&1; then
    log_error "Docker 未运行，请先启动 Docker"
    exit 1
  fi
  
  # 检查 docker compose
  if ! docker compose version > /dev/null 2>&1; then
    log_error "docker compose 未安装"
    exit 1
  fi
  
  log_success "环境检查通过"
}

# 检查配置文件
check_config() {
  log_info "检查配置文件..."
  
  env_file="services/workshop-api/deploy/dev/.env.development"
  
  if [ ! -f "$env_file" ]; then
    log_warn ".env.development 文件不存在，从示例创建..."
    cp services/workshop-api/deploy/dev/env.development.example "$env_file"
    log_warn "请编辑 $env_file 配置 LLM_API_KEY"
  fi
  
  # 检查是否配置了 LLM_API_KEY
  if grep -q "LLM_API_KEY=your_llm_api_key_here" "$env_file" 2>/dev/null; then
    log_warn "LLM_API_KEY 未配置，请编辑 $env_file"
    log_warn "跳过 OpenHands Agent Server 启动"
    return 1
  fi
  
  log_success "配置检查通过"
  return 0
}

# 执行数据库迁移
run_migration() {
  log_info "执行数据库迁移..."
  
  # 等待 PostgreSQL 就绪
  log_info "等待 PostgreSQL 就绪..."
  for i in {1..30}; do
    if docker compose -f services/workshop-api/deploy/dev/docker-compose.dev.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
      log_success "PostgreSQL 就绪"
      break
    fi
    sleep 1
  done
  
  # 执行迁移
  if command -v psql > /dev/null 2>&1; then
    PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d todo -f services/workshop-api/database/migrations/20260917_openhands_config_up.sql 2>/dev/null || true
    log_success "迁移执行完成"
  else
    log_warn "psql 未安装，请手动执行迁移"
  fi
}

# 启动服务
start_services() {
  log_info "启动服务..."
  
  # 检查是否需要启动 OpenHands
  if check_config; then
    log_info "启动完整服务（含 OpenHands Agent）..."
    docker compose -f services/workshop-api/deploy/dev/docker-compose.dev.yml -f services/workshop-api/deploy/dev/docker-compose.openhands.yml up -d
  else
    log_info "启动基础服务（不含 OpenHands Agent）..."
    docker compose -f services/workshop-api/deploy/dev/docker-compose.dev.yml up -d
  fi
  
  log_success "服务启动完成"
}

# 等待服务就绪
wait_for_services() {
  log_info "等待服务就绪..."
  
  # 等待 Workshop API
  for i in {1..30}; do
    if curl -s -f http://localhost:8081/workshop/v1/public/health > /dev/null 2>&1; then
      log_success "Workshop API 就绪"
      break
    fi
    sleep 1
  done
  
  # 等待 OpenHands（如果启动了）
  if curl -s -f http://localhost:8000/health > /dev/null 2>&1; then
    log_success "OpenHands Agent Server 就绪"
  else
    log_warn "OpenHands Agent Server 未启动"
  fi
}

# 显示状态
show_status() {
  log_info "服务状态："
  docker compose -f services/workshop-api/deploy/dev/docker-compose.dev.yml ps
  
  echo ""
  log_info "访问地址："
  echo "  Workshop API: http://localhost:8081"
  echo "  健康检查: http://localhost:8081/workshop/v1/public/health"
  echo "  OpenHands: http://localhost:8000"
  echo ""
  log_info "验证命令："
  echo "  ./verify.sh all       # 全链路验证"
  echo "  ./verify.sh chain     # 验证全链路"
  echo "  ./verify.sh report    # 生成验证报告"
}

# 主函数
main() {
  echo "=========================================="
  echo "  智能客服本地快速启动"
  echo "=========================================="
  echo ""
  
  check_environment
  start_services
  run_migration
  wait_for_services
  show_status
  
  echo ""
  log_success "启动完成！"
}

main "$@"
