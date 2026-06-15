#!/usr/bin/env bash
# rollback.sh — 回滚执行
#
# 对应 SKILL.md 回滚方案。回滚代码 + 触发回滚部署 + 验证。
#
# 用法: ./rollback.sh --merge-commit abc123 --previous-version v1.2.3

set -euo pipefail

MERGE_COMMIT=""
PREVIOUS_VERSION=""
MAIN_BRANCH="${MAIN_BRANCH:-main}"

while [[ $# -gt 0 ]]; do
    case $1 in
        --merge-commit)     MERGE_COMMIT="$2"; shift 2 ;;
        --previous-version) PREVIOUS_VERSION="$2"; shift 2 ;;
        --main-branch)      MAIN_BRANCH="$2"; shift 2 ;;
        -h|--help)
            echo "用法: $0 --merge-commit SHA --previous-version vX.Y.Z"
            exit 0 ;;
        *) shift ;;
    esac
done

if [[ -z "$MERGE_COMMIT" ]]; then
    echo "❌ 必须指定 --merge-commit（要回滚的合并提交）"
    exit 1
fi

echo "⏪ 回滚执行"
echo "   回滚提交: $MERGE_COMMIT"
echo "   目标版本: ${PREVIOUS_VERSION:-未指定}"
echo ""

# 1. 回滚代码
echo "🔄 回滚代码..."
git checkout "$MAIN_BRANCH"
git pull origin "$MAIN_BRANCH"
git revert --no-edit "$MERGE_COMMIT"
echo "✅ 代码已回滚"

# 2. 推送
echo "📤 推送回滚提交..."
git push origin "$MAIN_BRANCH"
echo "✅ 已推送"

# 3. 触发回滚部署（如果有CI）
if [[ -n "$PREVIOUS_VERSION" ]]; then
    echo "🚀 触发回滚部署到 $PREVIOUS_VERSION..."
    if command -v gh &>/dev/null; then
        if gh workflow list --limit 1 2>/dev/null | grep -q "deploy"; then
            gh workflow run deploy.yml -f version="$PREVIOUS_VERSION" 2>/dev/null || echo "⚠️ 无法触发部署流水线"
        else
            echo "⚠️ 未发现 deploy workflow，请手动部署 $PREVIOUS_VERSION"
        fi
    else
        echo "⚠️ gh CLI 未安装，请手动触发部署"
    fi
fi

# 4. 验证回滚
echo ""
echo "✅ 回滚完成"
echo "   请验证："
echo "   1. 服务健康检查"
echo "   2. 错误率是否恢复到基线"
echo "   3. 通知团队回滚原因和后续计划"
