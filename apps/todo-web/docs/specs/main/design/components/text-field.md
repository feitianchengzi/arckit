---
description: "Component specification template"
---

# TextField 组件规范

**组件标识**: `TextField`  
**类型**: 基础组件  
**复杂度**: 中等  
**最后更新**: 2024-12-19

---

## 组件概述

**用途**: 文本输入框，用于用户输入文本信息

**使用场景**:
- 表单输入
- 搜索框
- 文本编辑
- 密码输入

**依赖组件**:
- Label (可选，用于标签)
- ErrorView (用于错误提示)

---

## 视觉规范

### 基础样式

**尺寸**:
- 高度: `DesignTokens.Spacing.xl` (32px)
- 宽度: 100% (容器宽度)
- 内边距: 
  - 水平: `DesignTokens.Spacing.md`
  - 垂直: `DesignTokens.Spacing.sm`

**颜色**:
- 背景色: `DesignTokens.Colors.background.primary`
- 文本色: `DesignTokens.Colors.text.primary`
- 边框色: `DesignTokens.Colors.border.primary`
- 占位符色: `DesignTokens.Colors.text.secondary`

**字体**:
- 字体大小: `DesignTokens.Typography.body`
- 字重: `DesignTokens.Typography.regular`

**圆角**:
- 圆角半径: `DesignTokens.CornerRadius.medium`

**阴影**:
- 聚焦时: `DesignTokens.Shadows.light`

**边框**:
- 宽度: 1px
- 样式: 实线

---

## 状态定义

### 1. Normal (正常)
- **触发条件**: 默认状态
- **视觉**: 边框色 `DesignTokens.Colors.border.primary`, 背景色 `DesignTokens.Colors.background.primary`
- **交互**: 可输入

### 2. Hover (悬停)
- **触发条件**: 鼠标悬停
- **视觉**: 边框色加深，光标 text
- **动画**: 颜色过渡 `DesignTokens.Animation.fast`

### 3. Focus (聚焦)
- **触发条件**: 获得焦点
- **视觉**: 边框色 `DesignTokens.Colors.primary`, 宽度 2px, 阴影 `DesignTokens.Shadows.light`
- **交互**: 接收键盘输入
- **无障碍**: 屏幕阅读器聚焦

### 4. Disabled (禁用)
- **触发条件**: 组件被禁用
- **视觉**: 不透明度 0.6, 背景色 `DesignTokens.Colors.background.secondary`, 文本色 `DesignTokens.Colors.text.disabled`
- **交互**: 不可输入，光标 not-allowed
- **无障碍**: aria-disabled="true"

### 5. Error (错误)
- **触发条件**: 验证失败
- **视觉**: 边框色 `DesignTokens.Colors.error`, 宽度 2px
- **交互**: 显示错误消息
- **无障碍**: aria-invalid="true", aria-describedby 指向错误消息

### 6. Success (成功)
- **触发条件**: 验证通过
- **视觉**: 边框色 `DesignTokens.Colors.success`, 宽度 2px
- **交互**: 显示成功图标（可选）

---

## 属性规范

### 必需属性
- `value`: String - 输入值
- `onChange`: (String) -> Void - 值变更回调

### 可选属性
- `label`: String? = nil - 标签文本
- `placeholder`: String? = nil - 占位符文本
- `type`: InputType = .text - 输入类型（text, email, password, number, etc.）
- `isDisabled`: Bool = false - 是否禁用
- `isRequired`: Bool = false - 是否必填
- `errorMessage`: String? = nil - 错误消息
- `helperText`: String? = nil - 帮助文本
- `maxLength`: Int? = nil - 最大长度
- `autoFocus`: Bool = false - 自动聚焦

---

## 交互行为

### Web 平台
- **输入**: 实时更新 value，触发 onChange
- **聚焦**: 显示聚焦状态，光标定位
- **失焦**: 触发验证（如有）
- **键盘**: 支持所有标准键盘输入

---

## 无障碍支持

### 键盘导航
- 支持 Tab 键导航
- 聚焦时明确视觉指示
- 支持键盘输入

### 屏幕阅读器
- **Label**: 使用 label 元素或 aria-label
- **Role**: textbox
- **State**: 错误时 aria-invalid="true"
- **Description**: 使用 aria-describedby 关联错误消息或帮助文本

### 色彩对比度
- 文本与背景对比度: 至少 4.5:1
- 占位符文本对比度: 至少 3:1

---

## 实现要点

**关键规则**:
- 所有设计值从 DesignTokens 读取
- 实现所有状态 (Normal, Hover, Focus, Disabled, Error, Success)
- 支持键盘导航和屏幕阅读器
- 实时验证和错误提示

**测试要点**:
- 所有状态正确显示
- 输入验证正常工作
- 键盘导航正常
- 屏幕阅读器正确朗读

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

