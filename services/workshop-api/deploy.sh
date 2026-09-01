#!/bin/bash

# 快速部署脚本
# 支持参数选择执行开发或生产部署脚本，默认开发

# 获取环境参数，默认为 development
ENV=${1:-development}

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示使用说明
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    echo -e "${BLUE}使用方法:${NC}"
    echo "  $0 [环境]"
    echo ""
    echo -e "${BLUE}环境参数:${NC}"
    echo "  dev, development  - 开发环境（默认）"
    echo "  prod, production  - 生产环境"
    echo ""
    echo -e "${BLUE}示例:${NC}"
    echo "  $0                    # 使用开发环境（默认）"
    echo "  $0 dev                # 使用开发环境"
    echo "  $0 development        # 使用开发环境"
    echo "  $0 prod               # 使用生产环境"
    echo "  $0 production         # 使用生产环境"
    exit 0
fi

# 标准化环境参数
case "$ENV" in
    dev|development)
        ENV="development"
        DEPLOY_SCRIPT="deploy/dev/deploy.sh"
        ;;
    prod|production)
        ENV="production"
        DEPLOY_SCRIPT="deploy/prod/deploy.sh"
        ;;
    *)
        echo -e "${RED}错误: 无效的环境参数 '${ENV}'${NC}"
        echo -e "${YELLOW}支持的环境: dev, development, prod, production${NC}"
        echo -e "${YELLOW}使用 $0 --help 查看帮助${NC}"
        exit 1
        ;;
esac

# 检查部署脚本是否存在
if [ ! -f "${DEPLOY_SCRIPT}" ]; then
    echo -e "${RED}错误: 部署脚本 ${DEPLOY_SCRIPT} 不存在！${NC}"
    exit 1
fi

# 确保部署脚本可执行
chmod +x "${DEPLOY_SCRIPT}" 2>/dev/null || true

# 执行对应的部署脚本
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}执行 ${ENV} 环境部署脚本${NC}"
echo -e "${BLUE}脚本路径: ${DEPLOY_SCRIPT}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 执行部署脚本，传递剩余参数
exec "${DEPLOY_SCRIPT}" "${@:2}"
