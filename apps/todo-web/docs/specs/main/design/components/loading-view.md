---
description: "Component specification template"
---

# LoadingView 组件规范

**组件标识**: `LoadingView`  
**类型**: 基础组件  
**复杂度**: 简单  
**最后更新**: 2024-12-19

---

## 组件概述

**用途**: 加载指示器，用于显示数据加载状态

**使用场景**:
- 页面加载
- 数据获取
- 操作处理中
- 骨架屏加载

**依赖组件**:
- 无

---

## 视觉规范

### 基础样式

**尺寸**:
- 指示器大小: 40px x 40px (默认)
- 容器: 自适应

**颜色**:
- 指示器颜色: `DesignTokens.Colors.primary`
- 背景色: 透明或 `DesignTokens.Colors.background.secondary` (骨架屏)

**字体**:
- 字体大小: `DesignTokens.Typography.body`
- 字重: `DesignTokens.Typography.regular`

**圆角**:
- 骨架屏圆角: `DesignTokens.CornerRadius.medium`

**阴影**:
- 无

**边框**:
- 无

---

## 状态定义

### 1. Spinner (旋转指示器)
- **触发条件**: 数据加载中
- **视觉**: 圆形旋转指示器，颜色 `DesignTokens.Colors.primary`
- **动画**: 旋转动画，1s 循环，linear
- **位置**: 居中显示

### 2. Skeleton (骨架屏)
- **触发条件**: 内容加载中
- **视觉**: 灰色占位块，模拟内容布局
- **动画**: 脉冲动画，2s 循环，ease-in-out
- **位置**: 内容区域

### 3. Progress (进度条)
- **触发条件**: 可测量进度的加载
- **视觉**: 进度条，颜色 `DesignTokens.Colors.primary`
- **动画**: 进度值更新
- **位置**: 顶部或指定位置

---

## 属性规范

### 必需属性
- 无（组件自动显示）

### 可选属性
- `type`: LoadingType = .spinner - 加载类型（spinner, skeleton, progress）
- `size`: LoadingSize = .medium - 尺寸（small: 24px, medium: 40px, large: 56px）
- `message`: String? = nil - 加载提示文本
- `progress`: Double? = nil - 进度值（0.0 - 1.0，仅 progress 类型）
- `fullScreen`: Bool = false - 是否全屏显示

---

## 交互行为

### Web 平台
- **无交互**: 纯展示组件，无用户交互
- **自动隐藏**: 加载完成后自动隐藏

---

## 无障碍支持

### 屏幕阅读器
- **Label**: "加载中" 或自定义消息
- **Role**: status
- **Live**: aria-live="polite"

### 动画
- 支持 prefers-reduced-motion，减少动画

---

## 实现要点

**关键规则**:
- 所有设计值从 DesignTokens 读取
- 支持多种加载类型
- 支持无障碍访问
- 动画流畅，性能优化

**测试要点**:
- 加载指示器正确显示
- 动画流畅无卡顿
- 屏幕阅读器正确朗读
- 加载完成后正确隐藏

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

