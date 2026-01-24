# 颜色使用避坑指南

## ⚠️ 重要规则

1. **禁止在背景色中使用高透明度（如 `bg-black/30`、`bg-white/50` 等）**
2. **必须检查颜色是否正确绑定到控件上**

## 问题说明

### 问题 1: 透明色导致视觉混乱

使用高透明度的背景色会导致：
1. 在浅色模式下，透明背景会显示底层内容，造成视觉混乱
2. 在深色模式下，透明背景可能不够明显，影响可读性
3. 不同设备上的渲染效果不一致

### 问题 2: Tailwind 类名可能未正确绑定

**根本原因：**
- Tailwind CSS 的自定义颜色类（如 `bg-surface-elevated`、`bg-surface`）可能因为以下原因未正确应用：
  1. Tailwind 编译时未正确生成这些类
  2. CSS 优先级问题，其他样式覆盖了这些类
  3. 类名拼写错误或配置问题
  4. 动态类名在运行时未正确解析

**症状：**
- 背景色显示为透明或默认值
- 浅色模式下显示深色，深色模式下显示浅色
- 颜色完全不显示

**解决方案：**
- **优先使用内联样式直接绑定 CSS 变量**，确保颜色正确应用
- 如果必须使用 Tailwind 类，修改后必须检查实际渲染效果

## ✅ 正确做法

### 1. 遮罩层（Overlay）

**错误示例：**
```tsx
<div className="bg-black/30 dark:bg-black/50" />
```

**正确做法：**
```tsx
// 使用固定不透明度，不使用 Tailwind 的透明度语法
<div className="bg-black opacity-30" />
```

### 2. 背景色 - 优先使用内联样式

**❌ 错误示例 1：使用 Tailwind 类（可能未正确绑定）**
```tsx
<div className="bg-surface-elevated" />
<div className="bg-surface" />
```

**❌ 错误示例 2：使用透明色**
```tsx
<div style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} />
<div className="bg-white/80" />
```

**✅ 正确做法：使用内联样式直接绑定 CSS 变量**
```tsx
// 推荐：使用内联样式确保颜色正确绑定
<div style={{ backgroundColor: 'var(--color-surface-elevated)' }} />
<div style={{ backgroundColor: 'var(--color-surface)' }} />
<div style={{ backgroundColor: 'var(--color-surface-hover)' }} />
```

**✅ 备选方案：如果必须使用 Tailwind 类，修改后必须验证**
```tsx
// 使用 Tailwind 类后，必须在浏览器中检查实际渲染效果
// 如果颜色未正确显示，立即改为内联样式
<div className="bg-surface-elevated" />
```

### 3. 卡片背景

**❌ 错误示例：硬编码颜色值**
```tsx
<div style={{ backgroundColor: '#1f1f23' }} /> // 硬编码深色值，浅色模式会显示错误
```

**❌ 错误示例：使用 Tailwind 类但未验证**
```tsx
<div className="bg-surface" /> // 可能未正确绑定，导致透明
```

**✅ 正确做法：使用内联样式绑定 CSS 变量**
```tsx
// 使用内联样式直接绑定，确保浅色/深色模式都正确
<div style={{ backgroundColor: 'var(--color-surface)' }} />
// 浅色模式：白色 (#ffffff)
// 深色模式：深灰色 (#18181b)
```

### 4. 边框颜色

**✅ 正确做法：**
```tsx
// 使用内联样式确保边框颜色正确绑定
<div style={{ borderColor: 'var(--color-border)' }} />
<div style={{ borderBottomColor: 'var(--color-divider)' }} />
```

**✅ 备选方案：使用 Tailwind 类（需验证）**
```tsx
<div className="border border-border" />
<div className="border-b border-divider" />
```

## 📋 可用颜色类

所有颜色定义在 `src/lib/design-tokens/colors.css` 中：

### 表面颜色（Surface）
- `bg-surface` - 主背景（浅色：白色，深色：zinc-900）
- `bg-surface-elevated` - 卡片/浮层背景（浅色：白色，深色：zinc-800）
- `bg-surface-hover` - 悬停状态（浅色：gray-50，深色：zinc-700）
- `bg-surface-active` - 激活状态（浅色：gray-100，深色：zinc-600）
- `bg-surface-disabled` - 禁用状态

### 前景颜色（Foreground）
- `text-foreground` - 主文本
- `text-foreground-secondary` - 次要文本
- `text-foreground-tertiary` - 三级文本
- `text-foreground-disabled` - 禁用文本

### 边框颜色（Border）
- `border-border` - 边框
- `border-divider` - 分割线

## 🚫 禁止使用的模式

1. ❌ `bg-black/30`、`bg-white/50` 等 Tailwind 透明度语法
2. ❌ `rgba()` 或 `hsla()` 带透明度的颜色值
3. ❌ 硬编码的深色/浅色颜色值（如 `#1f1f23`、`#ffffff`）
4. ❌ `backdrop-blur` 配合透明背景（除非有特殊设计需求）
5. ❌ **仅使用 Tailwind 类而不验证颜色是否正确绑定**（必须检查实际渲染效果）

## ✅ 允许的例外情况

1. **遮罩层（Overlay）**：可以使用 `bg-black opacity-30` 或 `bg-black opacity-50`（固定不透明度，不使用 Tailwind 透明度语法）
2. **阴影**：可以使用 `shadow-*` 类，它们本身带有透明度，但这是设计系统的一部分

## 📝 检查清单

在提交代码前，检查：
- [ ] 没有使用 `bg-*/[0-9]` 或 `text-*/[0-9]` 透明度语法
- [ ] 没有使用 `rgba()` 或 `hsla()` 带透明度的颜色
- [ ] **所有背景色都使用内联样式绑定 CSS 变量**（`style={{ backgroundColor: 'var(--color-*)' }}`）
- [ ] 如果使用 Tailwind 类，已在浏览器中验证颜色正确显示
- [ ] 所有文本颜色都使用语义化颜色类（`text-foreground-*`）或内联样式
- [ ] 所有边框颜色都使用语义化颜色类（`border-*`）或内联样式
- [ ] **在浅色和深色模式下都测试了颜色显示效果**

## 🔍 如何查找问题

### 代码检查

使用以下命令查找可能的问题：

```bash
# 查找透明度语法
grep -r "bg-.*/[0-9]" src/
grep -r "text-.*/[0-9]" src/

# 查找 rgba/hsla
grep -r "rgba\|hsla" src/

# 查找硬编码颜色值
grep -r "#[0-9a-fA-F]\{6\}" src/

# 查找可能未正确绑定的 Tailwind 类（需要手动检查）
grep -r "bg-surface" src/
grep -r "bg-surface-elevated" src/
```

### 运行时检查

在浏览器开发者工具中检查：
1. **检查元素的实际背景色**：
   - 打开开发者工具（F12）
   - 选择元素
   - 在 "Computed" 标签中查看 `background-color` 的实际值
   - 如果显示 `transparent` 或意外的颜色，说明未正确绑定

2. **检查 CSS 变量是否正确加载**：
   - 在 "Computed" 标签中查看 CSS 变量（如 `--color-surface-elevated`）
   - 确认变量值是否正确

3. **切换浅色/深色模式测试**：
   - 确保在两种模式下颜色都正确显示
   - 如果浅色模式显示深色，或深色模式显示浅色，说明颜色未正确绑定

## 💡 最佳实践

1. **优先使用内联样式**：对于关键的颜色（如背景色、边框色），优先使用内联样式直接绑定 CSS 变量
2. **修改后立即验证**：每次修改颜色相关代码后，立即在浏览器中检查实际效果
3. **双模式测试**：在浅色和深色模式下都测试颜色显示
4. **使用语义化变量**：始终使用 `var(--color-*)` 而不是硬编码颜色值

