#!/bin/bash

# OSS 部署脚本
# 用途：将 dist 目录下的文件上传到阿里云 OSS

set -e  # 遇到错误立即退出

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}   OSS 部署脚本${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

# 获取脚本所在的目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# 进入 frontend 目录（脚本在 frontend/script/ 下）
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${YELLOW}📂 进入目录: ${FRONTEND_DIR}${NC}"
cd "$FRONTEND_DIR"

# 检查 Python 环境
echo -e "\n${YELLOW}🔍 检查 Python 环境...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ 未找到 python3${NC}"
    echo -e "${YELLOW}   请安装 Python 3: https://www.python.org/downloads/${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
echo -e "${GREEN}   ✓ ${PYTHON_VERSION}${NC}"

# 检查 oss2 模块
echo -e "\n${YELLOW}🔍 检查 Python 依赖...${NC}"
if ! python3 -c "import oss2" 2>/dev/null; then
    echo -e "${YELLOW}   ⚠️  未找到 oss2 模块${NC}"
    echo -e "${YELLOW}   正在安装 oss2...${NC}"
    if ! pip3 install oss2 python-dotenv; then
        echo -e "${RED}❌ 安装失败，请手动运行: pip3 install oss2 python-dotenv${NC}"
        exit 1
    fi
    echo -e "${GREEN}   ✓ oss2 安装成功${NC}"
else
    echo -e "${GREEN}   ✓ oss2 已安装${NC}"
fi

# 检查 python-dotenv 模块
if ! python3 -c "import dotenv" 2>/dev/null; then
    echo -e "${YELLOW}   ⚠️  未找到 python-dotenv 模块${NC}"
    echo -e "${YELLOW}   正在安装 python-dotenv...${NC}"
    if ! pip3 install python-dotenv; then
        echo -e "${RED}❌ 安装失败，请手动运行: pip3 install python-dotenv${NC}"
        exit 1
    fi
    echo -e "${GREEN}   ✓ python-dotenv 安装成功${NC}"
else
    echo -e "${GREEN}   ✓ python-dotenv 已安装${NC}"
fi

# 检查 .env 文件
echo -e "\n${YELLOW}🔍 检查环境配置...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ 未找到 .env 文件${NC}"
    echo -e "${YELLOW}   请创建 .env 文件并配置以下参数:${NC}"
    echo -e "${BLUE}   OSS_ACCESS_KEY_ID=your-access-key-id${NC}"
    echo -e "${BLUE}   OSS_ACCESS_KEY_SECRET=your-access-key-secret${NC}"
    echo -e "${BLUE}   OSS_ENDPOINT=http://oss-cn-qingdao.aliyuncs.com${NC}"
    echo -e "${BLUE}   OSS_BUCKET_NAME=your-bucket-name${NC}"
    echo -e "${BLUE}   OSS_PREFIX=${NC}  # 可选，默认为空（根目录）${NC}"
    echo -e "\n${YELLOW}   参考 .env.example 文件（如果存在）${NC}"
    exit 1
fi

echo -e "${GREEN}   ✓ 找到 .env 文件${NC}"

# 自动执行构建
echo -e "\n${YELLOW}🔨 自动执行构建...${NC}"
BUILD_SCRIPT="$SCRIPT_DIR/build-vite.sh"

if [ ! -f "$BUILD_SCRIPT" ]; then
    echo -e "${RED}❌ 未找到构建脚本: $BUILD_SCRIPT${NC}"
    exit 1
fi

# 确保构建脚本可执行
chmod +x "$BUILD_SCRIPT"

# 执行构建脚本
echo -e "${YELLOW}   运行: $BUILD_SCRIPT${NC}"
if ! bash "$BUILD_SCRIPT"; then
    echo -e "\n${RED}❌ 构建失败，部署已取消${NC}"
    exit 1
fi

# 验证构建结果
echo -e "\n${YELLOW}🔍 验证构建文件...${NC}"
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ 构建失败：dist 目录不存在${NC}"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ 构建失败：dist 目录中未找到 index.html${NC}"
    exit 1
fi

echo -e "${GREEN}   ✓ dist 目录存在${NC}"
FILE_COUNT=$(find "dist" -type f | wc -l | tr -d ' ')
DIR_SIZE=$(du -sh "dist" | awk '{print $1}')
echo -e "${GREEN}   ✓ 共 ${FILE_COUNT} 个文件，总大小: ${DIR_SIZE}${NC}"

# 执行 Python 脚本
echo -e "\n${YELLOW}🚀 开始部署到 OSS...${NC}"
PYTHON_SCRIPT="$SCRIPT_DIR/deploy-oss.py"

if [ ! -f "$PYTHON_SCRIPT" ]; then
    echo -e "${RED}❌ 未找到 Python 脚本: $PYTHON_SCRIPT${NC}"
    exit 1
fi

# 确保 Python 脚本可执行
chmod +x "$PYTHON_SCRIPT"

# 运行 Python 脚本
python3 "$PYTHON_SCRIPT"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}✅ 部署完成！${NC}"
else
    echo -e "\n${RED}❌ 部署失败（退出码: $EXIT_CODE）${NC}"
    exit $EXIT_CODE
fi
