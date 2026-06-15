#!/usr/bin/env python3
"""
generate_report.py — 结构化洞察报告生成

将采集结果（JSON）转化为符合 SKILL.md Step3 输出格式的 Markdown 报告。
支持从 collect.py 的输出或手动整理的 JSON 生成报告。

用法:
  python3 generate_report.py --findings-json results.json --goal "分析AI编程助手赛道"
  python3 generate_report.py --findings-dir ./findings/ --goal "竞品调研"
  echo '{"findings":[...]}' | python3 generate_report.py --goal "趋势分析" --stdin
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List


def get_local_tz():
    return datetime.now().astimezone().tzinfo


def _extract_findings(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """从采集结果中提取发现列表"""
    findings = []

    for item in data.get("findings", []):
        channel = item.get("channel", "unknown")
        status = item.get("status", "unknown")

        if status == "success" and "results" in item:
            results = item["results"]
            if isinstance(results, list):
                for r in results[:5]:
                    findings.append({
                        "channel": channel,
                        "title": r.get("title", r.get("name", "")),
                        "url": r.get("url", r.get("link", r.get("html_url", ""))),
                        "description": r.get("description", r.get("summary", "")),
                        "stars": r.get("stargazersCount", r.get("stars", "")),
                    })
            elif isinstance(results, dict):
                findings.append({
                    "channel": channel,
                    "title": results.get("title", ""),
                    "url": results.get("url", results.get("link", "")),
                    "description": results.get("summary", results.get("description", "")),
                })
        elif status == "degraded":
            findings.append({
                "channel": channel,
                "title": f"[降级采集] {channel}",
                "note": item.get("fallback_instruction", item.get("note", "扩展 CLI 未安装，使用降级方案")),
            })
        elif status == "requires_agent":
            findings.append({
                "channel": channel,
                "title": f"[需 Agent 执行] {channel}",
                "note": item.get("instruction", "此渠道需在 Agent 会话中执行"),
            })

    return findings


def _extract_signals(findings: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """从发现中提取趋势信号"""
    signals = []
    for f in findings:
        if f.get("stars") and int(f.get("stars", 0)) > 1000:
            signals.append({
                "signal": f"{f.get('title', '未知')} (⭐{f['stars']})",
                "direction": "↑增长",
                "confidence": "高" if int(f.get("stars", 0)) > 5000 else "中",
                "source": f.get("channel", ""),
            })
    return signals[:10]


def generate_report(goal: str, findings_data: Dict[str, Any]) -> str:
    """
    生成结构化洞察报告

    Args:
        goal: 洞察目标
        findings_data: 采集结果数据

    Returns:
        str: Markdown 格式报告
    """
    now = datetime.now(get_local_tz()).strftime("%Y-%m-%d %H:%M")
    query = findings_data.get("query", "未指定")
    summary = findings_data.get("summary", {})

    findings = _extract_findings(findings_data)
    signals = _extract_signals(findings)

    # 构建报告
    lines = [
        f"# 市场洞察报告",
        f"",
        f"> 生成时间: {now}",
        f"> 采集渠道: {summary.get('total_channels', 0)} 个（成功 {summary.get('success', 0)}，降级 {summary.get('degraded', 0)}，需Agent {summary.get('requires_agent', 0)}）",
        f"",
        f"## 洞察目标",
        f"",
        f"{goal}",
        f"",
        f"## 关键发现",
    ]

    if not findings:
        lines.append("")
        lines.append("⚠️ 未采集到有效发现。可能原因：")
        lines.append("- 采集渠道未安装（检查: `bash scripts/check_channels.sh`）")
        lines.append("- 查询关键词过于狭窄")
        lines.append("- 网络连接问题")
    else:
        for idx, f in enumerate(findings, 1):
            lines.append(f"")
            lines.append(f"### 发现{idx}: {f.get('title', '无标题')}")
            if f.get("channel"):
                lines.append(f"- **来源**: {f['channel']} + {now[:10]}")
            if f.get("url"):
                lines.append(f"- **链接**: {f['url']}")
            if f.get("description"):
                desc = f["description"][:300]
                lines.append(f"- **事实**: {desc}")
            if f.get("stars"):
                lines.append(f"- **数据**: ⭐ {f['stars']}")
            if f.get("note"):
                lines.append(f"- **备注**: {f['note']}")

    # 信号列表
    lines.append("")
    lines.append("## 信号列表")
    lines.append("")
    if signals:
        lines.append("| 信号 | 方向 | 可信度 | 来源 |")
        lines.append("|------|------|--------|------|")
        for s in signals:
            lines.append(f"| {s['signal']} | {s['direction']} | {s['confidence']} | {s['source']} |")
    else:
        lines.append("*暂无明确信号（可能需要更多数据或深入分析）*")

    # 信息缺口
    lines.append("")
    lines.append("## 信息缺口")
    lines.append("")

    gaps = []
    if summary.get("failed", 0) > 0:
        gaps.append("- 部分采集渠道失败，数据可能不完整")
    if summary.get("degraded", 0) > 0:
        gaps.append("- 部分渠道使用降级方案，数据完整度可能降低")
    if summary.get("requires_agent", 0) > 0:
        gaps.append("- 部分渠道需要 Agent 在线执行才能获得完整数据")
    if not findings:
        gaps.append("- 未获得任何有效数据，建议检查渠道配置后重新采集")

    if gaps:
        lines.extend(gaps)
    else:
        lines.append("当前数据覆盖较全面，暂无重大信息缺口。")

    lines.append("")
    return "\n".join(lines)


# ─── CLI 入口 ─────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="结构化洞察报告生成")
    parser.add_argument("--findings-json", default="", help="采集结果 JSON 文件路径")
    parser.add_argument("--findings-dir", default="", help="采集结果目录（读取所有 JSON）")
    parser.add_argument("--goal", required=True, help="洞察目标")
    parser.add_argument("--stdin", action="store_true", help="从 stdin 读取 JSON")
    parser.add_argument("--output", default="", help="输出文件路径（默认 stdout）")
    args = parser.parse_args()

    # 读取数据
    findings_data = {"findings": [], "query": "", "summary": {}}

    if args.stdin:
        try:
            findings_data = json.loads(sys.stdin.read())
        except Exception as e:
            print(f"❌ 无法解析 stdin JSON: {e}", file=sys.stderr)
            sys.exit(1)
    elif args.findings_json:
        try:
            findings_data = json.loads(Path(args.findings_json).read_text(encoding="utf-8"))
        except Exception as e:
            print(f"❌ 无法读取文件: {e}", file=sys.stderr)
            sys.exit(1)
    elif args.findings_dir:
        all_findings = []
        for jf in sorted(Path(args.findings_dir).glob("*.json")):
            try:
                data = json.loads(jf.read_text(encoding="utf-8"))
                all_findings.extend(data.get("findings", []))
                if not findings_data.get("query"):
                    findings_data["query"] = data.get("query", "")
                s = data.get("summary", {})
                for k in ["success", "degraded", "failed", "requires_agent"]:
                    findings_data.setdefault("summary", {})
                    findings_data["summary"][k] = findings_data["summary"].get(k, 0) + s.get(k, 0)
            except Exception:
                continue
        findings_data["findings"] = all_findings

    report = generate_report(args.goal, findings_data)

    if args.output:
        Path(args.output).write_text(report, encoding="utf-8")
        print(f"✅ 报告已保存到: {args.output}")
    else:
        print(report)
