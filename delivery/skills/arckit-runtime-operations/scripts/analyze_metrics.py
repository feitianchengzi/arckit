#!/usr/bin/env python3
"""
analyze_metrics.py — 运营数据分析

从日志文件或数据库查询中提取运营数据，识别模式，生成迭代建议。
对应 SKILL.md 模式C 数据驱动迭代。

用法:
  python3 analyze_metrics.py --log-file access.log --period 7
  python3 analyze_metrics.py --db-query "SELECT event_name, count(*) FROM events GROUP BY 1" --output metrics.json
"""

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def get_local_tz():
    return datetime.now().astimezone().tzinfo


def analyze_access_log(log_path: str, period: int = 7) -> dict:
    """从访问日志提取指标"""
    try:
        content = Path(log_path).read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        return {"error": str(e)}

    lines = content.strip().split("\n")
    total_requests = len(lines)

    # PV/UV (按IP)
    ips = set()
    paths = {}
    errors_5xx = 0
    for line in lines:
        parts = line.split()
        if len(parts) >= 7:
            ip = parts[0]
            path = parts[6]
            status = parts[8] if len(parts) > 8 else ""
            ips.add(ip)
            paths[path] = paths.get(path, 0) + 1
            if status.startswith("5"):
                errors_5xx += 1

    # 热门路径 Top 10
    top_paths = sorted(paths.items(), key=lambda x: -x[1])[:10]

    return {
        "total_requests": total_requests,
        "unique_ips": len(ips),
        "error_5xx": errors_5xx,
        "error_rate": round(errors_5xx / max(total_requests, 1) * 100, 2),
        "top_paths": [{"path": p, "count": c} for p, c in top_paths],
    }


def identify_patterns(metrics: dict) -> list:
    """从指标中识别异常模式"""
    signals = []

    if metrics.get("error_rate", 0) > 1:
        signals.append({
            "signal": f"错误率 {metrics['error_rate']}% 超过基线",
            "direction": "↓衰退",
            "confidence": "高",
            "suggestion": "检查最近部署和服务健康状态",
        })

    top = metrics.get("top_paths", [])
    if top and top[0].get("count", 0) > metrics.get("total_requests", 1) * 0.5:
        signals.append({
            "signal": f"单一路径 {top[0]['path']} 占请求量 {round(top[0]['count']/max(metrics.get('total_requests',1),1)*100)}%",
            "direction": "→集中",
            "confidence": "中",
            "suggestion": "该路径是核心路径，优先保障性能和可靠性",
        })

    if not signals:
        signals.append({
            "signal": "暂无明显异常信号",
            "direction": "→平稳",
            "confidence": "高",
            "suggestion": "持续监控，建立更细粒度的基线",
        })

    return signals


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="运营数据分析")
    parser.add_argument("--log-file", default="", help="访问日志文件路径")
    parser.add_argument("--db-query", default="", help="数据库查询（需数据库连接）")
    parser.add_argument("--period", type=int, default=7, help="分析周期（天）")
    parser.add_argument("--output", default="", help="输出文件路径")
    args = parser.parse_args()

    now = datetime.now(get_local_tz()).isoformat()

    metrics = {}
    if args.log_file:
        metrics = analyze_access_log(args.log_file, args.period)
    elif args.db_query:
        metrics = {"note": "数据库查询需配置连接，当前仅输出查询建议", "query": args.db_query}

    signals = identify_patterns(metrics)

    result = {
        "analyzed_at": now,
        "period_days": args.period,
        "metrics": metrics,
        "signals": signals,
    }

    output_json = json.dumps(result, ensure_ascii=False, indent=2)

    if args.output:
        Path(args.output).write_text(output_json, encoding="utf-8")
        print(f"✅ 分析结果已保存到: {args.output}")
    else:
        print(output_json)
