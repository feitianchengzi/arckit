#!/usr/bin/env bash
# run_e2e.sh — E2E 测试运行器
#
# 使用 Playwright 运行端到端测试，收集截图作为证据。
#
# 用法: ./run_e2e.sh --url http://localhost:3000 --test-dir ./e2e

set -euo pipefail

URL=""
TEST_DIR="."
EVIDENCE_DIR="./evidence"
HEADED=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --url)        URL="$2"; shift 2 ;;
        --test-dir)   TEST_DIR="$2"; shift 2 ;;
        --evidence)   EVIDENCE_DIR="$2"; shift 2 ;;
        --headed)     HEADED="--headed"; shift ;;
        -h|--help)
            echo "用法: $0 --url URL [--test-dir DIR] [--evidence DIR] [--headed]"
            exit 0 ;;
        *) shift ;;
    esac
done

if [[ -z "$URL" ]]; then
    echo "❌ 必须指定 --url"
    exit 1
fi

mkdir -p "$EVIDENCE_DIR"

# 检查 Playwright
if ! command -v npx &>/dev/null; then
    echo "⚠️ npx 未安装，无法运行 Playwright"
    echo "安装: npm install -D @playwright/test && npx playwright install"
    # 降级：生成跳过标记和空报告，而非直接退出
    echo '{"status":"skipped","reason":"npx未安装"}' > "$EVIDENCE_DIR/playwright-result.json"
    echo "⏭️ 已生成跳过报告: $EVIDENCE_DIR/playwright-result.json"
    exit 0
fi

echo "🧪 运行 E2E 测试..."
echo "   URL: $URL"
echo "   测试目录: $TEST_DIR"
echo "   证据目录: $EVIDENCE_DIR"

# 设置环境变量
export BASE_URL="$URL"
export EVIDENCE_DIR

# 运行 Playwright
if npx playwright test --reporter=json "$TEST_DIR" $HEADED > "$EVIDENCE_DIR/playwright-result.json" 2>&1; then
    echo "✅ E2E 测试通过"
    EXIT_CODE=0
else
    echo "❌ E2E 测试失败"
    EXIT_CODE=1
fi

# 提取摘要
if command -v python3 &>/dev/null && [[ -f "$EVIDENCE_DIR/playwright-result.json" ]]; then
    python3 -c "
import json, sys
try:
    data = json.load(open('$EVIDENCE_DIR/playwright-result.json'))
    suites = data.get('suites', [])
    total = passed = failed = 0
    for s in suites:
        for spec in s.get('specs', []):
            total += 1
            if spec.get('ok'): passed += 1
            else: failed += 1
    print(f'   通过: {passed}/{total}, 失败: {failed}')
except Exception:
    pass
"
fi

exit $EXIT_CODE
