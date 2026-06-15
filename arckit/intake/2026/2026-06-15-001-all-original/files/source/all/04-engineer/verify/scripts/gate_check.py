#!/usr/bin/env python3
"""
gate_check.py — 验证门控执行

执行测试命令，收集证据，判断是否可以声称"完成"。
铁律：没有新鲜验证证据就不能声称完成。

用法:
  python3 gate_check.py --test-command "npx jest" --coverage-threshold 60
  python3 gate_check.py --test-command "pytest" --evidence-dir ./evidence
"""

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def get_local_tz():
    return datetime.now().astimezone().tzinfo


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="验证门控执行")
    parser.add_argument("--test-command", required=True, help="测试执行命令")
    parser.add_argument("--coverage-threshold", type=int, default=0, help="覆盖率阈值(0=不检查)")
    parser.add_argument("--evidence-dir", default="", help="证据保存目录")
    args = parser.parse_args()

    now = datetime.now(get_local_tz()).isoformat()
    evidence_dir = Path(args.evidence_dir) if args.evidence_dir else None
    if evidence_dir:
        evidence_dir.mkdir(parents=True, exist_ok=True)

    # 执行测试
    try:
        result = subprocess.run(
            args.test_command, shell=True,
            capture_output=True, text=True, timeout=300
        )
        test_ok = result.returncode == 0
        stdout = result.stdout
        stderr = result.stderr
    except subprocess.TimeoutExpired:
        test_ok = False
        stdout = ""
        stderr = "测试执行超时"
    except Exception as e:
        test_ok = False
        stdout = ""
        stderr = str(e)

    # 保存证据
    if evidence_dir:
        (evidence_dir / "test-output.txt").write_text(stdout + "\n" + stderr, encoding="utf-8")

    # 检查覆盖率（如果输出中有覆盖率信息）
    coverage = None
    for line in (stdout + stderr).split("\n"):
        if "coverage" in line.lower() or "All files" in line:
            pct_match = __import__("re").search(r'(\d+(?:\.\d+)?)%', line)
            if pct_match:
                coverage = float(pct_match.group(1))
                break

    coverage_ok = True
    if args.coverage_threshold > 0 and coverage is not None:
        coverage_ok = coverage >= args.coverage_threshold

    overall_ok = test_ok and coverage_ok

    output = {
        "ok": overall_ok,
        "executed_at": now,
        "test_command": args.test_command,
        "test_passed": test_ok,
        "returncode": result.returncode if test_ok or not test_ok else -1,
        "coverage": coverage,
        "coverage_threshold": args.coverage_threshold if args.coverage_threshold > 0 else None,
        "coverage_passed": coverage_ok,
        "evidence_dir": str(evidence_dir) if evidence_dir else None,
        "verdict": "",
    }

    if overall_ok:
        output["verdict"] = "✅ 门控通过：测试全部通过" + (f"，覆盖率 {coverage}% ≥ {args.coverage_threshold}%" if coverage else "")
    elif not test_ok:
        output["verdict"] = "❌ 门控不通过：测试失败"
    else:
        output["verdict"] = f"❌ 门控不通过：覆盖率 {coverage}% < {args.coverage_threshold}%"

    print(json.dumps(output, ensure_ascii=False, indent=2))
    sys.exit(0 if overall_ok else 1)
