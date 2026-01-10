#!/bin/bash

# 生产环境部署脚本
# 流程：本地编译 -> 本地构建镜像 -> 上传到服务器 -> 服务器运行

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 切换到脚本所在目录（deploy/prod/）
cd "${SCRIPT_DIR}"

# 项目根目录（相对于 deploy/prod/）
PROJECT_ROOT="../.."

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
CONFIG_FILE="deploy.config"
ENV_FILE=".env.workshop.production"
COMPOSE_FILE="docker-compose.prod.yml"

# 加载部署配置
if [ -f "${CONFIG_FILE}" ]; then
    echo -e "${YELLOW}加载部署配置: ${CONFIG_FILE}${NC}"
    source "${CONFIG_FILE}"
else
    echo -e "${RED}错误: 部署配置文件 ${CONFIG_FILE} 不存在！${NC}"
    echo -e "${YELLOW}请从 deploy.config.example 复制创建：${NC}"
    echo -e "${YELLOW}  cp deploy.config.example ${CONFIG_FILE}${NC}"
    exit 1
fi

# 设置默认值（如果配置文件中没有定义）
IMAGE_NAME=${IMAGE_NAME:-todo-service}
IMAGE_TAG=${IMAGE_TAG:-latest}
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"
IMAGE_TAR="${IMAGE_NAME}.tar"

# 设置变量别名（使用新的 PROD_ 前缀变量，支持向后兼容）
SERVER_HOST=${PROD_SERVER_HOST:-${SERVER_HOST:-}}
SERVER_USER=${PROD_SERVER_SSH_USER:-${SERVER_USER:-}}
SERVER_PORT=${PROD_SERVER_SSH_PORT:-${SERVER_PORT:-22}}
SSH_KEY=${PROD_SERVER_SSH_KEY_PATH:-${SSH_KEY:-}}

# SSH 密钥文件配置
# 如果设置了 SSH_KEY，使用指定的密钥文件；否则使用默认密钥（SSH 会自动选择）
SSH_KEY_OPTION=""
if [ -n "$SSH_KEY" ]; then
    # 展开 ~ 为用户主目录
    SSH_KEY_EXPANDED="${SSH_KEY/#\~/$HOME}"
    if [ -f "$SSH_KEY_EXPANDED" ]; then
        SSH_KEY_OPTION="-i ${SSH_KEY_EXPANDED}"
    else
        echo -e "${YELLOW}警告: SSH 密钥文件 ${SSH_KEY_EXPANDED} 不存在，将使用默认密钥或密码认证${NC}"
    fi
fi

# 检查必要的配置
if [ -z "$SERVER_HOST" ] || [ -z "$SERVER_USER" ] || [ -z "$SERVER_DEPLOY_DIR" ]; then
    echo -e "${RED}错误: 部署配置不完整！${NC}"
    echo -e "${YELLOW}请确保 ${CONFIG_FILE} 中包含以下配置：${NC}"
    echo -e "${YELLOW}  PROD_SERVER_HOST (或 SERVER_HOST)${NC}"
    echo -e "${YELLOW}  PROD_SERVER_SSH_USER (或 SERVER_USER)${NC}"
    echo -e "${YELLOW}  SERVER_DEPLOY_DIR${NC}"
    exit 1
fi

# 显示使用说明
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    echo -e "${BLUE}使用方法:${NC}"
    echo "  $0 [选项]"
    echo ""
    echo -e "${BLUE}选项:${NC}"
    echo "  --skip-build    跳过本地构建，直接使用现有镜像"
    echo "  --skip-upload   跳过上传，仅在本地构建"
    echo "  -h, --help      显示帮助信息"
    echo ""
    echo -e "${BLUE}说明:${NC}"
    echo "  生产环境部署脚本"
    echo "  流程：本地编译 -> 本地构建镜像 -> 上传到服务器 -> 服务器运行"
    echo ""
    echo -e "${BLUE}配置:${NC}"
    echo "  需要配置 ${CONFIG_FILE} 文件，包含服务器 SSH 信息"
    echo "  需要配置 ${ENV_FILE} 文件，包含生产环境变量"
    exit 0
fi

# 解析参数
SKIP_BUILD=false
SKIP_UPLOAD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-upload)
            SKIP_UPLOAD=true
            shift
            ;;
        *)
            echo -e "${RED}未知参数: $1${NC}"
            echo "使用 $0 --help 查看帮助"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}生产环境部署脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${BLUE}部署配置:${NC}"
echo -e "  服务器: ${SERVER_USER}@${SERVER_HOST}:${SERVER_PORT:-22}"
echo -e "  部署目录: ${SERVER_DEPLOY_DIR}"
echo -e "  镜像名称: ${FULL_IMAGE_NAME}"
if [ -n "$SSH_KEY" ]; then
    SSH_KEY_EXPANDED="${SSH_KEY/#\~/$HOME}"
    if [ -f "$SSH_KEY_EXPANDED" ]; then
        echo -e "  SSH 密钥: ${SSH_KEY_EXPANDED}"
    else
        echo -e "  SSH 密钥: ${SSH_KEY} (文件不存在，将使用默认密钥或密码)"
    fi
else
    echo -e "  SSH 认证: 使用默认密钥或密码"
fi
echo ""

# 检查环境配置文件是否存在
if [ ! -f "${ENV_FILE}" ]; then
    EXAMPLE_FILE="env.workshop.production.example"
    echo -e "${RED}错误: 环境配置文件 ${ENV_FILE} 不存在！${NC}"
    echo -e "${YELLOW}请从示例文件复制创建：${NC}"
    echo -e "${YELLOW}  cp ${EXAMPLE_FILE} ${ENV_FILE}${NC}"
    exit 1
fi

# 步骤1: 本地构建 Docker 镜像
if [ "$SKIP_BUILD" = false ]; then
    echo -e "${YELLOW}[步骤 1/4] 本地构建 Docker 镜像...${NC}"
    cd "${PROJECT_ROOT}"
    
    echo -e "${YELLOW}构建镜像: ${FULL_IMAGE_NAME}${NC}"
    echo -e "${YELLOW}目标平台: linux/amd64 (服务器架构)${NC}"
    if docker build --platform linux/amd64 -f deploy/Dockerfile -t "${FULL_IMAGE_NAME}" .; then
        echo -e "${GREEN}✓ 镜像构建成功${NC}"
    else
        echo -e "${RED}✗ 镜像构建失败${NC}"
        exit 1
    fi
    
    cd "${SCRIPT_DIR}"
else
    echo -e "${YELLOW}[步骤 1/4] 跳过本地构建（使用现有镜像）${NC}"
    
    # 检查镜像是否存在
    if ! docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^${FULL_IMAGE_NAME}$"; then
        echo -e "${RED}错误: 镜像 ${FULL_IMAGE_NAME} 不存在！${NC}"
        echo -e "${YELLOW}请先构建镜像或移除 --skip-build 参数${NC}"
        exit 1
    fi
fi

if [ "$SKIP_UPLOAD" = true ]; then
    echo -e "${YELLOW}跳过上传步骤（--skip-upload 模式）${NC}"
    exit 0
fi

# 步骤2: 保存镜像为 tar 文件
echo -e "${YELLOW}[步骤 2/4] 保存镜像为 tar 文件...${NC}"
echo -e "${YELLOW}保存镜像: ${IMAGE_TAR}${NC}"
if docker save "${FULL_IMAGE_NAME}" -o "${IMAGE_TAR}"; then
    echo -e "${GREEN}✓ 镜像保存成功${NC}"
    IMAGE_SIZE=$(du -h "${IMAGE_TAR}" | cut -f1)
    echo -e "${BLUE}镜像大小: ${IMAGE_SIZE}${NC}"
else
    echo -e "${RED}✗ 镜像保存失败${NC}"
    exit 1
fi

# 步骤3: 上传文件到服务器
echo -e "${YELLOW}[步骤 3/4] 上传文件到服务器...${NC}"

# 创建服务器部署目录
echo -e "${YELLOW}创建服务器部署目录: ${SERVER_DEPLOY_DIR}${NC}"
SSH_CMD="ssh ${SSH_KEY_OPTION} -p ${SERVER_PORT:-22} ${SERVER_USER}@${SERVER_HOST}"
$SSH_CMD "mkdir -p ${SERVER_DEPLOY_DIR}/deploy/prod" || {
    echo -e "${RED}✗ 无法创建服务器目录${NC}"
    exit 1
}

# 上传镜像文件
echo -e "${YELLOW}上传镜像文件: ${IMAGE_TAR}${NC}"
if scp ${SSH_KEY_OPTION} -P ${SERVER_PORT:-22} "${IMAGE_TAR}" "${SERVER_USER}@${SERVER_HOST}:${SERVER_DEPLOY_DIR}/deploy/prod/"; then
    echo -e "${GREEN}✓ 镜像文件上传成功${NC}"
else
    echo -e "${RED}✗ 镜像文件上传失败${NC}"
    exit 1
fi

# 上传环境配置文件
echo -e "${YELLOW}上传环境配置文件: ${ENV_FILE}${NC}"
if scp ${SSH_KEY_OPTION} -P ${SERVER_PORT:-22} "${ENV_FILE}" "${SERVER_USER}@${SERVER_HOST}:${SERVER_DEPLOY_DIR}/deploy/prod/"; then
    echo -e "${GREEN}✓ 环境配置文件上传成功${NC}"
else
    echo -e "${RED}✗ 环境配置文件上传失败${NC}"
    exit 1
fi

# 上传 docker-compose 文件
echo -e "${YELLOW}上传 Docker Compose 文件: ${COMPOSE_FILE}${NC}"
if scp ${SSH_KEY_OPTION} -P ${SERVER_PORT:-22} "${COMPOSE_FILE}" "${SERVER_USER}@${SERVER_HOST}:${SERVER_DEPLOY_DIR}/deploy/prod/"; then
    echo -e "${GREEN}✓ Docker Compose 文件上传成功${NC}"
else
    echo -e "${RED}✗ Docker Compose 文件上传失败${NC}"
    exit 1
fi

# 步骤4: 在服务器上部署
echo -e "${YELLOW}[步骤 4/4] 在服务器上部署...${NC}"

# 在服务器上执行部署命令
echo -e "${YELLOW}在服务器上执行部署...${NC}"

# 检测服务器上的 docker-compose 命令（支持 docker-compose 和 docker compose）
$SSH_CMD "cd ${SERVER_DEPLOY_DIR}/deploy/prod && \
    echo '检测 Docker Compose 命令...' && \
    if command -v docker-compose >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD='docker-compose'
    elif docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD='docker compose'
    else
        echo '错误: 未找到 docker-compose 或 docker compose 命令'
        exit 1
    fi && \
    echo '使用命令: '\$DOCKER_COMPOSE_CMD && \
    echo '加载 Docker 镜像...' && \
    docker load -i ${IMAGE_TAR} && \
    echo '停止并清理旧容器...' && \
    \$DOCKER_COMPOSE_CMD -f ${COMPOSE_FILE} down 2>/dev/null || true && \
    echo '启动新容器...' && \
    \$DOCKER_COMPOSE_CMD -f ${COMPOSE_FILE} up -d && \
    echo '清理临时文件...' && \
    rm -f ${IMAGE_TAR} && \
    echo '等待服务启动...' && \
    sleep 3 && \
    docker ps --filter 'name=todo-service' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' && \
    echo '查看服务日志...' && \
    docker logs --tail 10 todo-service" || {
    echo -e "${RED}✗ 服务器部署失败${NC}"
    exit 1
}

# 清理本地临时文件
echo -e "${YELLOW}清理本地临时文件...${NC}"
rm -f "${IMAGE_TAR}"

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ 生产环境部署完成！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}部署信息:${NC}"
echo -e "  服务器: ${SERVER_USER}@${SERVER_HOST}"
echo -e "  部署目录: ${SERVER_DEPLOY_DIR}/deploy/prod"
echo -e "  容器名称: todo-service"
echo ""
