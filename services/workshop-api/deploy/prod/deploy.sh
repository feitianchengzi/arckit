#!/usr/bin/env bash

# 本地构建并上传候选镜像；远端脚本负责迁移、健康切换和失败回滚。
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$SCRIPT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

ENV_FILE=.env.workshop.production
COMPOSE_FILE=docker-compose.prod.yml
REMOTE_SCRIPT=remote-deploy.sh

usage() {
  echo -e "${BLUE}使用方法:${NC} $0 [--skip-build] [--skip-upload]"
  echo "  --skip-build   使用已经存在的本地镜像"
  echo "  --skip-upload  只完成本地镜像构建"
}

if [[ ${1:-} == -h || ${1:-} == --help ]]; then
  usage
  exit 0
fi

[[ -f $ENV_FILE ]] || {
  echo -e "${RED}错误: 缺少 $SCRIPT_DIR/$ENV_FILE${NC}" >&2
  echo "请从 env.workshop.production.example 复制并填写。" >&2
  exit 1
}

# shellcheck disable=SC1090
source "$ENV_FILE"

IMAGE_NAME=${IMAGE_NAME:-todo-service}
IMAGE_TAG=${IMAGE_TAG:-latest}
SERVER_HOST=${PROD_SERVER_HOST:-${SERVER_HOST:-}}
SERVER_USER=${PROD_SERVER_SSH_USER:-${SERVER_USER:-}}
SERVER_PORT=${PROD_SERVER_SSH_PORT:-${SERVER_PORT:-22}}
SSH_KEY=${PROD_SERVER_SSH_KEY_PATH:-${SSH_KEY:-}}
SERVER_DEPLOY_DIR=${SERVER_DEPLOY_DIR:-}

[[ $IMAGE_NAME =~ ^[a-zA-Z0-9._/-]+$ && $IMAGE_TAG =~ ^[a-zA-Z0-9._-]+$ ]] || {
  echo -e "${RED}错误: IMAGE_NAME 或 IMAGE_TAG 含不受支持的字符${NC}" >&2
  exit 1
}
[[ -n $SERVER_HOST && -n $SERVER_USER && $SERVER_PORT =~ ^[0-9]+$ ]] || {
  echo -e "${RED}错误: 服务器 SSH 配置不完整${NC}" >&2
  exit 1
}
[[ $SERVER_DEPLOY_DIR =~ ^/[a-zA-Z0-9._/-]+$ ]] || {
  echo -e "${RED}错误: SERVER_DEPLOY_DIR 必须是只含安全字符的绝对路径${NC}" >&2
  exit 1
}

FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"
IMAGE_TAR_NAME="${IMAGE_NAME//\//_}-${IMAGE_TAG}.tar"
IMAGE_TAR="$SCRIPT_DIR/$IMAGE_TAR_NAME"
APP_ENV_UPLOAD_FILE=$(mktemp "${TMPDIR:-/tmp}/workshop-app-env.XXXXXX")

cleanup() {
  rm -f -- "$APP_ENV_UPLOAD_FILE"
  if [[ -f $IMAGE_TAR ]]; then rm -f -- "$IMAGE_TAR"; fi
}
trap cleanup EXIT

ssh_args=(-p "$SERVER_PORT")
scp_args=(-P "$SERVER_PORT")
if [[ -n $SSH_KEY ]]; then
  SSH_KEY_EXPANDED=${SSH_KEY/#\~/$HOME}
  [[ -f $SSH_KEY_EXPANDED ]] || {
    echo -e "${RED}错误: SSH 密钥不存在: $SSH_KEY_EXPANDED${NC}" >&2
    exit 1
  }
  ssh_args+=(-i "$SSH_KEY_EXPANDED")
  scp_args+=(-i "$SSH_KEY_EXPANDED")
fi
remote_target="${SERVER_USER}@${SERVER_HOST}"
remote_dir="${SERVER_DEPLOY_DIR}/deploy/prod"

skip_build=false
skip_upload=false
while (($#)); do
  case $1 in
    --skip-build) skip_build=true ;;
    --skip-upload) skip_upload=true ;;
    *) echo -e "${RED}未知参数: $1${NC}" >&2; usage; exit 2 ;;
  esac
  shift
done

echo -e "${BLUE}生产部署: $FULL_IMAGE_NAME -> $remote_target:$remote_dir${NC}"

if [[ $skip_build == false ]]; then
  echo -e "${YELLOW}[1/4] 构建 linux/amd64 镜像${NC}"
  docker build --platform linux/amd64 -f "$PROJECT_ROOT/deploy/Dockerfile" -t "$FULL_IMAGE_NAME" "$PROJECT_ROOT"
else
  echo -e "${YELLOW}[1/4] 使用现有镜像${NC}"
  docker images --format '{{.Repository}}:{{.Tag}}' | grep -Fxq "$FULL_IMAGE_NAME" || {
    echo -e "${RED}错误: 本地镜像不存在: $FULL_IMAGE_NAME${NC}" >&2
    exit 1
  }
fi

if [[ $skip_upload == true ]]; then
  echo -e "${GREEN}本地镜像构建完成，按要求跳过上传。${NC}"
  exit 0
fi

echo -e "${YELLOW}[2/4] 导出镜像${NC}"
docker save "$FULL_IMAGE_NAME" -o "$IMAGE_TAR"

# 上传给容器的环境文件不携带 SSH、部署目录或镜像控制变量。
grep -Ev '^(PROD_SERVER_|SERVER_HOST=|SERVER_USER=|SERVER_PORT=|SERVER_DEPLOY_DIR=|SSH_KEY=|IMAGE_NAME=|IMAGE_TAG=|PROJECT_ROOT=)' "$ENV_FILE" > "$APP_ENV_UPLOAD_FILE" || true
[[ -s $APP_ENV_UPLOAD_FILE ]] || {
  echo -e "${RED}错误: 过滤后的应用环境文件为空${NC}" >&2
  exit 1
}

echo -e "${YELLOW}[3/4] 上传镜像、应用配置与受控部署脚本${NC}"
ssh "${ssh_args[@]}" "$remote_target" "mkdir -p -- '$remote_dir'"
scp "${scp_args[@]}" "$IMAGE_TAR" "$COMPOSE_FILE" "$REMOTE_SCRIPT" "$remote_target:$remote_dir/"
scp "${scp_args[@]}" "$APP_ENV_UPLOAD_FILE" "$remote_target:$remote_dir/$ENV_FILE"

echo -e "${YELLOW}[4/4] 远端迁移、切换、健康检查与失败回滚${NC}"
ssh "${ssh_args[@]}" "$remote_target" \
  "cd '$remote_dir' && bash './$REMOTE_SCRIPT' '$ENV_FILE' '$COMPOSE_FILE' '$IMAGE_TAR_NAME' '$IMAGE_NAME' '$IMAGE_TAG' 'todo-service'"

echo -e "${GREEN}✓ 生产部署完成且容器已通过 readiness 健康检查${NC}"
