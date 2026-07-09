---
name: arckit-implementation-handoff
description: 将已确认的产品、交互、视觉、技术、case 和项目状态整理成可交给编码 agent、人类开发者或外部实现 adapter 的 implementation_handoff。适用于定义事实基本明确、下一步是代码实现或实现交接，但不应直接让 coding agent 猜上下文的场景。不负责编写具体技术栈代码，不替代 arckit-code、debug、refactor 或结果事实源。
---

# ArcKit Implementation Handoff

本 skill 负责从 Arckit 事实源到实现执行之间的交接。它不写代码，不替代技术栈编码 skill；它把已确认事实、允许范围、禁止范围、验证要求和回写要求整理成可执行的实现包。

## 硬约束

- 只基于用户确认、稳定事实源、case record、project state、明确外部 handoff 或当前轮可采信证据生成交接。
- 不把候选想法、探索结论、未确认视觉偏好或未验证技术判断写成实现事实。
- 不决定技术栈细节；具体编码规则交给 `arckit-code`、项目本地规则或对应 adapter。
- 如果缺少足够事实导致 coding agent 必然要猜产品行为、交互状态、技术边界或验证口径，输出 blocked handoff，不强行推进实现。
- Handoff 必须同时写清 `in_scope`、`out_of_scope` 和 `must_preserve`。

## 主流程

### 1. 绑定实现目标

输入：用户请求、active case、project state、相关 spec/interaction/visual/tech/pending/debug/handoff。

动作：
- 明确本轮实现要改变的软件行为或工程状态。
- 判断最终产物类型：`code`、`skill`、`document`、`workflow`、`mixed`。
- 识别接收方：人类开发者、Codex 类 coding agent、多 agent 平台中的 coding role、Skill First、ArcForge、外部 adapter 或 unknown。

退出条件：实现目标和接收方清楚；否则标记为 blocked。

### 2. 收集事实依据

动作：
- 读取或引用相关事实源路径和 case/project state 摘要。
- 将输入分为 confirmed facts、assumptions、risks、open questions。
- 标记每条事实的来源和证据成熟度。
- 若实现依赖未确认产品/交互/视觉/技术事实，先输出缺口并建议回到对应 skill。

退出条件：事实依据足够支撑实现，或明确哪些缺口阻塞交接。

### 3. 划定实现边界

动作：
- 写清 `in_scope`：本轮允许改变的行为、文件区域、模块或接口。
- 写清 `out_of_scope`：本轮禁止顺手处理的功能、重构、视觉变化、平台扩展或发布动作。
- 写清 `must_preserve`：现有行为、兼容性、数据、接口、文案、视觉规则、权限或性能约束。
- 写清建议查看的代码区域，但避免把代码路径猜测写成强事实。

退出条件：接收方能知道该改什么、不该改什么、哪些行为不能破坏。

### 4. 定义验证和回写

动作：
- 给出足以覆盖实现风险的验证要求：测试、手测路径、截图、日志、类型检查、构建或无法验证时的说明。
- 写清实现后需要回查的 Arckit 结构：case、project state、spec、interaction、visual、tech、pending 或 workflow memory。
- 写清停止条件：缺事实、风险扩大、影响越界、验证失败、需要人类判断。

退出条件：实现、验证、回写和停止边界都可执行。

## 输出格式

```yaml
implementation_handoff:
  status: ready | blocked | partial
  receiver: human_developer | coding_agent | multi_agent_role | arckit-code | skill-first | arcforge | external_adapter | unknown
  goal: ""
  artifact_type: code | skill | document | workflow | mixed | unknown
  source_facts:
    - path: ""
      summary: ""
      evidence_maturity: confirmed | formalized | exploratory
  assumptions: []
  in_scope: []
  out_of_scope: []
  must_preserve: []
  suggested_code_areas: []
  implementation_constraints: []
  verification:
    required: []
    optional: []
    unable_to_verify: []
  stop_conditions: []
  arckit_writeback:
    case: ""
    project_state: ""
    fact_sources: []
    pending: []
  open_questions: []
```

## 完成标准

- Handoff 能让另一个 agent 或人类不重新猜事实源就开始实现。
- 明确哪些内容是事实、哪些是假设、哪些是禁止范围。
- 明确验证和回写要求。
- 缺事实时宁可 blocked，不生成会诱导越界实现的交接包。
