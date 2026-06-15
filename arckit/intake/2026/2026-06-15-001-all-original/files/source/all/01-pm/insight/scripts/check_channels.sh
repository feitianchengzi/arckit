#!/usr/bin/env bash
# check_channels.sh — 检测可用采集渠道
#
# 用途：扫描当前环境中可用的信息采集工具，输出各渠道可用状态
# 用法：./check_channels.sh [--json]
#
# 输出格式：
#   默认：人类可读的状态列表
#   --json：JSON 格式

set -euo pipefail

JSON_OUTPUT=false

# ─── 参数解析 ──────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case "$1" in
        --json) JSON_OUTPUT=true; shift ;;
        -h|--help)
            echo "用法: $0 [--json]"
            echo ""
            echo "检测当前环境中可用的信息采集渠道，输出各渠道可用状态。"
            echo ""
            echo "选项:"
            echo "  --json    以 JSON 格式输出"
            echo "  -h, --help  显示帮助信息"
            exit 0
            ;;
        *) shift ;;
    esac
done

# ─── 渠道检测函数 ──────────────────────────────────────────

check_command() {
    local name="$1"
    if command -v "$name" &>/dev/null; then
        echo "available"
    else
        echo "not_installed"
    fi
}

# 内置通道（始终可用）
check_websearch()   { echo "always_available"; }
check_webfetch()    { echo "always_available"; }
check_gh()          { check_command "gh"; }
check_curl()        { check_command "curl"; }
check_python3()     { check_command "python3"; }

# 扩展 CLI（可选）
check_twitter()     { check_command "twitter"; }
check_xhs()         { check_command "xhs"; }
check_rdt()         { check_command "rdt"; }
check_ytdlp()       { check_command "yt-dlp"; }
check_exa()         { check_command "exa"; }

# ─── 逐项检测 ─────────────────────────────────────────────

declare -A CHANNELS

# 内置通道
CHANNELS[websearch]="$(check_websearch)"
CHANNELS[webfetch]="$(check_webfetch)"
CHANNELS[gh]="$(check_gh)"
CHANNELS[curl]="$(check_curl)"
CHANNELS[python3]="$(check_python3)"

# 扩展通道
CHANNELS[twitter]="$(check_twitter)"
CHANNELS[xhs]="$(check_xhs)"
CHANNELS[rdt]="$(check_rdt)"
CHANNELS[yt-dlp]="$(check_ytdlp)"
CHANNELS[exa]="$(check_exa)"

# ─── 输出 ─────────────────────────────────────────────────

if $JSON_OUTPUT; then
    # JSON 输出
    echo "{"
    first=true
    for key in $(echo "${!CHANNELS[@]}" | tr ' ' '\n' | sort); do
        if ! $first; then echo ","; fi
        printf '  "%s": "%s"' "$key" "${CHANNELS[$key]}"
        first=false
    done
    echo ""
    echo "}"
else
    # 人类可读输出
    echo "📡 渠道可用性检测"
    echo ""
    echo "=== 内置通道（始终可用）==="
    for key in websearch webfetch gh curl python3; do
        status="${CHANNELS[$key]}"
        if [[ "$status" == "always_available" || "$status" == "available" ]]; then
            echo "  ✅ $key"
        else
            echo "  ⚠️  $key (不可用: $status)"
        fi
    done

    echo ""
    echo "=== 扩展通道（可选安装）==="
    for key in twitter xhs rdt yt-dlp exa; do
        status="${CHANNELS[$key]}"
        if [[ "$status" == "available" ]]; then
            echo "  ✅ $key"
        else
            echo "  ⬜ $key (未安装，将使用降级方案)"
        fi
    done

    # 统计
    available=0
    for key in "${!CHANNELS[@]}"; do
        if [[ "${CHANNELS[$key]}" == "always_available" || "${CHANNELS[$key]}" == "available" ]]; then
            ((available++))
        fi
    done
    total=${#CHANNELS[@]}
    echo ""
    echo "可用: $available/$total"
fi
