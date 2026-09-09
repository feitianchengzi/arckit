# Product / Idea 实现验证

## 范围

用户在 2026-09-09 明确：保留 Lifecycle 页面，新增 Product 目录/详情、Idea 独立添加及列表和 Today 续接；只使用 Workshop 与 GitHub；不增加产品迭代和发布。

最后补充的存储条件优先：临时录入只在本机并显示状态；正式 Idea 必须有 GitHub 仓库与本地工作目录，存储在 `arckit/product/`；列表从临时库和当前产品集关联目录共同恢复。

## 实现证据

- `runtime/arcorbit/src/product-coordinator.mjs`：临时存储与目录恢复、明确完成条件、确认摘要、部分成功回执、业务工具、账号范围、固定场景 cwd 与 Chat 复用。
- `definition/skills/arckit-product-assets/`：可复用语义维护契约、协议实现、路径/字段/修订号校验；正式 Idea 元数据与产品资料同文件原子保存。
- `runtime/arcorbit/src/product-git.mjs`：资料分支读写、独立 index、并发推送拒绝、远端核对。
- `runtime/arcorbit/desktop/renderer/product-surface.mjs`：真实 Product/Idea 界面、双区协作、直接编辑、Agent 建议、确认后 Agent 执行或直接执行、来源错误和 Today 续接。
- `runtime/arcorbit/desktop/renderer/conversation-composer.mjs` 与 `conversation-surface.mjs`：普通 Chat 和场景 Chat 复用的输入及消息组件。
- `runtime/arcorbit/adapters/codex-app-server-adapter.mjs`：动态工具注册、同线程请求验证、结果返回和 skill input。

## 可重复检查

运行根目录命令：

```
node runtime/arcorbit/scripts/check-syntax.mjs
node --test runtime/arcorbit/test/product-management.test.mjs runtime/arcorbit/test/product-surface.test.mjs runtime/arcorbit/test/codex-app-server-adapter.test.mjs runtime/arcorbit/test/chat-coordinator.test.mjs runtime/arcorbit/test/package-distribution.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs
```

新增产品检查涵盖：

1. 空白/材料起点、本机持久化、缺仓库/目录不能完成录入。
2. 正式记录成功落盘后移除临时事实；删除临时库后从当前产品集关联目录恢复。
3. 过期 Agent 提案和确认拒绝、人工编辑保留、资料协议错误、符号链接和材料越界拒绝。
4. 远端创建响应丢失后跨重启保持待核对，不重复创建。
5. 两套独立 Git cache 的真实本地 Git 共享与并发冲突；开发 checkout、代码和 index 保持不变。
6. 场景 Chat 的固定 cwd、原始用户输入、持久 thread、真实业务工具提案及结果消息。
7. 真实 DOM 组件与真实 Coordinator 联动：选择材料 → 编辑 → Agent 提案 → 人工采纳 → 确认并交给 Agent → 正式录入 → Product 详情 → Idea 目录恢复 → Today 续接。
8. GitHub 新建私有仓库与应用管理目录的受限命令参数；外部 GitHub 响应由测试替身提供。
9. 从 Git 资料恢复正式身份；外部工具修改本地记录后重新读取标记待共享。

非 GUI 全量回归：622 项，596 通过、26 项按既有条件跳过、0 失败。范围为现有 test 目录顶层测试，排除两个无条件启动 GUI 的既有测试 `experience-realization-electron.test.mjs` 和 `task-replacement-sheet-electron.test.mjs`。新增产品测试为 10 项全部通过。skill 基础结构校验通过；发行包验证通过，skill 由现有受信 payload 携带。

## 验证限制

- 完整 `npm run check --workspace @arckit/arcorbit` 曾因两个既有 GUI 测试在当前环境 SIGABRT/启动失败而未全绿；相关代码测试及非 GUI 回归另行完成。
- 隐藏 Electron 窗口提权请求失败（工具返回 approval request failed）。窗口几何和真实交互烟测没有获得执行证据。手工入口是 `runtime/arcorbit/test/fixtures/product-management-electron.mjs`。
- 本机 Codex app-server 无法在沙箱中初始化用户状态库；随后权限请求被拒绝，未再次尝试。动态工具由本机 CLI 生成的 experimental schema 和模拟 JSON-RPC 契约验证，真实 Codex 进程及模型端到端调用未验证。
- 未创建真实 Workshop/GitHub 资源、未邀请成员、未推送本仓库。测试中的 Git 仓库均为临时本地仓库。

## 事实维护回传

`document_scope.scope_kind` 为 change。Product 规格路径为 `arckit/spec/agentic-software-development/arcorbit-product-management.md`；技术协议为 `arckit/tech/arcorbit/product-management-solution.md`。交互路径为 `product-list`、`product-detail`、`idea-workspace`、`idea-add`、`today-workspace/product-continuity.html` 及 `platform-workspace`，依据是独立页面、同事实协作、正式资料目录恢复和原 Lifecycle 保留。各自 INDEX 与关系映射同步。

`fact_result`：managed_case，Case `CASE-20260909-001`，Gap `GAP-20260909-001-004`，outcome updated。产品、交互、技术事实以对应源文档为准；视觉采用既有 Desktop tokens，没有新建主题。实现验证的结论受上述真实进程/窗口权限限制约束。

## Skill 创建回传

模式为新建，正式维护源与工作副本均为 `definition/skills/arckit-product-assets/`，依据仓库 AGENTS.md 的 definition/skills 放置规则。能力为语义整理与确定性资料维护的组合：支持材料整理、直接状态维护、过期修订恢复和正式资产读取。主文件约 40 行，详细入口在 reference，模块可被应用导入。没有执行用户级 skill 安装、ArcForge apply/share 或 registry 写入。

```yaml
post_maintenance_handoff:
  recommended_next_step: verify_with_skill_first
  reason: 原生模型选择和真实工具协作需在允许启动 Codex 的环境独立观察；本轮结构与确定性集成已验证。
  formal_source_path: definition/skills/arckit-product-assets/
  working_copy_path: definition/skills/arckit-product-assets/
  maintenance_source_path: definition/skills/arckit-product-assets/
  validation_required: true
  governance_required: false
  arcforge_action_hint: none
  user_confirmation_required: true
```

可选隔离验证任务：在临时目录用该 skill 整理一份 Demo 材料，生成建议，模拟人工修改，再验证过期提案恢复及回执陈述。只允许该临时目录和测试资源，不写真实业务项目；观察状态是否凭活动推断、是否重放非幂等创建、是否把本机保存误报为共享。本可选模型实验不替代已列出的确定性功能检查。

## 完成审查后的回执修复

RF-20260909-001-001 已修复。每个非幂等创建步骤的回执持久化步骤名、原始参数和 fingerprint；同参数重试复用成功结果，参数不同则拒绝并要求核对已有资源。关联已有项目时清除不适用的旧创建参数，避免确认界面包含实际不会执行的字段。

新增回归覆盖“项目 A 创建成功、目录未就绪 → 改确认 B → 拒绝旧回执 → 显式关联 A → 正式完成”，并确认同参数重试不重复创建。产品协议、Coordinator 与真实 DOM 集成检查共 11 项通过；修复后语法检查通过。

RF-20260909-001-002 已修复。主进程拒绝临时 Idea 的同步和绕过正式录入的项目文件写入；共享发布要求正式记录及关联目录，并核对本地文件摘要，外部修改后必须重新读取。新增回归覆盖临时状态零 Git provider 调用、正式化后可发布、外部修改拒绝旧快照发布。产品与真实 DOM 检查共 12 项通过。
