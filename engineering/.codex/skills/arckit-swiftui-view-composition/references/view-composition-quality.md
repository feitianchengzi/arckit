# 页面组合与 UI 质量规则

## 页面拆分策略

拆分 View 时先确定页面的信息架构：

- 页面根容器。
- 顶部区域。
- 主内容区域。
- 工具栏/操作区。
- 空态/错误态/加载态。
- 弹层和二级流程。

拆分后的组件应能用一句话描述职责。说不清职责的组件不要拆。

## 组件输入规则

组件输入应是稳定展示契约：

- 简单值。
- display model。
- `Binding`。
- 用户动作闭包。
- 样式/模式枚举。

避免传入：

- 整个父级 ViewModel。
- service。
- modelContext。
- 与组件展示无关的状态。

## DesignTokens 落地

所有稳定视觉值应经过 DesignTokens：

- 颜色。
- 字体。
- 间距。
- 圆角。
- 阴影。
- 分割线。
- 状态色。

临时调试值不能进入长期代码。若视觉规范缺 token，应补 token，而不是在 View 中散落常量。

## 状态矩阵

复杂页面至少检查：

- loading。
- empty。
- content。
- error。
- permission denied。
- offline / degraded。
- long text。
- Dynamic Type。
- VoiceOver。

状态不一定都要视觉复杂，但必须可理解。

## 可访问性规则

- 图标按钮必须有可读 label。
- 图片有必要时提供描述；纯装饰图应隐藏。
- 动态字体下保持信息层级。
- 关键操作控件触摸区域足够。
- 错误、成功、进度状态能被辅助技术理解。

## Preview 规则

Preview 应覆盖高风险状态：

- 默认状态。
- 长文案。
- 错误状态。
- 空状态。
- 大字体或深色模式，如项目支持。

Preview 不依赖真实网络、不依赖线上账号、不触发真实副作用。

## 检查清单

- 组件职责是否单一？
- 组件输入是否过宽？
- 是否绕过 DesignTokens？
- 状态矩阵是否覆盖主要风险？
- Dynamic Type 是否可用？
- VoiceOver label 是否完整？
- Preview 是否能证明组件可用？
