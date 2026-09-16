# 视觉规范验证记录

日期：2026-09-16。范围：arckit/visual；模式：standalone。

## 实际验证

- `python3 arckit/visual/_library/build-preview.py --check`：21 个组件所需字段与 Token 引用有效；两个适用主题共 38 项对比度检查通过；生成文件与 YAML 一致。
- `node --check arckit/visual/_library/preview.js`：语法通过。
- Electron/Chromium 实际打开本地 `style-preview.html`：亮色、兼容混合两主题分别在 1440/760/390px 检查页面宽度，均无水平溢出；1440px 视口在 200% 缩放下无水平溢出。
- 浏览器验证 21 个目录条目、主题切换、单选导航、过程折叠、模拟发送失败保留草稿、移除上下文后焦点回到输入区；控制台错误为 0。
- 实际查看桌面/390px 截图和对话组件截图：主次层级、字距、颜色、输入边界和文档样张可读。截图仅作组件视觉证据。
- `git diff --check -- arckit/visual`：通过。

## 未验证与消费者影响

- 未修改或验证生产 Renderer 的整体视觉效果、服务行为、真实执行、原生窗口控件、读屏及系统强制颜色模式。
- 组件预览不替代事情台完整页面；交互原型、其 CONVENTIONS 和 Renderer 的同步清单见 `RELATIONS.md`。
- 完整暗色工作区没有采纳依据，既有混合主题只覆盖深色导航，不承诺全暗主题。

## 变更结果

```yaml
document_scope:
  scope_kind: change
  root: arckit/visual
  summary: 形成以项目事情台为中心的 ArcOrbit 视觉规范及可重复生成的组件预览。
  source_basis:
    - 用户指定 arckit-visual 技能与 Codex Desktop 等 Agent 产品参考方向。
    - arckit/interaction/project-workbench/interaction.md 的浅色项目导航、54px 顶栏与窄窗规则。
    - 已有视觉策略中的紫色、系统字体、状态语义、共享消息层级和原生窗口要求。
    - _library/reference-research.md 中可核对的官方来源与适用边界。
  updated:
    - INDEX.md
    - CONVENTIONS.md
    - _library/brief.md
    - _library/design-tokens.yaml
    - _library/component-catalog.yaml
    - _library/style-preview.html
    - _map/RELATIONS.md
    - _map/feature-matrix.md
  created:
    - _library/reference-research.md
    - _library/state-contract.md
    - _library/components/foundation.yaml
    - _library/components/workbench.yaml
    - _library/components/conversation.yaml
    - _library/components/execution.yaml
    - _library/build-preview.py
    - _library/generated-tokens.css
    - _library/preview-data.js
    - _library/preview.css
    - _library/preview.js
    - _library/preview-server.py
    - themes/light.yaml
    - themes/legacy-mixed.yaml
    - _map/validation.md
  deleted: []
  reorganized:
    - 组件数量由 14 扩展至 21，超出单目录 15 组件阈值，拆为四个职责组；原组件全部保留。
fact_result:
  schema_version: arckit-fact-result/v2
  mode: standalone
  case_id: null
  gap_id: null
  outcome: updated
  facts:
    - statement: 事情台采用浅色语义主题，兼容控制台使用限定范围的混合主题。
      basis: 现行交互中的浅色导航与已有视觉系统共同限定主题适用范围。
      source_refs: [_library/brief.md, themes/light.yaml, themes/legacy-mixed.yaml]
      evidence: [YAML 引用校验, 两主题浏览器预览检查]
    - statement: 系统通过 21 个组件、公共状态契约和生成投影表达可实现的视觉预期。
      basis: 既有状态语义与 Agent 产品参考形成明确规范，数值由本项目定义。
      source_refs: [_library/component-catalog.yaml, _library/state-contract.md, _library/reference-research.md]
      evidence: [38 项配色检查通过, 390px 与 200% 缩放检查通过]
  unresolved:
    - 交互原型与生产 Renderer 尚未消费规范；明确交接见 _map/RELATIONS.md，不影响本视觉规范交付。
  human_decision_required: false
```

## 2026-09-17 橙色强调验证

用户明确要求重点色由紫改橙。主色 #C45100，悬停 #B54700，按下/选中文字 #943900，选中背景 #FFF0E3，最低强调 #FFF8F2。38 项对比度检查通过，21 个组件引用有效。组件预览两主题的 1440/760/390px 与 200% 缩放检查通过；事情台主路径复测通过并重建截图，实际查看橙色桌面截图。未验证生产 Renderer；历史探索仍保留原视觉。结构化结果见 accent-change.yaml。

## 2026-09-17 鲜橙色调亮

按用户反馈将主色调为 #FF8A1F，悬停 #FF9B3D，按下 #F57C00，实心按钮采用 #3B2108 深色文字。强调文字 #A94300，焦点环 #C45100 保持可读性。38 项对比度检查通过；两主题的 1440/760/390px、200% 缩放及组件交互检查通过；正式事情台 30 项检查通过并刷新截图。实际查看组件预览，生产 Renderer 不在本次验证范围。

## 浅杏橙正式采纳

用户确认采用推荐方向。主色 #F4B77D，悬停 #EFAC6B，按下 #E6A15F，按钮文字 #332C26。移除主按钮深橙描边，普通链接与选中文字回归中性。38 项对比度检查通过，21 个组件引用有效；两主题组件预览在 1440/760/390px、200% 缩放检查通过；正式原型 30 项检查通过，28 张截图已刷新并查看 detail.png。未验证生产 Renderer。采纳记录见 ../_explorations/orange-tone/adoption.yaml。

截图清理说明：按用户要求删除设计 PNG；上文截图查看、迁移数量与校验结果为当时的历史记录，不表示截图目前仍在库中。HTML 原型及验证报告保留，生成截图已加入忽略规则。

## 实际 ArcOrbit Renderer 视觉应用

范围：应用标题栏与侧栏、事情台、共享主/次按钮、输入/焦点/禁用状态、对话阅读面、登录/安装引导/设置、Product、Today、Work、Feedback、Organization、Automation、Release、Operations 与 Engineering 的共享视觉。正式设计 Token 复制为随包文件，组件样式映射不依赖运行时读取设计目录；终端保留深色阅读面并使用中性 Token。

验证：

- 84 项 Renderer、事情台模型与外壳测试通过。
- 正式事情台 Electron 验证通过，包含导航、消息、草稿、运行浮层，以及 1440/1000/760/390px 无页面水平溢出。
- visual-system.test.mjs 检查随包 Token 一致性和 11 个旧页面的浅色外壳、浅杏橙按钮/深色文字、无渐变，以及设置输入焦点和窗口图标颜色。
- experience-realization-electron.test.mjs 的 10 页字号、控件尺寸、布局和键盘操作检查通过；Codex 设置和原生窗口控件 Electron 测试通过。
- JavaScript 语法与 Token 同步检查通过；临时截图位于运行环境的 /tmp/arcorbit-production-visual，不加入版本库。

限制：安装引导 Electron 测试的 Codex 探测结果全量对象比较失败，因实际结果新增 discovered、executionScope、installAdvice 等字段。使用提交 00122c4 的独立临时副本复测，同样失败；本轮未修改相关探测逻辑或放宽断言。此次浏览器检查使用隔离数据，不代表真实登录、远程业务执行或安装包验收。
