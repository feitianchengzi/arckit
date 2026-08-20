# Engineering Profile - 交互规范

## 交互策略

Engineering 是 Domain Profile 的管理工作台。用户在这里选择、建立、复制和编辑 Profile，把当前领域的 State Model、Capability Mapping 与 Lifecycle Mapping 作为一组管理；确认应用后，同一套 Loop Kernel 与产品生命周期可以解释并推进不同团队或行业的工作。

页面不把 `using-arckit`、`arckit-development-ledger` 或其他 entry capability 列为 Profile skills。它们属于所有领域共用的 Loop 控制与可信提交内核，不是软件工程领域中可替换的事实维护能力。

当前交互是管理能力示意。编辑控件、变更预览和 Apply 确认均可见，但不保存草稿、不安装 skill、不迁移既有 Case，也不改变真实 Project State。

## 页面结构

- 顶部展示当前激活 Profile、目标组织、版本状态，以及“新建 Profile”“复制为草稿”和“Review & Apply”管理动作。
- Profile Library 展示当前项、团队草稿和行业模板；选择条目会切换中间编辑器的预览内容。
- State Model 编辑器展示 Project State 与 Case State 两组领域定义，支持添加定义、调整证据要求、替换分类和标记继承项。
- Capability Mapping 按“预期事实”“实现现状”“问题定位”三个槽位展示领域能力，支持添加、替换、移除和查看事实源契约。
- Lifecycle Mapping 固定展示 Idea → Work → Automation → Release → Operations → Feedback，并允许为各阶段配置当前领域的对象解释和完成证据。
- Change Preview 汇总 State、Capabilities、Lifecycle 和目标团队的差异，并在 Apply 前显示兼容性、作用范围与回退版本。
- Stable Kernel 区明确列出不会随 Profile 改变的责任、事实、证据、Gap、handoff、review 和 transition 边界。

## 主路径

1. 用户从 Organization 组进入 Engineering，默认选中当前激活的 Software Engineering Profile。
2. 用户选择“复制为草稿”或行业模板，形成一个未保存的 Profile 编辑上下文。
3. 用户分别编辑 State Model、Capability Mapping 和 Lifecycle Mapping；每项修改即时进入 Change Preview。
4. 用户比较 Software Engineering 与 Campaign Operations、Research Program 等候选 Profile，确认哪些领域定义和能力被替换、哪些 Kernel 与流程保持稳定。
5. 用户选择“Review & Apply”，查看目标团队、兼容性、既有 Case 处理和回退版本。
6. 用户确认 Apply；当前示意显示“不会保存或应用”的反馈，不产生真实写入。

## 状态与反馈

- 当前 Profile 标记为 Active；草稿显示未保存修改；模板显示适用领域和可复制状态。
- State 或 Capability 未满足 Profile 完整性要求时，Apply 显示校验缺口和对应编辑入口。
- 切换 Profile 时保留当前草稿并要求确认，避免静默丢失编辑内容。
- 预期事实与实现现状分开展示，任何一方都不能替代另一方。
- 发现偏差但根因未知时，问题定位能力显示从症状、复现、证据到根因的职责，不把猜测显示为事实。
- 缺少某类领域能力时显示能力缺口，不退化为 entry skill 或 Worker registry。
- Apply 预览必须区分新增、替换、移除和保持不变，并显示对新工作与既有 Case 的不同影响。

## 边界

Engineering 编辑 Domain Profile 草稿，而不是直接修改 canonical Project/Case record。当前页面不执行真实草稿保存、skill 安装或同步、profile apply、registry 写入、既有 Case 迁移或未来 Gap 预绑定。领域 skill 维护对应事实源，但不拥有 State、不选择下一个 Gap；entry capabilities 与通用 Loop Kernel 不进入可替换配置。
