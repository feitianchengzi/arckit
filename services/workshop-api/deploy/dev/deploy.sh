#!/bin/bash

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 切换到脚本所在目录（deploy/dev/）
cd "${SCRIPT_DIR}"

# 项目配置
CONTAINER_NAME="todo-service"
COMPOSE_FILE="docker-compose.dev.yml"  # 开发环境：包含本地数据库
ENV_FILE=".env.development"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示使用说明
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    echo -e "${BLUE}使用方法:${NC}"
    echo "  $0"
    echo ""
    echo -e "${BLUE}说明:${NC}"
    echo "  开发环境部署脚本，包含本地数据库"
    echo ""
    echo -e "${BLUE}示例:${NC}"
    echo "  $0                    # 部署开发环境"
    exit 0
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}部署环境: 开发环境${NC}"
echo -e "${BLUE}Compose 文件: ${COMPOSE_FILE}${NC}"
echo -e "${BLUE}========================================${NC}"

# 检查环境配置文件是否存在
if [ ! -f "${ENV_FILE}" ]; then
    EXAMPLE_FILE="env.development.example"
    echo -e "${RED}错误: 环境配置文件 ${ENV_FILE} 不存在！${NC}"
    echo -e "${YELLOW}请从示例文件复制创建：${NC}"
    echo -e "${YELLOW}  cp ${EXAMPLE_FILE} ${ENV_FILE}${NC}"
    exit 1
fi

# 加载环境配置文件
echo -e "${YELLOW}加载环境配置文件: ${ENV_FILE}${NC}"
export $(grep -v '^#' ${ENV_FILE} | xargs)

# 检查必要的环境变量
if [ -z "$PORT" ]; then
    echo -e "${RED}错误: 环境变量 PORT 未设置！${NC}"
    echo -e "${YELLOW}请在 .env 文件中设置 PORT 变量${NC}"
    exit 1
fi

if [ -z "$HOST" ]; then
    echo -e "${RED}错误: 环境变量 HOST 未设置！${NC}"
    echo -e "${YELLOW}请在 .env 文件中设置 HOST 变量${NC}"
    exit 1
fi

if [ -z "$BASE_URL" ]; then
    echo -e "${RED}错误: 环境变量 BASE_URL 未设置！${NC}"
    echo -e "${YELLOW}请在 .env 文件中设置 BASE_URL 变量${NC}"
    exit 1
fi

echo -e "${YELLOW}开始部署 todo-service...${NC}"
echo -e "${YELLOW}配置端口: ${PORT:-8081}${NC}"

# 检查容器是否在运行（开发环境：检查应用和数据库容器）
if docker ps -a --format '{{.Names}}' | grep -qE "^(todo-service|todo-postgres-dev)$"; then
    echo -e "${YELLOW}检测到容器存在，停止并清理...${NC}"
    docker-compose -f ${COMPOSE_FILE} down
fi

# 构建并启动容器（先尝试使用缓存构建）
echo -e "${YELLOW}构建并启动容器...${NC}"
if docker-compose -f ${COMPOSE_FILE} build; then
    # 构建成功，启动容器
    docker-compose -f ${COMPOSE_FILE} up -d
else
    # 构建失败，可能是缓存问题，清理缓存后重新构建
    echo -e "${YELLOW}构建失败，清理 Docker 构建缓存后重试...${NC}"
    docker builder prune -f
    echo -e "${YELLOW}使用 --no-cache 强制重新构建...${NC}"
    docker-compose -f ${COMPOSE_FILE} build --no-cache
    docker-compose -f ${COMPOSE_FILE} up -d
fi

# 等待服务启动
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 3

# 检查容器状态
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${GREEN}✓ 服务部署成功！${NC}"
    echo -e "${GREEN}容器名称: ${CONTAINER_NAME}${NC}"
    echo -e "${GREEN}访问地址: ${BASE_URL}/health${NC}"
    
    # 显示容器日志
    echo -e "${YELLOW}最近的容器日志:${NC}"
    docker logs --tail 10 ${CONTAINER_NAME}
else
    echo -e "${RED}✗ 服务启动失败！${NC}"
    echo -e "${YELLOW}查看日志:${NC}"
    docker logs ${CONTAINER_NAME}
    exit 1
fi
