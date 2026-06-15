#!/usr/bin/env bash
# health_check.sh — 健康检查（含降级采集）
#
# 对应 SKILL.md 模式B 健康监控。自动检测可用基础设施，降级采集。
#
# 用法: ./health_check.sh --url http://localhost:8080/health
#       ./health_check.sh --url http://localhost:8080/health --checks http,cpu,memory,disk

set -euo pipefail

URL=""
CHECKS="http,cpu,memory,disk"
OUTPUT_JSON=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --url)      URL="$2"; shift 2 ;;
        --checks)   CHECKS="$2"; shift 2 ;;
        --json)     OUTPUT_JSON=true; shift ;;
        -h|--help)
            echo "用法: $0 --url URL [--checks http,cpu,memory,disk,db] [--json]"
            exit 0 ;;
        *) shift ;;
    esac
done

# ─── 检查函数 ─────────────────────────────────────────────

check_http() {
    if [[ -z "$URL" ]]; then echo '{"status":"skip","note":"未指定URL"}'; return; fi
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL" 2>/dev/null || echo "000")
    if [[ "$code" -ge 200 && "$code" -lt 300 ]]; then
        echo "{\"status\":\"ok\",\"http_code\":$code}"
    else
        echo "{\"status\":\"fail\",\"http_code\":$code}"
    fi
}

check_cpu() {
    if [[ "$(uname)" == "Darwin" ]]; then
        pct=$(ps -A -o %cpu 2>/dev/null | awk '{s+=$1} END {printf "%.0f", s}')
    else
        pct=$(top -bn1 2>/dev/null | grep "Cpu(s)" | awk '{print $2}' | cut -d. -f1)
    fi
    echo "{\"status\":\"ok\",\"cpu_percent\":${pct:-0}}"
}

check_memory() {
    if [[ "$(uname)" == "Darwin" ]]; then
        pct=$(vm_stat 2>/dev/null | perl -ne '/page size of (\d+)/ and $ps=$1; /Pages free:\s+(\d+)/ and $f=$1; /Pages active:\s+(\d+)/ and $a=$1; END { printf "%.0f", $a/($a+$f)*100 }' 2>/dev/null || echo "0")
    else
        pct=$(free 2>/dev/null | grep Mem | awk '{printf "%.0f", $3/$2 * 100}' 2>/dev/null || echo "0")
    fi
    echo "{\"status\":\"ok\",\"memory_percent\":${pct:-0}}"
}

check_disk() {
    pct=$(df -h / 2>/dev/null | awk 'NR==2 {print $5}' | tr -d '%' 2>/dev/null || echo "0")
    echo "{\"status\":\"ok\",\"disk_percent\":${pct:-0}}"
}

# ─── 执行检查 ─────────────────────────────────────────────

declare -A RESULTS
for check in $(echo "$CHECKS" | tr ',' ' '); do
    case "$check" in
        http)   RESULTS[http]="$(check_http)" ;;
        cpu)    RESULTS[cpu]="$(check_cpu)" ;;
        memory) RESULTS[memory]="$(check_memory)" ;;
        disk)   RESULTS[disk]="$(check_disk)" ;;
    esac
done

# ─── 输出 ─────────────────────────────────────────────────

if $OUTPUT_JSON; then
    echo "{"
    first=true
    for key in $(echo "${!RESULTS[@]}" | tr ' ' '\n' | sort); do
        $first || echo ","
        printf '  "%s": %s' "$key" "${RESULTS[$key]}"
        first=false
    done
    echo ""
    echo "}"
else
    echo "🏥 健康检查报告"
    echo ""
    for key in $(echo "${!RESULTS[@]}" | tr ' ' '\n' | sort); do
        status=$(echo "${RESULTS[$key]}" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        icon="✅"
        [[ "$status" == "fail" ]] && icon="❌"
        [[ "$status" == "skip" ]] && icon="⬜"
        echo "  $icon $key: ${RESULTS[$key]}"
    done
fi
