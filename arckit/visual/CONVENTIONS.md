# ArcOrbit Desktop 视觉规范约定

## 事实边界

- `_library/brief.md` 是视觉策略源。
- `design-tokens.yaml`、`component-catalog.yaml` 和 `style-preview.html` 是策略投影。
- 页面流程由 `arckit/interaction/` 定义，视觉规范不改变导航和状态机。
- Runtime 实现通过 CSS 变量映射 tokens，不在组件中创建平行色值体系。

## 使用约束

- 主工作区保持亮色纸面，左侧控制导航保持深色。
- 紫色只表达当前选择、主操作和活动 Runtime，不表达成功或风险。
- 七种任务状态使用文本标签与语义色共同表达，不能只依赖颜色。
- 阴影只用于浮层、菜单和需要从页面抬升的人工事项。
- 数据表、指标和运行阶段保持紧凑密度，正文阅读区保持舒适行高。
- 所有交互控件提供可见 focus 状态，正文和背景满足 WCAG AA 对比度。
- 危险操作不使用主操作紫色，使用破坏语义色并要求明确文案。
