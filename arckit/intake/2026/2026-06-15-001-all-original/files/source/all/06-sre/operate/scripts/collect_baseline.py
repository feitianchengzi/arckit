#!/usr/bin/env python3
"""
collect_baseline.py — 基线采集与存储

采集当前系统指标作为基线，供灰度监控和异常检测对比。
对应 SKILL.md 基线建立与对比。

用法:
  python3 collect_baseline.py --url http://localhost:8080/health --output baseline.json
"""

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def get_local_tz():
    return datetime.now().astimezone().tzinfo


def _run(cmd, timeout=10):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip()
    except Exception:
        return ""


def collect(url: str = "") -> dict:
    """采集系统指标"""
    now = datetime.now(get_local_tz()).isoformat()
    import platform
    baseline = {
        "timestamp": now,
        "platform": platform.system(),
        "metrics": {},
    }

    # HTTP 可用性
    if url:
        code = _run(f'curl -s -o /dev/null -w "%{{http_code}}" --max-time 10 {url}')
        baseline["metrics"]["http_status"] = int(code) if code.isdigit() else 0

    # CPU
    if platform.system() == "Darwin":
        cpu = _run("ps -A -o %cpu | awk '{s+=$1} END {printf \"%.0f\", s}'")
    else:
        cpu = _run("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d. -f1")
    baseline["metrics"]["cpu_percent"] = int(cpu) if cpu.isdigit() else 0

    # 内存
    if platform.system() == "Darwin":
        mem = _run("vm_stat | perl -ne '/Pages free:\\s+(\\d+)/ and $f=$1; /Pages active:\\s+(\\d+)/ and $a=$1; END { printf \"%.0f\", $a/($a+$f)*100 }'")
    else:
        mem = _run("free | grep Mem | awk '{printf \"%d\", $3/$2*100}'")
    baseline["metrics"]["memory_percent"] = int(mem) if mem.isdigit() else 0

    # 磁盘
    disk = _run("df -h / | awk 'NR==2 {print int($5)}'")
    baseline["metrics"]["disk_percent"] = int(disk) if disk.isdigit() else 0

    # 响应时间
    if url:
        ttfb = _run(f'curl -s -o /dev/null -w "%{{time_starttransfer}}" --max-time 10 {url}')
        baseline["metrics"]["ttfb_seconds"] = float(ttfb) if ttfb else 0

    return baseline


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="基线采集与存储")
    parser.add_argument("--url", default="", help="健康检查 URL")
    parser.add_argument("--output", required=True, help="输出文件路径")
    args = parser.parse_args()

    baseline = collect(args.url)

    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    Path(args.output).write_text(json.dumps(baseline, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"✅ 基线已采集并保存到: {args.output}")
    print(f"   CPU: {baseline['metrics'].get('cpu_percent', '?')}%")
    print(f"   内存: {baseline['metrics'].get('memory_percent', '?')}%")
    print(f"   磁盘: {baseline['metrics'].get('disk_percent', '?')}%")
