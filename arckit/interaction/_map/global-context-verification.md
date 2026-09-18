# ArcOrbit 全局顶部上下文验证

依据：用户明确接受单条统一顶部栏、全部产品页面受同一范围控制及对象选择/草稿恢复规则，并授权实施。权威交互规则见 ../CONVENTIONS.md。

## 实现与证据

- 全局顶部栏保留同一 DOM 与能力：范围、同步状态、同步动作、运行/领取、产品反馈和设置；侧栏账户仅显示登录状态。
- global-context.mjs 提供范围映射、选择恢复、同步摘要与串行 Chat 归属切换。Renderer、Thing、Product 和 Today 消费同一顶部范围。
- global-context.test.mjs 验证工作区绑定映射、空范围、同步部分失败、A/B 会话与未发送草稿恢复、不打断后台 turn。
- workbench-refresh.test.mjs 验证 Thing 列表、详情和草稿随范围切换及空范围清空、迟到详情隔离；与 project-workbench.test.mjs 联合验证独立刷新传递全局运行、队列、暂停及开关状态，避免 Thing 的局部队列覆盖全局统计。
- product-surface.test.mjs 验证产品列表过滤、详情随单产品切换、全部范围返回列表、编辑草稿保留及对象归属不变。
- fixtures/global-context-electron.mjs 使用生产 Renderer 与受控 IPC，验证跨页同一顶部栏、A/B 会话草稿、1440/1000/760/390px 内容边界、窄窗菜单、Escape 焦点和账户入口。

## 已执行

2026-09-18：相关行为测试 24/24 通过；生产 Renderer 静态边界测试与原有 Chat/Thing 回归通过。真实 Electron 测试通过（受控数据，不连接业务服务、不调用真实 Agent）。视觉生成检查 21 组件、38 对比度检查通过。

全量 Runtime 测试：856 项，821 通过，34 按现有环境条件跳过，1 项失败。失败为 package-distribution 测试读取用户已有未跟踪 delivery/skills/arckit-appstore-delivery/LICENSE 时 ENOENT；本任务不修改该目录。该结果不代表安装包验收通过。

## 验证边界

未发布、安装或替换用户正在使用的应用；未执行真实业务写入、真实 Codex turn 或原生 macOS 窗口布局面板验证。各主入口现已接入统一顶部原型；旧页面专项静态图保留为 page-states.html / governance-states.html 辅助说明，其中旧窗口壳不作为全局顶部验收依据。规范以 CONVENTIONS.md 为准。

## 原型补齐（接续 CASE-20260918-002）

- 15 个主入口使用同一顶部范围与能力，Chat/Thing 保留原完整操作链，其余页面提供范围与对象连续路径；原专项静态图保留在各页 page-states.html，组织治理为 governance-states.html。
- `_shared/verify-global-context.cjs` 验证产品集、单产品、空范围、未绑定 Chat、会话/事情/产品草稿、对象恢复、新建归属、同步失败重试、不停止执行、1440/760/390px 与 Escape。实际结果见 `_shared/global-context-verification.json`。
- Chat 与 Thing 原完整主路径浏览器回归通过，继续覆盖消息、草稿、阅读位置、异常恢复、执行控制与窄窗。所有原型数据和保存仅在本机浏览器，不声称业务服务能力已执行。

## 实现对齐复验

- 运行概况可定位到范围外事情：先切到可访问的产品集与所属产品，再打开 Thing 对象。使用实际 Renderer 与受控 IPC 验证。
- Today 扩大范围保留有效责任对象；Release 保留有效工作区与命令草稿，迟到详情响应不覆盖新范围；Work 新建只提供范围内产品。
- Operations 当前为范围感知的规划空态，不展示缺少来源的产品统计。
- 2026-09-18：相关定向回归 106/106 通过；全量 Runtime 861 项，826 通过、34 跳过、1 项失败，仍为既有未跟踪 App Store skill 缺少 LICENSE。生产 Electron 跨页、运行定位、范围、草稿和 1440/1000/760/390px 验证通过。
- 原型 `_shared/verify-global-context.cjs` 与原 Chat/Thing 主路径验证通过；语法、diff 和视觉 Token 一致性检查通过。原型模拟与真实业务服务验证分开记录，未安装或发布应用。

## 桌面顶部空白回归（CASE-20260918-003）

用户实际运行发现顶部空白。生产外层 globalScopeMenu / globalControlsMenu 默认关闭，桌面样式又隐藏 summary；display:contents 不会展开 details 的内容。真实 Electron 复现中六个顶部控件 checkVisibility 全为 false，部分控件仍返回非零尺寸，因此之前容器存在与布局尺寸检查不能证明顶部可见，原先“顶部验证通过”的范围表述不充分。

修复：桌面外层容器常开，只有窄窗参与折叠；互斥、外部点击和 Escape 只关闭当前可关闭菜单，宽窄切换同步状态并恢复焦点。新增 global-topbar-menus.mjs，HTML 初始展开，实际 Renderer 回归逐项检查控件可见性。

2026-09-18：修复前新增可见性断言失败；修复后真实 Electron 的初次加载、多页面、1000/1440px、760/390px 折叠、外部点击、Escape 与宽窄往返通过；85 项相关 Node 测试通过，已核对 1440px 实际截图。临时诊断日志已清理，无生产临时埋点。未打包替换已安装应用。

## 状态入口与弹层修复（CASE-20260918-005）

用户要求同步和运行状态入口有清晰可点击外观，弹层背景不透明。生产样式引用了未定义的 semantic-surface，导致背景声明失效；现统一使用已有 semantic-elevated。生产与交互原型的两个入口均增加按钮边框、底色、展开箭头以及悬停、展开和键盘焦点状态。

2026-09-18：生产 Electron 在 light/dark 下逐一打开同步与运行弹层，验证背景不透明、按钮边框与箭头、弹层边界；已核对暗色实际截图。原型 Electron 回归通过，生产原有跨页、范围、草稿、1440/1000/760/390px、Escape 和宽窄往返验证通过。验证使用受控 IPC，未替换已安装应用。
