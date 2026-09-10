# Idea 环境探索与应用职责验证

## 已实现结果

Agent 自主选择原生命令或快捷工具，不再被场景 prompt 禁止全部 shell，不再在每次准备前强制运行固定环境检查。场景在每轮 turn/start 提交 readOnly / networkAccess=false；旧 thread 继续使用原工具与原生命令，不扩展 dynamicTools、不丢弃历史。超出沙箱的请求保留现有 Chat 审批。readOnly 不提供所选目录级硬读取隔离；任务范围由明确授权指令约束，业务写入仍只认具体确认。

local-command-runtime 为确定性通用命令能力：补齐安装目录、解析绝对程序路径、受限输出和脱敏诊断。Product 检测、正式执行与场景 Codex 复用已保存代理和相同 PATH 来源。场景环境变化时重建进程后恢复同一 thread；普通 Chat 不改变默认行为。没有自动安装、改凭据或全局 PATH。

product_environment 保留原参数，增加命令/阶段/程序路径/cwd/退出或启动错误/超时/时间/脱敏摘要；Git root/path/origin 与 GitHub user/orgs 独立保留事实。没有把 ENOENT 归为未登录。UI 在尚无方案时也提供环境检查与诊断；修复原 environment 按钮把检测结果当作 Idea 对象的错误，刷新后保留草稿。

## 检查证据

执行命令：

```
node runtime/arcorbit/scripts/check-syntax.mjs
node --test runtime/arcorbit/test/product-environment.test.mjs runtime/arcorbit/test/product-management.test.mjs runtime/arcorbit/test/product-surface.test.mjs runtime/arcorbit/test/chat-coordinator.test.mjs runtime/arcorbit/test/codex-app-server-adapter.test.mjs runtime/arcorbit/test/desktop-renderer.test.mjs runtime/arcorbit/test/package-distribution.test.mjs
```

127 项通过、0 失败。新增检查覆盖真实临时 CLI 程序路径与执行、真实进程 ENOENT/非零退出/超时、错误脱敏、Git 目录/远端部分失败、已认证账号组织查询失败、非法 API 响应、原有线程传递只读策略、场景失败后再次检测、环境变更后恢复同 thread、无方案时 DOM 诊断与草稿保留。其余 Product/Git/Chat/分发回归通过。Skill 基础结构校验通过。

本机只读探测：继承 PATH 限为 /usr/bin:/bin 后，共享运行器发现 /Users/Glare/.local/bin/gh 并执行 gh --version，返回 gh version 2.82.1 (2025-10-22)。未运行真实账号查询或创建远端资源。

## 证据边界

真实执行覆盖本地进程与 Git；模型、Workshop/GitHub 写入使用替身。原生沙箱依据本机已生成 experimental TurnStartParams.json 验证传输契约，未执行原生 Codex 沙箱/模型实机验收。原始 Mole 材料目录的失败根因仍不能由本仓库测试替代。Electron 窗口、安装包及真实外部权限本次未重新请求/执行此前被拒绝的验证。无临时日志埋点残留。

## 文档与 Skill 回传

分析结果：现有 Product 规格、产品技术方案与 Idea 添加交互源覆盖同域；相关文件均低于拆分阈值，直接并入，未改页面归属。其余索引的既有大文件不属于本事项拆分范围。

```yaml
document_scope:
  scope_kind: change
  updated:
    - path: arckit/spec/agentic-software-development/arcorbit-product-management.md
      summary: Agent 探索与应用确定性边界、证据反馈与验收规则。
    - path: arckit/tech/arcorbit/product-management-solution.md
      summary: 原生沙箱、共享执行环境、分阶段诊断与旧线程连续性。
    - path: arckit/interaction/idea-add/interaction.md
      summary: 环境诊断、重新检查、原生审批和草稿保留。
    - path: arckit/interaction/idea-add/default.html
      summary: 恢复状态投影显示真实诊断与继续探索。
fact_result:
  schema_version: arckit-fact-result/v2
  mode: managed_case
  case_id: CASE-20260910-001
  gap_id: GAP-20260910-001-002
  outcome: updated
  human_decision_required: false
post_maintenance_handoff:
  recommended_next_step: verify_with_skill_first
  reason: 工具驱动集成与结构校验通过，原生模型探索质量需要独立实机场景证据。
  formal_source_path: definition/skills/arckit-product-assets/
  working_copy_path: definition/skills/arckit-product-assets/
  maintenance_source_path: definition/skills/arckit-product-assets/
  validation_required: true
  governance_required: false
  arcforge_action_hint: none
  user_confirmation_required: true
```

仓库 AGENTS.md 与 Git 跟踪确认上述 Skill 路径为正式维护源；本轮使用方法规则加既有工具的混合承载。更新原 SKILL、reference 与 agent metadata，未创建平行诊断 skill，未 apply/share/安装治理。代表性后续原生验证场景：缺 PATH 的代码 Demo、已登录但组织请求失败、目录根可读但 origin 不可用；在临时材料与测试资源范围观察 Agent 是否主动探索、区分执行来源、保留未知并尊重确认。

## 独立审查修复

RF-20260910-001-001 已修复：Codex resolver 未就绪时只省略其可选 path entries；业务探测使用应用 cwd，并用 -C 明确材料范围，不依赖 Agent workspace。新增回归直接使用生产 createCodexExecutableResolver（未 probe，getResolved 抛错），删除临时 Agent cwd，验证 context/Git 检查及已确认的人工正式接入成功。Agent 启动仍由 Chat 原 Setup 门禁控制。修复后 126 项全部通过，语法检查通过。

RF-20260910-001-002 已修复：Git helper 只提供局部 Git 参数，共同运行器负责基础进程环境；Product 同步通过当前配置的 PATH/HTTP_PROXY/HTTPS_PROXY，保留 GIT_TERMINAL_PROMPT 与原独立 index。新增场景拦截只读 ls-remote 核验收到的实际 env，无远端请求。最终 127 项全部通过，语法检查通过。
