---
description: "Component specification template"
---

# MemberList 组件规范

**组件标识**: `MemberList`  
**类型**: 复合组件  
**复杂度**: 中等  
**最后更新**: 2024-12-19

---

## 组件概述

**用途**: 在项目详情页面侧边栏显示项目成员列表，支持悬停查看成员参与的待办事项

**使用场景**:
- 项目详情页面侧边栏
- 成员管理页面
- 待办分配时选择执行人

**依赖组件**:
- MemberItem (components/member-item.md)
- Popover (components/popover.md)
- Avatar (components/avatar.md)

---

## 视觉规范

### 基础样式

**尺寸**:
- 宽度: 280px (侧边栏固定宽度)
- 高度: 自适应，最大高度 100vh
- 内边距: 
  - 水平: `DesignTokens.Spacing.md`
  - 垂直: `DesignTokens.Spacing.md`

**颜色**:
- 背景色: `DesignTokens.Colors.background.secondary`
- 边框色: `DesignTokens.Colors.border.primary`
- 文本色: `DesignTokens.Colors.text.primary`

**字体**:
- 标题字体: `DesignTokens.Typography.title4`
- 正文字体: `DesignTokens.Typography.body`

**圆角**:
- 无（侧边栏）

**阴影**:
- 无

**边框**:
- 宽度: 1px
- 样式: 实线
- 位置: 右侧边框

---

## 状态定义

### 1. Normal (正常)
- **触发条件**: 默认状态
- **视觉**: 显示成员列表，每个成员项可悬停
- **交互**: 鼠标悬停成员项时显示气泡提示

### 2. Loading (加载中)
- **触发条件**: 正在加载成员数据
- **视觉**: 显示加载指示器
- **交互**: 无交互

### 3. Empty (空状态)
- **触发条件**: 项目没有成员
- **视觉**: 显示空状态提示
- **交互**: 可点击邀请成员

---

## 属性规范

### 必需属性
- `members`: Array<Member> - 成员列表数据
- `todos`: Array<Todo> - 项目待办列表（用于关联成员）

### 可选属性
- `onMemberClick`: (Member) -> Void? = nil - 成员点击回调
- `onInviteClick`: () -> Void? = nil - 邀请成员回调
- `currentUserId`: Int? = nil - 当前用户ID（高亮显示）

---

## 交互行为

### Web 平台
- **悬停**: 鼠标悬停在成员项上时，显示气泡提示，展示该成员参与的待办事项
- **点击成员**: 执行 onMemberClick 回调（可选）
- **点击邀请**: 执行 onInviteClick 回调，跳转到邀请页面

---

## 无障碍支持

### 键盘导航
- 支持 Tab 键在成员项间导航
- Enter 键触发成员点击

### 屏幕阅读器
- **Label**: "项目成员列表"
- **Role**: list
- **Member Count**: 使用 aria-label 描述成员数量

---

## 实现要点

**关键规则**:
- 所有设计值从 DesignTokens 读取
- 支持悬停显示气泡提示
- 响应式设计，移动端可折叠为抽屉
- 成员项按加入时间或字母顺序排序

**测试要点**:
- 成员列表正确显示
- 悬停气泡正确显示
- 键盘导航正常
- 屏幕阅读器正确朗读

---

**版本**: 1.0.0  
**最后更新**: 2024-12-19

