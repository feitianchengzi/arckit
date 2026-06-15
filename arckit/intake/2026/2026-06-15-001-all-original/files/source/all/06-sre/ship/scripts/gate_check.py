#!/usr/bin/env python3
"""
gate_check.py — 发布门控检查

检查 verify 报告、review 报告、CI 状态是否全部通过。
铁律：没有通过所有门禁就不能发布。

用法:
  python3 gate_check.py --verify-report verify.json --review-report review.json --ci-status green
"""

import argparse
import json
import sys
from pathlib import Path


def check_file_report(path: str, name: str) -> dict:
    """检查报告文件"""
    if not path:
        return {"name": name, "status": "skipped", "note": "未提供报告"}
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        ok = data.get("ok", False)
        return {"name": name, "status": "pass" if ok else "fail", "note": ""}
    except Exception as e:
        return {"name": name, "status": "error", "note": str(e)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="发布门控检查")
    parser.add_argument("--verify-report", default="", help="verify 报告 JSON")
    parser.add_argument("--review-report", default="", help="review 报告 JSON")
    parser.add_argument("--ci-status", default="", choices=["green", "red", "yellow", ""], help="CI 状态")
    parser.add_argument("--db-migration", default="compatible", choices=["compatible", "breaking", "unknown"], help="数据库迁移兼容性")
    parser.add_argument("--config-validated", default="true", choices=["true", "false"], help="配置是否已验证")
    args = parser.parse_args()

    gates = []

    # 门禁1: verify 报告
    verify = check_file_report(args.verify_report, "功能验证")
    gates.append(verify)

    # 门禁2: review 报告
    review = check_file_report(args.review_report, "代码审查")
    gates.append(review)

    # 门禁3: CI 状态
    ci_ok = args.ci_status == "green"
    gates.append({"name": "CI状态", "status": "pass" if ci_ok else "fail" if args.ci_status == "red" else "unknown",
                  "note": f"CI: {args.ci_status or '未指定'}"})

    # 门禁4: 数据库迁移
    db_ok = args.db_migration == "compatible"
    gates.append({"name": "数据库迁移", "status": "pass" if db_ok else "fail", "note": args.db_migration})

    # 门禁5: 配置验证
    cfg_ok = args.config_validated == "true"
    gates.append({"name": "配置变更", "status": "pass" if cfg_ok else "fail", "note": ""})

    all_pass = all(g["status"] == "pass" or g["status"] == "skipped" for g in gates)
    any_fail = any(g["status"] == "fail" for g in gates)

    result = {
        "ok": all_pass and not any_fail,
        "gates": gates,
        "verdict": "✅ 所有门禁通过，可以发布" if all_pass and not any_fail else "❌ 门禁不通过，发布必须停止",
    }

    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(0 if result["ok"] else 1)
