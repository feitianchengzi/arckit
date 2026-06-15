#!/usr/bin/env python3
"""
validate_signature.py — Signature 元素验证

验证设计文件是否包含可识别的 signature 元素（让页面被记住的独特元素）。
铁律：没有signature元素就不能交付。

用法:
  python3 validate_signature.py --design-file page.html
  python3 validate_signature.py --design-file style.css --master-path ./MASTER.md
"""

import argparse
import json
import re
import sys
from pathlib import Path


SIGNATURE_KEYWORDS = [
    "signature", "landmark", "hero-visual", "distinctive", "unique",
    "brand-mark", "hallmark", "standout", "identity-element",
    "memorable", "trademark",
]

VISUAL_SIGNATURE_PATTERNS = [
    r'clip-path', r'backdrop-filter', r'mask-image',
    r'gradient', r'animation', r'transform.*3d',
    r'svg', r'canvas', r'webgl',
    r'data-viz', r'chart', r'illustration',
]


def check_signature(content: str, master_content: str = "") -> dict:
    """检查设计文件是否有 signature 元素"""
    findings = []

    # 1. 检查 signature 关键词标注
    for kw in SIGNATURE_KEYWORDS:
        if kw.lower() in content.lower():
            findings.append({"type": "keyword", "evidence": f"发现signature关键词标注: {kw}"})

    # 2. 检查独特视觉技术
    for pattern in VISUAL_SIGNATURE_PATTERNS:
        matches = re.findall(pattern, content, re.IGNORECASE)
        if matches:
            findings.append({"type": "visual_technique", "evidence": f"使用独特视觉技术: {pattern} ({len(matches)}处)"})

    # 3. 检查 MASTER 中定义的 signature
    if master_content:
        sig_section = ""
        in_sig = False
        for line in master_content.split("\n"):
            if "signature" in line.lower() and line.startswith("#"):
                in_sig = True
                continue
            if in_sig and line.startswith("#"):
                break
            if in_sig:
                sig_section += line + "\n"
        if sig_section.strip() and "⚠️" not in sig_section:
            findings.append({"type": "master_signature", "evidence": "MASTER.md 中定义了 signature 元素"})

    has_signature = len(findings) > 0
    return {
        "has_signature": has_signature,
        "findings": findings,
        "verdict": "✅ 通过：发现signature元素" if has_signature else "❌ 不通过：未发现signature元素，铁律不满足",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Signature 元素验证")
    parser.add_argument("--design-file", required=True, help="设计文件路径")
    parser.add_argument("--master-path", default="", help="MASTER.md 路径")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    try:
        content = Path(args.design_file).read_text(encoding="utf-8")
    except FileNotFoundError:
        print(f"错误：文件不存在: {args.design_file}", file=sys.stderr)
        sys.exit(1)
    master_content = ""
    if args.master_path:
        try:
            master_content = Path(args.master_path).read_text(encoding="utf-8")
        except Exception:
            pass

    result = check_signature(content, master_content)

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(result["verdict"])
        for f in result["findings"]:
            print(f"  • {f['evidence']}")
        if not result["has_signature"]:
            print("\n  💡 建议：添加一个独特的视觉元素（渐变背景、自定义SVG、独特动效等）作为signature")
