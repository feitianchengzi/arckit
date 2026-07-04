---
name: arckit-verify-implementation
description: 验证实现产物、文档事实、workflow 组合或评测覆盖是否符合预期。默认由 using-arckit 在实现、试跑、评测或发布前需要验收证据时路由触发；也可在用户明确点名本 skill、维护本 skill 本身或隔离测试时直接使用。输出 verification_handoff，不直接改变项目定义或治理事实。
---

# Arckit Verify Implementation

本 skill 用于实现后的验证和验收准备。它检查实现产物、文档事实、评测覆盖或 workflow 组合与预期是否一致，但不替代实现修改、规格维护或项目治理。

## 边界

- 适合：任意实现产物的验收、测试策略、回归检查、规格对照和验证报告。
- 适合：按 `artifact_type` 选择证据，例如 code 的测试/构建/运行日志，skill 的真实任务试跑/触发边界/安装状态，document 或 workflow 的事实对照和执行回放。
- 适合：验证文档事实、评测覆盖或 workflow 组合是否满足预期。
- 适合：把验证结果交给 `arckit-project-governance-workflow` 作为 Review evidence。
- 不适合：直接修复实现产物。若用户要求修复，按对应实现 workflow、debug skill、Skill First、skill creator 或 ArcForge 类 adapter 执行。
- 不适合：直接更改 spec、interaction、visual 或 tech 事实。发现偏差时交给对应结果 skill。

## 工作流

1. 明确验证对象：实现产物、功能、页面、接口、agent skill 行为、document、workflow 组合、评测覆盖、发布候选或回归范围。
2. 明确 `artifact_type: code|skill|document|workflow|mixed|unknown`，并据此选择证据类型。
3. 找到依据：用户要求、测试、spec、interaction、visual、tech、evaluation、issue、commit 或 `implementation_handoff`。
4. 设计最小可信验证集，优先覆盖高风险路径和用户可见行为。
5. 执行可运行检查；无法执行时说明阻塞原因和替代证据。
6. 输出结论、证据、残余风险和下游 handoff。

## 证据查找顺序

优先读取用户当前验收口径；其次读取治理层 Task/Review/Decision；再读取 `arckit/spec`、`arckit/interaction`、`arckit/visual`、`arckit/tech` 中的稳定事实；如验证真实场景、agent skill 行为或 workflow 组合，再读取 `arckit/evaluation` 和目标产物文件；最后按 `artifact_type` 读取代码 diff、测试输出、构建日志、运行日志、skill 试跑记录、安装状态、治理 diff、文档事实对照或回放记录。依据不足时输出 `blocked` 或 `pass_with_risk`，不要伪造验证结论。

## 输出格式

```yaml
verification_handoff:
  target: ""
  artifact_type: code|skill|document|workflow|mixed|evaluation|unknown
  basis: []
  checks_run: []
  checks_not_run:
    - check: ""
      reason: ""
  findings: []
  result: pass|pass_with_risk|fail|blocked
  residual_risks: []
  downstream_candidates:
    - arckit-project-governance-workflow
    - arckit-spec
    - arckit-tech
    - arckit-evaluation
```

## 参考和脚本

`references/` 保留原始 verify 参考资料。`scripts/generate_verify_report.py` 可用于报告草案生成；迁移时未纳入原始 gate、e2e 和 security scan 脚本，避免把项目特定执行假设变成通用强流程。
