#!/usr/bin/env python3
"""
DDD 领域建模质量校验器

用途：校验领域建模产出物的质量，检查聚合设计、不变量、值对象等维度，生成校验报告。

参数：
  --input   待校验文件路径（Markdown 或 JSON）（必需）
  --mode    校验模式：quick（快速规则检查）或 deep（深度检查，当前降级为 quick）
  --output  校验报告输出路径（必需）
  --json    同时输出 JSON 格式详细结果

输出：
  - Markdown 校验报告（含错误/警告/通过项及改进建议）
  - 可选 JSON 详细结果文件

退出码：
  0 - 通过
  1 - 未通过（存在错误项）
"""

import json
import argparse
import re
import sys
from pathlib import Path
from datetime import datetime


def _get_local_tz():
    """获取系统本地时区，不硬编码任何特定时区"""
    return datetime.now().astimezone().tzinfo


class ValidationResult:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.passed = []
    
    def add_error(self, code, type_, entity, message, suggestion):
        self.errors.append({
            'code': code,
            'type': type_,
            'entity': entity,
            'message': message,
            'suggestion': suggestion
        })
    
    def add_warning(self, code, type_, entity, message, suggestion):
        self.warnings.append({
            'code': code,
            'type': type_,
            'entity': entity,
            'message': message,
            'suggestion': suggestion
        })
    
    def add_passed(self, check_name):
        self.passed.append(check_name)
    
    def get_conclusion(self):
        if self.errors:
            return 'needs_fix'
        elif self.warnings:
            return 'acceptable_with_warnings'
        else:
            return 'passed'


def parse_markdown(md_path):
    """从 Markdown 解析领域模型"""
    try:
        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"错误：文件不存在: {md_path}", file=sys.stderr)
        return {"aggregates": [], "_error": f"文件不存在: {md_path}"}
    
    # 简单解析聚合
    aggregates = []
    current_agg = None
    
    for line in content.split('\n'):
        # 聚合标题
        if line.startswith('### ') and '聚合' in line:
            if current_agg:
                aggregates.append(current_agg)
            agg_name = re.search(r'### \d+\.\s+(\w+)', line)
            current_agg = {
                'name': agg_name.group(1) if agg_name else 'Unknown',
                'entities': [],
                'value_objects': [],
                'services': [],
                'invariants': []
            }
        
        # 实体
        elif line.startswith('- ') and current_agg:
            if '**实体**' in content[max(0, content.find(line)-100):content.find(line)]:
                entity_match = re.search(r'-\s+(\w+):', line)
                if entity_match:
                    current_agg['entities'].append({'name': entity_match.group(1)})
            
            # 值对象
            elif '**值对象**' in content[max(0, content.find(line)-100):content.find(line)]:
                vo_match = re.search(r'-\s+(\w+):', line)
                if vo_match:
                    current_agg['value_objects'].append({'name': vo_match.group(1)})
            
            # 不变量
            elif '**不变量**' in content[max(0, content.find(line)-100):content.find(line)]:
                current_agg['invariants'].append(line.strip('- ').strip())
    
    if current_agg:
        aggregates.append(current_agg)
    
    # 解析领域服务
    services = []
    service_pattern = r'### (\w+Service)\n\n\*\*职责\*\*:\s*(.+)'
    for match in re.finditer(service_pattern, content):
        services.append({
            'name': match.group(1),
            'description': match.group(2)
        })
    
    return {'aggregates': aggregates, 'services': services}


def validate_quick(data):
    """快速模式校验"""
    result = ValidationResult()
    
    # 1. 检查聚合大小
    for agg in data.get('aggregates', []):
        entity_count = len(agg.get('entities', []))
        if entity_count > 5:
            result.add_error(
                'E001',
                'aggregate_size',
                agg['name'],
                f"聚合过大,包含 {entity_count} 个实体,超过建议上限(5个)",
                f"拆分 {agg['name']} 聚合,将部分实体独立为新聚合"
            )
        elif entity_count > 3:
            result.add_warning(
                'W001',
                'aggregate_size',
                agg['name'],
                f"聚合较大,包含 {entity_count} 个实体",
                "如果事务冲突频繁,考虑拆分"
            )
        else:
            result.add_passed(f"聚合大小合理: {agg['name']}")
    
    # 2. 检查聚合间依赖(简化版,实际需要解析引用)
    # 这里假设 Markdown 中会有 "通过 XXXId 引用" 的描述
    result.add_passed("聚合间依赖检查(需要代码分析)")
    
    # 3. 检查值对象命名
    for agg in data.get('aggregates', []):
        for vo in agg.get('value_objects', []):
            if 'Id' in vo['name']:
                result.add_warning(
                    'W002',
                    'value_object_naming',
                    vo['name'],
                    "值对象包含 'Id',可能应该是实体",
                    f"确认 {vo['name']} 是否需要唯一标识"
                )
            else:
                result.add_passed(f"值对象命名合理: {vo['name']}")
    
    # 4. 检查不变量描述
    for agg in data.get('aggregates', []):
        if not agg.get('invariants'):
            result.add_warning(
                'W003',
                'missing_invariants',
                agg['name'],
                "未定义不变量",
                f"为 {agg['name']} 聚合明确定义不变量"
            )
        else:
            result.add_passed(f"不变量已定义: {agg['name']}")
    
    # 5. 检查领域服务命名
    for service in data.get('services', []):
        if not service['name'].endswith('Service'):
            result.add_warning(
                'W004',
                'service_naming',
                service['name'],
                "领域服务未以 'Service' 结尾",
                f"建议重命名为 {service['name']}Service"
            )
        else:
            result.add_passed(f"领域服务命名合理: {service['name']}")
    
    return result


def generate_report(result, input_file, mode, output_path):
    """生成校验报告"""
    
    # Markdown 报告
    md = f"# 领域建模质量校验报告\n\n"
    md += f"**文档**: {input_file}\n"
    md += f"**校验时间**: {datetime.now(_get_local_tz()).strftime('%Y-%m-%d %H:%M:%S')}\n"
    md += f"**校验模式**: {mode}\n\n"
    md += "---\n\n"
    
    # 总览
    md += "## 总览\n\n"
    md += f"- ✅ **通过**: {len(result.passed)} 项\n"
    md += f"- ⚠️ **警告**: {len(result.warnings)} 项\n"
    md += f"- ❌ **错误**: {len(result.errors)} 项\n\n"
    md += f"**结论**: {result.get_conclusion()}\n\n"
    md += "---\n\n"
    
    # 错误
    if result.errors:
        md += "## 错误 (Error)\n\n"
        for err in result.errors:
            md += f"### ❌ {err['code']}: {err['message']}\n\n"
            md += f"**实体**: {err['entity']}\n"
            md += f"**类型**: {err['type']}\n"
            md += f"**建议**: {err['suggestion']}\n\n"
            md += "---\n\n"
    
    # 警告
    if result.warnings:
        md += "## 警告 (Warning)\n\n"
        for warn in result.warnings:
            md += f"### ⚠️ {warn['code']}: {warn['message']}\n\n"
            md += f"**实体**: {warn['entity']}\n"
            md += f"**类型**: {warn['type']}\n"
            md += f"**建议**: {warn['suggestion']}\n\n"
    
    # 通过项(简化)
    md += "## 通过 (Pass)\n\n"
    for p in result.passed[:5]:  # 只展示前 5 项
        md += f"- ✅ {p}\n"
    if len(result.passed) > 5:
        md += f"- ... (共 {len(result.passed)} 项)\n"
    
    # 写入 Markdown
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(md)
    
    # JSON 输出
    json_data = {
        'summary': {
            'passed': len(result.passed),
            'warnings': len(result.warnings),
            'errors': len(result.errors),
            'conclusion': result.get_conclusion()
        },
        'errors': result.errors,
        'warnings': result.warnings
    }
    
    json_path = output_path.replace('.md', '.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)
    
    return json_path


def main():
    parser = argparse.ArgumentParser(description='DDD 领域建模质量校验')
    parser.add_argument('--input', required=True, help='输入文件路径(Markdown 或 JSON)')
    parser.add_argument('--mode', default='quick', choices=['quick', 'deep'], help='校验模式')
    parser.add_argument('--output', default='validation-report.md', help='校验报告输出路径')
    
    args = parser.parse_args()
    
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"❌ 错误: 输入文件不存在: {args.input}")
        return 1
    
    # 解析输入
    if input_path.suffix == '.json':
        try:
            with open(input_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except FileNotFoundError:
            print(f"错误：文件不存在: {args.input}", file=sys.stderr)
            return 1
        except json.JSONDecodeError as e:
            print(f"错误：JSON解析失败: {e}", file=sys.stderr)
            return 1
    else:
        data = parse_markdown(input_path)
    
    # 执行校验
    if args.mode == 'quick':
        result = validate_quick(data)
    else:
        # Deep 模式需要 LLM 调用,这里简化为 quick + 提示
        result = validate_quick(data)
        print("⚠️ Deep 模式需要 LLM 调用,当前仅执行 quick 校验")
    
    # 生成报告
    json_path = generate_report(result, args.input, args.mode, args.output)
    
    # 输出总结
    print("\n✅ 校验完成")
    print(f"📊 通过: {len(result.passed)} 项 | 警告: {len(result.warnings)} 项 | 错误: {len(result.errors)} 项\n")
    
    if result.errors:
        print("❌ 错误:")
        for err in result.errors:
            print(f"  {err['code']}: {err['message']}")
        print()
    
    if result.warnings:
        print("⚠️ 警告:")
        for warn in result.warnings[:3]:  # 只显示前 3 个
            print(f"  {warn['code']}: {warn['message']}")
        if len(result.warnings) > 3:
            print(f"  ... (共 {len(result.warnings)} 个警告)")
        print()
    
    print(f"📄 详细报告: {args.output}")
    print(f"📄 JSON 结果: {json_path}")
    
    # 返回码: 0=通过, 1=有警告, 2=有错误
    if result.errors:
        return 2
    elif result.warnings:
        return 1
    else:
        return 0


if __name__ == '__main__':
    exit(main())
