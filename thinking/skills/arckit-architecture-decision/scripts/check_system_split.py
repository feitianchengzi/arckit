#!/usr/bin/env python3
"""
check_system_split.py — 系统拆分检查

检查系统拆分方案是否存在循环依赖、边界模糊、数据一致性等问题。
对应 SKILL.md Step3 拆分检查清单。

用法:
  python3 check_system_split.py --services-json services.json
"""

import argparse
import json
import sys
from pathlib import Path


def check_circular_deps(services: list) -> list:
    """检查循环依赖"""
    errors = []
    dep_map = {}
    for svc in services:
        name = svc.get("name", "")
        deps = svc.get("dependencies", [])
        dep_map[name] = deps

    # DFS 检测环
    def find_cycle(node, visited, path):
        if node in path:
            cycle_start = path.index(node)
            return path[cycle_start:] + [node]
        if node in visited:
            return None
        visited.add(node)
        path.append(node)
        for dep in dep_map.get(node, []):
            result = find_cycle(dep, visited, path)
            if result:
                return result
        path.pop()
        return None

    for svc_name in dep_map:
        cycle = find_cycle(svc_name, set(), [])
        if cycle:
            errors.append({
                "level": "error",
                "check": "circular_dependency",
                "message": f"循环依赖: {' → '.join(cycle)}",
            })

    return errors


def check_boundary_clarity(services: list) -> list:
    """检查边界清晰度"""
    warnings = []
    for svc in services:
        name = svc.get("name", "")
        responsibility = svc.get("responsibility", "")
        if not responsibility:
            warnings.append({
                "level": "warning",
                "check": "boundary_clarity",
                "message": f"服务 '{name}' 缺少职责描述",
            })
        deps = svc.get("dependencies", [])
        if len(deps) > 5:
            warnings.append({
                "level": "warning",
                "check": "boundary_clarity",
                "message": f"服务 '{name}' 依赖过多({len(deps)}个)，可能边界过大",
            })
    return warnings


def check_data_consistency(services: list) -> list:
    """检查数据一致性策略"""
    warnings = []
    shared_dbs = {}
    for svc in services:
        db = svc.get("database", "")
        if db:
            shared_dbs.setdefault(db, []).append(svc.get("name", ""))

    for db, svc_list in shared_dbs.items():
        if len(svc_list) > 1:
            warnings.append({
                "level": "error",
                "check": "data_consistency",
                "message": f"多个服务共享数据库 '{db}': {', '.join(svc_list)}。违反独立数据原则",
            })

    for svc in services:
        consistency = svc.get("consistency_strategy", "")
        if not consistency and svc.get("dependencies", []):
            warnings.append({
                "level": "warning",
                "check": "data_consistency",
                "message": f"服务 '{svc.get('name', '')}' 有跨服务依赖但未声明一致性策略",
            })
    return warnings


def validate(services: list) -> dict:
    """完整系统拆分校验"""
    all_errors = []
    all_warnings = []

    all_errors.extend(check_circular_deps(services))
    all_warnings.extend(check_boundary_clarity(services))
    all_warnings.extend(check_data_consistency(services))

    ok = len(all_errors) == 0
    return {
        "ok": ok,
        "errors": all_errors,
        "warnings": all_warnings,
        "summary": f"{'✅ 通过' if ok else '❌ 不通过'}: {len(all_errors)} 错误, {len(all_warnings)} 警告",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="系统拆分检查")
    parser.add_argument("--services-json", required=True, help="服务定义 JSON 文件")
    args = parser.parse_args()

    try:
        services = json.loads(Path(args.services_json).read_text(encoding="utf-8"))
    except Exception as e:
        print(f"❌ 无法读取服务定义: {e}", file=sys.stderr)
        sys.exit(1)

    result = validate(services)
    print(json.dumps(result, ensure_ascii=False, indent=2))
