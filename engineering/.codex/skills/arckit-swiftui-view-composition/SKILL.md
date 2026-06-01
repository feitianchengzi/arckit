---
name: arckit-swiftui-view-composition
description: SwiftUI 页面组织、组件拆分和设计系统落地 skill。用于 View 拆分、组件边界、DesignTokens、Dynamic Type、VoiceOver、国际化布局、Preview、空/加载/错误/成功状态、视觉规范映射到 SwiftUI。用户提到页面太大、组件怎么拆、设计系统、视觉落地、无障碍、动态字体、多语言、Preview、UI 状态覆盖时使用。
---

# ArcKit SwiftUI View Composition

## 目标

把产品、交互、视觉要求落到可维护 SwiftUI 页面和组件中，明确 View 拆分、组件输入、DesignTokens、状态矩阵、Preview、可访问性和多语言布局。

## 执行流程

1. 先读取项目的 spec、interaction、visual 文档；没有时从当前页面和代码推断最小 UI 事实。
2. 列出页面主要区域和状态矩阵：loading、empty、content、error、permission、offline、long text、Dynamic Type。
3. 判断拆分边界：按视觉/功能区域、复用需求、状态复杂度拆，不按控件数量机械拆。
4. 定义组件输入：display model、简单值、Binding、动作闭包；避免传入整个父级状态对象。
5. 将颜色、字体、间距、圆角等稳定值接到 DesignTokens。
6. 补关键 Preview 或等价验证，覆盖长文本、错误、空态和大字体。

## 读取资源

- 页面拆分和质量规则：`references/view-composition-quality.md`
- View 组织代码模式：`references/code-patterns.md`
- DesignTokens 规则：`references/design-tokens.md`

## 拆分判断

考虑拆分：

- `body` 超过 150 行。
- 条件渲染嵌套超过 3 层。
- 有 Header、Toolbar、Content、Footer、Card 等明确区域。
- UI 模式需要复用。
- 组件有独立状态矩阵或 Preview 价值。

不必拆分：

- 几行简单布局。
- 拆出去后需要传大量无关状态。
- 只是为了“一文件一个小控件”。

## 最低交付标准

- 页面/组件职责能一句话说明。
- 主要 UI 状态有可理解表现。
- 稳定视觉值来自 DesignTokens 或项目设计系统。
- 关键交互控件有可访问 label。
- 长文本、Dynamic Type、多语言不破坏主布局。

## 降级/停止条件

- 纯业务逻辑改动不强行重组 UI。
- 已有设计系统组件可复用时，不重写同类组件。
- 临时验证 UI 不需要完整状态矩阵，但不能污染长期代码。
