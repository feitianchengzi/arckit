#!/usr/bin/env python3
"""
run_eval.py — Skill 有效性评估（A/B 对比）

回答核心问题："用了 Skill 的输出，到底比不用好多少？"

方法（A/B 对比）：
  每个 case 定义一对输入：baseline（裸 prompt）vs treatment（带 SKILL.md）。
  对两者输出分别用 scorer 打分，delta = treatment_score - baseline_score。
  delta > 0 → Skill 在该 case 上有效；delta 越大，提升越显著。

运行模式：
  1. 手动模式（默认，零依赖）：用户已在 LLM 端跑过两次（带/不带 SKILL.md），
     把输出文件交给本脚本评分对比。LLM 调用与评分解耦 → 零平台依赖。
  2. 批量模式：--cases-dir + --outputs-dir，约定每个 case id 对应
     {id}.baseline.txt 和 {id}.treatment.txt。

scorer.py 是确定性的纯 Python，不依赖任何 LLM provider，可复现。

用法：
  # 单 case
  python3 run_eval.py --case cases/review_flattery.json \\
    --baseline-output out/b.txt --treatment-output out/t.txt

  # 批量
  python3 run_eval.py --cases-dir cases/ --outputs-dir out/

  # 报告写文件
  python3 run_eval.py --case ... --baseline-output ... --treatment-output ... --report report.md
"""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from scorer import score  # noqa: E402

SIGNIFICANCE = 0.1  # |delta| >= 0.1 视为显著


def load_case(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        raise SystemExit(f"❌ 加载 case {path} 失败: {e}")


def _read(path) -> str:
    try:
        return Path(path).read_text(encoding="utf-8")
    except Exception as e:
        raise SystemExit(f"❌ 读取输出失败 {path}: {e}")


def evaluate_pair(case: dict, baseline_output: str, treatment_output: str) -> dict:
    b = score(baseline_output, case.get("rubric", []))
    t = score(treatment_output, case.get("rubric", []))
    delta = round(t["score"] - b["score"], 3)
    if delta >= SIGNIFICANCE:
        verdict = "✅ Skill 有效"
    elif delta <= -SIGNIFICANCE:
        verdict = "❌ Skill 无效或负向"
    else:
        verdict = "⚪ 提升不显著"
    return {
        "id": case.get("id", "?"),
        "skill": case.get("skill", "?"),
        "description": case.get("description", ""),
        "baseline": b,
        "treatment": t,
        "delta": delta,
        "verdict": verdict,
    }


def run_single(case_path, baseline_path, treatment_path):
    case = load_case(Path(case_path))
    return [evaluate_pair(case, _read(baseline_path), _read(treatment_path))]


def run_batch(cases_dir, outputs_dir):
    cases_dir, outputs_dir = Path(cases_dir), Path(outputs_dir)
    results, skipped = [], []
    for case_file in sorted(cases_dir.glob("*.json")):
        case = load_case(case_file)
        cid = case.get("id", case_file.stem)
        b_file = outputs_dir / f"{cid}.baseline.txt"
        t_file = outputs_dir / f"{cid}.treatment.txt"
        if not (b_file.exists() and t_file.exists()):
            skipped.append(cid)
            continue
        results.append(evaluate_pair(
            case, b_file.read_text(encoding="utf-8"), t_file.read_text(encoding="utf-8")
        ))
    if skipped:
        print(f"⚠️ 跳过 {len(skipped)} 个 case（缺少输出文件）: {skipped}", file=sys.stderr)
    if not results:
        print(f"⚠️ 无可评估结果。检查 {outputs_dir} 下是否有 {{id}}.baseline.txt / {{id}}.treatment.txt", file=sys.stderr)
    return results


def render_report(results) -> str:
    lines = ["# Skill 有效性评估报告", ""]
    n = len(results)
    if n == 0:
        lines.append("无评估结果。")
        return "\n".join(lines)

    deltas = [r["delta"] for r in results]
    avg = round(sum(deltas) / n, 3)
    positive = sum(1 for d in deltas if d >= SIGNIFICANCE)
    negative = sum(1 for d in deltas if d <= -SIGNIFICANCE)

    lines += [
        "## 摘要",
        f"- 评估 case 数: {n}",
        f"- 平均提升 Δ: {'+' if avg >= 0 else ''}{avg}",
        f"- 显著正向（Δ≥{SIGNIFICANCE}）: {positive}/{n}",
        f"- 显著负向（Δ≤-{SIGNIFICANCE}）: {negative}/{n}",
        "",
        "## 逐 case 对比",
        "| Case | Skill | Baseline | Treatment | Δ | 判定 |",
        "|------|-------|----------|-----------|---|------|",
    ]
    for r in results:
        lines.append(
            f"| {r['id']} | {r['skill']} | {r['baseline']['score']} | "
            f"{r['treatment']['score']} | {'+' if r['delta'] >= 0 else ''}{r['delta']} | {r['verdict']} |"
        )

    lines += ["", "## 详情", ""]
    for r in results:
        lines.append(f"### {r['id']}（{r['skill']}）")
        lines.append(f"> {r['description']}")
        lines.append("")
        for tag, blk in (("baseline", r["baseline"]), ("treatment", r["treatment"])):
            lines.append(f"- **{tag}** = {blk['score']}")
            for item in blk["results"]:
                mark = "✅" if item["passed"] else "❌"
                lines.append(f"  - {mark} {item['id']}: {item['detail']}")
        lines.append(f"- **Δ = {'+' if r['delta'] >= 0 else ''}{r['delta']}**  →  {r['verdict']}")
        lines.append("")
    return "\n".join(lines)


def _cli():
    parser = argparse.ArgumentParser(description="Skill 有效性评估（A/B 对比）")
    parser.add_argument("--case", help="单个 case JSON 文件")
    parser.add_argument("--baseline-output", help="baseline 输出文件（不带 SKILL.md）")
    parser.add_argument("--treatment-output", help="treatment 输出文件（带 SKILL.md）")
    parser.add_argument("--cases-dir", help="批量：case 目录")
    parser.add_argument("--outputs-dir", help="批量：输出目录")
    parser.add_argument("--report", help="报告写入文件（默认 stdout）")
    parser.add_argument("--json", action="store_true", help="输出 JSON 而非 Markdown")
    args = parser.parse_args()

    if args.case:
        if not (args.baseline_output and args.treatment_output):
            parser.error("单 case 模式需要 --baseline-output 和 --treatment-output")
        results = run_single(args.case, args.baseline_output, args.treatment_output)
    elif args.cases_dir:
        if not args.outputs_dir:
            parser.error("批量模式需要 --outputs-dir")
        results = run_batch(args.cases_dir, args.outputs_dir)
    else:
        parser.error("需要 --case（单 case）或 --cases-dir（批量）")
        return

    out = json.dumps(results, ensure_ascii=False, indent=2) if args.json else render_report(results)

    if args.report:
        Path(args.report).write_text(out, encoding="utf-8")
        print(f"✅ 报告已写入 {args.report}", file=sys.stderr)
    else:
        print(out)


if __name__ == "__main__":
    _cli()
