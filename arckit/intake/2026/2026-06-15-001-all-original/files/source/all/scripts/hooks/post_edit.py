#!/usr/bin/env python3
"""
post_edit.py — Edit/Write 后的纪律自检 hook (Claude Code PostToolUse)

把 review Skill 的铁律从"声明式"升级为"强制执行"：每次写文件后自动跑
对应的纪律检查，让 Agent 不再靠自觉遵守铁律。

工作方式：
  - 从 stdin 读取 Claude Code PostToolUse 传入的 JSON（含 tool_input.file_path）
  - 代码文件（.ts/.py/.go...）：跑 check_yagni（启发式过度设计检测）
  - 审查/报告类 .md：跑 check_flattery（反谄媚）
  - 命中问题 → stderr 反馈给 Claude；默认温和（exit 0），HOOK_BLOCK=1 时硬阻断（exit 2）

设计原则（遵循项目规范）：
  1. 降级优先：任何异常（stdin 格式异常 / git 不可用 / 脚本缺失）一律静默通过，绝不中断 Agent
  2. 零平台依赖：不硬编码路径，通过相对脚本位置定位检查器
  3. 胶水层而非包装层：调用现有 check_* 脚本的 CLI，不改其逻辑
  4. 启发式提醒而非误报阻断：默认 exit 0 + stderr，避免正则误报中断流程

用法（人工调试）：
  echo '{"tool_input":{"file_path":"src/x.ts"}}' | python3 scripts/hooks/post_edit.py
  HOOK_BLOCK=1 python3 scripts/hooks/post_edit.py < payload.json
"""

import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

# 定位项目根：本文件位于 all/scripts/hooks/post_edit.py
REPO = Path(__file__).resolve().parents[2]
REVIEW_SCRIPTS = REPO / "05-lead" / "review" / "scripts"

CODE_EXTS = {
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".py", ".go", ".java",
    ".kt", ".rs", ".rb", ".php", ".swift", ".c", ".h", ".cpp",
}


def _run(cmd, **kw):
    """统一 subprocess 调用，失败返回 (1, "") 不抛异常。"""
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, **kw)
        return r.returncode, (r.stdout or "")
    except Exception:
        return 1, ""


def check_yagni_for_file(file_path: str) -> list:
    """对该文件未提交的改动跑 YAGNI 检查。无 git / 无改动 → 返回空。"""
    # 取该文件未暂存的 diff（刚 Edit 的改动通常在此）
    rc, diff = _run(["git", "-C", str(REPO), "diff", "--", file_path])
    if rc != 0 or not diff.strip():
        return []

    with tempfile.NamedTemporaryFile("w", suffix=".diff", delete=False, encoding="utf-8") as f:
        f.write(diff)
        diff_file = f.name
    try:
        rc, out = _run(
            ["python3", str(REVIEW_SCRIPTS / "check_yagni.py"), "--diff-file", diff_file]
        )
    finally:
        Path(diff_file).unlink(missing_ok=True)

    findings = []
    try:
        data = json.loads(out)
        for item in data.get("findings", []):
            findings.append(
                f"YAGNI 疑似过度设计 [{item.get('pattern')}]: {item.get('content')} "
                f"→ {item.get('action')}"
            )
    except Exception:
        return []
    return findings


def check_flattery_for_file(file_path: str) -> list:
    """对 .md 审查/报告内容跑反谄媚检查。"""
    try:
        text = Path(file_path).read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return []
    if not text.strip():
        return []

    rc, out = _run(
        ["python3", str(REVIEW_SCRIPTS / "check_flattery.py"), "--stdin", "--json"],
        input=text,
    )
    findings = []
    try:
        data = json.loads(out)
        for v in data.get("violations", []):
            findings.append(
                f"反谄媚违规 [{v.get('pattern')}]: {v.get('context')} → {v.get('fix')}"
            )
    except Exception:
        return []
    return findings


def main() -> int:
    # 读 Claude Code PostToolUse stdin
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0  # 非 hook 调用 / 格式异常 → 静默通过

    tool_input = data.get("tool_input") or {}
    file_path = (
        tool_input.get("file_path")
        or tool_input.get("path")
        or tool_input.get("notebook_path")
        or ""
    )
    if not file_path:
        return 0

    suffix = Path(file_path).suffix.lower()
    findings = []

    try:
        if suffix in CODE_EXTS:
            findings += check_yagni_for_file(file_path)
        elif suffix == ".md":
            findings += check_flattery_for_file(file_path)
    except Exception:
        # 降级：任何检查异常都不阻断 Agent
        return 0

    if not findings:
        return 0

    # 反馈（默认温和 exit 0，Claude 仍能看到 stderr 提醒）
    print("⚠️ Skill 体系纪律自检发现以下问题（来自 review/build 铁律）：", file=sys.stderr)
    for line in findings:
        print(f"  - {line}", file=sys.stderr)
    print("（默认提醒模式。确认为误报可忽略；如需硬阻断，设置 HOOK_BLOCK=1）", file=sys.stderr)

    return 2 if os.environ.get("HOOK_BLOCK") == "1" else 0


def cli() -> int:
    import argparse
    parser = argparse.ArgumentParser(
        description="Edit/Write 后纪律自检 hook（Claude Code PostToolUse）。从 stdin 读取 payload。",
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
