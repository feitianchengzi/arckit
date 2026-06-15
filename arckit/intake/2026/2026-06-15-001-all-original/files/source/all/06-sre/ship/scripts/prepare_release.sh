#!/usr/bin/env bash
# prepare_release.sh — 发布准备
#
# 同步主分支、运行全量测试、确认版本号。
# 对应 SKILL.md Step2 准备发布。
#
# 用法: ./prepare_release.sh --branch feature-xyz --version-bump patch

set -euo pipefail

BRANCH=""
VERSION_BUMP="patch"
MAIN_BRANCH="main"

while [[ $# -gt 0 ]]; do
    case $1 in
        --branch)        BRANCH="$2"; shift 2 ;;
        --version-bump)  VERSION_BUMP="$2"; shift 2 ;;
        --main-branch)   MAIN_BRANCH="$2"; shift 2 ;;
        -h|--help)
            echo "用法: $0 --branch FEATURE_BRANCH [--version-bump patch|minor|major]"
            exit 0 ;;
        *) shift ;;
    esac
done

if [[ -z "$BRANCH" ]]; then
    echo "❌ 必须指定 --branch"
    exit 1
fi

echo "🚢 发布准备"
echo "   功能分支: $BRANCH"
echo "   主分支: $MAIN_BRANCH"
echo "   版本升级: $VERSION_BUMP"
echo ""

# Step 1: 同步主分支
echo "📥 同步主分支..."
git checkout "$MAIN_BRANCH"
git pull origin "$MAIN_BRANCH"

# Step 2: 合并功能分支
echo "🔀 合并功能分支..."
if git merge --no-ff "$BRANCH" 2>&1; then
    echo "✅ 合并成功"
else
    echo "❌ 合并冲突，请手动解决后重试"
    exit 1
fi

# Step 3: 运行全量测试
echo "🧪 运行全量测试..."
if command -v npm &>/dev/null && [[ -f package.json ]]; then
    npm test
elif command -v pytest &>/dev/null; then
    pytest
elif command -v go &>/dev/null; then
    go test ./...
else
    echo "⚠️ 未检测到测试框架，跳过测试（需人工确认）"
fi

# Step 4: 确认版本号
echo "📦 版本升级: $VERSION_BUMP"
if command -v npm &>/dev/null && [[ -f package.json ]]; then
    npm version "$VERSION_BUMP" --no-git-tag-version
    NEW_VERSION=$(node -p "require('./package.json').version")
    echo "   新版本: v$NEW_VERSION"
else
    echo "   ⚠️ 非npm项目，请手动更新版本号"
fi

echo ""
echo "✅ 发布准备完成"
echo "   下一步: 执行发布（ship Step3）"
