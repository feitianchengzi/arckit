---
description: "Component specification template"
---

# EmptyStateView 组件规范

**组件标识**: `EmptyStateView`  
**类型**: 基础组件  
**复杂度**: 简单  
**最后更新**: 2024-12-19

---

## 组件概述

**用途**: 空状态视图，用于显示无数据时的提示和引导操作

**使用场景**:
- 列表为空
- 搜索结果为空
- 初始状态引导

**依赖组件**:
- Button (用于操作按钮)
- Icon (用于空状态图标)

---

## 视觉规范

### 基础样式

**尺寸**:
- 容器: 自适应，居中显示
- 图标大小: `DesignTokens.Icons.large` (32px) 或更大
- 按钮: 标准按钮尺寸

**颜色**:
- 图标颜色: `DesignTokens.Colors.text.secondary`
- 文本色: `DesignTokens.Colors.text.secondary`
- 背景色: 透明

**字体**:
- 标题字体: `DesignTokens.Typography.title3`
- 正文字体: `DesignTokens.Typography.body`
- 字重: `DesignTokens.Typography.regular`

**圆角**:
- 无

**阴影**:
- 无

**边框**:
- 无

---

## 状态定义

### 1. Empty (空状态)
- **触发条件**: 无数据
- **视觉**: 空状态图标，提示文本，操作按钮（可选）
- **交互**: 可点击操作按钮

---

## 属性规范

### 必需属性
- `message`: String - 提示消息

### 可选属性
- `title`: String? = nil - 标题
- `icon`: Icon? = nil - 自定义图标
- `actionLabel`: String? = nil - 操作按钮文本
- `onAction`: () -> Void? = nil - 操作回调

---

## 交互行为

### Web 平台
- **操作**: 点击操作按钮执行 onAction 回调
- **无交互**: 纯展示空状态信息

---

## 无障碍支持

### 屏幕阅读器
- **Label**: 标题和提示消息
- **Role**: status
- **Live**: aria-live="polite"

### 色彩对比度
- 文本与背景对比度: 至少 4.5:1

---

## 实现要点

**关键规则**:
- 所有设计值从 DesignTokens 读取
- 提供清晰引导信息
- 支持操作按钮
- 支持无障碍访问

**测试要点**:
- 空状态信息正确显示
- 操作按钮正常工作
- 屏幕阅读器正确朗读

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

