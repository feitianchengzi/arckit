# Visual Relations

## 事实与投影

- `_library/brief.md` 是 ArcOrbit 风格源；`reference-research.md` 记录官方参考与本地采纳依据。
- `_library/design-tokens.yaml` 提供基础值与语义角色；`themes/*.yaml` 只覆盖语义角色，不复制基础色。
- `_library/component-catalog.yaml` 的 includes 按相对路径聚合四组组件；每组消费 Tokens 和 `state-contract.md`。
- `_library/build-preview.py` 解析引用并生成 `generated-tokens.css` / `preview-data.js`；HTML 直接读取两份生成文件，无 CDN 或业务 API。
- `_library/style-preview.html`、`preview.css`、`preview.js` 只展示组件，不定义正式业务页面。

## 映射与复现

在 repo 根目录执行 `python3 arckit/visual/_library/build-preview.py`；运行环境需要 PyYAML。`--check` 检查生成文件是否新鲜、组件引用和语义配色对比度。

映射规则是 Token 完整路径的 `.` / `_` 转为 `-`，添加 `--` 前缀，例如 `semantic.control_border` → `--semantic-control-border`。尺寸数值添加 px，weight 与 layer 保持无单位，duration_ms 转为 ms。引用先解析，主题以 `[data-theme="light"]` 或 `[data-theme="legacy-mixed"]` 覆盖。消费者既可直接引用生成 CSS，也可按同一规则生成，不能手工拷贝数值。

`python3 arckit/visual/_library/preview-server.py` 在 127.0.0.1 的可用端口提供预览；输出明确入口。`style-preview.html` 也支持直接打开。

## 消费者交接

| 消费者 | 规范输入 | 待同步与检查 |
|---|---|---|
| `arckit/interaction/project-workbench/default.html` 和 `interaction.md` | light、WorkbenchHeader、TaskListRow、Composer、RuntimePopover | 已消费正式视觉 light 主题；核对 54px 顶栏、31px 搜索、中央消息范围、右侧列表与 760px 抽屉 |
| `arckit/interaction/_explorations/project-workbench-v2/options/original/index.html` | 同上 | 保留采纳前候选，不随正式视觉重绘；已采纳稿在 project-workbench/default.html |
| `arckit/interaction/chat-workspace/default.html`、`automation-workspace/default.html` | ConversationSurface、Composer、AutomationExecutionOverview | 核对正文/工具/权限层级及保留阅读位置；不得重建平行消息系统 |
| `arckit/interaction/login/default.html`、`setup-readiness/default.html` | FormField、AccountPanel、LoginGate | 核对输入对比度、就地错误与窄屏，不添加认证步骤 |
| `arckit/interaction/task-browser/default.html`、`platform-workspace/default.html` | legacy-mixed、TaskTable、StatusPill | 七状态、可操作行尺寸、焦点，以及兼容主题范围 |
| `arckit/interaction/CONVENTIONS.md` | 本域 CONVENTIONS 与消费契约 | 已明确正式视觉优先，旧静态线框按原有范围保留 |
| `runtime/arcorbit/desktop/renderer/project-workbench.css` 与共享 Renderer 样式 | semantic.* 与组件目录 | 已接入随包 visual-tokens.css 与 visual-system.css；覆盖应用外壳、事情台、对话、登录设置、旧页面与 Release 外壳。验证与限制见 validation.md |

事情台原型、交互 CONVENTIONS 与实际 Renderer 的共享视觉已同步；表中其余交互原型仍按各自范围交接，不代表所有原型或真实服务链路已通过验收。视觉规范维护只写 `arckit/visual/`。

## 兼容性

基础 Token 键保留，部分角色颜色为满足 AA 调整；`min_window_width` 表达视觉检查下限，不控制原生窗口尺寸。事情台使用新增的 workbench_* 尺度，不覆盖旧 commandbar 的用途。

组件目录由内联 components 调整为 includes；读取方需要遍历文件合并组件名。未找到业务原型对原目录的自动解析引用，仍需在消费者集成时核对。生成器提供可重复的聚合数据。

橙色强调（2026-09-17）：accent 键保持稳定，操作/选择/运行与焦点由生成 CSS 同步为橙色；正式 project-workbench 直接消费此投影，历史探索及其截图保持原样。琥珀警示使用独立 Token 和状态标签。

浅杏橙已采纳：#F4B77D 主操作、无深橙装饰描边、中性链接与选中文字；正式 project-workbench 消费共享 Token 和对应样式。来源：arckit/visual/_explorations/orange-tone/exploration.md。

实际 Renderer 消费：`runtime/arcorbit/scripts/sync-visual-tokens.mjs` 将生成 CSS 确定性复制到应用资源；`visual-system.css` 应用组件角色。打包规则包含 desktop/**/*，运行时无设计目录依赖。开发启动同步，visual-system.test.mjs 检查漂移。

无标题栏主窗口：interaction/CONVENTIONS.md、visual/_library/brief.md 及 AppShell、tech/arcorbit/solution.md 共同定义独立窗口控件、局部避让和底部设置同步时间戳。生产无标题栏与底部同步投影已更新；实现及验证范围见 arckit/cases/evidence/CASE-20260917-003/implementation-verification.json，Windows/Linux 原生执行与 macOS 原生悬停面板未人工验证。历史页面线框中的标题栏不作为当前窗口外壳验收依据。
