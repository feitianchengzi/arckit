# 探索稿迁移与 V2 采纳结果

日期：2026-09-16。依据：用户明确指定 arckit-interaction 技能，迁移 runtime/arcorbit/design 中探索稿，并将 project-workbench-v2 升为正式设计。

## 迁移与采纳

| 原目录（runtime/arcorbit/design/ 下） | 新候选目录（arckit/interaction/ 下） | 状态 |
|---|---|---|
| project-workbench-v2 | _explorations/project-workbench-v2/options/original | 已采纳；正式稿在 project-workbench/ |
| unified-work-exploration | _explorations/unified-work-exploration/options/original | 早期比较保留，未独立采纳 |
| product-continuity-concept | _explorations/product-continuity-concept/options/original | 候选，仅迁移 |
| release-workbench | _explorations/release-workbench/options/original | 候选，仅迁移 |

85 个原始文件全部保留：77 个逐字节一致，8 个仅维护迁移路径、验证工具加载、文档引用或标记原稿缺图。详情见 migration-integrity.json；迁移前 revision、哈希和 moves 映射见 migration-baseline.json。旧 design 目录不再保存设计资源。

正式稿并入已有 project-workbench 页面，没有建立第二个正式 project-workbench-v2 页面。保留候选供追溯；正式稿拥有独立脚本和存储，不运行候选文件。现行策略中的全部页面入口、明确错误恢复及已生效 visual light 主题一起整合为完整稿。

## 索引与拆分判断

正式 INDEX 小于 150 行，无需按页面组拆分。V2 已按模型、进展、详情、视图、行为与样式分离；单页状态超过 8 个，继续使用独立场景工具和两个验证脚本，保持 default.html 的完整链路。基础 styles.css 为 496 行，其余文件低于 500 行，不为目录规则拆成占位页面。继承的压缩代码未进一步压缩，正式 CSS 按规则展开以便维护。

## 实际验证

- 迁移完整性：85/85 文件存在；所有候选与正式稿 Markdown 相对链接可解析。
- 修复 10 处因迁移失效的研究文档链接。Product/Today 原稿引用的 6 张截图在迁移源中不存在，说明已标记，不生成虚假的历史证据；明细见 migration-link-fixes.json。
- 浏览器迁移检查：四个主题共 7 个入口/视图（含 unified 三方案）成功加载，脚本对象和样式可用，控制台错误与 HTTP(S) 请求均为 0。scenarios.html 的 iframe 与场景注入实际运行通过；见 migration-verification.json。
- 正式稿 verify.cjs：30 类主路径/连续性检查通过；1500/1280/1024/760/390px 布局、消息区域范围、成果/标准/约定、安排调整、身份与草稿保持均通过；更新正式截图。
- 正式稿 verify-states.cjs：9 类异常/键盘检查通过；创建重试、离线、无权限、冲突核对、输入法、11 个旧页面目标、执行恢复、Unicode 标题、空筛选及 200% 缩放通过。
- 实际查看正式桌面、消息和 390px 截图，确认浅色主题、紫色选中与主动作、正文层级和中央消息。
- JavaScript 语法与 Git 空白检查通过。

## 事实边界与剩余同步

生产代码未在此任务中修改；既有工作区中的 Renderer 修改保持原样。真实服务、Agent、上传、原生窗口、跨进程恢复和创建后首条发送的分步失败不由本地原型证明。其他探索仅检查迁移后的可加载性，不重新声称所有历史业务验证已复跑。

历史 intake/Case 的原路径保留为来源证据，利用 migration-baseline.json 的 moves 解析当前位置；不改写 Case ledger。当前 spec 的正式交互引用和 visual 消费关系已同步。旧页面仍保留各自的静态或可交互范围。

## 结构化结果

```yaml
document_scope:
  scope_kind: change
  root: arckit/interaction
  summary: 四组探索完整迁移，V2 采纳为现有 project-workbench 页面的正式可操作设计。
  source_basis:
    - 用户本轮明确迁移与 V2 采纳授权。
    - project-workbench/interaction.md 的当前策略与旧页面保留要求。
    - arckit/visual/_library/brief.md 与 themes/light.yaml。
  created:
    - _explorations/INDEX.md
    - _explorations/*/exploration.md
    - _explorations/*/options/original/
    - _explorations/migration-*.json
    - _explorations/migration-report.md
    - project-workbench/README.md
    - project-workbench/ 的本地模型、视图、样式、导航、场景、验证和截图资源
  updated:
    - INDEX.md
    - CONVENTIONS.md
    - _map/RELATIONS.md
    - _map/feature-matrix.md
    - project-workbench/default.html
    - project-workbench/interaction.md
  deleted:
    - runtime/arcorbit/design/ 的旧落点（文件迁移，内容未丢失）
  related_updates:
    - arckit/spec/agentic-software-development/arcorbit-project-workbench.md 的正式入口引用
    - arckit/visual/_map/RELATIONS.md 的消费者关系
fact_result:
  schema_version: arckit-fact-result/v2
  mode: standalone
  case_id: null
  gap_id: null
  outcome: updated
  facts:
    - statement: project-workbench 是唯一正式事情台交互入口，V2 候选保留在探索区。
      basis: 用户明确选择，并与现行正式策略和视觉规范完整整合。
      source_refs: [project-workbench/interaction.md, project-workbench/default.html, _explorations/project-workbench-v2/exploration.md]
      evidence: [migration-integrity.json, project-workbench/verification.json, project-workbench/verification-states.json]
  unresolved: []
  human_decision_required: false
exploration_result:
  root: arckit/interaction/_explorations
  baseline: migration-baseline.json
  adopted: project-workbench-v2
  formal_target: arckit/interaction/project-workbench/
  pending_selection: [product-continuity-concept, release-workbench]
  note: 其余候选本次只迁移，不等待选择，不作为正式覆盖。
```

截图清理说明：按用户要求删除设计 PNG；上文截图查看、迁移数量与校验结果为当时的历史记录，不表示截图目前仍在库中。HTML 原型及验证报告保留，生成截图已加入忽略规则。
