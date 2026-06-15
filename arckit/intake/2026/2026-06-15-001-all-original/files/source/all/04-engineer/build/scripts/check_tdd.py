#!/usr/bin/env python3
"""
check_tdd.py — TDD 流程检查

检查代码变更是否有对应的测试文件。
铁律：没有失败测试就不能写产品代码。

用法:
  python3 check_tdd.py --changed-files "src/order/Order.ts,src/order/OrderService.ts" --test-dir tests/
  python3 check_tdd.py --changed-files-file changed.txt --test-dir tests/
"""

import argparse
import json
import sys
from pathlib import Path


TEST_FILE_PATTERNS = [
    # Jest/Vitest
    lambda f: f.parent / f"__tests__" / f"{f.stem}.test{f.suffix}",
    lambda f: f.parent / f"{f.stem}.test{f.suffix}",
    lambda f: f.parent / f"{f.stem}.spec{f.suffix}",
    # pytest
    lambda f: f.parent / f"test_{f.stem}.py",
    lambda f: f.parent.parent / "tests" / f"test_{f.stem}.py",
    # Go
    lambda f: f.parent / f"{f.stem}_test.go",
    # Java
    lambda f: f.parent / f"{f.stem}Test.java",
    # Rust
    lambda f: f,  # Rust tests are inline
]


def find_test_file(source_path: Path, test_dir: Path = None) -> dict:
    """查找源文件对应的测试文件"""
    # 先检查 test_dir
    if test_dir and test_dir.exists():
        for pattern in TEST_FILE_PATTERNS:
            try:
                candidate = pattern(source_path)
                # 替换源目录为测试目录
                relative = candidate.relative_to(source_path.parent.parent) if candidate.is_relative_to(source_path.parent.parent) else candidate
                test_candidate = test_dir / relative
                if test_candidate.exists():
                    return {"found": True, "test_file": str(test_candidate)}
            except Exception:
                continue

    # 再检查同目录
    for pattern in TEST_FILE_PATTERNS:
        try:
            candidate = pattern(source_path)
            if candidate.exists():
                return {"found": True, "test_file": str(candidate)}
        except Exception:
            continue

    return {"found": False, "test_file": None}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TDD 流程检查")
    parser.add_argument("--changed-files", default="", help="变更文件列表（逗号分隔）")
    parser.add_argument("--changed-files-file", default="", help="变更文件列表文件")
    parser.add_argument("--test-dir", default="", help="测试目录")
    args = parser.parse_args()

    files = []
    if args.changed_files:
        files = [f.strip() for f in args.changed_files.split(",") if f.strip()]
    if args.changed_files_file:
        try:
            files.extend(Path(args.changed_files_file).read_text().strip().split("\n"))
        except Exception:
            pass

    test_dir = Path(args.test_dir) if args.test_dir else None
    results = []
    violations = []

    for f in files:
        source = Path(f)
        test_result = find_test_file(source, test_dir)
        result = {"source": f, "test_found": test_result["found"], "test_file": test_result.get("test_file")}
        results.append(result)
        if not test_result["found"]:
            violations.append(f)

    ok = len(violations) == 0
    output = {
        "ok": ok,
        "total_files": len(files),
        "with_tests": len(files) - len(violations),
        "without_tests": len(violations),
        "violations": violations,
        "details": results,
        "verdict": "✅ TDD检查通过" if ok else f"❌ TDD检查不通过：{len(violations)} 个文件缺少对应测试",
    }

    print(json.dumps(output, ensure_ascii=False, indent=2))
    sys.exit(0 if ok else 1)
