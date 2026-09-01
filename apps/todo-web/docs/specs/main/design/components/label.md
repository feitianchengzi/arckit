---
description: "Component specification template"
---

# Label 组件规范

**组件标识**: `Label`  
**类型**: 基础组件  
**复杂度**: 简单  
**最后更新**: 2024-12-19

---

## 组件概述

**用途**: 文本标签，用于标识表单字段、显示文本信息

**使用场景**:
- 表单字段标签
- 列表项标签
- 状态标签
- 信息展示

**依赖组件**:
- 无

---

## 视觉规范

### 基础样式

**尺寸**:
- 高度: 自适应
- 宽度: 自适应

**颜色**:
- 文本色: `DesignTokens.Colors.text.primary`
- 次要文本色: `DesignTokens.Colors.text.secondary`
- 禁用文本色: `DesignTokens.Colors.text.disabled`

**字体**:
- 字体大小: `DesignTokens.Typography.body` (默认) 或 `DesignTokens.Typography.small`
- 字重: `DesignTokens.Typography.regular` 或 `DesignTokens.Typography.medium`

**圆角**:
- 无

**阴影**:
- 无

**边框**:
- 无

---

## 状态定义

### 1. Normal (正常)
- **触发条件**: 默认状态
- **视觉**: 文本色 `DesignTokens.Colors.text.primary`
- **交互**: 无交互

### 2. Secondary (次要)
- **触发条件**: 次要信息
- **视觉**: 文本色 `DesignTokens.Colors.text.secondary`
- **交互**: 无交互

### 3. Disabled (禁用)
- **触发条件**: 关联字段被禁用
- **视觉**: 文本色 `DesignTokens.Colors.text.disabled`
- **交互**: 无交互

---

## 属性规范

### 必需属性
- `text`: String - 标签文本

### 可选属性
- `variant`: LabelVariant = .normal - 样式变体（normal, secondary, small, bold）
- `isRequired`: Bool = false - 是否必填（显示 * 标记）
- `htmlFor`: String? = nil - 关联的表单字段 ID
- `color`: Color? = nil - 自定义颜色

### 样式变体
- **normal**: 标准标签，`DesignTokens.Typography.body`
- **secondary**: 次要标签，`DesignTokens.Colors.text.secondary`
- **small**: 小标签，`DesignTokens.Typography.small`
- **bold**: 粗体标签，`DesignTokens.Typography.bold`

---

## 交互行为

### Web 平台
- **点击**: 如关联表单字段，点击标签聚焦到字段
- **无交互**: 纯展示标签无交互

---

## 无障碍支持

### 键盘导航
- 如关联表单字段，支持通过标签聚焦字段

### 屏幕阅读器
- **Label**: 使用文本内容
- **Role**: label (如关联表单字段)
- **Association**: 使用 htmlFor 关联表单字段

### 色彩对比度
- 文本与背景对比度: 至少 4.5:1 (符合 WCAG AA)

---

## 实现要点

**关键规则**:
- 所有设计值从 DesignTokens 读取
- 支持关联表单字段
- 支持动态字体大小

**测试要点**:
- 文本正确显示
- 关联表单字段正常工作
- 屏幕阅读器正确朗读

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

