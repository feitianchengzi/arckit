#!/usr/bin/env python3
"""
generate_arch_doc.py — 架构设计文档组装

从 ADR 目录和服务定义组装完整的架构设计文档。
对应 SKILL.md Step4 产出。

用法:
  python3 generate_arch_doc.py --adr-dir ./adr/ --services-json services.json --project-name "MyApp"
"""

import argparse
import json
from datetime import datetime
from pathlib import Path


def get_local_tz():
    return datetime.now().astimezone().tzinfo


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="架构设计文档组装")
    parser.add_argument("--adr-dir", required=True, help="ADR 文件目录")
    parser.add_argument("--services-json", default="", help="服务定义 JSON 文件")
    parser.add_argument("--project-name", default="项目", help="项目名称")
    parser.add_argument("--output", default="", help="输出文件路径")
    args = parser.parse_args()

    now = datetime.now(get_local_tz()).strftime("%Y-%m-%d %H:%M")
    adr_dir = Path(args.adr_dir)

    # 收集 ADR
    adr_list = []
    for f in sorted(adr_dir.glob("ADR-*.md")):
        try:
            content = f.read_text(encoding="utf-8")
        except Exception:
            continue
        status = "提议"
        for line in content.split("\n"):
            if line.strip() in ["提议", "已接受", "已废弃", "已替代"]:
                status = line.strip()
                break
        adr_list.append({"file": f.name, "status": status})

    # 读取服务定义
    services = []
    if args.services_json:
        try:
            services = json.loads(Path(args.services_json).read_text(encoding="utf-8"))
        except Exception:
            pass

    # 组装文档
    lines = [
        f"# {args.project_name} 架构设计文档",
        f"",
        f"> 生成时间: {now}",
        f"> ADR 数量: {len(adr_list)}",
        f"> 服务数量: {len(services)}",
        f"",
        f"---",
        f"",
        f"## 1. 架构总览",
        f"",
        f"⚠️ [待补充：系统全景图 + 核心模块说明]",
        f"",
        f"---",
        f"",
        f"## 2. ADR 清单",
        f"",
    ]

    if adr_list:
        lines.append("| ADR | 状态 |")
        lines.append("|-----|------|")
        for adr in adr_list:
            lines.append(f"| {adr['file']} | {adr['status']} |")
    else:
        lines.append("*暂无 ADR*")

    lines.extend(["", "---", "", "## 3. 系统依赖关系", ""])

    if services:
        lines.append("```")
        for svc in services:
            name = svc.get("name", "?")
            deps = svc.get("dependencies", [])
            if deps:
                lines.append(f"{name} → {', '.join(deps)}")
            else:
                lines.append(f"{name} (无外部依赖)")
        lines.append("```")
    else:
        lines.append("⚠️ [待补充：模块间调用关系图]")

    lines.extend([
        "", "---", "", "## 4. 数据流", "",
        "⚠️ [待补充：核心业务的数据流向]", "",
        "---", "", "## 5. 非功能性约束", "",
        "- 性能指标: ⚠️ [待补充]",
        "- 可用性: ⚠️ [待补充]",
        "- 安全要求: ⚠️ [待补充]", "",
        "---", "", "## 6. 技术债预算", "",
        "⚠️ [待补充：允许的技术债范围和偿还计划]",
    ])

    doc = "\n".join(lines)

    if args.output:
        Path(args.output).write_text(doc, encoding="utf-8")
        print(f"✅ 架构文档已生成: {args.output}")
    else:
        print(doc)
