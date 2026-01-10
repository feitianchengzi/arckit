#!/bin/bash

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 切换到脚本所在目录（deploy/dev/）
cd "${SCRIPT_DIR}"

# 项目配置
CONTAINER_NAME="todo-service"
POSTGRES_CONTAINER="todo-postgres-dev"
COMPOSE_FILE="docker-compose.dev.yml"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 解析命令行参数（默认完全清理）
CLEAN_IMAGES=true
CLEAN_VOLUMES=true
CLEAN_ALL=false
SKIP_CONFIRM=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-images)
            CLEAN_IMAGES=false
            shift
            ;;
        --skip-volumes)
            CLEAN_VOLUMES=false
            shift
            ;;
        --all|-a)
            CLEAN_ALL=true
            shift
            ;;
        --yes|-y)
            SKIP_CONFIRM=true
            shift
            ;;
        *)
            echo -e "${RED}未知参数: $1${NC}"
            echo "用法: $0 [选项]"
            echo "  --skip-images    跳过删除镜像"
            echo "  --skip-volumes   跳过删除数据卷（保留数据库数据）"
            echo "  --all, -a        额外清理未使用的 Docker 系统资源"
            echo "  --yes, -y        跳过确认提示"
            exit 1
            ;;
    esac
done

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}开始完全清理开发环境...${NC}"
echo -e "${RED}警告: 这将删除所有容器、镜像、数据卷（包括数据库数据）和构建缓存！${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 确认提示
if [ "$SKIP_CONFIRM" = false ]; then
    read -p "确定要继续吗？(yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo -e "${YELLOW}已取消清理操作${NC}"
        exit 0
    fi
fi

# 1. 停止并删除容器（包括数据卷，如果启用）
echo -e "${BLUE}[1/4] 停止并删除容器...${NC}"
if [ -f "$COMPOSE_FILE" ]; then
    if [ "$CLEAN_VOLUMES" = true ]; then
        docker-compose -f ${COMPOSE_FILE} down -v
    else
        docker-compose -f ${COMPOSE_FILE} down
    fi
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 容器已停止并删除${NC}"
    else
        echo -e "${YELLOW}⚠ 使用 docker-compose down 失败，尝试直接删除容器...${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Compose 文件不存在: ${COMPOSE_FILE}${NC}"
fi

# 检查并删除容器（如果还存在）
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}删除容器 ${CONTAINER_NAME}...${NC}"
    docker rm -f ${CONTAINER_NAME} 2>/dev/null || true
fi

if docker ps -a --format '{{.Names}}' | grep -q "^${POSTGRES_CONTAINER}$"; then
    echo -e "${YELLOW}删除容器 ${POSTGRES_CONTAINER}...${NC}"
    docker rm -f ${POSTGRES_CONTAINER} 2>/dev/null || true
fi

# 2. 清理构建缓存
echo -e "${BLUE}[2/4] 清理 Docker 构建缓存...${NC}"
docker builder prune -f
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 构建缓存已清理${NC}"
else
    echo -e "${RED}✗ 清理构建缓存失败${NC}"
fi

# 3. 删除镜像
if [ "$CLEAN_IMAGES" = true ]; then
    echo -e "${BLUE}[3/4] 删除相关镜像...${NC}"
    
    # 尝试删除通过 docker-compose 构建的镜像
    docker-compose -f ${COMPOSE_FILE} down --rmi local 2>/dev/null || true
    
    # 查找并删除 todo-service 相关镜像
    IMAGES=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "todo.*todo-service|todo-service|^todo-todo-service" || true)
    if [ -n "$IMAGES" ]; then
        echo "$IMAGES" | while read -r img; do
            if [ -n "$img" ]; then
                echo -e "${YELLOW}删除镜像: $img${NC}"
                docker rmi -f "$img" 2>/dev/null || true
            fi
        done
    fi
    
    echo -e "${GREEN}✓ 镜像清理完成${NC}"
else
    echo -e "${YELLOW}[3/4] 跳过镜像删除${NC}"
fi

# 4. 删除数据卷（包括数据库数据）
if [ "$CLEAN_VOLUMES" = true ]; then
    echo -e "${BLUE}[4/4] 删除数据卷（包括数据库数据）...${NC}"
    
    # 删除 postgres-data 卷（如果存在）
    if docker volume ls --format "{{.Name}}" | grep -q "postgres-data"; then
        echo -e "${YELLOW}删除数据卷: postgres-data${NC}"
        docker volume rm postgres-data 2>/dev/null || true
    fi
    
    # 删除所有与项目相关的卷
    docker volume ls --format "{{.Name}}" | grep -E "todo|postgres" | while read -r vol; do
        if [ -n "$vol" ]; then
            echo -e "${YELLOW}删除数据卷: $vol${NC}"
            docker volume rm "$vol" 2>/dev/null || true
        fi
    done
    
    echo -e "${GREEN}✓ 数据卷已删除${NC}"
else
    echo -e "${YELLOW}[4/4] 跳过数据卷删除${NC}"
fi

# 5. 如果使用了 --all，额外清理系统缓存
if [ "$CLEAN_ALL" = true ]; then
    echo -e "${BLUE}[5/5] 清理未使用的 Docker 系统资源...${NC}"
    docker system prune -f
    echo -e "${GREEN}✓ 系统资源清理完成${NC}"
fi

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ 完全清理完成！${NC}"
echo -e "${GREEN}所有容器、镜像、数据卷（包括数据库）和构建缓存已删除${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

