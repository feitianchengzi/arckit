# 视觉设计规范

**Feature**: 待办管理系统  
**Created**: 2024-12-19  
**Platform**: Web

## 1. 颜色系统 (Color System)

### 主色调 (Primary Colors)

**主要颜色 (Primary)**
- **用途**: 主要操作按钮、链接、重要元素强调
- **定义**: `DesignTokens.Colors.primary`
- **示例值**: 
  - Light Mode: #2563EB (蓝色)
  - Dark Mode: #3B82F6 (浅蓝色)

**次要颜色 (Secondary)**
- **用途**: 次要操作按钮、辅助元素
- **定义**: `DesignTokens.Colors.secondary`
- **示例值**:
  - Light Mode: #64748B (灰蓝色)
  - Dark Mode: #94A3B8 (浅灰蓝色)

### 语义颜色 (Semantic Colors)

**成功 (Success)**
- **用途**: 成功提示、完成状态
- **定义**: `DesignTokens.Colors.success`
- **示例值**: #10B981 (绿色)

**警告 (Warning)**
- **用途**: 警告提示、需要注意的状态
- **定义**: `DesignTokens.Colors.warning`
- **示例值**: #F59E0B (橙色)

**错误 (Error)**
- **用途**: 错误提示、危险操作
- **定义**: `DesignTokens.Colors.error`
- **示例值**: #EF4444 (红色)

**信息 (Info)**
- **用途**: 信息提示、一般通知
- **定义**: `DesignTokens.Colors.info`
- **示例值**: #3B82F6 (蓝色)

### 中性色 (Neutral Colors)

**背景色 (Background)**
- **主背景**: `DesignTokens.Colors.background.primary` - #FFFFFF (Light) / #0F172A (Dark)
- **次要背景**: `DesignTokens.Colors.background.secondary` - #F8FAFC (Light) / #1E293B (Dark)
- **三级背景**: `DesignTokens.Colors.background.tertiary` - #F1F5F9 (Light) / #334155 (Dark)

**文本色 (Text)**
- **主要文本**: `DesignTokens.Colors.text.primary` - #0F172A (Light) / #F8FAFC (Dark)
- **次要文本**: `DesignTokens.Colors.text.secondary` - #64748B (Light) / #94A3B8 (Dark)
- **禁用文本**: `DesignTokens.Colors.text.disabled` - #CBD5E1 (Light) / #475569 (Dark)

**边框色 (Border)**
- **主要边框**: `DesignTokens.Colors.border.primary` - #E2E8F0 (Light) / #334155 (Dark)
- **次要边框**: `DesignTokens.Colors.border.secondary` - #CBD5E1 (Light) / #475569 (Dark)

**分隔线 (Divider)**
- **分隔线**: `DesignTokens.Colors.divider` - #E2E8F0 (Light) / #334155 (Dark)

## 2. 字体系统 (Typography)

### 字体家族
- **默认字体**: `DesignTokens.Typography.fontFamily` - -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
- **等宽字体**: `DesignTokens.Typography.monoFontFamily` - "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace

### 字体大小层级

| 层级 | Token | 大小 | 用途 | 行高 |
|------|-------|------|------|------|
| 超大标题 | `DesignTokens.Typography.display` | 48px | 页面主标题 | 1.2 |
| 标题1 | `DesignTokens.Typography.title1` | 32px | 页面标题 | 1.25 |
| 标题2 | `DesignTokens.Typography.title2` | 24px | 区块标题 | 1.3 |
| 标题3 | `DesignTokens.Typography.title3` | 20px | 小节标题 | 1.35 |
| 标题4 | `DesignTokens.Typography.title4` | 18px | 小标题 | 1.4 |
| 正文 | `DesignTokens.Typography.body` | 16px | 正文内容 | 1.5 |
| 小文本 | `DesignTokens.Typography.small` | 14px | 辅助信息 | 1.5 |
| 辅助文本 | `DesignTokens.Typography.caption` | 12px | 说明文字 | 1.4 |

### 字重 (Font Weight)

| 字重 | Token | 值 | 用途 |
|------|-------|-----|------|
| 细体 | `DesignTokens.Typography.light` | 300 | 装饰性文本 |
| 常规 | `DesignTokens.Typography.regular` | 400 | 正文内容 |
| 中等 | `DesignTokens.Typography.medium` | 500 | 强调文本 |
| 粗体 | `DesignTokens.Typography.bold` | 700 | 标题、重要信息 |

## 3. 间距系统 (Spacing)

### 间距层级

| 层级 | Token | 值 | 用途 |
|------|-------|-----|------|
| 极小 | `DesignTokens.Spacing.xs` | 4px | 紧密元素间距 |
| 小 | `DesignTokens.Spacing.sm` | 8px | 相关元素间距 |
| 中等 | `DesignTokens.Spacing.md` | 16px | 标准元素间距 |
| 大 | `DesignTokens.Spacing.lg` | 24px | 区块间距 |
| 特大 | `DesignTokens.Spacing.xl` | 32px | 大区块间距 |
| 超大 | `DesignTokens.Spacing.2xl` | 48px | 页面边距 |
| 巨大 | `DesignTokens.Spacing.3xl` | 64px | 页面级间距 |

### 间距使用规范

**组件内间距**:
- 按钮内边距: 水平 `DesignTokens.Spacing.md`, 垂直 `DesignTokens.Spacing.sm`
- 输入框内边距: 水平 `DesignTokens.Spacing.md`, 垂直 `DesignTokens.Spacing.sm`
- 卡片内边距: `DesignTokens.Spacing.lg`

**组件间间距**:
- 列表项间距: `DesignTokens.Spacing.md`
- 表单字段间距: `DesignTokens.Spacing.lg`
- 区块间距: `DesignTokens.Spacing.xl`

**页面边距**:
- 移动端: `DesignTokens.Spacing.md`
- 平板端: `DesignTokens.Spacing.lg`
- 桌面端: `DesignTokens.Spacing.xl`

## 4. 圆角系统 (Corner Radius)

| 层级 | Token | 值 | 用途 |
|------|-------|-----|------|
| 小 | `DesignTokens.CornerRadius.small` | 4px | 小元素、标签 |
| 中 | `DesignTokens.CornerRadius.medium` | 8px | 按钮、输入框 |
| 大 | `DesignTokens.CornerRadius.large` | 12px | 卡片、模态框 |
| 超大 | `DesignTokens.CornerRadius.xlarge` | 16px | 大卡片、容器 |

## 5. 阴影系统 (Shadows)

| 层级 | Token | 参数 | 用途 |
|------|-------|------|------|
| 轻 | `DesignTokens.Shadows.light` | 0 1px 2px rgba(0,0,0,0.05) | 轻微提升 |
| 中 | `DesignTokens.Shadows.medium` | 0 4px 6px rgba(0,0,0,0.1) | 卡片、按钮悬停 |
| 重 | `DesignTokens.Shadows.heavy` | 0 10px 15px rgba(0,0,0,0.15) | 模态框、下拉菜单 |

## 6. 图标系统 (Icons)

### 图标尺寸

| 尺寸 | Token | 值 | 用途 |
|------|-------|-----|------|
| 小 | `DesignTokens.Icons.small` | 16px | 内联图标 |
| 中 | `DesignTokens.Icons.medium` | 24px | 按钮图标、列表图标 |
| 大 | `DesignTokens.Icons.large` | 32px | 页面图标、空状态图标 |

### 图标风格
- **风格**: 线性图标，2px 描边
- **来源**: Heroicons / Lucide Icons
- **颜色**: 使用 `DesignTokens.Colors.text.secondary` 作为默认颜色

## 7. 动画系统 (Animation)

### 动画时长

| 类型 | Token | 值 | 用途 |
|------|-------|-----|------|
| 快速 | `DesignTokens.Animation.fast` | 0.2s | 悬停、点击反馈 |
| 标准 | `DesignTokens.Animation.standard` | 0.3s | 页面转场、模态框 |
| 慢速 | `DesignTokens.Animation.slow` | 0.5s | 复杂动画、页面加载 |

### 缓动函数 (Easing)

| 类型 | Token | 值 | 用途 |
|------|-------|-----|------|
| 线性 | `DesignTokens.Animation.linear` | linear | 进度条 |
| 缓入缓出 | `DesignTokens.Animation.easeInOut` | cubic-bezier(0.4, 0, 0.2, 1) | 标准转场 |
| 缓入 | `DesignTokens.Animation.easeIn` | cubic-bezier(0.4, 0, 1, 1) | 进入动画 |
| 缓出 | `DesignTokens.Animation.easeOut` | cubic-bezier(0, 0, 0.2, 1) | 退出动画 |

### 动画使用规范

**转场动画**:
- 页面切换: `DesignTokens.Animation.standard` + `DesignTokens.Animation.easeInOut`
- 模态框显示/隐藏: `DesignTokens.Animation.standard` + `DesignTokens.Animation.easeOut`

**交互反馈**:
- 按钮按下: `DesignTokens.Animation.fast` + 缩放 0.95
- 悬停效果: `DesignTokens.Animation.fast` + 颜色过渡

**加载动画**:
- 骨架屏: 脉冲动画，2s 循环
- 加载指示器: 旋转动画，1s 循环

