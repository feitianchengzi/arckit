# 静态约束下的图片窗口独立性修正

2026-09-11。依据宿主 06:38:04.602Z trusted snapshot：Project 363、Case content revision 4、selection token `446d1bc372b9f4ad4ffee7c3fd79c5816b6c0cea39b65fcb4105055cadc1cfb1`。本记录不表示 Ledger 已接受，也不表示黑屏已验收消失。

## 当前指示与范围

用户继续报告 Escape 关闭查看器后主窗口黑屏，并明确：「系统有问题，我现在给不了你录屏权限，你只基于代码静态分析完成后续工作吧」。遵从该最新指示，不再以录屏权限、GUI 自动化或复现日志为本轮代码工作的前置条件。这覆盖诊断技能原先等待运行日志的步骤，但不把静态推理升级为实际像素恢复证据。

初次提交选中已有 `GAP-20260910-003-003` 并只报告部分推进，因普通所选 Gap 必须携带完成主张而被拒绝，未写入 canonical state。替换提交选择 `local:gap:static-window-isolation`，仅接受由已接受 FACT-011 独立性期望、FACT-007 关闭策略和 FACT-013 原生关联事实直接支持的窗口隔离源码修正与静态检查。已有 GAP-003 改为 ready/deferred，实际画面、输入、全屏、上下文恢复义务原样开放，既不解决也不取消该项。

四项 Project 候选（场景评估、Runtime 韧性、安全实证、跨记录审计）均 case_required/deferred，与此次窗口故障无直接关系。凭据/许可/发布与 Release 重打包两项人工候选均 ready/excluded，不借用其他 Case 授权。此前自动采集改造存在于工作区但提交被拒绝，不视为 canonical accepted fact，也不在本轮重做或补报其验收。

## 静态证据与推理边界

1. 修改前查看器通过 `BrowserWindow({ parent })` 与创建时主窗口建立原生关联。Electron 31.7.7 的构造函数、`InternalSetParentWindow`、`AttachChildren` 和 `Show` 明确实现子窗口注册、原生关联和显示时重新挂接；这不是单纯保存业务 owner id。[对应版本原生实现](https://github.com/electron/electron/blob/v31.7.7/shell/browser/native_window_mac.mm)
2. 修改前查看器 `closed` 回调对存活父窗口调用 show/focus。它是实际主窗口操纵；它晚于关闭，不能单独解释用户报告的进入全屏即黑屏。源码未发现查看器进入时主动调用主窗口 hide 的业务路径。
3. Electron 原生全屏转换有内部状态与延迟关闭处理；delegate 在转换完成后处理关闭。不能据任一即时布尔值或人工发出的替身事件，推断现场原生状态。保留已接受的受控 Escape 和退出等待，不再增加延时 show、重载或切换主窗口全屏的补偿。[对应版本窗口 delegate](https://github.com/electron/electron/blob/v31.7.7/shell/browser/ui/cocoa/electron_ns_window_delegate.mm)
4. `main-window-controls.mjs` 的 maximized 投影合并最大化/全屏，但 `desktop/renderer/window-controls.mjs` 在 native-macos 分支直接返回，不绑定后续状态按钮逻辑；其余分支也只切换按钮图标、title 和 aria-label。该链不能直接解释 macOS 主窗口内容和顶部栏几何异常，因此不修改此投影或 CSS。
5. 原生关联是结构性耦合，show/focus 是明确的应用层状态干预。结合已接受的「查看器不改变主窗口自身状态」要求，本轮消除这两个边界，而不是宣称已证明 AppKit/GPU 层黑屏的唯一根因。普通 Space 切换造成窗口不在同一桌面可见，不等于主窗口被业务代码隐藏。

官方源码为版本化静态依据，不是当前进程观测。读取使用只读 HTTP，未启动 Electron。最新用户指示到达前只检查过已知日志目录：正常 userData 的 arckit/debug 不存在，仓库 arckit/debug 只有另一问题资料；这不能证明每次失败均未采集，也不能确定目前安装包或内存中的源码版本。

## 实际源码变化

- 仅 macOS 省略查看器构造选项中的 `parent`，保留独立顶层原生全屏。Windows/Linux 保留原生父子关联及原关闭策略。
- 删除 macOS 查看器关闭后的主窗口 show/focus，以及只为该恢复分支服务的 suppress 标记。查看器生命周期不调用所有者的可见性、尺寸、全屏、刷新或激活动作。
- 保留应用层单向所有权：macOS 创建时的主窗口 `closed` 触发对应查看器内部强制销毁；查看器关闭时解除该所有者监听。窗口身份检查防止旧所有者回调作用于其他实例。
- 保持 sandbox/contextIsolation、无参数关闭 IPC、sender/main-frame 校验、重复 Escape 防护、退出全屏等待及应用退出清理；不新增 Renderer 权限。
- 临时诊断代码是此前工作区已有改动，本轮未扩充、未启用运行验证、未删除旧日志。问题尚未完成实际恢复验收，暂保留；不要求用户录屏、命令行启动或交付日志，不将它转成长期功能。

## 静态验证

实际执行且通过：

- `node --check runtime/arcorbit/src/work-task-image-viewer.mjs`
- `node --check runtime/arcorbit/test/work-task-image-viewer.test.mjs`
- `git diff --check`
- 搜索确认旧恢复变量与 showCount/focusCount 为 1 的恢复断言不再出现在目标服务和测试中。

补充但未运行的回归用例：正常、全屏、最小化、隐藏所有者均不被查看器调用状态修改方法；macOS 构造不带 parent；退出全屏等待不被重复关闭绕过；所有者销毁取消等待、清理查看器和监听；非 macOS 保留 parent；实际 Renderer/preload/IPC 回归原有安全断言保留、关闭后断言调整为不操作所有者。

没有执行 `node --test`、应用、GUI 自动化、截图、录屏、打包、安装或重启。旧 79/88 项测试成功仅属于此前实现，不能证明这次改动。源码静态检查不能证明当前安装应用已经包含修改，更不能证明主窗口像素、输入、布局和全屏状态恢复。

## 技术文档交接

```yaml
document_scope:
  scope_kind: change
  root: arckit/tech/
  updated:
    - path: arcorbit/platform-composition-solution.md
      summary: 明确 macOS 顶层图片窗口、单向生命周期与禁止反向主窗口恢复操纵。
    - path: INDEX.md
      summary: 同步独立图片窗口摘要与426行计数。
fact_result:
  schema_version: arckit-fact-result/v2
  mode: managed_case
  case_id: CASE-20260910-003
  gap_id: GAP-20260910-003-003
  outcome: updated
  facts:
    - statement: macOS 图片窗口保持主窗口状态独立，仅保留主窗口销毁时的单向资源清理。
      basis: 已接受的用户独立性要求与受控关闭、安全隔离约束。
      source_refs: [arckit/tech/arcorbit/platform-composition-solution.md]
      evidence: [runtime/arcorbit/src/work-task-image-viewer.mjs]
  unresolved: [实际原生恢复未验证，新增回归尚未执行]
  human_decision_required: false
```

## 不变量与剩余责任

产品和交互预期 upheld：主窗口状态独立、只关闭图片窗口的要求不变，系统 Space 遮挡不变成始终同屏承诺。视觉语言 not_relevant：没有新主题、布局或 chrome 规则，呈现故障保持实现问题。技术决策 upheld：应用层所有权与原生关联分离，安全和关闭约束在同域技术方案可恢复。realization 与 risk 仍 threatened，引用现有开放 GAP-003：没有测试执行或当前安装应用原生恢复证据。

本轮只提交部分推进，不关闭 GAP-003 或 Case。代码侧本轮限定修改已完成；安装与实际使用的验证涉及当前运行宿主，由操作者安排，Agent 不覆盖或重启宿主。无需现在提供录屏权限；若以后自行验证，可用文字说明结果。不能为通过验收而把静态检查解释为黑屏消失。

## 被拒绝提交的范围修正

宿主 06:50:56.741Z fresh trusted snapshot 确认 Project 363、Case content revision 4、Case selection token 均未变化，上一份提交未接受。拒绝点为 `claim.resolve_selected_gap`：普通 Gap 不支持用 null 提交部分完成。

本次修正不重复实现、测试、安装或现场调查，也不通过补一个“完成”字段来关闭尚未完成的真实恢复验收。替换选择只承载已实际完成的源码隔离和静态证据；其完成不包含测试运行、安装覆盖、黑屏根因确认或原生恢复。原事实主张、两项事实替代、六项不变量处置及指向开放 GAP-003 的风险关系保留。其他七项 persisted candidates 均重新比较并显式记录。技术技能交接中 GAP-003 仍表示所属原始恢复义务，替换提交的唯一验收范围以本节为准。
