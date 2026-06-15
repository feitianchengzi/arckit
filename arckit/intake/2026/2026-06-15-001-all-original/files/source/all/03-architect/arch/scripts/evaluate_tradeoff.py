#!/usr/bin/env python3
"""
evaluate_tradeoff.py — 权衡分析计算

对 ADR 中的候选方案进行加权评分，输出权衡矩阵。
铁律：没有权衡分析就不能选技术。

用法:
  python3 evaluate_tradeoff.py --adr-file ADR-001.md --weights-json weights.json
  python3 evaluate_tradeoff.py --options-json options.json --weights-json weights.json
"""

import argparse
import json
import re
import sys
from pathlib import Path


DEFAULT_WEIGHTS = {
    "开发效率": 1.0,
    "运行性能": 1.0,
    "团队适配": 1.0,
    "长期维护": 1.0,
    "社区生态": 1.0,
    "可替代性": 1.0,
}


def evaluate(options: list, weights: dict) -> dict:
    """
    执行权衡分析

    Args:
        options: 候选方案列表，每个包含 name + 各维度分数
        weights: 维度权重

    Returns:
        dict: 权衡矩阵 + 推荐方案
    """
    # 归一化权重
    total_weight = sum(weights.values()) or 1.0
    norm_weights = {k: v / total_weight for k, v in weights.items()}

    matrix = []
    for opt in options:
        name = opt.get("name", "未命名")
        scores = opt.get("scores", {})
        weighted_total = 0.0
        row = {"name": name, "dimensions": {}}

        for dim, weight in norm_weights.items():
            score = scores.get(dim, 0)
            if not isinstance(score, (int, float)):
                score = 0
            weighted = score * weight
            weighted_total += weighted
            row["dimensions"][dim] = {
                "score": score, "weight": round(weight, 3), "weighted": round(weighted, 3)
            }

        row["weighted_total"] = round(weighted_total, 3)
        matrix.append(row)

    # 推荐最高分方案
    if matrix:
        best = max(matrix, key=lambda r: r["weighted_total"])
        recommendation = f"推荐方案: {best['name']}（加权总分 {best['weighted_total']}）"
    else:
        recommendation = "⚠️ 无候选方案，无法推荐"

    return {
        "weights": norm_weights,
        "matrix": matrix,
        "recommendation": recommendation,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="权衡分析计算")
    parser.add_argument("--adr-file", default="", help="ADR 文件路径")
    parser.add_argument("--options-json", default="", help="候选方案 JSON（含 scores）")
    parser.add_argument("--weights-json", default="", help="权重 JSON")
    args = parser.parse_args()

    options = []
    if args.options_json:
        try:
            options = json.loads(Path(args.options_json).read_text(encoding="utf-8"))
        except Exception:
            pass
    if not options:
        options = [{"name": "方案A", "scores": {}}, {"name": "方案B", "scores": {}}]

    weights = dict(DEFAULT_WEIGHTS)
    if args.weights_json:
        try:
            custom = json.loads(Path(args.weights_json).read_text(encoding="utf-8"))
            weights.update(custom)
        except Exception:
            pass

    result = evaluate(options, weights)
    print(json.dumps(result, ensure_ascii=False, indent=2))
