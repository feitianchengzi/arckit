#!/usr/bin/env python3
"""
pre_bash.py — Bash 工具调用前的纪律自检 hook (Claude Code PreToolUse)

聚焦一个点：当 Agent 准备执行 `git commit` 时，提醒衔接完整性
（validate_handoff），避免在交付物断裂的情况下仓促提交。

设计原则（遵循项目规范）：
  1. 仅提醒不阻断：衔接在项目里是"增强非阻断"（README 明确），此处保持一致
  2. 非 git commit 命令直接放行，零额外开销
  3. 降级优先：validate_handoff 不可用 / 输出异常 → 静默通过
  4. 零平台依赖

用法（人工调试）：
  echo '{"tool_input":{"command":"git commit -m fix"}}' | python3 scripts/hooks/pre_bash.py
"""

import json
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
VALIDATE = REPO / "scripts" / "validate_handoff.py"


def _is_git_commit(cmd: str) -> bool:
    """粗略判断是否 git commit（不含 commit-message 类子命令误判）。"""
    if not cmd:
        return False
    tokens = cmd.strip().split()
    # 处理 git -C <path> commit / git commit
    i = 0
    if i < len(tokens) and tokens[i] == "git":
        i += 1
        while i < len(tokens) and tokens[i].startswith("-"):
            if tokens[i] == "-C" and i + 1 < len(tokens):
                i += 2
                continue
            i += 1
        return i < len(tokens) and tokens[i] == "commit"
    return False


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0

    cmd = (data.get("tool_input") or {}).get("command", "")
    if not _is_git_commit(cmd):
        return 0  # 非 commit 命令，放行

    # 跑衔接完整性检测（建议模式，不阻断）。用 --json 解析更稳。
    try:
        r = subprocess.run(
            ["python3", str(VALIDATE), "--output-dir", ".", "--json"],
            capture_output=True, text=True,
        )
        d = json.loads(r.stdout or "{}")
    except Exception:
        return 0  # 降级

    enhanced = d.get("enhanced", 0)
    total = d.get("total", 0)
    verdict = d.get("verdict", "")
    if verdict:
        print(f"📌 提交前衔接自检：{verdict}", file=sys.stderr)
        if enhanced < total:
            print(
                f"（{enhanced}/{total} 项衔接已增强，{total - enhanced} 项降级运行。"
                "衔接为增强非阻断，不阻止提交，但建议补全上游交付物）",
                file=sys.stderr,
            )
    return 0


def cli() -> int:
    import argparse
    parser = argparse.ArgumentParser(
        description="Bash 调用前纪律自检 hook（Claude Code PreToolUse）。从 stdin 读取 payload。",
    )
    parser.add_argument(
        "--payload", default="",
        help="payload JSON 文件路径（调试用；默认读 stdin）",
    )
    args = parser.parse_args()
    if args.payload:
        try:
            sys.stdin = open(args.payload, encoding="utf-8")
        except Exception as e:
            print(f"❌ 无法读取 payload: {e}", file=sys.stderr)
            return 1
    return main()


if __name__ == "__main__":
    sys.exit(cli())
