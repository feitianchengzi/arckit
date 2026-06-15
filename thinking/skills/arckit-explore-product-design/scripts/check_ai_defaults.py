#!/usr/bin/env python3
"""
check_ai_defaults.py — 反AI默认风格检测

检测设计文件/代码是否踩中AI聚类出的三种默认风格：
  - 暖奶油风（背景#F4F1EA + 高对比衬线 + 赤陶土色）
  - 暗黑酸色风（近黑背景 + 单一亮酸绿/朱红）
  - 报纸排版风（极细分割线 + 零圆角 + 密集分栏）

铁律：没有signature元素就不能交付。踩中默认风格 = 无signature。

用法:
  python3 check_ai_defaults.py --design-file style.css
  python3 check_ai_defaults.py --design-file index.html --json
  cat style.css | python3 check_ai_defaults.py --stdin
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple


# ─── AI默认风格特征定义 ────────────────────────────────────

AI_DEFAULT_STYLES = {
    "warm_cream": {
        "label": "暖奶油风",
        "description": "背景#F4F1EA + 高对比衬线 + 赤陶土色点缀",
        "indicators": {
            "bg_colors": ["#F4F1EA", "#F5F0E8", "#FAF6F0", "#F8F4EE", "#f4f1ea", "#f5f0e8"],
            "font_families": ["Playfair Display", "Lora", "Crimson Text", "Merriweather", "Georgia"],
            "accent_colors": ["#C67B5C", "#B85C38", "#A0522D", "#D4956A", "#C27C50"],
        },
        "verdict": "踩中AI默认暖奶油风，必须修改配色和字体以建立signature",
    },
    "dark_acid": {
        "label": "暗黑酸色风",
        "description": "近黑背景 + 单一亮酸绿/朱红点缀",
        "indicators": {
            "bg_colors": ["#0A0A0A", "#111111", "#0D0D0D", "#1A1A1A", "#0a0a0a", "#111"],
            "accent_colors": ["#00FF41", "#39FF14", "#FF3131", "#E23131", "#00ff41", "#ff3131"],
            "font_families": ["JetBrains Mono", "Fira Code", "Space Mono", "IBM Plex Mono"],
        },
        "verdict": "踩中AI默认暗黑酸色风，必须修改配色和交互风格以建立signature",
    },
    "newspaper": {
        "label": "报纸排版风",
        "description": "极细分割线 + 零圆角 + 密集报纸式分栏",
        "indicators": {
            "border_widths": ["1px", "0.5px", "0.5"],
            "border_radius": ["0", "0px", "0rem"],
            "column_counts": ["column-count: 3", "column-count:4", "columns: 3"],
        },
        "verdict": "踩中AI默认报纸排版风，必须增加圆角和留白以建立signature",
    },
}

# Signature元素特征
SIGNATURE_INDICATORS = [
    "signature", "landmark", "hero-visual", "distinctive", "unique-element",
    "brand-mark", "identity", "trademark", "hallmark", "standout",
]


def detect_style(content: str) -> List[Dict]:
    """检测内容是否踩中AI默认风格"""
    findings = []

    for style_id, style_def in AI_DEFAULT_STYLES.items():
        indicators = style_def["indicators"]
        match_count = 0
        matched_evidence = []

        # 检查背景色
        for color in indicators.get("bg_colors", []):
            if color.lower() in content.lower():
                match_count += 1
                matched_evidence.append(f"背景色匹配: {color}")

        # 检查字体
        for font in indicators.get("font_families", []):
            if font.lower() in content.lower():
                match_count += 1
                matched_evidence.append(f"字体匹配: {font}")

        # 检查强调色
        for color in indicators.get("accent_colors", []):
            if color.lower() in content.lower():
                match_count += 1
                matched_evidence.append(f"强调色匹配: {color}")

        # 检查边框
        for bw in indicators.get("border_widths", []):
            pattern = rf'border[^;]*width[^;]*{re.escape(bw)}'
            if re.search(pattern, content, re.IGNORECASE):
                match_count += 1
                matched_evidence.append(f"边框宽度匹配: {bw}")

        # 检查圆角
        for br in indicators.get("border_radius", []):
            pattern = rf'border-radius[^;]*{re.escape(br)}'
            if re.search(pattern, content, re.IGNORECASE):
                match_count += 1
                matched_evidence.append(f"圆角匹配: {br}")

        if match_count >= 2:
            findings.append({
                "style_id": style_id,
                "label": style_def["label"],
                "description": style_def["description"],
                "match_count": match_count,
                "evidence": matched_evidence,
                "verdict": style_def["verdict"],
                "severity": "error" if match_count >= 3 else "warning",
            })

    return findings


def check_signature(content: str) -> Dict:
    """检查是否有signature元素"""
    found = []
    for indicator in SIGNATURE_INDICATORS:
        if indicator.lower() in content.lower():
            found.append(indicator)

    if found:
        return {"has_signature": True, "evidence": found}
    return {"has_signature": False, "evidence": [], "note": "未发现signature元素标识，需人工确认设计是否有辨识度"}


def validate(content: str) -> Dict:
    """完整校验：AI默认风格 + signature检查"""
    style_findings = detect_style(content)
    signature_check = check_signature(content)

    has_violation = any(f["severity"] == "error" for f in style_findings)
    has_warning = any(f["severity"] == "warning" for f in style_findings)

    if has_violation:
        overall = "❌ 不通过：踩中AI默认风格"
    elif has_warning and not signature_check["has_signature"]:
        overall = "⚠️ 警告：疑似默认风格且无signature元素"
    elif not signature_check["has_signature"]:
        overall = "⚠️ 警告：未发现signature元素"
    else:
        overall = "✅ 通过"

    return {
        "overall": overall,
        "ai_default_detections": style_findings,
        "signature_check": signature_check,
    }


# ─── CLI ──────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="反AI默认风格检测")
    parser.add_argument("--design-file", default="", help="设计文件路径（CSS/HTML）")
    parser.add_argument("--stdin", action="store_true", help="从 stdin 读取")
    parser.add_argument("--json", action="store_true", help="JSON 输出")
    args = parser.parse_args()

    content = ""
    if args.stdin:
        content = sys.stdin.read()
    elif args.design_file:
        try:
            content = Path(args.design_file).read_text(encoding="utf-8")
        except Exception as e:
            print(f"❌ 无法读取文件: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        parser.error("必须指定 --design-file 或 --stdin")

    result = validate(content)

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(result["overall"])
        for f in result["ai_default_detections"]:
            icon = "🔴" if f["severity"] == "error" else "🟡"
            print(f"  {icon} {f['label']}: {f['verdict']}")
            for e in f["evidence"]:
                print(f"     - {e}")
        sc = result["signature_check"]
        if sc["has_signature"]:
            print(f"  ✅ Signature元素: {', '.join(sc['evidence'])}")
        else:
            print(f"  ⚠️ {sc.get('note', '未发现signature元素')}")
