---
description: "Component specification template"
---

# ProjectCard 组件规范

**组件标识**: `ProjectCard`  
**类型**: 复合组件  
**复杂度**: 中等  
**最后更新**: 2024-12-19

---

## 组件概述

**用途**: 项目卡片，用于在项目列表中展示项目信息

**使用场景**:
- 项目列表页面
- 项目选择
- 项目概览

**依赖组件**:
- Button (components/button.md)
- Label (components/label.md)

---

## 视觉规范

### 基础样式

**尺寸**:
- 高度: 自适应
- 宽度: 100% (容器宽度)
- 内边距: `DesignTokens.Spacing.lg`

**颜色**:
- 背景色: `DesignTokens.Colors.background.primary`
- 边框色: `DesignTokens.Colors.border.primary`
- 文本色: `DesignTokens.Colors.text.primary`

**字体**:
- 标题字体: `DesignTokens.Typography.title3`
- 正文字体: `DesignTokens.Typography.body`

**圆角**:
- 圆角半径: `DesignTokens.CornerRadius.large`

**阴影**:
- 默认: `DesignTokens.Shadows.light`
- 悬停: `DesignTokens.Shadows.medium`

**边框**:
- 宽度: 1px
- 样式: 实线

---

## 状态定义

### 1. Normal (正常)
- **触发条件**: 默认状态
- **视觉**: 标准卡片样式
- **交互**: 可点击进入项目详情

### 2. Hover (悬停)
- **触发条件**: 鼠标悬停
- **视觉**: 阴影加深，光标 pointer
- **动画**: 阴影过渡 `DesignTokens.Animation.fast`

### 3. Pressed (按下)
- **触发条件**: 用户点击
- **视觉**: 缩放 0.98
- **动画**: 时长 `DesignTokens.Animation.fast`

### 4. Selected (选中)
- **触发条件**: 项目被选中
- **视觉**: 边框颜色 `DesignTokens.Colors.primary`, 宽度 2px
- **交互**: 显示选中状态

---

## 属性规范

### 必需属性
- `project`: Project - 项目数据对象

### 可选属性
- `onClick`: () -> Void? = nil - 点击回调
- `isSelected`: Bool = false - 是否选中
- `showActions`: Bool = true - 是否显示操作按钮

---

## 交互行为

### Web 平台
- **点击**: 进入项目详情页面
- **悬停**: 显示悬停状态
- **操作按钮**: 显示项目操作菜单

---

## 无障碍支持

### 键盘导航
- 支持 Tab 键导航
- Enter 键触发点击

### 屏幕阅读器
- **Label**: 项目名称和描述
- **Role**: article

---

## 实现要点

**关键规则**:
- 所有设计值从 DesignTokens 读取
- 响应式设计
- 支持键盘导航

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

