# Release 原型修订前：现有多项目交互核对

2026-09-09。本文为设计探索依据，不更新正式交互、规格、技术方案或 Project/Case 状态。

## 核对方式与结果

读取生产 Renderer、Platform Coordinator、Chat Coordinator、Desktop Store 和现有交互规格，并使用仓库已有隔离测试数据，在 Electron 中加载真正的 `desktop/renderer/index.html`。

本次验证的是生产页面行为；项目名称、目录、登录状态和运行记录来自测试 fixture，没有读取用户账户内容或调用真实项目写入接口。不是上一版概念原型，也不是已安装应用当前在线数据的截图。

- [现有 Release 页面](current-release.png)
- [现有产品集管理](current-workset.png)
- [现有 Chat 固定工作区](current-chat.png)
- [结构化观察结果](current-ui-audit.json)

验证：产品观察范围切换、管理弹窗、Chat 会话固定归属、Organization 独立范围。零页面错误；范围切换没有产生工作区绑定、参与授权或产品集写入。

## 已有能力

| 现有对象 / 入口 | 当前行为 | 对 Release 的含义 |
| --- | --- | --- |
| 云端 Workshop Project | 共享名称、仓库关系、组织、成员等事实 | 继续用原项目身份，不另建 Release 项目目录 |
| 顶部「产品集」 | 本地保存多个项目组成的 Workset | Release 消费当前产品集，复用管理入口 |
| 顶部「查看」 | 项目集全部或当前产品集中的某个项目 | 直接决定 Release 的观察范围 |
| 顶部「管理」 | 勾选已有项目进入当前产品集 | 不负责本地目录绑定，也不改变自动执行授权 |
| Product / Organization | 已有产品目录、关系信息及项目治理入口 | Release 仅展示已有关联结果 |
| 本地工作区绑定 | Automation 的项目绑定区、Organization 的连接引导、Chat 缺少工作区时的原位入口；共用现有绑定能力 | 缺少关联时指向已有入口，不在 Release 再设计配置流程 |
| Automation | 项目查看范围、项目参与授权、全局自动领取分别维护；活动执行独立保留 | 切换观察范围不停止进程，不改变正在执行任务的归属 |
| Chat | 按本地工作区分组；已建立会话固定工作区，独立于顶部观察范围 | 内嵌对话必须保留 session 归属，不把同一 thread 改绑到新选中项目 |

## 生产页面实测

测试产品集「核心推进」包含 ArcOrbit 与 Workshop Todo。顶部「查看」显示「项目集全部 · 2」与两个项目。

进入 Release 后将查看范围从全部切到 Workshop Todo：面包屑变为 Workshop Todo / Release，正文内容完全相同。原因是 Release 正文仍为静态计划展示；现有全局多项目选择机制已经可用，待补的是 Release 内容对范围的真实响应。

进入 Chat 并改变顶部查看范围：当前会话标题、`local-11` 工作区归属、固定归属选择器均保持不变。进入 Organization 后顶部产品集控件隐藏；治理目录独立于 Workset。

## 修订方向（候选，尚未实施）

1. 原型使用已有应用壳，保留 Product 导航与顶部「产品集 / 查看 / 管理」。只改 Release 内容区。
2. 「项目集全部」下按当前产品集聚合构建、发布、运行与异常记录，记录显示所属项目。选中记录后才给 Git、终端和 Agent 具体上下文；不默认选择第一个项目执行。
3. 单项目范围下直接显示该项目的工作台，读现有工作区关联。正常打包不再额外选择一次项目或配置目录。
4. 每次执行固定项目、本地工作区、命令、开始时的源码基线和对应会话。返回全部或切换项目只切换展示；进行中的任务继续在原项目执行。
5. 顶部查看 B 时，内嵌工具区显示 B 已有会话或新会话草稿；A 的运行进展通过带项目名的活动入口返回。不能把 A 的终端改成 B 的 cwd，也不能让 A 的异步结果落入 B 的消息区。
6. Git 面板以明确工作区为范围；全部模式选中 A 的构建记录后仍显示 A 的源码与来源说明。手动执行前控件展示确定的项目与目录。
7. 缺少工作区、目录不可用或环境未就绪时给出可解释状态和已有入口。执行准备不与 Automation 的自动领取授权等同。

## 落地能力判断

- 可复用：平台项目列表、Workset、`selectedProjectId`、远端与本地工作区关联、项目就绪状态、现有 Chat session/thread 和通用对话组件。
- 需要新增：本地终端会话服务及受限 IPC、工作树 Git 操作、Release 构建记录和产物投影、Release 的范围响应与上下文联动。
- `src/product-git.mjs` 目前操作产品资料的 bare repository 与独立资料分支，并非源码工作树 Git 客户端。不能把它当成已有暂存/提交界面的完整后端。
- 本地打包脚本可以作为已有命令接入，但需要实时输出与结构化结果；终端任意命令不能仅凭输出文本自动认定某个版本已发布。
- 正式发布可适配已有手动 GitHub workflow；命令执行完成、构建产物、GitHub Release 和部署健康分别读取其来源。现有 workflow 支持生成产物或 draft Release，不应以一个模拟“发布”按钮宣称整个链路已经完成。

## 基于现有交互的场景检查

| 场景 | 预期最短路径 | 保持闭环的关键 |
| --- | --- | --- |
| 给当前项目打包运行 | 顶部已选 A → Release → 构建 → 运行产物 | 沿用已绑定目录，产物关联本次执行，不重复配置项目 |
| A 打包期间处理 B | A 开始构建 → 顶部查看 B → 操作 B → A 完成提示 → 返回 A 产物 | 启动上下文不可随当前筛选改变 |
| 从全部项目发现失败 | 全部范围选中 A 的失败记录 → 日志 → Agent 分析 → 检查 Diff → 重试 A | 日志、对话、Git 与重试保持同一项目和具体记录 |
| 已有配置的项目进入 Release | 读取现有项目与本地关联 → 直接使用操作 | 不重新建设目录关联或项目接入界面 |
| 从全部范围开终端 | 选定项目记录 / 在新建动作中明确项目 → 打开其终端 | 「全部」是观察范围，不能充当命令执行目标 |
| 切产品集后原任务还在运行 | 切换产品集 → 仍可从带项目名的活动入口返回原执行 | 过滤只作用展示，不取消任务、不换归属 |
| 本地包走向正式交付 | 查看源码与验证 → 触发现有发布流程 → 读取远端结果 | 未签名本地测试包不伪装成正式发布产物；正式发布不等于部署成功 |

## 主要源码依据

- `desktop/renderer/index.html:151`：现有全局产品集栏。
- `desktop/renderer/renderer.js:688`：产品集切换清空单项目筛选；项目观察范围事件。
- `desktop/renderer/renderer.js:1694`：全局栏、页面标题与各页范围可见性。
- `desktop/renderer/renderer.js:1720`：Workset 成员与项目观察范围选项。
- `desktop/renderer/renderer.js:3214`：现有产品集管理弹窗。
- `desktop/renderer/renderer.js:4313`：Automation 本地工作区绑定和参与授权。
- `desktop/renderer/renderer.js:2236`：统一工作区绑定与就绪检查入口。
- `desktop/renderer/renderer.js:1524`：Chat 会话固定归属及工作区选择器。
- `src/chat-coordinator.mjs:141`：以 session 固定项目身份处理后续消息。
- `src/desktop/desktop-store.mjs:316`：本地 Workset 与 workspace preferences。
- `arckit/interaction/platform-workspace/interaction.md`、`chat-workspace/interaction.md`：已有交互预期。

上一轮尚未完成的新增项目选择器、独立目录配置等修改已撤回。原型仍保留上一版可用状态；本次新增的内容仅为这份研究及页面证据。
