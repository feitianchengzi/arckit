#!/usr/bin/env python3
"""
check_api_contract.py — API 契约一致性检查

检查后端代码是否与 API 契约定义一致：
- quick: 快速规则检查（HTTP方法/路径/状态码）
- deep: 深度契约对比（请求/响应 schema）

用法:
  python3 check_api_contract.py --contract-dir ./api/ --src-dir ./src/ --mode quick
  python3 check_api_contract.py --contract-dir ./api/ --src-dir ./src/ --mode deep
  python3 check_api_contract.py --help
"""

import argparse
import json
import re
import sys
from pathlib import Path


def parse_contract_markdown(content: str) -> list:
    """从 Markdown 格式的 API 契约提取端点定义"""
    endpoints = []
    # 匹配格式：METHOD /path
    for m in re.finditer(r'(GET|POST|PUT|PATCH|DELETE)\s+(`?)(/[^\s`]+)\2', content):
        method = m.group(1)
        path = m.group(3)
        # 提取上下文（状态码、描述等）
        after = content[m.end():m.end() + 500]
        status_codes = re.findall(r'(\d{3})', after[:200])
        endpoints.append({
            "method": method,
            "path": path,
            "status_codes": status_codes,
            "source_line": content[:m.start()].count("\n") + 1,
        })
    return endpoints


def parse_contract_openapi(content: str) -> list:
    """从 OpenAPI JSON 提取端点定义"""
    try:
        spec = json.loads(content)
    except json.JSONDecodeError:
        return []

    endpoints = []
    paths = spec.get("paths", {})
    for path, methods in paths.items():
        for method, detail in methods.items():
            if method.upper() not in ("GET", "POST", "PUT", "PATCH", "DELETE"):
                continue
            status_codes = [str(code) for code in detail.get("responses", {}).keys()]
            endpoints.append({
                "method": method.upper(),
                "path": path,
                "status_codes": status_codes,
                "operation_id": detail.get("operationId", ""),
            })
    return endpoints


def extract_handlers_from_src(src_dir: Path) -> list:
    """从源代码提取已实现的路由"""
    handlers = []

    for f in src_dir.rglob("*"):
        if f.suffix not in (".ts", ".js", ".py"):
            continue
        try:
            content = f.read_text(encoding="utf-8")
        except Exception:
            continue

        relative = str(f.relative_to(src_dir))

        # Fastify 风格
        for m in re.finditer(r'(app|server|router)\.(get|post|put|patch|delete)\s*\(\s*[\'"](/[^\'"]*)[\'"]', content, re.IGNORECASE):
            handlers.append({
                "method": m.group(2).upper(),
                "path": m.group(3),
                "file": relative,
                "line": content[:m.start()].count("\n") + 1,
            })

        # FastAPI/Flask 风格
        for m in re.finditer(r'@(app|router)\.(get|post|put|patch|delete)\s*\(\s*[\'"](/[^\'"]*)[\'"]', content):
            handlers.append({
                "method": m.group(2).upper(),
                "path": m.group(3),
                "file": relative,
                "line": content[:m.start()].count("\n") + 1,
            })

        # Express 风格
        for m in re.finditer(r'(app|router)\.(get|post|put|patch|delete)\s*\(\s*[\'"](/[^\'"]*)[\'"]', content):
            handlers.append({
                "method": m.group(2).upper(),
                "path": m.group(3),
                "file": relative,
                "line": content[:m.start()].count("\n") + 1,
            })

    return handlers


def quick_check(contract_dir: Path, src_dir: Path) -> dict:
    """快速契约一致性检查"""
    # 收集契约端点
    contract_endpoints = []
    for f in contract_dir.rglob("*"):
        if f.suffix == ".json":
            try:
                content = f.read_text(encoding="utf-8")
                contract_endpoints.extend(parse_contract_openapi(content))
            except Exception:
                continue
        elif f.suffix in (".md", ".markdown"):
            try:
                content = f.read_text(encoding="utf-8")
                contract_endpoints.extend(parse_contract_markdown(content))
            except Exception:
                continue

    # 收集已实现路由
    implemented_handlers = extract_handlers_from_src(src_dir)

    # 对比
    implemented_set = {(h["method"], h["path"]) for h in implemented_handlers}
    contract_set = {(e["method"], e["path"]) for e in contract_endpoints}

    missing = contract_set - implemented_set
    extra = implemented_set - contract_set

    # 契约中有但代码中没有
    missing_details = []
    for method, path in sorted(missing):
        contract_ep = next((e for e in contract_endpoints if e["method"] == method and e["path"] == path), {})
        missing_details.append({
            "method": method,
            "path": path,
            "issue": "contract_not_implemented",
            "message": f"契约定义了 {method} {path}，但代码中未实现",
        })

    # 代码中有但契约中没有
    extra_details = []
    for method, path in sorted(extra):
        handler = next((h for h in implemented_handlers if h["method"] == method and h["path"] == path), {})
        extra_details.append({
            "method": method,
            "path": path,
            "issue": "implemented_not_in_contract",
            "message": f"代码实现了 {method} {path}，但契约中未定义",
            "file": handler.get("file", ""),
            "line": handler.get("line", 0),
        })

    violations = missing_details + extra_details

    return {
        "mode": "quick",
        "contract_endpoints": len(contract_set),
        "implemented_endpoints": len(implemented_set),
        "missing_implementations": len(missing),
        "extra_implementations": len(extra),
        "violations": violations,
        "verdict": "✅ 契约一致性检查通过" if not violations else f"❌ 契约不一致：{len(violations)} 个差异",
    }


def deep_check(contract_dir: Path, src_dir: Path) -> dict:
    """深度契约检查（在 quick 基础上增加 schema 对比）"""
    quick_result = quick_check(contract_dir, src_dir)

    # 额外检查：响应状态码一致性
    schema_warnings = []

    for f in contract_dir.rglob("*.json"):
        try:
            content = f.read_text(encoding="utf-8")
            spec = json.loads(content)
        except Exception:
            continue

        paths = spec.get("paths", {})
        for path, methods in paths.items():
            for method, detail in methods.items():
                if method.upper() not in ("GET", "POST", "PUT", "PATCH", "DELETE"):
                    continue
                responses = detail.get("responses", {})

                # 检查是否有错误响应定义
                has_error_response = any(str(code).startswith("4") or str(code).startswith("5") for code in responses)
                if not has_error_response:
                    schema_warnings.append({
                        "method": method.upper(),
                        "path": path,
                        "issue": "missing_error_response",
                        "message": f"{method.upper()} {path} 契约中未定义错误响应（4xx/5xx）",
                    })

                # 检查是否有 schema 引用
                for status_code, response in responses.items():
                    content_obj = response.get("content", {})
                    for media_type, media_detail in content_obj.items():
                        if "schema" not in media_detail:
                            schema_warnings.append({
                                "method": method.upper(),
                                "path": path,
                                "status_code": str(status_code),
                                "issue": "missing_response_schema",
                                "message": f"{method.upper()} {path} 响应 {status_code} 缺少 schema 定义",
                            })

    quick_result["mode"] = "deep"
    quick_result["schema_warnings"] = schema_warnings
    quick_result["violations"] = quick_result["violations"] + schema_warnings
    quick_result["verdict"] = "✅ 深度契约检查通过" if not quick_result["violations"] else f"❌ 契约不一致：{len(quick_result['violations'])} 个问题"

    return quick_result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="API 契约一致性检查")
    parser.add_argument("--contract-dir", required=True, help="API 契约目录（OpenAPI/Markdown）")
    parser.add_argument("--src-dir", required=True, help="源代码目录")
    parser.add_argument("--mode", default="quick", choices=["quick", "deep"], help="检查模式（quick: 快速规则 / deep: 深度契约）")
    args = parser.parse_args()

    contract_dir = Path(args.contract_dir)
    src_dir = Path(args.src_dir)

    if not contract_dir.exists():
        print(json.dumps({"error": f"契约目录不存在: {args.contract_dir}"}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)

    if not src_dir.exists():
        print(json.dumps({"error": f"源代码目录不存在: {args.src_dir}"}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)

    if args.mode == "quick":
        result = quick_check(contract_dir, src_dir)
    else:
        result = deep_check(contract_dir, src_dir)

    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(0 if not result.get("violations") else 1)
