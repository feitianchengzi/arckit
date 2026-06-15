#!/usr/bin/env python3
"""
check_fe_standards.py — 前端代码标准检查

检查前端代码是否符合 build-fe Skill 的工程标准：
- accessibility: 无障碍检查
- performance: 性能模式检查
- component: 组件结构检查

用法:
  python3 check_fe_standards.py --type accessibility --src-dir ./src
  python3 check_fe_standards.py --type performance --src-dir ./src
  python3 check_fe_standards.py --type component --src-dir ./src
  python3 check_fe_standards.py --type all --src-dir ./src
  python3 check_fe_standards.py --help
"""

import argparse
import json
import re
import sys
from pathlib import Path


def check_accessibility(src_dir: Path) -> dict:
    """无障碍检查"""
    violations = []
    warnings = []

    for f in src_dir.rglob("*"):
        if f.suffix not in (".tsx", ".jsx", ".vue", ".svelte"):
            continue
        try:
            content = f.read_text(encoding="utf-8")
        except Exception:
            continue

        relative = str(f.relative_to(src_dir))

        # 图片必须有 alt
        for m in re.finditer(r'<img\s[^>]*>', content):
            img_tag = m.group(0)
            if "alt=" not in img_tag:
                violations.append({"file": relative, "line": _line_number(content, m.start()), "rule": "img-missing-alt", "message": "img 标签缺少 alt 属性"})

        # 交互元素需要可访问名称
        for tag in ["button", "a", "input"]:
            if tag == "input":
                for m in re.finditer(r'<input\s[^>]*>', content):
                    input_tag = m.group(0)
                    if 'type="submit"' in input_tag or 'type="button"' in input_tag:
                        if "aria-label" not in input_tag and "value=" not in input_tag:
                            violations.append({"file": relative, "line": _line_number(content, m.start()), "rule": "input-missing-label", "message": "submit/button 类型的 input 缺少可访问名称"})

        # 表单控件需要 label/aria-label
        for m in re.finditer(r'<(input|select|textarea)\s[^>]*>', content):
            tag = m.group(0)
            if "aria-label" not in tag and "aria-labelledby" not in tag:
                # 检查是否有对应的 label（简化检查）
                if 'type="hidden"' not in tag and 'type="submit"' not in tag and 'type="button"' not in tag:
                    warnings.append({"file": relative, "line": _line_number(content, m.start()), "rule": "form-missing-label", "message": "表单控件缺少 label 或 aria-label"})

        # onClick 必须有对应的键盘事件或使用 button/a
        for m in re.finditer(r'onClick=\{', content):
            line_num = _line_number(content, m.start())
            # 简化检查：如果所在标签不是 button/a，发出警告
            line_start = content.rfind("\n", 0, m.start()) + 1
            line_text = content[line_start:content.find("\n", m.start())]
            if not re.search(r'<(button|a\s)', line_text) and "role=" not in line_text:
                warnings.append({"file": relative, "line": line_num, "rule": "click-without-keyboard", "message": "onClick 元素不是 button/a，可能缺少键盘交互"})

        # 检查 aria-live 区域
        for m in re.finditer(r'setState|useState|ref\.value', content):
            # 有状态更新的组件应该考虑 aria-live
            pass  # 太笼统，不做强制

    return {
        "type": "accessibility",
        "violations": violations,
        "warnings": warnings,
        "total": len(violations) + len(warnings),
        "verdict": "✅ 无障碍检查通过" if not violations else f"❌ 无障碍检查不通过：{len(violations)} 个违规",
    }


def check_performance(src_dir: Path) -> dict:
    """性能模式检查"""
    violations = []
    warnings = []

    for f in src_dir.rglob("*"):
        if f.suffix not in (".tsx", ".jsx", ".vue", ".svelte", ".ts", ".js"):
            continue
        try:
            content = f.read_text(encoding="utf-8")
        except Exception:
            continue

        relative = str(f.relative_to(src_dir))

        # 列表渲染必须有 key
        if re.search(r'\.map\(', content):
            for m in re.finditer(r'\.map\(', content):
                line_num = _line_number(content, m.start())
                # 检查后续几行是否有 key prop
                snippet = content[m.start():m.start() + 300]
                if "key=" not in snippet and ":key=" not in snippet:
                    violations.append({"file": relative, "line": line_num, "rule": "list-missing-key", "message": "列表渲染缺少 key 属性"})

        # 检查大内联样式对象（性能问题）
        for m in re.finditer(r'style=\{\{', content):
            style_content = content[m.start():m.start() + 200]
            if style_content.count(":") > 5:
                warnings.append({"file": relative, "line": _line_number(content, m.start()), "rule": "large-inline-style", "message": "大型内联样式对象，建议提取为 CSS Module"})

        # 检查 useEffect 缺少依赖
        for m in re.finditer(r'useEffect\(\s*\(\)\s*=>\s*\{', content):
            # 查找对应的依赖数组
            after = content[m.start():m.start() + 1000]
            if "}, [])" in after or "}, [ ])" in after:
                # 空依赖，检查是否引用了外部变量
                func_body = after.split("}, [")[0] if "}, [" in after else after.split("})")[0]
                # 简化检查：如果有 props/state 引用但没在依赖中
                if re.search(r'\bprops\b|\bstate\b', func_body):
                    warnings.append({"file": relative, "line": _line_number(content, m.start()), "rule": "useEffect-missing-deps", "message": "useEffect 可能缺少依赖项"})

        # 检查 import 全量导入
        for m in re.finditer(r'import\s+\*\s+as\s+\w+\s+from\s+[\'"]lodash[\'"]', content):
            violations.append({"file": relative, "line": _line_number(content, m.start()), "rule": "full-lodash-import", "message": "全量导入 lodash，应使用 lodash/{function} 按需导入"})

    return {
        "type": "performance",
        "violations": violations,
        "warnings": warnings,
        "total": len(violations) + len(warnings),
        "verdict": "✅ 性能检查通过" if not violations else f"❌ 性能检查不通过：{len(violations)} 个违规",
    }


def check_component(src_dir: Path) -> dict:
    """组件结构检查"""
    violations = []
    warnings = []

    for f in src_dir.rglob("*"):
        if f.suffix not in (".tsx", ".jsx", ".vue", ".svelte"):
            continue
        try:
            content = f.read_text(encoding="utf-8")
        except Exception:
            continue

        relative = str(f.relative_to(src_dir))
        lines = content.split("\n")

        # 组件文件超过 150 行警告
        if len(lines) > 150:
            warnings.append({"file": relative, "line": 1, "rule": "component-too-long", "message": f"组件 {len(lines)} 行，建议拆分（目标 <150 行）"})

        # 检查是否有测试文件
        test_candidates = [
            f.parent / "__tests__" / f"{f.stem}.test{f.suffix}",
            f.parent / f"{f.stem}.test{f.suffix}",
            f.parent / f"{f.stem}.spec{f.suffix}",
        ]
        has_test = any(tc.exists() for tc in test_candidates)
        if not has_test and "page" not in f.stem.lower() and "layout" not in f.stem.lower():
            warnings.append({"file": relative, "line": 1, "rule": "missing-component-test", "message": "组件缺少对应的测试文件"})

        # 检查 CSS Module 文件
        if f.suffix in (".tsx", ".jsx"):
            css_module = f.parent / f"{f.stem}.module.css"
            has_styles = css_module.exists() or "className=" in content or "style=" in content
            if not has_styles and len(lines) > 20:
                warnings.append({"file": relative, "line": 1, "rule": "missing-styles", "message": "组件缺少样式文件"})

    return {
        "type": "component",
        "violations": violations,
        "warnings": warnings,
        "total": len(violations) + len(warnings),
        "verdict": "✅ 组件结构检查通过" if not violations else f"❌ 组件结构检查不通过：{len(violations)} 个违规",
    }


def _line_number(content: str, pos: int) -> int:
    """计算字符位置对应的行号"""
    return content[:pos].count("\n") + 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="前端代码标准检查")
    parser.add_argument("--type", required=True, choices=["accessibility", "performance", "component", "all"], help="检查类型")
    parser.add_argument("--src-dir", required=True, help="源代码目录")
    args = parser.parse_args()

    src_dir = Path(args.src_dir)
    if not src_dir.exists():
        print(json.dumps({"error": f"目录不存在: {args.src_dir}"}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)

    results = []

    check_types = ["accessibility", "performance", "component"] if args.type == "all" else [args.type]
    checkers = {
        "accessibility": check_accessibility,
        "performance": check_performance,
        "component": check_component,
    }

    for check_type in check_types:
        result = checkers[check_type](src_dir)
        results.append(result)

    all_violations = sum(r["violations"] for r in results) if isinstance(results[0], dict) else 0
    total_violations = sum(len(r.get("violations", [])) for r in results)
    total_warnings = sum(len(r.get("warnings", [])) for r in results)

    output = {
        "results": results,
        "summary": {
            "total_violations": total_violations,
            "total_warnings": total_warnings,
            "verdict": "✅ 前端标准检查通过" if total_violations == 0 else f"❌ 前端标准检查不通过：{total_violations} 个违规，{total_warnings} 个警告",
        },
    }

    print(json.dumps(output, ensure_ascii=False, indent=2))
    sys.exit(0 if total_violations == 0 else 1)
