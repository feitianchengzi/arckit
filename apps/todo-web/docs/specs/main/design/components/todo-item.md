---
description: "Component specification template"
---

# TodoItem 组件规范

**组件标识**: `TodoItem`  
**类型**: 复合组件  
**复杂度**: 中等  
**最后更新**: 2024-12-19

---

## 组件概述

**用途**: 待办事项列表项，用于展示待办信息

**使用场景**:
- 待办列表页面
- 待办详情
- 待办操作

**依赖组件**:
- Button (components/button.md)
- Label (components/label.md)
- StatusBadge (components/status-badge.md)

---

## 视觉规范

### 基础样式

**尺寸**:
- 高度: 自适应
- 宽度: 100%
- 内边距: `DesignTokens.Spacing.md`

**颜色**:
- 背景色: `DesignTokens.Colors.background.primary`
- 边框色: `DesignTokens.Colors.border.primary`
- 文本色: `DesignTokens.Colors.text.primary`

**字体**:
- 标题字体: `DesignTokens.Typography.body`
- 辅助字体: `DesignTokens.Typography.small`

**圆角**:
- 圆角半径: `DesignTokens.CornerRadius.medium`

**阴影**:
- 悬停: `DesignTokens.Shadows.light`

**边框**:
- 宽度: 1px
- 样式: 实线

---

## 状态定义

### 1. Normal (正常)
- **触发条件**: 默认状态
- **视觉**: 标准列表项样式
- **交互**: 可点击查看详情

### 2. Hover (悬停)
- **触发条件**: 鼠标悬停
- **视觉**: 背景色 `DesignTokens.Colors.background.secondary`, 阴影 `DesignTokens.Shadows.light`
- **动画**: 颜色过渡 `DesignTokens.Animation.fast`

### 3. Pressed (按下)
- **触发条件**: 用户点击
- **视觉**: 背景色加深
- **动画**: 时长 `DesignTokens.Animation.fast`

### 4. Selected (选中)
- **触发条件**: 待办被选中
- **视觉**: 背景色 `DesignTokens.Colors.primary`, 透明度 0.1
- **交互**: 显示选中状态

---

## 属性规范

### 必需属性
- `todo`: Todo - 待办数据对象

### 可选属性
- `onClick`: () -> Void? = nil - 点击回调
- `onStatusChange`: (Status) -> Void? = nil - 状态变更回调
- `isSelected`: Bool = false - 是否选中
- `showActions`: Bool = true - 是否显示操作按钮

---

## 交互行为

### Web 平台
- **点击**: 进入待办详情或执行操作
- **双击**: 进入编辑模式
- **右键**: 显示上下文菜单
- **拖拽**: 改变顺序或状态

---

## 无障碍支持

### 键盘导航
- 支持 Tab 键导航
- Enter 键触发点击
- Space 键切换选中状态

### 屏幕阅读器
- **Label**: 待办标题、状态、执行人
- **Role**: listitem

---

## 实现要点

**关键规则**:
- 所有设计值从 DesignTokens 读取
- 支持拖拽排序
- 支持状态切换
- 响应式设计

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

