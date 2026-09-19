# ArcOrbit · Chat 正式交互原型

[打开完整页面](default.html) · [正式交互说明](interaction.md) · [异常场景工具](scenarios.html)

直接用浏览器打开 default.html，无需业务服务。页面保留现有全局范围、分类导航、“模型能力”弹出配置、个人中心、右侧列表调宽、输入调高、会话历史、Markdown、工具/权限、停止和恢复行为。

## 推荐试用

1. 在已有会话点击“整理为待办”，待完成后从右侧“待办”重新进入，仍为同一会话。
2. 点击输入框“能力与引用”→“创建待办”，输入“给 Chat 增加会话搜索”后发送。创建当前项目的另一条待办，留在原讨论；卡片显示创建来源。
3. 点击新待办卡片打开对应 Chat，从标题“创建于…”返回来源。两个入口不会复制同一待办的 thread。
4. 输入 `/` 选择“问题诊断”，输入 `@` 选择文件或待办，再输入问题发送。引用对象不改变当前主待办。
5. 打开已有待办，输入“补充完成标准”，等待写回，再点“查看最新内容”。输入“继续执行”体验沿同一 thread 的执行请求。
6. 输入“看看有没有遗漏的旁支事项”，收到建议后回复“记成另一个待办”。Agent 回复不附预设快捷按钮。
7. 在异常工具选择“下次原生写入失败”，发起创建；失败后回复“重试刚才的操作”。版本冲突在修改进行中注入；占用、失权作用于当前主待办。

输入框左侧保留“能力与引用”和“模型能力”入口，发送/停止靠右。Model 和 Level 在模型能力菜单调整并自动保存；技能设置从能力与引用菜单底部进入。

统一选择器中的标签先留在草稿，发送后才调用。一个显式能力、多个去重引用随各自会话保存；取消选择和移除标签都保留正文。右侧“会话”保持项目分组和五条递增，“待办”只显示当前项目。窄窗通过列表抽屉操作。

## 正式依据和模拟边界

正式预期在 interaction.md。2026-09-19 采纳关系记录于 `../_explorations/chat-todo/exploration.md`；正式入口不加载任何探索脚本、样式或存储。

样式消费 `../../visual/_library/generated-tokens.css`、正式 brief、ConversationSurface 及 light/dark 主题。新增选择器、标签与对象卡片由既有视觉角色组合；工程细节与 thread 标识不进入正常产品流。

正文、工具活动、审批展示来自既有 Chat 原型基础；当前项目待办能力、统一输入选择器、引用标签与回执卡片表达正式新增预期。全部使用本地样本，没有真实 Agent、Skill 读取、项目文件读取、待办 API 或业务执行。输入识别为预设短语与显式能力的确定性模拟，不声称完成通用语义理解。

默认每 900ms 推进一步；`?autoplay=off` 时通过 ChatPrototype.tick() 手动推进。停止只阻止未提交模拟写入。真实幂等、结果未知、部分成功绑定恢复、跨进程/设备 thread、读写授权、原生桌面控件和辅助技术完整检查未由原型证明。

普通原型沿用独立 `arcorbit-interaction-chat-v1` 存储，原生能力样本用 nativeVersion 初始化；场景工具使用 `-scenarios` 后缀，与探索和 Thing 样本隔离。刷新不重放活动原生写入；删除本地会话不删除待办或任务所属的持久 thread 身份。

## 文件和验证

基础文件 model.js / views.js / app.js / chat.css / markdown.js 保留原 Chat 能力。native-model.js 管理待办、消息意图与工具回执样本，native-views.js 组合正式视图，native-input.js 管理选择器、标签、对象导航和异常入口，native.css 使用正式 Token；model-settings.js 管理当前会话的模型/推理级别弹出菜单。全部低于 500 行，按职责拆分；default.html 始终是完整入口。

从仓库根运行：

```sh
runtime/arcorbit/node_modules/.bin/electron arckit/interaction/chat-workspace/verify.cjs
runtime/arcorbit/node_modules/.bin/electron arckit/interaction/chat-workspace/verify-native.cjs
runtime/arcorbit/node_modules/.bin/electron arckit/interaction/chat-workspace/verify-layout.cjs
swift arckit/interaction/chat-workspace/verify-layout-webkit.swift "$PWD"
```

结果分别在 verification.json、verification-native.json。前者覆盖原有会话、模型、草稿、滚动、权限、失败、工作区、账户与布局；后者覆盖同一 thread、能力/引用标签、待办创建与来源、读写、冲突、占用、失权、停止、恢复、输入法、暗色及 390–1500px/200% 缩放。

本地截图位于 previews/native-*.png。states.html 与 workspace-setup.html 为专项辅助稿；新增原生能力以完整入口和正式说明为准。

菜单以各自入口为锚点向上展开，并随窗口尺寸调整。共享顶部栏按生产 renderer 的现有布局校准；产品集管理仅修改原型本地样本。

verification-layout.json 专门检查顶部入口同排、菜单高度、固定搜索/技能设置，以及逐个滚动到候选后真实命中点击区域；覆盖 390–1500px 宽、640–1000px 高。

verify-layout-webkit.swift 使用 macOS WKWebView 复核 1500×800 桌面布局；本次结果记录在 verification-layout-webkit.json。
