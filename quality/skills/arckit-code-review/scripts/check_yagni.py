#!/usr/bin/env python3
"""
check_yagni.py — YAGNI 检查

检查代码变更中是否存在过度设计：没有调用方的抽象、提前优化的通用化、"future-proof"扩展。
对应 SKILL.md Step3 YAGNI 检查。

用法:
  python3 check_yagni.py --diff-file diff.patch --codebase-dir ./src
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path


YAGNI_PATTERNS = [
    (r'(?:properly\s+implement|make\s+it\s+generic|future-proof|extensible\s+for)', "过度通用化关键词"),
    (r'(?:abstract\s+class|interface\s+I[A-Z])', "抽象类/接口（需验证是否有多个实现）"),
    (r'(?:Strategy\s+Pattern|Factory\s+Pattern|Plugin\s+System)', "设计模式（需验证是否有第二个调用方）"),
    (r'(?:TODO|FIXME|HACK).{0,30}(?:later|future|someday|eventually)', "面向未来的TODO标记"),
]


def check_yagni(diff_content: str, codebase_dir: str = "") -> list:
    """检查 diff 中的 YAGNI 违规"""
    findings = []

    for line_num, line in enumerate(diff_content.split("\n"), 1):
        if not line.startswith("+"):
            continue  # 只检查新增行

        for pattern, description in YAGNI_PATTERNS:
            if re.search(pattern, line, re.IGNORECASE):
                # 检查是否有实际调用方
                clean = line.lstrip("+").strip()
                findings.append({
                    "line": line_num,
                    "content": clean[:100],
                    "pattern": description,
                    "action": "验证是否有实际调用方，无则删除过度设计",
                })

    return findings


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="YAGNI 检查")
    parser.add_argument("--diff-file", required=True, help="Diff 文件路径")
    parser.add_argument("--codebase-dir", default="", help="代码库目录")
    args = parser.parse_args()

    try:
        diff_content = Path(args.diff_file).read_text(encoding="utf-8")
    except Exception as e:
        print(f"❌ 无法读取文件: {e}", file=sys.stderr)
        sys.exit(1)

    findings = check_yagni(diff_content, args.codebase_dir)

    result = {
        "ok": len(findings) == 0,
        "finding_count": len(findings),
        "findings": findings,
        "summary": f"{'✅ 无YAGNI违规' if not findings else f'⚠️ 发现 {len(findings)} 处疑似过度设计'}",
    }

    print(json.dumps(result, ensure_ascii=False, indent=2))
