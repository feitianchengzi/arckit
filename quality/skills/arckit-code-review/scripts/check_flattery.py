#!/usr/bin/env python3
"""
check_flattery.py — 反谄媚检查

检查审查文本中是否包含谄媚式回复（社交噪音而非技术反馈）。
铁律：技术评估而非情感表演。

用法:
  python3 check_flattery.py --review-text "Great point! The code looks good to me 👍"
  cat review.md | python3 check_flattery.py --stdin
"""

import argparse
import json
import re
import sys


FLATTERY_PATTERNS = [
    (r'(?:you\'?re?\s+absolutely\s+right|you\s+are\s+absolutely\s+right)', "You're absolutely right!"),
    (r'(?:great\s+point|good\s+point|excellent\s+point)', "Great/Good/Excellent point!"),
    (r'(?:good\s+catch|nice\s+catch|great\s+catch)', "Good/Great/Nice catch!"),
    (r'(?:looks\s+good\s+to\s+me|LGTM|looks\s+good\s+to\s+me\s*👍)', "Looks good to me / LGTM"),
    (r'(?:well\s+done|great\s+job|nice\s+work)', "Well done / Great job"),
    (r'(?:👍|💯|🎉|👏)', "表情符号（无技术信息量）"),
]


def check(text: str) -> list:
    """检查文本中的谄媚模式"""
    violations = []
    for pattern, label in FLATTERY_PATTERNS:
        matches = list(re.finditer(pattern, text, re.IGNORECASE))
        for m in matches:
            start = max(0, m.start() - 30)
            end = min(len(text), m.end() + 30)
            context = text[start:end].replace("\n", " ")
            violations.append({
                "pattern": label,
                "matched": m.group(),
                "position": m.start(),
                "context": f"...{context}...",
                "fix": "替换为具体的技术观察：指出问题是什么、为什么是问题、怎么修",
            })
    return violations


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="反谄媚检查")
    parser.add_argument("--review-text", default="", help="审查文本")
    parser.add_argument("--stdin", action="store_true", help="从 stdin 读取")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    text = ""
    if args.stdin:
        text = sys.stdin.read()
    elif args.review_text:
        text = args.review_text
    else:
        parser.error("必须指定 --review-text 或 --stdin")

    violations = check(text)

    result = {
        "ok": len(violations) == 0,
        "violation_count": len(violations),
        "violations": violations,
        "summary": f"{'✅ 无谄媚违规' if not violations else f'❌ 发现 {len(violations)} 处谄媚式回复'}",
    }

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(result["summary"])
        for v in violations:
            print(f"  🚫 {v['pattern']}: {v['context']}")
            print(f"     → {v['fix']}")
