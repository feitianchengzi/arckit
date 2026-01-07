---
description: "Component specification template"
---

# Button 组件规范

**组件标识**: `Button`  
**类型**: 基础组件  
**复杂度**: 简单  
**最后更新**: 2024-12-19

---

## 组件概述

**用途**: 触发操作的主要交互元素，用于提交表单、执行操作、导航等场景

**使用场景**:
- 表单提交
- 确认/取消操作
- 导航链接
- 主要操作按钮

**依赖组件**:
- 无

---

## 视觉规范

### 基础样式

**尺寸**:
- 高度: `DesignTokens.Spacing.xl` (32px)
- 最小宽度: 80px
- 内边距: 
  - 水平: `DesignTokens.Spacing.md`
  - 垂直: `DesignTokens.Spacing.sm`

**颜色**:
- 背景色: `DesignTokens.Colors.primary` (主要按钮)
- 文本色: `DesignTokens.Colors.text.primary` (在背景上)
- 边框色: `DesignTokens.Colors.border.primary` (次要按钮)

**字体**:
- 字体大小: `DesignTokens.Typography.body`
- 字重: `DesignTokens.Typography.medium`

**圆角**:
- 圆角半径: `DesignTokens.CornerRadius.medium`

**阴影**:
- 悬停时: `DesignTokens.Shadows.medium`

**边框**:
- 宽度: 1px (次要按钮)
- 样式: 实线

---

## 状态定义

### 1. Normal (正常)
- **触发条件**: 默认状态
- **视觉**: 背景色 `DesignTokens.Colors.primary`, 透明度 1.0
- **交互**: 可点击
- **无障碍**: Label 描述按钮功能

### 2. Hover (悬停)
- **触发条件**: 鼠标悬停
- **视觉**: 背景色加深 10%, 阴影 `DesignTokens.Shadows.medium`, 光标 pointer
- **动画**: 颜色过渡 `DesignTokens.Animation.fast`

### 3. Pressed (按下)
- **触发条件**: 用户点击
- **视觉**: 缩放 0.95, 背景色加深 20%, 透明度 0.9
- **动画**: 时长 `DesignTokens.Animation.fast`, 缓动 ease-in-out

### 4. Disabled (禁用)
- **触发条件**: 组件被禁用
- **视觉**: 不透明度 0.4, 背景色 `DesignTokens.Colors.background.tertiary`, 文本色 `DesignTokens.Colors.text.disabled`
- **交互**: 不可交互，光标 not-allowed
- **无障碍**: aria-disabled="true"

### 5. Focus (聚焦)
- **触发条件**: 键盘焦点
- **视觉**: 边框 `DesignTokens.Colors.primary`, 宽度 2px, outline-offset 2px
- **交互**: 接收键盘输入（Enter/Space 触发）
- **无障碍**: 键盘导航支持

---

## 属性规范

### 必需属性
- `label`: String - 按钮文本
- `onClick`: () -> Void - 点击回调

### 可选属性
- `variant`: ButtonVariant = .primary - 样式变体（primary, secondary, destructive, ghost）
- `size`: ButtonSize = .medium - 尺寸（small, medium, large）
- `isDisabled`: Bool = false - 是否禁用
- `isLoading`: Bool = false - 是否加载中
- `icon`: Icon? = nil - 可选图标（左侧）
- `fullWidth`: Bool = false - 是否全宽

### 样式变体
- **primary**: 主要操作，背景色 `DesignTokens.Colors.primary`，白色文字
- **secondary**: 次要操作，边框样式，背景透明
- **destructive**: 危险操作，背景色 `DesignTokens.Colors.error`，白色文字
- **ghost**: 幽灵按钮，无背景无边框，悬停时显示背景

---

## 交互行为

### Web 平台
- **点击**: 执行 onClick 回调，视觉反馈（按下效果）
- **键盘**: Enter 或 Space 键触发点击
- **悬停**: 显示悬停状态（仅桌面端）

---

## 无障碍支持

### 键盘导航
- 支持 Tab 键导航
- Enter 或 Space 键触发点击
- 聚焦时明确视觉指示

### 屏幕阅读器
- **Label**: 使用按钮文本或 aria-label
- **Role**: button
- **State**: 禁用时 aria-disabled="true"

### 色彩对比度
- 文本与背景对比度: 至少 4.5:1 (符合 WCAG AA)
- Dark Mode 下符合对比度要求

---

## 实现要点

**关键规则**:
- 所有设计值从 DesignTokens 读取
- 实现所有状态 (Normal, Hover, Pressed, Disabled, Focus)
- 支持键盘导航
- 响应式设计，适配不同屏幕

**测试要点**:
- 所有状态正确显示
- 动画流畅无卡顿
- 键盘导航正常
- 屏幕阅读器正确朗读

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

