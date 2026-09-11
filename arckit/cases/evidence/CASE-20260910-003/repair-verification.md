# Escape 受控关闭修复：源码与验证边界

日期：2026-09-10。范围：GAP-20260910-003-002 的实现及非 GUI 回归；不是持续黑屏已解决的验收结论。

## 实现结果

- Renderer 的 Escape 阻止默认行为与传播，通过独立 preload 的无参数 `close()` 进入固定 IPC；不再调用 DOM `window.close()`。重复键不发起请求，IPC 失败显示固定可重试错误，不暴露原始错误。
- main handler 校验 main frame，服务校验当前受管查看器 WebContents。外部、子 frame、已关闭查看器 sender 不能关闭窗口；Renderer 无法传递 force、窗口 id 或原生动作。
- macOS 退出全屏等待状态先于即时布尔值判断；重复 IPC 或普通窗口关闭均不能在 `leave-full-screen` 前绕过等待。
- 父窗口取自子窗口创建时的实际 owner。所有普通 macOS 关闭在子窗口 `closed` 后才调用存活父窗口 show/focus，包含父全屏而子非全屏情形；不读取父全屏标记来推断子窗口状态，不切换父窗口全屏，不重载页面。
- 应用 `before-quit` 的既有 `close({ force: true })` 取消等待、销毁子窗口且不恢复父窗口。sandbox、contextIsolation、禁用 Node 和导航限制保持不变。

## 可重复验证

执行两次下列命令，均为 **79 passed / 0 failed / 0 skipped**：

```sh
node --test runtime/arcorbit/test/work-task-image-viewer.test.mjs runtime/arcorbit/test/work-task-image-viewer-state.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs
```

其中查看器服务 12 项（新增 5 项，增强既有退出断言）、状态变换 3 项、Desktop Renderer 64 项。新增入口测试通过 VM 执行实际 Renderer、实际 preload 和从 main 源码提取的实际 handler，再连接实际查看器服务；Electron IPC、DOM 和 BrowserWindow 仍是替身。它证明业务连接及拒绝分支，不证明真实 Electron 传输、原生键盘分发、macOS Space、像素或输入恢复。

四个修改的业务文件分别通过 `node --check`，最终 `git diff --check` 通过。未启动 Electron、未执行 GUI 自动化、未打包、未覆盖应用、未重启当前任务宿主。

## 安装覆盖核对

用 `@electron/asar.extractFile` 只读提取 `/Applications/arcorbit.app/Contents/Resources/app.asar` 中的四个对应文件，以 Node `crypto.createHash('sha256')` 与工作区逐字节比对，结果全部不同。当前包仍包含上轮诊断时的旧实现；**本轮修复尚未进入安装应用**。

| 文件（相对 runtime/arcorbit） | 安装包 SHA-256 | 当前源码 SHA-256 |
| --- | --- | --- |
| src/work-task-image-viewer.mjs | d3527450c7325cead09734a25ef4471d628ea6611c55eda0e7a11429fb96034a | 38b12f951be1432a49bb14de542ca49417d741bbbf4bfa1a1f67d7445b923e72 |
| desktop/image-viewer/renderer.js | 4cddc9ef02760bde199ad8f0cdee1321980ae1f520f04b9a733a40892fa8ab02 | d935892a194f140bc61466b6444fcfbc8ec79c4f25eb2854a9d48f70fcaab1c4 |
| desktop/image-viewer/preload.cjs | bf01aaf6b38d7c8912debdf0e956a1ff016515d540431b27df8675a0a1a90bb5 | dffa5366ce45c10beb99c175544c0e6f6850b01b53f06ece5db3df6dffb4cac7 |
| desktop/main.mjs | 389c16877cf09bdbb6a44878170b6d3917d7dd463d0646ab527d4e883a4438fd | e711576375e059675667764e045eb4cded7788e3299a3cdfe80b71e49922bbfd |

`diagnosis.md` 和 `static-probe.mjs` 保留为修复前证据：后者有意断言旧 DOM close 和旧分支缺陷，不能在修复后源码上当作通过型回归运行。本轮回归使用上面的正式测试。

## 尚未证实

原始期望不变：全屏主窗口打开图片后，Escape 只关闭查看器，主窗口内容、输入、全屏和上下文保持正常。真实画面验收仍开放，不声明持续黑屏已解决。

提交修正说明：首次提交因普通 Gap 缺少明确结果而被拒绝，未写入 canonical state。替换提交将 GAP-20260910-003-002 的结果限定为已证实缺陷的源码修复与分层证据界定，并用命令局部引用 `local:gap:installed-recovery-verification` 显式承接全部安装应用与真实恢复验收义务。相关 impact 和 realization/risk 判断继续为 threatened，关联该开放义务；不新增测试成功或实际运行成功主张。该承接只有 trusted Ledger 接受后才生效。

当前证据不能确认黑屏的全部原生因果、全屏进入中/退出中的实际事件顺序、缺失完成事件时的恢复，以及 show/focus 是否足以恢复实际呈现。代码不引入任意超时强制销毁来假装恢复。静态分析指出 BrowserWindow 的原生关闭另有转换状态处理，但没有把该结论当作原生运行验证。

后续验证必须先核对修复文件进入测试应用和实际启动身份，再记录原始操作的画面、键盘输入及父子全屏状态。不得重试此前不稳定 GUI 自动化；涉及打包、覆盖运行中宿主或需人工观察时，须明确授权/协作边界，不能将其他 Case 的门禁视作已获授权。

## 技术事实维护记录

```yaml
index_analysis:
  intent: change
  existing_domain_owner: arcorbit/platform-composition-solution.md
  decision: merge_into_existing
  reason: 图片窗口与平台 IPC 已由该文档负责，不新增平行方案或数据模型。
  original_lines: 422
  resulting_lines: 425
  split_required_for_this_change: false
document_scope:
  scope_kind: change
  root: arckit/tech/
  created: []
  updated:
    - path: arcorbit/platform-composition-solution.md
      summary: 明确受限关闭 IPC、等待与销毁恢复边界及真实画面验收要求。
    - path: INDEX.md
      summary: 同步已有技术方案行数。
  deleted: []
fact_result:
  schema_version: arckit-fact-result/v2
  mode: managed_case
  case_id: CASE-20260910-003
  gap_id: GAP-20260910-003-002
  outcome: updated
  facts:
    - statement: sandbox 查看器通过仅当前主 frame 可调用的受控关闭入口关闭；正常销毁后恢复父窗口，强制退出不恢复；测试分层保留真实画面验收。
      basis: 已接受的入口覆盖诊断与保留安全隔离、主窗口连续性的要求。
      source_refs:
        - arckit/tech/arcorbit/platform-composition-solution.md
      evidence:
        - runtime/arcorbit/src/work-task-image-viewer.mjs
        - runtime/arcorbit/test/work-task-image-viewer.test.mjs
  unresolved: []
  human_decision_required: false
```
