#!/usr/bin/env python3
"""
security_scan.py — 安全基础扫描

对目标 URL 进行 OWASP Top 10 基础检查。
对应 SKILL.md 安全验证维度。

用法:
  python3 security_scan.py --target-url http://localhost:3000
"""

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def _curl(url, method="GET", data=None, headers=None, timeout=10):
    """执行 HTTP 请求"""
    cmd = ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "-X", method, "--max-time", str(timeout)]
    if headers:
        for k, v in headers.items():
            cmd.extend(["-H", f"{k}: {v}"])
    if data:
        cmd.extend(["-d", data])
    cmd.append(url)
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 5)
        return int(result.stdout.strip()) if result.stdout.strip().isdigit() else 0
    except Exception:
        return 0


def check_xss(base_url: str) -> dict:
    """XSS 基础检查：注入测试"""
    test_payload = '<script>alert("xss")</script>'
    findings = []

    # 检查常见输入端点
    for endpoint in ["/", "/search", "/api/v1/test"]:
        url = f"{base_url}{endpoint}?q={test_payload}"
        code = _curl(url)
        if code == 200:
            # 检查响应是否包含未转义的 payload（需要更精确的工具，这里只标记）
            findings.append({"endpoint": endpoint, "status": "需人工验证", "note": "返回200，需检查响应是否转义了HTML"})

    return {"check": "xss", "findings": findings}


def check_auth(base_url: str) -> dict:
    """认证/授权基础检查"""
    findings = []

    # 检查敏感端点是否需要认证
    for endpoint in ["/api/v1/users", "/admin", "/api/v1/settings"]:
        code = _curl(f"{base_url}{endpoint}")
        if code == 200:
            findings.append({"endpoint": endpoint, "status": "warning", "note": f"无认证返回200，可能存在越权访问"})
        elif code in [401, 403]:
            findings.append({"endpoint": endpoint, "status": "ok", "note": f"返回{code}，认证正常"})

    return {"check": "auth", "findings": findings}


def check_https(base_url: str) -> dict:
    """HTTPS 检查"""
    if base_url.startswith("https://"):
        return {"check": "https", "status": "ok", "note": "使用 HTTPS"}
    return {"check": "https", "status": "warning", "note": "未使用 HTTPS，敏感数据可能被窃听"}


def check_sensitive_data(base_url: str) -> dict:
    """敏感数据泄露检查"""
    findings = []
    for endpoint in ["/.env", "/config.json", "/api/v1/debug", "/.git/config"]:
        code = _curl(f"{base_url}{endpoint}")
        if code == 200:
            findings.append({"endpoint": endpoint, "status": "error", "note": "暴露敏感文件/端点"})
    return {"check": "sensitive_data", "findings": findings}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="安全基础扫描")
    parser.add_argument("--target-url", required=True, help="目标 URL")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    base_url = args.target_url.rstrip("/")
    results = {
        "target": base_url,
        "scanned_at": datetime.now(get_local_tz()).isoformat(),
        "checks": [
            check_https(base_url),
            check_auth(base_url),
            check_xss(base_url),
            check_sensitive_data(base_url),
        ],
    }

    # 汇总
    errors = sum(1 for c in results["checks"] for f in c.get("findings", []) if f.get("status") == "error")
    warnings = sum(1 for c in results["checks"] for f in c.get("findings", []) if f.get("status") == "warning")

    results["summary"] = f"{'❌' if errors else '⚠️' if warnings else '✅'} {errors} 高风险, {warnings} 低风险"

    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        print(results["summary"])
        for c in results["checks"]:
            print(f"  {c['check']}: ", end="")
            if "status" in c:
                print(c["status"])
            for f in c.get("findings", []):
                icon = "🔴" if f["status"] == "error" else "🟡"
                print(f"    {icon} {f['endpoint']}: {f['note']}")
