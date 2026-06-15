#!/usr/bin/env python3
"""
init_design_system.py — Master 设计系统初始化

创建 Master+Overrides 分层设计系统的目录结构和 MASTER.md 基础文件。
支持行业预设（SaaS/E-commerce/社交/开发者工具）快速启动。

用法:
  python3 init_design_system.py --project "MyApp" --style-preset saas
  python3 init_design_system.py --project "MyApp" --style-preset custom --output-dir ./design
"""

import argparse
import json
from datetime import datetime
from pathlib import Path


STYLE_PRESETS = {
    "saas": {
        "primary": "#2563EB", "secondary": "#7C3AED", "neutral": "#64748B",
        "bg": "#FFFFFF", "surface": "#F8FAFC", "text": "#0F172A",
        "font_display": "Inter", "font_body": "Inter",
        "radius": "8px", "spacing_unit": "8px",
        "signature_note": "数据可视化 + 微动效反馈，专业信任感",
    },
    "ecommerce": {
        "primary": "#DC2626", "secondary": "#F59E0B", "neutral": "#6B7280",
        "bg": "#FFFFFF", "surface": "#FFF7ED", "text": "#111827",
        "font_display": "Poppins", "font_body": "Noto Sans SC",
        "radius": "12px", "spacing_unit": "8px",
        "signature_note": "暖色高对比CTA + 悬停预览，冲动转化",
    },
    "social": {
        "primary": "#6366F1", "secondary": "#EC4899", "neutral": "#9CA3AF",
        "bg": "#FFFFFF", "surface": "#F3F4F6", "text": "#111827",
        "font_display": "Outfit", "font_body": "Noto Sans SC",
        "radius": "16px", "spacing_unit": "8px",
        "signature_note": "渐变色彩 + 流畅转场，沉浸亲切",
    },
    "devtool": {
        "primary": "#10B981", "secondary": "#6366F1", "neutral": "#6B7280",
        "bg": "#0F172A", "surface": "#1E293B", "text": "#E2E8F0",
        "font_display": "JetBrains Mono", "font_body": "Inter",
        "radius": "4px", "spacing_unit": "4px",
        "signature_note": "终端美学 + 代码高亮 + 快捷键驱动，极简高效",
    },
    "custom": {
        "primary": "#3B82F6", "secondary": "#8B5CF6", "neutral": "#6B7280",
        "bg": "#FFFFFF", "surface": "#F9FAFB", "text": "#111827",
        "font_display": "Inter", "font_body": "Inter",
        "radius": "8px", "spacing_unit": "8px",
        "signature_note": "⚠️ [需自定义signature元素]",
    },
}


MASTER_TEMPLATE = """# {project} 设计系统 — MASTER

> 初始化时间: {date}
> 风格预设: {preset}
> ⚠️ 此文件是设计系统主规则，页面覆盖规则在 pages/ 下定义

---

## 配色系统

| 角色 | 色值 | 用途 |
|------|------|------|
| 主色 | `{primary}` | CTA/关键操作/品牌标识 |
| 辅色 | `{secondary}` | 辅助操作/信息标注 |
| 中性色 | `{neutral}` | 边框/分割线/次要文字 |
| 背景 | `{bg}` | 页面背景 |
| 表面 | `{surface}` | 卡片/弹窗/容器背景 |
| 正文 | `{text}` | 正文文字 |

---

## 字体系统

| 角色 | 字体 | 说明 |
|------|------|------|
| Display | `{font_display}` | 标题/大字/品牌展示 |
| Body | `{font_body}` | 正文/说明/列表 |

### 尺寸阶梯

| 级别 | 大小 | 行高 | 用途 |
|------|------|------|------|
| xs | 12px | 1.5 | 辅助文字/标签 |
| sm | 14px | 1.5 | 正文/说明 |
| md | 16px | 1.5 | 正文默认 |
| lg | 20px | 1.4 | 小标题 |
| xl | 24px | 1.3 | 章节标题 |
| 2xl | 32px | 1.2 | 页面标题 |
| 3xl | 48px | 1.1 | Hero 标题 |

---

## 间距系统

基础单位: `{spacing_unit}`

| 级别 | 值 | 用途 |
|------|---|------|
| xs | 1x | 内联元素间距 |
| sm | 2x | 紧凑布局间距 |
| md | 3x | 默认间距 |
| lg | 4x | 区块间距 |
| xl | 6x | 章节间距 |
| 2xl | 8x | 页面大区块间距 |

---

## 圆角

默认圆角: `{radius}`

| 元素 | 圆角 |
|------|------|
| 按钮 | {radius} |
| 输入框 | {radius} |
| 卡片 | {radius} |
| 弹窗 | {radius} |
| 头像 | 50% |

---

## 组件规格

### 按钮

| 变体 | 背景 | 文字 | 边框 | 圆角 | 内边距 |
|------|------|------|------|------|--------|
| Primary | 主色 | 白 | 无 | {radius} | 8px 16px |
| Secondary | 辅色 | 白 | 无 | {radius} | 8px 16px |
| Outline | 透明 | 主色 | 主色 | {radius} | 8px 16px |
| Ghost | 透明 | 中性色 | 无 | {radius} | 8px 16px |

### 输入框

| 属性 | 值 |
|------|---|
| 高度 | 40px |
| 内边距 | 8px 12px |
| 边框 | 1px solid 中性色 |
| 圆角 | {radius} |
| 聚焦边框 | 2px solid 主色 |

---

## 反模式清单

> 以下设计做法在本项目中禁止使用

- ❌ 使用 AI 默认暖奶油风配色（#F4F1EA 背景 + 衬线体）
- ❌ 使用 AI 默认暗黑酸色风（近黑背景 + 单一酸绿）
- ❌ 使用 AI 默认报纸排版风（零圆角 + 极细线 + 密集分栏）
- ❌ 纯装饰性动效（每个动效必须服务于交互目的）
- ❌ 超过3种主色（色彩系统必须有层级）
- ❌ 低于 4.5:1 的文字对比度（WCAG AA）

---

## 动效规范

| 属性 | 值 |
|------|---|
| 默认时长 | 200ms |
| 缓动函数 | cubic-bezier(0.4, 0, 0.2, 1) |
| 减少动效 | prefers-reduced-motion: reduce → 时长 0ms |

---

## Signature 元素

{signature_note}

> ⚠️ Signature 是本设计的记忆点。去掉 signature 后如果页面与竞品无法区分，说明设计失败。
"""

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Master 设计系统初始化")
    parser.add_argument("--project", required=True, help="项目名称")
    parser.add_argument("--style-preset", default="custom",
                        choices=list(STYLE_PRESETS.keys()), help="风格预设")
    parser.add_argument("--output-dir", default="", help="输出目录（默认: ./design-system/{project}）")
    args = parser.parse_args()

    preset = STYLE_PRESETS[args.style_preset]
    output_dir = Path(args.output_dir) if args.output_dir else Path(f"design-system/{args.project}")
    pages_dir = output_dir / "pages"

    now = datetime.now(get_local_tz()).strftime("%Y-%m-%d")
    master_content = MASTER_TEMPLATE.format(
        project=args.project, date=now, preset=args.style_preset, **preset
    )

    output_dir.mkdir(parents=True, exist_ok=True)
    pages_dir.mkdir(parents=True, exist_ok=True)

    master_path = output_dir / "MASTER.md"
    master_path.write_text(master_content, encoding="utf-8")

    print(f"✅ 设计系统已初始化: {output_dir}")
    print(f"   MASTER: {master_path}")
    print(f"   Pages:  {pages_dir}/")
    print(f"   风格:   {args.style_preset}")
