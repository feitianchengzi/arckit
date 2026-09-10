# Idea 接入优化验证

## 目标与实现

本事项来自用户实际使用后“选择材料目录，不知道如何继续”的反馈。完成依据是首次用户主路径能够主动推进、结果可修改、确认与恢复可解释，不再仅以表单和接口存在作为依据。

- `product-surface.mjs` / `idea-intake-view.mjs`：材料选择后自动准备；空白描述起点；当前阶段与主动作；可编辑建议；统一保存；业务确认摘要；长期资料折叠；滚动、焦点与晚到建议保护；正式结果和恢复入口。
- `product-coordinator.mjs`：持久且 single-flight 的准备请求；候选上下文；不完整提案与严格确认分离；资料/方案一次 revision 保存；手工修改会话记录；材料变化使旧建议失效；确认绑定已审阅修订；原正式存储/回执规则保留。
- `product-environment.mjs`：固定参数、受控目录的 Git 检查；脱敏 GitHub 登录及组织候选；未认证/查询失败明确未知。
- `product-intake-state.mjs`：从实际会话、已保存方案、缺失字段和执行回执派生用户阶段；不以模型自称完成设 formal。
- `codex-app-server-adapter.mjs`：原生图片 contentItems；`chat-coordinator.mjs` 只对图片工具摘要省略 base64，普通对话契约不变。
- `arckit-product-assets`：复用既有维护 skill，补充主导接入、真实候选、图片、部分方案和确认执行的方法，不创建第二套 Runtime。

## 已执行检查

根目录执行：

```
node runtime/arcorbit/scripts/check-syntax.mjs
node --test runtime/arcorbit/test/product-management.test.mjs runtime/arcorbit/test/product-surface.test.mjs runtime/arcorbit/test/codex-app-server-adapter.test.mjs runtime/arcorbit/test/chat-coordinator.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs runtime/arcorbit/test/package-distribution.test.mjs
```

相关检查 117 项通过、0 失败。语法检查与 skill 结构校验通过。

真实 DOM + 真实 Coordinator 场景 6 项：

1. 选择临时目录后自动发起整理。测试 Agent 实际调用工具读取真实 README、真实 Git origin 和项目候选，再产生关联方案；用户无需输入分析提示词或手工填写仓库。修改说明、保存、业务摘要确认、Agent 执行，正式文件保留修改后的说明。重开不重复分析。
2. 空白起点描述后整理；不完整仓库方案可以保存，缺项就地可见，不要求产品理念。
3. Codex Setup 失败后明确错误、保留本机草稿，并允许直接填写方案。
4. 晚到建议保留手工输入；用户保留编辑后，再修改并发送消息，Agent 获取到已更新的事实。

5. A 的准备响应延迟期间切换 B，A 返回后 B 的字段、对话和后续发送身份仍属于 B。
6. 保存期间继续输入不会被清除；保存响应延迟期间切换 B，A 的结果仅保存至 A，B 的页面不被替换。

审查修复 RF-20260909-003-001：准备、保存、环境读取、材料选择、确认与同步回调绑定发起对象及页面 epoch；导航后继续操作再次核对归属。保存回包只清除已提交且未继续变化的草稿。修复后上述 117 项及语法检查全部通过。

Coordinator/协议另外覆盖：临时记录禁止同步、正式文件与产品集恢复、旧方案回执拒绝重放、响应未知、图像 contentItems、设计源文件明确限制、GitHub 候选脱敏、材料修改使提案失效、并发准备 single-flight、同会话重试，以及原 Git 冲突与开发 index 不变。

## 验证边界

测试 Agent 是按真实工具返回值产生方案的替身，不是原生模型。Workshop/GitHub 写入为替身；Git 文件/仓库检查为临时目录中的真实执行，没有创建真实外部项目。协议图像返回类型依据当前本机 CLI 导出的 schema 验证。

此前 Electron 窗口与 Codex 实机权限请求未获执行授权，本次没有重试被拒绝的动作。可选真实窗口 fixture `runtime/arcorbit/test/fixtures/product-management-electron.mjs` 已同步新主路径，但本次没有执行证据；窗口几何、真实模型理解质量和外部平台实机接入仍未验收。不把 117 项检查称作这三者已通过。

## 事实与 Skill 维护回传

`document_scope.scope_kind=change`。更新 Product 规格、Idea 添加交互源/灰度状态投影及 Product 技术方案，INDEX 同步行数；依据为本 Case 已接受的主流程契约，页面归属不变。

`fact_result` 为 managed_case / CASE-20260909-003 / GAP-20260909-003-002 / updated。产品、交互和技术源分别位于 `arckit/spec/agentic-software-development/arcorbit-product-management.md`、`arckit/interaction/idea-add/`、`arckit/tech/arcorbit/product-management-solution.md`。视觉使用原有 tokens。

Skill 模式为更新正式仓库维护源，`definition/skills/arckit-product-assets/` 同时是工作副本与维护源（Git 跟踪与根 AGENTS.md 明确归属）。代表场景为代码材料、空白想法、图片/设计源文件、人工修改与失败恢复。采用已有方法 + 应用工具的混合承载，SKILL 主文件保留门禁与工作方法，工具字段细节进入 reference。结构校验通过；没有执行用户级安装、apply 或同步治理。

```yaml
post_maintenance_handoff:
  recommended_next_step: verify_with_skill_first
  reason: 后续可以隔离观察原生模型使用更新后的接入方法，本次仅有工具驱动替身的集成验证。
  formal_source_path: definition/skills/arckit-product-assets/
  working_copy_path: definition/skills/arckit-product-assets/
  maintenance_source_path: definition/skills/arckit-product-assets/
  validation_required: true
  governance_required: false
  arcforge_action_hint: none
  user_confirmation_required: true
```

可选隔离任务：在临时目录阅读一个有 README 与 PNG 设计图的 Demo，使用测试项目/组织候选提出接入方案；人修改说明后继续。只允许临时目录与测试资源，观察是否主动读材料、引用真实候选、保留缺项、尊重修改及确认。此原生模型实验与当前确定性集成证据分开。
