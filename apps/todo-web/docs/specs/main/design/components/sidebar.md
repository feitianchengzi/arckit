---
description: "Component specification template"
---

# Sidebar 组件规范

**组件标识**: `Sidebar`  
**类型**: 布局组件  
**复杂度**: 复杂  
**最后更新**: 2024-12-19

---

## 组件概述

**用途**: 左侧固定导航栏，包含用户信息、设置入口和主要功能导航项，采用侧边栏布局（Sidebar Layout）模式

**使用场景**:
- 应用主布局容器
- 全局导航和功能入口
- 用户信息展示和设置入口

**依赖组件**:
- Avatar (用户头像)
- Button (功能项按钮)
- Icon (图标)

---

## 视觉规范

### 基础样式

**尺寸**:
- 宽度: `DesignTokens.Spacing.3xl * 2` (256px) - 桌面端固定
- 高度: 100vh (全屏高度)
- 内边距: 
  - 顶部: `DesignTokens.Spacing.lg`
  - 水平: `DesignTokens.Spacing.md`
  - 底部: `DesignTokens.Spacing.lg`

**颜色**:
- 背景色: `DesignTokens.Colors.background.secondary`
- 边框色: `DesignTokens.Colors.border.primary` (右侧边框)
- 文本色: `DesignTokens.Colors.text.primary`

**字体**:
- 字体大小: `DesignTokens.Typography.body`
- 字重: `DesignTokens.Typography.regular`

**阴影**:
- 右侧阴影: `DesignTokens.Shadows.light` (分隔主内容区)

**边框**:
- 右侧边框: 1px 实线，颜色 `DesignTokens.Colors.border.primary`

---

## 结构组成

### 1. 用户头像区域 (User Profile Section)

**位置**: 侧边栏顶部

**内容**:
- 用户头像 (Avatar 组件)
- 用户名显示
- 用户状态指示器（可选）

**样式**:
- 内边距: `DesignTokens.Spacing.md`
- 背景色: `DesignTokens.Colors.background.primary`
- 圆角: `DesignTokens.CornerRadius.medium`
- 底部间距: `DesignTokens.Spacing.lg`

**交互**:
- 点击头像区域: 打开用户信息菜单或跳转到个人设置

### 2. 设置入口 (Settings Entry)

**位置**: 用户头像区域下方

**内容**:
- 设置图标
- "设置"文本标签

**样式**:
- 高度: `DesignTokens.Spacing.xl * 1.5` (48px)
- 内边距: 水平 `DesignTokens.Spacing.md`, 垂直 `DesignTokens.Spacing.sm`
- 圆角: `DesignTokens.CornerRadius.medium`
- 底部间距: `DesignTokens.Spacing.md`

**交互**:
- 点击: 打开设置页面或设置菜单
- 悬停: 背景色 `DesignTokens.Colors.background.tertiary`

### 3. 功能导航项 (Navigation Items)

**位置**: 设置入口下方，可滚动区域

**内容**:
- 多个功能项，自上而下排列
- 每个功能项包含：
  - 图标（左侧）
  - 文本标签
  - 选中状态指示器（可选）

**样式**:
- 每个功能项高度: `DesignTokens.Spacing.xl * 1.5` (48px)
- 内边距: 水平 `DesignTokens.Spacing.md`, 垂直 `DesignTokens.Spacing.sm`
- 圆角: `DesignTokens.CornerRadius.medium`
- 功能项间距: `DesignTokens.Spacing.xs`
- 选中状态: 背景色 `DesignTokens.Colors.primary`, 透明度 0.1, 文本色 `DesignTokens.Colors.primary`

**交互**:
- 点击: 切换功能视图，更新主内容区
- 悬停: 背景色 `DesignTokens.Colors.background.tertiary`
- 选中: 显示选中状态，背景色和文本色变化

---

## 状态定义

### 1. Normal (正常)
- **触发条件**: 默认状态
- **视觉**: 背景色 `DesignTokens.Colors.background.secondary`, 右侧边框和阴影
- **交互**: 所有功能项可点击
- **无障碍**: 支持键盘导航

### 2. Collapsed (收起) - 仅平板/移动端
- **触发条件**: 屏幕宽度 < 1024px
- **视觉**: 侧边栏隐藏，通过菜单按钮触发显示
- **交互**: 点击菜单按钮展开侧边栏（抽屉模式）
- **动画**: 从左侧滑入，时长 `DesignTokens.Animation.standard`

### 3. Overlay (遮罩模式) - 仅平板/移动端
- **触发条件**: 侧边栏展开时（平板/移动端）
- **视觉**: 主内容区显示半透明遮罩层，背景色 `DesignTokens.Colors.background.primary`, 透明度 0.5
- **交互**: 点击遮罩层关闭侧边栏
- **动画**: 遮罩淡入淡出，时长 `DesignTokens.Animation.standard`

---

## 属性规范

### 必需属性
- `user`: User - 当前用户信息
- `navigationItems`: [NavigationItem] - 功能导航项列表
- `selectedItem`: NavigationItem? - 当前选中的功能项
- `onItemSelect`: (NavigationItem) -> Void - 功能项选择回调

### 可选属性
- `isCollapsed`: Bool = false - 是否收起（平板/移动端）
- `onToggleCollapse`: (() -> Void)? = nil - 切换收起状态回调
- `settingsAction`: (() -> Void)? = nil - 设置入口点击回调
- `userProfileAction`: (() -> Void)? = nil - 用户头像点击回调

### NavigationItem 结构
```typescript
interface NavigationItem {
  id: string
  label: string
  icon: Icon
  route: string
  badge?: number // 可选徽章数字
}
```

---

## 交互行为

### Web 平台

**桌面端 (>1024px)**:
- 侧边栏固定显示，不可收起
- 点击功能项: 更新选中状态，切换主内容区视图
- 悬停功能项: 显示悬停状态
- 键盘导航: Tab 键在功能项间导航，Enter 键选中

**平板端 (768px-1024px)**:
- 侧边栏默认收起
- 点击菜单按钮: 展开侧边栏（覆盖模式）
- 点击遮罩层: 收起侧边栏
- 点击功能项: 选中并自动收起侧边栏

**移动端 (<768px)**:
- 侧边栏转换为抽屉菜单
- 从左侧滑入，覆盖整个屏幕
- 支持手势滑动关闭
- 点击功能项: 选中并自动关闭抽屉

### 响应式断点
- 桌面端: > 1024px - 固定显示
- 平板端: 768px - 1024px - 可折叠
- 移动端: < 768px - 抽屉模式

---

## 无障碍支持

### 键盘导航
- 支持 Tab 键在功能项间导航
- Enter 或 Space 键选中功能项
- ESC 键关闭侧边栏（移动端/平板端）
- 聚焦时明确视觉指示

### 屏幕阅读器
- **Role**: navigation
- **Label**: "主导航" 或 "侧边栏导航"
- **State**: 选中项使用 aria-current="page"
- **Landmark**: 使用 `<nav>` 元素包裹

### 色彩对比度
- 文本与背景对比度: 至少 4.5:1 (符合 WCAG AA)
- 选中状态与背景对比度: 至少 3:1
- Dark Mode 下符合对比度要求

---

## 实现要点

**关键规则**:
- 所有设计值从 DesignTokens 读取
- 响应式设计，适配桌面/平板/移动端
- 支持键盘导航和屏幕阅读器
- 动画流畅，使用 DesignTokens.Animation 规范

**布局实现**:
- 使用 Flexbox 或 Grid 布局
- 固定定位（桌面端）或绝对定位（移动端）
- 主内容区自动计算左侧边距

**性能优化**:
- 使用 CSS transform 实现动画（GPU 加速）
- 避免重排和重绘
- 虚拟滚动（如果功能项过多）

**测试要点**:
- 所有断点下布局正确
- 动画流畅无卡顿
- 键盘导航正常
- 屏幕阅读器正确朗读
- 触摸手势正常（移动端）

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

