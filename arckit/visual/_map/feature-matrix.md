# Visual Feature Matrix

✅ 规范或组件预览已完成；🟡 跨域消费者待同步。完成不表示生产实现通过验收。

| Path | Status | Summary |
|---|---|---|
| `_library/brief.md` | ✅ | 明暗项目事情台、橙色重点、连续阅读、结果与证据、原生窗口及兼容范围。 |
| `_library/reference-research.md` | ✅ | Codex、Cursor、Claude 官方资料；明确观察、推论与 ArcOrbit 数值边界。 |
| `_library/design-tokens.yaml` | ✅ | 系统字体、可读状态色、语义主题角色、尺寸、层级与动效。 |
| `_library/components/foundation.yaml` | ✅ | 应用壳、导航、图标、按钮、七状态标签。 |
| `_library/components/workbench.yaml` | ✅ | 事情台顶栏、事情行、输入、Composer、运行浮层、成果证据与上下文。 |
| `_library/components/conversation.yaml` | ✅ | 共享消息层级、登录与账号表单。 |
| `_library/components/execution.yaml` | ✅ | 队列、运行事实、人工处理、恢复与执行记录。 |
| `_library/state-contract.md` | ✅ | 公共状态与角色配色、业务/执行状态分界、验证要求。 |
| `themes/dark.yaml` | ✅ | 暗色主题规范与组件样张；生产接入待验证。 |
| `themes/light.yaml` | ✅ | 事情台亮色主题。 |
| `themes/legacy-mixed.yaml` | ✅ | 旧控制台混合主题兼容，不是完整暗色主题。 |
| `_library/style-preview.html` | ✅ | 组件、主题、输入错误、工具摘要、草稿恢复及生成目录。 |
| `_library/build-preview.py` | ✅ | 引用解析、确定性 CSS/数据生成、75 项对比度校验。 |
| `_map/RELATIONS.md` | 🟡 | 正式事情台与实际 Renderer 已同步；其他旧交互原型仍待各自维护。 |

| `runtime/arcorbit/desktop/renderer/visual-system.css` | ✅ | 实际应用浅杏橙、浅色外壳、中性选择与文字、统一输入/焦点/禁用状态和对话层级；已通过隔离 Renderer 验证，非真实账号与服务端验收。 |

浅杏橙已采纳：#F4B77D 主操作、无深橙装饰描边、中性链接与选中文字；正式 project-workbench 消费共享 Token 和对应样式。来源：arckit/visual/_explorations/orange-tone/exploration.md。

无标题栏主窗口：interaction/CONVENTIONS.md、visual/_library/brief.md 及 AppShell、tech/arcorbit/solution.md 共同定义独立窗口控件、局部避让和底部设置同步时间戳。生产无标题栏与底部同步投影已更新；实现及验证范围见 arckit/cases/evidence/CASE-20260917-003/implementation-verification.json，Windows/Linux 原生执行与 macOS 原生悬停面板未人工验证。历史页面线框中的标题栏不作为当前窗口外壳验收依据。
