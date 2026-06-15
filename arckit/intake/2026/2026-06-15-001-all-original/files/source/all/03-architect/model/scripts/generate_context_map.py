#!/usr/bin/env python3
"""
DDD 战略设计上下文映射图生成器

用途：根据输入的 JSON 子域/限界上下文/关系数据，生成战略设计 Markdown 文档和 PlantUML 上下文映射图。

参数：
  --input        输入 JSON 文件路径（必需），包含 subdomains/contexts/relations 字段
  --output-dir   输出目录（默认当前目录），生成 context-map.md / context-map.puml / strategy-summary.json
  --project-name 项目名称（默认"项目名"）

输出：
  - context-map.md       战略设计 Markdown 文档
  - context-map.puml     PlantUML 上下文映射图
  - strategy-summary.json 战略设计清单 JSON
"""

import json
import sys
import argparse
from pathlib import Path
from datetime import datetime


def _get_local_tz():
    """获取系统本地时区，不硬编码任何特定时区"""
    return datetime.now().astimezone().tzinfo


def generate_markdown(data, project_name="项目名"):
    """生成战略设计 Markdown 文档"""
    md = f"# 战略设计: {project_name}\n\n"
    md += f"生成时间: {datetime.now(_get_local_tz()).strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    
    # 子域划分
    for domain_type in ['核心域', '支撑域', '通用域']:
        subdomains = [s for s in data.get('subdomains', []) if s.get('type') == domain_type]
        if subdomains:
            md += f"## {domain_type}\n\n"
            for sub in subdomains:
                md += f"### {sub['name']}\n\n"
                md += f"**职责**: {sub.get('description', '')}\n\n"
                md += f"**重要性**: {'⭐' * sub.get('priority', 3)}\n\n"
                md += f"**投入策略**: {sub.get('strategy', '待定')}\n\n"
                md += "---\n\n"
    
    # 限界上下文
    md += "## 限界上下文划分\n\n"
    for ctx in data.get('contexts', []):
        md += f"### {ctx['name']}\n\n"
        md += f"**所属子域**: {ctx.get('subdomain', '')}\n\n"
        md += f"**职责**: {ctx.get('description', '')}\n\n"
        md += f"**团队**: {ctx.get('team', '待定')}\n\n"
        md += "---\n\n"
    
    # 上下文映射
    md += "## 上下文映射\n\n"
    for rel in data.get('relations', []):
        md += f"### {rel['from']} → {rel['to']}\n\n"
        md += f"**关系**: {rel['type']}\n\n"
        md += f"**说明**: {rel.get('description', '')}\n\n"
        md += f"**集成方式**: {rel.get('integration', '待定')}\n\n"
        md += "---\n\n"
    
    return md


def generate_plantuml(data):
    """生成 PlantUML 上下文映射图"""
    puml = "@startuml\n"
    puml += "skinparam component {\n"
    puml += "  BackgroundColor<<Core>> LightYellow\n"
    puml += "  BackgroundColor<<Supporting>> LightBlue\n"
    puml += "  BackgroundColor<<Generic>> LightGray\n"
    puml += "}\n\n"
    
    # 上下文
    for ctx in data.get('contexts', []):
        subdomain = next((s for s in data.get('subdomains', []) if s['name'] == ctx.get('subdomain')), {})
        domain_type = subdomain.get('type', 'Supporting')
        stereotype = {'核心域': 'Core', '支撑域': 'Supporting', '通用域': 'Generic'}.get(domain_type, 'Supporting')
        puml += f'[{ctx["name"]}] <<{stereotype}>>\n'
    
    puml += "\n"
    
    # 关系
    for rel in data.get('relations', []):
        color = {'OHS': 'blue', 'ACL': 'green', 'Conformist': 'red'}.get(rel['type'], 'black')
        puml += f'[{rel["from"]}] .[#{color}]> [{rel["to"]}] : {rel["type"]}\n'
    
    puml += "\n@enduml\n"
    return puml


def main():
    parser = argparse.ArgumentParser(description='生成 DDD 战略设计文档')
    parser.add_argument('--input', required=True, help='输入 JSON 文件路径')
    parser.add_argument('--output-dir', default='.', help='输出目录')
    parser.add_argument('--project-name', default='项目名', help='项目名称')
    
    args = parser.parse_args()

    try:
        with open(args.input, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"错误：文件不存在: {args.input}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"错误：JSON解析失败: {e}", file=sys.stderr)
        sys.exit(1)
    
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 生成 Markdown
    md_content = generate_markdown(data, args.project_name)
    md_path = output_dir / 'context-map.md'
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(md_content)
    print(f"✅ 生成战略设计文档: {md_path}")
    
    # 生成 PlantUML
    puml_content = generate_plantuml(data)
    puml_path = output_dir / 'context-map.puml'
    with open(puml_path, 'w', encoding='utf-8') as f:
        f.write(puml_content)
    print(f"✅ 生成上下文映射图: {puml_path}")
    
    # 保存 JSON
    json_path = output_dir / 'strategy-summary.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ 保存战略设计清单: {json_path}")
    
    return 0


if __name__ == '__main__':
    exit(main())
