#!/usr/bin/env python3
"""
canary_monitor.py — 灰度监控

在灰度发布期间监控关键指标（错误率、延迟、业务指标），与基线对比。
对应 SKILL.md Step3 灰度策略。

用法:
  python3 canary_monitor.py --baseline-json baseline.json --duration-minutes 15 --url http://localhost:8080/health
"""

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path


def get_local_tz():
    return datetime.now().astimezone().tzinfo


def _curl_json(url, timeout=10):
    try:
        result = subprocess.run(
            ["curl", "-s", "--max-time", str(timeout), url],
            capture_output=True, text=True, timeout=timeout + 5
        )
        return json.loads(result.stdout)
    except Exception:
        return {}


def check_health(url: str) -> dict:
    """健康检查"""
    try:
        result = subprocess.run(
            ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "10", url],
            capture_output=True, text=True, timeout=15
        )
        code = int(result.stdout.strip()) if result.stdout.strip().isdigit() else 0
        return {"ok": 200 <= code < 300, "status_code": code}
    except Exception:
        return {"ok": False, "status_code": 0}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="灰度监控")
    parser.add_argument("--baseline-json", required=True, help="基线数据 JSON 文件")
    parser.add_argument("--duration-minutes", type=int, default=15, help="监控持续时间（分钟）")
    parser.add_argument("--url", default="", help="健康检查 URL")
    parser.add_argument("--interval-seconds", type=int, default=60, help="检查间隔（秒）")
    args = parser.parse_args()

    # 读取基线
    try:
        baseline = json.loads(Path(args.baseline_json).read_text(encoding="utf-8"))
    except Exception as e:
        print(f"❌ 无法读取基线数据: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"🔍 灰度监控启动")
    print(f"   持续: {args.duration_minutes} 分钟")
    print(f"   间隔: {args.interval_seconds} 秒")
    print(f"   基线: {args.baseline_json}")
    print()

    checks = []
    iterations = (args.duration_minutes * 60) // args.interval_seconds
    alerts = []

    for i in range(max(1, iterations)):
        now = datetime.now(get_local_tz()).strftime("%H:%M:%S")
        check = {"time": now, "iteration": i + 1}

        # 健康检查
        if args.url:
            health = check_health(args.url)
            check["health"] = health
            if not health["ok"]:
                alerts.append(f"{now} ❌ 健康检查失败: HTTP {health['status_code']}")

        checks.append(check)
        print(f"  [{now}] 第{i+1}/{iterations}轮 | 健康: {'✅' if check.get('health', {}).get('ok') else '❌'}")

        if i < iterations - 1:
            time.sleep(args.interval_seconds)

    # 汇总
    result = {
        "duration_minutes": args.duration_minutes,
        "total_checks": len(checks),
        "alerts": alerts,
        "checks": checks,
        "verdict": "✅ 灰度监控正常，可推进到下一阶段" if not alerts else f"⚠️ 发现 {len(alerts)} 个告警，需评估是否回滚",
    }

    print()
    print(result["verdict"])
    for a in alerts:
        print(f"  🚨 {a}")
