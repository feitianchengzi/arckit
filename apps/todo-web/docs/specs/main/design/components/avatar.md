---
description: "Component specification template"
---

# Avatar 组件规范

**组件标识**: `Avatar`  
**类型**: 基础组件  
**复杂度**: 简单  
**最后更新**: 2024-12-19

---

## 组件概述

**用途**: 显示用户头像，支持图片或首字母缩写

**使用场景**:
- 成员列表
- 评论作者
- 待办执行人
- 用户信息显示

**依赖组件**:
- 无

---

## 视觉规范

### 基础样式

**尺寸**:
- 小: 24px x 24px
- 中: 32px x 32px
- 大: 48px x 48px
- 默认: 32px x 32px

**颜色**:
- 背景色: 渐变背景（根据用户ID生成）或 `DesignTokens.Colors.primary`
- 文本色: `DesignTokens.Colors.text.primary` (在背景上)

**字体**:
- 字体大小: 根据尺寸调整
- 字重: `DesignTokens.Typography.medium`

**圆角**:
- 圆角半径: 50% (圆形)

**阴影**:
- 无

**边框**:
- 宽度: 2px (可选)
- 颜色: `DesignTokens.Colors.background.primary`

---

## 状态定义

### 1. Normal (正常)
- **触发条件**: 默认状态
- **视觉**: 显示头像图片或首字母
- **交互**: 可点击（可选）

### 2. Hover (悬停)
- **触发条件**: 鼠标悬停
- **视觉**: 缩放 1.05
- **动画**: 缩放过渡 `DesignTokens.Animation.fast`

### 3. Online (在线)
- **触发条件**: 用户在线
- **视觉**: 右下角显示绿色圆点
- **交互**: 无

---

## 属性规范

### 必需属性
- `user`: User - 用户数据对象

### 可选属性
- `size`: AvatarSize = .medium - 尺寸（small, medium, large）
- `showOnline`: Bool = false - 是否显示在线状态
- `onClick`: () -> Void? = nil - 点击回调

---

## 交互行为

### Web 平台
- **点击**: 执行 onClick 回调（如有）
- **悬停**: 显示用户信息提示（可选）

---

## 无障碍支持

### 屏幕阅读器
- **Label**: 用户姓名
- **Role**: img
- **Alt**: 用户姓名头像

---

## 实现要点

**关键规则**:
- 所有设计值从 DesignTokens 读取
- 支持图片和文字两种模式
- 图片加载失败时显示首字母
- 响应式设计

**测试要点**:
- 头像正确显示
- 图片加载失败处理正确
- 在线状态正确显示
- 屏幕阅读器正确朗读

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

