---
description: "Component specification template"
---

# MemberItem 组件规范

**组件标识**: `MemberItem`  
**类型**: 基础组件  
**复杂度**: 简单  
**最后更新**: 2024-12-19

---

## 组件概述

**用途**: 显示单个项目成员信息，支持悬停显示该成员参与的待办事项气泡

**使用场景**:
- 成员列表中的成员项
- 待办执行人显示
- 评论作者显示

**依赖组件**:
- Avatar (components/avatar.md)
- Popover (components/popover.md)

---

## 视觉规范

### 基础样式

**尺寸**:
- 高度: 56px
- 宽度: 100%
- 内边距: 
  - 水平: `DesignTokens.Spacing.md`
  - 垂直: `DesignTokens.Spacing.sm`

**颜色**:
- 背景色: `DesignTokens.Colors.background.primary`
- 悬停背景色: `DesignTokens.Colors.background.secondary`
- 文本色: `DesignTokens.Colors.text.primary`

**字体**:
- 姓名字体: `DesignTokens.Typography.body`
- 邮箱字体: `DesignTokens.Typography.small`

**圆角**:
- 圆角半径: `DesignTokens.CornerRadius.medium`

**阴影**:
- 悬停时: `DesignTokens.Shadows.light`

**边框**:
- 无

---

## 状态定义

### 1. Normal (正常)
- **触发条件**: 默认状态
- **视觉**: 显示成员头像、姓名、邮箱
- **交互**: 可悬停显示气泡

### 2. Hover (悬停)
- **触发条件**: 鼠标悬停
- **视觉**: 背景色变化，显示气泡提示
- **动画**: 背景色过渡 `DesignTokens.Animation.fast`
- **气泡**: 显示该成员参与的待办事项列表

### 3. Selected (选中)
- **触发条件**: 成员被选中（如分配待办时）
- **视觉**: 背景色 `DesignTokens.Colors.primary`，透明度 0.1
- **交互**: 显示选中状态

---

## 属性规范

### 必需属性
- `member`: Member - 成员数据对象
- `memberTodos`: Array<Todo> - 该成员参与的待办事项列表

### 可选属性
- `onClick`: () -> Void? = nil - 点击回调
- `isSelected`: Bool = false - 是否选中
- `showEmail`: Bool = true - 是否显示邮箱

---

## 交互行为

### Web 平台
- **悬停**: 显示气泡提示，展示成员参与的待办事项
- **点击**: 执行 onClick 回调（如有）
- **气泡交互**: 
  - 点击待办项 → 跳转到待办详情
  - 点击快速评论 → 打开评论输入框

---

## 无障碍支持

### 键盘导航
- 支持 Tab 键导航
- Enter 键触发点击

### 屏幕阅读器
- **Label**: 成员姓名和邮箱
- **Role**: listitem
- **Hint**: "悬停查看参与的待办事项"

---

## 实现要点

**关键规则**:
- 所有设计值从 DesignTokens 读取
- 悬停时延迟 300ms 显示气泡（避免误触）
- 气泡位置自动调整，避免超出视口
- 支持键盘导航和屏幕阅读器

**测试要点**:
- 成员信息正确显示
- 悬停气泡正确显示
- 待办列表正确关联
- 键盘导航正常

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

