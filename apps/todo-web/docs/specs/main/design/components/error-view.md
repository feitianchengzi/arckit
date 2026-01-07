---
description: "Component specification template"
---

# ErrorView 组件规范

**组件标识**: `ErrorView`  
**类型**: 基础组件  
**复杂度**: 简单  
**最后更新**: 2024-12-19

---

## 组件概述

**用途**: 错误提示视图，用于显示错误信息和提供恢复操作

**使用场景**:
- 页面加载失败
- 数据获取失败
- 操作失败
- 网络错误

**依赖组件**:
- Button (用于重试按钮)
- Icon (用于错误图标)

---

## 视觉规范

### 基础样式

**尺寸**:
- 容器: 自适应
- 图标大小: `DesignTokens.Icons.large` (32px)
- 按钮: 标准按钮尺寸

**颜色**:
- 图标颜色: `DesignTokens.Colors.error`
- 文本色: `DesignTokens.Colors.text.primary`
- 背景色: `DesignTokens.Colors.background.primary`

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

### 1. Error (错误)
- **触发条件**: 错误发生
- **视觉**: 错误图标，错误消息，重试按钮
- **交互**: 可点击重试按钮

### 2. Empty (空状态)
- **触发条件**: 无数据
- **视觉**: 空状态图标，提示文本，操作按钮（可选）
- **交互**: 可点击操作按钮

---

## 属性规范

### 必需属性
- `message`: String - 错误消息

### 可选属性
- `title`: String? = nil - 错误标题
- `onRetry`: () -> Void? = nil - 重试回调（如有则显示重试按钮）
- `icon`: Icon? = nil - 自定义图标
- `actionLabel`: String? = nil - 操作按钮文本（默认"重试"）

---

## 交互行为

### Web 平台
- **重试**: 点击重试按钮执行 onRetry 回调
- **无交互**: 纯展示错误信息

---

## 无障碍支持

### 屏幕阅读器
- **Label**: 错误标题和消息
- **Role**: alert
- **Live**: aria-live="assertive"

### 色彩对比度
- 文本与背景对比度: 至少 4.5:1

---

## 实现要点

**关键规则**:
- 所有设计值从 DesignTokens 读取
- 提供清晰错误信息
- 支持重试操作
- 支持无障碍访问

**测试要点**:
- 错误信息正确显示
- 重试按钮正常工作
- 屏幕阅读器正确朗读

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

