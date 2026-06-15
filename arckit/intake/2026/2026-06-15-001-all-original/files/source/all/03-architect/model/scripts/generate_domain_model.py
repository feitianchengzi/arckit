#!/usr/bin/env python3
"""
DDD 领域模型文档生成器

用途：根据聚合、实体、值对象、领域服务清单生成 Markdown 文档和 PlantUML 类图。

参数：
  --input        输入 JSON 文件路径（必需），包含 aggregates/services 等字段
  --output-dir   输出目录（默认当前目录），生成 domain-model.md / domain-model.puml / aggregates-summary.json
  --project-name 项目名称（默认"项目名"）

输出：
  - domain-model.md       领域模型 Markdown 文档
  - domain-model.puml     PlantUML 类图
  - aggregates-summary.json 聚合清单 JSON
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
    """生成 Markdown 格式的领域模型文档"""
    
    md = f"# 领域模型: {project_name}\n\n"
    md += f"生成时间: {datetime.now(_get_local_tz()).strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    
    # 聚合清单
    md += "## 聚合清单\n\n"
    for idx, agg in enumerate(data.get('aggregates', []), 1):
        md += f"### {idx}. {agg['name']} ({agg.get('description', '聚合')})\n\n"
        md += f"**聚合根**: {agg['name']}\n\n"
        
        # 实体
        if agg.get('entities'):
            md += "**实体**:\n"
            for entity in agg['entities']:
                ename = entity['name'] if isinstance(entity, dict) else entity
                edesc = entity.get('description', '') if isinstance(entity, dict) else ''
                md += f"- {ename}" + (f": {edesc}" if edesc else "") + "\n"
            md += "\n"
        
        # 值对象
        if agg.get('value_objects'):
            md += "**值对象**:\n"
            for vo in agg['value_objects']:
                vname = vo['name'] if isinstance(vo, dict) else vo
                vdesc = vo.get('description', '') if isinstance(vo, dict) else ''
                md += f"- {vname}" + (f": {vdesc}" if vdesc else "") + "\n"
            md += "\n"
        
        # 职责
        if agg.get('responsibilities'):
            md += "**职责**:\n"
            for resp in agg['responsibilities']:
                md += f"- {resp}\n"
            md += "\n"
        
        # 生命周期事件
        if agg.get('events'):
            md += "**生命周期事件**:\n"
            for event in agg['events']:
                md += f"- {event}\n"
            md += "\n"
        
        # 不变量
        if agg.get('invariants'):
            md += "**不变量**:\n"
            for inv in agg['invariants']:
                md += f"- {inv}\n"
            md += "\n"
        
        md += "---\n\n"
    
    # 领域服务
    if data.get('services'):
        md += "## 领域服务\n\n"
        for service in data['services']:
            md += f"### {service['name']}\n\n"
            md += f"**职责**: {service.get('description', '')}\n\n"
            
            if service.get('coordinates'):
                md += f"**协调的聚合**: {', '.join(service['coordinates'])}\n\n"
            
            if service.get('inputs'):
                md += f"**输入**: {', '.join(service['inputs'])}\n"
            if service.get('outputs'):
                md += f"**输出**: {', '.join(service['outputs'])}\n"
            
            md += "\n---\n\n"
    
    # 类图引用
    md += "## 类图\n\n"
    md += "见 `domain-model.puml` 文件。\n\n"
    md += "在线预览: 将 .puml 文件内容复制到 https://www.plantuml.com/plantuml/uml/\n"
    
    return md


def generate_plantuml(data):
    """生成 PlantUML 类图"""
    
    puml = "@startuml\n"
    puml += "skinparam class {\n"
    puml += "  BackgroundColor<<Aggregate Root>> LightYellow\n"
    puml += "  BackgroundColor<<Entity>> LightBlue\n"
    puml += "  BackgroundColor<<Value Object>> LightGreen\n"
    puml += "  BackgroundColor<<Domain Service>> LightPink\n"
    puml += "}\n\n"
    
    # 聚合
    for agg in data.get('aggregates', []):
        puml += f'package "{agg["name"]} Aggregate" {{\n'
        
        # 聚合根
        puml += f'  class {agg["name"]} <<Aggregate Root>> {{\n'
        if agg.get('attributes'):
            for attr in agg['attributes']:
                puml += f'    - {attr}\n'
        if agg.get('methods'):
            for method in agg['methods']:
                puml += f'    + {method}()\n'
        puml += '  }\n\n'
        
        # 实体
        for entity in agg.get('entities', []):
            ename = entity['name'] if isinstance(entity, dict) else entity
            eattrs = entity.get('attributes', []) if isinstance(entity, dict) else []
            puml += f'  class {ename} <<Entity>> {{\n'
            for attr in eattrs:
                puml += f'    - {attr}\n'
            puml += '  }\n\n'
        
        # 值对象
        for vo in agg.get('value_objects', []):
            vname = vo['name'] if isinstance(vo, dict) else vo
            vattrs = vo.get('attributes', []) if isinstance(vo, dict) else []
            puml += f'  class {vname} <<Value Object>> {{\n'
            for attr in vattrs:
                puml += f'    - {attr}\n'
            puml += '  }\n\n'
        
        # 关系
        for entity in agg.get('entities', []):
            ename = entity['name'] if isinstance(entity, dict) else entity
            puml += f'  {agg["name"]} "1" *-- "*" {ename}\n'
        
        for vo in agg.get('value_objects', []):
            vname = vo['name'] if isinstance(vo, dict) else vo
            puml += f'  {agg["name"]} o-- "1" {vname}\n'
        
        puml += '}\n\n'
    
    # 领域服务
    for service in data.get('services', []):
        puml += f'class {service["name"]} <<Domain Service>> {{\n'
        if service.get('methods'):
            for method in service['methods']:
                puml += f'  + {method}()\n'
        puml += '}\n\n'
    
    puml += "@enduml\n"
    
    return puml


def main():
    parser = argparse.ArgumentParser(description='生成 DDD 领域模型文档')
    parser.add_argument('--input', required=True, help='输入 JSON 文件路径')
    parser.add_argument('--output-dir', default='.', help='输出目录')
    parser.add_argument('--project-name', default='项目名', help='项目名称')
    
    args = parser.parse_args()
    
    # 读取输入
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"错误：文件不存在: {args.input}", file=sys.stderr)
        sys.exit(1)

    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"错误：JSON解析失败: {e}", file=sys.stderr)
        sys.exit(1)
    
    # 生成输出
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 生成 Markdown
    md_content = generate_markdown(data, args.project_name)
    md_path = output_dir / 'domain-model.md'
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(md_content)
    print(f"✅ 生成 Markdown 文档: {md_path}")
    
    # 生成 PlantUML
    puml_content = generate_plantuml(data)
    puml_path = output_dir / 'domain-model.puml'
    with open(puml_path, 'w', encoding='utf-8') as f:
        f.write(puml_content)
    print(f"✅ 生成 PlantUML 类图: {puml_path}")
    
    # 保存 JSON
    json_path = output_dir / 'aggregates-summary.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ 保存聚合清单: {json_path}")
    
    return 0


if __name__ == '__main__':
    exit(main())
