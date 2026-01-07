---
description: "Component specification template"
---

# Popover 组件规范

**组件标识**: `Popover`  
**类型**: 基础组件  
**复杂度**: 中等  
**最后更新**: 2024-12-19

---

## 组件概述

**用途**: 气泡提示组件，用于显示成员的待办事项列表或其他上下文信息

**使用场景**:
- 成员悬停时显示参与的待办事项
- 工具提示
- 上下文菜单

**依赖组件**:
- TodoItem (components/todo-item.md) - 用于显示待办项
- Button (components/button.md) - 用于快速操作

---

## 视觉规范

### 基础样式

**尺寸**:
- 宽度: 320px (最小), 400px (最大)
- 高度: 自适应，最大高度 400px
- 内边距: 
  - 水平: `DesignTokens.Spacing.md`
  - 垂直: `DesignTokens.Spacing.md`

**颜色**:
- 背景色: `DesignTokens.Colors.background.primary`
- 边框色: `DesignTokens.Colors.border.primary`
- 文本色: `DesignTokens.Colors.text.primary`

**字体**:
- 标题字体: `DesignTokens.Typography.title4`
- 正文字体: `DesignTokens.Typography.body`

**圆角**:
- 圆角半径: `DesignTokens.CornerRadius.large`

**阴影**:
- 阴影: `DesignTokens.Shadows.heavy`

**边框**:
- 宽度: 1px
- 样式: 实线

---

## 状态定义

### 1. Hidden (隐藏)
- **触发条件**: 默认状态或鼠标移出
- **视觉**: 不显示
- **交互**: 无交互

### 2. Visible (显示)
- **触发条件**: 鼠标悬停在触发元素上
- **视觉**: 显示气泡，包含待办列表
- **交互**: 可点击待办项或快速评论按钮
- **动画**: 淡入动画，时长 `DesignTokens.Animation.standard`

### 3. Loading (加载中)
- **触发条件**: 正在加载待办数据
- **视觉**: 显示加载指示器
- **交互**: 无交互

---

## 属性规范

### 必需属性
- `content`: View - 气泡内容
- `trigger`: View - 触发元素

### 可选属性
- `placement`: PopoverPlacement = .bottom - 位置（top, bottom, left, right）
- `offset`: CGFloat = 8 - 与触发元素的偏移距离
- `delay`: TimeInterval = 0.3 - 显示延迟（秒）
- `maxHeight`: CGFloat? = 400 - 最大高度

---

## 交互行为

### Web 平台
- **显示**: 鼠标悬停触发元素，延迟后显示气泡
- **隐藏**: 鼠标移出触发元素或气泡区域
- **点击**: 点击气泡内的待办项跳转到详情
- **快速评论**: 点击快速评论按钮打开评论输入

---

## 无障碍支持

### 键盘导航
- 支持通过键盘触发显示（可选）
- 气泡内支持 Tab 键导航

### 屏幕阅读器
- **Role**: tooltip 或 dialog（根据内容类型）
- **Label**: 描述气泡内容

---

## 实现要点

**关键规则**:
- 所有设计值从 DesignTokens 读取
- 自动计算位置，避免超出视口
- 支持延迟显示，避免误触
- 响应式设计，移动端使用全屏模态框

**测试要点**:
- 气泡正确显示和隐藏
- 位置计算正确
- 待办列表正确显示
- 交互功能正常

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

