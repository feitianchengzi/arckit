---
description: "Component specification template"
---

# Select 组件规范

**组件标识**: `Select`  
**类型**: 基础组件  
**复杂度**: 中等  
**最后更新**: 2024-12-19

---

## 组件概述

**用途**: 下拉选择器，用于从多个选项中选择一个值，常用于表单中的角色选择、状态选择等场景

**使用场景**:
- 角色选择（管理员、成员等）
- 状态选择（待处理、进行中、已完成等）
- 分类选择
- 其他需要从预定义选项中选择的场景

**依赖组件**:
- Label (标签)
- Icon (下拉箭头图标)

---

## 视觉规范

### 基础样式

**尺寸**:
- 高度: `DesignTokens.Spacing.xl` (32px)
- 最小宽度: 120px
- 内边距: 
  - 水平: `DesignTokens.Spacing.md`
  - 垂直: `DesignTokens.Spacing.sm`

**颜色**:
- 背景色: `DesignTokens.Colors.background.primary`
- 文本色: `DesignTokens.Colors.text.primary`
- 边框色: `DesignTokens.Colors.border.primary`
- 下拉箭头颜色: `DesignTokens.Colors.text.secondary`

**字体**:
- 字体大小: `DesignTokens.Typography.body`
- 字重: `DesignTokens.Typography.regular`

**圆角**:
- 圆角半径: `DesignTokens.CornerRadius.medium`

**阴影**:
- 下拉菜单: `DesignTokens.Shadows.medium`

**边框**:
- 宽度: 1px
- 样式: 实线

---

## 状态定义

### 1. Normal (正常)
- **触发条件**: 默认状态
- **视觉**: 背景色 `DesignTokens.Colors.background.primary`, 边框色 `DesignTokens.Colors.border.primary`
- **交互**: 可点击，显示下拉箭头
- **无障碍**: Label 描述选择器用途

### 2. Hover (悬停)
- **触发条件**: 鼠标悬停
- **视觉**: 边框色加深，光标 pointer
- **动画**: 颜色过渡 `DesignTokens.Animation.fast`

### 3. Focus (聚焦)
- **触发条件**: 键盘焦点或点击展开
- **视觉**: 边框颜色 `DesignTokens.Colors.primary`, 宽度 2px, outline-offset 2px
- **交互**: 接收键盘输入（方向键选择，Enter 确认）
- **无障碍**: 键盘导航支持

### 4. Disabled (禁用)
- **触发条件**: 组件被禁用
- **视觉**: 不透明度 0.4, 背景色 `DesignTokens.Colors.background.tertiary`, 文本色 `DesignTokens.Colors.text.disabled`
- **交互**: 不可交互，光标 not-allowed
- **无障碍**: aria-disabled="true"

### 5. Open (展开)
- **触发条件**: 下拉菜单展开
- **视觉**: 边框颜色 `DesignTokens.Colors.primary`, 下拉箭头旋转 180 度
- **交互**: 显示选项列表，支持鼠标和键盘选择

### 6. Error (错误)
- **触发条件**: 验证失败
- **视觉**: 边框颜色 `DesignTokens.Colors.error`, 文本色 `DesignTokens.Colors.error`
- **交互**: 显示错误提示信息

---

## 属性规范

### 必需属性
- `options`: [SelectOption] - 选项列表
- `selectedValue`: String? - 当前选中的值
- `onSelectionChange`: (String?) -> Void - 选择变化回调

### 可选属性
- `label`: String? = nil - 标签文本
- `placeholder`: String? = nil - 占位符文本
- `isDisabled`: Bool = false - 是否禁用
- `errorMessage`: String? = nil - 错误提示信息
- `fullWidth`: Bool = false - 是否全宽

### SelectOption 结构
```typescript
interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}
```

---

## 交互行为

### Web 平台

**展开/收起**:
- 点击选择器: 展开下拉菜单
- 点击外部区域: 收起下拉菜单
- ESC 键: 收起下拉菜单

**选择选项**:
- 鼠标点击: 选择选项并收起菜单
- 键盘方向键: 上下移动高亮选项
- Enter 键: 确认选择当前高亮选项
- Tab 键: 收起菜单并移动到下一个元素

**搜索过滤** (可选):
- 输入文本: 过滤选项列表（如果启用搜索功能）

---

## 下拉菜单样式

### 菜单容器
- **背景色**: `DesignTokens.Colors.background.primary`
- **边框**: 1px 实线，颜色 `DesignTokens.Colors.border.primary`
- **圆角**: `DesignTokens.CornerRadius.medium`
- **阴影**: `DesignTokens.Shadows.medium`
- **最大高度**: 200px，超出显示滚动条
- **内边距**: `DesignTokens.Spacing.xs` (垂直)

### 选项样式
- **高度**: `DesignTokens.Spacing.xl * 1.5` (48px)
- **内边距**: 水平 `DesignTokens.Spacing.md`, 垂直 `DesignTokens.Spacing.sm`
- **悬停状态**: 背景色 `DesignTokens.Colors.background.tertiary`
- **选中状态**: 背景色 `DesignTokens.Colors.primary`, 透明度 0.1, 文本色 `DesignTokens.Colors.primary`
- **禁用状态**: 不透明度 0.4, 文本色 `DesignTokens.Colors.text.disabled`

---

## 无障碍支持

### 键盘导航
- 支持 Tab 键导航到选择器
- 方向键上下选择选项
- Enter 键确认选择
- ESC 键取消/收起
- 聚焦时明确视觉指示

### 屏幕阅读器
- **Label**: 使用 label 元素或 aria-label
- **Role**: combobox
- **State**: 
  - aria-expanded: true/false (展开/收起状态)
  - aria-disabled: true (禁用状态)
  - aria-invalid: true (错误状态)
- **Value**: aria-valuenow 或 aria-label 描述当前选中值

### 色彩对比度
- 文本与背景对比度: 至少 4.5:1 (符合 WCAG AA)
- 选中状态与背景对比度: 至少 3:1
- Dark Mode 下符合对比度要求

---

## 实现要点

**关键规则**:
- 所有设计值从 DesignTokens 读取
- 实现所有状态 (Normal, Hover, Focus, Disabled, Open, Error)
- 支持键盘导航和屏幕阅读器
- 下拉菜单定位：自动计算位置，避免超出视口

**性能优化**:
- 使用 CSS transform 实现下拉动画（GPU 加速）
- 虚拟滚动（如果选项过多，超过 50 个）

**测试要点**:
- 所有状态正确显示
- 下拉菜单动画流畅
- 键盘导航正常
- 屏幕阅读器正确朗读
- 选项选择功能正常

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

