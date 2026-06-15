#!/usr/bin/env python3
"""
collect.py — 多渠道信息采集执行器

根据查询关键词，通过可用渠道采集信息，输出结构化采集结果。
支持内置通道（WebSearch/WebFetch/gh/curl）和扩展通道（twitter/xhs/rdt/yt-dlp）。
扩展通道未安装时自动降级到内置通道。

用法:
  python3 collect.py --query "AI编程助手" --channels websearch,gh --max-results 10
  python3 collect.py --query "竞品分析" --channels all --output results.json
"""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


def get_local_tz():
    return datetime.now().astimezone().tzinfo


def _run_cmd(cmd: List[str], timeout: int = 30) -> Dict[str, Any]:
    """安全执行命令，返回结果"""
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout
        )
        return {
            "ok": result.returncode == 0,
            "stdout": result.stdout[:5000],  # 限制输出长度
            "stderr": result.stderr[:1000],
            "returncode": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {"ok": False, "stderr": "命令超时"}
    except FileNotFoundError:
        return {"ok": False, "stderr": "命令未找到"}
    except Exception as e:
        return {"ok": False, "stderr": str(e)}


# ─── 采集通道实现 ──────────────────────────────────────────

def collect_websearch(query: str, max_results: int = 10) -> Dict[str, Any]:
    """WebSearch 采集（需 Claude Code 环境）"""
    # WebSearch 是 Claude Code 内置工具，脚本中无法直接调用
    # 返回提示信息，由 Agent 执行实际搜索
    return {
        "channel": "websearch",
        "status": "requires_agent",
        "query": query,
        "instruction": f"使用 WebSearch 工具搜索: {query}",
        "note": "WebSearch 是 Agent 内置工具，需在 Agent 会话中执行",
    }


def collect_gh_repos(query: str, max_results: int = 10) -> Dict[str, Any]:
    """GitHub 仓库搜索"""
    result = _run_cmd(
        ["gh", "search", "repos", query, "--sort", "stars", "--limit", str(max_results), "--json", "name,owner,description,stargazersCount,url"]
    )
    if result["ok"]:
        try:
            repos = json.loads(result["stdout"])
            return {
                "channel": "gh_repos",
                "status": "success",
                "count": len(repos),
                "results": repos,
            }
        except Exception:
            pass
    return {"channel": "gh_repos", "status": "degraded", "error": result.get("stderr", ""),
            "fallback_instruction": f"使用 WebSearch 搜索: site:github.com {query}"}


def collect_gh_code(query: str, max_results: int = 10) -> Dict[str, Any]:
    """GitHub 代码搜索"""
    result = _run_cmd(
        ["gh", "search", "code", query, "--limit", str(max_results)]
    )
    if result["ok"]:
        return {
            "channel": "gh_code",
            "status": "success",
            "raw_output": result["stdout"],
        }
    return {"channel": "gh_code", "status": "degraded", "error": result.get("stderr", "")}


def collect_v2ex_hot() -> Dict[str, Any]:
    """V2EX 热门话题"""
    result = _run_cmd(
        ["curl", "-s", "https://www.v2ex.com/api/topics/hot.json", "-H", "User-Agent: insight/1.0"]
    )
    if result["ok"]:
        try:
            topics = json.loads(result["stdout"])
            return {
                "channel": "v2ex",
                "status": "success",
                "count": len(topics[:10]),
                "results": [{"title": t.get("title", ""), "url": t.get("url", "")} for t in topics[:10]],
            }
        except Exception:
            pass
    return {"channel": "v2ex", "status": "failed", "error": result.get("stderr", "")}


def collect_rss(url: str, max_items: int = 5) -> Dict[str, Any]:
    """RSS 订阅采集"""
    # 尝试使用 feedparser（Python 内置可能没有）
    try:
        import feedparser
        d = feedparser.parse(url)
        entries = [{"title": e.get("title", ""), "link": e.get("link", ""),
                     "summary": e.get("summary", "")[:200]} for e in d.entries[:max_items]]
        return {"channel": "rss", "status": "success", "url": url, "count": len(entries), "results": entries}
    except ImportError:
        return {"channel": "rss", "status": "degraded", "note": "feedparser 未安装，使用 WebFetch 降级",
                "fallback_instruction": f"使用 WebFetch 读取 RSS: {url}"}


def collect_jina_read(url: str) -> Dict[str, Any]:
    """通过 jina.ai 读取网页内容"""
    result = _run_cmd(
        ["curl", "-s", f"https://r.jina.ai/{url}", "-H", "Accept: text/markdown"]
    )
    if result["ok"] and len(result["stdout"]) > 100:
        return {
            "channel": "jina_read",
            "status": "success",
            "url": url,
            "content_preview": result["stdout"][:2000],
        }
    return {"channel": "jina_read", "status": "failed", "url": url}


# ─── 主采集逻辑 ────────────────────────────────────────────

def collect(query: str, channels: List[str], max_results: int = 10) -> Dict[str, Any]:
    """
    执行多渠道采集

    Args:
        query: 搜索关键词
        channels: 渠道列表
        max_results: 每个渠道最大结果数

    Returns:
        dict: 采集结果汇总
    """
    now = datetime.now(get_local_tz()).isoformat()
    results = {
        "query": query,
        "channels_requested": channels,
        "collected_at": now,
        "findings": [],
    }

    for ch in channels:
        finding = None
        if ch == "websearch":
            finding = collect_websearch(query, max_results)
        elif ch == "gh" or ch == "github":
            finding = collect_gh_repos(query, max_results)
        elif ch == "gh_code":
            finding = collect_gh_code(query, max_results)
        elif ch == "v2ex":
            finding = collect_v2ex_hot()
        elif ch == "jina":
            finding = collect_jina_read(query)
        elif ch == "rss":
            finding = collect_rss(query, max_results)
        else:
            finding = {"channel": ch, "status": "unknown", "error": f"未知渠道: {ch}"}

        if finding:
            results["findings"].append(finding)

    # 统计
    success = sum(1 for f in results["findings"] if f.get("status") == "success")
    degraded = sum(1 for f in results["findings"] if f.get("status") == "degraded")
    failed = sum(1 for f in results["findings"] if f.get("status") == "failed")
    results["summary"] = {
        "total_channels": len(channels),
        "success": success,
        "degraded": degraded,
        "failed": failed,
        "requires_agent": sum(1 for f in results["findings"] if f.get("status") == "requires_agent"),
    }

    return results


# ─── CLI 入口 ─────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="多渠道信息采集执行器")
    parser.add_argument("--query", required=True, help="搜索关键词")
    parser.add_argument("--channels", default="websearch,gh",
                        help="采集渠道，逗号分隔（websearch,gh,gh_code,v2ex,jina,rss）")
    parser.add_argument("--max-results", type=int, default=10, help="每个渠道最大结果数")
    parser.add_argument("--output", default="", help="输出文件路径（默认 stdout）")
    args = parser.parse_args()

    channels = [c.strip() for c in args.channels.split(",")]
    if "all" in channels:
        channels = ["websearch", "gh", "gh_code", "v2ex", "jina"]

    result = collect(args.query, channels, args.max_results)
    output_json = json.dumps(result, ensure_ascii=False, indent=2)

    if args.output:
        Path(args.output).write_text(output_json, encoding="utf-8")
        print(f"✅ 采集结果已保存到: {args.output}")
    else:
        print(output_json)
