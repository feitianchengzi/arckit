---
description: "Component specification template"
---

# CommentSection 组件规范

**组件标识**: `CommentSection`  
**类型**: 复合组件  
**复杂度**: 中等  
**最后更新**: 2024-12-19

---

## 组件概述

**用途**: 在待办详情页面显示和管理评论，支持添加、查看、编辑评论

**使用场景**:
- 待办详情页面
- 快速评论（从成员气泡中触发）

**依赖组件**:
- TextField (components/text-field.md)
- Button (components/button.md)
- CommentItem (components/comment-item.md)
- Avatar (components/avatar.md)

---

## 视觉规范

### 基础样式

**尺寸**:
- 宽度: 100%
- 高度: 自适应
- 内边距: 
  - 水平: `DesignTokens.Spacing.lg`
  - 垂直: `DesignTokens.Spacing.lg`

**颜色**:
- 背景色: `DesignTokens.Colors.background.primary`
- 边框色: `DesignTokens.Colors.border.primary`
- 文本色: `DesignTokens.Colors.text.primary`

**字体**:
- 标题字体: `DesignTokens.Typography.title4`
- 正文字体: `DesignTokens.Typography.body`
- 时间字体: `DesignTokens.Typography.caption`

**圆角**:
- 圆角半径: `DesignTokens.CornerRadius.medium`

**阴影**:
- 无

**边框**:
- 宽度: 1px
- 样式: 实线
- 位置: 顶部边框

---

## 状态定义

### 1. Normal (正常)
- **触发条件**: 默认状态
- **视觉**: 显示评论列表和评论输入框
- **交互**: 可添加新评论，查看已有评论

### 2. Empty (空状态)
- **触发条件**: 还没有评论
- **视觉**: 显示空状态提示和评论输入框
- **交互**: 可添加第一条评论

### 3. Loading (加载中)
- **触发条件**: 正在加载评论数据
- **视觉**: 显示加载指示器
- **交互**: 无交互

### 4. Submitting (提交中)
- **触发条件**: 正在提交评论
- **视觉**: 输入框禁用，显示加载状态
- **交互**: 不可提交

---

## 属性规范

### 必需属性
- `comments`: Array<Comment> - 评论列表数据
- `onSubmit`: (String) -> Void - 提交评论回调

### 可选属性
- `currentUserId`: Int? = nil - 当前用户ID（用于判断是否可编辑/删除）
- `placeholder`: String = "添加评论..." - 输入框占位符
- `maxLength`: Int? = 1000 - 最大字符数

---

## 交互行为

### Web 平台
- **输入**: 在输入框中输入评论内容
- **提交**: 点击提交按钮或按 Ctrl+Enter 提交
- **编辑**: 点击自己的评论可编辑
- **删除**: 点击自己的评论可删除（需确认）
- **快速评论**: 从成员气泡中触发，自动填充@成员

---

## 无障碍支持

### 键盘导航
- 支持 Tab 键导航到输入框
- Ctrl+Enter 提交评论
- Esc 取消编辑

### 屏幕阅读器
- **Label**: "评论区域"
- **Role**: region
- **Live**: aria-live="polite"（新评论时）

---

## 实现要点

**关键规则**:
- 所有设计值从 DesignTokens 读取
- 支持@提及成员
- 支持富文本（可选）
- 实时更新评论列表

**测试要点**:
- 评论正确显示
- 提交功能正常
- 编辑和删除功能正常
- 键盘导航正常

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

