---
description: "Component specification template"
---

# CommentItem 组件规范

**组件标识**: `CommentItem`  
**类型**: 基础组件  
**复杂度**: 简单  
**最后更新**: 2024-12-19

---

## 组件概述

**用途**: 显示单条评论，支持编辑和删除

**使用场景**:
- 评论列表中的评论项
- 评论详情显示

**依赖组件**:
- Avatar (components/avatar.md)
- Button (components/button.md)

---

## 视觉规范

### 基础样式

**尺寸**:
- 宽度: 100%
- 高度: 自适应
- 内边距: 
  - 水平: `DesignTokens.Spacing.md`
  - 垂直: `DesignTokens.Spacing.md`

**颜色**:
- 背景色: `DesignTokens.Colors.background.primary`
- 悬停背景色: `DesignTokens.Colors.background.secondary`
- 文本色: `DesignTokens.Colors.text.primary`

**字体**:
- 作者字体: `DesignTokens.Typography.body`
- 内容字体: `DesignTokens.Typography.body`
- 时间字体: `DesignTokens.Typography.caption`

**圆角**:
- 圆角半径: `DesignTokens.CornerRadius.medium`

**阴影**:
- 无

**边框**:
- 宽度: 1px
- 样式: 实线
- 位置: 底部边框

---

## 状态定义

### 1. Normal (正常)
- **触发条件**: 默认状态
- **视觉**: 显示评论内容、作者、时间
- **交互**: 悬停显示操作按钮（如果是自己的评论）

### 2. Hover (悬停)
- **触发条件**: 鼠标悬停且是自己的评论
- **视觉**: 显示编辑和删除按钮
- **动画**: 按钮淡入，时长 `DesignTokens.Animation.fast`

### 3. Editing (编辑中)
- **触发条件**: 正在编辑评论
- **视觉**: 输入框替换评论内容
- **交互**: 可保存或取消编辑

---

## 属性规范

### 必需属性
- `comment`: Comment - 评论数据对象

### 可选属性
- `onEdit`: (Comment) -> Void? = nil - 编辑回调
- `onDelete`: (Comment) -> Void? = nil - 删除回调
- `canEdit`: Bool = false - 是否可编辑（自己的评论）

---

## 交互行为

### Web 平台
- **悬停**: 如果是自己的评论，显示编辑和删除按钮
- **编辑**: 点击编辑按钮进入编辑模式
- **删除**: 点击删除按钮，确认后删除
- **@提及**: 点击评论中的@用户名跳转到用户信息

---

## 无障碍支持

### 键盘导航
- 支持 Tab 键导航
- Enter 键触发编辑（如可编辑）

### 屏幕阅读器
- **Label**: 评论作者和内容
- **Role**: article
- **Time**: 使用 time 元素标记时间

---

## 实现要点

**关键规则**:
- 所有设计值从 DesignTokens 读取
- 支持@提及高亮
- 支持编辑和删除权限控制
- 响应式设计

**测试要点**:
- 评论正确显示
- 编辑和删除功能正常
- 权限控制正确
- 键盘导航正常

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

