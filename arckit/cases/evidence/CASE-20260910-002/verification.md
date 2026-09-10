# Idea 正式目录与共同语义验证

源码范围：正式目录 material|selected、原生选目录授权、旧 managed 草稿迁移、安全材料复制与冲突检查、共享 UI / Agent interaction 投影、每轮 prompt、产品资产 skill 和既有规格/交互/技术源。

- 七个相关套件共 133 项通过，0 失败；原始输出见 tests.log。Node 全源码语法检查通过，skill quick_validate 通过，git diff --check 通过。
- 真实临时文件系统与 Git：选择正式目录、空白新仓库、已有 checkout、local bare clone、文件复制及来源保留、凭据与链接跳过、目标冲突不覆盖、嵌套目录/app 数据目录/origin 不匹配/未授权目标在外部创建前拒绝、非“没有 Git 仓库”的错误不触发 init、绑定失败后复用远端回执继续。
- Linkedom 执行实际 renderer + Coordinator：用户选目录后立即问“正式工作目录现在选择的合适吗？”，发送前保存选择，同轮 Agent 工具获得中文标签、已选值、完整路径及复制效果；保持晚到建议、跨 Idea 回调和保存中继续输入保护。
- 旧 managed 本地存储 fixture：改为 selected 空目标、撤销历史确认、增加修订、保留本机草稿；已正式项目保持既有目录。正式完成后材料读取及环境检查以正式目录为准，来源保留为出处。
- 证据边界：Git / 文件复制为真实本地操作；远端创建和模型被测试适配器替代。没有新建真实 GitHub / Workshop 资源，没有修改用户 ScreenRecord 目录；没有调用原生 Electron 文件夹窗口、真实模型或重新打包应用。界面投影已验证，不宣称真实模型必然给出理想答案。

## 文档维护结果

document_scope：在现有 Product 管理规格、product-management 技术方案、idea-add 交互源中合并目录与共同语义，不增加新业务领域。fact_result：正式源码由用户选择；来源、正式目录、Agent cwd 分离；UI 与 Agent 使用同义字段/效果；接入、复制、提交与共享分开反馈。相关 spec/tech INDEX 行数已更新。

## Skill 维护交接

模式：维护已有混合能力（产品资料协议 + 工具协作）。正式源和工作副本同为 definition/skills/arckit-product-assets；来源由仓库 AGENTS.md placement 与 Git 根确认，未改安装副本。
场景：询问左侧选项是否合适；从 Downloads 导入到开发目录；空白 Idea 尚未选目录；旧草稿或失败后恢复。主 SKILL 增加读取 interaction 的门禁，字段及复制语义放 reference，metadata 提示同步更新；沿用现有工具，不创建第二套流程。
post_maintenance_handoff:
  recommendation: verify_with_skill_first
  reason: 源码和结构已验证；真实模型对共同语义的使用可在后续隔离实验中观察，非本次源码交付的隐含门禁。
  maintenance_source: definition/skills/arckit-product-assets
  working_copy: definition/skills/arckit-product-assets
  verification_task: 在隔离 Idea 场景中选择正式目录后询问选项是否合适，观察能否用当前标签、路径和复制效果回答，并在未知授权时保持提案。
  allowed_writes: 隔离临时项目及本地草稿；不使用真实业务资源
  governance_required: false
  arcforge_action_hint: none
  confirmation: 本轮未执行 apply/share/push、安装或打包；后续真实外部操作依当次用户授权。

补充审查修复：目录包含判断按 node:path 的实际 separator 处理，Windows/POSIX sibling、ancestor、descendant 与不同盘符均验证；修复后 Product Management 23 项通过（含新增 1 项），其余 111 项复用本轮未受影响的通过结果，共 134 个覆盖项。未声称运行 Windows 原生文件系统。
