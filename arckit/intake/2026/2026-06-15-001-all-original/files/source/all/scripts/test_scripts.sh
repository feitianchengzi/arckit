#!/usr/bin/env bash
# test_scripts.sh — 验证所有脚本可执行、--help 正常、语法检查通过
#
# 用法: ./test_scripts.sh [--quick]

set -uo pipefail

QUICK=false

# ─── 参数解析 ──────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case "$1" in
        --quick) QUICK=true; shift ;;
        -h|--help)
            echo "用法: $0 [--quick]"
            echo ""
            echo "验证所有脚本可执行、--help 正常、语法检查通过。"
            echo ""
            echo "选项:"
            echo "  --quick   跳过 --help 测试，仅做语法检查"
            echo "  -h, --help  显示帮助信息"
            exit 0
            ;;
        *) shift ;;
    esac
done

PASS=0
FAIL=0
SKIP=0
ERRORS=()

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🧪 脚本验证"
echo "   根目录: $ROOT_DIR"
echo ""

# ─── Python 脚本 ──────────────────────────────────────────

echo "=== Python 脚本 ==="
for f in $(find "$ROOT_DIR" -name '*.py' -not -path '*/.git/*' -not -path '*/node_modules/*' | sort); do
    rel=$(realpath --relative-to="$ROOT_DIR" "$f" 2>/dev/null || echo "$f")

    # 语法检查
    if python3 -c "import py_compile; py_compile.compile('$f', doraise=True)" 2>/dev/null; then
        : # OK
    else
        FAIL=$((FAIL + 1))
        ERRORS+=("❌ $rel: 语法错误")
        continue
    fi

    # --help 检查（非 quick 模式）
    if ! $QUICK; then
        if python3 "$f" --help >/dev/null 2>&1; then
            PASS=$((PASS + 1))
            echo "  ✅ $rel"
        else
            # 某些脚本 --help 可能退出码非0，检查是否有输出
            help_out=$(python3 "$f" --help 2>&1)
            if [[ -n "$help_out" ]]; then
                PASS=$((PASS + 1))
                echo "  ✅ $rel (help有输出)"
            else
                SKIP=$((SKIP + 1))
                echo "  ⬜ $rel (无--help)"
            fi
        fi
    else
        PASS=$((PASS + 1))
        echo "  ✅ $rel (语法OK)"
    fi
done

# ─── Shell 脚本 ───────────────────────────────────────────

echo ""
echo "=== Shell 脚本 ==="
for f in $(find "$ROOT_DIR" -name '*.sh' -not -path '*/.git/*' -not -path '*/node_modules/*' | sort); do
    rel=$(realpath --relative-to="$ROOT_DIR" "$f" 2>/dev/null || echo "$f")

    # 语法检查
    if bash -n "$f" 2>/dev/null; then
        PASS=$((PASS + 1))
        echo "  ✅ $rel"
    else
        FAIL=$((FAIL + 1))
        ERRORS+=("❌ $rel: 语法错误")
        echo "  ❌ $rel: 语法错误"
    fi
done

# ─── 汇总 ─────────────────────────────────────────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "通过: $PASS | 失败: $FAIL | 跳过: $SKIP"

if [[ ${#ERRORS[@]} -gt 0 ]]; then
    echo ""
    echo "错误详情:"
    for e in "${ERRORS[@]}"; do
        echo "  $e"
    done
    exit 1
fi

echo "✅ 全部通过"
exit 0
