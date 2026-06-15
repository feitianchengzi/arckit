#!/usr/bin/env python3
"""
DDD 战略设计质量校验器

用途：对 DDD 战略设计文档进行质量校验，包括核心域数量、通用域策略、上下文循环依赖等检查项。

参数：
  --input   输入 JSON 文件路径（必需），包含 subdomains/contexts/relations 字段
  --mode    校验模式：quick（快速规则检查）或 deep（深度检查，当前降级为 quick）
  --output  校验报告输出路径（默认 validation-report.md）

输出：
  - Markdown 校验报告
  - JSON 详细结果文件

退出码：
  0 - 通过
  1 - 未通过（存在错误项）
"""

import json
import argparse
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
    
    def add_error(self, code, message, suggestion):
        self.errors.append({'code': code, 'message': message, 'suggestion': suggestion})
    
    def add_warning(self, code, message, suggestion):
        self.warnings.append({'code': code, 'message': message, 'suggestion': suggestion})
    
    def add_passed(self, check_name):
        self.passed.append(check_name)
    
    def get_conclusion(self):
        if self.errors:
            return 'needs_fix'
        elif self.warnings:
            return 'acceptable_with_warnings'
        else:
            return 'passed'


def validate_quick(data):
    """快速模式校验"""
    result = ValidationResult()
    
    # 1. 核心域数量
    core_count = len([s for s in data.get('subdomains', []) if s.get('type') == '核心域'])
    if core_count == 0:
        result.add_error('E001', '未识别核心域', '明确业务的核心竞争力所在')
    elif core_count > 3:
        result.add_warning('W001', f'核心域过多({core_count}个)', '聚焦 1-3 个核心域')
    else:
        result.add_passed(f'核心域数量合理({core_count}个)')
    
    # 2. 通用域策略
    generic_subdomains = [s for s in data.get('subdomains', []) if s.get('type') == '通用域']
    for sub in generic_subdomains:
        if sub.get('strategy') == '自研':
            result.add_warning('W002', f'通用域 {sub["name"]} 自研', '评估是否可采购第三方')
    
    # 3. 上下文依赖(简化检查)
    relations = data.get('relations', [])
    contexts = {ctx['name'] for ctx in data.get('contexts', [])}
    
    # 检查循环依赖(简化版)
    for rel in relations:
        reverse_rel = next((r for r in relations if r['from'] == rel['to'] and r['to'] == rel['from']), None)
        if reverse_rel:
            result.add_error('E002', f'循环依赖: {rel["from"]} ↔ {rel["to"]}', '重新设计依赖关系')
    
    if not any(err['code'] == 'E002' for err in result.errors):
        result.add_passed('无循环依赖')
    
    return result


def generate_report(result, input_file, mode, output_path):
    """生成校验报告"""
    md = f"# 战略设计质量校验报告\n\n"
    md += f"**文档**: {input_file}\n"
    md += f"**校验时间**: {datetime.now(_get_local_tz()).strftime('%Y-%m-%d %H:%M:%S')}\n"
    md += f"**校验模式**: {mode}\n\n---\n\n"
    
    md += "## 总览\n\n"
    md += f"- ✅ **通过**: {len(result.passed)} 项\n"
    md += f"- ⚠️ **警告**: {len(result.warnings)} 项\n"
    md += f"- ❌ **错误**: {len(result.errors)} 项\n\n"
    md += f"**结论**: {result.get_conclusion()}\n\n---\n\n"
    
    if result.errors:
        md += "## 错误 (Error)\n\n"
        for err in result.errors:
            md += f"### ❌ {err['code']}: {err['message']}\n\n"
            md += f"**建议**: {err['suggestion']}\n\n---\n\n"
    
    if result.warnings:
        md += "## 警告 (Warning)\n\n"
        for warn in result.warnings:
            md += f"### ⚠️ {warn['code']}: {warn['message']}\n\n"
            md += f"**建议**: {warn['suggestion']}\n\n"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(md)
    
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
    parser = argparse.ArgumentParser(description='DDD 战略设计质量校验')
    parser.add_argument('--input', required=True, help='输入文件路径')
    parser.add_argument('--mode', default='quick', choices=['quick', 'deep'], help='校验模式')
    parser.add_argument('--output', default='validation-report.md', help='校验报告输出路径')
    
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
    
    result = validate_quick(data)
    json_path = generate_report(result, args.input, args.mode, args.output)
    
    print("\n✅ 校验完成")
    print(f"📊 通过: {len(result.passed)} 项 | 警告: {len(result.warnings)} 项 | 错误: {len(result.errors)} 项\n")
    
    if result.errors:
        print("❌ 错误:")
        for err in result.errors:
            print(f"  {err['code']}: {err['message']}")
    
    print(f"\n📄 详细报告: {args.output}")
    print(f"📄 JSON 结果: {json_path}")
    
    return 2 if result.errors else (1 if result.warnings else 0)


if __name__ == '__main__':
    exit(main())
