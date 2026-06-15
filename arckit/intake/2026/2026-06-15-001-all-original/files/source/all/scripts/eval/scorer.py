#!/usr/bin/env python3
"""
scorer.py — Skill 输出评分器（eval 框架的判定核心）

基于 rubric 对 Agent 输出做**确定性规则评分**。这是关键：评分不依赖任何 LLM，
用确定性规则回答"输出是否满足纪律"。于是"Skill 有没有用"从主观声称变成可复现证据。

这正是 verify 铁律（"没有新鲜证据就不能声称完成"）对 Skill 体系自身的反观：
在没有 scorer 之前，"13 个 Skill 能输出高质量内容"是声称；有了它，每条纪律都有分数。

支持的 check 类型：
  - not_contains : 输出不含任一 pattern（如：不含谄媚短语）→ 通过
  - contains_any : 输出含任一 pattern（如：含具体技术问题）→ 通过
  - contains_all: 输出含全部 pattern → 通过
  - regex       : 正则匹配（pattern 字段）
  - min_length  : 输出字符数 >= threshold → 通过

每个 rubric 项有 weight，通过即得该项权重分；总分 = 通过权重和 / 全部权重和（0~1）。

用法：
  python3 scorer.py --output-file out.txt --rubric-file rubric.json
  python3 scorer.py --output-file out.txt --rubric-file rubric.json --json
"""

import argparse
import json
import re
import sys
from pathlib import Path


def _check_one(rubric: dict, output: str) -> dict:
    """对单条 rubric 项评分，返回 {id, description, passed, detail}。"""
    rid = rubric.get("id", "?")
    desc = rubric.get("description", "")
    check = rubric.get("check", "")
    patterns = rubric.get("patterns", []) or []
    case_sensitive = rubric.get("case_sensitive", False)

    haystack = output if case_sensitive else output.lower()
    needles = patterns if case_sensitive else [str(p).lower() for p in patterns]

    if check == "not_contains":
        hit = [p for p in needles if p and p in haystack]
        passed = len(hit) == 0
        detail = f"命中禁止项: {hit}" if hit else "无禁止项"
    elif check == "contains_any":
        hit = [p for p in needles if p and p in haystack]
        passed = len(hit) > 0
        detail = f"命中: {hit}" if hit else "未命中任一期望项"
    elif check == "contains_all":
        miss = [p for p in needles if p and p not in haystack]
        passed = len(miss) == 0
        detail = f"缺失: {miss}" if miss else "全部命中"
    elif check == "regex":
        pat = rubric.get("pattern", "")
        flags = 0 if case_sensitive else re.IGNORECASE
        m = re.search(pat, output, flags) if pat else None
        passed = bool(m)
        detail = f"匹配: {m.group()!r}" if m else f"未匹配 /{pat}/"
    elif check == "min_length":
        n = len(output)
        thr = int(rubric.get("threshold", 0))
        passed = n >= thr
        detail = f"长度 {n} {'≥' if passed else '<'} {thr}"
    else:
        passed = False
        detail = f"未知 check 类型: {check!r}"

    return {"id": rid, "description": desc, "passed": passed, "detail": detail}


def score(output: str, rubric: list) -> dict:
    """对一个输出按 rubric 列表评分。

    返回 {results, score(0~1), passed_weight, total_weight}。
    """
    results = []
    passed_w = 0.0
    total_w = 0.0
    for item in rubric or []:
        w = float(item.get("weight", 1.0))
        total_w += w
        r = _check_one(item, output)
        if r["passed"]:
            passed_w += w
        results.append(r)
    s = (passed_w / total_w) if total_w > 0 else 0.0
    return {
        "results": results,
        "score": round(s, 3),
        "passed_weight": passed_w,
        "total_weight": total_w,
    }


def _cli():
    parser = argparse.ArgumentParser(description="Skill 输出评分器（确定性规则）")
    parser.add_argument("--output-file", required=True, help="待评分的输出文件")
    parser.add_argument("--rubric-file", required=True, help="rubric JSON 文件（列表）")
    parser.add_argument("--json", action="store_true", help="输出 JSON")
    args = parser.parse_args()

    try:
        output = Path(args.output_file).read_text(encoding="utf-8")
    except Exception as e:
        print(f"❌ 读取输出失败: {e}", file=sys.stderr)
        sys.exit(1)
    try:
        loaded = json.loads(Path(args.rubric_file).read_text(encoding="utf-8"))
        # 兼容两种格式：纯 rubric 列表，或 case 文件（对象含 'rubric' 键）
        if isinstance(loaded, dict):
            if "rubric" not in loaded:
                raise ValueError("对象缺少 'rubric' 键")
            rubric = loaded["rubric"]
        else:
            rubric = loaded
        if not isinstance(rubric, list):
            raise ValueError("rubric 必须是列表")
    except Exception as e:
        print(f"❌ 读取 rubric 失败: {e}", file=sys.stderr)
        sys.exit(1)

    result = score(output, rubric)
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"得分: {result['score']} ({result['passed_weight']}/{result['total_weight']})")
        for r in result["results"]:
            mark = "✅" if r["passed"] else "❌"
            print(f"  {mark} {r['id']}: {r['detail']}")


if __name__ == "__main__":
    _cli()
