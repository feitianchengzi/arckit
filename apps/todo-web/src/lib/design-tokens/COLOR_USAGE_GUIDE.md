# 颜色使用指南

## 概述

所有颜色都统一在 `colors.css` 中定义，组件通过 Tailwind 类名使用，无需在每个组件中硬编码颜色值。

## 配色方案

- **浅色模式**：使用标准的灰色和蓝色系
- **深色模式**：基于 Tailwind CSS **Zinc 色阶**，符合 WCAG AA 对比度标准
  - 主背景：`zinc-900` (#18181b) - 避免纯黑色，适合 OLED 屏幕
  - 卡片背景：`zinc-800` (#27272a)
  - 主文本：`zinc-50` (#fafafa) - 高对比度
  - 次要文本：`zinc-400` (#a1a1aa)
  - 主色：`indigo-500` (#6366f1)

## 颜色系统

### 1. 表面颜色 (Surface)
用于背景、卡片、容器等

```tsx
// 主背景
<div className="bg-surface">...</div>

// 卡片/浮层背景
<div className="bg-surface-elevated">...</div>

// 悬停状态
<div className="hover:bg-surface-hover">...</div>

// 激活状态
<div className="active:bg-surface-active">...</div>
```

### 2. 前景颜色 (Foreground)
用于文本、图标等

```tsx
// 主文本
<p className="text-foreground">...</p>

// 次要文本
<p className="text-foreground-secondary">...</p>

// 三级文本
<p className="text-foreground-tertiary">...</p>

// 禁用文本
<p className="text-foreground-disabled">...</p>
```

### 3. 边框和分割线

```tsx
// 边框
<div className="border border-border">...</div>

// 悬停边框
<div className="border border-border-hover">...</div>

// 聚焦边框
<div className="border border-border-focus">...</div>

// 分割线
<div className="border-t border-divider">...</div>
```

### 4. 主色 (Primary)

```tsx
// 主色
<button className="bg-primary text-white">...</button>

// 悬停
<button className="bg-primary hover:bg-primary-hover">...</button>

// 激活
<button className="bg-primary active:bg-primary-active">...</button>

// 浅色背景
<div className="bg-primary-light">...</div>
```

### 5. 语义颜色

```tsx
// 成功
<div className="bg-success-light text-success">...</div>
<button className="bg-success hover:bg-success-hover">...</button>

// 警告
<div className="bg-warning-light text-warning">...</div>
<button className="bg-warning hover:bg-warning-hover">...</button>

// 错误
<div className="bg-error-light text-error">...</div>
<button className="bg-error hover:bg-error-hover">...</button>

// 信息
<div className="bg-info-light text-info">...</div>
<button className="bg-info hover:bg-info-hover">...</button>
```

## 迁移指南

### 旧代码（不推荐）
```tsx
// ❌ 硬编码颜色
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  <p className="text-gray-600 dark:text-gray-400">...</p>
</div>
```

### 新代码（推荐）
```tsx
// ✅ 使用语义化颜色
<div className="bg-surface-elevated text-foreground">
  <p className="text-foreground-secondary">...</p>
</div>
```

## 常见模式

### 卡片组件
```tsx
<div className="bg-surface-elevated border border-border rounded-lg p-6">
  <h2 className="text-foreground font-semibold">标题</h2>
  <p className="text-foreground-secondary">内容</p>
</div>
```

### 按钮组件
```tsx
// 主要按钮
<button className="bg-primary hover:bg-primary-hover text-white">
  确认
</button>

// 次要按钮
<button className="bg-surface-elevated hover:bg-surface-hover text-foreground border border-border">
  取消
</button>
```

### 输入框
```tsx
<input 
  className="bg-surface border border-border focus:border-border-focus text-foreground"
  placeholder="输入内容..."
/>
```

### 列表项
```tsx
<div className="bg-surface-elevated hover:bg-surface-hover border-b border-divider">
  <p className="text-foreground">列表项</p>
</div>
```

## 深色模式

所有颜色都自动支持深色模式，无需添加 `dark:` 前缀。深色模式配色参考了 GitHub Dark 和 VSCode Dark+ 的成熟方案。

## 调试

如果需要调试颜色，只需修改 `colors.css` 文件中的 CSS 变量，所有使用该颜色的组件都会自动更新。

