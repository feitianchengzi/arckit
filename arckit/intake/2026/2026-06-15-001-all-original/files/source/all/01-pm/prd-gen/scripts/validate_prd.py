#!/usr/bin/env python3
"""
validate_prd.py — PRD 文档质量校验

校验生成的 PRD 是否满足最低质量标准：
  1. 必需章节是否存在
  2. 占位符残留检测
  3. 章节内容最小长度检查
  4. 验收标准存在性检查

用法:
  python3 validate_prd.py --prd-file path/to/prd.md [--strict]
  python3 validate_prd.py --prd-dir path/to/prds/ [--strict]

退出码:
  0 — 校验通过
  1 — 校验不通过（有 error）
  2 — 校验通过但有 warning
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple


# ─── 必需章节定义 ─────────────────────────────────────────

REQUIRED_SECTIONS = {
    "simple": ["背景", "验收标准"],
    "standard": ["背景", "目标", "功能范围", "验收标准"],
    "complex": ["背景", "目标", "功能范围", "验收标准", "方案对比", "风险"],
}

RECOMMENDED_SECTIONS = {
    "simple": ["改动范围", "影响评估"],
    "standard": ["用户与场景", "技术约束", "非功能需求"],
    "complex": ["现状分析", "分阶段交付", "迁移方案"],
}

MIN_SECTION_LENGTH = 30  # 章节内容最少字符数

PLACEHOLDER_PATTERNS = [
    r"⚠️\s*\*\*\[待补充\]\*\*",
    r"\[待补充\]",
    r"\[TODO\]",
    r"\[TBD\]",
    r"⚠️\s*\[待补充\]",
]


# ─── 校验逻辑 ─────────────────────────────────────────────

def detect_complexity_from_content(content: str) -> str:
    """从 PRD 内容推断复杂度"""
    has_complex_sections = any(
        kw in content for kw in ["方案对比", "现状分析", "分阶段交付", "迁移方案"]
    )
    if has_complex_sections:
        return "complex"
    has_standard_sections = any(
        kw in content for kw in ["用户与场景", "技术约束"]
    )
    if has_standard_sections:
        return "standard"
    return "simple"


def extract_sections(content: str) -> Dict[str, str]:
    """提取所有 ## 级别章节"""
    sections = {}
    current_title = None
    current_lines = []

    for line in content.split("\n"):
        if line.startswith("## "):
            if current_title:
                sections[current_title] = "\n".join(current_lines).strip()
            current_title = line[3:].strip()
            current_lines = []
        elif current_title:
            current_lines.append(line)

    if current_title:
        sections[current_title] = "\n".join(current_lines).strip()

    return sections


def check_required_sections(sections: Dict[str, str], complexity: str) -> List[dict]:
    """检查必需章节是否存在"""
    errors = []
    required = REQUIRED_SECTIONS.get(complexity, REQUIRED_SECTIONS["standard"])

    for req in required:
        found = False
        for title in sections:
            if req in title:
                found = True
                break
        if not found:
            errors.append({
                "level": "error",
                "check": "required_section",
                "section": req,
                "message": f"缺少必需章节：{req}",
            })

    return errors


def check_recommended_sections(sections: Dict[str, str], complexity: str) -> List[dict]:
    """检查推荐章节是否存在"""
    warnings = []
    recommended = RECOMMENDED_SECTIONS.get(complexity, RECOMMENDED_SECTIONS["standard"])

    for rec in recommended:
        found = False
        for title in sections:
            if rec in title:
                found = True
                break
        if not found:
            warnings.append({
                "level": "warning",
                "check": "recommended_section",
                "section": rec,
                "message": f"缺少推荐章节：{rec}",
            })

    return warnings


def check_section_length(sections: Dict[str, str]) -> List[dict]:
    """检查章节内容是否过短"""
    warnings = []
    for title, content in sections.items():
        # 跳过元信息章节
        if any(kw in title for kw in ["文档信息", "自动生成"]):
            continue
        if len(content) < MIN_SECTION_LENGTH and content.strip():
            warnings.append({
                "level": "warning",
                "check": "section_length",
                "section": title,
                "message": f"章节「{title}」内容过短（{len(content)} 字，建议 ≥{MIN_SECTION_LENGTH} 字）",
            })
    return warnings


def check_placeholders(content: str) -> List[dict]:
    """检查占位符残留"""
    errors = []
    for pattern in PLACEHOLDER_PATTERNS:
        matches = list(re.finditer(pattern, content))
        if matches:
            # 获取每个匹配的上下文
            for m in matches:
                start = max(0, m.start() - 50)
                end = min(len(content), m.end() + 50)
                context = content[start:end].replace("\n", " ")
                errors.append({
                    "level": "warning",
                    "check": "placeholder",
                    "position": m.start(),
                    "message": f"占位符残留：{m.group()}，上下文：...{context}...",
                })
    return errors


def check_acceptance_criteria(sections: Dict[str, str]) -> List[dict]:
    """检查验收标准是否存在且非空"""
    errors = []
    ac_found = False
    for title, content in sections.items():
        if "验收标准" in title or "验收" in title:
            ac_found = True
            if not content.strip() or len(content.strip()) < 20:
                errors.append({
                    "level": "error",
                    "check": "acceptance_criteria",
                    "section": title,
                    "message": "验收标准章节为空或内容不足",
                })
            break

    if not ac_found:
        errors.append({
            "level": "error",
            "check": "acceptance_criteria",
            "message": "缺少验收标准章节",
        })

    return errors


def validate_prd(prd_path: Path, strict: bool = False) -> dict:
    """
    校验单份 PRD 文档

    Args:
        prd_path: PRD 文件路径
        strict: 严格模式，warning 也视为不通过

    Returns:
        dict: {"ok": bool, "errors": [...], "warnings": [...], "summary": str}
    """
    try:
        content = prd_path.read_text(encoding="utf-8")
    except Exception as e:
        return {"ok": False, "errors": [{"level": "error", "message": f"无法读取文件：{e}"}],
                "warnings": [], "summary": f"❌ 文件读取失败"}

    complexity = detect_complexity_from_content(content)
    sections = extract_sections(content)

    all_errors = []
    all_warnings = []

    # 必需章节
    all_errors.extend(check_required_sections(sections, complexity))

    # 推荐章节
    all_warnings.extend(check_recommended_sections(sections, complexity))

    # 章节长度
    all_warnings.extend(check_section_length(sections))

    # 占位符
    placeholder_results = check_placeholders(content)
    for p in placeholder_results:
        if strict:
            all_errors.append(p)
        else:
            all_warnings.append(p)

    # 验收标准
    all_errors.extend(check_acceptance_criteria(sections))

    # 汇总
    error_count = len(all_errors)
    warning_count = len(all_warnings)
    ok = error_count == 0 and (not strict or warning_count == 0)

    if ok and warning_count == 0:
        summary = f"✅ 校验通过（复杂度：{complexity}，{len(sections)} 个章节）"
    elif ok:
        summary = f"⚠️ 校验通过但有 {warning_count} 个警告（复杂度：{complexity}）"
    else:
        summary = f"❌ 校验不通过：{error_count} 个错误，{warning_count} 个警告"

    return {
        "ok": ok,
        "file": str(prd_path),
        "complexity": complexity,
        "section_count": len(sections),
        "errors": all_errors,
        "warnings": all_warnings,
        "summary": summary,
    }


# ─── CLI 入口 ─────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PRD 文档质量校验")
    parser.add_argument("--prd-file", help="校验单个 PRD 文件")
    parser.add_argument("--prd-dir", help="校验目录下所有 PRD 文件")
    parser.add_argument("--strict", action="store_true", help="严格模式（warning 也视为不通过）")
    parser.add_argument("--json", action="store_true", help="输出 JSON 格式")
    args = parser.parse_args()

    if not args.prd_file and not args.prd_dir:
        parser.error("必须指定 --prd-file 或 --prd-dir")

    results = []

    if args.prd_file:
        path = Path(args.prd_file)
        results.append(validate_prd(path, strict=args.strict))

    if args.prd_dir:
        prd_dir = Path(args.prd_dir)
        for md_file in sorted(prd_dir.glob("*.md")):
            results.append(validate_prd(md_file, strict=args.strict))

    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        for r in results:
            print(r["summary"])
            for e in r.get("errors", []):
                print(f"  🔴 {e['message']}")
            for w in r.get("warnings", []):
                print(f"  🟡 {w['message']}")

    # 退出码
    all_ok = all(r["ok"] for r in results)
    has_warnings = any(r.get("warnings") for r in results)
    if not all_ok:
        sys.exit(1)
    elif has_warnings:
        sys.exit(2)
    else:
        sys.exit(0)
