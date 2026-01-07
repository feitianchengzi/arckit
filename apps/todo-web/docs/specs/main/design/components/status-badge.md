---
description: "Component specification template"
---

# StatusBadge 组件规范

**组件标识**: `StatusBadge`  
**类型**: 基础组件  
**复杂度**: 简单  
**最后更新**: 2024-12-19

---

## 组件概述

**用途**: 状态徽章，用于显示待办事项的状态

**使用场景**:
- 待办列表项
- 待办详情
- 状态筛选

**依赖组件**:
- 无

---

## 视觉规范

### 基础样式

**尺寸**:
- 高度: 24px
- 宽度: 自适应
- 内边距: 
  - 水平: `DesignTokens.Spacing.sm`
  - 垂直: `DesignTokens.Spacing.xs`

**颜色**:
- 背景色: 根据状态变化
- 文本色: 白色或深色（根据背景）

**字体**:
- 字体大小: `DesignTokens.Typography.caption`
- 字重: `DesignTokens.Typography.medium`

**圆角**:
- 圆角半径: `DesignTokens.CornerRadius.small`

**阴影**:
- 无

**边框**:
- 无

---

## 状态定义

### 1. Pending (待处理)
- **触发条件**: 待办状态为"待处理"
- **视觉**: 背景色 `DesignTokens.Colors.text.secondary`, 白色文字

### 2. InProgress (进行中)
- **触发条件**: 待办状态为"进行中"
- **视觉**: 背景色 `DesignTokens.Colors.info`, 白色文字

### 3. Completed (已完成)
- **触发条件**: 待办状态为"已完成"
- **视觉**: 背景色 `DesignTokens.Colors.success`, 白色文字

---

## 属性规范

### 必需属性
- `status`: TodoStatus - 待办状态

### 可选属性
- `size`: BadgeSize = .medium - 尺寸（small, medium, large）

---

## 交互行为

### Web 平台
- **点击**: 可点击筛选（可选）
- **无交互**: 纯展示状态

---

## 无障碍支持

### 屏幕阅读器
- **Label**: 状态文本
- **Role**: status

### 色彩对比度
- 文本与背景对比度: 至少 4.5:1

---

## 实现要点

**关键规则**:
- 所有设计值从 DesignTokens 读取
- 状态颜色映射清晰
- 支持无障碍访问

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

