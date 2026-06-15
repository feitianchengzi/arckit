#!/usr/bin/env python3
"""
context_collector.py — PRD 生成前置输入收集

子命令：
  collect          — 收集单次 PRD 生成所需上下文
  refresh-overview — 全量读取项目卡片，刷新项目概览文档

设计原则：
  - 通用：所有参数来自用户配置或命令行，无任何业务硬编码
  - 健壮：每一层输入失败时降级，不阻断下一层
  - 透明：返回 input_coverage 告知每层输入的覆盖情况和章节质量预测
  - 平台无关：通过 data_source 抽象层获取数据，默认 local 模式零依赖
"""

import argparse, json, re, sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

SKILL_DIR  = Path(__file__).resolve().parents[1]
OVERVIEW_DIR = SKILL_DIR / "data" / "overviews"
PRDS_DIR   = SKILL_DIR / "data" / "prds"


def get_local_tz():
    """获取系统本地时区，不硬编码任何特定时区"""
    return datetime.now().astimezone().tzinfo

CST = get_local_tz()


# ─── 数据源加载 ────────────────────────────────────────────

def _load_data_source(source_type: str = "local", **kwargs):
    """延迟导入并创建数据源实例"""
    from data_source import create_data_source
    return create_data_source(source_type, **kwargs)


# ─── Schema 动态解析 ──────────────────────────────────────

def _classify_statuses(schema: dict) -> tuple:
    """
    从项目 Schema 动态分类 status id。
    返回 (closed_ids, active_ids) — 均为字符串 id 列表。
    不硬编码任何 status 名称，完全依赖接口返回。
    若 schema 为空或无 statusList，返回两个空列表（调用方降级为全量扫描）。
    """
    status_list = (
        schema.get("statusList")
        or schema.get("status_list")
        or schema.get("statuses")
        or []
    )

    closed_kw = {
        "完成", "关闭", "结束", "取消", "拒绝", "done", "closed",
        "finish", "finished", "rejected", "cancelled", "canceled", "complete", "completed",
    }
    active_kw = {
        "进行", "开始", "测试", "待", "开发", "评审", "暂停", "阻塞",
        "open", "active", "in_progress", "inprogress", "todo", "doing",
        "review", "blocked", "pause", "paused", "pending",
    }

    closed_ids, active_ids = [], []
    for s in status_list:
        sid  = str(s.get("id") or s.get("statusId") or "")
        name = (s.get("name") or s.get("statusName") or "").lower().replace(" ", "").replace("_", "")
        if not sid:
            continue
        if any(kw in name for kw in closed_kw):
            closed_ids.append(sid)
        elif any(kw in name for kw in active_kw):
            active_ids.append(sid)

    return closed_ids, active_ids


# ─── 历史 PRD 设计约定提取 ───────────────────────────────

CONVENTION_PATTERNS = {
    "api": ["接口约定", "接口设计", "api设计", "api约定", "endpoint", "rest", "rpc"],
    "data_model": ["数据模型", "数据结构", "schema", "字段说明", "表结构", "数据库"],
    "nonfunctional": ["非功能", "性能", "安全", "权限", "并发", "超时", "sla", "技术约束"],
    "design_decision": ["设计决策", "方案选择", "方案对比", "技术选型", "决策"],
}


def extract_design_conventions(prd_path: Path) -> dict:
    """从单份 PRD 文件中提取设计约定章节"""
    try:
        content = prd_path.read_text(encoding="utf-8")
    except Exception:
        return {}

    sections = re.split(r'\n(#{1,3} .+)', content)
    result = {k: [] for k in CONVENTION_PATTERNS}

    for i in range(1, len(sections), 2):
        header = sections[i].lower().replace(" ", "").replace("_", "")
        body   = sections[i + 1].strip() if i + 1 < len(sections) else ""
        if not body or len(body) < 20:
            continue
        for cat, keywords in CONVENTION_PATTERNS.items():
            if any(kw.replace(" ", "").replace("_", "") in header for kw in keywords):
                result[cat].append(f"**来源：{prd_path.name}**\n{body[:400]}")
                break

    return {k: "\n\n".join(v[-2:]) for k, v in result.items() if v}


def collect_design_conventions(prds_dir: Path, max_files: int = 5) -> dict:
    """扫描最近 N 份 PRD，汇总所有设计约定"""
    if not prds_dir.exists():
        return {}
    prd_files = sorted(prds_dir.glob("*.md"))[-max_files:]
    merged = {k: [] for k in CONVENTION_PATTERNS}
    for f in prd_files:
        conv = extract_design_conventions(f)
        for k, v in conv.items():
            if v:
                merged[k].append(v)
    return {k: "\n\n---\n\n".join(v[-2:]) for k, v in merged.items() if v}


# ─── 输入覆盖度评估 ───────────────────────────────────────

def _evaluate_input_coverage(context: dict) -> dict:
    """
    评估四层输入的覆盖情况，输出章节质量预测和用户消息。
    不打分，不设阈值；只判断 can_generate（仅极端情况 False）。
    """
    card     = context.get("cards", {}).get("target_card") or {}
    overview = context.get("project_overview_doc") or ""
    prd_files = list(PRDS_DIR.glob("*.md")) if PRDS_DIR.exists() else []
    conventions = context.get("design_conventions") or {}

    # ── 第一层：目标卡片 ────────────────────────────────
    title   = (card.get("title") or "").strip()
    desc    = (card.get("content") or "").strip()
    PLACEHOLDER_TITLES = {"待定", "test", "新功能", "todo", "tbd", "untitled", "暂无", ""}
    card_ok = True
    block_reason = None

    if not card:
        card_ok = False
        block_reason = "卡片拉取失败，请检查卡片 ID 和数据源配置"
    elif not title and not desc:
        card_ok = False
        block_reason = "卡片标题和描述均为空，无法理解需求内容，请先补充后重试"
    elif title.lower().replace(" ", "") in PLACEHOLDER_TITLES and not desc:
        card_ok = False
        block_reason = f"卡片标题「{title}」为占位词且描述为空，无法理解需求内容"

    layer_card = {
        "ok": card_ok,
        "summary": f"#{card.get('seq_num','')} {title[:30]}" if card_ok else block_reason,
    }

    # ── 第二层：项目概览文档 ────────────────────────────
    overview_exists = bool(overview)
    positioning_confirmed = (
        overview_exists
        and "📝 产品定位待确认" not in overview
        and "⚠️" not in overview.split("## 产品定位")[1][:50] if "## 产品定位" in overview else False
    )
    layer_overview = {
        "ok": overview_exists,
        "positioning_confirmed": positioning_confirmed,
        "summary": (
            "已确认产品定位" if positioning_confirmed
            else "概览存在但产品定位未确认" if overview_exists
            else "概览文档不存在（首次生成）"
        ),
    }

    # ── 第三层：项目历史卡片 ────────────────────────────
    history_count = len(context.get("history_cards") or [])
    layer_history = {
        "ok": history_count > 0,
        "count": history_count,
        "summary": (
            f"{history_count} 张历史卡片" if history_count >= 10
            else f"{history_count} 张历史卡片（较少）" if history_count > 0
            else "无历史卡片（全量扫描失败或项目无历史）"
        ),
    }

    # ── 第四层：历史 PRD ────────────────────────────────
    prd_count = len(prd_files)
    has_conventions = any(v for v in conventions.values())
    layer_prds = {
        "ok": prd_count > 0,
        "count": prd_count,
        "summary": (
            f"{prd_count} 份历史 PRD，已提取设计约定" if prd_count > 0 and has_conventions
            else f"{prd_count} 份历史 PRD（未提取到设计约定章节）" if prd_count > 0
            else "暂无历史 PRD（首次生成属正常）"
        ),
    }

    # ── 章节质量预测 ────────────────────────────────────
    def q(condition_high, condition_medium):
        if condition_high:   return "high"
        if condition_medium: return "medium"
        return "low"

    chapter_forecast = [
        {
            "chapter": "背景与动机",
            "quality": q(positioning_confirmed and bool(desc), positioning_confirmed or bool(desc)),
            "reason": "产品定位已确认且卡片有描述" if positioning_confirmed and desc else "产品定位未确认或卡片描述为空",
        },
        {
            "chapter": "用户与场景",
            "quality": q(overview_exists and history_count >= 10, overview_exists or history_count >= 5),
            "reason": f"概览{'存在' if overview_exists else '不存在'}，历史卡片 {history_count} 张",
        },
        {
            "chapter": "功能范围",
            "quality": q(history_count >= 10 and has_conventions, history_count >= 5 or has_conventions),
            "reason": f"历史卡片 {history_count} 张，设计约定{'已提取' if has_conventions else '暂无'}",
        },
        {
            "chapter": "验收标准",
            "quality": q(bool(desc) and has_conventions, bool(desc) or has_conventions),
            "reason": f"卡片描述{'存在' if desc else '为空'}，接口/数据约定{'已提取' if has_conventions else '暂无'}",
        },
        {
            "chapter": "技术约束与依赖",
            "quality": q(has_conventions and bool(context.get("repo", {}).get("docs")), has_conventions),
            "reason": (
                "设计约定和代码仓均有参照" if has_conventions and context.get("repo", {}).get("docs")
                else "设计约定已提取" if has_conventions
                else "暂无设计约定和代码仓上下文，需人工补充"
            ),
        },
    ]

    # ── 用户消息 ────────────────────────────────────────
    ICON = {"high": "●●●●●", "medium": "●●●○○", "low": "●●○○○"}
    lines = ["📋 输入完整性评估\n"]
    lines.append(f"{'✅' if layer_card['ok'] else '❌'} 目标卡片：{layer_card['summary']}")
    lines.append(f"{'✅' if positioning_confirmed else ('⚠️' if overview_exists else '⚠️')} 项目概览：{layer_overview['summary']}")
    lines.append(f"{'✅' if layer_history['ok'] else '⚠️'} 历史卡片：{layer_history['summary']}")
    lines.append(f"{'✅' if layer_prds['ok'] else '⚠️'} 历史 PRD：{layer_prds['summary']}")
    lines.append("\n预计章节质量：")
    for cf in chapter_forecast:
        lines.append(f"  {cf['chapter']:12s}  {ICON[cf['quality']]}  {cf['quality']}")
    lines.append("\n正在生成...")
    user_message = "\n".join(lines)

    return {
        "can_generate": card_ok,
        "block_reason": block_reason,
        "layers": {
            "target_card":       layer_card,
            "project_overview":  layer_overview,
            "history_cards":     layer_history,
            "history_prds":      layer_prds,
        },
        "chapter_forecast": chapter_forecast,
        "user_message":     user_message,
    }


# ─── 复杂度感知 ───────────────────────────────────────────

DEFAULT_SIMPLE_KEYWORDS  = ["修复", "fix", "调整", "优化", "样式", "bugfix", "hotfix", "patch"]
DEFAULT_COMPLEX_KEYWORDS = ["重构", "迁移", "架构", "重写", "refactor", "migration", "系统", "platform"]
DEFAULT_SIMPLE_TYPES     = ["bug"]
DEFAULT_COMPLEX_TYPES    = ["epic", "feature"]


def detect_complexity(context: dict, cfg: dict = None) -> str:
    """根据卡片类型和标题关键词判断需求复杂度"""
    cfg = cfg or {}
    card  = context.get("cards", {}).get("target_card") or {}
    title = (card.get("title") or "").lower()
    ctype = (card.get("type") or "").lower()
    related_count = len(context.get("cards", {}).get("related_cards") or [])

    simple_kw   = cfg.get("simple_keywords",  DEFAULT_SIMPLE_KEYWORDS)
    complex_kw  = cfg.get("complex_keywords", DEFAULT_COMPLEX_KEYWORDS)
    simple_tp   = cfg.get("simple_card_types",  DEFAULT_SIMPLE_TYPES)
    complex_tp  = cfg.get("complex_card_types", DEFAULT_COMPLEX_TYPES)

    if ctype in simple_tp or any(k in title for k in simple_kw):
        return "simple"
    if ctype in complex_tp or any(k in title for k in complex_kw) or related_count >= 10:
        return "complex"
    return "standard"


# ─── 概览文档 ─────────────────────────────────────────────

def overview_path(project_id: str) -> Path:
    return OVERVIEW_DIR / f"project_overview_{project_id}.md"


def load_overview(project_id: str) -> str:
    p = overview_path(project_id)
    return p.read_text(encoding="utf-8") if p.exists() else ""


def refresh_overview(ds, project_id: str, project_name: str = "",
                     positioning: str = "") -> dict:
    """
    全量读取项目卡片，生成/更新项目概览文档。

    Args:
        ds: 数据源实例
        project_id: 项目标识
        project_name: 项目名称
        positioning: 用户确认的产品定位

    Returns:
        dict: 结果（ok/need_positioning/path等）
    """
    now = datetime.now(CST).strftime("%Y-%m-%d %H:%M")

    # 1. 动态获取 status 分类
    schema = ds.get_project_schema(project_id)
    closed_ids, active_ids = _classify_statuses(schema)
    schema_ok   = bool(schema)
    schema_warn = "" if schema_ok else "⚠️ 项目 Schema 获取失败，以下为全量卡片（未按状态分类）"

    # 2. 全量拉取卡片
    base_query = [{"type": "in", "field": "project_id", "values": [project_id]}]
    fields     = ["title", "seq_num", "type", "status", "priority", "plan_id"]

    if closed_ids:
        closed_items = ds.search_cards(
            project_id, base_query + [{"type": "in", "field": "status", "values": closed_ids}], fields)
    else:
        closed_items = []

    if active_ids:
        active_items = ds.search_cards(
            project_id, base_query + [{"type": "in", "field": "status", "values": active_ids}], fields)
    else:
        active_items = ds.search_cards(project_id, base_query, fields)

    total_cards = len(closed_items) + len(active_items)

    # 3. 历史 PRD 和设计约定
    prd_files = sorted(PRDS_DIR.glob("*.md")) if PRDS_DIR.exists() else []
    conventions = collect_design_conventions(PRDS_DIR, max_files=5)

    # 4. 产品定位处理
    POSITIONING_PLACEHOLDER = "📝 产品定位待确认"

    if positioning:
        final_positioning = positioning.strip()
    else:
        existing_positioning = ""
        out_path = overview_path(project_id)
        if out_path.exists():
            old = out_path.read_text(encoding="utf-8")
            m = re.search(r"## 产品定位\s*\n+(.*?)(?=\n---|\n##|\Z)", old, re.DOTALL)
            if m:
                candidate = m.group(1).strip()
                if candidate and POSITIONING_PLACEHOLDER not in candidate and "⚠️" not in candidate:
                    existing_positioning = candidate

        if existing_positioning:
            final_positioning = existing_positioning
        else:
            all_titles = [
                (it.get("card") or it).get("title", "")
                for it in (closed_items + active_items)
                if (it.get("card") or it).get("title")
            ]
            pname = project_name or project_id

            if total_cards >= 5:
                BATCH_SIZE = 50
                batches = [all_titles[i:i + BATCH_SIZE]
                           for i in range(0, len(all_titles), BATCH_SIZE)]
                batch_summaries = []
                for idx, batch in enumerate(batches, 1):
                    lines = "\n".join(f"- {t}" for t in batch)
                    batch_summaries.append(f"[第 {idx}/{len(batches)} 批，{len(batch)} 张]\n{lines}")
                full_card_dump = "\n\n".join(batch_summaries)
                msg = (
                    f"已全量读取项目「{pname}」共 {total_cards} 张卡片。\n\n"
                    f"=== 全量卡片标题（分 {len(batches)} 批展示，请逐批阅读后再回答）===\n\n"
                    f"{full_card_dump}\n\n=== 归纳完成 ===\n\n"
                    f"基于以上 **全部** {total_cards} 张卡片，请描述产品定位（1-3 句话）：\n"
                    f"1. 这个产品/系统是给谁用的？\n2. 它解决什么核心问题？\n3. 它的边界在哪里？\n\n"
                    f"确认后我将写入概览并继续。"
                )
            else:
                msg = (
                    f"项目「{pname}」当前卡片数量较少（{total_cards} 张），"
                    f"信息不足以自动归纳产品定位。请描述：\n"
                    f"1. 这个产品/系统是给谁用的？\n2. 它解决什么核心问题？\n3. 它的边界在哪里？"
                )
            return {
                "ok": False, "need_positioning": True,
                "closed_count": len(closed_items), "active_count": len(active_items),
                "prd_count": len(prd_files), "card_titles": all_titles, "message": msg,
            }

    # 5-9. 构建文档
    plan_groups: dict = {}
    for item in closed_items:
        c       = item.get("card") or item
        plan_id = str(c.get("plan_id") or "backlog")
        seq     = c.get("seq_num", "")
        title_c = c.get("title", "")
        status  = c.get("status", "")
        plan_groups.setdefault(plan_id, []).append(f"- #{seq} {title_c} · {status}")

    delivered_lines = []
    for plan_id, cards in sorted(plan_groups.items()):
        label = f"迭代 {plan_id}" if plan_id != "backlog" else "需求池"
        delivered_lines.append(f"\n### {label}\n")
        delivered_lines.extend(cards[:30])

    active_lines = []
    for item in active_items[:20]:
        c      = item.get("card") or item
        seq    = c.get("seq_num", "")
        title_c = c.get("title", "")
        status  = c.get("status", "")
        pri     = c.get("priority", "")
        active_lines.append(f"- #{seq} [{pri}] {title_c} · {status}")

    prd_lines = [f"- {f.name}" for f in prd_files[-30:]]

    def conv_section(cat_key: str, label: str) -> str:
        content = conventions.get(cat_key, "")
        return f"### {label}\n\n{content or '（暂无）'}\n"

    nl  = "\n"
    pname = project_name or project_id
    warn_block       = f"\n> {schema_warn}\n" if schema_warn else ""
    delivered_text   = "".join(delivered_lines) or "（暂无已关闭卡片）"
    active_text      = nl.join(active_lines)    or "（暂无进行中卡片）"
    prd_text         = nl.join(prd_lines)       or "（暂无历史 PRD）"

    conv_text = (
        conv_section("api",             "接口约定") +
        conv_section("data_model",      "数据模型") +
        conv_section("nonfunctional",   "非功能性需求") +
        conv_section("design_decision", "设计决策") +
        "\n### 人工补充\n\n> 在此追加补充内容，刷新概览时不覆盖本节。\n"
    )

    doc = (
        f"# {pname} 项目概览\n\n"
        f"> 自动生成 · 更新时间：{now}\n"
        f"> 本文档由 prd-gen 定时刷新，用于提升 PRD 生成质量和延续性。\n"
        f"{warn_block}\n---\n\n"
        f"## 产品定位\n\n{final_positioning}\n\n---\n\n"
        f"## 已交付功能清单\n\n{delivered_text}\n\n---\n\n"
        f"## 当前迭代重点\n\n{active_text}\n\n---\n\n"
        f"## 历史 PRD 文档\n\n{prd_text}\n\n---\n\n"
        f"## 核心设计约定\n\n"
        f"> 从最近 {len(prd_files)} 份 PRD 自动提取，更新时间：{now}。\n\n{conv_text}"
    )

    OVERVIEW_DIR.mkdir(parents=True, exist_ok=True)
    out_path = overview_path(project_id)

    if out_path.exists():
        old = out_path.read_text(encoding="utf-8")
        m = re.search(r"### 人工补充\s*\n(.*?)(?=\n###|\n##|\n---|\Z)", old, re.DOTALL)
        if m:
            human_extra = m.group(1).strip()
            if human_extra and "在此追加" not in human_extra:
                doc = doc.replace(
                    "### 人工补充\n\n> 在此追加补充内容，刷新概览时不覆盖本节。",
                    f"### 人工补充\n\n{human_extra}"
                )

    out_path.write_text(doc, encoding="utf-8")
    return {
        "ok": True, "path": str(out_path), "card_count": total_cards,
        "prd_count": len(prd_files),
        "conventions_extracted": {k: bool(v) for k, v in conventions.items()},
        "updated_at": now, "schema_ok": schema_ok,
    }


# ─── 主入口收集函数 ───────────────────────────────────────

def collect_all(ds, card_id: str, project_id: str, repo_key: str = "") -> dict:
    """
    收集单次 PRD 生成所需的全部上下文。

    Args:
        ds: 数据源实例
        card_id: 卡片标识
        project_id: 项目标识
        repo_key: 代码仓库标识（可选）
    """
    # 1. 目标卡片
    target_card = ds.get_card(card_id)

    # 2. 项目 Schema
    schema = ds.get_project_schema(project_id)
    closed_ids, active_ids = _classify_statuses(schema)

    # 3. 同迭代关联卡片
    related_cards = []
    plan_id = target_card.get("plan_id")
    if plan_id and ds.capabilities.get("search_cards"):
        extra_q = []
        if active_ids:
            extra_q.append({"type": "in", "field": "status", "values": active_ids})
        related_items = ds.search_cards(
            project_id=project_id,
            queries=[{"type": "in", "field": "plan_id", "values": [str(plan_id)]}] + extra_q,
            fields=["title", "seq_num", "status", "type", "priority"],
        )
        for it in related_items:
            c = it.get("card") or it
            if str(c.get("id", "")) != str(card_id):
                related_cards.append(c)

    # 4. 项目全量历史卡片
    history_cards = []
    if closed_ids and ds.capabilities.get("search_cards"):
        history_cards = ds.search_cards(
            project_id,
            [{"type": "in", "field": "project_id", "values": [project_id]},
             {"type": "in", "field": "status", "values": closed_ids}],
            ["title", "seq_num", "status", "type"])

    # 5. 项目概览文档
    overview_doc = load_overview(project_id)

    # 6. 设计约定
    design_conventions = collect_design_conventions(PRDS_DIR, max_files=5)

    # 7. 代码仓（可选）
    repo_context: dict = {"skipped": True, "docs": {}}
    if repo_key:
        readme_content = ds.get_repo_file(repo_key, "README.md")
        if readme_content:
            repo_context = {"skipped": False, "docs": {"README.md": readme_content}}

    context = {
        "cards": {"target_card": target_card, "related_cards": related_cards},
        "history_cards": history_cards,
        "project_overview_doc": overview_doc,
        "design_conventions": design_conventions,
        "repo": repo_context,
    }

    context["input_coverage"] = _evaluate_input_coverage(context)
    return context


# ─── CLI 入口 ─────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="prd-gen context collector（平台无关版）")
    parser.add_argument("--data-source", choices=["local", "github"],
                        default="local", help="数据源类型（默认 local，零依赖）")
    parser.add_argument("--data-dir", default="", help="local 数据源的数据目录")
    parser.add_argument("--repo", default="", help="github 数据源的仓库 (owner/repo)")

    subparsers = parser.add_subparsers(dest="action", required=True)

    p_collect = subparsers.add_parser("collect", help="收集单次 PRD 生成上下文")
    p_collect.add_argument("--card-id",    required=True)
    p_collect.add_argument("--project-id", required=True)
    p_collect.add_argument("--repo-key",   default="")

    p_refresh = subparsers.add_parser("refresh-overview", help="刷新项目概览文档")
    p_refresh.add_argument("--project-id",   required=True)
    p_refresh.add_argument("--project-name", default="")
    p_refresh.add_argument("--positioning",  default="")

    args = parser.parse_args()

    # 创建数据源
    ds_kwargs = {}
    if args.data_source == "local" and args.data_dir:
        ds_kwargs["data_dir"] = Path(args.data_dir)
    elif args.data_source == "github":
        ds_kwargs["repo"] = args.repo
    ds = _load_data_source(args.data_source, **ds_kwargs)

    if args.action == "collect":
        result = collect_all(ds, args.card_id, args.project_id, args.repo_key)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    elif args.action == "refresh-overview":
        result = refresh_overview(ds, args.project_id, args.project_name,
                                  positioning=getattr(args, "positioning", ""))
        print(json.dumps(result, ensure_ascii=False, indent=2))
