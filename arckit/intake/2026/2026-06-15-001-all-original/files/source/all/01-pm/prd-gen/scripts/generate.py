#!/usr/bin/env python3
"""
generate.py — PRD 文档生成主脚本（平台无关版）

流程：
1. 收集前置输入（context_collector，通过数据源抽象层）
2. 质量评估 — 不足则输出缺口报告，由 Agent 决定是否继续
3. 用上下文填充 PRD 模板（基于 context 的智能映射）
4. 保存文件
5. 写回目标（通过数据源 write_back 接口）

用法:
  python3 generate.py \
    --card-id {card_id} \
    --project-id {project_id} \
    [--data-source local|github] \
    [--repo-key {repo_key}] \
    [--template agent|feature|hybrid|auto] \
    [--output-dir /path/to/prds/] \
    [--output-target local|card_content|wiki] \
    [--force]
"""
import argparse, json, sys
from datetime import datetime
from pathlib import Path
import re

SKILL_DIR = Path(__file__).resolve().parents[1]
PRDS_DIR  = SKILL_DIR / "data" / "prds"

TEMPLATE_MAP = {
    "agent":    "prd_template_agent.md",
    "feature":  "prd_template_feature.md",
    "hybrid":   "prd_template_hybrid.md",
    "simple":   "prd_template_simple.md",
    "deep":     "prd_template_deep.md",
}
TEMPLATE_LABELS = {
    "agent":   "Agent PRD",
    "feature": "Feature PRD",
    "hybrid":  "Hybrid PRD",
    "simple":  "简洁 PRD（修复/调整类）",
    "deep":    "深度 PRD（Epic/重构类）",
}
PRIORITY_LABELS = {
    "option_1": "P1", "option_2": "P2", "option_3": "P3", "option_4": "P4",
}

# 深度内容类占位符
DEEP_CONTENT_PLACEHOLDERS = [
    "[capability_1] (MCP/REST API)",
    "[capability_2] (MCP/REST API)",
    "[capability_3] (MCP/REST API)",
    "[capability_1] (MCP/REST API)\n",
    "[步骤1]", "[步骤2]", "[步骤3]",
    "[规则1，如\"名称不能超过50个字符\"]", "[规则2]", "[规则3]",
    "[指标1]", "[条件1] → [降级行为1]",
    "[变更描述]", "[原因]", "[姓名]",
    "[在此粘贴完整的Prompt文本]",
    "[在此使用diff格式展示相对上一版本的变更]",
    "[skill_name_1]",
    "[适用场景]", "[事件名称]",
    "[工具名称1]", "[工具名称2]",
    "[场景名称]", "[场景1：", "[场景2：",
    "[用户输入]", "[工具名]()",
    "[异常1]", "[处理方式1]",
    "[参数说明]", "[格式/长度限制]",
    "[说明]", "[枚举值或范围]",
    "[智能行为1]", "[智能行为2]",
    "[边界条件1]", "[错误场景1]",
    "[空状态]", "[展示空状态页]",
    "[场景1]", "[场景2]", "[处理]",
    "[主要用户]", "[次要用户]", "[特征]", "[诉求]",
    "[功能名]", "[功能描述]", "[功能名称]",
    "[条件1，如\"用户已登录\"]", "[条件2]",
    "[数字]", "[百分比]", "[计算值]",
    "[用户角色]", "[操作]", "[价值]", "[验收条件]",
]


def get_local_tz():
    return datetime.now().astimezone().tzinfo

CST = get_local_tz()


# ─── 工具函数 ─────────────────────────────────────────────

def slugify(title: str, max_len: int = 30) -> str:
    slug = re.sub(r"[^\w一-鿿]", "_", title)
    slug = re.sub(r"_+", "_", slug).strip("_")
    return slug[:max_len]


def load_template(template_type: str) -> str:
    path = SKILL_DIR / "references" / TEMPLATE_MAP[template_type]
    return path.read_text(encoding="utf-8")


# ─── 模板类型检测 ─────────────────────────────────────────

def auto_detect_template(context: dict) -> str:
    card = context.get("cards", {}).get("target_card", {})
    text = (
        (card.get("title") or "") + " " +
        (card.get("content") or "") + " " +
        (card.get("type") or "")
    ).lower()
    agent_kw = ["llm", "mcp", "prompt", "agent", "skill", "置信度", "工具调用", "tool", "ai", "模型"]
    ui_kw    = ["ui", "界面", "前端", "组件", "页面", "接口", "api", "数据模型", "交互"]
    has_agent = any(k in text for k in agent_kw)
    has_ui    = any(k in text for k in ui_kw)
    if has_agent and has_ui:
        return "hybrid"
    if has_agent:
        return "agent"
    return "feature"


# ─── 智能填充 ─────────────────────────────────────────────

def build_prd_vars(context: dict, template_type: str, project_name: str = "") -> dict:
    card    = context.get("cards", {}).get("target_card", {})
    related = context.get("cards", {}).get("related_cards", [])
    repo    = context.get("repo", {})
    now     = datetime.now(CST).strftime("%Y-%m-%d")

    title = card.get("title", "")
    prefix_pattern = rf"^【[^】]*】\s*"
    short_title = re.sub(prefix_pattern, "", title).strip() or title

    priority = PRIORITY_LABELS.get(card.get("priority", ""), card.get("priority", ""))
    content  = card.get("content", "") or ""
    owner    = ", ".join(card.get("owner_users", [])) or "待指派"
    seq_num  = str(card.get("seq_num", ""))

    short_name = re.sub(r"[：:].+$", "", short_title).strip()[:20] or short_title[:20]

    background = _extract_section(content, ["背景", "background", "问题", "现状"]) or \
                 _first_paragraph(content)
    goal       = _extract_section(content, ["目标", "goal", "目的"])
    scope      = _extract_section(content, ["功能范围", "scope", "范围"])  or goal
    ac_raw     = _extract_section(content, ["验收标准", "acceptance", "ac", "验收", "标准"])

    value_prop = _first_line(goal or scope or background) or "⚠️ [待补充]"

    related_summary = ""
    if related:
        lines = [f"- #{c.get('seq_num','')} {c.get('title','')} [{c.get('status','')}]" for c in related[:10]]
        related_summary = "\n".join(lines)

    repo_summary = ""
    if not repo.get("skipped") and repo.get("docs"):
        for path, content_doc in repo["docs"].items():
            if "readme" in path.lower():
                repo_summary = content_doc[:800]
                break

    U = "⚠️ **[待补充]**"

    return {
        "title":           title,
        "short_title":     short_title,
        "short_name":      short_name,
        "date":            now,
        "seq_num":         seq_num,
        "priority":        priority or U,
        "owner":           owner,
        "value_prop":      value_prop,
        "iter_goal":       _first_line(goal) or U,
        "background":      background or U,
        "goal":            goal or U,
        "scope":           scope or U,
        "ac":              ac_raw or U,
        "full_content":    content,
        "related_summary": related_summary or "（暂无同迭代关联卡片）",
        "repo_summary":    repo_summary or "（暂无代码仓库文档）",
        "template_type":   TEMPLATE_LABELS.get(template_type, template_type),
        "UNKNOWN":         U,
    }


def _first_paragraph(text: str) -> str:
    lines = []
    for line in (text or "").split("\n"):
        if line.strip().startswith("#"):
            continue
        if not line.strip() and lines:
            break
        if line.strip():
            lines.append(line.strip())
    return " ".join(lines)


def _first_line(text: str) -> str:
    for line in (text or "").split("\n"):
        stripped = line.strip()
        if stripped and not stripped.startswith("#") and not stripped.startswith("|"):
            return re.sub(r"^[-*]\s+", "", stripped)
    return ""


def _extract_section(content: str, keywords: list) -> str:
    lines = content.split("\n")
    result_lines = []
    in_section = False
    for line in lines:
        line_lower = line.lower().strip()
        is_header = line.startswith("#")
        if is_header:
            matched = any(k in line_lower for k in keywords)
            if matched:
                in_section = True
                result_lines = []
                continue
            elif in_section:
                break
        elif in_section:
            result_lines.append(line)
    return "\n".join(result_lines).strip()


def fill_template(template: str, vars: dict, template_type: str) -> str:
    U = vars["UNKNOWN"]
    result = template

    meta_map = {
        "[模块名]":                     vars["short_name"],
        "[版本]":                        "v1.0",
        "YYYY-MM-DD":                    vars["date"],
        "[负责人姓名]":                  vars["owner"],
        "[草稿/评审中/已批准]":          "草稿",
        "[一句话价值主张]":              vars["value_prop"],
        "[本次迭代具体目标]":            vars["iter_goal"],
        "[用户故事ID，如US-3.1, US-3.6]": f"#{vars['seq_num']}",
        "[用户故事ID，如US-1.1, US-2.3]": f"#{vars['seq_num']}",
        "[用户故事ID]":                  f"#{vars['seq_num']}",
        "[Agent唯一标识，如AssistantAgent]": vars["short_name"],
        "[Agent 唯一标识]":               vars["short_name"],
        "[Agent的唯一标识]":              vars["short_name"],
        "[一句话角色定位，如\"情感分析 + 需求提取 + 回复生成\"]": vars["value_prop"],
        "[一句话角色定位]":               vars["value_prop"],
        "[性格特征，如\"友好、专业、简洁\"]": "专业、简洁、高效",
        "[如：友好、专业、简洁]":         "专业、简洁、高效",
        "[如：结构化JSON输出]":           "结构化 Markdown 输出",
        "[如：结构化 JSON 输出]":         "结构化 Markdown 输出",
        "[如：回复建议控制在200字以内]":  "视场景动态调整",
        "[如：VIP客户使用敬语]":          U,
        "[核心能力列表]":                 vars["scope"],
        "[功能模块名称]":                 vars["short_name"],
        "[用 2-3 句话描述该功能在产品中的位置和作用，说明它解决什么问题、服务于哪个产品方向。]":
            vars["background"],
        "[对用户的价值，如\"减少操作步骤 50%\"]": U,
        "[对业务的价值，如\"提升转化率 15%\"]":   U,
        "[对技术的价值，如\"统一数据模型，降低维护成本\"]": U,
    }
    for k, v in meta_map.items():
        result = result.replace(k, v or U)

    for ph in DEEP_CONTENT_PLACEHOLDERS:
        result = result.replace(ph, U)

    result = re.sub(r"\[(?!待补充)[^\]\n]{2,50}\]", U, result)

    header = _build_header(vars)
    result = result.replace("---\n\n## 文档信息", f"---\n{header}\n## 文档信息", 1)

    result = _inject_section(result, "## 背景", vars["background"])
    result = _inject_section(result, "## 目标", vars["goal"])
    result = _inject_section(result, "## 验收标准", vars["ac"])

    if vars.get("ac") and vars["ac"] != vars["UNKNOWN"]:
        result = _inject_ac_into_table(result, vars["ac"])

    return result


def _build_header(vars: dict) -> str:
    lines = [
        f"> **自动生成** · 卡片 #{vars['seq_num']} · {vars['date']} · 模板：{vars['template_type']}",
        ">",
        "> **卡片原始描述摘要**：",
        ">",
    ]
    content_lines = vars.get("full_content", "").split("\n")[:20]
    for l in content_lines:
        lines.append(f"> {l}")
    lines.append("")
    if vars.get("project_overview"):
        lines.append("> ✅ **基于项目概览文档生成**（延续性 PRD）")
        lines.append("")
    lines.append("---")
    lines.append("")
    return "\n".join(lines)


def _inject_section(template: str, header: str, content: str) -> str:
    if not content or not header:
        return template
    lines = template.split("\n")
    result = []
    i = 0
    while i < len(lines):
        result.append(lines[i])
        if lines[i].strip() == header.strip():
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                result.append(lines[j])
                j += 1
            if j >= len(lines) or lines[j].strip().startswith("⚠️") or not lines[j].strip():
                result.append(content)
                result.append("")
                if j < len(lines) and lines[j].strip().startswith("⚠️"):
                    j += 1
                i = j
                continue
        i += 1
    return "\n".join(result)


def _inject_ac_into_table(template: str, ac_text: str) -> str:
    if not ac_text:
        return template
    items = []
    for line in ac_text.split("\n"):
        line = line.strip()
        line = re.sub(r"^[-*]\s*\[[ x]\]\s*", "", line)
        line = re.sub(r"^[-*]\s+", "", line)
        line = re.sub(r"^AC[-:]?\d*[：:]\s*", "", line, flags=re.IGNORECASE)
        if line and len(line) > 5:
            items.append(line)
    if not items:
        return template

    ac_table_rows = []
    for idx, item in enumerate(items[:8], 1):
        priority = "P0" if idx <= 2 else "P1"
        ac_table_rows.append(f"| AC-{idx:02d} | {item} | {priority} |")

    def replace_ac_table(m):
        header_line = "| 场景ID | 场景描述 | 优先级 |"
        separator   = "|--------|---------|--------|"
        return header_line + "\n" + separator + "\n" + "\n".join(ac_table_rows)

    template = re.sub(
        r"\| 场景ID \| 场景描述 \| 优先级 \|.*?(?=\n---|\n##|\Z)",
        replace_ac_table, template, flags=re.DOTALL
    )
    return template


# ─── 主流程 ──────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="PRD 文档生成（平台无关版）")
    parser.add_argument("--card-id",       required=True)
    parser.add_argument("--project-id",    required=True)
    parser.add_argument("--data-source",   choices=["local", "github"],
                        default="local", help="数据源类型（默认 local）")
    parser.add_argument("--data-dir",      default="", help="local 数据源数据目录")
    parser.add_argument("--gh-repo",       default="", help="github 仓库 (owner/repo)")
    parser.add_argument("--repo-key",      default="", help="代码仓库标识（可选）")
    parser.add_argument("--template",      choices=["agent", "feature", "hybrid", "auto"],
                        default="auto")
    parser.add_argument("--output-dir",    default=None)
    parser.add_argument("--output-target", default=None,
                        help="PRD 写入目标：local|card_content|wiki",
                        choices=["local", "card_content", "wiki"])
    parser.add_argument("--force",         action="store_true")
    args = parser.parse_args()

    # 创建数据源
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from data_source import create_data_source
    ds_kwargs = {}
    if args.data_source == "local" and args.data_dir:
        ds_kwargs["data_dir"] = Path(args.data_dir)
    elif args.data_source == "github":
        ds_kwargs["repo"] = args.gh_repo
    ds = create_data_source(args.data_source, **ds_kwargs)

    # 用户配置（通过数据源加载）
    user_cfg = ds.load_user_config("default")

    output_dir = Path(args.output_dir) if args.output_dir else PRDS_DIR
    output_target = args.output_target or user_cfg.get("prd_output_target", "local")

    # 1. 收集上下文
    from context_collector import (
        collect_all, refresh_overview, load_overview, detect_complexity,
    )
    context = collect_all(ds, args.card_id, args.project_id,
                          args.repo_key or user_cfg.get("repo_key", ""))
    coverage = context["input_coverage"]

    # 1b. 概览不存在时自动触发
    overview_doc = context.get("project_overview_doc", "")
    if not overview_doc:
        try:
            overview_result = refresh_overview(ds, args.project_id,
                                               user_cfg.get("project_name", ""))
            if overview_result.get("ok"):
                overview_doc = load_overview(args.project_id)
            elif overview_result.get("need_positioning"):
                context["_positioning_needed"] = overview_result.get("message", "")
        except Exception:
            pass

    # 2. 覆盖度评估门控
    if not coverage["can_generate"] and not args.force:
        print(json.dumps({
            "ok": False, "need_clarification": True,
            "block_reason": coverage.get("block_reason"),
            "message": coverage.get("block_reason", "卡片信息不足，无法生成 PRD"),
        }, ensure_ascii=False))
        sys.exit(0)

    print(coverage.get("user_message", ""), file=sys.stderr)

    # 3. 选模板
    template_type = args.template
    if template_type == "auto":
        complexity = detect_complexity(context, cfg=user_cfg)
        if complexity == "simple":
            template_type = "simple"
        elif complexity == "complex":
            template_type = "deep"
        else:
            template_type = auto_detect_template(context)

    # 4. 填充
    template_content = load_template(template_type)
    project_name = user_cfg.get("project_name", "")
    prd_vars = build_prd_vars(context, template_type, project_name=project_name)
    prd_vars["project_overview"] = overview_doc[:2000] if overview_doc else ""

    conventions = context.get("design_conventions") or {}
    prd_vars["design_conventions_api"]             = conventions.get("api", "")
    prd_vars["design_conventions_data_model"]      = conventions.get("data_model", "")
    prd_vars["design_conventions_nonfunctional"]   = conventions.get("nonfunctional", "")
    prd_vars["design_conventions_design_decision"] = conventions.get("design_decision", "")

    prd_content = fill_template(template_content, prd_vars, template_type)

    # 5. 保存
    output_dir.mkdir(parents=True, exist_ok=True)
    card    = context["cards"]["target_card"]
    now_str = datetime.now(CST).strftime("%Y-%m-%d")
    seq     = str(card.get("seq_num", ""))
    slug    = slugify(card.get("title", "untitled"))
    filename    = f"{now_str}_{seq}_{slug}.md"
    output_path = output_dir / filename
    output_path.write_text(prd_content, encoding="utf-8")

    # 6. 写回目标（通过数据源）
    writeback_result = None
    writeback_error  = None
    try:
        prd_block = (
            f"\n\n<!-- PRD_GEN_START -->\n"
            f"## 📄 产品需求文档（自动生成）\n\n"
            f"- **文件**: {output_path.name}\n"
            f"- **生成时间**: {datetime.now(CST).strftime('%Y-%m-%d %H:%M')}\n"
            f"- **模板**: {TEMPLATE_LABELS.get(template_type, template_type)}\n\n"
            f"{prd_content}\n"
            f"<!-- PRD_GEN_END -->"
        )
        writeback_result = ds.write_back(
            card_id=args.card_id, content=prd_block,
            output_target=output_target, prd_path=output_path,
            doc_title=output_path.stem,
            wiki_space_id=user_cfg.get("wiki_space_id", ""),
        )
    except Exception as e:
        writeback_error = str(e)

    # 7. 输出结果
    result = {
        "ok": True, "path": str(output_path), "filename": filename,
        "template": template_type,
        "template_label": TEMPLATE_LABELS.get(template_type, template_type),
        "seq_num": seq,
        "chapter_forecast": coverage.get("chapter_forecast", []),
        "input_coverage":   coverage.get("layers", {}),
        "output_target":    output_target,
        "data_source":      ds.name,
    }
    if context.get("_positioning_needed"):
        result["positioning_needed"] = context["_positioning_needed"]
    if writeback_result and writeback_result.get("ok"):
        if output_target == "card_content":
            result["writeback"] = "success"
        else:
            result["writeback"] = writeback_result
    elif writeback_error:
        result["writeback_error"] = writeback_error
    elif writeback_result and not writeback_result.get("ok"):
        result["writeback_error"] = writeback_result.get("error", "写回失败")

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
